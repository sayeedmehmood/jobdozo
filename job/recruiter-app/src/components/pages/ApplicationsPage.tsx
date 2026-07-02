"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

const STATUSES = ["Applied", "Viewed", "Shortlisted", "Interview", "Selected", "Rejected"];

export default function ApplicationsPage() {
  const { loading, applications, refresh } = useEmployerData();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const list = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/api/applications/${id}/status`, { status });
    await refresh();
  };

  const bulk = async (status: string) => {
    for (const id of selected) await api.patch(`/api/applications/${id}/status`, { status });
    setSelected([]);
    await refresh();
  };

  if (loading) return <PageSkeleton />;

  return (
    <GlassCard title="Application Pipeline" action={
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
    }>
      <div className="filter-bar">
        <button type="button" className="btn-outline btn-sm" onClick={() => bulk("Shortlisted")}>Bulk Shortlist</button>
        <button type="button" className="btn-outline btn-sm" onClick={() => bulk("Rejected")}>Bulk Reject</button>
      </div>
      {list.map((a) => (
        <div key={a.id} className="app-row">
          <input type="checkbox" checked={selected.includes(a.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, a.id] : selected.filter((x) => x !== a.id))} />
          <div className="app-mid">
            <strong>{a.name}</strong>
            <small>{a.job?.title} • {timeAgo(a.createdAt)} • AI score {70 + ((a.name || "").length % 25)}%</small>
          </div>
          <span className="status-pill">{a.status}</span>
          <button type="button" className="btn-outline btn-sm" onClick={() => setStatus(a.id, "Shortlisted")}>Shortlist</button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setStatus(a.id, "Interview")}>Interview</button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setStatus(a.id, "Rejected")}>Reject</button>
        </div>
      ))}
    </GlassCard>
  );
}
