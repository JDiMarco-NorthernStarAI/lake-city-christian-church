---
name: AWS Deployment Setup
description: How the LC3 site deploys — GitHub Actions to AWS ECS with auto-deploy on push to main
type: project
---

The site auto-deploys on push to `main` via GitHub Actions (`deploy.yml`).

- **AWS ECS**: Cluster `upstream-therapeutics`, service `lc3-service`, task family `lc3`
- **ECR**: Repository `lc3` in us-east-2
- **RDS**: PostgreSQL instance `lc3-database` at `lc3-database.cbaqio6wghp5.us-east-2.rds.amazonaws.com`
- **Docker**: Multi-stage build (node:20-bookworm-slim). Known ETXTBSY race condition on esbuild — rerun the deploy if it fails on `npm ci` with that error.
- **Startup**: `scripts/start.sh` runs `drizzle-kit push --force` plus explicit ALTER TABLE migrations before starting the server. New schema columns should be added here as `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for reliability since drizzle-kit push doesn't always handle nullable changes.
- **Domain**: https://www.lakecitycc.com
- **DATABASE_URL** is set as an environment variable on the ECS task, not in the repo. Cannot run `db:push` locally without it.

**Why:** Understanding this flow prevents wasted time trying to run DB migrations locally and explains why changes need explicit migrations in start.sh.

**How to apply:** Always add explicit ALTER TABLE statements in `scripts/start.sh` when adding new columns or changing nullability. Always commit and push to trigger deploys. Check `gh run list` and `gh run view --log-failed` to debug deploy failures.
