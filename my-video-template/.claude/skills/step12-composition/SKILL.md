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
- メイン動画を右上の円形フレームで表示（280×280px）
- `borderRadius: "50%"`, `overflow: "hidden"`
- `transform: scale(2.8)` でドアップ
- `hideWipe === true` のスライド区間では非表示（ただし音声は維持）
  - 音声維持: `width: 0, height: 0, opacity: 0` の OffthreadVideo

#### C. テロップレンダラー
- `telopData` から現在のフレームに該当するテロップを取得
- テンプレートごとにスタイルを分岐（switch文）
- アニメーション: fade / slideUp / slideLeft（10フレーム）
- 共通スタイル: `position: absolute, bottom: 80, left: "50%", borderRadius: 50`

#### D. SE（効果音）システム
- `telopData` + `templateConfig` からSEを自動生成
- 同じSEの連続使用を回避（直近2回以内のSEはスキップ）
- `<Sequence>` + `<Audio>` で配置、volume: 0.35

#### E. BGM
- `<Audio src={staticFile("bgm.mp3")} volume={0.12} />`
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
