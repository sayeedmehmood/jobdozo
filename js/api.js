/* ============ JobDozo shared frontend layer ============
 * API client + JWT auth + Socket.IO + login overlay + dark mode.
 * Loaded by all 4 pages BEFORE the page script.
 */
"use strict";

const API = {
  token: localStorage.getItem("jm_token") || null,
  user: JSON.parse(localStorage.getItem("jm_user") || "null"),

  async req(path, { method = "GET", body } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers.Authorization = "Bearer " + this.token;
    let res;
    try {
      res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error("Cannot reach JobDozo server. Is it running? (npm start)");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
    return data;
  },
  get(p) { return this.req(p); },
  post(p, body) { return this.req(p, { method: "POST", body }); },
  patch(p, body) { return this.req(p, { method: "PATCH", body }); },
  del(p) { return this.req(p, { method: "DELETE" }); },

  setSession(token, user) {
    this.token = token; this.user = user;
    localStorage.setItem("jm_token", token);
    localStorage.setItem("jm_user", JSON.stringify(user));
  },
  logout(redirect = "index.html") {
    this.token = null; this.user = null;
    localStorage.removeItem("jm_token");
    localStorage.removeItem("jm_user");
    window.location.href = redirect;
  },
  isRole(role) { return !!this.user && this.user.role === role; },
};

/* ---------- Socket.IO (real-time sync) ---------- */
let socket = { on() {}, emit() {}, connected: false };
function connectSocket() {
  if (typeof io === "undefined") return;
  socket = io({ auth: { token: API.token } });
  socket.on("connect", () => console.log("[realtime] connected"));
}
connectSocket();

/* ---------- Login / Signup overlay ---------- */
const DEMO_ACCOUNTS = {
  seeker: { email: "rahul@gmail.com", password: "rahul123", label: "Job Seeker (Rahul)" },
  employer: { email: "hr@techcorp.in", password: "employer123", label: "Employer (TechCorp)" },
  admin: { email: "admin@JobDozo.in", password: "admin123", label: "Admin" },
};

function buildAuthOverlay() {
  if (document.getElementById("jmAuthOverlay")) return;
  const el = document.createElement("div");
  el.id = "jmAuthOverlay";
  el.className = "jm-auth-overlay";
  el.innerHTML = `
    <div class="jm-auth-card">
      <button class="jm-auth-close" id="jmAuthClose"><i class="fa-solid fa-xmark"></i></button>
      <div class="jm-auth-brand"><span class="jm-auth-logo"><img src="assets/icon.png" alt="" /></span> Job<em>Dozo</em></div>
      <h3 id="jmAuthTitle">Login to continue</h3>
      <div class="jm-auth-tabs">
        <button class="jm-atab active" data-mode="login">Login</button>
        <button class="jm-atab" data-mode="signup">Sign Up</button>
      </div>
      <form id="jmAuthForm">
        <input type="text" id="jmName" placeholder="Full name" style="display:none" autocomplete="name" />
        <select id="jmRole" style="display:none">
          <option value="seeker">I am a Job Seeker</option>
          <option value="employer">I am an Employer</option>
        </select>
        <input type="email" id="jmEmail" placeholder="Email address" required autocomplete="email" />
        <input type="password" id="jmPassword" placeholder="Password" required autocomplete="current-password" />
        <div class="jm-auth-err" id="jmAuthErr"></div>
        <button type="submit" class="jm-auth-submit" id="jmAuthSubmit">Login</button>
      </form>
      <div class="jm-demo">
        <small>Quick demo login:</small>
        <div class="jm-demo-btns">
          <button data-demo="seeker">Job Seeker</button>
          <button data-demo="employer">Employer</button>
          <button data-demo="admin">Admin</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);

  let mode = "login";
  const setMode = (m) => {
    mode = m;
    el.querySelectorAll(".jm-atab").forEach((t) => t.classList.toggle("active", t.dataset.mode === m));
    el.querySelector("#jmName").style.display = m === "signup" ? "" : "none";
    el.querySelector("#jmRole").style.display = m === "signup" ? "" : "none";
    el.querySelector("#jmAuthSubmit").textContent = m === "signup" ? "Create Account" : "Login";
    el.querySelector("#jmAuthErr").textContent = "";
  };
  el.querySelectorAll(".jm-atab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));

  el.querySelector("#jmAuthForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = el.querySelector("#jmAuthErr");
    err.textContent = "";
    try {
      const email = el.querySelector("#jmEmail").value.trim();
      const password = el.querySelector("#jmPassword").value;
      let resp;
      if (mode === "signup") {
        resp = await API.post("/api/auth/register", {
          name: el.querySelector("#jmName").value.trim(),
          role: el.querySelector("#jmRole").value,
          email, password,
        });
      } else {
        resp = await API.post("/api/auth/login", { email, password });
      }
      finishLogin(resp);
    } catch (ex) { err.textContent = ex.message; }
  });

  el.querySelectorAll("[data-demo]").forEach((b) => b.addEventListener("click", async () => {
    const err = el.querySelector("#jmAuthErr");
    err.textContent = "";
    try {
      const acc = DEMO_ACCOUNTS[b.dataset.demo];
      finishLogin(await API.post("/api/auth/login", { email: acc.email, password: acc.password }));
    } catch (ex) { err.textContent = ex.message; }
  }));

  el.querySelector("#jmAuthClose").addEventListener("click", () => {
    if (el.dataset.locked === "true") return;
    el.classList.remove("open");
  });
}

let onLoginCb = null;
function finishLogin(resp) {
  API.setSession(resp.token, resp.user);
  const requiredRole = document.body.dataset.role;
  if (requiredRole && resp.user.role !== requiredRole) {
    window.location.href = ROLE_HOME[resp.user.role] || "/";
    return;
  }
  window.location.reload();
}

const ROLE_HOME = {
  seeker: "/seeker/dashboard",
  employer: "/employer/dashboard",
  recruiter: "/recruiter/dashboard",
  admin: "/admin/dashboard",
  "super-admin": "/super-admin/dashboard",
};

/** Show login overlay. locked=true → cannot be dismissed (role-gated pages). */
function showLogin({ locked = false, title = "Login to continue", mode = "login" } = {}) {
  buildAuthOverlay();
  const el = document.getElementById("jmAuthOverlay");
  el.dataset.locked = locked;
  el.querySelector("#jmAuthTitle").textContent = title;
  el.querySelector(".jm-auth-close").style.display = locked ? "none" : "";
  const tab = el.querySelector(`.jm-atab[data-mode="${mode}"]`);
  if (tab) tab.click();
  el.classList.add("open");
}

/** Gate the page: body[data-role] decides who may view it. */
function requireRole() {
  const role = document.body.dataset.role;
  if (!role) return true;
  if (API.isRole(role)) return true;
  const titles = { seeker: "Job Seeker login", employer: "Employer login", admin: "Admin login" };
  showLogin({ locked: true, title: titles[role] || "Login required" });
  return false;
}

/* ---------- Dark / light mode ---------- */
(function themeInit() {
  const saved = localStorage.getItem("jm_theme") || "light";
  document.documentElement.dataset.theme = saved;
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.createElement("button");
    btn.id = "jmThemeToggle";
    btn.className = "jm-theme-toggle";
    btn.title = "Toggle dark / light mode";
    btn.innerHTML = saved === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("jm_theme", next);
      btn.innerHTML = next === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
    document.body.appendChild(btn);
  });
})();

/* ---------- shared toast (pages may override) ---------- */
function jmToast(msg, type = "success") {
  const box = document.getElementById("toasts");
  if (!box) return alert(msg);
  const icons = { success: "fa-circle-check", info: "fa-circle-info", warn: "fa-triangle-exclamation" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3400);
}
