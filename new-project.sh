#!/bin/bash

# 新しい動画プロジェクトを作成するスクリプト

cd "$(dirname "$0")"

echo ""
echo "=== 新しい動画プロジェクトを作成 ==="
echo ""

if [ -n "$1" ]; then
  PROJECT_NAME="$1"
else
  read -p "プロジェクト名を入力してください（例: tennis-serve-tips）: " PROJECT_NAME
fi

if [ -z "$PROJECT_NAME" ]; then
  echo "プロジェクト名が入力されませんでした。"
  exit 1
fi

if [ -d "projects/$PROJECT_NAME" ]; then
  echo "projects/$PROJECT_NAME は既に存在します。別の名前を指定してください。"
  exit 1
fi

mkdir -p projects
cp -r .template "projects/$PROJECT_NAME"
cd "projects/$PROJECT_NAME"
npm install

echo ""
echo "=== 完成！ ==="
echo ""
echo "次のステップ:"
echo "  cd projects/$PROJECT_NAME"
echo "  claude --dangerously-skip-permissions"
echo "  /step01-context"
echo ""
