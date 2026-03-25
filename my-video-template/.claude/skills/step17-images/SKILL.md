---
name: step17-images
description: イメージ画像を動画に挿入する。全画面表示（ズーム/フェード）と左側挿入に対応。位置は固定値。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 17: イメージ画像挿入

発話内容に合わせてイメージ画像を挿入する。

## 前提条件
- Step 16（スライドタイムライン）が完了していること（スライドがある場合）
- 画像ファイルが `public/images/` に配置されていること

## ユーザーに確認すること（必須）

各画像について以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間に入れるか**（台本のどこからどこまで）
2. **表示方法**: 全画面 or 左側挿入
3. **全画面の場合 — アニメーション**:
   - `zoom` — ゆっくりズームイン（Ken Burns風）
   - `fadeLeft` — 左からフェードイン
   - `fadeBottom` — 下からフェードイン

## CLAUDE.md準拠ルール

- **z-index**: 画像は5以下（テロップの下）
- **position: absolute** 必須
- **画像表示ルール**: フェードイン/フェードアウトなし。パッと表示してパッと消える（左側挿入の場合）
- **全画面画像の表示中は見出しバナーとワイプを非表示にする**

---

## イメージ画像

### 左側挿入（固定位置・アニメーションなし）

位置は以下の固定値を使用する（変更不可）：

```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/example.jpg")} style={{
    position: "absolute",
    top: 369,
    left: 180,
    width: 720,
    height: 405,
    objectFit: "cover",
    zIndex: 5,
  }} />
)}
```

| プロパティ | 固定値 |
|-----------|--------|
| top | 369 |
| left | 180 |
| width | 720 |
| height | 405 |
| zIndex | 5 |

### 表示タイミングの決め方

SEと連動させる。以下のルールで開始・終了フレームを決定する：

1. **開始フレーム**: 画像を入れたい区間の最初のSE付きテロップの `startFrame`
2. **終了フレーム**: 開始から数えて5つ目のテロップの `endFrame`

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

---

## やること

### 1. 画像素材の確認

```bash
ls -la public/images/
```

### 2. 台本のタイミング特定

`transcript_words.json` でユーザーが指定した区間の正確なフレームを特定する。

### 3. MainComposition.tsx に追加

ユーザーが指定した表示方法・アニメーションで実装する。左側挿入は固定位置を使用。

### 4. テロップとの重複チェック

画像挿入区間に既存テロップがある場合、テロップが画像の上に表示されることを確認（z-index）。

### 5. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

---

## エンドスクリーン（おすすめ動画カード）

動画の最後におすすめ動画のサムネイルを表示するエンドスクリーンを挿入する。

### ユーザーに確認すること
1. **エンドスクリーン画像**はあるか（`public/images/endscreen.png` 等）
2. **表示秒数**（デフォルト: 10秒 = 250フレーム）

### 実装手順

#### 1. Root.tsx のフレーム数を延長
```typescript
// 元のフレーム数 + エンドスクリーン秒数 × fps
durationInFrames={元のフレーム数 + 250}  // 10秒の場合
```

#### 2. MainComposition.tsx にエンドスクリーン画像を追加
```typescript
{/* エンドスクリーン（最終フレーム以降） */}
{frame >= 元の最終フレーム && (
  <Img
    src={staticFile("images/endscreen.png")}
    style={{
      position: "absolute", top: 0, left: 0,
      width: "100%", height: "100%",
      objectFit: "cover", zIndex: 20,
    }}
  />
)}
```

- **zIndex: 20** で全要素の最前面に表示
- フェードなし（パッと表示）

※ ED用BGMはstep12（BGM挿入）で設定する。

---

## 完了後

```
✅ Step 17 完了: イメージ画像を挿入しました。

【挿入一覧】
- f{N}〜f{N}: example.jpg（左側挿入）
- f{N}〜f{N}: example2.jpg（全画面・ズーム）
- f{N}〜f{N}: endscreen.png（エンドスクリーン ○秒）

他にも画像を挿入しますか？
→ はい: 同じステップを繰り返す
→ いいえ: 次のステップ → /step18-bgm（BGM挿入）
```
