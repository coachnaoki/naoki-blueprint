# Video Pipeline — AI動画制作キット

Claude Code を使って、撮影した動画から YouTube 向け動画を自動制作するツールキットです。

15個のスラッシュコマンド（`/step01` 〜 `/step15`）を順番に実行するだけで、ジャンプカット・字幕・テロップ・スライド・SE・BGM付きの動画が完成します。

---

## Step 0: 環境セットアップ（初回のみ）

動画制作に必要なツールをインストールします。**既にインストール済みのものはスキップしてOK。**

確認コマンドを実行して、バージョン番号が表示されればインストール済みです。

| ツール | 何に使う？ | 確認コマンド | インストール方法 |
|--------|-----------|-------------|-----------------|
| **Node.js** (v18+) | 動画の組み立てに使う | `node -v` | https://nodejs.org/ からダウンロード |
| **FFmpeg** | 動画のカット・結合に使う | `ffmpeg -version` | 下記参照 |
| **Python 3.12** | 文字起こしに使う | `python3.12 --version` | 下記参照 |
| **Whisper** | AIが音声→テキストに変換 | 下記参照 | 下記参照 |
| **Claude Code** | AIが動画制作を自動化 | `claude --version` | https://claude.ai/claude-code |

### Mac（Apple Silicon: M1〜M4）の場合

ターミナルを開いて、以下を1行ずつ実行してください。

```bash
# FFmpeg（動画処理ツール）
brew install ffmpeg

# Python 3.12（文字起こしに必要）
brew install python@3.12

# Whisper（Apple Silicon 向けの高速な文字起こしAI）
/opt/homebrew/bin/python3.12 -m pip install mlx-whisper
```

> **注意**: mlx-whisper は Python 3.12 でのみ動作します（3.13以降では動きません）。

### Windows の場合

```bash
# FFmpeg
# https://www.gyan.dev/ffmpeg/builds/ からダウンロードしてPATHに追加

# Python 3.12
# https://www.python.org/downloads/release/python-3129/ からインストール

# Whisper（Windows版の文字起こしAI）
pip install openai-whisper
```

> Windows では `openai-whisper` を使用します。GPU(CUDA)がある場合は自動で高速化されます。

---

## Step 1: このリポジトリをダウンロード

ターミナルで以下を実行すると、`video-pipeline` フォルダがダウンロードされます。

```bash
git clone https://github.com/coachnaoki/video-pipeline.git
cd video-pipeline
```

---

## Step 2: プロジェクトフォルダを作成

動画1本ごとに専用のプロジェクトフォルダを作ります。テンプレートをコピーするだけでOK。

```bash
mkdir -p projects
cp -r my-video-template projects/my-first-video
cd projects/my-first-video
npm install
```

> **なぜ `projects/` に作るの？**
> テンプレートやツール類はリポジトリ直下に残るので、2本目・3本目を作るときも同じ手順でコピーするだけ。ツールを見失う心配がありません。

---

## Step 3: 素材を配置

プロジェクトフォルダの中にある `public/` フォルダに、あなたの素材ファイルを入れます。

### 必要な素材

| 素材 | 必須？ | ファイル形式 | 置き場所 |
|------|--------|-------------|---------|
| 撮影した動画 | **必須** | MP4 | `public/` フォルダ内 |
| BGM（背景音楽） | **必須** | MP3 | `public/bgm.mp3` という名前で保存 |
| SE（効果音） | **必須** | MP3 | `public/se/` フォルダ内（下記参照） |
| ナレーション台本 | 推奨 | テキスト | 後のステップで貼り付け |

### やり方（Finder / エクスプローラーでOK）

1. **動画ファイル**: 撮影したMP4ファイルを `projects/my-first-video/public/` にドラッグ＆ドロップ
2. **BGM**: フリーBGMサイト等からダウンロードしたMP3を、`public/bgm.mp3` という名前で保存
3. **SE（効果音）**: フリー素材サイト等からMP3をダウンロードして `public/se/` に配置

> **SE のフォルダ構成**: `public/se/` の中に `強調/`・`ポジティブ/`・`ネガティブ/` の3フォルダを作り、用途別にSEファイルを入れてください。CLAUDE.md の「SE配置ルール」に対応表があります。

> **ヒント**: ターミナルが苦手な方は、Finder（Mac）やエクスプローラー（Windows）でファイルをコピーしても大丈夫です。

---

## Step 4: 動画制作スタート！

プロジェクトフォルダ内で Claude Code を起動します。

```bash
# プロジェクトフォルダにいることを確認
cd projects/my-first-video

# Claude Code を起動
claude
```

起動したら、以下を入力してください：

```
/step01-context
```

あとはAIの指示に従って、`/step02` → `/step03` → … と順番に進めるだけ！

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
video-pipeline/                  ← ダウンロードしたフォルダ
├── README.md                    ← このファイル
├── my-video-template/           ← テンプレート（コピー元・編集しない）
│   ├── .claude/skills/          ← 15個のAIスキル
│   ├── CLAUDE.md                ← AIの行動ルール
│   ├── public/se/               ← SE素材（自分で用意して配置）
│   └── ...
├── gas-genspark/                ← スライドテンプレートシステム
│   ├── slides.html              ← 7種類のスライドテンプレート
│   └── screenshot.js            ← Puppeteerキャプチャスクリプト
│
└── projects/                    ← あなたの動画プロジェクトはここ
    ├── my-first-video/          ← 1本目
    ├── my-second-video/         ← 2本目
    └── ...                      ← 何本でもOK
```

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
