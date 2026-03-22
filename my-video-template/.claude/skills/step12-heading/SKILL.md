---
name: step12-heading
description: 見出しバナー（HeadingBanner）を動画に挿入する。左からスライドイン・スライドアウトで表示。
argument-hint: [見出しテキスト（省略時はvideo-context.mdから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *)
---

# Step 12: 見出しバナー挿入（任意）

動画のセクション区切りに見出しバナー（HeadingBanner）を追加する。

## 前提条件
- Step 11（グリーンバック）が完了またはスキップ済み
- `video-context.md` でセクション構成を把握していること

## スキップ条件
- 見出しバナーが不要な場合はスキップ → step13-bgm へ

## ユーザーに確認すること（必須）

以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間に見出しを入れるか**（台本のどこからどこまで）
2. **見出しテキスト**（各セクションの表示文字）

## 仕様（CLAUDE.md準拠）

- **位置**: 左上（top: 30〜50px, left: 0）
- **デザイン**: 斜め（transform: skewX）緑〜ティール背景（#10B981→#059669）
- **文字**: 白、太字、fontSize: 54
- **z-index**: 10以上

## アニメーション

- **表示**: 左からスライドイン（translateXで画面外→定位置、10フレーム）
- **非表示**: 左へスライドアウト（定位置→画面外、10フレーム）

```typescript
const slideIn = interpolate(
  frame,
  [startFrame, startFrame + 10],
  [-300, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
const slideOut = interpolate(
  frame,
  [endFrame - 10, endFrame],
  [0, -300],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
const translateX = frame < endFrame - 10 ? slideIn : slideOut;
```

## やること

### 1. 台本のタイミング特定

`transcript_words.json` でユーザーが指定した区間の正確なフレームを特定する。

### 2. HeadingBannerコンポーネントの確認・作成

既存の `HeadingBanner` コンポーネントがあれば確認、なければ作成する。

### 3. 表示タイミングの設定

- ユーザーが指定した区間に表示
- セクション切り替え時にテキストを変更
- CTAシーンでは非表示にしても可

### 4. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 12 完了: 見出しバナーを挿入しました。

【見出し一覧】
- f{N}〜f{N}: 「○○」（左スライドイン/アウト）
- f{N}〜f{N}: 「○○」（左スライドイン/アウト）

次のステップ → /step13-bgm（BGM挿入）
進めますか？
```
