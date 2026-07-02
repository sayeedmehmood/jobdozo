/** Employer portal helpers — dashboard, company, talent search, billing. */
"use strict";

const seekerProfile = require("./profile");

const DEFAULT_COMPANY = {
  tagline: "",
  about: "",
  website: "",
  industry: "Technology",
  size: "51-200",
  founded: "2015",
  locations: [],
  benefits: [],
  culture: "",
  social: { linkedin: "", twitter: "", facebook: "" },
  gallery: [],
  team: [],
  verified: false,
};

const DEFAULT_EMPLOYER_SETTINGS = {
  notifications: {
    newApplications: true,
    messages: true,
    interviews: true,
    billing: true,
    marketing: false,
  },
  team: { inviteEnabled: true },
  preferences: { theme: "light", language: "en" },
};

const DEFAULT_PLANS = [
  { id: "starter", name: "Starter", price: 0, credits: 50, jobs: 3, features: ["3 active jobs", "50 candidate views/mo", "Basic analytics"] },
  { id: "growth", name: "Growth", price: 2999, credits: 500, jobs: 15, popular: true, features: ["15 active jobs", "500 unlocks", "AI screening", "Priority support"] },
  { id: "enterprise", name: "Enterprise", price: 9999, credits: 5000, jobs: 999, features: ["Unlimited jobs", "Dedicated AM", "API access", "Multi-location"] },
];

function normalizeCompany(raw, user) {
  const c = { ...DEFAULT_COMPANY, ...(raw || {}) };
  c.name = user?.company || user?.name || "";
  c.verified = !!user?.verified;
  return c;
}

function normalizeSettings(raw) {
  const s = JSON.parse(JSON.stringify(DEFAULT_EMPLOYER_SETTINGS));
  const r = raw || {};
  if (r.notifications) Object.assign(s.notifications, r.notifications);
  if (r.preferences) Object.assign(s.preferences, r.preferences);
  return s;
}

function employerJobIds(jobs, userId) {
  return jobs.filter((j) => j.employerId === userId).map((j) => j.id);
}

function dashboardPayload(user, jobs, applications, activity, notifications) {
  const myJobs = jobs.filter((j) => j.employerId === user.id);
  const jobIds = new Set(myJobs.map((j) => j.id));
  const apps = applications
    .filter((a) => jobIds.has(a.jobId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const funnel = {
    applied: apps.filter((a) => a.status === "Applied").length,
    viewed: apps.filter((a) => a.status === "Viewed").length,
    shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
    interview: apps.filter((a) => a.status === "Interview").length,
    selected: apps.filter((a) => a.status === "Selected").length,
    rejected: apps.filter((a) => a.status === "Rejected").length,
  };
  const totalApps = apps.length || 1;
  const responded = apps.filter((a) => a.status !== "Applied").length;
  const selectedApps = apps.filter((a) => a.status === "Selected");
  const hireDays = selectedApps
    .map((a) => (new Date(a.updatedAt || a.createdAt).getTime() - new Date(a.createdAt).getTime()) / 864e5)
    .filter((d) => d >= 0);
  const avgHireDays = hireDays.length
    ? Math.round(hireDays.reduce((n, d) => n + d, 0) / hireDays.length)
    : 12;

  const now = new Date();
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap[monthKey(d)] = { month: d.toLocaleDateString("en-IN", { month: "short" }), applications: 0, hires: 0 };
  }
  apps.forEach((a) => {
    const k = monthKey(new Date(a.createdAt));
    if (monthlyMap[k]) monthlyMap[k].applications += 1;
    if (a.status === "Selected") {
      const hk = monthKey(new Date(a.updatedAt || a.createdAt));
      if (monthlyMap[hk]) monthlyMap[hk].hires += 1;
    }
  });
  const monthlyReport = Object.values(monthlyMap);
  const thisMonth = monthlyReport[monthlyReport.length - 1]?.applications || 0;
  const lastMonth = monthlyReport[monthlyReport.length - 2]?.applications || 0;
  const monthDelta = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth ? 100 : 0;

  const jobsWithApps = myJobs.map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    views: j.views || 0,
    applications: apps.filter((a) => a.jobId === j.id).length,
    company: j.company,
    logo: j.logo,
    logoBg: j.logoBg,
    logoColor: j.logoColor,
  }));
  const topJob = [...jobsWithApps].sort((a, b) => b.applications - a.applications)[0];
  const interviewApps = apps.filter((a) => a.status === "Interview");

  return {
    stats: {
      activeJobs: myJobs.filter((j) => j.status === "active").length,
      draftJobs: myJobs.filter((j) => j.status === "draft").length,
      totalApplications: apps.length,
      shortlisted: funnel.shortlisted,
      interviews: funnel.interview,
      selected: funnel.selected,
      wallet: user.wallet ?? 0,
      views: myJobs.reduce((n, j) => n + (j.views || 0), 0),
      monthDelta,
    },
    funnel,
    funnelPct: {
      applied: Math.round((funnel.applied / totalApps) * 100),
      viewed: Math.round((funnel.viewed / totalApps) * 100),
      shortlisted: Math.round((funnel.shortlisted / totalApps) * 100),
      interview: Math.round((funnel.interview / totalApps) * 100),
      selected: Math.round((funnel.selected / totalApps) * 100),
      rejected: Math.round((funnel.rejected / totalApps) * 100),
    },
    performance: {
      timeToHire: avgHireDays,
      conversionRate: Math.round((funnel.selected / totalApps) * 100),
      responseRate: Math.round((responded / totalApps) * 100),
      offerAcceptance: funnel.selected + funnel.rejected
        ? Math.round((funnel.selected / (funnel.selected + funnel.rejected)) * 100)
        : 0,
      profileViews: myJobs.reduce((n, j) => n + (j.views || 0), 0),
    },
    monthlyReport,
    recentJobs: jobsWithApps.slice(0, 5),
    recentApplications: apps.slice(0, 6),
    upcomingInterviews: interviewApps.slice(0, 4),
    activities: activity.slice(0, 8),
    aiInsights: [
      {
        icon: "fa-wand-magic-sparkles",
        text: funnel.shortlisted
          ? `${funnel.shortlisted} candidate${funnel.shortlisted > 1 ? "s" : ""} shortlisted — schedule interviews today.`
          : "Use AI screening on Applications to shortlist top matches faster.",
      },
      {
        icon: "fa-chart-line",
        text: `Your jobs received ${thisMonth} application${thisMonth !== 1 ? "s" : ""} this month (${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs last month).`,
      },
      {
        icon: "fa-bolt",
        text: topJob?.applications
          ? `"${topJob.title}" leads with ${topJob.applications} applications — promote it for more reach.`
          : "Post a featured job to boost visibility and attract quality candidates.",
      },
      {
        icon: "fa-user-check",
        text: funnel.interview
          ? `${funnel.interview} interview${funnel.interview > 1 ? "s" : ""} scheduled — send reminders from Interview Schedule.`
          : "Shortlist candidates from Applications to fill your interview pipeline.",
      },
    ],
    notifications: notifications.slice(0, 6),
  };
}

function talentSearch(seekers, q, filters = {}) {
  let list = seekers.filter((u) => u.role === "seeker");
  const s = (q || "").toLowerCase().trim();
  if (s) {
    list = list.filter((u) => {
      const skills = (u.resume?.skills || []).join(" ").toLowerCase();
      return u.name.toLowerCase().includes(s) || u.location?.toLowerCase().includes(s) || skills.includes(s);
    });
  }
  if (filters.location) list = list.filter((u) => (u.location || "").toLowerCase().includes(filters.location.toLowerCase()));
  if (filters.skill) {
    const sk = filters.skill.toLowerCase();
    list = list.filter((u) => (u.resume?.skills || []).some((x) => x.toLowerCase().includes(sk)));
  }
  return list.map((u) => ({
    id: u.id,
    name: u.name,
    location: u.location,
    profilePct: u.profilePct,
    experience: u.seekerProfile?.experience || "Fresher",
    skills: (u.resume?.skills || []).slice(0, 6),
    salary: u.seekerProfile?.expectedSalary || 0,
    premium: u.subscription?.premium,
    openToWork: u.seekerProfile?.openToWork !== false,
  }));
}

function mockTransactions(user) {
  const base = [
    { id: "tx1", type: "credit", amount: 5000, desc: "Wallet top-up", date: new Date(Date.now() - 864e5 * 30).toISOString().slice(0, 10), status: "paid" },
    { id: "tx2", type: "debit", amount: 499, desc: "Featured job — Security Guard", date: new Date(Date.now() - 864e5 * 12).toISOString().slice(0, 10), status: "paid" },
    { id: "tx3", type: "debit", amount: 199, desc: "Candidate unlock pack (10)", date: new Date(Date.now() - 864e5 * 5).toISOString().slice(0, 10), status: "paid" },
  ];
  const spendThisMonth = 698;
  return {
    summary: { credits: user.credits ?? 500, totalSpend: 5697, monthSpend: spendThisMonth },
    transactions: base,
    balance: user.wallet ?? 0,
    spendThisMonth,
  };
}

function mockReviews(user) {
  const reviews = [
    { id: "r1", author: "Rahul S.", role: "Candidate", rating: 5, text: "Smooth interview process and clear communication.", createdAt: new Date(Date.now() - 864e5 * 14).toISOString() },
    { id: "r2", author: "Priya V.", role: "Candidate", rating: 4, text: "Professional HR team. Response time could improve.", createdAt: new Date(Date.now() - 864e5 * 28).toISOString() },
  ];
  return {
    summary: { avgRating: 4.6, totalReviews: 128, reputationScore: 92 },
    reviews,
    employerBrand: { trust: 88, responseRate: 94, hireSpeed: 76 },
  };
}

module.exports = {
  DEFAULT_COMPANY,
  DEFAULT_EMPLOYER_SETTINGS,
  DEFAULT_PLANS,
  normalizeCompany,
  normalizeSettings,
  employerJobIds,
  dashboardPayload,
  talentSearch,
  mockTransactions,
  mockReviews,
};
