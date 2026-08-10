---
name: LC3 Auth Architecture
description: Dual auth system (JWT v1 API + session-based admin), social login (Google active, Apple blocked on HTTPS), admin accounts, and known gotchas
type: project
---

## Auth System

Two auth mechanisms — JWT is primary:

1. **JWT (v1 API)** — used everywhere (public site + admin dashboard)
   - Endpoints: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/social`, `/api/v1/auth/me`
   - Tokens stored in localStorage: [REDACTED - see password manager]
   - Client hook: `useAuth()` in `client/src/hooks/use-auth.tsx`

2. **Session (express-session + connect-pg-simple)** — legacy fallback
   - Auth bridge (`POST /api/auth/bridge`) converts JWT to session

## Social Login

- **Google Sign-In**: Active. After signup, redirects to `/account?complete=1` for profile completion (phone, address, SMS consent). Google Client ID configured in ECS env vars.
- **Apple Sign-In**: Button hidden. Jason has Apple Developer account (Team ID: 9Y5U642FW7), App ID and Services ID created, but Apple requires HTTPS return URLs. Blocked until custom domain + SSL is set up. See go-live-checklist.md.

## Unified Logout

Admin dashboard uses `useAuth()` context's `logout()` method which clears JWT tokens, refresh tokens, session cookies, auth context, React Query cache, and redirects to `/login`.

## Admin Accounts (seeded on every deploy)

| Email | Name | Roles |
|-------|------|-------|
| jdimarco@northernstarai.com | Jason DiMarco | super_admin, admin, member |
| trevor@lakecitycc.com | Trevor Littleton | super_admin, admin, member |
| shanna@lakecitycc.com | Shanna Littleton | super_admin, admin, member |

Default password: [REDACTED - see password manager]

## Registration Flow

- Standard registration: name, email, phone, password, address, city group selection (optional), SMS consent
- Google signup: creates account with Google profile, then redirects to account page with "Complete your profile" banner to capture phone/address/SMS
- City group selection during registration: checkboxes for active groups + "Other" with text input
- Auto-links existing city group signup form submissions by matching email

## Key Gotchas

- **Session table**: Must be created in `start.sh` before app starts
- **RDS SSL**: `NODE_TLS_REJECT_UNAUTHORIZED=0` set globally for drizzle-kit
- **Email lookup is case-insensitive**: `getUserByEmail` uses `lower()` comparison
- **Social login (Google)**: Links to existing accounts by email, does NOT overwrite password
- **JWT fallback is essential**: Session cookies alone were unreliable
