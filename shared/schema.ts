import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, unique, decimal, jsonb, serial, time } from "drizzle-orm/pg-core";
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
  "forms",
  "donations",
  "notifications",
  "sms",
  "signups",
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
  forms: "Form Builder",
  donations: "Donations",
  notifications: "Notifications",
  sms: "SMS / Text Messages",
  signups: "Sign Ups",
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

export const DONATION_FREQUENCIES = ["one_time", "weekly", "monthly"] as const;
export const DONATION_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

export const NOTIFICATION_TYPES = ["general", "sermon", "event", "announcement"] as const;

export const SMS_GROUP_TYPES = ["all", "role_based", "ministry", "custom", "event_based"] as const;
export const SMS_MESSAGE_TYPES = ["broadcast", "individual", "scheduled", "automated"] as const;
export const SMS_DELIVERY_CHANNELS = ["sms", "push", "both"] as const;
export const SMS_MESSAGE_STATUSES = ["draft", "scheduled", "sending", "sent", "partially_sent", "failed", "cancelled"] as const;
export const SMS_RECIPIENT_STATUSES = ["pending", "queued", "sent", "delivered", "failed", "undelivered", "opted_out"] as const;
export const SMS_OPT_OUT_METHODS = ["reply_stop", "manual", "admin", "user_preference"] as const;
export const SMS_OPT_IN_METHODS = ["reply_start", "manual", "admin", "user_preference"] as const;
export const SMS_TEMPLATE_CATEGORIES = ["reminder", "announcement", "welcome", "emergency", "custom"] as const;
export const PHONE_TYPES = ["mobile", "landline", "voip", "unknown"] as const;

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  general: "General",
  sermon: "New Sermon",
  event: "Event",
  announcement: "Announcement",
};

export const FORM_STATUSES = ["draft", "published", "archived"] as const;

export const FORM_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "checkbox_group",
] as const;

export const FORM_FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Short Text",
  textarea: "Long Text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  radio: "Radio Buttons",
  checkbox: "Checkbox (Yes/No)",
  checkbox_group: "Limited Items Signup",
};

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
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  maritalStatus: text("marital_status"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  profilePhotoUrl: text("profile_photo_url"),
  authProvider: text("auth_provider").default("email"),
  authProviderId: text("auth_provider_id"),
  smsOptIn: boolean("sms_opt_in").notNull().default(false),
  smsOptedInAt: timestamp("sms_opted_in_at"),
  smsOptedOutAt: timestamp("sms_opted_out_at"),
  phoneType: text("phone_type").notNull().default("unknown"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  phoneCarrier: text("phone_carrier"),
  phoneCountryCode: text("phone_country_code").notNull().default("US"),
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

export const forms = pgTable("forms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"),
  submitButtonText: text("submit_button_text").default("Submit"),
  successMessage: text("success_message").default("Thank you for your submission!"),
  requireAuth: boolean("require_auth").notNull().default(false),
  allowMultiple: boolean("allow_multiple").notNull().default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formFields = pgTable("form_fields", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  formId: integer("form_id").notNull(),
  label: text("label").notNull(),
  fieldType: text("field_type").notNull().default("text"),
  required: boolean("required").notNull().default(false),
  placeholder: text("placeholder"),
  helpText: text("help_text"),
  options: jsonb("options"),
  defaultValue: text("default_value"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const formSubmissions = pgTable("form_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  formId: integer("form_id").notNull(),
  userId: integer("user_id"),
  data: jsonb("data").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const donationFunds = pgTable("donation_funds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const donations = pgTable("donations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fundId: integer("fund_id"),
  donorName: text("donor_name"),
  donorEmail: text("donor_email"),
  amountCents: integer("amount_cents").notNull(),
  frequency: text("frequency").notNull().default("one_time"),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("stripe"),
  notes: text("notes"),
  donationDate: timestamp("donation_date"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  smsConsent: z.boolean().optional(),
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
  gender: z.enum(["Male", "Female"]).nullable().optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(["Single", "Married", "Widowed"]).nullable().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  smsOptIn: z.boolean().optional(),
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

export const insertFormSchema = createInsertSchema(forms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFormFieldSchema = createInsertSchema(formFields).omit({ id: true });
export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({ id: true, submittedAt: true });

export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof forms.$inferSelect;
export type InsertFormField = z.infer<typeof insertFormFieldSchema>;
export type FormField = typeof formFields.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

export const insertDonationFundSchema = createInsertSchema(donationFunds).omit({ id: true, createdAt: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertDonationFund = z.infer<typeof insertDonationFundSchema>;
export type DonationFund = typeof donationFunds.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

export const createDonationFundSchema = z.object({
  name: z.string().min(1, "Fund name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  deviceType: text("device_type").default("web"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationLogs = pgTable("notification_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("general"),
  url: text("url"),
  payload: jsonb("payload"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({ id: true, sentAt: true });
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

export const subscribePushSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const sendNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  url: z.string().optional(),
});

// ======== SMS / TEXT MESSAGING TABLES ========

export const smsGroups = pgTable("sms_groups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  groupType: text("group_type").notNull().default("custom"),
  filterCriteria: jsonb("filter_criteria"),
  isActive: boolean("is_active").notNull().default(true),
  memberCount: integer("member_count").notNull().default(0),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsGroupMembers = pgTable("sms_group_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  addedBy: integer("added_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.groupId, table.userId),
]);

export const userTags = pgTable("user_tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  tag: text("tag").notNull(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.tag),
]);

export const smsMessages = pgTable("sms_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupId: integer("group_id"),
  senderId: integer("sender_id").notNull(),
  messageBody: text("message_body").notNull(),
  messageType: text("message_type").notNull().default("broadcast"),
  deliveryChannel: text("delivery_channel").notNull().default("sms"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("draft"),
  recipientCount: integer("recipient_count").notNull().default(0),
  smsDeliveredCount: integer("sms_delivered_count").notNull().default(0),
  smsFailedCount: integer("sms_failed_count").notNull().default(0),
  pushDeliveredCount: integer("push_delivered_count").notNull().default(0),
  pushFailedCount: integer("push_failed_count").notNull().default(0),
  estimatedCost: text("estimated_cost"),
  actualCost: text("actual_cost"),
  segmentCount: integer("segment_count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsRecipients = pgTable("sms_recipients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  messageId: integer("message_id").notNull(),
  userId: integer("user_id").notNull(),
  phoneNumber: text("phone_number"),
  channel: text("channel").notNull().default("sms"),
  twilioMessageSid: text("twilio_message_sid"),
  status: text("status").notNull().default("pending"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  cost: text("cost"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsOptOuts = pgTable("sms_opt_outs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: text("phone_number").notNull().unique(),
  userId: integer("user_id"),
  optedOutAt: timestamp("opted_out_at").notNull().defaultNow(),
  optOutMethod: text("opt_out_method").notNull().default("manual"),
  optedBackInAt: timestamp("opted_back_in_at"),
  optInMethod: text("opt_in_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const smsTemplates = pgTable("sms_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables"),
  category: text("category").notNull().default("custom"),
  isActive: boolean("is_active").notNull().default(true),
  useCount: integer("use_count").notNull().default(0),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsSettings = pgTable("sms_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  twilioPhoneNumber: text("twilio_phone_number"),
  churchNamePrefix: text("church_name_prefix").notNull().default("Lake City Christian: "),
  dailyLimit: integer("daily_limit").notNull().default(1000),
  monthlyLimit: integer("monthly_limit").notNull().default(10000),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(true),
  quietHoursStart: text("quiet_hours_start").notNull().default("21:00"),
  quietHoursEnd: text("quiet_hours_end").notNull().default("08:00"),
  quietHoursTimezone: text("quiet_hours_timezone").notNull().default("America/New_York"),
  autoReplyEnabled: boolean("auto_reply_enabled").notNull().default(true),
  autoReplyMessage: text("auto_reply_message").notNull().default("Thanks for your message! For immediate assistance, please call the church office. This is an automated system that does not receive replies."),
  optOutConfirmation: text("opt_out_confirmation").notNull().default("You've been unsubscribed from Lake City Christian Church texts. Reply START to resubscribe."),
  optInConfirmation: text("opt_in_confirmation").notNull().default("You're now subscribed to Lake City Christian Church texts. Reply STOP to unsubscribe."),
  includeOptOutFooter: boolean("include_opt_out_footer").notNull().default(true),
  messagesSentToday: integer("messages_sent_today").notNull().default(0),
  messagesSentThisMonth: integer("messages_sent_this_month").notNull().default(0),
  costThisMonth: text("cost_this_month").notNull().default("0.00"),
  lastDailyReset: timestamp("last_daily_reset"),
  lastMonthlyReset: timestamp("last_monthly_reset"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsIncomingMessages = pgTable("sms_incoming_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fromNumber: text("from_number").notNull(),
  userId: integer("user_id"),
  messageBody: text("message_body").notNull(),
  twilioMessageSid: text("twilio_message_sid"),
  isOptOut: boolean("is_opt_out").notNull().default(false),
  isOptIn: boolean("is_opt_in").notNull().default(false),
  requiresResponse: boolean("requires_response").notNull().default(false),
  responded: boolean("responded").notNull().default(false),
  respondedBy: integer("responded_by"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ======== SMS INSERT SCHEMAS & TYPES ========

export const insertSmsGroupSchema = createInsertSchema(smsGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmsGroupMemberSchema = createInsertSchema(smsGroupMembers).omit({ id: true, createdAt: true });
export const insertUserTagSchema = createInsertSchema(userTags).omit({ id: true, createdAt: true });
export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmsRecipientSchema = createInsertSchema(smsRecipients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmsOptOutSchema = createInsertSchema(smsOptOuts).omit({ id: true, createdAt: true });
export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({ id: true, updatedAt: true });
export const insertSmsIncomingMessageSchema = createInsertSchema(smsIncomingMessages).omit({ id: true, createdAt: true });

export type SmsGroup = typeof smsGroups.$inferSelect;
export type InsertSmsGroup = z.infer<typeof insertSmsGroupSchema>;
export type SmsGroupMember = typeof smsGroupMembers.$inferSelect;
export type InsertSmsGroupMember = z.infer<typeof insertSmsGroupMemberSchema>;
export type UserTag = typeof userTags.$inferSelect;
export type InsertUserTag = z.infer<typeof insertUserTagSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsRecipient = typeof smsRecipients.$inferSelect;
export type InsertSmsRecipient = z.infer<typeof insertSmsRecipientSchema>;
export type SmsOptOut = typeof smsOptOuts.$inferSelect;
export type InsertSmsOptOut = z.infer<typeof insertSmsOptOutSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsSettings = typeof smsSettings.$inferSelect;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type SmsIncomingMessage = typeof smsIncomingMessages.$inferSelect;
export type InsertSmsIncomingMessage = z.infer<typeof insertSmsIncomingMessageSchema>;

// ======== SMS VALIDATION SCHEMAS ========

export const createSmsGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  groupType: z.enum(SMS_GROUP_TYPES),
  filterCriteria: z.object({
    roles: z.array(z.string()).optional(),
    ministries: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    includeUserIds: z.array(z.number()).optional(),
    excludeUserIds: z.array(z.number()).optional(),
    hasChildren: z.boolean().nullable().optional(),
    phoneVerifiedOnly: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

export const createSmsTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  body: z.string().min(1, "Template body is required").max(1600, "Max 1600 characters"),
  variables: z.array(z.string()).optional(),
  category: z.enum(SMS_TEMPLATE_CATEGORIES),
  isActive: z.boolean().optional(),
});

export const sendSmsMessageSchema = z.object({
  groupId: z.number().int().optional().nullable(),
  userIds: z.array(z.number().int()).optional().nullable(),
  messageBody: z.string().min(1, "Message is required").max(1600, "Max 1600 characters"),
  deliveryChannel: z.enum(SMS_DELIVERY_CHANNELS),
  templateId: z.number().int().optional().nullable(),
  personalize: z.boolean().optional(),
  respectQuietHours: z.boolean().optional(),
  scheduleFor: z.string().optional().nullable(),
});

export const updateSmsSettingsSchema = z.object({
  churchNamePrefix: z.string().optional(),
  dailyLimit: z.number().int().positive().optional(),
  monthlyLimit: z.number().int().positive().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  quietHoursTimezone: z.string().optional(),
  autoReplyEnabled: z.boolean().optional(),
  autoReplyMessage: z.string().optional(),
  optOutConfirmation: z.string().optional(),
  optInConfirmation: z.string().optional(),
  includeOptOutFooter: z.boolean().optional(),
});

export const socialAuthSchema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1, "ID token is required"),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.enum(["web", "ios", "android"]).optional(),
});

export const createCheckoutSchema = z.object({
  amountCents: z.number().int().positive("Amount must be positive"),
  frequency: z.enum(DONATION_FREQUENCIES),
  fundSlug: z.string().optional(),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
});

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  status: z.enum(FORM_STATUSES).optional(),
  submitButtonText: z.string().optional(),
  successMessage: z.string().optional(),
  requireAuth: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
});

export const createFormFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  fieldType: z.enum(FORM_FIELD_TYPES),
  required: z.boolean().optional(),
  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  options: z.array(z.union([z.string(), z.object({ label: z.string(), capacity: z.number().int().positive().optional() })])).nullable().optional(),
  defaultValue: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const SIGNUP_CATEGORIES = [
  "kids_ministry", "student_ministry", "small_group", "fellowship",
  "volunteer", "class", "event", "trip", "other",
] as const;

export const SIGNUP_EVENT_STATUSES = ["draft", "published", "closed", "archived"] as const;
export const SIGNUP_VISIBILITY = ["public", "members_only", "unlisted"] as const;
export const SIGNUP_DISPLAY_TYPES = [
  "thank_you", "summary_own", "summary_all", "summary_all_anonymous", "redirect", "custom",
] as const;
export const SIGNUP_SUBMISSION_STATUSES = [
  "confirmed", "waitlisted", "cancelled", "no_show", "attended",
] as const;

export const signupEvents = pgTable("signup_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  formId: integer("form_id").notNull(),
  category: text("category").notNull().default("event"),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("public"),
  signupStartDate: timestamp("signup_start_date"),
  signupEndDate: timestamp("signup_end_date"),
  eventDate: timestamp("event_date"),
  eventEndDate: timestamp("event_end_date"),
  location: text("location"),
  maxSignups: integer("max_signups"),
  currentSignupCount: integer("current_signup_count").notNull().default(0),
  waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),
  waitlistCount: integer("waitlist_count").notNull().default(0),
  cost: text("cost"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  postSubmissionSettings: jsonb("post_submission_settings").default({}),
  settings: jsonb("settings").default({}),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const signupSubmissions = pgTable("signup_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  signupEventId: integer("signup_event_id").notNull(),
  formSubmissionId: integer("form_submission_id"),
  userId: integer("user_id"),
  signupNumber: integer("signup_number").notNull().default(0),
  status: text("status").notNull().default("confirmed"),
  waitlistPosition: integer("waitlist_position"),
  promotedFromWaitlistAt: timestamp("promoted_from_waitlist_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: integer("checked_in_by"),
  guestCount: integer("guest_count").notNull().default(0),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSignupEventSchema = createInsertSchema(signupEvents).omit({ id: true, createdAt: true, updatedAt: true, currentSignupCount: true, waitlistCount: true, deletedAt: true });
export const insertSignupSubmissionSchema = createInsertSchema(signupSubmissions).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertSignupEvent = z.infer<typeof insertSignupEventSchema>;
export type SignupEvent = typeof signupEvents.$inferSelect;
export type InsertSignupSubmission = z.infer<typeof insertSignupSubmissionSchema>;
export type SignupSubmission = typeof signupSubmissions.$inferSelect;

export const SIGNUP_CATEGORY_LABELS: Record<string, string> = {
  kids_ministry: "Kids Ministry",
  student_ministry: "Student Ministry",
  small_group: "Small Group",
  fellowship: "Fellowship",
  volunteer: "Volunteer",
  class: "Class",
  event: "Event",
  trip: "Trip",
  other: "Other",
};

export const loginActivity = pgTable("login_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: varchar("username", { length: 255 }),
  email: varchar("email", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }).notNull().default("password"),
  source: varchar("source", { length: 20 }).notNull().default("web"),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type LoginActivity = typeof loginActivity.$inferSelect;
export type InsertLoginActivity = typeof loginActivity.$inferInsert;

export const createSignupEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  formId: z.number().int().positive("A form must be selected"),
  category: z.enum(SIGNUP_CATEGORIES),
  status: z.enum(SIGNUP_EVENT_STATUSES).optional(),
  visibility: z.enum(SIGNUP_VISIBILITY).optional(),
  signupStartDate: z.string().nullable().optional(),
  signupEndDate: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  eventEndDate: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  maxSignups: z.number().int().positive().nullable().optional(),
  waitlistEnabled: z.boolean().optional(),
  cost: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  postSubmissionSettings: z.any().optional(),
  settings: z.any().optional(),
});
