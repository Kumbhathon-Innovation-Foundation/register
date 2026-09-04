# Runbook

## Tower registration links

One per tower — put in the participant guidelines:

| Tower | Link |
|--|--|
| 1 - Crowd Control | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t1.yml |
| 2 - Hardware / IoT | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t2.yml |
| 3 - Information Analysis | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t3.yml |
| 4 - Pilgrim Experience | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t4.yml |

The link locks the tower — a team can't pick the wrong one.

## Participant flow

**Team captain** (one person per team):

1. Open the tower link. Not logged in to GitHub? Log in / sign up, then reopen the link.
2. The page is a pre-filled **New issue** form.
3. Fill in: **Team name**, **Project title**, **GitHub usernames of ALL members** (one per line,
   include yourself), tick the acknowledgement box.
4. Click **Create**.
5. Within ~30 sec the bot comments:
   - **"Not ready yet"** + list -> click the pencil, edit the issue, fix, save. Bot re-checks.
   - **"Ready for approval"** -> wait for an organiser.
6. Organiser approves. Bot comments **"Registered"** with the private repo link and closes the issue.
7. **Every listed member** gets an email + GitHub notification "invited to collaborate" ->
   each opens it and clicks **Accept invitation**.
8. Clone the repo, open `SUBMISSION.md`, build, push to `main` before the deadline.

Non-captain members only do step 7.

## Organiser flow (per registration)

1. A new issue appears in this repo. Watch -> Issues to get notified.
2. Open it, read the bot's check comment.
3. **"Not ready yet"** -> leave it; the team edits and the bot re-checks.
4. **"Ready for approval"** -> sanity-check: real team, tower correct, usernames plausible,
   not a duplicate.
5. Approve: right sidebar -> **Labels** -> click **`approved`**.
6. Bot creates `t<N>-<team>`, seeds it, invites members as admin, closes the issue (~30 sec).
7. Bot posts an **error** instead ("repo already exists", "could not invite X", ...) -> fix per
   the message, then **remove** the `approved` label and **add it again** to retry.

You never create a team repo by hand.

## Adding other organisers / admins

### Registration approver (default — least privilege)

Can approve registrations, nothing else.

Web: Org -> **Teams** -> New team `organisers` (once) -> its **Repositories** tab -> add
`register` with **Write** (once) -> its **Members** tab -> add the person. They accept the org
invite email.

CLI:
```
gh api -X POST orgs/Kumbhathon-Innovation-Foundation/teams -f name=organisers -f privacy=closed
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/teams/organisers/repos/Kumbhathon-Innovation-Foundation/register -f permission=push
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/teams/organisers/memberships/USERNAME -f role=member
```

### Org owner (only fully-trusted co-leads)

Full control — settings, delete repos, billing.

Web: Org -> **People** -> Invite member -> after they join, change their role to **Owner**.

CLI:
```
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/memberships/USERNAME -f role=admin
```

## Housekeeping

- **Browse all submissions:** org Repositories, filter by topic `tower-1` ... `tower-4`.
- **Deadline:** judging uses whatever is on each repo's `main` at the deadline.
- Duplicate team name in the same tower -> bot refuses, tells the team to rename.
