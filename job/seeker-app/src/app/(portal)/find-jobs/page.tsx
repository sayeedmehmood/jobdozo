import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const FindJobsPage = dynamic(() => import("@/components/pages/FindJobsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <FindJobsPage />;
}
