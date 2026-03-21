---
name: step07-slides-capture
description: HTMLスライドをPuppeteerで1920x1080のPNG画像としてキャプチャする。スライドが不要な場合はスキップ可能。
argument-hint: [HTMLファイルパス]
allowed-tools: Read, Write, Glob, Bash(node *), Bash(ls *), Bash(mkdir *)
---

# Step 07: スライドキャプチャ

HTMLスライドファイルをPuppeteerで開き、各スライドを1920x1080のPNG画像として保存する。

## 前提条件
- Step 06（スライド生成）が完了していること
- HTMLスライドファイルのパスが分かっていること
- Puppeteerがインストールされていること（`npm ls puppeteer`）

## やること

### 1. スライドHTMLの確認

ユーザーにHTMLスライドファイルのパスを確認する。引数 `$ARGUMENTS` でパスが指定されていればそれを使う。

**スライドが不要な場合**はこのステップをスキップして次へ進む。

### 2. キャプチャスクリプトの作成 or 確認

`scripts/captureSlides.mjs` を確認し、必要なら作成する。

スクリプトの要件：
- Puppeteerでヘッドレスブラウザを起動
- 各スライドを `?slide=N` パラメータで順番にアクセス
- ビューポートを 1920x1080 に設定
- CSSをオーバーライドして正確な解像度でキャプチャ
- `public/slides/slide-{01, 02, ...}.png` として保存

### 3. キャプチャ実行

```bash
node scripts/captureSlides.mjs
```

### 4. 結果確認

- `public/slides/` にPNGファイルが生成されたか確認
- ファイル数とサイズを表示

### 5. 追加画像の配置

スライド以外に使う画像（イメージ写真など）があれば、ユーザーに確認して `public/slides/` に配置する。

## 完了条件
- `public/slides/` にスライドPNGが存在する
- 全スライドが1920x1080で生成されている

## 完了後

```
✅ Step 07 完了: スライドキャプチャが完了しました。

【生成ファイル】
- public/slides/slide-01.png 〜 slide-{N}.png
- （追加画像があれば記載）

次のステップ → /step08-slide-blocks（ブロック分割）
進めますか？
```
