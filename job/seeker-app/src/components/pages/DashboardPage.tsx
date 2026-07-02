"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { JobLogo } from "@/components/ui/JobLogo";
import { useSeekerData } from "@/context/SeekerDataContext";
import { money, STATUS_META, timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { loading, applications, savedJobs, jobs, profile } = useSeekerData();
  const router = useRouter();
  const interviews = applications.filter((a) => a.status === "Interview");
  const topMatch = [...jobs].sort((a, b) => b.match - a.match)[0];
  const recent = applications.slice(0, 5);
  const pct = (profile as { completion?: { pct?: number } })?.completion?.pct ?? 80;

  if (loading) return <PageSkeleton />;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Applied Jobs" value={applications.length} hint="+3 this week" gradient="linear-gradient(135deg,#3b82f6,#2563eb)" icon={<i className="fa-regular fa-file-lines" />} onClick={() => router.push("/applications")} />
        <StatCard label="Interview Calls" value={interviews.length} hint="Upcoming" gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" icon={<i className="fa-solid fa-phone" />} onClick={() => router.push("/interviews")} />
        <StatCard label="Saved Jobs" value={savedJobs.length} hint="Watchlist" gradient="linear-gradient(135deg,#ec4899,#db2777)" icon={<i className="fa-regular fa-heart" />} onClick={() => router.push("/saved-jobs")} />
        <StatCard label="Profile Views" value={(profile as { stats?: { profileViews?: number } })?.stats?.profileViews ?? 45} hint="+12 this week" gradient="linear-gradient(135deg,#22c55e,#16a34a)" icon={<i className="fa-regular fa-eye" />} />
        <StatCard label="AI Match Score" value={topMatch ? `${topMatch.match}%` : "—"} hint={topMatch?.title || "top match"} gradient="linear-gradient(135deg,#f59e0b,#ea580c)" icon={<i className="fa-solid fa-wand-magic-sparkles" />} onClick={() => router.push("/recommended")} />
      </div>

      <div className="grid-2">
        <GlassCard title={<><i className="fa-regular fa-file-lines" style={{ color: "var(--blue)" }} /> Recent Applications</>}>
          {recent.length ? recent.map((a) => {
            const j = a.job || { title: "Job", company: "", logo: "?", logoBg: "#94a3b8", logoColor: "#fff" };
            const m = STATUS_META[a.status] || STATUS_META.Applied;
            return (
              <div key={a.id} className="app-row">
                <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} />
                <div className="app-mid">
                  <strong>{j.title}</strong>
                  <small>{j.company} • {timeAgo(a.createdAt)}</small>
                  <div className="track">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= m.dots ? `on ${m.dotCls}` : ""} />)}</div>
                </div>
                <span className={`status-pill ${m.cls}`}>{a.status}</span>
              </div>
            );
          }) : <EmptyState icon="fa-file-lines" title="No applications yet" desc="Browse jobs and apply to get started." action={<Link href="/" className="btn-primary">Find Jobs</Link>} />}
          <Link href="/applications" className="btn-outline full" style={{ marginTop: 12 }}>View all applications</Link>
        </GlassCard>

        <div>
          <GlassCard title={<><i className="fa-regular fa-calendar-check" style={{ color: "#8b5cf6" }} /> Interview Reminders</>}>
            {interviews.length ? interviews.map((a) => (
              <div key={a.id} className="app-row">
                <JobLogo logo={a.job?.logo || "?"} bg={a.job?.logoBg || "#8b5cf6"} />
                <div className="app-mid"><strong>{a.job?.title}</strong><small>{a.job?.company}</small></div>
                <button type="button" className="btn-primary btn-sm" onClick={() => router.push("/interviews")}>Join</button>
              </div>
            )) : <EmptyState title="No interviews scheduled" desc="Keep applying — your next call is coming!" />}
          </GlassCard>

          <GlassCard title="Quick Actions">
            <div className="grid-3" style={{ gap: 8 }}>
              <Link href="/resume" className="btn-outline">Update Resume</Link>
              <Link href="/skill-tests" className="btn-outline">Take Skill Test</Link>
              <Link href="/alerts" className="btn-outline">Job Alerts</Link>
            </div>
          </GlassCard>

          <GlassCard title={`Profile Completion — ${pct}%`}>
            <div style={{ height: 8, background: "#e7edf6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,var(--blue),#5ea0ff)" }} />
            </div>
            <Link href="/profile" className="btn-outline full" style={{ marginTop: 12 }}>Complete Profile</Link>
          </GlassCard>
        </div>
      </div>

      <GlassCard title={<><i className="fa-regular fa-heart" style={{ color: "#ec4899" }} /> Saved Jobs Preview</>}>
        {savedJobs.length ? savedJobs.slice(0, 3).map((j) => (
          <div key={j.id} className="saved-row">
            <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} />
            <div className="saved-mid"><strong>{j.title}</strong><small>{j.company} • {money(j.salary)}/mo</small></div>
            <Link href="/saved-jobs" className="btn-outline btn-sm">View</Link>
          </div>
        )) : <EmptyState title="No saved jobs" action={<Link href="/recommended" className="btn-primary">Explore recommendations</Link>} />}
      </GlassCard>
    </>
  );
}
