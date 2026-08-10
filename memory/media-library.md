---
name: Media Library Feature
description: Image upload/gallery system using S3 server-side upload (multer), database-tracked media with folder organization, admin media management page
type: project
---

## Media Library

Database-tracked image upload/gallery system with S3 server-side upload (multer).

### Database

- Table `media`: id, filename, objectPath, folder, contentType, size, uploadedBy, createdAt
- Table `media_folders`: id, path (unique), createdBy, createdAt. Default folders seeded: events, team, sermons, pages, general
- Both tables explicitly created in `scripts/start.sh`

### API Endpoints

- `GET /api/media?folder=xxx` — list media by folder
- `POST /api/media/upload` — multipart upload via multer, requires admin auth with JWT Bearer token
- `DELETE /api/media/:id` — delete media record (admin only)
- CRUD endpoints for media folders (nested folder support)

### Upload Flow (server-side proxy)

1. Client sends FormData with `file` and `folder` fields + JWT Bearer token
2. Server receives via multer (memoryStorage, 10MB limit)
3. Server uploads to S3 via `PutObjectCommand` with key `uploads/{uuid}`
4. Server stores objectPath (`/uploads/uuid`) in media table
5. Gallery refreshes and auto-selects the new image

### Image Serving

- `GET /objects/*` route streams from S3 using `GetObjectCommand`
- Sets Content-Type, Content-Length, Cache-Control headers

### S3 Permissions

- ECS task role: `lc3-ecs-task-role`
- Inline policy `lc3-s3-access`: s3:GetObject, s3:PutObject, s3:DeleteObject, s3:HeadObject on `arn:aws:s3:::lc3-storage/*` AND s3:ListBucket on `arn:aws:s3:::lc3-storage`
- Bucket `lc3-storage` does NOT allow ACLs (BlockPublicAccess enabled)
- `github-actions` IAM user does NOT have S3 or IAM permissions

### Client Components

- **ImagePickerModal** (`client/src/components/image-picker-modal.tsx`) — reusable modal with folder tabs, image grid, upload button, select/delete
- **AdminMediaTab** (`client/src/pages/admin-media.tsx`) — full media library management in admin dashboard
- **MediaDetailModal** — image detail/preview/rename
- **MediaCropModal** — crop/resize UI (uses react-image-crop)

### Resolved Issues

- Double /objects/ prefix — fixed in storage path and startup script
- S3 NoSuchKey after PutObject — was a path issue, resolved
- ACL "public-read" fails — bucket has BlockPublicAccess, removed ACL

**Why:** Manual URL entry was impractical for non-technical church staff.
**How to apply:** When adding image fields to new admin sections, use ImagePickerModal with the appropriate defaultFolder.
