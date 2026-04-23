---
name: step17-endscreen
description: 動画の最後にエンドスクリーン（おすすめ動画カード）オーバーレイを追加する。durationInFramesの延長とエンドスクリーン画像または動画の表示を行う。ユーザーが「エンドスクリーン」「endscreen」「おすすめ動画」「ステップ17」と言ったら起動する。
argument-hint: [エンドスクリーン素材パス（画像or動画）や表示秒数（省略時はユーザーに確認）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(ls *), Bash(ffprobe *), Bash(node scripts/_chk.mjs *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step17-endscreen` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 18: エンドスクリーン

動画の最後におすすめ動画カード（エンドスクリーン）を表示する。

## 前提条件
- Step 17（特殊コンポーネント実装）が完了していること

---

## ユーザーに確認すること（必須）

1. **エンドスクリーン素材はあるか？**（画像: `public/images/overlays/endscreen.png` / 動画: `public/videos/overlays/endscreen.mp4` 等）
2. **画像か動画か？**
3. **表示秒数**（画像の場合デフォルト: 10秒 / 動画の場合はクリップの尺に合わせる）

**素材がない場合**: このステップをスキップして次へ進む。「エンドスクリーンは後から追加できます。素材が用意できたら `/step17-endscreen` を再実行してください」と伝える。

---

## やること

### 1. Root.tsx のフレーム数を延長

`Root.tsx` の現在の `durationInFrames` を `originalLastFrame` として記録する。`video-context.md` からFPSを確認し、エンドスクリーン秒数分のフレームを加算する。

```typescript
// 元のフレーム数 + エンドスクリーン秒数 × FPS
// 例: 10秒 × 25fps = 250フレーム
durationInFrames={元のフレーム数 + 250}
```

### 2. MainComposition.tsx にエンドスクリーンを追加

#### 画像の場合

```typescript
{/* エンドスクリーン画像（元の最終フレーム以降） */}
{frame >= originalLastFrame && (
  <Img
    src={staticFile("images/overlays/endscreen.png")}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 20,
    }}
  />
)}
```

#### 動画の場合

```typescript
{/* エンドスクリーン動画（元の最終フレーム以降） */}
<Sequence from={originalLastFrame} durationInFrames={endscreenDurationInFrames} layout="none">
  <OffthreadVideo
    src={staticFile("videos/overlays/endscreen.mp4")}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 20,
    }}
  />
</Sequence>
```

> **動画の場合は必ず `<Sequence>` でラップする。** ラップしないと動画が再生されず静止画になる。

#### 動画エンドスクリーンの尺の決め方

```bash
# エンドスクリーン動画の尺を確認
ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1 public/videos/overlays/endscreen.mp4
```

`endscreenDurationInFrames = Math.ceil(動画の尺(秒) × FPS)`

| プロパティ | 値 |
|-----------|-----|
| zIndex | 20（全要素の最前面） |
| アニメーション | なし（パッと表示） |
| objectFit | cover |
| サイズ | 画面全体（100% x 100%） |

### 3. エンドスクリーン表示中の非表示ルール

エンドスクリーン（`frame >= originalLastFrame`）の間、以下の要素を非表示にする:

| 要素 | エンドスクリーン中 |
|------|-------------------|
| HeadingBanner | 非表示 |
| ワイプ | 非表示 |
| テロップ（全種類） | 非表示 |

**実装方法**: 各コンポーネントの表示条件に `frame < originalLastFrame` を追加する。

```typescript
// HeadingBanner / ワイプ / TelopRenderer 内
if (frame >= originalLastFrame) return null; // エンドスクリーン中は非表示
```

`originalLastFrame` は定数として `MainComposition.tsx` の先頭で定義するか、propsで渡す。

※ ED用BGMは step18-bgm で設定する。このステップでは音声は扱わない。

### 4. TypeScriptビルド確認

```bash
npx tsc --noEmit
```

エラーが出た場合は修正してから再実行する。

---

## 完了後

```
Step 18 完了: エンドスクリーンを追加しました。

【設定】
- 素材: public/images/overlays/endscreen.png（または動画）
- 表示秒数: ○秒（○フレーム）
- 元のフレーム数: {N} → 延長後: {N}
- zIndex: 20（最前面）

確認してほしいポイントがあれば教えてね！
→ 調整したい: 表示秒数やタイミングの修正
→ OK: 次のステップ → /step18-bgm（BGM挿入）
```
