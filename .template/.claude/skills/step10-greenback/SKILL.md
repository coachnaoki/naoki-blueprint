---
name: step10-greenback
description: グリーンバック動画の背景を画像に置換する。クロマキー処理で緑色を透過し、背景画像を合成する。ユーザーが「グリーンバック」「クロマキー」「背景置換」「greenback」「ステップ10」と言ったら起動する。
argument-hint: [背景画像パス（省略時はpublic/images/overlays/内を確認）]
allowed-tools: Read, Write, Edit, Glob, Bash(ls *), Bash(ffmpeg *), Bash(npx tsc *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 11: グリーンバック背景置換（任意）

ライブ動画がグリーンバック撮影の場合、背景を画像に置換する。

## 前提条件
- Step 10（コンポジション構築・登録）が完了していること
- 元動画がグリーンバックで撮影されていること
- 背景画像が `public/images/overlays/` に配置されていること

## スキップ条件
- グリーンバック撮影でない場合はスキップ → step11-videos へ

## やること

### 1. グリーンバックの確認

元動画のフレームを取得して確認する：
```bash
ffmpeg -i public/videos/main/input_cut.mp4 -ss 5 -frames:v 1 -update 1 -q:v 2 /tmp/greenback_check.jpg
```

### 2. 背景画像の確認

```bash
ls -la public/images/overlays/background*
```

### 3. MainComposition.tsx にクロマキー処理を追加

Remotionでは CSS/Canvas ベースのクロマキーは使えないため、**ffmpegで事前に透過動画を生成する方式**を使う。

#### Step 3-1: ffmpegでグリーンバックを透過に変換

```bash
ffmpeg -i public/videos/main/<メイン動画>_cut.mp4 \
  -vf "chromakey=0x00FF00:0.3:0.1" \
  -c:v png -pix_fmt rgba \
  public/videos/main/<メイン動画>_cut_alpha.mov
# ※ メイン動画のファイル名は video-context.md の「動画ファイル」セクションを参照
```

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `chromakey` の色 | `0x00FF00` | 標準的なグリーン。撮影環境に応じて調整 |
| 類似度（similarity） | `0.3` | 0.01〜1.0。大きいほど広い範囲の緑を透過。デフォルト0.3で試す |
| ブレンド（blend） | `0.1` | 境界のなめらかさ。0.0=くっきり、0.2=なめらか |

**グリーンの色が合わない場合**: 動画フレームからスポイトで実際の緑色のHEXコードを取得し、`0x00FF00` を差し替える。

#### Step 3-2: MainComposition.tsx に背景+透過動画を配置

```typescript
// 背景画像（最背面）
<Img
  src={staticFile("images/overlays/background.jpg")}
  style={{
    position: "absolute", top: 0, left: 0,
    width: 1920, height: 1080,
    objectFit: "cover", zIndex: 0,
  }}
/>

// 透過動画（背景の上に重ねる）
<OffthreadVideo
  src={staticFile("videos/main/input_cut_alpha.mov")}
  style={{
    position: "absolute", top: 0, left: 0,
    width: 1920, height: 1080,
    objectFit: "cover", zIndex: 1,
  }}
  transparent
/>
```

⚠️ `transparent` propが必要。これがないとアルファチャンネルが無視される。

#### Step 3-3: 透過がうまくいかない場合の調整

| 問題 | 対処 |
|------|------|
| 緑が残る | similarity を 0.4〜0.5 に上げる |
| 人物の端が透けすぎる | similarity を 0.2 に下げる / blend を 0.15 に上げる |
| 髪の毛の縁が緑がかる | blend を 0.05 に下げる |
| そもそも緑が透過されない | `chromakey` の色コードを撮影時の実際の緑に合わせる |

### 4. 確認用スクショ

```bash
npx remotion still MainComposition --frame=100 debug-greenback.png
```

確認後削除：
```bash
rm debug-greenback.png
```

### 5. TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

## 完了後

```
✅ Step 11 完了: グリーンバック背景を置換しました。

【設定】
- 背景画像: public/images/overlays/background.jpg

次のステップ → /step11-videos（デモ動画の重ね表示）
進めますか？
```
