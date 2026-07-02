import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const DashboardPage = dynamic(() => import("@/components/pages/DashboardPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <DashboardPage />;
}
