// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// License guard - do not remove
const __vg_dir = dirname(fileURLToPath(import.meta.url));
try {
  execSync(`node "${join(__vg_dir, "scripts", "_chk.mjs")}"`, {
    stdio: "ignore",
    cwd: __vg_dir,
    timeout: 30000,
  });
} catch {
  console.error("\x1b[31m✗ ライセンス認証に失敗しました。node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX を実行してください。\x1b[0m");
  process.exit(1);
}

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
