"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { JobLogo } from "@/components/ui/JobLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { STATUS_META, timeAgo } from "@/lib/utils";

export default function ApplicationsPage() {
  const { loading, applications, refresh } = useSeekerData();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = applications;
    if (status !== "all") list = list.filter((a) => a.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((a) => (a.job?.title + " " + a.job?.company).toLowerCase().includes(s));
    }
    return list;
  }, [applications, status, q]);

  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) => !["Rejected", "Selected"].includes(a.status)).length;
    const interviews = applications.filter((a) => a.status === "Interview").length;
    return { total, active, interviews, rate: total ? Math.round((applications.filter((a) => a.status === "Selected").length / total) * 100) : 0 };
  }, [applications]);

  const withdraw = async (id: string) => {
    if (!confirm("Withdraw this application?")) return;
    await api.del(`/api/applications/${id}`);
    await refresh();
  };

  const download = (a: (typeof applications)[0]) => {
    const text = `JobDozo Application\nJob: ${a.job?.title}\nCompany: ${a.job?.company}\nStatus: ${a.status}\nApplied: ${a.createdAt}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `application-${a.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <PageSkeleton />;

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <GlassCard><strong>{stats.total}</strong><small>Total applications</small></GlassCard>
        <GlassCard><strong>{stats.active}</strong><small>Active pipeline</small></GlassCard>
        <GlassCard><strong>{stats.interviews}</strong><small>Interviews</small></GlassCard>
        <GlassCard><strong>{stats.rate}%</strong><small>Selection rate</small></GlassCard>
      </div>

      <GlassCard title="Application Tracker" action={
        <div className="filter-bar" style={{ margin: 0 }}>
          <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      }>
        {filtered.length ? filtered.map((a) => {
          const j = a.job || { title: "Job removed", company: "", logo: "?", logoBg: "#94a3b8", logoColor: "#fff" };
          const m = STATUS_META[a.status] || STATUS_META.Applied;
          return (
            <div key={a.id} className="app-row">
              <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} size="lg" />
              <div className="app-mid">
                <strong>{j.title}</strong>
                <small>{j.company} • Applied {timeAgo(a.createdAt)}</small>
                <div className="track">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= m.dots ? `on ${m.dotCls}` : ""} />)}</div>
              </div>
              <span className={`status-pill ${m.cls}`}>{a.status}</span>
              <button type="button" className="btn-outline btn-sm" onClick={() => download(a)}>Download</button>
              {!["Rejected", "Selected"].includes(a.status) && (
                <button type="button" className="btn-outline btn-sm" onClick={() => withdraw(a.id)}>Withdraw</button>
              )}
            </div>
          );
        }) : <EmptyState icon="fa-file-lines" title="No applications match" />}
      </GlassCard>
    </>
  );
}
