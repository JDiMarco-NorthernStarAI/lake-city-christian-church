import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { log } from "./index";
import { AVAILABLE_ROLES, AVAILABLE_FEATURES } from "@shared/schema";

async function seedRolePermissions() {
  const existingPerms = await storage.getRolePermissions();

  const defaultPermissions: Record<string, string[]> = {
    member: ["dashboard"],
    student_ministry: ["dashboard", "events", "pages", "messages", "connect", "forms", "signups"],
    kids_ministry: ["dashboard", "events", "pages", "messages", "connect", "forms", "signups"],
    small_group: ["dashboard", "events", "pages", "signups"],
    admin: [...AVAILABLE_FEATURES],
    super_admin: [...AVAILABLE_FEATURES],
  };

  const existingKeys = new Set(existingPerms.map((p) => `${p.role}:${p.feature}`));

  let added = 0;
  for (const role of AVAILABLE_ROLES) {
    const enabledFeatures = defaultPermissions[role] || [];
    for (const feature of AVAILABLE_FEATURES) {
      const key = `${role}:${feature}`;
      if (!existingKeys.has(key)) {
        await storage.setRolePermission(role, feature, enabledFeatures.includes(feature));
        added++;
      }
    }
  }

  if (added > 0) {
    log(`Role permissions updated: ${added} entries added`, "seed");
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

async function seedFormsAndSignups() {
  try {
    const existingForms = await storage.getForms();
    if (existingForms.length === 0) {
      const studentForm = await storage.createForm({
        title: "Required Student/Guardian Information",
        description: "Student Ministry Director: Joey Ekers. Please fill out this form if your student is attending a Club 419 Wednesday gathering.",
        slug: "student-info",
        status: "published",
        submitButtonText: "Submit",
        successMessage: "Thank you for submitting your student information! We look forward to seeing them at Club 419.",
        requireAuth: false,
        allowMultiple: true,
        createdBy: 1,
      });

      const studentFields = [
        { formId: studentForm.id, label: "Student First & Last Name", fieldType: "text" as const, required: true, placeholder: "Enter student full name", sortOrder: 0 },
        { formId: studentForm.id, label: "Student Cell Phone", fieldType: "text" as const, required: false, placeholder: "Enter phone number", sortOrder: 1 },
        { formId: studentForm.id, label: "Student Address", fieldType: "text" as const, required: false, placeholder: "Enter student address", sortOrder: 2 },
        { formId: studentForm.id, label: "Student Date of Birth", fieldType: "text" as const, required: true, placeholder: "MM/DD/YYYY", sortOrder: 3 },
        { formId: studentForm.id, label: "Parent/Guardian First and Last Name", fieldType: "text" as const, required: true, placeholder: "Enter parent/guardian full name", sortOrder: 4 },
        { formId: studentForm.id, label: "2nd Parent/Guardian First and Last Name", fieldType: "text" as const, required: false, placeholder: "Enter second parent/guardian full name", sortOrder: 5 },
        { formId: studentForm.id, label: "Emergency Contact: Name and Number", fieldType: "text" as const, required: true, placeholder: "Enter name and phone number", sortOrder: 6 },
        { formId: studentForm.id, label: "2nd Emergency Contact: Name and Number", fieldType: "text" as const, required: true, placeholder: "Enter name and phone number", sortOrder: 7 },
        { formId: studentForm.id, label: "Any Medical Concerns or Limitations?", fieldType: "textarea" as const, required: false, placeholder: "List any medical concerns or limitations", sortOrder: 8 },
        { formId: studentForm.id, label: "Allergies", fieldType: "checkbox" as const, required: true, options: ["Nuts", "Seasonal", "Medication", "None", "Other"], sortOrder: 9 },
        { formId: studentForm.id, label: "Does the student have a drivers license?", fieldType: "select" as const, required: true, options: ["Yes", "No", "Learners Permit: must be accompanied by an adult"], sortOrder: 10 },
        { formId: studentForm.id, label: "Questions or Concerns?", fieldType: "textarea" as const, required: false, placeholder: "Any questions or concerns you would like to share", sortOrder: 11 },
      ];
      for (const field of studentFields) {
        await storage.createFormField(field as any);
      }

      const sponsorForm = await storage.createForm({
        title: "Club 419 Meal Sponsors",
        description: "Lake City Student Ministry Director: Joey Ekers",
        slug: "club419-meal-sponsor",
        status: "published",
        submitButtonText: "Submit",
        successMessage: "Thank you for sponsoring a meal for Club 419! The students truly appreciate your generosity.",
        requireAuth: false,
        allowMultiple: true,
        createdBy: 1,
      });

      const sponsorFields = [
        { formId: sponsorForm.id, label: "First and Last Name", fieldType: "text" as const, required: true, placeholder: "Enter your full name", sortOrder: 0 },
        { formId: sponsorForm.id, label: "Phone Number", fieldType: "text" as const, required: true, placeholder: "Enter your phone number", sortOrder: 1 },
        { formId: sponsorForm.id, label: "Select what you'd like to sponsor", fieldType: "radio" as const, required: true, options: ["Meal", "Snack", "Drinks"], sortOrder: 2 },
        { formId: sponsorForm.id, label: "What items are you providing?", fieldType: "textarea" as const, required: false, placeholder: "Describe what items you will be providing", sortOrder: 3 },
        { formId: sponsorForm.id, label: "Select the date you are sponsoring a Meal/Snack", fieldType: "select" as const, required: false, options: ["Wednesday February 4", "Wednesday February 11", "Wednesday February 18", "Wednesday February 25", "Wednesday March 4", "Wednesday March 11", "Wednesday March 18", "Wednesday March 25", "Wednesday April 1", "Wednesday April 8", "Wednesday April 15", "Wednesday April 22", "Wednesday April 29"], sortOrder: 4 },
      ];
      for (const field of sponsorFields) {
        await storage.createFormField(field as any);
      }

      log("Forms seeded", "seed");
    }

    const existingSignups = await storage.getSignupEvents();
    const seededForms = await storage.getForms();
    const defaultFormId = seededForms[0]?.id || null;
    if (existingSignups.length === 0) {
      await storage.createSignupEvent({
        title: "VBS 2026 Registration",
        slug: "vbs-2026",
        description: 'Vacation Bible School is back! Register your children for an amazing week of fun, learning, and faith. This year\'s theme is "Deep Sea Adventure" - exploring God\'s love through underwater exploration.',
        formId: defaultFormId,
        category: "event",
        status: "published",
        visibility: "public",
        eventDate: new Date("2026-06-15T09:00:00"),
        location: "Lake City Christian Church, 6717 Fry Rd",
        maxSignups: 60,
        waitlistEnabled: true,
        cost: "Free",
        contactName: "Pastor Sarah",
        contactEmail: "kids@lakecitycc.org",
        postSubmissionSettings: { displayType: "thank_you", successMessage: "Thank you for registering your child for VBS 2026! You will receive a confirmation email shortly." },
        createdBy: 1,
      } as any);

      await storage.createSignupEvent({
        title: "Spring Retreat 2026",
        slug: "spring-retreat-2026",
        description: "Join us for a refreshing weekend getaway at Mohican State Park. A time of worship, fellowship, and renewal. Cabins and meals provided. All adults welcome!",
        formId: defaultFormId,
        category: "trip",
        status: "published",
        visibility: "public",
        eventDate: new Date("2026-04-10T18:00:00"),
        location: "Mohican State Park, Loudonville, OH",
        maxSignups: 30,
        waitlistEnabled: true,
        cost: "$75 per person",
        contactName: "Pastor Mike",
        contactEmail: "info@lakecitycc.org",
        postSubmissionSettings: { displayType: "summary_all", successMessage: "You're signed up for the Spring Retreat!" },
        createdBy: 1,
      } as any);

      await storage.createSignupEvent({
        title: "Wednesday Night Volunteer Team",
        slug: "wednesday-volunteers",
        description: "Help serve at our Wednesday night programming. Volunteers are needed for hospitality, tech, kids ministry, and student ministry. Choose your preferred area when you sign up.",
        formId: defaultFormId,
        category: "volunteer",
        status: "published",
        visibility: "public",
        location: "Lake City Christian Church",
        waitlistEnabled: false,
        contactName: "Volunteer Coordinator",
        contactEmail: "volunteer@lakecitycc.org",
        postSubmissionSettings: { displayType: "thank_you", successMessage: "Thank you for volunteering! Our coordinator will reach out to confirm your placement." },
        createdBy: 1,
      } as any);

      await storage.createSignupEvent({
        title: "New Member Class - Spring Session",
        slug: "new-member-spring",
        description: "Interested in learning more about Lake City Christian Church? This 4-week class covers our beliefs, mission, and how to get connected. Meets Sundays at 11:30 AM.",
        formId: defaultFormId,
        category: "class",
        status: "draft",
        visibility: "public",
        eventDate: new Date("2026-03-08T11:30:00"),
        location: "Room 201, LC3",
        maxSignups: 20,
        waitlistEnabled: false,
        cost: "Free",
        contactName: "Pastor John",
        contactEmail: "john@lakecitycc.org",
        postSubmissionSettings: { displayType: "thank_you" },
        createdBy: 1,
      } as any);

      log("Signup events seeded", "seed");
    }
  } catch (e) {
    log(`Forms/signups seed error: ${e}`, "seed");
  }
}

async function seedDonationFunds() {
  try {
    const existingFunds = await storage.getDonationFunds();
    if (existingFunds.length > 0) return;

    log("Seeding donation funds...", "seed");
    const defaultFunds = [
      { name: "General Fund", slug: "general", description: "Support the overall mission and operations of LC3", isActive: true, sortOrder: 0 },
      { name: "Missions", slug: "missions", description: "Support local and global mission work", isActive: true, sortOrder: 1 },
      { name: "Building Fund", slug: "building", description: "Support facility improvements and maintenance", isActive: true, sortOrder: 2 },
    ];
    for (const fund of defaultFunds) {
      await storage.createDonationFund(fund);
    }
    log("Donation funds seeded", "seed");
  } catch (err) {
    log("Error seeding donation funds: " + err, "seed");
  }
}

async function cleanupData() {
  try {
    const team = await storage.getTeamMembers();
    const seen = new Set<string>();
    for (const member of team) {
      const key = member.name.toLowerCase();
      if (key === "j.d. mcintosh" || seen.has(key)) {
        await storage.deleteTeamMember(member.id);
      } else {
        seen.add(key);
      }
    }
    const trevors = team.filter(m => m.name === "Trevor Littleton" && !seen.has("_trevor_updated"));
    if (trevors.length > 0) {
      const trevor = trevors[0];
      if (trevor.bio && !trevor.bio.includes("eager to see what God has in store for LC3")) {
        await storage.updateTeamMember(trevor.id, {
          bio: "Trevor is passionate about scripture, apologetics and loves watching lives change for Jesus. Trevor graduated from CCU with a BS in Preaching Ministry and a Master of Divinity in Pastoral Leadership, a Master of Business Administration in Executive Coaching from Liberty University and has a Doctor of Ministry in Transformational Leadership from Ashland Theological Seminary. Beyond his heart for ministry, Trevor enjoys weightlifting and boxing, writing books, scouting out new restaurants. Trevor is married to his wife Shanna. They both have a deep passion for adoption. Their family is made up of 11 children; four biological, five adopted from Ukraine, including two surrogate daughters. Together they have a heart for community and are eager to see what God has in store for LC3.",
        });
      }
    }
    const signups = await storage.getSignupEvents();
    for (const signup of signups) {
      await storage.deleteSignupEvent(signup.id);
    }
    log("Data cleanup completed", "seed");
  } catch (e) {
    log(`Data cleanup error: ${e}`, "seed");
  }
}

export async function seedDatabase() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");

    await seedRolePermissions();
    await seedSmsDefaults();

    await seedDonationFunds();

    await cleanupData();

    if (existingAdmin) {
      log("Database already seeded", "seed");
      return;
    }

    log("Seeding database...", "seed");

    const hashedPassword = await bcrypt.hash("lakecity2024", 10);
    await storage.createUser({
      username: "admin",
      email: "admin@lakecitychristian.church",
      name: "Admin",
      password: hashedPassword,
      roles: ["super_admin", "admin"],
    });

    await storage.createTeamMember({
      name: "Trevor Littleton",
      role: "Lead Pastor",
      bio: "Trevor is passionate about scripture, apologetics and loves watching lives change for Jesus. Trevor graduated from CCU with a BS in Preaching Ministry and a Master of Divinity in Pastoral Leadership, a Master of Business Administration in Executive Coaching from Liberty University and has a Doctor of Ministry in Transformational Leadership from Ashland Theological Seminary. Beyond his heart for ministry, Trevor enjoys weightlifting and boxing, writing books, scouting out new restaurants. Trevor is married to his wife Shanna. They both have a deep passion for adoption. Their family is made up of 11 children; four biological, five adopted from Ukraine, including two surrogate daughters. Together they have a heart for community and are eager to see what God has in store for LC3.",
      sortOrder: 0,
      isFeatured: true,
      photoUrl: null,
    });

    const teamData = [
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
