import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const CompanyProfilePage = dynamic(() => import("@/components/pages/CompanyProfilePage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <CompanyProfilePage />;
}
