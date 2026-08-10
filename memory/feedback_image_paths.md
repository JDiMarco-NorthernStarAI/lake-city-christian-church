---
name: Image paths need getImageSrc helper
description: Public-facing pages must use getImageSrc() to resolve media library image paths with /objects/ prefix
type: feedback
---

Media library images are stored as relative paths (e.g., `events/image.png`) but need to be served from `/objects/events/image.png`. The admin dashboard has a `getImageSrc()` helper that handles this. Any new public-facing page that displays images from the media library must include this helper.

**Why:** Images appeared broken on the sign-ups page because `event.imageUrl` was used directly without the `/objects/` prefix.

**How to apply:** When creating new pages that display images from signup events, sermons, events, etc., always use `getImageSrc(path)` rather than the raw path. The helper is defined in admin-dashboard.tsx and should be duplicated in any public page that needs it.
