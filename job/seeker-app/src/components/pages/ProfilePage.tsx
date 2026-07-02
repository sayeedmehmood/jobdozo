"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { money } from "@/lib/utils";

export default function ProfilePage() {
  const { loading, profile, refresh } = useSeekerData();
  const { user } = useAuth();
  const p = (profile as { profile?: Record<string, unknown> })?.profile || {};
  const completion = (profile as { completion?: { pct?: number; steps?: Array<{ label: string; done: boolean }> } })?.completion;
  const [form, setForm] = useState({ name: "", location: "", phone: "", bio: "", experience: "Fresher", expectedSalary: 0, openToWork: true });

  useEffect(() => {
    setForm({
      name: user?.name || "",
      location: user?.location || "",
      phone: String(p.phone || ""),
      bio: String(p.bio || ""),
      experience: String(p.experience || "Fresher"),
      expectedSalary: Number(p.expectedSalary || 0),
      openToWork: p.openToWork !== false,
    });
  }, [profile, user, p]);

  const save = async () => {
    await api.patch("/api/users/me/profile", form);
    await refresh();
    alert("Profile saved!");
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2">
      <GlassCard title="Personal Information">
        <div className="form-grid">
          <div className="field"><label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label>Experience</label>
            <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
              {["Fresher", "1 - 3 Years", "3 - 5 Years", "5+ Years"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div className="field"><label>Expected salary (₹/mo)</label><input type="number" value={form.expectedSalary} onChange={(e) => setForm({ ...form, expectedSalary: +e.target.value })} /></div>
          <div className="settings-row"><div><strong>Open to work</strong></div><label className="switch"><input type="checkbox" checked={form.openToWork} onChange={(e) => setForm({ ...form, openToWork: e.target.checked })} /><span /></label></div>
        </div>
        <button type="button" className="btn-primary" style={{ marginTop: 12 }} onClick={save}>Save Profile</button>
      </GlassCard>

      <div>
        <GlassCard title={`Profile Strength — ${completion?.pct ?? 0}%`}>
          <div style={{ height: 8, background: "#e7edf6", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ width: `${completion?.pct ?? 0}%`, height: "100%", background: "linear-gradient(90deg,var(--blue),#5ea0ff)" }} />
          </div>
          {(completion?.steps || []).map((s) => (
            <div key={s.label} style={{ fontSize: ".78rem", padding: "4px 0", color: s.done ? "var(--muted)" : "var(--ink)", textDecoration: s.done ? "line-through" : "none" }}>
              <i className={`fa-solid ${s.done ? "fa-circle-check" : "fa-circle"}`} style={{ marginRight: 8, color: s.done ? "var(--green)" : "#cbd5e1" }} />
              {s.label}
            </div>
          ))}
        </GlassCard>
        <GlassCard title="Employer Preview">
          <strong style={{ color: "var(--ink)" }}>{form.name}</strong>
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>{form.location} • {form.experience}</p>
          <p style={{ fontSize: ".82rem" }}>{form.bio || "Add a bio to stand out."}</p>
          <p style={{ fontSize: ".78rem" }}>Expected: {money(form.expectedSalary)}/mo</p>
        </GlassCard>
        <GlassCard title="Portfolio"><p style={{ fontSize: ".82rem", color: "var(--muted)" }}>Add project links in bio or resume for now (demo).</p></GlassCard>
      </div>
    </div>
  );
}
