#!/usr/bin/env node
/**
 * Root.tsx を監視して、Studio が codemod で書き戻した時に自動で finalize を実行する。
 *
 * 使い方（npm run dev とは別ターミナルで起動）:
 *   node scripts/watch-finalize.mjs
 *
 * 終了: Ctrl+C
 *
 * 仕組み:
 *   - fs.watch で Root.tsx を監視
 *   - 変更検知時、defaultProps が 1行JSON 形式（codemod 出力）かチェック
 *     - 1行JSON 形式 → Studio 編集と判定して finalize 実行
 *     - 整形済み（複数行 JS 形式） → finalize 実行後の状態と判定してスキップ
 *   - busy フラグで多重実行防止
 *   - 1.5秒 debounce で連続書き込みを集約
 *
 * これで無限ループにならない:
 *   Studio 編集 → 1行JSON で書き戻し → 検出 → finalize → 整形 → 検出するが整形済みなのでスキップ
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootPath = path.join(__dirname, "..", "src", "Root.tsx");
const finalizePath = path.join(__dirname, "finalize.mjs");

// Root.tsx がまだ存在しない場合（step01〜07 段階）は出現するまで待機
const waitForRoot = async () => {
  if (fs.existsSync(rootPath)) return;
  console.log(`⏳ ${path.relative(process.cwd(), rootPath)} の出現を待機中...`);
  console.log(`   step08 で gen-editable.mjs が走ると監視を開始します\n`);
  while (!fs.existsSync(rootPath)) {
    await new Promise((r) => setTimeout(r, 3000));
  }
};

await waitForRoot();

console.log(`👀 監視開始: ${path.relative(process.cwd(), rootPath)}`);
console.log(`   Studio 編集 (1行JSON形式) を検出したら自動 finalize 実行`);
console.log(`   Ctrl+C で終了\n`);

let debounceTimer = null;
let busy = false;
let lastMtime = 0;

const isCodemodFormat = (content) => {
  // codemod 出力: defaultProps={{"telops":{...}}}（クオート付き、空白なし）
  // 整形済み:    defaultProps={{\n        telops: {\n          "[t00]...": { start: N, ...
  return /defaultProps=\{\{"telops":\{/.test(content);
};

const checkAndFinalize = () => {
  if (busy) {
    console.log(`  (busy 中、スキップ)`);
    return;
  }

  let content;
  try {
    content = fs.readFileSync(rootPath, "utf-8");
  } catch (err) {
    console.error(`  ✗ Root.tsx 読み込み失敗:`, err.message);
    return;
  }

  if (!isCodemodFormat(content)) {
    // 整形済み or 通常の手書き状態 → スキップ
    return;
  }

  const ts = new Date().toISOString();
  console.log(`[${ts}] 🔄 codemod 出力を検出 → finalize 実行`);
  busy = true;
  try {
    const result = spawnSync("node", [finalizePath], { encoding: "utf-8" });
    if (result.status !== 0) {
      console.error(`  ✗ finalize 失敗 (exit ${result.status})`);
      if (result.stderr) console.error(result.stderr);
    } else {
      const lastLine = (result.stdout || "")
        .split("\n")
        .filter(Boolean)
        .pop();
      console.log(`  ✓ ${lastLine ?? "完了"}`);
    }
  } finally {
    // 自分が書き出した直後の watcher 検知をスキップさせるため少し待つ
    setTimeout(() => {
      busy = false;
    }, 1500);
  }
};

fs.watch(rootPath, { persistent: true }, (eventType) => {
  if (eventType !== "change") return;

  try {
    const stat = fs.statSync(rootPath);
    if (stat.mtimeMs <= lastMtime) return;
    lastMtime = stat.mtimeMs;
  } catch {
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkAndFinalize, 1500);
});

process.on("SIGINT", () => {
  console.log("\n👋 監視終了");
  process.exit(0);
});
