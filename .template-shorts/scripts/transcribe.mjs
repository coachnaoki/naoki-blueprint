#!/usr/bin/env node
// Cross-platform Whisper transcription wrapper
// - macOS (Apple Silicon): mlx-whisper (large-v3)
// - Windows/Linux: faster-whisper (large-v3)
// Output: public/transcript_words.json + public/transcript_words.original.json
//
// Usage: node scripts/transcribe.mjs <video-path> [--no-backup]

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";

const videoPath = process.argv[2];
const noBackup = process.argv.includes("--no-backup");
if (!videoPath) {
  console.error("Usage: node scripts/transcribe.mjs <video-path> [--no-backup]");
  process.exit(1);
}
if (!existsSync(videoPath)) {
  console.error(`Video not found: ${videoPath}`);
  process.exit(1);
}

const isMac = platform() === "darwin";

const pyScript = isMac ? `
import json, mlx_whisper, sys
result = mlx_whisper.transcribe(sys.argv[1], word_timestamps=True,
  path_or_hf_repo='mlx-community/whisper-large-v3-mlx')
words = [{'word': w['word'].strip(), 'start': round(w['start'],3), 'end': round(w['end'],3)}
         for seg in result['segments'] for w in seg.get('words',[])]
data = {'language': result.get('language','ja'), 'words': words}
with open('public/transcript_words.json','w',encoding='utf-8') as f:
  json.dump(data, f, ensure_ascii=False, indent=2)
${noBackup ? "" : `with open('public/transcript_words.original.json','w',encoding='utf-8') as f:
  json.dump(data, f, ensure_ascii=False, indent=2)`}
print(f'{len(words)}語')
` : `
import json, sys
from faster_whisper import WhisperModel
model = WhisperModel('large-v3', device='auto', compute_type='auto')
segments, info = model.transcribe(sys.argv[1], word_timestamps=True, language='ja')
words = []
for seg in segments:
  for w in (seg.words or []):
    words.append({'word': w.word.strip(), 'start': round(w.start,3), 'end': round(w.end,3)})
data = {'language': info.language, 'words': words}
with open('public/transcript_words.json','w',encoding='utf-8') as f:
  json.dump(data, f, ensure_ascii=False, indent=2)
${noBackup ? "" : `with open('public/transcript_words.original.json','w',encoding='utf-8') as f:
  json.dump(data, f, ensure_ascii=False, indent=2)`}
print(f'{len(words)}語')
`;

// Find usable Python 3.12 (Mac: /opt/homebrew/bin/python3.12 preferred, else PATH)
const macPythonPath = "/opt/homebrew/bin/python3.12";
const python = (isMac && existsSync(macPythonPath)) ? macPythonPath
            : (platform() === "win32" ? "py" : "python3.12");
const extraArgs = (python === "py") ? ["-3.12"] : [];

const child = spawn(python, [...extraArgs, "-c", pyScript, videoPath], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error(`Failed to run Python: ${err.message}`);
  console.error(`\nMake sure Python 3.12 is installed:`);
  if (isMac) console.error(`  brew install python@3.12 && pip3.12 install mlx-whisper`);
  else if (platform() === "win32") console.error(`  Install Python 3.12 from python.org, then: pip install faster-whisper`);
  else console.error(`  Install Python 3.12, then: pip install faster-whisper`);
  process.exit(1);
});
