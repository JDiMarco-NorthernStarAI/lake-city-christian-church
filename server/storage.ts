import { db } from "./db";
import { eq, desc, asc, and, isNull, sql } from "drizzle-orm";
import {
  users, sermons, events, teamMembers, contactSubmissions, connectCards, siteSettings, pageViews, rolePermissions,
  refreshTokens, eventSignups, children,
  type User, type InsertUser,
  type Sermon, type InsertSermon,
  type Event, type InsertEvent,
  type TeamMember, type InsertTeamMember,
  type ContactSubmission, type InsertContact,
  type ConnectCard, type InsertConnectCard,
  type SiteSetting, type InsertSiteSetting,
  type PageView, type InsertPageView,
  type RolePermission, type InsertRolePermission,
  type RefreshToken, type InsertRefreshToken,
  type EventSignup, type InsertEventSignup,
  type Child, type InsertChild,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  softDeleteUser(id: number): Promise<User | undefined>;
  restoreUser(id: number): Promise<User | undefined>;

  createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken>;
  getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined>;
  updateRefreshTokenLastUsed(id: number): Promise<void>;
  deleteRefreshToken(id: number): Promise<void>;
  deleteRefreshTokensByUserId(userId: number): Promise<void>;
  getRefreshTokensByUserId(userId: number): Promise<RefreshToken[]>;

  getSermons(): Promise<Sermon[]>;
  getSermon(id: number): Promise<Sermon | undefined>;
  createSermon(sermon: InsertSermon): Promise<Sermon>;
  updateSermon(id: number, data: Partial<InsertSermon>): Promise<Sermon | undefined>;
  deleteSermon(id: number): Promise<void>;

  getEvents(): Promise<Event[]>;
  getActiveEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;
  softDeleteEvent(id: number): Promise<Event | undefined>;

  createEventSignup(signup: InsertEventSignup): Promise<EventSignup>;
  getEventSignup(eventId: number, userId: number): Promise<EventSignup | undefined>;
  getEventSignups(eventId: number): Promise<EventSignup[]>;
  getUserSignups(userId: number): Promise<EventSignup[]>;
  updateEventSignup(id: number, data: Partial<InsertEventSignup>): Promise<EventSignup | undefined>;
  deleteEventSignup(id: number): Promise<void>;
  getEventSignupCount(eventId: number): Promise<number>;

  createChild(child: InsertChild): Promise<Child>;
  getChild(id: number): Promise<Child | undefined>;
  getChildrenByParent(parentUserId: number): Promise<Child[]>;
  getAllChildren(): Promise<Child[]>;
  updateChild(id: number, data: Partial<InsertChild>): Promise<Child | undefined>;
  softDeleteChild(id: number): Promise<Child | undefined>;

  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<void>;

  createContactSubmission(contact: InsertContact): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;

  createConnectCard(card: InsertConnectCard): Promise<ConnectCard>;
  getConnectCards(): Promise<ConnectCard[]>;

  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<SiteSetting[]>;

  createPageView(view: InsertPageView): Promise<PageView>;
  getPageViewStats(): Promise<{ totalViews: number; uniqueVisitors: number; todayViews: number; topPages: { path: string; count: number }[]; recentDays: { date: string; count: number }[] }>;

  getRolePermissions(): Promise<RolePermission[]>;
  getRolePermissionsByRole(role: string): Promise<RolePermission[]>;
  setRolePermission(role: string, feature: string, enabled: boolean): Promise<void>;
  getEnabledFeaturesForRoles(roles: string[]): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getActiveUsers(): Promise<User[]> {
    return db.select().from(users).where(isNull(users.deletedAt));
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async softDeleteUser(id: number): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async restoreUser(id: number): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ deletedAt: null, isActive: true, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken> {
    const [created] = await db.insert(refreshTokens).values(token).returning();
    return created;
  }

  async getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const [token] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    return token;
  }

  async updateRefreshTokenLastUsed(id: number): Promise<void> {
    await db.update(refreshTokens).set({ lastUsedAt: new Date() }).where(eq(refreshTokens.id, id));
  }

  async deleteRefreshToken(id: number): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, id));
  }

  async deleteRefreshTokensByUserId(userId: number): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async getRefreshTokensByUserId(userId: number): Promise<RefreshToken[]> {
    return db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId)).orderBy(desc(refreshTokens.lastUsedAt));
  }

  async getSermons(): Promise<Sermon[]> {
    return db.select().from(sermons).orderBy(desc(sermons.date));
  }

  async getSermon(id: number): Promise<Sermon | undefined> {
    const [sermon] = await db.select().from(sermons).where(eq(sermons.id, id));
    return sermon;
  }

  async createSermon(sermon: InsertSermon): Promise<Sermon> {
    const [created] = await db.insert(sermons).values(sermon).returning();
    return created;
  }

  async updateSermon(id: number, data: Partial<InsertSermon>): Promise<Sermon | undefined> {
    const [updated] = await db.update(sermons).set(data).where(eq(sermons.id, id)).returning();
    return updated;
  }

  async deleteSermon(id: number): Promise<void> {
    await db.delete(sermons).where(eq(sermons.id, id));
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.date));
  }

  async getActiveEvents(): Promise<Event[]> {
    return db.select().from(events).where(and(eq(events.isActive, true), isNull(events.deletedAt))).orderBy(desc(events.date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async softDeleteEvent(id: number): Promise<Event | undefined> {
    const [updated] = await db.update(events).set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return updated;
  }

  async createEventSignup(signup: InsertEventSignup): Promise<EventSignup> {
    const [created] = await db.insert(eventSignups).values(signup).returning();
    return created;
  }

  async getEventSignup(eventId: number, userId: number): Promise<EventSignup | undefined> {
    const [signup] = await db.select().from(eventSignups)
      .where(and(eq(eventSignups.eventId, eventId), eq(eventSignups.userId, userId)));
    return signup;
  }

  async getEventSignups(eventId: number): Promise<EventSignup[]> {
    return db.select().from(eventSignups).where(eq(eventSignups.eventId, eventId)).orderBy(desc(eventSignups.createdAt));
  }

  async getUserSignups(userId: number): Promise<EventSignup[]> {
    return db.select().from(eventSignups).where(eq(eventSignups.userId, userId)).orderBy(desc(eventSignups.createdAt));
  }

  async updateEventSignup(id: number, data: Partial<InsertEventSignup>): Promise<EventSignup | undefined> {
    const [updated] = await db.update(eventSignups).set({ ...data, updatedAt: new Date() }).where(eq(eventSignups.id, id)).returning();
    return updated;
  }

  async deleteEventSignup(id: number): Promise<void> {
    await db.delete(eventSignups).where(eq(eventSignups.id, id));
  }

  async getEventSignupCount(eventId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(eventSignups)
      .where(and(eq(eventSignups.eventId, eventId), eq(eventSignups.status, "registered")));
    return result[0]?.count ?? 0;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [created] = await db.insert(children).values(child).returning();
    return created;
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async getChildrenByParent(parentUserId: number): Promise<Child[]> {
    return db.select().from(children).where(and(eq(children.parentUserId, parentUserId), isNull(children.deletedAt)));
  }

  async getAllChildren(): Promise<Child[]> {
    return db.select().from(children).where(isNull(children.deletedAt));
  }

  async updateChild(id: number, data: Partial<InsertChild>): Promise<Child | undefined> {
    const [updated] = await db.update(children).set({ ...data, updatedAt: new Date() }).where(eq(children.id, id)).returning();
    return updated;
  }

  async softDeleteChild(id: number): Promise<Child | undefined> {
    const [updated] = await db.update(children).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(children.id, id)).returning();
    return updated;
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder));
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [created] = await db.insert(teamMembers).values(member).returning();
    return created;
  }

  async updateTeamMember(id: number, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [updated] = await db.update(teamMembers).set(data).where(eq(teamMembers.id, id)).returning();
    return updated;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async createContactSubmission(contact: InsertContact): Promise<ContactSubmission> {
    const [created] = await db.insert(contactSubmissions).values(contact).returning();
    return created;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async createConnectCard(card: InsertConnectCard): Promise<ConnectCard> {
    const [created] = await db.insert(connectCards).values(card).returning();
    return created;
  }

  async getConnectCards(): Promise<ConnectCard[]> {
    return db.select().from(connectCards).orderBy(desc(connectCards.createdAt));
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSetting(key);
    if (existing !== undefined) {
      await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  async createPageView(view: InsertPageView): Promise<PageView> {
    const [created] = await db.insert(pageViews).values(view).returning();
    return created;
  }

  async getPageViewStats() {
    const allViews = await db.select().from(pageViews);
    
    const totalViews = allViews.length;
    const uniqueIps = new Set(allViews.map(v => v.ipHash).filter(Boolean));
    const uniqueVisitors = uniqueIps.size;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayViews = allViews.filter(v => new Date(v.createdAt) >= today).length;
    
    const pageCounts: Record<string, number> = {};
    for (const v of allViews) {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const recentDays: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = allViews.filter(v => {
        const vDate = new Date(v.createdAt).toISOString().split("T")[0];
        return vDate === dateStr;
      }).length;
      recentDays.push({ date: dateStr, count });
    }
    
    return { totalViews, uniqueVisitors, todayViews, topPages, recentDays };
  }

  async getRolePermissions(): Promise<RolePermission[]> {
    return db.select().from(rolePermissions);
  }

  async getRolePermissionsByRole(role: string): Promise<RolePermission[]> {
    return db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async setRolePermission(role: string, feature: string, enabled: boolean): Promise<void> {
    const [existing] = await db.select().from(rolePermissions)
      .where(and(eq(rolePermissions.role, role), eq(rolePermissions.feature, feature)));
    if (existing) {
      await db.update(rolePermissions)
        .set({ enabled })
        .where(and(eq(rolePermissions.role, role), eq(rolePermissions.feature, feature)));
    } else {
      await db.insert(rolePermissions).values({ role, feature, enabled });
    }
  }

  async getEnabledFeaturesForRoles(roles: string[]): Promise<string[]> {
    if (roles.includes("super_admin")) {
      const { AVAILABLE_FEATURES } = await import("@shared/schema");
      return [...AVAILABLE_FEATURES];
    }

    const allPerms = await db.select().from(rolePermissions);
    const enabledFeatures = new Set<string>();

    if (roles.includes("admin")) {
      const { AVAILABLE_FEATURES } = await import("@shared/schema");
      for (const f of AVAILABLE_FEATURES) {
        enabledFeatures.add(f);
      }
    }

    for (const perm of allPerms) {
      if (roles.includes(perm.role) && perm.enabled) {
        enabledFeatures.add(perm.feature);
      }
    }

    return Array.from(enabledFeatures);
  }
}

export const storage = new DatabaseStorage();
