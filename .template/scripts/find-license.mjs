#!/usr/bin/env node
/**
 * 親の naoki-blueprint（または兄弟プロジェクト）から .license を自動で探してコピーする。
 *
 * naoki-blueprint 本体で認証済みなら、新規プロジェクト側で再度IDを入力する必要がない。
 * fingerprint（hostname|user|platform|arch）が現在のマシンと一致する場合のみコピー。
 *
 * 使い方:
 *   node scripts/find-license.mjs
 *
 * 探索範囲:
 *   - ../../.license                  (naoki-blueprint本体)
 *   - ../*\/.license                  (兄弟プロジェクト)
 */
import { existsSync, copyFileSync, readFileSync, readdirSync } from "fs";
import { hostname, userInfo, platform, arch } from "os";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const TARGET = join(PROJECT, ".license");

if (existsSync(TARGET)) {
  console.log("✓ .license は既に存在します。コピーは不要です。");
  process.exit(0);
}

// 現在のマシンのfingerprint（validateLicense.mjs / _chk.mjs と同じ計算）
const getFingerprint = () => {
  const r = `${hostname()}|${userInfo().username}|${platform()}|${arch()}`;
  return createHash("sha256").update(r).digest("hex").slice(0, 16);
};

// 探索候補
const ROOT = resolve(PROJECT, ".."); // projects/
const BLUEPRINT = resolve(ROOT, ".."); // naoki-blueprint/

const candidates = [
  join(BLUEPRINT, ".license"),
];

// 兄弟プロジェクトの .license も候補に
if (existsSync(ROOT)) {
  try {
    for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === dirname(TARGET).split("/").pop()) continue; // 自分自身はスキップ
      candidates.push(join(ROOT, entry.name, ".license"));
    }
  } catch {
    // 読めないディレクトリは無視
  }
}

const currentFp = getFingerprint();

for (const p of candidates) {
  if (!existsSync(p)) continue;
  try {
    const d = JSON.parse(readFileSync(p, "utf-8"));
    if (d.fingerprint !== currentFp) {
      console.log(`\x1b[33m⊘ スキップ（別PCのライセンス）: ${p}\x1b[0m`);
      continue;
    }
    copyFileSync(p, TARGET);
    console.log(`\x1b[32m✅ .license を自動コピーしました\x1b[0m`);
    console.log(`   送り元: ${p}`);
    console.log(`   → ${TARGET}`);
    console.log(`   ライセンスID: NK-****-****-**** (${d.name})`);
    process.exit(0);
  } catch {
    // JSONパースエラーは無視して次候補へ
  }
}

console.error(`\x1b[31m✗ naoki-blueprint または兄弟プロジェクトに .license が見つかりません\x1b[0m`);
console.error("  以下のいずれかを試してください:");
console.error("    1. naoki-blueprint 本体で先にライセンス認証する");
console.error("    2. または手動入力: node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX");
process.exit(1);
