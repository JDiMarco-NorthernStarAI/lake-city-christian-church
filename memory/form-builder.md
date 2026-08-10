---
name: Form Builder Enhancements
description: Form builder notification emails, volunteer form, address autocomplete, field types, and architecture decisions
type: project
---

## Form Builder Enhancements (2026-03-21)

### Notification Email per Form
- Added `notification_email` column to `forms` table
- Admin can set a notification email in the form editor
- On each submission, a branded LC3 email is sent to that address with all field values
- Uses `adminNotificationEmail` template from `server/email-templates.ts`

### Address Field Type
- New `address` field type in form builder
- Uses Google Places Autocomplete for address suggestions (US addresses)
- Auto-fills street, city, state, ZIP
- `AddressAutocomplete` component (`client/src/components/address-autocomplete.tsx`)
- API key served via `/api/v1/auth/config` endpoint (`GOOGLE_PLACES_API_KEY` env var)
- Integrated in: registration page, account profile edit, public forms

### Radio "Other" Text Input
- Radio fields with an "Other" option now show a text input when selected
- Value stored as `"Other: <user text>"`

### Volunteer Signup Form
- Slug: `volunteer-signup`, notification email: `volunteer@lakecitycc.com`
- 16 fields: name, phone, email, address, background check (radio w/ Other), 5 ministry area checkbox groups (Kids, Student, Hospitality, Care, Missions), skills, experience (Yes/No), experience details, joy/motivation, interaction level (radio w/ Other), additional info
- Linked from Connect & Serve page (replaced Google Form link)
- Seeded via `seed.ts` cleanup function

### Small Groups Form in Form Builder
- Slug: `join-small-group`, notification email: `smallgroups@lakecitycc.com`
- Listed in Form Builder for visibility and email config, but actual form is the custom `/join-small-group` page
- Description says "This form is managed in the Small Groups admin tab"
- The custom page pulls groups dynamically from `city_groups` table

### Email Addresses by Form
- Volunteer: `volunteer@lakecitycc.com`
- Small Groups: `smallgroups@lakecitycc.com`
- These are Google Workspace aliases/groups under Trevor's account

### Important: Checkbox in Forms
- Do NOT use Radix `<Checkbox>` inside `<form>` tags — renders `<button type="submit">` causing form submission
- Public form uses Radix Checkbox for checkbox_group fields — works because they're inside labels not standalone
- Small group signup page uses custom div checkboxes (learned the hard way)

### Package Lock Issue
- Installing new npm packages on Windows can break `package-lock.json` for Docker's Node 20
- Fix: `rm -rf node_modules package-lock.json && npm install` to regenerate cleanly
- This has happened multiple times (bufferutil issue)
