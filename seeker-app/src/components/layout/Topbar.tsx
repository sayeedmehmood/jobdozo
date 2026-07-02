"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSeekerData } from "@/context/SeekerDataContext";
import { timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";

export function Topbar({
  onMenuClick,
  search,
  onSearchChange,
}: {
  onMenuClick: () => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const { user, logout } = useAuth();
  const { notifications, badges } = useSeekerData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const first = user?.name?.split(" ")[0] || "U";

  const markAllRead = async () => {
    await api.post("/api/notifications/read-all");
    setNotifOpen(false);
  };

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <i className="fa-solid fa-bars" />
      </button>

      <div className="topbar-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="search"
          placeholder="Search applications, jobs, messages..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Global search"
        />
      </div>

      <div className="topbar-actions">
        <div className="dropdown-wrap">
          <button type="button" className="icon-btn" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} aria-label="Notifications">
            <i className="fa-regular fa-bell" />
            {unreadNotifs > 0 && <span className="pill-badge">{unreadNotifs}</span>}
          </button>
          {notifOpen && (
            <div className="dropdown-panel">
              <div className="dropdown-head">
                <span>Notifications</span>
                <button type="button" onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="dropdown-list">
                {notifications.length ? notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className="notif-item">
                    <span style={{ background: n.bg }}><i className={`fa-solid ${n.icon}`} /></span>
                    <div><p>{n.text}</p><small>{timeAgo(n.createdAt)}</small></div>
                  </div>
                )) : <p className="dropdown-empty">No notifications</p>}
              </div>
            </div>
          )}
        </div>

        <button type="button" className="icon-btn" onClick={() => router.push("/messages")} aria-label="Messages">
          <i className="fa-regular fa-comment-dots" />
          {badges.messages > 0 && <span className="pill-badge">{badges.messages}</span>}
        </button>

        <div className="dropdown-wrap">
          <button type="button" className="profile-btn" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}>
            <span className="avatar sm">{first[0]}</span>
            <span className="profile-text">
              <strong>{user?.name}</strong>
              <small><span className="open-dot" /> Open to Work</small>
            </span>
            <i className="fa-solid fa-chevron-down tiny" />
          </button>
          {profileOpen && (
            <div className="dropdown-panel align-right">
              <Link href="/profile" className="dropdown-link" onClick={() => setProfileOpen(false)}><i className="fa-regular fa-user" /> View Profile</Link>
              <Link href="/resume" className="dropdown-link" onClick={() => setProfileOpen(false)}><i className="fa-regular fa-file-lines" /> My Resume</Link>
              <Link href="/settings" className="dropdown-link" onClick={() => setProfileOpen(false)}><i className="fa-solid fa-gear" /> Settings</Link>
              <Link href="/" className="dropdown-link"><i className="fa-solid fa-magnifying-glass" /> Browse Jobs</Link>
              <button type="button" className="dropdown-link danger" onClick={logout}><i className="fa-solid fa-arrow-right-from-bracket" /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
