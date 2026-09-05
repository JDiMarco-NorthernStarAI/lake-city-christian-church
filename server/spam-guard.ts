import type { Request, RequestHandler } from "express";

// Lightweight bot protection for public form endpoints:
// 1. Honeypot: public forms include a hidden "website" field humans never see.
//    When it arrives filled, we pretend success so bots don't adapt.
// 2. Minimum fill time: forms stamp `formStartedAt` (ms epoch) when rendered;
//    a submission completed in under 3 seconds is bot-like. The field is
//    optional so older clients and API callers keep working.
// 3. Per-IP rate limit: at most `limit` submissions per endpoint per hour.

const WINDOW_MS = 60 * 60 * 1000;
const MIN_FILL_MS = 3000;
const buckets = new Map<string, number[]>();

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export function publicFormGuard(options: { limit?: number; fakeSuccess?: any; requireTimestamp?: boolean } = {}): RequestHandler {
  const limit = options.limit ?? 8;
  return (req, res, next) => {
    const body = req.body || {};

    const honeypotFilled = typeof body.website === "string" && body.website.trim() !== "";
    const started = Number(body.formStartedAt);
    const tooFast = body.formStartedAt !== undefined && Number.isFinite(started) && Date.now() - started < MIN_FILL_MS;
    // Our own forms always stamp formStartedAt, so on endpoints only they use,
    // a submission without it came from a bot posting straight to the API —
    // or from a tab loaded before this deploy, so ask for a refresh rather
    // than silently dropping anything.
    const missingTimestamp = options.requireTimestamp === true && body.formStartedAt === undefined;
    // Strip guard fields so they never reach validation or storage
    delete body.website;
    delete body.formStartedAt;
    if (honeypotFilled || tooFast) {
      return res.status(201).json(options.fakeSuccess ?? { message: "Thank you!" });
    }
    if (missingTimestamp) {
      return res.status(400).json({ message: "Please refresh the page and try again." });
    }

    const key = `${req.path}|${clientIp(req)}`;
    const now = Date.now();
    const times = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
    if (times.length >= limit) {
      return res.status(429).json({ message: "Too many submissions from this device. Please try again later." });
    }
    times.push(now);
    buckets.set(key, times);
    if (buckets.size > 5000) {
      buckets.forEach((v, k) => {
        if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
      });
    }
    next();
  };
}
