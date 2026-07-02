import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const AlertsPage = dynamic(() => import("@/components/pages/AlertsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <AlertsPage />;
}
