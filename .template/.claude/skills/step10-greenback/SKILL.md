---
name: step10-greenback
description: グリーンバック動画の背景を画像に置換する。均一な緑はffmpeg chromakey、色ムラ・照明ムラのある素人撮影は rembg u2net AI で処理する。ユーザーが「グリーンバック」「クロマキー」「背景置換」「greenback」「ステップ10」と言ったら起動する。
argument-hint: [背景画像パス（省略時はpublic/images/overlays/内を確認）]
allowed-tools: Read, Write, Edit, Glob, Bash(ls *), Bash(ffmpeg *), Bash(ffprobe *), Bash(npx tsc *), Bash(node *), Bash(python *), Bash(pip *), Bash(.venv/*)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step10-greenback` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 10: グリーンバック背景置換（任意）

ライブ動画がグリーンバック撮影の場合、背景を画像に置換する。**グリーンバックの品質に応じて2つの方式を選択**する。

## 前提条件
- Step 09（コンポジション構築・登録）が完了していること
- 元動画がグリーンバックで撮影されていること
- 背景画像が `public/images/overlays/` に配置されていること

## スキップ条件
- グリーンバック撮影でない場合はスキップ → step11-videos へ

---

## やること

### 1. グリーンバック素材の品質チェック（必須）

元動画のフレーム1枚を取得し、背景4隅の緑色をサンプリングして均一度を判定する。

```bash
# 元動画のフレーム抽出（2秒地点）
ffmpeg -y -ss 2 -i public/videos/main/input_cut.mp4 -frames:v 1 /tmp/greenback_check.png

# 動画の解像度確認
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 public/videos/main/input_cut.mp4
```

Pythonで4隅の色をサンプリング:

```python
from PIL import Image
img = Image.open("/tmp/greenback_check.png").convert("RGB")
w, h = img.size
samples = [
    ("左上", 50, 50),
    ("右上", w-50, 50),
    ("左下", 50, h-50),
    ("右下", w-50, h-50),
]
for label, x, y in samples:
    r, g, b = img.getpixel((x, y))
    print(f"{label}: #{r:02X}{g:02X}{b:02X}  (R={r} G={g} B={b})")
```

**判定基準**: 4隅の緑色の RGB 差が大きいほど「ムラあり」。

| 判定 | 採用手法 | 処理時間 |
|------|---------|---------|
| **均一（RGB差 < 20）** | A: ffmpeg chromakey | 10秒 |
| **ムラあり（RGB差 ≥ 20）** | **B: rembg u2net パイプライン** | 4.5分/1080p・10秒動画 |

⚠️ **自宅撮影・布のグリーンバックは基本「ムラあり」**。迷ったら B を選ぶ。

---

### 2. 背景画像の確認

```bash
ls -la public/images/overlays/background*
```

---

### 3A. 均一な緑（ffmpeg chromakey 方式）

#### Step A-1: 実際の緑色を指定してアルファ動画生成

上のサンプリングで取得した最も均一な緑色（例: `#65DC08`）を `chromakey` のHEXに指定する。デフォルトの `0x00FF00`（純緑）は実際の撮影緑と合わず人物まで削れるので**必ず実色を使う**。

```bash
ffmpeg -i public/videos/main/input_cut.mp4 \
  -vf "chromakey=0x65DC08:0.15:0.1" \
  -c:v png -pix_fmt rgba \
  public/videos/main/input_cut_alpha.mov
```

| パラメータ | 推奨値 | 説明 |
|-----------|--------|------|
| `chromakey` の色 | 実フレームからサンプリング | 撮影環境に応じて調整 |
| 類似度（similarity） | **0.12〜0.15** | 均一な緑なら狭くて十分 |
| ブレンド（blend） | 0.1 | 境界のなめらかさ |

#### Step A-2: MainComposition.tsx に背景+透過動画を配置

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

⚠️ `transparent` prop 必須。これがないとアルファチャンネルが無視される。

#### Step A-3: chromakeyの微調整（必要なら）

| 問題 | 対処 |
|------|------|
| 緑が残る | similarity を 0.2 に上げる |
| 人物の端が透けすぎる | **まず色HEXが合っているか再確認**。合っていれば similarity を 0.1 に下げる |
| 緑が全く透過されない | 色HEXが実際の緑と違う。サンプリングからやり直す |
| 全体が半透明に見える | 色HEXが実際の緑と違う（典型的には `0x00FF00` を指定している）|

**それでも解決しない場合は方式Bに切り替える。**

---

### 3B. ムラあり・素人撮影（rembg u2net パイプライン）

AIセグメンテーション(`rembg` の `u2net`モデル) で人物マスクを生成し、境界の緑を段階的にdespillして合成する。ffmpeg chromakeyでは絶対に対処できない照明ムラ・布シワ・色ムラでもキレイに抜ける。

#### Step B-1: 依存関係のインストール（初回のみ）

```bash
# venv 作成（既にあればスキップ）
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install "rembg[cpu]" opencv-python pillow
```

初回実行時に u2net.onnx (~170MB) が `~/.u2net/` に自動ダウンロードされる。

#### Step B-2: greenback.py を実行して合成MP4を生成

```bash
.venv/bin/python scripts/greenback.py \
  public/videos/main/input_cut.mp4 \
  public/images/overlays/background.jpg \
  public/videos/main/input_cut_greenback.mp4
```

**出力**: 背景を埋め込んだMP4（アルファチャンネルではなくBG合成済み）。

**進捗表示例:**
```
入力: 1920x1080@59.94 604frames  model=u2net  edge_px=3
  60/604 (2.3fps, ETA 236s)
  ...
完了: 604フレーム / 262.5秒 → public/videos/main/input_cut_greenback.mp4
```

#### Step B-3: MainComposition.tsx で合成動画に差し替え

`OffthreadVideo` の `src` を元動画から greenback 合成動画に差し替える。背景画像や `transparent` prop は不要。

```typescript
// BEFORE
<OffthreadVideo src={staticFile("videos/main/input_cut.mp4")} ... />

// AFTER
<OffthreadVideo src={staticFile("videos/main/input_cut_greenback.mp4")} ... />
```

※方式Aと違って背景画像`<Img>`タグは追加しない（MP4に埋め込まれているため）。

#### Step B-4: パラメータ微調整（ほぼ不要）

greenback.py のコマンドライン引数:

```bash
.venv/bin/python scripts/greenback.py <入力> <背景> <出力> [モデル] [境界px]
```

| 引数 | デフォルト | 使い時 |
|------|-----------|--------|
| モデル | `u2net` | 髪の細部までシャープにしたい → `isnet-general-use`（ただし処理時間4倍） |
| 境界px | `3` | 緑フリンジが残る → `5` に広げる / 頬などに黒筋 → `2` に狭める |

---

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

---

## 完了後

```
✅ Step 10 完了: グリーンバック背景を置換しました。

【採用方式】: A (ffmpeg chromakey) / B (rembg u2net)
【背景画像】: public/images/overlays/background.jpg
【出力動画】: public/videos/main/input_cut_{alpha.mov|greenback.mp4}

次のステップ → /step11-videos（デモ動画の重ね表示）
進めますか？
```
