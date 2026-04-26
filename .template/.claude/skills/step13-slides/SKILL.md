---
name: step13-slides
description: HTMLスライドをPuppeteerでキャプチャ＋ブロック分割し、スライドタイムライン（slideTimeline.ts）を作成する。ユーザーが「スライドキャプチャ」「Puppeteer」「slideTimeline」「ステップ13」と言ったら起動する。
argument-hint: [HTMLファイルパス]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node *), Bash(ls *), Bash(mkdir *), Bash(npx tsc *), Bash(node scripts/_chk.mjs *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step13-slides` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 14: スライドキャプチャ＋タイムライン

HTMLスライドをPuppeteerでキャプチャし、スライドタイムライン（slideTimeline.ts）を作成する。

## 前提条件
- Step 13（スライド生成）が完了していること
- HTMLスライドファイルのパスが分かっていること
- Puppeteerがインストールされていること（`npm ls puppeteer`）

---

## Part 1: スライドキャプチャ＋ブロック分割

### 1. スライドHTMLの確認

step12-slides-gen で生成済みの `aislides/slides.html` を使う。引数 `$ARGUMENTS` でパスが指定されていればそれを優先する。

**スライドが不要な場合**はこのステップをスキップして次へ進む。

### 2. キャプチャスクリプト

`scripts/captureSlides.mjs` は v2.0 仕様で固定 (TOTAL_SLIDES の手動設定は不要)。スクリプトが自動で:

- ビューポート 1920×1080 + `deviceScaleFactor: 2`（実質 3840×2160 の高解像度）
- `section.slide` 要素を順次クエリしてスライド数を自動検出
- `data-blocks="N"` 属性を持つスライドはブロック分割キャプチャ
- `data-block-index="K"` の要素を K まで表示して各ブロックをキャプチャ
- `document.fonts.ready` でフォント読み込みを待つ
- `public/slides/slide-NN.png` または `slide-NN-blockK.png` として保存

スクリプトを編集する必要は通常ない。ただし**他プロジェクトから流用する場合は古い `BLOCK_TEMPLATE_MAP` 方式が残っていないか確認**すること。

### 3. ブロック分割（HTML 属性で自動検出）

**ブロック分割は HTML の `data-blocks` / `data-block-index` 属性から自動検出される。**（旧 `SLIDE_SCRIPT` + `BLOCK_TEMPLATE_MAP` 方式は v2.0 で廃止）

step12-slides-gen が生成した HTML が以下の形式になっていることを前提とする:

```html
<!-- ブロック分割するスライド -->
<section class="slide" data-blocks="3">
  <h1>共通の見出し（全blockで表示）</h1>
  <div data-block-index="1">...カード1...</div>
  <div data-block-index="2">...カード2...</div>
  <div data-block-index="3">...カード3...</div>
</section>

<!-- ブロック分割しないスライド（data-blocks 属性なし） -->
<section class="slide">
  <h1>...</h1>
</section>
```

#### 分割すべきスライドの目安（step12 で対応済みのはず）

| 種別 | data-blocks |
|---|---|
| stats（数字パネル複数） | 2 |
| three-cards / 3要素列挙 | 3 |
| answer + 番号サマリー | 3 |
| vs / before-after | 2 |
| checklist + key-concept | 4 |
| steps + key-moment | 4 |
| 3 targets / ranking | 3 |

step12 で生成された HTML に分割対応が漏れていたら、その場で `data-blocks` / `data-block-index` を追加してから本ステップを実行する。

### 4. キャプチャ実行

```bash
node scripts/captureSlides.mjs
```

実行ログ例:
```
📑 スライド数: 12
🎨 生成PNG数: 27

  ✓ slide-01.png
  ✓ slide-02-block1.png (block 1/2)
  ✓ slide-02-block2.png (block 2/2)
  ...
```

### 5. 結果確認

- `public/slides/` にPNGファイルが生成されたか確認
- ファイル数とサイズを表示

---

## Part 2: スライドタイムライン作成

### 6. タイムライン設計

`src/slideTimeline.ts` を作成し、各スライドの表示フレーム範囲を定義する。

#### フレーム算出手順（必須）

1. `transcript_words.json` を読み、各スライドの内容に対応する**発話区間**を特定する
2. スライドの `startFrame` = その話題が始まるワードの `start` 時刻 × FPS
3. スライドの `endFrame` = その話題が終わるワードの `end` 時刻 × FPS（または次のスライドのstartFrame - 1）
4. **フレーム値は整数に計算して出力する**（Math.roundの計算式を残さない）
5. `video-context.md` のFPSを使用する

```typescript
export interface SlideSegment {
  slideNumber: number;
  startFrame: number;
  endFrame: number;
  image?: string;       // スライドPNG以外の画像を使う場合
  motion?: "panRight" | "zoomIn" | "panUp" | "panDown" | "fadeIn";
}

export const slideTimeline: SlideSegment[] = [ ... ];
```

### 7. 追加提案

ユーザーの承認後、さらに改善できる点を提案する：

- **ブロック分割**: 箇条書き・カード系スライドに段階表示が必要か
- **Ken Burnsモーション**: 静止画に動きをつけるか
- **表示時間が長すぎるスライド**: 分割やモーション追加を提案

### 8. ユーザーの希望を聞く

```
他に特別にスライドを入れたい場所はありますか？
（例: 「○○の話をしている辺りにslide-05を追加したい」など）
```

## モーション実装コード

### Ken Burns（全画面画像用）

```typescript
// zoomIn: ゆっくりズームイン
transform: `scale(${interpolate(frame, [startFrame, endFrame], [1.0, 1.15], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})})`

// panRight: 拡大しながら右→左にパン
transform: `scale(1.15) translateX(${interpolate(frame, [startFrame, endFrame], [20, -20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`

// panUp: 拡大しながら下→上にパン
transform: `scale(1.15) translateY(${interpolate(frame, [startFrame, endFrame], [20, -20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`

// panDown: 拡大しながら上→下にパン
transform: `scale(1.15) translateY(${interpolate(frame, [startFrame, endFrame], [-20, 20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`
```

⚠️ `scale(1.15)` は必須。スケールなしでtranslateだけ使うと画面端に余白が出る。

### fadeIn（ブロック分割の2枚目以降）

前のブロック画像を下に表示した状態で、現在のブロック画像を上にフェードインする。

```typescript
// 前のブロック（常にopacity: 1で下に表示）
<Img src={staticFile(`slides/${prevBlock}`)} style={{
  position: "absolute", width: 1920, height: 1080,
  objectFit: "cover", zIndex: 5,
}} />
// 現在のブロック（10フレームで0→1にフェードイン）
<Img src={staticFile(`slides/${currentBlock}`)} style={{
  position: "absolute", width: 1920, height: 1080,
  objectFit: "cover", zIndex: 5,
  opacity: interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }),
}} />
```

## ルール

- **スライド間の隙間を埋める（必須）**: スライド間が1秒（25フレーム）以内の場合、前のスライドのendFrameを次のstartFrame-1に延長して隙間をなくす
- **最終フレームまでカバー（必須）**: 最後のスライドのendFrameは動画の最終フレーム（durationInFrames）まで延長する
- **スライド同士の重複禁止**: 同じフレームに複数スライドが重ならないこと
- **ワイプ表示**: スライドPNG表示中は話者ワイプを表示。**全画面画像表示中はワイプ非表示**
- **1枚のみのスライドはアニメーション不要**: ブロック分割しない単独スライドにはmotionを指定しない
- **全画面画像のアニメーション（必須）**: `image` で全画面画像を挿入する場合、必ず `motion` を指定する（zoomIn / panUp / panDown / panRight からランダム）
- **ブロック分割スライドのルール（必須）**:
  - 各ブロック間にフレームの隙間を空けない
  - 1枚目（block1）はアニメーションなし
  - 2枚目以降は `motion: "fadeIn"` 固定（10フレームでフェードイン）
  - fadeIn時は前のブロック画像を下に表示した状態で現在のブロック画像を上にフェードイン

## TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## 完了条件
- `public/slides/` にスライドPNGが存在する
- 全スライドが3840×2160（1920×1080 × deviceScaleFactor: 2）で生成されている
- `src/slideTimeline.ts` が存在する
- テロップデータとのフレーム範囲が整合している
- TypeScript ビルドが通る

## 完了後

```
✅ Step 14 完了: スライドキャプチャ＋タイムラインを作成しました。

【生成ファイル】
- public/slides/slide-01.png 〜 slide-{N}.png
- public/slides/slide-{N}-block{N}.png（自動検出でブロック分割）

【タイムライン】
- セグメント数: ○○個
- スライド枚数: ○○枚
- 画像挿入区間: ○○箇所

次のステップ → /step14-wipe（ワイプ位置調整）
進めますか？
```
