---
name: step13-register
description: Root.tsxにコンポジションを登録する。動画ID・解像度・FPS・総フレーム数を設定する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *)
---

# Step 13: コンポジション登録

`src/Root.tsx` にメインコンポジションを登録し、Remotion Studio・CLIから使えるようにする。

## 前提条件
- Step 12（メインコンポジション構築）が完了していること
- `src/MainComposition.tsx`（またはメインコンポーネント）が存在すること

## やること

### 1. Root.tsx の確認

現在の `src/Root.tsx` を読み込み、既存のコンポジション登録を確認する。

### 2. メインコンポジションの登録

以下の情報でコンポジションを登録する：

```typescript
import { MainComposition } from "./MainComposition"; // メインコンポーネント

<Composition
  id="MainComposition"          // コンポジションID（レンダリング時に指定）
  component={MainComposition}   // コンポーネント
  durationInFrames={????}   // 総フレーム数（slideTimelineの最終endFrame + 1）
  fps={30}                  // フレームレート
  width={1920}              // 幅
  height={1080}             // 高さ
/>
```

### 3. 総フレーム数の計算

`slideTimeline.ts` の最後のエントリの `endFrame + 1` を `durationInFrames` に設定する。

### 4. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

### 5. Remotion Studio で確認

```bash
npm run dev
```

Studio が起動したらブラウザで確認し、コンポジションが表示されることを確認する。

## 完了条件
- `src/Root.tsx` にメインコンポジションが登録されている
- durationInFrames がslideTimelineと整合している
- TypeScript ビルドが通る

## 完了後

```
✅ Step 13 完了: コンポジションを登録しました。

【コンポジション】
- ID: MainComposition
- 解像度: 1920x1080
- FPS: 30
- 総フレーム数: ○○（○○秒）

次のステップ → /step14-preview（プレビュー確認）
進めますか？
```
