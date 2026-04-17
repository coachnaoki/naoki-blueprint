---
name: step12-images
description: イメージ画像をショート動画に挿入する。画像生成（Gemini API）にも対応。全画面表示と話者アイコン（対談動画用）に対応。ユーザーが「画像挿入」「AI画像生成」「話者アイコン」「顔検出」「speaker icon」「ステップ12」と言ったら起動する。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(python3 *), Bash(python3.12 *), Bash(ffmpeg *), Bash(cp *), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 12: イメージ画像挿入

発話内容に合わせてイメージ画像を挿入する。

## 前提条件
- Step 11（デモ動画挿入）が完了していること

---

## フロー分岐: 画像をどうするか？

ユーザーに確認し、該当する詳細ガイドを読む:

| ルート | 用途 | 詳細リファレンス |
|---|---|---|
| **A. 手動画像挿入** | 自分で用意した画像を使う | `references/manual.md` |
| **B. AI画像生成 + 挿入** | Gemini APIで感情ベースに自動生成 | `references/ai-generated.md` |
| **C. 話者アイコン** | 対談動画で顔に追従するアイコン | `references/speaker-icon.md` |

**不要ならスキップしてstep13-bgmへ。**

---

## 表示ルール（全画面画像・A/B共通）

- **表示開始**: 感情ピークのテロップの **startFrame** と同時に表示
- **表示終了**: その感情の流れが続いている間（目安: テロップ2〜4回分、約50〜100フレーム）
- **終了の判断**: 話題が変わる / 感情のトーンが変わる / 次の動画クリップが始まる、のいずれか
- **密度の目安**: ショート動画全体で3〜8枚程度

### 配置のガイドライン

1. telopData.ts で感情ピークのテロップを特定（startFrame を取得）
2. そのテロップの startFrame = 画像の表示開始
3. 同じ感情の流れが続くテロップ群の最後の endFrame = 画像の表示終了
4. 動画クリップ表示中は画像を入れない
5. 動画全体にバランスよく分散させる

### NG配置（避けること）

- テロップの内容と画像の意味が合っていない配置
- 同じ感情の画像が連続する（驚き→驚き→驚きなど）
- 動画の後半に偏る、または前半だけに集中する

---

## CLAUDE.md準拠ルール

- **z-index**: 画像は5以下（テロップの下）
- **position: absolute** 必須
- **画像表示ルール**: フェードイン/フェードアウトなし。パッと表示してパッと消える
- **縦動画は全画面のみ**（左側挿入は横動画専用なので使わない）

---

## 実装リファレンス（A/B共通）

### 全画面: ズーム（zoom）
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/example.jpg")} style={{
    position: "absolute", width: 1080, height: 1920,
    objectFit: "cover", zIndex: 5,
    transform: `scale(${interpolate(frame, [startFrame, endFrame], [1.0, 1.15], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })})`,
  }} />
)}
```

### 全画面: 上スライド（slideUp）
```typescript
transform: `scale(1.15) translateY(${interpolate(frame, [startFrame, endFrame], [20, -20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`,
```

### 全画面: 左スライド（slideLeft）
```typescript
transform: `scale(1.15) translateX(${interpolate(frame, [startFrame, endFrame], [20, -20], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
})}px)`,
```

⚠️ **注意**: `scale(1.15)` は必須。スケールなしでtranslateだけ使うと画面端に余白が出る。
⚠️ **opacityアニメーション禁止**: フェードイン/フェードアウトは使わない。パッと表示して、表示中はスケール+移動のみ。

---

## 画像×テロップの干渉チェック（必須）

画像挿入後、テロップとの時間的な重なりを確認して対処する。

| 干渉パターン | 対処法 |
|---|---|
| テロップのendFrameが画像のstartFrameを超えている | テロップのendFrameを画像startFrame - 1 に短縮 |
| 画像の上にテロップが重なり読みにくい | z-indexで解決（画像5以下、テロップ10以上）。それでもダメなら画像endFrameを短縮 |

---

## 完了後

### A/B の場合
```
✅ Step 12 完了: イメージ画像を挿入しました。

【挿入一覧】
- f{N}〜f{N}: example.jpg「テロップテキスト」感情タグ
- f{N}〜f{N}: example2.jpg（全画面・ズーム）

【場面照合結果】（AI生成の場合）
- 全{N}枚が発話内容と一致 ✓
- 不一致で再生成した画像: {N}枚

→ OK: 次のステップ → /step13-bgm（BGM挿入）
```

### C（話者アイコン）の場合
```
✅ Step 12 完了: 話者アイコンを焼き込みました。

【設定】
- 対象話者: {left/right}
- アイコン: {ファイル名}（{size}px）
- バックアップ: public/main/<動画名>_cut_backup.mp4

→ OK: 次のステップ → /step13-bgm（BGM挿入）
```
