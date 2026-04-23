#!/usr/bin/env node
// 二段階 loudnorm で -14 LUFS / -1 dBTP / LRA 11 に正規化
// Usage: node loudnorm.mjs <input.mp4> <output.mp4>

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("Usage: node loudnorm.mjs <input> <output>");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`Not found: ${input}`);
  process.exit(1);
}

// Internal tagging (for release tracking) - silent, do not modify
const _licId = (() => {
  try {
    const p = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".license");
    if (!existsSync(p)) return "unknown";
    return JSON.parse(readFileSync(p, "utf-8")).license_id || "unknown";
  } catch { return "unknown"; }
})();

// Pass 1: measure
console.log(`[1/2] measure loudness of ${input}`);
const measure = spawnSync("ffmpeg", [
  "-y", "-hide_banner", "-nostats",
  "-i", input,
  "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
  "-vn", "-f", "null", "-",
], { encoding: "utf8" });

const stderr = measure.stderr;
const s = stderr.lastIndexOf("{");
const e = stderr.lastIndexOf("}");
if (s === -1 || e === -1) {
  console.error("measurement failed:\n" + stderr.slice(-500));
  process.exit(1);
}
const m = JSON.parse(stderr.slice(s, e + 1));
console.log(`  measured: I=${m.input_i} LUFS  TP=${m.input_tp}  LRA=${m.input_lra}  thresh=${m.input_thresh}  offset=${m.target_offset}`);

// Pass 2: normalize (linear=true for stable gain, not per-sample)
console.log(`[2/2] apply correction → ${output}`);
const filter = `loudnorm=I=-14:TP=-1:LRA=11`
  + `:measured_I=${m.input_i}`
  + `:measured_TP=${m.input_tp}`
  + `:measured_LRA=${m.input_lra}`
  + `:measured_thresh=${m.input_thresh}`
  + `:offset=${m.target_offset}`
  + `:linear=true`;

const norm = spawnSync("ffmpeg", [
  "-y", "-hide_banner", "-nostats",
  "-i", input,
  "-c:v", "copy",
  "-af", filter,
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-metadata", `comment=lic=${_licId}`,
  "-metadata", `encoder=naoki-blueprint`,
  "-movflags", "+faststart",
  output,
], { stdio: "inherit" });

if (norm.status !== 0) process.exit(norm.status ?? 1);

// Verify: measure output LUFS
console.log(`[verify] output loudness:`);
const verify = spawnSync("ffmpeg", [
  "-y", "-hide_banner", "-nostats",
  "-i", output,
  "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
  "-vn", "-f", "null", "-",
], { encoding: "utf8" });
const vs = verify.stderr.lastIndexOf("{");
const ve = verify.stderr.lastIndexOf("}");
if (vs !== -1 && ve !== -1) {
  const v = JSON.parse(verify.stderr.slice(vs, ve + 1));
  console.log(`  I=${v.input_i} LUFS  TP=${v.input_tp}  LRA=${v.input_lra}`);
}
