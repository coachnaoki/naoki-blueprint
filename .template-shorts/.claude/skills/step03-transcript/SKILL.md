---
name: step03-transcript
description: 元動画（カット前）にWhisperで文字起こしを実行し、transcript_words.jsonを生成・解析する。発話タイミング・文の区切り・総秒数を把握する。
allowed-tools: Read, Write, Glob, Grep, Bash(ls *), Bash(wc *), Bash(node *), Bash(/opt/homebrew/bin/python3.12 *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 04: 文字起こし＋トランスクリプト解析（カット前の元動画）

**元動画（カット前）** にWhisperで文字起こしを実行し、`public/transcript_words.json` を生成・解析する。

> **重要**: このステップではカット前の本編動画に対して文字起こしを行う。これは次のstep04（台本照合）とstep05（一括カット）で、言い直しや無音区間を正確に特定するため。カット後の最終的な文字起こしはstep06で行う。

## 前提条件
- Step 02（素材チェック）が完了していること
- 本編動画が `public/main/` に存在すること
- Whisper環境: `/opt/homebrew/bin/python3.12` + `mlx-whisper`（**python3.14では動かない、必ず3.12を使用**）

## やること

### 0. 対象動画の特定

`public/main/` 内の `.mp4` を対象にする。複数ある場合はStep02で確定した順序に従って**連結前の各ファイル個別に**文字起こしする（物理挿入は Step11 の `<Series>` で行うため、ここでは本編の各パートを独立して扱う）。

**`*_cut.mp4` は使わない。** カット前の動画に対して文字起こしを行う。

### 1. Whisperで文字起こし実行

```bash
/opt/homebrew/bin/python3.12 -c "
import json, mlx_whisper
result = mlx_whisper.transcribe('public/main/対象動画.mp4', word_timestamps=True, path_or_hf_repo='mlx-community/whisper-small-mlx')
words = [{'word': w['word'].strip(), 'start': round(w['start'],3), 'end': round(w['end'],3)} for seg in result['segments'] for w in seg.get('words',[])]
with open('public/transcript_words.json','w',encoding='utf-8') as f:
    json.dump({'language': result.get('language','ja'), 'words': words}, f, ensure_ascii=False, indent=2)
print(f'{len(words)}語')
"
```

**重要**: mlx-whisperは `/opt/homebrew/lib/python3.12/site-packages/mlx_whisper` にインストール済み。新たにインストール・重複インストールしないこと。

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
✅ Step 04 完了: トランスクリプト解析が完了しました。

【概要】
- 総ワード数: ○○語
- 動画長: ○○秒（○○フレーム）※カット前
- 文の数: ○○文
- 無音区間: ○○箇所

次のステップ → /step04-transcript-fix（文字起こし修正）
進めますか？
```
