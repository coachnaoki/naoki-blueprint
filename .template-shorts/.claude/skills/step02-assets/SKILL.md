---
name: step02-assets
description: 動画制作に必要な素材（動画ファイル・BGM・SE・画像）がすべて揃っているか確認し、複数動画の役割と文字起こし順序を確定する。ユーザーが「素材確認」「assets」「ステップ2」「step02」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Glob, Grep, Bash(ls *), Bash(ffprobe *), Bash(mkdir *), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step02-assets` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 02: 素材チェック & 役割確定

動画制作に必要な素材を確認し、複数動画がある場合は役割（本編 / 物理挿入 / オーバーレイ）と文字起こし順序を確定する。

## やること

### 1. フォルダ構成の確認

素材は以下の構造で配置する。存在しないフォルダは `mkdir -p` で作成する。

| フォルダ | 用途 | 必須 |
|------|------|------|
| `public/videos/main/` | **本編動画**（ナレーション付き・**縦動画必須 1080×1920**） | ✅ |
| `public/videos/inserts/` | **物理挿入動画**（本編の間に挟み込む。Series分割でタイムスタンプ影響なし） | 任意 |
| `public/videos/overlays/` | **オーバーレイ動画**（本編の上に時間幅で被せる補足映像） | 任意 |
| `public/bgm/` | BGM（`bgm.mp3`） | ✅ |
| `public/se/` | 効果音（`強調/` `ポジティブ/` `ネガティブ/` 内に `.mp3`） | ✅ |
| `public/images/inserts/` | 物理挿入画像（縦動画では使用頻度低） | 任意 |
| `public/images/overlays/` | 全画面表示画像（アニメーション付き） | 任意 |
| `public/script/` | 台本テキスト | 任意 |
| `public/transcript_words.json` | 文字起こし出力（Step03で生成） | - |

### 2. SE フォルダの網羅性チェック

SEはフォルダ単位で管理し、再生時にフォルダ内からランダム選択する。
以下のSEフォルダが `public/se/` 内に存在し、中に `.mp3` ファイルが入っているか確認する：

- `se/強調/` — normal_emphasis / section / third_party / bullet_list / table / line_cta / follow_cta 用
- `se/ポジティブ/` — emphasis / emphasis2 / theme 用
- `se/ネガティブ/` — negative / negative2 / mascot 用

### 3. 動画ファイルの情報取得

各フォルダ内の `.mp4` を一覧表示し、`ffprobe` で解像度・FPS・長さを取得する。

```bash
for dir in main inserts overlays; do
  [ -d "public/videos/$dir" ] && ls public/videos/$dir/*.mp4 2>/dev/null
done
# 各ファイルに対して
ffprobe -v quiet -show_entries format=duration:stream=width,height,r_frame_rate -of default=noprint_wrappers=1 <file>
```

**重要:** すべての動画は **縦動画（1080×1920）** であることを確認する。横動画が混じっていたら警告する。

### 4. 複数動画の役割確認（必須）

`public/videos/main/` に複数の動画がある、または `inserts/` `overlays/` のどれかに動画がある場合、**必ず**ユーザーに役割を確認する。

#### 確認項目

**本編が複数ある場合（main/ に複数ファイル）**
- 文字起こしの**順序**を指定してもらう（ナレーションを連続した時系列として扱うため）
- 例: `main/part1.mp4` → `main/part2.mp4`

**物理挿入動画がある場合（inserts/）**
- どのクリップを、本編のどのあたり（秒数 or 話題）に挟むか
- 挿入位置の確定は Step11-videos（Series分割）で行う — このステップでは**役割だけ確認**

**オーバーレイ動画がある場合（overlays/）**
- どのクリップを、どの時間幅で、本編の上に被せるか
- ナレーションは裏で継続する想定
- 詳細設定は Step11-videos で行う

### 5. video-context.md への記録

`video-context.md` の制作設定に動画ファイルの役割 + **本編動画から検出した FPS** を記録する：

```markdown
## 制作設定
- 解像度: 1080×1920（縦動画 9:16）
- FPS: 30  ← ffprobe の本編動画 `r_frame_rate` から算出した値（例: 30000/1001 → 29.97 を四捨五入で 30）

## 動画ファイル
- 本編: main/part1.mp4, main/part2.mp4（文字起こし順: part1 → part2）
- 物理挿入: inserts/demo.mp4（〜30秒あたりに挟む予定）
- オーバーレイ: overlays/clip1.mp4（1分30秒〜1分45秒に被せる予定）
```

**FPS 自動設定の手順**:
1. `public/videos/main/` の最初の本編動画を ffprobe で解析
2. `r_frame_rate` を数値に変換（例: `30000/1001` → 29.97 → 四捨五入で 30 / `60/1` → 60）
3. `video-context.md` の `## 制作設定` セクションの `FPS:` 行を実測値で書き換える
4. 整数に丸めた値を採用（25 / 30 / 60 のいずれかになることが多い）

### 6. 不足素材の報告

必須素材（`main/*.mp4` / `bgm/bgm.mp3` / `se/強調・ポジティブ・ネガティブ/*.mp3`）が不足していればリストアップしてユーザーに対応を確認する。

## 完了条件
- 必須素材がすべて存在する
- 各動画の役割と文字起こし順序が確定している
- 動画の解像度・FPS・長さを把握している
- `video-context.md` に動画ファイルの役割が記録されている

## 完了後

```
✅ Step 02 完了: 素材チェック & 役割確定が完了しました。

【素材】
- 本編: main/xxx.mp4（1080x1920, 30fps, ○○秒）
- 物理挿入: inserts/xxx.mp4（あれば）
- オーバーレイ: overlays/xxx.mp4（あれば）
- BGM: ✅ / SE: ✅（○○個）
- 不足: （あれば記載）

次のステップ → /step03-transcript（文字起こし）
進めますか？
```
