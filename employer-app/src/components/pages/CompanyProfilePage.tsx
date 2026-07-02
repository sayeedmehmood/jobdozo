"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { api } from "@/lib/api";

export default function CompanyProfilePage() {
  const { loading, company, refresh } = useEmployerData();
  const [form, setForm] = useState<Record<string, string>>({});

  if (loading || !company) return <PageSkeleton />;
  const c = { ...company, ...form };

  const save = async () => {
    await api.patch("/api/employer/company", form);
    await refresh();
  };

  return (
    <div className="grid-2">
      <GlassCard title="Company Information">
        <div className="form-grid">
          <div className="field"><label>Name</label><input defaultValue={String(c.name)} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Industry</label><input defaultValue={String(c.industry || "")} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
          <div className="field"><label>Website</label><input defaultValue={String(c.website || "")} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>About</label><textarea defaultValue={String(c.about || "")} onChange={(e) => setForm({ ...form, about: e.target.value })} /></div>
        </div>
        <button type="button" className="btn-primary" onClick={save}>Save Profile</button>
      </GlassCard>
      <GlassCard title="Verification & Branding">
        <p>Status: <span className="status-pill">{String(c.verified ? "Verified" : "Pending")}</span></p>
        <p style={{ marginTop: 12, fontSize: ".8rem" }}>Team: {(c.team as Array<{ name: string }> || []).map((t) => t.name).join(", ") || "—"}</p>
        <button type="button" className="btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => alert("Public page preview (demo)")}>Preview Public Page</button>
      </GlassCard>
    </div>
  );
}
