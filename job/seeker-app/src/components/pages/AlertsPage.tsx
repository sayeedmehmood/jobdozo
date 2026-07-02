"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";

export default function AlertsPage() {
  const { loading, jobAlerts, refresh } = useSeekerData();
  const settings = (jobAlerts as { settings?: Record<string, unknown> }).settings || {};
  const matches = (jobAlerts as { liveMatches?: Array<Record<string, unknown>> }).liveMatches || [];
  const [keywords, setKeywords] = useState(String((settings.keywords as string[])?.join(", ") || ""));
  const [radius, setRadius] = useState(Number(settings.radius || 25));
  const [enabled, setEnabled] = useState(settings.enabled !== false);
  const [frequency, setFrequency] = useState(String(settings.frequency || "instant"));
  const [email, setEmail] = useState(settings.emailNotify !== false);
  const [sms, setSms] = useState(!!settings.smsNotify);

  const save = async () => {
    await api.patch("/api/users/me/job-alerts", {
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      radius,
      enabled,
      frequency,
      emailNotify: email,
      smsNotify: sms,
    });
    await refresh();
    alert("Alert preferences saved!");
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2">
      <GlassCard title="Create & Manage Alerts">
        <div className="field"><label>Keywords (comma separated)</label><input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="security, delivery, warehouse" /></div>
        <div className="field"><label>Radius (KM)</label><input type="number" value={radius} onChange={(e) => setRadius(+e.target.value)} /></div>
        <div className="settings-row"><div><strong>Alerts enabled</strong></div><label className="switch"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /><span /></label></div>
        <div className="field"><label>Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="settings-row"><div><strong>Email notifications</strong></div><label className="switch"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /><span /></label></div>
        <div className="settings-row"><div><strong>SMS notifications</strong><span>Demo only</span></div><label className="switch"><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /><span /></label></div>
        <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={save}>Save Alerts</button>
      </GlassCard>
      <GlassCard title="Matching Jobs Now">
        {matches.length ? matches.map((m, i) => (
          <div key={i} className="app-row">
            <div className="app-mid"><strong>{String((m.job as { title?: string })?.title || "Job match")}</strong><small>{String(m.reason || "")}</small></div>
          </div>
        )) : <p style={{ color: "var(--muted)", fontSize: ".82rem" }}>No live matches — adjust keywords or radius.</p>}
      </GlassCard>
    </div>
  );
}
