# B. AI画像生成 + 挿入（Gemini API）

Gemini API で場面に合った画像を自動生成し、**感情ベース**で挿入する。

> ⚠️ **必須**: 画像生成を始める前に必ず [`policy-compliance.md`](policy-compliance.md) を読み、Google生成AI利用ポリシーの NGリスト・推奨フレーズ・セルフチェックリストを把握すること。違反するとAPIキー無効化・**Googleアカウント停止**につながる。

## 前提
- `pip install google-genai Pillow` 済み（Mac/Windows/Linux 共通）

## 0-A. Gemini APIキー設定（初回のみ・セキュアセットアップ）

**作業開始前に、必ずAPIキーが設定されているかチェックする。** 設定されていなければ、**ユーザーに `.env` ファイルへ直接入力してもらう**（チャットにキーを貼らせない）。

> ⚠️ **絶対禁止**: APIキーを**チャットに貼り付けさせない**。Claude Code のトランスクリプトやサブエージェントのコンテキストに平文で残り、画面共有・スクショ・ログ共有で漏えいするリスクがあるため、必ず `.env` ファイルへの直接入力方式で案内すること。

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

2. **未設定なら、まず空の `.env` をWriteツールで作成する**（プレビューで開ける状態にする）
   ```
   GEMINI_API_KEY=
   ```

3. **ユーザーに以下をそのまま案内する**（コピペ可）:
   > Gemini APIキーがまだ設定されていません。セキュリティのため、**キーはこのチャットに絶対に貼り付けないでください**。以下の手順で `.env` ファイルに直接入力してください。
   >
   > **キーの取得方法:**
   > 1. https://aistudio.google.com/apikey を開く
   > 2. Googleアカウントでログイン
   > 3. 「Create API key」をクリック
   > 4. 表示されたキー（`AIza...` で始まる長い文字列）をコピー
   >
   > **キーの貼り付け方（Cursor / VS Code）:**
   > 1. 左側のファイルツリーからプロジェクト直下の `.env` をクリックして開く
   > 2. `GEMINI_API_KEY=` の右側（`=` の直後・スペースなし）にコピーしたキーを貼り付ける
   > 3. `Cmd+S`（Mac）/ `Ctrl+S`（Windows）で保存
   > 4. このチャットに「OK」とだけ返答してください（キーは貼らない）
   >
   > ⚠️ **重要**: APIキーを使うことは Google生成AI利用ポリシーへの同意を意味します。違反コンテンツ（実在人物・未成年・ロゴ・暴力等）の生成は **APIキー無効化・Googleアカウント停止** の対象となり、配布元（Naoki）ではなくユーザー本人の自己責任となります。詳細は `policy-compliance.md` を参照してください。

4. **ユーザーから「OK」等の完了応答が来たら、`.env` を Read して検証**
   - `.env` を Read する
   - `GEMINI_API_KEY=` の右側に値が入っているか確認
   - 値が空なら「まだキーが入力されていないようです。`.env` ファイルに直接貼り付けて保存してください」と再案内
   - 値が入っていれば形式チェック（下記 5 へ）

5. **キーの形式チェック（簡易）**
   - `AIza` で始まらない / 30文字未満 → 「キーの形式が正しくない可能性があります。`.env` をもう一度開いて確認してください」と返す
   - それ以外 → 「✅ `.env` にAPIキーが設定されました」と報告して次へ

> **なぜチャットに貼らせないのか**: Claude Codeは会話内容をローカルのトランスクリプトに保存する。チャットにAPIキーを貼ると、そのログが残り続け、サブエージェント起動時のコンテキストや画面共有・スクショ経由で第三者に漏れるリスクがある。`.env` は `.gitignore` で除外されており、ローカルのみに存在するため安全。

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
- 発話の内容・感情・トーンに合わせる
- **テロップの「意味」と画像の「内容」が明確に対応すること**
- **末尾に必須NG文字列を必ず追加**（`policy-compliance.md` 参照）:
  ```
  no text, no words, no letters,
  no real people, no celebrities, no public figures,
  no children, no minors, no teenagers,
  no logos, no brand names, no trademarks, no copyrighted characters,
  no violence, no blood, no weapons, no explicit content,
  no medical procedures, no religious symbols, no currency or IDs,
  vertical 9:16 aspect ratio
  ```

**プロンプト確定前のセルフチェック（必須）:**

`policy-compliance.md` の「生成前セルフチェックリスト」を**1項目ずつ**実行する。1つでも該当したらプロンプトを書き換える。

特に以下に注意:
- **実在の人物名・有名人名は絶対に書かない**（フェデラー、マスク、有名選手等 → `fictional adult athlete` に置き換え）
- **子供を出さない**（人物を入れる場合は必ず `adult` を明示。`child` `kid` `student` `teen` 等は禁止）
- **ブランド名・ロゴは出さない**（`Nike` → `unbranded sportswear`、`Apple` → 削除）
- **顔のクローズアップを避ける**（`back view` / `silhouette` / `from distance` / `hands only` を活用）

業種別の安全な代替例とフレーズ集は `policy-compliance.md` を参照。

### 3. 画像を一括生成

`scripts/generate-images.py` の `IMAGES` リストを更新して実行:

```bash
python3.12 scripts/generate-images.py
```

出力先: `public/images/overlays/generated/`

**スパム判定回避のルール:**
- 1セッション最大15枚まで
- 同じプロンプトの連投禁止（バリエーションを変える）
- 失敗作の再生成はプロンプトを直してから1回だけ

### 4. 画像の確認・場面照合（規約チェック含む）

生成された画像を1枚ずつ確認し、発話内容との照合 **+ 規約チェック** を行う:

**A. 規約チェック（最優先）**
- 認識可能な実在人物の顔が生成されていないか
- 子供・未成年が映っていないか
- 識別可能なブランドロゴ・商標が映っていないか
- 暴力・流血・性的描写が含まれていないか
- 著作権キャラクター（アニメ・ゲーム）が映っていないか

→ **1つでも該当したら即削除**し、プロンプトに該当NG語を追加して再生成。

**B. 場面照合**
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
