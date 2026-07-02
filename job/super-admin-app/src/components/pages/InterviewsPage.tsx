"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { api } from "@/lib/api";

export default function InterviewsPage() {
  const { loading, applications, refresh } = useEmployerData();
  const interviews = applications.filter((a) => a.status === "Interview");

  const schedule = async (appId: string) => {
    await api.patch(`/api/applications/${appId}/interview`, {
      date: new Date().toISOString().slice(0, 10), time: "11:00", mode: "Video Call", link: "https://meet.jobdozo.in/demo",
    });
    await refresh();
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid-2">
      <GlassCard title="Calendar">
        <div className="grid-3">{Array.from({ length: 7 }, (_, i) => <div key={i} className="funnel-item"><strong>{i + 1}</strong><small>Day</small></div>)}</div>
      </GlassCard>
      <GlassCard title="Upcoming Interviews">
        {interviews.map((a) => (
          <div key={a.id} className="app-row">
            <div className="app-mid"><strong>{a.name}</strong><small>{a.job?.title}</small></div>
            <button type="button" className="btn-primary btn-sm" onClick={() => window.open((a as { interview?: { link?: string } }).interview?.link || "#", "_blank")}>Join</button>
          </div>
        ))}
        {applications.filter((a) => a.status === "Shortlisted").slice(0, 2).map((a) => (
          <div key={a.id} className="app-row">
            <div className="app-mid"><strong>{a.name}</strong><small>Schedule interview</small></div>
            <button type="button" className="btn-outline btn-sm" onClick={() => schedule(a.id)}>Schedule</button>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
