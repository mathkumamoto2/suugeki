# AI Timeout Fix

## 症状

Frontendに以下が出る:

```text
APIの応答がタイムアウトしました
```

## 原因

`qwen3:8b` のOllama応答が遅く、Frontendの待ち時間を超えています。

## v3.5.1の対策

Backendの `.env` で以下をデフォルトにしています。

```env
SUKIMA_LLM_AUTO_ENHANCE=false
```

この状態では `/api/solve` はAIを待たずに即返します。
Ollamaの接続確認だけをしたい場合は:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/llm/health
```

## AI説明をどうしても有効にしたい場合

```env
SUKIMA_LLM_AUTO_ENHANCE=true
```

に変更してBackendを再起動してください。
ただし `qwen3:8b` はノートPCでは遅い場合があります。
軽くしたい場合は:

```env
SUKIMA_LLM_MODEL=llama3.2:3b
SUKIMA_LLM_AUTO_ENHANCE=true
```

を試してください。
