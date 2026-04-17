# Naoki式 丸投げビジネス動画編集テンプレート

Claude Code のスキルシステムで、撮影済み動画から YouTube 向けの動画を自動制作するテンプレートです。

## できること

1. 動画の無音部分をジャンプカット
2. Whisper で自動文字起こし → 台本と照合して誤変換修正
3. テロップ・字幕・SE・BGM を自動配置
4. HTML スライドを自動生成 → 画像キャプチャ（任意）
5. Remotion で最終 MP4 をレンダリング

全 20 ステップを `/step01-context` 〜 `/step20-highlight-final` のスラッシュコマンドで順番に進めるだけで動画が完成します。

---

## 必要な環境

**共通**:
- Node.js 20以上（npm同梱）
- Python 3.12（**3.14では動きません**）
- FFmpeg（ffmpeg / ffprobe コマンド）

**macOS (Apple Silicon推奨)**:
```bash
brew install node python@3.12 ffmpeg
pip3.12 install mlx-whisper
npm install
```

**Windows**:
```powershell
# Node.js: https://nodejs.org/
# Python 3.12: https://www.python.org/downloads/ (インストール時「Add to PATH」にチェック)
# FFmpeg: https://www.gyan.dev/ffmpeg/builds/ からダウンロードしてPATHに追加
pip install faster-whisper
npm install
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt install nodejs npm python3.12 python3-pip ffmpeg
pip install faster-whisper
npm install
```

> **Whisperモデル**: macOSは `mlx-whisper` (Apple Silicon最適化で高速)、Windows/Linuxは `faster-whisper` を使用。精度は同等（どちらもlarge-v3モデル）。`scripts/transcribe.mjs` が自動で切り替えます。

---

## ライセンス認証

本テンプレートはライセンス認証が必要です。

1. 権利者から発行された **ライセンスID**（NK-XXXX-XXXX-XXXX形式）を用意する
2. 初回起動時に以下を実行：
   ```bash
   node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX
   ```
3. 認証成功すると `.license` ファイルが生成され、以後は自動で認証されます

> ライセンスIDは1台のPCに紐付けられます。PCを変更する場合は権利者にご連絡ください。

---

## 必要なもの

### ソフトウェア

| ツール | 用途 | インストール |
|--------|------|-------------|
| **Node.js** (v18+) | Remotion / Puppeteer | https://nodejs.org/ |
| **FFmpeg** | ジャンプカット・動画処理 | `brew install ffmpeg` |
| **Python 3.12** | Whisper 文字起こし | `brew install python@3.12` |
| **mlx-whisper** | Apple Silicon 向け高速 Whisper | `/opt/homebrew/bin/python3.12 -m pip install mlx-whisper` |
| **Claude Code** | スキル実行 | https://claude.ai/claude-code |

> **注意**: mlx-whisper は Python 3.12 でのみ動作します（3.14 では依存パッケージの解決に失敗します）。

### 素材（自分で用意するもの）

| 素材 | 形式 | 配置場所 |
|------|------|----------|
| 撮影した動画 | MP4 | `public/main/` |
| BGM | MP3 | `public/bgm/bgm.mp3` |
| ナレーション台本 | テキスト | `public/script/` または `/step01-context` で `video-context.md` に記入 |

SE（効果音）は `public/se/` の各フォルダにMP3を入れてください。

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/coachnaoki/naoki-blueprint.git
cd naoki-blueprint/.template
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. ライセンス認証

```bash
node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX
```

### 4. 素材を配置

```bash
# 撮影した動画を public/main/ に配置
cp /path/to/your-video.mp4 public/main/

# BGM を配置
cp /path/to/bgm.mp3 public/bgm/bgm.mp3

# 台本があれば public/script/ に配置
cp /path/to/script.txt public/script/
```

### 5. SE（効果音）を配置

`public/se/` フォルダに以下の構造で SE ファイルを配置してください：

```
public/se/
├── 強調/           ← 強調テロップ用（3〜5ファイル推奨）
│   ├── 強調テロップ.mp3
│   ├── 強調テロップ2.mp3
│   └── ...
├── ポジティブ/     ← ポジティブ強調用
│   ├── きらーん.mp3
│   └── ...
├── ネガティブ/     ← ネガティブ・警告用
│   ├── チーン1.mp3
│   └── ...
├── 本日のテーマ.mp3
├── 代弁.mp3
├── 第三者発言.mp3
├── LINE誘導.mp3
├── チャンネル登録.mp3
└── エンドカード.mp3
```

### 6. 動画制作を開始！

Claude Code を起動して、最初のコマンドを実行：

```
/step01-context
```

あとはスキルの指示に従って順番に進めるだけです。

> **Gemini APIキー（画像生成用）について**
> `/step16-images` を実行するタイミングで、Claude Code が自動でキーの設定を案内します。事前準備は不要です。キーの取得先: https://aistudio.google.com/apikey

---

## ワークフロー（全 20 ステップ）

```
【素材準備フェーズ】
/step01-context         → 動画の目的・ターゲットを整理
/step02-assets          → 素材の確認（動画・BGM・SE）
/step03-jumpcut         → 無音部分を自動カット
/step04-transcript      → Whisper で文字起こし
/step05-transcript-fix  → 台本と照合して誤変換を修正

【動画構築フェーズ】
/step06-template        → テンプレート設定
/step07-telop           → テロップデータ作成
/step08-composition     → メインコンポジション構築
/step09-register        → Remotion に登録
/step10-preview         → プレビュー確認

【素材挿入フェーズ】
/step11-greenback       → グリーンバック背景置換（任意）
/step12-bgm             → BGM 挿入
/step13-images          → 画像・見出し挿入
/step14-videos          → デモ動画の重ね表示

【スライドフェーズ】（スライドなしならスキップ可）
/step15-slides-gen      → 台本からスライド HTML 生成
/step16-slides-capture  → スライドを PNG 画像化
/step17-slide-blocks    → ブロック分割（段階表示用）
/step18-slide-timeline  → スライドタイムライン作成

【最終確認・出力フェーズ】
/step19-opening         → OP連結＋本編レンダリング（1回目）
/step20-highlight-final → 本編からハイライト自動抽出＋最終レンダリング
```

---

## フォルダ構成

```
.template/
├── .claude/skills/     ← Claude Code スキル（20ステップ + catchup + remotion-best-practices）
├── CLAUDE.md           ← AI の行動ルール（編集不要）
├── video-context.md    ← 動画の設定（step01 で作成）
├── public/
│   ├── video/          ← 撮影動画（MP4）
│   ├── bgm/            ← BGM（MP3）
│   ├── script/         ← 台本・ナレーション原稿
│   ├── se/             ← 効果音フォルダ
│   ├── slides/         ← スライド画像（自動生成）
│   ├── transcript_words.json  ← 文字起こし（自動生成）
│   └── output/         ← 完成動画の出力先
├── src/
│   ├── Root.tsx         ← Remotion ルート
│   ├── MainComposition.tsx  ← メインコンポジション（自動生成）
│   ├── templateConfig.ts    ← テンプレート設定（自動生成）
│   ├── telopData.ts         ← テロップデータ（自動生成）
│   └── slideTimeline.ts     ← タイムライン（自動生成）
├── scripts/
│   ├── validateLicense.mjs        ← ライセンス認証
│   ├── captureSlides.mjs          ← スライドキャプチャ
│   └── captureSlideBlocks.mjs     ← ブロック分割キャプチャ
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

---

## よくある質問

### Q: スライドなしの動画も作れる？
はい。step15〜18 をスキップして、ライブ映像がメインの動画として制作できます。

### Q: Whisper がエラーになる
Python のバージョンを確認してください。`python3.12` が必要です：
```bash
/opt/homebrew/bin/python3.12 -c "import mlx_whisper; print('OK')"
```

### Q: プレビューはどうやって見る？
`npm run dev` で Remotion Studio が起動します。ブラウザで `http://localhost:3000` を開いてください。

### Q: ライセンスが認証できない
- ライセンスIDが正しいか確認してください（NK-XXXX-XXXX-XXXX形式）
- 有効期限が切れていないか権利者に確認してください
- 別のPCで認証済みの場合は、権利者にPC紐付け解除を依頼してください

### Q: 自己紹介カード（ProfileCard）の内容はどこで設定する？
`video-context.md` にプロフィール情報を記載してください。step08 でコンポジション構築時に自動で読み取ります。
