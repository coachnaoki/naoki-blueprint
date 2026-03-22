---
name: step14-images
description: イメージ画像を動画に挿入する。視聴維持率向上のための補足ビジュアルを配置する。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *)
---

# Step 14: 画像挿入

発話内容に合わせてイメージ画像を挿入し、視聴維持率を高める。

## 前提条件
- Step 13（見出しバナー）が完了またはスキップ済み
- 画像ファイルが `public/images/` に配置されていること

## CLAUDE.md準拠ルール

- **z-index**: 5以下（テロップの下）
- **フェードなし**: パッと表示してパッと消える（interpolateでのopacity禁止）
- **position: absolute** 必須

## やること

### 1. 画像素材の確認

```bash
ls -la public/images/
```

### 2. 挿入ポイントの特定

`transcript_words.json` から以下のタイミングを探す：
- 具体的な物・サービスに言及している箇所
- 視聴者がイメージしにくい概念の説明箇所
- 冒頭3分以内で動きが少ない区間（視聴維持率向上）

### 3. MainComposition.tsx に画像表示を追加

```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img
    src={staticFile("images/example.jpg")}
    style={{
      position: "absolute",
      top: 0, left: 0,
      width: 1920, height: 1080,
      objectFit: "cover",
      zIndex: 5,
    }}
  />
)}
```

### 4. テロップとの重複チェック

画像挿入区間に既存テロップがある場合、テロップが画像の上に表示されることを確認（z-index）。

### 5. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 14 完了: 画像を挿入しました。

【挿入画像】
- f{N}〜f{N}: example.jpg（○○の説明）
- f{N}〜f{N}: example2.jpg（○○の説明）

次のステップ → /step15-videos（動画クリップ挿入）
進めますか？
```
