---
name: Giving / Donations Integration
description: Planning Center giving integration, API sync, Give page, QR codes
type: project
---

## Current Setup

- Church uses **Planning Center** (Church Center) for giving at `https://lakecitycc.churchcenter.com/giving`
- Planning Center connects to their Stripe account (`acct_1PgtARLyjx0TA4Ls`)
- Give page (`/give`) opens Planning Center modal on desktop, new tab on mobile
- `/giving` redirects to `/give` for QR code compatibility
- Planning Center API syncs donation history into user accounts
- See [planning-center.md](planning-center.md) for full API integration details

## Give Page Behavior

- **Desktop:** Opens Planning Center embedded modal via `https://js.churchcenter.com/modal/v1` script (requires HTTPS, now working)
- **Mobile:** Falls back to new tab (Planning Center limitation — modal doesn't work on mobile)
- Planning Center blocks iframe embedding (X-Frame-Options) — modal is the only embed option
- Future: once admin access confirmed, explore "Shareable Code" embed option for a more branded experience

## QR Codes (posted throughout church)

- **Give Online QR** → `www.lakecitycc.com/giving` → `/give` -- WORKING
- **Connect Card QR** → `www.lakecitycc.com` → home page -- WORKING
- `/connect` → `/forms/volunteer-signup` -- WORKING
- `/news` → `/announcements` -- WORKING
- Old QR at form.everestwebdeals.co is external, cannot redirect — need new QR codes

## Planning Center Contact Info (needs updating by admin)

- Currently shows: `Connect.lakecity@gmail.com` and `(440) 243-7592`
- Should be: `info@lakecitycc.com` and `(216) 395-4761`
