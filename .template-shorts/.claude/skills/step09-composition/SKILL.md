---
name: step09-composition
description: メインコンポジション構築・登録（MainComposition.tsx + Root.tsx）。テロップレンダラー・SE・ベース動画を統合する。ユーザーが「コンポジション」「composition」「Remotion Studio」「ステップ9」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion studio), Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step09-composition` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 09: コンポジション構築（拡張）

`src/MainComposition.tsx` を拡張する。**step05で暫定版（動画のみ）が既に生成済み**。ここではテロップレンダラーと SE システムを追加していく。Root.tsx と index.ts は step05 で作成済みなので、durationInFrames / fps の確認のみ。

## 前提条件
- Step 05（カット）が完了し、暫定 `src/MainComposition.tsx` / `src/Root.tsx` / `src/index.ts` が存在する
- Step 07（テンプレート設定）とStep 08（テロップデータ）が完了していること
  - `src/templateConfig.ts`
  - `src/telopData.ts`
- Remotion Studio が起動中（step05で起動済み、ここではホットリロードで反映される）

## やること

### 1. コンポーネントの構造設計

MainComposition.tsx は以下の3つのレンダリングシステムで構成する：

#### A. ベース動画
- カット済み動画（`public/videos/main/*_cut.mp4`）を `OffthreadVideo` で全画面表示
- `objectFit: "cover"` で画面全体に表示

#### B. テロップレンダラー
- `telopData` から現在のフレームに該当するテロップを取得
- テンプレートごとにスタイルを分岐（switch文）
- アニメーション: slideUp / slideLeft（表示開始10フレーム）、**フェードアウトなし**（パッと消える）
- 共通スタイル: `position: absolute, top: "75%", left: "50%", transform: "translate(-50%, -50%)"`, **whiteSpace: "nowrap"**, **fontWeight: 900**, **borderRadius禁止**（角は四角）— 縦動画は下から1/4の位置（1920×0.75 = 1440px地点）
- **テロップ残留ルール**: 次のテロップまで25フレーム以内 → 次が出るまで残留。25フレーム超 → endFrameで消す（デモ動画等の可能性）

##### テンプレート構造の分岐（必須）

| 構造 | テンプレート | 実装方法 |
|------|-------------|---------|
| SVG 2層 | normal, normal_emphasis, section, third_party | stroke層（縁取り）+ fill層（文字）の2つの `<text>` |
| SVG 2層+フィルター | emphasis2, negative2 | SVG 2層 + SVGフィルターで立体感 |
| CSS 2層 | emphasis, negative | 背景div（absolute）+ 前面divの2層。**両方に同じpadding** |
| CSS 1層 | その他の専用コンポーネント | 各テンプレート固有のレイアウト |

##### SVGテロップ文字幅計算（見切れ防止・必須・複数行対応）

```typescript
const charW = (ch: string) => (/[\x00-\x7F]/.test(ch) ? 0.6 : 1.0);
const calcLineWidth = (text: string, fontSize: number) =>
  [...text].reduce((sum, ch) => sum + charW(ch), 0) * fontSize;
const calcTextWidth = (text: string, fontSize: number) => {
  const lines = text.split("\n");
  return Math.max(...lines.map((l) => calcLineWidth(l, fontSize))) + 60;
};
// 60px = ドロップシャドウ含む余白（ショート動画の1080px幅用）
// `\n` で複数行の場合は最大幅を採用
// textAnchor="middle" + x={svgWidth/2} で中央配置
```

##### 2行テロップのSVGレンダリング（normal / normal_emphasis / section / third_party）

`text` に `\n` が含まれる場合、`<tspan>` で各行を中央揃えで描画。各行のy座標は中心基準で上下に振り分け、1行時は従来と同じ位置。

```typescript
const lines = displayText.split("\n");
const lineHeight = fontSize * 1.15;
const svgH = fontSize * 1.8 + (lines.length - 1) * lineHeight;
const ys = lines.map((_, i) =>
  svgH / 2 - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight + fontSize * 0.35
);

// stroke層 / fill層 両方で以下のように tspan 描画
<text textAnchor="middle" ...>
  {lines.map((line, i) => (
    <tspan key={i} x={svgW / 2} y={ys[i]}>{line}</tspan>
  ))}
</text>
```

- emphasis / emphasis2 / negative / negative2 は2行未対応（`whiteSpace: "nowrap"` が効く1行のみ）

##### emphasisWord の複数単語対応（normal_emphasis）

`emphasisWord` は `string | string[]` で、配列指定すると指定した全単語を赤く塗る。

```typescript
const emphasisWords = telop.emphasisWord
  ? Array.isArray(telop.emphasisWord) ? telop.emphasisWord : [telop.emphasisWord]
  : [];
// 正規表現で分割 → 各マッチ部分を #CC3300、それ以外を #10458B で描画
```

##### CSS emphasisの見切れ防止（emphasis / emphasis2）

イタリック体は右端が斜めにはみ出すため、**両レイヤーに同じパディング**が必要：
```typescript
paddingLeft: fontSize * 0.4,
paddingRight: fontSize * 0.4,
// 背景層（absolute）と前面層の両方に同じ値を入れないと位置がズレる
```

##### ドロップシャドウ（全テンプレート必須）

**すべてのテロップにドロップシャドウをつける。** 影がないと背景と文字が溶けて読みにくくなる。SVG系はSVG外側の `<div>` に `filter` を指定、CSS系は各レイヤーの `<div>` に指定。具体的な値はCLAUDE.mdの「テロップのドロップシャドウ」表を参照。

```typescript
// テロップ取得ロジック
let currentTelop: TelopEntry | undefined;
for (let i = 0; i < telopData.length; i++) {
  const t = telopData[i];
  const nextStart = i < telopData.length - 1 ? telopData[i + 1].startFrame : t.endFrame + 1;
  const hideAt = (nextStart - t.endFrame) > 25 ? t.endFrame + 1 : nextStart;
  if (frame >= t.startFrame && frame < hideAt) {
    currentTelop = t;
    break;
  }
}
```

#### C. SE（効果音）システム
- `telopData` + `templateConfig` からSEを自動生成
- **最低50フレーム（2秒）間隔**: 密集するSEを間引く
- **直近2回重複回避**: 候補リストから直近2つのSEを除外してから選択（do-whileリトライではなくfilterで除外）
- **第三者発言の文途中スキップ**: テキスト末尾が「、」や助詞（は/の/に/を/が/で/も/て/と）の場合SEなし
- `<Sequence>` + `<Audio>` で配置、volume: 0.1

##### SE選択アルゴリズム（シード基準乱数）

SEフォルダ内の複数ファイルから**startFrameをシードにした疑似乱数**で選択する。これにより毎回同じ結果を保証する。

```typescript
// 疑似乱数（startFrameがシード → 毎回同じSEが選ばれる）
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// SE選択
const candidates = allFiles.filter(f => !recentTwo.includes(f)); // 直近2回を除外
const index = Math.floor(seededRandom(startFrame) * candidates.length);
const selectedSE = candidates[index];
```

### 2. 実装

上記の設計に基づき MainComposition.tsx を作成する。

### 3. Root.tsx にコンポジション登録

`src/Root.tsx` にコンポジションを登録する。

```typescript
import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainComposition}
        durationInFrames={/* video-context.md の総フレーム数 */}
        fps={/* video-context.md の FPS */}
        width={1080}
        height={1920}
      />
    </>
  );
};
```

- `fps` は `video-context.md` の制作設定に記載されたFPSを使用する
- `durationInFrames` は `video-context.md` の総フレーム数を使用する

### 4. Root.tsx の durationInFrames / fps 確認

step05 で生成済みの `src/Root.tsx` で `durationInFrames` / `fps` が正しい値になっているか確認。誤っていれば修正する。

```typescript
<Composition
  id="MainVideo"
  component={MainComposition}
  durationInFrames={/* カット後のフレーム数 */}
  fps={/* video-context.md のFPS */}
  width={1080}
  height={1920}
/>
```

Remotion Studio は step05 で既に起動済みなので、ここでの起動処理は不要。ホットリロードで MainComposition.tsx の拡張内容が自動反映される。

### 5. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## CLAUDE.md 準拠チェック

- [ ] `whiteSpace: "nowrap"` がテロップに設定されている
- [ ] テロップの `fontWeight: 900`
- [ ] `borderRadius` を使っていない（角は四角）
- [ ] z-index: 動画=0, テロップ=10以上
- [ ] テロップ残留ロジック（25フレーム閾値）が実装されている
- [ ] フェードアウトアニメーションがない（パッと消える）
- [ ] **全テンプレートにドロップシャドウ**が設定されている（CLAUDE.md参照）
- [ ] SVGテロップに `calcTextWidth` で文字幅を算出している（見切れ防止）
- [ ] CSS emphasis/emphasis2 に `fontSize * 0.4` のパディングが両レイヤーにある
- [ ] emphasis2に立体感（暗影+ハイライトSVGフィルター）が実装されている
- [ ] SEが `startFrame` シード基準の疑似乱数で選択されている
- [ ] Sequence必須ルール: 途中再生の短い動画は `<Sequence>` でラップ

## 完了条件
- `src/MainComposition.tsx` にテロップレンダラー・SE が追加されている（ベース動画は step05 で既に実装済み）
- `src/Root.tsx` の durationInFrames / fps が正しい
- Remotion Studio のプレビューでテロップ・SE が反映されている（ホットリロード）
- TypeScript ビルドが通る
- CLAUDE.md のルールに準拠している

## 完了後

```
✅ Step 09 完了: コンポジション拡張が完了しました。

【追加システム】
- テロップレンダラー: ✅（○テンプレート対応）
- SE自動生成: ✅

Remotion Studio でプレビューを確認してください（ホットリロード済み）。

次のステップ → /step10-greenback（グリーンバック背景置換）
進めますか？
```
