---
name: Go-Live Checklist
description: Completed go-live steps and remaining items for lakecitycc.com
type: project
---

## SITE IS LIVE as of 2026-03-21

### Completed Items

**1. ACM SSL Certificate** -- DONE
- Cert ARN: `arn:aws:acm:us-east-2:973918476842:certificate/f6fb28b2-54fd-4855-a7ab-ba166e55b5e4`
- Covers `lakecitycc.com` and `*.lakecitycc.com`

**2. HTTPS Listener on ALB** -- DONE
- HTTPS (443) listener forwarding to LC3 target group
- HTTP (80) listener redirects to HTTPS (301)

**3. DNS Records** -- DONE
- GoDaddy nameservers switched from Wix to GoDaddy defaults
- `www` CNAME → `lc3-alb-15665637.us-east-2.elb.amazonaws.com`
- Root domain forwarding: `lakecitycc.com` → `https://www.lakecitycc.com` (301)

**4. Update APP_URL env var** -- DONE
- `APP_URL` set to `https://www.lakecitycc.com`

**5. Google OAuth Update** -- DONE
- Updated with new domain origins and redirects

**6. QR Code Verification** -- DONE
- Give Online QR → `www.lakecitycc.com/giving` → `/give` -- working
- Connect Card QR → `www.lakecitycc.com` -- working
- `/connect` → `/forms/volunteer-signup` -- working
- `/news` → `/announcements` -- working
- Note: QR code at form.everestwebdeals.co is an external domain, cannot redirect — need new QR codes printed

**7. Planning Center API Sync** -- DONE
- See [planning-center.md](planning-center.md)

### Remaining Items

**Apple Sign-In Setup** -- READY TO CONFIGURE
- HTTPS is now available, Apple Sign-In can be completed
- Jason has: App ID (`com.lakecitycc.web`), Services ID (`com.lakecitycc.web.signin`), Team ID (`9Y5U642FW7`)
- Still needs to: configure return URL `https://www.lakecitycc.com/login` in Services ID, create a Key, download .p8 file
- Then add env vars: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
- Unhide the Apple Sign-In button in social-auth-buttons.tsx
