# Setup

One-time, by an organisation owner of `Kumbhathon-Innovation-Foundation`.
Status: 1, 2, 3, 5, 6 done. Step 4 (extra organisers) is optional.

There is **no approval gate** — a valid submission auto-creates the team repo.

## 1. Bot token  ✅ done

Classic PAT with scope **`repo`** (a fine-grained or under-scoped token gives
`403 You need admin access to the organization before adding a repository`). If the org
enforces SAML SSO, authorise the token for the org.

## 2. Store it as a secret  ✅ done

```
gh secret set ORG_ADMIN_TOKEN --repo Kumbhathon-Innovation-Foundation/register
```

## 3. Labels  ✅ done

```
gh label create registration -R Kumbhathon-Innovation-Foundation/register -c ededed -d "A team registration request"
gh label create registered -R Kumbhathon-Innovation-Foundation/register -c 0e8a16 -d "Repo created"
gh label create needs-fix  -R Kumbhathon-Innovation-Foundation/register -c d93f0b -d "Registration has a problem"
gh label create tower-1 -R Kumbhathon-Innovation-Foundation/register -c 1d76db -d "Tower 1 - Crowd Control"
gh label create tower-2 -R Kumbhathon-Innovation-Foundation/register -c 1d76db -d "Tower 2 - Hardware / IoT"
gh label create tower-3 -R Kumbhathon-Innovation-Foundation/register -c 1d76db -d "Tower 3 - Information Analysis"
gh label create tower-4 -R Kumbhathon-Innovation-Foundation/register -c 1d76db -d "Tower 4 - Pilgrim Experience"
```

The `tower-N` labels must exist or the issue templates cannot self-apply them, and the bot
reads the tower from that label.

## 4. Extra organisers (optional)

Nobody needs to approve anything. Add helpers only so they can watch submissions, close junk
issues, and add collaborators to team repos — give them **write** on this repo:

```
gh api -X POST orgs/Kumbhathon-Innovation-Foundation/teams -f name=organisers -f privacy=closed
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/teams/organisers/repos/Kumbhathon-Innovation-Foundation/register -f permission=push
gh api -X PUT orgs/Kumbhathon-Innovation-Foundation/teams/organisers/memberships/USERNAME -f role=member
```

## 5. Public  ✅ done

Participants are not org members, so the repo must be **public** for them to file an issue.

```
gh repo edit Kumbhathon-Innovation-Foundation/register --visibility public --accept-visibility-change-consequences
```

## 6. Base permissions  ✅ done

Org → Settings → Member privileges → **Base permissions → None**.

## Tower registration links

Put these in the participant guidelines (one per tower):

| Tower | Link |
|--|--|
| 1 - Crowd Control | `https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t1.yml` |
| 2 - Hardware / IoT | `https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t2.yml` |
| 3 - Information Analysis | `https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t3.yml` |
| 4 - Pilgrim Experience | `https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=t4.yml` |

## How it runs

On **issue opened / edited**, one job runs with `ORG_ADMIN_TOKEN`:
- Invalid (missing field, bad username, dup repo) -> comments the reason, labels `needs-fix`, stops.
  Retries automatically when the team edits the issue.
- Valid -> creates private `t<N>-<team>`, seeds `README.md` + `SUBMISSION.md`, tags topic
  `tower-N`, adds every member as repo admin, labels `registered`, closes the issue.

Tower is taken from the `tower-N` label the per-tower template applies.

**No approval gate** — anyone who can open an issue triggers a repo create. To re-add a gate if
spam appears, see "Turn an approval gate back on" in [`README.md`](README.md).
