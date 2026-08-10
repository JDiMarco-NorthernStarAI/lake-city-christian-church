---
name: Commit and push workflow
description: Jason expects changes to be committed and pushed promptly so they deploy to the live site
type: feedback
---

Commit and push changes right after making them when Jason confirms. He tests on the live site and wants to see changes quickly.

**Why:** The site auto-deploys on push to main, and Jason verifies changes on the live site (lakecitycc.com) rather than locally.

**How to apply:** After making code changes, ask if Jason wants to commit/push, or just do it when he says "commit and push." Watch the deploy status with `gh run list` if there are issues.
