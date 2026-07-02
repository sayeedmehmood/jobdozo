/** Mount multiple Next.js portal apps on one Express server. */
"use strict";

const path = require("path");

const PORTALS = [
  { name: "seeker", dir: "seeker-app", prefix: "/seeker", env: "SEEKER_NEXT" },
  { name: "employer", dir: "employer-app", prefix: "/employer", env: "EMPLOYER_NEXT" },
  { name: "recruiter", dir: "recruiter-app", prefix: "/recruiter", env: "RECRUITER_NEXT" },
  { name: "admin", dir: "admin-app", prefix: "/admin", env: "ADMIN_NEXT" },
  { name: "super-admin", dir: "super-admin-app", prefix: "/super-admin", env: "SUPER_ADMIN_NEXT" },
];

async function mountPortals(app, root) {
  const mounted = [];
  for (const p of PORTALS) {
    if (process.env[p.env] === "0") continue;
    const dir = path.join(root, p.dir);
    try {
      const next = require(path.join(dir, "node_modules/next"));
      const instance = next({
        dev: process.env.NODE_ENV !== "production",
        dir,
        conf: process.env.NODE_ENV === "production" ? { distDir: ".next" } : undefined,
      });
      await instance.prepare();
      const handle = instance.getRequestHandler();
      const prefixes = PORTALS.map((x) => x.prefix);
      app.use((req, res, nextFn) => {
        const match = req.path === p.prefix || req.path.startsWith(p.prefix + "/");
        if (!match) return nextFn();
        const other = prefixes.some((pref) => pref !== p.prefix && (req.path === pref || req.path.startsWith(pref + "/")));
        if (other) return nextFn();
        return handle(req, res);
      });
      mounted.push({ name: p.name, prefix: p.prefix });
      console.log(`[${p.name}] Next.js portal mounted at ${p.prefix}/dashboard`);
    } catch (e) {
      console.warn(`[${p.name}] Next.js portal unavailable:`, e.message);
      console.warn(`[${p.name}] Run: cd ${p.dir} && npm install && npm run build`);
    }
  }
  return mounted;
}

module.exports = { PORTALS, mountPortals };
