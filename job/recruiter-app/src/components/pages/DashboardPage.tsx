"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { usePortalData } from "@/context/PortalDataContext";

export default function DashboardPage() {
  const { loading, dashboard } = usePortalData();
  if (loading || !dashboard) return <PageSkeleton />;
  const stats = dashboard.stats as Record<string, number>;
  const progress = dashboard.hiringProgress as Record<string, number>;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Open Positions" value={stats.openPositions} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" icon={<i className="fa-solid fa-briefcase" />} />
        <StatCard label="Assigned Candidates" value={stats.assignedCandidates} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" icon={<i className="fa-solid fa-user-group" />} />
        <StatCard label="Pending Reviews" value={stats.pendingReviews} gradient="linear-gradient(135deg,#f59e0b,#ea580c)" icon={<i className="fa-regular fa-file-lines" />} />
        <StatCard label="Scheduled Interviews" value={stats.scheduledInterviews} gradient="linear-gradient(135deg,#22c55e,#16a34a)" icon={<i className="fa-regular fa-calendar-check" />} />
      </div>
      <GlassCard title="Hiring Progress">
        <div className="perf-grid">
          <div className="perf-item"><strong>{progress.screened}</strong><small>Screened</small></div>
          <div className="perf-item"><strong>{progress.interviewed}</strong><small>Interviewed</small></div>
          <div className="perf-item"><strong>{progress.selected}</strong><small>Selected</small></div>
        </div>
      </GlassCard>
    </>
  );
}
