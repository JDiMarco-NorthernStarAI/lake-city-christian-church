---
name: City Groups (Small Groups) Feature
description: Admin-manageable small groups with public signup form, user assignments, email notifications, and registration integration
type: project
---

## City Groups (Small Groups)

Admin-manageable small group system replacing the external Google Form.

### Database Tables

- `city_groups` — id, name, description, meetingDay, meetingTime, isActive, sortOrder, timestamps
- `city_group_signups` — id, name, email, phone, groupIds (integer array), createdAt
- `user_city_groups` — id, userId, cityGroupId, otherGroupName, createdAt (unique on userId+cityGroupId)

All created in `scripts/start.sh` and in `shared/schema.ts`.

### API Endpoints

**Public:**
- `GET /api/city-groups/active` — active groups for signup form
- `POST /api/city-groups/signup` — submit signup (sends branded email notification)

**Admin:**
- `GET /api/city-groups` — all groups (admin)
- `POST /api/city-groups` — create group
- `PATCH /api/city-groups/:id` — update group
- `DELETE /api/city-groups/:id` — delete group
- `GET /api/city-groups/signups` — view all signups
- `DELETE /api/city-groups/signups/:id` — delete signup
- `GET /api/user-city-groups` — all user-group assignments
- `GET /api/users/:userId/city-groups` — user's groups
- `PUT /api/users/:userId/city-groups` — set user's groups

### Public Signup Form

- Page: `/join-small-group` (`client/src/pages/join-small-group.tsx`)
- Fields: Name, Email, Phone (optional), Group checkboxes (custom div checkboxes, NOT Radix Checkbox — Radix renders a button that submits the form)
- On submit: saves to `city_group_signups`, sends branded email to `trevor@lakecitycc.com` + `info@lakecitycc.com`
- Success page with "Thank You" message
- Linked from Small Groups page "Join a Small Group" button

### Admin Dashboard

- "Small Groups" tab in admin sidebar (uses `signups` feature permission)
- Two views: "Manage Groups" (CRUD table) and "Signups" (view submissions with group names as badges)
- Add/Edit dialog with: name, description, meeting day, meeting time, sort order, active toggle

### User-Group Assignments

- Users can belong to multiple groups
- Registration page shows city group checkboxes + "Other" option with text input
- Admin Users page: filter by role or by group, Groups column, Edit Groups button per user
- Auto-links: when a user registers with an email matching a previous signup form submission, those group interests are automatically assigned

### Initial Groups (seeded)

1. Anchored — Sunday (every other) @ 4:30 PM (Young Families)
2. Young Adults — Monday @ 7:30 PM
3. Deep Diver Crew — Wednesday @ 10:30 AM
4. F4 (Faith, Friends, Fellowship, Fun) — Wednesday (every other) @ 6:30 PM (Adult Couples)
5. CIA (Christians In Action) — Wednesday (every other) @ 6:30 PM

### Email Notifications

- Uses branded LC3 template (`smallGroupSignupNotification` in `server/email-templates.ts`)
- Includes: name, email (clickable), phone (clickable), groups, submission timestamp
- Sent to Trevor directly (Gmail suppresses emails from same account via group forwarding)
- SMTP from: `noreply@lakecitycc.com` (alias on Trevor's Google Workspace account)

### Important: Checkbox Implementation

Do NOT use Radix `<Checkbox>` component inside forms — it renders a `<button>` that defaults to `type="submit"`, causing form submission on click. Use custom div checkboxes with SVG checkmark instead.
