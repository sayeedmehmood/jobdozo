"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

const FAQ = [
  { q: "How do I apply to a job?", a: "Browse jobs on the homepage or use Recommended Jobs, then click Apply Now. Your application appears under My Applications." },
  { q: "How does Premium help?", a: "Premium adds a badge, priority applications, unlimited AI tests, and profile boost in employer search." },
  { q: "Can I withdraw an application?", a: "Yes — open My Applications and click Withdraw on any active application." },
  { q: "How do job alerts work?", a: "Set keywords and radius under Job Alerts. Matching jobs trigger instant notifications." },
];

export default function SupportPage() {
  const [open, setOpen] = useState(0);
  const [ticket, setTicket] = useState({ subject: "", message: "" });

  return (
    <div className="grid-2">
      <GlassCard title="FAQ">
        {FAQ.map((f, i) => (
          <div key={f.q} className="faq-item">
            <button type="button" className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>{f.q}</button>
            {open === i && <div className="faq-a">{f.a}</div>}
          </div>
        ))}
      </GlassCard>

      <div>
        <GlassCard title="Submit a Ticket">
          <div className="field"><label>Subject</label><input value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} /></div>
          <div className="field"><label>Message</label><textarea value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} /></div>
          <button type="button" className="btn-primary" onClick={() => alert("Ticket #JM-" + Date.now().toString().slice(-6) + " created (demo)")}>Submit Ticket</button>
        </GlassCard>
        <GlassCard title="Live Chat">
          <p style={{ fontSize: ".82rem", color: "var(--muted)" }}>Support agents available 9 AM – 6 PM IST</p>
          <button type="button" className="btn-outline full" onClick={() => alert("Connecting to live chat (demo)...")}>Start Live Chat</button>
        </GlassCard>
        <GlassCard title="Guides">
          <a href="/resume" className="dropdown-link">Resume writing guide</a>
          <a href="/skill-tests" className="dropdown-link">Skill test preparation</a>
          <a href="/profile" className="dropdown-link">Profile optimization tips</a>
        </GlassCard>
        <GlassCard title="Contact">
          <p style={{ fontSize: ".82rem" }}><i className="fa-solid fa-envelope" /> support@JobDozo.in</p>
          <p style={{ fontSize: ".82rem" }}><i className="fa-solid fa-phone" /> +91 98765 43210</p>
        </GlassCard>
      </div>
    </div>
  );
}
