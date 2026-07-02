"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { money } from "@/lib/utils";

export default function CandidatesPage() {
  const { loading, candidates } = useEmployerData();
  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-3">
      {candidates.map((c) => (
        <GlassCard key={String(c.id)} title={String(c.name)}>
          <p style={{ fontSize: ".78rem" }}>{String(c.location)} • {String(c.experience)}</p>
          <p>Profile {String(c.profilePct)}% • {money(Number(c.salary || 0))}/mo expected</p>
          <p style={{ fontSize: ".72rem", color: "var(--muted)" }}>{(c.skills as string[] || []).join(", ")}</p>
          <button type="button" className="btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => alert("Saved candidate (demo)")}>Save</button>
        </GlassCard>
      ))}
    </div>
  );
}
