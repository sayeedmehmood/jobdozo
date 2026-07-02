"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useEmployerData } from "@/context/EmployerDataContext";
import { money } from "@/lib/utils";

export default function TransactionsPage() {
  const { loading, transactions } = useEmployerData();
  if (loading || !transactions) return <PageSkeleton />;
  const summary = transactions.summary as Record<string, number>;
  const list = (transactions.transactions as Array<Record<string, unknown>>) || [];

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><small>Credits</small><strong>{summary.credits}</strong></div>
        <div className="stat-card"><small>Total Spend</small><strong>{money(summary.totalSpend)}</strong></div>
        <div className="stat-card"><small>This Month</small><strong>{money(summary.monthSpend)}</strong></div>
      </div>
      <GlassCard title="Payment History">
        {list.map((t) => (
          <div key={String(t.id)} className="app-row">
            <div className="app-mid"><strong>{String(t.desc)}</strong><small>{String(t.date)} • {String(t.type)}</small></div>
            <span>{money(Number(t.amount))}</span>
            <button type="button" className="btn-outline btn-sm" onClick={() => alert("Invoice PDF (demo)")}>PDF</button>
          </div>
        ))}
      </GlassCard>
    </>
  );
}
