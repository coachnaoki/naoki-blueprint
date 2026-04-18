# A. 手動画像挿入

画像ファイルが `public/images/inserts/`（横挿入）または `public/images/overlays/`（全画面）に配置されている前提。

## ユーザーに確認すること（必須）

各画像について以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間に入れるか**（台本のどこからどこまで）
2. **アニメーション**:
   - `zoom` — ゆっくりズームイン（Ken Burns風）
   - `slideUp` — 拡大しながらゆっくり上にスライド
   - `slideLeft` — 拡大しながらゆっくり左にスライド

## やること

1. `public/images/inserts/`（横挿入）または `public/images/overlays/`（全画面）で画像素材を確認（Win/Mac/Linux: `node scripts/open-file.mjs public/images`）
2. `transcript_words.json` でユーザーが指定した区間の正確なフレームを特定
3. MainComposition.tsx に追加（全画面1080×1920）
4. テロップとの重複チェック（z-index確認）
5. `npx tsc --noEmit` でコンパイル確認

→ SKILL.md の「表示ルール」「実装リファレンス」を参照
