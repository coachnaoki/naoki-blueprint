#!/bin/bash

# naoki-blueprint を最新版に更新するスクリプト

cd "$(dirname "$0")"

echo ""
echo "=== naoki-blueprint アップデート ==="
echo ""

# Gitリポジトリか確認
if [ ! -d ".git" ]; then
  echo "❌ ここは Git リポジトリではありません。"
  echo "   git clone https://github.com/coachnaoki/naoki-blueprint.git で取得し直してください。"
  exit 1
fi

# 現在のバージョン（最新コミット）を表示
CURRENT=$(git log -1 --format="%h %s" 2>/dev/null)
echo "現在のバージョン: $CURRENT"
echo ""

echo "→ 最新版を取得中..."
git fetch origin

# 差分があるか確認
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo ""
  echo "✅ すでに最新版です。更新は不要！"
  echo ""
  exit 0
fi

echo ""
echo "📦 新しいバージョンが見つかりました:"
git log --oneline HEAD..origin/main | head -10
echo ""

# 確認なしで強制上書き（projects/ と .license は .gitignore で守られる）
git reset --hard origin/main

NEW=$(git log -1 --format="%h %s")
echo ""
echo "=== ✅ アップデート完了！ ==="
echo ""
echo "新しいバージョン: $NEW"
echo ""
echo "あなたが作った projects/ と .license は安全です。"
echo ""
