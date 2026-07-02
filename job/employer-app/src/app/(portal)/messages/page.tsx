import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const MessagesPage = dynamic(() => import("@/components/pages/MessagesPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <MessagesPage />;
}
