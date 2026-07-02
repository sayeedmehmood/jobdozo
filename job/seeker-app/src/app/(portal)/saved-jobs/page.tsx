import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const SavedJobsPage = dynamic(() => import("@/components/pages/SavedJobsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <SavedJobsPage />;
}
