#!/usr/bin/env node
/**
 * Remotion Studio + watch-finalize を同時起動するスクリプト。
 *
 * 使い方:
 *   npm run dev
 *
 * 動作:
 *   - 子プロセス1: Remotion Studio（npx remotion studio）
 *   - 子プロセス2: scripts/watch-finalize.mjs（Root.tsx 監視 → 自動 finalize）
 *   - どちらかが死んだら両方終了
 *   - Ctrl+C で両方終了
 *
 * 利点:
 *   - 受講生が別ターミナル開く必要なし
 *   - concurrently 等の追加依存パッケージ不要（Node 標準のみ）
 */

import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const children = [];
let shuttingDown = false;

const log = (label, color, line) => {
  const colors = { studio: "\x1b[36m", watch: "\x1b[35m", reset: "\x1b[0m" };
  process.stdout.write(`${colors[color] || ""}[${label}]${colors.reset} ${line}\n`);
};

const start = (label, color, command, args) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    chunk.toString().split("\n").forEach((line) => {
      if (line.trim()) log(label, color, line);
    });
  });
  child.stderr.on("data", (chunk) => {
    chunk.toString().split("\n").forEach((line) => {
      if (line.trim()) log(label, color, line);
    });
  });

  child.on("exit", (code) => {
    if (shuttingDown) return;
    log(label, color, `終了 (code ${code})`);
    shutdown();
  });

  children.push(child);
  return child;
};

const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  setTimeout(() => process.exit(0), 500);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("\x1b[1m🎬 Remotion Studio + watch-finalize を起動します\x1b[0m\n");

start("studio", "studio", "npx", ["remotion", "studio"]);
start("watch", "watch", "node", [path.join(__dirname, "watch-finalize.mjs")]);
