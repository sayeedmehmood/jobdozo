"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PAGE_TITLES } from "@/lib/nav";
import { usePathname } from "next/navigation";

export default function ModulePage({ module }: { module?: string }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname.split("?")[0]] || module || "Module";
  return (
    <GlassCard title={title}>
      <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
        {title} module — role-scoped UI with API-ready architecture.
      </p>
    </GlassCard>
  );
}
