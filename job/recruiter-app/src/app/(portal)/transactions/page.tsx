import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const TransactionsPage = dynamic(() => import("@/components/pages/TransactionsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <TransactionsPage />;
}
