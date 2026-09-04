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
5. Within ~30 sec the bot either:
   - comments **"### Registered"** with the private repo link and closes the issue — done; or
   - comments **"Not registered yet"** + reason -> click the pencil, fix the issue, save. The bot
     retries automatically on every save.
6. **Every listed member** gets an email + GitHub notification "invited to collaborate" ->
   each opens it and clicks **Accept invitation**.
7. Clone the repo, open `SUBMISSION.md`, build, push to `main` before the deadline.

Non-captain members only do step 6.

## Organiser flow

There is **no approval step** — a valid submission creates the repo automatically. You only:

1. Watch -> Issues to keep an eye on submissions.
2. Ignore issues that self-resolve (bot closes them with a repo link).
3. Help teams stuck on a **"Not registered yet"** comment (usual cause: a mistyped username).
4. Close / delete any spam or duplicate junk issues (needs Write on the repo).
5. If the bot reports **"Could not invite X"**, add that person to the team repo by hand:
   repo -> Settings -> Collaborators -> Add -> role **Admin**.

You never create a team repo by hand.

## Adding other organisers / admins

### Helper (default — least privilege)

Can watch submissions, close junk issues, add collaborators to team repos. Cannot change org settings.

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
- **Turn approval back on** (if spam appears): in `.github/workflows/register.yml` add
  `if: github.event.action == 'labeled' && github.event.label.name == 'approved'` to the
  `register` job and switch `on.issues.types` to `[labeled]`; recreate the `approved` label.
