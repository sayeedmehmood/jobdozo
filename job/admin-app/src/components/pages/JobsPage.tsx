"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";

export default function JobsPage() {
  const { loading, jobs, applications, refresh } = useEmployerData();
  const [tab, setTab] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "IT Jobs", salary: 20000, openings: 1, desc: "" });

  const filtered = useMemo(() => {
    if (tab === "active") return jobs.filter((j) => j.status === "active");
    if (tab === "draft") return jobs.filter((j) => j.status === "draft");
    return jobs.filter((j) => j.status !== "active");
  }, [jobs, tab]);

  const createJob = async () => {
    await api.post("/api/jobs", { ...form, desc: form.desc || form.title });
    setShowForm(false);
    await refresh();
  };

  if (loading) return <PageSkeleton />;

  return (
    <>
      <div className="filter-bar">
        {["active", "draft", "closed"].map((t) => (
          <button key={t} type="button" className={`btn-outline btn-sm ${tab === t ? "active-tab" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
        <button type="button" className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Create Job</button>
      </div>
      {showForm && (
        <GlassCard title="Create New Job">
          <div className="form-grid">
            <div className="field"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field"><label>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="field"><label>Salary (₹/mo)</label><input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: +e.target.value })} /></div>
            <div className="field"><label>Openings</label><input type="number" value={form.openings} onChange={(e) => setForm({ ...form, openings: +e.target.value })} /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Description</label><textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></div>
          </div>
          <button type="button" className="btn-primary" onClick={createJob}>Publish Job</button>
        </GlassCard>
      )}
      <div className="grid-2">
        {filtered.map((j) => {
          const apps = applications.filter((a) => a.jobId === j.id).length;
          return (
            <GlassCard key={j.id} title={j.title}>
              <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>{j.category} • {j.status} • {money(j.salary)}/mo</p>
              <p><b>{apps}</b> applications • <b>{j.views || 0}</b> views</p>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn-outline btn-sm" onClick={() => api.patch(`/api/jobs/${j.id}`, { status: j.status === "active" ? "paused" : "active" }).then(refresh)}>{j.status === "active" ? "Pause" : "Activate"}</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => alert("Promote job (demo)")}>Promote</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => alert("Duplicated (demo)")}>Duplicate</button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}
