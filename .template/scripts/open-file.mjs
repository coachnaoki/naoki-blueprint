#!/usr/bin/env node
// Cross-platform file/URL opener (Mac/Windows/Linux)
// Usage: node scripts/open-file.mjs <path-or-url>

import { spawn } from "node:child_process";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/open-file.mjs <path-or-url>");
  process.exit(1);
}

const platform = process.platform;
const cmd = platform === "darwin" ? "open"
          : platform === "win32"  ? "start"
          :                          "xdg-open";

const args = platform === "win32" ? ["", target] : [target];
const opts = platform === "win32" ? { shell: true, detached: true, stdio: "ignore" }
                                  : { detached: true, stdio: "ignore" };

const child = spawn(cmd, args, opts);
child.on("error", (err) => {
  console.error(`Failed to open ${target}: ${err.message}`);
  process.exit(1);
});
child.unref();
