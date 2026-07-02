export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badgeKey?: "applications" | "saved" | "interviews" | "messages" | "skillTests" | "alerts";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "fa-solid fa-house" },
  { label: "Find Jobs", href: "/find-jobs", icon: "fa-solid fa-magnifying-glass" },
  { label: "Recommended Jobs", href: "/recommended", icon: "fa-solid fa-wand-magic-sparkles" },
  { label: "Nearby Jobs", href: "/nearby-jobs", icon: "fa-solid fa-location-dot" },
  { label: "My Applications", href: "/applications", icon: "fa-regular fa-file-lines", badgeKey: "applications" },
  { label: "Saved Jobs", href: "/saved-jobs", icon: "fa-regular fa-heart", badgeKey: "saved" },
  { label: "Interview Schedule", href: "/interviews", icon: "fa-regular fa-calendar-check", badgeKey: "interviews" },
  { label: "Messages", href: "/messages", icon: "fa-regular fa-comment-dots", badgeKey: "messages" },
  { label: "Resume Builder", href: "/resume", icon: "fa-regular fa-id-card" },
  { label: "Skill Tests", href: "/skill-tests", icon: "fa-solid fa-clipboard-check", badgeKey: "skillTests" },
  { label: "Job Alerts", href: "/alerts", icon: "fa-regular fa-bell", badgeKey: "alerts" },
  { label: "My Profile", href: "/profile", icon: "fa-regular fa-user" },
  { label: "Subscription", href: "/subscription", icon: "fa-solid fa-crown" },
  { label: "Help & Support", href: "/support", icon: "fa-regular fa-circle-question" },
];

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((n) => [n.href, n.label])
);
