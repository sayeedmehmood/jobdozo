import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const ProfilePage = dynamic(() => import("@/components/pages/ProfilePage"), { loading: () => <PageSkeleton /> });

export default function Page() {
  return <ProfilePage />;
}
