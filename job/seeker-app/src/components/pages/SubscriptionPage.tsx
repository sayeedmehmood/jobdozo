"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { api } from "@/lib/api";
import { fmtDate, money } from "@/lib/utils";

export default function SubscriptionPage() {
  const { loading, subscription, refresh } = useSeekerData();
  const sub = subscription.subscription as Record<string, unknown>;
  const premium = subscription.premium;

  const subscribe = async (planId: string) => {
    if (!confirm("Activate this plan? (Demo — no real payment)")) return;
    await api.post("/api/users/me/subscription/subscribe", { planId });
    await refresh();
  };

  const cancel = async () => {
    if (!confirm("Cancel premium subscription?")) return;
    await api.post("/api/users/me/subscription/cancel");
    await refresh();
  };

  if (loading) return <PageSkeleton />;

  return (
    <>
      <GlassCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong style={{ fontSize: "1.1rem", color: "var(--ink)" }}>{premium ? `${sub.planName} Member` : "Upgrade to Premium"}</strong>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", margin: "4px 0 0" }}>
              {premium ? `Active since ${fmtDate(String(sub.startedAt))}` : "Priority applications, premium badge & unlimited AI tests"}
            </p>
          </div>
          {premium ? <button type="button" className="btn-outline" onClick={cancel}>Cancel Plan</button> : null}
        </div>
      </GlassCard>

      <div className="grid-3">
        {(subscription.plans as Array<Record<string, unknown>>).map((p) => {
          const isCurrent = p.id === sub.planId && (p.id === "free" || premium);
          return (
            <GlassCard key={String(p.id)}>
              {!!p.popular && <span className="match-pill">Best Value</span>}
              <h4 style={{ color: "var(--ink)" }}>{String(p.name)}</h4>
              <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--ink)" }}>{money(Number(p.price))}<small style={{ fontSize: ".7rem" }}>/mo</small></p>
              <p style={{ fontSize: ".72rem", color: "var(--muted)" }}>{String(p.tagline)}</p>
              <ul style={{ fontSize: ".74rem", paddingLeft: 16 }}>
                {((p.features as string[]) || []).slice(0, 5).map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button type="button" className="btn-primary full" disabled={isCurrent || p.id === "free"} onClick={() => subscribe(String(p.id))}>
                {isCurrent ? "Current Plan" : p.id === "free" ? "Free Forever" : "Subscribe"}
              </button>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard title="Billing History">
        {(subscription.history as Array<Record<string, unknown>>).length ? (subscription.history as Array<Record<string, unknown>>).map((b, i) => (
          <div key={i} className="app-row">
            <div className="app-mid"><strong>{String(b.description)}</strong><small>{fmtDate(String(b.createdAt))}</small></div>
            <span>{b.status === "cancelled" ? "Cancelled" : money(Number(b.amount))}</span>
          </div>
        )) : <p style={{ color: "var(--muted)", fontSize: ".82rem" }}>No billing history yet.</p>}
      </GlassCard>
    </>
  );
}
