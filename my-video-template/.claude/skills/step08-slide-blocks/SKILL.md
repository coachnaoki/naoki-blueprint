---
name: step08-slide-blocks
description: ブロック分割スライドのスクリーンショットをPuppeteerで撮影する。テロップタイミングに合わせてブロックを順次表示するための段階的画像を生成する。
argument-hint: [対象スライド番号（省略時は全対象スライド）]
allowed-tools: Read, Write, Edit, Glob, Bash(node *), Bash(ls *), Bash(mkdir *)
---

# Step 08: ブロック分割スライドキャプチャ

スライド内の複数ブロック（カード、カラム、ステップ等）を段階的に表示するスクリーンショットを撮影する。

## 目的

テロップのタイミングに合わせてスライド内のブロックを1つずつ表示させることで、視聴者の注目を誘導し、情報の段階的理解を促す。

## 前提条件
- Step 07（スライドキャプチャ）が完了していること
- `scripts/captureSlideBlocks.mjs` が存在すること
- 元のHTMLスライドファイルが存在すること（`gas-genspark/slides.html`）

## 仕組み

### 撮影方式（重要）
元の `gas-genspark/screenshot.js` と**完全に同じ撮影方式**を使う：
- **ビューポート**: `1280x720` + `deviceScaleFactor: 2`（高解像度出力）
- **クリップ**: `.slide-container` のBoundingRectでクリップ（固定座標クリップ禁止）
- **フォント待ち**: `document.fonts.ready` + 500ms待機
- **ページ管理**: ステップごとに新しいページを開く（CSSリセットのため）
- **非表示方法**: `visibility: hidden` でブロックを隠す（レイアウトを崩さない）

### なぜこの方式か
- `1920x1080` + `deviceScaleFactor: 1` で撮ると**レイアウトが崩れる**
- CSSオーバーライドで `#stage` のサイズを変更すると**デザインが壊れる**
- 元のスクリプトと同じ条件で撮影することで、元のスライドとピクセル単位で一致する

## やること

### 1. 対象スライドの特定

ブロック分割が必要なスライドを特定する。対象は以下のようなレイアウトを持つスライド：
- `two-columns`: 2カラム比較（例: 問題1→問題2）
- `three-cards`: 3カラムカード（例: カード1→2→3）
- `steps`: 縦ステップ（例: ステップ1→2）
- `closing`: クロージングカード

### 2. ブロック設定の確認・編集

`scripts/captureSlideBlocks.mjs` 内の `BLOCK_CONFIGS` を確認し、必要に応じて編集する。

各スライドの設定例：
```javascript
// スライド4: two-columns（問題1→問題2）
4: {
  steps: [
    { suffix: "title", hide: ".flex-1.flex.px-10 > .flex-1" },         // タイトルのみ
    { suffix: "col1", hide: ".flex-1.flex.px-10 > .flex-1:nth-child(2)" }, // 左カラムのみ
    { suffix: "full", hide: null },                                      // 全表示
  ],
},
```

### 3. CSSセレクタの特定方法

HTMLスライドをブラウザで開き、DevToolsで対象要素のセレクタを調べる。
- `visibility: hidden` を使うこと（`display: none` はレイアウトが崩れる）
- 非表示にしたいブロックだけを指定する

### 4. キャプチャ実行

```bash
node scripts/captureSlideBlocks.mjs
```

### 5. 結果確認

撮影したブロック画像が元のスライドとデザインが一致しているか確認する：
```bash
ls -la public/slides/blocks/
```

fullバージョンと元のスライドPNGを見比べて、レイアウト・フォント・サイズが一致していることを確認する。

### 6. slideTimeline.ts の更新

`src/slideTimeline.ts` で対象スライドをブロック画像に分割する：
```typescript
// 変更前: 1つのスライド
{ slideNumber: 4, startFrame: 627, endFrame: 868 },

// 変更後: ブロック分割
{ slideNumber: 4, startFrame: 627, endFrame: 723, image: "slides/blocks/slide-04-title.png" },
{ slideNumber: 4, startFrame: 724, endFrame: 777, image: "slides/blocks/slide-04-col1.png" },
{ slideNumber: 4, startFrame: 778, endFrame: 868, image: "slides/blocks/slide-04-full.png" },
```

各ブロックの `startFrame` は、対応するテロップの `startFrame` に合わせる（`telopData.ts` 参照）。

### 7. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 出力ファイル
- `public/slides/blocks/slide-{NN}-{suffix}.png`
  - suffix例: `title`, `col1`, `col2`, `card1`, `card2`, `step1`, `full`

## 完了条件
- `public/slides/blocks/` にブロック画像が生成されている
- fullバージョンが元のスライドとデザイン一致している
- `slideTimeline.ts` が更新されている
- TypeScriptコンパイルが通る

## 完了後

```
✅ Step 08 完了: ブロック分割スライドキャプチャが完了しました。

次のステップ → /step09-template（テンプレート設定）
進めますか？

【生成ファイル】
- public/slides/blocks/slide-{NN}-{suffix}.png × {N}枚

【slideTimeline更新】
- スライド{N}: {ステップ数}段階に分割

プレビューで確認してね。
```
