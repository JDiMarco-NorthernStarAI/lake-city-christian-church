import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// S3 file reference (replaces GCS File type)
export interface S3FileRef {
  bucket: string;
  key: string;
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
});

function getBucketName(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error(
      "S3_BUCKET_NAME not set. Create an S3 bucket and set S3_BUCKET_NAME env var."
    );
  }
  return bucket;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  // Gets the upload URL for an object entity (presigned PUT URL).
  async getObjectEntityUploadURL(): Promise<string> {
    const bucket = getBucketName();
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return url;
  }

  // Gets the S3 file reference from an object path like "/objects/uploads/{uuid}".
  async getObjectEntityFile(objectPath: string): Promise<S3FileRef> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    // Strip "/objects/" prefix to get the S3 key
    const key = objectPath.slice("/objects/".length);
    if (!key) {
      throw new ObjectNotFoundError();
    }

    const bucket = getBucketName();
    const fileRef: S3FileRef = { bucket, key };

    // Verify the object exists
    try {
      await s3Client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      );
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        throw new ObjectNotFoundError();
      }
      throw err;
    }

    return fileRef;
  }

  // Normalizes raw paths (presigned S3 URLs, legacy GCS URLs) to the canonical /objects/ format.
  normalizeObjectEntityPath(rawPath: string): string {
    // Already in canonical form
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    // Handle S3 presigned URLs
    if (rawPath.includes(".s3.") && rawPath.includes("amazonaws.com")) {
      try {
        const url = new URL(rawPath);
        let key: string;

        const host = url.hostname;
        if (host.startsWith(getBucketName())) {
          // Virtual-hosted style: <bucket>.s3.<region>.amazonaws.com/<key>
          key = url.pathname.slice(1);
        } else {
          // Path style: s3.<region>.amazonaws.com/<bucket>/<key>
          const parts = url.pathname.split("/");
          key = parts.slice(2).join("/");
        }

        if (key) {
          return `/objects/${key}`;
        }
      } catch {
        // Fall through
      }
    }

    // Handle legacy GCS URLs
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      try {
        const url = new URL(rawPath);
        const pathParts = url.pathname.split("/");
        const uploadsIdx = pathParts.indexOf("uploads");
        if (uploadsIdx > -1) {
          const remaining = pathParts.slice(uploadsIdx).join("/");
          return `/objects/${remaining}`;
        }
      } catch {
        // Fall through
      }
    }

    // Handle .private/uploads/ paths (Replit legacy)
    if (rawPath.includes(".private/uploads/")) {
      const afterUploads = rawPath.split("/uploads/")[1];
      if (afterUploads) {
        return `/objects/uploads/${afterUploads}`;
      }
    }

    return rawPath;
  }

  // Downloads an object to the Express response.
  async downloadObject(
    file: S3FileRef,
    res: Response,
    cacheTtlSec: number = 3600
  ) {
    try {
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";

      const command = new GetObjectCommand({
        Bucket: file.bucket,
        Key: file.key,
      });
      const response = await s3Client.send(command);

      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        ...(response.ContentLength !== undefined && {
          "Content-Length": String(response.ContentLength),
        }),
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      const body = response.Body;
      if (body instanceof Readable) {
        body.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
        body.pipe(res);
      } else if (body) {
        const readable = Readable.from(body as any);
        readable.pipe(res);
      } else {
        res.status(500).json({ error: "Empty response body from S3" });
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: S3FileRef;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}
