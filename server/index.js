/** JobDozo server — Express REST API + Socket.IO + multi-role Next.js portals. */
"use strict";

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const { seed, seedMessages, seedResumes, seedSkillTests, seedJobAlerts, seedSeekerProfiles, seedSubscriptions, seedSeekerSettings } = require("./seed");
const { verify } = require("./auth");
const registerRoutes = require("./routes");
const { mountPortals } = require("./portals");
const { ROLE_HOME } = require("./role-config");

const PORT = process.env.PORT || 8123;
const ROOT = path.join(__dirname, "..");

seed();
seedMessages();
seedResumes();
seedSkillTests();
seedJobAlerts();
seedSeekerProfiles();
seedSubscriptions();
seedSeekerSettings();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) console.log(`[api] ${req.method} ${req.path}`);
  next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const payload = token && verify(token);
  if (payload) {
    socket.data.user = payload;
    socket.join("user:" + payload.id);
    socket.join("role:" + payload.role);
  }
  next();
});

io.on("connection", (socket) => {
  const who = socket.data.user ? `${socket.data.user.name} (${socket.data.user.role})` : "guest";
  console.log(`[socket] connected: ${who}`);
});

registerRoutes(app, io);

/* legacy + role home redirects */
app.get("/seeker.html", (req, res) => res.redirect(302, ROLE_HOME.seeker));
app.get("/employer.html", (req, res) => res.redirect(302, ROLE_HOME.employer));
app.get("/admin.html", (req, res) => res.redirect(302, ROLE_HOME.admin));
app.get("/dashboard", (req, res) => res.redirect(302, ROLE_HOME.seeker));
Object.entries(ROLE_HOME).forEach(([role, home]) => {
  app.get(`/${role === "super-admin" ? "super-admin" : role}`, (req, res) => res.redirect(302, home));
});

async function start() {
  await mountPortals(app, ROOT);

  app.use(express.static(ROOT, { extensions: ["html"] }));

  app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint not found" }));
  app.use((err, req, res, next) => {
    console.error("[error]", err.message);
    res.status(500).json({ error: "Internal server error" });
  });

  server.listen(PORT, () => {
    console.log(`\n  JobDozo full-stack server running:`);
    console.log(`  → Site:         http://localhost:${PORT}/`);
    console.log(`  → Login:        http://localhost:${PORT}/login.html`);
    console.log(`  → Job Seeker:   http://localhost:${PORT}${ROLE_HOME.seeker}`);
    console.log(`  → Employer:     http://localhost:${PORT}${ROLE_HOME.employer}`);
    console.log(`  → Recruiter:    http://localhost:${PORT}${ROLE_HOME.recruiter}`);
    console.log(`  → Admin:        http://localhost:${PORT}${ROLE_HOME.admin}`);
    console.log(`  → Super Admin:  http://localhost:${PORT}${ROLE_HOME["super-admin"]}`);
    console.log(`  → API:          http://localhost:${PORT}/api/health\n`);
  });
}

start().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
