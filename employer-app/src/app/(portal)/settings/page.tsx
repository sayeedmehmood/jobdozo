import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const SettingsPage = dynamic(() => import("@/components/pages/SettingsPage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <SettingsPage />;
}
