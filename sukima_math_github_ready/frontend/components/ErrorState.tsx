export function ErrorState({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="card error-card">
      <h3>エラーが発生しました</h3>
      <p>{message}</p>
      <p className="small">
        Backendが起動しているか、入力式に未対応の文字や x 以外の変数が入っていないか確認してください。
      </p>
    </div>
  );
}
