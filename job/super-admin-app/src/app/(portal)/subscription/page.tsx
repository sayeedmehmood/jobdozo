import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const SubscriptionPage = dynamic(() => import("@/components/pages/SubscriptionPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <SubscriptionPage />;
}
