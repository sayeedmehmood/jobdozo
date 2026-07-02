"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { api } from "@/lib/api";

export default function TalentSearchPage() {
  const { loading, talent } = useEmployerData();
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [results, setResults] = useState(talent);

  const search = async () => {
    const res = await api.get<{ results: Array<Record<string, unknown>> }>(`/api/employer/talent-search?q=${encodeURIComponent(q)}&skill=${encodeURIComponent(skill)}`);
    setResults(res.results);
  };

  if (loading) return <PageSkeleton />;

  return (
    <>
      <GlassCard title="AI Candidate Search">
        <div className="filter-bar">
          <input placeholder="Search by name, skill..." value={q} onChange={(e) => setQ(e.target.value)} />
          <input placeholder="Skill filter" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <button type="button" className="btn-primary btn-sm" onClick={search}>Search</button>
        </div>
      </GlassCard>
      <div className="grid-3">
        {(results.length ? results : talent).map((c) => (
          <GlassCard key={String(c.id)} title={String(c.name)}>
            <p>{String(c.location)} • {String(c.experience)}</p>
            <p style={{ fontSize: ".72rem" }}>{(c.skills as string[] || []).join(", ")}</p>
            <button type="button" className="btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => alert("Contact sent (demo)")}>Contact</button>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
