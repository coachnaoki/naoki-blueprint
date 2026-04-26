---
name: step09-composition
description: メインコンポジション構築・登録（MainComposition.tsx + Root.tsx）。テロップレンダラー・SE・ベース動画を統合する。ユーザーが「コンポジション」「composition」「Remotion Studio」「ステップ9」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion studio), Bash(node scripts/_chk.mjs *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step09-composition` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 09: コンポジション構築（拡張）

`src/MainComposition.tsx` を拡張する。**step05で暫定版（動画のみ）が既に生成済み**。ここではテロップレンダラーと SE システムを追加していく。

**重要**: step08 完了時点で `gen-editable.mjs` により以下が生成済み:
- `src/EditableTelops.ts`（schema + telopMeta）
- `src/Root.tsx`（schema + defaultProps inline、Visual Editing 対応）

Root.tsx は **step09 では触らない**(gen-editable.mjs が管理する)。durationInFrames/fps は step05 の値を保持して生成されている。

## 前提条件
- Step 05（カット）が完了し、暫定 `src/MainComposition.tsx` / `src/Root.tsx` / `src/index.ts` が存在する
- Step 07（テンプレート設定）とStep 08（テロップデータ + gen-editable.mjs実行）が完了していること
  - `src/templateConfig.ts`
  - `src/telopData.ts`
  - `src/EditableTelops.ts`（自動生成）
  - `src/Root.tsx`（自動生成、schema + defaultProps inline）
- Remotion Studio が起動中（step05で起動済み、ここではホットリロードで反映される）

## やること

### 1. コンポーネントの構造設計

MainComposition は **Visual Editing 対応の Props 受け取り型**で実装する。これにより Studio で各テロップの start/end をドラッグ編集できる。

```typescript
import { useMemo } from "react";
import { telopData, type TelopEntry } from "./telopData";
import { telopMeta, type MainCompositionProps } from "./EditableTelops";

export const MainComposition: React.FC<MainCompositionProps> = (props) => {
  const frame = useCurrentFrame();

  // Studio Props パネルで編集された start/end と、不変メタ (text/template/emphasisWord) を結合
  const editableTelopData = useMemo<TelopEntry[]>(
    () =>
      Object.entries(props.telops).map(([key, range]) => {
        const meta = telopMeta[key];
        return {
          text: meta.text,
          startFrame: range.start,
          endFrame: range.end,
          template: meta.template,
          ...(meta.emphasisWord !== undefined ? { emphasisWord: meta.emphasisWord } : {}),
        };
      }),
    [props.telops]
  );

  // SE タイミングも editableTelopData に追従させる
  const seEntries = useMemo(() => buildSEEntriesFromData(editableTelopData), [editableTelopData]);

  // 以降、editableTelopData をテロップレンダラー / SE エントリで使用
  ...
};
```


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
| SVG 3層 | negative2 | 外周・中間・最前面の3段stroke+fill |
| SVG 5層+ドロップシャドウ+カスタムfilter | emphasis | 赤対称グラデ + クリーム縁 + 黒ドロップシャドウ + 濃赤茶締め + 金グロー (feColorMatrix) + 上ハイライト 斜体 |
| SVG 7層+カスタムfilter | emphasis2 | 金属反射 黄土/黄白縁 + 本体11段グラデ + 上白反射 + 中央暗部 + 下再反射 + 金外光 斜体 |
| CSS 1層 | negative | textShadow 3重で黒グロー |

##### SVGテロップ文字幅計算（見切れ防止・必須）

```typescript
const charW = (ch: string) => (/[\x00-\x7F]/.test(ch) ? 0.6 : 1.0);
const calcTextWidth = (text: string, fontSize: number) =>
  [...text].reduce((sum, ch) => sum + charW(ch), 0) * fontSize + 200;
// 200px = ドロップシャドウ含む余白
// textAnchor="middle" + x={svgWidth/2} で中央配置
```

##### emphasis / emphasis2 の見切れ防止 (SVG多層版)

stroke + filter が SVG viewBox を超えて広がるため、以下を必須:
```typescript
<svg style={{ overflow: "visible" }} width={width} height={height}>
// emphasis: width = charW(text)*122 + 200, height = 244
// emphasis2: width = charW(text)*122 + 240, height = 244 (押し出し+6を含む)
// 各<text>は textAnchor="middle" dominantBaseline="central" x={width/2} y={height/2}
// 斜体なし (fontStyleなし、Shippori Mincho 800 で重厚感)
```

##### emphasisWord の複数単語対応（normal_emphasis）

`emphasisWord` は `string | string[]` で、配列指定すると指定した全単語を赤く塗る。対句（「前衛 vs 後衛」「アマチュア vs プロ」等の対比構造）は配列で指定する。

```typescript
const emphasisWords = telop.emphasisWord
  ? Array.isArray(telop.emphasisWord) ? telop.emphasisWord : [telop.emphasisWord]
  : [];
// 正規表現で分割 → 各マッチ部分を #CC3300（赤）、それ以外を #10458B（紺）で描画
const escaped = emphasisWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const re = new RegExp(`(${escaped.join("|")})`, "g");
const parts = text.split(re).filter((p) => p !== "");
// 各 part について emphasisWords に含まれるかで色分岐
```

##### third_party の引用符（半角 `｢｣`）

third_party テンプレートの自動付与は半角：`\`｢${telop.text}｣\`` （全角「」は使わない）

##### ドロップシャドウ（全テンプレート必須）

**すべてのテロップにドロップシャドウをつける。** 影がないと背景と文字が溶けて読みにくくなる。SVG系はSVG外側の `<div>` に `filter` を指定、CSS系は各レイヤーの `<div>` に指定。具体的な値はCLAUDE.mdの「テロップのドロップシャドウ」表を参照。

```typescript
// テロップ取得ロジック（editableTelopData ベース・useMemo 推奨）
const currentTelop = useMemo<TelopEntry | undefined>(() => {
  for (let i = 0; i < editableTelopData.length; i++) {
    const t = editableTelopData[i];
    const nextStart = i < editableTelopData.length - 1 ? editableTelopData[i + 1].startFrame : t.endFrame + 1;
    const hideAt = (nextStart - t.endFrame) > 25 ? t.endFrame + 1 : nextStart;
    if (frame >= t.startFrame && frame < hideAt) return t;
  }
  return undefined;
}, [editableTelopData, frame]);
```

#### C. SE（効果音）システム
- `editableTelopData` + `templateConfig` からSEを動的生成（Visual Editing で start 編集時に追従）
- 純粋関数 `buildSEEntriesFromData(telops: TelopEntry[])` として定義し、`useMemo` で再計算
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

### 3. Root.tsx は触らない（step08 で生成済み）

`src/Root.tsx` は step08 の `gen-editable.mjs` 実行時に自動生成されている:
- `<Composition>` 1個（id="MainVideo"）
- `schema={mainCompositionSchema}`（EditableTelops.ts から import）
- `defaultProps={{ telops: { ... } }}`（テロップ各個分が inline 展開）
- `durationInFrames` / `fps` / `width` / `height` は step05 の値を保持

**step09 では Root.tsx を編集しない**。万が一値がズレていれば `gen-editable.mjs` を再実行（既存値を読み取って維持される）。

Remotion Studio は step05 で既に起動済みなので、ここでの起動処理は不要。ホットリロードで MainComposition.tsx の拡張内容が自動反映される。

### 5. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## CLAUDE.md 準拠チェック

### Visual Editing 対応（v2.0 必須）
- [ ] `MainComposition` を `React.FC<MainCompositionProps>` 形式で定義（props 受け取り）
- [ ] `editableTelopData` を `useMemo` で構築（props.telops と telopMeta を結合）
- [ ] `currentTelop` の取得が `editableTelopData` ベース（`telopData` 直接参照していない）
- [ ] `seEntries` を `useMemo(() => buildSEEntriesFromData(editableTelopData))` で動的計算
- [ ] `Root.tsx` を step09 で編集していない（step08 の gen-editable.mjs 出力を維持）

### テロップ実装ルール
- [ ] `whiteSpace: "nowrap"` がテロップに設定されている
- [ ] テロップの `fontWeight: 900`
- [ ] `borderRadius` を使っていない（角は四角）
- [ ] z-index: 動画=0, テロップ=10以上
- [ ] テロップ残留ロジック（25フレーム閾値）が実装されている
- [ ] フェードアウトアニメーションがない（パッと消える）
- [ ] **全テンプレートにドロップシャドウ**が設定されている（CLAUDE.md参照）
- [ ] SVGテロップに `calcTextWidth` で文字幅を算出している（見切れ防止）
- [ ] emphasis (5層SVG + ドロップシャドウ) に e_goldGlow / e_shadowBlur フィルターと黒ドロップシャドウ層 (x+3 y+4 stroke 4) が実装されている
- [ ] emphasis2 (7層SVG) に centerCut + lowerBloom + softGoldGlow + topShine が実装されている (押し出し2段は廃止)
- [ ] emphasis / emphasis2 ともに fontStyle "italic" 斜体
- [ ] emphasis / emphasis2 の SVG は `overflow: "visible"` でstroke・filterがはみ出せる
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
✅ Step 09 完了: コンポジション構築・登録が完了しました。

【実装システム】
- ベース動画: ✅
- テロップレンダラー: ✅（○テンプレート対応）
- SE自動生成: ✅
- Root.tsx登録: ✅
- Remotion Studio: 起動済み

次のステップ → /step10-greenback（グリーンバック背景置換）
進めますか？
```
