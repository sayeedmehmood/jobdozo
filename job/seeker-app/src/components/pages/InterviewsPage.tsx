"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { JobLogo } from "@/components/ui/JobLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { fmtDate } from "@/lib/utils";

export default function InterviewsPage() {
  const { loading, applications } = useSeekerData();
  const interviews = applications.filter((a) => a.status === "Interview");

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2">
      <GlassCard title="Calendar View">
        <div className="grid-3">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const has = i < interviews.length;
            return (
              <div key={i} style={{ textAlign: "center", padding: 12, borderRadius: 12, border: "1px solid var(--line)", background: has ? "#eef5ff" : "#fff" }}>
                <small style={{ color: "var(--muted)" }}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</small>
                <strong style={{ display: "block", fontSize: "1.2rem", color: "var(--ink)" }}>{d.getDate()}</strong>
                {has && <span className="status-pill interview">Interview</span>}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard title="Upcoming Interviews">
        {interviews.length ? interviews.map((a) => (
          <div key={a.id} className="app-row">
            <JobLogo logo={a.job?.logo || "?"} bg={a.job?.logoBg || "#8b5cf6"} />
            <div className="app-mid">
              <strong>{a.job?.title}</strong>
              <small>{a.job?.company} • {fmtDate(a.createdAt)}</small>
            </div>
            <button type="button" className="btn-primary btn-sm" onClick={() => alert("Video interview link opened (demo)")}>Join Video</button>
            <button type="button" className="btn-outline btn-sm" onClick={() => alert("Reschedule request sent (demo)")}>Reschedule</button>
          </div>
        )) : <EmptyState icon="fa-calendar" title="No interviews scheduled" />}
      </GlassCard>

      <GlassCard title="Interview Notes">
        <textarea placeholder="Add preparation notes, questions to ask, follow-up items..." style={{ width: "100%", minHeight: 120, border: "1px solid var(--line)", borderRadius: 12, padding: 12 }} />
        <button type="button" className="btn-primary" style={{ marginTop: 10 }} onClick={() => alert("Notes saved locally (demo)")}>Save Notes</button>
      </GlassCard>
    </div>
  );
}
