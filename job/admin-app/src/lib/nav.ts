export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: never;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "fa-solid fa-house" },
  { label: "User Management", href: "/users", icon: "fa-solid fa-users" },
  { label: "Employer Management", href: "/employers", icon: "fa-regular fa-building" },
  { label: "Job Management", href: "/jobs", icon: "fa-solid fa-briefcase" },
  { label: "Candidate Management", href: "/candidates", icon: "fa-solid fa-user-group" },
  { label: "Categories", href: "/categories", icon: "fa-solid fa-tags" },
  { label: "Skills Management", href: "/skills", icon: "fa-solid fa-clipboard-list" },
  { label: "Subscription Plans", href: "/subscriptions", icon: "fa-solid fa-crown" },
  { label: "Transactions", href: "/transactions", icon: "fa-regular fa-credit-card" },
  { label: "Reports & Analytics", href: "/reports", icon: "fa-solid fa-chart-pie" },
  { label: "CMS Pages", href: "/cms", icon: "fa-regular fa-file-lines" },
  { label: "Support Tickets", href: "/support-tickets", icon: "fa-regular fa-life-ring" },
  { label: "Notifications", href: "/notifications", icon: "fa-regular fa-bell" },
  { label: "Settings", href: "/settings", icon: "fa-solid fa-gear" },
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((n) => [n.href.split("?")[0], n.label])
);
