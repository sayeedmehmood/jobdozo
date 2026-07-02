import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const ApplicationsPage = dynamic(() => import("@/components/pages/ApplicationsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <ApplicationsPage />;
}
