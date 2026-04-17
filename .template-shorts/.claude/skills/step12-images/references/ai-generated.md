# B. AI画像生成 + 挿入（Gemini API）

Gemini API で場面に合った画像を自動生成し、**感情ベース**で挿入する。

## 前提
- `pip install google-genai Pillow` 済み（Mac/Windows/Linux 共通）

## 0-A. Gemini APIキー設定（初回のみ・自動セットアップ）

**作業開始前に、必ずAPIキーが設定されているかチェックする。** 設定されていなければユーザーと対話して自動で `.env` を作成する。

### 手順

1. **既存設定のチェック**（OS別コマンドを使い分け）

   ```bash
   # Mac/Linux
   if [ -f .env ] && grep -q "^GEMINI_API_KEY=." .env; then echo "OK"; else echo "NG"; fi
   ```
   ```powershell
   # Windows (PowerShell)
   if ((Test-Path .env) -and (Select-String "^GEMINI_API_KEY=." .env)) { "OK" } else { "NG" }
   ```

2. **未設定なら、ユーザーに以下をそのまま聞く**（コピペ可）:
   > Gemini APIキーがまだ設定されていません。以下の手順でキーを取得して、このチャットに貼り付けてください。
   >
   > **キーの取得方法:**
   > 1. https://aistudio.google.com/apikey を開く
   > 2. Googleアカウントでログイン
   > 3. 「Create API key」をクリック
   > 4. 表示されたキー（`AIza...` で始まる長い文字列）をコピー
   >
   > コピーしたキーをそのままこのチャットに貼り付けてください。僕が `.env` ファイルを自動で作成します。

3. **キーを受け取ったら、`.env` ファイルを自動作成**
   Writeツールで `.env` を作成:
   ```
   GEMINI_API_KEY=ユーザーから受け取ったキー
   ```

4. **キーの形式チェック（簡易）**
   - `AIza` で始まらない / 30文字未満 → 「キーの形式が正しくない可能性があります。もう一度確認してください」と返す

> **なぜ自動化するのか**: `.env` ファイルは先頭ドットのため Finder/Explorer で見えにくく、手動作成でつまずく人が多い。

## 0-B. 最新モデルの設定（必須）

`scripts/generate-images.py` の `MODEL` が空の場合、最新の画像生成モデルを設定する。

1. https://ai.google.dev/gemini-api/docs/models をWebSearchまたはWebFetchで確認
2. 画像生成対応のFlashモデル（`gemini-*-flash-image*`）の最新IDを取得
3. `scripts/generate-images.py` の `MODEL = ""` を最新モデルIDに更新

> **なぜ毎回確認するのか**: Gemini APIのモデルは頻繁に更新される。テンプレート配布時点のモデルが廃止されている場合があるため、実行時に最新を確認する。

## やること

### 1. 感情ピークの特定

`telopData.ts` と `transcript_words.json` を読み、**視聴者の感情が動く瞬間**をピックアップする。

**画像を入れるべき感情の例**:
- 😟 困惑・挫折（「多すぎる」「分からない」「できない」）
- 😲 驚き・感動（「すごい」「信じられない」「自動で」）
- 😢 不安・危機感（「なくなる」「失う」「独立したら」）
- 🤝 共感・告白（「実は〜です」「皆さんも〜ですよね」）
- ✨ 希望・可能性（「ゼロからできる」「誰でも」「未来」）
- 🎯 理解・整理（「つまり」「整理すると」「ファミリー」）

**ピックアップの手順**:
1. telopData.ts のテロップテキストを通読
2. 感情が動くテロップを5〜10個マーク（ショート動画は短いので少なめ）
3. 動画クリップ表示中の区間は除外
4. 動画全体にバランスよく分散

### 2. 画像プロンプトの作成

各感情ピークに合う画像プロンプト（英語）を作成する。

**プロンプトのルール**:
- 英語で書く（英語の方が品質が高い）
- 末尾に必ず `no text no words no letters` を追加
- 発話の内容・感情・トーンに合わせる
- **テロップの「意味」と画像の「内容」が明確に対応すること**
- **縦長アスペクト比指定**: プロンプト末尾に `vertical 9:16 aspect ratio` を追加

### 3. 画像を一括生成

`scripts/generate-images.py` の `IMAGES` リストを更新して実行:

```bash
python3.12 scripts/generate-images.py
```

出力先: `public/images/generated/`

### 4. 画像の確認・場面照合

生成された画像を1枚ずつ確認し、発話内容と照合する:
- そのフレームのテロップテキストを表示
- 画像の内容がテロップの感情・意味とマッチしているか判定
- **不一致の場合はプロンプトを修正して再生成**
- **「ギリOK」は NG** — 明確にマッチしていなければ再生成する

### 5. MainComposition.tsx に挿入

→ SKILL.md の「表示ルール」「実装リファレンス」を参照

### 6. コンパイル確認

```bash
npx tsc --noEmit
```
