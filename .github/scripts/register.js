// Kumbhathon SPRINT registration bot.
// Runs inside actions/github-script, on issue opened/edited, with ORG_ADMIN_TOKEN.
// No approval gate: a valid submission immediately gets a private team repo, seeded,
// with every listed member added as admin (outside collaborators -> each team sees only
// its own repo). Invalid submissions get a `needs-fix` comment and are retried on edit.
//
// ponytail: gate removed on request. Anyone can open an issue -> anyone can trigger a repo
// create. If spam appears, re-add an `if` on an `approved` label (see git history) or delete
// junk issues/repos manually.

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
  const project = field(body, 'Project title')
  const members = [...new Set(
    field(body, 'GitHub usernames of ALL team members')
      .split(/[\n,]+/)
      .map(s => s.trim().replace(/^[-*]\s+/, '').replace(/^@/, ''))
      .filter(s => USER_RE.test(s))
  )]
  return { team, project, members }
}

// Tower comes from the per-tower issue template's label (tower-1..tower-4).
// Falls back to a "Tower" body field if a generic template is ever used.
function towerOf(issue) {
  for (const l of issue.labels || []) {
    const m = /^tower-([1-4])$/.exec(typeof l === 'string' ? l : l.name || '')
    if (m) return m[1]
  }
  return (field(issue.body || '', 'Tower').match(/[1-4]/) || [])[0] || ''
}

const teamSlug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

function repoName(issue) {
  const { team } = parseIssue(issue.body || '')
  const slug = teamSlug(team) || `team-${issue.number}`
  return `t${towerOf(issue)}-${slug}`
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
async function setLabels(github, context, add = [], remove = []) {
  for (const name of add) {
    await github.rest.issues.addLabels({
      owner: context.repo.owner, repo: context.repo.repo,
      issue_number: context.payload.issue.number, labels: [name],
    }).catch(() => {})
  }
  for (const name of remove) {
    await github.rest.issues.removeLabel({
      owner: context.repo.owner, repo: context.repo.repo,
      issue_number: context.payload.issue.number, name,
    }).catch(() => {})
  }
}

async function reject(github, context, msg) {
  await comment(github, context, `**Not registered yet.** ${msg}\n\nEdit the issue above to fix it — the bot retries automatically when you save.`)
  await setLabels(github, context, ['needs-fix'])
}

async function register({ github, context }) {
  const issue = context.payload.issue
  if ((issue.labels || []).some(l => (l.name || l) === 'registered')) return // already done

  const { team, project, members } = parseIssue(issue.body || '')
  const tower = towerOf(issue)
  const t = TOWERS[tower]

  const problems = []
  if (!t) problems.push('tower label missing — open a tower link, not a blank issue.')
  if (!team) problems.push('team name is empty.')
  if (!project) problems.push('project title is empty.')
  if (!members.length) problems.push('list at least one valid GitHub username.')
  if (members.length > MAX_MEMBERS) problems.push(`too many members (max ${MAX_MEMBERS}).`)
  if (problems.length) return reject(github, context, problems.join(' '))

  const bad = await badUsers(github, members)
  if (bad.length) return reject(github, context, `GitHub users not found: ${bad.map(u => '`' + u + '`').join(', ')}.`)

  const repo = repoName(issue)
  try {
    await github.rest.repos.get({ owner: ORG, repo })
    return reject(github, context, `repo \`${ORG}/${repo}\` already exists — rename the team.`)
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
  await setLabels(github, context, ['registered'], ['needs-fix'])
  await github.rest.issues.update({ owner: context.repo.owner, repo: context.repo.repo, issue_number: issue.number, state: 'closed' })
}

module.exports = register
module.exports.register = register
module.exports.parseIssue = parseIssue
module.exports.towerOf = towerOf
module.exports.teamSlug = teamSlug
module.exports.repoName = repoName
