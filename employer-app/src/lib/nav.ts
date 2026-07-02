export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: "applications" | "messages";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "fa-solid fa-house" },
  { label: "Post New Job", href: "/jobs?create=1", icon: "fa-solid fa-plus" },
  { label: "Manage Jobs", href: "/jobs", icon: "fa-solid fa-briefcase" },
  { label: "Applications", href: "/applications", icon: "fa-regular fa-file-lines", badgeKey: "applications" },
  { label: "Candidates", href: "/candidates", icon: "fa-solid fa-user-group" },
  { label: "Interview Schedule", href: "/interviews", icon: "fa-regular fa-calendar-check" },
  { label: "Talent Search", href: "/talent-search", icon: "fa-solid fa-magnifying-glass" },
  { label: "Company Profile", href: "/company-profile", icon: "fa-regular fa-building" },
  { label: "Transactions", href: "/transactions", icon: "fa-regular fa-credit-card" },
  { label: "Subscription", href: "/subscription", icon: "fa-solid fa-crown" },
  { label: "Messages", href: "/messages", icon: "fa-regular fa-comment-dots", badgeKey: "messages" },
  { label: "Reviews & Ratings", href: "/reviews", icon: "fa-regular fa-star" },
  { label: "Settings", href: "/settings", icon: "fa-solid fa-gear" },
  { label: "Help & Support", href: "/support", icon: "fa-regular fa-circle-question" },
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((n) => [n.href, n.label])
);
