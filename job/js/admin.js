/* ============ JobDozo Admin Panel (API + real-time) ============ */
"use strict";

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ---------- TOAST ---------- */
function toast(msg, type = "success") { jmToast(msg, type); }

/* ---------- AUTH GATE ---------- */
requireRole();

/* ---------- DATA ---------- */
let TABLE_JOBS = [];
let STATS = null;
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const timeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m <= 1 ? "just now" : m + " mins ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + " hrs ago";
  return Math.round(h / 24) + " days ago";
};

const CAT_DATA = [
  { name: "IT & Software", pct: 25, count: "2,186", color: "#3b82f6" },
  { name: "Sales & Marketing", pct: 20, count: "1,749", color: "#22c55e" },
  { name: "Education", pct: 15, count: "1,312", color: "#f59e0b" },
  { name: "Healthcare", pct: 12, count: "1,050", color: "#8b5cf6" },
  { name: "Finance", pct: 8, count: "700", color: "#ef4444" },
  { name: "Others", pct: 20, count: "1,748", color: "#94a3b8" },
];

/* ---------- RENDER: STATS ---------- */
function renderStats(s) {
  STATS = s;
  const cards = [
    { label: "Total Users", value: s.totalUsers.toLocaleString("en-IN"), delta: "+18.5%", icon: "fa-users", bg: "linear-gradient(135deg,#3b82f6,#2563eb)" },
    { label: "Employers", value: s.employers.toLocaleString("en-IN"), delta: "+15.2%", icon: "fa-building-user", bg: "linear-gradient(135deg,#22c55e,#16a34a)" },
    { label: "Job Seekers", value: s.seekers.toLocaleString("en-IN"), delta: "+19.1%", icon: "fa-user-tie", bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
    { label: "Active Jobs", value: s.activeJobs.toLocaleString("en-IN"), delta: "+12.4%", icon: "fa-briefcase", bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
    { label: "Applications", value: s.applications.toLocaleString("en-IN"), delta: "+22.7%", icon: "fa-file-lines", bg: "linear-gradient(135deg,#06b6d4,#0891b2)" },
    { label: "Revenue", value: "₹" + s.revenue.toLocaleString("en-IN"), delta: "+16.3%", icon: "fa-indian-rupee-sign", bg: "linear-gradient(135deg,#10b981,#059669)" },
  ];
  $("#statsRow").innerHTML = cards.map((c, i) => `
    <div class="stat-card" style="animation-delay:${i * 0.05}s">
      <span class="st-ico" style="background:${c.bg}"><i class="fa-solid ${c.icon}"></i></span>
      <div>
        <h4>${c.label}</h4>
        <strong>${c.value}</strong>
        <div class="st-delta"><i class="fa-solid fa-arrow-trend-up"></i> ${c.delta} <span>live data</span></div>
      </div>
    </div>`).join("");
  $(".donut-center strong").textContent = s.totalJobs.toLocaleString("en-IN");
}

/* ---------- RENDER: ACTIVITIES ---------- */
function renderActivities(list) {
  $("#activityList").innerHTML = list.slice(0, 6).map((a) => `
    <div class="act-item">
      <span class="act-ico" style="background:${a.bg}"><i class="fa-solid ${a.icon}"></i></span>
      <div><p>${a.title}</p><small>${a.sub}</small></div>
      <span class="act-time">${timeAgo(a.createdAt)}</span>
    </div>`).join("");
}

/* ---------- RENDER: NOTIFICATIONS ---------- */
async function renderNotifs() {
  try {
    const list = await API.get("/api/notifications");
    $("#adminNotifList").innerHTML = list.length ? list.slice(0, 10).map((n) => `
      <div class="an-item ${n.read ? "" : "unread"}">
        <span class="an-ico" style="background:${n.bg}"><i class="fa-solid ${n.icon}"></i></span>
        <div><p>${n.text}</p><small>${timeAgo(n.createdAt)}</small></div>
      </div>`).join("") : '<div style="padding:16px;text-align:center;color:#7c8aa5;font-size:.8rem">No notifications</div>';
    const unread = list.filter((n) => !n.read).length;
    $("#adminNotifBadge").textContent = unread;
    $("#adminNotifBadge").style.display = unread ? "" : "none";
  } catch { /* offline */ }
}

/* ---------- RENDER: CATEGORY LEGEND ---------- */
$("#catLegend").innerHTML = CAT_DATA.map((c) => `
  <div class="dl-row"><i style="background:${c.color}"></i> ${c.name} <b>${c.pct}% <small>(${c.count})</small></b></div>`).join("");

/* ---------- RENDER: JOBS TABLE ---------- */
function renderTable(list = TABLE_JOBS) {
  $("#jobsTbody").innerHTML = list.length ? list.map((j) => `
    <tr data-id="${j.id}">
      <td class="jt-title">${j.title}</td>
      <td>${j.company}</td>
      <td>${j.category}</td>
      <td>${j.location}</td>
      <td>${fmtDate(j.postedAt || j.createdAt)}</td>
      <td><span class="status-pill ${j.status === "active" ? "active" : j.status === "pending" ? "pending" : "expired"}">${cap(j.status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="ra-btn" data-act="view" title="View"><i class="fa-regular fa-eye"></i></button>
          <button class="ra-btn" data-act="edit" title="Edit / Moderate"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="ra-btn del" data-act="delete" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </td>
    </tr>`).join("")
    : `<tr><td colspan="7" style="text-align:center;color:#7c8aa5;padding:26px">No matching jobs found</td></tr>`;
}

/* ---------- LOAD ALL ---------- */
async function loadAll() {
  if (!API.isRole("admin")) return;
  try {
    const [stats, jobs, activity] = await Promise.all([
      API.get("/api/admin/stats"),
      API.get("/api/admin/jobs"),
      API.get("/api/admin/activity"),
    ]);
    renderStats(stats);
    TABLE_JOBS = jobs;
    renderTable();
    renderActivities(activity);
    renderNotifs();
  } catch (e) { toast(e.message, "warn"); }
}
loadAll();

/* ---------- REAL-TIME ---------- */
socket.on("stats:update", (s) => renderStats(s));
socket.on("activity:new", (a) => {
  API.get("/api/admin/activity").then(renderActivities).catch(() => {});
  toast(`⚡ ${a.title}: ${a.sub}`, "info");
});
socket.on("job:created", (j) => {
  TABLE_JOBS.unshift(j);
  renderTable();
});
socket.on("job:updated", (j) => {
  const i = TABLE_JOBS.findIndex((x) => x.id === j.id);
  if (i >= 0) TABLE_JOBS[i] = j;
  renderTable();
});
socket.on("job:removed", ({ id }) => {
  TABLE_JOBS = TABLE_JOBS.filter((x) => x.id !== id);
  renderTable();
});
socket.on("notification:new", () => renderNotifs());

/* ---------- CHARTS ---------- */
Chart.defaults.font.family = "Inter, sans-serif";
Chart.defaults.color = "#7c8aa5";

function genSeries(days) {
  const labels = [], data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }));
    const base = 1100 + Math.sin(i / 2.6) * 380 + Math.cos(i / 1.4) * 220;
    data.push(Math.round(base + (i % 5) * 70));
  }
  return { labels, data };
}

const lineCtx = $("#appsChart").getContext("2d");
const grad = lineCtx.createLinearGradient(0, 0, 0, 260);
grad.addColorStop(0, "rgba(26,108,245,.22)");
grad.addColorStop(1, "rgba(26,108,245,0)");

let series = genSeries(30);
const appsChart = new Chart(lineCtx, {
  type: "line",
  data: {
    labels: series.labels,
    datasets: [{
      label: "Applications", data: series.data,
      borderColor: "#1a6cf5", backgroundColor: grad, fill: true,
      tension: 0.42, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5,
      pointHoverBackgroundColor: "#1a6cf5", pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#16243d", padding: 11, cornerRadius: 9, displayColors: false,
        titleFont: { weight: "700" },
        callbacks: { label: (c) => "Applications: " + c.parsed.y.toLocaleString() },
      },
    },
    scales: {
      y: { beginAtZero: true, border: { display: false }, grid: { color: "#eef2f9" },
        ticks: { maxTicksLimit: 6, callback: (v) => (v >= 1000 ? v / 1000 + "K" : v) } },
      x: { border: { display: false }, grid: { display: false }, ticks: { maxTicksLimit: 8 } },
    },
  },
});

$("#chartRange").addEventListener("change", (e) => {
  series = genSeries(+e.target.value);
  appsChart.data.labels = series.labels;
  appsChart.data.datasets[0].data = series.data;
  appsChart.update();
  toast(`Chart updated — last ${e.target.value} days`, "info");
});

function donut(id, labels, data, colors, cutout = "72%") {
  return new Chart($(id), {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#16243d", padding: 9, cornerRadius: 8, displayColors: false,
          callbacks: { label: (c) => `${c.label}: ${c.parsed}%` },
        },
      },
    },
  });
}

donut("#catChart", CAT_DATA.map((c) => c.name), CAT_DATA.map((c) => c.pct), CAT_DATA.map((c) => c.color));
donut("#roleChart", ["Job Seekers", "Employers"], [81, 19], ["#3b82f6", "#22c55e"], "68%");
donut("#statusChart", ["Active", "Pending", "Expired"], [71, 14, 15], ["#22c55e", "#f59e0b", "#ef4444"], "68%");
donut("#appStatusChart", ["Applied", "Shortlisted", "Rejected", "Selected"], [66, 18, 9, 7], ["#3b82f6", "#8b5cf6", "#ef4444", "#22c55e"], "68%");

const revCtx = $("#revChart").getContext("2d");
const revGrad = revCtx.createLinearGradient(0, 0, 0, 70);
revGrad.addColorStop(0, "rgba(26,108,245,.28)");
revGrad.addColorStop(1, "rgba(26,108,245,0)");
new Chart(revCtx, {
  type: "line",
  data: {
    labels: Array.from({ length: 20 }, (_, i) => i + 1),
    datasets: [{
      data: [42, 45, 43, 48, 52, 49, 55, 58, 54, 60, 63, 59, 66, 70, 67, 74, 78, 75, 82, 88],
      borderColor: "#1a6cf5", backgroundColor: revGrad, fill: true,
      tension: 0.45, borderWidth: 2, pointRadius: 0,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  },
});

/* ---------- MODAL ---------- */
function openModal(html) {
  $("#amodalBody").innerHTML = html;
  $("#amodalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("#amodalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}
$("#amodalClose").addEventListener("click", closeModal);
$("#amodalOverlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- TABLE ACTIONS (live moderation) ---------- */
$("#jobsTbody").addEventListener("click", (e) => {
  const btn = e.target.closest(".ra-btn");
  if (!btn) return;
  const tr = e.target.closest("tr");
  const job = TABLE_JOBS.find((j) => j.id === tr.dataset.id);
  if (!job) return;
  const act = btn.dataset.act;

  if (act === "view") {
    openModal(`
      <h3><i class="fa-solid fa-briefcase" style="color:#1a6cf5"></i> ${job.title}</h3>
      <div class="jd-row"><span>Employer</span><b>${job.company}</b></div>
      <div class="jd-row"><span>Category</span><b>${job.category}</b></div>
      <div class="jd-row"><span>Location</span><b>${job.location}</b></div>
      <div class="jd-row"><span>Salary</span><b>₹${Number(job.salary).toLocaleString("en-IN")} / Month</b></div>
      <div class="jd-row"><span>Posted On</span><b>${fmtDate(job.postedAt || job.createdAt)}</b></div>
      <div class="jd-row"><span>Status</span><b><span class="status-pill ${job.status === "active" ? "active" : "expired"}">${cap(job.status)}</span></b></div>
      <div class="jd-row"><span>Applications</span><b>${job.applicants || 0}</b></div>
      <div class="jd-row"><span>Views</span><b>${job.views || 0}</b></div>
    `);
  } else if (act === "edit") {
    openModal(`
      <h3>Moderate Job — ${job.title}</h3>
      <form class="form" id="editJobForm">
        <label>Job Title<input type="text" id="ejTitle" value="${job.title}" required /></label>
        <label>Category<input type="text" id="ejCategory" value="${job.category}" required /></label>
        <label>Location<input type="text" id="ejLocation" value="${job.location}" required /></label>
        <label>Status (approve / suspend)
          <select id="ejStatus">
            <option value="active" ${job.status === "active" ? "selected" : ""}>Active (Approved)</option>
            <option value="pending" ${job.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="suspended" ${job.status === "suspended" ? "selected" : ""}>Suspended</option>
            <option value="expired" ${job.status === "expired" ? "selected" : ""}>Expired</option>
          </select>
        </label>
        <button class="btn-primary" type="submit">Save Changes</button>
      </form>`);
    $("#editJobForm").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const updated = await API.patch("/api/jobs/" + job.id, {
          title: $("#ejTitle").value, category: $("#ejCategory").value,
          location: $("#ejLocation").value, status: $("#ejStatus").value,
        });
        Object.assign(job, updated);
        renderTable(); closeModal();
        toast(`"${job.title}" updated — synced live across the platform`, "success");
      } catch (ex) { toast(ex.message, "warn"); }
    });
  } else if (act === "delete") {
    openModal(`
      <h3 style="color:#ef4444"><i class="fa-solid fa-triangle-exclamation"></i> Delete Job?</h3>
      <p style="font-size:.86rem;color:#7c8aa5;margin-bottom:18px">
        Are you sure you want to delete <b style="color:#16243d">"${job.title}"</b> by ${job.company}? It will disappear from the live site instantly.
      </p>
      <button class="btn-primary" id="confirmDel" style="background:#ef4444">Yes, Delete Job</button>`);
    $("#confirmDel").addEventListener("click", async () => {
      try {
        await API.del("/api/jobs/" + job.id);
        TABLE_JOBS = TABLE_JOBS.filter((j) => j.id !== job.id);
        renderTable(); closeModal();
        toast(`"${job.title}" deleted`, "warn");
      } catch (ex) { toast(ex.message, "warn"); }
    });
  }
});

/* ---------- SEARCH ---------- */
$("#adminSearch").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  renderTable(q ? TABLE_JOBS.filter((j) =>
    (j.title + j.company + j.category + j.location + j.status).toLowerCase().includes(q)) : TABLE_JOBS);
});

/* ---------- USERS ---------- */
async function openUsers(roleFilter) {
  let users;
  try { users = await API.get("/api/admin/users"); } catch (e) { toast(e.message, "warn"); return; }
  if (roleFilter) users = users.filter((u) => u.role === roleFilter);
  const roleBadge = { admin: "#ef4444", employer: "#16a34a", seeker: "#3b82f6" };
  openModal(`
    <h3><i class="fa-solid fa-users" style="color:#1a6cf5"></i> ${roleFilter ? cap(roleFilter) + "s" : "All Users"} (${users.length})</h3>
    <div style="max-height:420px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-top:8px">
      ${users.map((u) => `
        <div style="display:flex;align-items:center;gap:10px;border:1px solid #e6ebf4;border-radius:11px;padding:10px 12px">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#2f7bff,#1a6cf5);color:#fff;display:grid;place-items:center;font-weight:800;font-size:.8rem">${u.name[0]}</div>
          <div style="flex:1"><b style="font-size:.85rem;color:#16243d;display:block">${u.name} ${u.company ? `<small style="color:#7c8aa5">(${u.company})</small>` : ""}</b>
            <small style="color:#7c8aa5">${u.email}</small></div>
          <span style="background:${roleBadge[u.role]}18;color:${roleBadge[u.role]};font-size:.68rem;font-weight:800;padding:4px 10px;border-radius:99px;text-transform:uppercase">${u.role}</span>
        </div>`).join("")}
    </div>`);
}

/* ---------- SIDEBAR ---------- */
$("#sidebarToggle").addEventListener("click", () => {
  if (window.innerWidth <= 880) document.body.classList.toggle("sb-open-mobile");
  else document.body.classList.toggle("sb-collapsed");
});

$$(".sb-item.has-sub").forEach((item) => item.addEventListener("click", () => {
  const g = item.parentElement;
  g.dataset.open = g.dataset.open === "true" ? "false" : "true";
}));

$$("[data-page]").forEach((el) => el.addEventListener("click", () => {
  $$(".sb-item, .sb-subitem").forEach((x) => x.classList.remove("active"));
  el.classList.add("active");
  const page = el.dataset.page;
  $("#pageTitle").textContent = page;
  $("#crumbCurrent").textContent = page;
  if (page === "Job Seekers") openUsers("seeker");
  else if (page === "Employers") openUsers("employer");
  else if (page === "Administrators") openUsers("admin");
  else if (page === "All Jobs" || page === "Pending Approval") {
    renderTable(page === "Pending Approval" ? TABLE_JOBS.filter((j) => j.status === "pending") : TABLE_JOBS);
    $(".table-panel").scrollIntoView({ behavior: "smooth" });
  }
  else if (page !== "Dashboard") toast(`${page} module — demo dashboard shows overview data`, "info");
}));

/* ---------- DROPDOWNS ---------- */
[["#adminNotifBtn", "#adminNotifDropdown"], ["#adminProfileBtn", "#adminProfileDropdown"]].forEach(([b, d]) => {
  $(b).addEventListener("click", (e) => {
    if (e.target.closest(".ad-item")) return;
    e.stopPropagation();
    const dd = $(d);
    const was = dd.classList.contains("open");
    $$(".adropdown").forEach((x) => x.classList.remove("open"));
    if (!was) dd.classList.add("open");
  });
});
document.addEventListener("click", () => $$(".adropdown").forEach((x) => x.classList.remove("open")));
$("#adminMarkRead").addEventListener("click", async (e) => {
  e.preventDefault(); e.stopPropagation();
  try { await API.post("/api/notifications/read-all"); renderNotifs(); } catch { /* offline */ }
  toast("All notifications marked as read", "success");
});
const adminLogout = $("#adminLogout");
if (adminLogout) adminLogout.addEventListener("click", () => API.logout());

/* ---------- FULLSCREEN ---------- */
$("#fullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    $("#fullscreenBtn i").className = "fa-solid fa-compress";
  } else {
    document.exitFullscreen();
    $("#fullscreenBtn i").className = "fa-solid fa-expand";
  }
});

/* ---------- QUICK ACTIONS ---------- */
$$(".qa-btn").forEach((b) => b.addEventListener("click", () => {
  const qa = b.dataset.qa;
  if (qa === "Add New Job") {
    openModal(`
      <h3>Add New Job</h3>
      <form class="form" id="addJobForm">
        <label>Job Title<input type="text" id="njTitle" placeholder="e.g. Software Engineer" required /></label>
        <label>Category<input type="text" id="njCategory" placeholder="e.g. IT Jobs" required /></label>
        <label>Location<input type="text" id="njLocation" placeholder="City, State" required /></label>
        <label>Monthly Salary (₹)<input type="number" id="njSalary" value="25000" required /></label>
        <button class="btn-primary" type="submit">Create Job Posting</button>
      </form>`);
    $("#addJobForm").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await API.post("/api/jobs", {
          title: $("#njTitle").value, category: $("#njCategory").value,
          location: $("#njLocation").value, salary: +$("#njSalary").value,
        });
        closeModal();
        toast("New job posting created — live on the marketplace", "success");
      } catch (ex) { toast(ex.message, "warn"); }
    });
  } else {
    toast(`${qa} — opening module...`, "info");
  }
}));

/* ---------- MISC ---------- */
$("#createTicketBtn").addEventListener("click", () => {
  openModal(`
    <h3>Create Support Ticket</h3>
    <form class="form" id="ticketForm">
      <label>Subject<input type="text" placeholder="Brief issue summary" required /></label>
      <label>Priority<select><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select></label>
      <label>Description<textarea rows="4" placeholder="Describe the issue..." required></textarea></label>
      <button class="btn-primary" type="submit">Submit Ticket</button>
    </form>`);
  $("#ticketForm").addEventListener("submit", (e) => {
    e.preventDefault(); closeModal();
    toast("Support ticket #" + Math.floor(1000 + Math.random() * 9000) + " created", "success");
  });
});

$("#dateRangeBtn").addEventListener("click", () => {
  const ranges = [
    "May 20, 2024 – Jun 20, 2024",
    "Apr 20, 2024 – May 20, 2024",
    "Jan 01, 2024 – Jun 20, 2024",
  ];
  const cur = $("#dateRangeText").textContent;
  const next = ranges[(ranges.indexOf(cur) + 1) % ranges.length];
  $("#dateRangeText").textContent = next;
  toast(`Date range: ${next}`, "info");
});

["#viewAllCategories", "#viewAllActivities"].forEach((id) =>
  $(id).addEventListener("click", () => toast("Loading full list view...", "info")));
["#viewAllJobsTop", "#viewAllJobsBottom"].forEach((id) =>
  $(id).addEventListener("click", () => { renderTable(TABLE_JOBS); toast(`Showing all ${TABLE_JOBS.length} jobs`, "info"); }));
$$("[data-detail]").forEach((a) => a.addEventListener("click", () => toast(`${a.dataset.detail} — detailed report loading...`, "info")));

/* live active sessions */
setInterval(() => {
  const el = $("#activeSessions");
  el.textContent = 235 + Math.floor(Math.random() * 25);
}, 4000);
