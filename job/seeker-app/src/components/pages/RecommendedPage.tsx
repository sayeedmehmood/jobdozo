"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { JobLogo } from "@/components/ui/JobLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";

export default function RecommendedPage() {
  const { loading, jobs, applications, savedIds, refresh } = useSeekerData();
  const [maxDist, setMaxDist] = useState(50);
  const [minSalary, setMinSalary] = useState(0);

  const recs = useMemo(() => {
    const applied = new Set(applications.map((a) => a.jobId));
    return jobs
      .filter((j) => !applied.has(j.id) && j.distance <= maxDist && j.salary >= minSalary)
      .sort((a, b) => b.match - a.match);
  }, [jobs, applications, maxDist, minSalary]);

  const apply = async (jobId: string) => {
    await api.post("/api/applications", { jobId });
    await refresh();
  };

  const save = async (jobId: string) => {
    await api.post(`/api/saved/${jobId}`);
    await refresh();
  };

  if (loading) return <PageSkeleton />;

  return (
    <>
      <GlassCard title="AI-Powered Recommendations">
        <p style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: 0 }}>Jobs ranked by skills, location, salary fit and your profile strength.</p>
        <div className="filter-bar">
          <label>Max distance: <input type="range" min={1} max={50} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} /> {maxDist} KM</label>
          <label>Min salary: <input type="number" value={minSalary} onChange={(e) => setMinSalary(+e.target.value)} step={1000} /></label>
        </div>
      </GlassCard>

      <div className="grid-3">
        {recs.length ? recs.map((j) => (
          <GlassCard key={j.id}>
            <div className="rec-row" style={{ border: "none", padding: 0 }}>
              <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} size="lg" />
              <div className="rec-mid">
                <strong>{j.title}</strong>
                <small>{j.company}</small>
              </div>
              <span className="match-pill">{j.match}% Match</span>
            </div>
            <p style={{ fontSize: ".78rem", margin: "10px 0" }}><b>{money(j.salary)}</b>/mo • <i className="fa-solid fa-location-dot" /> {j.distance} KM • {j.expLabel}</p>
            <p style={{ fontSize: ".72rem", color: "var(--muted)" }}>Skills: {(j.tags || []).join(", ") || "General fit"}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" className="btn-primary btn-sm" onClick={() => apply(j.id)}>One-Click Apply</button>
              <button type="button" className="btn-outline btn-sm" onClick={() => save(j.id)}><i className={savedIds.includes(j.id) ? "fa-solid fa-heart" : "fa-regular fa-heart"} /></button>
            </div>
          </GlassCard>
        )) : <div style={{ gridColumn: "1/-1" }}><EmptyState title="No matches with current filters" desc="Try widening distance or lowering salary filter." /></div>}
      </div>
    </>
  );
}
