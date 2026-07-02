#!/usr/bin/env node
/** Scaffold a role portal from employer-app template. */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(ROOT, "employer-app");

const PORTALS = {
  recruiter: {
    basePath: "/recruiter",
    role: "recruiter",
    tokenKey: "jm_recruiter_token",
    userKey: "jm_recruiter_user",
    packageName: "recruiter-app",
    title: "Recruiter Portal",
    demo: { email: "recruiter@jobdozo.in", password: "recruiter123" },
    nav: [
      ["Dashboard", "/dashboard", "fa-solid fa-house"],
      ["Assigned Jobs", "/assigned-jobs", "fa-solid fa-briefcase"],
      ["Candidate Pool", "/candidate-pool", "fa-solid fa-user-group"],
      ["Applications", "/applications", "fa-regular fa-file-lines", "applications"],
      ["Interview Management", "/interviews", "fa-regular fa-calendar-check"],
      ["Talent Search", "/talent-search", "fa-solid fa-magnifying-glass"],
      ["Communications", "/communications", "fa-regular fa-comment-dots", "messages"],
      ["Reports", "/reports", "fa-solid fa-chart-column"],
      ["Team Tasks", "/team-tasks", "fa-solid fa-list-check"],
      ["Settings", "/settings", "fa-solid fa-gear"],
    ],
    routes: ["dashboard", "assigned-jobs", "candidate-pool", "applications", "interviews", "talent-search", "communications", "reports", "team-tasks", "settings"],
  },
  admin: {
    basePath: "/admin",
    role: "admin",
    tokenKey: "jm_admin_token",
    userKey: "jm_admin_user",
    packageName: "admin-app",
    title: "Admin Portal",
    demo: { email: "admin@jobdozo.in", password: "admin123" },
    nav: [
      ["Dashboard", "/dashboard", "fa-solid fa-house"],
      ["User Management", "/users", "fa-solid fa-users"],
      ["Employer Management", "/employers", "fa-regular fa-building"],
      ["Job Management", "/jobs", "fa-solid fa-briefcase"],
      ["Candidate Management", "/candidates", "fa-solid fa-user-group"],
      ["Categories", "/categories", "fa-solid fa-tags"],
      ["Skills Management", "/skills", "fa-solid fa-clipboard-list"],
      ["Subscription Plans", "/subscriptions", "fa-solid fa-crown"],
      ["Transactions", "/transactions", "fa-regular fa-credit-card"],
      ["Reports & Analytics", "/reports", "fa-solid fa-chart-pie"],
      ["CMS Pages", "/cms", "fa-regular fa-file-lines"],
      ["Support Tickets", "/support-tickets", "fa-regular fa-life-ring"],
      ["Notifications", "/notifications", "fa-regular fa-bell"],
      ["Settings", "/settings", "fa-solid fa-gear"],
    ],
    routes: ["dashboard", "users", "employers", "jobs", "candidates", "categories", "skills", "subscriptions", "transactions", "reports", "cms", "support-tickets", "notifications", "settings"],
  },
  "super-admin": {
    basePath: "/super-admin",
    role: "super-admin",
    tokenKey: "jm_super_admin_token",
    userKey: "jm_super_admin_user",
    packageName: "super-admin-app",
    title: "Super Admin Portal",
    demo: { email: "super@jobdozo.in", password: "super123" },
    nav: [
      ["Global Dashboard", "/dashboard", "fa-solid fa-globe"],
      ["All Admins", "/admins", "fa-solid fa-user-shield"],
      ["User Management", "/users", "fa-solid fa-users"],
      ["Employer Verification", "/employer-verification", "fa-solid fa-certificate"],
      ["Subscription Control", "/subscriptions", "fa-solid fa-crown"],
      ["Revenue Analytics", "/revenue", "fa-solid fa-indian-rupee-sign"],
      ["Payment Gateway", "/payments", "fa-regular fa-credit-card"],
      ["AI Management", "/ai", "fa-solid fa-robot"],
      ["API Management", "/api-mgmt", "fa-solid fa-plug"],
      ["Audit Logs", "/audit-logs", "fa-solid fa-clock-rotate-left"],
      ["System Monitoring", "/monitoring", "fa-solid fa-server"],
      ["Security Center", "/security", "fa-solid fa-shield-halved"],
      ["Database Management", "/database", "fa-solid fa-database"],
      ["Platform Settings", "/settings", "fa-solid fa-gear"],
    ],
    routes: ["dashboard", "admins", "users", "employer-verification", "subscriptions", "revenue", "payments", "ai", "api-mgmt", "audit-logs", "monitoring", "security", "database", "settings"],
  },
};

function copyDir(src, dest, skip = new Set(["node_modules", ".next"])) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (skip.has(name)) continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d, skip);
    else fs.copyFileSync(s, d);
  }
}

function writeNav(cfg, dest) {
  const badges = cfg.nav.filter((n) => n[3]).map((n) => `  | "${n[3]}"`).join("\n");
  const items = cfg.nav.map((n) => {
    const badge = n[3] ? `, badgeKey: "${n[3]}"` : "";
    return `  { label: "${n[0]}", href: "${n[1]}", icon: "${n[2]}"${badge} },`;
  }).join("\n");
  const content = `export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: ${badges ? badges.replace(/\s+\| /g, " | ").replace(/^\s+\| /, "") : "never"};
};

export const NAV_ITEMS: NavItem[] = [
${items}
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((n) => [n.href.split("?")[0], n.label])
);
`;
  fs.writeFileSync(path.join(dest, "src/lib/nav.ts"), content);
}

function writeRoutes(cfg, dest) {
  const portalDir = path.join(dest, "src/app/(portal)");
  for (const r of cfg.routes) {
    if (r === "dashboard") continue;
    const dir = path.join(portalDir, r);
    fs.mkdirSync(dir, { recursive: true });
    const comp = r.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
    fs.writeFileSync(path.join(dir, "page.tsx"), `import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const Page = dynamic(() => import("@/components/pages/ModulePage"), { loading: () => <PageSkeleton /> });

export default function Route() { return <Page module="${comp}" />; }
`);
  }
}

function patchFile(file, replacements) {
  let txt = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) txt = txt.split(from).join(to);
  fs.writeFileSync(file, txt);
}

for (const [key, cfg] of Object.entries(PORTALS)) {
  const dest = path.join(ROOT, cfg.packageName);
  if (!fs.existsSync(dest)) copyDir(TEMPLATE, dest);
  writeNav(cfg, dest);

  patchFile(path.join(dest, "next.config.mjs"), [
    ['basePath: "/employer"', `basePath: "${cfg.basePath}"`],
    ["STANDALONE_EMPLOYER", `STANDALONE_${key.toUpperCase().replace("-", "_")}`],
  ]);
  patchFile(path.join(dest, "package.json"), [
    ['"name": "employer-app"', `"name": "${cfg.packageName}"`],
  ]);
  patchFile(path.join(dest, "src/lib/api.ts"), [
    ['const TOKEN_KEY = "jm_employer_token"', `const TOKEN_KEY = "${cfg.tokenKey}"`],
    ['const USER_KEY = "jm_employer_user"', `const USER_KEY = "${cfg.userKey}"`],
    ['window.location.href = "/employer/dashboard"', `window.location.href = "${cfg.basePath}/dashboard"`],
    ['email: "hr@techcorp.in", password: "employer123"', `email: "${cfg.demo.email}", password: "${cfg.demo.password}"`],
  ]);
  patchFile(path.join(dest, "src/context/AuthContext.tsx"), [
    ['role !== "employer"', `role !== "${cfg.role}"`],
    ['if (resp.user.role !== "employer")', `if (resp.user.role !== "${cfg.role}")`],
    ['throw new Error("Please use an employer account")', `throw new Error("Please use a ${cfg.role} account")`],
  ]);
  patchFile(path.join(dest, "src/app/layout.tsx"), [
    ["Employer Hiring Platform", cfg.title],
    ["/employer/icon.png", `${cfg.basePath}/icon.png`],
  ]);
  patchFile(path.join(dest, "src/components/layout/Sidebar.tsx"), [
    ['<small>Employer</small>', `<small>${cfg.role.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</small>`],
    ['src="/employer/icon.png"', `src="${cfg.basePath}/icon.png"`],
    ['Verified Employer', cfg.role === "admin" || cfg.role === "super-admin" ? "Platform Admin" : "Recruiter Account"],
  ]);

  const ctxFile = path.join(dest, "src/context/EmployerDataContext.tsx");
  if (fs.existsSync(ctxFile)) {
    const portalCtx = path.join(dest, "src/context/PortalDataContext.tsx");
    let ctx = fs.readFileSync(ctxFile, "utf8");
    ctx = ctx.replace(/Employer/g, "Portal").replace(/employer/g, cfg.role.replace("-", "_"));
    ctx = ctx.replace(/useEmployerData/g, "usePortalData");
    ctx = ctx.replace(/EmployerDataProvider/g, "PortalDataProvider");
    ctx = ctx.replace(/EmployerDataContext/g, "PortalDataContext");
    ctx = ctx.replace(new RegExp(cfg.role.replace("-", "_") + '\\/dashboard', "g"), `${cfg.role}/dashboard`);
    fs.writeFileSync(portalCtx, ctx);
    fs.unlinkSync(ctxFile);
  }

  patchFile(path.join(dest, "src/components/layout/PortalShell.tsx"), [
    ["EmployerDataProvider", "PortalDataProvider"],
    ["EmployerDataContext", "PortalDataContext"],
    ["employer-shell", `${key}-shell`],
    ['"Employer"', `"${cfg.role}"`],
    ['href="/jobs"', 'href="/assigned-jobs"'],
  ]);

  fs.writeFileSync(path.join(dest, "src/components/pages/ModulePage.tsx"), `"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PAGE_TITLES } from "@/lib/nav";
import { usePathname } from "next/navigation";

export default function ModulePage({ module }: { module?: string }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname.split("?")[0]] || module || "Module";
  return (
    <GlassCard title={title}>
      <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
        {title} module — role-scoped UI with API-ready architecture.
      </p>
    </GlassCard>
  );
}
`);

  writeRoutes(cfg, dest);
  console.log("Scaffolded", cfg.packageName);
}
