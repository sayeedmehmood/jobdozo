import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const InterviewsPage = dynamic(() => import("@/components/pages/InterviewsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <InterviewsPage />;
}
