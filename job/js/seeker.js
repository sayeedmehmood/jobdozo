/* ============ JobDozo Job Seeker Dashboard (API + real-time) ============ */
"use strict";

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
const toast = (m, t) => jmToast(m, t);

/* role gate */
if (!requireRole()) {
  // login overlay shown; page renders behind it after login + reload
}

let APPLICATIONS = [];
let RECS = [];
let savedIds = [];
let SAVED_JOBS = [];
let CONVERSATIONS = [];
let activeChatId = null;
let RESUME = null;
let SKILL_TESTS = [];
let activeTestSession = null;
let testTimer = null;
let JOB_ALERTS = { settings: {}, matches: [], liveMatches: [], stats: {} };
let alertKeywords = [];
let PROFILE = null;
let profileCategories = [];
let SUBSCRIPTION = { subscription: {}, plans: [], history: [], premium: false };
let SETTINGS = { settings: {}, account: {}, themeOptions: [], languageOptions: [] };

const STATUS_META = {
  Applied: { cls: "review", dots: 1, dotCls: "" },
  Viewed: { cls: "shortlisted", dots: 2, dotCls: "" },
  Shortlisted: { cls: "shortlisted", dots: 3, dotCls: "" },
  Interview: { cls: "interview", dots: 4, dotCls: "ok" },
  Selected: { cls: "interview", dots: 4, dotCls: "ok" },
  Rejected: { cls: "rejected", dots: 2, dotCls: "bad" },
};

const timeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m <= 1 ? "just now" : m + " min ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + " hr ago";
  return Math.round(h / 24) + " days ago";
};

/* ---------- RENDER: APPLICATIONS ---------- */
function renderApps() {
  const filter = $("#appFilter").value;
  const q = $("#seekerSearch").value.toLowerCase().trim();
  let list = APPLICATIONS;
  if (filter !== "all") list = list.filter((a) => a.status === filter);
  if (q) list = list.filter((a) => a.job && (a.job.title + " " + a.job.company).toLowerCase().includes(q));

  $("#appList").innerHTML = list.length ? list.map((a) => {
    const j = a.job || { title: "(removed job)", company: "", logo: "?", logoBg: "#94a3b8" };
    const m = STATUS_META[a.status] || STATUS_META.Applied;
    const dots = [1, 2, 3, 4].map((i) => `<span class="track-dot ${i <= m.dots ? "on " + m.dotCls : ""}"></span>`).join("");
    return `
    <div class="app-card" data-app="${a.id}">
      <span class="app-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${j.logo}</span>
      <div class="app-mid">
        <strong>${j.title}</strong>
        <small>${j.company} • Applied ${timeAgo(a.createdAt)}</small>
        <div class="app-track">${dots}</div>
      </div>
      <div class="app-right">
        <span class="app-status ${m.cls}">${a.status}</span>
        ${CONVERSATIONS.some((c) => c.applicationId === a.id) ? `<button class="withdraw-btn" data-msgapp="${a.id}" title="View messages"><i class="fa-regular fa-comment-dots"></i> Message</button>` : ""}
        ${["Rejected", "Selected"].includes(a.status) ? "" : `<button class="withdraw-btn" data-withdraw="${a.id}">Withdraw</button>`}
      </div>
    </div>`;
  }).join("") : `<div class="app-empty">No applications match this filter.</div>`;
}

/* ---------- RENDER: RECOMMENDED ---------- */
function renderRecs() {
  const appliedJobIds = APPLICATIONS.map((a) => a.jobId);
  const recs = RECS.filter((j) => !appliedJobIds.includes(j.id)).sort((a, b) => b.match - a.match).slice(0, 4);
  $("#recGrid").innerHTML = recs.length ? recs.map((j) => {
    const saved = savedIds.includes(j.id);
    return `
    <div class="rec-card" data-job="${j.id}">
      <div class="rec-top">
        <span class="app-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 2)}</span>
        <div><strong>${j.title}</strong><small>${j.company}</small></div>
        <span class="rec-match">${j.match}% Match</span>
      </div>
      <div class="rec-meta"><span><b>${money(j.salary)}</b>/mo</span><span><i class="fa-solid fa-location-dot"></i> ${j.distance} KM away</span></div>
      <div class="rec-actions">
        <button class="rec-apply" data-apply="${j.id}">Apply Now</button>
        <button class="rec-save ${saved ? "saved" : ""}" data-save="${j.id}"><i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
      </div>
    </div>`;
  }).join("") : `<div class="app-empty">You've applied to all your top matches! 🎉</div>`;
}

/* ---------- RENDER: SAVED JOBS ---------- */
const savedAgo = (iso) => {
  if (!iso) return "";
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : d + " days ago";
};

function renderSaved() {
  const appliedJobIds = APPLICATIONS.map((a) => a.jobId);
  $("#savedCountChip").textContent = SAVED_JOBS.length;

  $("#savedList").innerHTML = SAVED_JOBS.length ? SAVED_JOBS.map((j) => {
    const applied = appliedJobIds.includes(j.id);
    const closed = j.status && j.status !== "active";
    return `
    <div class="saved-item ${closed ? "closed" : ""}" data-saveditem="${j.id}">
      <span class="app-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 3)}</span>
      <div class="saved-mid">
        <strong>${j.title}</strong>
        <small>${j.company} • <i class="fa-solid fa-location-dot"></i> ${j.distance} KM away • Posted ${savedAgo(j.postedAt || j.createdAt)}</small>
        <b class="saved-sal">${money(j.salary)} <span>/ Month • ${j.openings} opening${j.openings === 1 ? "" : "s"}</span></b>
      </div>
      <div class="saved-actions">
        ${closed
          ? '<span class="saved-closed-tag">Closed</span>'
          : `<button class="saved-apply ${applied ? "applied" : ""}" ${applied ? "disabled" : `data-apply="${j.id}"`}>
              ${applied ? '<i class="fa-solid fa-check"></i> Applied' : "Apply Now"}
            </button>`}
        <button class="saved-remove" data-save="${j.id}" title="Remove from saved"><i class="fa-solid fa-heart-crack"></i></button>
      </div>
    </div>`;
  }).join("") : `
    <div class="saved-empty">
      <i class="fa-regular fa-heart"></i>
      <p>No saved jobs yet. Tap the ♥ on any job to save it for later.</p>
      <a href="index.html"><i class="fa-solid fa-magnifying-glass"></i> Browse Jobs</a>
    </div>`;
}

/* ---------- RENDER: MESSAGES ---------- */
function msgUnreadTotal() {
  return CONVERSATIONS.reduce((n, c) => n + (c.unread || 0), 0);
}

function msgItemHtml(c, compact) {
  const o = c.other || {};
  const logo = (o.logo || o.name || "E").slice(0, 3).toUpperCase();
  const bg = o.logoBg || "linear-gradient(135deg,#2f7bff,#1a6cf5)";
  const color = o.logoColor || "#fff";
  const jobLabel = c.job ? c.job.title : "General inquiry";
  return `
  <div class="msg-item ${c.unread ? "unread" : ""}" data-conv="${c.id}">
    <span class="msg-avatar" style="background:${bg};color:${color}">${logo}</span>
    <div class="msg-mid">
      <strong>${o.name || "Employer"}</strong>
      <small>${jobLabel}</small>
      <p>${c.lastMessage || "No messages yet"}</p>
    </div>
    <div class="msg-meta">
      <time>${timeAgo(c.lastAt)}</time>
      ${c.unread ? '<span class="msg-unread-dot"></span>' : ""}
    </div>
  </div>`;
}

function updateMsgBadges() {
  const unread = msgUnreadTotal();
  ["#sbMsgBadge", "#sMsgBadge", "#msgCountChip"].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.textContent = unread || CONVERSATIONS.length;
    if (sel === "#sMsgBadge" || sel === "#sbMsgBadge") el.style.display = unread ? "" : "none";
  });
  $("#msgCountChip").textContent = CONVERSATIONS.length;
}

function renderMessages() {
  updateMsgBadges();
  const empty = `<div class="msg-empty"><i class="fa-regular fa-comment-dots"></i><p>No messages yet. Employers will reach out when they review your applications.</p></div>`;
  $("#msgList").innerHTML = CONVERSATIONS.length ? CONVERSATIONS.map((c) => msgItemHtml(c)).join("") : empty;
  $("#sMsgPreviewList").innerHTML = CONVERSATIONS.length
    ? CONVERSATIONS.slice(0, 5).map((c) => msgItemHtml(c, true)).join("")
    : `<div style="padding:14px;text-align:center;color:#7c8aa5;font-size:.78rem">No messages yet</div>`;
}

async function loadConversations() {
  CONVERSATIONS = await API.get("/api/messages/conversations");
  renderMessages();
}

function renderChatThread(messages) {
  return messages.map((m) => {
    const mine = m.senderId === API.user.id;
    return `<div class="chat-bubble ${mine ? "me" : "them"}">${m.text}<time>${timeAgo(m.createdAt)}</time></div>`;
  }).join("");
}

async function openChat(conversationId) {
  activeChatId = conversationId;
  const data = await API.get("/api/messages/conversations/" + conversationId);
  const c = data.conversation;
  const o = c.other || {};
  const idx = CONVERSATIONS.findIndex((x) => x.id === c.id);
  if (idx >= 0) CONVERSATIONS[idx] = c; else CONVERSATIONS.unshift(c);
  renderMessages();

  $("#smodal").classList.add("chat-modal");
  $("#smodalBody").innerHTML = `
    <div class="chat-head">
      <span class="msg-avatar" style="background:${o.logoBg || "linear-gradient(135deg,#2f7bff,#1a6cf5)"};color:${o.logoColor || "#fff"}">${(o.logo || o.name || "E").slice(0, 2).toUpperCase()}</span>
      <div><strong>${o.name || "Employer"}</strong><small>${c.job ? c.job.title + " • " + c.job.company : "JobDozo Messages"}</small></div>
    </div>
    <div class="chat-thread" id="chatThread">${renderChatThread(data.messages)}</div>
    <form class="chat-compose" id="chatForm">
      <input type="text" id="chatInput" placeholder="Type your reply..." autocomplete="off" required maxlength="2000" />
      <button type="submit" class="chat-send" title="Send"><i class="fa-solid fa-paper-plane"></i></button>
    </form>`;
  $("#smodalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";

  const thread = $("#chatThread");
  thread.scrollTop = thread.scrollHeight;

  await API.post("/api/messages/conversations/" + conversationId + "/read");
  if (idx >= 0) CONVERSATIONS[idx].unread = 0;
  renderMessages();

  $("#chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#chatInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    try {
      const resp = await API.post("/api/messages", { conversationId, text });
      thread.insertAdjacentHTML("beforeend", renderChatThread([resp.message]));
      thread.scrollTop = thread.scrollHeight;
      const ci = CONVERSATIONS.findIndex((x) => x.id === conversationId);
      if (ci >= 0) CONVERSATIONS[ci] = resp.conversation;
      renderMessages();
    } catch (ex) { toast(ex.message, "warn"); }
  });
}

function appendChatMessage(msg) {
  if (!activeChatId || msg.conversationId !== activeChatId) return;
  const thread = $("#chatThread");
  if (!thread) return;
  thread.insertAdjacentHTML("beforeend", renderChatThread([msg]));
  thread.scrollTop = thread.scrollHeight;
}

/* ---------- RENDER: RESUME ---------- */
const fmtFileSize = (n) => {
  if (!n) return "";
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
};

function readResumeForm() {
  const skills = ($("#rsSkills")?.value || "").split(",").map((s) => s.trim()).filter(Boolean);
  const experience = $$(".rs-exp-row").map((row) => ({
    id: row.dataset.id,
    title: row.querySelector("[name=title]")?.value.trim() || "",
    company: row.querySelector("[name=company]")?.value.trim() || "",
    from: row.querySelector("[name=from]")?.value.trim() || "",
    to: row.querySelector("[name=to]")?.value.trim() || "",
    description: row.querySelector("[name=desc]")?.value.trim() || "",
  })).filter((e) => e.title || e.company);
  const education = $$(".rs-edu-row").map((row) => ({
    id: row.dataset.id,
    degree: row.querySelector("[name=degree]")?.value.trim() || "",
    school: row.querySelector("[name=school]")?.value.trim() || "",
    year: row.querySelector("[name=year]")?.value.trim() || "",
  })).filter((e) => e.degree || e.school);
  return {
    headline: $("#rsHeadline")?.value.trim() || "",
    summary: $("#rsSummary")?.value.trim() || "",
    phone: $("#rsPhone")?.value.trim() || "",
    skills,
    experience,
    education,
  };
}

function escHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderResumePreview(r) {
  const u = API.user || {};
  const first = (u.name || "U")[0].toUpperCase();
  return `
    <div class="rp-header">
      <div class="rp-avatar">${first}</div>
      <div>
        <h2>${escHtml(u.name || "Your Name")}</h2>
        <p class="rp-headline">${escHtml(r.headline || "Add a professional headline")}</p>
        <div class="rp-contact">
          ${r.phone ? `<span><i class="fa-solid fa-phone"></i> ${escHtml(r.phone)}</span>` : ""}
          ${u.email ? `<span><i class="fa-regular fa-envelope"></i> ${escHtml(u.email)}</span>` : ""}
          ${u.location ? `<span><i class="fa-solid fa-location-dot"></i> ${escHtml(u.location)}</span>` : ""}
        </div>
      </div>
    </div>
    ${r.summary ? `<div class="rp-section"><h4>Summary</h4><p>${escHtml(r.summary)}</p></div>` : ""}
    ${r.skills?.length ? `<div class="rp-section"><h4>Skills</h4><div class="rp-tags">${r.skills.map((s) => `<span>${escHtml(s)}</span>`).join("")}</div></div>` : ""}
    ${r.experience?.length ? `<div class="rp-section"><h4>Experience</h4>${r.experience.map((e) => `
      <div class="rp-entry">
        <strong>${escHtml(e.title)}</strong>${e.company ? ` — ${escHtml(e.company)}` : ""}
        <small>${escHtml(e.from)}${e.to ? " – " + escHtml(e.to) : ""}</small>
        ${e.description ? `<p>${escHtml(e.description)}</p>` : ""}
      </div>`).join("")}</div>` : ""}
    ${r.education?.length ? `<div class="rp-section"><h4>Education</h4>${r.education.map((e) => `
      <div class="rp-entry">
        <strong>${escHtml(e.degree)}</strong>
        <small>${escHtml(e.school)}${e.year ? " • " + escHtml(e.year) : ""}</small>
      </div>`).join("")}</div>` : ""}
    ${r.file ? `<div class="rp-file"><i class="fa-regular fa-file-pdf"></i> ${escHtml(r.file.name)} <small>(${fmtFileSize(r.file.size)})</small></div>` : ""}`;
}

function expRowHtml(e = {}) {
  const id = e.id || "e" + Date.now() + Math.random().toString(36).slice(2, 5);
  return `
  <div class="rs-exp-row rs-block-row" data-id="${id}">
    <div class="rs-row-2">
      <input name="title" placeholder="Job title" value="${escHtml(e.title)}" />
      <input name="company" placeholder="Company" value="${escHtml(e.company)}" />
    </div>
    <div class="rs-row-2">
      <input name="from" placeholder="From (e.g. 2020)" value="${escHtml(e.from)}" />
      <input name="to" placeholder="To (e.g. Present)" value="${escHtml(e.to)}" />
    </div>
    <textarea name="desc" rows="2" placeholder="What you did in this role...">${escHtml(e.description)}</textarea>
    <button type="button" class="rs-remove" data-remove-exp="${id}"><i class="fa-solid fa-trash"></i></button>
  </div>`;
}

function eduRowHtml(e = {}) {
  const id = e.id || "ed" + Date.now() + Math.random().toString(36).slice(2, 5);
  return `
  <div class="rs-edu-row rs-block-row" data-id="${id}">
    <input name="degree" placeholder="Degree / qualification" value="${escHtml(e.degree)}" />
    <input name="school" placeholder="School / college" value="${escHtml(e.school)}" />
    <input name="year" placeholder="Year" value="${escHtml(e.year)}" />
    <button type="button" class="rs-remove" data-remove-edu="${id}"><i class="fa-solid fa-trash"></i></button>
  </div>`;
}

function renderResumeForm() {
  const r = RESUME || {};
  $("#resumeForm").innerHTML = `
    <div class="rs-section">
      <label>Professional Headline</label>
      <input id="rsHeadline" maxlength="120" placeholder="e.g. Security & Operations Professional" value="${escHtml(r.headline)}" />
    </div>
    <div class="rs-section">
      <label>Summary</label>
      <textarea id="rsSummary" rows="3" maxlength="2000" placeholder="Brief overview of your experience and goals...">${escHtml(r.summary)}</textarea>
    </div>
    <div class="rs-section">
      <label>Phone</label>
      <input id="rsPhone" maxlength="20" placeholder="+91 98765 43210" value="${escHtml(r.phone)}" />
    </div>
    <div class="rs-section">
      <label>Skills <small>(comma separated)</small></label>
      <input id="rsSkills" placeholder="CCTV Monitoring, Gate Management, MS Excel" value="${escHtml((r.skills || []).join(", "))}" />
    </div>
    <div class="rs-section">
      <div class="rs-section-head">
        <label>Work Experience</label>
        <button type="button" class="rs-add" id="addExpBtn"><i class="fa-solid fa-plus"></i> Add</button>
      </div>
      <div id="rsExpList">${(r.experience || []).length ? r.experience.map(expRowHtml).join("") : expRowHtml()}</div>
    </div>
    <div class="rs-section">
      <div class="rs-section-head">
        <label>Education</label>
        <button type="button" class="rs-add" id="addEduBtn"><i class="fa-solid fa-plus"></i> Add</button>
      </div>
      <div id="rsEduList">${(r.education || []).length ? r.education.map(eduRowHtml).join("") : eduRowHtml()}</div>
    </div>
    <div class="rs-section">
      <label>Resume File <small>(PDF / DOC — optional)</small></label>
      <div class="rs-upload" id="rsUploadZone">
        ${r.file ? `
          <div class="rs-file-chip">
            <i class="fa-regular fa-file-pdf"></i>
            <div><strong>${escHtml(r.file.name)}</strong><small>${fmtFileSize(r.file.size)} • uploaded ${timeAgo(r.file.uploadedAt)}</small></div>
            <button type="button" class="rs-file-del" id="rsFileDel" title="Remove file"><i class="fa-solid fa-xmark"></i></button>
          </div>` : `
          <input type="file" id="rsFileInput" accept=".pdf,.doc,.docx" hidden />
          <button type="button" class="rs-upload-btn" id="rsUploadBtn"><i class="fa-solid fa-cloud-arrow-up"></i> Upload Resume</button>
          <small>Max 5 MB. Employers see this when reviewing your applications.</small>`}
      </div>
    </div>`;
}

function syncResumeChecklist() {
  const items = $$("#pcChecklist .pc-item");
  const uploadItem = items[1];
  if (!uploadItem || !RESUME) return;
  if (RESUME.file || (RESUME.score || 0) >= 50) {
    uploadItem.classList.add("done");
    const cb = uploadItem.querySelector("input");
    if (cb) { cb.checked = true; cb.disabled = true; }
    uploadItem.querySelector("b")?.remove();
  }
}

function updateResumePreview() {
  if (!RESUME) return;
  $("#resumePreview").innerHTML = renderResumePreview({ ...RESUME, ...readResumeForm() });
}

function renderResume() {
  if (!RESUME) return;
  $("#resumeScoreChip").textContent = (RESUME.score || 0) + "% complete";
  renderResumeForm();
  updateResumePreview();
  syncResumeChecklist();
}

async function loadResume() {
  RESUME = await API.get("/api/users/me/resume");
  renderResume();
}

function goToResume() {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  $$('.ss-item[data-page="My Resume"]')[0]?.classList.add("active");
  $("#resumePanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- RENDER: AI SKILL TESTS ---------- */
function skillTestCardHtml(t) {
  const passed = t.bestScore != null && t.bestScore >= 70;
  const btnLabel = t.inProgress ? "Resume Test" : t.bestScore != null ? "Retake" : "Start AI Test";
  const btnClass = t.inProgress ? "resume" : t.bestScore != null ? "retake" : "";
  return `
  <div class="ai-test-card" style="--test-color:${t.color}" data-testid="${t.id}">
    <div class="ai-test-top">
      <span class="ai-test-ico" style="background:${t.color}"><i class="fa-solid ${t.icon}"></i></span>
      <div>
        <strong>${escHtml(t.title)}</strong>
        <small>${escHtml(t.category)}</small>
      </div>
    </div>
    <span class="ai-test-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escHtml(t.aiTag)}</span>
    <div class="ai-test-meta">
      <span><i class="fa-regular fa-clock"></i> ${t.duration} min</span>
      <span><i class="fa-solid fa-list-ol"></i> ${t.questionCount} Qs</span>
      ${t.attempts ? `<span><i class="fa-solid fa-rotate"></i> ${t.attempts} attempt${t.attempts === 1 ? "" : "s"}</span>` : ""}
    </div>
    <div class="ai-test-score">
      ${t.bestScore != null
        ? `<div class="ai-score-ring ${passed ? "pass" : "fail"}">${t.bestScore}%</div>
           ${passed ? '<span class="ai-certified"><i class="fa-solid fa-certificate"></i> Certified</span>' : ""}`
        : "<span style='font-size:.72rem;color:var(--muted)'>Not attempted</span>"}
      <button type="button" class="ai-test-btn ${btnClass}" data-start-test="${t.id}">
        <i class="fa-solid fa-robot"></i> ${btnLabel}
      </button>
    </div>
  </div>`;
}

function skillWidgetRowHtml(t) {
  if (t.bestScore != null) {
    return `<div class="st-row"><span>${escHtml(t.title)}</span><b class="done-tag"><i class="fa-solid fa-check"></i> ${t.bestScore}%</b></div>`;
  }
  return `<div class="st-row"><span>${escHtml(t.title)}</span><button type="button" class="ai-test-btn-sm" data-start-test="${t.id}">Take Test</button></div>`;
}

function renderSkillTests() {
  if (!SKILL_TESTS.length) return;
  $("#skillTestGrid").innerHTML = SKILL_TESTS.map(skillTestCardHtml).join("");
  const pending = SKILL_TESTS.filter((t) => !t.bestScore && !t.inProgress).length;
  const badge = $("#sbSkillBadge");
  if (badge) {
    badge.textContent = pending;
    badge.style.display = pending ? "" : "none";
  }
  const widget = SKILL_TESTS.slice(0, 4);
  $("#skillWidgetList").innerHTML = widget.map(skillWidgetRowHtml).join("");
}

async function loadSkillTests() {
  const data = await API.get("/api/skill-tests");
  SKILL_TESTS = data.tests || [];
  renderSkillTests();
}

function clearTestTimer() {
  if (testTimer) { clearInterval(testTimer); testTimer = null; }
}

function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function showAiGenerating(testTitle) {
  $("#smodal").classList.add("ai-test-modal");
  $("#smodalBody").innerHTML = `
    <div class="ai-test-modal-head"><h3><i class="fa-solid fa-robot"></i> JobDozo AI</h3><small>${escHtml(testTitle)}</small></div>
    <div class="ai-test-body">
      <div class="ai-gen-screen">
        <div class="ai-gen-orbs"><span></span><span></span><span></span></div>
        <strong>AI is building your personalized test</strong>
        <p>Analyzing your resume, matching difficulty, and generating adaptive questions...</p>
      </div>
    </div>`;
  $("#smodalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function renderTestQuestion(session, qIndex, answers) {
  const q = session.questions[qIndex];
  const letters = ["A", "B", "C", "D"];
  const pct = ((qIndex + 1) / session.questions.length) * 100;
  const remaining = Math.max(0, Math.floor((new Date(session.expiresAt) - Date.now()) / 1000));
  const timerClass = remaining < 60 ? " warn" : "";

  $("#smodalBody").innerHTML = `
    <div class="ai-test-modal-head">
      <h3><i class="fa-solid fa-robot"></i> ${escHtml(session.testTitle)}</h3>
      <small>Question ${qIndex + 1} of ${session.questions.length}${q.aiPersonalized ? " • <b style='color:#c4b5fd'>AI personalized</b>" : ""}</small>
      <div class="ai-test-timer${timerClass}" id="testTimer"><i class="fa-regular fa-clock"></i> <span>${formatTimer(remaining)}</span></div>
    </div>
    <div class="ai-test-body">
      <div class="ai-q-progress"><div class="ai-q-progress-fill" style="width:${pct}%"></div></div>
      <div class="ai-q-num">Question ${qIndex + 1}</div>
      ${q.skill ? `<div class="ai-q-skill"><i class="fa-solid fa-microchip"></i> AI skill focus: ${escHtml(q.skill)}</div>` : ""}
      <p class="ai-q-text">${escHtml(q.text)}</p>
      <div class="ai-options" id="aiOptions">
        ${q.options.map((opt, i) => `
          <button type="button" class="ai-opt ${answers[q.id] === i ? "selected" : ""}" data-opt="${i}" data-qid="${q.id}">
            <span class="opt-letter">${letters[i]}</span> ${escHtml(opt)}
          </button>`).join("")}
      </div>
      <div class="ai-q-nav">
        ${qIndex > 0 ? '<button type="button" class="btn-outline" id="testPrev">Previous</button>' : ""}
        <button type="button" class="btn-primary" id="testNext">${qIndex < session.questions.length - 1 ? "Next" : "Submit to AI"}</button>
      </div>
    </div>`;

  clearTestTimer();
  testTimer = setInterval(() => {
    const el = $("#testTimer span");
    if (!el) { clearTestTimer(); return; }
    const left = Math.max(0, Math.floor((new Date(session.expiresAt) - Date.now()) / 1000));
    el.textContent = formatTimer(left);
    if (left <= 60) $("#testTimer").classList.add("warn");
    if (left <= 0) { clearTestTimer(); submitSkillTest(session, answers, true); }
  }, 1000);

  $("#aiOptions").addEventListener("click", (e) => {
    const opt = e.target.closest("[data-opt]");
    if (!opt) return;
    answers[opt.dataset.qid] = parseInt(opt.dataset.opt, 10);
    $$(".ai-opt", $("#aiOptions")).forEach((b) => b.classList.remove("selected"));
    opt.classList.add("selected");
  });

  $("#testPrev")?.addEventListener("click", () => renderTestQuestion(session, qIndex - 1, answers));
  $("#testNext").addEventListener("click", () => {
    if (answers[q.id] === undefined) { toast("Select an answer to continue", "warn"); return; }
    if (qIndex < session.questions.length - 1) renderTestQuestion(session, qIndex + 1, answers);
    else submitSkillTest(session, answers);
  });
}

function showTestResult(session) {
  const fb = session.aiFeedback || {};
  const score = session.score || 0;
  const cls = score >= 70 ? "" : score >= 50 ? " mid" : " low";
  $("#smodalBody").innerHTML = `
    <div class="ai-test-modal-head"><h3><i class="fa-solid fa-robot"></i> AI Assessment Complete</h3><small>${escHtml(session.testTitle)}</small></div>
    <div class="ai-test-body">
      <div class="ai-result">
        <div class="ai-result-score${cls}">${score}%</div>
        <span class="ai-result-level${cls}">${escHtml(fb.level || "Scored")}</span>
        <p>${escHtml(fb.summary || "Your results have been saved to your profile.")}</p>
        ${fb.tips?.length ? `<ul class="ai-result-tips">${fb.tips.map((t) => `<li>${escHtml(t)}</li>`).join("")}</ul>` : ""}
        <p class="ai-result-engine"><i class="fa-solid fa-microchip"></i> ${escHtml(fb.engine || "JobDozo AI")}</p>
        <button type="button" class="btn-primary full" id="closeTestResult">Done</button>
      </div>
    </div>`;
  $("#closeTestResult").addEventListener("click", () => { closeModal(); loadSkillTests(); loadProfile(); });
}

async function submitSkillTest(session, answers, timedOut) {
  clearTestTimer();
  try {
    const resp = await API.post("/api/skill-tests/sessions/" + session.id + "/submit", { answers });
    activeTestSession = resp.session;
    showTestResult(resp.session);
    toast(timedOut ? "Time's up — AI graded your answers" : `AI scored your test: ${resp.session.score}%`, resp.session.score >= 70 ? "success" : "info");
  } catch (ex) { toast(ex.message, "warn"); }
}

async function startSkillTest(testId) {
  const test = SKILL_TESTS.find((t) => t.id === testId);
  if (!test) return;
  showAiGenerating(test.title);
  try {
    await new Promise((r) => setTimeout(r, 1400));
    const resp = await API.post("/api/skill-tests/" + testId + "/start");
    activeTestSession = resp.session;
    const answers = {};
    renderTestQuestion(resp.session, 0, answers);
    if (!resp.session.resumed) toast("AI generated " + resp.session.questions.length + " personalized questions", "info");
  } catch (ex) { closeModal(); toast(ex.message, "warn"); }
}

function goToSkillTests() {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  $$('.ss-item[data-page="Skill Tests"]')[0]?.classList.add("active");
  $("#skillTestsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- RENDER: JOB ALERTS ---------- */
function alertSummaryText(s) {
  if (!s?.enabled) return "Alerts are paused — turn on to get notified about new jobs.";
  const kw = (s.keywords || []).slice(0, 3).join(", ") || "any keyword";
  return `Get notified for: <b>${escHtml(kw)}</b>${(s.keywords || []).length > 3 ? " +" + ((s.keywords.length) - 3) + " more" : ""} within <b>${s.radius} KM</b>`;
}

function alertMatchCardHtml(m, live) {
  const j = m.job;
  if (!j) return "";
  const applied = APPLICATIONS.some((a) => a.jobId === j.id);
  return `
  <div class="alert-match-card ${!m.read && !live ? "unread" : ""}" data-alertjob="${j.id}" data-alertmatch="${m.id || ""}">
    <span class="app-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 3)}</span>
    <div class="alert-match-mid">
      <strong>${escHtml(j.title)}</strong>
      <small>${escHtml(j.company)} • ${money(j.salary)}/mo • ${j.distance} KM</small>
      ${m.reason ? `<div class="alert-reason"><i class="fa-solid fa-bell"></i> ${escHtml(m.reason)}</div>` : ""}
    </div>
    <div class="alert-match-actions">
      ${applied
        ? '<span class="done-tag" style="font-size:.68rem">Applied</span>'
        : `<button type="button" class="alert-apply-btn" data-apply="${j.id}">Apply</button>`}
    </div>
  </div>`;
}

function renderAlertKeywordTags() {
  const box = $("#alertKwBox");
  if (!box) return;
  const input = box.querySelector(".alert-kw-input");
  box.querySelectorAll(".alert-kw-tag").forEach((t) => t.remove());
  alertKeywords.forEach((kw, i) => {
    const tag = document.createElement("span");
    tag.className = "alert-kw-tag";
    tag.innerHTML = `${escHtml(kw)} <button type="button" data-kwrm="${i}"><i class="fa-solid fa-xmark"></i></button>`;
    box.insertBefore(tag, input);
  });
}

function renderAlertSettings() {
  const s = JOB_ALERTS.settings || {};
  alertKeywords = [...(s.keywords || [])];
  $("#alertSettingsForm").innerHTML = `
    <div class="alert-stats">
      <div class="alert-stat"><b>${JOB_ALERTS.stats?.totalMatches || 0}</b><small>Total hits</small></div>
      <div class="alert-stat"><b>${JOB_ALERTS.stats?.thisWeek || 0}</b><small>This week</small></div>
      <div class="alert-stat"><b>${JOB_ALERTS.liveMatches?.length || 0}</b><small>Live now</small></div>
    </div>
    <div>
      <label>Job Keywords <small>(titles, roles)</small></label>
      <div class="alert-kw-box" id="alertKwBox">
        <input class="alert-kw-input" id="alertKwInput" placeholder="Type & press Enter..." />
      </div>
    </div>
    <div>
      <label>Location</label>
      <input id="alertLocation" value="${escHtml(s.location || "")}" placeholder="Jammu, J&K" />
    </div>
    <div>
      <label>Search radius — <span id="alertRadiusLbl">${s.radius || 10} KM</span></label>
      <div class="alert-range-row">
        <input type="range" id="alertRadius" min="1" max="50" value="${s.radius || 10}" />
        <span class="alert-range-val" id="alertRadiusVal">${s.radius || 10} KM</span>
      </div>
    </div>
    <div>
      <label>Minimum salary (₹/month)</label>
      <input type="number" id="alertSalary" min="0" step="1000" value="${s.salaryMin || 0}" />
    </div>
    <div>
      <label>Preferred shift</label>
      <select id="alertShift">
        ${["any", "Day Shift", "Night Shift", "Flexible Shift", "Morning Shift"].map((sh) =>
          `<option value="${sh}" ${s.shift === sh ? "selected" : ""}>${sh === "any" ? "Any shift" : sh}</option>`).join("")}
      </select>
    </div>
    <div class="alert-channels">
      <label>Notification channels</label>
      <div class="alert-ch-row"><span><i class="fa-regular fa-bell"></i> In-app alerts</span><label class="switch"><input type="checkbox" id="alertChInApp" ${s.channels?.inApp !== false ? "checked" : ""} /><span></span></label></div>
      <div class="alert-ch-row"><span><i class="fa-regular fa-envelope"></i> Email digest</span><label class="switch"><input type="checkbox" id="alertChEmail" ${s.channels?.email ? "checked" : ""} /><span></span></label></div>
    </div>
    <button type="submit" class="alert-save-btn"><i class="fa-solid fa-floppy-disk"></i> Save Alert Preferences</button>`;
  renderAlertKeywordTags();
}

function renderAlertLists() {
  const live = JOB_ALERTS.liveMatches || [];
  const history = JOB_ALERTS.matches || [];
  $("#alertMatchesList").innerHTML = live.length
    ? live.map((j) => alertMatchCardHtml({ job: j, reason: jobAlertReason(j), read: true }, true)).join("")
    : `<div class="alert-empty"><i class="fa-regular fa-bell-slash"></i>No live matches right now. We'll notify you when new jobs fit your criteria.</div>`;
  $("#alertHistoryList").innerHTML = history.length
    ? history.slice(0, 8).map((m) => alertMatchCardHtml(m)).join("")
    : `<div class="alert-empty" style="padding:12px"><small>No alert history yet</small></div>`;
}

function jobAlertReason(job) {
  const keys = (JOB_ALERTS.settings?.keywords || []).map((k) => k.toLowerCase());
  const hay = `${job.title} ${job.category}`.toLowerCase();
  const hit = keys.find((k) => hay.includes(k));
  return hit ? `Matched: ${hit}` : "Matches your alert criteria";
}

function updateAlertBadges() {
  const unread = JOB_ALERTS.stats?.unread || 0;
  const badge = $("#sbAlertBadge");
  if (badge) {
    badge.textContent = unread || JOB_ALERTS.liveMatches?.length || 0;
    badge.style.display = (unread || JOB_ALERTS.settings?.enabled) ? "" : "none";
  }
  const chip = $("#alertLiveChip");
  if (chip) {
    chip.textContent = JOB_ALERTS.settings?.enabled ? "Live" : "Paused";
    chip.classList.toggle("off", !JOB_ALERTS.settings?.enabled);
  }
}

function renderAlertWidget() {
  const s = JOB_ALERTS.settings || {};
  $("#alertWidgetSummary").innerHTML = alertSummaryText(s);
  const tog = $("#alertToggle");
  const togMain = $("#alertToggleMain");
  if (tog) tog.checked = !!s.enabled;
  if (togMain) togMain.checked = !!s.enabled;
}

function renderJobAlerts() {
  renderAlertSettings();
  renderAlertLists();
  renderAlertWidget();
  updateAlertBadges();
}

async function loadJobAlerts() {
  JOB_ALERTS = await API.get("/api/users/me/job-alerts");
  renderJobAlerts();
}

function readAlertForm() {
  return {
    enabled: $("#alertToggleMain")?.checked ?? true,
    keywords: [...alertKeywords],
    location: $("#alertLocation")?.value.trim() || API.user?.location || "",
    radius: parseInt($("#alertRadius")?.value || "10", 10),
    salaryMin: parseInt($("#alertSalary")?.value || "0", 10),
    shift: $("#alertShift")?.value || "any",
    channels: {
      inApp: $("#alertChInApp")?.checked !== false,
      email: !!$("#alertChEmail")?.checked,
    },
  };
}

async function saveJobAlerts(patch) {
  try {
    const resp = await API.patch("/api/users/me/job-alerts", patch || readAlertForm());
    JOB_ALERTS.settings = resp.settings;
    if (resp.profilePct) {
      API.setSession(API.token, { ...API.user, profilePct: resp.profilePct });
      renderUser();
      const prefItem = $$("#pcChecklist .pc-item").find((el) => el.dataset.step === "Preferences");
      if (prefItem && resp.profilePct >= 90) {
        prefItem.classList.add("done");
        const cb = prefItem.querySelector("input");
        if (cb) { cb.checked = true; cb.disabled = true; }
        prefItem.querySelector("b")?.remove();
      }
    }
    await loadJobAlerts();
    toast("Job alert preferences saved", "success");
  } catch (ex) { toast(ex.message, "warn"); }
}

async function toggleJobAlerts(enabled) {
  try {
    const resp = await API.patch("/api/users/me/job-alerts", { enabled });
    JOB_ALERTS.settings = resp.settings;
    renderAlertWidget();
    updateAlertBadges();
    toast(enabled ? "Job alerts enabled — you'll be notified of matching jobs" : "Job alerts paused", enabled ? "success" : "info");
  } catch (ex) { toast(ex.message, "warn"); }
}

function goToJobAlerts() {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  $$('.ss-item[data-page="Job Alerts"]')[0]?.classList.add("active");
  $("#jobAlertsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- RENDER: MY PROFILE ---------- */
function renderCompletionChecklist(steps, containerSel, pctSel, barSel) {
  const el = $(containerSel);
  if (!el) return;
  el.innerHTML = (steps || []).map((s) => `
    <label class="pc-item ${s.done ? "done" : ""}">
      <input type="checkbox" ${s.done ? "checked disabled" : ""} disabled />
      <span>${escHtml(s.label)}</span>
      ${s.done ? "" : `<b>+${s.weight}%</b>`}
    </label>`).join("");
  const pct = PROFILE?.completion?.pct || 0;
  if (pctSel) { const p = $(pctSel); if (p) p.textContent = pct + "%"; }
  if (barSel) { const b = $(barSel); if (b) b.style.width = pct + "%"; }
}

function renderProfileHero() {
  const u = PROFILE?.user || API.user || {};
  const p = PROFILE?.profile || {};
  const first = (u.name || "U")[0].toUpperCase();
  $("#profileHero").innerHTML = `
    <div class="profile-hero-avatar">${first}</div>
    <div>
      <h2>${escHtml(u.name || "")}</h2>
      <small><i class="fa-solid fa-location-dot"></i> ${escHtml(u.location || "—")} • ${escHtml(u.email || "")}</small>
      <span class="profile-open-badge ${p.openToWork ? "" : "off"}">
        <span class="open-dot"></span> ${p.openToWork ? "Open to Work" : "Not looking"}
      </span>
    </div>`;
}

function renderProfileForm() {
  const u = PROFILE?.user || {};
  const p = PROFILE?.profile || {};
  const opts = PROFILE?.options || {};
  profileCategories = [...(p.preferredCategories || [])];
  $("#profileForm").innerHTML = `
    <div>
      <label>Full Name</label>
      <input id="pfName" value="${escHtml(u.name || "")}" maxlength="80" />
    </div>
    <div>
      <label>Email</label>
      <input value="${escHtml(u.email || "")}" disabled />
    </div>
    <div>
      <label>Phone</label>
      <input id="pfPhone" value="${escHtml(p.phone || "")}" maxlength="20" placeholder="+91 98765 43210" />
    </div>
    <div>
      <label>Location</label>
      <input id="pfLocation" value="${escHtml(u.location || "")}" maxlength="80" />
    </div>
    <div>
      <label>Experience</label>
      <select id="pfExperience">
        ${(opts.experience || ["Fresher", "1 - 3 Years", "3 - 5 Years", "5+ Years"]).map((e) =>
          `<option ${p.experience === e ? "selected" : ""}>${e}</option>`).join("")}
      </select>
    </div>
    <div>
      <label>Expected Salary (₹/month)</label>
      <input type="number" id="pfSalary" min="0" step="1000" value="${p.expectedSalary || 0}" />
    </div>
    <div>
      <label>Preferred Shift</label>
      <select id="pfShift">
        ${(opts.shifts || []).map((s) => `<option value="${s}" ${p.preferredShift === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </div>
    <div class="pf-full">
      <label>About / Bio</label>
      <textarea id="pfBio" rows="3" maxlength="500" placeholder="Tell employers about yourself...">${escHtml(p.bio || "")}</textarea>
    </div>
    <div class="pf-full">
      <label>Preferred Job Categories</label>
      <div class="profile-cat-grid" id="pfCategories">
        ${(opts.categories || []).map((c) =>
          `<button type="button" class="profile-cat ${profileCategories.includes(c) ? "on" : ""}" data-cat="${escHtml(c)}">${escHtml(c)}</button>`).join("")}
      </div>
    </div>
    <div class="pf-full" style="display:flex;align-items:center;justify-content:space-between">
      <label style="margin:0">Open to work</label>
      <label class="switch"><input type="checkbox" id="pfOpen" ${p.openToWork !== false ? "checked" : ""} /><span></span></label>
    </div>`;
}

function renderProfilePreview() {
  const prev = PROFILE?.publicPreview || {};
  const first = (prev.name || "U")[0].toUpperCase();
  $("#profilePreview").innerHTML = `
    <h4><i class="fa-regular fa-eye"></i> Employer Preview</h4>
    <div class="pp-head">
      <div class="pp-avatar">${first}</div>
      <div>
        <strong>${escHtml(prev.name || "")}</strong>
        <small>${escHtml(prev.headline || "No headline yet")}</small>
        <small><i class="fa-solid fa-location-dot"></i> ${escHtml(prev.location || "")}</small>
      </div>
    </div>
    <p style="font-size:.78rem;color:var(--muted);line-height:1.5;margin-bottom:10px">${escHtml(prev.bio || "Add a bio to stand out to employers.")}</p>
    <div class="pp-tags">
      ${prev.premium ? '<span style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#78350f"><i class="fa-solid fa-crown"></i> Premium</span>' : ""}
      ${prev.openToWork ? '<span style="background:#ecfdf5;color:#16a34a">Open to Work</span>' : ""}
      <span>${escHtml(prev.experience || "Fresher")}</span>
      ${prev.expectedSalary ? `<span>₹${Number(prev.expectedSalary).toLocaleString("en-IN")}+/mo</span>` : ""}
      ${(prev.skills || []).slice(0, 4).map((s) => `<span>${escHtml(s)}</span>`).join("")}
      ${(prev.certifiedTests || []).slice(0, 2).map((t) => `<span style="background:#f5f3ff;color:#7c3aed">${escHtml(t.testTitle)} ${t.score}%</span>`).join("")}
    </div>`;
}

function renderProfileStats() {
  const s = PROFILE?.stats || {};
  $("#profileStats").innerHTML = `
    <div class="profile-stat"><b>${s.applications || 0}</b><small>Applications</small></div>
    <div class="profile-stat"><b>${s.interviews || 0}</b><small>Interviews</small></div>
    <div class="profile-stat"><b>${s.profileViews || 0}</b><small>Profile Views</small></div>
    <div class="profile-stat"><b>${s.certifiedTests || 0}</b><small>AI Certifications</small></div>`;
}

function readProfileForm() {
  return {
    name: $("#pfName")?.value.trim(),
    location: $("#pfLocation")?.value.trim(),
    phone: $("#pfPhone")?.value.trim(),
    bio: $("#pfBio")?.value.trim(),
    experience: $("#pfExperience")?.value,
    expectedSalary: parseInt($("#pfSalary")?.value || "0", 10),
    preferredShift: $("#pfShift")?.value,
    preferredCategories: [...profileCategories],
    openToWork: $("#pfOpen")?.checked !== false,
  };
}

function renderProfile() {
  if (!PROFILE) return;
  const pct = PROFILE.completion?.pct || 0;
  $("#profilePctChip").textContent = pct + "% complete";
  renderProfileHero();
  renderProfileForm();
  renderProfilePreview();
  renderProfileStats();
  renderCompletionChecklist(PROFILE.completion?.steps, "#profileChecklist", "#profilePcPct", "#profilePcBar");
  renderCompletionChecklist(PROFILE.completion?.steps, "#pcChecklist", "#pcPct", "#pcBar");
}

async function loadProfile() {
  PROFILE = await API.get("/api/users/me/profile");
  if (PROFILE.user) API.setSession(API.token, { ...API.user, ...PROFILE.user, profilePct: PROFILE.completion?.pct });
  renderProfile();
  renderUser();
  refreshCounters();
}

async function saveProfile() {
  try {
    PROFILE = await API.patch("/api/users/me/profile", readProfileForm());
    API.setSession(API.token, { ...API.user, ...PROFILE.user, profilePct: PROFILE.completion?.pct });
    renderProfile();
    renderUser();
    toast("Profile saved — employers can see your updates", "success");
  } catch (ex) { toast(ex.message, "warn"); }
}

function goToProfile() {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  $$('.ss-item[data-page="My Profile"]')[0]?.classList.add("active");
  $("#profilePanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- RENDER: SUBSCRIPTION ---------- */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function renderSubHero() {
  const s = SUBSCRIPTION.subscription || {};
  const premium = SUBSCRIPTION.premium;
  const hero = $("#subHero");
  hero.className = "sub-hero" + (premium ? " premium-active" : "");
  hero.innerHTML = `
    <div class="sub-hero-left">
      <div class="sub-hero-ico"><i class="fa-solid fa-crown"></i></div>
      <div>
        <strong>${premium ? s.planName + " Member" : "Upgrade to Premium"}</strong>
        <small>${premium
          ? `Active since ${fmtDate(s.startedAt)}${s.renewsAt ? " • Renews " + fmtDate(s.renewsAt) : ""}`
          : "Get priority applications, premium badge & unlimited AI tests"}</small>
      </div>
    </div>
    <div class="sub-hero-actions">
      ${premium
        ? `<button type="button" class="sub-cancel-btn" id="subCancelBtn"><i class="fa-solid fa-xmark"></i> Cancel Plan</button>`
        : `<button type="button" class="btn-primary" id="subUpgradeBtn" style="background:linear-gradient(135deg,#f59e0b,#ea580c)"><i class="fa-solid fa-crown"></i> View Plans</button>`}
    </div>`;
  $("#subUpgradeBtn")?.addEventListener("click", () => $("#subPlans")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  $("#subCancelBtn")?.addEventListener("click", cancelSubscription);
}

function renderSubPlans() {
  const current = SUBSCRIPTION.subscription?.planId || "free";
  $("#subPlans").innerHTML = (SUBSCRIPTION.plans || []).map((p) => {
    const isCurrent = p.id === current && (p.id === "free" || SUBSCRIPTION.premium);
    const interval = p.interval === "month" ? "/mo" : p.interval === "year" ? "/yr" : "";
    return `
    <div class="sub-plan ${p.popular ? "popular" : ""} ${isCurrent ? "current" : ""}">
      ${p.popular ? '<span class="sub-plan-tag">Best Value</span>' : ""}
      ${isCurrent ? '<span class="sub-plan-tag current-tag">Current Plan</span>' : ""}
      <h4>${escHtml(p.name)}</h4>
      <div class="sub-plan-price">₹${p.price.toLocaleString("en-IN")}<span>${interval}</span></div>
      ${p.savings ? `<div class="sub-plan-save">Save ${p.savings}</div>` : ""}
      <small style="font-size:.72rem;color:var(--muted)">${escHtml(p.tagline)}</small>
      <ul>${(p.features || []).map((f) => `<li><i class="fa-solid fa-check"></i> ${escHtml(f)}</li>`).join("")}</ul>
      <button type="button" class="sub-plan-btn ${p.popular ? "primary" : "outline"}"
        data-subscribe="${p.id}" ${isCurrent || p.id === "free" ? "disabled" : ""}>
        ${isCurrent ? "Current Plan" : p.id === "free" ? "Free Forever" : "Subscribe Now"}
      </button>
    </div>`;
  }).join("");
}

function renderSubBilling() {
  const list = SUBSCRIPTION.history || [];
  $("#subBillingList").innerHTML = list.length ? list.map((b) => `
    <div class="sub-bill-row">
      <div>
        <strong>${escHtml(b.description || b.planName)}</strong>
        <small>${fmtDate(b.createdAt)} • ${escHtml(b.method || "card")}</small>
      </div>
      <div class="sub-bill-amt ${b.status}">${b.status === "cancelled" ? "Cancelled" : "₹" + Number(b.amount).toLocaleString("en-IN")}</div>
    </div>`).join("") : `<div class="sub-bill-empty">No billing history yet</div>`;
}

function updatePremiumUI() {
  const premium = SUBSCRIPTION.premium;
  const boost = $(".ss-boost");
  if (boost) {
    boost.classList.toggle("premium-active", premium);
    const btn = $("#premiumBtn");
    if (btn) btn.textContent = premium ? "Manage Plan" : "Go Premium";
  }
  const nameEl = $(".stb-prof-text strong");
  if (nameEl) {
    nameEl.querySelector(".premium-badge")?.remove();
    if (premium) nameEl.insertAdjacentHTML("beforeend", '<span class="premium-badge"><i class="fa-solid fa-crown"></i> PRO</span>');
  }
}

function renderSubscription() {
  if (!$("#subHero")) return;
  renderSubHero();
  renderSubPlans();
  renderSubBilling();
  updatePremiumUI();
}

async function loadSubscription() {
  SUBSCRIPTION = await API.get("/api/users/me/subscription");
  renderSubscription();
}

async function subscribeToPlan(planId) {
  const plan = (SUBSCRIPTION.plans || []).find((p) => p.id === planId);
  if (!plan) return;
  openModal(`
    <h3><i class="fa-solid fa-crown" style="color:#f59e0b"></i> Confirm Subscription</h3>
    <p style="font-size:.86rem;color:#7c8aa5;margin-bottom:16px">
      Subscribe to <b style="color:#16243d">${escHtml(plan.name)}</b> for
      <b style="color:#16243d">₹${plan.price.toLocaleString("en-IN")}${plan.interval === "month" ? "/month" : plan.interval === "year" ? "/year" : ""}</b>?
      <br/><small>Demo mode — no real payment required.</small>
    </p>
    <button class="btn-primary full" id="confirmSubscribe" style="background:linear-gradient(135deg,#8b5cf6,#6366f1)">
      <i class="fa-solid fa-lock"></i> Confirm & Activate Premium
    </button>`);
  $("#confirmSubscribe").addEventListener("click", async () => {
    try {
      const resp = await API.post("/api/users/me/subscription/subscribe", { planId });
      SUBSCRIPTION.subscription = resp.subscription;
      SUBSCRIPTION.premium = resp.subscription.premium;
      API.setSession(API.token, resp.user);
      closeModal();
      await loadSubscription();
      renderNotifs();
      if (PROFILE) { PROFILE.publicPreview = { ...PROFILE.publicPreview, premium: true }; renderProfilePreview(); }
      toast(`🎉 ${plan.name} activated! Enjoy your premium benefits.`, "success");
    } catch (ex) { toast(ex.message, "warn"); }
  });
}

async function cancelSubscription() {
  openModal(`
    <h3 style="color:#ef4444"><i class="fa-solid fa-triangle-exclamation"></i> Cancel Premium?</h3>
    <p style="font-size:.86rem;color:#7c8aa5;margin-bottom:18px">
      You'll lose premium badge, priority applications, and unlimited AI tests. You can re-subscribe anytime.
    </p>
    <button class="btn-primary full" id="confirmCancelSub" style="background:#ef4444">Yes, Cancel Subscription</button>`);
  $("#confirmCancelSub").addEventListener("click", async () => {
    try {
      const resp = await API.post("/api/users/me/subscription/cancel");
      SUBSCRIPTION.subscription = resp.subscription;
      SUBSCRIPTION.premium = false;
      API.setSession(API.token, resp.user);
      closeModal();
      await loadSubscription();
      renderNotifs();
      if (PROFILE) { PROFILE.publicPreview = { ...PROFILE.publicPreview, premium: false }; renderProfilePreview(); }
      toast("Premium cancelled — you're on the Free plan", "info");
    } catch (ex) { toast(ex.message, "warn"); }
  });
}

function goToSubscription() {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  $$('.ss-item[data-page="Subscription"]')[0]?.classList.add("active");
  $("#subscriptionPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- RENDER: SETTINGS ---------- */
const SETTING_TOGGLES = [
  { group: "notifications", key: "applicationUpdates", label: "Application updates", hint: "Status changes on your job applications" },
  { group: "notifications", key: "messages", label: "New messages", hint: "When employers reply in chat" },
  { group: "notifications", key: "jobAlerts", label: "Job alert matches", hint: "Instant alerts for matching jobs" },
  { group: "notifications", key: "interviewReminders", label: "Interview reminders", hint: "Reminders before scheduled interviews" },
  { group: "notifications", key: "emailDigest", label: "Weekly email digest", hint: "Summary of activity every week" },
  { group: "notifications", key: "marketing", label: "Tips & promotions", hint: "Career tips and premium offers" },
  { group: "privacy", key: "profileVisible", label: "Profile visible to employers", hint: "Let HR discover your profile in search" },
  { group: "privacy", key: "showPhone", label: "Show phone on profile", hint: "Display phone number to employers" },
  { group: "privacy", key: "showSalary", label: "Show salary expectations", hint: "Display expected salary on profile" },
  { group: "privacy", key: "allowEmployerContact", label: "Allow employer contact", hint: "Employers can message you directly" },
];

function applyThemePreference(theme) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  document.documentElement.dataset.theme = resolved;
  localStorage.setItem("jm_theme", resolved);
  const btn = $("#jmThemeToggle");
  if (btn) btn.innerHTML = resolved === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

function renderSettings() {
  if (!$("#settingsLayout")) return;
  const s = SETTINGS.settings || {};
  const acc = SETTINGS.account || {};
  const notifRows = SETTING_TOGGLES.filter((t) => t.group === "notifications").map((t) => `
    <div class="settings-row">
      <div><strong>${t.label}</strong><span>${t.hint}</span></div>
      <label class="switch"><input type="checkbox" data-set="${t.group}.${t.key}" ${s.notifications?.[t.key] ? "checked" : ""} /><span></span></label>
    </div>`).join("");
  const privacyRows = SETTING_TOGGLES.filter((t) => t.group === "privacy").map((t) => `
    <div class="settings-row">
      <div><strong>${t.label}</strong><span>${t.hint}</span></div>
      <label class="switch"><input type="checkbox" data-set="${t.group}.${t.key}" ${s.privacy?.[t.key] ? "checked" : ""} /><span></span></label>
    </div>`).join("");
  const themeOpts = (SETTINGS.themeOptions || ["light", "dark", "system"]).map((t) =>
    `<option value="${t}" ${s.preferences?.theme === t ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("");
  const langOpts = (SETTINGS.languageOptions || [{ id: "en", label: "English" }]).map((l) =>
    `<option value="${l.id}" ${s.preferences?.language === l.id ? "selected" : ""}>${escHtml(l.label)}</option>`).join("");

  $("#settingsLayout").innerHTML = `
    <div class="settings-card">
      <h4><i class="fa-regular fa-user"></i> Account</h4>
      <small>Your login details and membership info</small>
      <div class="settings-field"><label>Full name</label><input type="text" value="${escHtml(acc.name || "")}" readonly /></div>
      <div class="settings-field"><label>Email</label><input type="email" value="${escHtml(acc.email || "")}" readonly /></div>
      <div class="settings-field"><label>Location</label><input type="text" value="${escHtml(acc.location || "—")}" readonly /></div>
      <div class="settings-account-meta">
        <span class="settings-pill"><i class="fa-regular fa-calendar"></i> Joined ${fmtDate(acc.createdAt)}</span>
        <span class="settings-pill"><i class="fa-solid fa-crown"></i> ${escHtml(SUBSCRIPTION.subscription?.planName || "Free")}</span>
      </div>
      <button type="button" class="settings-link-btn" id="settingsGoProfile" style="margin-top:12px">Edit name & location in Profile →</button>
    </div>
    <div class="settings-card">
      <h4><i class="fa-solid fa-shield-halved"></i> Security</h4>
      <small>Change your account password</small>
      <form id="passwordForm" class="settings-pw-grid">
        <div class="settings-field"><label>Current password</label><input type="password" id="pwCurrent" autocomplete="current-password" /></div>
        <div class="settings-field"><label>New password</label><input type="password" id="pwNew" autocomplete="new-password" minlength="6" /></div>
        <button type="submit" class="btn-primary"><i class="fa-solid fa-key"></i> Update</button>
      </form>
    </div>
    <div class="settings-card">
      <h4><i class="fa-regular fa-bell"></i> Notifications</h4>
      <small>Choose what you want to be notified about</small>
      ${notifRows}
    </div>
    <div class="settings-card">
      <h4><i class="fa-solid fa-eye"></i> Privacy</h4>
      <small>Control what employers can see</small>
      ${privacyRows}
    </div>
    <div class="settings-card">
      <h4><i class="fa-solid fa-sliders"></i> Preferences</h4>
      <small>Appearance and display options</small>
      <div class="settings-field">
        <label>Theme</label>
        <select id="setTheme">${themeOpts}</select>
      </div>
      <div class="settings-field">
        <label>Language</label>
        <select id="setLanguage">${langOpts}</select>
      </div>
      <div class="settings-row" style="border:none;padding-top:4px">
        <div><strong>Compact sidebar</strong><span>Use a narrower navigation panel</span></div>
        <label class="switch"><input type="checkbox" id="setCompactSidebar" ${s.preferences?.compactSidebar ? "checked" : ""} /><span></span></label>
      </div>
    </div>
    <div class="settings-card settings-danger full">
      <h4><i class="fa-solid fa-triangle-exclamation"></i> Account actions</h4>
      <small>Sign out or manage your account</small>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <button type="button" class="settings-danger-btn" id="settingsLogoutBtn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>
        <button type="button" class="settings-danger-btn" id="settingsDeleteBtn" style="border-color:#fca5a5"><i class="fa-regular fa-trash-can"></i> Delete account</button>
      </div>
    </div>`;

  $("#settingsGoProfile")?.addEventListener("click", goToProfile);
  $("#settingsLogoutBtn")?.addEventListener("click", () => API.logout());
  $("#settingsDeleteBtn")?.addEventListener("click", () => toast("Account deletion is disabled in this demo", "info"));
  $("#passwordForm")?.addEventListener("submit", (e) => { e.preventDefault(); changePassword(); });
  $("#setTheme")?.addEventListener("change", (e) => applyThemePreference(e.target.value));
  $("#setCompactSidebar")?.addEventListener("change", (e) => {
    document.body.classList.toggle("sb-collapsed", e.target.checked);
  });
  if (s.preferences?.compactSidebar) document.body.classList.add("sb-collapsed");
}

function readSettingsForm() {
  const body = { notifications: {}, privacy: {}, preferences: {} };
  $$("[data-set]", $("#settingsLayout")).forEach((el) => {
    const [group, key] = el.dataset.set.split(".");
    body[group][key] = el.checked;
  });
  body.preferences.theme = $("#setTheme")?.value || "light";
  body.preferences.language = $("#setLanguage")?.value || "en";
  body.preferences.compactSidebar = !!$("#setCompactSidebar")?.checked;
  return body;
}

async function saveSettings() {
  try {
    const resp = await API.patch("/api/users/me/settings", readSettingsForm());
    SETTINGS.settings = resp.settings;
    SETTINGS.account = resp.account;
    if (resp.user) API.setSession(API.token, resp.user);
    applyThemePreference(resp.settings.preferences.theme);
    toast("Settings saved", "success");
  } catch (ex) { toast(ex.message, "warn"); }
}

async function changePassword() {
  const currentPassword = $("#pwCurrent")?.value || "";
  const newPassword = $("#pwNew")?.value || "";
  if (!currentPassword || !newPassword) { toast("Enter current and new password", "warn"); return; }
  try {
    await API.post("/api/users/me/password", { currentPassword, newPassword });
    $("#pwCurrent").value = "";
    $("#pwNew").value = "";
    toast("Password updated successfully", "success");
  } catch (ex) { toast(ex.message, "warn"); }
}

async function loadSettings() {
  SETTINGS = await API.get("/api/users/me/settings");
  renderSettings();
  applyThemePreference(SETTINGS.settings?.preferences?.theme || "light");
}

function goToSettings() {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  $$('.ss-item[data-page="Settings"]')[0]?.classList.add("active");
  $("#settingsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProfilePreviewLive() {
  if (!PROFILE) return;
  const f = readProfileForm();
  PROFILE.publicPreview = {
    ...PROFILE.publicPreview,
    name: f.name,
    location: f.location,
    phone: f.phone,
    bio: f.bio,
    experience: f.experience,
    expectedSalary: f.expectedSalary,
    openToWork: f.openToWork,
    preferredCategories: f.preferredCategories,
  };
  renderProfilePreview();
  const first = (f.name || "U")[0].toUpperCase();
  $(".profile-hero-avatar").textContent = first;
  $(".profile-hero h2").textContent = f.name;
}

/* ---------- RENDER: NOTIFICATIONS ---------- */
async function renderNotifs() {
  try {
    const list = await API.get("/api/notifications");
    $("#sNotifList").innerHTML = list.length ? list.slice(0, 8).map((n) => `
      <div class="sn-item">
        <span class="sn-ico" style="background:${n.bg}"><i class="fa-solid ${n.icon}"></i></span>
        <div><p>${n.text}</p><small>${timeAgo(n.createdAt)}</small></div>
      </div>`).join("") : `<div style="padding:16px;text-align:center;color:#7c8aa5;font-size:.8rem">No notifications</div>`;
    const unread = list.filter((n) => !n.read).length;
    const badge = $("#sNotifBtn .tb-badge");
    badge.textContent = unread;
    badge.style.display = unread ? "" : "none";
  } catch { /* offline */ }
}

/* ---------- COUNTERS ---------- */
function refreshCounters() {
  $("#stApplied").textContent = APPLICATIONS.length;
  $("#sbAppliedBadge").textContent = APPLICATIONS.length;
  $("#stSaved").textContent = SAVED_JOBS.length;
  $("#sbSavedBadge").textContent = SAVED_JOBS.length;
  $("#stInterviews").textContent = APPLICATIONS.filter((a) => a.status === "Interview").length;
  $("#stViews").textContent = PROFILE?.stats?.profileViews ?? 45;
}

function renderUser() {
  if (!API.user) return;
  const first = API.user.name.split(" ")[0];
  $(".spage-head h1").innerHTML = `Hi, ${first}! <span class="wave">👋</span>`;
  $(".ss-profile-mini strong").textContent = API.user.name;
  $(".stb-prof-text strong").textContent = API.user.name;
  $(".ss-avatar").textContent = first[0].toUpperCase();
  $(".stb-avatar").textContent = first[0].toUpperCase();
  const loc = API.user.location || "";
  $(".ss-profile-mini small").innerHTML = loc ? `<i class="fa-solid fa-location-dot"></i> ${loc}` : "";
  const open = PROFILE?.profile?.openToWork !== false;
  $(".stb-prof-text small").innerHTML = `<span class="open-dot"></span> ${open ? "Open to Work" : "Not looking"}`;
  const pct = PROFILE?.completion?.pct ?? API.user.profilePct ?? 60;
  $("#pcPct").textContent = pct + "%";
  $("#pcBar").style.width = pct + "%";
  updatePremiumUI();
}

/* ---------- LOAD ---------- */
async function loadAll() {
  if (!API.isRole("seeker")) return;
  try {
    const [apps, jobs, saved, convs, resume, skills, alerts, profile, subscription, settings] = await Promise.all([
      API.get("/api/applications/mine"),
      API.get("/api/jobs"),
      API.get("/api/saved"),
      API.get("/api/messages/conversations"),
      API.get("/api/users/me/resume"),
      API.get("/api/skill-tests"),
      API.get("/api/users/me/job-alerts"),
      API.get("/api/users/me/profile"),
      API.get("/api/users/me/subscription"),
      API.get("/api/users/me/settings"),
    ]);
    APPLICATIONS = apps;
    RECS = jobs;
    savedIds = saved.ids;
    SAVED_JOBS = saved.jobs;
    CONVERSATIONS = convs;
    RESUME = resume;
    SKILL_TESTS = skills.tests || [];
    JOB_ALERTS = alerts;
    PROFILE = profile;
    SUBSCRIPTION = subscription;
    SETTINGS = settings;
    if (PROFILE.user) API.setSession(API.token, { ...API.user, ...PROFILE.user, profilePct: PROFILE.completion?.pct });
    renderApps(); renderRecs(); renderSaved(); renderMessages(); renderResume(); renderProfile(); renderSubscription(); renderSettings(); renderSkillTests(); renderJobAlerts(); renderInterviews(); refreshCounters(); renderNotifs(); renderUser();
    applyThemePreference(SETTINGS.settings?.preferences?.theme || localStorage.getItem("jm_theme") || "light");
  } catch (e) {
    toast(e.message, "warn");
  }
}

/* ---------- REAL-TIME ---------- */
socket.on("application:status", (a) => {
  const i = APPLICATIONS.findIndex((x) => x.id === a.id);
  if (i >= 0) APPLICATIONS[i] = a; else APPLICATIONS.unshift(a);
  renderApps(); renderInterviews(); refreshCounters();
  const iv = a.status === "Interview" && a.interview ? ` — ${a.interview.date} ${fmtTime12(a.interview.time)}` : "";
  toast(`📢 ${a.job ? a.job.title : "Application"} — status: ${a.status}${iv}`, a.status === "Rejected" ? "warn" : "success");
});
socket.on("notification:new", () => renderNotifs());
socket.on("message:new", ({ conversation, message }) => {
  const i = CONVERSATIONS.findIndex((x) => x.id === conversation.id);
  if (i >= 0) CONVERSATIONS[i] = conversation; else CONVERSATIONS.unshift(conversation);
  CONVERSATIONS.sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
  renderMessages();
  if (message.senderId !== API.user.id) {
    appendChatMessage(message);
    if (activeChatId !== conversation.id) {
      toast(`💬 ${conversation.other?.name || "Employer"}: ${message.text.slice(0, 60)}${message.text.length > 60 ? "…" : ""}`, "info");
    }
  }
});
socket.on("job:created", (j) => {
  RECS.unshift(j);
  renderRecs();
  toast(`New job matches your area: ${j.title} at ${j.company}`, "info");
  if (API.isRole("seeker")) loadJobAlerts();
});
socket.on("alert:match", ({ job }) => {
  toast(`🔔 Job alert: ${job.title} at ${job.company} (${job.distance} KM)`, "info");
  loadJobAlerts();
  renderNotifs();
});
socket.on("job:removed", ({ id, title }) => {
  RECS = RECS.filter((j) => j.id !== id);
  const wasSaved = SAVED_JOBS.some((j) => j.id === id);
  SAVED_JOBS = SAVED_JOBS.filter((j) => j.id !== id);
  renderRecs(); renderSaved(); refreshCounters();
  if (wasSaved) toast(`A saved job was removed by the employer${title ? `: ${title}` : ""}`, "warn");
});
socket.on("job:updated", (j) => {
  const s = SAVED_JOBS.find((x) => x.id === j.id);
  if (s) { Object.assign(s, j); renderSaved(); }
  const r = RECS.findIndex((x) => x.id === j.id);
  if (j.status !== "active") { if (r >= 0) { RECS.splice(r, 1); renderRecs(); } }
  else if (r >= 0) { RECS[r] = j; renderRecs(); }
});

/* ---------- MODAL ---------- */
function openModal(html) {
  $("#smodalBody").innerHTML = html;
  $("#smodalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  clearTestTimer();
  $("#smodalOverlay").classList.remove("open");
  $("#smodal").classList.remove("chat-modal", "resume-modal", "ai-test-modal");
  document.body.style.overflow = "";
  activeChatId = null;
  activeTestSession = null;
}
$("#smodalClose").addEventListener("click", closeModal);
$("#smodalOverlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- ACTIONS ---------- */
document.addEventListener("click", async (e) => {
  const applyBtn = e.target.closest("[data-apply]");
  if (applyBtn) {
    try {
      const a = await API.post("/api/applications", { jobId: applyBtn.dataset.apply, experience: "1 - 3 Years" });
      APPLICATIONS.unshift(a);
      renderApps(); renderRecs(); renderSaved(); renderInterviews(); refreshCounters();
      toast(`Applied to ${a.job.title} at ${a.job.company} ✓`, "success");
    } catch (ex) { toast(ex.message, "warn"); }
    return;
  }

  const saveBtn = e.target.closest("[data-save]");
  if (saveBtn) {
    const jobId = saveBtn.dataset.save;
    try {
      const r = await API.post("/api/saved/" + jobId);
      savedIds = r.ids;
      if (r.saved) {
        const job = RECS.find((j) => j.id === jobId) || SAVED_JOBS.find((j) => j.id === jobId);
        if (job && !SAVED_JOBS.some((j) => j.id === jobId)) SAVED_JOBS.unshift(job);
      } else {
        SAVED_JOBS = SAVED_JOBS.filter((j) => j.id !== jobId);
      }
      renderRecs(); renderSaved(); refreshCounters();
      toast(r.saved ? "Job saved ❤" : "Removed from saved jobs", r.saved ? "success" : "info");
    } catch (ex) { toast(ex.message, "warn"); }
    return;
  }

  const wBtn = e.target.closest("[data-withdraw]");
  if (wBtn) {
    e.stopPropagation();
    const a = APPLICATIONS.find((x) => x.id === wBtn.dataset.withdraw);
    openModal(`
      <h3 style="color:#ef4444"><i class="fa-solid fa-triangle-exclamation"></i> Withdraw Application?</h3>
      <p style="font-size:.86rem;color:#7c8aa5;margin-bottom:18px">
        Withdraw your application for <b style="color:#16243d">"${a.job.title}"</b> at ${a.job.company}? You can re-apply later.
      </p>
      <button class="btn-primary full" id="confirmWithdraw" style="background:#ef4444">Yes, Withdraw</button>`);
    $("#confirmWithdraw").addEventListener("click", async () => {
      try {
        await API.del("/api/applications/" + a.id);
        APPLICATIONS = APPLICATIONS.filter((x) => x.id !== a.id);
        renderApps(); renderRecs(); renderSaved(); renderInterviews(); refreshCounters(); closeModal();
        toast(`Application for "${a.job.title}" withdrawn`, "warn");
      } catch (ex) { toast(ex.message, "warn"); }
    });
    return;
  }

  const msgApp = e.target.closest("[data-msgapp]");
  if (msgApp) {
    e.stopPropagation();
    const conv = CONVERSATIONS.find((c) => c.applicationId === msgApp.dataset.msgapp);
    if (conv) openChat(conv.id);
    else toast("No messages from this employer yet", "info");
    return;
  }

  const convRow = e.target.closest("[data-conv]");
  if (convRow) { openChat(convRow.dataset.conv); return; }

  const intBtn = e.target.closest("[data-intview]");
  if (intBtn) { e.stopPropagation(); openInterviewModal(intBtn.dataset.intview); return; }

  const intRow = e.target.closest("[data-intapp]");
  if (intRow) { openInterviewModal(intRow.dataset.intapp); return; }

  const appCard = e.target.closest(".app-card");
  if (appCard) {
    const a = APPLICATIONS.find((x) => x.id === appCard.dataset.app);
    if (!a) return;
    openModal(`
      <h3>${a.job.title}</h3>
      <div class="sm-row"><span>Company</span><b>${a.job.company}</b></div>
      <div class="sm-row"><span>Salary</span><b>${money(a.job.salary)} / Month</b></div>
      <div class="sm-row"><span>Applied</span><b>${timeAgo(a.createdAt)}</b></div>
      <div class="sm-row"><span>Status</span><b><span class="app-status ${(STATUS_META[a.status] || {}).cls}">${a.status}</span></b></div>
      <div class="sm-row"><span>Latest Update</span><b>${a.note || "—"}</b></div>`);
    return;
  }
});

$("#appFilter").addEventListener("change", renderApps);
$("#seekerSearch").addEventListener("input", renderApps);

/* ---------- INTERVIEW SCHEDULE (live from applications) ---------- */
const fmtTime12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
};
const isToday = (iso) => iso === new Date().toISOString().slice(0, 10);
const isPast = (iv) => new Date(`${iv.date}T${iv.time || "23:59"}`) < new Date(Date.now() - 36e5);

function interviewApps() {
  return APPLICATIONS
    .filter((a) => a.status === "Interview")
    .sort((x, y) => {
      const dx = x.interview ? `${x.interview.date}T${x.interview.time}` : "9999";
      const dy = y.interview ? `${y.interview.date}T${y.interview.time}` : "9999";
      return dx.localeCompare(dy);
    });
}

function renderInterviews() {
  const list = interviewApps();
  const badge = $("#sbInterviewBadge");
  if (badge) {
    badge.textContent = list.length;
    badge.style.display = list.length ? "" : "none";
  }

  $("#interviewList").innerHTML = list.length ? list.map((a) => {
    const j = a.job || { title: "(removed job)", company: "" };
    const iv = a.interview;
    if (!iv) {
      return `
      <div class="int-item" data-intapp="${a.id}">
        <div class="int-date"><b>?</b><small>TBD</small></div>
        <div class="int-mid"><strong>${j.title} — ${j.company}</strong><small>Awaiting date from employer</small></div>
        <button class="int-join" data-intview="${a.id}">Details</button>
      </div>`;
    }
    const d = new Date(iv.date + "T00:00");
    const today = isToday(iv.date);
    const past = isPast(iv);
    return `
    <div class="int-item ${today ? "today" : ""}" data-intapp="${a.id}" ${past ? 'style="opacity:.55"' : ""}>
      <div class="int-date"><b>${d.getDate()}</b><small>${d.toLocaleString("en-US", { month: "short" })}</small></div>
      <div class="int-mid">
        <strong>${j.title} — ${j.company}</strong>
        <small>${fmtTime12(iv.time)} • ${iv.mode}${today ? " • <b style='color:var(--green)'>Today</b>" : past ? " • Completed" : ""}</small>
      </div>
      <button class="int-join" data-intview="${a.id}">${today && iv.mode === "Video Call" && !past ? "Join" : "Details"}</button>
    </div>`;
  }).join("") : `
    <div class="app-empty" style="padding:18px 10px">
      <i class="fa-regular fa-calendar" style="display:block;font-size:1.3rem;color:#c7d4ea;margin-bottom:7px"></i>
      No interviews scheduled yet.<br/><small style="font-size:.72rem">They appear here the moment an employer schedules one.</small>
    </div>`;
}

function openInterviewModal(appId) {
  const a = APPLICATIONS.find((x) => x.id === appId);
  if (!a) return;
  const j = a.job || { title: "(removed job)", company: "" };
  const iv = a.interview;
  const today = iv && isToday(iv.date);
  openModal(`
    <h3><i class="fa-regular fa-calendar-check" style="color:#8b5cf6"></i> Interview Details</h3>
    <div class="sm-row"><span>Position</span><b>${j.title}</b></div>
    <div class="sm-row"><span>Company</span><b>${j.company}</b></div>
    ${iv ? `
      <div class="sm-row"><span>Date</span><b>${new Date(iv.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}${today ? ' <span style="color:var(--green)">• Today</span>' : ""}</b></div>
      <div class="sm-row"><span>Time</span><b>${fmtTime12(iv.time)}</b></div>
      <div class="sm-row"><span>Mode</span><b>${iv.mode}</b></div>
      ${iv.mode === "Video Call" ? `<div class="sm-row"><span>Meeting Link</span><b>${iv.link ? `<a href="${iv.link}" target="_blank" style="color:var(--blue)">${iv.link}</a>` : "Will be shared before the interview"}</b></div>` : ""}
      ${iv.mode === "On-site" ? `<div class="sm-row"><span>Location</span><b>${iv.link || j.location || "Company office"}</b></div>` : ""}
    ` : `<div class="sm-row"><span>Schedule</span><b>Awaiting date — the employer will confirm soon</b></div>`}
    <div class="sm-row"><span>Status</span><b><span class="app-status interview">Interview</span></b></div>
    <p style="font-size:.76rem;color:#7c8aa5;margin-top:14px"><i class="fa-solid fa-lightbulb" style="color:#f59e0b"></i>
      Tip: Join 5 minutes early, keep your resume handy, and test your mic & camera.</p>
    ${iv && today && iv.mode === "Video Call" ? `<button class="btn-primary full" style="margin-top:12px" id="joinNowBtn" data-link="${iv.link || ""}"><i class="fa-solid fa-video"></i> Join Interview Now</button>` : ""}
  `);
  const joinBtn = $("#joinNowBtn");
  if (joinBtn) joinBtn.addEventListener("click", () => {
    const link = joinBtn.dataset.link;
    if (link) window.open(link, "_blank");
    else toast("Meeting link will be shared by the employer shortly", "info");
  });
}

/* ---------- SIDEBAR / NAV / MISC ---------- */
$("#ssidebarToggle").addEventListener("click", () => {
  if (window.innerWidth <= 880) document.body.classList.toggle("sb-open-mobile");
  else document.body.classList.toggle("sb-collapsed");
});
$$("[data-page]").forEach((el) => el.addEventListener("click", () => {
  $$(".ss-item").forEach((x) => x.classList.remove("active"));
  el.classList.add("active");
  const p = el.dataset.page;
  if (p === "My Applications") { $("#appFilter").value = "all"; renderApps(); $(".sleft .panel").scrollIntoView({ behavior: "smooth" }); }
  else if (p === "Saved Jobs") $("#savedPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  else if (p === "Interview Schedule") $("#interviewPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  else if (p === "Messages") $("#messagesPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  else if (p === "My Resume") goToResume();
  else if (p === "Skill Tests") goToSkillTests();
  else if (p === "Job Alerts") goToJobAlerts();
  else if (p === "My Profile") goToProfile();
  else if (p === "Subscription") goToSubscription();
  else if (p === "Settings") goToSettings();
  else if (p === "Recommended Jobs") $("#recGrid").scrollIntoView({ behavior: "smooth", block: "center" });
  else if (p === "Dashboard") window.scrollTo({ top: 0, behavior: "smooth" });
  else toast(`${p} — coming soon in this demo`, "info");
}));
$$(".sstat[data-go]").forEach((s) => s.addEventListener("click", () => {
  const go = s.dataset.go;
  if (go === "applications") $(".sleft .panel").scrollIntoView({ behavior: "smooth" });
  else if (go === "saved") $("#savedPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  else if (go === "interviews") $("#interviewList").scrollIntoView({ behavior: "smooth", block: "center" });
}));

[["#sNotifBtn", "#sNotifDropdown"], ["#sMsgBtn", "#sMsgDropdown"], ["#sProfileBtn", "#sProfileDropdown"]].forEach(([b, d]) => {
  $(b).addEventListener("click", (e) => {
    if (e.target.closest(".sd-item")) return;
    e.stopPropagation();
    const dd = $(d);
    const was = dd.classList.contains("open");
    $$(".sdropdown").forEach((x) => x.classList.remove("open"));
    if (!was) dd.classList.add("open");
  });
});
document.addEventListener("click", () => $$(".sdropdown").forEach((x) => x.classList.remove("open")));

$("#sProfileDropdown").addEventListener("click", (e) => {
  const item = e.target.closest(".sd-item");
  if (!item) return;
  if (item.classList.contains("danger")) { e.preventDefault(); API.logout(); return; }
  if (item.dataset.goto === "My Resume") { e.preventDefault(); $$(".sdropdown").forEach((x) => x.classList.remove("open")); goToResume(); return; }
  if (item.dataset.goto === "My Profile") { e.preventDefault(); $$(".sdropdown").forEach((x) => x.classList.remove("open")); goToProfile(); return; }
  if (item.dataset.goto === "Settings") { e.preventDefault(); $$(".sdropdown").forEach((x) => x.classList.remove("open")); goToSettings(); }
});
$("#ssProfileMini").addEventListener("click", goToProfile);
$("#editProfileBtn").addEventListener("click", (e) => { e.preventDefault(); goToProfile(); });
$("#profileSaveBtn").addEventListener("click", saveProfile);
$("#profilePanel").addEventListener("click", (e) => {
  const cat = e.target.closest("[data-cat]");
  if (!cat) return;
  const c = cat.dataset.cat;
  if (profileCategories.includes(c)) profileCategories = profileCategories.filter((x) => x !== c);
  else if (profileCategories.length < 6) profileCategories.push(c);
  cat.classList.toggle("on", profileCategories.includes(c));
  updateProfilePreviewLive();
});
$("#profilePanel").addEventListener("input", (e) => {
  if (e.target.closest("#profileForm")) updateProfilePreviewLive();
});

$("#resumePanel").addEventListener("input", (e) => {
  if (e.target.closest("#resumeForm")) updateResumePreview();
});
$("#resumePanel").addEventListener("click", async (e) => {
  if (e.target.closest("#addExpBtn")) {
    $("#rsExpList").insertAdjacentHTML("beforeend", expRowHtml());
    return;
  }
  if (e.target.closest("#addEduBtn")) {
    $("#rsEduList").insertAdjacentHTML("beforeend", eduRowHtml());
    return;
  }
  const rmExp = e.target.closest("[data-remove-exp]");
  if (rmExp) { rmExp.closest(".rs-exp-row")?.remove(); updateResumePreview(); return; }
  const rmEdu = e.target.closest("[data-remove-edu]");
  if (rmEdu) { rmEdu.closest(".rs-edu-row")?.remove(); updateResumePreview(); return; }
  if (e.target.closest("#rsUploadBtn")) { $("#rsFileInput")?.click(); return; }
  if (e.target.closest("#rsFileDel")) {
    try {
      RESUME = await API.del("/api/users/me/resume/file");
      renderResume();
      toast("Resume file removed", "info");
    } catch (ex) { toast(ex.message, "warn"); }
    return;
  }
});
$("#resumePanel").addEventListener("change", async (e) => {
  if (e.target.id !== "rsFileInput") return;
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast("File must be under 5 MB", "warn"); return; }
  try {
    RESUME = await API.post("/api/users/me/resume/file", { name: file.name, size: file.size, type: file.type });
    renderResume();
    toast(`"${file.name}" uploaded to your profile`, "success");
  } catch (ex) { toast(ex.message, "warn"); }
  e.target.value = "";
});

$("#resumeSaveBtn").addEventListener("click", async () => {
  try {
    RESUME = await API.patch("/api/users/me/resume", readResumeForm());
    renderResume();
    loadProfile();
    toast("Resume saved successfully", "success");
  } catch (ex) { toast(ex.message, "warn"); }
});

$("#resumePreviewBtn").addEventListener("click", () => {
  if (!RESUME) return;
  $("#smodal").classList.add("resume-modal");
  openModal(`<div class="resume-paper resume-paper--modal">${renderResumePreview({ ...RESUME, ...readResumeForm() })}</div>`);
});

$("#sMsgViewAll").addEventListener("click", (e) => {
  e.preventDefault();
  $$(".sdropdown").forEach((x) => x.classList.remove("open"));
  $("#messagesPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#sMsgPreviewList").addEventListener("click", (e) => {
  const row = e.target.closest("[data-conv]");
  if (row) {
    $$(".sdropdown").forEach((x) => x.classList.remove("open"));
    openChat(row.dataset.conv);
  }
});

$("#premiumBtn").addEventListener("click", goToSubscription);
$("#settingsSaveBtn").addEventListener("click", saveSettings);
$("#subscriptionPanel").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-subscribe]");
  if (btn && !btn.disabled) subscribeToPlan(btn.dataset.subscribe);
});
document.addEventListener("click", (e) => {
  const startBtn = e.target.closest("[data-start-test]");
  if (startBtn) { e.preventDefault(); startSkillTest(startBtn.dataset.startTest); }
});
$("#allTests").addEventListener("click", (e) => { e.preventDefault(); goToSkillTests(); });
$("#alertToggle").addEventListener("change", (e) => {
  const main = $("#alertToggleMain");
  if (main) main.checked = e.target.checked;
  toggleJobAlerts(e.target.checked);
});
$("#editAlertsBtn").addEventListener("click", (e) => { e.preventDefault(); goToJobAlerts(); });

$("#jobAlertsPanel").addEventListener("submit", (e) => {
  if (e.target.id === "alertSettingsForm") { e.preventDefault(); saveJobAlerts(); }
});
$("#jobAlertsPanel").addEventListener("change", (e) => {
  if (e.target.id === "alertToggleMain") {
    $("#alertToggle").checked = e.target.checked;
    toggleJobAlerts(e.target.checked);
  }
});
$("#jobAlertsPanel").addEventListener("click", async (e) => {
  const rm = e.target.closest("[data-kwrm]");
  if (rm) { alertKeywords.splice(+rm.dataset.kwrm, 1); renderAlertKeywordTags(); return; }
  if (e.target.id === "alertMarkRead") {
    try {
      await API.post("/api/users/me/job-alerts/read-all");
      await loadJobAlerts();
      toast("All alert matches marked as read", "success");
    } catch (ex) { toast(ex.message, "warn"); }
    return;
  }
  const matchRow = e.target.closest("[data-alertmatch]");
  if (matchRow?.dataset.alertmatch) {
    try {
      await API.post("/api/users/me/job-alerts/matches/" + matchRow.dataset.alertmatch + "/read");
      matchRow.classList.remove("unread");
      loadJobAlerts();
    } catch { /* ignore */ }
  }
});
$("#jobAlertsPanel").addEventListener("keydown", (e) => {
  if (e.target.id !== "alertKwInput" || e.key !== "Enter") return;
  e.preventDefault();
  const v = e.target.value.trim();
  if (v && !alertKeywords.includes(v) && alertKeywords.length < 12) {
    alertKeywords.push(v);
    e.target.value = "";
    renderAlertKeywordTags();
  }
});
$("#jobAlertsPanel").addEventListener("input", (e) => {
  if (e.target.id === "alertRadius") {
    const lbl = $("#alertRadiusLbl");
    const val = $("#alertRadiusVal");
    if (lbl) lbl.textContent = e.target.value + " KM";
    if (val) val.textContent = e.target.value + " KM";
  }
});

/* ---------- INIT ---------- */
loadAll();
