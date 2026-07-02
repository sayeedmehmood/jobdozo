"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { useSeekerData } from "@/context/SeekerDataContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { badges, subscription } = useSeekerData();
  const { user } = useAuth();
  const first = user?.name?.split(" ")[0] || "U";

  return (
    <>
      <div className={cn("sidebar-backdrop", mobileOpen && "open")} onClick={onClose} aria-hidden />
      <aside className={cn("sidebar", mobileOpen && "open")} aria-label="Main navigation">
        <Link href="/" className="sidebar-brand" onClick={onClose}>
          <span className="brand-icon"><img src="/seeker/icon.png" alt="JobDozo" /></span>
          <span>
            <strong>Job<em>Dozo</em></strong>
            <small>Job Seeker</small>
          </span>
        </Link>

        <div className="sidebar-profile">
          <div className="avatar">{first[0]}</div>
          <div>
            <strong>{user?.name}</strong>
            <small><i className="fa-solid fa-location-dot" /> {user?.location || "India"}</small>
          </div>
          <span className="online-dot" title="Open to work" />
        </div>

        <Link href="/" className="find-jobs-btn" onClick={onClose}>
          <i className="fa-solid fa-magnifying-glass" /> Find Jobs
        </Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", active && "active")}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
                {badge > 0 && <b className="nav-badge">{badge}</b>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("sidebar-boost", subscription.premium && "premium")}>
          <div>
            <strong>{subscription.premium ? "Premium Active" : "Get Hired Faster"}</strong>
            <small>{subscription.premium ? "Manage your plan" : "Stand out with Premium badge"}</small>
            <Link href="/subscription" className="boost-btn" onClick={onClose}>
              {subscription.premium ? "Manage Plan" : "Go Premium"}
            </Link>
          </div>
          <i className="fa-solid fa-medal" />
        </div>
      </aside>
    </>
  );
}
