"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ResumePage() {
  const { loading, resume, refresh } = useSeekerData();
  const { user } = useAuth();
  const [form, setForm] = useState({ headline: "", summary: "", phone: "", skills: "" });
  const score = (resume as { score?: number })?.score ?? 0;

  useEffect(() => {
    if (resume) {
      setForm({
        headline: String(resume.headline || ""),
        summary: String(resume.summary || ""),
        phone: String(resume.phone || ""),
        skills: ((resume.skills as string[]) || []).join(", "),
      });
    }
  }, [resume]);

  const save = async () => {
    await api.patch("/api/users/me/resume", {
      headline: form.headline,
      summary: form.summary,
      phone: form.phone,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    });
    await refresh();
    alert("Resume saved!");
  };

  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Resume - ${user?.name}</title></head><body><h1>${user?.name}</h1><h2>${form.headline}</h2><p>${form.summary}</p><p>Skills: ${form.skills}</p></body></html>`);
    w.print();
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2">
      <GlassCard title="Resume Builder" action={<span className="match-pill">AI Score {score}%</span>}>
        <div className="form-grid">
          <div className="field"><label>Headline</label><input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Summary</label><textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Skills (comma separated)</label><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn-primary" onClick={save}>Save Resume</button>
          <button type="button" className="btn-outline" onClick={exportPdf}>Export PDF</button>
          <label className="btn-outline" style={{ cursor: "pointer" }}>
            Upload CV
            <input type="file" hidden onChange={() => alert("File upload saved (demo)")} />
          </label>
        </div>
      </GlassCard>

      <div>
        <GlassCard title="Templates">
          {["Modern Blue", "Classic", "Minimal"].map((t) => (
            <button key={t} type="button" className="btn-outline full" style={{ marginBottom: 8 }} onClick={() => alert(`${t} template applied (demo)`)}>{t}</button>
          ))}
        </GlassCard>
        <GlassCard title="Version History">
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>Latest — {new Date().toLocaleString("en-IN")}</p>
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>Previous — 3 days ago</p>
        </GlassCard>
        <GlassCard title="Live Preview">
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
            <h2 style={{ margin: "0 0 6px", color: "var(--ink)" }}>{user?.name}</h2>
            <p style={{ color: "var(--blue)", fontWeight: 700 }}>{form.headline || "Your headline"}</p>
            <p style={{ fontSize: ".82rem" }}>{form.summary || "Your professional summary..."}</p>
            <p style={{ fontSize: ".78rem" }}><strong>Skills:</strong> {form.skills || "—"}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
