"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { JobLogo } from "@/components/ui/JobLogo";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { money } from "@/lib/utils";

export default function NearbyJobsPage() {
  const { loading, jobs } = useSeekerData();
  if (loading) return <PageSkeleton />;
  const nearby = [...jobs].sort((a, b) => a.distance - b.distance);
  return (
    <div className="grid-2">
      {nearby.map((j) => (
        <GlassCard key={j.id} title={j.title}>
          <div className="app-row">
            <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} />
            <div className="app-mid">
              <strong>{j.company}</strong>
              <small>{j.distance} km away • {money(j.salary)}/mo</small>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
