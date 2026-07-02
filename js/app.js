/* ============ JobDozo — public marketplace (API + real-time) ============ */
"use strict";

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

/* ---------- STATE ---------- */
let JOBS = [];
let COMPANIES = [];
let myApplications = [];   // seeker's applications (from API)
let savedIds = [];         // seeker's saved job ids (from API)
let appliedIds = [];

let state = {
  query: "", tab: "recommended", sort: "relevance",
  category: null, visible: 8,
  filters: { salary: [], experience: [], distance: [], jobtype: [], shift: [] },
  view: "home",
  companyQuery: "", companySort: "jobs", companyIndustry: "", companyVerified: false, companyVisible: 12,
};

const CATEGORIES = [
  { name: "Security Jobs", icon: "fa-shield-halved", bg: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { name: "Housekeeping", icon: "fa-broom", bg: "linear-gradient(135deg,#06b6d4,#0891b2)" },
  { name: "Driver Jobs", icon: "fa-car", bg: "linear-gradient(135deg,#6366f1,#4f46e5)" },
  { name: "Delivery Jobs", icon: "fa-box", bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { name: "Office Staff", icon: "fa-user-tie", bg: "linear-gradient(135deg,#1d4ed8,#1e40af)" },
  { name: "Electrician", icon: "fa-bolt", bg: "linear-gradient(135deg,#eab308,#ca8a04)" },
  { name: "Plumber", icon: "fa-wrench", bg: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
  { name: "IT Jobs", icon: "fa-code", bg: "linear-gradient(135deg,#334155,#1e293b)" },
  { name: "Sales Jobs", icon: "fa-chart-column", bg: "linear-gradient(135deg,#22c55e,#16a34a)" },
  { name: "More", icon: "fa-ellipsis", bg: "linear-gradient(135deg,#94a3b8,#64748b)" },
];

function toast(msg, type = "success") { jmToast(msg, type); }

function starsHtml(r) {
  let h = "";
  for (let i = 1; i <= 5; i++) h += i <= Math.round(r) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
  return h;
}
const postedDays = (j) => Math.max(0, Math.round((Date.now() - new Date(j.postedAt || j.createdAt).getTime()) / 864e5));

/* ---------- FILTERS ---------- */
function collectFilters() {
  const get = (n) => $$(`input[name="${n}"]:checked`).map((i) => i.value);
  return { salary: get("salary"), experience: get("experience"), distance: get("distance"), jobtype: get("jobtype"), shift: get("shift") };
}
function salaryInRange(sal, r) {
  if (r === "10-20") return sal >= 10000 && sal < 20000;
  if (r === "20-30") return sal >= 20000 && sal < 30000;
  if (r === "30-50") return sal >= 30000 && sal < 50000;
  return sal >= 50000;
}
function filterJobs() {
  const f = state.filters;
  let list = JOBS.filter((j) => {
    if (state.query) {
      const q = state.query.toLowerCase();
      if (!(j.title + " " + j.company + " " + (j.category || "")).toLowerCase().includes(q)) return false;
    }
    if (state.category && state.category !== "More" && j.category !== state.category) return false;
    if (f.salary.length && !f.salary.some((r) => salaryInRange(j.salary, r))) return false;
    if (f.experience.length && !f.experience.includes(j.exp)) return false;
    if (f.distance.length) {
      const max = Math.max(...f.distance.map(Number));
      if (j.distance > max) return false;
    }
    if (f.jobtype.length && !f.jobtype.includes(j.type)) return false;
    if (f.shift.length && !f.shift.includes(j.shift)) return false;
    return true;
  });

  if (state.tab === "nearby") list = [...list].sort((a, b) => a.distance - b.distance);
  if (state.tab === "latest") list = [...list].sort((a, b) => postedDays(a) - postedDays(b));
  if (state.tab === "recommended" && state.sort === "relevance") list = [...list].sort((a, b) => b.match - a.match);
  if (state.sort === "salary-high") list = [...list].sort((a, b) => b.salary - a.salary);
  if (state.sort === "salary-low") list = [...list].sort((a, b) => a.salary - b.salary);
  if (state.sort === "distance") list = [...list].sort((a, b) => a.distance - b.distance);
  if (state.sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
  return list;
}

/* ---------- RENDER ---------- */
function jobCardHtml(j) {
  const isSaved = savedIds.includes(j.id);
  const isApplied = appliedIds.includes(j.id);
  return `
  <article class="job-card" data-id="${j.id}">
    <div class="jc-top">
      ${j.verified ? '<span class="jc-verified"><i class="fa-solid fa-circle-check"></i> VERIFIED</span>' : "<span></span>"}
      <button class="jc-heart ${isSaved ? "saved" : ""}" data-heart="${j.id}" title="Save job">
        <i class="${isSaved ? "fa-solid" : "fa-regular"} fa-heart"></i>
      </button>
    </div>
    <div class="jc-logo" style="background:${j.logoBg || "linear-gradient(135deg,#0f172a,#334155)"};color:${j.logoColor || "#fff"}">${j.logo || "JM"}</div>
    <div>
      <div class="jc-title">${j.title}</div>
      <div class="jc-company"><i class="fa-regular fa-building"></i> ${j.company}</div>
    </div>
    <div class="jc-rating"><span class="stars">${starsHtml(j.rating || 4)}</span> <b>${j.rating || 4}</b> (${j.reviews || 0})</div>
    <div class="jc-salary">${money(j.salary)} <span>/ Month</span></div>
    <div class="jc-meta">
      <div><i class="fa-solid fa-location-dot"></i> ${j.location} &nbsp;•&nbsp; <i class="fa-solid fa-route"></i> Within ${j.distance} KM</div>
      <div><i class="fa-solid fa-users"></i> ${j.openings} Openings &nbsp;•&nbsp; <i class="fa-solid fa-briefcase"></i> ${j.expLabel || j.exp || "Any"}</div>
    </div>
    <div class="jc-tags">${(j.tags || []).map((t) => `<span class="jc-tag">${t}</span>`).join("")}</div>
    <div class="jc-actions">
      <button class="btn-apply ${isApplied ? "applied" : ""}" data-apply="${j.id}">
        ${isApplied ? '<i class="fa-solid fa-check"></i> Applied' : "Apply Now"}
      </button>
      <button class="btn-save ${isSaved ? "saved" : ""}" data-save="${j.id}">${isSaved ? "Saved ✓" : "Save Job"}</button>
    </div>
  </article>`;
}

function renderJobs() {
  const list = filterJobs();
  const grid = $("#jobsGrid");
  grid.innerHTML = list.length
    ? list.slice(0, state.visible).map(jobCardHtml).join("")
    : `<div class="no-results"><i class="fa-solid fa-magnifying-glass"></i><h4>No jobs found</h4><p>Try changing your search or filters.</p></div>`;
  $("#viewMoreBtn").style.display = list.length > state.visible ? "" : "none";
}

function renderCategories() {
  $("#catGrid").innerHTML = CATEGORIES.map((c) => `
    <div class="cat-card ${state.category === c.name ? "selected" : ""}" data-cat="${c.name}">
      <span class="cat-ico" style="background:${c.bg}"><i class="fa-solid ${c.icon}"></i></span>
      <span class="cname">${c.name}</span>
    </div>`).join("");
  $("#catDropdown").innerHTML = CATEGORIES.filter((c) => c.name !== "More")
    .map((c) => `<div class="dropdown-item" data-cat="${c.name}"><i class="fa-solid ${c.icon}" style="color:#1a6cf5;width:16px"></i> ${c.name}</div>`).join("");
}

function renderAiRecs() {
  const recs = [...JOBS].sort((a, b) => b.match - a.match).slice(0, 3);
  $("#aiRecList").innerHTML = recs.map((j) => `
    <div class="airec-item" data-id="${j.id}">
      <span class="ai-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 2)}</span>
      <div class="airec-mid">
        <strong>${j.title}</strong>
        <small>${j.company}</small>
        <small class="sal">${money(j.salary)} / Month</small>
      </div>
      <span class="match-chip"><small>Match</small>${j.match}%</span>
    </div>`).join("");
}

const MOBILE_CATS = [
  { name: "Office Staff", short: "Office", icon: "fa-briefcase", bg: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { name: "Driver Jobs", short: "Driver", icon: "fa-car", bg: "linear-gradient(135deg,#6366f1,#4f46e5)" },
  { name: "Security Jobs", short: "Security", icon: "fa-shield-halved", bg: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
  { name: "Housekeeping", short: "Hotel", icon: "fa-hotel", bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { name: "IT Jobs", short: "IT", icon: "fa-code", bg: "linear-gradient(135deg,#334155,#1e293b)" },
  { name: "Electrician", short: "Factory", icon: "fa-industry", bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  { name: "More", short: "More", icon: "fa-ellipsis", bg: "linear-gradient(135deg,#94a3b8,#64748b)" },
];

function isMobileView() { return window.matchMedia("(max-width: 768px)").matches; }

function topCompaniesList() {
  if (COMPANIES.length) return COMPANIES;
  const map = new Map();
  JOBS.forEach((j) => {
    if (!map.has(j.company)) map.set(j.company, { name: j.company, logo: j.logo, logoBg: j.logoBg, logoColor: j.logoColor, rating: j.rating || 4, jobCount: 0, slug: j.company.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    map.get(j.company).jobCount++;
  });
  return [...map.values()].sort((a, b) => b.jobCount - a.jobCount);
}

function filterCompanies() {
  let list = [...COMPANIES];
  const q = state.companyQuery.trim().toLowerCase();
  if (q) list = list.filter((c) => (c.name + " " + c.industry + " " + c.categories.join(" ")).toLowerCase().includes(q));
  if (state.companyIndustry) list = list.filter((c) => c.industry === state.companyIndustry || c.industries?.includes(state.companyIndustry));
  if (state.companyVerified) list = list.filter((c) => c.verified);
  if (state.companySort === "rating") list.sort((a, b) => b.rating - a.rating);
  else if (state.companySort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (state.companySort === "openings") list.sort((a, b) => b.totalOpenings - a.totalOpenings);
  else list.sort((a, b) => b.jobCount - a.jobCount);
  return list;
}

function companyCardHtml(c) {
  return `
  <article class="co-card" data-company="${c.slug}">
    <div class="co-card-top">
      <div class="co-logo" style="background:${c.logoBg || "linear-gradient(135deg,#1a6cf5,#0d4fc4)"};color:${c.logoColor || "#fff"}">${(c.logo || c.name.slice(0, 2)).slice(0, 3)}</div>
      <div class="co-card-head">
        <h3>${c.name}</h3>
        <div class="co-industry">${c.industry}</div>
        ${c.verified ? '<span class="co-verified"><i class="fa-solid fa-circle-check"></i> VERIFIED</span>' : ""}
      </div>
    </div>
    <div class="co-card-meta">
      <div class="co-meta-item"><strong>${c.openRoles}</strong><span>Open roles</span></div>
      <div class="co-meta-item"><strong>${c.totalOpenings}+</strong><span>Openings</span></div>
      <div class="co-meta-item"><strong>${money(c.avgSalary)}</strong><span>Avg salary</span></div>
    </div>
    <div class="co-card-tags">${c.categories.slice(0, 3).map((t) => `<span class="co-tag">${t}</span>`).join("")}</div>
    <div class="co-card-foot">
      <div class="co-rating"><i class="fa-solid fa-star"></i> <b>${c.rating}</b> (${c.reviews}+ reviews)</div>
      <button class="co-view-btn" type="button">View Jobs</button>
    </div>
  </article>`;
}

function renderCompanies() {
  const list = filterCompanies();
  const grid = $("#companiesGrid");
  if (!grid) return;

  if ($("#coStatCount")) $("#coStatCount").textContent = COMPANIES.length;
  if ($("#coStatJobs")) $("#coStatJobs").textContent = COMPANIES.reduce((n, c) => n + c.openRoles, 0);
  if ($("#coStatVerified")) $("#coStatVerified").textContent = COMPANIES.filter((c) => c.verified).length;

  grid.innerHTML = list.length
    ? list.slice(0, state.companyVisible).map(companyCardHtml).join("")
    : `<div class="no-results" style="grid-column:1/-1"><i class="fa-regular fa-building"></i><h4>No companies found</h4><p>Try a different search or filter.</p></div>`;

  const loadBtn = $("#loadMoreCompanies");
  if (loadBtn) loadBtn.style.display = list.length > state.companyVisible ? "" : "none";

  const mGrid = $("#mCoGrid");
  if (mGrid) {
    mGrid.innerHTML = list.slice(0, 20).map((c) => `
      <button class="m-co-card" type="button" data-company="${c.slug}">
        <div class="m-co-logo" style="background:${c.logoBg};color:${c.logoColor || "#fff"}">${(c.logo || c.name.slice(0, 2)).slice(0, 3)}</div>
        <strong>${c.name}</strong>
        <small><i class="fa-solid fa-star"></i> ${c.rating} · ${c.openRoles} jobs</small>
        <em>View roles</em>
      </button>`).join("");
  }

  if ($("#mCompanies")) {
    $("#mCompanies").innerHTML = list.slice(0, 8).map((c) => `
      <button class="m-co-card" type="button" data-company="${c.slug}" style="flex-shrink:0;width:100px">
        <div class="m-co-logo" style="background:${c.logoBg};color:${c.logoColor || "#fff"}">${(c.logo || c.name.slice(0, 2)).slice(0, 3)}</div>
        <strong>${c.name.split(" ")[0]}</strong>
        <small><i class="fa-solid fa-star"></i> ${c.rating}</small>
      </button>`).join("");
  }
}

function switchView(view) {
  state.view = view;
  const home = $("#homeView");
  const companies = $("#companiesView");
  const filters = $("#filtersPanel");
  if (home) home.hidden = view !== "home";
  if (companies) companies.hidden = view !== "companies";
  if (filters) filters.style.display = view === "companies" ? "none" : "";
  if (view === "companies") {
    renderCompanies();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function switchMobileView(mode) {
  const home = $("#mHomeSections");
  const coPage = $("#mCompaniesPage");
  if (!home || !coPage) return;
  home.hidden = mode === "companies";
  coPage.hidden = mode !== "companies";
  if (mode === "companies") renderCompanies();
}

function openCompanyModal(slug) {
  const company = COMPANIES.find((c) => c.slug === slug);
  if (!company) return;
  $("#companyModalBody").innerHTML = `
    <div class="cm-header">
      <div class="cm-logo" style="background:${company.logoBg};color:${company.logoColor || "#fff"}">${(company.logo || company.name.slice(0, 2)).slice(0, 3)}</div>
      <div class="cm-title">
        <h2>${company.name}</h2>
        <p>${company.industry} · ${company.primaryLocation}</p>
        <div class="cm-badges">
          ${company.verified ? '<span class="cm-badge green"><i class="fa-solid fa-circle-check"></i> Verified Employer</span>' : ""}
          <span class="cm-badge"><i class="fa-solid fa-star"></i> ${company.rating} rating</span>
          ${company.size ? `<span class="cm-badge">${company.size} employees</span>` : ""}
        </div>
      </div>
    </div>
    <p class="cm-about">${company.about}</p>
    <div class="cm-stats">
      <div class="cm-stat"><strong>${company.openRoles}</strong><span>Open roles</span></div>
      <div class="cm-stat"><strong>${company.totalOpenings}+</strong><span>Total openings</span></div>
      <div class="cm-stat"><strong>${money(company.avgSalary)}</strong><span>Avg salary</span></div>
      <div class="cm-stat"><strong>${company.locations.length}</strong><span>Locations</span></div>
    </div>
    <div class="cm-jobs-head">Open positions at ${company.name}</div>
    ${company.jobs.map((j) => `
      <div class="cm-job" data-id="${j.id}">
        <div class="cm-job-mid">
          <strong>${j.title}</strong>
          <small>${j.location} · ${j.type} · ${j.expLabel || "Any exp"}</small>
        </div>
        <div class="cm-job-sal">${money(j.salary)}/mo</div>
        <button class="cm-job-apply ${appliedIds.includes(j.id) ? "applied" : ""}" data-apply="${j.id}" type="button">${appliedIds.includes(j.id) ? "Applied ✓" : "Apply"}</button>
      </div>`).join("")}
  `;
  openModal("companyModal");
}

function populateCompanyFilters() {
  const sel = $("#coIndustryFilter");
  if (!sel || sel.dataset.ready) return;
  const industries = [...new Set(COMPANIES.map((c) => c.industry))].sort();
  sel.innerHTML = `<option value="">All industries</option>${industries.map((i) => `<option value="${i}">${i}</option>`).join("")}`;
  sel.dataset.ready = "1";
}

function renderMobile() {
  if (!isMobileView() || !$("#mobileApp")) return;
  const list = filterJobs();
  const sorted = [...list].sort((a, b) => b.match - a.match);
  const nearby = [...list].sort((a, b) => a.distance - b.distance);

  $("#mJobCount").textContent = JOBS.length ? JOBS.length.toLocaleString("en-IN") + "+" : "500+";
  $("#mHeroNear").textContent = JOBS.length ? JOBS.length + "+" : "1200+";
  $("#mHeroMatch").textContent = (sorted[0]?.match || 95) + "%";

  $("#mCats").innerHTML = MOBILE_CATS.map((c) => `
    <button class="m-cat" type="button" data-mcat="${c.name}">
      <span class="m-cat-ico" style="background:${c.bg}"><i class="fa-solid ${c.icon}"></i></span>
      ${c.short}
    </button>`).join("");

  $("#mCompanies").innerHTML = topCompaniesList().slice(0, 8).map((c) => `
    <button class="m-co-card" type="button" data-company="${c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}" style="flex-shrink:0;width:100px">
      <div class="m-co-logo" style="background:${c.logoBg || "#1a6cf5"};color:${c.logoColor || "#fff"}">${(c.logo || c.name.slice(0, 2)).slice(0, 3)}</div>
      <strong>${c.name.split(" ")[0]}</strong>
      <small><i class="fa-solid fa-star"></i> ${c.rating}</small>
    </button>`).join("");

  const empty = `<div style="padding:20px;text-align:center;color:#94a3b8;font-size:.85rem;grid-column:1/-1">No jobs found. Try another search.</div>`;
  $("#mFeatured").innerHTML = sorted.length ? sorted.slice(0, 6).map((j) => mobileFeatCard(j)).join("") : empty;
  $("#mNearby").innerHTML = nearby.length ? nearby.slice(0, 5).map((j) => mobileNearbyRow(j)).join("") : empty;
  $("#mSuggested").innerHTML = sorted.length ? sorted.slice(0, 8).map((j) => mobileSugCard(j)).join("") : empty;

  const authBlock = $("#mAuthBlock");
  if (authBlock) authBlock.hidden = !!API.user;

  const mBadge = $("#mNotifBadge");
  const dBadge = $("#notifBadge");
  if (mBadge && dBadge) {
    const n = dBadge.textContent;
    if (dBadge.style.display === "none" || !n || n === "0") mBadge.hidden = true;
    else { mBadge.hidden = false; mBadge.textContent = n; }
  }
}

function mobileSugCard(j) {
  const saved = savedIds.includes(j.id);
  return `
  <article class="m-sug-card" data-id="${j.id}">
    <button class="m-heart ${saved ? "saved" : ""}" data-heart="${j.id}" type="button"><i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
    <div class="m-sug-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 2)}</div>
    <h4>${j.title}</h4>
    <div class="co">${j.company}</div>
    <div class="sal">${money(j.salary)} / Month</div>
    <div class="m-sug-meta">
      <span class="m-match-pill">${j.match}% Match</span>
      <span class="m-rating-pill"><i class="fa-solid fa-star"></i> ${j.rating || 4}</span>
    </div>
    <div class="m-sug-loc"><i class="fa-solid fa-location-dot"></i> ${j.location}, ${j.distance} KM</div>
  </article>`;
}

function mobileFeatCard(j) {
  const applied = appliedIds.includes(j.id);
  return `
  <article class="m-feat-card" data-id="${j.id}">
    <div class="m-feat-top">
      <div class="m-feat-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 2)}</div>
      <div><h4>${j.title}</h4><div class="co">${j.company}</div></div>
    </div>
    <div class="sal">${money(j.salary)} / Month</div>
    <div class="m-feat-tags">
      <span class="m-feat-tag">${j.type || "Full Time"}</span>
      <span class="m-feat-tag">${j.expLabel || j.exp || "Any"}</span>
    </div>
    <button class="m-feat-apply ${applied ? "applied" : ""}" data-apply="${j.id}" type="button">${applied ? "Applied ✓" : "Apply Now"}</button>
  </article>`;
}

function mobileNearbyRow(j) {
  const saved = savedIds.includes(j.id);
  return `
  <div class="m-nearby-row" data-id="${j.id}">
    <div class="m-nearby-avatar" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 2)}</div>
    <div class="m-nearby-mid">
      <strong>${j.title}</strong>
      <small>${j.company}</small>
      <em>${money(j.salary)} / Month</em>
    </div>
    <span class="m-nearby-match">${j.match}% Match</span>
    <button class="m-nearby-heart ${saved ? "saved" : ""}" data-heart="${j.id}" type="button"><i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
  </div>`;
}

function renderPhoneJobs() {
  const top = [...JOBS].sort((a, b) => b.match - a.match).slice(0, 3);
  $("#phoneJobs").innerHTML = top.map((j) => `
    <div class="ph-job">
      <span class="ph-job-logo" style="background:${j.logoBg};color:${j.logoColor || "#fff"}">${(j.logo || "JM").slice(0, 2)}</span>
      <div class="ph-job-mid">
        <strong>${j.title}</strong>
        <small>${j.company}</small>
        <em>${money(j.salary)} / Month</em>
      </div>
      <div class="ph-job-right">
        <i class="fa-solid fa-heart"></i>
        <span>${j.match}%</span>
      </div>
    </div>`).join("");
}

async function renderNotifs() {
  if (!API.user) {
    $("#notifList").innerHTML = `<div style="padding:18px;text-align:center;color:#7c8aa5;font-size:.82rem">Login to see your notifications</div>`;
    $("#notifBadge").style.display = "none";
    return;
  }
  try {
    const list = await API.get("/api/notifications");
    $("#notifList").innerHTML = list.length ? list.map((n) => `
      <div class="nd-item ${n.read ? "" : "unread"}">
        <span class="nd-ico" style="background:${n.bg}"><i class="fa-solid ${n.icon}"></i></span>
        <div><p>${n.text}</p><small>${new Date(n.createdAt).toLocaleString()}</small></div>
      </div>`).join("") : `<div style="padding:18px;text-align:center;color:#7c8aa5;font-size:.82rem">No notifications yet</div>`;
    const unread = list.filter((n) => !n.read).length;
    $("#notifBadge").textContent = unread;
    $("#notifBadge").style.display = unread ? "" : "none";
  } catch { /* server offline */ }
}

function refreshCounters() {
  const applied = appliedIds.length;
  const saved = savedIds.length;
  const interviews = myApplications.filter((a) => a.status === "Interview").length;
  $("#appliedCountPill").textContent = applied;
  $("#dashApplied").textContent = applied;
  $("#dashSaved").textContent = saved;
  $("#savedBadge").textContent = saved;
  $("#dashInterviews").textContent = interviews;
  $("#dashViews").textContent = API.user ? 45 : 0;
}

const ROLE_DASHBOARD = {
  seeker: { url: "/seeker/dashboard", label: "My Dashboard" },
  employer: { url: "/employer/dashboard", label: "Employer Dashboard" },
  recruiter: { url: "/recruiter/dashboard", label: "Recruiter Dashboard" },
  admin: { url: "/admin/dashboard", label: "Admin Dashboard" },
  "super-admin": { url: "/super-admin/dashboard", label: "Super Admin" },
};

function renderHeaderAuth() {
  const guest = $("#guestAuthActions");
  const dashBtn = $("#userDashboardBtn");
  if (!guest || !dashBtn) return;

  if (API.user) {
    guest.style.display = "none";
    const portal = ROLE_DASHBOARD[API.user.role] || ROLE_DASHBOARD.seeker;
    dashBtn.textContent = portal.label;
    dashBtn.hidden = false;
  } else {
    guest.style.display = "";
    dashBtn.hidden = true;
  }
}

function renderUserChip() {
  const avatar = $(".profile-chip .avatar");
  const head = $(".pd-head");
  if (API.user) {
    avatar.textContent = API.user.name[0].toUpperCase();
    head.innerHTML = `<div class="avatar lg">${API.user.name[0].toUpperCase()}</div>
      <div><strong>${API.user.name}</strong><small>${API.user.email}</small></div>`;
    $(".profile-card h3").innerHTML = `Hi, ${API.user.name.split(" ")[0]}! <span class="wave">👋</span>`;
    const pct = API.user.profilePct || 60;
    $("#profilePct").textContent = pct + "%";
    $("#profileBar").style.width = pct + "%";
  } else {
    avatar.innerHTML = '<i class="fa-regular fa-user" style="font-size:.85rem"></i>';
    head.innerHTML = `<div class="avatar lg"><i class="fa-regular fa-user"></i></div>
      <div><strong>Guest</strong><small>Login to apply &amp; track jobs</small></div>`;
    $(".profile-card h3").innerHTML = `Welcome! <span class="wave">👋</span>`;
  }
}

/* ---------- DATA LOADING ---------- */
async function loadAll() {
  try {
    [JOBS, COMPANIES] = await Promise.all([API.get("/api/jobs"), API.get("/api/companies")]);
  } catch (e) {
    $("#jobsGrid").innerHTML = `<div class="no-results"><i class="fa-solid fa-server"></i><h4>Server offline</h4><p>${e.message}</p></div>`;
    return;
  }
  populateCompanyFilters();
  if (API.isRole("seeker")) {
    try {
      const [apps, saved] = await Promise.all([API.get("/api/applications/mine"), API.get("/api/saved")]);
      myApplications = apps;
      appliedIds = apps.map((a) => a.jobId);
      savedIds = saved.ids;
    } catch { /* ignore */ }
  }
  renderCategories(); renderJobs(); renderAiRecs(); renderPhoneJobs(); renderCompanies(); renderMobile();
  renderNotifs().then(() => renderMobile()); refreshCounters(); renderUserChip(); renderHeaderAuth();
}

/* ---------- MODALS ---------- */
function openModal(id) {
  $$(".modal").forEach((m) => m.classList.remove("show"));
  $("#" + id).classList.add("show");
  $("#modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("#modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function openJobModal(job) {
  $("#jobModalBody").innerHTML = `
    <div class="jm-head">
      <div class="jc-logo" style="background:${job.logoBg};color:${job.logoColor || "#fff"}">${job.logo}</div>
      <div>
        <h3>${job.title}</h3>
        <small><i class="fa-regular fa-building"></i> ${job.company} &nbsp;${job.verified ? '<span class="jc-verified"><i class="fa-solid fa-circle-check"></i> VERIFIED</span>' : ""}</small>
      </div>
    </div>
    <div class="jc-rating"><span class="stars">${starsHtml(job.rating || 4)}</span> <b>${job.rating || 4}</b> (${job.reviews || 0} reviews)</div>
    <div class="jm-stats">
      <div class="jm-stat">Salary<b>${money(job.salary)} / Month</b></div>
      <div class="jm-stat">Experience<b>${job.expLabel || "Any"}</b></div>
      <div class="jm-stat">Openings<b>${job.openings} Positions</b></div>
      <div class="jm-stat">Distance<b>Within ${job.distance} KM</b></div>
      <div class="jm-stat">Job Type<b>${job.type}</b></div>
      <div class="jm-stat">Applicants<b>${job.applicants || 0} applied</b></div>
    </div>
    <p class="jm-desc">${job.desc || ""}</p>
    <div class="jm-actions">
      <button class="btn-primary" data-apply="${job.id}">${appliedIds.includes(job.id) ? "Applied ✓" : "Apply Now"}</button>
      <button class="btn-outline" data-save="${job.id}">${savedIds.includes(job.id) ? "Saved ✓" : "Save Job"}</button>
    </div>`;
  openModal("jobModal");
}

function openListModal(kind) {
  if (!API.isRole("seeker")) { showLogin({ title: "Login as Job Seeker to view this" }); return; }
  const title = kind === "applied" ? `Applied Jobs (${appliedIds.length})` : `Saved Jobs (${savedIds.length})`;
  $("#listModalTitle").textContent = title;
  const items = kind === "applied"
    ? myApplications.map((a) => ({ job: a.job, status: a.status }))
    : savedIds.map((id) => ({ job: JOBS.find((j) => j.id === id), status: "Saved" })).filter((x) => x.job);
  $("#listModalBody").innerHTML = items.length ? items.map((x) => `
      <div class="lm-item">
        <span class="jc-logo" style="background:${x.job.logoBg};color:${x.job.logoColor || "#fff"}">${(x.job.logo || "JM").slice(0, 2)}</span>
        <div class="lm-mid"><strong>${x.job.title}</strong><small>${x.job.company} • ${money(x.job.salary)}/mo</small></div>
        <span class="lm-status ${kind === "applied" ? "review" : ""}">${x.status}</span>
      </div>`).join("")
    : `<div class="lm-empty">Nothing here yet.</div>`;
  openListModalShow();
}
function openListModalShow() { openModal("listModal"); }

/* ---------- ACTIONS ---------- */
let pendingApplyId = null;

function startApply(id) {
  if (!API.user) { showLogin({ title: "Login to apply for jobs" }); return; }
  if (!API.isRole("seeker")) { toast("Only job seekers can apply. You are logged in as " + API.user.role, "warn"); return; }
  if (appliedIds.includes(id)) { toast("You already applied to this job", "info"); return; }
  const job = JOBS.find((j) => j.id === id);
  pendingApplyId = id;
  $("#applyJobTitle").textContent = job.title;
  $("#applyJobCompany").textContent = `${job.company} • ${money(job.salary)}/Month • ${job.location}`;
  $("#apName").value = API.user.name;
  $("#apEmail").value = API.user.email;
  openModal("applyModal");
}

async function toggleSave(id) {
  if (!API.user) { showLogin({ title: "Login to save jobs" }); return; }
  if (!API.isRole("seeker")) { toast("Only job seekers can save jobs", "warn"); return; }
  try {
    const r = await API.post("/api/saved/" + id);
    savedIds = r.ids;
    const job = JOBS.find((j) => j.id === id);
    toast(r.saved ? `Saved "${job.title}" ❤` : `Removed "${job.title}" from saved jobs`, r.saved ? "success" : "info");
    refreshCounters(); renderJobs(); renderMobile();
  } catch (e) { toast(e.message, "warn"); }
}

/* ---------- REAL-TIME ---------- */
socket.on("job:created", async (j) => {
  if (JOBS.some((x) => x.id === j.id)) return;
  JOBS.unshift(j);
  try { COMPANIES = await API.get("/api/companies"); } catch { /* ignore */ }
  renderJobs(); renderAiRecs(); renderPhoneJobs(); renderCompanies(); renderMobile();
  toast(`🔥 New job just posted: ${j.title} at ${j.company}`, "info");
});
socket.on("job:updated", async (j) => {
  const i = JOBS.findIndex((x) => x.id === j.id);
  if (j.status !== "active") { if (i >= 0) JOBS.splice(i, 1); }
  else if (i >= 0) JOBS[i] = j;
  else JOBS.unshift(j);
  try { COMPANIES = await API.get("/api/companies"); } catch { /* ignore */ }
  renderJobs(); renderCompanies(); renderMobile();
});
socket.on("job:removed", async ({ id }) => {
  JOBS = JOBS.filter((x) => x.id !== id);
  try { COMPANIES = await API.get("/api/companies"); } catch { /* ignore */ }
  renderJobs(); renderCompanies(); renderMobile();
});
socket.on("application:status", (a) => {
  const i = myApplications.findIndex((x) => x.id === a.id);
  if (i >= 0) myApplications[i] = a;
  toast(`Application update — ${a.job ? a.job.title : ""}: ${a.status}`, "info");
  refreshCounters();
});
socket.on("notification:new", () => renderNotifs());

/* ---------- EVENTS ---------- */
function bindEvents() {
  const doSearch = (q) => {
    state.query = q.trim();
    state.visible = 8;
    const mInput = $("#mSearchInput");
    if (mInput && mInput.value !== state.query) mInput.value = state.query;
    renderJobs();
    renderMobile();
    if (state.query) toast(`Showing results for "${state.query}"`, "info");
    if (isMobileView()) $("#mFeaturedBlock")?.scrollIntoView({ behavior: "smooth" });
    else $("#jobsGrid").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  $("#headerSearchBtn").addEventListener("click", () => doSearch($("#headerSearchInput").value));
  $("#headerSearchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(e.target.value); });
  $("#heroSearchBtn").addEventListener("click", () => doSearch($("#heroSearchInput").value));
  $("#heroSearchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(e.target.value); });
  $$(".ptag").forEach((t) => t.addEventListener("click", () => { $("#heroSearchInput").value = t.dataset.q; doSearch(t.dataset.q); }));

  $$(".htab").forEach((t) => t.addEventListener("click", () => {
    $$(".htab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    if (t.dataset.htab === "candidates") toast("Candidate search is for employers — open the Employer Dashboard", "info");
  }));

  $$(".fgroup-title").forEach((t) => t.addEventListener("click", () => t.parentElement.classList.toggle("collapsed")));
  $$('.filters input[type="checkbox"]').forEach((c) => c.addEventListener("change", () => {
    state.filters = collectFilters(); state.visible = 8; renderJobs(); renderMobile();
  }));
  $("#applyFiltersBtn").addEventListener("click", () => {
    state.filters = collectFilters(); state.visible = 8; renderJobs(); renderMobile();
    toast(`Filters applied — ${filterJobs().length} jobs found`, "success");
  });
  $("#clearFilters").addEventListener("click", () => {
    $$('.filters input[type="checkbox"]').forEach((c) => (c.checked = false));
    state.filters = collectFilters(); state.category = null; state.visible = 8;
    renderCategories(); renderJobs(); renderMobile();
    toast("All filters cleared", "info");
  });

  $$(".jtab").forEach((t) => t.addEventListener("click", () => {
    $$(".jtab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    state.tab = t.dataset.jtab; state.visible = 8; renderJobs(); renderMobile();
  }));
  $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; renderJobs(); renderMobile(); });
  $("#viewMoreBtn").addEventListener("click", () => { state.visible += 8; renderJobs(); renderMobile(); });

  $("#catGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".cat-card");
    if (!card) return;
    const name = card.dataset.cat;
    state.category = state.category === name ? null : (name === "More" ? null : name);
    state.visible = 8;
    renderCategories(); renderJobs(); renderMobile();
    if (state.category) toast(`Showing ${state.category}`, "info");
    if (isMobileView()) $("#mFeaturedBlock")?.scrollIntoView({ behavior: "smooth" });
    else $("#jobsGrid").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#viewAllCats").addEventListener("click", () => { state.category = null; renderCategories(); renderJobs(); renderMobile(); });

  document.addEventListener("click", (e) => {
    const applyBtn = e.target.closest("[data-apply]");
    if (applyBtn) { e.stopPropagation(); startApply(applyBtn.dataset.apply); return; }
    const saveBtn = e.target.closest("[data-save],[data-heart]");
    if (saveBtn) {
      e.stopPropagation();
      toggleSave(saveBtn.dataset.save || saveBtn.dataset.heart);
      if ($("#modalOverlay").classList.contains("open") && $("#jobModal").classList.contains("show")) closeModal();
      return;
    }
    const card = e.target.closest(".job-card, .airec-item, .m-sug-card, .m-feat-card, .m-nearby-row, .cm-job");
    if (card && card.dataset.id) {
      const job = JOBS.find((j) => j.id === card.dataset.id);
      if (job) openJobModal(job);
      return;
    }
    const coCard = e.target.closest("[data-company]");
    if (coCard) {
      e.stopPropagation();
      openCompanyModal(coCard.dataset.company);
    }
  });

  $("#applyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!pendingApplyId) return;
    try {
      const a = await API.post("/api/applications", {
        jobId: pendingApplyId,
        name: $("#apName").value, phone: $("#apPhone").value,
        email: $("#apEmail").value, experience: $("#apExp").value,
      });
      myApplications.unshift(a);
      appliedIds.push(pendingApplyId);
      refreshCounters(); renderJobs(); renderMobile(); closeModal();
      toast(`Application submitted to ${a.job.company} ✓`, "success");
      pendingApplyId = null;
    } catch (ex) { toast(ex.message, "warn"); }
  });

  $("#modalOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  const toggles = [
    ["#notifBtn", "#notifDropdown"], ["#profileBtn", "#profileDropdown"],
    ["#headerLocBtn", "#locDropdown"], ["#catToggle", "#catDropdown"],
  ];
  toggles.forEach(([btn, dd]) => {
    $(btn).addEventListener("click", (e) => {
      if (e.target.closest(".dropdown-item")) return;
      e.stopPropagation();
      const el = $(dd);
      const wasOpen = el.classList.contains("open");
      $$(".dropdown").forEach((d) => d.classList.remove("open"));
      if (!wasOpen) el.classList.add("open");
    });
  });
  document.addEventListener("click", () => $$(".dropdown").forEach((d) => d.classList.remove("open")));

  $("#locDropdown").addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;
    $("#headerLocText").textContent = item.dataset.loc;
    toast(`Location set to ${item.dataset.loc}`, "success");
  });

  $("#catDropdown").addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;
    state.category = item.dataset.cat;
    renderCategories(); renderJobs();
  });

  $("#profileDropdown").addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    if (!item) return;
    if (!API.user) { showLogin({ title: "Login to JobDozo" }); return; }
    const act = item.dataset.act;
    if (act === "applied") openListModal("applied");
    else if (act === "saved") openListModal("saved");
    else if (act === "dashboard") window.location.href = (ROLE_DASHBOARD[API.user.role] || ROLE_DASHBOARD.seeker).url;
    else if (item.classList.contains("danger")) API.logout();
    else toast(`${item.textContent.trim()} — coming soon`, "info");
  });

  $("#markAllRead").addEventListener("click", async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!API.user) return;
    await API.post("/api/notifications/read-all");
    renderNotifs();
    toast("All notifications marked as read", "success");
  });

  $("#appliedPill").addEventListener("click", () => openListModal("applied"));
  $("#savedBtn").addEventListener("click", () => openListModal("saved"));
  $$(".dash-item").forEach((d) => d.addEventListener("click", () => {
    const k = d.dataset.dash;
    if (k === "applied") openListModal("applied");
    else if (k === "saved") openListModal("saved");
    else if (k === "interviews") {
      if (!API.user) { showLogin({ title: "Login to view interviews" }); return; }
      window.location.href = (ROLE_DASHBOARD[API.user.role] || ROLE_DASHBOARD.seeker).url;
    }
    else toast("Profile views are visible in your dashboard", "info");
  }));

  $("#navLinks").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    $$("#navLinks li").forEach((x) => x.classList.remove("active"));
    li.classList.add("active");
    const nav = li.dataset.nav;
    if (nav === "companies") switchView("companies");
    else if (nav === "home") { switchView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (nav === "nearby") { switchView("home"); $$(".jtab")[1].click(); $("#jobsGrid").scrollIntoView({ behavior: "smooth" }); }
    else if (nav === "jobs") { switchView("home"); $("#jobsGrid").scrollIntoView({ behavior: "smooth" }); }
    else if (nav === "ai") { switchView("home"); renderAiRecs(); toast("AI found your top matches — see right panel ✨", "info"); }
    else if (nav === "resume") openModal("premiumModal");
    else toast(`${li.textContent.trim().replace(/New|Premium/g, "")} — coming soon`, "info");
  });

  $("#coSearchInput")?.addEventListener("input", (e) => {
    state.companyQuery = e.target.value;
    state.companyVisible = 12;
    renderCompanies();
  });
  $("#coIndustryFilter")?.addEventListener("change", (e) => {
    state.companyIndustry = e.target.value;
    state.companyVisible = 12;
    renderCompanies();
  });
  $("#coSortSelect")?.addEventListener("change", (e) => {
    state.companySort = e.target.value;
    renderCompanies();
  });
  $("#coVerifiedOnly")?.addEventListener("change", (e) => {
    state.companyVerified = e.target.checked;
    state.companyVisible = 12;
    renderCompanies();
  });
  $("#loadMoreCompanies")?.addEventListener("click", () => {
    state.companyVisible += 12;
    renderCompanies();
  });
  $("#mCoSearch")?.addEventListener("input", (e) => {
    state.companyQuery = e.target.value;
    renderCompanies();
  });
  $("#mCompaniesAll")?.addEventListener("click", () => {
    $$(".m-tab").forEach((t) => t.classList.toggle("active", t.dataset.mtab === "companies"));
    switchMobileView("companies");
    $("#mMain").scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#upgradeBtn").addEventListener("click", () => openModal("premiumModal"));
  $("#premiumModal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plan]");
    if (!b) return;
    closeModal();
    toast(`${b.dataset.plan} plan selected — redirecting to payment...`, "success");
  });

  $("#loginBtn").addEventListener("click", () => showLogin({ title: "Welcome back to JobDozo", mode: "login" }));
  $("#signupBtn").addEventListener("click", () => showLogin({ title: "Create your JobDozo account", mode: "signup" }));
  $("#userDashboardBtn").addEventListener("click", () => {
    if (!API.user) { showLogin({ title: "Login to open your dashboard" }); return; }
    const portal = ROLE_DASHBOARD[API.user.role] || ROLE_DASHBOARD.seeker;
    window.location.href = portal.url;
  });
  $("#completeNowBtn").addEventListener("click", () => {
    if (!API.user) { showLogin({ title: "Login to complete your profile" }); return; }
    window.location.href = (ROLE_DASHBOARD[API.user.role] || ROLE_DASHBOARD.seeker).url;
  });
  $("#aiViewAll").addEventListener("click", () => {
    state.tab = "recommended"; state.sort = "relevance";
    $$(".jtab").forEach((x) => x.classList.remove("active"));
    $$(".jtab")[0].classList.add("active");
    renderJobs();
    $("#jobsGrid").scrollIntoView({ behavior: "smooth" });
  });
  $("#brandLogo").addEventListener("click", (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); });

  bindMobileEvents();
}

function bindMobileEvents() {
  const mApp = $("#mobileApp");
  if (!mApp) return;

  const doMobileSearch = (q) => {
    state.query = q.trim();
    state.visible = 8;
    renderJobs();
    renderMobile();
    if (state.query) toast(`Showing results for "${state.query}"`, "info");
    $("#mFeaturedBlock").scrollIntoView({ behavior: "smooth" });
  };

  $("#mSearchInput")?.addEventListener("keydown", (e) => { if (e.key === "Enter") doMobileSearch(e.target.value); });
  $("#mSearchInput")?.addEventListener("search", (e) => doMobileSearch(e.target.value));

  $("#mCats")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mcat]");
    if (!btn) return;
    const name = btn.dataset.mcat;
    state.category = name === "More" ? null : name;
    state.visible = 8;
    renderCategories(); renderJobs(); renderMobile();
    if (state.category) toast(`Showing ${state.category}`, "info");
    $("#mFeaturedBlock").scrollIntoView({ behavior: "smooth" });
  });

  $("#mTabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".m-tab");
    if (!tab) return;
    $$(".m-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const key = tab.dataset.mtab;
    if (key === "companies") {
      switchMobileView("companies");
      $("#mMain").scrollTo({ top: 0, behavior: "smooth" });
    } else {
      switchMobileView("jobs");
      if (key === "jobs") { state.tab = "recommended"; renderJobs(); renderMobile(); $("#mMain").scrollTo({ top: 0, behavior: "smooth" }); }
      else if (key === "nearby") { state.tab = "nearby"; renderJobs(); renderMobile(); $("#mNearbyBlock").scrollIntoView({ behavior: "smooth" }); }
      else toast("Skill Tests — coming soon", "info");
    }
  });

  $("#mSuggestedAll")?.addEventListener("click", () => {
    state.tab = "recommended"; state.sort = "relevance";
    renderJobs(); renderMobile();
    $("#mFeaturedBlock").scrollIntoView({ behavior: "smooth" });
  });
  $("#mFeaturedAll")?.addEventListener("click", () => $("#mFeaturedBlock").scrollIntoView({ behavior: "smooth" }));
  $("#mNearbyAll")?.addEventListener("click", () => {
    state.tab = "nearby"; renderJobs(); renderMobile();
    $("#mNearbyBlock").scrollIntoView({ behavior: "smooth" });
  });
  $("#mCompaniesAll")?.addEventListener("click", () => $("#mCompaniesBlock").scrollIntoView({ behavior: "smooth" }));

  $("#mHeroApply")?.addEventListener("click", () => {
    const top = [...JOBS].sort((a, b) => b.match - a.match)[0];
    if (top) startApply(top.id);
    else toast("Browse jobs below to apply", "info");
  });

  $("#mLoginBtn")?.addEventListener("click", () => showLogin({ title: "Welcome back to JobDozo", mode: "login" }));
  $("#mSignupBtn")?.addEventListener("click", () => showLogin({ title: "Create your JobDozo account", mode: "signup" }));
  $("#mNotifBtn")?.addEventListener("click", () => {
    if (!API.user) { showLogin({ title: "Login to see notifications" }); return; }
    toast("Notifications — check your dashboard for updates", "info");
  });
  $("#mBrandLogo")?.addEventListener("click", (e) => { e.preventDefault(); $("#mMain").scrollTo({ top: 0, behavior: "smooth" }); });

  $("#mBottomNav")?.addEventListener("click", (e) => {
    const item = e.target.closest(".m-nav-item");
    if (!item) return;
    $$(".m-nav-item").forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    const nav = item.dataset.mnav;
    if (nav === "home") $("#mMain").scrollTo({ top: 0, behavior: "smooth" });
    else if (nav === "search") { $("#mSearchInput").focus(); window.scrollTo({ top: 0 }); }
    else if (nav === "nearby") {
      state.tab = "nearby"; renderJobs(); renderMobile();
      $("#mNearbyBlock").scrollIntoView({ behavior: "smooth" });
    }
    else if (nav === "chat") toast("Chat with employers — coming soon", "info");
    else if (nav === "profile") {
      if (!API.user) showLogin({ title: "Login to your profile" });
      else window.location.href = (ROLE_DASHBOARD[API.user.role] || ROLE_DASHBOARD.seeker).url;
    }
  });

  window.addEventListener("resize", () => renderMobile());
}

/* ---------- INIT ---------- */
state.filters = collectFilters();
bindEvents();
renderHeaderAuth();
loadAll();
