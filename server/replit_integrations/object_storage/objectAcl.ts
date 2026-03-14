import {
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, S3FileRef } from "./objectStorage";

// S3 lowercases custom metadata keys, so we use a simple key name.
const ACL_POLICY_METADATA_KEY = "aclpolicy";

// The type of the access group.
export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// Sets the ACL policy as S3 object metadata using copy-in-place.
export async function setObjectAclPolicy(
  objectFile: S3FileRef,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  // First read existing metadata so we preserve ContentType etc.
  const headResponse = await s3Client.send(
    new HeadObjectCommand({
      Bucket: objectFile.bucket,
      Key: objectFile.key,
    })
  );

  // Copy object in-place with updated metadata
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: objectFile.bucket,
      Key: objectFile.key,
      CopySource: `${objectFile.bucket}/${objectFile.key}`,
      MetadataDirective: "REPLACE",
      ContentType: headResponse.ContentType || "application/octet-stream",
      Metadata: {
        ...headResponse.Metadata,
        [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
      },
    })
  );
}

// Gets the ACL policy from S3 object metadata.
export async function getObjectAclPolicy(
  objectFile: S3FileRef,
): Promise<ObjectAclPolicy | null> {
  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: objectFile.bucket,
        Key: objectFile.key,
      })
    );

    const aclPolicyStr = response.Metadata?.[ACL_POLICY_METADATA_KEY];
    if (!aclPolicyStr) {
      return null;
    }
    return JSON.parse(aclPolicyStr);
  } catch {
    return null;
  }
}

// Checks if the user can access the object.
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: S3FileRef;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    // No ACL metadata — allow access for authenticated users.
    // Migrated files from GCS don't have S3 ACL metadata yet.
    return !!userId;
  }

  // Public objects are always accessible for read.
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  // The owner can always access.
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Check ACL rules.
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
