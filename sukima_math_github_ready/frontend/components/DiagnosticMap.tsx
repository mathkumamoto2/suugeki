import type { Diagnostic } from "@/lib/types";

export function DiagnosticMap({ diagnostic }: { diagnostic: Diagnostic }) {
  return (
    <div className="card">
      <span className="badge">Learning Navigation</span>
      <h2>つまずきマップ</h2>
      <p><strong>主単元：</strong>{diagnostic.main_topic}</p>

      <div className="card">
        <h3>復習ルート</h3>
        <div className="grid">
          {diagnostic.review_order.map((topic, index) => (
            <div className="card feature-card" key={`${topic}-${index}`}>
              <span className="badge">{index + 1}</span>
              <h3>{topic}</h3>
              <p className="small">{index === 0 ? "まずここへ戻る" : "次に確認する単元"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>弱点候補</h3>
          {diagnostic.weak_points.map((p) => <span className="badge" key={p}>{p}</span>)}
        </div>

        <div className="card">
          <h3>前提単元</h3>
          <ol>{diagnostic.prerequisites.map((p) => <li key={p}>{p}</li>)}</ol>
        </div>

        <div className="card">
          <h3>おすすめ問題</h3>
          <ul>{diagnostic.practice_problems.map((p) => <li key={p}><code>{p}</code></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
