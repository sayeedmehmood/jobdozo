import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const SupportPage = dynamic(() => import("@/components/pages/SupportPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <SupportPage />;
}
