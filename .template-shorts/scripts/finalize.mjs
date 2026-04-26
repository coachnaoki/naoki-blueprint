#!/usr/bin/env node
/**
 * Studio で編集した結果を確定するための統合スクリプト。
 *
 * 使い方:
 *   node scripts/finalize.mjs
 *
 * 実行内容（順番に2つ）:
 *   1. sync-from-root.mjs : Root.tsx の defaultProps → telopData.ts に反映
 *   2. gen-editable.mjs   : telopData.ts → EditableTelops.ts と Root.tsx を整形再生成
 *
 * これで Studio で編集した値が telopData.ts に正式に反映され、
 * Root.tsx が見やすい複数行形式に整形される。
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const steps = [
  { name: "sync-from-root", script: path.join(__dirname, "sync-from-root.mjs") },
  { name: "gen-editable", script: path.join(__dirname, "gen-editable.mjs") },
];

for (const step of steps) {
  console.log(`\n=== Step: ${step.name} ===`);
  const result = spawnSync("node", [step.script], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`✗ ${step.name} 失敗 (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n✓ Finalize 完了");
