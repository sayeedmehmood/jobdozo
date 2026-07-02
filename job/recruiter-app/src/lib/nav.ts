export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: "applications" | "messages";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "fa-solid fa-house" },
  { label: "Assigned Jobs", href: "/assigned-jobs", icon: "fa-solid fa-briefcase" },
  { label: "Candidate Pool", href: "/candidate-pool", icon: "fa-solid fa-user-group" },
  { label: "Applications", href: "/applications", icon: "fa-regular fa-file-lines", badgeKey: "applications" },
  { label: "Interview Management", href: "/interviews", icon: "fa-regular fa-calendar-check" },
  { label: "Talent Search", href: "/talent-search", icon: "fa-solid fa-magnifying-glass" },
  { label: "Communications", href: "/communications", icon: "fa-regular fa-comment-dots", badgeKey: "messages" },
  { label: "Reports", href: "/reports", icon: "fa-solid fa-chart-column" },
  { label: "Team Tasks", href: "/team-tasks", icon: "fa-solid fa-list-check" },
  { label: "Settings", href: "/settings", icon: "fa-solid fa-gear" },
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((n) => [n.href.split("?")[0], n.label])
);
