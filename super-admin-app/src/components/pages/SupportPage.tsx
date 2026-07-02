"use client";

import { GlassCard } from "@/components/ui/GlassCard";

const FAQ = [
  { q: "How do I post a job?", a: "Go to Jobs → Create Job and fill in the details." },
  { q: "How does AI screening work?", a: "Applications are scored based on skills match and experience." },
  { q: "Can I upgrade my plan?", a: "Yes, visit Subscription to compare and upgrade plans." },
];

export default function SupportPage() {
  return (
    <div className="grid-2">
      <GlassCard title="FAQ Center">
        {FAQ.map((f) => (
          <details key={f.q} style={{ marginBottom: 10 }}>
            <summary><strong>{f.q}</strong></summary>
            <p style={{ fontSize: ".8rem", marginTop: 6 }}>{f.a}</p>
          </details>
        ))}
      </GlassCard>
      <GlassCard title="Raise Support Ticket">
        <div className="form-grid">
          <div className="field"><label>Subject</label><input placeholder="Issue subject" /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Description</label><textarea rows={4} placeholder="Describe your issue..." /></div>
        </div>
        <button type="button" className="btn-primary" onClick={() => alert("Ticket submitted (demo)")}>Submit Ticket</button>
        <p style={{ marginTop: 16, fontSize: ".78rem", color: "var(--muted)" }}>Account Manager: hiring@jobdozo.in • Live chat available 9am–6pm IST</p>
      </GlassCard>
    </div>
  );
}
