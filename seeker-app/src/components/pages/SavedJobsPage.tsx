"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { JobLogo } from "@/components/ui/JobLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { money, timeAgo } from "@/lib/utils";

export default function SavedJobsPage() {
  const { loading, savedJobs, jobs, applications, refresh } = useSeekerData();
  const [compare, setCompare] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    setCompare((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const unsave = async (id: string) => {
    await api.post(`/api/saved/${id}`);
    await refresh();
  };

  const apply = async (jobId: string) => {
    await api.post("/api/applications", { jobId });
    await refresh();
    alert("Application submitted!");
  };

  const similar = jobs.filter((j) => !savedJobs.find((s) => s.id === j.id)).slice(0, 3);
  const compared = savedJobs.filter((j) => compare.includes(j.id));

  if (loading) return <PageSkeleton />;

  return (
    <>
      {compared.length > 1 && (
        <GlassCard title="Compare Jobs">
          <div className="grid-3">
            {compared.map((j) => (
              <div key={j.id} style={{ fontSize: ".8rem" }}>
                <strong>{j.title}</strong>
                <p>{j.company}</p>
                <p>{money(j.salary)}/mo • {j.distance} KM</p>
                <p>Match {j.match}%</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="grid-3">
        {savedJobs.length ? savedJobs.map((j) => {
          const applied = applications.some((a) => a.jobId === j.id);
          const days = j.postedAt ? Math.max(0, 30 - Math.round((Date.now() - new Date(j.postedAt).getTime()) / 864e5)) : 14;
          return (
            <GlassCard key={j.id}>
              <div className="rec-row" style={{ border: "none", padding: 0 }}>
                <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} size="lg" />
                <div className="rec-mid">
                  <strong>{j.title}</strong>
                  <small>{j.company}</small>
                  <p style={{ margin: "6px 0", fontWeight: 800, color: "var(--ink)" }}>{money(j.salary)}<span style={{ fontWeight: 600, color: "var(--muted)" }}>/mo</span></p>
                  <span className="match-pill">Closes in ~{days} days</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="btn-primary btn-sm" disabled={applied} onClick={() => apply(j.id)}>{applied ? "Applied" : "Apply Now"}</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => unsave(j.id)}>Remove</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => toggleCompare(j.id)}>{compare.includes(j.id) ? "Comparing" : "Compare"}</button>
              </div>
            </GlassCard>
          );
        }) : <div style={{ gridColumn: "1/-1" }}><EmptyState icon="fa-heart" title="No saved jobs" desc="Save jobs while browsing to track them here." action={<a href="/" className="btn-primary">Browse Jobs</a>} /></div>}
      </div>

      {similar.length > 0 && (
        <GlassCard title="Similar Jobs You May Like">
          {similar.map((j) => (
            <div key={j.id} className="saved-row">
              <JobLogo logo={j.logo} bg={j.logoBg} />
              <div className="saved-mid"><strong>{j.title}</strong><small>{j.company} • Posted {timeAgo(j.postedAt)}</small></div>
              <span className="match-pill">{j.match}%</span>
            </div>
          ))}
        </GlassCard>
      )}
    </>
  );
}
