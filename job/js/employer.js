/* ============ JobDozo Employer Panel — employer.js ============ */
"use strict";

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ---------- TOAST ---------- */
function toast(msg, type = "success") {
  const icons = { success: "fa-circle-check", info: "fa-circle-info", warn: "fa-triangle-exclamation" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3200);
}

/* ---------- AUTH GATE & USER ---------- */
requireRole();
if (API.isRole("employer")) {
  const u = API.user;
  $(".etb-prof-text strong").textContent = u.company || u.name;
  $(".etb-avatar").textContent = (u.company || u.name).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  $(".jp-head strong").textContent = u.company || u.name;
  $(".jp-logo").textContent = (u.company || u.name).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (typeof u.wallet === "number") $("#walletAmt").textContent = "₹ " + u.wallet.toLocaleString("en-IN") + ".00";
}

/* ---------- STATE ---------- */
const job = {
  title: "", category: "", type: "Full Time", location: "", mode: "On-site",
  description: "", overview: "",
  expMin: "2", expMax: "4", education: "Graduate",
  skills: ["React.js", "Node.js", "JavaScript", "MongoDB", "Express", "Git"],
  openings: 3, english: "Basic",
  salMin: 6, salMax: 12, salType: "Yearly (LPA)", hideSalary: false,
  benefits: ["Health Insurance", "Provident Fund"],
};
let currentStep = 1;

/* ---------- LIVE PREVIEW ---------- */
function updatePreview() {
  $("#pvTitle").textContent = job.title || "Software Developer";
  $("#pvSalary").textContent = job.hideSalary ? "Salary Hidden" : `₹ ${job.salMin} - ${job.salMax} LPA`;
  $("#pvType").textContent = job.type;
  $("#pvLocation").textContent = (job.mode === "Remote") ? "Remote" : (job.location || "Bangalore, Karnataka");
  $("#pvExp").textContent = (job.expMin === "0" ? "Fresher" : job.expMin + "-" + job.expMax + " Yrs");
  $("#pvMode").textContent = job.mode;
  const shown = job.skills.slice(0, 3);
  const extra = job.skills.length - shown.length;
  $("#pvSkills").innerHTML = shown.map((s) => `<span class="jp-skill">${s}</span>`).join("") +
    (extra > 0 ? `<span class="jp-skill">+${extra}</span>` : "");
}

/* ---------- COUNTERS & INPUTS ---------- */
$("#fJobTitle").addEventListener("input", (e) => {
  job.title = e.target.value;
  $("#titleCount").textContent = e.target.value.length;
  updatePreview();
});
$("#fCategory").addEventListener("change", (e) => (job.category = e.target.value));
$("#fLocation").addEventListener("input", (e) => { job.location = e.target.value; updatePreview(); });
$("#fOverview").addEventListener("input", (e) => {
  job.overview = e.target.value;
  $("#overviewCount").textContent = e.target.value.length;
});
$("#fDescription").addEventListener("input", (e) => {
  const txt = e.target.innerText.trim();
  if (txt.length > 5000) e.target.innerText = txt.slice(0, 5000);
  job.description = e.target.innerHTML;
  $("#descCount").textContent = Math.min(txt.length, 5000);
});

/* pill groups */
function bindPills(boxId, key) {
  $("#" + boxId).addEventListener("click", (e) => {
    const p = e.target.closest(".pill");
    if (!p) return;
    $$(".pill", $("#" + boxId)).forEach((x) => {
      x.classList.remove("active");
      const ic = x.querySelector("i"); if (ic) ic.remove();
    });
    p.classList.add("active");
    p.insertAdjacentHTML("afterbegin", '<i class="fa-regular fa-circle-dot"></i> ');
    job[key] = p.dataset.val;
    updatePreview();
  });
}
bindPills("fJobType", "type");
bindPills("fWorkMode", "mode");

/* use my location */
$("#useMyLocation").addEventListener("click", () => {
  $("#fLocation").value = "Jammu, J&K";
  job.location = "Jammu, J&K";
  updatePreview();
  toast("Location detected: Jammu, J&K", "success");
});

/* rich text toolbar */
$$(".rte-bar button").forEach((b) => b.addEventListener("click", () => {
  const cmd = b.dataset.cmd;
  $("#fDescription").focus();
  if (cmd === "createLink") {
    const url = prompt("Enter link URL:", "https://");
    if (url) document.execCommand(cmd, false, url);
  } else {
    document.execCommand(cmd, false, null);
  }
  job.description = $("#fDescription").innerHTML;
}));

/* skills tag input */
function renderSkills() {
  $$(".skill-tag", $("#skillsBox")).forEach((t) => t.remove());
  const input = $("#fSkillInput");
  job.skills.forEach((s, i) => {
    const tag = document.createElement("span");
    tag.className = "skill-tag";
    tag.innerHTML = `${s} <button type="button" data-i="${i}"><i class="fa-solid fa-xmark"></i></button>`;
    $("#skillsBox").insertBefore(tag, input);
  });
  updatePreview();
}
$("#fSkillInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const v = e.target.value.trim();
    if (v && !job.skills.includes(v)) { job.skills.push(v); renderSkills(); }
    e.target.value = "";
  }
});
$("#skillsBox").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-i]");
  if (btn) { job.skills.splice(+btn.dataset.i, 1); renderSkills(); }
});
renderSkills();

/* step 2/3 fields */
$("#fExpMin").addEventListener("change", (e) => { job.expMin = e.target.value; updatePreview(); });
$("#fExpMax").addEventListener("change", (e) => { job.expMax = e.target.value; updatePreview(); });
$("#fEducation").addEventListener("change", (e) => (job.education = e.target.value));
$("#fOpenings").addEventListener("input", (e) => (job.openings = e.target.value));
$("#fEnglish").addEventListener("change", (e) => (job.english = e.target.value));
$("#fSalMin").addEventListener("input", (e) => { job.salMin = e.target.value; updatePreview(); });
$("#fSalMax").addEventListener("input", (e) => { job.salMax = e.target.value; updatePreview(); });
$("#fSalType").addEventListener("change", (e) => (job.salType = e.target.value));
$("#fHideSalary").addEventListener("change", (e) => { job.hideSalary = e.target.checked; updatePreview(); });
$("#fBenefits").addEventListener("change", () => {
  job.benefits = $$('#fBenefits input:checked').map((c) => c.value);
});

/* ---------- STEPPER ---------- */
function validateStep(n) {
  if (n === 1) {
    if (!job.title.trim()) { toast("Please enter a job title", "warn"); $("#fJobTitle").focus(); return false; }
    if (!job.category) { toast("Please select a job category", "warn"); $("#fCategory").focus(); return false; }
    if (!job.location.trim() && job.mode !== "Remote") { toast("Please enter a location", "warn"); $("#fLocation").focus(); return false; }
    if (!$("#fDescription").innerText.trim()) { toast("Please write a job description", "warn"); return false; }
  }
  if (n === 2) {
    if (!job.skills.length) { toast("Add at least one required skill", "warn"); return false; }
    if (!job.openings || job.openings < 1) { toast("Enter number of openings", "warn"); return false; }
  }
  if (n === 3) {
    if (+job.salMin > +job.salMax) { toast("Minimum salary cannot exceed maximum", "warn"); return false; }
  }
  return true;
}

function buildReview() {
  const pub = $('input[name="publish"]:checked').value;
  const pubLabel = { now: "Publish Now", schedule: "Scheduled: " + ($("#scheduleAt").value || "not set"), draft: "Save as Draft" }[pub];
  const addons = $$(".addon input:checked").map((c) => c.value);
  $("#reviewBox").innerHTML = `
    <div class="rv-section">Job Details</div>
    <div class="rv-row"><span>Job Title</span><b>${job.title}</b></div>
    <div class="rv-row"><span>Category</span><b>${job.category}</b></div>
    <div class="rv-row"><span>Type / Mode</span><b>${job.type} • ${job.mode}</b></div>
    <div class="rv-row"><span>Location</span><b>${job.mode === "Remote" ? "Remote" : job.location}</b></div>
    <div class="rv-section">Requirements</div>
    <div class="rv-row"><span>Experience</span><b>${job.expMin === "0" ? "Fresher" : job.expMin + " - " + job.expMax + " Years"}</b></div>
    <div class="rv-row"><span>Education</span><b>${job.education}</b></div>
    <div class="rv-row"><span>Skills</span><b>${job.skills.join(", ")}</b></div>
    <div class="rv-row"><span>Openings</span><b>${job.openings}</b></div>
    <div class="rv-section">Salary &amp; Benefits</div>
    <div class="rv-row"><span>Salary</span><b>${job.hideSalary ? "Hidden from candidates" : "₹ " + job.salMin + " - " + job.salMax + " " + (job.salType === "Yearly (LPA)" ? "LPA" : job.salType)}</b></div>
    <div class="rv-row"><span>Benefits</span><b>${job.benefits.length ? job.benefits.join(", ") : "—"}</b></div>
    <div class="rv-section">Publishing</div>
    <div class="rv-row"><span>Option</span><b>${pubLabel}</b></div>
    <div class="rv-row"><span>Visibility Add-ons</span><b>${addons.length ? addons.join(", ") : "None"}</b></div>`;
}

function gotoStep(n) {
  currentStep = n;
  $$(".step").forEach((s) => {
    const sn = +s.dataset.step;
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done", sn < n);
    if (sn < n) s.querySelector(".step-dot").innerHTML = '<i class="fa-solid fa-check"></i>';
    else s.querySelector(".step-dot").textContent = sn;
  });
  $$(".form-step").forEach((b) => b.classList.toggle("show", +b.dataset.stepbody === n));
  $("#backBtn").style.visibility = n === 1 ? "hidden" : "visible";
  $("#nextBtn").innerHTML = n === 4 ? 'Publish Job <i class="fa-solid fa-paper-plane"></i>' : "Save &amp; Next";
  if (n === 4) buildReview();
  $(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#nextBtn").addEventListener("click", () => {
  if (currentStep < 4) {
    if (!validateStep(currentStep)) return;
    gotoStep(currentStep + 1);
    toast(`Step ${currentStep - 1} saved`, "success");
  } else {
    publishJob();
  }
});
$("#backBtn").addEventListener("click", () => { if (currentStep > 1) gotoStep(currentStep - 1); });
$$(".step").forEach((s) => s.addEventListener("click", () => {
  const target = +s.dataset.step;
  if (target < currentStep) gotoStep(target);
  else if (target > currentStep) toast("Complete the current step first", "info");
}));

/* ---------- PUBLISH (live via API → instantly appears on index.html) ---------- */
const CATEGORY_MAP = {
  "IT & Software": "IT Jobs", "Sales & Marketing": "Sales Jobs", "Security": "Security Jobs",
  "Logistics & Delivery": "Delivery Jobs", "Healthcare": "Healthcare",
  "Finance": "Office Staff", "Education": "Office Staff", "Human Resources": "Office Staff",
};

function monthlySalary() {
  const avg = (+job.salMin + +job.salMax) / 2;
  if (job.salType === "Yearly (LPA)") return Math.round((avg * 100000) / 12 / 100) * 100;
  if (job.salType === "Per Day") return Math.round(avg * 26);
  return Math.round(avg);
}

async function publishJob() {
  const pub = $('input[name="publish"]:checked').value;
  const addons = $$(".addon input:checked").map((c) => c.value);
  const total = $$(".addon input:checked").reduce((t, c) => t + +c.closest(".addon").dataset.price, 0);

  if (pub === "draft") {
    const drafts = JSON.parse(localStorage.getItem("JobDozo_employer_drafts") || "[]");
    drafts.unshift({ ...job, savedAt: new Date().toISOString() });
    localStorage.setItem("JobDozo_employer_drafts", JSON.stringify(drafts));
    openModal(`
      <div class="success-anim"><i class="fa-solid fa-check"></i></div>
      <h3 style="text-align:center">Job saved as draft!</h3>
      <p style="text-align:center;font-size:.85rem;color:#7c8aa5;margin-bottom:18px"><b style="color:#16243d">"${job.title}"</b> has been saved to your drafts.</p>
      <button class="btn-primary full" id="doneBtn">Done</button>`);
    $("#doneBtn").addEventListener("click", () => { closeModal(); resetForm(); });
    return;
  }

  const expLabel = job.expMin === "0" ? "Fresher" : `${job.expMin} - ${job.expMax} Years`;
  const expBucket = job.expMin === "0" ? "Fresher" : +job.expMin < 3 ? "1-3" : +job.expMin < 5 ? "3-5" : "5+";

  let created;
  try {
    created = await API.post("/api/jobs", {
      title: job.title,
      category: CATEGORY_MAP[job.category] || job.category,
      type: job.type, mode: job.mode,
      location: job.mode === "Remote" ? "Remote" : job.location,
      desc: $("#fDescription").innerText.trim(),
      overview: job.overview,
      salary: monthlySalary(),
      salaryLabel: job.hideSalary ? "Salary Hidden" : `₹ ${job.salMin} - ${job.salMax} ${job.salType === "Yearly (LPA)" ? "LPA" : job.salType}`,
      exp: expBucket, expLabel,
      skills: job.skills, benefits: job.benefits,
      openings: job.openings, addons,
    });
  } catch (e) {
    toast(e.message, "warn");
    return;
  }

  if (total > 0) {
    const cur = parseInt($("#walletAmt").textContent.replace(/[^\d]/g, "")) || 0;
    $("#walletAmt").textContent = "₹ " + Math.max(0, Math.round(cur / 100) - total).toLocaleString("en-IN") + ".00";
  }
  const remaining = $("#jobsRemaining");
  const left = Math.max(0, parseInt(remaining.textContent) - 1);
  remaining.textContent = left + " / 20";
  $("#planFill").style.width = ((20 - left) / 20) * 100 + "%";

  openModal(`
    <div class="success-anim"><i class="fa-solid fa-check"></i></div>
    <h3 style="text-align:center">Job published successfully! 🎉</h3>
    <p style="text-align:center;font-size:.85rem;color:#7c8aa5;margin-bottom:18px">
      <b style="color:#16243d">"${created.title}"</b> is now LIVE — it just appeared on the public marketplace in real-time for all job seekers.
      ${total ? `<br/><br/>₹${total} deducted from wallet for visibility add-ons.` : ""}
    </p>
    <button class="btn-primary full" id="doneBtn">Done</button>
    <button class="btn-outline full" style="margin-top:8px" onclick="window.open('index.html','_blank')">See it Live on JobDozo</button>`);
  $("#doneBtn").addEventListener("click", () => { closeModal(); resetForm(); });
}

function resetForm() {
  job.title = ""; job.category = ""; job.location = ""; job.description = ""; job.overview = "";
  $("#fJobTitle").value = ""; $("#fCategory").value = ""; $("#fLocation").value = "";
  $("#fDescription").innerHTML = ""; $("#fOverview").value = "";
  $("#titleCount").textContent = "0"; $("#descCount").textContent = "0"; $("#overviewCount").textContent = "0";
  $$(".addon input").forEach((c) => (c.checked = false));
  updateAddonTotal();
  gotoStep(1);
  updatePreview();
}

/* ---------- SAVE DRAFT ---------- */
$("#saveDraftBtn").addEventListener("click", () => {
  const drafts = JSON.parse(localStorage.getItem("JobDozo_employer_drafts") || "[]");
  drafts.unshift({ ...job, savedAt: new Date().toISOString() });
  localStorage.setItem("JobDozo_employer_drafts", JSON.stringify(drafts));
  toast(`Draft saved${job.title ? ' — "' + job.title + '"' : ""}`, "success");
});

/* ---------- PUBLISH OPTIONS ---------- */
$$('input[name="publish"]').forEach((r) => r.addEventListener("change", (e) => {
  $("#scheduleAt").style.display = e.target.value === "schedule" ? "" : "none";
}));

/* ---------- ADDONS ---------- */
function updateAddonTotal() {
  const total = $$(".addon input:checked").reduce((t, c) => t + +c.closest(".addon").dataset.price, 0);
  const box = $("#addonTotal");
  box.style.display = total ? "" : "none";
  box.innerHTML = `Add-ons total: <b>₹${total}</b>`;
}
$$(".addon input").forEach((c) => c.addEventListener("change", () => {
  updateAddonTotal();
  toast(c.checked ? `${c.value} added (+₹${c.closest(".addon").dataset.price})` : `${c.value} removed`, c.checked ? "success" : "info");
}));

/* ---------- MODAL ---------- */
function openModal(html) {
  $("#emodalBody").innerHTML = html;
  $("#emodalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("#emodalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}
$("#emodalClose").addEventListener("click", closeModal);
$("#emodalOverlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- SIDEBAR / NAV ---------- */
$("#esidebarToggle").addEventListener("click", () => {
  if (window.innerWidth <= 880) document.body.classList.toggle("sb-open-mobile");
  else document.body.classList.toggle("sb-collapsed");
});
$$(".es-item.has-sub").forEach((i) => i.addEventListener("click", () => {
  const g = i.parentElement;
  g.dataset.open = g.dataset.open === "true" ? "false" : "true";
}));
$$("[data-page]").forEach((el) => el.addEventListener("click", () => {
  $$(".es-item, .es-subitem").forEach((x) => x.classList.remove("active"));
  el.classList.add("active");
  const p = el.dataset.page;
  if (["All Jobs", "Active Jobs", "Dashboard"].includes(p)) openMyJobs();
  else if (["Applications", "Candidates", "Interview Schedule"].includes(p)) openApplicants();
  else toast(`${p} — demo focuses on Post New Job flow`, "info");
}));
$("#postJobSideBtn").addEventListener("click", () => {
  gotoStep(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- NOTIFS / DROPDOWNS ---------- */
const ENOTIFS = [
  { icon: "fa-file-lines", bg: "#3b82f6", text: "23 new applications for Software Developer", time: "10 min ago" },
  { icon: "fa-calendar-check", bg: "#8b5cf6", text: "Interview with Rahul S. today at 3 PM", time: "1 hr ago" },
  { icon: "fa-circle-check", bg: "#16a34a", text: "Your job 'UI Designer' was approved", time: "2 hrs ago" },
  { icon: "fa-star", bg: "#f59e0b", text: "New 4.8★ review on your company page", time: "Yesterday" },
];
$("#eNotifList").innerHTML = ENOTIFS.map((n) => `
  <div class="en-item">
    <span class="en-ico" style="background:${n.bg}"><i class="fa-solid ${n.icon}"></i></span>
    <div><p>${n.text}</p><small>${n.time}</small></div>
  </div>`).join("");

[["#eNotifBtn", "#eNotifDropdown"], ["#eProfileBtn", "#eProfileDropdown"]].forEach(([b, d]) => {
  $(b).addEventListener("click", (e) => {
    if (e.target.closest(".ed-item")) return;
    e.stopPropagation();
    const dd = $(d);
    const was = dd.classList.contains("open");
    $$(".edropdown").forEach((x) => x.classList.remove("open"));
    if (!was) dd.classList.add("open");
  });
});
document.addEventListener("click", () => $$(".edropdown").forEach((x) => x.classList.remove("open")));

/* ---------- MISC BUTTONS ---------- */
$("#walletBtn").addEventListener("click", () => openModal(`
  <h3><i class="fa-solid fa-wallet" style="color:#1a6cf5"></i> Wallet</h3>
  <div class="rv-row"><span>Available Balance</span><b>${$("#walletAmt").textContent}</b></div>
  <div class="rv-row"><span>Last Recharge</span><b>₹5,000 on 12 Jun 2024</b></div>
  <div class="rv-row"><span>Spent This Month</span><b>₹2,550</b></div>
  <button class="btn-primary full" style="margin-top:16px" onclick="this.textContent='Redirecting to payment...'">Add Money</button>`));

$("#eMsgBtn").addEventListener("click", async () => {
  try {
    const convs = await API.get("/api/messages/conversations");
    openModal(`
      <h3><i class="fa-regular fa-comment-dots" style="color:#3b82f6"></i> Messages (${convs.length})</h3>
      <div style="max-height:360px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-top:8px">
        ${convs.length ? convs.map((c) => `
          <button type="button" class="btn-outline" style="text-align:left;padding:10px 12px;display:block;width:100%" data-openmsg="${c.id}">
            <b style="display:block;font-size:.85rem;color:#16243d">${c.other?.name || "Candidate"}</b>
            <small style="color:#7c8aa5">${c.job?.title || ""} • ${c.lastMessage || ""}</small>
          </button>`).join("") : '<p style="color:#7c8aa5;font-size:.85rem">No conversations yet — message candidates from the Applicants panel.</p>'}
      </div>`);
    $$("[data-openmsg]").forEach((btn) => btn.addEventListener("click", async () => {
      const data = await API.get("/api/messages/conversations/" + btn.dataset.openmsg);
      const c = data.conversation;
      openModal(`
        <h3>${c.other?.name}</h3>
        <div style="max-height:300px;overflow:auto;margin:12px 0;display:flex;flex-direction:column;gap:8px">
          ${data.messages.map((m) => {
            const mine = m.senderId === API.user.id;
            return `<div style="align-self:${mine ? "flex-end" : "flex-start"};max-width:85%;padding:9px 12px;border-radius:12px;background:${mine ? "#1a6cf5" : "#f1f5fb"};color:${mine ? "#fff" : "#16243d"};font-size:.82rem">${m.text}</div>`;
          }).join("")}
        </div>
        <form id="empQuickReply"><input id="empQuickText" placeholder="Reply..." style="width:100%;border:1.5px solid #e6ebf4;border-radius:10px;padding:10px;font-family:inherit" required />
        <button type="submit" class="btn-primary full" style="margin-top:8px">Send Reply</button></form>`);
      $("#empQuickReply").addEventListener("submit", async (e) => {
        e.preventDefault();
        await API.post("/api/messages", { conversationId: c.id, text: $("#empQuickText").value.trim() });
        toast("Reply sent", "success");
        closeModal();
      });
    }));
  } catch (e) { toast(e.message, "warn"); }
});

/* ---------- MY JOBS (live from API) ---------- */
const STATUSES = ["Applied", "Viewed", "Shortlisted", "Interview", "Selected", "Rejected"];
const moneyIN = (n) => "₹" + Number(n).toLocaleString("en-IN");

async function openMyJobs() {
  let jobs;
  try { jobs = await API.get("/api/jobs/mine"); } catch (e) { toast(e.message, "warn"); return; }
  openModal(`
    <h3><i class="fa-solid fa-briefcase" style="color:#1a6cf5"></i> My Posted Jobs (${jobs.length})</h3>
    <div style="max-height:420px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-top:8px">
      ${jobs.length ? jobs.map((j) => `
        <div style="display:flex;align-items:center;gap:10px;border:1px solid #e6ebf4;border-radius:11px;padding:10px 12px">
          <div style="flex:1;min-width:0">
            <b style="font-size:.86rem;color:#16243d;display:block">${j.title}</b>
            <small style="color:#7c8aa5">${moneyIN(j.salary)}/mo • ${j.location} • ${j.views || 0} views •
              <b style="color:${j.status === "active" ? "#16a34a" : "#ef4444"}">${j.status.toUpperCase()}</b></small>
          </div>
          <button class="btn-outline" style="padding:7px 10px;font-size:.74rem" data-applicants="${j.id}" data-title="${j.title}">
            <i class="fa-regular fa-file-lines"></i> ${j.applicants} Applicant${j.applicants === 1 ? "" : "s"}
          </button>
          <button class="btn-outline" style="padding:7px 10px;font-size:.74rem;color:#ef4444;border-color:#fecaca" data-deljob="${j.id}" data-title="${j.title}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>`).join("") : '<p style="color:#7c8aa5;font-size:.85rem">No jobs posted yet — publish your first job!</p>'}
    </div>`);
}

async function openApplicants(jobId, jobTitle) {
  let apps;
  try {
    apps = await API.get("/api/applications/received" + (jobId ? "?jobId=" + jobId : ""));
  } catch (e) { toast(e.message, "warn"); return; }
  openModal(`
    <h3><i class="fa-solid fa-user-group" style="color:#1a6cf5"></i> Applicants ${jobTitle ? "— " + jobTitle : "(All Jobs)"} <small style="color:#7c8aa5">(${apps.length})</small></h3>
    <div style="max-height:430px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-top:8px">
      ${apps.length ? apps.map((a) => `
        <div style="display:flex;align-items:center;gap:10px;border:1px solid #e6ebf4;border-radius:11px;padding:10px 12px">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#2f7bff,#1a6cf5);color:#fff;display:grid;place-items:center;font-weight:800;font-size:.8rem;flex-shrink:0">${a.name[0]}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:.85rem;color:#16243d;display:block">${a.name} <small style="font-weight:600;color:#7c8aa5">• AI Score ${70 + (a.name.length * 7) % 28}%</small></b>
            <small style="color:#7c8aa5">${a.job ? a.job.title : ""} • ${a.experience} • ${a.email}</small>
          </div>
          <select data-appstatus="${a.id}" style="border:1.5px solid #e6ebf4;border-radius:8px;padding:6px 8px;font-size:.74rem;font-weight:700;font-family:inherit;color:#16243d">
            ${STATUSES.map((s) => `<option ${a.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <button class="btn-outline" style="padding:7px 10px;font-size:.74rem${a.interview ? ";color:#8b5cf6;border-color:#ddd6fe" : ""}"
            data-schedule="${a.id}" title="${a.interview ? `Interview: ${a.interview.date} ${a.interview.time} (${a.interview.mode})` : "Schedule interview"}">
            <i class="fa-regular fa-calendar-${a.interview ? "check" : "plus"}"></i>
          </button>
          <button class="btn-outline" style="padding:7px 10px;font-size:.74rem;color:#3b82f6;border-color:#bfdbfe" data-message="${a.id}" title="Message candidate">
            <i class="fa-regular fa-comment-dots"></i>
          </button>
          <button class="btn-outline" style="padding:7px 10px;font-size:.74rem;color:#16a34a;border-color:#bbf7d0" data-resume="${a.id}" title="View resume">
            <i class="fa-regular fa-id-card"></i>
          </button>
        </div>`).join("") : '<p style="color:#7c8aa5;font-size:.85rem">No applications yet. They appear here in real-time when seekers apply.</p>'}
    </div>`);
}

function openScheduleModal(appId) {
  API.get("/api/applications/received").then((apps) => {
    const a = apps.find((x) => x.id === appId);
    if (!a) return;
    const iv = a.interview || {};
    const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    openModal(`
      <h3><i class="fa-regular fa-calendar-check" style="color:#8b5cf6"></i> ${a.interview ? "Reschedule" : "Schedule"} Interview</h3>
      <p style="font-size:.82rem;color:#7c8aa5;margin-bottom:14px"><b style="color:#16243d">${a.name}</b> — ${a.job ? a.job.title : ""}</p>
      <form class="form" id="schedForm" style="display:flex;flex-direction:column;gap:11px">
        <label style="font-size:.76rem;font-weight:700;color:#16243d">Date
          <input type="date" id="ivDate" value="${iv.date || tomorrow}" required style="width:100%;border:1.5px solid #e6ebf4;border-radius:9px;padding:9px 12px;font-family:inherit;margin-top:4px" /></label>
        <label style="font-size:.76rem;font-weight:700;color:#16243d">Time
          <input type="time" id="ivTime" value="${iv.time || "11:00"}" required style="width:100%;border:1.5px solid #e6ebf4;border-radius:9px;padding:9px 12px;font-family:inherit;margin-top:4px" /></label>
        <label style="font-size:.76rem;font-weight:700;color:#16243d">Mode
          <select id="ivMode" style="width:100%;border:1.5px solid #e6ebf4;border-radius:9px;padding:9px 12px;font-family:inherit;margin-top:4px">
            ${["Video Call", "Phone Call", "On-site"].map((m) => `<option ${iv.mode === m ? "selected" : ""}>${m}</option>`).join("")}
          </select></label>
        <label style="font-size:.76rem;font-weight:700;color:#16243d">Meeting link / Location <small style="font-weight:500;color:#7c8aa5">(optional)</small>
          <input type="text" id="ivLink" value="${iv.link || ""}" placeholder="https://meet... or office address" style="width:100%;border:1.5px solid #e6ebf4;border-radius:9px;padding:9px 12px;font-family:inherit;margin-top:4px" /></label>
        <button class="btn-primary full" type="submit">Confirm — Notify Candidate Instantly</button>
      </form>`);
    $("#schedForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const upd = await API.patch(`/api/applications/${appId}/interview`, {
          date: $("#ivDate").value, time: $("#ivTime").value,
          mode: $("#ivMode").value, link: $("#ivLink").value.trim(),
        });
        toast(`Interview set: ${upd.interview.date} at ${upd.interview.time} — candidate notified live`, "success");
        openApplicants();
      } catch (ex) { toast(ex.message, "warn"); }
    });
  }).catch((ex) => toast(ex.message, "warn"));
}

const empTimeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m <= 1 ? "just now" : m + " min ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + " hr ago";
  return Math.round(h / 24) + " days ago";
};

function openMessageModal(appId) {
  API.get("/api/applications/received").then(async (apps) => {
    const a = apps.find((x) => x.id === appId);
    if (!a || !a.job) return;
    const convs = await API.get("/api/messages/conversations");
    let conv = convs.find((c) => c.applicationId === a.id || (c.seekerId === a.seekerId && c.jobId === a.jobId));
    let thread = [];
    if (conv) {
      const data = await API.get("/api/messages/conversations/" + conv.id);
      conv = data.conversation;
      thread = data.messages;
    }
    openModal(`
      <h3><i class="fa-regular fa-comment-dots" style="color:#3b82f6"></i> Message ${a.name}</h3>
      <p style="font-size:.82rem;color:#7c8aa5;margin-bottom:12px">${a.job.title} • ${a.email}</p>
      <div id="empChatThread" style="max-height:280px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;padding:4px">
        ${thread.length ? thread.map((m) => {
          const mine = m.senderId === API.user.id;
          return `<div style="align-self:${mine ? "flex-end" : "flex-start"};max-width:85%;padding:9px 12px;border-radius:12px;font-size:.82rem;background:${mine ? "#1a6cf5" : "#f1f5fb"};color:${mine ? "#fff" : "#16243d"}">${m.text}<small style="display:block;font-size:.58rem;opacity:.7;margin-top:4px">${empTimeAgo(m.createdAt)}</small></div>`;
        }).join("") : '<p style="text-align:center;color:#7c8aa5;font-size:.8rem;padding:16px">Start the conversation with this candidate</p>'}
      </div>
      <form id="empChatForm" style="display:flex;gap:8px">
        <input type="text" id="empChatInput" placeholder="Write a message..." required maxlength="2000" style="flex:1;border:1.5px solid #e6ebf4;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:.84rem" />
        <button type="submit" class="btn-primary" style="padding:10px 16px"><i class="fa-solid fa-paper-plane"></i></button>
      </form>`);
    const threadEl = $("#empChatThread");
    if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
    $("#empChatForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = $("#empChatInput").value.trim();
      if (!text) return;
      try {
        const body = conv
          ? { conversationId: conv.id, text }
          : { text, seekerId: a.seekerId, employerId: API.user.id, jobId: a.jobId, applicationId: a.id };
        const resp = await API.post("/api/messages", body);
        conv = resp.conversation;
        threadEl.insertAdjacentHTML("beforeend", `<div style="align-self:flex-end;max-width:85%;padding:9px 12px;border-radius:12px;font-size:.82rem;background:#1a6cf5;color:#fff">${text}<small style="display:block;font-size:.58rem;opacity:.7;margin-top:4px">just now</small></div>`);
        threadEl.scrollTop = threadEl.scrollHeight;
        $("#empChatInput").value = "";
        toast("Message sent — candidate notified live", "success");
      } catch (ex) { toast(ex.message, "warn"); }
    });
  }).catch((ex) => toast(ex.message, "warn"));
}

function openResumeModal(appId) {
  Promise.all([
    API.get("/api/applications/" + appId + "/resume"),
    API.get("/api/applications/received").then((apps) => {
      const a = apps.find((x) => x.id === appId);
      return a ? API.get("/api/seekers/" + a.seekerId + "/skill-scores") : { scores: [] };
    }),
  ]).then(([data, skillData]) => {
    const { seeker, application, resume: r } = data;
    const skills = (r.skills || []).map((s) =>
      `<span style="background:#eef5ff;color:#1a6cf5;font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:999px">${s}</span>`
    ).join("");
    openModal(`
      <h3><i class="fa-regular fa-id-card" style="color:#16a34a"></i> ${seeker.name}'s Resume</h3>
      <p style="font-size:.82rem;color:#7c8aa5;margin-bottom:14px">${application.experience || "—"} • ${seeker.email}${seeker.location ? " • " + seeker.location : ""}</p>
      <div style="border:1px solid #e6ebf4;border-radius:12px;padding:16px;max-height:380px;overflow:auto">
        ${r.headline ? `<p style="font-size:.84rem;font-weight:700;color:#1a6cf5;margin-bottom:10px">${r.headline}</p>` : ""}
        ${r.summary ? `<p style="font-size:.8rem;line-height:1.55;color:#2b3a55;margin-bottom:12px">${r.summary}</p>` : ""}
        ${r.skills?.length ? `<div style="margin-bottom:12px"><b style="font-size:.68rem;color:#7c8aa5;text-transform:uppercase;display:block;margin-bottom:6px">Skills</b><div style="display:flex;flex-wrap:wrap;gap:6px">${skills}</div></div>` : ""}
        ${r.experience?.length ? `<div style="margin-bottom:12px"><b style="font-size:.68rem;color:#7c8aa5;text-transform:uppercase;display:block;margin-bottom:6px">Experience</b>${r.experience.map((e) => `
          <div style="margin-bottom:8px">
            <strong style="font-size:.82rem;color:#16243d">${e.title}</strong>${e.company ? ` — ${e.company}` : ""}
            <small style="display:block;font-size:.68rem;color:#7c8aa5">${e.from || ""}${e.to ? " – " + e.to : ""}</small>
            ${e.description ? `<p style="font-size:.76rem;color:#5d6f8d;margin-top:3px">${e.description}</p>` : ""}
          </div>`).join("")}</div>` : ""}
        ${r.education?.length ? `<div style="margin-bottom:12px"><b style="font-size:.68rem;color:#7c8aa5;text-transform:uppercase;display:block;margin-bottom:6px">Education</b>${r.education.map((e) => `
          <div style="margin-bottom:6px"><strong style="font-size:.82rem;color:#16243d">${e.degree}</strong><small style="display:block;font-size:.68rem;color:#7c8aa5">${e.school}${e.year ? " • " + e.year : ""}</small></div>`).join("")}</div>` : ""}
        ${r.file ? `<p style="font-size:.76rem;color:#7c8aa5;border-top:1px dashed #e6ebf4;padding-top:10px;margin-top:6px"><i class="fa-regular fa-file-pdf" style="color:#ef4444"></i> ${r.file.name}</p>` : ""}
        ${!r.headline && !r.summary && !r.skills?.length && !r.experience?.length ? '<p style="color:#7c8aa5;font-size:.82rem">This candidate has not completed their resume yet.</p>' : ""}
      </div>
      ${skillData.scores?.length ? `<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #e6ebf4">
        <b style="font-size:.68rem;color:#7c8aa5;text-transform:uppercase;display:block;margin-bottom:8px"><i class="fa-solid fa-robot" style="color:#8b5cf6"></i> AI Skill Tests</b>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${skillData.scores.map((s) => `
          <span style="font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:999px;background:${s.certified ? "#ecfdf5" : "#fff7ed"};color:${s.certified ? "#16a34a" : "#ea580c"}">
            ${s.testTitle}: ${s.score}%${s.certified ? " ✓" : ""}
          </span>`).join("")}</div>
      </div>` : ""}
      <p style="font-size:.72rem;color:#7c8aa5;margin-top:10px">Resume completeness: <b style="color:#16243d">${r.score || 0}%</b></p>`);
  }).catch((ex) => toast(ex.message, "warn"));
}

$("#emodalBody").addEventListener("click", (e) => {
  const ab = e.target.closest("[data-applicants]");
  if (ab) { openApplicants(ab.dataset.applicants, ab.dataset.title); return; }
  const sb = e.target.closest("[data-schedule]");
  if (sb) { openScheduleModal(sb.dataset.schedule); return; }
  const mb = e.target.closest("[data-message]");
  if (mb) { openMessageModal(mb.dataset.message); return; }
  const rb = e.target.closest("[data-resume]");
  if (rb) { openResumeModal(rb.dataset.resume); return; }
  const db = e.target.closest("[data-deljob]");
  if (db) {
    const t = db.dataset.title;
    openModal(`
      <h3 style="color:#ef4444"><i class="fa-solid fa-triangle-exclamation"></i> Delete Job?</h3>
      <p style="font-size:.86rem;color:#7c8aa5;margin-bottom:18px">Delete <b style="color:#16243d">"${t}"</b>? It will be removed from the live marketplace instantly.</p>
      <button class="btn-primary full" id="confirmDelJob" style="background:#ef4444">Yes, Delete Job</button>`);
    $("#confirmDelJob").addEventListener("click", async () => {
      try {
        await API.del("/api/jobs/" + db.dataset.deljob);
        toast(`"${t}" deleted — removed from live site`, "warn");
        openMyJobs();
      } catch (ex) { toast(ex.message, "warn"); }
    });
  }
});
$("#emodalBody").addEventListener("change", async (e) => {
  const sel = e.target.closest("[data-appstatus]");
  if (!sel) return;
  try {
    const a = await API.patch(`/api/applications/${sel.dataset.appstatus}/status`, { status: sel.value });
    toast(`${a.name || "Candidate"} → ${sel.value} (seeker notified in real-time)`, "success");
  } catch (ex) { toast(ex.message, "warn"); }
});

/* real-time: new applications arrive instantly */
socket.on("application:created", (a) => {
  toast(`📥 New application: ${a.name} → ${a.job ? a.job.title : "your job"}`, "info");
  const badge = $('.es-item[data-page="Applications"] .es-badge');
  if (badge) badge.textContent = (parseInt(badge.textContent) || 0) + 1;
});
socket.on("application:withdrawn", (a) => toast(`${a.name} withdrew their application`, "info"));

$("#viewMyJobsBtn").addEventListener("click", openMyJobs);
const logoutLink = $("#employerLogout");
if (logoutLink) logoutLink.addEventListener("click", () => API.logout());

/* live counts for sidebar badge */
if (API.isRole("employer")) {
  API.get("/api/applications/received").then((apps) => {
    const badge = $('.es-item[data-page="Applications"] .es-badge');
    if (badge) badge.textContent = apps.length;
  }).catch(() => {});
}
$("#pvViewBtn").addEventListener("click", () => toast("This is a live preview of your job card", "info"));
$("#boostBtn").addEventListener("click", () => $(".vis-panel").scrollIntoView({ behavior: "smooth", block: "center" }));
$("#planDetails").addEventListener("click", () => openModal(`
  <h3><i class="fa-solid fa-crown" style="color:#f59e0b"></i> Professional Plan</h3>
  <div class="rv-row"><span>Job Postings</span><b>20 / month</b></div>
  <div class="rv-row"><span>Featured Jobs</span><b>5 included</b></div>
  <div class="rv-row"><span>Candidate Database</span><b>Unlimited access</b></div>
  <div class="rv-row"><span>AI Matching</span><b>Included</b></div>
  <div class="rv-row"><span>Support</span><b>Priority 24/7</b></div>
  <div class="rv-row"><span>Renewal</span><b>20 Aug 2024</b></div>`));
$("#upgradePlanBtn").addEventListener("click", () => openModal(`
  <h3>Upgrade Your Plan</h3>
  <div class="rv-row"><span>Enterprise Plan</span><b>₹9,999 / month</b></div>
  <div class="rv-row"><span>Job Postings</span><b>Unlimited</b></div>
  <div class="rv-row"><span>Featured Jobs</span><b>20 included</b></div>
  <div class="rv-row"><span>Dedicated Manager</span><b>Yes</b></div>
  <button class="btn-primary full" style="margin-top:16px">Upgrade to Enterprise</button>`));
$("#contactSupportBtn").addEventListener("click", () => openModal(`
  <h3>Contact Support</h3>
  <div class="rv-row"><span><i class="fa-solid fa-phone"></i> Phone</span><b>1800-123-4567</b></div>
  <div class="rv-row"><span><i class="fa-regular fa-envelope"></i> Email</span><b>support@JobDozo.in</b></div>
  <div class="rv-row"><span><i class="fa-regular fa-comment-dots"></i> Live Chat</span><b>Available 9 AM – 9 PM</b></div>`));

/* ---------- INIT ---------- */
updatePreview();
