# 数隙 v6.0 Neo Prime Error-Zero Guide

## 今回のエラー

ログの中心は以下です。

```text
abort: Lazy deopt after a fast API call with return value is unsupported
```

これはReactコンポーネントの通常Runtime Errorではなく、Next.js / Webpack の開発キャッシュ保存中に Node/V8 が落ちる系統の問題です。

## v6.0での対策

`frontend/next.config.mjs` で開発時の Webpack filesystem cache を無効化しています。

```js
if (dev) {
  config.cache = false;
}
```

また、以下を追加しています。

- `frontend/start-safe.ps1`
- `frontend/start-safe.cmd`
- `npm run clean`
- `npm run dev:safe`

## 推奨起動

```powershell
cd frontend
.\start-safe.ps1
```

または

```cmd
cd frontend
start-safe.cmd
```

## まだ落ちる場合

1. すべてのPowerShellを閉じる
2. タスクマネージャーで node.exe を終了
3. frontendで以下を実行

```powershell
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
npm.cmd run dev:safe
```
