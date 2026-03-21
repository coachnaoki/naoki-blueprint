---
name: step04-transcript
description: カット済み動画にWhisperで文字起こしを実行し、transcript_words.jsonを生成・解析する。発話タイミング・文の区切り・総秒数を把握する。
allowed-tools: Read, Write, Glob, Grep, Bash(ls *), Bash(wc *), Bash(node *), Bash(/opt/homebrew/bin/python3.12 *)
---

# Step 04: 文字起こし＋トランスクリプト解析

カット済み動画（`public/video/*_cut.mp4`）にWhisperで文字起こしを実行し、`public/transcript_words.json` を生成・解析する。

## 前提条件
- Step 03（ジェットカット）でカット済み動画が `public/video/` に存在すること
- Whisper環境: `/opt/homebrew/bin/python3.12` + `mlx-whisper`（**python3.14では動かない、必ず3.12を使用**）

## やること

### 0. Whisperで文字起こし実行

カット済み動画（`public/video/*_cut.mp4`）に対してWhisperを実行する。

```bash
/opt/homebrew/bin/python3.12 -c "
import json, mlx_whisper
result = mlx_whisper.transcribe('public/video/動画名_cut.mp4', word_timestamps=True, path_or_hf_repo='mlx-community/whisper-small-mlx')
words = [{'word': w['word'].strip(), 'start': round(w['start'],3), 'end': round(w['end'],3)} for seg in result['segments'] for w in seg.get('words',[])]
with open('public/transcript_words.json','w',encoding='utf-8') as f:
    json.dump({'language': result.get('language','ja'), 'words': words}, f, ensure_ascii=False, indent=2)
print(f'{len(words)}語')
"
```

**重要**: mlx-whisperは `/opt/homebrew/lib/python3.12/site-packages/mlx_whisper` にインストール済み。新たにインストール・重複インストールしないこと。

### 1. トランスクリプト読み込み

`public/transcript_words.json` を読み込む。

データ形式の例：
```json
[
  { "word": "いきなり", "start": 0.08, "end": 0.56 },
  { "word": "ですが", "start": 0.56, "end": 0.84 },
  ...
]
```

### 2. 基本情報の整理

以下を算出して表示する：
- 総ワード数
- 発話開始時間（最初のワード）
- 発話終了時間（最後のワード）
- 動画の総秒数 → 総フレーム数（×30）

### 3. 文単位の区切り整理

ワードを文単位（句点・読点・意味の区切り）でグルーピングし、各文の：
- テキスト（ワードを結合）
- 開始秒数 → 開始フレーム
- 終了秒数 → 終了フレーム

を一覧表示する。

### 4. 無音区間の特定

ワード間で0.5秒以上の間（ギャップ）がある箇所を特定し、一覧表示する。
これはスライド切り替えやセクション区切りの候補になる。

### 5. video-context.md への追記

動画の総秒数・総フレーム数を `video-context.md` に追記する。

## 完了条件
- トランスクリプトの内容を把握している
- 文単位の区切りと開始/終了フレームを整理している
- 無音区間（ギャップ）を特定している

## 完了後

```
✅ Step 04 完了: トランスクリプト解析が完了しました。

【概要】
- 総ワード数: ○○語
- 動画長: ○○秒（○○フレーム）
- 文の数: ○○文
- 無音区間: ○○箇所

次のステップ → /step05-transcript-fix（文字起こし修正）
進めますか？
```
