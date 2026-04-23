#!/bin/bash

# naoki-blueprint を最新版に更新するスクリプト
# 本体を最新版に同期し、projects/ 配下のプロジェクトも最新テンプレで更新する。
#
# 更新される内容:
#   - 本体の .template / .template-shorts / scripts / docs 等すべて
#   - projects/*/ の .claude/skills/ / scripts/ / CLAUDE.md
#
# 保護される内容（上書きされない）:
#   - projects/*/public/        （動画・音声・画像・スライド）
#   - projects/*/src/*.ts, *.tsx （テロップデータ・コンポジション等）
#   - projects/*/video-context.md
#   - projects/*/transcript_words.json / transcript.json
#   - projects/*/node_modules/
#   - .license                   （ライセンスファイル）

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

# 現在のバージョンを表示
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")
CURRENT_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null)
echo "現在のバージョン: v$CURRENT_VERSION"
echo "  ($CURRENT_COMMIT)"
echo ""

# --- ① 本体を最新版に同期 --------------------------------------------------
echo "→ 最新版を取得中..."
if ! git fetch origin 2>/dev/null; then
  echo "⚠️  最新版の取得に失敗しました（ネットワークを確認してください）。"
  echo "   現在のバージョンでプロジェクト同期のみ実行します。"
  echo ""
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null)

if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
  REMOTE_VERSION=$(git show "origin/main:VERSION" 2>/dev/null | head -1 || echo "unknown")
  echo ""
  echo "📦 新しいバージョンが見つかりました: v$CURRENT_VERSION → v$REMOTE_VERSION"
  echo ""
  git log --oneline HEAD..origin/main | head -10
  echo ""
  git reset --hard origin/main >/dev/null 2>&1
  NEW_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")
  NEW_COMMIT=$(git log -1 --format="%h %s")
  echo "✓ 最新版に更新しました: v$NEW_VERSION"
  echo "  ($NEW_COMMIT)"
else
  echo "✓ すでに最新版です (v$CURRENT_VERSION)"
fi
echo ""

# --- ② projects/ 配下を最新テンプレに同期 ---------------------------------
# テンプレート自動判定（横動画 or ショート動画）
detect_template() {
  local proj="$1"
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
    return 1
  fi

  local src
  src=$(detect_template "$proj")

  if [ ! -d "$src" ]; then
    echo "   ❌ テンプレート $src が見つかりません"
    return 1
  fi

  echo "→ $proj を更新（元: $src）"

  # スキル: 完全上書き（旧スキルも削除）
  if [ -d "$src/.claude/skills" ]; then
    mkdir -p "$proj/.claude"
    rsync -a --delete "$src/.claude/skills/" "$proj/.claude/skills/"
    echo "   ✓ .claude/skills/ 更新"
  fi

  # スラッシュコマンド: 完全上書き（旧コマンドも削除）
  if [ -d "$src/.claude/commands" ]; then
    mkdir -p "$proj/.claude"
    rsync -a --delete "$src/.claude/commands/" "$proj/.claude/commands/"
    echo "   ✓ .claude/commands/ 更新"
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
}

if [ -d "projects" ] && [ -n "$(ls -A projects/ 2>/dev/null)" ]; then
  echo "→ projects/ 配下を最新テンプレで同期中..."
  echo ""
  COUNT=0
  for proj in projects/*/; do
    if [ -d "$proj" ]; then
      update_project "${proj%/}"
      COUNT=$((COUNT + 1))
      echo ""
    fi
  done
  echo "=== ✅ アップデート完了: $COUNT プロジェクトを同期しました ==="
else
  echo "=== ✅ アップデート完了（projects/ が空のため本体のみ更新） ==="
fi

echo ""
echo "あなたが作った public/ 内の素材・TSX・transcript・.license は保護されています。"
echo ""
echo "📋 変更の詳細は CHANGELOG.md を見てください:"
echo "   cat CHANGELOG.md"
echo "   または https://github.com/coachnaoki/naoki-blueprint/blob/main/CHANGELOG.md"
echo ""
