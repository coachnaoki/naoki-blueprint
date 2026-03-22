---
name: step18-slide-timeline
description: スライドタイムライン（slideTimeline.ts）を作成する。各スライドの表示フレーム範囲・画像挿入・Ken Burnsモーションを定義する。
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Step 18: スライドタイムライン作成

`src/slideTimeline.ts` を作成し、各スライドの表示フレーム範囲を定義する。

## 前提条件
- Step 12（スライドキャプチャ）でスライドPNGが存在すること
- Step 04（トランスクリプト解析）で無音区間・セクション区切りを把握していること
- Step 07（テロップデータ）で各セクションのフレーム範囲を把握していること

## やること

### 1. セクション区切りの特定

トランスクリプトの内容と `video-context.md` のナレーション構成から、スライドが切り替わるタイミングを特定する。

判断基準：
- 話題の変わり目（新しいセクションの開始）
- 無音区間（Step 04で特定したギャップ）
- ナレーションの論理的な区切り

### 2. slideTimeline.ts の作成

```typescript
export interface SlideSegment {
  slideNumber: number;
  startFrame: number;
  endFrame: number;
  image?: string;       // スライドPNG以外の画像を使う場合
  hideWipe?: boolean;   // ワイプを非表示にするか
  motion?: "panRight" | "zoomIn" | "panUp" | "panDown"; // Ken Burnsモーション
}

export const slideTimeline: SlideSegment[] = [ ... ];
```

### 3. ルール確認

- **隙間なし**: 前のセグメントの endFrame + 1 = 次の startFrame
- **全フレームカバー**: 0 〜 最終フレームまでカバー
- **画像挿入**: スライド以外の画像を使う区間は `image` を指定
- **ワイプ非表示**: 画像シーンではワイプを非表示にする場合 `hideWipe: true`
- **Ken Burns**: 静止画に動きをつける場合 `motion` を指定

### 4. テロップとの整合性チェック

各スライドの表示区間が、対応するテロップのフレーム範囲と整合しているか確認する。

### 5. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## 完了条件
- `src/slideTimeline.ts` が存在する
- 全フレーム範囲を隙間なくカバーしている
- テロップデータとのフレーム範囲が整合している
- TypeScript ビルドが通る

## 完了後

```
✅ Step 11 完了: スライドタイムラインを作成しました。

【セグメント数】○○個
【スライド枚数】○○枚
【画像挿入区間】○○箇所
【Ken Burns適用】○○箇所

次のステップ → /step19-preview（最終プレビュー）
進めますか？
```
