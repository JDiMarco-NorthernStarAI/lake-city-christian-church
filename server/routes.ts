import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import webpush from "web-push";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { db, pool, getDbConnectionConfig } from "./db";
import {
  insertSermonSchema, insertEventSchema, insertTeamMemberSchema,
  insertContactSchema, insertConnectCardSchema, siteSettings,
  AVAILABLE_ROLES, AVAILABLE_FEATURES,
  createFormSchema, createFormFieldSchema,
  createDonationFundSchema, createCheckoutSchema,
  subscribePushSchema, sendNotificationSchema,
  insertSignupEventSchema, insertSignupSubmissionSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { seedDatabase } from "./seed";
import { XMLParser } from "fast-xml-parser";
import v1Router from "./v1-routes";
import { verifyAccessToken } from "./jwt";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any });
  }
  return _stripe;
}

const YOUTUBE_CHANNEL_ID = "UCHu7KSnAWdDbILKO4gC4JTQ";
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
}

let cachedVideos: YouTubeVideo[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000;

async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const now = Date.now();
  if (cachedVideos.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return cachedVideos;
  }

  try {
    const response = await fetch(YOUTUBE_RSS_URL);
    if (!response.ok) throw new Error(`YouTube RSS fetch failed: ${response.status}`);
    const xml = await response.text();

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const result = parser.parse(xml);
    const entries = result?.feed?.entry;
    if (!entries) return cachedVideos;

    const entryList = Array.isArray(entries) ? entries : [entries];
    cachedVideos = entryList.map((entry: any) => ({
      id: entry["yt:videoId"],
      title: entry.title,
      publishedAt: entry.published,
      thumbnail: `https://img.youtube.com/vi/${entry["yt:videoId"]}/maxresdefault.jpg`,
      description: entry["media:group"]?.["media:description"] || "",
    }));
    cacheTimestamp = now;
    return cachedVideos;
  } catch (err) {
    console.error("Error fetching YouTube RSS:", err);
    return cachedVideos;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: number;
    roles: string[];
    lastActivity: number;
  }
}

const ADMIN_TIMEOUT_MS = 30 * 60 * 1000;

function checkAdminTimeout(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) return next();
  const roles = req.session.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  if (!isAdmin) return next();
  if (req.session.lastActivity) {
    const elapsed = Date.now() - req.session.lastActivity;
    if (elapsed > ADMIN_TIMEOUT_MS) {
      return req.session.destroy(() => {
        res.status(401).json({ message: "Session expired due to inactivity" });
      });
    }
  }
  req.session.lastActivity = Date.now();
  req.session.touch();
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || !req.session.roles?.includes("super_admin")) {
    return res.status(403).json({ message: "Forbidden - Super Admin required" });
  }
  next();
}

function requireAdminOrSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const roles = req.session.roles || [];
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const roles = req.session.roles || [];
    if (roles.includes("super_admin")) {
      return next();
    }
    const enabledFeatures = await storage.getEnabledFeaturesForRoles(roles);
    if (enabledFeatures.includes(feature)) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden - insufficient permissions" });
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const pgSession = (await import("connect-pg-simple")).default;
  const PgStore = pgSession(session);

  app.use(
    session({
      store: new PgStore({
        pool,
      }),
      secret: process.env.SESSION_SECRET || "lake-city-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
      },
    })
  );

  // If no session exists, fall back to JWT token from Authorization header
  // This allows the admin dashboard to work with JWT auth stored in localStorage
  app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
    if (req.session?.userId) return next();
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const payload = verifyAccessToken(auth.slice(7));
      if (payload) {
        req.session.userId = payload.userId;
        req.session.roles = payload.roles;
        req.session.lastActivity = Date.now();
      }
    }
    next();
  });

  app.use("/api", checkAdminTimeout);

  await seedDatabase();

  // Health check endpoint (used by ALB target group)
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  registerObjectStorageRoutes(app);

  app.use("/api/v1", v1Router);

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.roles = user.roles;
      if (user.roles.includes("admin") || user.roles.includes("super_admin")) {
        req.session.lastActivity = Date.now();
      }
      const enabledFeatures = await storage.getEnabledFeaturesForRoles(user.roles);

      storage.createLoginActivity({
        userId: user.id,
        username: user.username,
        email: user.email || undefined,
        displayName: user.name || user.username,
        loginMethod: "password",
        source: "admin",
        ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"]?.slice(0, 500) || null,
      }).catch(() => {});

      res.json({ id: user.id, username: user.username, roles: user.roles, features: enabledFeatures });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.post("/api/auth/bridge", async (req, res) => {
    try {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }
      const payload = verifyAccessToken(auth.slice(7));
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (!user.roles.includes("admin") && !user.roles.includes("super_admin")) {
        return res.status(403).json({ message: "Not an admin" });
      }
      req.session.userId = user.id;
      req.session.roles = user.roles;
      req.session.lastActivity = Date.now();
      req.session.save((err) => {
        if (err) {
          console.error("Bridge session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        const enabledFeatures = storage.getEnabledFeaturesForRoles(user.roles);
        enabledFeatures.then((features) => {
          res.json({ id: user.id, username: user.username, roles: user.roles, features });
        });
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const enabledFeatures = await storage.getEnabledFeaturesForRoles(user.roles);
    res.json({ id: user.id, username: user.username, roles: user.roles, features: enabledFeatures });
  });

  app.get("/api/youtube/videos", async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 15, 15);
      const videos = await fetchYouTubeVideos();
      res.json(videos.slice(0, limit));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch YouTube videos" });
    }
  });

  app.get("/api/sermons", async (_req, res) => {
    const data = await storage.getSermons();
    res.json(data);
  });

  app.get("/api/sermons/:id", async (req, res) => {
    const sermon = await storage.getSermon(Number(req.params.id));
    if (!sermon) return res.status(404).json({ message: "Not found" });
    res.json(sermon);
  });

  app.post("/api/sermons", requireFeature("sermons"), async (req, res) => {
    const parsed = insertSermonSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const sermon = await storage.createSermon(parsed.data);
    res.status(201).json(sermon);
  });

  app.patch("/api/sermons/:id", requireFeature("sermons"), async (req, res) => {
    const updated = await storage.updateSermon(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/sermons/:id", requireFeature("sermons"), async (req, res) => {
    await storage.deleteSermon(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.get("/api/events", async (_req, res) => {
    const data = await storage.getEvents();
    res.json(data);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Not found" });
    res.json(event);
  });

  app.post("/api/events", requireFeature("events"), async (req, res) => {
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const event = await storage.createEvent(parsed.data);
    res.status(201).json(event);
  });

  app.patch("/api/events/:id", requireFeature("events"), async (req, res) => {
    const updated = await storage.updateEvent(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/events/:id", requireFeature("events"), async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.get("/api/team", async (_req, res) => {
    const data = await storage.getTeamMembers();
    res.json(data);
  });

  app.post("/api/team", requireFeature("team"), async (req, res) => {
    const parsed = insertTeamMemberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const member = await storage.createTeamMember(parsed.data);
    res.status(201).json(member);
  });

  app.patch("/api/team/:id", requireFeature("team"), async (req, res) => {
    const updated = await storage.updateTeamMember(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/team/:id", requireFeature("team"), async (req, res) => {
    await storage.deleteTeamMember(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.post("/api/team/:id/photo", requireFeature("team"), async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./replit_integrations/object_storage/objectStorage");
      const objStorage = new ObjectStorageService();
      const uploadURL = await objStorage.getObjectEntityUploadURL();
      const objectPath = objStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      console.error("Team photo upload URL error:", err);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.put("/api/team/:id/photo", requireFeature("team"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { objectPath } = req.body;
      if (!objectPath) return res.status(400).json({ message: "objectPath is required" });
      const updated = await storage.updateTeamMember(id, { photoUrl: objectPath });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const submission = await storage.createContactSubmission(parsed.data);

    if (parsed.data.email) {
      const { contactConfirmationEmail } = await import("./email-templates");
      const { sendEmail } = await import("./email-service");
      const tmpl = contactConfirmationEmail(parsed.data.name, parsed.data.message);
      sendEmail({ to: parsed.data.email, ...tmpl }).catch(() => {});
    }

    res.status(201).json(submission);
  });

  app.get("/api/admin/dashboard-stats", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const since = req.query.since ? new Date(req.query.since as string) : null;
      const [connectCardsAll, formSubsAll, signupSubsAll, messagesAll] = await Promise.all([
        storage.getConnectCards(),
        storage.getAllFormSubmissions(),
        storage.getAllSignupSubmissions(),
        storage.getContactSubmissions(),
      ]);
      const connectNew = since ? connectCardsAll.filter(c => c.createdAt && new Date(c.createdAt) > since).length : 0;
      const formSubsNew = since ? formSubsAll.filter(s => s.submittedAt && new Date(s.submittedAt) > since).length : 0;
      const signupSubsNew = since ? signupSubsAll.filter(s => s.createdAt && new Date(s.createdAt) > since).length : 0;
      const messagesNew = since ? messagesAll.filter(m => m.createdAt && new Date(m.createdAt) > since).length : 0;
      res.json({
        connectCards: { total: connectCardsAll.length, new: connectNew },
        formSubmissions: { total: formSubsAll.length, new: formSubsNew },
        signupSubmissions: { total: signupSubsAll.length, new: signupSubsNew },
        messages: { total: messagesAll.length, new: messagesNew },
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  app.get("/api/contact", requireFeature("messages"), async (_req, res) => {
    const data = await storage.getContactSubmissions();
    res.json(data);
  });

  app.post("/api/connect", async (req, res) => {
    const parsed = insertConnectCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const card = await storage.createConnectCard(parsed.data);

    if (parsed.data.email) {
      const { connectCardConfirmationEmail } = await import("./email-templates");
      const { sendEmail } = await import("./email-service");
      const tmpl = connectCardConfirmationEmail(parsed.data.firstName);
      sendEmail({ to: parsed.data.email, ...tmpl }).catch(() => {});
    }

    res.status(201).json(card);
  });

  app.get("/api/connect", requireFeature("connect"), async (_req, res) => {
    const data = await storage.getConnectCards();
    res.json(data);
  });

  app.delete("/api/connect/:id", requireFeature("connect"), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteConnectCard(id);
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.post("/api/connect/:id/forward", requireFeature("connect"), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { recipientEmail, recipientName } = req.body;
      if (!recipientEmail) return res.status(400).json({ message: "Recipient email is required" });
      const card = await storage.getConnectCard(id);
      if (!card) return res.status(404).json({ message: "Connect card not found" });

      const { sendEmail } = await import("./email-service");
      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const interests = card.interests?.map(esc).join(", ") || "None specified";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 8px;">
          <h2 style="color: #00D4FF; margin-bottom: 24px;">Connect Card Forwarded</h2>
          <p style="color: #ccc;">A connect card has been forwarded to you for follow-up.</p>
          <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong style="color: #00D4FF;">Name:</strong> ${esc(card.firstName)} ${esc(card.lastName)}</p>
            <p style="margin: 8px 0;"><strong style="color: #00D4FF;">Email:</strong> <a href="mailto:${esc(card.email)}" style="color: #00D4FF;">${esc(card.email)}</a></p>
            <p style="margin: 8px 0;"><strong style="color: #00D4FF;">Phone:</strong> ${card.phone ? esc(card.phone) : "Not provided"}</p>
            <p style="margin: 8px 0;"><strong style="color: #00D4FF;">Address:</strong> ${card.address ? esc(card.address) : "Not provided"}</p>
            <p style="margin: 8px 0;"><strong style="color: #00D4FF;">Interests:</strong> ${interests}</p>
            ${card.prayerRequest ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #333;"><p style="margin: 8px 0;"><strong style="color: #00D4FF;">Prayer Request:</strong></p><p style="color: #ccc; white-space: pre-wrap;">${esc(card.prayerRequest)}</p></div>` : ""}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">Submitted on ${card.createdAt ? new Date(card.createdAt).toLocaleDateString() : "Unknown"}</p>
        </div>
      `;
      const sent = await sendEmail({
        to: recipientEmail,
        subject: `Connect Card: ${card.firstName} ${card.lastName}${card.prayerRequest ? " (Prayer Request)" : ""}`,
        html,
      });
      if (sent) {
        res.json({ message: `Forwarded to ${recipientEmail}` });
      } else {
        res.json({ message: `Email service not configured. Would forward to ${recipientEmail}` });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to forward" });
    }
  });

  app.get("/api/settings", async (_req, res) => {
    const data = await storage.getAllSettings();
    res.json(data);
  });

  app.put("/api/settings/:key", requireFeature("settings"), async (req, res) => {
    const { value } = req.body;
    if (!value) return res.status(400).json({ message: "Value required" });
    await storage.setSetting(req.params.key, value);
    res.json({ message: "Updated" });
  });

  app.get("/api/content/:page", async (req, res) => {
    try {
      const page = req.params.page;
      const prefix = `content.${page}.`;
      const allSettings = await storage.getAllSettings();
      const pageContent: Record<string, string> = {};
      for (const s of allSettings) {
        if (s.key.startsWith(prefix)) {
          pageContent[s.key.slice(prefix.length)] = s.value;
        }
      }
      res.json(pageContent);
    } catch (err) {
      res.status(500).json({ message: "Error fetching content" });
    }
  });

  app.put("/api/content/:page", requireFeature("pages"), async (req, res) => {
    try {
      const page = req.params.page;
      const data = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ message: "Invalid content data" });
      }
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          const settingKey = `content.${page}.${key}`;
          if (value.trim() === "") {
            await db.delete(siteSettings).where(eq(siteSettings.key, settingKey));
          } else {
            await storage.setSetting(settingKey, value);
          }
        }
      }
      res.json({ message: "Content updated" });
    } catch (err) {
      res.status(500).json({ message: "Error saving content" });
    }
  });

  app.post("/api/analytics/pageview", async (req, res) => {
    try {
      const { path } = req.body;
      if (!path || typeof path !== "string") {
        return res.status(400).json({ message: "Path required" });
      }
      const forwarded = req.headers["x-forwarded-for"];
      const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
      const crypto = await import("crypto");
      const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
      await storage.createPageView({
        path,
        referrer: req.headers.referer || null,
        userAgent: req.headers["user-agent"] || null,
        ipHash,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ message: "Error tracking pageview" });
    }
  });

  app.get("/api/analytics/stats", requireFeature("analytics"), async (_req, res) => {
    try {
      const stats = await storage.getPageViewStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  app.get("/api/analytics/logins", requireFeature("analytics"), async (req, res) => {
    try {
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 500) : 100;
      const logins = await storage.getLoginActivity(limit);
      res.json(logins);
    } catch (err) {
      res.status(500).json({ message: "Error fetching login activity" });
    }
  });

  app.get("/api/analytics/report", requireFeature("analytics"), async (req, res) => {
    try {
      const { startDate, endDate, path, source } = req.query as Record<string, string | undefined>;
      const [views, logins] = await Promise.all([
        storage.getPageViewsFiltered({ startDate, endDate, path }),
        storage.getLoginActivityFiltered({ startDate, endDate, source }),
      ]);

      const totalViews = views.length;
      const uniqueVisitors = new Set(views.map(v => v.ipHash).filter(Boolean)).size;

      const pageCounts: Record<string, number> = {};
      for (const v of views) {
        pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
      }
      const topPages = Object.entries(pageCounts)
        .map(([p, count]) => ({ path: p, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const dayCounts: Record<string, number> = {};
      for (const v of views) {
        const d = new Date(v.createdAt).toISOString().split("T")[0];
        dayCounts[d] = (dayCounts[d] || 0) + 1;
      }
      const dailyBreakdown = Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        totalViews,
        uniqueVisitors,
        topPages,
        dailyBreakdown,
        totalLogins: logins.length,
        logins: logins.slice(0, 200),
        uniquePages: Object.keys(pageCounts),
      });
    } catch (err) {
      console.error("Analytics report error:", err);
      res.status(500).json({ message: "Error generating analytics report" });
    }
  });

  app.get("/api/users", requireFeature("users"), async (_req, res) => {
    const data = await storage.getUsers();
    const safe = data.map(({ password, ...rest }) => rest);
    res.json(safe);
  });

  app.post("/api/users", requireFeature("users"), async (req, res) => {
    try {
      const { username, password, roles, email, name, phone, address, city, state, zip, gender, dateOfBirth, maritalStatus, emergencyContactName, emergencyContactPhone, profilePhotoUrl } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const userRoles = Array.isArray(roles) && roles.length > 0 ? roles : ["member"];
      if (userRoles.includes("super_admin") && !req.session.roles?.includes("super_admin")) {
        return res.status(403).json({ message: "Only super admins can create super admin users" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashed,
        roles: userRoles,
        email: email || null,
        name: name || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        maritalStatus: maritalStatus || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        profilePhotoUrl: profilePhotoUrl || null,
      });
      const { password: _, ...safe } = user;
      res.status(201).json(safe);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/users/:id", requireFeature("users"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { username, password, roles, email, name, phone, address, city, state, zip, gender, dateOfBirth, maritalStatus, emergencyContactName, emergencyContactPhone, profilePhotoUrl } = req.body;
      const updateData: any = {};

      if (username) updateData.username = username;
      if (password) updateData.password = await bcrypt.hash(password, 10);
      if (Array.isArray(roles)) {
        if (roles.includes("super_admin") && !req.session.roles?.includes("super_admin")) {
          return res.status(403).json({ message: "Only super admins can assign super admin role" });
        }
        updateData.roles = roles;
      }
      if (email !== undefined) updateData.email = email || null;
      if (name !== undefined) updateData.name = name || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (address !== undefined) updateData.address = address || null;
      if (city !== undefined) updateData.city = city || null;
      if (state !== undefined) updateData.state = state || null;
      if (zip !== undefined) updateData.zip = zip || null;
      if (gender !== undefined) updateData.gender = gender || null;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
      if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus || null;
      if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName || null;
      if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone || null;
      if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = profilePhotoUrl || null;

      const updated = await storage.updateUser(userId, updateData);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:id", requireFeature("users"), async (req, res) => {
    const userId = Number(req.params.id);
    if (userId === req.session.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    await storage.deleteUser(userId);
    res.json({ message: "Deleted" });
  });

  app.post("/api/users/:id/photo", requireFeature("users"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { ObjectStorageService } = await import("./replit_integrations/object_storage/objectStorage");
      const objStorage = new ObjectStorageService();
      const uploadURL = await objStorage.getObjectEntityUploadURL();
      const objectPath = objStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err) {
      console.error("Admin upload URL error:", err);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.put("/api/users/:id/photo", requireFeature("users"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { objectPath } = req.body;
      if (!objectPath) return res.status(400).json({ message: "objectPath is required" });
      const updated = await storage.updateUser(userId, { profilePhotoUrl: objectPath });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/role-permissions", requireFeature("roles"), async (_req, res) => {
    const perms = await storage.getRolePermissions();
    res.json(perms);
  });

  app.put("/api/role-permissions", requireSuperAdmin, async (req, res) => {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "permissions array required" });
      }
      for (const p of permissions) {
        if (p.role && p.feature && typeof p.enabled === "boolean") {
          if (p.role === "super_admin") continue;
          await storage.setRolePermission(p.role, p.feature, p.enabled);
        }
      }
      res.json({ message: "Permissions updated" });
    } catch (err) {
      res.status(500).json({ message: "Error updating permissions" });
    }
  });

  app.get("/api/forms", requireFeature("forms"), async (_req, res) => {
    try {
      const data = await storage.getForms();
      const formsWithCounts = await Promise.all(
        data.map(async (form) => ({
          ...form,
          submissionCount: await storage.getFormSubmissionCount(form.id),
          fieldCount: (await storage.getFormFields(form.id)).length,
        }))
      );
      res.json(formsWithCounts);
    } catch (err) {
      res.status(500).json({ message: "Error fetching forms" });
    }
  });

  app.get("/api/forms/:id", requireFeature("forms"), async (req, res) => {
    try {
      const form = await storage.getForm(Number(req.params.id));
      if (!form) return res.status(404).json({ message: "Form not found" });
      const fields = await storage.getFormFields(form.id);
      res.json({ ...form, fields });
    } catch (err) {
      res.status(500).json({ message: "Error fetching form" });
    }
  });

  app.post("/api/forms", requireFeature("forms"), async (req, res) => {
    try {
      const parsed = createFormSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid form data" });
      const existing = await storage.getFormBySlug(parsed.data.slug);
      if (existing) return res.status(400).json({ message: "A form with this URL slug already exists" });
      const form = await storage.createForm({ ...parsed.data, createdBy: req.session.userId });
      res.status(201).json(form);
    } catch (err) {
      res.status(500).json({ message: "Error creating form" });
    }
  });

  app.patch("/api/forms/:id", requireFeature("forms"), async (req, res) => {
    try {
      const formId = Number(req.params.id);
      const form = await storage.getForm(formId);
      if (!form) return res.status(404).json({ message: "Form not found" });
      const parsed = createFormSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid form data" });
      if (parsed.data.slug && parsed.data.slug !== form.slug) {
        const existing = await storage.getFormBySlug(parsed.data.slug);
        if (existing) return res.status(400).json({ message: "A form with this URL slug already exists" });
      }
      const updated = await storage.updateForm(formId, parsed.data);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Error updating form" });
    }
  });

  app.delete("/api/forms/:id", requireFeature("forms"), async (req, res) => {
    try {
      await storage.deleteForm(Number(req.params.id));
      res.json({ message: "Form deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting form" });
    }
  });

  app.post("/api/forms/:id/duplicate", requireFeature("forms"), async (req, res) => {
    try {
      const original = await storage.getForm(Number(req.params.id));
      if (!original) return res.status(404).json({ message: "Form not found" });
      const fields = await storage.getFormFields(original.id);
      const newForm = await storage.createForm({
        title: `${original.title} (Copy)`,
        description: original.description,
        slug: `${original.slug}-copy-${Date.now()}`,
        status: "draft",
        submitButtonText: original.submitButtonText,
        successMessage: original.successMessage,
        requireAuth: original.requireAuth,
        allowMultiple: original.allowMultiple,
        createdBy: (req as any).session?.userId || original.createdBy,
      });
      for (const field of fields) {
        await storage.createFormField({
          formId: newForm.id,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          options: field.options,
          defaultValue: field.defaultValue,
          sortOrder: field.sortOrder,
        } as any);
      }
      res.status(201).json(newForm);
    } catch (err) {
      res.status(500).json({ message: "Error duplicating form" });
    }
  });

  app.get("/api/forms/:id/fields", requireFeature("forms"), async (req, res) => {
    try {
      const fields = await storage.getFormFields(Number(req.params.id));
      res.json(fields);
    } catch (err) {
      res.status(500).json({ message: "Error fetching fields" });
    }
  });

  app.post("/api/forms/:id/fields", requireFeature("forms"), async (req, res) => {
    try {
      const formId = Number(req.params.id);
      const form = await storage.getForm(formId);
      if (!form) return res.status(404).json({ message: "Form not found" });
      const parsed = createFormFieldSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid field data" });
      const existingFields = await storage.getFormFields(formId);
      const sortOrder = parsed.data.sortOrder ?? existingFields.length;
      const field = await storage.createFormField({ ...parsed.data, formId, sortOrder });
      res.status(201).json(field);
    } catch (err) {
      res.status(500).json({ message: "Error creating field" });
    }
  });

  app.patch("/api/forms/:formId/fields/:fieldId", requireFeature("forms"), async (req, res) => {
    try {
      const parsed = createFormFieldSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid field data" });
      const updated = await storage.updateFormField(Number(req.params.fieldId), parsed.data);
      if (!updated) return res.status(404).json({ message: "Field not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Error updating field" });
    }
  });

  app.delete("/api/forms/:formId/fields/:fieldId", requireFeature("forms"), async (req, res) => {
    try {
      await storage.deleteFormField(Number(req.params.fieldId));
      res.json({ message: "Field deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting field" });
    }
  });

  app.put("/api/forms/:id/fields/reorder", requireFeature("forms"), async (req, res) => {
    try {
      const { fieldIds } = req.body;
      if (!Array.isArray(fieldIds)) return res.status(400).json({ message: "fieldIds array required" });
      for (let i = 0; i < fieldIds.length; i++) {
        await storage.updateFormField(fieldIds[i], { sortOrder: i });
      }
      const fields = await storage.getFormFields(Number(req.params.id));
      res.json(fields);
    } catch (err) {
      res.status(500).json({ message: "Error reordering fields" });
    }
  });

  app.get("/api/forms/:id/submissions", requireFeature("forms"), async (req, res) => {
    try {
      const submissions = await storage.getFormSubmissions(Number(req.params.id));
      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching submissions" });
    }
  });

  app.delete("/api/forms/:formId/submissions/:subId", requireFeature("forms"), async (req, res) => {
    try {
      await storage.deleteFormSubmission(Number(req.params.subId));
      res.json({ message: "Submission deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting submission" });
    }
  });

  // ==================== DONATION FUND ROUTES (Admin) ====================
  app.get("/api/donation-funds", requireFeature("donations"), async (_req, res) => {
    try {
      const funds = await storage.getDonationFunds();
      res.json(funds);
    } catch (err) {
      res.status(500).json({ message: "Error fetching donation funds" });
    }
  });

  app.post("/api/donation-funds", requireFeature("donations"), async (req, res) => {
    try {
      const parsed = createDonationFundSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid data" });
      const existing = await storage.getDonationFundBySlug(parsed.data.slug);
      if (existing) return res.status(400).json({ message: "A fund with this slug already exists" });
      const fund = await storage.createDonationFund(parsed.data);
      res.status(201).json(fund);
    } catch (err) {
      res.status(500).json({ message: "Error creating donation fund" });
    }
  });

  app.patch("/api/donation-funds/:id", requireFeature("donations"), async (req, res) => {
    try {
      const updated = await storage.updateDonationFund(Number(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Fund not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Error updating fund" });
    }
  });

  app.delete("/api/donation-funds/:id", requireFeature("donations"), async (req, res) => {
    try {
      await storage.deleteDonationFund(Number(req.params.id));
      res.json({ message: "Fund deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting fund" });
    }
  });

  // ==================== DONATION ROUTES (Admin) ====================
  app.get("/api/donations", requireFeature("donations"), async (_req, res) => {
    try {
      const data = await storage.getDonations();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Error fetching donations" });
    }
  });

  app.get("/api/donations/stats", requireFeature("donations"), async (_req, res) => {
    try {
      const stats = await storage.getDonationStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Error fetching donation stats" });
    }
  });

  app.post("/api/donations/manual", requireFeature("donations"), async (req, res) => {
    try {
      const manualSchema = z.object({
        donorName: z.string().optional().default("Anonymous"),
        donorEmail: z.string().email().optional().nullable(),
        amountDollars: z.number().positive("Amount must be greater than 0"),
        fundId: z.number().int().optional().nullable(),
        paymentMethod: z.enum(["cash", "check", "other"]).optional().default("cash"),
        notes: z.string().optional().nullable(),
        donationDate: z.string().optional().nullable(),
      });
      const parsed = manualSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid data" });
      const { donorName, donorEmail, amountDollars, fundId, paymentMethod, notes, donationDate } = parsed.data;
      const amountCents = Math.round(amountDollars * 100);
      const donation = await storage.createDonation({
        donorName: donorName || "Anonymous",
        donorEmail: donorEmail || null,
        amountCents,
        fundId: fundId || null,
        frequency: "one_time",
        status: "completed",
        paymentMethod: paymentMethod || "cash",
        notes: notes || null,
        donationDate: donationDate ? new Date(donationDate) : new Date(),
      });
      res.json(donation);
    } catch (err) {
      res.status(500).json({ message: "Error creating manual donation" });
    }
  });

  app.get("/api/donations/report", requireFeature("donations"), async (req, res) => {
    try {
      const { startDate, endDate, donorEmail, fundId } = req.query;
      let allDonations = await storage.getDonations();
      if (startDate) {
        const start = new Date(startDate as string);
        allDonations = allDonations.filter((d) => {
          const dDate = d.donationDate || d.createdAt;
          return dDate && new Date(dDate) >= start;
        });
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        allDonations = allDonations.filter((d) => {
          const dDate = d.donationDate || d.createdAt;
          return dDate && new Date(dDate) <= end;
        });
      }
      if (donorEmail) {
        allDonations = allDonations.filter((d) => d.donorEmail === donorEmail);
      }
      if (fundId) {
        const fid = Number(fundId);
        allDonations = allDonations.filter((d) => d.fundId === fid);
      }
      const totalCents = allDonations.reduce((sum, d) => sum + d.amountCents, 0);
      res.json({ donations: allDonations, totalAmount: totalCents, totalCount: allDonations.length });
    } catch (err) {
      res.status(500).json({ message: "Error generating report" });
    }
  });

  // ==================== PUBLIC DONATION ROUTES ====================
  app.get("/api/public/donation-funds", async (_req, res) => {
    try {
      const funds = await storage.getActiveDonationFunds();
      res.json(funds);
    } catch (err) {
      res.status(500).json({ message: "Error fetching funds" });
    }
  });

  app.post("/api/public/donations/create-checkout", async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ message: "Online donations are not configured yet. Please contact the church office." });
      }
      const parsed = createCheckoutSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid data" });

      const { amountCents, frequency, fundSlug, donorName, donorEmail } = parsed.data;

      let fundId: number | null = null;
      let fundName = "General Donation";
      if (fundSlug) {
        const fund = await storage.getDonationFundBySlug(fundSlug);
        if (fund) {
          fundId = fund.id;
          fundName = fund.name;
        }
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      if (frequency === "one_time") {
        const session = await getStripe().checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: { name: `Donation - ${fundName}` },
              unit_amount: amountCents,
            },
            quantity: 1,
          }],
          mode: "payment",
          success_url: `${baseUrl}/give/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/give?cancelled=true`,
          customer_email: donorEmail || undefined,
          metadata: { fundId: fundId?.toString() || "", donorName: donorName || "", frequency },
        });

        const donation = await storage.createDonation({
          fundId,
          donorName: donorName || null,
          donorEmail: donorEmail || null,
          amountCents,
          frequency,
          status: "pending",
          stripeSessionId: session.id,
        });

        res.json({ url: session.url, donationId: donation.id });
      } else {
        const interval = frequency === "weekly" ? "week" : "month";
        const session = await getStripe().checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: { name: `Recurring Donation - ${fundName}` },
              unit_amount: amountCents,
              recurring: { interval },
            },
            quantity: 1,
          }],
          mode: "subscription",
          success_url: `${baseUrl}/give/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/give?cancelled=true`,
          customer_email: donorEmail || undefined,
          metadata: { fundId: fundId?.toString() || "", donorName: donorName || "", frequency },
        });

        const donation = await storage.createDonation({
          fundId,
          donorName: donorName || null,
          donorEmail: donorEmail || null,
          amountCents,
          frequency,
          status: "pending",
          stripeSessionId: session.id,
        });

        res.json({ url: session.url, donationId: donation.id });
      }
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });

  // ==================== MEDIA LIBRARY ====================
  app.get("/api/media", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const folder = req.query.folder as string | undefined;
      const items = await storage.getMedia(folder);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Server-side proxy upload to S3 (avoids CORS issues with direct S3 PUT)
  const multer = (await import("multer")).default;
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/media/upload", requireAdminOrSuperAdmin, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const folder = req.body.folder || "general";
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { s3Client } = await import("./replit_integrations/object_storage/objectStorage");

      const bucketName = process.env.S3_BUCKET_NAME;
      if (!bucketName) return res.status(500).json({ message: "S3_BUCKET_NAME not configured" });

      const { randomUUID } = await import("crypto");
      const key = `uploads/${randomUUID()}`;

      console.log(`S3 upload: bucket=${bucketName}, key=${key}, size=${file.buffer.length}, type=${file.mimetype}`);
      const putResult = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      console.log(`S3 upload result: ETag=${putResult.ETag}, status=${putResult.$metadata.httpStatusCode}`);

      // Verify the upload immediately
      const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
      try {
        const headResult = await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
        console.log(`S3 verify: exists=true, size=${headResult.ContentLength}`);
      } catch (verifyErr: any) {
        console.error(`S3 verify FAILED: ${verifyErr.name} ${verifyErr.message}`);
      }

      const objectPath = `/objects/${key}`;
      const mediaItem = await storage.createMedia({
        filename: file.originalname,
        objectPath,
        folder,
        contentType: file.mimetype,
        uploadedBy: req.session.userId,
      });

      res.json({ objectPath, media: mediaItem });
    } catch (err) {
      console.error("Media upload error:", err);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.delete("/api/media/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getMediaById(id);
      if (!item) return res.status(404).json({ message: "Not found" });

      // Delete from S3
      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const { s3Client } = await import("./replit_integrations/object_storage");
        const bucket = process.env.S3_BUCKET_NAME || "lc3-storage";
        const key = item.objectPath.replace(/^\/objects\//, "");
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch {}

      await storage.deleteMedia(id);
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // ==================== STRIPE WEBHOOK ====================
  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ message: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: "Webhook signature verification failed" });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const donation = await storage.getDonationByStripeSessionId(session.id);
          if (donation) {
            const updateData: any = {
              status: "completed",
              stripePaymentIntentId: session.payment_intent as string || null,
              stripeCustomerId: session.customer as string || null,
            };
            if (session.subscription) {
              updateData.stripeSubscriptionId = session.subscription as string;
            }
            if (session.customer_details?.email) {
              updateData.donorEmail = session.customer_details.email;
            }
            if (session.customer_details?.name) {
              updateData.donorName = session.customer_details.name;
            }
            await storage.updateDonation(donation.id, updateData);

            const finalEmail = updateData.donorEmail || donation.donorEmail;
            if (finalEmail) {
              const { donationReceiptEmail } = await import("./email-templates");
              const { sendEmail } = await import("./email-service");
              const fund = donation.fundId ? await storage.getDonationFund(donation.fundId) : null;
              const amountStr = `$${(donation.amountCents / 100).toFixed(2)}`;
              const tmpl = donationReceiptEmail(
                updateData.donorName || donation.donorName || "Friend",
                amountStr,
                fund?.name || "General",
                donation.frequency || "one_time",
                new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              );
              sendEmail({ to: finalEmail, ...tmpl }).catch(() => {});
            }
          }
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const existing = await storage.getDonationByStripeSubscriptionId(invoice.subscription as string);
            if (existing && invoice.lines?.data?.[0]) {
              await storage.createDonation({
                fundId: existing.fundId,
                donorName: existing.donorName,
                donorEmail: existing.donorEmail || invoice.customer_email || null,
                amountCents: invoice.amount_paid,
                frequency: existing.frequency,
                status: "completed",
                stripeSubscriptionId: invoice.subscription as string,
                stripePaymentIntentId: invoice.payment_intent as string || null,
                stripeCustomerId: invoice.customer as string || null,
              });
            }
          }
          break;
        }
        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          if (charge.payment_intent) {
            const allDonations = await storage.getDonations();
            const donation = allDonations.find(d => d.stripePaymentIntentId === charge.payment_intent);
            if (donation) {
              await storage.updateDonation(donation.id, { status: "refunded" });
            }
          }
          break;
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ message: "Error processing webhook" });
    }
  });

  function parseFieldOptions(options: any): Array<{ label: string; capacity?: number }> {
    if (!Array.isArray(options)) return [];
    return options.map((o: any) => {
      if (typeof o === "string") return { label: o };
      if (o && typeof o === "object" && o.label) return { label: o.label, capacity: o.capacity || undefined };
      return { label: String(o) };
    });
  }

  function computeOptionUsage(fieldId: number, options: Array<{ label: string; capacity?: number }>, submissions: any[]): Record<string, { capacity?: number; used: number; remaining?: number }> {
    const usage: Record<string, { capacity?: number; used: number; remaining?: number }> = {};
    for (const opt of options) {
      usage[opt.label] = { capacity: opt.capacity, used: 0, remaining: opt.capacity };
    }
    const fieldKey = String(fieldId);
    for (const sub of submissions) {
      const data = sub.data as Record<string, any>;
      const val = data[fieldId] ?? data[fieldKey];
      if (typeof val === "string" && usage[val] !== undefined) {
        usage[val].used++;
      } else if (Array.isArray(val)) {
        for (const v of val) {
          if (typeof v === "string" && usage[v] !== undefined) {
            usage[v].used++;
          }
        }
      }
    }
    for (const key of Object.keys(usage)) {
      if (usage[key].capacity) {
        usage[key].remaining = Math.max(0, usage[key].capacity! - usage[key].used);
      } else {
        usage[key].remaining = undefined;
      }
    }
    return usage;
  }

  app.get("/api/public/forms/:slug", async (req, res) => {
    try {
      const form = await storage.getFormBySlug(req.params.slug);
      if (!form || form.status !== "published") return res.status(404).json({ message: "Form not found" });
      const fields = await storage.getFormFields(form.id);
      const submissions = await storage.getFormSubmissions(form.id);
      const optionTypes = ["select", "radio", "checkbox_group"];
      const fieldsWithUsage = fields.map((field) => {
        if (!optionTypes.includes(field.fieldType) || !field.options) return field;
        const parsed = parseFieldOptions(field.options);
        const hasCapacity = parsed.some((o) => o.capacity);
        if (!hasCapacity) return field;
        const optionUsage = computeOptionUsage(field.id, parsed, submissions);
        return { ...field, optionUsage };
      });
      res.json({ ...form, fields: fieldsWithUsage });
    } catch (err) {
      res.status(500).json({ message: "Error fetching form" });
    }
  });

  app.post("/api/public/forms/:slug/submit", async (req, res) => {
    try {
      const form = await storage.getFormBySlug(req.params.slug);
      if (!form || form.status !== "published") return res.status(404).json({ message: "Form not found" });
      const fields = await storage.getFormFields(form.id);
      const data = req.body;
      if (!data || typeof data !== "object") return res.status(400).json({ message: "Submission data required" });
      for (const field of fields) {
        if (field.required && (!data[field.id] || (typeof data[field.id] === "string" && data[field.id].trim() === ""))) {
          return res.status(400).json({ message: `${field.label} is required` });
        }
      }
      const optionTypes = ["select", "radio", "checkbox_group"];
      const hasCapacityFields = fields.some((f) =>
        optionTypes.includes(f.fieldType) && f.options && parseFieldOptions(f.options).some((o) => o.capacity)
      );

      if (hasCapacityFields) {
        const result = await db.transaction(async (tx) => {
          const submissions = await storage.getFormSubmissions(form.id);
          for (const field of fields) {
            if (!optionTypes.includes(field.fieldType) || !field.options) continue;
            const parsed = parseFieldOptions(field.options);
            if (!parsed.some((o) => o.capacity)) continue;
            const usage = computeOptionUsage(field.id, parsed, submissions);
            const val = data[field.id];
            if (typeof val === "string" && usage[val] && usage[val].capacity && usage[val].remaining !== undefined && usage[val].remaining! <= 0) {
              return { error: `"${val}" for ${field.label} is full. Please choose a different option.` };
            }
            if (Array.isArray(val)) {
              for (const v of val) {
                if (typeof v === "string" && usage[v] && usage[v].capacity && usage[v].remaining !== undefined && usage[v].remaining! <= 0) {
                  return { error: `"${v}" for ${field.label} is full. Please choose a different option.` };
                }
              }
            }
          }
          const submission = await storage.createFormSubmission({ formId: form.id, data, userId: null });
          return { submission };
        });
        if ("error" in result) return res.status(400).json({ message: result.error });
        return res.status(201).json({ message: form.successMessage || "Thank you for your submission!", submission: result.submission });
      }

      const submission = await storage.createFormSubmission({ formId: form.id, data, userId: null });
      res.status(201).json({ message: form.successMessage || "Thank you for your submission!", submission });
    } catch (err) {
      res.status(500).json({ message: "Error submitting form" });
    }
  });

  // ======== PUSH NOTIFICATIONS ========

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:info@lakecitychristian.church",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  app.get("/api/push/vapid-key", (_req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(500).json({ message: "Push notifications not configured" });
    res.json({ publicKey: key });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const parsed = subscribePushSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid subscription" });

      const { endpoint, keys } = parsed.data;
      const existing = await storage.getPushSubscriptionByEndpoint(endpoint);

      if (existing) {
        await storage.updatePushSubscription(existing.id, {
          p256dh: keys.p256dh,
          auth: keys.auth,
          isActive: true,
          userAgent: req.headers["user-agent"] || null,
        });
        return res.json({ message: "Subscription updated" });
      }

      await storage.createPushSubscription({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: null,
        userAgent: req.headers["user-agent"] || null,
        deviceType: "web",
        isActive: true,
      });
      res.status(201).json({ message: "Subscribed successfully" });
    } catch (err) {
      console.error("Push subscribe error:", err);
      res.status(500).json({ message: "Error subscribing to push notifications" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ message: "Endpoint required" });
      await storage.deactivatePushSubscription(endpoint);
      res.json({ message: "Unsubscribed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error unsubscribing" });
    }
  });

  app.post("/api/notifications/send", requireAuth, requireFeature("notifications"), async (req, res) => {
    try {
      const parsed = sendNotificationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid notification" });

      const { title, body, type, url } = parsed.data;
      const subscriptions = await storage.getActivePushSubscriptions();

      const payload = JSON.stringify({
        title,
        body,
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        url: url || "/",
        type: type || "general",
      });

      let successCount = 0;
      let failureCount = 0;

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          successCount++;
        } catch (err: any) {
          failureCount++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await storage.deactivatePushSubscription(sub.endpoint);
          }
        }
      });

      await Promise.all(sendPromises);

      await storage.createNotificationLog({
        title,
        body,
        type: type || "general",
        url: url || null,
        payload: { title, body, type, url },
        successCount,
        failureCount,
      });

      res.json({ message: "Notification sent", successCount, failureCount, total: subscriptions.length });
    } catch (err) {
      console.error("Send notification error:", err);
      res.status(500).json({ message: "Error sending notification" });
    }
  });

  app.get("/api/notifications", requireAuth, requireFeature("notifications"), async (_req, res) => {
    try {
      const logs = await storage.getNotificationLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Error fetching notification logs" });
    }
  });

  app.get("/api/notifications/stats", requireAuth, requireFeature("notifications"), async (_req, res) => {
    try {
      const subscriberCount = await storage.getPushSubscriptionCount();
      const logs = await storage.getNotificationLogs();
      res.json({
        subscriberCount,
        totalSent: logs.length,
        lastSent: logs[0]?.sentAt || null,
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching notification stats" });
    }
  });

  // ============================================================
  // SIGN UPS - Public Endpoints
  // ============================================================

  app.get("/api/public/signups", async (_req, res) => {
    try {
      const events = await storage.getPublishedSignupEvents();
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Error fetching signup events" });
    }
  });

  app.get("/api/public/signups/:slug", async (req, res) => {
    try {
      const event = await storage.getSignupEventBySlug(req.params.slug);
      if (!event || event.status !== "published") {
        return res.status(404).json({ message: "Signup event not found" });
      }
      let form = null;
      let fields: any[] = [];
      if (event.formId) {
        form = await storage.getForm(event.formId);
        if (form) {
          fields = await storage.getFormFields(form.id);
        }
      }
      res.json({ event, form, fields });
    } catch (err) {
      res.status(500).json({ message: "Error fetching signup event" });
    }
  });

  app.post("/api/public/signups/:slug/submit", async (req, res) => {
    try {
      const event = await storage.getSignupEventBySlug(req.params.slug);
      if (!event || event.status !== "published") {
        return res.status(404).json({ message: "Signup event not found" });
      }
      const now = new Date();
      if (event.signupStartDate && now < new Date(event.signupStartDate)) {
        return res.status(400).json({ message: "Registration has not opened yet" });
      }
      if (event.signupEndDate && now > new Date(event.signupEndDate)) {
        return res.status(400).json({ message: "Registration has closed" });
      }
      let submissionStatus: "confirmed" | "waitlisted" = "confirmed";
      let waitlistPosition: number | null = null;
      if (event.maxSignups && event.currentSignupCount >= event.maxSignups) {
        if (!event.waitlistEnabled) {
          return res.status(400).json({ message: "This event is full" });
        }
        submissionStatus = "waitlisted";
        waitlistPosition = event.waitlistCount + 1;
      }
      let formSubmissionId: number | null = null;
      if (event.formId && req.body.formData) {
        const formSubmission = await storage.createFormSubmission({
          formId: event.formId,
          data: req.body.formData,
        });
        formSubmissionId = formSubmission.id;
      }
      const submission = await storage.createSignupSubmission({
        signupEventId: event.id,
        formSubmissionId,
        userId: req.session?.userId || null,
        signupNumber: event.currentSignupCount + 1,
        status: submissionStatus,
        waitlistPosition,
        guestCount: req.body.guestCount || 0,
      });
      if (submissionStatus === "waitlisted") {
        await storage.updateSignupEvent(event.id, {
          waitlistCount: event.waitlistCount + 1,
        });
      } else {
        await storage.incrementSignupCount(event.id);
      }
      res.json({
        submission,
        status: submissionStatus,
        waitlistPosition,
        postSubmissionSettings: event.postSubmissionSettings,
      });
    } catch (err) {
      console.error("Signup submission error:", err);
      res.status(500).json({ message: "Error submitting signup" });
    }
  });

  app.get("/api/public/signups/:slug/submissions", async (req, res) => {
    try {
      const event = await storage.getSignupEventBySlug(req.params.slug);
      if (!event) {
        return res.status(404).json({ message: "Signup event not found" });
      }
      const pss = (event.postSubmissionSettings as any) || {};
      const displayType = pss.displayType || "thank_you";
      if (displayType !== "summary_all" && displayType !== "summary_all_anonymous") {
        return res.status(403).json({ message: "Submissions are not publicly visible" });
      }
      const submissions = await storage.getSignupSubmissions(event.id);
      if (displayType === "summary_all_anonymous") {
        const anonymous = submissions.map(s => ({
          id: s.id,
          status: s.status,
          signupNumber: s.signupNumber,
          guestCount: s.guestCount,
          createdAt: s.createdAt,
        }));
        return res.json(anonymous);
      }
      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching submissions" });
    }
  });

  // ============================================================
  // SIGN UPS - Admin Endpoints
  // ============================================================

  app.get("/api/signups", requireFeature("signups"), async (_req, res) => {
    try {
      const events = await storage.getSignupEvents();
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Error fetching signup events" });
    }
  });

  app.get("/api/signups/:id", requireFeature("signups"), async (req, res) => {
    try {
      const event = await storage.getSignupEvent(Number(req.params.id));
      if (!event) return res.status(404).json({ message: "Signup event not found" });
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Error fetching signup event" });
    }
  });

  app.post("/api/signups", requireFeature("signups"), async (req, res) => {
    try {
      const parsed = insertSignupEventSchema.parse({
        ...req.body,
        createdBy: req.session.userId,
      });
      const event = await storage.createSignupEvent(parsed);
      res.json(event);
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      console.error("Create signup event error:", err);
      res.status(500).json({ message: "Error creating signup event" });
    }
  });

  app.patch("/api/signups/:id", requireFeature("signups"), async (req, res) => {
    try {
      const event = await storage.updateSignupEvent(Number(req.params.id), req.body);
      if (!event) return res.status(404).json({ message: "Signup event not found" });
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Error updating signup event" });
    }
  });

  app.delete("/api/signups/:id", requireFeature("signups"), async (req, res) => {
    try {
      await storage.deleteSignupEvent(Number(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting signup event" });
    }
  });

  app.get("/api/signups/:id/submissions", requireFeature("signups"), async (req, res) => {
    try {
      const submissions = await storage.getSignupSubmissions(Number(req.params.id));
      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching submissions" });
    }
  });

  app.patch("/api/signups/submissions/:id", requireFeature("signups"), async (req, res) => {
    try {
      const submission = await storage.updateSignupSubmission(Number(req.params.id), req.body);
      if (!submission) return res.status(404).json({ message: "Submission not found" });
      res.json(submission);
    } catch (err) {
      res.status(500).json({ message: "Error updating submission" });
    }
  });

  app.post("/api/signups/submissions/:id/checkin", requireFeature("signups"), async (req, res) => {
    try {
      const submission = await storage.updateSignupSubmission(Number(req.params.id), {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: req.session.userId,
      });
      if (!submission) return res.status(404).json({ message: "Submission not found" });
      res.json(submission);
    } catch (err) {
      res.status(500).json({ message: "Error checking in" });
    }
  });

  app.delete("/api/signups/submissions/:id", requireFeature("signups"), async (req, res) => {
    try {
      await storage.deleteSignupSubmission(Number(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting submission" });
    }
  });

  return httpServer;
}
