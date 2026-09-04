# Register

Registration desk for **Kumbhathon SPRINT**.

## Teams: register here

Open your tower's link (also in the participant guidelines):

| Tower | Register |
|--|--|
| 1 - Crowd Control | [t1.yml](../../issues/new?template=t1.yml) |
| 2 - Hardware / IoT | [t2.yml](../../issues/new?template=t2.yml) |
| 3 - Information Analysis | [t3.yml](../../issues/new?template=t3.yml) |
| 4 - Pilgrim Experience | [t4.yml](../../issues/new?template=t4.yml) |

Then:

1. Fill in team name, project title, and every member's GitHub username (one per line).
2. Submit. A bot checks it and, if valid, immediately creates your repo.
3. You get a comment linking your **private team repo**, and every member gets a repo invite to accept.
   If the bot says **"Not registered yet"**, edit the issue to fix the reason — it retries on save.

One submission per team.

## Organisers

- **No approval step.** A valid submission auto-creates `t<N>-<team>` (private) in this org,
  seeded with `README.md` + `SUBMISSION.md`, tagged `tower-<N>`, every listed member added as
  repo **admin**, and the issue closed.
- Teams are added as *outside collaborators* — each team sees only its own repo.
- Full walkthrough: [`RUNBOOK.md`](RUNBOOK.md). Setup + token: [`SETUP.md`](SETUP.md).
- Bot logic: [`.github/scripts/register.js`](.github/scripts/register.js) (self-check: `node .github/scripts/register.test.js`).
- Edit [`team-template/`](team-template/) to change what lands in each new team repo.
