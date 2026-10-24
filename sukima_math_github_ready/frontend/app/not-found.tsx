export default function NotFound() {
  return (
    <div className="card">
      <span className="badge">404</span>
      <h1>ページが見つかりません</h1>
      <p className="small">左のナビゲーションからページを選び直してください。</p>
      <a className="secondary" href="/ultimate">Ultimateへ戻る</a>
    </div>
  );
}
