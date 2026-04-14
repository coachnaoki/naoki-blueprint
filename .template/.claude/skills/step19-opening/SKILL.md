---
name: step19-opening
description: 冒頭にハイライト動画とOP動画を連結する。Remotion <Series>で本編前に差し込むためタイムスタンプに影響なし。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(ls *), Bash(ffprobe *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 19: 冒頭にハイライト+OP連結

完全に編集済みのハイライト映像（本編の切り抜き）とOP映像を、本編の**前**にRemotion `<Series>` で連結する。

## 前提条件

- Step 18（BGM挿入）が完了していること
- `public/highlight/*.mp4`（ハイライト）または `public/opening/*.mp4`（OP）のどちらか、または両方が存在すること
- 両方とも存在しない場合は **このステップをスキップ** して `/step20-render` へ進む

## なぜSeriesで連結するのか

- 本編のテロップ・ワイプ・SE・BGM・スライドはすべて「本編のフレーム軸」を前提に作られている
- 物理的に冒頭へ映像を挿入すると、本編の全素材の**startFrame/endFrameがシフトして崩壊する**
- Remotion `<Series>` は各 `Series.Sequence` が独立した時間軸を持つため、本編Composition内のフレーム計算は**一切影響を受けない**

## 連結順序

```
[Series]
  ├─ 1. ハイライト（public/highlight/*.mp4）
  ├─ 2. OP（public/opening/*.mp4）
  └─ 3. 本編（MainComposition）
```

- ハイライトは「完全に整った魅せ映像」として最初に置く
- OPはブランドロゴ・タイトルで視聴者を本編へ誘導
- どちらか片方だけでもOK

## ユーザーに確認すること

1. **ハイライトの有無**（`public/highlight/` 内のクリップ）
2. **OPの有無**（`public/opening/` 内のクリップ）
3. **順序確認**: 「ハイライト → OP → 本編」でよいか（反転希望があれば受ける）
4. **音声**: それぞれ音声ありか、BGMだけ鳴らしたいかを確認

## 実装例（Root.tsx）

```tsx
import { Composition, Series, staticFile, OffthreadVideo } from "remotion";
import { MainComposition } from "./MainComposition";

const HIGHLIGHT_SRC = "highlight/best.mp4";
const HIGHLIGHT_DURATION = 300;   // 10秒 @ 30fps（ffprobeで計測）

const OPENING_SRC = "opening/op.mp4";
const OPENING_DURATION = 150;     // 5秒 @ 30fps

const MAIN_TOTAL = 9000;          // 本編の総フレーム数

const ClipComp: React.FC<{ src: string; muted?: boolean }> = ({ src, muted }) => (
  <OffthreadVideo
    src={staticFile(src)}
    muted={muted}
    style={{ width: 1920, height: 1080, objectFit: "cover" }}
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Final"
      component={() => (
        <Series>
          <Series.Sequence durationInFrames={HIGHLIGHT_DURATION}>
            <ClipComp src={HIGHLIGHT_SRC} />
          </Series.Sequence>
          <Series.Sequence durationInFrames={OPENING_DURATION}>
            <ClipComp src={OPENING_SRC} />
          </Series.Sequence>
          <Series.Sequence durationInFrames={MAIN_TOTAL}>
            <MainComposition />
          </Series.Sequence>
        </Series>
      )}
      durationInFrames={HIGHLIGHT_DURATION + OPENING_DURATION + MAIN_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
```

### 物理挿入（Step11）と併用する場合

Step11で本編を分割する `<Series>` を組んでいる場合、Step19の `<Series>` にそのまま連結する：

```tsx
<Series>
  <Series.Sequence durationInFrames={HIGHLIGHT_DURATION}>
    <ClipComp src="highlight/best.mp4" />
  </Series.Sequence>
  <Series.Sequence durationInFrames={OPENING_DURATION}>
    <ClipComp src="opening/op.mp4" />
  </Series.Sequence>
  <Series.Sequence durationInFrames={INSERT_AT_FRAME}>
    <MainComposition fromFrame={0} toFrame={INSERT_AT_FRAME} />
  </Series.Sequence>
  <Series.Sequence durationInFrames={INSERT_DURATION}>
    <ClipComp src="inserts/demo.mp4" />
  </Series.Sequence>
  <Series.Sequence durationInFrames={MAIN_TOTAL - INSERT_AT_FRAME}>
    <MainComposition fromFrame={INSERT_AT_FRAME} toFrame={MAIN_TOTAL} />
  </Series.Sequence>
</Series>
```

## やること

### 1. 素材の確認

```bash
ls -la public/highlight/ public/opening/ 2>/dev/null
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/highlight/*.mp4 public/opening/*.mp4 2>/dev/null
```

各ファイルのフレーム数を計算する（`duration × fps`）。

### 2. Root.tsx を更新

`<Composition id="Final">` の `component` を `<Series>` で包み、ハイライト → OP → 本編（→ 物理挿入があれば続き）の順で `Series.Sequence` を並べる。

### 3. durationInFrames の更新

`Composition` の `durationInFrames` を `HIGHLIGHT_DURATION + OPENING_DURATION + MAIN_TOTAL + (物理挿入の合計)` に更新。

### 4. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

### 5. プレビュー確認

Remotion Studioで「Final」Compositionを開き、冒頭から再生してハイライト → OP → 本編 の流れを確認する。

## 音声の扱い

- ハイライト・OPに元々音楽が入っている場合: `muted` は外す
- BGM（Step18で設定）を冒頭から鳴らしたい場合: ハイライト/OPを `muted` にしてBGMに任せる
- BGMの開始フレームはStep18で本編冒頭に設定済み。冒頭にハイライト+OPを入れるとBGMの開始位置もそのぶん後ろにずれることに注意（必要ならStep18のBGM設定を再調整）

## 完了条件

- Root.tsx の `<Composition id="Final">` に `<Series>` で冒頭連結が組み込まれている
- `durationInFrames` が正しく更新されている
- TypeScriptコンパイルエラーなし
- Remotion Studioで再生確認済み

## 完了後

```
✅ Step 19 完了: 冒頭にハイライト+OPを連結しました。

【構成】
- ハイライト: highlight/best.mp4 (300f = 10秒)
- OP: opening/op.mp4 (150f = 5秒)
- 本編: MainComposition (9000f = 5分)
- 合計: 9450f = 5分15秒

次のステップ → /step20-render（最終レンダリング）
進めますか？
```
