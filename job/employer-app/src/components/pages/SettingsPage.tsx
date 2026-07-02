"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { loading, settings, refresh } = useEmployerData();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  if (loading || !settings) return <PageSkeleton />;
  const raw = settings as { settings?: Record<string, unknown>; account?: Record<string, unknown> };
  const s = raw.settings || {};
  const account = raw.account || {};
  const notif = { ...(s.notifications as Record<string, boolean> || {}), ...prefs };

  const save = async () => {
    await api.patch("/api/employer/settings", { notifications: notif });
    await refresh();
  };

  return (
    <div className="grid-2">
      <GlassCard title="Account & Security">
        <p>Email: <strong>{String(account.email || "—")}</strong></p>
        <p style={{ marginTop: 8 }}>Company: <strong>{String(account.company || "—")}</strong></p>
        <button type="button" className="btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => alert("Password change (demo)")}>Change Password</button>
      </GlassCard>
      <GlassCard title="Notification Preferences">
        {Object.entries(notif).map(([k, v]) => (
          <label key={k} className="toggle-row">
            <span>{k}</span>
            <input type="checkbox" checked={!!v} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
          </label>
        ))}
        <button type="button" className="btn-primary btn-sm" style={{ marginTop: 12 }} onClick={save}>Save</button>
      </GlassCard>
    </div>
  );
}
