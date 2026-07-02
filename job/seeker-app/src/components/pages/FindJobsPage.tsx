"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { JobLogo } from "@/components/ui/JobLogo";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSeekerData } from "@/context/SeekerDataContext";
import { money } from "@/lib/utils";

export default function FindJobsPage() {
  const { loading, jobs } = useSeekerData();
  if (loading) return <PageSkeleton />;
  return (
    <div className="grid-2">
      {jobs.map((j) => (
        <GlassCard key={j.id} title={j.title}>
          <div className="app-row">
            <JobLogo logo={j.logo} bg={j.logoBg} color={j.logoColor} />
            <div className="app-mid">
              <strong>{j.company}</strong>
              <small>{j.location} • {money(j.salary)}/mo • {j.match}% match</small>
            </div>
            <Link href="/" className="btn-primary btn-sm">Apply</Link>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
