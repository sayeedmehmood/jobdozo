import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/Skeleton";

const Page = dynamic(() => import("@/components/pages/ModulePage"), { loading: () => <PageSkeleton /> });

export default function Route() { return <Page module="Subscriptions" />; }
