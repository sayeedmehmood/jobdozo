"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { money } from "@/lib/utils";

export default function DashboardPage() {
  const { loading, dashboard } = useEmployerData();
  if (loading || !dashboard) return <PageSkeleton />;
  const stats = dashboard.stats as Record<string, number>;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Users" value={stats.users} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" icon={<i className="fa-solid fa-users" />} />
        <StatCard label="Active Employers" value={stats.employers} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" icon={<i className="fa-regular fa-building" />} />
        <StatCard label="Active Jobs" value={stats.jobs} gradient="linear-gradient(135deg,#22c55e,#16a34a)" icon={<i className="fa-solid fa-briefcase" />} />
        <StatCard label="Applications Today" value={stats.applicationsToday} gradient="linear-gradient(135deg,#f59e0b,#ea580c)" icon={<i className="fa-regular fa-file-lines" />} />
        <StatCard label="Revenue" value={money(stats.revenue || 0)} gradient="linear-gradient(135deg,#0f172a,#334155)" icon={<i className="fa-solid fa-indian-rupee-sign" />} />
      </div>
      <GlassCard title="Platform Statistics">
        <div className="perf-grid">
          <div className="perf-item"><strong>{stats.supportTickets || 0}</strong><small>Support Tickets</small></div>
          <div className="perf-item"><strong>{stats.seekers || 0}</strong><small>Job Seekers</small></div>
          <div className="perf-item"><strong>{stats.employers || 0}</strong><small>Employers</small></div>
        </div>
      </GlassCard>
    </>
  );
}
