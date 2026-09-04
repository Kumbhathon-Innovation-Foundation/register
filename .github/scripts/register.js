// Kumbhathon SPRINT registration bot.
// Runs inside actions/github-script. Two entrypoints:
//   validate() - default GITHUB_TOKEN, comments a check result on new/edited issues
//   register() - ORG_ADMIN_TOKEN, fires when an organiser adds the `approved` label:
//                creates a private team repo, seeds it, adds every member as admin.
// Teams are added as repo collaborators (outside collaborators) so each team can see
// ONLY its own repo. No org membership, no base-permission change required.

const fs = require('fs')
const path = require('path')

const ORG = 'Kumbhathon-Innovation-Foundation'
const MAX_MEMBERS = 6
const TOWERS = {
  '1': { topic: 'tower-1', name: 'Crowd Control' },
  '2': { topic: 'tower-2', name: 'Hardware / IoT' },
  '3': { topic: 'tower-3', name: 'Information Analysis' },
  '4': { topic: 'tower-4', name: 'Pilgrim Experience' },
}
const ROOT = process.env.GITHUB_WORKSPACE || '.'
const USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

const clean = s => String(s || '').replace(/[`|<>\r\n]/g, ' ').trim()

function field(body, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = String(body || '').match(new RegExp('###[ \\t]*' + esc + '[ \\t]*\\n+([\\s\\S]*?)(?=\\n###[ \\t]|$)'))
  if (!m) return ''
  const v = m[1].trim()
  return v === '_No response_' ? '' : v
}

function parseIssue(body) {
  const team = field(body, 'Team name')
  const tower = (field(body, 'Tower').match(/[1-4]/) || [])[0] || ''
  const project = field(body, 'Project title')
  const members = [...new Set(
    field(body, 'GitHub usernames of ALL team members')
      .split(/[\n,]+/)
      .map(s => s.trim().replace(/^[-*]\s+/, '').replace(/^@/, ''))
      .filter(s => USER_RE.test(s))
  )]
  return { team, tower, project, members }
}

const teamSlug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

function repoName(issue) {
  const { team, tower } = parseIssue(issue.body || '')
  const slug = teamSlug(team) || `team-${issue.number}`
  return `t${tower}-${slug}`
}

async function badUsers(github, members) {
  const bad = []
  for (const u of members) {
    try { await github.rest.users.getByUsername({ username: u }) }
    catch (e) { if (e.status === 404) bad.push(u); else throw e }
  }
  return bad
}

const render = (tmpl, vars) => tmpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ''))

async function comment(github, context, body) {
  await github.rest.issues.createComment({
    owner: context.repo.owner, repo: context.repo.repo,
    issue_number: context.payload.issue.number, body,
  })
}
async function addLabel(github, context, name) {
  await github.rest.issues.addLabels({
    owner: context.repo.owner, repo: context.repo.repo,
    issue_number: context.payload.issue.number, labels: [name],
  }).catch(() => {})
}

async function validate({ github, context }) {
  const issue = context.payload.issue
  if ((issue.labels || []).some(l => l.name === 'registered')) return

  const { team, tower, project, members } = parseIssue(issue.body || '')
  const problems = []
  if (!team) problems.push('Team name is empty.')
  if (!tower) problems.push('Tower is not set to 1-4.')
  if (!project) problems.push('Project title is empty.')
  if (members.length < 1) problems.push('List at least one valid GitHub username.')
  if (members.length > MAX_MEMBERS) problems.push(`Too many members listed (max ${MAX_MEMBERS}).`)
  const bad = members.length && members.length <= MAX_MEMBERS ? await badUsers(github, members) : []
  if (bad.length) problems.push(`GitHub users not found: ${bad.map(u => '`' + u + '`').join(', ')}`)

  if (problems.length) {
    await comment(github, context, `**Not ready yet.** Edit the issue to fix:\n\n${problems.map(p => '- ' + p).join('\n')}`)
    await addLabel(github, context, 'needs-fix')
    return
  }
  await comment(github, context,
    `**Ready for approval.**\n\n` +
    `| field | value |\n|--|--|\n` +
    `| Team | ${clean(team)} |\n` +
    `| Tower | ${tower} - ${TOWERS[tower].name} |\n` +
    `| Project | ${clean(project)} |\n` +
    `| Members | ${members.map(m => '@' + m).join(', ')} |\n` +
    `| Repo | \`${ORG}/${repoName(issue)}\` |\n\n` +
    `Organiser: add the **\`approved\`** label to create the repo.`)
  await addLabel(github, context, 'ready')
}

async function register({ github, context }) {
  const issue = context.payload.issue
  if ((issue.labels || []).some(l => l.name === 'registered')) {
    await comment(github, context, 'Already registered - skipping.')
    return
  }
  const { team, tower, project, members } = parseIssue(issue.body || '')
  const t = TOWERS[tower]
  if (!t || !team || !members.length) {
    await comment(github, context, 'Cannot register: team, tower, or members missing/invalid. Fix the issue, then remove and re-add the `approved` label.')
    await addLabel(github, context, 'needs-fix')
    return
  }
  const bad = await badUsers(github, members)
  if (bad.length) {
    await comment(github, context, `Cannot register: GitHub users not found: ${bad.map(u => '`' + u + '`').join(', ')}. Fix and re-approve.`)
    await addLabel(github, context, 'needs-fix')
    return
  }

  const repo = repoName(issue)
  try {
    await github.rest.repos.get({ owner: ORG, repo })
    await comment(github, context, `Repo \`${ORG}/${repo}\` already exists. Rename the team or remove the old repo, then re-approve.`)
    await addLabel(github, context, 'needs-fix')
    return
  } catch (e) { if (e.status !== 404) throw e }

  await github.rest.repos.createInOrg({
    org: ORG, name: repo, private: true, has_wiki: false, has_projects: false,
    description: `${clean(project)} - Tower ${tower} ${t.name} - Kumbhathon SPRINT`,
  })
  await github.rest.repos.replaceAllTopics({ owner: ORG, repo, names: ['kumbhathon-sprint', t.topic] })

  const vars = {
    TEAM: clean(team), TOWER: `${tower} - ${t.name}`, PROJECT: clean(project),
    MEMBERS: members.map(m => '- @' + m).join('\n'), REPO: `${ORG}/${repo}`,
  }
  const readme = render(fs.readFileSync(path.join(ROOT, 'team-template/README.tmpl.md'), 'utf8'), vars)
  const submission = fs.readFileSync(path.join(ROOT, 'team-template/SUBMISSION.md'), 'utf8')
  for (const [p, content] of [['README.md', readme], ['SUBMISSION.md', submission]]) {
    await github.rest.repos.createOrUpdateFileContents({
      owner: ORG, repo, path: p, message: `Add ${p}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
    })
  }

  const ok = [], failed = []
  for (const u of members) {
    try {
      await github.rest.repos.addCollaborator({ owner: ORG, repo, username: u, permission: 'admin' })
      ok.push(u)
    } catch (e) { failed.push(`${u} (HTTP ${e.status})`) }
  }

  await comment(github, context,
    `### Registered\n\n` +
    `Private repo: **https://github.com/${ORG}/${repo}**\n\n` +
    (ok.length ? `Invited as admin: ${ok.map(u => '@' + u).join(', ')}\n_Check your GitHub notifications and accept the repo invite._\n\n` : '') +
    (failed.length ? `:warning: Could not invite: ${failed.join(', ')} - an organiser will add these by hand.\n\n` : '') +
    `Next: open \`SUBMISSION.md\` in the repo and follow it.`)
  await github.rest.issues.addLabels({ owner: context.repo.owner, repo: context.repo.repo, issue_number: issue.number, labels: ['registered'] })
  await github.rest.issues.update({ owner: context.repo.owner, repo: context.repo.repo, issue_number: issue.number, state: 'closed' })
}

module.exports = register
module.exports.validate = validate
module.exports.register = register
module.exports.parseIssue = parseIssue
module.exports.teamSlug = teamSlug
module.exports.repoName = repoName
