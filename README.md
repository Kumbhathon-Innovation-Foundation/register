# Register

Registration desk for **Kumbhathon SPRINT**.

## Teams: register here

1. [**Open the registration form**](../../issues/new?template=register.yml) — or scan the event QR.
2. Fill in team name, tower, project title, and every member's GitHub username.
3. Submit. A bot checks it; an organiser approves.
4. You get a comment linking your **private team repo**, and every member gets a repo invite to accept.

One submission per team.

## Organisers

- **Approve** a registration: add the **`approved`** label to its issue. The bot then creates
  `t<N>-<team>` (private) in this org, seeds it with `README.md` + `SUBMISSION.md`, tags it
  `tower-<N>`, and adds every listed member as repo **admin**.
- Teams are added as *outside collaborators* — each team sees only its own repo.
- Everything the bot does: [`.github/scripts/register.js`](.github/scripts/register.js).
- First-time setup and the token: [`SETUP.md`](SETUP.md).
- Edit [`team-template/`](team-template/) to change what lands in each new team repo.
