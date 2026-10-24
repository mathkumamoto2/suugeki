"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main className="shell">
          <div className="card">
            <span className="badge">Error Boundary</span>
            <h1>画面エラーを捕捉しました</h1>
            <p>アプリ全体が白画面にならないよう、エラー境界で停止しました。</p>
            <pre className="jsonbox">{error.message}</pre>
            <button onClick={reset}>再試行</button>
            <a className="secondary" href="/system">System Checkへ</a>
          </div>
        </main>
      </body>
    </html>
  );
}
