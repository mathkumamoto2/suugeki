
import Link from "next/link";

export function ModeCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="card feature-card">
      <div>
        <span className="badge">{icon}</span>
        <h2>{title}</h2>
        <p className="small">{description}</p>
      </div>
      <div className="small">開く →</div>
    </Link>
  );
}
