---
name: step09-composition
description: メインコンポジション構築・登録（MainComposition.tsx + Root.tsx）。テロップレンダラー・SE・ベース動画を統合する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion studio), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 09: コンポジション構築・登録

`src/MainComposition.tsx`（メインのReactコンポーネント）を構築し、`src/Root.tsx` にコンポジションを登録する。

## 前提条件
- Step 07（テンプレート設定）とStep 08（テロップデータ）が完了していること
  - `src/templateConfig.ts`
  - `src/telopData.ts`

## やること

### 1. コンポーネントの構造設計

MainComposition.tsx は以下の3つのレンダリングシステムで構成する：

#### A. ベース動画
- カット済み動画（`public/video/*_cut.mp4`）を `OffthreadVideo` で全画面表示
- `objectFit: "cover"` で画面全体に表示

#### B. テロップレンダラー
- `telopData` から現在のフレームに該当するテロップを取得
- テンプレートごとにスタイルを分岐（switch文）
- アニメーション: fade / slideUp / slideLeft（10フレーム）
- 共通スタイル: `position: absolute, bottom: 80, left: "50%", borderRadius: 50`

#### C. スライドレンダラー（slideTimeline.ts がある場合）
- `slideTimeline` から現在のフレームに該当するスライドを取得して表示
- Ken Burns モーション対応（zoomIn / panRight / panUp / panDown）
- fadeIn対応（ブロック分割の2枚目以降）: 前のブロック画像を下に表示した状態で現在のブロックをopacity 0→1でフェードイン
- `zIndex: 5`（ベース動画の上、テロップの下）

#### D. ワイプレンダラー（slideTimeline.ts がある場合）
- スライドPNG表示中に話者の顔を円形小窓で表示
- **全画面画像（`images/` で始まるパス）表示中はワイプ非表示**
- **BulletList表示中もワイプ非表示**
- 325×325px、borderRadius: 50%、zIndex: 8
- ワイプ内の `OffthreadVideo` には必ず `muted` を指定する（音声二重防止）

#### E. SE（効果音）システム
- `telopData` + `templateConfig` からSEを自動生成
- **最低50フレーム（2秒）間隔**: 密集するSEを間引く
- **直近2回重複回避**: 候補リストから直近2つのSEを除外してから選択（do-whileリトライではなくfilterで除外）
- **第三者発言の文途中スキップ**: テキスト末尾が「、」や助詞の場合SEなし
- `<Sequence>` + `<Audio>` で配置、volume: 0.1

### 2. 実装

上記の設計に基づき MainComposition.tsx を作成する。

### 3. Root.tsx にコンポジション登録

`src/Root.tsx` にコンポジションを登録する。

```typescript
import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainComposition}
        durationInFrames={/* video-context.md の総フレーム数 */}
        fps={/* video-context.md の FPS */}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

- `fps` は `video-context.md` の制作設定に記載されたFPSを使用する
- `durationInFrames` は `video-context.md` の総フレーム数を使用する

### 4. Remotion Studio を起動

```bash
npx remotion studio
```

**ユーザーに「Remotion Studio を開きました。以降のステップでも使うので、開いたままにしておいてください」と伝える。**

### 5. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## CLAUDE.md 準拠チェック

- [ ] `whiteSpace: "nowrap"` がテロップに設定されている
- [ ] テロップの `fontWeight: 900`
- [ ] z-index: 動画=0, テロップ=10以上
- [ ] Sequence必須ルール: 途中再生の短い動画は `<Sequence>` でラップ

## 完了条件
- `src/MainComposition.tsx` が存在する
- ベース動画・テロップレンダラー・SEの3システムが実装されている
- `src/Root.tsx` にコンポジションが登録されている
- Remotion Studio が起動している
- TypeScript ビルドが通る
- CLAUDE.md のルールに準拠している

## 完了後

```
✅ Step 09 完了: コンポジション構築・登録が完了しました。

【実装システム】
- ベース動画: ✅
- テロップレンダラー: ✅（○テンプレート対応）
- SE自動生成: ✅
- Root.tsx登録: ✅
- Remotion Studio: 起動済み

次のステップ → /step10-greenback（グリーンバック背景置換）
進めますか？
```
