import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const ResumePage = dynamic(() => import("@/components/pages/ResumePage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <ResumePage />;
}
