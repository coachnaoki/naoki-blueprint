---
name: step15-images
description: イメージ画像を感情ベースで動画に挿入する。画像生成（Gemini API）にも対応。感情が動く瞬間に配置。全画面表示・左側挿入・話者アイコン（対談動画用）に対応。ユーザーが「画像挿入」「AI画像生成」「話者アイコン」「ステップ15」と言ったら起動する。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(python3 *), Bash(python3.12 *), Bash(ffmpeg *), Bash(cp *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 16: イメージ画像挿入

発話内容に合わせてイメージ画像を挿入する。

## 前提条件
- Step 15（ワイプ位置調整）が完了していること

---

## フロー分岐: 画像をどうするか？

ユーザーに確認する：

1. **画像を自分で用意する** → [A. 手動画像挿入](#a-手動画像挿入) へ
2. **AIで画像を生成する** → [B. AI画像生成 + 挿入](#b-ai画像生成--挿入) へ
3. **対談動画の話者にアイコンを載せたい** → [C. 話者アイコン](#c-話者アイコン対談動画用) へ

---

## A. 手動画像挿入

画像ファイルが `public/images/` に配置されている前提。

### ユーザーに確認すること（必須）

各画像について以下を必ずユーザーに質問してから作業を開始する：

1. **どの区間に入れるか**（台本のどこからどこまで）
2. **表示方法**: 全画面 or 左側挿入（**毎回必ず確認する**）
3. **全画面の場合 — アニメーション**:
   - `zoom` — ゆっくりズームイン（Ken Burns風）
   - `slideUp` — 拡大しながらゆっくり上にスライド
   - `slideLeft` — 拡大しながらゆっくり左にスライド

### やること

1. `ls -la public/images/` で画像素材を確認
2. `transcript_words.json` でユーザーが指定した区間の正確なフレームを特定
3. MainComposition.tsx に追加
4. **全画面の場合**: 見出しバナー・ワイプの非表示条件にフレーム範囲を追加
5. テロップとの重複チェック（z-index確認）
6. `npx tsc --noEmit` でコンパイル確認

→ [表示ルール](#表示ルール) と [実装リファレンス](#実装リファレンス) を参照

---

## B. AI画像生成 + 挿入

Gemini API で場面に合った画像を自動生成し、**感情ベース**で挿入する。

### 前提
- `pip install google-genai Pillow` 済み

### 0-A. Gemini APIキー設定（初回のみ・自動セットアップ）

**作業開始前に、必ずAPIキーが設定されているかチェックする。** 設定されていなければユーザーと対話して自動で `.env` を作成する。

#### 手順

1. **既存設定のチェック**
   Bashで以下を実行：
   ```bash
   if [ -f .env ] && grep -q "^GEMINI_API_KEY=." .env; then
     echo "OK: .env に GEMINI_API_KEY が設定済み"
   elif [ -n "$GEMINI_API_KEY" ]; then
     echo "OK: 環境変数 GEMINI_API_KEY が設定済み"
   else
     echo "NG: 未設定"
   fi
   ```

2. **未設定なら、ユーザーに以下をそのまま聞く**（コピペ可）:
   > Gemini APIキーがまだ設定されていません。以下の手順でキーを取得して、このチャットに貼り付けてください。
   >
   > **キーの取得方法:**
   > 1. https://aistudio.google.com/apikey を開く
   > 2. Googleアカウントでログイン
   > 3. 「Create API key」をクリック
   > 4. 表示されたキー（`AIza...` で始まる長い文字列）をコピー
   >
   > コピーしたキーをそのままこのチャットに貼り付けてください。僕が `.env` ファイルを自動で作成します。

3. **キーを受け取ったら、`.env` ファイルを自動作成**
   Writeツールで `.env` を作成：
   ```
   GEMINI_API_KEY=ユーザーから受け取ったキー
   ```
   作成後、ユーザーに「✅ `.env` を作成しました。これで画像生成が使えます」と報告する。

4. **キーの形式チェック（簡易）**
   - `AIza` で始まらない / 30文字未満 → 「キーの形式が正しくない可能性があります。もう一度確認してください」と返す
   - それ以外 → OK とみなして次へ

> **なぜ自動化するのか:** `.env` ファイルは先頭ドットのため Finder/Explorer で見えにくく、手動作成でつまずく人が多い。Claude Code が肩代わりすることで、ユーザーは「キーをコピペするだけ」で済む。

### 0-B. 最新モデルの設定（必須）

`scripts/generate-images.py` の `MODEL` が空の場合、最新の画像生成モデルを設定する。

1. https://ai.google.dev/gemini-api/docs/models をWebSearchまたはWebFetchで確認
2. 画像生成対応のFlashモデル（`gemini-*-flash-image*`）の最新IDを取得
3. `scripts/generate-images.py` の `MODEL = ""` を最新モデルIDに更新

```python
# 例（2026年4月時点）
MODEL = "gemini-3.1-flash-image-preview"
```

> **なぜ毎回確認するのか:** Gemini APIのモデルは頻繁に更新される。テンプレート配布時点のモデルが廃止されている場合があるため、実行時に最新を確認する。

### やること

#### 1. 感情ピークの特定

`telopData.ts` と `transcript_words.json` を読み、**視聴者の感情が動く瞬間**をピックアップする。

**画像を入れるべき感情の例：**
- 😟 困惑・挫折（「多すぎる」「分からない」「できない」）
- 😲 驚き・感動（「すごい」「信じられない」「自動で」）
- 😢 不安・危機感（「なくなる」「失う」「独立したら」）
- 🤝 共感・告白（「実は〜です」「皆さんも〜ですよね」）
- ✨ 希望・可能性（「ゼロからできる」「誰でも」「未来」）
- 🎯 理解・整理（「つまり」「整理すると」「ファミリー」）

**ピックアップの手順：**
1. telopData.ts のテロップテキストを通読する
2. 感情が動くテロップを10〜15個マークする
3. 以下を除外する：
   - スライド表示中の区間（slideTimeline.ts で slideNumber > 0）
   - 動画クリップ表示中の区間（MainComposition.tsx の `<OffthreadVideo>`）
   - BulletList表示中の区間
4. 残ったものから、動画全体にバランスよく分散するよう選ぶ（偏らないように）

#### 2. 画像プロンプトの作成

各感情ピークに合う画像プロンプト（英語）を作成する。

**プロンプトのルール:**
- 英語で書く（英語の方が品質が高い）
- 末尾に必ず `no text no words no letters` を追加 — 動画には既にテロップや字幕が入るため、画像内に文字があると競合して読みにくくなる。特にAI画像はランダムな意味不明文字列を生成しがち
- 発話の内容・感情・トーンに合わせる
- **テロップの「意味」と画像の「内容」が明確に対応すること**（抽象的すぎるNG）

#### 3. 画像を一括生成

`scripts/generate-images.py` の `IMAGES` リストを更新して実行：

```bash
python3 scripts/generate-images.py
```

出力先: `public/images/generated/`

#### 4. 画像の確認・場面照合

生成された画像を1枚ずつ確認し、発話内容と照合する：
- そのフレームのテロップテキストを表示
- 画像の内容がテロップの感情・意味とマッチしているか判定
- **不一致の場合はプロンプトを修正して再生成**（既存ファイルを削除してからスクリプト再実行）
- **「ギリOK」は NG** — 明確にマッチしていなければ再生成する

#### 5. MainComposition.tsx に挿入

→ [表示ルール](#表示ルール) に従って挿入

#### 6. コンパイル確認

```bash
npx tsc --noEmit
```

---

## 表示ルール

### 左側挿入画像（感情ベース配置）

- **表示開始**: 感情ピークのテロップの **startFrame** と同時に表示
- **表示終了**: その感情の流れが続いている間（目安: テロップ2〜4回分、約100〜150フレーム）
- **終了の判断**: 話題が変わる / 感情のトーンが変わる / 次のスライドや動画クリップが始まる、のいずれか
- **密度の目安**: 動画全体で8〜15枚程度。多すぎると邪魔、少なすぎると単調

### 配置のガイドライン

```
1. telopData.ts で感情ピークのテロップを特定（startFrame を取得）
2. そのテロップの startFrame = 画像の表示開始
3. 同じ感情の流れが続くテロップ群の最後の endFrame = 画像の表示終了
4. スライド・動画クリップ・BulletList表示中は画像を入れない
5. 動画全体にバランスよく分散させる（冒頭・中盤・終盤に偏りなく）
```

### NG配置（避けること）

- テロップの内容と画像の意味が合っていない配置
- 同じ感情の画像が連続する（驚き→驚き→驚きなど）
- 動画の後半に偏る、または前半だけに集中する

---

## CLAUDE.md準拠ルール

- **z-index**: 画像は5以下（テロップの下）
- **position: absolute** 必須
- **画像表示ルール**: フェードイン/フェードアウトなし。パッと表示してパッと消える（左側挿入の場合）
- **全画面画像の表示中は見出しバナーとワイプを非表示にする**

---

## 実装リファレンス

### 左側挿入（固定位置・アニメーションなし）

位置は以下の固定値を使用する（変更不可）：

```typescript
{frame >= startFrame && frame <= endFrame && !slideVisible && (
  <Img src={staticFile("images/generated/example.jpg")} style={{
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

### 全画面: ズーム（zoom）
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/example.jpg")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
    transform: `scale(${interpolate(frame, [startFrame, endFrame], [1.0, 1.15], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })})`,
  }} />
)}
```

### 全画面: 上スライド（slideUp）
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/example.jpg")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
    transform: `scale(1.15) translateY(${interpolate(frame, [startFrame, endFrame], [20, -20], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })}px)`,
  }} />
)}
```

### 全画面: 左スライド（slideLeft）
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/example.jpg")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
    transform: `scale(1.15) translateX(${interpolate(frame, [startFrame, endFrame], [20, -20], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })}px)`,
  }} />
)}
```

⚠️ **注意**: `scale(1.15)` は必須。スケールなしでtranslateだけ使うと画面端に余白が出る。
⚠️ **opacityアニメーション禁止**: フェードイン/フェードアウトは使わない。パッと表示して、表示中はスケール+移動のみ。

### 全画面画像表示中のルール

全画面画像が表示されている間は、見出しバナーとワイプが画像の上に重なって邪魔になるため非表示にする。

**実装方法**: HeadingBanner / ワイプコンポーネントに全画面画像のフレーム範囲を渡して条件分岐する。

```typescript
// HeadingBanner / ワイプコンポーネント内
const fullscreenImageRanges = [
  { start: 1200, end: 1350 },
  { start: 2400, end: 2580 },
  // ... 全画面画像の全範囲をここに列挙
];
if (fullscreenImageRanges.some(r => frame >= r.start && frame <= r.end)) {
  return null; // 非表示
}
```

### 画像×テロップの干渉チェック（必須）

画像挿入後、テロップとの時間的な重なりを確認して対処する。

| 干渉パターン | 対処法 |
|---|---|
| テロップのendFrameが画像のstartFrameを超えている | テロップのendFrameを画像startFrame - 1 に短縮 |
| 画像の上にテロップが重なり読みにくい | z-indexで解決（画像5以下、テロップ10以上）。それでもダメなら画像endFrameを短縮 |

---

## C. 話者アイコン（対談動画用）

対談動画で、指定の話者の顔にアイコン画像を追従させて焼き込む。YuNet顔検出で自動追従し、滑らかに移動する。

**対談動画専用。通常の1人撮影動画では使わない。**

### 前提
- `pip install opencv-python Pillow` 済み（README.md 参照）
- `models/face_detection_yunet_2023mar.onnx` が存在すること
- カット済み動画 (`public/main/*_cut.mp4`) が存在すること

### ユーザーに確認すること（必須）

1. **どちらの話者にアイコンを載せるか**: `left`（画面左）or `right`（画面右）
2. **アイコン画像のパス**: `public/images/` に配置してもらう
3. **アイコンサイズ**: デフォルト 440px（変更したい場合のみ聞く）
4. **位置微調整が必要か**: デフォルトのオフセットで問題なければスキップ

### やること

#### 1. フレーム抽出で顔検出を確認

```bash
ffmpeg -ss 5 -i public/main/<動画名>_cut.mp4 -frames:v 1 -q:v 2 /tmp/speaker_check.jpg
python3.12 scripts/detect_face_center.py /tmp/speaker_check.jpg
```

**必ず `count: 2` 以上であることを確認する。** 1人しか検出されない場合、`--side` 判定により全フレームでアイコンが表示されない。別の秒数でフレームを再取得するか、`--score 0.3` でしきい値を下げて再試行する。

#### 2. スクリプト実行

```bash
python3.12 scripts/render_speaker_icon.py public/images/<アイコン>.png --side right
```

**主要オプション:**

| オプション | デフォルト | 説明 |
|---|---|---|
| `--side` | （必須） | left / right |
| `--size` | 440 | アイコンサイズ(px) |
| `--smooth` | 0.06 | 追従の滑らかさ(0.01=遅い, 0.2=速い) |
| `--head-offset` | 0.35 | 顔中心→頭中心への補正比率 |
| `--down-shift` | 0.125 | 下方向シフト(サイズ比) |
| `--right-shift` | 0.125 | 右方向シフト(サイズ比) |
| `--detect-every` | 3 | 何フレームごとに顔検出 |
| `--video` | 自動検出 | 入力動画パス（省略時は `public/main/` 内の `_cut.mp4` を使用） |

スクリプトは以下を自動で行う:
1. 元動画を `*_backup.mp4` にバックアップ（**初回のみ。2回目以降は元のバックアップを保持するため何度でもやり直し可能**）
2. 全フレームを処理してアイコンを焼き込み
3. 音声をバックアップから結合
4. 元のファイル名で上書き

**処理時間の目安:** 10分の動画で約5〜15分。全フレームを処理するため時間がかかる。

**顔検出失敗時の挙動:** 顔が検出されないフレームではアイコンは前回の位置に留まる（消えない）。TypeScript変更なし、`npx tsc` チェック不要。

#### 3. 確認

Remotion Studio で対談動画を再生し、アイコンの位置・動きを確認する。

#### やり直したい場合

バックアップから復元して再実行:
```bash
cp public/main/<動画名>_cut_backup.mp4 public/main/<動画名>_cut.mp4
python3.12 scripts/render_speaker_icon.py public/images/<アイコン>.png --side right --size 330
```

---

## 完了後

### A/B の場合
```
✅ Step 16 完了: イメージ画像を挿入しました。

【挿入一覧】
- f{N}〜f{N}: example.jpg「テロップテキスト」感情タグ
- f{N}〜f{N}: example2.jpg（全画面・ズーム）

【場面照合結果】（AI生成の場合）
- 全{N}枚が発話内容と一致 ✓
- 不一致で再生成した画像: {N}枚

確認してほしいポイントがあれば教えてね！
→ 調整したい: フレーム範囲やマッチング修正
→ OK: 次のステップ → /step16-special-components（特殊コンポーネント）
```

### C（話者アイコン）の場合
```
✅ Step 16 完了: 話者アイコンを焼き込みました。

【設定】
- 対象話者: {left/right}
- アイコン: {ファイル名}（{size}px）
- バックアップ: public/main/<動画名>_cut_backup.mp4

確認してほしいポイントがあれば教えてね！
→ 位置がずれている: バックアップから復元して --down-shift / --right-shift を調整
→ OK: 次のステップ → /step16-special-components（特殊コンポーネント）
```
