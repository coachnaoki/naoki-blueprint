---
name: step15-videos
description: 動画クリップ（デモ映像・画面録画等）を挿入する。Sequenceでラップして正しく再生させる。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(ffprobe *)
---

# Step 15: 動画クリップ挿入

デモ映像・画面録画・補足動画などを本編に挿入する。

## 前提条件
- Step 14（画像挿入）が完了していること
- 動画クリップが `public/videos/` に配置されていること

## CLAUDE.md準拠ルール

- **Sequence必須**: コンポジション途中から再生する動画は必ず `<Sequence from={startFrame}>` でラップする
- **z-index**: 5以下（テロップの下）
- **フェードなし**: パッと表示してパッと消える

```typescript
// NG: Sequenceなし（静止画になる）
{frame >= 14850 && (
  <OffthreadVideo src={staticFile("videos/sample.mp4")} />
)}

// OK: Sequenceでラップ
<Sequence from={14850} durationInFrames={145} layout="none">
  <OffthreadVideo src={staticFile("videos/sample.mp4")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
  }} />
</Sequence>
```

## やること

### 1. 動画クリップの確認

```bash
ls -la public/videos/
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/*.mp4
```

### 2. 挿入ポイントの特定

`transcript_words.json` からデモ・操作説明などの箇所を特定する。

### 3. MainComposition.tsx に動画クリップを追加

Sequenceでラップし、durationInFramesを動画の長さに合わせる。

### 4. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 15 完了: 動画クリップを挿入しました。

【挿入動画】
- f{N}〜f{N}: sample.mp4（○○のデモ）

次のステップ → /step16-slides-gen（スライド追加する場合）またはスキップして /step20-preview
進めますか？
```
