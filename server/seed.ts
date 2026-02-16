import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { log } from "./index";
import { AVAILABLE_ROLES, AVAILABLE_FEATURES } from "@shared/schema";

async function seedRolePermissions() {
  const existingPerms = await storage.getRolePermissions();
  if (existingPerms.length > 0) return;

  log("Seeding role permissions...", "seed");
  const defaultPermissions: Record<string, string[]> = {
    member: ["dashboard"],
    student_ministry: ["dashboard", "events", "pages", "messages", "connect"],
    kids_ministry: ["dashboard", "events", "pages", "messages", "connect"],
    small_group: ["dashboard", "events", "pages"],
    admin: [...AVAILABLE_FEATURES],
  };

  for (const [role, features] of Object.entries(defaultPermissions)) {
    for (const feature of AVAILABLE_FEATURES) {
      await storage.setRolePermission(role, feature, features.includes(feature));
    }
  }
}

async function seedSmsDefaults() {
  try {
    const existing = await storage.getSmsSettings();
    if (existing) return;

    await storage.upsertSmsSettings({
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || null,
      churchNamePrefix: "LC3: ",
      dailyLimit: 1000,
      monthlyLimit: 10000,
      quietHoursEnabled: true,
      quietHoursStart: "21:00",
      quietHoursEnd: "08:00",
      quietHoursTimezone: "America/New_York",
      autoReplyEnabled: true,
      autoReplyMessage: "Thanks for your message! For immediate assistance, please call the church office at (440) 234-2108.",
      includeOptOutFooter: true,
    });

    const groups = await storage.getSmsGroups();
    if (groups.length === 0) {
      await storage.createSmsGroup({ name: "All Members", description: "All registered church members", groupType: "all", filterCriteria: {}, createdBy: 1 });
      await storage.createSmsGroup({ name: "Kids Ministry Parents", description: "Parents with children in Kids Ministry", groupType: "ministry", filterCriteria: { hasChildren: true }, createdBy: 1 });
      await storage.createSmsGroup({ name: "Student Ministry", description: "Student ministry leaders and families", groupType: "role", filterCriteria: { roles: ["student_ministry"] }, createdBy: 1 });
      await storage.createSmsGroup({ name: "Small Group Leaders", description: "Small group coordinators and leaders", groupType: "role", filterCriteria: { roles: ["small_group"] }, createdBy: 1 });
    }

    const templates = await storage.getSmsTemplates();
    if (templates.length === 0) {
      await storage.createSmsTemplate({ name: "Sunday Reminder", body: "Hey {{first_name}}! Just a reminder that we'd love to see you this Sunday at 10:00 AM. See you there!", category: "reminder", createdBy: 1 });
      await storage.createSmsTemplate({ name: "Event Announcement", body: "Hi {{first_name}}, we have an exciting event coming up! Check our website for details.", category: "event", createdBy: 1 });
      await storage.createSmsTemplate({ name: "Weather Cancellation", body: "Due to weather, all activities at Lake City Christian Church are cancelled today. Stay safe!", category: "emergency", createdBy: 1 });
    }

    log("SMS defaults seeded", "seed");
  } catch (e) {
    log(`SMS seed error: ${e}`, "seed");
  }
}

export async function seedDatabase() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");

    await seedRolePermissions();
    await seedSmsDefaults();

    if (existingAdmin) {
      log("Database already seeded", "seed");
      return;
    }

    log("Seeding database...", "seed");

    const hashedPassword = await bcrypt.hash("lakecity2024", 10);
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      roles: ["super_admin", "admin"],
    });

    await storage.createTeamMember({
      name: "Trevor Littleton",
      role: "Lead Pastor",
      bio: "Trevor is passionate about scripture, apologetics and loves watching lives change for Jesus. Trevor graduated from CCU with a BS in Preaching Ministry and a Master of Divinity in Pastoral Leadership, a Master of Business Administration in Executive Coaching from Liberty University and has a Doctor of Ministry in Transformational Leadership from Ashland Theological Seminary. Beyond his heart for ministry, Trevor enjoys weightlifting and boxing, writing books, scouting out new restaurants, traveling, spending time with his wife Shanna and being a proud Dad.",
      sortOrder: 0,
      isFeatured: true,
      photoUrl: null,
    });

    const teamData = [
      { name: "J.D. McIntosh", role: "Discipleship Pastor", sortOrder: 1 },
      { name: "Michael Batt", role: "Management Team / Tech", sortOrder: 2 },
      { name: "Melissa Batt", role: "Kids Ministry Director", sortOrder: 3 },
      { name: "Joey Ekers", role: "Student Ministry Director", sortOrder: 4 },
      { name: "Shanna Littleton", role: "Communications / Ministry Assistant", sortOrder: 5 },
      { name: "Tim & Jen Orlosky", role: "Small Group Coordinators", sortOrder: 6 },
    ];

    for (const member of teamData) {
      await storage.createTeamMember({
        ...member,
        bio: null,
        photoUrl: null,
        isFeatured: false,
      });
    }

    await storage.createSermon({
      title: "The Heart of Worship",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      date: "2025-02-09",
      series: "Sunday Messages",
      description: "A message about authentic worship and connecting with God.",
    });

    await storage.createSermon({
      title: "Following Jesus Daily",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      date: "2025-02-02",
      series: "Sunday Messages",
      description: "Practical steps for following Jesus in everyday life.",
    });

    await storage.createSermon({
      title: "Building Community",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      date: "2025-01-26",
      series: "Better Together",
      description: "Why community matters and how to build genuine connections.",
    });

    await storage.createEvent({
      title: "Family Sunday",
      subtitle: "Lake City Christian Church",
      date: "SUNDAY MARCH 2ND @ 10:00AM",
      body: "The first Sunday of every month is Family Sunday! Families and kids worship together. The nursery space will remain open.",
      isUpcoming: true,
      imageUrl: null,
    });

    await storage.createEvent({
      title: "Club 419 Wednesday Night",
      subtitle: "Middle & High School Students",
      date: "WEDNESDAY FEB 19TH @ 6:30-8:00PM",
      body: "Students meet every Wednesday from 6:30 PM - 8:00 PM. Join us for food, fellowship, and faith.",
      isUpcoming: true,
      imageUrl: null,
    });

    await storage.createEvent({
      title: "Small Group Session Kickoff",
      subtitle: "All Adults Welcome",
      date: "SATURDAY FEB 15TH @ 6:00PM",
      body: "New 6-week small group session begins! Groups meet in homes around the Middleburg Heights and Strongsville area.",
      isUpcoming: true,
      imageUrl: null,
    });

    const defaultSettings = [
      { key: "church_name", value: "Lake City Christian Church" },
      { key: "address", value: "6717 Fry Road, Middleburg Heights, OH" },
      { key: "service_time", value: "Sunday @ 10:00 AM" },
      { key: "giving_url", value: "https://lake-city-christian-church-478123.churchcenter.com/giving" },
      { key: "instagram", value: "https://www.instagram.com/lakecitycc" },
      { key: "facebook", value: "https://www.facebook.com/LakeCityCCOhio" },
      { key: "youtube", value: "https://www.youtube.com/@LakeCityChristianChurch" },
    ];

    for (const setting of defaultSettings) {
      await storage.setSetting(setting.key, setting.value);
    }

    log("Database seeded successfully", "seed");
  } catch (error) {
    log(`Seed error: ${error}`, "seed");
  }
}
