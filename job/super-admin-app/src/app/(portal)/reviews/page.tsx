import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const ReviewsPage = dynamic(() => import("@/components/pages/ReviewsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <ReviewsPage />;
}
