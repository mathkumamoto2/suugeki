
export function PageHeader({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-head">
      <span className="badge">{badge}</span>
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{description}</p>
    </div>
  );
}
