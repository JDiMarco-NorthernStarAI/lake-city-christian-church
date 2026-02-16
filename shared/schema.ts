import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
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

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  roles: text("roles").array().notNull().default(sql`ARRAY['member']::text[]`),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSermonSchema = createInsertSchema(sermons).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export const insertContactSchema = createInsertSchema(contactSubmissions).omit({ id: true, createdAt: true });
export const insertConnectCardSchema = createInsertSchema(connectCards).omit({ id: true, createdAt: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });

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
