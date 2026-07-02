import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  gradient,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={cn("stat-card", onClick && "clickable")} onClick={onClick}>
      <span className="stat-icon" style={{ background: gradient }}>
        {icon}
      </span>
      <div>
        <h4>{label}</h4>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </button>
  );
}
