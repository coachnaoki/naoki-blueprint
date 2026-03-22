---
name: step14-videos
description: 動画クリップ（デモ映像・画面録画等）を挿入する。全画面表示、音声あり/なし対応。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(ffprobe *)
---

# Step 14: 動画クリップ挿入

デモ映像・画面録画・補足動画などを本編に挿入する。

## 前提条件
- Step 13（画像・見出し挿入）が完了していること
- 動画クリップが `public/videos/` に配置されていること

## ユーザーに確認すること（必須）

各動画クリップについて以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間に動画を入れるか**（台本のどこからどこまで）
2. **表示方法**: 全画面
3. **音声**: あり or なし（`volume={0}` で無音化）

## CLAUDE.md準拠ルール

- **Sequence必須**: コンポジション途中から再生する動画は必ず `<Sequence from={startFrame}>` でラップする
- **z-index**: 5以下（テロップの下）
- **全画面動画の表示中は見出しバナーとワイプを非表示にする**

### 音声あり
```typescript
<Sequence from={startFrame} durationInFrames={duration} layout="none">
  <OffthreadVideo
    src={staticFile("videos/demo.mp4")}
    style={{
      position: "absolute", width: 1920, height: 1080,
      objectFit: "cover", zIndex: 5,
    }}
  />
</Sequence>
```

### 音声なし
```typescript
<Sequence from={startFrame} durationInFrames={duration} layout="none">
  <OffthreadVideo
    src={staticFile("videos/demo.mp4")}
    volume={0}
    style={{
      position: "absolute", width: 1920, height: 1080,
      objectFit: "cover", zIndex: 5,
    }}
  />
</Sequence>
```

## やること

### 1. 動画クリップの確認

```bash
ls -la public/videos/
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/*.mp4
```

### 2. 台本のタイミング特定

`transcript_words.json` でユーザーが指定した区間の正確なフレームを特定する。

### 3. MainComposition.tsx に動画クリップを追加

Sequenceでラップし、durationInFramesを動画の長さに合わせる。

### 4. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 14 完了: 動画クリップを挿入しました。

【挿入動画】
- f{N}〜f{N}: demo.mp4（全画面・音声あり）
- f{N}〜f{N}: screen.mp4（全画面・音声なし）

他にも動画クリップを挿入しますか？
→ はい: 同じステップを繰り返す
→ いいえ: 次のステップ → /step15-slides-gen（スライド追加する場合）またはスキップして /step19-preview
```
