---
name: step13-bgm
description: BGM（バックグラウンドミュージック）を動画に挿入する。フェードイン・フェードアウト付き。
argument-hint: [BGMファイルパス（省略時はpublic/bgm/内を確認）]
allowed-tools: Read, Write, Edit, Glob, Bash(ls *), Bash(ffprobe *), Bash(npx tsc *)
---

# Step 13: BGM挿入

動画にBGMを追加する。フェードイン・フェードアウト付き。

## 前提条件
- Step 12（見出しバナー）が完了またはスキップ済み
- BGMファイルが `public/bgm/` に配置されていること

## ユーザーに確認すること（必須）

以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間にBGMを入れるか**（台本のどこからどこまで）
2. **音量**（デフォルト: 0.12）
3. **フェードイン・フェードアウトの長さ**（デフォルト: 各2秒 = 50フレーム）

## やること

### 1. BGMファイルの確認

```bash
ls -la public/bgm/
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/bgm/bgm.mp3
```

### 2. 台本のタイミング特定

`transcript_words.json` でユーザーが指定した区間の正確なフレームを特定する。

### 3. MainComposition.tsx にBGMを追加

```typescript
import { Audio, interpolate, Sequence } from "remotion";
import { staticFile } from "remotion";

// フェードイン・フェードアウト付きBGM
<Sequence from={startFrame} durationInFrames={endFrame - startFrame} layout="none">
  <Audio
    src={staticFile("bgm/bgm.mp3")}
    volume={(f) =>
      interpolate(
        f,
        [0, fadeInFrames, (endFrame - startFrame) - fadeOutFrames, endFrame - startFrame],
        [0, maxVolume, maxVolume, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    }
  />
</Sequence>
```

### 4. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 13 完了: BGMを挿入しました。

【設定】
- ファイル: public/bgm/bgm.mp3
- 区間: f{N}〜f{N}（○○秒〜○○秒）
- 音量: 0.12
- フェードイン: 2秒 / フェードアウト: 2秒

他にもBGMを挿入しますか？（別の区間に別のBGMなど）
→ はい: 同じステップを繰り返す
→ いいえ: 次のステップ → /step14-images（画像挿入）
```
