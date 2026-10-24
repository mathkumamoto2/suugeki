# GitHub Upload Guide

## 1. GitHubで新規リポジトリを作る

おすすめリポジトリ名:

```text
sukima-math
```

## 2. このフォルダでGit初期化

```powershell
git init
git add .
git commit -m "Initial commit: Sukima Math MVP"
```

## 3. GitHubリポジトリと接続

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_NAME/sukima-math.git
git push -u origin main
```

## 4. もし remote origin already exists と出た場合

```powershell
git remote set-url origin https://github.com/YOUR_NAME/sukima-math.git
git push -u origin main
```

## 5. 上げる前の確認

```powershell
git status
```

以下が含まれていたら、GitHubに上げないでください。

```text
.env
.env.local
.venv/
node_modules/
.next/
```

これらは `.gitignore` で除外済みです。
