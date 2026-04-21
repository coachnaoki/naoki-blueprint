---
name: step05-cut
description: 無音区間と言い直し区間を統合し、元動画から一発エンコードでカット済み動画を生成する。二重カットによる境界エラーを防ぐ。ユーザーが「カット」「cut」「無音カット」「言い直し削除」「ステップ5」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ffmpeg *), Bash(ffprobe *), Bash(ls *), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 05: 無音＋言い直し一括カット

無音区間の自動検出と言い直し区間の半自動検出を行い、**元動画から一発のFFmpegエンコードでカット済み動画を生成する**。

> **なぜ一括カットなのか**: 旧ワークフローでは無音カット → 言い直しカットを2段階で行っていたが、2回のエンコードを重ねるとカット境界にゴミフレームが残ったり語尾が切れたりする問題が頻発した。一括カットならこの問題が根本的に発生しない。

## 前提条件
- Step 04（文字起こし）でtranscript_words.jsonが存在すること
- Step 05（台本照合）でtranscriptが修正済みであること
- 元動画（カット前）が `public/videos/main/` に存在すること
- **元動画のファイル名は `video-context.md` の「動画ファイル」セクションを参照する**（step02で記録済み）

## やること

### Phase 1: 無音区間の検出

FFmpegの `silencedetect` フィルターで無音区間を検出する。

```bash
ffmpeg -i public/videos/main/元動画.mp4 -af silencedetect=noise=-30dB:d=0.3 -f null - 2>&1 | grep "silence_"
```

パラメータ：
- `noise=-30dB` — 無音と判定する音量閾値
- `d=0.3` — 最低0.3秒以上の無音をカット対象にする

| 状況 | noise | d |
|------|-------|---|
| 標準（推奨） | -30dB | 0.3s |
| テンポ重視（きつめ） | -25dB | 0.2s |
| BGMあり・環境音多め | -40dB | 0.8s |
| ゆるめ（間を残す） | -30dB | 0.5s |

検出結果をパースし、無音区間リスト `silence_cuts` を作成する。

### Phase 2: 言い直し区間の検出

**⚠️ 検出データの選択（重要）:**
- **隠れ言い直し検出（パターン4）→ `public/transcript_words.original.json` を使う**（Whisper原文・修正前）
  - step04の修正で複数ワードが1ワードに統合されると、隠れ言い直しが消えるため
- **重複フレーズ検出（パターン1〜3）→ `public/transcript_words.json` を使う**（修正後）
  - 修正後の正しい日本語で重複を検出する方が精度が高い

以下のパターンで言い直し候補を検出する。

#### 言い直し検出の4パターン

以下の4パターンで検出する。**実装詳細（Pythonコード・アルゴリズム）は `references/detection-algorithm.md` を参照。**

| パターン | 内容 | 入力 |
|---|---|---|
| 1〜3 | N-gram自動検出（10文字以上・時刻差30秒以内で2回登場） | `transcript_words.json`（修正後） |
| 4 | Whisper隠し言い直し（1-2文字でduration≥0.7秒） | `transcript_words.original.json`（修正前） |

**重要原則:**
- **ハードコード禁止** — すべてアルゴリズムで自動検出
- **検出された隠れ言い直しは全件ループで処理**（1件だけ処理する等の手抜き禁止）
- **隠れ言い直しのカット範囲は前の無音区間まで自動拡張**（話者は直前の句の先頭まで戻ることが多い）

### Phase 3: 候補の一覧表示とユーザー承認

検出した言い直し候補を一覧表示する。

```
【言い直し候補】

1. [01:23.4 - 01:25.8] 「テニスのグリップは」
   → 直後に同じフレーズあり（01:25.9〜）
   カット: 01:23.4 〜 01:25.8

2. [03:45.1 - 03:47.2] 「ポイントはですね、えー、」
   → 直後に「ポイントは」で再開（03:47.3〜）
   カット: 03:45.1 〜 03:47.2

3. [05:12.0 - 05:14.5] 「このショットを、えー、」（隠れリテイク: duration 2.5s）
   → Whisper圧縮。silencedetect で 05:12.8 に無音確認
   カット: 05:12.0 〜 05:14.5

合計: 3箇所（約6.9秒）
```

**言い直し候補が0件の場合**: Phase 3をスキップし、無音カットのみでPhase 4に進む。ユーザーには「言い直しは検出されませんでした。無音カットのみ実行します」と伝える。

**候補がある場合**、ユーザーに承認を求める：
```
上記の候補をカットしますか？
- 全部カット → 「ok」
- 個別選択 → 番号を指定（例: 「1と3だけカット」）
- 確認したい → 番号を指定して前後の音声を確認
```

### Phase 4: カット区間の統合とキープセグメント計算

承認された言い直し区間と無音区間を統合する。

```python
# アルゴリズム概要（Pythonライク疑似コード）

# 1. 全カット区間を統合
all_cuts = silence_cuts + retake_cuts

# 2. 重複・隣接するカット区間をマージ
all_cuts.sort(key=lambda x: x[0])
merged = [all_cuts[0]]
for start, end in all_cuts[1:]:
    if start <= merged[-1][1] + 0.05:  # 0.05秒以内は結合
        merged[-1] = (merged[-1][0], max(merged[-1][1], end))
    else:
        merged.append((start, end))

# 3. キープセグメント（残す区間）を計算
keeps = []
prev_end = 0
for cut_start, cut_end in merged:
    if cut_start > prev_end + 0.01:
        keeps.append((prev_end, cut_start))
    prev_end = cut_end
if prev_end < total_duration:
    keeps.append((prev_end, total_duration))

# 4. 短すぎるセグメント（0.3秒未満）を除外
keeps = [(s, e) for s, e in keeps if e - s >= 0.3]

# 5. word-boundary snap + 非対称padding（推奨）
# 各カット境界を transcript_words.json の word.end / word.start にスナップして、
# 発話末尾に +150ms の余韻、次発話開始に -50ms の息継ぎ余白を残す。
# silencedetect の timestamps は ±50-100ms ズレるので、word境界に揃えることで
# 「発話がプツッと切れる」「息継ぎが消える」問題を防げる。
#
# 詳細アルゴリズムは横動画版 .template/.claude/skills/step05-cut/SKILL.md Phase 4 を参照。
# snap できない境界は 0.075s の対称 padding にフォールバックする。
# 値（AFTER=0.150 / BEFORE=0.050）は Naoki の聴感確認で確定した値。
# 実測: snap成功率92%、legacyより3.1秒タイトにカット可能（Teleprompter 2分48秒テスト）。
```

### Phase 5: FFmpeg一発エンコード

キープセグメントをFFmpegの `trim` + `concat` フィルターで一発でエンコードする。

```bash
# キープセグメントからfilter_complexを生成
# 例: keeps = [(0, 5.2), (7.8, 15.3), (18.1, 30.0)]

ffmpeg -y -i public/videos/main/元動画.mp4 -filter_complex \
  "[0:v]trim=start=0:end=5.2,setpts=PTS-STARTPTS[v0]; \
   [0:a]atrim=start=0:end=5.2,asetpts=PTS-STARTPTS[a0]; \
   [0:v]trim=start=7.8:end=15.3,setpts=PTS-STARTPTS[v1]; \
   [0:a]atrim=start=7.8:end=15.3,asetpts=PTS-STARTPTS[a1]; \
   [0:v]trim=start=18.1:end=30.0,setpts=PTS-STARTPTS[v2]; \
   [0:a]atrim=start=18.1:end=30.0,asetpts=PTS-STARTPTS[a2]; \
   [v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -ar 48000 -ac 2 \
  public/videos/main/元動画_cut.mp4
```

> **重要: concatの入力順序**
> `[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1` のように、**各セグメントのビデオとオーディオを交互に並べる**。
> `[v0][v1][v2][a0][a1][a2]` のようにビデオを先にまとめると「Media type mismatch」エラーになる。

### Phase 6: 結果の確認（Remotion Studio で必須）

```bash
# カット前後の尺を比較
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/main/元動画.mp4
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/main/元動画_cut.mp4
```

カット前後の長さ・カット率を表示する。

**カット後は必ず Remotion Studio を起動してユーザーに確認してもらう。** フレーム単位で精密確認することでカットミスを早期発見し、step06以降の手戻りを防ぐ。

#### 6-1. 暫定の MainComposition.tsx / Root.tsx を生成

テロップ・SE・スライド等は入れない、**カット済み動画を全画面表示するだけ**の最小版を生成する。step09 でこの MainComposition.tsx を拡張していく形にする。

**ffprobe でフレーム数・FPSを取得:**
```bash
ffprobe -v quiet -select_streams v:0 -show_entries stream=r_frame_rate,nb_frames,duration -of default=noprint_wrappers=1 public/videos/main/元動画_cut.mp4
# r_frame_rate=30/1, duration=XX.XX などから FPS と durationInFrames を算出
```

**`src/MainComposition.tsx` (暫定・最小版):**
```typescript
import React from "react";
import { OffthreadVideo, staticFile } from "remotion";

export const MainComposition: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("videos/main/元動画_cut.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};
```

**`src/Root.tsx`:**
```typescript
import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainVideo"
      component={MainComposition}
      durationInFrames={/* ffprobeで算出 */}
      fps={/* video-context.md のFPS */}
      width={1080}
      height={1920}
    />
  );
};
```

**`src/index.ts`（Remotion登録エントリ、未作成なら生成）:**
```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

#### 6-2. Remotion Studio 起動（必須・バックグラウンド）

```bash
npx remotion studio
```

**トラブル時の対処**: `Cannot find native binding` エラー（rspack darwin-x64/universal が見つからない）が出た場合:
1. `rm -rf node_modules package-lock.json && npm install` で再配置
2. それでもダメなら `node node_modules/.bin/remotion studio --port 3003` で直接起動

起動後（数秒でブラウザが自動で開く）、ユーザーに以下を伝える:

```
Remotion Studio を起動しました（http://localhost:3000）。
カット済み動画がフレーム単位で確認できます。
以降のステップでも使うので、開いたままにしてください。
```

### Phase 7: ユーザー確認 → 追加調整（必須）

Remotion Studio のプレビューをユーザーに確認してもらう:
```
Remotion Studio (http://localhost:3000) でカット動画を確認してください。
フレーム単位でスクラブできます。以下をチェックしてほしい:
1. 言い直しが全部カットされているか（例: 同じフレーズが2回話されてないか）
2. 語尾が切れていないか
3. 無駄なフレーム（数フレームの残骸）がないか

問題があれば「〇分〇秒で〜」の形式で教えてください。
```

ユーザーのフィードバックに応じて対応：

| フィードバック | 対応 |
|--------------|------|
| 「〇秒で言い直しがある」 | 該当箇所をretake_cutsに追加して再エンコード |
| 「語尾が切れている」 | 該当セグメントのend時間を+0.1〜0.3秒延長して再エンコード |
| 「無駄なフレームが残っている」 | 該当のキープセグメントの境界を調整して再エンコード |

**再エンコードは常に元動画から行う。** カット済み動画を再カットしてはいけない。

**なぜユーザー確認が必須か:**
Whisperの出力・silencedetectでは検出しきれないパターンがある（例: 句の長さが閾値ギリギリの隠れ言い直し、意味的な重複）。ユーザーの耳で確認するフェーズを必ず入れる。

## 完了条件
- カット済み動画（`*_cut.mp4`）が `public/videos/main/` に存在する
- 元動画が保持されている
- カット前後の長さ・カット率を把握している
- 暫定 `src/MainComposition.tsx` / `src/Root.tsx` / `src/index.ts` が存在する
- Remotion Studio が起動している（http://localhost:3000）
- **Remotion Studio でカット後の動画を確認し、ユーザーがOKを出している**（確認せずに完了してはいけない）

## 完了後

```
✅ Step 05 完了: 一括カットが完了しました。

【結果】
- カット前: ○○秒
- カット後: ○○秒（○○%短縮）
- カットした無音区間: ○○箇所
- カットした言い直し: ○○箇所

次のステップ → /step06-transcript（カット後の再文字起こし）
進めますか？
```
