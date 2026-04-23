---
name: step19-opening
description: 冒頭にOP動画だけ連結して、本編+OPを一度MP4レンダリングする。次のstep20でこのMP4からハイライトを切り抜いて最終連結する。ユーザーが「OP連結」「オープニング」「opening」「ステップ19」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion render *), Bash(ls *), Bash(node *), Bash(ffprobe *), Bash(mkdir *), Bash(df *), Bash(du *), Bash(node scripts/_chk.mjs *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step19-opening` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 19: OP連結 + 本編レンダリング（1回目 / 仮出し）

冒頭にOP動画だけを `<Series>` で連結して、本編+OPをMP4として一度書き出す。ハイライトは次のstep20で本編部分から切り抜いて再連結する。

## なぜこの順番？

- ハイライト（本編の切り抜き）を作るには、**先に本編の完成映像**（テロップ・スライド・BGM入り）が必要
- OPは事前素材なので、いつでも連結できる
- step19でOP+本編をレンダリング → step20でハイライト抽出 → 最終MP4、という2回レンダリング構成

## 連結順序（step19時点）

```
[Series]
  ├─ 1. OP（public/videos/opening/*.mp4）※あれば
  └─ 2. 本編（MainComposition）
```

OP動画が無ければSeries連結はスキップして、本編そのままレンダリングする。

## 前提条件

- Step 18（BGM挿入）が完了していること
- `public/videos/opening/*.mp4` があればOP連結、なければスキップ
- TypeScript ビルドが通ること
- ディスク容量500MB以上の空き

## なぜSeriesで連結するのか

- 本編のテロップ・ワイプ・SE・BGM・スライドはすべて「本編のフレーム軸」を前提に作られている
- 物理的に冒頭へ映像を挿入すると、本編の全素材の**startFrame/endFrameがシフトして崩壊する**
- Remotion `<Series>` は各 `Series.Sequence` が独立した時間軸を持つため、本編Composition内のフレーム計算は**一切影響を受けない**

## やること

### 1. OP素材の確認

```bash
ls -la public/videos/opening/ 2>/dev/null
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/opening/*.mp4 2>/dev/null
```

OPファイルがなければSeries連結はスキップ。そのままstep3へ。

### 2. Root.tsx を更新（OPがある場合）

`<Composition id="Final">` を新設し、`<Series>` でOP → 本編の順に並べる:

```tsx
import { Composition, Series, staticFile, OffthreadVideo } from "remotion";
import { MainComposition } from "./MainComposition";

const OPENING_SRC = "opening/op.mp4";
const OPENING_DURATION = 150;   // 5秒 @ 30fps（ffprobeで計測）
const MAIN_TOTAL = 9000;        // 本編の総フレーム数

const OpeningClip: React.FC = () => (
  <OffthreadVideo
    src={staticFile(OPENING_SRC)}
    style={{ width: 1920, height: 1080, objectFit: "cover" }}
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Final"
      component={() => (
        <Series>
          <Series.Sequence durationInFrames={OPENING_DURATION}>
            <OpeningClip />
          </Series.Sequence>
          <Series.Sequence durationInFrames={MAIN_TOTAL}>
            <MainComposition />
          </Series.Sequence>
        </Series>
      )}
      durationInFrames={OPENING_DURATION + MAIN_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
```

### 3. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

### 4. 出力ディレクトリの準備

```bash
mkdir -p public/output
```

### 5. レンダリング実行

OPある場合は `Final`、無い場合は `MainComposition` を対象にレンダリング:

```bash
# OPあり
npx remotion render Final public/output/step19_main.mp4 --overwrite

# OPなし
npx remotion render MainComposition public/output/step19_main.mp4 --overwrite
```

⚠️ タイムアウトは10分（600000ms）に設定。

### 6. 結果確認

```bash
ls -lh public/output/step19_main.mp4
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/output/step19_main.mp4
node scripts/open-file.mjs public/output/step19_main.mp4
```

## ユーザーに伝えること

完成動画を確認してもらい、次のstep20で使う「ハイライト化したい範囲」を決めてもらう。

- 時間範囲（例: 1分40秒〜2分10秒）でも可
- フレーム範囲（例: 3000〜3900）でも可
- ハイライトが不要なら「ハイライトなし」と伝えてもらう（step20はスキップ）

**重要**: ハイライト範囲は**OP除外後の本編パート**から選ぶ（= OP分のフレームをオフセットとして加算して最終MP4から抽出する）

## 完了条件
- `public/output/step19_main.mp4` が存在する
- OPあり: OP+本編、OPなし: 本編のみ
- ユーザーがハイライト範囲（またはハイライトなし）を決めた

## 完了後

```
✅ Step 19 完了: OP連結+本編レンダリングが完了しました！

【出力ファイル】
- パス: public/output/step19_main.mp4
- サイズ: ○○ MB
- 長さ: ○○秒（OP ○秒 + 本編 ○秒）

次のステップ → /step20-highlight-final
完成動画を確認して、ハイライトにしたい範囲（例: 1:40〜2:10）を教えてください。
ハイライトなしで良ければ「なし」と伝えてください（その場合このMP4がそのまま完成品です）。
```
