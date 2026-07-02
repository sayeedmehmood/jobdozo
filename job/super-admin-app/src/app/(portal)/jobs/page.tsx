import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const JobsPage = dynamic(() => import("@/components/pages/JobsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <JobsPage />;
}
