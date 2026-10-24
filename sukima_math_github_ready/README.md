# 数隙 Sukima Math

数隙は、大学数学の「途中式がわからない」という隙間を埋めるための学習アプリです。

単に答えを出すのではなく、**ヒント → 解説 → 自力再現 → 診断 → 復習** を一本の学習フローとして提供します。

## コンセプト

多くの大学数学教材では、次のような問題があります。

- 解答がない
- 答えだけで途中式がない
- 途中式が省略されすぎている
- 解説を読んでも自力で再現できない
- どの単元に戻ればよいか分からない

数隙はこの「理解の隙間」を埋めることを目的にしています。

## 主な機能

- 積分問題の途中式解説
- Hint First モード
- Answer Quick モード
- 自力再現
- 行間変形チェック
- ミス分類
- 類題推薦
- 復習ルート表示
- 学習履歴
- XP / デイリーミッション
- 粒子アニメーション付きログイン画面

## 技術スタック

### Frontend

- Next.js
- TypeScript
- React
- KaTeX
- CSS

### Backend

- FastAPI
- SymPy
- Python
- optional: Ollama local LLM

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/YOUR_NAME/sukima-math.git
cd sukima-math
```

### 2. Backend 起動

PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

または、プロジェクト直下で:

```powershell
.\start_backend.ps1
```

PowerShellの実行ポリシーで止まる場合は、`start_backend.cmd` を使ってください。

```cmd
start_backend.cmd
```

### 3. Frontend 起動

別ターミナルで:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run clean
npm.cmd run dev:safe
```

または、プロジェクト直下で:

```powershell
.\start_frontend.ps1
```

PowerShellの実行ポリシーで止まる場合は、`start_frontend.cmd` を使ってください。

```cmd
start_frontend.cmd
```

### 4. アプリを開く

```text
http://localhost:3000/login
```

## Backend API 確認

Backend起動後、以下にアクセスできます。

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/api/health
```

## 環境変数

`frontend/.env.example` をコピーして `frontend/.env.local` を作成してください。

```text
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

`.env.local` はGitHubに上げないでください。

## GitHubに上げないもの

このリポジトリでは `.gitignore` により以下を除外しています。

- `.env`
- `.env.local`
- `.venv/`
- `node_modules/`
- `.next/`
- `__pycache__/`
- `*.db`
- `*.sqlite`

## 開発メモ

このアプリはMVP段階です。  
現在の中心機能は「積分の途中式理解」です。OCRは意図的に外しています。

今後の拡張候補:

- 微分対応
- 極限対応
- AIヒント生成
- 学習履歴の永続化
- 実ユーザー認証
- デプロイ対応
