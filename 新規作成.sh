#!/bin/bash

# 新しい動画プロジェクトを作成するスクリプト
# （プロジェクト作成前に naoki-blueprint 本体を自動で最新版に同期します）

cd "$(dirname "$0")"

echo ""
echo "=== 新しい動画プロジェクトを作成 ==="
echo ""

# --- ① 最新版に自動同期（Gitリポジトリの場合のみ） -------------------------
# 配布済みユーザーがアップデートに気づかない問題を解決するため、
# 新規作成のたびに本体を最新に揃える。projects/ と .license は .gitignore
# で守られているので既存プロジェクトは影響を受けない。
if [ -d ".git" ]; then
  echo "→ 最新版を確認中..."
  if git fetch origin 2>/dev/null; then
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main 2>/dev/null)
    if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
      echo "  📦 新しいバージョンが利用可能です。更新中..."
      git log --oneline HEAD..origin/main | head -5 | sed 's/^/     /'
      if git reset --hard origin/main >/dev/null 2>&1; then
        echo "  ✓ 最新版に更新しました: $(git log -1 --format='%h %s')"
      else
        echo "  ⚠️  自動更新に失敗しました。手動で ./アップデート.sh を実行してください。"
      fi
    else
      echo "  ✓ すでに最新版です"
    fi
  else
    echo "  ⚠️  最新版の確認に失敗しました（ネットワークを確認してください）。現在のバージョンで続行します。"
  fi
  echo ""
fi

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
  echo "  1) YouTube 横動画 (1920×1080 / 20ステップ)"
  echo "  2) ショート動画  (1080×1920 / 14ステップ)"
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
