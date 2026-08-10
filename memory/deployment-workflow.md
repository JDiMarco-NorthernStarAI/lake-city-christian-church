---
name: LC3 Deployment Workflow
description: How to deploy LC3 - push to main triggers GitHub Actions to build and deploy to ECS
type: reference
---

## Deployment

Push to `main` → GitHub Actions builds Docker image → pushes to ECR → deploys to ECS (~5-6 min).

**Important:** LC3 runs on ECS cluster `upstream-therapeutics` (not `lc3-cluster`), service name `lc3-service`.

Workflow file: `.github/workflows/deploy.yml`

## Editing Code

Code can be edited from:
- **Replit** — existing Repl connected to the GitHub repo. Do `git pull` to sync, edit, then `git add . && git commit -m "msg" && git push`
- **VS Code** (local) — project at `c:\Users\jason\OneDrive\Desktop\lake-city-christian-church`
- **GitHub** — direct edits on github.com

All three push to the same repo; any push to `main` triggers deploy.

## Monitoring Deploys

```bash
gh run list --limit 1          # check status
gh run watch <run-id>           # watch progress
```

## Checking Logs

```bash
# Must use MSYS_NO_PATHCONV=1 on Windows Git Bash to prevent path conversion
MSYS_NO_PATHCONV=1 aws logs filter-log-events \
  --log-group-name '/ecs/lc3' \
  --log-stream-names 'ecs/lc3/<task-id>' \
  --filter-pattern '<keyword>' \
  --profile admin --region us-east-2
```

## AWS CLI Notes
- Use `--profile admin` (AdministratorAccess)
- Region is always `us-east-2`
- Use `MSYS_NO_PATHCONV=1` prefix on Windows to prevent Git Bash from converting `/ecs/lc3` to `C:/Program Files/Git/ecs/lc3`
