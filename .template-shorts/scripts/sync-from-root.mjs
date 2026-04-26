#!/usr/bin/env node
/**
 * Root.tsx の defaultProps から telopData.ts の startFrame/endFrame を更新する。
 *
 * 使い方:
 *   node scripts/sync-from-root.mjs
 *
 * 仕組み:
 *   - Studio で編集した値は Root.tsx の defaultProps に codemod で書き戻される（1行 JSON）
 *   - 本スクリプトはその defaultProps を解析 → 各テロップ idx の start/end を抽出
 *   - telopData.ts の対応エントリの startFrame/endFrame を上書き
 *
 * 推奨運用:
 *   1. Studio で値を編集（自動保存される）
 *   2. 編集確定したら本スクリプト実行 → telopData.ts に反映
 *   3. 続けて 'node scripts/gen-editable.mjs' で Root.tsx を整形再生成
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootPath = path.join(__dirname, "..", "src", "Root.tsx");
const telopPath = path.join(__dirname, "..", "src", "telopData.ts");

const rootSrc = fs.readFileSync(rootPath, "utf-8");

// Root.tsx の defaultProps から各テロップの値を抽出
// パターン1: "[t04] 平均3〜4球":{"start":130,"end":154}（codemod の1行 JSON 形式）
// パターン2: "[t04] 平均3〜4球": { start: 130, end: 154 }（gen-editable.mjs の整形 JS 形式）
const entryRegex = /"\[t(\d+)\][^"]*"\s*:\s*\{\s*"?start"?\s*:\s*(\d+)\s*,\s*"?end"?\s*:\s*(\d+)\s*\}/g;

const values = new Map(); // idx -> { start, end }
let m;
while ((m = entryRegex.exec(rootSrc)) !== null) {
  const idx = Number(m[1]);
  const start = Number(m[2]);
  const end = Number(m[3]);
  values.set(idx, { start, end });
}

if (values.size === 0) {
  console.error("✗ Root.tsx の defaultProps からテロップ値が抽出できませんでした。");
  console.error("  Root.tsx の内容を確認してください。");
  process.exit(1);
}

console.log(`抽出: ${values.size} エントリ (Root.tsx から)`);

// telopData.ts を行単位で処理
const telopSrc = fs.readFileSync(telopPath, "utf-8");
const lines = telopSrc.split("\n");

let entryIdx = 0;
let updatedCount = 0;
let unchangedCount = 0;

const updatedLines = lines.map((line) => {
  const entryMatch = line.match(
    /^(\s*\{\s*text:\s*"(?:[^"\\]|\\.)*",\s*startFrame:\s*)(\d+)(\s*,\s*endFrame:\s*)(\d+)(\s*,.*)$/
  );
  if (!entryMatch) return line;

  const v = values.get(entryIdx);
  if (!v) {
    entryIdx++;
    return line;
  }

  const oldStart = Number(entryMatch[2]);
  const oldEnd = Number(entryMatch[4]);
  if (oldStart === v.start && oldEnd === v.end) {
    unchangedCount++;
  } else {
    updatedCount++;
    console.log(`  [t${String(entryIdx).padStart(2, "0")}] ${oldStart}-${oldEnd} → ${v.start}-${v.end}`);
  }

  const newLine = `${entryMatch[1]}${v.start}${entryMatch[3]}${v.end}${entryMatch[5]}`;
  entryIdx++;
  return newLine;
});

if (entryIdx !== values.size) {
  console.warn(`⚠ telopData.ts のエントリ数 (${entryIdx}) と Root.tsx (${values.size}) が一致しません`);
}

if (updatedCount === 0) {
  console.log(`✓ 変更なし (${unchangedCount} エントリは既に一致)`);
  process.exit(0);
}

fs.writeFileSync(telopPath, updatedLines.join("\n"));
console.log("");
console.log(`✓ src/telopData.ts を更新`);
console.log(`  - 変更: ${updatedCount} エントリ`);
console.log(`  - 変更なし: ${unchangedCount} エントリ`);
console.log("");
console.log("次のステップ（Root.tsx を整形再生成する場合）:");
console.log("  node scripts/gen-editable.mjs");
