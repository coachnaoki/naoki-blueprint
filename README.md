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

> GPU(CUDA)対応PCをお持ちの方は、以下も追加でインストールすると文字起こしが高速になります：
> ```
> pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
> ```

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

**プロジェクト名は自由に決めてください。** 動画の内容がわかる名前がおすすめです。

```bash
mkdir -p projects
cp -r .template projects/あなたのプロジェクト名
cd projects/あなたのプロジェクト名
npm install
```

例：
```bash
cp -r .template projects/tennis-serve-tips
cp -r .template projects/cooking-pasta
cp -r .template projects/ai-seminar-recap
```

> **なぜ `projects/` に作るの？**
> テンプレートやツール類はリポジトリ直下に残るので、2本目・3本目を作るときも同じ手順でコピーするだけ。ツールを見失う心配がありません。

---

## Step 4: 素材を配置

プロジェクトフォルダの `public/` の中に、素材ごとの専用フォルダが用意されています。Finder（Mac）やエクスプローラー（Windows）で、各フォルダにファイルをドラッグ＆ドロップするだけでOKです。

```
public/
├── video/          ← 撮影した動画（MP4）をここに入れる
├── bgm/            ← BGM（MP3）をここに入れる
├── se/             ← SE（効果音）を入れる
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

あとはAIの指示に従って、`/step02` → `/step03` → … と順番に進めるだけ！

---

## ワークフロー全体像（全20ステップ）

```
【フェーズ1: 素材準備】
/step01-context         動画の目的・ターゲットを整理
/step02-assets          素材の確認
/step03-jumpcut         無音部分を自動カット
/step04-video-insert    動画の差し込み結合（任意）
/step05-transcript      Whisperで文字起こし
/step06-transcript-fix  台本と照合して誤変換を修正
    ↓
【フェーズ2: 動画構築】
/step07-template        テンプレート設定（フォント・サイズ・色・SE）
/step08-telop           テロップデータ作成
/step09-composition     コンポジション統合（動画の骨格が完成）
    ↓
【フェーズ3: 素材・演出挿入】
/step10-greenback       グリーンバック背景置換（任意）
/step11-videos          デモ動画の重ね表示（任意）
/step12-slides-gen      台本からスライドHTML生成（任意）
/step13-slides-capture  スライドをPNG画像化（任意）
/step14-slide-timeline  スライドタイムライン作成（任意）
/step15-wipe            ワイプ位置調整（任意）
/step16-images          画像挿入（感情ベース + AI画像生成）（任意）
/step17-special-components  BulletList・見出し・CTA（任意）
/step18-endscreen       エンドスクリーン追加（任意）
    ↓
【フェーズ4: BGM + 出力】
/step19-bgm             BGM挿入
/step20-render          MP4書き出し → 完成！
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
│   ├── public/video/            ← 撮影動画を入れる
│   ├── public/bgm/              ← BGMを入れる
│   ├── public/se/               ← SE素材を入れる
│   ├── public/script/           ← ナレーション台本を入れる
│   └── ...
├── gas-genspark/                ← スライドテンプレートシステム
│   ├── slides.html              ← 7種類のスライドテンプレート
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
```bash
cd naoki-blueprint
cp -r .template projects/好きなプロジェクト名
cd projects/好きなプロジェクト名
npm install
```

### Q: スライドなしの動画も作れる？
はい。step12〜15をスキップすれば、スライドなしの動画として制作できます。

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
はい。Step 0 で `openai-whisper` をインストールすれば動作します。GPU(CUDA)対応PCならPyTorch CUDA版をインストールするとさらに高速です。

---

## ライセンス

本テンプレートのスキルファイルに関する著作権その他一切の知的財産権は、権利者（小林 尚貴）に帰属します。

詳細は[スキルファイル利用規約](https://coachnaoki.github.io/naoki-blueprint/terms.html)をご確認ください。
