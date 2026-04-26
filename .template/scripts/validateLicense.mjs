#!/usr/bin/env node
/* ver2.0: validateLicense は廃止されました。/link-google に統合されています。
 * 互換性のため、引数があれば linkGoogle.mjs に自動転送します。
 */
import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const linkGooglePath = path.join(__dirname, "linkGoogle.mjs");
const args = process.argv.slice(2);

process.stdout.write("\x1b[33m⚠ ver2.0 では validateLicense.mjs は廃止されました\x1b[0m\n");
process.stdout.write("\x1b[36m  Google 連携が必要です。Claude Code で「/link-google」と入力してください\x1b[0m\n\n");

if (args.length > 0) {
  process.stdout.write("\x1b[2m引数を検出しました。互換性のため linkGoogle.mjs に転送します...\x1b[0m\n\n");
  const child = spawn("node", [linkGooglePath, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  process.stdout.write("使い方: Claude Code に「/link-google」と入力\n");
  process.stdout.write("または: node scripts/linkGoogle.mjs NK-XXXX-XXXX-XXXX\n");
  process.exit(0);
}
