import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, unique, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const AVAILABLE_ROLES = [
  "member",
  "student_ministry",
  "kids_ministry",
  "small_group",
  "admin",
  "super_admin",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  member: "Member",
  student_ministry: "Student Ministry",
  kids_ministry: "Kids Ministry",
  small_group: "Small Group",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const AVAILABLE_FEATURES = [
  "dashboard",
  "analytics",
  "pages",
  "sermons",
  "events",
  "team",
  "messages",
  "connect",
  "settings",
  "users",
  "roles",
] as const;

export const FEATURE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  pages: "Page Content",
  sermons: "Sermons",
  events: "Events",
  team: "Team",
  messages: "Messages",
  connect: "Connect Cards",
  settings: "Settings",
  users: "User Management",
  roles: "Role Permissions",
};

export const EVENT_TYPES = [
  "kids_ministry",
  "student_ministry",
  "fellowship",
  "small_group",
  "general",
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  kids_ministry: "Kids Ministry",
  student_ministry: "Student Ministry",
  fellowship: "Fellowship",
  small_group: "Small Group",
  general: "General",
};

export const SIGNUP_STATUSES = ["registered", "waitlist", "cancelled"] as const;

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  roles: text("roles").array().notNull().default(sql`ARRAY['member']::text[]`),
  email: text("email").unique(),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  dateOfBirth: text("date_of_birth"),
  profilePhotoUrl: text("profile_photo_url"),
  authProvider: text("auth_provider").default("email"),
  authProviderId: text("auth_provider_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name"),
  deviceType: text("device_type").notNull().default("web"),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  role: text("role").notNull(),
  feature: text("feature").notNull(),
  enabled: boolean("enabled").notNull().default(false),
}, (table) => [
  unique().on(table.role, table.feature),
]);

export const sermons = pgTable("sermons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  date: text("date").notNull(),
  series: text("series"),
  description: text("description"),
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  date: text("date").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  isUpcoming: boolean("is_upcoming").notNull().default(true),
  eventType: text("event_type").default("general"),
  eventDate: timestamp("event_date"),
  endDate: timestamp("end_date"),
  location: text("location"),
  locationAddress: text("location_address"),
  maxSignups: integer("max_signups"),
  signupDeadline: timestamp("signup_deadline"),
  createdBy: integer("created_by"),
  sendReminders: boolean("send_reminders").default(true),
  reminderHoursBefore: integer("reminder_hours_before").default(24),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const eventSignups = pgTable("event_signups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  signupDetails: jsonb("signup_details"),
  status: text("status").notNull().default("registered"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.eventId, table.userId),
]);

export const children = pgTable("children", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentUserId: integer("parent_user_id").notNull(),
  childName: text("child_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  grade: text("grade"),
  allergies: text("allergies"),
  medicalNotes: text("medical_notes"),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  photoRelease: boolean("photo_release").notNull().default(false),
  profilePhotoUrl: text("profile_photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const teamMembers = pgTable("team_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const connectCards = pgTable("connect_cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  interests: text("interests").array(),
  prayerRequest: text("prayer_request"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const pageViews = pgTable("page_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSermonSchema = createInsertSchema(sermons).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export const insertContactSchema = createInsertSchema(contactSubmissions).omit({ id: true, createdAt: true });
export const insertConnectCardSchema = createInsertSchema(connectCards).omit({ id: true, createdAt: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });
export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({ id: true, createdAt: true });
export const insertEventSignupSchema = createInsertSchema(eventSignups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChildSchema = createInsertSchema(children).omit({ id: true, createdAt: true, updatedAt: true });

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.enum(["web", "ios", "android"]).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const createChildSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  dateOfBirth: z.string().optional(),
  grade: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone required"),
  photoRelease: z.boolean().optional(),
});

export const createEventV1Schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventType: z.enum(EVENT_TYPES).optional(),
  eventDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  locationAddress: z.string().optional(),
  imageUrl: z.string().optional(),
  maxSignups: z.number().int().positive().optional(),
  signupDeadline: z.string().optional(),
  sendReminders: z.boolean().optional(),
  reminderHoursBefore: z.number().int().positive().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSermon = z.infer<typeof insertSermonSchema>;
export type Sermon = typeof sermons.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertConnectCard = z.infer<typeof insertConnectCardSchema>;
export type ConnectCard = typeof connectCards.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export const insertPageViewSchema = createInsertSchema(pageViews).omit({ id: true, createdAt: true });
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertEventSignup = z.infer<typeof insertEventSignupSchema>;
export type EventSignup = typeof eventSignups.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;
