"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";

export default function ReviewsPage() {
  const { loading, reviews } = useEmployerData();
  if (loading || !reviews) return <PageSkeleton />;
  const summary = reviews.summary as Record<string, unknown>;
  const list = (reviews.reviews as Array<Record<string, unknown>>) || [];

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><small>Rating</small><strong>{String(summary.avgRating)} ★</strong></div>
        <div className="stat-card"><small>Reviews</small><strong>{String(summary.totalReviews)}</strong></div>
        <div className="stat-card"><small>Reputation</small><strong>{String(summary.reputationScore)}</strong></div>
      </div>
      <GlassCard title="Employee & Candidate Feedback">
        {list.map((r) => (
          <div key={String(r.id)} className="app-row">
            <div className="app-mid"><strong>{String(r.author)}</strong><small>{String(r.role)} • {String(r.rating)}★</small><p style={{ fontSize: ".78rem" }}>{String(r.text)}</p></div>
            <button type="button" className="btn-outline btn-sm" onClick={() => alert("Response saved (demo)")}>Respond</button>
          </div>
        ))}
      </GlassCard>
    </>
  );
}
