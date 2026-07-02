/** Seeker profile helpers — completion scoring and public preview. */
"use strict";

const DEFAULT_SEEKER_PROFILE = {
  phone: "",
  bio: "",
  experience: "Fresher",
  expectedSalary: 0,
  preferredCategories: [],
  preferredShift: "Day Shift",
  openToWork: true,
  profileViews: 0,
  updatedAt: null,
};

const EXPERIENCE_OPTIONS = ["Fresher", "1 - 3 Years", "3 - 5 Years", "5+ Years"];
const SHIFT_OPTIONS = ["Day Shift", "Night Shift", "Flexible Shift", "Morning Shift", "Any"];
const CATEGORY_OPTIONS = [
  "Security Jobs", "Delivery Jobs", "Warehouse", "Driver Jobs", "Office Staff",
  "Healthcare", "IT Jobs", "Sales Jobs", "Housekeeping", "Electrician",
];

function normalizeSeekerProfile(raw, user) {
  const p = { ...DEFAULT_SEEKER_PROFILE, ...(raw || {}) };
  p.phone = String(p.phone || user?.resume?.phone || "").slice(0, 20);
  p.bio = String(p.bio || "").trim().slice(0, 500);
  p.experience = EXPERIENCE_OPTIONS.includes(p.experience) ? p.experience : "Fresher";
  p.expectedSalary = Math.max(0, Number(p.expectedSalary) || 0);
  p.preferredCategories = Array.isArray(p.preferredCategories)
    ? p.preferredCategories.filter((c) => CATEGORY_OPTIONS.includes(c)).slice(0, 6) : [];
  p.preferredShift = SHIFT_OPTIONS.includes(p.preferredShift) ? p.preferredShift : "Day Shift";
  p.openToWork = p.openToWork !== false;
  p.profileViews = Math.max(0, Number(p.profileViews) || 0);
  return p;
}

function computeCompletion(user, resume, jobAlerts, certifiedTests) {
  const r = resume || {};
  const alerts = jobAlerts || {};
  const steps = [
    {
      id: "basic",
      label: "Basic Information",
      done: !!(user?.name && user?.location && (user.seekerProfile?.phone || r.phone)),
      weight: 15,
    },
    {
      id: "resume",
      label: "Upload Resume",
      done: !!(r.file || (r.score || 0) >= 40),
      weight: 15,
    },
    {
      id: "skills",
      label: "Add Skills",
      done: (r.skills || []).length >= 3,
      weight: 15,
    },
    {
      id: "experience",
      label: "Work Experience",
      done: (r.experience || []).length >= 1,
      weight: 15,
    },
    {
      id: "education",
      label: "Education Details",
      done: (r.education || []).length >= 1,
      weight: 15,
    },
    {
      id: "preferences",
      label: "Job Preferences",
      done: (alerts.keywords || []).length >= 1 || (user?.seekerProfile?.preferredCategories || []).length >= 1,
      weight: 15,
    },
    {
      id: "skilltest",
      label: "Skill Assessment",
      done: certifiedTests >= 1,
      weight: 10,
    },
  ];
  const pct = Math.min(100, steps.reduce((n, s) => n + (s.done ? s.weight : 0), 0));
  return { pct, steps };
}

function publicPreview(user, resume, skillScores) {
  const p = normalizeSeekerProfile(user?.seekerProfile, user);
  const r = resume || {};
  const premium = user?.subscription?.premium || (user?.subscription?.planId && user.subscription.planId !== "free" && user.subscription.status === "active");
  return {
    name: user?.name,
    email: user?.email,
    location: user?.location,
    phone: p.phone || r.phone,
    headline: r.headline || p.bio?.slice(0, 80) || "",
    bio: p.bio || r.summary || "",
    experience: p.experience,
    expectedSalary: p.expectedSalary,
    preferredCategories: p.preferredCategories,
    preferredShift: p.preferredShift,
    openToWork: p.openToWork,
    skills: (r.skills || []).slice(0, 8),
    resumeScore: r.score || 0,
    certifiedTests: (skillScores || []).filter((s) => s.certified),
    hasResumeFile: !!r.file,
    premium: !!premium,
    planName: user?.subscription?.planName || "Free",
  };
}

module.exports = {
  DEFAULT_SEEKER_PROFILE,
  EXPERIENCE_OPTIONS,
  SHIFT_OPTIONS,
  CATEGORY_OPTIONS,
  normalizeSeekerProfile,
  computeCompletion,
  publicPreview,
};
