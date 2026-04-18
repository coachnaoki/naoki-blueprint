---
name: step20-highlight-final
description: step19のMP4からハイライト範囲を自動抽出し、冒頭に連結して最終MP4レンダリングする。ハイライト不要ならそのままstep19のMP4が完成品。ユーザーが「ハイライト抽出」「最終レンダリング」「highlight」「final」「ステップ20」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion render *), Bash(ls *), Bash(node *), Bash(ffprobe *), Bash(ffmpeg *), Bash(mkdir *), Bash(df *), Bash(du *), Bash(mv *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 20: ハイライト自動抽出 + 最終レンダリング

step19で書き出した `public/output/step19_main.mp4` から、ユーザー指定のフレーム範囲を `ffmpeg` で抽出してハイライト化。`<Series>` で冒頭に連結して最終MP4を書き出す。

## 連結順序（最終構成）

```
[Series]
  ├─ 1. ハイライト（step19 MP4から切り抜いた public/videos/highlight/*.mp4）
  ├─ 2. OP（public/videos/opening/*.mp4）※あれば
  └─ 3. 本編（MainComposition）
```

## ハイライト不要の場合

`public/output/step19_main.mp4` をそのまま最終完成品として扱い、 `MainComposition_final.mp4` にリネーム or コピーして完了。このステップのレンダリング処理はスキップ。

## 前提条件

- Step 19（OP連結+本編レンダリング）完了
- `public/output/step19_main.mp4` が存在する
- ユーザーからハイライト範囲（またはハイライトなし）が指定されている
- `video-context.md` のFPSが確定している

## やること

### 1. ハイライト範囲の確認

ユーザーから以下を受け取る:
- 開始（`fromSec` or `fromFrame`）
- 終了（`toSec` or `toFrame`）
- 不要なら「なし」

秒指定の場合はFPSを使ってフレーム換算: `fromFrame = fromSec * fps`

**重要**: ユーザーの指定はstep19 MP4基準（冒頭にOP秒分含む）であることに注意。OPなしなら本編のフレームとイコール。

### 2. ハイライト抽出（ハイライトありの場合）

```bash
mkdir -p public/highlight

# 例: fps=30, fromFrame=1500, toFrame=2400
# startSec = 50.000, durationSec = 30.000
ffmpeg -ss 50.000 -i public/output/step19_main.mp4 \
  -t 30.000 \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -pix_fmt yuv420p \
  public/videos/highlight/highlight_main.mp4
```

**ポイント**:
- `-ss` は `-i` の前に置く（高速シーク）
- 再エンコードする（`-c copy` だとキーフレーム境界でズレる）
- `crf 18` で視認差が出ない高品質

#### 複数範囲を繋ぐ場合

```bash
ffmpeg -ss 50 -i public/output/step19_main.mp4 -t 10 -c:v libx264 -crf 18 -c:a aac /tmp/clip1.mp4
ffmpeg -ss 180 -i public/output/step19_main.mp4 -t 8 -c:v libx264 -crf 18 -c:a aac /tmp/clip2.mp4
printf "file '/tmp/clip1.mp4'\nfile '/tmp/clip2.mp4'\n" > /tmp/concat.txt
ffmpeg -f concat -safe 0 -i /tmp/concat.txt -c copy public/videos/highlight/highlight_main.mp4
```

### 3. ハイライト長さを測定

```bash
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/highlight/highlight_main.mp4
```

フレーム換算: `HIGHLIGHT_DURATION = Math.ceil(duration_sec * fps)`

### 4. Root.tsx を更新

step19で作った `<Composition id="Final">` の `<Series>` の**先頭**にハイライトを追加する:

```tsx
const HIGHLIGHT_SRC = "highlight/highlight_main.mp4";
const HIGHLIGHT_DURATION = 900;   // 30秒 @ 30fps

const HighlightClip: React.FC = () => (
  <OffthreadVideo
    src={staticFile(HIGHLIGHT_SRC)}
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
            <HighlightClip />
          </Series.Sequence>
          <Series.Sequence durationInFrames={OPENING_DURATION}>
            <OpeningClip />
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

OPなしの場合は HIGHLIGHT → MainComposition の2段だけ。

### 5. 物理挿入（Step11）併用時

Step11で本編を `<Series>` 分割している場合、ハイライトをその先頭に追加するだけ:

```tsx
<Series>
  <Series.Sequence durationInFrames={HIGHLIGHT_DURATION}>
    <HighlightClip />
  </Series.Sequence>
  <Series.Sequence durationInFrames={OPENING_DURATION}>
    <OpeningClip />
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

### 6. TypeScriptコンパイル

```bash
npx tsc --noEmit
```

### 7. 最終レンダリング

```bash
npx remotion render Final public/output/MainComposition_final.mp4 --overwrite
```

⚠️ タイムアウトは10分（600000ms）に設定。

### 8. 結果確認 + 再生

```bash
ls -lh public/output/MainComposition_final.mp4
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/output/MainComposition_final.mp4
node scripts/open-file.mjs public/output/MainComposition_final.mp4
```

## ハイライト音声の扱い

- ハイライトはstep19 MP4から抽出しているので、本編のBGM・SE・テロップ音声を含んでいる
- 冒頭で再生されると「本編の切り抜き＋本編のBGM」がそのまま流れる（= クライマックス再生として機能）
- BGMを切りたい場合は `<OffthreadVideo muted />` にして、別途Audio層でBGMを鳴らす

## エラー時の対処

| エラー | 対処 |
|--------|------|
| ENOSPC（ディスク容量不足） | 不要ファイルの削除を提案 |
| タイムアウト | 再実行を提案 |
| ffmpeg `-ss` で想定と違うフレーム | `-ss` を `-i` の後ろに移動（低速だが正確） |
| レンダリングエラー | Root.tsx の durationInFrames 合計値を確認 |

## 完了条件
- `public/output/MainComposition_final.mp4` が存在する（ハイライトなしの場合は `step19_main.mp4` が完成品）
- ファイルサイズ・長さが妥当
- ハイライトが冒頭に正しく連結されている

## 完了後

```
✅ Step 20 完了: 最終レンダリングが完了しました！

【出力ファイル】
- パス: public/output/MainComposition_final.mp4
- サイズ: ○○ MB
- 長さ: ○○秒（ハイライト ○秒 + OP ○秒 + 本編 ○秒）
- 解像度: 1920x1080

🎉 動画制作ワークフロー完了！
確認して問題があれば教えてね。
```
