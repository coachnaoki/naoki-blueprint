# Naoki式 丸投げビジネス動画編集テンプレート

Claude Code を使って、撮影した動画から YouTube 向け動画を自動制作するツールキットです。

20個のスラッシュコマンド（`/step01` 〜 `/step20`）を順番に実行するだけで、ジャンプカット・字幕・テロップ・スライド・SE・BGM付きの動画が完成します。

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

### Mac（Apple Silicon）の場合

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

## Step 3: ライセンス認証

権利者から発行されたライセンスIDを入力します。

```bash
node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX
```

認証成功すると `.license` ファイルが生成されます。

> PCを変更する場合は権利者にご連絡ください。

---

## Step 4: 素材を配置

プロジェクトフォルダの `public/` の中に、素材ごとの専用フォルダが用意されています。Finder（Mac）やエクスプローラー（Windows）で、各フォルダにファイルをドラッグ＆ドロップするだけでOKです。

```
public/
├── video/          ← 撮影した動画（MP4）をここに入れる
├── bgm/            ← BGM（MP3）をここに入れる
├── se/             ← SE（効果音）※最初から入っています
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
| SE（効果音） | 不要 | 最初から入っています。差し替えもOK |
| ナレーション台本 | 推奨 | 話した内容のテキストを `script/` に入れる（文字起こしの精度が上がります） |

> **ヒント**: SEは最初からプリセットが入っているので、そのまま使えます。自分のSEに差し替えたい場合は、同じフォルダ構成でMP3を入れ替えてください。

---

## Step 5: 動画制作スタート！

プロジェクトフォルダ内で Claude Code を起動します。

```bash
# Claude Code を起動（dangerousモード）
# ※ Step 2 で cd した projects/my-first-video にいる状態で実行
claude --dangerously-skip-permissions
```

起動したら、以下を入力してください：

```
/step01-context
```

あとはAIの指示に従って、`/step02` → `/step03` → … と順番に進めるだけ！

---

## ワークフロー全体像（全20ステップ）

```
【素材準備フェーズ】
/step01-context         動画の目的・ターゲットを整理
/step02-assets          素材の確認
/step03-jumpcut         無音部分を自動カット（0.3秒以上）
/step04-transcript      Whisperで文字起こし
/step05-transcript-fix  台本と照合して誤変換を修正
    ↓
【動画構築フェーズ】
/step06-template        テンプレート設定
/step07-telop           テロップデータ作成
/step08-composition     メインコンポジション構築
/step09-register        Remotionに登録
/step10-preview         プレビュー確認
    ↓
【素材挿入フェーズ】
/step11-greenback       グリーンバック背景置換（任意）
/step12-bgm             BGM挿入
/step13-images          画像・見出し挿入
/step14-videos          動画クリップ挿入
    ↓
【スライドフェーズ】（スライド不要ならスキップ可）
/step15-slides-gen      台本からスライドHTML生成
/step16-slides-capture  スライドをPNG画像化
/step17-slide-blocks    ブロック分割（段階表示用）
/step18-slide-timeline  スライドタイムライン作成
    ↓
【最終確認・出力フェーズ】
/step19-preview         最終プレビュー確認
/step20-render          MP4書き出し → 完成！
```

---

## フォルダ構成

```
video-pipeline/                  ← ダウンロードしたフォルダ
├── README.md                    ← このファイル
├── my-video-template/           ← テンプレート（コピー元・編集しない）
│   ├── .claude/skills/          ← 20個のAIスキル + catchup + remotion-best-practices
│   ├── CLAUDE.md                ← AIの行動ルール
│   ├── scripts/validateLicense.mjs  ← ライセンス認証スクリプト
│   ├── public/video/            ← 撮影動画を入れる
│   ├── public/bgm/              ← BGMを入れる
│   ├── public/se/               ← SE素材（プリセット入り）
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
はい。step15〜18をスキップすれば、ライブ映像メインの動画として制作できます。

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

### Q: ライセンスが認証できない
- ライセンスIDが正しいか確認してください（NK-XXXX-XXXX-XXXX形式）
- 有効期限が切れていないか権利者に確認してください
- 別のPCで認証済みの場合は、権利者にPC紐付け解除を依頼してください

### Q: Windows でも使える？
はい。Step 0 で `openai-whisper` をインストールすれば動作します。GPU(CUDA)対応PCならさらに高速です。

---

## ライセンス

本テンプレートのスキルファイルに関する著作権その他一切の知的財産権は、権利者（小林 尚貴）に帰属します。

詳細は[スキルファイル利用規約](https://coachnaoki.github.io/video-pipeline/gas-genspark/terms-sign.html)をご確認ください。
