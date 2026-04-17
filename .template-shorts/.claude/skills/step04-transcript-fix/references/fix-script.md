# transcript 一括修正スクリプト（詳細）

Node.js で `transcript_words.json` を一括修正する実装全文と、タイムスタンプ按分の仕組み。

## スクリプト本体

```javascript
// fix-transcript.js として保存して実行（Mac/Windows/Linux 共通）
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/transcript_words.json', 'utf-8'));

// Phase 2 で作成した修正リスト
const fixes = [
  // ["誤変換", "正しい"],
];

// 句読点・助詞でテキストを分割する（タイムスタンプ按分用）
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
if (ng.length) { console.log('失敗:'); ng.forEach(t => console.log(`  - ${t}...`)); }
```

## タイムスタンプ按分の仕組み（自動）

| 置換範囲 | 動作 | 例 |
|---------|------|---|
| **3秒以下 or 10文字以下** | 1つのワードエントリに統合 | 「スラウド」→「Claude」 |
| **3秒超 かつ 11文字以上** | 句読点・助詞で分割し、タイムスタンプを按分して複数エントリに | 28秒分の統合テキスト → 6〜8個のワードエントリに分割 |

- **Whisperが単語を分割していても自動で結合して置換**できる（例: 「効」+「果」→「効果」）
- タイムスタンプ（start/end）は元のWhisper出力から引き継がれる

## 修正リストの粒度ルール（重要）

**1つの修正ペアは、できるだけ短い単位にする。**

```javascript
// NG: 長い文を一括で置換（タイムスタンプが不正確になる）
["こうドッド突く事点だνε?こういうタモドッド", "「コード」ってつく時点で無理って思ってる人"]

// OK: 文単位で分割して置換
["こうドッド突く事点だ", "「コード」ってつく時点で無理"],
["νε?こういうタモドッド", "って思ってる人、"]
```

## 実行手順まとめ

1. スクリプト上部の `fixes` 配列に修正リストを入れる
2. `node fix-transcript.js` で実行
3. 「修正成功: N/N」と表示されれば完了
4. 失敗があれば、誤変換テキストを修正して再実行
5. **実行後、fix-transcript.js を削除する**（`transcript-fixes.json` にバックアップしてから）
