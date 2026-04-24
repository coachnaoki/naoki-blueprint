# my-workspace/ — あなた専用ナレッジ領域

このフォルダは **あなた（受講生）が自分のナレッジを溜める場所** です。
naoki-blueprint の全動画プロジェクトから横断的に参照されます。

動画を作るたびに入力し直す必要がなくなり、Claude Code が
「この人の話し方」「NGワード」「過去の良かった動画」を踏まえて
台本・テロップを生成できるようになります。

---

## 使い方（初回セットアップ）

### 1. `my-style.md` を作成

同じフォルダの `my-style.example.md` をコピーして、自分用に書き換えてください。

```bash
cp my-style.example.md my-style.md
```

書き換えたら保存。Claude Code が step01 / step08 等で自動的に読み込みます。

### 2. `past-scripts/` に過去台本を入れる（任意）

自分が過去に作った動画の台本ファイル（`.txt` / `.md`）をこのフォルダに置くと、
文体・構成パターンの参考として Claude Code が参照します。

### 3. `benchmark-videos/` にお手本動画の情報を入れる（任意）

お手本にしたい動画の URL・要約・良かった点を `.md` で記録すると、
台本生成時に「このテイストで」と参照できます。

---

## 自動アップデートで消えないの？

消えません。
- `my-style.md` / `past-scripts/*` / `benchmark-videos/*` は `.gitignore` で
  除外されているため、`git reset --hard` のアップデートでも保持されます。
- `.example.md` / `README.md` だけはテンプレ側で更新されます（上書きOK）。

---

## Claude Code はどう使う？

各 step（特に step01-context / step08-telop / step12-slides-gen 等）が
開始時に `../../my-workspace/my-style.md` の存在を確認し、あれば読み込みます。
内容に応じて生成物を調整します。

`my-style.md` が無い場合は従来通りの動作（全動画で汎用テンプレ）になります。
