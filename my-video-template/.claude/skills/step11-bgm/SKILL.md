---
name: step11-bgm
description: BGM（バックグラウンドミュージック）を動画に挿入する。音量調整・ループ設定を行う。
argument-hint: [BGMファイルパス（省略時はpublic/bgm/内を確認）]
allowed-tools: Read, Write, Edit, Glob, Bash(ls *), Bash(ffprobe *)
---

# Step 11: BGM挿入

動画にBGMを追加する。

## 前提条件
- Step 10（プレビュー確認）が完了していること
- BGMファイルが `public/bgm/` に配置されていること

## やること

### 1. BGMファイルの確認

```bash
ls -la public/bgm/
```

ファイルがない場合はユーザーに確認する。

### 2. BGMの長さ確認

```bash
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/bgm/bgm.mp3
```

動画の長さと比較し、ループが必要か確認する。

### 3. MainComposition.tsx にBGMを追加

```typescript
import { Audio } from "remotion";
import { staticFile } from "remotion";

// コンポジション内に追加
<Audio src={staticFile("bgm/bgm.mp3")} volume={0.12} />
```

### 4. 音量の調整

- BGM: `volume: 0.12`（デフォルト）
- 話者の声を邪魔しない音量にする
- ユーザーの要望があれば調整

### 5. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 11 完了: BGMを挿入しました。

【設定】
- ファイル: public/bgm/bgm.mp3
- 音量: 0.12

次のステップ → /step12-greenback（グリーンバック背景置換）またはスキップして /step13-heading
進めますか？
```
