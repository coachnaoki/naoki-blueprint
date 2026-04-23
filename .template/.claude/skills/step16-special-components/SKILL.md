---
name: step16-special-components
description: BulletList・CTA（LINE/チャンネル登録）・HeadingBanner・ThemeTelopをMainComposition.tsxに実装する。他の視覚要素（スライド・画像・動画クリップ）が確定した後に行う。ユーザーが「特殊コンポーネント」「bullet_list」「CTA」「ThemeTelop」「HeadingBanner」「ステップ16」と言ったら起動する。
argument-hint: [実装するコンポーネント名（省略時は全て実装）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(node scripts/_chk.mjs *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step16-special-components` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 17: 特殊コンポーネント実装

BulletList・CTA（LINE誘導/チャンネル登録）・HeadingBanner・ThemeTelopをMainComposition.tsxに実装する。

## 前提条件
- Step 16（画像挿入）が完了していること

## なぜこのタイミングか？

これらのコンポーネントは、他のすべての視覚要素（スライド・画像・動画クリップ）の配置が確定してから実装する必要がある。理由:
- **BulletList**: 表示中はスライド・ワイプ・動画クリップを非表示にする必要があるため、それらのフレーム範囲が確定していないと条件を書けない
- **HeadingBanner**: 全画面コンテンツ（スライド・画像・動画クリップ）表示中は非表示にするため、全画面要素の一覧が必要
- **CTA**: 画像エリア中央に配置するため、画像の配置が確定していないと位置が決まらない
- **ThemeTelop**: 他の要素と重複しないことを確認してから配置する

---

## BulletList（箇条書きリスト）

### ユーザーに確認すること

step13のスライド候補選定と同様に、ユーザーに確認する:
1. **BulletListを使う箇所があるか？**
2. **ある場合、どの発話区間に入れるか？**（ユーザー指定 or AIが提案）

### デザイン仕様

| プロパティ | 値 |
|-----------|-----|
| 背景 | `#F7F4F4` |
| フォント | `'Noto Sans JP', sans-serif` |
| fontSize | 76 |
| fontWeight | 900 |
| 現在の項目の色 | 赤 `#CC3300` |
| その他の項目の色 | 青 `#4B6AC6` |
| 位置 | 画面中央（left: 960, top: 540, transform: translate(-50%, -50%)) |
| zIndex | 10 |

### 表示ルール

- 各項目は**フェードなし（即表示）** - 読み上げた瞬間にパッと表示
- **全項目が常に表示され、現在読み上げ中の項目だけ赤（#CC3300）、それ以外は青（#4B6AC6）**
- 連番付き項目（①②③）の場合は `●` マーカー不要
- ダークオーバーレイ: `rgba(0,0,0,0.4)` を zIndex: 7 で表示

### BulletList表示中の非表示ルール

| 要素 | BulletList中 |
|------|-------------|
| スライド | 非表示 |
| ワイプ | 非表示 |
| 動画クリップ | 非表示 |
| ベース動画 | **表示**（オーバーレイの下に見える） |
| bullet_list テロップ | 表示 |
| theme テロップ | 表示 |
| その他のテロップ | **非表示** |

### 非表示の実装方法

TelopRenderer呼び出し時に `bulletListVisible` フラグをチェックし、対象外のテロップを非表示にする。

```typescript
// TelopRenderer内
const bulletListVisible = frame >= bulletStart && frame <= bulletEnd;

if (bulletListVisible &&
    telop.template !== "bullet_list" &&
    telop.template !== "theme") {
  return null; // 非表示
}
```

---

## CTA（LINE誘導・チャンネル登録）

### LINE CTA

| プロパティ | 値 |
|-----------|-----|
| 位置 | 画像エリア中央（left: 540, top: 571, transform: translate(-50%, -50%)) |
| 背景色 | LINE緑 `#06C755` |
| 文字色 | 白 |
| fontSize | 99 |
| フォント | `'M PLUS Rounded 1c', sans-serif` |
| zIndex | 10 |

### Subscribe CTA（チャンネル登録）

| プロパティ | 値 |
|-----------|-----|
| 位置 | 画像エリア中央（left: 540, top: 571, transform: translate(-50%, -50%)) |
| 背景色 | 赤 `#EF4444` |
| 文字色 | 白 |
| fontSize | 72 |
| フォント | `'M PLUS Rounded 1c', sans-serif` |
| プレフィックス | `▶` |
| zIndex | 10 |

### CTAアニメーション（共通）

左からスライドイン（10フレーム）:
```typescript
const slideIn = interpolate(frame, [startFrame, startFrame + 10], [-40, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});

style={{
  transform: `translate(-50%, -50%) translateX(${slideIn}px)`,
  opacity,
}}
```

---

## HeadingBanner（見出しバナー）

### デザイン仕様

| プロパティ | 値 |
|-----------|-----|
| 位置 | 左上（top: 30〜50px, left: 0） |
| 背景 | 緑〜ティールのグラデーション（transform: skewX で斜め） |
| 文字色 | 白、太字 |

### 表示タイミング

- **表示開始**: 自己紹介・テーマ発表の後から
- **表示終了**: 動画の本編全体を通して表示

### 非表示条件

以下の条件のいずれかに該当するフレームでは非表示にする:
- CTAシーン（LINE誘導・チャンネル登録）表示中（※必須ではなく「非表示にしてもよい」。CTAのデザインと相性が悪い場合のみ非表示にする）
- **全画面コンテンツ表示中**:
  - 全画面スライド
  - 全画面画像
  - 全画面動画クリップ
- BulletList表示中

---

## ThemeTelop（今回のテーマ）

### 使用制限（最重要）
**動画全体で1回のみ使用する。冒頭のテーマ紹介でのみ使う。**

### デザイン仕様

| プロパティ | 値 |
|-----------|-----|
| 背景 | 白背景バー |
| ラベル | 「Today's theme」+ 紫ライン |
| フォント | `'Noto Sans JP', sans-serif` |
| fontSize | 108 |
| fontWeight | 900 |
| fontStyle | italic |
| 文字色 | 紫 `#5B6BBF` |
| 文字縁取り | `WebkitTextStroke: "10px white"` |

### アニメーション

下からスライドイン / 下へスライドアウト（各10フレーム）:
```typescript
// スライドイン
const slideIn = interpolate(frame, [startFrame, startFrame + 10], [100, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
// スライドアウト
const slideOut = interpolate(frame, [endFrame - 10, endFrame], [0, 100], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
```

### 次のテロップのキャンセル（必須）

**themeの次のテロップはキャンセルして、themeの表示時間を延長する。**

1. themeの `endFrame` を、次のテロップの `endFrame` まで延長する
2. 次のテロップエントリを `telopData.ts` から削除する

**理由**: テーマを長く見せることで、動画全体のテーマが視聴者の印象に残りやすくなる。themeが短すぎると印象が弱くなる。

### SE
- `se/ポジティブ/` からランダム選択（startFrameをシードにした疑似乱数）
- volume: 0.1

---

## TypeScriptビルド確認

すべてのコンポーネント実装後に実行:

```bash
npx tsc --noEmit
```

エラーが出た場合は修正してから再実行する。

---

## 完了後

```
Step 17 完了: 特殊コンポーネントを実装しました。

【実装一覧】
- BulletList: f{N}〜f{N}（○箇所）
- LINE CTA: f{N}〜f{N}
- Subscribe CTA: f{N}〜f{N}
- HeadingBanner: f{N}〜f{N}（全画面非表示条件: ○箇所）
- ThemeTelop: f{N}〜f{N}（1回のみ）

確認してほしいポイントがあれば教えてね！
→ 調整したい: フレーム範囲やデザイン修正
→ OK: 次のステップ → /step17-endscreen（エンドスクリーン）
```
