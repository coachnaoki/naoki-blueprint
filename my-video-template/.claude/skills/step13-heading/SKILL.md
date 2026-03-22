---
name: step13-heading
description: 見出しバナー（HeadingBanner）を動画に挿入する。セクション区切りを視覚的に表示する。
argument-hint: [見出しテキスト（省略時はvideo-context.mdから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *)
---

# Step 13: 見出しバナー挿入（任意）

動画のセクション区切りに見出しバナー（HeadingBanner）を追加する。

## 前提条件
- Step 12（グリーンバック）が完了またはスキップ済み
- `video-context.md` でセクション構成を把握していること

## スキップ条件
- 見出しバナーが不要な場合はスキップ → step14-images へ

## 仕様（CLAUDE.md準拠）

- **位置**: 左上（top: 30〜50px, left: 0）
- **デザイン**: 斜め（transform: skewX）緑〜ティール背景（#10B981→#059669）
- **文字**: 白、太字、fontSize: 54
- **z-index**: 10以上

## やること

### 1. セクション構成の確認

`video-context.md` と `transcript_words.json` から、見出しを表示するタイミングを特定する。

### 2. HeadingBannerコンポーネントの確認・作成

既存の `HeadingBanner` コンポーネントがあれば確認、なければ作成する。

### 3. 表示タイミングの設定

- 「自己紹介」「本日のテーマ」発表後から本編全体を通して表示
- セクション切り替え時にテキストを変更
- CTAシーンでは非表示にしても可

### 4. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 13 完了: 見出しバナーを挿入しました。

【見出し一覧】
- f{N}〜f{N}: 「○○」
- f{N}〜f{N}: 「○○」

次のステップ → /step14-images（画像挿入）
進めますか？
```
