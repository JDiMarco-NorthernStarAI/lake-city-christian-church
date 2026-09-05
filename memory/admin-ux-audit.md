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
1. Stop the bleeding (bug fixes + delete confirms + friendly errors + mobile)
2. Sign-up wizard with inline form building + grouped sidebar + "what's still needed" panel
3. Shanna's toolkit: per-claim quantities, confirmation emails, per-fund reports, PC funds
4. Ministry-scoped roles, dashboard quick actions, messages reply, search, SMS UX

Related: [[form-builder]], [[giving]], [[planning-center]]
