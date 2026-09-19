import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Vite fingerprints everything under /assets (index-Dv75AP9P.js etc.), so
  // those files can be cached forever — a new deploy produces new filenames.
  // index.html must NOT be cached (no-cache = revalidate on every load), or
  // browsers keep loading last week's bundle and admins don't see updates.
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  app.use("/{*path}", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(indexPath, "utf-8");
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    const baseUrl = `${protocol}://${host}`;
    html = html.replace(/content="\/og-logo\.png"/g, `content="${baseUrl}/og-logo.png"`);
    res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(html);
  });
}
