---
name: Do not auto-recreate admin-managed content in seed.ts
description: server/seed.ts cleanupData() runs on every deploy; never add "ensure X exists" blocks for admin-managed content
type: feedback
originSessionId: 9281e80e-54b3-4e73-bb09-f7cebdfc36bb
---
Never add logic to `server/seed.ts` (specifically the `cleanupData()` function) that recreates content the admin can manage through the dashboard — events, signup events, team members, sermons, etc. The function runs on every server startup, so "ensure X exists" blocks cause deleted content to come back on every deploy.

**Why:** Shanna (church staff) reported that deleted events like "Easter" and "Women's Ministry" kept reappearing. The cause was a hardcoded `newEvents` array in cleanupData() that re-created them if missing. A similar bug caused the T-Shirt Sign Up to disappear (code was deleting ALL signups on every startup). Then a "one-time cleanup" block that deleted any team member named "Aguiar" (thinking it was a misspelling of "Aguilar") wiped Paul & Leslie off the leadership page on every deploy — **the correct spelling is "Aguiar"**, so the cleanup was destroying the right entry.

**How to apply:** When modifying `server/seed.ts`, keep `cleanupData()` strictly limited to:
1. Deduplication (delete duplicates by exact name match)
2. Ensuring admin login accounts have correct roles/passwords (auth-critical)

Do NOT add hardcoded arrays of events/signups/team members that "ensure they exist", and do NOT add blocks that DELETE named content on a spelling/identity assumption — both fight admin actions on every deploy. Even a "one-time cleanup" of a specific bad entry is dangerous: it runs forever and can be based on a wrong assumption (the Aguiar case). If a bad entry needs removing, have the admin delete it in the dashboard, not in seed code. Initial seed content should only run once on fresh DBs (guarded by `existingSignups.length === 0` or similar empty-check), never on every startup.
