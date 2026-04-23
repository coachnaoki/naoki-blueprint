---
name: step06-transcript
description: カット済み動画にWhisperで再文字起こしを実行し、step05の修正リストを再適用する。カット後の正確なタイムスタンプでtranscript_words.jsonを確定する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ls *), Bash(wc *), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step06-transcript` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 06: カット後の再文字起こし＋修正再適用

Step 06でカット済みの動画に対してWhisperで再文字起こしを実行し、Step 05で作成した修正リストを再適用する。

> **なぜ再文字起こしが必要か**: Step 06のカットで動画の尺が変わるため、Step 04のtranscript_words.jsonのタイムスタンプはカット後の動画と一致しない。カット済み動画に対して改めてWhisperを実行し、正確なタイムスタンプを取得する必要がある。

## 前提条件
- Step 05（一括カット）が完了し、カット済み動画（`*_cut.mp4`）が存在すること
- Step 05で作成した修正リスト（`transcript-fixes.json`）が存在すること
- Whisper環境（step03と同じ・README参照）:
  - macOS: Python 3.12 + `mlx-whisper`
  - Windows/Linux: Python 3.12 + `faster-whisper`

## やること

### 1. Whisperで再文字起こし

カット済み動画に対してWhisperを実行する。

**Whisperモデル固定**: large-v3 を必ず使う（small/turbo/v2 は禁止・タイムスタンプ精度が落ちる）。

```bash
# 共通ラッパー（Mac: mlx-whisper / Windows・Linux: faster-whisper）
# --no-backup で original.json を上書きしない（step03のバックアップを維持）
node scripts/transcribe.mjs public/videos/main/<メイン動画>_cut.mp4 --no-backup
```

※ メイン動画のファイル名は `video-context.md` の「動画ファイル」セクションを参照

### 2. 修正リストの再適用

Step 05で保存した `transcript-fixes.json` を使って、修正を再適用する。

Whisperは同じ音声に対して同じ誤変換をする傾向があるため、修正リストの大部分はそのまま再利用できる。

```javascript
// fix-transcript.js として保存して実行
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/transcript_words.json', 'utf-8'));
const fixes = JSON.parse(fs.readFileSync('transcript-fixes.json', 'utf-8'));

function splitAtBoundaries(text) {
  const chunks = [];
  let current = '';
  for (const ch of text) {
    current += ch;
    if ('。、！？'.includes(ch)) { chunks.push(current); current = ''; }
  }
  if (current) chunks.push(current);

  const result = [];
  for (const chunk of chunks) {
    if (chunk.length <= 15) { result.push(chunk); continue; }
    let remaining = chunk;
    while (remaining.length > 15) {
      let bp = -1;
      for (let i = 6; i < Math.min(14, remaining.length); i++) {
        if ('はのにをがでもてと'.includes(remaining[i]) && i < remaining.length - 1) {
          bp = i + 1; break;
        }
      }
      if (bp === -1) bp = Math.min(12, remaining.length);
      result.push(remaining.slice(0, bp));
      remaining = remaining.slice(bp);
    }
    if (remaining) result.push(remaining);
  }
  return result.length > 0 ? result : [text];
}

function findAndReplace(words, oldText, newText) {
  const full = words.map(w => w.word).join('');
  const pos = full.indexOf(oldText);
  if (pos === -1) return { words, found: false };

  let charCount = 0, firstIdx = null, lastIdx = null;
  for (let i = 0; i < words.length; i++) {
    const wLen = words[i].word.length;
    if (firstIdx === null && charCount + wLen > pos) firstIdx = i;
    if (charCount + wLen >= pos + oldText.length) { lastIdx = i; break; }
    charCount += wLen;
  }
  if (firstIdx === null || lastIdx === null) return { words, found: false };

  const startTime = words[firstIdx].start;
  const endTime = words[lastIdx].end;
  const duration = endTime - startTime;

  let newEntries;
  if (duration <= 3 || newText.length <= 10) {
    newEntries = [{ word: newText, start: startTime, end: endTime }];
  } else {
    const segments = splitAtBoundaries(newText);
    const totalChars = newText.length;
    let curStart = startTime;
    newEntries = segments.map((seg, i) => {
      const ratio = seg.length / totalChars;
      const segEnd = i === segments.length - 1
        ? endTime
        : Math.round((curStart + duration * ratio) * 100) / 100;
      const entry = { word: seg, start: Math.round(curStart * 100) / 100, end: segEnd };
      curStart = segEnd;
      return entry;
    });
  }

  words = [...words.slice(0, firstIdx), ...newEntries, ...words.slice(lastIdx + 1)];
  return { words, found: true };
}

let currentWords = data.words;
let ok = 0;
const ng = [];
for (const [oldText, newText] of fixes) {
  const result = findAndReplace(currentWords, oldText, newText);
  if (result.found) { currentWords = result.words; ok++; }
  else { ng.push(oldText.slice(0, 30)); }
}

fs.writeFileSync('public/transcript_words.json', JSON.stringify({ language: data.language, words: currentWords }, null, 2));
console.log(`修正成功: ${ok}/${fixes.length}`);
if (ng.length) { console.log('失敗（カットで消えた箇所 or Whisperの出力変化）:'); ng.forEach(t => console.log(`  - ${t}...`)); }
```

**失敗した修正について:**
- 言い直し部分がカットされて無くなった修正 → 正常（無視してOK）
- カット後にWhisperの出力が微妙に変わった修正 → 手動で修正リストを調整して再実行

### 3. 追加修正チェック

修正再適用後、全文テキストを出力して確認する。

カットによって以下が発生する可能性がある：
- カット境界付近の単語が変わる（Whisperがカット境界の音を別の単語として認識する）
- 新たな誤変換が出現する

残存する誤変換があれば、追加の修正リストを作って再実行する。

### 4. 基本情報の更新

以下を算出して表示する：
- 総ワード数
- 発話開始時間（最初のワード）
- 発話終了時間（最後のワード）
- **カット済み動画の総秒数 → 総フレーム数**（× video-context.md のFPS）

### 5. video-context.md の更新

カット済み動画の最終的な総秒数・総フレーム数で `video-context.md` を更新する。

### 6. クリーンアップ

```bash
rm -f fix-transcript.js transcript-fixes.json
```

## 完了条件
- transcript_words.json がカット済み動画に基づいて生成・修正されている
- video-context.md がカット後の値で更新されている
- fix-transcript.js と transcript-fixes.json が削除されている

## 完了後

```
✅ Step 06 完了: カット後の再文字起こし＋修正が完了しました。

【概要】
- 総ワード数: ○○語
- 動画長: ○○秒（○○フレーム）※カット後の最終値
- 修正再適用: ○○件成功 / ○○件スキップ（カットで消えた箇所）
- 追加修正: ○○件

次のステップ → /step07-template（テンプレート設定）
進めますか？
```
