import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertSermonSchema, insertEventSchema, insertTeamMemberSchema,
  insertContactSchema, insertConnectCardSchema, siteSettings,
  AVAILABLE_ROLES, AVAILABLE_FEATURES,
  createFormSchema, createFormFieldSchema,
  createDonationFundSchema, createCheckoutSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { seedDatabase } from "./seed";
import { XMLParser } from "fast-xml-parser";
import v1Router from "./v1-routes";

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
  }
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
      const enabledFeatures = await storage.getEnabledFeaturesForRoles(user.roles);
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

  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const submission = await storage.createContactSubmission(parsed.data);
    res.status(201).json(submission);
  });

  app.get("/api/contact", requireFeature("messages"), async (_req, res) => {
    const data = await storage.getContactSubmissions();
    res.json(data);
  });

  app.post("/api/connect", async (req, res) => {
    const parsed = insertConnectCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const card = await storage.createConnectCard(parsed.data);
    res.status(201).json(card);
  });

  app.get("/api/connect", requireFeature("connect"), async (_req, res) => {
    const data = await storage.getConnectCards();
    res.json(data);
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

  app.get("/api/users", requireFeature("users"), async (_req, res) => {
    const data = await storage.getUsers();
    const safe = data.map(({ password, ...rest }) => rest);
    res.json(safe);
  });

  app.post("/api/users", requireFeature("users"), async (req, res) => {
    try {
      const { username, password, roles } = req.body;
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
      });
      res.status(201).json({ id: user.id, username: user.username, roles: user.roles });
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
      const { username, password, roles } = req.body;
      const updateData: any = {};

      if (username) updateData.username = username;
      if (password) updateData.password = await bcrypt.hash(password, 10);
      if (Array.isArray(roles)) {
        if (roles.includes("super_admin") && !req.session.roles?.includes("super_admin")) {
          return res.status(403).json({ message: "Only super admins can assign super admin role" });
        }
        updateData.roles = roles;
      }

      const updated = await storage.updateUser(userId, updateData);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ id: updated.id, username: updated.username, roles: updated.roles });
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

  app.get("/api/public/forms/:slug", async (req, res) => {
    try {
      const form = await storage.getFormBySlug(req.params.slug);
      if (!form || form.status !== "published") return res.status(404).json({ message: "Form not found" });
      const fields = await storage.getFormFields(form.id);
      res.json({ ...form, fields });
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
      const submission = await storage.createFormSubmission({
        formId: form.id,
        data,
        userId: null,
      });
      res.status(201).json({ message: form.successMessage || "Thank you for your submission!", submission });
    } catch (err) {
      res.status(500).json({ message: "Error submitting form" });
    }
  });

  return httpServer;
}
