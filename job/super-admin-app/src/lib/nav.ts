export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: never;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Global Dashboard", href: "/dashboard", icon: "fa-solid fa-globe" },
  { label: "All Admins", href: "/admins", icon: "fa-solid fa-user-shield" },
  { label: "User Management", href: "/users", icon: "fa-solid fa-users" },
  { label: "Employer Verification", href: "/employer-verification", icon: "fa-solid fa-certificate" },
  { label: "Subscription Control", href: "/subscriptions", icon: "fa-solid fa-crown" },
  { label: "Revenue Analytics", href: "/revenue", icon: "fa-solid fa-indian-rupee-sign" },
  { label: "Payment Gateway", href: "/payments", icon: "fa-regular fa-credit-card" },
  { label: "AI Management", href: "/ai", icon: "fa-solid fa-robot" },
  { label: "API Management", href: "/api-mgmt", icon: "fa-solid fa-plug" },
  { label: "Audit Logs", href: "/audit-logs", icon: "fa-solid fa-clock-rotate-left" },
  { label: "System Monitoring", href: "/monitoring", icon: "fa-solid fa-server" },
  { label: "Security Center", href: "/security", icon: "fa-solid fa-shield-halved" },
  { label: "Database Management", href: "/database", icon: "fa-solid fa-database" },
  { label: "Platform Settings", href: "/settings", icon: "fa-solid fa-gear" },
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((n) => [n.href.split("?")[0], n.label])
);
