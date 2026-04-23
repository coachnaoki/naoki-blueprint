---
name: step12-images
description: イメージ画像をショート動画に挿入する。オーバーレイ（全画面・ランダムアニメーション）/ 顔アイコン（対談動画・固定推奨）の2フェーズ構造。縦動画はインサート部分挿入を使わず全画面のみ。画像生成（Gemini API）にも対応。ユーザーが「画像挿入」「AI画像生成」「話者アイコン」「顔検出」「speaker icon」「ステップ12」と言ったら起動する。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(python3 *), Bash(python3.12 *), Bash(ffmpeg *), Bash(cp *), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step12-images` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 12: イメージ画像挿入（ショート動画）

縦動画の画像挿入は**2フェーズ**で構成される:

| フェーズ | 用途 | 確認事項 |
|---|---|---|
| **1. オーバーレイ画像** | 感情ピークで全画面表示 | デフォルトはランダムアニメーション |
| **2. 顔アイコン** | 対談動画の話者識別 | 固定 or 追従（固定推奨）|

> **縦動画ではインサート画像（部分挿入）は使わない。** 画面幅が狭い縦動画では全画面オーバーレイのみ有効。横動画向けのインサート機能は `.template/.claude/skills/step15-images/` を参照。

## 前提条件
- Step 11（デモ動画挿入）が完了していること

---

## 画像素材の用意（A/B どちらか）

| | 方法 | 詳細リファレンス |
|---|---|---|
| **A. 手動** | 自分で用意した画像を使う | `references/manual.md` |
| **B. AI生成** | Gemini APIで感情ベースに自動生成 | `references/ai-generated.md` |

**画像挿入が不要ならスキップして step13-bgm へ。**

---

# Phase 1: 🎬 オーバーレイ画像（全画面）

`public/images/overlays/` の画像を 1080×1920 全画面で表示。感情ピークで画面を占有し、視覚インパクトを強める。

## Step 1-1: アニメーションをランダム選択（デフォルト）

**画像ごとに3種類からランダム選択**（SE選択と同じシード方式）:
- `zoom` — ゆっくりズームイン
- `slideUp` — 拡大しながらゆっくり上にスライド
- `slideLeft` — 拡大しながらゆっくり左にスライド

```typescript
const OVERLAY_ANIMATIONS = ["zoom", "slideUp", "slideLeft"] as const;

function pickAnimation(startFrame: number, recent: string[] = []): string {
  const pool = OVERLAY_ANIMATIONS.filter(a => !recent.includes(a));
  const candidates = pool.length > 0 ? pool : OVERLAY_ANIMATIONS;
  const seed = (startFrame * 2654435761) >>> 0;
  return candidates[seed % candidates.length];
}
```

## Step 1-2: 個別指定（任意）

ユーザーが「この画像は zoom で固定」等の指定をした場合はそちらを優先。ランダム選択はオーバーライド。

## Step 1-3: 表示ルール

- **表示開始**: 感情ピークのテロップの **startFrame** と同時に表示
- **表示終了**: その感情の流れが続いている間（目安: テロップ2〜4回分、約50〜100フレーム）
- **終了の判断**: 話題が変わる / 感情のトーンが変わる / 次の動画クリップが始まる
- **密度の目安**: ショート動画全体で3〜8枚程度
- **スキップ区間**: 動画クリップ表示中

### NG配置（避けること）
- テロップの内容と画像の意味が合っていない配置
- 同じ感情の画像が連続する（驚き→驚き→驚きなど）
- 動画の後半に偏る、または前半だけに集中する

---

# Phase 2: 🗣️ 顔アイコン（対談動画）

対談動画で話者にアイコンを焼き込む。**対談動画専用**。1人撮影動画では使わない。

## Step 2-1: 固定 or 追従を選択

### デフォルト: **固定配置（推奨）**
- 両話者の顔に常時アイコンを2つ表示
- 処理時間 **ほぼゼロ**（Remotion側で静的に配置）
- 実装が安定・再現性高い

### オプション: 追従（非推奨）
- **transcript に speaker情報（diarization）がある場合のみ可能**
- Whisper / Scribe の標準 transcript には speaker 情報が含まれないため、通常は追従不可
- 追従可能な場合でも **全フレーム処理のため時間がかかる**（10分動画で5〜15分）
- ユーザーが明示的に「追従したい」と言った場合のみ有効化

### 判断フロー
```
transcript に speaker_id / speaker_labels があるか？
├── No → 固定配置（推奨・必然）
└── Yes → ユーザーに確認「処理時間がかかりますが追従しますか？」
        ├── Yes → 追従（references/speaker-icon.md 参照）
        └── No  → 固定配置（推奨）
```

## Step 2-2: 固定配置の実装

縦動画（1080×1920）で両話者のアイコンを画面上部両端に常時表示:

```typescript
{/* 左話者アイコン */}
<Img src={staticFile("images/inserts/speaker_left.png")} style={{
  position: "absolute",
  top: 120, left: 60,
  width: 180, height: 180,
  borderRadius: "50%",
  border: "4px solid #fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 8,
}} />

{/* 右話者アイコン */}
<Img src={staticFile("images/inserts/speaker_right.png")} style={{
  position: "absolute",
  top: 120, right: 60,
  width: 180, height: 180,
  borderRadius: "50%",
  border: "4px solid #fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 8,
}} />
```

## Step 2-3: 追従（オプション・非推奨）

詳細は `references/speaker-icon.md` を参照。`scripts/render_speaker_icon.py` で実装。

顔検出失敗時は前回の位置に留まる（消えない）。

---

## CLAUDE.md準拠ルール

- **z-index**: オーバーレイ画像は 5以下（テロップの下）、顔アイコンは 8（ワイプ同階層）
- **position: absolute** 必須
- **画像表示ルール**: フェードイン/フェードアウトなし。パッと表示してパッと消える
- **縦動画は全画面オーバーレイのみ**（部分インサートは使わない）

---

## 実装リファレンス

### オーバーレイ: ズーム（zoom）
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/overlays/example.jpg")} style={{
    position: "absolute", width: 1080, height: 1920,
    objectFit: "cover", zIndex: 5,
    transform: `scale(${interpolate(frame, [startFrame, endFrame], [1.0, 1.15], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })})`,
  }} />
)}
```

### オーバーレイ: 上スライド（slideUp）
```typescript
transform: `scale(1.15) translateY(${interpolate(frame, [startFrame, endFrame], [20, -20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`,
```

### オーバーレイ: 左スライド（slideLeft）
```typescript
transform: `scale(1.15) translateX(${interpolate(frame, [startFrame, endFrame], [20, -20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`,
```

⚠️ **注意**: `scale(1.15)` は必須。スケールなしでtranslateだけ使うと画面端に余白が出る。
⚠️ **opacityアニメーション禁止**: フェードイン/フェードアウトは使わない。パッと表示して、表示中はスケール+移動のみ。

---

## 画像×テロップの干渉チェック（必須）

| 干渉パターン | 対処法 |
|---|---|
| テロップのendFrameが画像のstartFrameを超えている | テロップのendFrameを画像startFrame - 1 に短縮 |
| 画像の上にテロップが重なり読みにくい | z-indexで解決（画像5以下、テロップ10以上）。それでもダメなら画像endFrameを短縮 |

---

## 完了後

### Phase 1（オーバーレイ）の場合
```
✅ Step 12 完了: イメージ画像を挿入しました。

【挿入一覧】
- f{N}〜f{N}: example.jpg（zoom）「テロップテキスト」
- f{N}〜f{N}: example2.jpg（slideUp）

【アニメーション配分】
- zoom {N}枚 / slideUp {N}枚 / slideLeft {N}枚

【場面照合結果】（AI生成の場合）
- 全{N}枚が発話内容と一致 ✓
- 不一致で再生成した画像: {N}枚

→ OK: 次のステップ → /step13-bgm（BGM挿入）
```

### Phase 2（話者アイコン）の場合
```
✅ Step 12 完了: 話者アイコンを配置しました。

【設定】
- モード: 固定配置 / 追従
- {追従の場合} バックアップ: public/videos/main/<動画名>_cut_backup.mp4

→ OK: 次のステップ → /step13-bgm（BGM挿入）
```
