/** JobDozo REST API — shared by all 4 frontends. */
"use strict";

const bcrypt = require("bcryptjs");
const store = require("./store");
const { sign, auth, publicUser } = require("./auth");
const skillEngine = require("./skill-tests");
const jobAlerts = require("./job-alerts");
const seekerProfile = require("./profile");
const subs = require("./subscriptions");
const userSettings = require("./settings");
const employerPortal = require("./employer-portal");
const recruiterPortal = require("./recruiter-portal");
const superAdminPortal = require("./super-admin-portal");
const { homeForRole } = require("./role-config");

const APP_STATUSES = ["Applied", "Viewed", "Shortlisted", "Interview", "Selected", "Rejected"];

module.exports = function registerRoutes(app, io) {
  const users = () => store.col("users");
  const jobs = () => store.col("jobs");
  const applications = () => store.col("applications");
  const notifications = () => store.col("notifications");
  const activity = () => store.col("activity");
  const alertMatches = () => store.col("alertMatches");
  const skillSessions = () => store.col("skillSessions");
  const billing = () => store.col("billing");

  function dispatchJobAlerts(job) {
    const hits = jobAlerts.findMatchingSeekers(job, users().all(), alertMatches());
    for (const { user, match } of hits) {
      const row = alertMatches().insert({
        userId: user.id, jobId: job.id, keywords: match.keywords,
        reason: match.reason, matchedAt: new Date().toISOString(), read: false,
      });
      notify(user.id, {
        icon: "fa-bell", bg: "#f59e0b",
        text: `Job alert: ${job.title} at ${job.company} (${job.distance} KM away)`,
      });
      io.to("user:" + user.id).emit("alert:match", { match: row, job: jobWithMeta(job) });
    }
  }

  /* ---------- helpers ---------- */
  function notify(userId, { icon = "fa-bell", bg = "#1a6cf5", text }) {
    const n = notifications().insert({ userId, icon, bg, text, read: false });
    io.to("user:" + userId).emit("notification:new", n);
    return n;
  }
  function logActivity(entry) {
    const a = activity().insert(entry);
    io.to("role:admin").emit("activity:new", a);
    return a;
  }
  function emitStats() {
    io.to("role:admin").emit("stats:update", computeStats());
  }
  function computeStats() {
    const u = users().all();
    return {
      totalUsers: u.length,
      employers: u.filter((x) => x.role === "employer").length,
      seekers: u.filter((x) => x.role === "seeker").length,
      activeJobs: jobs().count((j) => j.status === "active"),
      totalJobs: jobs().count(),
      applications: applications().count(),
      revenue: 1245300,
    };
  }
  function jobWithMeta(j) {
    return { ...j, applicants: applications().count({ jobId: j.id }) };
  }
  function companySlug(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "company";
  }
  const CATEGORY_INDUSTRY = {
    "Security Jobs": "Security & Safety",
    "Delivery Jobs": "Logistics & Delivery",
    "Driver Jobs": "Transportation",
    "Housekeeping": "Hospitality",
    "Office Staff": "Corporate Services",
    "IT Jobs": "Information Technology",
    "Sales Jobs": "Retail & Sales",
    "Healthcare": "Healthcare",
    "Warehouse": "Logistics & Warehousing",
    "Electrician": "Skilled Trades",
    "Plumber": "Skilled Trades",
  };
  function buildCompaniesList() {
    const activeJobs = jobs().find((j) => j.status === "active");
    const employers = users().all().filter((u) => u.role === "employer");
    const byKey = new Map();
    for (const job of activeJobs) {
      const name = job.company;
      const key = name.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, {
          id: companySlug(name),
          slug: companySlug(name),
          name,
          logo: job.logo,
          logoBg: job.logoBg,
          logoColor: job.logoColor,
          rating: job.rating || 4,
          reviews: job.reviews || 0,
          verified: !!job.verified,
          locations: new Set(),
          categories: new Set(),
          industries: new Set(),
          jobs: [],
          salarySum: 0,
          openings: 0,
        });
      }
      const c = byKey.get(key);
      c.jobs.push(jobWithMeta(job));
      c.locations.add(job.location);
      c.categories.add(job.category);
      c.industries.add(CATEGORY_INDUSTRY[job.category] || job.category || "General");
      c.salarySum += job.salary || 0;
      c.openings += job.openings || 1;
      c.rating = Math.max(c.rating, job.rating || 0);
      c.reviews = Math.max(c.reviews, job.reviews || 0);
      if (job.verified) c.verified = true;
    }
    for (const emp of employers) {
      const name = emp.company || emp.name;
      if (!name) continue;
      const key = name.toLowerCase();
      const profile = emp.companyProfile || {};
      if (byKey.has(key)) {
        const c = byKey.get(key);
        c.verified = c.verified || !!emp.verified;
        c.industry = profile.industry || c.industry;
        c.about = profile.about || c.about;
        c.website = profile.website || c.website;
        c.tagline = profile.tagline || c.tagline;
        c.size = profile.size || c.size;
        c.founded = profile.founded || c.founded;
        c.benefits = profile.benefits?.length ? profile.benefits : c.benefits;
      }
    }
    return [...byKey.values()].map((c) => {
      const industries = [...c.industries];
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        logo: c.logo,
        logoBg: c.logoBg,
        logoColor: c.logoColor,
        rating: Math.round(c.rating * 10) / 10,
        reviews: c.reviews,
        verified: c.verified,
        industry: c.industry || industries[0] || "General",
        industries,
        categories: [...c.categories],
        locations: [...c.locations],
        primaryLocation: [...c.locations][0] || "Jammu, J&K",
        jobCount: c.jobs.length,
        openRoles: c.jobs.length,
        totalOpenings: c.openings,
        avgSalary: c.jobs.length ? Math.round(c.salarySum / c.jobs.length) : 0,
        tagline: c.tagline || `Hiring across ${c.jobs.length} role${c.jobs.length === 1 ? "" : "s"} in Jammu region`,
        about: c.about || `${c.name} is actively hiring on JobDozo with ${c.jobs.length} open position${c.jobs.length === 1 ? "" : "s"} and ${c.openings}+ total openings.`,
        website: c.website || "",
        size: c.size || "51-200",
        founded: c.founded || "",
        benefits: c.benefits || ["Verified listings", "Fast apply", "Local hiring"],
        jobs: c.jobs.map(({ id, title, salary, location, distance, type, expLabel, match, category }) =>
          ({ id, title, salary, location, distance, type, expLabel, match, category })),
      };
    }).sort((a, b) => b.jobCount - a.jobCount);
  }
  function appWithJob(a) {
    const j = jobs().byId(a.jobId);
    return { ...a, job: j ? { id: j.id, title: j.title, company: j.company, logo: j.logo, logoBg: j.logoBg, logoColor: j.logoColor, salary: j.salary, location: j.location, status: j.status } : null };
  }

  /* ================= AUTH ================= */
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role, company } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
    if (!["seeker", "employer"].includes(role)) return res.status(400).json({ error: "Role must be seeker or employer" });
    if (users().findOne((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const user = users().insert({
      name, email, role,
      company: role === "employer" ? company || name : undefined,
      passwordHash: bcrypt.hashSync(password, 8),
      savedIds: [], profilePct: 40, verified: false, wallet: role === "employer" ? 5000 : undefined,
      resume: role === "seeker" ? { headline: "", summary: "", phone: "", skills: [], experience: [], education: [], file: null, updatedAt: null } : undefined,
      seekerProfile: role === "seeker" ? { ...seekerProfile.DEFAULT_SEEKER_PROFILE } : undefined,
      subscription: role === "seeker" ? { ...subs.DEFAULT_SUBSCRIPTION } : undefined,
      settings: role === "seeker" ? { ...userSettings.DEFAULT_SETTINGS } : undefined,
    });
    logActivity({ icon: "fa-user-plus", bg: "#22c55e", title: "New user registered", sub: `${name} joined as ${role === "employer" ? "Employer" : "Job Seeker"}` });
    emitStats();
    res.json({ token: sign(user), user: publicUser(user) });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const user = users().findOne((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
    if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ token: sign(user), user: publicUser(user), redirectUrl: homeForRole(user.role) });
  });

  app.get("/api/auth/me", auth(), (req, res) => res.json({ ...publicUser(req.user), redirectUrl: homeForRole(req.user.role) }));

  /* ================= JOBS ================= */
  app.get("/api/jobs", auth(null, false), (req, res) => {
    let list = jobs().find((j) => j.status === "active");
    const { q, category } = req.query;
    if (q) {
      const s = String(q).toLowerCase();
      list = list.filter((j) => (j.title + " " + j.company + " " + j.category).toLowerCase().includes(s));
    }
    if (category) list = list.filter((j) => j.category === category);
    res.json(list.map(jobWithMeta));
  });

  app.get("/api/jobs/mine", auth(["employer"]), (req, res) => {
    res.json(jobs().find({ employerId: req.user.id }).map(jobWithMeta));
  });

  app.get("/api/jobs/:id", auth(null, false), (req, res) => {
    const j = jobs().byId(req.params.id);
    if (!j) return res.status(404).json({ error: "Job not found" });
    jobs().update(j.id, { views: (j.views || 0) + 1 });
    res.json(jobWithMeta(j));
  });

  /* ================= COMPANIES ================= */
  app.get("/api/companies", auth(null, false), (req, res) => {
    let list = buildCompaniesList();
    const { q, industry, verified, sort } = req.query;
    if (q) {
      const s = String(q).toLowerCase();
      list = list.filter((c) =>
        (c.name + " " + c.industry + " " + c.categories.join(" ")).toLowerCase().includes(s));
    }
    if (industry) list = list.filter((c) => c.industry === industry || c.industries.includes(industry));
    if (verified === "true") list = list.filter((c) => c.verified);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "openings") list.sort((a, b) => b.totalOpenings - a.totalOpenings);
    else list.sort((a, b) => b.jobCount - a.jobCount);
    res.json(list);
  });

  app.get("/api/companies/:slug", auth(null, false), (req, res) => {
    const company = buildCompaniesList().find((c) => c.slug === req.params.slug || c.id === req.params.slug);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  });

  app.post("/api/jobs", auth(["employer", "admin"]), (req, res) => {
    const b = req.body || {};
    if (!b.title || !b.category) return res.status(400).json({ error: "Title and category are required" });
    const job = jobs().insert({
      title: b.title, category: b.category, type: b.type || "Full Time",
      location: b.location || "Jammu, J&K", mode: b.mode || "On-site",
      shift: b.shift || "Day Shift",
      desc: b.desc || "", overview: b.overview || "",
      salary: Number(b.salary) || 20000, salaryLabel: b.salaryLabel,
      exp: b.exp || "Fresher", expLabel: b.expLabel || "Fresher",
      skills: b.skills || [], benefits: b.benefits || [],
      openings: Number(b.openings) || 1,
      tags: [b.type || "Full Time", b.shift || "Day Shift"],
      company: req.user.company || req.user.name,
      employerId: req.user.id,
      logo: (req.user.company || req.user.name).split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase(),
      logoBg: "linear-gradient(135deg,#0f172a,#334155)",
      rating: 4.5, reviews: 12, distance: Math.floor(Math.random() * 9) + 2,
      verified: !!req.user.verified, match: 70 + Math.floor(Math.random() * 29),
      status: "active", views: 0, postedAt: new Date().toISOString(),
      addons: b.addons || [],
    });
    const meta = jobWithMeta(job);
    io.emit("job:created", meta);
    logActivity({ icon: "fa-briefcase", bg: "#3b82f6", title: "New job posted", sub: `${job.title} by ${job.company}` });
    notify("u-admin", { icon: "fa-briefcase", bg: "#3b82f6", text: `New job posted: ${job.title} by ${job.company}` });
    dispatchJobAlerts(job);
    emitStats();
    res.json(meta);
  });

  app.patch("/api/jobs/:id", auth(["employer", "admin"]), (req, res) => {
    const job = jobs().byId(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (req.user.role !== "admin" && job.employerId !== req.user.id) {
      return res.status(403).json({ error: "You can only edit your own jobs" });
    }
    const allowed = ["title", "category", "type", "location", "mode", "desc", "salary", "openings", "status", "company"];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
    const updated = jobs().update(job.id, patch);
    io.emit("job:updated", jobWithMeta(updated));
    if (patch.status && patch.status !== "active") {
      logActivity({ icon: "fa-ban", bg: "#ef4444", title: "Job " + patch.status, sub: `${updated.title} (${updated.company})` });
      if (updated.employerId) notify(updated.employerId, { icon: "fa-triangle-exclamation", bg: "#f59e0b", text: `Your job "${updated.title}" was ${patch.status} by admin` });
    }
    emitStats();
    res.json(jobWithMeta(updated));
  });

  app.delete("/api/jobs/:id", auth(["employer", "admin"]), (req, res) => {
    const job = jobs().byId(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (req.user.role !== "admin" && job.employerId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own jobs" });
    }
    jobs().remove(job.id);
    io.emit("job:removed", { id: job.id, title: job.title });
    logActivity({ icon: "fa-trash-can", bg: "#ef4444", title: "Job deleted", sub: `${job.title} (${job.company})` });
    emitStats();
    res.json({ ok: true });
  });

  /* ================= APPLICATIONS ================= */
  app.post("/api/applications", auth(["seeker"]), (req, res) => {
    const { jobId, name, email, phone, experience } = req.body || {};
    const job = jobs().byId(jobId);
    if (!job || job.status !== "active") return res.status(404).json({ error: "Job is no longer available" });
    if (applications().findOne({ jobId, seekerId: req.user.id })) {
      return res.status(409).json({ error: "You already applied to this job" });
    }
    const a = applications().insert({
      jobId, seekerId: req.user.id,
      name: name || req.user.name, email: email || req.user.email,
      phone: phone || "", experience: experience || "Fresher",
      status: "Applied", note: "Application sent",
    });
    if (job.employerId) {
      notify(job.employerId, { icon: "fa-file-lines", bg: "#3b82f6", text: `${a.name} applied for ${job.title}` });
      io.to("user:" + job.employerId).emit("application:created", { ...appWithJob(a), seeker: publicUser(req.user) });
    }
    logActivity({ icon: "fa-file-lines", bg: "#8b5cf6", title: "Job application received", sub: `${a.name} → ${job.title}` });
    emitStats();
    res.json(appWithJob(a));
  });

  app.get("/api/applications/mine", auth(["seeker"]), (req, res) => {
    res.json(applications().find({ seekerId: req.user.id }).map(appWithJob));
  });

  app.get("/api/applications/received", auth(["employer", "admin"]), (req, res) => {
    const myJobIds = req.user.role === "admin"
      ? jobs().all().map((j) => j.id)
      : jobs().find({ employerId: req.user.id }).map((j) => j.id);
    let list = applications().find((a) => myJobIds.includes(a.jobId));
    if (req.query.jobId) list = list.filter((a) => a.jobId === req.query.jobId);
    res.json(list.map((a) => ({ ...appWithJob(a), seeker: publicUser(users().byId(a.seekerId)) })));
  });

  app.patch("/api/applications/:id/status", auth(["employer", "admin"]), (req, res) => {
    const a = applications().byId(req.params.id);
    if (!a) return res.status(404).json({ error: "Application not found" });
    const job = jobs().byId(a.jobId);
    if (req.user.role !== "admin" && (!job || job.employerId !== req.user.id)) {
      return res.status(403).json({ error: "Not your candidate" });
    }
    const { status } = req.body || {};
    if (!APP_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const notes = {
      Applied: "Application sent", Viewed: "Your application was viewed",
      Shortlisted: "You have been shortlisted", Interview: "Interview scheduled — check your schedule",
      Selected: "Congratulations! You are selected", Rejected: "Better luck next time",
    };
    const patch = { status, note: notes[status] };
    // moving into Interview without details → auto-schedule a default slot
    if (status === "Interview" && !a.interview) {
      const d = new Date(Date.now() + 864e5);
      patch.interview = { date: d.toISOString().slice(0, 10), time: "11:00", mode: "Video Call", link: "" };
    }
    const updated = applications().update(a.id, patch);
    const intInfo = status === "Interview" && updated.interview
      ? ` — ${updated.interview.date} at ${updated.interview.time} (${updated.interview.mode})` : "";
    notify(a.seekerId, {
      icon: status === "Rejected" ? "fa-circle-xmark" : status === "Interview" ? "fa-phone" : "fa-circle-check",
      bg: status === "Rejected" ? "#ef4444" : status === "Interview" ? "#8b5cf6" : "#16a34a",
      text: `${job ? job.title : "Application"}: status updated to ${status}${intInfo}`,
    });
    io.to("user:" + a.seekerId).emit("application:status", appWithJob(updated));
    res.json(appWithJob(updated));
  });

  /* schedule / reschedule an interview for an application */
  app.patch("/api/applications/:id/interview", auth(["employer", "admin"]), (req, res) => {
    const a = applications().byId(req.params.id);
    if (!a) return res.status(404).json({ error: "Application not found" });
    const job = jobs().byId(a.jobId);
    if (req.user.role !== "admin" && (!job || job.employerId !== req.user.id)) {
      return res.status(403).json({ error: "Not your candidate" });
    }
    const { date, time, mode, link } = req.body || {};
    if (!date || !time) return res.status(400).json({ error: "Date and time are required" });
    const interview = { date, time, mode: mode || "Video Call", link: link || "" };
    const updated = applications().update(a.id, {
      interview, status: "Interview",
      note: `Interview on ${date} at ${time} (${interview.mode})`,
    });
    notify(a.seekerId, {
      icon: "fa-calendar-check", bg: "#8b5cf6",
      text: `Interview for ${job ? job.title : "your application"}: ${date} at ${time} (${interview.mode})`,
    });
    io.to("user:" + a.seekerId).emit("application:status", appWithJob(updated));
    logActivity({ icon: "fa-calendar-check", bg: "#8b5cf6", title: "Interview scheduled", sub: `${a.name} — ${job ? job.title : ""} on ${date}` });
    res.json(appWithJob(updated));
  });

  app.delete("/api/applications/:id", auth(["seeker"]), (req, res) => {
    const a = applications().byId(req.params.id);
    if (!a || a.seekerId !== req.user.id) return res.status(404).json({ error: "Application not found" });
    applications().remove(a.id);
    const job = jobs().byId(a.jobId);
    if (job && job.employerId) {
      io.to("user:" + job.employerId).emit("application:withdrawn", { id: a.id, jobId: a.jobId, name: a.name });
    }
    emitStats();
    res.json({ ok: true });
  });

  /* ================= SAVED JOBS ================= */
  app.get("/api/saved", auth(["seeker"]), (req, res) => {
    const ids = req.user.savedIds || [];
    res.json({ ids, jobs: ids.map((id) => jobs().byId(id)).filter(Boolean).map(jobWithMeta) });
  });

  app.post("/api/saved/:jobId", auth(["seeker"]), (req, res) => {
    const ids = new Set(req.user.savedIds || []);
    const id = req.params.jobId;
    const saved = !ids.has(id);
    saved ? ids.add(id) : ids.delete(id);
    users().update(req.user.id, { savedIds: [...ids] });
    res.json({ saved, ids: [...ids] });
  });

  /* ================= PROFILE ================= */
  function profilePayload(user) {
    const resume = user.resume || {};
    const alerts = jobAlerts.normalizeAlerts(user.jobAlerts, user);
    const certified = skillSessions().find((s) => s.userId === user.id && s.status === "completed" && s.score >= 70).length;
    const completion = seekerProfile.computeCompletion(user, resume, alerts, certified);
    const scores = skillSessions().find((s) => s.userId === user.id && s.status === "completed")
      .reduce((acc, s) => {
        const ex = acc.find((x) => x.testId === s.testId);
        if (!ex || s.score > ex.score) {
          if (ex) acc.splice(acc.indexOf(ex), 1);
          acc.push({ testId: s.testId, testTitle: s.testTitle, score: s.score, certified: s.score >= 70 });
        }
        return acc;
      }, []);
    const apps = applications().find({ seekerId: user.id });
    return {
      user: publicUser(user),
      profile: seekerProfile.normalizeSeekerProfile(user.seekerProfile, user),
      completion,
      stats: {
        applications: apps.length,
        interviews: apps.filter((a) => a.status === "Interview").length,
        saved: (user.savedIds || []).length,
        profileViews: user.seekerProfile?.profileViews || 0,
        certifiedTests: certified,
        resumeScore: resume.score || seekerProfile.computeCompletion(user, resume, alerts, certified).pct,
      },
      skillScores: scores,
      publicPreview: seekerProfile.publicPreview(user, { ...resume, score: completion.pct }, scores),
      options: {
        experience: seekerProfile.EXPERIENCE_OPTIONS,
        shifts: seekerProfile.SHIFT_OPTIONS,
        categories: seekerProfile.CATEGORY_OPTIONS,
      },
    };
  }

  app.get("/api/users/me/profile", auth(["seeker"]), (req, res) => {
    res.json(profilePayload(req.user));
  });

  app.patch("/api/users/me/profile", auth(["seeker"]), (req, res) => {
    const body = req.body || {};
    const current = seekerProfile.normalizeSeekerProfile(req.user.seekerProfile, req.user);
    const next = seekerProfile.normalizeSeekerProfile({
      ...current,
      phone: body.phone !== undefined ? body.phone : current.phone,
      bio: body.bio !== undefined ? body.bio : current.bio,
      experience: body.experience !== undefined ? body.experience : current.experience,
      expectedSalary: body.expectedSalary !== undefined ? body.expectedSalary : current.expectedSalary,
      preferredCategories: body.preferredCategories !== undefined ? body.preferredCategories : current.preferredCategories,
      preferredShift: body.preferredShift !== undefined ? body.preferredShift : current.preferredShift,
      openToWork: body.openToWork !== undefined ? body.openToWork : current.openToWork,
      updatedAt: new Date().toISOString(),
    }, req.user);

    const userPatch = { seekerProfile: next };
    if (body.name !== undefined) userPatch.name = String(body.name).trim().slice(0, 80);
    if (body.location !== undefined) userPatch.location = String(body.location).trim().slice(0, 80);

    let user = users().update(req.user.id, userPatch);
    const resume = user.resume || {};
    if (body.phone && resume.phone !== body.phone) {
      user = users().update(user.id, { resume: { ...resume, phone: next.phone, updatedAt: new Date().toISOString() } });
    }

    const certified = skillSessions().find((s) => s.userId === user.id && s.status === "completed" && s.score >= 70).length;
    const completion = seekerProfile.computeCompletion(user, user.resume, user.jobAlerts, certified);
    user = users().update(user.id, { profilePct: completion.pct });

    res.json(profilePayload(user));
  });

  app.get("/api/seekers/:id/profile", auth(["employer"]), (req, res) => {
    const seeker = users().byId(req.params.id);
    if (!seeker || seeker.role !== "seeker") return res.status(404).json({ error: "Seeker not found" });
    const views = (seeker.seekerProfile?.profileViews || 0) + 1;
    users().update(seeker.id, { seekerProfile: { ...seekerProfile.normalizeSeekerProfile(seeker.seekerProfile, seeker), profileViews: views } });
    const scores = skillSessions().find((s) => s.userId === seeker.id && s.status === "completed" && s.score >= 70)
      .map((s) => ({ testTitle: s.testTitle, score: s.score, certified: true }));
    res.json(seekerProfile.publicPreview(seeker, seeker.resume, scores));
  });

  app.patch("/api/users/me", auth(), (req, res) => {
    const allowed = ["name", "location", "profilePct", "company"];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
    res.json(publicUser(users().update(req.user.id, patch)));
  });

  function defaultResume() {
    return { headline: "", summary: "", phone: "", skills: [], experience: [], education: [], file: null, updatedAt: null };
  }
  function sanitizeResume(body, existing) {
    const base = existing || defaultResume();
    const out = { ...base };
    if (typeof body.headline === "string") out.headline = body.headline.trim().slice(0, 120);
    if (typeof body.summary === "string") out.summary = body.summary.trim().slice(0, 2000);
    if (typeof body.phone === "string") out.phone = body.phone.trim().slice(0, 20);
    if (Array.isArray(body.skills)) {
      out.skills = body.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 20);
    }
    if (Array.isArray(body.experience)) {
      out.experience = body.experience.slice(0, 10).map((e, i) => ({
        id: e.id || "e" + (i + 1),
        title: String(e.title || "").trim().slice(0, 80),
        company: String(e.company || "").trim().slice(0, 80),
        from: String(e.from || "").trim().slice(0, 20),
        to: String(e.to || "").trim().slice(0, 20),
        description: String(e.description || "").trim().slice(0, 500),
      }));
    }
    if (Array.isArray(body.education)) {
      out.education = body.education.slice(0, 8).map((e, i) => ({
        id: e.id || "ed" + (i + 1),
        degree: String(e.degree || "").trim().slice(0, 80),
        school: String(e.school || "").trim().slice(0, 120),
        year: String(e.year || "").trim().slice(0, 10),
      }));
    }
    out.updatedAt = new Date().toISOString();
    return out;
  }
  function resumeScore(r) {
    if (!r) return 0;
    let s = 0;
    if (r.headline) s += 15;
    if (r.summary && r.summary.length > 30) s += 15;
    if (r.phone) s += 10;
    if ((r.skills || []).length >= 3) s += 15;
    if ((r.experience || []).length >= 1) s += 20;
    if ((r.education || []).length >= 1) s += 15;
    if (r.file) s += 10;
    return s;
  }

  app.get("/api/users/me/resume", auth(["seeker"]), (req, res) => {
    const r = req.user.resume || defaultResume();
    res.json({ ...r, score: resumeScore(r) });
  });

  app.patch("/api/users/me/resume", auth(["seeker"]), (req, res) => {
    const updated = sanitizeResume(req.body || {}, req.user.resume || defaultResume());
    users().update(req.user.id, { resume: updated });
    res.json({ ...updated, score: resumeScore(updated) });
  });

  app.post("/api/users/me/resume/file", auth(["seeker"]), (req, res) => {
    const { name, size, type } = req.body || {};
    if (!name) return res.status(400).json({ error: "File name is required" });
    const file = {
      name: String(name).slice(0, 120),
      size: Math.max(0, Number(size) || 0),
      type: String(type || "application/pdf").slice(0, 80),
      uploadedAt: new Date().toISOString(),
    };
    const resume = { ...(req.user.resume || defaultResume()), file, updatedAt: new Date().toISOString() };
    users().update(req.user.id, { resume });
    res.json({ ...resume, score: resumeScore(resume) });
  });

  app.delete("/api/users/me/resume/file", auth(["seeker"]), (req, res) => {
    const resume = { ...(req.user.resume || defaultResume()), file: null, updatedAt: new Date().toISOString() };
    users().update(req.user.id, { resume });
    res.json({ ...resume, score: resumeScore(resume) });
  });

  app.get("/api/applications/:id/resume", auth(["employer"]), (req, res) => {
    const app = applications().byId(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    const job = jobs().byId(app.jobId);
    if (!job || job.employerId !== req.user.id) return res.status(403).json({ error: "You don't have permission for this action" });
    const seeker = users().byId(app.seekerId);
    if (!seeker) return res.status(404).json({ error: "Candidate not found" });
    const r = seeker.resume || defaultResume();
    res.json({
      seeker: { id: seeker.id, name: seeker.name, email: seeker.email, location: seeker.location },
      application: { id: app.id, experience: app.experience, status: app.status },
      resume: { ...r, score: resumeScore(r) },
    });
  });

  /* ================= SUBSCRIPTIONS ================= */
  app.get("/api/subscriptions/plans", auth(null, false), (req, res) => {
    res.json(subs.PLANS);
  });

  app.get("/api/users/me/subscription", auth(["seeker"]), (req, res) => {
    const subscription = subs.normalizeSubscription(req.user.subscription);
    const history = billing().find({ userId: req.user.id }).slice(0, 20);
    res.json({ subscription, plans: subs.PLANS, history, premium: subscription.premium });
  });

  app.post("/api/users/me/subscription/subscribe", auth(["seeker"]), (req, res) => {
    const { planId } = req.body || {};
    const plan = subs.getPlan(planId);
    if (!plan || plan.id === "free") return res.status(400).json({ error: "Invalid plan" });

    const current = subs.normalizeSubscription(req.user.subscription);
    if (current.premium && current.planId === plan.id) {
      return res.status(400).json({ error: "You are already on this plan" });
    }

    const subscription = subs.subscribe(req.user, plan.id);
    users().update(req.user.id, { subscription });

    const invoice = billing().insert({
      userId: req.user.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      status: "paid",
      method: "demo",
      description: `${plan.name} subscription`,
    });

    notify(req.user.id, {
      icon: "fa-crown", bg: "#f59e0b",
      text: `Welcome to ${plan.name}! Your premium benefits are now active.`,
    });

    logActivity({
      icon: "fa-crown", bg: "#f59e0b",
      title: "Premium subscription",
      sub: `${req.user.name} subscribed to ${plan.name}`,
    });

    res.json({
      subscription: subs.normalizeSubscription(subscription),
      invoice,
      user: publicUser(users().byId(req.user.id)),
    });
  });

  app.post("/api/users/me/subscription/cancel", auth(["seeker"]), (req, res) => {
    const current = subs.normalizeSubscription(req.user.subscription);
    if (!current.premium) return res.status(400).json({ error: "No active premium subscription" });

    const subscription = subs.cancelSubscription(current);
    users().update(req.user.id, { subscription: subs.normalizeSubscription({ planId: "free", status: "active" }) });

    billing().insert({
      userId: req.user.id,
      planId: current.planId,
      planName: current.planName,
      amount: 0,
      status: "cancelled",
      method: "demo",
      description: `Cancelled ${current.planName}`,
    });

    notify(req.user.id, {
      icon: "fa-circle-info", bg: "#64748b",
      text: "Premium cancelled. You are now on the Free plan.",
    });

    res.json({
      subscription: subs.normalizeSubscription({ planId: "free", status: "active" }),
      user: publicUser(users().byId(req.user.id)),
    });
  });

  /* ================= SETTINGS ================= */
  app.get("/api/users/me/settings", auth(["seeker"]), (req, res) => {
    const settings = userSettings.normalizeSettings(req.user.settings);
    res.json({
      settings,
      account: {
        name: req.user.name,
        email: req.user.email,
        location: req.user.location || "",
        createdAt: req.user.createdAt,
      },
      themeOptions: userSettings.THEME_OPTIONS,
      languageOptions: userSettings.LANGUAGE_OPTIONS,
    });
  });

  app.patch("/api/users/me/settings", auth(["seeker"]), (req, res) => {
    const body = req.body || {};
    const current = userSettings.normalizeSettings(req.user.settings);
    const next = userSettings.normalizeSettings({
      notifications: body.notifications ? { ...current.notifications, ...body.notifications } : current.notifications,
      privacy: body.privacy ? { ...current.privacy, ...body.privacy } : current.privacy,
      preferences: body.preferences ? { ...current.preferences, ...body.preferences } : current.preferences,
    });
    const user = users().update(req.user.id, { settings: next });
    res.json({
      settings: next,
      account: {
        name: user.name,
        email: user.email,
        location: user.location || "",
        createdAt: user.createdAt,
      },
      user: publicUser(user),
    });
  });

  app.post("/api/users/me/password", auth(), (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    if (!bcrypt.compareSync(currentPassword, req.user.passwordHash)) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    users().update(req.user.id, { passwordHash: bcrypt.hashSync(newPassword, 8) });
    res.json({ ok: true });
  });

  /* ================= JOB ALERTS ================= */
  app.get("/api/users/me/job-alerts", auth(["seeker"]), (req, res) => {
    const settings = jobAlerts.normalizeAlerts(req.user.jobAlerts, req.user);
    const matches = alertMatches().find({ userId: req.user.id })
      .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt))
      .slice(0, 30)
      .map((m) => {
        const j = jobs().byId(m.jobId);
        return { ...m, job: j ? jobWithMeta(j) : null };
      })
      .filter((m) => m.job);

    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const liveMatches = jobs().find((j) => j.status === "active")
      .filter((j) => jobAlerts.jobMatchesAlerts(j, settings))
      .map((j) => jobWithMeta(j))
      .sort((a, b) => (a.distance || 99) - (b.distance || 99))
      .slice(0, 12);

    res.json({
      settings,
      matches,
      liveMatches,
      stats: {
        totalMatches: alertMatches().count({ userId: req.user.id }),
        thisWeek: alertMatches().count((m) => m.userId === req.user.id && m.matchedAt >= weekAgo),
        unread: matches.filter((m) => !m.read).length,
      },
    });
  });

  app.patch("/api/users/me/job-alerts", auth(["seeker"]), (req, res) => {
    const body = req.body || {};
    const current = jobAlerts.normalizeAlerts(req.user.jobAlerts, req.user);
    const next = jobAlerts.normalizeAlerts({
      ...current,
      enabled: "enabled" in body ? !!body.enabled : current.enabled,
      keywords: body.keywords !== undefined ? body.keywords : current.keywords,
      radius: body.radius !== undefined ? body.radius : current.radius,
      location: body.location !== undefined ? body.location : current.location,
      salaryMin: body.salaryMin !== undefined ? body.salaryMin : current.salaryMin,
      shift: body.shift !== undefined ? body.shift : current.shift,
      frequency: body.frequency !== undefined ? body.frequency : current.frequency,
      channels: body.channels ? { ...current.channels, ...body.channels } : current.channels,
      updatedAt: new Date().toISOString(),
    }, req.user);

    const patch = { jobAlerts: next };
    if (next.keywords.length && (req.user.profilePct || 0) < 100) {
      const prefsDone = req.user.jobAlertsPrefsDone;
      if (!prefsDone) {
        patch.jobAlertsPrefsDone = true;
        patch.profilePct = Math.min(100, (req.user.profilePct || 80) + 10);
      }
    }

    const user = users().update(req.user.id, patch);
    res.json({
      settings: jobAlerts.normalizeAlerts(user.jobAlerts, user),
      profilePct: user.profilePct,
    });
  });

  app.post("/api/users/me/job-alerts/matches/:id/read", auth(["seeker"]), (req, res) => {
    const m = alertMatches().byId(req.params.id);
    if (!m || m.userId !== req.user.id) return res.status(404).json({ error: "Match not found" });
    alertMatches().update(m.id, { read: true });
    res.json({ ok: true });
  });

  app.post("/api/users/me/job-alerts/read-all", auth(["seeker"]), (req, res) => {
    alertMatches().find({ userId: req.user.id, read: false }).forEach((m) => alertMatches().update(m.id, { read: true }));
    res.json({ ok: true });
  });

  /* ================= SKILL TESTS (AI) ================= */
  app.get("/api/skill-tests", auth(["seeker"]), (req, res) => {
    const mine = skillSessions().find({ userId: req.user.id });
    res.json({
      tests: skillEngine.enrichCatalogForUser(skillEngine.getCatalog(), mine),
      recent: mine.filter((s) => s.status === "completed").sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")).slice(0, 5),
    });
  });

  app.post("/api/skill-tests/:testId/start", auth(["seeker"]), (req, res) => {
    const test = skillEngine.getTest(req.params.testId);
    if (!test) return res.status(404).json({ error: "Skill test not found" });

    const existing = skillSessions().findOne((s) => s.userId === req.user.id && s.testId === test.id && s.status === "in_progress");
    if (existing && new Date(existing.expiresAt) > new Date()) {
      return res.json({
        session: {
          id: existing.id, testId: existing.testId, testTitle: existing.testTitle,
          duration: existing.duration, questions: skillEngine.stripAnswers(existing.questions),
          startedAt: existing.startedAt, expiresAt: existing.expiresAt, resumed: true,
        },
      });
    }

    const questions = skillEngine.pickQuestions(test.id, req.user, test.questionCount);
    const startedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + test.duration * 60 * 1000).toISOString();
    const session = skillSessions().insert({
      userId: req.user.id, testId: test.id, testTitle: test.title, category: test.category,
      duration: test.duration, status: "in_progress", questions, answers: {},
      score: null, aiFeedback: null, startedAt, expiresAt, completedAt: null,
    });

    res.json({
      session: {
        id: session.id, testId: session.testId, testTitle: session.testTitle,
        duration: session.duration, questions: skillEngine.stripAnswers(session.questions),
        startedAt: session.startedAt, expiresAt: session.expiresAt, resumed: false,
        aiGenerated: true,
      },
    });
  });

  app.get("/api/skill-tests/sessions/:id", auth(["seeker"]), (req, res) => {
    const s = skillSessions().byId(req.params.id);
    if (!s || s.userId !== req.user.id) return res.status(404).json({ error: "Session not found" });
    res.json({
      session: {
        id: s.id, testId: s.testId, testTitle: s.testTitle, status: s.status,
        duration: s.duration, questions: skillEngine.stripAnswers(s.questions),
        startedAt: s.startedAt, expiresAt: s.expiresAt,
        score: s.score, aiFeedback: s.aiFeedback, completedAt: s.completedAt,
      },
    });
  });

  app.post("/api/skill-tests/sessions/:id/submit", auth(["seeker"]), (req, res) => {
    const s = skillSessions().byId(req.params.id);
    if (!s || s.userId !== req.user.id) return res.status(404).json({ error: "Session not found" });
    if (s.status === "completed") return res.status(400).json({ error: "Test already submitted" });

    const answers = req.body?.answers || {};
    const { score, correct, total, breakdown } = skillEngine.gradeSession(s.questions, answers);
    const test = skillEngine.getTest(s.testId);
    const aiFeedback = skillEngine.generateAiFeedback(test || { title: s.testTitle, aiTag: "Adaptive", questionCount: total }, score, breakdown, req.user);
    const completedAt = new Date().toISOString();

    const updated = skillSessions().update(s.id, {
      status: "completed", answers, score, aiFeedback, breakdown, completedAt,
    });

    notify(req.user.id, {
      icon: "fa-clipboard-check", bg: score >= 70 ? "#16a34a" : "#f59e0b",
      text: `AI Skill Test: ${s.testTitle} — ${score}% (${aiFeedback.level})`,
    });

    io.to("role:employer").emit("skilltest:completed", {
      seekerId: req.user.id, seekerName: req.user.name, testTitle: s.testTitle, score,
    });

    res.json({ session: { ...updated, questions: skillEngine.stripAnswers(updated.questions) } });
  });

  app.get("/api/seekers/:id/skill-scores", auth(["employer"]), (req, res) => {
    const seeker = users().byId(req.params.id);
    if (!seeker || seeker.role !== "seeker") return res.status(404).json({ error: "Seeker not found" });
    const sessions = skillSessions().find({ userId: seeker.id, status: "completed" });
    const byTest = {};
    for (const s of sessions) {
      if (!byTest[s.testId] || s.score > byTest[s.testId].score) byTest[s.testId] = s;
    }
    res.json({
      seeker: { id: seeker.id, name: seeker.name },
      scores: Object.values(byTest).map((s) => ({
        testId: s.testId, testTitle: s.testTitle, score: s.score,
        level: s.aiFeedback?.level, certified: s.score >= 70, completedAt: s.completedAt,
      })),
    });
  });

  /* ================= NOTIFICATIONS ================= */
  app.get("/api/notifications", auth(), (req, res) => {
    res.json(notifications().find({ userId: req.user.id }).slice(0, 30));
  });

  app.post("/api/notifications/read-all", auth(), (req, res) => {
    notifications().find({ userId: req.user.id }).forEach((n) => notifications().update(n.id, { read: true }));
    res.json({ ok: true });
  });

  app.post("/api/notifications/read-all", auth(), (req, res) => {
    notifications().find({ userId: req.user.id }).forEach((n) => notifications().update(n.id, { read: true }));
    res.json({ ok: true });
  });

  /* ================= MESSAGES ================= */
  const conversations = () => store.col("conversations");
  const messages = () => store.col("messages");

  function convForUser(c, userId, role) {
    return role === "seeker" ? c.seekerId === userId : c.employerId === userId;
  }
  function enrichConversation(c, viewer) {
    const job = jobs().byId(c.jobId);
    const seeker = users().byId(c.seekerId);
    const employer = users().byId(c.employerId);
    const unread = viewer.role === "seeker" ? (c.unreadSeeker || 0) : (c.unreadEmployer || 0);
    const other = viewer.role === "seeker"
      ? { id: employer?.id, name: job?.company || employer?.company || employer?.name, company: job?.company || employer?.company, logo: job?.logo, logoBg: job?.logoBg, logoColor: job?.logoColor }
      : { id: seeker?.id, name: seeker?.name, email: seeker?.email };
    return {
      ...c, unread,
      job: job ? { id: job.id, title: job.title, company: job.company, logo: job.logo, logoBg: job.logoBg, logoColor: job.logoColor } : null,
      other,
    };
  }
  function findOrCreateConversation({ seekerId, employerId, jobId, applicationId }) {
    let c = conversations().findOne((x) => x.seekerId === seekerId && x.employerId === employerId && x.jobId === jobId);
    if (!c) {
      c = conversations().insert({ seekerId, employerId, jobId, applicationId, lastMessage: "", lastAt: new Date().toISOString(), unreadSeeker: 0, unreadEmployer: 0 });
    }
    return c;
  }

  app.get("/api/messages/conversations", auth(["seeker", "employer"]), (req, res) => {
    const list = conversations().find((c) => convForUser(c, req.user.id, req.user.role))
      .sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
    res.json(list.map((c) => enrichConversation(c, req.user)));
  });

  app.get("/api/messages/conversations/:id", auth(["seeker", "employer"]), (req, res) => {
    const c = conversations().byId(req.params.id);
    if (!c || !convForUser(c, req.user.id, req.user.role)) return res.status(404).json({ error: "Conversation not found" });
    const thread = messages().find({ conversationId: c.id }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json({ conversation: enrichConversation(c, req.user), messages: thread });
  });

  app.post("/api/messages/conversations/:id/read", auth(["seeker", "employer"]), (req, res) => {
    const c = conversations().byId(req.params.id);
    if (!c || !convForUser(c, req.user.id, req.user.role)) return res.status(404).json({ error: "Conversation not found" });
    const field = req.user.role === "seeker" ? "unreadSeeker" : "unreadEmployer";
    conversations().update(c.id, { [field]: 0 });
    messages().find({ conversationId: c.id }).forEach((m) => {
      if (m.senderId !== req.user.id && !m.read) messages().update(m.id, { read: true });
    });
    res.json({ ok: true });
  });

  app.post("/api/messages", auth(["seeker", "employer"]), (req, res) => {
    const { conversationId, text, seekerId, employerId, jobId, applicationId } = req.body || {};
    if (!String(text || "").trim()) return res.status(400).json({ error: "Message text is required" });

    let c;
    if (conversationId) {
      c = conversations().byId(conversationId);
      if (!c || !convForUser(c, req.user.id, req.user.role)) return res.status(404).json({ error: "Conversation not found" });
    } else {
      const sid = req.user.role === "seeker" ? req.user.id : seekerId;
      const eid = req.user.role === "employer" ? req.user.id : employerId;
      if (!sid || !eid || !jobId) return res.status(400).json({ error: "seekerId, employerId and jobId required" });
      c = findOrCreateConversation({ seekerId: sid, employerId: eid, jobId, applicationId });
    }

    const msg = messages().insert({ conversationId: c.id, senderId: req.user.id, text: String(text).trim(), read: false });
    const patch = { lastMessage: msg.text, lastAt: msg.createdAt };
    if (req.user.role === "seeker") patch.unreadEmployer = (c.unreadEmployer || 0) + 1;
    else patch.unreadSeeker = (c.unreadSeeker || 0) + 1;
    const updated = conversations().update(c.id, patch);

    const payload = { conversation: enrichConversation(updated, req.user), message: msg };
    io.to("user:" + c.seekerId).emit("message:new", { ...payload, conversation: enrichConversation(updated, users().byId(c.seekerId)) });
    io.to("user:" + c.employerId).emit("message:new", { ...payload, conversation: enrichConversation(updated, users().byId(c.employerId)) });

    const recipientId = req.user.id === c.seekerId ? c.employerId : c.seekerId;
    const job = jobs().byId(c.jobId);
    notify(recipientId, {
      icon: "fa-comment-dots", bg: "#3b82f6",
      text: `New message from ${req.user.name}${job ? " about " + job.title : ""}`,
    });

    res.json(payload);
  });

  /* ================= EMPLOYER PORTAL ================= */
  app.get("/api/employer/dashboard", auth(["employer"]), (req, res) => {
    const myJobIds = employerPortal.employerJobIds(jobs().all(), req.user.id);
    const apps = applications().find((a) => myJobIds.includes(a.jobId)).map(appWithJob);
    const acts = activity().all().filter((a) => (a.sub || "").includes(req.user.company || req.user.name)).slice(0, 10);
    const notifs = notifications().find({ userId: req.user.id }).slice(0, 10);
    res.json(employerPortal.dashboardPayload(req.user, jobs().all(), apps, acts, notifs));
  });

  app.get("/api/employer/company", auth(["employer"]), (req, res) => {
    res.json({ company: employerPortal.normalizeCompany(req.user.companyProfile, req.user), user: publicUser(req.user) });
  });

  app.patch("/api/employer/company", auth(["employer"]), (req, res) => {
    const body = req.body || {};
    const company = employerPortal.normalizeCompany({ ...req.user.companyProfile, ...body }, req.user);
    const patch = { companyProfile: company };
    if (body.name) patch.company = String(body.name).slice(0, 80);
    const user = users().update(req.user.id, patch);
    res.json({ company: employerPortal.normalizeCompany(user.companyProfile, user), user: publicUser(user) });
  });

  app.get("/api/employer/candidates", auth(["employer"]), (req, res) => {
    const myJobIds = employerPortal.employerJobIds(jobs().all(), req.user.id);
    const apps = applications().find((a) => myJobIds.includes(a.jobId));
    const seekerMap = new Map();
    for (const a of apps) {
      const seeker = users().byId(a.seekerId);
      if (!seeker) continue;
      if (!seekerMap.has(seeker.id)) {
        seekerMap.set(seeker.id, {
          ...employerPortal.talentSearch([seeker])[0],
          applications: [],
          statuses: [],
        });
      }
      const row = seekerMap.get(seeker.id);
      row.applications.push({ id: a.id, jobId: a.jobId, status: a.status, createdAt: a.createdAt });
      row.statuses.push(a.status);
    }
    res.json({ candidates: [...seekerMap.values()], saved: [] });
  });

  app.get("/api/employer/talent-search", auth(["employer"]), (req, res) => {
    const { q, location, skill } = req.query || {};
    res.json({
      results: employerPortal.talentSearch(users().all(), q, { location, skill }),
      savedSearches: req.user.savedSearches || [],
    });
  });

  app.get("/api/employer/transactions", auth(["employer"]), (req, res) => {
    res.json(employerPortal.mockTransactions(req.user));
  });

  app.get("/api/employer/reviews", auth(["employer"]), (req, res) => {
    res.json(employerPortal.mockReviews(req.user));
  });

  app.get("/api/employer/subscription", auth(["employer"]), (req, res) => {
    const planId = req.user.employerPlan || "starter";
    const plan = employerPortal.DEFAULT_PLANS.find((p) => p.id === planId) || employerPortal.DEFAULT_PLANS[0];
    const creditsTotal = req.user.credits ?? plan.credits;
    const creditsUsed = req.user.creditsUsed ?? 12;
    res.json({
      current: {
        name: plan.name,
        price: plan.price,
        creditsUsed,
        creditsTotal,
      },
      plan,
      plans: employerPortal.DEFAULT_PLANS,
      credits: creditsTotal,
      usage: { jobsPosted: jobs().find({ employerId: req.user.id }).length, unlocksUsed: creditsUsed },
    });
  });

  app.get("/api/employer/settings", auth(["employer"]), (req, res) => {
    res.json({
      settings: employerPortal.normalizeSettings(req.user.employerSettings),
      account: { name: req.user.name, email: req.user.email, company: req.user.company },
    });
  });

  app.patch("/api/employer/settings", auth(["employer"]), (req, res) => {
    const next = employerPortal.normalizeSettings({ ...employerPortal.normalizeSettings(req.user.employerSettings), ...(req.body || {}) });
    users().update(req.user.id, { employerSettings: next });
    res.json({ settings: next });
  });

  /* ================= RECRUITER ================= */
  app.get("/api/recruiter/dashboard", auth(["recruiter"]), (req, res) => {
    res.json(recruiterPortal.dashboardPayload(req.user, jobs().all(), applications().all()));
  });

  /* ================= ADMIN ================= */
  app.get("/api/admin/dashboard", auth(["admin"]), (req, res) => {
    const s = computeStats();
    const today = new Date().toISOString().slice(0, 10);
    const appsToday = applications().all().filter((a) => String(a.createdAt).startsWith(today)).length;
    res.json({
      stats: {
        users: s.totalUsers,
        seekers: s.seekers,
        employers: s.employers,
        jobs: s.activeJobs,
        applicationsToday: appsToday,
        revenue: s.revenue,
        supportTickets: 7,
      },
    });
  });

  app.get("/api/admin/stats", auth(["admin"]), (req, res) => res.json(computeStats()));

  app.get("/api/admin/jobs", auth(["admin"]), (req, res) => {
    res.json(jobs().all().map(jobWithMeta));
  });

  app.get("/api/admin/users", auth(["admin"]), (req, res) => {
    res.json(users().all().map(publicUser));
  });

  app.get("/api/admin/activity", auth(["admin"]), (req, res) => {
    res.json(activity().all().slice(0, 30));
  });

  /* ================= SUPER ADMIN ================= */
  app.get("/api/super-admin/dashboard", auth(["super-admin"]), (req, res) => {
    res.json(superAdminPortal.dashboardPayload(computeStats()));
  });

  /* health */
  app.get("/api/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));
};
