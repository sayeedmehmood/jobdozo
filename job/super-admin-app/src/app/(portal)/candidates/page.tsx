import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const CandidatesPage = dynamic(() => import("@/components/pages/CandidatesPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <CandidatesPage />;
}
