---
name: admin-ux-audit
description: Sept 2026 full admin usability audit — key findings, bugs, and the 4-phase improvement plan (artifact link)
metadata:
  type: project
---

## Admin UX Audit (2026-09-05)

Triggered by Shanna Littleton (Director of Communications) getting stuck creating a Sign Up (form must pre-exist in Form Builder). Full audit report artifact: https://claude.ai/code/artifact/715f1dd9-4807-41b7-9dd5-da751c96be23

### Confirmed bugs / dead UI (Phase 1 targets)
- Fund + Record Donation dialogs unreachable — no trigger buttons (admin-dashboard.tsx:4870, 4904)
- Settings can't clear a field — `if (values[key])` skips blanks (admin-dashboard.tsx:2082)
- Item capacity NOT enforced when form submitted via signup event path (server/routes.ts:1884) + non-transactional capacity checks (routes.ts:1607, 1876) → overbooking race
- SMS group edit dead (`setEditGroup` never wired), custom groups have no member UI
- Signup `visibility`, form `requireAuth`/`allowMultiple` stored but never enforced
- No delete confirmation on sign ups (5663), forms (3122), fields (3521), sermons (977), team (1413), events (1176), submissions
- Raw HTTP/JSON error toasts everywhere (queryClient.ts:13)
- Mobile: drawer doesn't close on nav (line 155), dialogs lack max-h scroll, media folder rail not responsive
- No forgot-password anywhere; reminder settings saved but no scheduler exists

### Key facts
- checkbox_group = "Limited Items Signup" with per-item capacity `{label, capacity}` — works standalone via /forms/slug but counts people not quantities; admin can't see claimed counts
- Signups send NO confirmation email and NO admin notification (forms have optional notificationEmail)
- Real giving flows through Planning Center (Church Center modal); donation_funds/Stripe checkout is parallel; no per-fund reporting anywhere; pco_donations is a separate ledger synced 6-hourly
- Roles are feature-level only; createdBy recorded but never filtered — no ministry scoping
- Two parallel signup systems: events/event_signups (v1 API) vs signup_events/signup_submissions
- Sidebar: flat alphabetical 17 items; Form Builder / Sign Ups / Submissions scattered at positions 6/14/16

### Plan (see artifact for detail)
1. ✅ DONE (commit f4d54b7, 2026-09-05): fund/record-donation UI wired (+new Funds view), Settings clear bug, SMS group edit, capacity enforced on signup-event path + pg advisory locks (keyspace 1=form, 2=signup event), optionUsage on signup detail page, ConfirmDelete component (client/src/components/confirm-delete.tsx) on all deletes, friendly error parsing in queryClient, unsaved-guard (client/src/lib/unsaved-guard.ts) for sign-up editor/settings/page content/roles, mobile drawer auto-close (AdminSidebarNav w/ useSidebar), dialog max-h-[90dvh], media rail responsive, form editor stays after create (onCreated prop), empty states.
2. ✅ DONE (commit 8053ac0, 2026-09-05): SignupsTab is a 3-step wizard (Details → Questions & Items → Publish & Share); step 1 auto-creates the signup's form (slug `<slug>-form`, published) and saves a draft; FormFieldsEditor extracted (shared by FormEditor + wizard); sidebar grouped via NAV_GROUPS (People & Sign-Ups / Content / Communication / Church), Submissions renamed "Responses" and consolidated (signup rosters + standalone forms); SubmissionsView roster shows answer columns + "What's Still Needed" item panel with print; plain-language status/visibility/display labels; server enforces visibility (members_only login, unlisted excluded from list) and closed = viewable-but-rejecting.
3. ✅ DONE (commit 9f1aeac, 2026-09-05): claim entries are now `string | {label, quantity}` (server parseClaimEntries/formatClaimValue in routes.ts; qty stepper in public-form + signup-detail); signupConfirmationEmail template added (email-templates.ts) — submitter gets confirmation (finds email/name fields in formData), contactEmail (fallback form.notificationEmail) gets adminNotificationEmail; GET /api/admin/fund-report (PCO + web donations by fund, date range) + Giving by Fund card in Donations Reports w/ CSV; paymentUrl in signup settings jsonb → "Pay Online" on public page + emails; SPAM: server/spam-guard.ts publicFormGuard (honeypot "website" + formStartedAt min 3s + per-IP rate limit) on connect/contact/public form/signup/city-group/register endpoints, client useSpamGuard hook (components/spam-guard.tsx) in connect-serve/contact/register; bulk delete + search in Users (skips admins/self), bulk delete in Connect Cards; fixed literal — in Users groups column.
4. ✅ DONE (commit 478d17c, 2026-09-05): ministry scoping via isFullAdmin/ownsRecord in routes.ts (non-admin staff see only own forms/signups, checks on every route incl. field + submission routes); DashboardTab rebuilt (quick actions, clickable cards, `recent` feed from dashboard-stats); Messages detail dialog + mailto reply + DELETE /api/contact/:id; "Select Likely Spam" (client/src/lib/spam-detect.ts heuristics) in Connect Cards + Users; Sermons + Media search; SMS Review & Send dialog + test-send (POST /api/sms/settings/test now takes phone/message) + role-checkbox group builder replacing JSON textarea; push notification review dialog; forgot/reset password (stateless JWT tokens in jwt.ts — password-hash fingerprint invalidates used links; pages forgot-password.tsx/reset-password.tsx; /api/v1/auth/forgot-password + reset-password).

NOT done (future work): merging the parallel events/event_signups vs signup_events systems; routing Team/User photos through Media Library; CAPTCHA (Turnstile) if honeypot doesn't stop spam; pagination on long lists; URL routing per admin section.

Spam context (2026-09-05): bots had flooded Connect Cards and user registrations with gibberish entries. Jason cleaned Users manually; Connect Cards via Select Likely Spam. Hardening (commit a31b1ca): heuristics live in shared/spam-heuristics.ts (used by client selector AND server; tuned so zero-vowel words flag but "Smith" (1/5 vowels) doesn't — tested against real samples); server silently drops spam-content connect cards and rejects spam-pattern registrations; ALL public forms stamp formStartedAt and guarded endpoints use requireTimestamp (missing → 400 "refresh the page", never silent-drop, protects stale tabs). If spam persists, next step is Cloudflare Turnstile.

Shanna comms: draft reply created in Jason's Gmail (thread "Lake City form question", 2026-09-05) — plain-language guide to the new sign-up wizard, items/limits, emails, printing, payment links, QR codes, Responses. Jason to review/send and set her up with a scoped login.

Note: repo has ~164 PRE-EXISTING tsc errors (jwt, web-push types, pcoData stats typing, Stripe Invoice.subscription). Build (vite/esbuild) ignores them. Compare against baseline before blaming new code.

Related: [[form-builder]], [[giving]], [[planning-center]]
