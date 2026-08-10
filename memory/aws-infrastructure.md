---
name: LC3 AWS Infrastructure
description: All AWS resource details for the LC3 ECS deployment (ALB, ECR, RDS, S3, security groups, task def, env vars)
type: project
---

## AWS Infrastructure (deployed March 14, 2026)

| Component | Value |
|-----------|-------|
| **ALB** | `lc3-alb` → `lc3-alb-15665637.us-east-2.elb.amazonaws.com` (HTTPS:443 + HTTP→HTTPS redirect) |
| **ACM Cert** | `arn:aws:acm:us-east-2:973918476842:certificate/f6fb28b2-54fd-4855-a7ab-ba166e55b5e4` (lakecitycc.com + *.lakecitycc.com) |
| **ECS Cluster** | `upstream-therapeutics` (shared) |
| **ECS Service** | `lc3-service` |
| **ECR Repo** | `lc3` (`973918476842.dkr.ecr.us-east-2.amazonaws.com/lc3`) |
| **Target Group** | `lc3-tg` |
| **Task Definition** | `lc3` (512 CPU, 1GB memory) |
| **Task Role** | `lc3-ecs-task-role` (S3 access to lc3-storage) |
| **S3 Bucket** | `lc3-storage` (us-east-2, BlockPublicAccess enabled) |
| **RDS** | `lc3-database.cbaqio6wghp5.us-east-2.rds.amazonaws.com` (PostgreSQL 16, db.t3.micro) |
| **CloudWatch Logs** | `/ecs/lc3` |
| **Region** | us-east-2 |
| **CI/CD** | GitHub Actions → ECR → ECS on push to main |

## Environment Variables in Task Definition

- `DATABASE_URL` — PostgreSQL connection string with `?ssl=true`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (+18447791252)
- `SMTP_HOST` (smtp.gmail.com), `SMTP_PORT` (587), `SMTP_USER` (trevor@lakecitycc.com), `SMTP_PASS` (Google App Password), `SMTP_FROM` (Lake City Christian Church <noreply@lakecitycc.com>)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `GOOGLE_CLIENT_ID`
- `APP_URL` (`https://www.lakecitycc.com`)
- `PCO_APP_ID`, `PCO_SECRET` (Planning Center API credentials)
- `S3_BUCKET_NAME` (lc3-storage)
- `NODE_ENV` (production)

## Email

- SMTP via Trevor's Google Workspace (smtp.gmail.com)
- From address: `noreply@lakecitycc.com` (alternate email alias on Trevor's account)
- Notification emails sent to `trevor@lakecitycc.com` directly (info@lakecitycc.com is a Google Group that forwards to Trevor — Gmail suppresses emails sent by same account to a group forwarding back to self)
- Email templates in `server/email-templates.ts` — branded with LC3 gradient header

## Startup Flow (scripts/start.sh)

1. Sets `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. Auto-creates `lc3` database if it doesn't exist
3. Runs `drizzle-kit push --force` for schema sync
4. Creates tables if not exist: media, media_folders, city_groups, city_group_signups, user_city_groups, session
5. Fixes media paths with double /objects/ prefix
6. Starts `node dist/index.cjs`

## Updating Task Definition via CLI

To change env vars without redeploying code:
1. Get current task def: `aws ecs describe-task-definition --task-definition lc3:<rev>`
2. Modify JSON, register new revision: `aws ecs register-task-definition --cli-input-json file://updated.json`
3. Update service: `aws ecs update-service --cluster upstream-therapeutics --service lc3-service --task-definition lc3:<new-rev> --force-new-deployment`
