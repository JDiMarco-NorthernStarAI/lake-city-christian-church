---
name: Gmail draft compose-window race
description: API updates to a Gmail draft get overwritten if Jason has the draft open in a compose window
type: feedback
---

Updating a Gmail draft via the connector while Jason has that draft OPEN in a Gmail compose window gets silently reverted: Gmail auto-saves the stale open copy over the API update (observed 2026-10-02 — draft content rolled back with a newer timestamp).

**Why:** Gmail compose windows don't live-refresh from the server; their auto-save wins.

**How to apply:** After updating an existing draft, tell Jason to CLOSE any open compose window for it before reopening from Drafts. If he reports a draft "missing" content that was added, suspect this race first — verify with get_draft and re-apply the update. Also note deploy-to-ECS red X "deployment not found after stabilization" is usually a benign supersede when two pushes land minutes apart; the later run ships both.
