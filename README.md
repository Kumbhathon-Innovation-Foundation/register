# Register

Registration desk for the **Kumbhathon SPRINT**. Open your tower's link, submit the form, and a
bot creates a private repo for your team with every member added as admin. No approval step.

## Tower links

| Tower | Register |
|--|--|
| 1 - Crowd Control | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t1.yml |
| 2 - Hardware / IoT | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t2.yml |
| 3 - Information Analysis | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t3.yml |
| 4 - Pilgrim Experience | https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t4.yml |

The link locks the tower — a team can't pick the wrong one.

---

## Participant flow

**Team captain** — one person per team:

1. Open your tower's link above. Not logged in to GitHub? Log in / sign up, then reopen the link.
2. The page is a pre-filled **New issue** form. Fill in:
   - **Team name**
   - **Project title**
   - **GitHub usernames of ALL members** — one per line, include yourself
   - tick the acknowledgement box
3. Click **Create**.
4. About 30 seconds later the bot comments, one of:
   - **"### Registered"** with your private repo link, and the issue closes — done.
   - **"Not registered yet"** with a reason (usually a mistyped username) — click the pencil,
     fix the issue body, save. The bot retries automatically on every save.
5. **Every listed member** gets an email + GitHub notification "invited to collaborate" —
   each opens it and clicks **Accept invitation**.
6. Clone the repo, open `SUBMISSION.md`, build, and push to `main` before the deadline.

Non-captain members do **only step 5**.

---

## Organiser flow

**There is no approval step** — a valid submission creates the repo automatically. Organisers only:

1. **Watch** this repo — set Watch to **Issues** to get notified of new submissions.
2. **Ignore** issues that self-close (bot posts "### Registered" + a link).
3. **Help** anyone stuck on a **"Not registered yet"** comment — they fix the issue body and
   save; the bot re-runs. No action needed from you.
4. **Delete junk** — spam or duplicate issues: open the issue -> Delete issue (bottom of the
   right sidebar). Needs Write on this repo.
5. **Fix a failed invite** — if the bot says *"Could not invite X"*: go to that team repo ->
   Settings -> Collaborators -> Add people -> X -> role **Admin**.
6. **Deadline** — judging uses whatever is on each team repo's `main` at the deadline.

Browse all submissions: org -> Repositories, filter by topic `tower-1` ... `tower-4`.

### Adding other organisers

Helpers only need to watch issues, close junk, and add collaborators — give them **Write** on
this repo, nothing more:

```
gh api -X POST orgs/Kumbhathon-Innovation-Foundation/teams -f name=organisers -f privacy=closed
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/teams/organisers/repos/Kumbhathon-Innovation-Foundation/register -f permission=push
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/teams/organisers/memberships/USERNAME -f role=member
```

For a full co-lead (org settings, delete repos): org -> People -> Invite member -> then change
their role to **Owner**.

### Turn an approval gate back on (if spam appears)

In `.github/workflows/register.yml`: set `on.issues.types` to `[labeled]` and add to the
`register` job:

```yaml
    if: github.event.action == 'labeled' && github.event.label.name == 'approved'
```

Then recreate the `approved` label. Organisers approve by adding that label to an issue.

---

## How it works

On **issue opened / edited**, one job (`.github/workflows/register.yml`) runs with the
`ORG_ADMIN_TOKEN` secret and calls `register()` in `.github/scripts/register.js`:

- Reads the tower from the `tower-N` label the template applies; reads team / project / members
  from the issue body.
- **Invalid** (missing field, unknown username, name collides with an existing repo) -> comments
  the reason, adds `needs-fix`, stops. Retried on the next edit.
- **Valid** -> creates private `t<N>-<team-slug>`, seeds `README.md` + `SUBMISSION.md` from
  [`team-template/`](team-template/), sets topics `kumbhathon-sprint` + `tower-N`, adds every
  member as repo **admin** (outside collaborators — each team sees only its own repo), adds
  `registered`, closes the issue.

Self-check: `node .github/scripts/register.test.js`.
First-time setup and the token: [`SETUP.md`](SETUP.md).
Edit [`team-template/`](team-template/) to change what lands in each new team repo.
