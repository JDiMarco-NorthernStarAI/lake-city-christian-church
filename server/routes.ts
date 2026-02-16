import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertSermonSchema, insertEventSchema, insertTeamMemberSchema,
  insertContactSchema, insertConnectCardSchema, siteSettings,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { seedDatabase } from "./seed";
import { XMLParser } from "fast-xml-parser";

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
    role: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
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
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
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

  await seedDatabase();

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
      req.session.role = user.role;
      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({ id: user.id, username: user.username, role: user.role });
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

  app.post("/api/sermons", requireAuth, async (req, res) => {
    const parsed = insertSermonSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const sermon = await storage.createSermon(parsed.data);
    res.status(201).json(sermon);
  });

  app.patch("/api/sermons/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateSermon(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/sermons/:id", requireAuth, async (req, res) => {
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

  app.post("/api/events", requireAuth, async (req, res) => {
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const event = await storage.createEvent(parsed.data);
    res.status(201).json(event);
  });

  app.patch("/api/events/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateEvent(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.get("/api/team", async (_req, res) => {
    const data = await storage.getTeamMembers();
    res.json(data);
  });

  app.post("/api/team", requireAuth, async (req, res) => {
    const parsed = insertTeamMemberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const member = await storage.createTeamMember(parsed.data);
    res.status(201).json(member);
  });

  app.patch("/api/team/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateTeamMember(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/team/:id", requireAuth, async (req, res) => {
    await storage.deleteTeamMember(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const submission = await storage.createContactSubmission(parsed.data);
    res.status(201).json(submission);
  });

  app.get("/api/contact", requireAuth, async (_req, res) => {
    const data = await storage.getContactSubmissions();
    res.json(data);
  });

  app.post("/api/connect", async (req, res) => {
    const parsed = insertConnectCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const card = await storage.createConnectCard(parsed.data);
    res.status(201).json(card);
  });

  app.get("/api/connect", requireAuth, async (_req, res) => {
    const data = await storage.getConnectCards();
    res.json(data);
  });

  app.get("/api/settings", async (_req, res) => {
    const data = await storage.getAllSettings();
    res.json(data);
  });

  app.put("/api/settings/:key", requireAdmin, async (req, res) => {
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

  app.put("/api/content/:page", requireAuth, async (req, res) => {
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

  app.get("/api/analytics/stats", requireAuth, async (_req, res) => {
    try {
      const stats = await storage.getPageViewStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  app.get("/api/users", requireAdmin, async (_req, res) => {
    const data = await storage.getUsers();
    const safe = data.map(({ password, ...rest }) => rest);
    res.json(safe);
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { username, password, role, assignedSections } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashed,
        role: role || "editor",
        assignedSections: assignedSections || null,
      });
      res.status(201).json({ id: user.id, username: user.username, role: user.role });
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.json({ message: "Deleted" });
  });

  return httpServer;
}
