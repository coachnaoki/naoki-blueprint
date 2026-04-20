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

#### パターン1〜3: N-gram自動検出（同一フレーズの繰り返し・文中断・フィラー挟み）

**ハードコード禁止。以下のアルゴリズムで自動検出する。**

10文字以上のN-gramで、同じ文字列が2回以上登場し、かつ時刻差が30秒以内のものを言い直し候補とする。

```python
import json, re, subprocess

# Phase 1の無音区間を取得済みの前提（silences）
orig = json.load(open('public/transcript_words.original.json'))['words']
text = ''.join(w['word'].replace(' ','') for w in orig)

def time_at(char_p):
    c = 0
    for w in orig:
        wl = len(w['word'].replace(' ',''))
        if c + wl > char_p: return w['start']
        c += wl
    return orig[-1]['end']

# N=10〜19文字のN-gramで2回以上登場するものを収集
candidates = {}
for n in range(10, 20):
    for i in range(len(text) - n + 1):
        phrase = text[i:i+n]
        if any(c in phrase for c in '。、！？'): continue  # 句読点跨ぎは除外
        candidates.setdefault(phrase, []).append(i)

# 2回以上登場 + 時刻差30秒以内
dup_phrases = []
for phrase, positions in candidates.items():
    if len(positions) < 2: continue
    t1 = time_at(positions[0])
    t2 = time_at(positions[1])
    if t2 - t1 > 30: continue  # 30秒超は意図的な繰り返しの可能性
    dup_phrases.append((phrase, t1, t2))

# オーバーラップ除去（長いフレーズを優先）
dup_phrases.sort(key=lambda x: -len(x[0]))
def overlaps(a, b):
    return not (a[1] < b[0] - 0.1 or b[1] < a[0] - 0.1)
phrase_retakes = []
for p, t1, t2 in dup_phrases:
    cut = (t1, t2)
    if any(overlaps(cut, s_cut) for s_cut, _ in phrase_retakes): continue
    phrase_retakes.append((cut, p))

print(f"重複フレーズ検出: {len(phrase_retakes)}件")
```

**なぜ最小10文字か:** 短いフレーズ（「ポジショニング」等8文字）は正文でも偶然2回登場しやすく誤検出になる。10文字以上なら偶然の一致はほぼ発生しない。

**なぜ時刻差30秒以内か:** 30秒超で同じフレーズが登場する場合、セクション区切りや意図的な繰り返しの可能性が高い。言い直しは通常5〜20秒以内。

#### パターン4: Whisperが隠した言い直し（重要）

Whisperは言い直し部分を1つの単語に統合することがある。**1〜2文字のワードでduration（end - start）が0.7秒以上の場合、言い直しが隠れている可能性が高い。**

例：「悩み…悩みを」→ Whisperが「み」を2.1秒の1ワードに統合。「前衛のポ…前衛のポーチと」→「ポ」を1.94秒に統合。

検出方法：
```python
# 必ず .original.json から検出する
import json
orig = json.load(open('public/transcript_words.original.json'))['words']
# 1〜2文字で0.7秒以上のワードを検出
hidden_retakes = [(i, w) for i, w in enumerate(orig) if len(w['word'].strip()) <= 2 and (w['end'] - w['start']) >= 0.7]
print(f'隠れ言い直し: {len(hidden_retakes)}件')
```

**⚠️ 検出された全件をループで処理する（必須）。**
1件だけ処理するなどのハードコード禁止。例1, 例2 は実例であり、件数を限定するものではない。

#### 隠れ言い直しのカット範囲自動拡張（必須）

隠れ言い直しが見つかった場合、単語そのものだけでなく**話者が戻った地点まで**カット範囲を拡張する必要がある。

**アルゴリズム：**
1. 隠れ言い直しワード内の無音区間 **S1** を特定（Phase 1のsilencedetect結果から）
2. 隠れ言い直しワードより**前の直近の無音区間 S0** を探す
3. **S0の開始時刻以降で最初に始まるワード** → カット開始点
4. **S1の終了時刻** → カット終了点

```
例1: 「あなたもこんな悩み」の隠れ言い直し
  - 隠れ言い直し: 「み」83.30-85.40s（2.1秒）
  - S1（中の無音）: 83.57-84.16s
  - S0（前の無音）: 81.27-82.04s
  - S0後の最初のワード: 「あ(なた)」81.72s
  → カット範囲: 81.72 → 84.16s（「あなたもこんな悩み」1回目まるごと）

例2: 「前衛のポ」の隠れ言い直し
  - 隠れ言い直し: 「ポ」108.86-110.80s（1.94秒）
  - S1（中の無音）: 109.15-109.96s
  - S0（前の無音）: 107.76-108.23s
  - S0後の最初のワード: 「全(=前衛)」108.06s
  → カット範囲: 108.06 → 109.96s（「前衛のポ」1回目まるごと）
```

**なぜ前の無音まで戻るのか**: 話者は言い直す時、直前の句や節の先頭まで戻ることが多い。その戻り地点は直前の無音（息継ぎ・間）の直後と一致する。

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
# 発話末尾に +50ms の余韻、次発話開始に -30ms の息継ぎ余白を残す。
# silencedetect の timestamps は ±50-100ms ズレるので、word境界に揃えることで
# 「発話がプツッと切れる」「息継ぎが消える」問題を防げる。
#
# アルゴリズム:
#   各無音区間 (s.start, s.end) について:
#     wPrev = s.start 以前に end する最後のword（±0.30s以内）
#     wNext = s.end 以降に start する最初のword（±0.30s以内）
#     cutStart = wPrev.end + 0.050s  (snap 成功時)
#                 または s.start + 0.075s (フォールバック)
#     cutEnd   = wNext.start - 0.030s (snap 成功時)
#                 または s.end - 0.075s (フォールバック)
#
# これを keeps 計算に適用したあと、0.3s未満の短いセグメントを除外する。
# ※ フォールバックは従来の 0.075s 固定padding相当

import json
words = json.load(open('public/transcript_words.json'))['words']

def word_before(t):
    best = None
    for w in words:
        if w['end'] <= t + 0.20: best = w
        else: break
    return best

def word_after(t):
    for w in words:
        if w['start'] >= t - 0.20: return w
    return None

KEEP_AFTER = 0.050   # 発話末尾の余韻
KEEP_BEFORE = 0.030  # 次発話の息継ぎ前余白
FALLBACK = 0.075

snapped_cuts = []
for (cs, ce) in merged:
    wp = word_before(cs)
    wn = word_after(ce)
    new_cs = (wp['end'] + KEEP_AFTER) if wp and abs(wp['end']-cs) <= 0.30 else (cs + FALLBACK)
    new_ce = (wn['start'] - KEEP_BEFORE) if wn and abs(wn['start']-ce) <= 0.30 else (ce - FALLBACK)
    if new_ce > new_cs:
        snapped_cuts.append((new_cs, new_ce))

# snapped_cuts を使って keeps を再計算
# ... (prev_end = 0 から通常通り差し引き)
```

> **Teleprompter動画 2分48秒での実測**:
> - legacy（0.075s固定padding）: 116.91s（30.4%カット）
> - word-boundary snap: 109.40s（34.9%カット）、snap成功率92% (72/78)
> - **差分 7.5秒** — word境界に snap する分、無音をよりタイトに削れる
> - 発話末尾の「息を吸う音」が残るため自然。カット直後の「突然始まる感」が消える

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

### Phase 6: 結果の確認と再生（必須）

```bash
# カット前後の尺を比較
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/main/元動画.mp4
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/main/元動画_cut.mp4
```

カット前後の長さ・カット率を表示する。

**カット後は必ず動画を再生してユーザーに確認してもらう。** 再生なしで次のステップに進んではいけない。

**⚠️ 必須実行:** エンコード完了直後に以下のコマンドを**必ず実行**する。ユーザーに「確認しますか？」と聞かない。エラー検出のための強制プレビュー。

```bash
node scripts/open-file.mjs public/videos/main/元動画_cut.mp4
```

実行後、**動画が自動で再生される** ので、ユーザーに「カットされた動画を開きました。以下を確認してください」と伝えてフィードバックを待つ。

### Phase 7: ユーザー確認 → 追加調整（必須）

動画確認時、必ず以下をユーザーに聞く:
```
カット動画を確認してください。以下をチェックしてほしい:
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
- **カット後の動画を再生し、ユーザーがOKを出している**（再生せずに完了してはいけない）

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
