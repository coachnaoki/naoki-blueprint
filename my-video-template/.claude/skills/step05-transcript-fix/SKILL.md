---
name: step05-transcript-fix
description: ユーザーの台本（ナレーション原稿）とtranscript_words.jsonを照合し、Whisperの誤変換を修正する。
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(node *)
---

# Step 05: 文字起こし修正（台本照合）

ユーザーから提供された台本（ナレーション原稿）と `transcript_words.json` を照合し、Whisperの誤変換・誤字を修正する。

## 前提条件
- Step 04（文字起こし）が完了していること
- `video-context.md` にナレーション原稿があること、またはユーザーから台本が提供されていること

## 重要: スクリプトで一括修正する

**AIの記憶に頼って1箇所ずつEditで修正してはいけない。**
長い動画（3,000ワード以上）では、後半の修正漏れが大量に発生する。

**必ず以下の手順で行う：**
1. 台本とtranscriptを読んで、修正リスト（JSON配列）を作成する
2. Node.jsスクリプトで一括修正を実行する
3. 修正結果を確認する

## やること

### Phase 1: 固有名詞・重要語リストの事前抽出（最優先）

台本から以下のカテゴリの単語を **すべて** 抽出してリスト化する。これらはWhisperが最も誤認識しやすい。

| カテゴリ | 例 |
|---------|---|
| **英語・アルファベット** | Claude Code, Python, GitHub, ChatGPT, CSV, LP, CTA, Remotion, Premiere |
| **固有名詞（人名・地名・サービス名）** | Anthropic, YouTube, X（旧Twitter）, Zoom |
| **カタカナ専門用語** | エンジニア, フリーランス, ランディングページ, ターミナル, デンジャラスモード |
| **数字・パーセント・金額** | 13年, 2,000人, 40%, 1万5千円, 30万円 |
| **動画特有の用語** | チャンネル登録, 高評価, コメント, チャットAI |

**抽出したリストは作業中メモとして保持し、Phase 2・3 で照合に使う。**

### Phase 2: 修正リストの作成

台本とtranscript全文を比較し、**修正リストをJSON配列として作成する**。

#### 検索のコツ
- Whisperは英語を「音のまま日本語化」する傾向がある
  - Claude → クロード / スラウド / グロード
  - ChatGPT → サッポジPT / チャッポジPT
  - GitHub → ギッと幅 / ギットハブ
  - Python → パイソン / パイトン
  - Remotion → リモンをション / リモーション
- 数字は桁が変わることがある（40% → 4%、13年 → 長年）
- 「非エンジニア」→「日園時に」のように、全く違う漢字に変換されることがある

#### 修正リストの形式
```json
[
  ["誤変換テキスト", "正しいテキスト"],
  ["スラウドコード", "クラウドコード"],
  ["マンケタムよく", "マーケターの由貴"]
]
```

#### 作成手順
1. **Phase 1 の固有名詞を最優先で照合** — transcript内の音が近い誤変換を特定
2. **台本の文を順番に照合** — 台本を1文ずつ、transcriptの対応箇所と比較して差分を抽出
3. **修正リストに全件追加** — 漏れなく拾うため、短い区間で照合する（1〜2文ずつ）

**コツ: 台本の前半→後半を順にたどり、transcript側も同じ方向に進む。同じ文を飛ばさない。**

### Phase 3: Node.jsスクリプトで一括修正

修正リストを使って、以下のNode.jsスクリプトで一括修正を実行する。

```javascript
// fix-transcript.js として保存して実行
const fs = require('fs');

const words = JSON.parse(fs.readFileSync('public/transcript_words.json', 'utf-8'));

// Phase 2 で作成した修正リスト
const fixes = [
  // ["誤変換", "正しい"],
];

function findAndReplace(words, oldText, newText) {
  const full = words.map(w => w.word).join('');
  const pos = full.indexOf(oldText);
  if (pos === -1) return { words, found: false };

  let charCount = 0;
  let firstIdx = null, lastIdx = null;
  for (let i = 0; i < words.length; i++) {
    const wLen = words[i].word.length;
    if (firstIdx === null && charCount + wLen > pos) firstIdx = i;
    if (charCount + wLen >= pos + oldText.length) { lastIdx = i; break; }
    charCount += wLen;
  }
  if (firstIdx === null || lastIdx === null) return { words, found: false };

  const newWord = {
    word: newText,
    start: words[firstIdx].start,
    end: words[lastIdx].end
  };
  words = [...words.slice(0, firstIdx), newWord, ...words.slice(lastIdx + 1)];
  return { words, found: true };
}

let successCount = 0;
const failed = [];
for (const [oldText, newText] of fixes) {
  const result = findAndReplace(words, oldText, newText);
  if (result.found) {
    Object.assign(words, []); // workaround
    words.length = 0;
    result.words.forEach(w => words.push(w));
    successCount++;
  } else {
    failed.push(oldText.slice(0, 30));
  }
}

// 上のworkaround代わりに、直接resultを使う版
let currentWords = JSON.parse(fs.readFileSync('public/transcript_words.json', 'utf-8'));
let ok = 0;
const ng = [];
for (const [oldText, newText] of fixes) {
  const result = findAndReplace(currentWords, oldText, newText);
  if (result.found) { currentWords = result.words; ok++; }
  else { ng.push(oldText.slice(0, 30)); }
}

fs.writeFileSync('public/transcript_words.json', JSON.stringify(currentWords, null, 2));
console.log(`修正成功: ${ok}/${fixes.length}`);
if (ng.length) { console.log('失敗:'); ng.forEach(t => console.log(`  - ${t}...`)); }
```

**実行方法:**
1. 上記スクリプトの `fixes` 配列に Phase 2 で作成した修正リストを入れる
2. `node fix-transcript.js` で実行
3. 「修正成功: N/N」と表示されれば完了
4. 失敗があれば、誤変換テキストを修正して再実行
5. **実行後、fix-transcript.js を削除する**

### Phase 4: 最終チェック → 追加修正の再実行（必須）

Phase 3 のスクリプト実行後、**必ず修正後の全文テキストを出力して読み直す。**

1. **Phase 1 の固有名詞リストが全て正しく反映されているか** — 全文テキストで確認
2. 明らかに日本語として不自然な箇所が残っていないか
3. **残存する誤変換を新しい修正リストにまとめて、同じスクリプトで再実行する**

#### Phase 4 で拾うべき典型的な残り
Phase 2-3 では固有名詞や大きな誤変換を優先するため、以下のような細かい誤りが残りやすい：

| パターン | 例 |
|---------|---|
| 漢字1〜2文字の変換ミス | 「両さん」→「量産」、「結構を」→「結果を」 |
| 送り仮名・助詞の誤り | 「とと入力」→「と入力」、「人を」→「人、」 |
| カタカナの微妙な違い | 「アプロード」→「アップロード」 |
| 敬体・常体の混在 | 「悪いことはないので」→「悪いことは言わないので」 |
| 数字の単位ミス | 「10分くらい投稿文章」→「10本くらい投稿文章」 |

#### 再実行手順
1. 残存する誤変換をリストアップ
2. `fix-transcript.js` の `fixes` を **新しい修正リストに差し替え**
3. `node fix-transcript.js` で再実行
4. 全文テキストを再確認
5. まだ残りがあれば繰り返す（通常2回で完了する）
6. **完了したら fix-transcript.js を削除する**

### 修正ルール（全Phase共通）
- **タイムスタンプ（start/end）は変更しない** — テキストのみ修正
- 台本にない言い直し・フィラーはそのまま残す（後のテロップステップで判断）
- 台本と発話が異なる場合（アドリブ等）は、**実際の発話を優先**し台本で正しい漢字だけ適用

### 単語分割ミスへの対処
Whisperは1つの単語を複数ワードに分割することが多い（例: 「効果」→「効」+「果」、「コンテンツ」→「コン」+「テン」+「ツ」）。

修正リストでは、分割された複数ワードの文字を結合した文字列を `oldText` に指定すれば、スクリプトが自動的に結合・置換する。タイムスタンプは最初のワードのstartと最後のワードのendが保持される。

## 完了条件
- Phase 1 で抽出した固有名詞が全て正しく修正されている
- transcript_words.json の誤変換が台本に基づいて修正されている
- タイムスタンプが変更されていない
- fix-transcript.js が削除されている
- 修正箇所がユーザーに報告されている

## 完了後

```
✅ Step 05 完了: 文字起こし修正が完了しました。

【修正結果】
- Phase 1 抽出語数: ○○語
- 修正箇所: ○○件（成功○○ / 失敗○○）
- 主な修正: （リスト）

次のステップ → /step06-slides-gen（スライド生成）
進めますか？
```
