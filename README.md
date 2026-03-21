# Video Pipeline — AI動画制作キット

Claude Code を使って、撮影した動画から YouTube 向け動画を自動制作するツールキットです。

15個のスラッシュコマンド（`/step01` 〜 `/step15`）を順番に実行するだけで、ジャンプカット・字幕・テロップ・スライド・SE・BGM付きの動画が完成します。

---

## Step 0: 環境セットアップ（初回のみ・既にあればスキップ）

以下のツールが必要です。**既にインストール済みのものはスキップしてOK。**

### 全OS共通

| ツール | 確認コマンド | インストール |
|--------|-------------|-------------|
| **Node.js** (v18+) | `node -v` | https://nodejs.org/ |
| **FFmpeg** | `ffmpeg -version` | 下記参照 |
| **Python 3.12** | `python3.12 --version` | 下記参照 |
| **Whisper** | 下記参照 | 下記参照 |
| **Claude Code** | `claude --version` | https://claude.ai/claude-code |

### Mac（Apple Silicon）の場合

```bash
# FFmpeg
brew install ffmpeg

# Python 3.12
brew install python@3.12

# Whisper（Apple Silicon 向け高速版）
/opt/homebrew/bin/python3.12 -m pip install mlx-whisper
```

> **注意**: mlx-whisper は Python 3.12 でのみ動作します（3.14では動きません）。

### Windows の場合

```bash
# FFmpeg
# https://www.gyan.dev/ffmpeg/builds/ からダウンロードしてPATHに追加

# Python 3.12
# https://www.python.org/downloads/release/python-3129/ からインストール

# Whisper（Windows版）
pip install openai-whisper
```

> Windows では `openai-whisper` を使用します。GPU(CUDA)がある場合は自動で高速化されます。

---

## Step 1: このリポジトリを取得

```bash
git clone https://github.com/coachnaoki/video-pipeline.git
cd video-pipeline
```

---

## Step 2: プロジェクトを作成

**プロジェクトは `projects/` フォルダに作ります。** テンプレートやツールはリポジトリ直下に残るので、2本目以降も迷いません。

```bash
# projects フォルダにテンプレートをコピー
mkdir -p projects
cp -r my-video-template projects/my-first-video
cd projects/my-first-video

# 依存パッケージをインストール
npm install
```

---

## Step 3: 素材を配置

```bash
# 撮影した動画を置く
cp /path/to/あなたの動画.mp4 public/

# BGMを置く（MP3形式）
cp /path/to/bgm.mp3 public/bgm.mp3
```

> SE（効果音）は最初から入っています。BGMはフリー素材サイト等から好きなものをダウンロードしてください。

---

## Step 4: 動画制作スタート！

プロジェクトフォルダ内で Claude Code を起動して：

```
/step01-context
```

と入力。あとはAIの指示に従って順番に進めるだけ！

---

## ワークフロー全体像

```
/step01-context         動画の目的・ターゲットを整理
/step02-assets          素材の確認
/step03-jumpcut         無音部分を自動カット（0.3秒以上）
/step04-transcript      Whisperで文字起こし
/step05-transcript-fix  台本と照合して誤変換を修正
    ↓
/step06-slides-gen      台本からスライドHTML生成 ※スライド不要ならスキップ
/step07-slides-capture  スライドをPNG画像化
/step08-slide-blocks    ブロック分割（段階表示用）
    ↓
/step09-template        テンプレート設定
/step10-telop           テロップデータ作成
/step11-timeline        スライドタイムライン作成
    ↓
/step12-composition     メインコンポジション構築
/step13-register        Remotionに登録
/step14-preview         プレビュー確認
/step15-render          MP4書き出し → 完成！
```

---

## フォルダ構成

```
video-pipeline/                  ← リポジトリ直下（ツール類はここ）
├── README.md                    ← このファイル
├── my-video-template/           ← テンプレート（コピー元）
│   ├── .claude/skills/          ← 15個のAIスキル
│   ├── CLAUDE.md                ← AIの行動ルール
│   ├── public/se/               ← SE素材（プリセット入り）
│   └── ...
├── gas-genspark/                ← スライドテンプレートシステム
│   ├── slides.html              ← 7種類のスライドテンプレート
│   └── screenshot.js            ← Puppeteerキャプチャスクリプト
│
└── projects/                    ← プロジェクトはここに作る
    ├── my-first-video/          ← 1本目
    ├── my-second-video/         ← 2本目
    └── ...                      ← 何本でもOK
```

**ポイント**: ツール（テンプレート・gas-genspark・SE素材）はリポジトリ直下に固定。プロジェクトだけ `projects/` に増やしていく構成なので、Whisper や FFmpeg のパスを見失うことがありません。

---

## 用意するもの

| 素材 | 必須？ | 説明 |
|------|--------|------|
| 撮影動画（MP4） | 必須 | あなたが撮影した動画ファイル |
| BGM（MP3） | 必須 | フリーBGM素材（`public/bgm.mp3` に配置） |
| ナレーション台本 | 推奨 | 文字起こしの誤変換修正に使用 |
| SE（効果音） | 不要 | プリセット入り。差し替えもOK |

---

## よくある質問

### Q: Claude Code って何？どうやって使うの？
Anthropic が提供するAIコーディングツールです。ターミナルから `claude` コマンドで起動します。
詳しくは → https://claude.ai/claude-code

### Q: 2本目の動画を作りたい
テンプレートをもう一度コピーするだけ：
```bash
cd video-pipeline
cp -r my-video-template projects/my-second-video
cd projects/my-second-video
npm install
```

### Q: スライドなしの動画も作れる？
はい。step06〜08をスキップすれば、ライブ映像メインの動画として制作できます。

### Q: プレビューの見方は？
```bash
npm run dev
```
でブラウザが開きます（http://localhost:3000）。

### Q: Whisper がエラーになる

**Mac（Apple Silicon）の場合：**
```bash
/opt/homebrew/bin/python3.12 --version   # Python 3.12.x が出ればOK
/opt/homebrew/bin/python3.12 -c "import mlx_whisper; print('OK')"
```

**Windowsの場合：**
```bash
python3.12 --version
python3.12 -c "import whisper; print('OK')"
```

### Q: Windows でも使える？
はい。Step 0 で `openai-whisper` をインストールすれば動作します。GPU(CUDA)対応PCならさらに高速です。
