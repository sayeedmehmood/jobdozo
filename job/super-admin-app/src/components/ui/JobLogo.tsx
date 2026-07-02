export function JobLogo({ logo, bg, color, size = "md" }: {
  logo: string;
  bg: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span className={`job-logo job-logo-${size}`} style={{ background: bg, color: color || "#fff" }}>
      {(logo || "JM").slice(0, 3)}
    </span>
  );
}
