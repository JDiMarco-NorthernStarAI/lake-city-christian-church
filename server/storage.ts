import { db } from "./db";
import { eq, desc, asc, and, isNull, sql, inArray, ne, gte, lte } from "drizzle-orm";
import {
  users, sermons, events, teamMembers, contactSubmissions, connectCards, siteSettings, pageViews, rolePermissions,
  refreshTokens, eventSignups, children, forms, formFields, formSubmissions, donationFunds, donations,
  pushSubscriptions, notificationLogs, signupEvents, signupSubmissions,
  smsGroups, smsGroupMembers, userTags, smsMessages, smsRecipients, smsOptOuts, smsTemplates, smsSettings, smsIncomingMessages,
  loginActivity, media, mediaFolders,
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
  type Form, type InsertForm,
  type FormField, type InsertFormField,
  type FormSubmission, type InsertFormSubmission,
  type DonationFund, type InsertDonationFund,
  type Donation, type InsertDonation,
  type PushSubscription, type InsertPushSubscription,
  type NotificationLog, type InsertNotificationLog,
  type SignupEvent, type InsertSignupEvent,
  type SignupSubmission, type InsertSignupSubmission,
  type SmsGroup, type InsertSmsGroup,
  type SmsGroupMember, type InsertSmsGroupMember,
  type UserTag, type InsertUserTag,
  type SmsMessage, type InsertSmsMessage,
  type SmsRecipient, type InsertSmsRecipient,
  type SmsOptOut, type InsertSmsOptOut,
  type SmsTemplate, type InsertSmsTemplate,
  type SmsSettings, type InsertSmsSettings,
  type SmsIncomingMessage, type InsertSmsIncomingMessage,
  type LoginActivity, type InsertLoginActivity,
  type Media, type InsertMedia,
  type MediaFolder, type InsertMediaFolder,
  cityGroups, cityGroupSignups, userCityGroups, pcoDonations,
  type CityGroup, type InsertCityGroup,
  type CityGroupSignup, type InsertCityGroupSignup,
  type UserCityGroup, type InsertUserCityGroup,
  type PcoDonation, type InsertPcoDonation,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined>;
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
  getConnectCard(id: number): Promise<ConnectCard | undefined>;
  deleteConnectCard(id: number): Promise<void>;

  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<SiteSetting[]>;

  createPageView(view: InsertPageView): Promise<PageView>;
  getPageViewStats(): Promise<{ totalViews: number; uniqueVisitors: number; todayViews: number; topPages: { path: string; count: number }[]; recentDays: { date: string; count: number }[] }>;

  getRolePermissions(): Promise<RolePermission[]>;
  getRolePermissionsByRole(role: string): Promise<RolePermission[]>;
  setRolePermission(role: string, feature: string, enabled: boolean): Promise<void>;
  getEnabledFeaturesForRoles(roles: string[]): Promise<string[]>;

  getForms(): Promise<Form[]>;
  getPublishedForms(): Promise<Form[]>;
  getForm(id: number): Promise<Form | undefined>;
  getFormBySlug(slug: string): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: number, data: Partial<InsertForm>): Promise<Form | undefined>;
  deleteForm(id: number): Promise<void>;

  getFormFields(formId: number): Promise<FormField[]>;
  getFormField(id: number): Promise<FormField | undefined>;
  createFormField(field: InsertFormField): Promise<FormField>;
  updateFormField(id: number, data: Partial<InsertFormField>): Promise<FormField | undefined>;
  deleteFormField(id: number): Promise<void>;
  deleteFormFieldsByFormId(formId: number): Promise<void>;

  getFormSubmissions(formId: number): Promise<FormSubmission[]>;
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  deleteFormSubmission(id: number): Promise<void>;
  getFormSubmissionCount(formId: number): Promise<number>;

  getDonationFunds(): Promise<DonationFund[]>;
  getActiveDonationFunds(): Promise<DonationFund[]>;
  getDonationFund(id: number): Promise<DonationFund | undefined>;
  getDonationFundBySlug(slug: string): Promise<DonationFund | undefined>;
  createDonationFund(fund: InsertDonationFund): Promise<DonationFund>;
  updateDonationFund(id: number, data: Partial<InsertDonationFund>): Promise<DonationFund | undefined>;
  deleteDonationFund(id: number): Promise<void>;

  getDonations(): Promise<Donation[]>;
  getDonation(id: number): Promise<Donation | undefined>;
  getDonationByStripeSessionId(sessionId: string): Promise<Donation | undefined>;
  getDonationByStripeSubscriptionId(subscriptionId: string): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: number, data: Partial<InsertDonation>): Promise<Donation | undefined>;
  getDonationStats(): Promise<{ totalAmount: number; totalCount: number; monthlyAmount: number; monthlyCount: number }>;

  createPushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined>;
  updatePushSubscription(id: number, data: Partial<InsertPushSubscription>): Promise<PushSubscription | undefined>;
  deactivatePushSubscription(endpoint: string): Promise<void>;
  getActivePushSubscriptions(): Promise<PushSubscription[]>;
  getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]>;
  getPushSubscriptionCount(): Promise<number>;

  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(): Promise<NotificationLog[]>;

  // SMS Groups
  getSmsGroups(): Promise<SmsGroup[]>;
  getSmsGroup(id: number): Promise<SmsGroup | undefined>;
  createSmsGroup(group: InsertSmsGroup): Promise<SmsGroup>;
  updateSmsGroup(id: number, data: Partial<InsertSmsGroup>): Promise<SmsGroup | undefined>;
  deleteSmsGroup(id: number): Promise<void>;

  // SMS Group Members
  getSmsGroupMembers(groupId: number): Promise<SmsGroupMember[]>;
  addSmsGroupMember(member: InsertSmsGroupMember): Promise<SmsGroupMember>;
  removeSmsGroupMember(groupId: number, userId: number): Promise<void>;

  // User Tags
  getUserTags(userId: number): Promise<UserTag[]>;
  getAllTags(): Promise<{ tag: string; count: number }[]>;
  addUserTag(tag: InsertUserTag): Promise<UserTag>;
  removeUserTag(userId: number, tag: string): Promise<void>;
  getUsersByTag(tag: string): Promise<User[]>;

  // SMS Messages
  getSmsMessages(): Promise<SmsMessage[]>;
  getSmsMessage(id: number): Promise<SmsMessage | undefined>;
  createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage>;
  updateSmsMessage(id: number, data: Partial<InsertSmsMessage>): Promise<SmsMessage | undefined>;
  deleteSmsMessage(id: number): Promise<void>;

  // SMS Recipients
  getSmsRecipients(messageId: number): Promise<SmsRecipient[]>;
  getSmsRecipient(id: number): Promise<SmsRecipient | undefined>;
  getSmsRecipientByTwilioSid(sid: string): Promise<SmsRecipient | undefined>;
  createSmsRecipient(recipient: InsertSmsRecipient): Promise<SmsRecipient>;
  updateSmsRecipient(id: number, data: Partial<InsertSmsRecipient>): Promise<SmsRecipient | undefined>;

  // SMS Opt Outs
  getSmsOptOuts(): Promise<SmsOptOut[]>;
  getSmsOptOutByPhone(phone: string): Promise<SmsOptOut | undefined>;
  createSmsOptOut(optOut: InsertSmsOptOut): Promise<SmsOptOut>;
  removeSmsOptOut(phoneNumber: string, method: string): Promise<void>;
  isPhoneOptedOut(phone: string): Promise<boolean>;

  // SMS Templates
  getSmsTemplates(): Promise<SmsTemplate[]>;
  getSmsTemplate(id: number): Promise<SmsTemplate | undefined>;
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  updateSmsTemplate(id: number, data: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined>;
  deleteSmsTemplate(id: number): Promise<void>;
  incrementSmsTemplateUseCount(id: number): Promise<void>;

  // SMS Settings
  getSmsSettings(): Promise<SmsSettings | undefined>;
  upsertSmsSettings(data: Partial<InsertSmsSettings>): Promise<SmsSettings>;

  // SMS Incoming Messages
  getSmsIncomingMessages(): Promise<SmsIncomingMessage[]>;
  getSmsIncomingMessagesRequiringResponse(): Promise<SmsIncomingMessage[]>;
  createSmsIncomingMessage(msg: InsertSmsIncomingMessage): Promise<SmsIncomingMessage>;
  markSmsIncomingResponded(id: number, respondedBy: number): Promise<SmsIncomingMessage | undefined>;

  // Group Member Resolution
  resolveGroupMembers(groupId: number): Promise<User[]>;
  getEligibleSmsRecipients(userIds: number[]): Promise<User[]>;

  // Signup Events
  getSignupEvents(): Promise<SignupEvent[]>;
  getPublishedSignupEvents(): Promise<SignupEvent[]>;
  getSignupEvent(id: number): Promise<SignupEvent | undefined>;
  getSignupEventBySlug(slug: string): Promise<SignupEvent | undefined>;
  createSignupEvent(event: InsertSignupEvent): Promise<SignupEvent>;
  updateSignupEvent(id: number, data: Partial<InsertSignupEvent>): Promise<SignupEvent | undefined>;
  deleteSignupEvent(id: number): Promise<void>;
  incrementSignupCount(id: number): Promise<void>;
  decrementSignupCount(id: number): Promise<void>;

  // Signup Submissions
  getSignupSubmissions(signupEventId: number): Promise<SignupSubmission[]>;
  getSignupSubmission(id: number): Promise<SignupSubmission | undefined>;
  getSignupSubmissionByUser(signupEventId: number, userId: number): Promise<SignupSubmission | undefined>;
  getUserSignupSubmissions(userId: number): Promise<SignupSubmission[]>;
  createSignupSubmission(submission: InsertSignupSubmission): Promise<SignupSubmission>;
  updateSignupSubmission(id: number, data: Partial<InsertSignupSubmission>): Promise<SignupSubmission | undefined>;
  deleteSignupSubmission(id: number): Promise<void>;
  getSignupSubmissionCount(signupEventId: number): Promise<number>;

  getSignupSubmissionsByUserId(userId: number): Promise<SignupSubmission[]>;
  getFormSubmissionsByUserId(userId: number): Promise<FormSubmission[]>;
  getDonationsByEmail(email: string): Promise<Donation[]>;
  getAllFormSubmissions(): Promise<FormSubmission[]>;
  getAllSignupSubmissions(): Promise<SignupSubmission[]>;

  createLoginActivity(entry: InsertLoginActivity): Promise<LoginActivity>;
  getLoginActivity(limit?: number): Promise<LoginActivity[]>;

  getPageViewsFiltered(filters: { startDate?: string; endDate?: string; path?: string }): Promise<PageView[]>;
  getLoginActivityFiltered(filters: { startDate?: string; endDate?: string; source?: string }): Promise<LoginActivity[]>;

  // City Groups (Small Groups)
  getCityGroups(): Promise<CityGroup[]>;
  getActiveCityGroups(): Promise<CityGroup[]>;
  getCityGroup(id: number): Promise<CityGroup | undefined>;
  createCityGroup(group: InsertCityGroup): Promise<CityGroup>;
  updateCityGroup(id: number, data: Partial<InsertCityGroup>): Promise<CityGroup | undefined>;
  deleteCityGroup(id: number): Promise<void>;

  // City Group Signups
  getCityGroupSignups(): Promise<CityGroupSignup[]>;
  getCityGroupSignup(id: number): Promise<CityGroupSignup | undefined>;
  createCityGroupSignup(signup: InsertCityGroupSignup): Promise<CityGroupSignup>;
  deleteCityGroupSignup(id: number): Promise<void>;

  // Planning Center Donations
  getPcoDonations(): Promise<PcoDonation[]>;
  getPcoDonationsByUserId(userId: number): Promise<PcoDonation[]>;
  getPcoDonationsByEmail(email: string): Promise<PcoDonation[]>;
  getPcoDonationByPcoId(pcoDonationId: string): Promise<PcoDonation | undefined>;
  createPcoDonation(donation: InsertPcoDonation): Promise<PcoDonation>;
  updatePcoDonation(id: number, data: Partial<InsertPcoDonation>): Promise<PcoDonation | undefined>;
  updatePcoDonationName(pcoPersonId: string, name: string): Promise<void>;
  linkPcoDonationsToUser(email: string, userId: number): Promise<void>;

  // User City Group Assignments
  getUserCityGroups(userId: number): Promise<UserCityGroup[]>;
  getUsersByGroup(cityGroupId: number): Promise<UserCityGroup[]>;
  getAllUserCityGroups(): Promise<UserCityGroup[]>;
  addUserToGroup(data: InsertUserCityGroup): Promise<UserCityGroup>;
  removeUserFromGroup(userId: number, cityGroupId: number): Promise<void>;
  setUserGroups(userId: number, groupIds: number[], otherGroupName?: string): Promise<void>;
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
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = lower(${email})`);
    return user;
  }

  async getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.authProvider, provider), eq(users.authProviderId, providerId))
    );
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
    const all = await db.select().from(events);
    return this.sortEvents(all);
  }

  async getActiveEvents(): Promise<Event[]> {
    const all = await db.select().from(events).where(and(eq(events.isActive, true), isNull(events.deletedAt)));
    return this.sortEvents(all);
  }

  private sortEvents(eventList: Event[]): Event[] {
    const pinnedTop = eventList.filter(e => e.pinned === 'top').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const pinnedBottom = eventList.filter(e => e.pinned === 'bottom').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const normal = eventList.filter(e => !e.pinned);
    // Sort normal events by eventDate ascending (soonest first), then by sortOrder
    normal.sort((a, b) => {
      if (a.sortOrder !== null && b.sortOrder !== null && a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
      return dateA - dateB;
    });
    return [...pinnedTop, ...normal, ...pinnedBottom];
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

  async getConnectCard(id: number): Promise<ConnectCard | undefined> {
    const [card] = await db.select().from(connectCards).where(eq(connectCards.id, id));
    return card;
  }

  async deleteConnectCard(id: number): Promise<void> {
    await db.delete(connectCards).where(eq(connectCards.id, id));
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
    // super_admin always gets all features
    if (roles.includes("super_admin")) {
      const { AVAILABLE_FEATURES } = await import("@shared/schema");
      return [...AVAILABLE_FEATURES];
    }

    const allPerms = await db.select().from(rolePermissions);
    const enabledFeatures = new Set<string>();

    // Check each role's permissions from the database
    for (const perm of allPerms) {
      if (roles.includes(perm.role) && perm.enabled) {
        enabledFeatures.add(perm.feature);
      }
    }

    // If a role has NO permissions in the DB yet (first deploy), give admin all features as default
    if (roles.includes("admin") && enabledFeatures.size === 0) {
      const hasAdminPerms = allPerms.some(p => p.role === "admin");
      if (!hasAdminPerms) {
        const { AVAILABLE_FEATURES } = await import("@shared/schema");
        for (const f of AVAILABLE_FEATURES) {
          enabledFeatures.add(f);
        }
      }
    }

    return Array.from(enabledFeatures);
  }

  async getForms(): Promise<Form[]> {
    return db.select().from(forms).orderBy(desc(forms.createdAt));
  }

  async getPublishedForms(): Promise<Form[]> {
    return db.select().from(forms).where(eq(forms.status, "published")).orderBy(desc(forms.createdAt));
  }

  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  async getFormBySlug(slug: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.slug, slug));
    return form;
  }

  async createForm(form: InsertForm): Promise<Form> {
    const [created] = await db.insert(forms).values(form).returning();
    return created;
  }

  async updateForm(id: number, data: Partial<InsertForm>): Promise<Form | undefined> {
    const [updated] = await db.update(forms).set({ ...data, updatedAt: new Date() }).where(eq(forms.id, id)).returning();
    return updated;
  }

  async deleteForm(id: number): Promise<void> {
    await db.delete(formSubmissions).where(eq(formSubmissions.formId, id));
    await db.delete(formFields).where(eq(formFields.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  }

  async getFormFields(formId: number): Promise<FormField[]> {
    return db.select().from(formFields).where(eq(formFields.formId, formId)).orderBy(asc(formFields.sortOrder));
  }

  async getFormField(id: number): Promise<FormField | undefined> {
    const [field] = await db.select().from(formFields).where(eq(formFields.id, id));
    return field;
  }

  async createFormField(field: InsertFormField): Promise<FormField> {
    const [created] = await db.insert(formFields).values(field).returning();
    return created;
  }

  async updateFormField(id: number, data: Partial<InsertFormField>): Promise<FormField | undefined> {
    const [updated] = await db.update(formFields).set(data).where(eq(formFields.id, id)).returning();
    return updated;
  }

  async deleteFormField(id: number): Promise<void> {
    await db.delete(formFields).where(eq(formFields.id, id));
  }

  async deleteFormFieldsByFormId(formId: number): Promise<void> {
    await db.delete(formFields).where(eq(formFields.formId, formId));
  }

  async getFormSubmissions(formId: number): Promise<FormSubmission[]> {
    return db.select().from(formSubmissions).where(eq(formSubmissions.formId, formId)).orderBy(desc(formSubmissions.submittedAt));
  }

  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    const [sub] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
    return sub;
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const [created] = await db.insert(formSubmissions).values(submission).returning();
    return created;
  }

  async deleteFormSubmission(id: number): Promise<void> {
    await db.delete(formSubmissions).where(eq(formSubmissions.id, id));
  }

  async getFormSubmissionCount(formId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(formSubmissions)
      .where(eq(formSubmissions.formId, formId));
    return result[0]?.count ?? 0;
  }

  async getDonationFunds(): Promise<DonationFund[]> {
    return db.select().from(donationFunds).orderBy(asc(donationFunds.sortOrder));
  }

  async getActiveDonationFunds(): Promise<DonationFund[]> {
    return db.select().from(donationFunds).where(eq(donationFunds.isActive, true)).orderBy(asc(donationFunds.sortOrder));
  }

  async getDonationFund(id: number): Promise<DonationFund | undefined> {
    const [fund] = await db.select().from(donationFunds).where(eq(donationFunds.id, id));
    return fund;
  }

  async getDonationFundBySlug(slug: string): Promise<DonationFund | undefined> {
    const [fund] = await db.select().from(donationFunds).where(eq(donationFunds.slug, slug));
    return fund;
  }

  async createDonationFund(fund: InsertDonationFund): Promise<DonationFund> {
    const [created] = await db.insert(donationFunds).values(fund).returning();
    return created;
  }

  async updateDonationFund(id: number, data: Partial<InsertDonationFund>): Promise<DonationFund | undefined> {
    const [updated] = await db.update(donationFunds).set(data).where(eq(donationFunds.id, id)).returning();
    return updated;
  }

  async deleteDonationFund(id: number): Promise<void> {
    await db.delete(donationFunds).where(eq(donationFunds.id, id));
  }

  async getDonations(): Promise<Donation[]> {
    return db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonation(id: number): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id));
    return donation;
  }

  async getDonationByStripeSessionId(sessionId: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.stripeSessionId, sessionId));
    return donation;
  }

  async getDonationByStripeSubscriptionId(subscriptionId: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.stripeSubscriptionId, subscriptionId));
    return donation;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [created] = await db.insert(donations).values(donation).returning();
    return created;
  }

  async updateDonation(id: number, data: Partial<InsertDonation>): Promise<Donation | undefined> {
    const [updated] = await db.update(donations).set({ ...data, updatedAt: new Date() }).where(eq(donations.id, id)).returning();
    return updated;
  }

  async getDonationStats(): Promise<{ totalAmount: number; totalCount: number; monthlyAmount: number; monthlyCount: number }> {
    const allDonations = await db.select().from(donations).where(eq(donations.status, "completed"));
    const totalAmount = allDonations.reduce((sum, d) => sum + d.amountCents, 0);
    const totalCount = allDonations.length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDonations = allDonations.filter(d => new Date(d.createdAt) >= monthStart);
    const monthlyAmount = monthlyDonations.reduce((sum, d) => sum + d.amountCents, 0);
    const monthlyCount = monthlyDonations.length;

    return { totalAmount, totalCount, monthlyAmount, monthlyCount };
  }

  async createPushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    const [created] = await db.insert(pushSubscriptions).values(sub).returning();
    return created;
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
    const [sub] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return sub;
  }

  async updatePushSubscription(id: number, data: Partial<InsertPushSubscription>): Promise<PushSubscription | undefined> {
    const [updated] = await db.update(pushSubscriptions).set(data).where(eq(pushSubscriptions.id, id)).returning();
    return updated;
  }

  async deactivatePushSubscription(endpoint: string): Promise<void> {
    await db.update(pushSubscriptions).set({ isActive: false }).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getActivePushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.isActive, true));
  }

  async getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getPushSubscriptionCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(pushSubscriptions).where(eq(pushSubscriptions.isActive, true));
    return Number(result[0]?.count || 0);
  }

  async createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
    const [created] = await db.insert(notificationLogs).values(log).returning();
    return created;
  }

  async getNotificationLogs(): Promise<NotificationLog[]> {
    return db.select().from(notificationLogs).orderBy(desc(notificationLogs.sentAt));
  }

  // ======== SMS GROUPS ========

  async getSmsGroups(): Promise<SmsGroup[]> {
    return db.select().from(smsGroups).where(eq(smsGroups.isActive, true)).orderBy(asc(smsGroups.name));
  }

  async getSmsGroup(id: number): Promise<SmsGroup | undefined> {
    const [group] = await db.select().from(smsGroups).where(eq(smsGroups.id, id));
    return group;
  }

  async createSmsGroup(group: InsertSmsGroup): Promise<SmsGroup> {
    const [created] = await db.insert(smsGroups).values(group).returning();
    return created;
  }

  async updateSmsGroup(id: number, data: Partial<InsertSmsGroup>): Promise<SmsGroup | undefined> {
    const [updated] = await db.update(smsGroups).set({ ...data, updatedAt: new Date() }).where(eq(smsGroups.id, id)).returning();
    return updated;
  }

  async deleteSmsGroup(id: number): Promise<void> {
    await db.update(smsGroups).set({ isActive: false, updatedAt: new Date() }).where(eq(smsGroups.id, id));
  }

  // ======== SMS GROUP MEMBERS ========

  async getSmsGroupMembers(groupId: number): Promise<SmsGroupMember[]> {
    return db.select().from(smsGroupMembers).where(eq(smsGroupMembers.groupId, groupId));
  }

  async addSmsGroupMember(member: InsertSmsGroupMember): Promise<SmsGroupMember> {
    const [created] = await db.insert(smsGroupMembers).values(member).returning();
    return created;
  }

  async removeSmsGroupMember(groupId: number, userId: number): Promise<void> {
    await db.delete(smsGroupMembers).where(and(eq(smsGroupMembers.groupId, groupId), eq(smsGroupMembers.userId, userId)));
  }

  // ======== USER TAGS ========

  async getUserTags(userId: number): Promise<UserTag[]> {
    return db.select().from(userTags).where(eq(userTags.userId, userId)).orderBy(asc(userTags.tag));
  }

  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const result = await db.select({ tag: userTags.tag, count: sql<number>`count(*)` }).from(userTags).groupBy(userTags.tag).orderBy(asc(userTags.tag));
    return result.map(r => ({ tag: r.tag, count: Number(r.count) }));
  }

  async addUserTag(tag: InsertUserTag): Promise<UserTag> {
    const [created] = await db.insert(userTags).values({ ...tag, tag: tag.tag.toLowerCase() }).returning();
    return created;
  }

  async removeUserTag(userId: number, tag: string): Promise<void> {
    await db.delete(userTags).where(and(eq(userTags.userId, userId), eq(userTags.tag, tag.toLowerCase())));
  }

  async getUsersByTag(tag: string): Promise<User[]> {
    const tagged = await db.select({ userId: userTags.userId }).from(userTags).where(eq(userTags.tag, tag.toLowerCase()));
    if (tagged.length === 0) return [];
    return db.select().from(users).where(and(inArray(users.id, tagged.map(t => t.userId)), isNull(users.deletedAt)));
  }

  // ======== SMS MESSAGES ========

  async getSmsMessages(): Promise<SmsMessage[]> {
    return db.select().from(smsMessages).orderBy(desc(smsMessages.createdAt));
  }

  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    const [msg] = await db.select().from(smsMessages).where(eq(smsMessages.id, id));
    return msg;
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    const [created] = await db.insert(smsMessages).values(message).returning();
    return created;
  }

  async updateSmsMessage(id: number, data: Partial<InsertSmsMessage>): Promise<SmsMessage | undefined> {
    const [updated] = await db.update(smsMessages).set({ ...data, updatedAt: new Date() }).where(eq(smsMessages.id, id)).returning();
    return updated;
  }

  async deleteSmsMessage(id: number): Promise<void> {
    await db.delete(smsRecipients).where(eq(smsRecipients.messageId, id));
    await db.delete(smsMessages).where(eq(smsMessages.id, id));
  }

  // ======== SMS RECIPIENTS ========

  async getSmsRecipients(messageId: number): Promise<SmsRecipient[]> {
    return db.select().from(smsRecipients).where(eq(smsRecipients.messageId, messageId));
  }

  async getSmsRecipient(id: number): Promise<SmsRecipient | undefined> {
    const [r] = await db.select().from(smsRecipients).where(eq(smsRecipients.id, id));
    return r;
  }

  async getSmsRecipientByTwilioSid(sid: string): Promise<SmsRecipient | undefined> {
    const [r] = await db.select().from(smsRecipients).where(eq(smsRecipients.twilioMessageSid, sid));
    return r;
  }

  async createSmsRecipient(recipient: InsertSmsRecipient): Promise<SmsRecipient> {
    const [created] = await db.insert(smsRecipients).values(recipient).returning();
    return created;
  }

  async updateSmsRecipient(id: number, data: Partial<InsertSmsRecipient>): Promise<SmsRecipient | undefined> {
    const [updated] = await db.update(smsRecipients).set({ ...data, updatedAt: new Date() }).where(eq(smsRecipients.id, id)).returning();
    return updated;
  }

  // ======== SMS OPT OUTS ========

  async getSmsOptOuts(): Promise<SmsOptOut[]> {
    return db.select().from(smsOptOuts).where(isNull(smsOptOuts.optedBackInAt)).orderBy(desc(smsOptOuts.optedOutAt));
  }

  async getSmsOptOutByPhone(phone: string): Promise<SmsOptOut | undefined> {
    const [opt] = await db.select().from(smsOptOuts).where(and(eq(smsOptOuts.phoneNumber, phone), isNull(smsOptOuts.optedBackInAt)));
    return opt;
  }

  async createSmsOptOut(optOut: InsertSmsOptOut): Promise<SmsOptOut> {
    const [created] = await db.insert(smsOptOuts).values(optOut).returning();
    return created;
  }

  async removeSmsOptOut(phoneNumber: string, method: string): Promise<void> {
    await db.update(smsOptOuts).set({ optedBackInAt: new Date(), optInMethod: method }).where(and(eq(smsOptOuts.phoneNumber, phoneNumber), isNull(smsOptOuts.optedBackInAt)));
  }

  async isPhoneOptedOut(phone: string): Promise<boolean> {
    const opt = await this.getSmsOptOutByPhone(phone);
    return !!opt;
  }

  // ======== SMS TEMPLATES ========

  async getSmsTemplates(): Promise<SmsTemplate[]> {
    return db.select().from(smsTemplates).where(eq(smsTemplates.isActive, true)).orderBy(asc(smsTemplates.name));
  }

  async getSmsTemplate(id: number): Promise<SmsTemplate | undefined> {
    const [t] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
    return t;
  }

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    const [created] = await db.insert(smsTemplates).values(template).returning();
    return created;
  }

  async updateSmsTemplate(id: number, data: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    const [updated] = await db.update(smsTemplates).set({ ...data, updatedAt: new Date() }).where(eq(smsTemplates.id, id)).returning();
    return updated;
  }

  async deleteSmsTemplate(id: number): Promise<void> {
    await db.update(smsTemplates).set({ isActive: false, updatedAt: new Date() }).where(eq(smsTemplates.id, id));
  }

  async incrementSmsTemplateUseCount(id: number): Promise<void> {
    await db.update(smsTemplates).set({ useCount: sql`${smsTemplates.useCount} + 1` }).where(eq(smsTemplates.id, id));
  }

  // ======== SMS SETTINGS ========

  async getSmsSettings(): Promise<SmsSettings | undefined> {
    const [s] = await db.select().from(smsSettings).limit(1);
    return s;
  }

  async upsertSmsSettings(data: Partial<InsertSmsSettings>): Promise<SmsSettings> {
    const existing = await this.getSmsSettings();
    if (existing) {
      const [updated] = await db.update(smsSettings).set({ ...data, updatedAt: new Date() }).where(eq(smsSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(smsSettings).values(data as InsertSmsSettings).returning();
    return created;
  }

  // ======== SMS INCOMING MESSAGES ========

  async getSmsIncomingMessages(): Promise<SmsIncomingMessage[]> {
    return db.select().from(smsIncomingMessages).orderBy(desc(smsIncomingMessages.createdAt));
  }

  async getSmsIncomingMessagesRequiringResponse(): Promise<SmsIncomingMessage[]> {
    return db.select().from(smsIncomingMessages).where(and(eq(smsIncomingMessages.requiresResponse, true), eq(smsIncomingMessages.responded, false))).orderBy(desc(smsIncomingMessages.createdAt));
  }

  async createSmsIncomingMessage(msg: InsertSmsIncomingMessage): Promise<SmsIncomingMessage> {
    const [created] = await db.insert(smsIncomingMessages).values(msg).returning();
    return created;
  }

  async markSmsIncomingResponded(id: number, respondedBy: number): Promise<SmsIncomingMessage | undefined> {
    const [updated] = await db.update(smsIncomingMessages).set({ responded: true, respondedBy, respondedAt: new Date() }).where(eq(smsIncomingMessages.id, id)).returning();
    return updated;
  }

  // ======== GROUP MEMBER RESOLUTION ========

  async resolveGroupMembers(groupId: number): Promise<User[]> {
    const group = await this.getSmsGroup(groupId);
    if (!group) return [];

    if (group.groupType === "custom") {
      const members = await this.getSmsGroupMembers(groupId);
      if (members.length === 0) return [];
      return db.select().from(users).where(and(inArray(users.id, members.map(m => m.userId)), isNull(users.deletedAt), eq(users.isActive, true)));
    }

    const filter = group.filterCriteria as any;
    if (!filter) return [];

    let allUsers = await db.select().from(users).where(and(isNull(users.deletedAt), eq(users.isActive, true)));

    if (filter.roles?.length) {
      allUsers = allUsers.filter(u => u.roles.some((r: string) => filter.roles.includes(r)));
    }
    if (filter.hasChildren === true) {
      const parents = await db.select({ parentUserId: children.parentUserId }).from(children).where(isNull(children.deletedAt));
      const parentIds = new Set(parents.map(p => p.parentUserId));
      allUsers = allUsers.filter(u => parentIds.has(u.id));
    }
    if (filter.tags?.length) {
      const tagged = await db.select({ userId: userTags.userId }).from(userTags).where(inArray(userTags.tag, filter.tags));
      const taggedIds = new Set(tagged.map(t => t.userId));
      allUsers = allUsers.filter(u => taggedIds.has(u.id));
    }
    if (filter.includeUserIds?.length) {
      const includeSet = new Set(filter.includeUserIds);
      allUsers = allUsers.filter(u => includeSet.has(u.id));
    }
    if (filter.excludeUserIds?.length) {
      const excludeSet = new Set(filter.excludeUserIds);
      allUsers = allUsers.filter(u => !excludeSet.has(u.id));
    }
    if (filter.phoneVerifiedOnly) {
      allUsers = allUsers.filter(u => u.phoneVerified);
    }

    return allUsers;
  }

  async getEligibleSmsRecipients(userIds: number[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    return db.select().from(users).where(
      and(
        inArray(users.id, userIds),
        isNull(users.deletedAt),
        eq(users.isActive, true),
        eq(users.smsOptIn, true),
        eq(users.phoneType, "mobile"),
      )
    );
  }

  // ======== SIGNUP EVENTS ========

  async getSignupEvents(): Promise<SignupEvent[]> {
    return db.select().from(signupEvents).where(isNull(signupEvents.deletedAt)).orderBy(desc(signupEvents.createdAt));
  }

  async getPublishedSignupEvents(): Promise<SignupEvent[]> {
    return db.select().from(signupEvents).where(and(eq(signupEvents.status, "published"), isNull(signupEvents.deletedAt))).orderBy(desc(signupEvents.eventDate));
  }

  async getSignupEvent(id: number): Promise<SignupEvent | undefined> {
    const [event] = await db.select().from(signupEvents).where(eq(signupEvents.id, id));
    return event;
  }

  async getSignupEventBySlug(slug: string): Promise<SignupEvent | undefined> {
    const [event] = await db.select().from(signupEvents).where(eq(signupEvents.slug, slug));
    return event;
  }

  async createSignupEvent(event: InsertSignupEvent): Promise<SignupEvent> {
    const [created] = await db.insert(signupEvents).values(event).returning();
    return created;
  }

  async updateSignupEvent(id: number, data: Partial<InsertSignupEvent>): Promise<SignupEvent | undefined> {
    const [updated] = await db.update(signupEvents).set({ ...data, updatedAt: new Date() }).where(eq(signupEvents.id, id)).returning();
    return updated;
  }

  async deleteSignupEvent(id: number): Promise<void> {
    await db.delete(signupSubmissions).where(eq(signupSubmissions.signupEventId, id));
    await db.delete(signupEvents).where(eq(signupEvents.id, id));
  }

  async incrementSignupCount(id: number): Promise<void> {
    await db.update(signupEvents).set({ currentSignupCount: sql`${signupEvents.currentSignupCount} + 1` }).where(eq(signupEvents.id, id));
  }

  async decrementSignupCount(id: number): Promise<void> {
    await db.update(signupEvents).set({ currentSignupCount: sql`GREATEST(${signupEvents.currentSignupCount} - 1, 0)` }).where(eq(signupEvents.id, id));
  }

  // ======== SIGNUP SUBMISSIONS ========

  async getSignupSubmissions(signupEventId: number): Promise<SignupSubmission[]> {
    return db.select().from(signupSubmissions).where(eq(signupSubmissions.signupEventId, signupEventId)).orderBy(desc(signupSubmissions.createdAt));
  }

  async getSignupSubmission(id: number): Promise<SignupSubmission | undefined> {
    const [submission] = await db.select().from(signupSubmissions).where(eq(signupSubmissions.id, id));
    return submission;
  }

  async getSignupSubmissionByUser(signupEventId: number, userId: number): Promise<SignupSubmission | undefined> {
    const [submission] = await db.select().from(signupSubmissions).where(and(eq(signupSubmissions.signupEventId, signupEventId), eq(signupSubmissions.userId, userId)));
    return submission;
  }

  async getUserSignupSubmissions(userId: number): Promise<SignupSubmission[]> {
    return db.select().from(signupSubmissions).where(eq(signupSubmissions.userId, userId)).orderBy(desc(signupSubmissions.createdAt));
  }

  async createSignupSubmission(submission: InsertSignupSubmission): Promise<SignupSubmission> {
    const [created] = await db.insert(signupSubmissions).values(submission).returning();
    return created;
  }

  async updateSignupSubmission(id: number, data: Partial<InsertSignupSubmission>): Promise<SignupSubmission | undefined> {
    const [updated] = await db.update(signupSubmissions).set({ ...data, updatedAt: new Date() }).where(eq(signupSubmissions.id, id)).returning();
    return updated;
  }

  async deleteSignupSubmission(id: number): Promise<void> {
    await db.delete(signupSubmissions).where(eq(signupSubmissions.id, id));
  }

  async getSignupSubmissionCount(signupEventId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(signupSubmissions).where(eq(signupSubmissions.signupEventId, signupEventId));
    return result[0]?.count ?? 0;
  }

  async getSignupSubmissionsByUserId(userId: number): Promise<SignupSubmission[]> {
    return db.select().from(signupSubmissions).where(eq(signupSubmissions.userId, userId)).orderBy(desc(signupSubmissions.createdAt));
  }

  async getFormSubmissionsByUserId(userId: number): Promise<FormSubmission[]> {
    return db.select().from(formSubmissions).where(eq(formSubmissions.userId, userId)).orderBy(desc(formSubmissions.submittedAt));
  }

  async getDonationsByEmail(email: string): Promise<Donation[]> {
    return db.select().from(donations).where(eq(donations.donorEmail, email)).orderBy(desc(donations.createdAt));
  }

  async getAllFormSubmissions(): Promise<FormSubmission[]> {
    return db.select().from(formSubmissions).orderBy(desc(formSubmissions.submittedAt));
  }

  async getAllSignupSubmissions(): Promise<SignupSubmission[]> {
    return db.select().from(signupSubmissions).orderBy(desc(signupSubmissions.createdAt));
  }

  async createLoginActivity(entry: InsertLoginActivity): Promise<LoginActivity> {
    const [result] = await db.insert(loginActivity).values(entry).returning();
    return result;
  }

  async getLoginActivity(limit = 100): Promise<LoginActivity[]> {
    return db.select().from(loginActivity).orderBy(desc(loginActivity.createdAt)).limit(limit);
  }

  async getPageViewsFiltered(filters: { startDate?: string; endDate?: string; path?: string }): Promise<PageView[]> {
    const conditions = [];
    if (filters.startDate) conditions.push(gte(pageViews.createdAt, new Date(filters.startDate)));
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(pageViews.createdAt, end));
    }
    if (filters.path) conditions.push(eq(pageViews.path, filters.path));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(pageViews).where(where).orderBy(desc(pageViews.createdAt));
  }

  async getLoginActivityFiltered(filters: { startDate?: string; endDate?: string; source?: string }): Promise<LoginActivity[]> {
    const conditions = [];
    if (filters.startDate) conditions.push(gte(loginActivity.createdAt, new Date(filters.startDate)));
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(loginActivity.createdAt, end));
    }
    if (filters.source) conditions.push(eq(loginActivity.source, filters.source));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(loginActivity).where(where).orderBy(desc(loginActivity.createdAt));
  }

  // ==================== MEDIA ====================
  async createMedia(data: InsertMedia): Promise<Media> {
    const [item] = await db.insert(media).values(data).returning();
    return item;
  }

  async getMedia(folder?: string): Promise<Media[]> {
    if (folder) {
      return db.select().from(media).where(eq(media.folder, folder)).orderBy(desc(media.createdAt));
    }
    return db.select().from(media).orderBy(desc(media.createdAt));
  }

  async getMediaById(id: number): Promise<Media | undefined> {
    const [item] = await db.select().from(media).where(eq(media.id, id));
    return item;
  }

  async deleteMedia(id: number): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  }

  async updateMedia(id: number, data: Partial<{ filename: string; folder: string }>): Promise<Media | undefined> {
    const [item] = await db.update(media).set(data).where(eq(media.id, id)).returning();
    return item;
  }

  async bulkDeleteMedia(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(media).where(inArray(media.id, ids));
  }

  async getMediaStorageStats(): Promise<{ totalBytes: number; fileCount: number }> {
    const [result] = await db.select({
      totalBytes: sql<number>`COALESCE(SUM(${media.size}), 0)`,
      fileCount: sql<number>`COUNT(*)`,
    }).from(media);
    return { totalBytes: Number(result.totalBytes), fileCount: Number(result.fileCount) };
  }

  async createMediaFolder(data: InsertMediaFolder): Promise<MediaFolder> {
    const [item] = await db.insert(mediaFolders).values(data).returning();
    return item;
  }

  async getMediaFolders(): Promise<MediaFolder[]> {
    return db.select().from(mediaFolders).orderBy(asc(mediaFolders.path));
  }

  async getMediaFolder(id: number): Promise<MediaFolder | undefined> {
    const [item] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, id));
    return item;
  }

  async updateMediaFolder(id: number, newPath: string): Promise<MediaFolder | undefined> {
    const folder = await this.getMediaFolder(id);
    if (!folder) return undefined;
    const oldPath = folder.path;
    // Update all media items in this folder and subfolders
    await db.execute(sql`UPDATE media SET folder = ${newPath} || SUBSTRING(folder FROM ${oldPath.length + 1}) WHERE folder = ${oldPath} OR folder LIKE ${oldPath + '/%'}`);
    const [updated] = await db.update(mediaFolders).set({ path: newPath }).where(eq(mediaFolders.id, id)).returning();
    // Also update any subfolder paths
    await db.execute(sql`UPDATE media_folders SET path = ${newPath} || SUBSTRING(path FROM ${oldPath.length + 1}) WHERE path LIKE ${oldPath + '/%'}`);
    return updated;
  }

  async deleteMediaFolder(id: number, action: "move_to_general" | "delete_contents"): Promise<void> {
    const folder = await this.getMediaFolder(id);
    if (!folder) return;
    if (action === "move_to_general") {
      await db.execute(sql`UPDATE media SET folder = 'general' WHERE folder = ${folder.path} OR folder LIKE ${folder.path + '/%'}`);
    } else {
      await db.execute(sql`DELETE FROM media WHERE folder = ${folder.path} OR folder LIKE ${folder.path + '/%'}`);
    }
    // Delete subfolders too
    await db.execute(sql`DELETE FROM media_folders WHERE path = ${folder.path} OR path LIKE ${folder.path + '/%'}`);
  }

  // ======== City Groups (Small Groups) ========

  async getCityGroups(): Promise<CityGroup[]> {
    return db.select().from(cityGroups).orderBy(asc(cityGroups.sortOrder));
  }

  async getActiveCityGroups(): Promise<CityGroup[]> {
    return db.select().from(cityGroups).where(eq(cityGroups.isActive, true)).orderBy(asc(cityGroups.sortOrder));
  }

  async getCityGroup(id: number): Promise<CityGroup | undefined> {
    const [group] = await db.select().from(cityGroups).where(eq(cityGroups.id, id));
    return group;
  }

  async createCityGroup(group: InsertCityGroup): Promise<CityGroup> {
    const [created] = await db.insert(cityGroups).values(group).returning();
    return created;
  }

  async updateCityGroup(id: number, data: Partial<InsertCityGroup>): Promise<CityGroup | undefined> {
    const [updated] = await db.update(cityGroups).set({ ...data, updatedAt: new Date() }).where(eq(cityGroups.id, id)).returning();
    return updated;
  }

  async deleteCityGroup(id: number): Promise<void> {
    await db.delete(cityGroups).where(eq(cityGroups.id, id));
  }

  // ======== City Group Signups ========

  async getCityGroupSignups(): Promise<CityGroupSignup[]> {
    return db.select().from(cityGroupSignups).orderBy(desc(cityGroupSignups.createdAt));
  }

  async getCityGroupSignup(id: number): Promise<CityGroupSignup | undefined> {
    const [signup] = await db.select().from(cityGroupSignups).where(eq(cityGroupSignups.id, id));
    return signup;
  }

  async createCityGroupSignup(signup: InsertCityGroupSignup): Promise<CityGroupSignup> {
    const [created] = await db.insert(cityGroupSignups).values(signup).returning();
    return created;
  }

  async deleteCityGroupSignup(id: number): Promise<void> {
    await db.delete(cityGroupSignups).where(eq(cityGroupSignups.id, id));
  }

  // ======== Planning Center Donations ========

  async getPcoDonations(): Promise<PcoDonation[]> {
    return db.select().from(pcoDonations).orderBy(desc(pcoDonations.receivedAt));
  }

  async getPcoDonationsByUserId(userId: number): Promise<PcoDonation[]> {
    return db.select().from(pcoDonations).where(eq(pcoDonations.userId, userId)).orderBy(desc(pcoDonations.receivedAt));
  }

  async getPcoDonationsByEmail(email: string): Promise<PcoDonation[]> {
    return db.select().from(pcoDonations).where(sql`lower(${pcoDonations.donorEmail}) = lower(${email})`).orderBy(desc(pcoDonations.receivedAt));
  }

  async getPcoDonationByPcoId(pcoDonationId: string): Promise<PcoDonation | undefined> {
    const [d] = await db.select().from(pcoDonations).where(eq(pcoDonations.pcoDonationId, pcoDonationId));
    return d;
  }

  async createPcoDonation(donation: InsertPcoDonation): Promise<PcoDonation> {
    const [created] = await db.insert(pcoDonations).values(donation).onConflictDoNothing().returning();
    return created;
  }

  async updatePcoDonation(id: number, data: Partial<InsertPcoDonation>): Promise<PcoDonation | undefined> {
    const [updated] = await db.update(pcoDonations).set(data).where(eq(pcoDonations.id, id)).returning();
    return updated;
  }

  async updatePcoDonationName(pcoPersonId: string, name: string): Promise<void> {
    await db.update(pcoDonations).set({ donorName: name }).where(
      and(eq(pcoDonations.pcoPersonId, pcoPersonId), sql`${pcoDonations.donorName} IS NULL`)
    );
  }

  async linkPcoDonationsToUser(email: string, userId: number): Promise<void> {
    await db.update(pcoDonations).set({ userId }).where(
      and(sql`lower(${pcoDonations.donorEmail}) = lower(${email})`, sql`${pcoDonations.userId} IS NULL`)
    );
  }

  // ======== User City Group Assignments ========

  async getUserCityGroups(userId: number): Promise<UserCityGroup[]> {
    return db.select().from(userCityGroups).where(eq(userCityGroups.userId, userId));
  }

  async getUsersByGroup(cityGroupId: number): Promise<UserCityGroup[]> {
    return db.select().from(userCityGroups).where(eq(userCityGroups.cityGroupId, cityGroupId));
  }

  async getAllUserCityGroups(): Promise<UserCityGroup[]> {
    return db.select().from(userCityGroups);
  }

  async addUserToGroup(data: InsertUserCityGroup): Promise<UserCityGroup> {
    const [created] = await db.insert(userCityGroups).values(data).onConflictDoNothing().returning();
    if (!created) {
      const [existing] = await db.select().from(userCityGroups)
        .where(and(eq(userCityGroups.userId, data.userId!), eq(userCityGroups.cityGroupId, data.cityGroupId!)));
      return existing;
    }
    return created;
  }

  async removeUserFromGroup(userId: number, cityGroupId: number): Promise<void> {
    await db.delete(userCityGroups).where(
      and(eq(userCityGroups.userId, userId), eq(userCityGroups.cityGroupId, cityGroupId))
    );
  }

  async setUserGroups(userId: number, groupIds: number[], otherGroupName?: string): Promise<void> {
    await db.delete(userCityGroups).where(eq(userCityGroups.userId, userId));
    if (groupIds.length > 0) {
      const values = groupIds.map(gid => ({
        userId,
        cityGroupId: gid,
        otherGroupName: undefined as string | undefined,
      }));
      await db.insert(userCityGroups).values(values).onConflictDoNothing();
    }
    if (otherGroupName) {
      await db.insert(userCityGroups).values({
        userId,
        cityGroupId: 0,
        otherGroupName,
      }).onConflictDoNothing();
    }
  }
}

export const storage = new DatabaseStorage();
