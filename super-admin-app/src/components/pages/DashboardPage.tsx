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
        <StatCard label="Global Revenue" value={money(stats.globalRevenue || 0)} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" icon={<i className="fa-solid fa-indian-rupee-sign" />} />
        <StatCard label="Total Users" value={stats.totalUsers} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" icon={<i className="fa-solid fa-users" />} />
        <StatCard label="Total Jobs" value={stats.totalJobs} gradient="linear-gradient(135deg,#22c55e,#16a34a)" icon={<i className="fa-solid fa-briefcase" />} />
        <StatCard label="Server Health" value={`${stats.serverHealth}%`} gradient="linear-gradient(135deg,#f59e0b,#ea580c)" icon={<i className="fa-solid fa-server" />} />
        <StatCard label="Platform Growth" value={`+${stats.platformGrowth}%`} gradient="linear-gradient(135deg,#0ea5e9,#0284c7)" icon={<i className="fa-solid fa-chart-line" />} />
      </div>
      <GlassCard title="Platform Control Center">
        <div className="perf-grid">
          <div className="perf-item"><strong>{stats.apiUsage?.toLocaleString("en-IN")}</strong><small>API Usage</small></div>
          <div className="perf-item"><strong>{stats.fraudAlerts}</strong><small>Fraud Alerts</small></div>
        </div>
      </GlassCard>
    </>
  );
}
