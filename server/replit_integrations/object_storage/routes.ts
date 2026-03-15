import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError, s3Client } from "./objectStorage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://<bucket>.s3.<region>.amazonaws.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", (req, res, next) => {
    if (!(req.session as any)?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  }, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      // Strip "/objects/" prefix to get the S3 key
      const key = req.path.slice("/objects/".length);
      if (!key) {
        return res.status(404).json({ error: "Object not found" });
      }

      const bucket = process.env.S3_BUCKET_NAME;
      if (!bucket) {
        return res.status(500).json({ error: "S3 not configured" });
      }

      // Stream the object directly from S3
      console.log(`S3 GET: bucket=${bucket}, key=${key}, path=${req.path}`);
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3Client.send(command);

      if (response.ContentType) {
        res.set("Content-Type", response.ContentType);
      }
      if (response.ContentLength !== undefined) {
        res.set("Content-Length", String(response.ContentLength));
      }
      res.set("Cache-Control", "public, max-age=3600");

      const { Readable } = await import("stream");
      const body = response.Body;
      if (body instanceof Readable) {
        body.pipe(res);
      } else if (body) {
        const readable = Readable.from(body as any);
        readable.pipe(res);
      } else {
        res.status(500).json({ error: "Empty response from S3" });
      }
    } catch (error: any) {
      console.error("Error serving object:", error?.name, error?.message, error?.$metadata?.httpStatusCode);
      if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

