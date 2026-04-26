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

# --- ① アップデート権限チェック + version_track 取得（サイレント） ----------
# .license から license_id + fingerprint を取り、check_update API を叩く。
# update_allowed が false の場合は本体更新をスキップ。
# version_track="v2" なら v2.0 ブランチ、それ以外（v1 / 未取得）は main ブランチ。
# API 失敗時（ネットワーク断等）は main ブランチで進める（オフライン対応・後方互換）。
# 第1引数 ($1) で targetBranch をオーバーライド可能（_chk.mjs から呼ばれる場合）。
UPDATE_ALLOWED=1
TARGET_BRANCH="${1:-main}"  # デフォルト main、引数で上書き可能
if [ -f ".license" ] && command -v python3 >/dev/null 2>&1; then
  LICENSE_ID=$(python3 -c 'import json,sys;d=json.load(open(".license"));print(d.get("license_id",""))' 2>/dev/null)
  LICENSE_FP=$(python3 -c 'import json,sys;d=json.load(open(".license"));print(d.get("fingerprint",""))' 2>/dev/null)
  if [ -n "$LICENSE_ID" ] && [ -n "$LICENSE_FP" ]; then
    API_URL="https://script.google.com/macros/s/AKfycbz50xJ-uVfTMgHI4e0FTFa7b21q3S4oMftfI2SidWJPSbC_bhKYkmqFOj_RG0FWYkQe/exec"
    RESP=$(curl -sL --max-time 5 "$API_URL?action=check_update&id=$LICENSE_ID&fp=$LICENSE_FP" 2>/dev/null)
    if [ -n "$RESP" ]; then
      if echo "$RESP" | grep -q '"update_allowed":false'; then
        UPDATE_ALLOWED=0
      fi
      # version_track="v2" なら v2.0 ブランチに切替（コマンドライン引数が無い場合のみ）
      if [ -z "$1" ] && echo "$RESP" | grep -q '"version_track":"v2"'; then
        TARGET_BRANCH="v2.0"
      fi
    fi
  fi
fi

# --- ② 本体を最新版に同期 --------------------------------------------------
if [ "$UPDATE_ALLOWED" = "1" ]; then
  echo "→ 最新版を取得中... (branch: $TARGET_BRANCH)"
  if ! git fetch origin 2>/dev/null; then
    echo "⚠️  最新版の取得に失敗しました（ネットワークを確認してください）。"
    echo "   現在のバージョンでプロジェクト同期のみ実行します。"
    echo ""
  fi
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$TARGET_BRANCH" 2>/dev/null)

if [ "$UPDATE_ALLOWED" = "1" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
  REMOTE_VERSION=$(git show "origin/$TARGET_BRANCH:VERSION" 2>/dev/null | head -1 || echo "unknown")
  echo ""
  echo "📦 新しいバージョンが見つかりました: v$CURRENT_VERSION → v$REMOTE_VERSION ($TARGET_BRANCH)"
  echo ""
  git log --oneline "HEAD..origin/$TARGET_BRANCH" | head -10
  echo ""

  # ルート直下のローカル変更を保護（受講生がうっかり CLAUDE.md などを編集していた場合のセーフティネット）
  # projects/ は .gitignore 除外なので影響なし
  if ! git diff --quiet HEAD 2>/dev/null || [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
    STASH_MSG="auto-stash-before-update-$(date +%Y%m%d-%H%M%S)"
    echo "⚠️  ルート直下にローカル変更が見つかりました。安全のため一時退避します。"
    echo "   退避名: $STASH_MSG"
    echo "   退避した変更を戻すには: git stash list で確認 → git stash pop で復元"
    git stash push -u -m "$STASH_MSG" >/dev/null 2>&1 || true
    echo ""
  fi

  # ブランチが違う場合は checkout してから reset
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    git checkout -B "$TARGET_BRANCH" "origin/$TARGET_BRANCH" >/dev/null 2>&1
  else
    git reset --hard "origin/$TARGET_BRANCH" >/dev/null 2>&1
  fi
  NEW_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")
  NEW_COMMIT=$(git log -1 --format="%h %s")
  echo "✓ 最新版に更新しました: v$NEW_VERSION ($TARGET_BRANCH)"
  echo "  ($NEW_COMMIT)"
else
  echo "✓ すでに最新版です (v$CURRENT_VERSION, branch: $TARGET_BRANCH)"
fi
echo ""

# --- ③ projects/ 配下を最新テンプレに同期 ---------------------------------
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
