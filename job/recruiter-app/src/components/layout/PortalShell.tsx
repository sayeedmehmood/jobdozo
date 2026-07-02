"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumbs } from "./Breadcrumbs";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { PortalDataProvider } from "@/context/PortalDataContext";
import { PAGE_TITLES } from "@/lib/nav";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] || "Dashboard";

  useEffect(() => {
    setMobileOpen(false);
    document.body.classList.add("page-enter");
    const t = setTimeout(() => document.body.classList.remove("page-enter"), 320);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="portal-shell recruiter-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="portal-main">
        <Topbar onMenuClick={() => setMobileOpen(true)} search={search} onSearchChange={setSearch} />
        <main className="portal-content" id="main-content">
          <div className="page-head">
            <div>
              <h1>{pathname === "/dashboard" ? `Welcome, ${user?.company || user?.name || "recruiter"}` : title}</h1>
              <Breadcrumbs />
            </div>
            <div className="page-head-actions">
              <Link href="/assigned-jobs" className="btn-primary"><i className="fa-solid fa-plus" /> Post Job</Link>
              <a href="/" className="browse-btn">Browse Site</a>
            </div>
          </div>
          <div className="page-body page-transition">{children}</div>
        </main>
      </div>
      <LoginModal />
      <button type="button" className="theme-fab" aria-label="Toggle theme" onClick={() => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("jm_theme", next);
      }}><i className="fa-solid fa-moon" /></button>
    </div>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalDataProvider>
      <ShellInner>{children}</ShellInner>
    </PortalDataProvider>
  );
}
