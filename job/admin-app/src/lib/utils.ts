export const money = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

export const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m <= 1 ? "just now" : `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
};

export const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const STATUS_META: Record<string, { cls: string; dots: number; dotCls: string }> = {
  Applied: { cls: "review", dots: 1, dotCls: "" },
  Viewed: { cls: "shortlisted", dots: 2, dotCls: "" },
  Shortlisted: { cls: "shortlisted", dots: 3, dotCls: "" },
  Interview: { cls: "interview", dots: 4, dotCls: "ok" },
  Selected: { cls: "interview", dots: 4, dotCls: "ok" },
  Rejected: { cls: "rejected", dots: 2, dotCls: "bad" },
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
