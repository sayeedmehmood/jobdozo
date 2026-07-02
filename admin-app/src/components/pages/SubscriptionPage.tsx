"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { money } from "@/lib/utils";

export default function SubscriptionPage() {
  const { loading, subscription } = useEmployerData();
  if (loading || !subscription) return <PageSkeleton />;
  const current = subscription.current as Record<string, unknown>;
  const plans = (subscription.plans as Array<Record<string, unknown>>) || [];

  return (
    <>
      <GlassCard title="Current Plan">
        <p><strong>{String(current.name)}</strong> — {money(Number(current.price))}/mo</p>
        <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>Credits used: {String(current.creditsUsed)}/{String(current.creditsTotal)}</p>
      </GlassCard>
      <div className="grid-3">
        {plans.map((p) => (
          <GlassCard key={String(p.id)} title={String(p.name)}>
            <p><strong>{money(Number(p.price))}</strong>/mo</p>
            <ul style={{ fontSize: ".75rem", margin: "8px 0", paddingLeft: 18 }}>
              {((p.features as string[]) || []).map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button type="button" className="btn-primary btn-sm" onClick={() => alert("Upgrade (demo)")}>Upgrade</button>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
