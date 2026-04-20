# Naoki式 丸投げビジネス動画編集テンプレート

Claude Code を使って、撮影した動画から YouTube 向け動画を自動制作するツールキットです。

スラッシュコマンドを順番に実行するだけで、ジャンプカット・字幕・テロップ・スライド・SE・BGM付きの動画が完成します（横動画: 全20ステップ / ショート動画: 全14ステップ）。

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
pip3.12 install mlx-whisper

# OpenCV（ワイプの顔位置自動検出に使う）
pip3.12 install opencv-python
```

> **注意**: mlx-whisper は Python 3.12 でのみ動作します（3.13以降では動きません）。

### Windows の場合

```powershell
# FFmpeg
# https://www.gyan.dev/ffmpeg/builds/ からダウンロードしてPATHに追加

# Python 3.12
# https://www.python.org/downloads/release/python-3129/ からインストール
# （インストーラーで「Add Python to PATH」にチェック）

# Whisper（Windows/Linux 向けの高速な文字起こしAI）
pip install faster-whisper

# OpenCV（ワイプの顔位置自動検出に使う）
pip install opencv-python
```

> **Whisperモデル**: macOSは `mlx-whisper` (Apple Silicon最適化)、Windowsは `faster-whisper` を使用。精度は同等（どちらもlarge-v3）で、`scripts/transcribe.mjs` が自動で切り替えます。

### Linux (Ubuntu/Debian) の場合

```bash
sudo apt install nodejs npm python3.12 python3-pip ffmpeg
pip install faster-whisper opencv-python
```

---

## Step 1: このリポジトリをダウンロード

ターミナルで以下を実行すると、`naoki-blueprint` フォルダがダウンロードされます。

```bash
git clone https://github.com/coachnaoki/naoki-blueprint.git
cd naoki-blueprint
```

---

## Step 2: ライセンス認証（初回のみ）

権利者から発行されたライセンスIDを入力します。

```bash
cd .template
node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX
cd ..
```

認証成功すると `.license` ファイルが生成されます。2本目以降はこのステップは不要です（テンプレートをコピーすると `.license` も一緒にコピーされます）。

> PCを変更する場合は権利者にご連絡ください。

---

## Step 3: プロジェクトフォルダを作成

動画1本ごとに専用のプロジェクトフォルダを作ります。テンプレートをコピーするだけでOK。

**作る動画の種類によってテンプレートが2つあります。**

| 動画の種類 | テンプレート | 解像度 | ステップ数 |
|---|---|---|---|
| YouTube横動画 | `.template/` | 1920×1080 | 20ステップ |
| ショート動画 | `.template-shorts/` | 1080×1920 | 14ステップ |

**プロジェクト名は自由に決めてください。** 動画の内容がわかる名前がおすすめです。

### YouTube横動画を作る場合

**Mac/Linux**:
```bash
mkdir -p projects
cp -r .template projects/あなたのプロジェクト名
cd projects/あなたのプロジェクト名
npm install
```

**Windows (PowerShell)**:
```powershell
New-Item -ItemType Directory -Force projects
Copy-Item -Recurse .template projects/あなたのプロジェクト名
cd projects/あなたのプロジェクト名
npm install
```

### ショート動画を作る場合

**Mac/Linux**:
```bash
cp -r .template-shorts projects/あなたのプロジェクト名
cd projects/あなたのプロジェクト名
npm install
```

**Windows (PowerShell)**:
```powershell
Copy-Item -Recurse .template-shorts projects/あなたのプロジェクト名
cd projects/あなたのプロジェクト名
npm install
```

> **なぜ `projects/` に作るの？**
> テンプレートやツール類はリポジトリ直下に残るので、2本目・3本目を作るときも同じ手順でコピーするだけ。ツールを見失う心配がありません。

---

## Step 4: 素材を配置

プロジェクトフォルダの `public/` の中に、素材ごとの専用フォルダが用意されています。Finder（Mac）やエクスプローラー（Windows）で、各フォルダにファイルをドラッグ＆ドロップするだけでOKです。

```
public/
├── videos/                ← 動画素材
│   ├── main/              ← 本編動画（MP4） ★必須
│   ├── inserts/           ← 物理挿入動画（ナレーションを止めて挟み込む・任意）
│   ├── overlays/          ← オーバーレイ動画（ナレーション中に上に被せる・任意）
│   ├── opening/           ← OP動画（冒頭連結用・横動画のみ・任意）
│   └── highlight/         ← ハイライト動画（自動生成・横動画のみ）
├── images/                ← 画像素材
│   ├── inserts/           ← 横に表示する画像（720×405・固定位置・任意）
│   └── overlays/          ← 全画面表示画像（アニメーション付き・任意）
├── bgm/                   ← BGM（MP3） ★必須
├── se/                    ← SE（効果音） ★必須
│   ├── 強調/              ← 通常の強調・箇条書き・表など
│   ├── ポジティブ/         ← 前向き・成功・インパクト系
│   └── ネガティブ/         ← 警告・失敗・ツッコミ系
├── script/                ← ナレーション台本（テキスト）
├── slides/                ← 自動生成、触らなくてOK
└── output/                ← 完成動画の出力先
```

### 必要な素材

| 素材 | 必須？ | 説明 |
|------|--------|------|
| 本編動画 | **必須** | 撮影したMP4ファイルを `videos/main/` に入れる |
| 物理挿入動画 | 任意 | ナレーションを止めて挟み込むクリップを `videos/inserts/` に入れる |
| オーバーレイ動画 | 任意 | ナレーション中に上に被せる補足映像を `videos/overlays/` に入れる |
| OP動画 | 任意 | 冒頭のタイトル・ロゴ映像を `videos/opening/` に入れる |
| ハイライト動画 | — | 完成後に**自動生成**されるので手動配置不要（横動画のみ） |
| 横挿入画像 | 任意 | 720×405 の画像を `images/inserts/` に入れる |
| 全画面画像 | 任意 | 全画面アニメーション表示用画像を `images/overlays/` に入れる |
| BGM | **必須** | フリーBGMサイト等からダウンロードしたMP3を `bgm/` に入れる |
| SE（効果音） | **必須** | フリーSEサイト等からMP3をダウンロードして `se/` に入れる |
| ナレーション台本 | 推奨 | 話した内容のテキストを `script/` に入れる（文字起こしの精度が上がります） |

> **ヒント**: `public/se/` にはフォルダ構成（強調・ポジティブ・ネガティブ）が用意されています。フリーSEサイト等からダウンロードしたMP3を各フォルダに入れてください。

---

## Step 5: 動画制作スタート！

プロジェクトフォルダ内で Claude Code を起動します。

```bash
# Claude Code を起動（dangerousモード）
claude --dangerously-skip-permissions
```

起動したら、以下を入力してください：

```
/step01-context
```

あとはAIの指示に従って、`/step02-assets` → `/step03-transcript` → … と順番に進めるだけ！

---

## ワークフロー全体像（全20ステップ）

```
【フェーズ1: 素材準備】
/step01-context         動画の目的・ターゲットを整理
/step02-assets          素材確認＆役割確定（本編/物理挿入/オーバーレイ/OP/ハイライト）
/step03-transcript      本編をWhisperで文字起こし
/step04-transcript-fix  台本と照合して誤変換を修正
/step05-cut             無音＋言い直し一括カット（FFmpeg一発エンコード）
/step06-transcript      カット後の再文字起こし＋修正再適用
    ↓
【フェーズ2: 動画構築】
/step07-template        テンプレート設定（フォント・サイズ・色・SE）
/step08-telop           テロップデータ作成
/step09-composition     コンポジション統合（動画の骨格が完成）
    ↓
【フェーズ3: 素材・演出挿入】
/step10-greenback       グリーンバック背景置換（任意）
/step11-videos          デモ動画挿入（物理挿入=Series分割 / オーバーレイ=上に重ね）（任意）
/step12-slides-gen      台本からスライドHTML生成（任意）
/step13-slides          スライドキャプチャ＋タイムライン（任意）
/step14-wipe            ワイプ位置調整（任意）
/step15-images          画像挿入（感情ベース + AI画像生成）（任意）
/step16-special-components  箇条書き・見出し・CTA（任意）
/step17-endscreen       エンドスクリーン追加（任意）
    ↓
【フェーズ4: BGM・冒頭連結・出力】
/step18-bgm             BGM挿入
/step19-opening         OP連結＋本編レンダリング（1回目）
/step20-highlight-final 本編からハイライト自動抽出＋最終レンダリング → 完成！
```

---

## フォルダ構成

```
naoki-blueprint/                 ← ダウンロードしたフォルダ
├── README.md                    ← このファイル
├── .template/           ← テンプレート（コピー元・編集しない）
│   ├── .claude/skills/          ← 20個のAIスキル + catchup + remotion-best-practices
│   ├── CLAUDE.md                ← AIの行動ルール
│   ├── scripts/validateLicense.mjs  ← ライセンス認証スクリプト
│   ├── public/videos/main/             ← 本編動画を入れる
│   ├── public/videos/inserts/          ← 物理挿入動画（任意）
│   ├── public/videos/overlays/         ← オーバーレイ動画（任意）
│   ├── public/videos/opening/          ← OP動画（任意）
│   ├── public/videos/highlight/        ← 冒頭ハイライト動画（任意）
│   ├── public/bgm/              ← BGMを入れる
│   ├── public/se/               ← SE素材を入れる
│   ├── public/script/           ← ナレーション台本を入れる
│   └── ...
├── aislides/              ← スライドテンプレートシステム
│   ├── slides.html              ← 15種類のスライドテンプレート
│   └── screenshot.js            ← Puppeteerキャプチャスクリプト
│
└── projects/                    ← あなたの動画プロジェクトはここ
    ├── tennis-serve-tips/       ← 例：1本目
    ├── cooking-pasta/           ← 例：2本目
    └── ...                      ← 何本でもOK
```

---

## よくある質問

### Q: Claude Code って何？どうやって使うの？
Anthropic が提供するAIコーディングツールです。ターミナルから `claude` コマンドで起動します。
詳しくは → https://claude.ai/claude-code

### Q: 2本目の動画を作りたい
テンプレートをもう一度コピーするだけ（ライセンス再認証は不要）：

**Mac/Linux**:
```bash
cd naoki-blueprint
cp -r .template projects/好きなプロジェクト名
cd projects/好きなプロジェクト名
npm install
```

**Windows (PowerShell)**:
```powershell
cd naoki-blueprint
Copy-Item -Recurse .template projects/好きなプロジェクト名
cd projects/好きなプロジェクト名
npm install
```

### Q: スライドなしの動画も作れる？
はい。step12〜14をスキップすれば、スライドなしの動画として制作できます。

### Q: プレビューの見方は？
```bash
npm run dev
```
でブラウザが開きます（http://localhost:3000）。

### Q: Whisper がエラーになる

**Mac（Apple Silicon）の場合：**
```bash
python3.12 --version   # Python 3.12.x が出ればOK
python3.12 -c "import mlx_whisper; print('OK')"
```

**Windows/Linuxの場合：**
```bash
python3.12 --version   # Python 3.12.x が出ればOK
python3.12 -c "from faster_whisper import WhisperModel; print('OK')"
```

### Q: ライセンスが認証できない
- ライセンスIDが正しいか確認してください（NK-XXXX-XXXX-XXXX形式）
- 有効期限が切れていないか権利者に確認してください
- 別のPCで認証済みの場合は、権利者にPC紐付け解除を依頼してください

### Q: Windows でも使える？
はい。Step 0 で `faster-whisper` をインストールすれば動作します。`scripts/transcribe.mjs` が自動でOSを判定し、Macなら `mlx-whisper`、Windows/Linuxなら `faster-whisper` を使い分けます。GPU(CUDA)対応PCならさらに高速に動作します。

---

## ライセンス

本テンプレートのスキルファイルに関する著作権その他一切の知的財産権は、権利者（小林 尚貴）に帰属します。

詳細は[スキルファイル利用規約](https://coachnaoki.github.io/naoki-blueprint/terms.html)をご確認ください。
