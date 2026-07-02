import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const NearbyJobsPage = dynamic(() => import("@/components/pages/NearbyJobsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <NearbyJobsPage />;
}
