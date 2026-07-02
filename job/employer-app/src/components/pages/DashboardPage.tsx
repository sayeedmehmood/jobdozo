"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { JobLogo } from "@/components/ui/JobLogo";
import { useEmployerData } from "@/context/EmployerDataContext";
import { money, STATUS_META, timeAgo } from "@/lib/utils";

type Activity = { id?: string; icon: string; bg: string; title: string; sub: string; createdAt?: string };
type MonthlyRow = { month: string; applications: number; hires: number };
type AppRow = {
  id: string;
  name?: string;
  status: string;
  createdAt: string;
  job?: { title?: string; company?: string; logo?: string; logoBg?: string; logoColor?: string };
  interview?: { date?: string; time?: string; mode?: string };
};

const FUNNEL_LABELS: Record<string, string> = {
  applied: "Applied",
  viewed: "Viewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
};

const FUNNEL_COLORS: Record<string, string> = {
  applied: "#3b82f6",
  viewed: "#6366f1",
  shortlisted: "#8b5cf6",
  interview: "#f59e0b",
  selected: "#22c55e",
  rejected: "#ef4444",
};

export default function DashboardPage() {
  const { loading, dashboard } = useEmployerData();
  const router = useRouter();

  if (loading || !dashboard) return <PageSkeleton />;

  const stats = dashboard.stats as Record<string, number>;
  const funnel = dashboard.funnel as Record<string, number>;
  const funnelPct = (dashboard.funnelPct as Record<string, number>) || {};
  const performance = dashboard.performance as Record<string, number>;
  const monthlyReport = (dashboard.monthlyReport as MonthlyRow[]) || [];
  const recentApps = (dashboard.recentApplications as AppRow[]) || [];
  const recentJobs = (dashboard.recentJobs as Array<Record<string, unknown>>) || [];
  const upcoming = (dashboard.upcomingInterviews as AppRow[]) || [];
  const activities = (dashboard.activities as Activity[]) || [];
  const insights = (dashboard.aiInsights as Array<{ icon: string; text: string }>) || [];
  const maxMonthly = Math.max(...monthlyReport.map((m) => m.applications), 1);

  return (
    <>
      <div className="stat-grid employer-dash-stats">
        <StatCard
          label="Active Jobs"
          value={stats.activeJobs}
          hint={`${stats.draftJobs || 0} drafts`}
          gradient="linear-gradient(135deg,#3b82f6,#2563eb)"
          icon={<i className="fa-solid fa-briefcase" />}
          onClick={() => router.push("/jobs")}
        />
        <StatCard
          label="Applications"
          value={stats.totalApplications}
          hint={`${stats.monthDelta >= 0 ? "+" : ""}${stats.monthDelta || 0}% this month`}
          gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)"
          icon={<i className="fa-regular fa-file-lines" />}
          onClick={() => router.push("/applications")}
        />
        <StatCard
          label="Shortlisted"
          value={stats.shortlisted}
          hint="Pipeline"
          gradient="linear-gradient(135deg,#22c55e,#16a34a)"
          icon={<i className="fa-solid fa-user-check" />}
          onClick={() => router.push("/candidates")}
        />
        <StatCard
          label="Interviews"
          value={stats.interviews}
          hint="Scheduled"
          gradient="linear-gradient(135deg,#f59e0b,#ea580c)"
          icon={<i className="fa-regular fa-calendar-check" />}
          onClick={() => router.push("/interviews")}
        />
        <StatCard
          label="Job Views"
          value={stats.views?.toLocaleString("en-IN") || "0"}
          hint={`${stats.selected || 0} hired`}
          gradient="linear-gradient(135deg,#0ea5e9,#0284c7)"
          icon={<i className="fa-regular fa-eye" />}
          onClick={() => router.push("/jobs")}
        />
      </div>

      <div className="grid-2">
        <GlassCard
          title={<><i className="fa-solid fa-filter" style={{ color: "var(--blue)" }} /> Hiring Funnel Analytics</>}
          action={<Link href="/applications" className="btn-outline btn-sm">View Pipeline</Link>}
        >
          <div className="funnel-bars">
            {Object.entries(funnel).map(([key, count]) => (
              <div key={key} className="funnel-bar-row">
                <span className="funnel-bar-label">{FUNNEL_LABELS[key] || key}</span>
                <div className="funnel-bar-track">
                  <div
                    className="funnel-bar-fill"
                    style={{
                      width: `${Math.max(funnelPct[key] || 0, count ? 8 : 0)}%`,
                      background: FUNNEL_COLORS[key],
                    }}
                  />
                </div>
                <span className="funnel-bar-val">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title={<><i className="fa-solid fa-gauge-high" style={{ color: "#8b5cf6" }} /> Performance Metrics</>}>
          <div className="perf-grid">
            <div className="perf-item">
              <strong>{performance.timeToHire}d</strong>
              <small>Avg. Time to Hire</small>
            </div>
            <div className="perf-item">
              <strong>{performance.conversionRate}%</strong>
              <small>Conversion Rate</small>
            </div>
            <div className="perf-item">
              <strong>{performance.responseRate}%</strong>
              <small>Response Rate</small>
            </div>
            <div className="perf-item">
              <strong>{performance.offerAcceptance}%</strong>
              <small>Offer Acceptance</small>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid-2">
        <GlassCard
          title={<><i className="fa-regular fa-file-lines" style={{ color: "var(--blue)" }} /> Recent Applications</>}
          action={<Link href="/applications" className="btn-outline btn-sm">View All</Link>}
        >
          {recentApps.length ? recentApps.map((a) => {
            const m = STATUS_META[a.status] || STATUS_META.Applied;
            return (
              <div key={a.id} className="app-row">
                <span className="avatar sm">{(a.name || "?").slice(0, 2).toUpperCase()}</span>
                <div className="app-mid">
                  <strong>{a.name}</strong>
                  <small>{a.job?.title} • {timeAgo(a.createdAt)}</small>
                  <div className="track">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= m.dots ? `on ${m.dotCls}` : ""} />)}</div>
                </div>
                <span className={`status-pill ${m.cls}`}>{a.status}</span>
              </div>
            );
          }) : (
            <EmptyState icon="fa-file-lines" title="No applications yet" desc="Post jobs to start receiving applications." action={<Link href="/jobs" className="btn-primary">Post a Job</Link>} />
          )}
        </GlassCard>

        <div>
          <GlassCard title={<><i className="fa-regular fa-calendar-check" style={{ color: "#f59e0b" }} /> Scheduled Interviews</>}>
            {upcoming.length ? upcoming.map((a) => (
              <div key={a.id} className="app-row">
                <span className="avatar sm">{(a.name || "?").slice(0, 2).toUpperCase()}</span>
                <div className="app-mid">
                  <strong>{a.name}</strong>
                  <small>{a.job?.title} • {a.interview?.date || "TBD"} {a.interview?.time || ""}</small>
                </div>
                <button type="button" className="btn-primary btn-sm" onClick={() => router.push("/interviews")}>Manage</button>
              </div>
            )) : (
              <EmptyState title="No interviews scheduled" desc="Shortlist candidates and schedule interviews." action={<Link href="/interviews" className="btn-outline btn-sm">Schedule</Link>} />
            )}
          </GlassCard>

          <GlassCard title={<><i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#8b5cf6" }} /> AI Hiring Insights</>}>
            {insights.map((x, i) => (
              <p key={i} className="insight-row"><i className={`fa-solid ${x.icon}`} /> {x.text}</p>
            ))}
          </GlassCard>
        </div>
      </div>

      <div className="grid-2">
        <GlassCard
          title={<><i className="fa-solid fa-briefcase" style={{ color: "var(--blue)" }} /> Active Job Performance</>}
          action={<Link href="/jobs" className="btn-outline btn-sm">Manage Jobs</Link>}
        >
          {recentJobs.length ? recentJobs.map((j) => (
            <div key={String(j.id)} className="app-row">
              <JobLogo logo={String(j.logo || "?")} bg={String(j.logoBg || "#3b82f6")} color={String(j.logoColor || "#fff")} />
              <div className="app-mid">
                <strong>{String(j.title)}</strong>
                <small>{String(j.status)} • {Number(j.views)} views • {Number(j.applications)} apps</small>
              </div>
              <Link href="/jobs" className="btn-outline btn-sm">Edit</Link>
            </div>
          )) : (
            <EmptyState title="No jobs posted" action={<Link href="/jobs" className="btn-primary">Create Job</Link>} />
          )}
        </GlassCard>

        <GlassCard title={<><i className="fa-solid fa-clock-rotate-left" style={{ color: "#64748b" }} /> Recent Activity</>}>
          {activities.length ? activities.map((a) => (
            <div key={a.id || a.title} className="activity-row">
              <span className="activity-icon" style={{ background: a.bg }}><i className={`fa-solid ${a.icon}`} /></span>
              <div className="app-mid">
                <strong>{a.title}</strong>
                <small>{a.sub}{a.createdAt ? ` • ${timeAgo(a.createdAt)}` : ""}</small>
              </div>
            </div>
          )) : (
            <EmptyState title="No recent activity" />
          )}
        </GlassCard>
      </div>

      <GlassCard title={<><i className="fa-solid fa-chart-column" style={{ color: "var(--blue)" }} /> Monthly Hiring Report</>}>
        <div className="monthly-chart">
          {monthlyReport.map((m) => (
            <div key={m.month} className="monthly-col">
              <div className="monthly-bars">
                <div className="monthly-bar apps" style={{ height: `${(m.applications / maxMonthly) * 100}%` }} title={`${m.applications} applications`} />
                <div className="monthly-bar hires" style={{ height: `${(m.hires / maxMonthly) * 100}%` }} title={`${m.hires} hires`} />
              </div>
              <small>{m.month}</small>
              <span className="monthly-nums">{m.applications}/{m.hires}</span>
            </div>
          ))}
        </div>
        <div className="monthly-legend">
          <span><i className="dot apps" /> Applications</span>
          <span><i className="dot hires" /> Hires</span>
        </div>
      </GlassCard>

      <GlassCard title="Quick Actions">
        <div className="quick-actions-grid">
          <Link href="/jobs" className="quick-action"><i className="fa-solid fa-plus" /><span>Post Job</span></Link>
          <Link href="/applications" className="quick-action"><i className="fa-solid fa-robot" /><span>AI Screening</span></Link>
          <Link href="/talent-search" className="quick-action"><i className="fa-solid fa-magnifying-glass" /><span>Talent Search</span></Link>
          <Link href="/interviews" className="quick-action"><i className="fa-regular fa-calendar-plus" /><span>Schedule Interview</span></Link>
          <Link href="/messages" className="quick-action"><i className="fa-regular fa-comment-dots" /><span>Messages</span></Link>
          <Link href="/subscription" className="quick-action"><i className="fa-solid fa-rocket" /><span>Promote Jobs</span></Link>
        </div>
        <p className="wallet-strip"><i className="fa-solid fa-wallet" /> Wallet balance: <strong>{money(stats.wallet)}</strong> — <Link href="/transactions">View transactions</Link></p>
      </GlassCard>
    </>
  );
}
