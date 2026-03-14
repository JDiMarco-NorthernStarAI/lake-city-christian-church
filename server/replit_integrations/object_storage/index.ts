export {
  ObjectStorageService,
  ObjectNotFoundError,
  s3Client,
} from "./objectStorage";

export type { S3FileRef } from "./objectStorage";

export type {
  ObjectAclPolicy,
  ObjectAccessGroup,
  ObjectAccessGroupType,
  ObjectAclRule,
} from "./objectAcl";

export {
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

export { registerObjectStorageRoutes } from "./routes";
