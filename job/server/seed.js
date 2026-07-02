/** Seed data: demo users, jobs, applications, notifications, activity. */
"use strict";

const bcrypt = require("bcryptjs");
const store = require("./store");

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

const RESUME_RAHUL = {
  headline: "Security & Warehouse Operations Professional",
  summary: "Experienced security guard and warehouse executive with 2+ years in gate management, CCTV monitoring, inventory handling, and team coordination. Based in Jammu, open to full-time day shift roles.",
  phone: "+91 98765 43210",
  skills: ["CCTV Monitoring", "Gate Management", "Inventory Handling", "MS Excel Basics", "Team Leadership", "Hindi & English"],
  experience: [
    { id: "e1", title: "Security Guard", company: "City Mall Jammu", from: "2022", to: "Present", description: "Managed entry/exit gates, visitor logs, and night patrolling for a 3-floor commercial complex." },
    { id: "e2", title: "Warehouse Helper", company: "Local Logistics", from: "2020", to: "2022", description: "Assisted in picking, packing, and sorting goods. Maintained stock registers and loading dock safety." },
  ],
  education: [
    { id: "ed1", degree: "12th Pass (Arts)", school: "Govt. Higher Secondary School, Jammu", year: "2019" },
  ],
  file: { name: "Rahul_Sharma_Resume.pdf", size: 245760, type: "application/pdf", uploadedAt: daysAgo(14) },
  updatedAt: daysAgo(2),
};

const SEEKER_PROFILE_RAHUL = {
  phone: "+91 98765 43210",
  bio: "Dedicated security and warehouse professional based in Jammu. Open to full-time roles with growth opportunities.",
  experience: "1 - 3 Years",
  expectedSalary: 22000,
  preferredCategories: ["Security Jobs", "Warehouse", "Driver Jobs"],
  preferredShift: "Day Shift",
  openToWork: true,
  profileViews: 45,
  updatedAt: daysAgo(3),
};

const JOB_ALERTS_RAHUL = {
  enabled: true,
  keywords: ["Security Guard", "Driver", "Warehouse"],
  radius: 10,
  location: "Jammu, J&K",
  salaryMin: 15000,
  shift: "any",
  frequency: "instant",
  channels: { inApp: true, email: false },
  updatedAt: daysAgo(5),
};

const RESUME_PRIYA = {
  headline: "Customer Support & Delivery Professional",
  summary: "Motivated fresher with strong communication skills and basic computer knowledge. Looking for delivery or customer support roles in Jammu.",
  phone: "+91 91234 56780",
  skills: ["Customer Service", "Hindi & English", "Basic Computer", "Time Management"],
  experience: [],
  education: [
    { id: "ed1", degree: "Graduate (BA)", school: "University of Jammu", year: "2024" },
  ],
  file: null,
  updatedAt: daysAgo(5),
};

const USERS = [
  { id: "u-admin", role: "admin", name: "Admin", email: "admin@jobdozo.in", password: "admin123", company: "JobDozo" },
  { id: "u-super", role: "super-admin", name: "Super Admin", email: "super@jobdozo.in", password: "super123", company: "JobDozo" },
  { id: "u-recruiter", role: "recruiter", name: "Amit Recruiter", email: "recruiter@jobdozo.in", password: "recruiter123", company: "TechCorp Solutions", employerId: "u-techcorp" },
  { id: "u-techcorp", role: "employer", name: "TechCorp HR", email: "hr@techcorp.in", password: "employer123", company: "TechCorp Solutions", verified: true, wallet: 12450 },
  { id: "u-rahul", role: "seeker", name: "Rahul Sharma", email: "rahul@gmail.com", password: "rahul123", location: "Jammu, J&K", profilePct: 90, savedIds: ["j1", "j5", "j13"], resume: RESUME_RAHUL, jobAlerts: JOB_ALERTS_RAHUL, jobAlertsPrefsDone: true, seekerProfile: SEEKER_PROFILE_RAHUL },
  { id: "u-priya", role: "seeker", name: "Priya Verma", email: "priya@gmail.com", password: "priya123", location: "Jammu, J&K", profilePct: 65, savedIds: [], resume: RESUME_PRIYA },
];

const JOBS = [
  { id: "j1", title: "Security Guard", company: "G4S Security Services", logo: "G4S", logoBg: "linear-gradient(135deg,#e11d48,#be123c)", rating: 4.8, reviews: 245, salary: 18000, location: "Jammu, J&K", distance: 3, openings: 12, exp: "1-3", expLabel: "1 - 3 Years", tags: ["Full Time", "Day Shift"], type: "Full Time", shift: "Day Shift", verified: true, category: "Security Jobs", match: 92, postedAt: daysAgo(2), desc: "We are hiring trained security guards for commercial complexes in Jammu. Responsibilities include gate management, visitor logging, CCTV monitoring and patrolling. Uniform and training provided. ESI/PF benefits included." },
  { id: "j2", title: "Delivery Partner", company: "Blinkit", logo: "blinkit", logoBg: "linear-gradient(135deg,#facc15,#eab308)", logoColor: "#1f2937", rating: 4.6, reviews: 128, salary: 22000, location: "Jammu, J&K", distance: 5, openings: 20, exp: "Fresher", expLabel: "Fresher", tags: ["Full Time", "Flexible Shift"], type: "Full Time", shift: "Flexible Shift", verified: true, category: "Delivery Jobs", match: 88, postedAt: daysAgo(1), desc: "Join Blinkit as a delivery partner. Deliver groceries within 10 minutes in your locality. Own bike & smartphone required. Weekly payouts, fuel allowance, and joining bonus of ₹2,000." },
  { id: "j3", title: "Office Assistant", company: "Vijay Sales", logo: "VS", logoBg: "linear-gradient(135deg,#0f172a,#334155)", rating: 4.3, reviews: 89, salary: 20000, location: "Jammu, J&K", distance: 8, openings: 8, exp: "1-3", expLabel: "1 - 2 Years", tags: ["Full Time", "Day Shift"], type: "Full Time", shift: "Day Shift", verified: false, category: "Office Staff", match: 81, postedAt: daysAgo(3), desc: "Looking for an office assistant to handle billing support, file management, customer coordination and inventory entries. Basic computer knowledge (MS Excel) required." },
  { id: "j4", title: "Staff Nurse", company: "Apollo Hospitals", logo: "AP", logoBg: "linear-gradient(135deg,#0ea5e9,#0369a1)", rating: 4.9, reviews: 412, salary: 28000, location: "Jammu, J&K", distance: 7, openings: 15, exp: "1-3", expLabel: "1 - 3 Years", tags: ["Full Time", "Night Shift"], type: "Full Time", shift: "Night Shift", verified: false, category: "Healthcare", match: 76, postedAt: daysAgo(1), desc: "Apollo Hospitals Jammu is hiring GNM/B.Sc qualified staff nurses for ICU and general wards. Attractive salary, accommodation assistance and yearly increments." },
  { id: "j5", title: "Driver Cum Helper", company: "TCI Express", logo: "TCI", logoBg: "linear-gradient(135deg,#f97316,#c2410c)", rating: 4.4, reviews: 167, salary: 19000, location: "Jammu, J&K", distance: 4, openings: 10, exp: "1-3", expLabel: "1 - 3 Years", tags: ["Full Time", "Day Shift"], type: "Full Time", shift: "Day Shift", verified: true, category: "Driver Jobs", match: 90, postedAt: daysAgo(2), desc: "TCI Express requires drivers with valid LMV license for local goods transport in Jammu region. Loading/unloading assistance required. Overtime paid separately." },
  { id: "j6", title: "Warehouse Executive", company: "Amazon", logo: "a", logoBg: "linear-gradient(135deg,#111827,#374151)", logoColor: "#f59e0b", rating: 4.5, reviews: 980, salary: 25000, location: "Jammu, J&K", distance: 9, openings: 25, exp: "Fresher", expLabel: "Fresher", tags: ["Full Time", "Flexible Shift"], type: "Full Time", shift: "Flexible Shift", verified: true, category: "Warehouse", match: 95, postedAt: daysAgo(1), desc: "Amazon fulfillment center hiring warehouse executives for picking, packing and sorting operations. Free transport, meals, medical insurance and performance incentives." },
  { id: "j7", title: "Customer Support", company: "Teleperformance", logo: "TP", logoBg: "linear-gradient(135deg,#8b5cf6,#6d28d9)", rating: 4.2, reviews: 540, salary: 21000, location: "Jammu, J&K", distance: 12, openings: 30, exp: "Fresher", expLabel: "Fresher", tags: ["Full Time", "Day Shift"], type: "Full Time", shift: "Day Shift", verified: true, category: "IT Jobs", match: 88, postedAt: daysAgo(4), desc: "Voice & chat process for domestic customers. Good Hindi communication required. 5-day work week, cab facility for night shifts, attractive incentives." },
  { id: "j8", title: "Housekeeping Staff", company: "Taj Vivanta", logo: "Taj", logoBg: "linear-gradient(135deg,#b91c1c,#7f1d1d)", rating: 4.7, reviews: 210, salary: 16000, location: "Jammu, J&K", distance: 6, openings: 18, exp: "Fresher", expLabel: "Fresher", tags: ["Full Time", "Morning Shift"], type: "Full Time", shift: "Morning Shift", verified: true, category: "Housekeeping", match: 72, postedAt: daysAgo(5), desc: "5-star hotel hiring housekeeping staff for room cleaning and laundry services. Food and uniform provided. Tips and service charge benefits." },
  { id: "j9", title: "Electrician", company: "Urban Company", logo: "UC", logoBg: "linear-gradient(135deg,#0f766e,#115e59)", rating: 4.5, reviews: 320, salary: 26000, location: "Jammu, J&K", distance: 5, openings: 9, exp: "3-5", expLabel: "3 - 5 Years", tags: ["Contract", "Flexible Shift"], type: "Contract", shift: "Flexible Shift", verified: true, category: "Electrician", match: 70, postedAt: daysAgo(2), desc: "ITI certified electricians needed for home services. Earn per job basis up to ₹40,000/month. Flexible working hours, free training and toolkit support." },
  { id: "j10", title: "Sales Executive", company: "Reliance Digital", logo: "RD", logoBg: "linear-gradient(135deg,#1d4ed8,#1e3a8a)", rating: 4.1, reviews: 450, salary: 23000, location: "Jammu, J&K", distance: 8, openings: 14, exp: "1-3", expLabel: "1 - 3 Years", tags: ["Full Time", "Day Shift"], type: "Full Time", shift: "Day Shift", verified: true, category: "Sales Jobs", match: 79, postedAt: daysAgo(3), desc: "In-store sales executive for electronics. Convert walk-in customers, achieve monthly targets, earn incentives up to ₹8,000/month over salary." },
  { id: "j11", title: "Plumber", company: "NoBroker Hood", logo: "NB", logoBg: "linear-gradient(135deg,#dc2626,#991b1b)", rating: 4.0, reviews: 95, salary: 17500, location: "Jammu, J&K", distance: 11, openings: 6, exp: "1-3", expLabel: "1 - 3 Years", tags: ["Part Time", "Flexible Shift"], type: "Part Time", shift: "Flexible Shift", verified: false, category: "Plumber", match: 65, postedAt: daysAgo(6), desc: "Experienced plumbers required for society maintenance work. Part-time or full-time options available. Per-visit payment plus monthly retainer." },
  { id: "j12", title: "Data Entry Operator", company: "Wipro", logo: "W", logoBg: "linear-gradient(135deg,#16a34a,#15803d)", rating: 4.4, reviews: 760, salary: 19500, location: "Jammu, J&K", distance: 10, openings: 22, exp: "Fresher", expLabel: "Fresher", tags: ["Full Time", "Day Shift"], type: "Full Time", shift: "Day Shift", verified: true, category: "IT Jobs", match: 84, postedAt: daysAgo(1), desc: "Data entry operators required with typing speed of 30+ WPM. Computer with basic MS Office knowledge required. Work from office, fixed day shift." },
  { id: "j13", title: "Bike Rider", company: "Zomato", logo: "z", logoBg: "linear-gradient(135deg,#ef4444,#b91c1c)", rating: 4.3, reviews: 1500, salary: 24000, location: "Jammu, J&K", distance: 2, openings: 40, exp: "Fresher", expLabel: "Fresher", tags: ["Part Time", "Flexible Shift"], type: "Part Time", shift: "Flexible Shift", verified: true, category: "Delivery Jobs", match: 86, postedAt: daysAgo(1), desc: "Food delivery riders needed. Work on your own schedule. Weekly payouts, surge bonuses on weekends, free insurance coverage while on duty." },
  { id: "j14", title: "Receptionist", company: "Fortis Healthcare", logo: "F", logoBg: "linear-gradient(135deg,#7c3aed,#5b21b6)", rating: 4.6, reviews: 280, salary: 21500, location: "Jammu, J&K", distance: 9, openings: 4, exp: "1-3", expLabel: "1 - 3 Years", tags: ["Full Time", "Morning Shift"], type: "Full Time", shift: "Morning Shift", verified: true, category: "Office Staff", match: 74, postedAt: daysAgo(4), desc: "Front-desk receptionist for hospital OPD. Patient registration, appointment scheduling and billing coordination. Pleasant communication skills required." },
  { id: "j15", title: "Security Supervisor", company: "SIS India", logo: "SIS", logoBg: "linear-gradient(135deg,#0369a1,#075985)", rating: 4.5, reviews: 190, salary: 32000, location: "Jammu, J&K", distance: 14, openings: 3, exp: "5+", expLabel: "5+ Years", tags: ["Full Time", "Night Shift"], type: "Full Time", shift: "Night Shift", verified: true, category: "Security Jobs", match: 68, postedAt: daysAgo(7), desc: "Ex-servicemen preferred. Supervise guard deployment across 3 sites, manage rosters and conduct surprise checks. Two-wheeler mandatory." },
  { id: "j16", title: "Cook / Chef", company: "Radisson Blu", logo: "RB", logoBg: "linear-gradient(135deg,#312e81,#1e1b4b)", rating: 4.8, reviews: 150, salary: 35000, location: "Jammu, J&K", distance: 13, openings: 5, exp: "3-5", expLabel: "3 - 5 Years", tags: ["Full Time", "Morning Shift"], type: "Full Time", shift: "Morning Shift", verified: true, category: "Housekeeping", match: 60, postedAt: daysAgo(5), desc: "Commi-II / CDP level cooks for Indian & continental kitchen. Hotel experience mandatory. Duty meals, accommodation and annual bonus provided." },
];

function seed() {
  if (!store.isEmpty()) return false;
  console.log("[seed] seeding database...");

  const users = store.col("users");
  for (const u of USERS) {
    const { password, ...rest } = u;
    users.insert({ ...rest, passwordHash: bcrypt.hashSync(password, 8) });
  }

  const jobs = store.col("jobs");
  for (const j of JOBS) {
    jobs.insert({ ...j, employerId: "u-techcorp", status: "active", views: 200 + Math.floor(Math.random() * 900) });
  }

  const apps = store.col("applications");
  apps.insert({ id: "a1", jobId: "j1", seekerId: "u-rahul", name: "Rahul Sharma", email: "rahul@gmail.com", phone: "+91 98765 43210", experience: "1 - 3 Years", status: "Interview", note: "Interview scheduled — check your schedule", interview: { date: new Date().toISOString().slice(0, 10), time: "11:00", mode: "Video Call", link: "https://meet.JobDozo.in/g4s-rahul" }, createdAt: daysAgo(2) });
  apps.insert({ id: "a2", jobId: "j6", seekerId: "u-rahul", name: "Rahul Sharma", email: "rahul@gmail.com", phone: "+91 98765 43210", experience: "1 - 3 Years", status: "Shortlisted", note: "HR is reviewing your profile", createdAt: daysAgo(3) });
  apps.insert({ id: "a3", jobId: "j2", seekerId: "u-priya", name: "Priya Verma", email: "priya@gmail.com", phone: "+91 91234 56780", experience: "Fresher", status: "Applied", note: "Application sent", createdAt: daysAgo(1) });

  const notifs = store.col("notifications");
  notifs.insert({ userId: "u-rahul", icon: "fa-phone", bg: "#8b5cf6", text: "Interview call scheduled with G4S — Tomorrow 11 AM", read: false, createdAt: daysAgo(0.1) });
  notifs.insert({ userId: "u-rahul", icon: "fa-circle-check", bg: "#16a34a", text: "You were shortlisted by Amazon", read: false, createdAt: daysAgo(0.3) });
  notifs.insert({ userId: "u-techcorp", icon: "fa-file-lines", bg: "#3b82f6", text: "New application received for Delivery Partner", read: false, createdAt: daysAgo(1) });

  const activity = store.col("activity");
  activity.insert({ icon: "fa-briefcase", bg: "#3b82f6", title: "New job posted", sub: "Security Guard by G4S Security Services", createdAt: daysAgo(0.05) });
  activity.insert({ icon: "fa-user-plus", bg: "#22c55e", title: "New user registered", sub: "Rahul Sharma joined as Job Seeker", createdAt: daysAgo(0.2) });
  activity.insert({ icon: "fa-file-lines", bg: "#8b5cf6", title: "Job application received", sub: "Application for Delivery Partner", createdAt: daysAgo(0.4) });
  activity.insert({ icon: "fa-circle-check", bg: "#16a34a", title: "Employer verified", sub: "TechCorp Solutions verified", createdAt: daysAgo(1) });

  seedMessages();

  console.log("[seed] done — %d users, %d jobs", USERS.length, JOBS.length);
  return true;
}

function seedMessages() {
  const convs = store.col("conversations");
  const msgs = store.col("messages");
  if (convs.count()) return;

  const c1 = convs.insert({
    id: "conv1", seekerId: "u-rahul", employerId: "u-techcorp", jobId: "j6", applicationId: "a2",
    lastMessage: "Great! I've scheduled your interview. Please check your dashboard.",
    lastAt: daysAgo(0.15), unreadSeeker: 0, unreadEmployer: 0,
  });
  msgs.insert({ conversationId: c1.id, senderId: "u-techcorp", text: "Hi Rahul, we reviewed your profile for Warehouse Executive. Can you join a video call tomorrow?", read: true, createdAt: daysAgo(0.5) });
  msgs.insert({ conversationId: c1.id, senderId: "u-rahul", text: "Yes, I'm available after 2 PM. Thank you!", read: true, createdAt: daysAgo(0.4) });
  msgs.insert({ conversationId: c1.id, senderId: "u-techcorp", text: "Great! I've scheduled your interview. Please check your dashboard.", read: true, createdAt: daysAgo(0.15) });

  const c2 = convs.insert({
    id: "conv2", seekerId: "u-rahul", employerId: "u-techcorp", jobId: "j1", applicationId: "a1",
    lastMessage: "Please join the video call 5 minutes early. Meeting link is in your interview details.",
    lastAt: daysAgo(0.08), unreadSeeker: 1, unreadEmployer: 0,
  });
  msgs.insert({ conversationId: c2.id, senderId: "u-techcorp", text: "Congratulations! Your Security Guard application has been shortlisted.", read: true, createdAt: daysAgo(0.3) });
  msgs.insert({ conversationId: c2.id, senderId: "u-techcorp", text: "Your interview is confirmed for 11 AM today. Are you available?", read: true, createdAt: daysAgo(0.2) });
  msgs.insert({ conversationId: c2.id, senderId: "u-rahul", text: "Yes, I'll be ready. Should I bring my ID proof?", read: true, createdAt: daysAgo(0.12) });
  msgs.insert({ conversationId: c2.id, senderId: "u-techcorp", text: "Please join the video call 5 minutes early. Meeting link is in your interview details.", read: false, createdAt: daysAgo(0.08) });
}

function seedSeekerSettings() {
  const users = store.col("users");
  const u = users.byId("u-rahul");
  if (u && !u.settings) {
    const settings = require("./settings");
    users.update("u-rahul", {
      settings: settings.normalizeSettings({
        notifications: { applicationUpdates: true, messages: true, jobAlerts: true, interviewReminders: true },
        preferences: { theme: "light", language: "en" },
      }),
    });
    console.log("[seed] seeker settings for Rahul");
  }
}

function seedSubscriptions() {
  const users = store.col("users");
  const bills = store.col("billing");
  const u = users.byId("u-rahul");
  if (u && !u.subscription) {
    users.update("u-rahul", { subscription: { planId: "free", planName: "Free", status: "active", price: 0, premium: false } });
  }
  if (bills.count()) return;
  bills.insert({
    userId: "u-rahul", planId: "monthly", planName: "Premium Monthly", amount: 199,
    status: "cancelled", method: "demo", description: "Premium Monthly subscription (ended)",
    createdAt: daysAgo(90),
  });
  console.log("[seed] billing history sample");
}

function seedSeekerProfiles() {
  const users = store.col("users");
  const patches = [
    { id: "u-rahul", seekerProfile: SEEKER_PROFILE_RAHUL },
  ];
  let n = 0;
  for (const p of patches) {
    const u = users.byId(p.id);
    if (u && !u.seekerProfile) {
      users.update(p.id, { seekerProfile: p.seekerProfile });
      n++;
    }
  }
  if (n) console.log("[seed] seeker profile added for %d user(s)", n);
}

function seedJobAlerts() {
  const users = store.col("users");
  const matches = store.col("alertMatches");
  const u = users.byId("u-rahul");
  if (u && !u.jobAlerts) users.update("u-rahul", { jobAlerts: JOB_ALERTS_RAHUL, jobAlertsPrefsDone: true });

  if (matches.count()) return;
  const jobs = store.col("jobs");
  const samples = [
    { jobId: "j1", keywords: ["Security Guard"], days: 1 },
    { jobId: "j5", keywords: ["Driver"], days: 2 },
    { jobId: "j13", keywords: ["Driver"], days: 0.5 },
  ];
  for (const s of samples) {
    const j = jobs.byId(s.jobId);
    if (!j) continue;
    matches.insert({
      userId: "u-rahul", jobId: s.jobId, keywords: s.keywords,
      reason: `Matched: ${s.keywords.join(", ")}`,
      matchedAt: daysAgo(s.days), read: s.days > 1,
    });
  }
  if (samples.length) console.log("[seed] job alert history for Rahul");
}

function seedSkillTests() {
  const sessions = store.col("skillSessions");
  if (sessions.count()) return;

  const skillEngine = require("./skill-tests");
  const completed = [
    { userId: "u-rahul", testId: "communication", score: 85 },
    { userId: "u-rahul", testId: "computer", score: 92 },
  ];
  for (const c of completed) {
    const test = skillEngine.getTest(c.testId);
    const questions = skillEngine.pickQuestions(c.testId, { id: c.userId, resume: RESUME_RAHUL }, test.questionCount);
    const { breakdown } = skillEngine.gradeSession(questions, Object.fromEntries(questions.map((q, i) => [q.id, i < Math.round(questions.length * c.score / 100) ? q.correctIndex : (q.correctIndex + 1) % 4])));
    const aiFeedback = skillEngine.generateAiFeedback(test, c.score, breakdown, { name: "Rahul Sharma" });
    sessions.insert({
      userId: c.userId, testId: c.testId, testTitle: test.title, category: test.category,
      duration: test.duration, status: "completed", questions, answers: {},
      score: c.score, aiFeedback, breakdown, startedAt: daysAgo(3), expiresAt: daysAgo(3),
      completedAt: daysAgo(2),
    });
  }
  console.log("[seed] skill test history for Rahul");
}

function seedResumes() {
  const users = store.col("users");
  const patches = [
    { id: "u-rahul", resume: RESUME_RAHUL },
    { id: "u-priya", resume: RESUME_PRIYA },
  ];
  let n = 0;
  for (const p of patches) {
    const u = users.byId(p.id);
    if (u && !u.resume) {
      users.update(p.id, { resume: p.resume });
      n++;
    }
  }
  if (n) console.log("[seed] resume data added for %d seeker(s)", n);
}

function reseed() {
  store.reset();
  seed();
}

module.exports = { seed, reseed, seedMessages, seedResumes, seedSkillTests, seedJobAlerts, seedSeekerProfiles, seedSubscriptions, seedSeekerSettings };
