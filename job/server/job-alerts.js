/** Job alert matching and preferences for seekers. */
"use strict";

const DEFAULT_ALERTS = {
  enabled: true,
  keywords: [],
  radius: 10,
  location: "",
  salaryMin: 0,
  shift: "any",
  frequency: "instant",
  channels: { inApp: true, email: false },
  updatedAt: null,
};

const SHIFT_OPTIONS = ["any", "Day Shift", "Night Shift", "Flexible Shift", "Morning Shift"];

function normalizeAlerts(raw, user) {
  const a = { ...DEFAULT_ALERTS, ...(raw || {}) };
  a.keywords = Array.isArray(a.keywords) ? a.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 12) : [];
  a.radius = Math.min(50, Math.max(1, Number(a.radius) || 10));
  a.salaryMin = Math.max(0, Number(a.salaryMin) || 0);
  a.location = String(a.location || user?.location || "Jammu, J&K").slice(0, 80);
  a.shift = SHIFT_OPTIONS.includes(a.shift) ? a.shift : "any";
  a.enabled = !!a.enabled;
  a.channels = { inApp: a.channels?.inApp !== false, email: !!a.channels?.email };
  return a;
}

function jobMatchesAlerts(job, alerts) {
  if (!alerts?.enabled || job.status !== "active") return null;
  if ((job.distance || 99) > alerts.radius) return null;
  if (alerts.salaryMin > 0 && (job.salary || 0) < alerts.salaryMin) return null;
  if (alerts.shift !== "any" && job.shift && job.shift !== alerts.shift) return null;

  const keys = alerts.keywords.map((k) => k.toLowerCase());
  if (!keys.length) return null;

  const hay = [
    job.title, job.category, job.company,
    ...(job.tags || []), ...(job.skills || []),
  ].join(" ").toLowerCase();

  const matched = keys.filter((k) => hay.includes(k));
  if (!matched.length) return null;

  return { keywords: matched, reason: `Matched: ${matched.join(", ")}` };
}

function findMatchingSeekers(job, users, alertMatches) {
  const hits = [];
  for (const u of users.filter((x) => x.role === "seeker")) {
    const alerts = normalizeAlerts(u.jobAlerts, u);
    const match = jobMatchesAlerts(job, alerts);
    if (!match) continue;
    const already = alertMatches.findOne((m) => m.userId === u.id && m.jobId === job.id);
    if (already) continue;
    hits.push({ user: u, match });
  }
  return hits;
}

module.exports = {
  DEFAULT_ALERTS,
  SHIFT_OPTIONS,
  normalizeAlerts,
  jobMatchesAlerts,
  findMatchingSeekers,
};
