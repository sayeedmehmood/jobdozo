import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const RecommendedPage = dynamic(() => import("@/components/pages/RecommendedPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <RecommendedPage />;
}
