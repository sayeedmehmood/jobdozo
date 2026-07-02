"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePortalData } from "@/context/PortalDataContext";
import { money, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";

export function Topbar({ onMenuClick, search, onSearchChange }: {
  onMenuClick: () => void; search: string; onSearchChange: (v: string) => void;
}) {
  const { user, logout } = useAuth();
  const { notifications, badges } = usePortalData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;
  const initials = (user?.company || user?.name || "E").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="topbar employer-topbar">
      <button type="button" className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Menu"><i className="fa-solid fa-bars" /></button>
      <div className="topbar-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input type="search" placeholder="Search jobs, candidates, applications..." value={search} onChange={(e) => onSearchChange(e.target.value)} aria-label="Global search" />
      </div>
      <div className="wallet-pill">
        <i className="fa-solid fa-wallet" />
        <div><small>Wallet</small><strong>{money(Number(user?.wallet || 0))}</strong></div>
      </div>
      <div className="topbar-actions">
        <div className="dropdown-wrap">
          <button type="button" className="icon-btn" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}>
            <i className="fa-regular fa-bell" />{unread > 0 && <span className="pill-badge">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="dropdown-panel">
              <div className="dropdown-head"><span>Notifications</span><button type="button" onClick={() => api.post("/api/notifications/read-all")}>Mark read</button></div>
              <div className="dropdown-list">
                {notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className="notif-item"><span style={{ background: n.bg }}><i className={`fa-solid ${n.icon}`} /></span><div><p>{n.text}</p><small>{timeAgo(n.createdAt)}</small></div></div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button type="button" className="icon-btn" onClick={() => router.push("/messages")}>
          <i className="fa-regular fa-comment-dots" />{badges.messages > 0 && <span className="pill-badge">{badges.messages}</span>}
        </button>
        <div className="dropdown-wrap">
          <button type="button" className="profile-btn" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}>
            <span className="avatar sm">{initials}</span>
            <span className="profile-text"><strong>{user?.company}</strong><small>Employer</small></span>
          </button>
          {profileOpen && (
            <div className="dropdown-panel align-right">
              <Link href="/company-profile" className="dropdown-link" onClick={() => setProfileOpen(false)}>Company Profile</Link>
              <Link href="/settings" className="dropdown-link" onClick={() => setProfileOpen(false)}>Settings</Link>
              <button type="button" className="dropdown-link danger" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
