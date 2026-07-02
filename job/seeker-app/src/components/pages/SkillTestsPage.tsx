"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";

export default function SkillTestsPage() {
  const { loading, skillTests } = useSeekerData();

  if (loading) return <PageSkeleton />;

  return (
    <>
      <GlassCard title="AI Skill Tests">
        <p style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: 0 }}>Adaptive assessments — scores shared with employers as badges.</p>
      </GlassCard>
      <div className="grid-3">
        {skillTests.length ? skillTests.map((t) => (
          <GlassCard key={String(t.id)}>
            <strong style={{ color: "var(--ink)" }}>{String(t.title)}</strong>
            <p style={{ fontSize: ".74rem", color: "var(--muted)" }}>{String(t.category)} • {String(t.duration)} min</p>
            <p style={{ fontSize: ".78rem" }}>{String(t.description || "")}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" className="btn-primary btn-sm" onClick={() => alert("Starting test (demo)")}>Start Test</button>
              <button type="button" className="btn-outline btn-sm" onClick={() => alert("Practice mode (demo)")}>Practice</button>
            </div>
          </GlassCard>
        )) : <div style={{ gridColumn: "1/-1" }}><EmptyState title="No tests available" /></div>}
      </div>
      <div className="grid-2">
        <GlassCard title="Your Progress"><p>2 tests completed • 1 certificate earned</p></GlassCard>
        <GlassCard title="Leaderboard"><p>#12 in Jammu region this week</p></GlassCard>
      </div>
    </>
  );
}
