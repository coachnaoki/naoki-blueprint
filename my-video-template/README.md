# Remotion 動画制作テンプレート

Claude Code のスキルシステムで、撮影済み動画から YouTube 向けの動画を自動制作するテンプレートです。

## できること

1. 動画の無音部分をジャンプカット
2. Whisper で自動文字起こし → 台本と照合して誤変換修正
3. HTML スライドを自動生成 → 画像キャプチャ
4. テロップ・字幕・SE・BGM を自動配置
5. Remotion で最終 MP4 をレンダリング

全 15 ステップを `/step01-context` 〜 `/step15-render` のスラッシュコマンドで順番に進めるだけで動画が完成します。

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
| 撮影した動画 | MP4 | `public/` |
| BGM | MP3 | `public/bgm.mp3` |
| ナレーション台本 | テキスト | `/step01-context` で `video-context.md` に記入 |

SE（効果音）は `public/se/` にプリセットが入っています。

---

## セットアップ手順

### 1. テンプレートをコピー

```bash
cp -r my-video-template my-new-video
cd my-new-video
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. 素材を配置

```bash
# 撮影した動画を public/ に配置
cp /path/to/your-video.mp4 public/

# BGM を配置
cp /path/to/bgm.mp3 public/bgm.mp3
```

### 4. SE（効果音）を配置

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

### 5. スライドテンプレートを配置

スライド生成には `gas-genspark` フォルダが必要です（テンプレートと一緒に配布されます）。

```bash
# gas-genspark がプロジェクトの親ディレクトリにあることを確認
ls ../gas-genspark/slides.html
```

### 6. 動画制作を開始！

Claude Code を起動して、最初のコマンドを実行：

```
/step01-context
```

あとはスキルの指示に従って順番に進めるだけです。

---

## ワークフロー（全 15 ステップ）

```
【素材準備フェーズ】
/step01-context         → 動画の目的・ターゲットを整理
/step02-assets          → 素材の確認（動画・BGM・SE）
/step03-jumpcut         → 無音部分を自動カット
/step04-transcript      → Whisper で文字起こし
/step05-transcript-fix  → 台本と照合して誤変換を修正

【スライドフェーズ】（スライドなしならスキップ可）
/step06-slides-gen      → 台本からスライド HTML 生成
/step07-slides-capture  → スライドを PNG 画像化
/step08-slide-blocks    → ブロック分割（段階表示用）

【データ定義フェーズ】
/step09-template        → テンプレート設定
/step10-telop           → テロップデータ作成
/step11-timeline        → スライドタイムライン作成

【実装・出力フェーズ】
/step12-composition     → メインコンポジション構築
/step13-register        → Remotion に登録
/step14-preview         → プレビュー確認
/step15-render          → MP4 書き出し
```

---

## フォルダ構成

```
my-new-video/
├── .claude/skills/     ← Claude Code スキル（15ステップ）
├── CLAUDE.md           ← AI の行動ルール（編集不要）
├── video-context.md    ← 動画の設定（step01 で作成）
├── public/
│   ├── your-video.mp4  ← 撮影動画
│   ├── bgm.mp3         ← BGM
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
│   ├── captureSlides.mjs        ← スライドキャプチャ
│   └── captureSlideBlocks.mjs   ← ブロック分割キャプチャ
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

---

## よくある質問

### Q: スライドなしの動画も作れる？
はい。step06〜08 をスキップして、ライブ映像がメインの動画として制作できます。

### Q: Whisper がエラーになる
Python のバージョンを確認してください。`python3.12` が必要です：
```bash
/opt/homebrew/bin/python3.12 -c "import mlx_whisper; print('OK')"
```

### Q: プレビューはどうやって見る？
`npm run dev` で Remotion Studio が起動します。ブラウザで `http://localhost:3000` を開いてください。

### Q: 自己紹介カード（ProfileCard）の内容はどこで設定する？
`video-context.md` にプロフィール情報を記載してください。step12 でコンポジション構築時に自動で読み取ります。
