"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { usePortalData } from "@/context/PortalDataContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { badges } = usePortalData();
  const { user } = useAuth();
  const initials = (user?.company || user?.name || "EM").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div className={cn("sidebar-backdrop", mobileOpen && "open")} onClick={onClose} aria-hidden />
      <aside className={cn("sidebar employer-sidebar", mobileOpen && "open")}>
        <Link href="/dashboard" className="sidebar-brand" onClick={onClose}>
          <span className="brand-icon"><img src="/super-admin/icon.png" alt="JobDozo" /></span>
          <span><strong>Job<em>Dozo</em></strong><small>Super Admin</small></span>
        </Link>

        <div className="company-switcher">
          <span className="avatar sm">{initials}</span>
          <div><strong>{user?.company || user?.name}</strong><small>{user?.verified ? "Platform Admin" : "Employer Account"}</small></div>
        </div>

        <Link href="/jobs" className="post-job-side" onClick={onClose}><i className="fa-solid fa-plus" /> Post New Job</Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link key={item.href} href={item.href} className={cn("nav-item", active && "active")} onClick={onClose} aria-current={active ? "page" : undefined}>
                <i className={item.icon} /><span>{item.label}</span>
                {badge > 0 && <b className="nav-badge">{badge}</b>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-boost employer-boost">
          <div>
            <strong>Boost Your Jobs</strong>
            <small>Get 3× more quality applications</small>
            <Link href="/subscription" className="boost-btn" onClick={onClose}>Upgrade</Link>
          </div>
          <i className="fa-solid fa-rocket" />
        </div>
      </aside>
    </>
  );
}
