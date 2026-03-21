---
name: step12-composition
description: メインコンポジション（MainComposition.tsx）を構築する。スライド背景・ワイプ・テロップレンダラー・SE・BGMを統合する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *)
---

# Step 12: メインコンポジション構築

`src/MainComposition.tsx`（メインのReactコンポーネント）を構築する。

## 前提条件
- Step 09〜11 で以下が完成していること：
  - `src/templateConfig.ts`
  - `src/telopData.ts`
  - `src/slideTimeline.ts`

## やること

### 1. コンポーネントの構造設計

MainComposition.tsx は以下の5つのレンダリングシステムで構成する：

#### A. スライド背景システム
- `slideTimeline` から現在のフレームに該当するスライドを取得
- 全スライド画像をプリロード（display: none/flex で切り替え）
- Ken Burns モーション対応（panRight, zoomIn, panUp, panDown）
- `Img` コンポーネントで表示、`objectFit: "cover"`
- **ブロックスライドのフェードイン**: 同じ`slideNumber`で複数エントリがあるスライド（ブロック分割スライド）は、最初のブロック以外の切り替え時に**8フレームのフェードイン**を適用する。フェード中は前のブロック画像を下地として表示し、新しい画像をopacity 0→1で重ねる

#### B. 円形ワイプシステム
- メイン動画を右上の円形フレームで表示（見た目: 直径325px）
- 325×325px + `borderRadius: "50%"` + `overflow: "hidden"`
- **位置**: `top: 30, right: 30`
- **サイズが325pxの理由**: 280pxだとobjectPosition+scaleが極端な場合に動画フレーム端が灰色の角として露出するため325pxを使う
- `hideWipe === true` のスライド区間では非表示（ただし音声は維持）
  - 音声維持: `width: 0, height: 0, opacity: 0` の OffthreadVideo

##### ワイプ位置調整手順（計算＋方向ループ）

objectPositionの数値は直感と合わないため、以下の手順で合わせる。

**Step 1: 顔座標の特定**
1. `ffmpeg -ss 5 -frames:v 1` で動画フレームを1枚取得
2. Puppeteerで50px刻みのピクセルグリッド画像を生成
3. ユーザーに顔の中心座標を聞く（例: X:1300, Y:450）

**Step 2: 初期値計算**
```javascript
const coverScale = 325 / 1080;           // = 0.3009
const renderedW = 1920 * coverScale;      // = 577.8
const overflowX = renderedW - 325;        // = 252.8
const renderedFaceX = faceX * coverScale;
const visibleHalfW = 325 / scale / 2;
const offsetX = renderedFaceX - visibleHalfW - (162.5 - 162.5 / scale);
const objX = Math.round(Math.min(100, Math.max(0, offsetX / overflowX * 100)));
const translateY = Math.round(162.5 - faceY * coverScale);
```
→ `objectPosition: "{objX}% 0%"`, `transform: "scale({scale}) translateY({translateY}px)"`

**Step 3: レンダリングして確認**
スライド表示中のフレームでスクショを撮り、ユーザーに見せる

**Step 4: 方向ループ（最大2-3回）**
ユーザーに「**上 / 下 / 左 / 右 / OK**」を聞いて微調整：
- **上**: translateY += 7
- **下**: translateY -= 7
- **左**: objX += 3
- **右**: objX -= 3

#### C. テロップレンダラー
- `telopData` から現在のフレームに該当するテロップを取得
- テンプレートごとにスタイルを分岐（switch文）
- アニメーション: fade / slideUp / slideLeft（10フレーム）
- 共通スタイル: `position: absolute, bottom: 80, left: "50%", borderRadius: 50`

#### D. SE（効果音）システム
- `telopData` + `templateConfig` からSEを自動生成
- **最低50フレーム（2秒）間隔**: 密集するSEを間引く
- **直近2回重複回避**: 候補リストから直近2つのSEを除外してから選択（do-whileリトライではなくfilterで除外）
- **第三者発言の文途中スキップ**: テキスト末尾が「、」や助詞の場合SEなし
- `<Sequence>` + `<Audio>` で配置、volume: 0.2

#### E. BGM
- `<Audio src={staticFile("bgm/bgm.mp3")} volume={0.12} />`
- 動画全体にわたって再生

### 2. 実装

上記の設計に基づき MainComposition.tsx を作成する。

### 3. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## CLAUDE.md 準拠チェック

- [ ] `whiteSpace: "nowrap"` がテロップに設定されている
- [ ] テロップの `fontWeight: 900`
- [ ] z-index: 動画=0, 背景画像=5以下, テロップ=10以上
- [ ] 画像表示はフェードなし（パッと表示・パッと消える）※ただしブロックスライドの段階切り替えは8フレームフェードイン
- [ ] Sequence必須ルール: 途中再生の短い動画は `<Sequence>` でラップ

## 完了条件
- `src/MainComposition.tsx` が存在する
- 5つのレンダリングシステムがすべて実装されている
- TypeScript ビルドが通る
- CLAUDE.md のルールに準拠している

## 完了後

```
✅ Step 12 完了: メインコンポジションを構築しました。

【実装システム】
- スライド背景: ✅
- 円形ワイプ: ✅
- テロップレンダラー: ✅（○テンプレート対応）
- SE自動生成: ✅
- BGM: ✅

次のステップ → /step13-register（コンポジション登録）
進めますか？
```
