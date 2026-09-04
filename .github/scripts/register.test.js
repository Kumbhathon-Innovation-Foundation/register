// node .github/scripts/register.test.js  -- no framework, exits non-zero on failure
const assert = require('assert')
const { parseIssue, towerOf, teamSlug, repoName, register } = require('./register.js')
assert.strictEqual(typeof register, 'function')

const body = `### Team name

Nashik Navigators

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
assert.strictEqual(p.project, 'Real-time ghat density map')
assert.deepStrictEqual(p.members, ['octocat', 'torvalds', 'gvanrossum', 'defunkt'])

// dedupe + @ + bullets + commas
assert.deepStrictEqual(
  parseIssue('### GitHub usernames of ALL team members\n\n@a\na\n* b\n').members,
  ['a', 'b'])

// no-response / missing fields
const empty = parseIssue('### Team name\n\n_No response_')
assert.strictEqual(empty.team, '')
assert.deepStrictEqual(empty.members, [])

// invalid usernames dropped (underscore, leading dash, too long)
assert.deepStrictEqual(
  parseIssue('### GitHub usernames of ALL team members\n\nbad_name\n-nope\n' + 'x'.repeat(40) + '\ngood').members,
  ['good'])

// tower from label (webhook objects and plain strings)
assert.strictEqual(towerOf({ labels: [{ name: 'registration' }, { name: 'tower-3' }] }), '3')
assert.strictEqual(towerOf({ labels: ['tower-1'] }), '1')
assert.strictEqual(towerOf({ labels: [] }), '')
// fallback to body "Tower" field if no label
assert.strictEqual(towerOf({ labels: [], body: '### Tower\n\n2 - Hardware / IoT' }), '2')

// slug + repo name
assert.strictEqual(teamSlug('Nashik  Navigators!!'), 'nashik-navigators')
assert.strictEqual(teamSlug('  --Team.42-- '), 'team-42')
assert.strictEqual(repoName({ number: 7, body, labels: ['tower-2'] }), 't2-nashik-navigators')
assert.strictEqual(repoName({ number: 7, body: '### Team name\n\n@@@', labels: ['tower-4'] }), 't4-team-7')

console.log('ok')
