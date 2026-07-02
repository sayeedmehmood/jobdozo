import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const TalentSearchPage = dynamic(() => import("@/components/pages/TalentSearchPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <TalentSearchPage />;
}
