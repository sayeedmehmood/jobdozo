export function EmptyState({ icon, title, desc, action }: {
  icon?: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state" role="status">
      {icon && <i className={`fa-solid ${icon}`} aria-hidden />}
      <strong>{title}</strong>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  );
}
