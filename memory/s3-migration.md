---
name: LC3 S3 File Storage
description: File storage migrated from Replit GCS to AWS S3 with presigned URLs
type: project
---

## S3 File Storage (completed March 14, 2026)

Migrated from Replit's Google Cloud Storage sidecar to AWS S3.

- **Bucket**: `lc3-storage` (us-east-2)
- **Access**: Via ECS task role `lc3-ecs-task-role` (no access keys needed)
- **Upload flow**: Server generates presigned PUT URL → client uploads directly to S3
- **ACL**: Stored as S3 object metadata key `aclpolicy` (lowercase)
- **Key files**:
  - `server/replit_integrations/object_storage/objectStorage.ts` — S3Client, upload/download/presigned URLs
  - `server/replit_integrations/object_storage/objectAcl.ts` — ACL via object metadata
- **Types**: `S3FileRef` replaces old GCS `File` type
- **URL handling**: `normalizeObjectEntityPath()` handles S3 presigned URLs, legacy GCS URLs, and old Replit .private paths
