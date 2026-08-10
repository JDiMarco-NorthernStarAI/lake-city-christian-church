---
name: Planning Center Integration
description: Planning Center API integration for giving/donations sync, credentials, sync behavior
type: project
---

## Overview

Planning Center (PC) is the church's giving platform. The LC3 site syncs donation data from PC via API and displays it in user accounts.

## API Access

- Auth: Personal Access Token (HTTP Basic with `PCO_APP_ID:[REDACTED - see password manager]
- Env vars `PCO_APP_ID` and `PCO_SECRET` are set in ECS task definition
- API is **READ-ONLY** for donations — cannot create donations via API (403 Forbidden)
- Base URL: `https://api.planningcenteronline.com`

## API Endpoints Used

- `GET /giving/v2/donations` — all donations with designations
- `GET /giving/v2/people` — giving-specific people records
- `GET /people/v2/people` — full people records (has email addresses; Giving API does not)
- `GET /giving/v2/funds` — fund definitions (9 funds)

## Data Synced

- 847 donations, 114 people, 9 funds (as of 2026-03-21)
- Stored in `pco_donations` table
- Donors matched to LC3 site users by email address
- Unmatched donations stored with email for future auto-matching on registration

## Sync Behavior

- **Auto-sync on startup:** 30-second delay after server start, then syncs
- **Recurring sync:** Every 6 hours
- **Manual sync:** `POST /api/admin/pco-sync` (admin-only endpoint)
- Sync pulls all donations, people, and funds from PC API
- Matches donors to site users by email

## Give Page

- Desktop: Opens Planning Center embedded modal via `https://js.churchcenter.com/modal/v1` script
- Mobile: Falls back to new tab (PC modal doesn't work on mobile)
- PC blocks iframe embedding (X-Frame-Options)
- URL: `https://lakecitycc.churchcenter.com/giving?open-in-church-center-modal=true`

## User Account Integration

- Users see their PC donation history in the Giving tab of their account
- Data is read-only (sourced from PC)

## Church's Stripe Account

- `acct_1PgtARLyjx0TA4Ls` (connected through Planning Center)

## Contact Info (needs updating in PC admin)

- Currently shows: `Connect.lakecity@gmail.com` and `(440) 243-7592`
- Should be: `info@lakecitycc.com` and `(216) 395-4761`

## Lockfile Issue Pattern

- `npm install` on Windows creates lockfile incompatible with Docker Node 20
- `bufferutil@4.1.0` repeatedly missing from lockfile
- Fix: `rm -rf node_modules package-lock.json && npm install`
