#!/bin/bash

# 既存の projects/ 内のプロジェクトを最新のテンプレートに更新するスクリプト
#
# 使い方:
#   ./プロジェクト更新.sh                → projects/ 配下の全プロジェクトを一括更新
#   ./プロジェクト更新.sh <プロジェクト名>    → 指定のプロジェクトのみ更新
#
# 更新される内容:
#   - .claude/skills/  （スキル・SKILL.md）
#   - scripts/         （Python/mjs スクリプト）
#   - CLAUDE.md        （AI行動ルール）
#
# 保護される内容（上書きされない）:
#   - public/          （動画・音声・画像・スライド）
#   - src/*.ts, src/*.tsx （テロップデータ・コンポジション等）
#   - video-context.md
#   - transcript_words.json / transcript.json
#   - node_modules/

cd "$(dirname "$0")"

echo ""
echo "=== naoki-blueprint プロジェクト更新 ==="
echo ""

# 1. 本体を最新版に同期
if [ -d ".git" ]; then
  echo "→ naoki-blueprint 本体を最新版に同期中..."
  git fetch origin
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse origin/main)
  if [ "$LOCAL" != "$REMOTE" ]; then
    git reset --hard origin/main
    echo "  最新版に更新しました: $(git log -1 --format='%h %s')"
  else
    echo "  すでに最新"
  fi
  echo ""
fi

# テンプレート自動判定
detect_template() {
  local proj="$1"
  # 横動画は step20-highlight-final が存在する
  if [ -d "$proj/.claude/skills/step20-highlight-final" ]; then
    echo ".template"
  else
    echo ".template-shorts"
  fi
}

# 1プロジェクトを更新
update_project() {
  local proj="$1"
  if [ ! -d "$proj" ]; then
    echo "❌ $proj が見つかりません"
    return 1
  fi

  local src
  src=$(detect_template "$proj")

  if [ ! -d "$src" ]; then
    echo "❌ テンプレート $src が見つかりません"
    return 1
  fi

  echo "→ $proj を更新（元: $src）"

  # スキル: 完全上書き（旧スキルも削除）
  if [ -d "$src/.claude/skills" ]; then
    mkdir -p "$proj/.claude"
    rsync -a --delete "$src/.claude/skills/" "$proj/.claude/skills/"
    echo "   ✓ .claude/skills/ 更新"
  fi

  # スクリプト: 上書き（追加のみ、削除なし）
  if [ -d "$src/scripts" ]; then
    mkdir -p "$proj/scripts"
    rsync -a "$src/scripts/" "$proj/scripts/"
    echo "   ✓ scripts/ 更新"
  fi

  # CLAUDE.md: 上書き
  if [ -f "$src/CLAUDE.md" ]; then
    cp -f "$src/CLAUDE.md" "$proj/CLAUDE.md"
    echo "   ✓ CLAUDE.md 更新"
  fi

  echo ""
}

# 2. 対象プロジェクトの決定
if [ -n "$1" ]; then
  # 引数あり: 指定のプロジェクトのみ
  update_project "projects/$1"
else
  # 引数なし: 全プロジェクトを更新
  if [ ! -d "projects" ] || [ -z "$(ls -A projects/ 2>/dev/null)" ]; then
    echo "projects/ が空です。更新対象なし。"
    exit 0
  fi

  COUNT=0
  for proj in projects/*/; do
    if [ -d "$proj" ]; then
      update_project "${proj%/}"
      COUNT=$((COUNT + 1))
    fi
  done

  echo "=== ✅ 完了: $COUNT プロジェクトを更新しました ==="
  echo ""
fi

echo "あなたが作った projects/ 内の素材や設定は保護されています。"
echo "もし動画制作の途中にこのスクリプトを走らせた場合は、"
echo "新しいスキル版を使って step の続きから再開してください。"
echo ""
