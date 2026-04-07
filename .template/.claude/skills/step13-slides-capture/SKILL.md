---
name: step13-slides-capture
description: HTMLスライドをPuppeteerで高解像度PNG画像としてキャプチャし、必要なスライドをブロック分割する。
argument-hint: [HTMLファイルパス]
allowed-tools: Read, Write, Glob, Bash(node *), Bash(ls *), Bash(mkdir *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 13: スライドキャプチャ＋ブロック分割

HTMLスライドファイルをPuppeteerで開き、各スライドを高解像度PNG画像として保存する。

## 前提条件
- Step 12（スライド生成）が完了していること
- HTMLスライドファイルのパスが分かっていること
- Puppeteerがインストールされていること（`npm ls puppeteer`）

## やること

### 1. スライドHTMLの確認

ユーザーにHTMLスライドファイルのパスを確認する。引数 `$ARGUMENTS` でパスが指定されていればそれを使う。

**スライドが不要な場合**はこのステップをスキップして次へ進む。

### 2. キャプチャスクリプトの確認・更新

`scripts/captureSlides.mjs` を確認する。

スクリプトの要件（**slides/screenshot.js と同じ方式を使うこと**）：
- Puppeteerでヘッドレスブラウザを起動
- 各スライドを `?slide=N` パラメータで順番にアクセス
- **ビューポート: 1280x720 + `deviceScaleFactor: 2`**（実質2560x1440の高解像度）
- **`.slide-container` のBoundingRectでクリップ**してスクリーンショット（CSSオーバーライドでの無理やり拡大は禁止）
- `document.fonts.ready` でフォント読み込みを待つ
- `public/slides/slide-{01, 02, ...}.png` として保存

更新が必要な項目：
- **`TOTAL_SLIDES`**: スライド枚数に合わせて変更する
- **`slidesHtml`**: HTMLファイルのパスを確認する

### 3. ブロック分割（自動検出）

**ブロック分割は `SLIDE_SCRIPT` のテンプレートタイプから自動検出される。手動設定は不要。**

スクリプト内の `BLOCK_TEMPLATE_MAP` が以下のテンプレートを自動検出し、ブロック画像を生成する：

| テンプレートタイプ | セレクタ | アイテム数の取得元 |
|---|---|---|
| `three-cards` | `.grid-cols-3 > div` | `cards.length` |
| `three-tactics` | `.grid-cols-3 > div` | `cards.length` |
| `two-columns` | `.gap-8 > .flex-1` | `columns.length` |
| `steps` | `.flex-col.px-12 > div.rounded-2xl` | `steps.length` |
| `closing` | `.grid > div` | `cards.length` |

**出力例**（two-columnsの場合）:
- `slide-04-block1.png` — 1つ目のカラムのみ表示
- `slide-04-block2.png` — 全カラム表示（= slide-04.png と同じ）

**出力例**（three-cardsの場合）:
- `slide-08-block1.png` — 1つ目のカードのみ表示
- `slide-08-block2.png` — 1つ目+2つ目のカード表示
- `slide-08-block3.png` — 全カード表示（= slide-08.png と同じ）

### 4. キャプチャ実行

```bash
node scripts/captureSlides.mjs
```

`🔍 Auto-detected block splits:` で自動検出結果が表示される。想定通りか確認する。

### 5. 結果確認

- `public/slides/` にPNGファイルが生成されたか確認
- ファイル数とサイズを表示

### 6. 追加画像の配置

スライド以外に使う画像（イメージ写真など）があれば、ユーザーに確認して `public/slides/` に配置する。

## 完了条件
- `public/slides/` にスライドPNGが存在する
- 全スライドが2560x1440（deviceScaleFactor: 2）で生成されている
- ブロック分割対象のスライドにblock画像が生成されている

## 完了後

```
✅ Step 13 完了: スライドキャプチャ＋ブロック分割が完了しました。

【生成ファイル】
- public/slides/slide-01.png 〜 slide-{N}.png
- public/slides/slide-{N}-block{N}.png（自動検出でブロック分割）
- （追加画像があれば記載）

次のステップ → /step14-slide-timeline（スライドタイムライン）
進めますか？
```
