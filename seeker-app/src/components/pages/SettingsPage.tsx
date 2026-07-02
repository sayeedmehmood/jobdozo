"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/utils";

const TOGGLES = [
  { g: "notifications", k: "applicationUpdates", l: "Application updates" },
  { g: "notifications", k: "messages", l: "New messages" },
  { g: "notifications", k: "jobAlerts", l: "Job alerts" },
  { g: "privacy", k: "profileVisible", l: "Profile visible" },
  { g: "privacy", k: "showPhone", l: "Show phone" },
  { g: "privacy", k: "showSalary", l: "Show salary" },
] as const;

export default function SettingsPage() {
  const { loading, settings, subscription, refresh } = useSeekerData();
  const s = (settings.settings || {}) as Record<string, Record<string, boolean>>;
  const acc = settings.account as Record<string, string>;
  const prefs = (settings.settings as { preferences?: Record<string, unknown> })?.preferences || {};
  const [state, setState] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [pw, setPw] = useState({ current: "", next: "" });

  useEffect(() => {
    if (loading) return;
    const init: Record<string, boolean> = {};
    TOGGLES.forEach((t) => { init[`${t.g}.${t.k}`] = !!(s?.[t.g] as Record<string, boolean>)?.[t.k]; });
    setState(init);
    setTheme(String(prefs.theme || "light"));
    setLang(String(prefs.language || "en"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, settings]);

  const save = async () => {
    const body = { notifications: {} as Record<string, boolean>, privacy: {} as Record<string, boolean>, preferences: { theme, language: lang } };
    TOGGLES.forEach((t) => { body[t.g as "notifications" | "privacy"][t.k] = !!state[`${t.g}.${t.k}`]; });
    await api.patch("/api/users/me/settings", body);
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    localStorage.setItem("jm_theme", theme === "dark" ? "dark" : "light");
    await refresh();
    alert("Settings saved!");
  };

  const changePw = async () => {
    await api.post("/api/users/me/password", { currentPassword: pw.current, newPassword: pw.next });
    setPw({ current: "", next: "" });
    alert("Password updated!");
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2">
      <GlassCard title="Account">
        <div className="field"><label>Email</label><input readOnly value={acc.email || ""} /></div>
        <div className="field"><label>Name</label><input readOnly value={acc.name || ""} /></div>
        <p style={{ fontSize: ".72rem", color: "var(--muted)" }}>Joined {fmtDate(acc.createdAt)} • {String((subscription.subscription as { planName?: string }).planName || "Free")}</p>
      </GlassCard>
      <GlassCard title="Security">
        <div className="field"><label>Current password</label><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="field"><label>New password</label><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        <button type="button" className="btn-primary" onClick={changePw}>Update Password</button>
      </GlassCard>
      <GlassCard title="Notifications & Privacy">
        {TOGGLES.map((t) => (
          <div key={`${t.g}.${t.k}`} className="settings-row">
            <strong>{t.l}</strong>
            <label className="switch"><input type="checkbox" checked={!!state[`${t.g}.${t.k}`]} onChange={(e) => setState({ ...state, [`${t.g}.${t.k}`]: e.target.checked })} /><span /></label>
          </div>
        ))}
      </GlassCard>
      <GlassCard title="Appearance">
        <div className="field"><label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="field"><label>Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <button type="button" className="btn-primary" onClick={save}>Save Settings</button>
      </GlassCard>
    </div>
  );
}
