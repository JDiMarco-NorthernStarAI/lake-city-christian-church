<!-- merged from c--Users-jason-OneDrive-Desktop-lake-city-christian-church -->
# Lake City Christian Church (LC3) - Project Memory

**Site is LIVE at https://www.lakecitycc.com** (as of 2026-03-21)

## AWS Infrastructure
See [aws-infrastructure.md](aws-infrastructure.md) — ECS, RDS, S3, ALB (HTTPS), env vars, startup flow, task def updates via CLI.

## Auth Architecture
See [auth-architecture.md](auth-architecture.md) — dual JWT/session auth, Google login (with profile completion), Apple Sign-In ready to configure, admin accounts, registration with city groups.

## Deployment Workflow
See [deployment-workflow.md](deployment-workflow.md) — push to main deploys, Replit/VS Code/GitHub editing, log checking. ECS cluster is "upstream-therapeutics".

## S3 File Storage
See [s3-migration.md](s3-migration.md) — migrated from Replit GCS to AWS S3 presigned URLs.

## Media Library
See [media-library.md](media-library.md) — image upload/gallery with S3, folder organization, ImagePickerModal, admin media page.

## Small Groups (City Groups)
See [small-groups.md](small-groups.md) — admin-manageable groups, public signup form, user assignments, email notifications, registration integration.

## Form Builder
See [form-builder.md](form-builder.md) — notification emails per form, volunteer signup, address autocomplete, radio "Other" text input.

## Giving / Donations
See [giving.md](giving.md) — Give page with PC modal embed, QR codes, donation history in user accounts.

## Planning Center Integration
See [planning-center.md](planning-center.md) — API sync (donations, people, funds), auto-sync every 6 hours, manual sync endpoint, Give page embed.

## Go-Live Checklist
See [go-live-checklist.md](go-live-checklist.md) — SSL, HTTPS, DNS, Google OAuth, QR codes, PC API sync all DONE. Apple Sign-In remaining.

## User Setup
See [user-setup.md](user-setup.md) — Jason's dev environment, AWS CLI, Replit setup.

## Email Configuration
- SMTP via Trevor's Google Workspace (smtp.gmail.com), from: Lake City Christian Church <noreply@lakecitycc.com>
- noreply@lakecitycc.com is an alternate email on Trevor's Google Workspace account
- Form notifications: volunteer@lakecitycc.com, smallgroups@lakecitycc.com
- Contact email: info@lakecitycc.com, Phone: (216) 395-4761
- Gmail suppresses emails from same account via group forwarding — send directly to recipients

## Content Updates (2026-03-20)
- Our Story: full 5-paragraph church history
- Trevor bio updated, team duplicates fixed, Paul & Leslie Aguilar added
- Kids Ministry: "KidMin Leaders", Ministries descriptions updated
- Navbar: solid black, seed deduplicates events/sermons/team

## Pending Work
- Apple OAuth — has Dev account, HTTPS now available, ready to configure (see go-live-checklist.md)
- Media Library admin — crop/resize, nested folders, bulk ops need finishing
- Planning Center contact info needs updating (still shows old email/phone)
- Old QR codes at form.everestwebdeals.co need replacing with new lakecitycc.com QR codes
- npm lockfile issue: Windows lockfile incompatible with Docker — fix with `rm -rf node_modules package-lock.json && npm install`

<!-- merged from c--Users-jason-OneDrive-Desktop-Claude-Code-Projects-lake-city-christian-church -->
- [Jason DiMarco](user_jason.md) — Project owner, manages LC3 site for church staff, prefers quick iterations
- [AWS Deployment Setup](project_deployment.md) — Auto-deploy via GitHub Actions to AWS ECS on push to main
- [Commit and push workflow](feedback_commit_push.md) — Jason tests on live site, commit/push promptly
- [Image paths need getImageSrc](feedback_image_paths.md) — Public pages must use getImageSrc() for /objects/ prefix
- [Never auto-recreate admin content in seed.ts](feedback_seed_data.md) — cleanupData() runs every deploy; no "ensure X exists" blocks
- [AWS infrastructure references](reference_aws.md) — RDS endpoint, ECR, ECS cluster/service names, region
