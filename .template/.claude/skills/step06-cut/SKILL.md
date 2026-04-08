---
name: step06-cut
description: 無音区間と言い直し区間を統合し、元動画から一発エンコードでカット済み動画を生成する。二重カットによる境界エラーを防ぐ。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ffmpeg *), Bash(ffprobe *), Bash(ls *), Bash(node *), Bash(/opt/homebrew/bin/python3.12 *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 06: 無音＋言い直し一括カット

無音区間の自動検出と言い直し区間の半自動検出を行い、**元動画から一発のFFmpegエンコードでカット済み動画を生成する**。

> **なぜ一括カットなのか**: 旧ワークフローでは無音カット → 言い直しカットを2段階で行っていたが、2回のエンコードを重ねるとカット境界にゴミフレームが残ったり語尾が切れたりする問題が頻発した。一括カットならこの問題が根本的に発生しない。

## 前提条件
- Step 04（文字起こし）でtranscript_words.jsonが存在すること
- Step 05（台本照合）でtranscriptが修正済みであること
- 元動画（カット前）が `public/video/` に存在すること

## やること

### Phase 1: 無音区間の検出

FFmpegの `silencedetect` フィルターで無音区間を検出する。

```bash
ffmpeg -i public/video/元動画.mp4 -af silencedetect=noise=-30dB:d=0.3 -f null - 2>&1 | grep "silence_"
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

修正済みtranscript_words.jsonを解析し、以下のパターンで言い直し候補を検出する。

#### パターン1: 同一フレーズの繰り返し
連続する2〜5単語が、3秒以内に再度出現する場合、前の方を言い直しと判定する。

例：「テニスのグリップは、テニスのグリップは大きく分けて」
→ 1回目の「テニスのグリップは」をカット

#### パターン2: 文の途中での中断＋再開
文が途中で切れ、直後に同じ文頭から再開している場合。

例：「ポイントはですね、えー、ポイントは3つあります」
→ 「ポイントはですね、えー、」をカット

#### パターン3: フィラー＋同一語の繰り返し
「えー」「あのー」「まあ」などのフィラーを挟んで、直前と同じ単語・フレーズを繰り返している場合。

例：「このショットを、えー、このショットを打つ時は」
→ 「このショットを、えー、」をカット

#### パターン4: Whisperが隠した言い直し（重要）

Whisperは言い直し部分を1つの単語に圧縮することがある。**単語のduration（end - start）が2秒以上の場合、言い直しが隠れている可能性が高い。**

検出方法：
```javascript
// transcript_words.jsonから異常に長い単語を検出
const suspiciousWords = words.filter(w => (w.end - w.start) > 2.0);
```

隠れ言い直しが疑われる場合は、その区間の音声を細かく解析する：
```bash
# 該当区間の音声波形を確認（silencedetectを細かい粒度で）
ffmpeg -i public/video/元動画.mp4 -ss 開始秒 -t 区間秒 -af silencedetect=noise=-30dB:d=0.1 -f null - 2>&1 | grep "silence_"
```

無音が見つかれば、その前後で言い直しが発生している可能性が高い。台本と照合して確認する。

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

ユーザーに承認を求める：
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

# 5. パディング（各セグメントの前後に0.05秒の余白）
keeps = [(max(0, s - 0.05), min(total_duration, e + 0.05)) for s, e in keeps]
```

### Phase 5: FFmpeg一発エンコード

キープセグメントをFFmpegの `trim` + `concat` フィルターで一発でエンコードする。

```bash
# キープセグメントからfilter_complexを生成
# 例: keeps = [(0, 5.2), (7.8, 15.3), (18.1, 30.0)]

ffmpeg -y -i public/video/元動画.mp4 -filter_complex \
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
  public/video/元動画_cut.mp4
```

> **重要: concatの入力順序**
> `[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1` のように、**各セグメントのビデオとオーディオを交互に並べる**。
> `[v0][v1][v2][a0][a1][a2]` のようにビデオを先にまとめると「Media type mismatch」エラーになる。

### Phase 6: 結果の確認

```bash
# カット前後の尺を比較
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/video/元動画.mp4
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/video/元動画_cut.mp4
```

カット前後の長さ・カット率を表示し、ユーザーにカット済み動画を再生確認してもらう。

### Phase 7: ユーザー確認 → 追加調整（必要に応じて）

ユーザーが再生確認した結果、以下のフィードバックがあれば対応する：

| フィードバック | 対応 |
|--------------|------|
| 「語尾が切れている」 | 該当セグメントのend時間を+0.1〜0.3秒延長して再エンコード |
| 「無駄なフレームが残っている」 | 該当のキープセグメントの境界を調整して再エンコード |
| 「まだ言い直しが残っている」 | 追加の言い直し区間をretake_cutsに追加して再エンコード |

**再エンコードは常に元動画から行う。** カット済み動画を再カットしてはいけない。

## 完了条件
- カット済み動画（`*_cut.mp4`）が `public/video/` に存在する
- 元動画が保持されている
- カット前後の長さ・カット率を把握している
- ユーザーが再生確認でOKを出している

## 完了後

```
✅ Step 06 完了: 一括カットが完了しました。

【結果】
- カット前: ○○秒
- カット後: ○○秒（○○%短縮）
- カットした無音区間: ○○箇所
- カットした言い直し: ○○箇所

次のステップ → /step07-transcript（カット後の再文字起こし）
進めますか？
```
