---
name: step15-images
description: イメージ画像を動画に挿入する。インサート（部分挿入・話者位置に応じて配置）/ オーバーレイ（全画面・ランダムアニメーション）/ 顔アイコン（対談動画・固定推奨）の3フェーズ構造。画像生成（Gemini API）にも対応。ユーザーが「画像挿入」「AI画像生成」「話者アイコン」「ステップ15」と言ったら起動する。
argument-hint: [挿入位置の秒数やキーワード（省略時はtranscriptから判断）]
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash(npx tsc *), Bash(npx remotion still *), Bash(rm *), Bash(ls *), Bash(python3 *), Bash(python3.12 *), Bash(ffmpeg *), Bash(cp *), Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 15: イメージ画像挿入

画像挿入は**3フェーズ**で構成される:

| フェーズ | 用途 | 確認事項 |
|---|---|---|
| **1. インサート画像** | 話者と並ぶ形で補足画像を部分表示 | 話者位置（左/中央/右）を1回聞く |
| **2. オーバーレイ画像** | 感情ピークで全画面表示 | デフォルトはランダムアニメーション |
| **3. 顔アイコン** | 対談動画の話者識別 | 固定 or 追従（固定推奨）|

## 前提条件
- Step 14（ワイプ位置調整）が完了していること

---

## 画像素材の用意（A/B どちらか）

| | 方法 | 配置先 |
|---|---|---|
| **A. 手動** | 自分で用意した画像を使う | `public/images/inserts/`（部分） / `public/images/overlays/`（全画面） |
| **B. AI生成** | Gemini API で感情ベースに自動生成 | `public/images/overlays/generated/`（自動）|

→ B を選んだ場合は [B. AI画像生成](#b-ai画像生成) のセットアップを先に完了させる

---

# Phase 1: 📎 インサート画像（部分挿入）

`public/images/inserts/` の画像を本編の上に部分的に重ねる。話者と並ぶ形で補足画像として表示。

## Step 1-1: 話者位置を確認（1回だけ）

`video-context.md` の `speaker_position` を確認:
- **記載あり** → そのまま使用（以降の質問スキップ）
- **記載なし** → ユーザーに質問して保存

### 質問文（記載なしの場合）
```
本編動画の話者（あなた）は画面のどこにいますか？
  1) 左にいる  → 画像は右に挿入
  2) 中央にいる → 画像は中央に挿入（周囲ぼかし）
  3) 右にいる  → 画像は左に挿入（デフォルト）
番号を入力してください [1/2/3]:
```

### video-context.md への保存
```markdown
## 話者位置
speaker_position: right   # left / center / right
```

## Step 1-2: 配置方式を決定

| 話者位置 | 画像配置 | 実装 |
|---|---|---|
| **left** | **右** 挿入 | InsertImageRight（固定値 top:369, left:1020）|
| **center** | **中央 + 周囲ぼかし** | InsertImageCenterBlur（背景ぼかし + 前景中央）|
| **right** | **左** 挿入（既存） | InsertImageLeft（固定値 top:369, left:180）|

## Step 1-3: 表示タイミングを決定

- **表示開始**: 感情ピークのテロップの **startFrame** と同時
- **表示終了**: その感情の流れが続いている間（目安: テロップ2〜4回分、約100〜150フレーム）
- **終了の判断**: 話題が変わる / 感情のトーンが変わる / 次のスライドや動画クリップが始まる
- **密度の目安**: 動画全体で8〜15枚程度
- **スキップ区間**: スライド表示中 / 動画クリップ表示中 / BulletList表示中

---

# Phase 2: 🎬 オーバーレイ画像（全画面）

`public/images/overlays/` の画像を全画面で表示。感情ピークで画面を占有し、視覚インパクトを強める。

## Step 2-1: アニメーションをランダム選択（デフォルト）

**画像ごとに3種類からランダム選択**（SE選択と同じシード方式）:
- `zoom` — ゆっくりズームイン（Ken Burns風）
- `slideUp` — 拡大しながらゆっくり上にスライド
- `slideLeft` — 拡大しながらゆっくり左にスライド

```typescript
const OVERLAY_ANIMATIONS = ["zoom", "slideUp", "slideLeft"] as const;

function pickAnimation(startFrame: number, recent: string[] = []): string {
  // 直近2回と同じを回避（単調さ排除）
  const pool = OVERLAY_ANIMATIONS.filter(a => !recent.includes(a));
  const candidates = pool.length > 0 ? pool : OVERLAY_ANIMATIONS;
  const seed = (startFrame * 2654435761) >>> 0;
  return candidates[seed % candidates.length];
}
```

## Step 2-2: 個別指定（任意）

ユーザーが「この画像は zoom で固定」等の指定をした場合はそちらを優先。ランダム選択はオーバーライド。

## Step 2-3: 表示中の非表示条件（必須）

全画面画像表示中は以下を非表示にする:
- **見出しバナー（HeadingBanner）**
- **ワイプ**
- **bullet_list / theme 以外のテロップ**

→ 詳細実装は [表示ルール](#表示ルール) 参照

---

# Phase 3: 🗣️ 顔アイコン（対談動画）

対談動画で話者にアイコンを焼き込む。**対談動画専用**。1人撮影動画では使わない。

## Step 3-1: 固定 or 追従を選択

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
        ├── Yes → 追従（render_speaker_icon.py を実行）
        └── No  → 固定配置（推奨）
```

## Step 3-2: 固定配置の実装

両話者のアイコンを画面両端に常時表示（Remotion側）:

```typescript
// 両話者の顔アイコンを画面両端に配置（対談動画用）
{/* 左話者アイコン */}
<Img src={staticFile("images/inserts/speaker_left.png")} style={{
  position: "absolute",
  top: 100, left: 60,
  width: 200, height: 200,
  borderRadius: "50%",
  border: "4px solid #fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 8,
}} />

{/* 右話者アイコン */}
<Img src={staticFile("images/inserts/speaker_right.png")} style={{
  position: "absolute",
  top: 100, right: 60,
  width: 200, height: 200,
  borderRadius: "50%",
  border: "4px solid #fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 8,
}} />
```

## Step 3-3: 追従（オプション・非推奨）

詳細は `scripts/render_speaker_icon.py` の引数ガイドを参照:

```bash
python3.12 scripts/render_speaker_icon.py public/images/inserts/<アイコン>.png --side right
```

主要オプション:

| オプション | デフォルト | 説明 |
|---|---|---|
| `--side` | （必須） | left / right |
| `--size` | 440 | アイコンサイズ(px) |
| `--smooth` | 0.06 | 追従の滑らかさ(0.01=遅い, 0.2=速い) |
| `--head-offset` | 0.35 | 顔中心→頭中心への補正比率 |
| `--down-shift` | 0.125 | 下方向シフト(サイズ比) |
| `--right-shift` | 0.125 | 右方向シフト(サイズ比) |
| `--detect-every` | 3 | 何フレームごとに顔検出 |
| `--video` | 自動検出 | 入力動画パス |

処理内容:
1. 元動画を `*_backup.mp4` にバックアップ（初回のみ）
2. 全フレームを処理してアイコンを焼き込み
3. 音声をバックアップから結合
4. 元のファイル名で上書き

顔検出失敗時は前回の位置に留まる（消えない）。

---

# B. AI画像生成

Gemini API で場面に合った画像を自動生成し、感情ベースで挿入する。

> ⚠️ **必須**: 画像生成を始める前に必ず [`references/policy-compliance.md`](references/policy-compliance.md) を読み、Google生成AI利用ポリシーの NGリスト・推奨フレーズ・セルフチェックリストを把握すること。違反するとAPIキー無効化・**Googleアカウント停止**につながる。

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
   >
   > ⚠️ **重要**: APIキーを使うことは Google生成AI利用ポリシーへの同意を意味します。違反コンテンツ（実在人物・未成年・ロゴ・暴力等）の生成は **APIキー無効化・Googleアカウント停止** の対象となり、配布元（Naoki）ではなくユーザー本人の自己責任となります。詳細は `references/policy-compliance.md` を参照してください。

3. **キーを受け取ったら、`.env` ファイルを自動作成**
   Writeツールで `.env` を作成：
   ```
   GEMINI_API_KEY=ユーザーから受け取ったキー
   ```
   作成後、ユーザーに「✅ `.env` を作成しました」と報告する。

4. **キーの形式チェック（簡易）**
   - `AIza` で始まらない / 30文字未満 → 「キーの形式が正しくない可能性があります。もう一度確認してください」と返す
   - それ以外 → OK とみなして次へ

### 0-B. 最新モデルの設定（必須）

`scripts/generate-images.py` の `MODEL` が空の場合、最新の画像生成モデルを設定する。

1. https://ai.google.dev/gemini-api/docs/models をWebSearchまたはWebFetchで確認
2. 画像生成対応のFlashモデル（`gemini-*-flash-image*`）の最新IDを取得
3. `scripts/generate-images.py` の `MODEL = ""` を最新モデルIDに更新

### 1. 感情ピークの特定

`telopData.ts` と `transcript_words.json` を読み、**視聴者の感情が動く瞬間**をピックアップする。

**画像を入れるべき感情の例：**
- 😟 困惑・挫折（「多すぎる」「分からない」「できない」）
- 😲 驚き・感動（「すごい」「信じられない」「自動で」）
- 😢 不安・危機感（「なくなる」「失う」「独立したら」）
- 🤝 共感・告白（「実は〜です」「皆さんも〜ですよね」）
- ✨ 希望・可能性（「ゼロからできる」「誰でも」「未来」）
- 🎯 理解・整理（「つまり」「整理すると」「ファミリー」）

### 2. プロンプト作成のルール

- 英語で書く（英語の方が品質が高い）
- 発話の内容・感情・トーンに合わせる
- **テロップの「意味」と画像の「内容」が明確に対応すること**（抽象的すぎるNG）
- **末尾に必須NG文字列を必ず追加**（`references/policy-compliance.md` 参照）:
  ```
  no text, no words, no letters,
  no real people, no celebrities, no public figures,
  no children, no minors, no teenagers,
  no logos, no brand names, no trademarks, no copyrighted characters,
  no violence, no blood, no weapons, no explicit content,
  no medical procedures, no religious symbols, no currency or IDs,
  horizontal 16:9 aspect ratio
  ```

**プロンプト確定前のセルフチェック（必須）:**

`references/policy-compliance.md` の「生成前セルフチェックリスト」を**1項目ずつ**実行する。1つでも該当したらプロンプトを書き換える。

### 3. 画像を一括生成

```bash
python3 scripts/generate-images.py
```

出力先: `public/images/overlays/generated/`

**スパム判定回避のルール:**
- 1セッション最大15枚まで
- 同じプロンプトの連投禁止
- 失敗作の再生成はプロンプトを直してから1回だけ

### 4. 画像の確認・場面照合（規約チェック含む）

**A. 規約チェック（最優先）**
- 認識可能な実在人物の顔が生成されていないか
- 子供・未成年が映っていないか
- 識別可能なブランドロゴ・商標が映っていないか
- 暴力・流血・性的描写が含まれていないか
- 著作権キャラクター（アニメ・ゲーム）が映っていないか

→ **1つでも該当したら即削除**し、プロンプトに該当NG語を追加して再生成。

**B. 場面照合**
- そのフレームのテロップテキストを表示
- 画像の内容がテロップの感情・意味とマッチしているか判定
- **不一致の場合はプロンプトを修正して再生成**
- **「ギリOK」は NG** — 明確にマッチしていなければ再生成する

---

## 表示ルール

### インサート画像（Phase 1）
- フェードイン/フェードアウト **なし**。パッと表示してパッと消える
- z-index: 5（テロップの下）
- position: absolute 必須

### オーバーレイ画像（Phase 2）
- フェードアニメーション **禁止**。表示中はスケール+移動のみ（zoom/slideUp/slideLeft）
- 表示中は見出しバナー・ワイプを非表示
- `scale(1.15)` は必須（スケールなしでtranslateだけ使うと画面端に余白が出る）
- z-index: 5

### 顔アイコン（Phase 3）
- 常時表示（固定配置の場合）
- z-index: 8（ワイプと同階層）

---

## 実装リファレンス

### Phase 1: インサート画像（3パターン）

#### ケースA: 話者が**右**にいる → 画像**左**配置（既存デフォルト）
```typescript
{frame >= startFrame && frame <= endFrame && !slideVisible && (
  <Img src={staticFile("images/inserts/example.jpg")} style={{
    position: "absolute",
    top: 369, left: 180, width: 720, height: 405,
    objectFit: "cover", zIndex: 5,
  }} />
)}
```

| プロパティ | 固定値 |
|-----------|--------|
| top | 369 |
| left | **180** |
| width | 720 |
| height | 405 |

#### ケースB: 話者が**左**にいる → 画像**右**配置
```typescript
{frame >= startFrame && frame <= endFrame && !slideVisible && (
  <Img src={staticFile("images/inserts/example.jpg")} style={{
    position: "absolute",
    top: 369, left: 1020, width: 720, height: 405,
    objectFit: "cover", zIndex: 5,
  }} />
)}
```

| プロパティ | 固定値 |
|-----------|--------|
| top | 369 |
| left | **1020** |
| width | 720 |
| height | 405 |

#### ケースC: 話者が**中央**にいる → 画像**中央+周囲ぼかし**
```typescript
{frame >= startFrame && frame <= endFrame && !slideVisible && (
  <>
    {/* 背景: 同じ画像を全画面でぼかす */}
    <Img src={staticFile("images/inserts/example.jpg")} style={{
      position: "absolute",
      width: 1920, height: 1080,
      objectFit: "cover",
      filter: "blur(30px) brightness(0.7)",
      transform: "scale(1.1)",
      zIndex: 4,
    }} />
    {/* 前景: 中央にくっきり表示 */}
    <Img src={staticFile("images/inserts/example.jpg")} style={{
      position: "absolute",
      top: 202, left: 480, width: 960, height: 675,
      objectFit: "cover", zIndex: 5,
    }} />
  </>
)}
```

| プロパティ | 背景層 | 前景層 |
|---|---|---|
| top | 0 | **202** |
| left | 0 | **480** |
| width | 1920 | **960** |
| height | 1080 | **675** |
| filter | `blur(30px) brightness(0.7)` | なし |
| transform | `scale(1.1)` | なし |
| zIndex | 4 | 5 |

### Phase 2: オーバーレイ画像

#### ランダムアニメーション選択
```typescript
const OVERLAY_ANIMATIONS = ["zoom", "slideUp", "slideLeft"] as const;

function pickAnimation(startFrame: number, recent: string[] = []): string {
  const pool = OVERLAY_ANIMATIONS.filter(a => !recent.includes(a));
  const candidates = pool.length > 0 ? pool : OVERLAY_ANIMATIONS;
  const seed = (startFrame * 2654435761) >>> 0;
  return candidates[seed % candidates.length];
}
```

#### zoom
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/overlays/example.jpg")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
    transform: `scale(${interpolate(frame, [startFrame, endFrame], [1.0, 1.15], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })})`,
  }} />
)}
```

#### slideUp
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/overlays/example.jpg")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
    transform: `scale(1.15) translateY(${interpolate(frame, [startFrame, endFrame], [20, -20], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })}px)`,
  }} />
)}
```

#### slideLeft
```typescript
{frame >= startFrame && frame <= endFrame && (
  <Img src={staticFile("images/overlays/example.jpg")} style={{
    position: "absolute", width: 1920, height: 1080,
    objectFit: "cover", zIndex: 5,
    transform: `scale(1.15) translateX(${interpolate(frame, [startFrame, endFrame], [20, -20], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })}px)`,
  }} />
)}
```

#### 全画面画像表示中のルール

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

| 干渉パターン | 対処法 |
|---|---|
| テロップのendFrameが画像のstartFrameを超えている | テロップのendFrameを画像startFrame - 1 に短縮 |
| 画像の上にテロップが重なり読みにくい | z-indexで解決（画像5以下、テロップ10以上）。それでもダメなら画像endFrameを短縮 |

---

## 完了後

### Phase 1 / 2 の場合
```
✅ Step 15 完了: イメージ画像を挿入しました。

【Phase 1: インサート画像】
- 話者位置: {left/center/right} → 画像配置: {右/中央ぼかし/左}
- 挿入枚数: {N} 枚

【Phase 2: オーバーレイ画像】
- 挿入枚数: {N} 枚
- アニメーション配分: zoom {N}枚 / slideUp {N}枚 / slideLeft {N}枚

【場面照合結果】(AI生成の場合)
- 全{N}枚が発話内容と一致 ✓

次のステップ → /step16-special-components（特殊コンポーネント）
```

### Phase 3（話者アイコン）の場合
```
✅ Step 15 完了: 話者アイコンを配置しました。

【設定】
- モード: 固定配置 / 追従
- {追従の場合} バックアップ: public/videos/main/<動画名>_cut_backup.mp4

次のステップ → /step16-special-components
```
