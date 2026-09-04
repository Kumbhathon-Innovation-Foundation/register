// node .github/scripts/register.test.js  -- no framework, exits non-zero on failure
const assert = require('assert')
const { parseIssue, teamSlug, repoName } = require('./register.js')

const body = `### Team name

Nashik Navigators

### Tower

2 - Hardware / IoT

### Project title

Real-time ghat density map

### GitHub usernames of ALL team members

octocat
@torvalds
- gvanrossum, defunkt

### Acknowledgement

- [X] These usernames are correct and belong to my teammates`

const p = parseIssue(body)
assert.strictEqual(p.team, 'Nashik Navigators')
assert.strictEqual(p.tower, '2')
assert.strictEqual(p.project, 'Real-time ghat density map')
assert.deepStrictEqual(p.members, ['octocat', 'torvalds', 'gvanrossum', 'defunkt'])

// dedupe + @ + bullets + commas
assert.deepStrictEqual(
  parseIssue('### GitHub usernames of ALL team members\n\n@a\na\n* b\n').members,
  ['a', 'b'])

// missing / no-response fields
const empty = parseIssue('### Team name\n\n_No response_\n\n### Tower\n\n_No response_')
assert.strictEqual(empty.team, '')
assert.strictEqual(empty.tower, '')
assert.deepStrictEqual(empty.members, [])

// invalid usernames dropped (underscore, leading dash, too long)
assert.deepStrictEqual(
  parseIssue('### GitHub usernames of ALL team members\n\nbad_name\n-nope\n' + 'x'.repeat(40) + '\ngood').members,
  ['good'])

// slug + repo name
assert.strictEqual(teamSlug('Nashik  Navigators!!'), 'nashik-navigators')
assert.strictEqual(teamSlug('  --Team.42-- '), 'team-42')
assert.strictEqual(repoName({ number: 7, body }), 't2-nashik-navigators')
assert.strictEqual(repoName({ number: 7, body: '### Team name\n\n@@@\n\n### Tower\n\n3 - x' }), 't3-team-7')

console.log('ok')
