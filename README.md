# Video Pipeline — AI動画制作キット

Claude Code を使って、撮影した動画から YouTube 向け動画を自動制作するツールキットです。

15個のスラッシュコマンド（`/step01` 〜 `/step15`）を順番に実行するだけで、ジャンプカット・字幕・テロップ・スライド・SE・BGM付きの動画が完成します。

---

## クイックスタート（5分で準備完了）

### Step 1: 事前にインストールしておくもの

```bash
# Node.js（v18以上）
# https://nodejs.org/ からインストール

# FFmpeg（動画処理）
brew install ffmpeg

# Python 3.12 + Whisper（文字起こし）
brew install python@3.12
/opt/homebrew/bin/python3.12 -m pip install mlx-whisper
```

> mlx-whisper は Apple Silicon (M1/M2/M3/M4) Mac 専用です。Python は必ず 3.12 を使ってください（3.14では動きません）。

### Step 2: このリポジトリを取得

```bash
git clone https://github.com/yourname/video-pipeline.git
cd video-pipeline
```

### Step 3: 自分のプロジェクトを作る

```bash
# テンプレートをコピーして自分のプロジェクトにする
cp -r my-video-template my-first-video
cd my-first-video

# 依存パッケージをインストール
npm install
```

### Step 4: 素材を配置

```bash
# 撮影した動画を置く
cp /path/to/あなたの動画.mp4 public/

# BGMを置く（MP3形式）
cp /path/to/bgm.mp3 public/bgm.mp3
```

> SE（効果音）は最初から入っています。BGMはフリー素材サイト等から好きなものをダウンロードしてください。

### Step 5: 動画制作スタート！

Claude Code を起動して：

```
/step01-context
```

と入力。あとはAIの指示に従って進めるだけ！

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
video-pipeline/
├── README.md                ← このファイル
├── my-video-template/       ← テンプレート（コピーして使う）
│   ├── .claude/skills/      ← 15個のAIスキル
│   ├── CLAUDE.md            ← AIの行動ルール
│   ├── public/se/           ← SE素材（プリセット入り）
│   └── ...
└── gas-genspark/            ← スライドテンプレートシステム
    ├── slides.html          ← 7種類のスライドテンプレート
    └── screenshot.js        ← Puppeteerキャプチャスクリプト
```

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
cp -r my-video-template my-second-video
cd my-second-video
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
Python のバージョンを確認：
```bash
/opt/homebrew/bin/python3.12 --version   # Python 3.12.x が出ればOK
/opt/homebrew/bin/python3.12 -c "import mlx_whisper; print('OK')"
```

### Q: Windows でも使える？
mlx-whisper は Apple Silicon Mac 専用です。Windows の場合は別の Whisper 実装（openai-whisper等）への差し替えが必要です。
