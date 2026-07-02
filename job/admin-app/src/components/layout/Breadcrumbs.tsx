"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_TITLES } from "@/lib/nav";

export function Breadcrumbs() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Dashboard";

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/dashboard">Dashboard</Link>
      {pathname !== "/dashboard" && (
        <>
          <i className="fa-solid fa-chevron-right" aria-hidden />
          <span aria-current="page">{title}</span>
        </>
      )}
    </nav>
  );
}
