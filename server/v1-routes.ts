import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import {
  registerUserSchema, loginSchema, updateProfileSchema,
  createChildSchema, createEventV1Schema,
  createFormSchema, createFormFieldSchema,
  socialAuthSchema,
  EVENT_TYPES, AVAILABLE_ROLES, FORM_FIELD_TYPES,
} from "@shared/schema";
import {
  generateAccessToken, verifyAccessToken, generateRefreshToken,
  hashRefreshToken, getRefreshTokenExpiry,
} from "./jwt";
import { z } from "zod";
import crypto from "crypto";

const objectStorage = new ObjectStorageService();

const v1Router = Router();

function apiResponse(res: Response, statusCode: number, data: any = null, error: string | null = null, meta: any = null) {
  const body: any = { success: statusCode < 400, data, error };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function requireJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return apiResponse(res, 401, null, "Access token required");
  }
  const token = auth.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    return apiResponse(res, 401, null, "Invalid or expired access token");
  }
  (req as any).jwtUser = payload;
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).jwtUser;
    if (!user) return apiResponse(res, 401, null, "Not authenticated");
    const userRoles: string[] = user.roles || [];
    if (userRoles.includes("admin") || userRoles.includes("super_admin")) return next();
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole) return apiResponse(res, 403, null, "Insufficient permissions");
    next();
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).jwtUser;
  if (!user) return apiResponse(res, 401, null, "Not authenticated");
  const roles: string[] = user.roles || [];
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return apiResponse(res, 403, null, "Admin access required");
  }
  next();
}

function sanitizeUser(user: any) {
  const { password, ...safe } = user;
  return safe;
}

v1Router.post("/auth/register", async (req, res) => {
  try {
    const parsed = registerUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const existing = await storage.getUserByEmail(parsed.data.email);
    if (existing) {
      return apiResponse(res, 400, null, "Email already registered");
    }

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    const username = parsed.data.email;

    const smsConsented = parsed.data.smsConsent === true;
    const user = await storage.createUser({
      username,
      password: hashed,
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      zip: parsed.data.zip || null,
      dateOfBirth: parsed.data.dateOfBirth || null,
      roles: ["member"],
      smsOptIn: smsConsented,
      smsOptedInAt: smsConsented ? new Date() : null,
      smsOptedOutAt: smsConsented ? null : new Date(),
    });

    // Assign city groups if selected during registration
    if (parsed.data.cityGroupIds && parsed.data.cityGroupIds.length > 0) {
      await storage.setUserGroups(user.id, parsed.data.cityGroupIds, parsed.data.otherGroup || undefined);
    } else if (parsed.data.otherGroup) {
      await storage.setUserGroups(user.id, [], parsed.data.otherGroup);
    }

    // Auto-link any existing city group signup form submissions by email
    try {
      const existingSignups = await storage.getCityGroupSignups();
      const matchingSignups = existingSignups.filter(s => s.email.toLowerCase() === parsed.data.email.toLowerCase());
      for (const signup of matchingSignups) {
        if (signup.groupIds && signup.groupIds.length > 0) {
          const currentGroups = await storage.getUserCityGroups(user.id);
          const currentIds = currentGroups.map(g => g.cityGroupId);
          const newIds = signup.groupIds.filter(id => !currentIds.includes(id));
          for (const gid of newIds) {
            await storage.addUserToGroup({ userId: user.id, cityGroupId: gid });
          }
        }
      }
    } catch (linkErr) {
      console.error("Error auto-linking city group signups:", linkErr);
    }

    const deviceId = req.body.deviceId || "web-" + Date.now();
    const deviceName = req.body.deviceName || req.headers["user-agent"]?.slice(0, 100) || "Unknown";
    const deviceType = req.body.deviceType || "web";

    const accessToken = generateAccessToken({ userId: user.id, roles: user.roles });
    const refreshTokenRaw = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshTokenRaw);

    await storage.createRefreshToken({
      userId: user.id,
      tokenHash,
      deviceId,
      deviceName,
      deviceType,
      ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null,
      expiresAt: getRefreshTokenExpiry(),
    });

    if (user.email) {
      const { welcomeEmail } = await import("./email-templates");
      const { sendEmail } = await import("./email-service");
      const tmpl = welcomeEmail(parsed.data.name || user.username);
      sendEmail({ to: user.email, ...tmpl }).catch(() => {});
    }

    return apiResponse(res, 201, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refreshTokenRaw,
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return apiResponse(res, 400, null, "Email already registered");
    }
    console.error("Registration error:", err);
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/auth/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const user = await storage.getUserByEmail(parsed.data.email);
    if (!user || !user.password) {
      return apiResponse(res, 401, null, "Invalid credentials");
    }

    if (!user.isActive || user.deletedAt) {
      return apiResponse(res, 401, null, "Account is deactivated");
    }

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) {
      return apiResponse(res, 401, null, "Invalid credentials");
    }

    const deviceId = parsed.data.deviceId || "web-" + Date.now();
    const deviceName = parsed.data.deviceName || req.headers["user-agent"]?.slice(0, 100) || "Unknown";
    const deviceType = parsed.data.deviceType || "web";

    const accessToken = generateAccessToken({ userId: user.id, roles: user.roles });
    const refreshTokenRaw = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null;

    await storage.createRefreshToken({
      userId: user.id,
      tokenHash,
      deviceId,
      deviceName,
      deviceType,
      ipAddress: clientIp,
      expiresAt: getRefreshTokenExpiry(),
    });

    storage.createLoginActivity({
      userId: user.id,
      username: user.username,
      email: user.email || undefined,
      displayName: user.name || user.username,
      loginMethod: "password",
      source: deviceType === "web" ? "app" : deviceType,
      ipAddress: clientIp,
      userAgent: req.headers["user-agent"]?.slice(0, 500) || null,
    }).catch(() => {});

    return apiResponse(res, 200, {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refreshTokenRaw,
    });
  } catch (err) {
    console.error("Login error:", err);
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return apiResponse(res, 400, null, "Refresh token required");
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await storage.getRefreshTokenByHash(tokenHash);
    if (!storedToken) {
      return apiResponse(res, 401, null, "Invalid refresh token");
    }

    if (new Date() > storedToken.expiresAt) {
      await storage.deleteRefreshToken(storedToken.id);
      return apiResponse(res, 401, null, "Refresh token expired");
    }

    const user = await storage.getUser(storedToken.userId);
    if (!user || !user.isActive || user.deletedAt) {
      return apiResponse(res, 401, null, "User account not active");
    }

    await storage.deleteRefreshToken(storedToken.id);

    const accessToken = generateAccessToken({ userId: user.id, roles: user.roles });
    const newRefreshTokenRaw = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshTokenRaw);

    await storage.createRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      deviceId: storedToken.deviceId,
      deviceName: storedToken.deviceName,
      deviceType: storedToken.deviceType,
      ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null,
      expiresAt: getRefreshTokenExpiry(),
    });

    return apiResponse(res, 200, {
      accessToken,
      refreshToken: newRefreshTokenRaw,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/auth/logout", requireJwt, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const stored = await storage.getRefreshTokenByHash(tokenHash);
      if (stored) await storage.deleteRefreshToken(stored.id);
    }
    return apiResponse(res, 200, { message: "Logged out" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/auth/logout-all", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    await storage.deleteRefreshTokensByUserId(userId);
    return apiResponse(res, 200, { message: "Logged out from all devices" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/auth/me", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const user = await storage.getUser(userId);
    if (!user) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(user));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.put("/auth/me", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }
    const updateData: any = { ...parsed.data };
    if (parsed.data.smsOptIn !== undefined) {
      if (parsed.data.smsOptIn) {
        updateData.smsOptedInAt = new Date();
        updateData.smsOptedOutAt = null;
      } else {
        updateData.smsOptedOutAt = new Date();
        updateData.smsOptedInAt = null;
      }
    }
    const updated = await storage.updateUser(userId, updateData);
    if (!updated) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(updated));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.put("/auth/me/password", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return apiResponse(res, 400, null, "Current password and new password required");
    }
    if (newPassword.length < 8) {
      return apiResponse(res, 400, null, "New password must be at least 8 characters");
    }

    const user = await storage.getUser(userId);
    if (!user) return apiResponse(res, 404, null, "User not found");

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return apiResponse(res, 401, null, "Current password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(userId, { password: hashed });
    return apiResponse(res, 200, { message: "Password changed" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/auth/devices", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const tokens = await storage.getRefreshTokensByUserId(userId);
    const devices = tokens.map((t) => ({
      id: t.id,
      deviceId: t.deviceId,
      deviceName: t.deviceName,
      deviceType: t.deviceType,
      lastUsedAt: t.lastUsedAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));
    return apiResponse(res, 200, devices);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/auth/devices/:deviceId", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const deviceId = Number(req.params.deviceId);
    const tokens = await storage.getRefreshTokensByUserId(userId);
    const token = tokens.find((t) => t.id === deviceId);
    if (!token) return apiResponse(res, 404, null, "Device not found");
    await storage.deleteRefreshToken(token.id);
    return apiResponse(res, 200, { message: "Device logged out" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/events", async (req, res) => {
  try {
    const allEvents = await storage.getActiveEvents();
    let filtered = allEvents;

    const eventType = req.query.event_type as string;
    if (eventType && EVENT_TYPES.includes(eventType as any)) {
      filtered = filtered.filter((e) => e.eventType === eventType);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const eventsWithCounts = await Promise.all(
      paged.map(async (event) => {
        const signupCount = await storage.getEventSignupCount(event.id);
        return { ...event, signupCount, spotsRemaining: event.maxSignups ? event.maxSignups - signupCount : null };
      })
    );

    return apiResponse(res, 200, eventsWithCounts, null, paginationMeta(page, limit, total));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/events/upcoming", async (req, res) => {
  try {
    const allEvents = await storage.getActiveEvents();
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const upcoming = allEvents.filter((e) => {
      if (e.eventDate) {
        const d = new Date(e.eventDate);
        return d >= now && d <= thirtyDaysLater;
      }
      return e.isUpcoming;
    });

    const eventsWithCounts = await Promise.all(
      upcoming.map(async (event) => {
        const signupCount = await storage.getEventSignupCount(event.id);
        return { ...event, signupCount, spotsRemaining: event.maxSignups ? event.maxSignups - signupCount : null };
      })
    );

    return apiResponse(res, 200, eventsWithCounts);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/events/:id", async (req, res) => {
  try {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event || event.deletedAt) return apiResponse(res, 404, null, "Event not found");

    const signupCount = await storage.getEventSignupCount(event.id);
    return apiResponse(res, 200, {
      ...event,
      signupCount,
      spotsRemaining: event.maxSignups ? event.maxSignups - signupCount : null,
    });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/events", requireJwt, requireRole("admin", "student_ministry", "kids_ministry", "small_group"), async (req, res) => {
  try {
    const parsed = createEventV1Schema.safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const userId = (req as any).jwtUser.userId;
    const userRoles: string[] = (req as any).jwtUser.roles || [];

    if (!userRoles.includes("admin") && !userRoles.includes("super_admin")) {
      const roleTypeMap: Record<string, string> = {
        student_ministry: "student_ministry",
        kids_ministry: "kids_ministry",
        small_group: "small_group",
      };
      const allowedType = Object.entries(roleTypeMap).find(([role]) => userRoles.includes(role))?.[1];
      if (parsed.data.eventType && parsed.data.eventType !== allowedType && parsed.data.eventType !== "general") {
        return apiResponse(res, 403, null, "You can only create events for your ministry type");
      }
    }

    const eventData: any = {
      title: parsed.data.title,
      body: parsed.data.description || "",
      date: parsed.data.eventDate || new Date().toISOString().split("T")[0],
      eventType: parsed.data.eventType || "general",
      location: parsed.data.location || null,
      locationAddress: parsed.data.locationAddress || null,
      imageUrl: parsed.data.imageUrl || null,
      maxSignups: parsed.data.maxSignups || null,
      createdBy: userId,
      sendReminders: parsed.data.sendReminders ?? true,
      reminderHoursBefore: parsed.data.reminderHoursBefore ?? 24,
    };

    if (parsed.data.eventDate) {
      eventData.eventDate = new Date(parsed.data.eventDate);
    }
    if (parsed.data.endDate) {
      eventData.endDate = new Date(parsed.data.endDate);
    }
    if (parsed.data.signupDeadline) {
      eventData.signupDeadline = new Date(parsed.data.signupDeadline);
    }

    const event = await storage.createEvent(eventData);
    return apiResponse(res, 201, event);
  } catch (err) {
    console.error("Create event error:", err);
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.put("/events/:id", requireJwt, requireRole("admin", "student_ministry", "kids_ministry", "small_group"), async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = await storage.getEvent(eventId);
    if (!event || event.deletedAt) return apiResponse(res, 404, null, "Event not found");

    const userId = (req as any).jwtUser.userId;
    const userRoles: string[] = (req as any).jwtUser.roles || [];
    if (!userRoles.includes("admin") && !userRoles.includes("super_admin") && event.createdBy !== userId) {
      return apiResponse(res, 403, null, "You can only edit events you created");
    }

    const updateData: any = {};
    const allowed = ["title", "body", "eventType", "location", "locationAddress", "imageUrl", "maxSignups", "sendReminders", "reminderHoursBefore", "isActive"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }
    if (req.body.description !== undefined) updateData.body = req.body.description;
    if (req.body.eventDate) updateData.eventDate = new Date(req.body.eventDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);
    if (req.body.signupDeadline) updateData.signupDeadline = new Date(req.body.signupDeadline);

    const updated = await storage.updateEvent(eventId, updateData);
    return apiResponse(res, 200, updated);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/events/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = await storage.getEvent(eventId);
    if (!event) return apiResponse(res, 404, null, "Event not found");
    await storage.softDeleteEvent(eventId);
    return apiResponse(res, 200, { message: "Event deleted" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/events/:id/signup", requireJwt, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = (req as any).jwtUser.userId;

    const event = await storage.getEvent(eventId);
    if (!event || event.deletedAt || !event.isActive) {
      return apiResponse(res, 404, null, "Event not found or inactive");
    }

    if (event.signupDeadline && new Date() > event.signupDeadline) {
      return apiResponse(res, 400, null, "Signup deadline has passed");
    }

    const existing = await storage.getEventSignup(eventId, userId);
    if (existing && existing.status === "registered") {
      return apiResponse(res, 400, null, "Already signed up for this event");
    }

    let status = "registered";
    if (event.maxSignups) {
      const count = await storage.getEventSignupCount(eventId);
      if (count >= event.maxSignups) {
        status = "waitlist";
      }
    }

    if (existing) {
      const updated = await storage.updateEventSignup(existing.id, {
        status,
        signupDetails: req.body.signupDetails || existing.signupDetails,
      });
      return apiResponse(res, 200, updated);
    }

    const signup = await storage.createEventSignup({
      eventId,
      userId,
      status,
      signupDetails: req.body.signupDetails || null,
    });

    const user = await storage.getUser(userId);
    if (user?.email) {
      const { eventSignupConfirmationEmail } = await import("./email-templates");
      const { sendEmail } = await import("./email-service");
      const dateStr = event.startDate ? new Date(event.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD";
      const tmpl = eventSignupConfirmationEmail(user.displayName || user.username, event.title, dateStr, event.location, status);
      sendEmail({ to: user.email, ...tmpl }).catch(() => {});
    }

    return apiResponse(res, 201, signup);
  } catch (err: any) {
    if (err.code === "23505") {
      return apiResponse(res, 400, null, "Already signed up for this event");
    }
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/events/:id/signup", requireJwt, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = (req as any).jwtUser.userId;

    const existing = await storage.getEventSignup(eventId, userId);
    if (!existing) return apiResponse(res, 404, null, "Signup not found");

    await storage.updateEventSignup(existing.id, { status: "cancelled" });
    return apiResponse(res, 200, { message: "Signup cancelled" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/events/:id/signups", requireJwt, requireRole("admin", "student_ministry", "kids_ministry", "small_group"), async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const signups = await storage.getEventSignups(eventId);

    const enriched = await Promise.all(
      signups.map(async (s) => {
        const user = await storage.getUser(s.userId);
        return {
          ...s,
          userName: user?.name || user?.username || "Unknown",
          userEmail: user?.email || null,
          userPhone: user?.phone || null,
        };
      })
    );

    return apiResponse(res, 200, enriched);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/my/signups", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const signups = await storage.getUserSignups(userId);

    const enriched = await Promise.all(
      signups.map(async (s) => {
        const event = await storage.getEvent(s.eventId);
        return { ...s, event: event || null };
      })
    );

    return apiResponse(res, 200, enriched);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/my/signup-submissions", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const subs = await storage.getSignupSubmissionsByUserId(userId);

    const enriched = await Promise.all(
      subs.map(async (s) => {
        const event = await storage.getSignupEvent(s.signupEventId);
        return { ...s, signupEvent: event || null };
      })
    );

    return apiResponse(res, 200, enriched);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/my/donations", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const user = await storage.getUser(userId);
    if (!user || !user.email) return apiResponse(res, 200, []);

    const userDonations = await storage.getDonationsByEmail(user.email);

    const enriched = await Promise.all(
      userDonations.map(async (d) => {
        const fund = d.fundId ? await storage.getDonationFund(d.fundId) : null;
        return { ...d, fund: fund || null };
      })
    );

    return apiResponse(res, 200, enriched);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/my/form-submissions", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const subs = await storage.getFormSubmissionsByUserId(userId);

    const enriched = await Promise.all(
      subs.map(async (s) => {
        const form = await storage.getForm(s.formId);
        return { ...s, form: form || null };
      })
    );

    return apiResponse(res, 200, enriched);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/children", requireJwt, async (req, res) => {
  try {
    const parsed = createChildSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const userId = (req as any).jwtUser.userId;
    const child = await storage.createChild({
      parentUserId: userId,
      ...parsed.data,
      photoRelease: parsed.data.photoRelease ?? false,
    });
    return apiResponse(res, 201, child);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/children", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const kids = await storage.getChildrenByParent(userId);
    return apiResponse(res, 200, kids);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/children/:id", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const child = await storage.getChild(Number(req.params.id));
    if (!child || child.deletedAt) return apiResponse(res, 404, null, "Child not found");

    const userRoles: string[] = (req as any).jwtUser.roles || [];
    if (child.parentUserId !== userId && !userRoles.includes("kids_ministry") && !userRoles.includes("admin") && !userRoles.includes("super_admin")) {
      return apiResponse(res, 403, null, "Access denied");
    }
    return apiResponse(res, 200, child);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.put("/children/:id", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const child = await storage.getChild(Number(req.params.id));
    if (!child || child.deletedAt) return apiResponse(res, 404, null, "Child not found");
    if (child.parentUserId !== userId) {
      return apiResponse(res, 403, null, "You can only edit your own children's records");
    }

    const parsed = createChildSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const updated = await storage.updateChild(child.id, parsed.data);
    return apiResponse(res, 200, updated);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/children/:id", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const child = await storage.getChild(Number(req.params.id));
    if (!child || child.deletedAt) return apiResponse(res, 404, null, "Child not found");
    if (child.parentUserId !== userId) {
      return apiResponse(res, 403, null, "You can only delete your own children's records");
    }
    await storage.softDeleteChild(child.id);
    return apiResponse(res, 200, { message: "Child record deleted" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/children/all", requireJwt, requireRole("kids_ministry", "admin"), async (req, res) => {
  try {
    const allKids = await storage.getAllChildren();

    const enriched = await Promise.all(
      allKids.map(async (child) => {
        const parent = await storage.getUser(child.parentUserId);
        return {
          ...child,
          parentName: parent?.name || parent?.username || "Unknown",
          parentEmail: parent?.email || null,
          parentPhone: parent?.phone || null,
        };
      })
    );

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const total = enriched.length;
    const start = (page - 1) * limit;
    const paged = enriched.slice(start, start + limit);

    return apiResponse(res, 200, paged, null, paginationMeta(page, limit, total));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/users", requireJwt, requireAdmin, async (req, res) => {
  try {
    const allUsers = await storage.getActiveUsers();
    const safe = allUsers.map(sanitizeUser);

    const search = (req.query.search as string)?.toLowerCase();
    let filtered = safe;
    if (search) {
      filtered = safe.filter((u: any) =>
        (u.name || "").toLowerCase().includes(search) ||
        (u.email || "").toLowerCase().includes(search) ||
        (u.username || "").toLowerCase().includes(search)
      );
    }

    const roleFilter = req.query.role as string;
    if (roleFilter) {
      filtered = filtered.filter((u: any) => u.roles?.includes(roleFilter));
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return apiResponse(res, 200, paged, null, paginationMeta(page, limit, total));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/users/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(user));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.put("/users/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, phone, roles, isActive } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (Array.isArray(roles)) {
      const currentUserRoles: string[] = (req as any).jwtUser.roles || [];
      if (roles.includes("super_admin") && !currentUserRoles.includes("super_admin")) {
        return apiResponse(res, 403, null, "Only super admins can assign super admin role");
      }
      updateData.roles = roles;
    }

    const updated = await storage.updateUser(userId, updateData);
    if (!updated) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(updated));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.put("/users/:id/role", requireJwt, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) {
      return apiResponse(res, 400, null, "roles array required");
    }
    const currentUserRoles: string[] = (req as any).jwtUser.roles || [];
    if (roles.includes("super_admin") && !currentUserRoles.includes("super_admin")) {
      return apiResponse(res, 403, null, "Only super admins can assign super admin role");
    }
    const updated = await storage.updateUser(userId, { roles });
    if (!updated) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(updated));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/users/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const currentUserId = (req as any).jwtUser.userId;
    if (userId === currentUserId) {
      return apiResponse(res, 400, null, "Cannot delete your own account");
    }
    const updated = await storage.softDeleteUser(userId);
    if (!updated) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, { message: "User deactivated" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/users/:id/restore", requireJwt, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const updated = await storage.restoreUser(userId);
    if (!updated) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(updated));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/forms", async (_req, res) => {
  try {
    const data = await storage.getPublishedForms();
    return apiResponse(res, 200, data.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      slug: f.slug,
      requireAuth: f.requireAuth,
      allowMultiple: f.allowMultiple,
    })));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/forms/:slug", async (req, res) => {
  try {
    const form = await storage.getFormBySlug(req.params.slug);
    if (!form || form.status !== "published") {
      return apiResponse(res, 404, null, "Form not found");
    }
    const fields = await storage.getFormFields(form.id);
    return apiResponse(res, 200, {
      ...form,
      fields: fields.map((f) => ({
        id: f.id,
        label: f.label,
        fieldType: f.fieldType,
        required: f.required,
        placeholder: f.placeholder,
        helpText: f.helpText,
        options: f.options,
        defaultValue: f.defaultValue,
        sortOrder: f.sortOrder,
      })),
    });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/forms/:slug/submit", async (req, res) => {
  try {
    const form = await storage.getFormBySlug(req.params.slug);
    if (!form || form.status !== "published") {
      return apiResponse(res, 404, null, "Form not found");
    }
    const fields = await storage.getFormFields(form.id);
    const data = req.body;
    if (!data || typeof data !== "object") {
      return apiResponse(res, 400, null, "Submission data required");
    }
    for (const field of fields) {
      if (field.required) {
        const val = data[field.id];
        if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
          return apiResponse(res, 400, null, `${field.label} is required`);
        }
      }
    }
    let userId = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const payload = verifyAccessToken(auth.slice(7));
      if (payload) userId = payload.userId;
    }
    const submission = await storage.createFormSubmission({
      formId: form.id,
      data,
      userId,
    });
    return apiResponse(res, 201, {
      message: form.successMessage || "Thank you for your submission!",
      submissionId: submission.id,
    });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/admin/forms", requireJwt, requireAdmin, async (_req, res) => {
  try {
    const data = await storage.getForms();
    const formsWithCounts = await Promise.all(
      data.map(async (form) => ({
        ...form,
        submissionCount: await storage.getFormSubmissionCount(form.id),
        fieldCount: (await storage.getFormFields(form.id)).length,
      }))
    );
    return apiResponse(res, 200, formsWithCounts);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/admin/forms/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    const form = await storage.getForm(Number(req.params.id));
    if (!form) return apiResponse(res, 404, null, "Form not found");
    const fields = await storage.getFormFields(form.id);
    return apiResponse(res, 200, { ...form, fields });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/admin/forms", requireJwt, requireAdmin, async (req: any, res) => {
  try {
    const parsed = createFormSchema.safeParse(req.body);
    if (!parsed.success) return apiResponse(res, 400, null, parsed.error.errors[0]?.message || "Invalid form data");
    const existing = await storage.getFormBySlug(parsed.data.slug);
    if (existing) return apiResponse(res, 400, null, "A form with this URL slug already exists");
    const form = await storage.createForm({ ...parsed.data, createdBy: req.jwtPayload?.userId });
    return apiResponse(res, 201, form);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.patch("/admin/forms/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    const formId = Number(req.params.id);
    const form = await storage.getForm(formId);
    if (!form) return apiResponse(res, 404, null, "Form not found");
    const parsed = createFormSchema.partial().safeParse(req.body);
    if (!parsed.success) return apiResponse(res, 400, null, parsed.error.errors[0]?.message || "Invalid form data");
    if (parsed.data.slug && parsed.data.slug !== form.slug) {
      const existing = await storage.getFormBySlug(parsed.data.slug);
      if (existing) return apiResponse(res, 400, null, "A form with this URL slug already exists");
    }
    const updated = await storage.updateForm(formId, parsed.data);
    return apiResponse(res, 200, updated);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/admin/forms/:id", requireJwt, requireAdmin, async (req, res) => {
  try {
    await storage.deleteForm(Number(req.params.id));
    return apiResponse(res, 200, { message: "Form deleted" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/admin/forms/:id/fields", requireJwt, requireAdmin, async (req, res) => {
  try {
    const formId = Number(req.params.id);
    const form = await storage.getForm(formId);
    if (!form) return apiResponse(res, 404, null, "Form not found");
    const parsed = createFormFieldSchema.safeParse(req.body);
    if (!parsed.success) return apiResponse(res, 400, null, parsed.error.errors[0]?.message || "Invalid field data");
    const existingFields = await storage.getFormFields(formId);
    const sortOrder = parsed.data.sortOrder ?? existingFields.length;
    const field = await storage.createFormField({ ...parsed.data, formId, sortOrder });
    return apiResponse(res, 201, field);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.patch("/admin/forms/:formId/fields/:fieldId", requireJwt, requireAdmin, async (req, res) => {
  try {
    const parsed = createFormFieldSchema.partial().safeParse(req.body);
    if (!parsed.success) return apiResponse(res, 400, null, parsed.error.errors[0]?.message || "Invalid field data");
    const updated = await storage.updateFormField(Number(req.params.fieldId), parsed.data);
    if (!updated) return apiResponse(res, 404, null, "Field not found");
    return apiResponse(res, 200, updated);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/admin/forms/:formId/fields/:fieldId", requireJwt, requireAdmin, async (req, res) => {
  try {
    await storage.deleteFormField(Number(req.params.fieldId));
    return apiResponse(res, 200, { message: "Field deleted" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/admin/forms/:id/submissions", requireJwt, requireAdmin, async (req, res) => {
  try {
    const submissions = await storage.getFormSubmissions(Number(req.params.id));
    return apiResponse(res, 200, submissions);
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.delete("/admin/forms/:formId/submissions/:subId", requireJwt, requireAdmin, async (req, res) => {
  try {
    await storage.deleteFormSubmission(Number(req.params.subId));
    return apiResponse(res, 200, { message: "Submission deleted" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/config/form-field-types", (_req, res) => {
  const { FORM_FIELD_TYPE_LABELS } = require("@shared/schema");
  return apiResponse(res, 200, FORM_FIELD_TYPES.map((t: string) => ({ value: t, label: FORM_FIELD_TYPE_LABELS[t] || t })));
});

v1Router.get("/health", (_req, res) => {
  return apiResponse(res, 200, { status: "ok", timestamp: new Date().toISOString() });
});

// ======== FILE UPLOADS (V1 - JWT Auth) ========

v1Router.post("/uploads/request-url", requireJwt, async (req, res) => {
  try {
    const { name, contentType } = req.body;
    if (!name) return apiResponse(res, 400, null, "File name is required");
    const uploadURL = await objectStorage.getObjectEntityUploadURL();
    const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
    return apiResponse(res, 200, { uploadURL, objectPath, metadata: { name, contentType } });
  } catch (err) {
    console.error("Upload URL error:", err);
    return apiResponse(res, 500, null, "Failed to generate upload URL");
  }
});

v1Router.put("/auth/me/photo", requireJwt, async (req, res) => {
  try {
    const userId = (req as any).jwtUser.userId;
    const { objectPath } = req.body;
    if (!objectPath) return apiResponse(res, 400, null, "objectPath is required");
    const updated = await storage.updateUser(userId, { profilePhotoUrl: objectPath });
    if (!updated) return apiResponse(res, 404, null, "User not found");
    return apiResponse(res, 200, sanitizeUser(updated));
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/config/ministry-types", (_req, res) => {
  return apiResponse(res, 200, EVENT_TYPES.map((t) => ({ value: t, label: (EVENT_TYPE_LABELS as any)[t] || t })));
});

import { EVENT_TYPE_LABELS } from "@shared/schema";

v1Router.get("/config/roles", (_req, res) => {
  return apiResponse(res, 200, AVAILABLE_ROLES.map((r) => ({ value: r, label: (ROLE_LABELS as any)[r] || r })));
});

import { ROLE_LABELS, subscribePushSchema } from "@shared/schema";

// ======== PUSH NOTIFICATIONS (V1 - JWT Auth) ========

v1Router.post("/push/subscribe", requireJwt, async (req, res) => {
  try {
    const parsed = subscribePushSchema.safeParse(req.body);
    if (!parsed.success) return apiResponse(res, 400, null, parsed.error.errors[0]?.message || "Invalid subscription");

    const userId = (req as any).jwtUser.userId;
    const { endpoint, keys } = parsed.data;
    const existing = await storage.getPushSubscriptionByEndpoint(endpoint);

    if (existing) {
      await storage.updatePushSubscription(existing.id, {
        p256dh: keys.p256dh,
        auth: keys.auth,
        isActive: true,
        userId,
        userAgent: req.headers["user-agent"] || null,
      });
      return apiResponse(res, 200, { message: "Subscription updated" });
    }

    const sub = await storage.createPushSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      userAgent: req.headers["user-agent"] || null,
      deviceType: req.body.deviceType || "mobile",
      isActive: true,
    });
    return apiResponse(res, 201, { id: sub.id, message: "Subscribed successfully" });
  } catch (err) {
    console.error("V1 push subscribe error:", err);
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.post("/push/unsubscribe", requireJwt, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return apiResponse(res, 400, null, "Endpoint required");
    await storage.deactivatePushSubscription(endpoint);
    return apiResponse(res, 200, { message: "Unsubscribed successfully" });
  } catch (err) {
    return apiResponse(res, 500, null, "Server error");
  }
});

v1Router.get("/push/vapid-key", (_req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return apiResponse(res, 500, null, "Push notifications not configured");
  return apiResponse(res, 200, { publicKey: key });
});

// ==================== SOCIAL AUTH ====================

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

async function verifyGoogleToken(idToken: string): Promise<{ sub: string; email: string; name: string; picture?: string } | null> {
  try {
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture,
    };
  } catch (err) {
    console.error("Google token verification failed:", err);
    return null;
  }
}

async function verifyAppleToken(idToken: string): Promise<{ sub: string; email: string; name?: string } | null> {
  try {
    const jwt = await import("jsonwebtoken");
    const jwksClient = (await import("jwks-rsa")).default;

    const client = jwksClient({
      jwksUri: "https://appleid.apple.com/auth/keys",
      cache: true,
      cacheMaxAge: 86400000,
    });

    const decoded = jwt.default.decode(idToken, { complete: true });
    if (!decoded || !decoded.header?.kid) return null;

    const key = await client.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();

    const aud = process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID;
    const verifyOptions: any = {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
    };
    if (aud) verifyOptions.audience = aud;

    const payload: any = jwt.default.verify(idToken, signingKey, verifyOptions);

    if (!payload.sub) return null;

    return {
      sub: payload.sub,
      email: payload.email || `${payload.sub}@privaterelay.appleid.com`,
      name: payload.name,
    };
  } catch (err) {
    console.error("Apple token verification failed:", err);
    return null;
  }
}

async function handleSocialAuth(provider: string, providerId: string, email: string, name: string, profilePhotoUrl: string | null, req: any) {
  let user = await storage.getUserByAuthProvider(provider, providerId);

  if (!user) {
    user = await storage.getUserByEmail(email);
    if (user) {
      await storage.updateUser(user.id, {
        authProvider: provider,
        authProviderId: providerId,
        profilePhotoUrl: user.profilePhotoUrl || profilePhotoUrl,
      });
      user = (await storage.getUser(user.id))!;
    }
  }

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashed = await bcrypt.hash(randomPassword, 12);
    user = await storage.createUser({
      username: email,
      password: hashed,
      email,
      name,
      roles: ["member"],
      authProvider: provider,
      authProviderId: providerId,
      profilePhotoUrl,
    });
  }

  if (!user.isActive || user.deletedAt) {
    return null;
  }

  const deviceId = req.body.deviceId || `${provider}-${Date.now()}`;
  const deviceName = req.body.deviceName || req.headers["user-agent"]?.slice(0, 100) || "Unknown";
  const deviceType = req.body.deviceType || "web";

  const accessToken = generateAccessToken({ userId: user.id, roles: user.roles });
  const refreshTokenRaw = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshTokenRaw);

  await storage.createRefreshToken({
    userId: user.id,
    tokenHash,
    deviceId,
    deviceName,
    deviceType,
    ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null,
    expiresAt: getRefreshTokenExpiry(),
  });

  const { password, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken: refreshTokenRaw };
}

v1Router.get("/auth/config", (_req, res) => {
  apiResponse(res, 200, {
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    appleClientId: process.env.APPLE_CLIENT_ID || null,
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || null,
  });
});

v1Router.post("/auth/social", async (req, res) => {
  try {
    const parsed = socialAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiResponse(res, 400, null, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { provider, idToken } = parsed.data;

    if (provider === "google") {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return apiResponse(res, 503, null, "Google Sign-In is not configured");
      }

      const googleUser = await verifyGoogleToken(idToken);
      if (!googleUser) {
        return apiResponse(res, 401, null, "Invalid Google token");
      }

      const result = await handleSocialAuth("google", googleUser.sub, googleUser.email, googleUser.name, googleUser.picture || null, req);
      if (!result) {
        return apiResponse(res, 401, null, "Account is deactivated");
      }

      return apiResponse(res, 200, result);
    }

    if (provider === "apple") {
      const appleUser = await verifyAppleToken(idToken);
      if (!appleUser) {
        return apiResponse(res, 401, null, "Invalid Apple token");
      }

      const name = req.body.fullName || appleUser.name || appleUser.email.split("@")[0];
      const result = await handleSocialAuth("apple", appleUser.sub, appleUser.email, name, null, req);
      if (!result) {
        return apiResponse(res, 401, null, "Account is deactivated");
      }

      return apiResponse(res, 200, result);
    }

    return apiResponse(res, 400, null, "Unsupported provider");
  } catch (err) {
    console.error("Social auth error:", err);
    return apiResponse(res, 500, null, "Server error");
  }
});

export default v1Router;
