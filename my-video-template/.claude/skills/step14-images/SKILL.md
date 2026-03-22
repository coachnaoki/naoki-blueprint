---
name: step14-images
description: イメージ画像を動画に挿入する。全画面表示（ズーム/フェード）または左右挿入に対応。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *)
---

# Step 14: 画像挿入

発話内容に合わせてイメージ画像を挿入する。

## 前提条件
- Step 13（BGM挿入）が完了していること
- 画像ファイルが `public/images/` に配置されていること

## ユーザーに確認すること（必須）

各画像について以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間に画像を入れるか**（台本のどこからどこまで）
2. **表示方法**: 全画面 or 左右挿入（左 or 右）
3. **全画面の場合のアニメーション**:
   - `zoom` — ゆっくりズームイン（Ken Burns風）
   - `fadeLeft` — 左からフェードイン
   - `fadeBottom` — 下からフェードイン
4. **左右挿入の場合**: アニメーションなし（パッと表示）

## CLAUDE.md準拠ルール

- **z-index**: 5以下（テロップの下）
- **position: absolute** 必須
- **全画面画像の表示中は見出しバナーとワイプを非表示にする**

## アニメーション実装

### 全画面: ズーム（zoomIn）
```typescript
const scale = interpolate(frame, [startFrame, endFrame], [1.0, 1.15], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
<Img src={staticFile("images/example.jpg")} style={{
  position: "absolute", width: 1920, height: 1080,
  objectFit: "cover", zIndex: 5,
  transform: `scale(${scale})`,
}} />
```

### 全画面: 左からフェードイン（fadeLeft）
```typescript
const translateX = interpolate(frame, [startFrame, startFrame + 15], [-100, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
```

### 全画面: 下からフェードイン（fadeBottom）
```typescript
const translateY = interpolate(frame, [startFrame, startFrame + 15], [100, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
```

### 左右挿入（アニメーションなし）
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/example.jpg")} style={{
    position: "absolute",
    top: 100, left: 50,  // or right: 50
    width: 600, height: 400,
    objectFit: "cover", zIndex: 5,
  }} />
)}
```

## やること

### 1. 画像素材の確認

```bash
ls -la public/images/
```

### 2. 台本のタイミング特定

`transcript_words.json` でユーザーが指定した区間の正確なフレームを特定する。

### 3. MainComposition.tsx に画像表示を追加

ユーザーが指定した表示方法・アニメーションで実装する。

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
- f{N}〜f{N}: example.jpg（全画面・ズーム）
- f{N}〜f{N}: example2.jpg（左挿入・アニメーションなし）

他にも画像を挿入しますか？
→ はい: 同じステップを繰り返す
→ いいえ: 次のステップ → /step15-videos（動画クリップ挿入）
```
