---
name: step03-transcript
description: 元動画（カット前）にWhisperで文字起こしを実行し、transcript_words.jsonを生成・解析する。発話タイミング・文の区切り・総秒数を把握する。ユーザーが「文字起こし」「transcript」「ステップ3」「step03」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Glob, Grep, Bash(ls *), Bash(wc *), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step03-transcript` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 03: 文字起こし＋トランスクリプト解析（カット前の元動画）

**元動画（カット前）** にWhisperで文字起こしを実行し、`public/transcript_words.json` を生成・解析する。

> **重要**: このステップではカット前の本編動画に対して文字起こしを行う。これは次のstep04（台本照合）とstep05（一括カット）で、言い直しや無音区間を正確に特定するため。カット後の最終的な文字起こしはstep06で行う。

## 前提条件
- Step 02（素材チェック）が完了していること
- 本編動画が `public/videos/main/` に存在すること
- **Whisper環境（OS別）**:
  - **macOS (Apple Silicon)**: Python 3.12 + `mlx-whisper` — `brew install python@3.12 && pip3.12 install mlx-whisper`
  - **Windows / Linux**: Python 3.12 + `faster-whisper` — `pip install faster-whisper`
  - ⚠️ **Python 3.14では動かない、必ず3.12を使用**

## やること

### 0. 対象動画の特定

`public/videos/main/` 内の `.mp4` を対象にする。複数ある場合はStep02で確定した順序に従って**連結前の各ファイル個別に**文字起こしする（物理挿入は Step11 の `<Series>` で行うため、ここでは本編の各パートを独立して扱う）。

**`*_cut.mp4` は使わない。** カット前の動画に対して文字起こしを行う。

### 1. Whisperで文字起こし実行

**transcript_words.json と transcript_words.original.json を同時に作成する。**
`.original.json` はstep05の言い直し検出に使う（step04の修正で隠れ言い直しが消えるのを防ぐため）。

```bash
# 共通ラッパー（Mac: mlx-whisper / Windows・Linux: faster-whisper を自動判定）
node scripts/transcribe.mjs public/videos/main/対象動画.mp4
```

内部で以下を実行:
- macOS: `mlx-community/whisper-large-v3-mlx` モデルで mlx-whisper
- Windows/Linux: `faster-whisper` ライブラリで同等のlarge-v3モデル
- 両方とも word-level timestamp 付き

**重要**: 
- **Whisperモデル固定**: large-v3 を必ず使う。small / turbo / v2 等に勝手に変更禁止（タイムスタンプ精度が落ちて台本照合・テロップ位置がズレる）。
- **`transcript_words.original.json` は step04・step06 で絶対に編集しない**。step05の隠れ言い直し検出のため、Whisper原文のままで保持する必要がある。

### 2. トランスクリプト読み込み

`public/transcript_words.json` を読み込む。

データ形式の例：
```json
{
  "language": "ja",
  "words": [
    { "word": "いきなり", "start": 0.08, "end": 0.56 },
    { "word": "ですが", "start": 0.56, "end": 0.84 }
  ]
}
```

### 3. 基本情報の整理

以下を算出して表示する：
- 総ワード数
- 発話開始時間（最初のワード）
- 発話終了時間（最後のワード）
- 動画の総秒数 → 総フレーム数（× video-context.md のFPS）

### 4. 文単位の区切り整理

ワードを文単位（句点・読点・意味の区切り）でグルーピングし、各文の：
- テキスト（ワードを結合）
- 開始秒数 → 開始フレーム
- 終了秒数 → 終了フレーム

を一覧表示する。

### 5. 無音区間の特定

ワード間で0.5秒以上の間（ギャップ）がある箇所を特定し、一覧表示する。
これはスライド切り替えやセクション区切りの候補になる。

### 6. video-context.md への追記

動画の総秒数・総フレーム数を `video-context.md` に追記する。
**注意**: この時点の値はカット前の元動画の値。カット後の最終値はstep07で更新される。

## 完了条件
- transcript_words.json が元動画に基づいて生成されている
- トランスクリプトの内容を把握している
- 文単位の区切りと開始/終了フレームを整理している
- 無音区間（ギャップ）を特定している

## 完了後

```
✅ Step 03 完了: トランスクリプト解析が完了しました。

【概要】
- 総ワード数: ○○語
- 動画長: ○○秒（○○フレーム）※カット前
- 文の数: ○○文
- 無音区間: ○○箇所

次のステップ → /step04-transcript-fix（文字起こし修正）
進めますか？
```
