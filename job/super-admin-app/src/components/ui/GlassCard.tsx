import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("glass-card", className)}>
      {(title || action) && (
        <header className="glass-card-head">
          {title && <h3>{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
