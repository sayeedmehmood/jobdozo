"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumbs } from "./Breadcrumbs";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";
import { SeekerDataProvider } from "@/context/SeekerDataContext";
import { PAGE_TITLES } from "@/lib/nav";
import { usePathname } from "next/navigation";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] || "Dashboard";
  const first = user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    setMobileOpen(false);
    document.body.classList.add("page-enter");
    const t = setTimeout(() => document.body.classList.remove("page-enter"), 320);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="portal-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="portal-main">
        <Topbar onMenuClick={() => setMobileOpen(true)} search={search} onSearchChange={setSearch} />
        <main className="portal-content" id="main-content">
          <div className="page-head">
            <div>
              <h1>{pathname === "/dashboard" ? <>Hi, {first}! <span className="wave">👋</span></> : title}</h1>
              <Breadcrumbs />
            </div>
            <a href="/" className="browse-btn"><i className="fa-solid fa-magnifying-glass" /> Browse Jobs</a>
          </div>
          <div className="page-body page-transition">{children}</div>
        </main>
      </div>
      <LoginModal />
      <button
        type="button"
        className="theme-fab"
        aria-label="Toggle theme"
        onClick={() => {
          const html = document.documentElement;
          const next = html.dataset.theme === "dark" ? "light" : "dark";
          html.dataset.theme = next;
          localStorage.setItem("jm_theme", next);
        }}
      >
        <i className="fa-solid fa-moon" />
      </button>
    </div>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <SeekerDataProvider>
      <ShellInner>{children}</ShellInner>
    </SeekerDataProvider>
  );
}
