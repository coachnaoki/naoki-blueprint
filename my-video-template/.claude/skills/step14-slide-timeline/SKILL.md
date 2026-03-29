---
name: step14-slide-timeline
description: スライドタイムライン（slideTimeline.ts）を作成する。各スライドの表示フレーム範囲・画像挿入・Ken Burnsモーションを定義する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 14: スライドタイムライン作成

`src/slideTimeline.ts` を作成し、各スライドの表示フレーム範囲を定義する。

## 前提条件
- Step 13（スライドキャプチャ＋ブロック分割）でスライドPNGが存在すること
- Step 04（トランスクリプト解析）で無音区間・セクション区切りを把握していること
- Step 07（テロップデータ）で各セクションのフレーム範囲を把握していること

## 進め方（2段階）

### フェーズ1: 追加提案

ユーザーの承認後、さらに改善できる点を提案する：

- **ブロック分割**: 箇条書き・カード系スライドに段階表示が必要か
- **Ken Burnsモーション**: 静止画に動きをつけるか
- **表示時間が長すぎるスライド**: 分割やモーション追加を提案

### フェーズ2: ユーザーの希望を聞く

```
他に特別にスライドを入れたい場所はありますか？
（例: 「○○の話をしている辺りにslide-05を追加したい」など）
```

ユーザーの追加指示があれば反映する。なければそのまま確定。

## slideTimeline.ts の作成

```typescript
export interface SlideSegment {
  slideNumber: number;
  startFrame: number;
  endFrame: number;
  image?: string;       // スライドPNG以外の画像を使う場合
  motion?: "panRight" | "zoomIn" | "panUp" | "panDown"; // Ken Burnsモーション
}

export const slideTimeline: SlideSegment[] = [ ... ];
```

## ルール確認

- **スライド間の隙間を埋める（必須）**: スライド間が1秒（25フレーム）以内の場合、前のスライドのendFrameを次のstartFrame-1に延長して隙間をなくす。スライドが連続する場合はライブ動画に戻さない
- **最終フレームまでカバー（必須）**: 最後のスライドのendFrameは動画の最終フレーム（durationInFrames）まで延長する
- **スライド同士の重複禁止**: 同じフレームに複数スライドが重ならないこと
- **ワイプ表示**: スライド表示中は話者ワイプを表示する
- **Ken Burns**: 静止画に動きをつける場合 `motion` を指定
- **1枚のみのスライドはアニメーション不要**: ブロック分割しない単独スライドにはmotionを指定しない
- **全画面画像のアニメーション（必須）**: `image` で全画面画像を挿入する場合、必ず `motion` を指定する（zoomIn / panUp / panDown / panRight からランダムに選択）。アニメーションなしの静止画像は視聴者の興味を引かないため禁止
- **ブロック分割スライドのルール（必須）**:
  - 各ブロック間にフレームの隙間を空けない（前のblockのendFrame+1 = 次のblockのstartFrame）
  - 1枚目（block1）はアニメーションなし
  - 2枚目以降（block2〜）は `motion: "fadeIn"` 固定（10フレームでフェードイン）

## テロップとの整合性チェック

各スライドの表示区間が、対応する発話のフレーム範囲と整合しているか確認する。

## TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## 完了条件
- `src/slideTimeline.ts` が存在する
- スライドを入れるべき箇所にすべて配置されている
- テロップデータとのフレーム範囲が整合している
- TypeScript ビルドが通る

## 完了後

```
✅ Step 14 完了: スライドタイムラインを作成しました。

【セグメント数】○○個
【スライド枚数】○○枚
【画像挿入区間】○○箇所
【Ken Burns適用】○○箇所

次のステップ → /step15-wipe（ワイプ位置調整）
進めますか？
```
