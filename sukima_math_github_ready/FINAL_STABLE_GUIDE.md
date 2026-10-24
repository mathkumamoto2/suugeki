# 数隙 v8.0 Final Stable Guide

## 目的

新機能を無限に増やすのではなく、既存機能を安定して起動・確認できる状態に寄せた最終安定版です。

## 起動

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend:

```powershell
cd frontend
Set-Content .env.local "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000"
.\start-final.ps1
```

PowerShellで止まる場合:

```powershell
npm.cmd run clean
npm.cmd run dev:safe
```

## 最初に見るページ

- `/system`: 自己診断
- `/ultimate`: 全機能一覧
- `/solve`: メイン解説
- `/training`: 訓練
- `/mistakes`: ミス診断
- `/visual-lab`: 可視化
- `/neo`: ゲーム体験

## 安定化内容

- Next/Webpack filesystem cacheを開発時に無効化
- Backendに `/api/system/self-test` を追加
- Frontendに `/system` を追加
- Global Error Boundaryを追加
- 404ページを追加
- 主要APIの統合テストを追加
- `run_all_checks.py` を追加

## 注意

ローカル環境依存のNode/Next/Windows問題を完全に0にすることはできません。
ただし、v8では観測済みのクラッシュ経路を避け、問題発生時に切り分けしやすくしています。
