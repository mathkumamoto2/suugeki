export function LoadingState({ active, label = "処理中..." }: { active: boolean; label?: string }) {
  if (!active) return null;
  return (
    <div className="card">
      <span className="badge">Loading</span>
      <p>{label}</p>
    </div>
  );
}
