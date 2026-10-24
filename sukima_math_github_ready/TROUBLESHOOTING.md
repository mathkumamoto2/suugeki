# Troubleshooting

## MathBlock Runtime Error

以前の版では、`react-katex` を default import していたため、環境によって以下のエラーが出ました。

```text
Element type is invalid...
Check the render method of MathBlock.
```

v3.2.1では、`react-katex` を使わず、KaTeX本体の `katex.renderToString()` で直接HTMLを生成する方式に修正しています。

## 既存フォルダで直す場合

`frontend/components/MathBlock.tsx` をv3.2.1の内容に置き換えてください。

その後、frontendで以下を実行してください。

```powershell
Remove-Item -Recurse -Force .next
npm.cmd install
npm.cmd run dev
```

## Backend起動

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## Frontend起動

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
