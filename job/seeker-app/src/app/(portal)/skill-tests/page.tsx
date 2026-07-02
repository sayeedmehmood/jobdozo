import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const SkillTestsPage = dynamic(() => import("@/components/pages/SkillTestsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <SkillTestsPage />;
}
