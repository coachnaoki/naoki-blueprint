#!/bin/bash

# 新しい動画プロジェクトを作成するスクリプト

cd "$(dirname "$0")"

echo ""
echo "=== 新しい動画プロジェクトを作成 ==="
echo ""

# プロジェクト名
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

# 動画タイプを選択
if [ -n "$2" ]; then
  TYPE_NUM="$2"
else
  echo ""
  echo "作る動画のタイプを選んでください:"
  echo "  1) YouTube 横動画 (1920×1080 / 10〜20分 / 20ステップ)"
  echo "  2) ショート動画  (1080×1920 / 30〜60秒 / 14ステップ)"
  read -p "番号を入力 [1/2]: " TYPE_NUM
fi

case "$TYPE_NUM" in
  2)
    SRC=".template-shorts"
    LABEL="ショート動画"
    ;;
  1|"")
    SRC=".template"
    LABEL="YouTube 横動画"
    ;;
  *)
    echo "無効な選択です。"
    exit 1
    ;;
esac

if [ ! -d "$SRC" ]; then
  echo "テンプレート $SRC が見つかりません。"
  exit 1
fi

echo ""
echo "→ $LABEL のテンプレート ($SRC) を使います"
echo ""

mkdir -p projects
cp -r "$SRC" "projects/$PROJECT_NAME"
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
