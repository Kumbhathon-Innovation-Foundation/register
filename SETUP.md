# Setup

One-time, by an organisation owner of `Kumbhathon-Innovation-Foundation`.

## 1. Create the token

The bot needs a token that can create repos and manage collaborators in the org.

**Classic PAT (simplest)** — <https://github.com/settings/tokens> → *Generate new token (classic)*
→ scope: **`repo`** → generate → copy.

**Fine-grained PAT (tighter)** — Resource owner: the org · Repository access: *All repositories* ·
Repository permissions: **Administration** R/W, **Contents** R/W, **Issues** R/W, **Metadata** R.
If repo creation fails, the org must allow fine-grained tokens
(Org → Settings → Personal access tokens).

## 2. Store it as a secret

```
gh secret set ORG_ADMIN_TOKEN --repo Kumbhathon-Innovation-Foundation/register
```

Paste the token at the prompt. (Never commit it.)

## 3. Create the labels

```
gh label create approved   -R Kumbhathon-Innovation-Foundation/register -c 2ea44f -d "Organiser approved - bot creates the repo"
gh label create registered -R Kumbhathon-Innovation-Foundation/register -c 0e8a16 -d "Repo created"
gh label create ready      -R Kumbhathon-Innovation-Foundation/register -c fbca04 -d "Passed checks, awaiting approval"
gh label create needs-fix  -R Kumbhathon-Innovation-Foundation/register -c d93f0b -d "Registration has a problem"
```

## 4. Let organisers approve

Organisers need **write** (or triage) on this repo to add the `approved` label:

```
gh api -X PUT "orgs/Kumbhathon-Innovation-Foundation/teams/ORGANISER_TEAM/repos/Kumbhathon-Innovation-Foundation/register" -f permission=push
```

## 5. Go live

```
gh repo edit Kumbhathon-Innovation-Foundation/register --visibility public --accept-visibility-change-consequences
```

Participants are not org members, so the repo must be **public** for them to file an issue.

## 6. Recommended, not required

Org → Settings → Member privileges → **Base permissions → None**.
Teams are outside collaborators on only their repo, so isolation already holds; this just
removes any chance of a repo becoming visible org-wide.

## QR code

Point it at:

```
https://github.com/Kumbhathon-Innovation-Foundation/register/issues/new?template=register.yml
```

## How it runs

| Trigger | Token | Action |
|--|--|--|
| Issue opened / edited | `GITHUB_TOKEN` | Validate fields + usernames, post a check comment, label `ready` or `needs-fix` |
| `approved` label added | `ORG_ADMIN_TOKEN` | Create private `t<N>-<team>`, seed files, tag topic, add members as admin, close issue |

Only users with write/triage can add labels, so participants cannot trigger the privileged job.
