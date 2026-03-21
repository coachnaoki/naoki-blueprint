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

プロジェクトフォルダの `public/` の中に、素材ごとの専用フォルダが用意されています。Finder（Mac）やエクスプローラー（Windows）で、各フォルダにファイルをドラッグ＆ドロップするだけでOKです。

```
public/
├── video/          ← 撮影した動画（MP4）をここに入れる
├── bgm/            ← BGM（MP3）をここに入れる
├── se/             ← SE（効果音・MP3）をここに入れる
│   ├── 強調/       ← 通常の強調・箇条書き・表など
│   ├── ポジティブ/  ← 前向き・成功・インパクト系
│   └── ネガティブ/  ← 警告・失敗・ツッコミ系
├── script/         ← ナレーション台本（テキスト）をここに入れる
├── slides/         ← （自動生成されるので触らなくてOK）
└── output/         ← （完成動画が出力される場所）
```

### 必要な素材

| 素材 | 必須？ | 説明 |
|------|--------|------|
| 撮影した動画 | **必須** | あなたが撮影したMP4ファイルを `video/` に入れる |
| BGM | **必須** | フリーBGMサイト等からダウンロードしたMP3を `bgm/` に入れる |
| SE（効果音） | **必須** | フリー素材サイト等からMP3をダウンロードして `se/` の各フォルダに振り分ける |
| ナレーション台本 | 推奨 | 話した内容のテキストを `script/` に入れる（文字起こしの精度が上がります） |

> **SE の振り分け方**: どのSEをどのフォルダに入れるかは、CLAUDE.md の「SE配置ルール」に対応表があります。迷ったらAIに聞いてみてください。

---

## Step 4: 動画制作スタート！

プロジェクトフォルダ内で Claude Code を起動します。

```bash
# プロジェクトフォルダにいることを確認
cd projects/my-first-video

# Claude Code を起動（dangerousモード）
claude --dangerously-skip-permissions
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
│   ├── public/video/            ← 撮影動画を入れる
│   ├── public/bgm/              ← BGMを入れる
│   ├── public/se/               ← SE（効果音）を入れる
│   ├── public/script/           ← ナレーション台本を入れる
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

---

## ライセンス

本リポジトリは **個人利用限定** です。以下の行為を禁止します。

- 第三者への再配布（コピー・転載・アップロード含む）
- 商用利用（許可なく有料サービス・教材等に組み込むこと）

ご自身の動画制作にご活用ください。
