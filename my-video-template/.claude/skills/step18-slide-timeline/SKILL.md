---
name: step18-slide-timeline
description: スライドタイムライン（slideTimeline.ts）を作成する。各スライドの表示フレーム範囲・画像挿入・Ken Burnsモーションを定義する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *)
---

# Step 18: スライドタイムライン作成

`src/slideTimeline.ts` を作成し、各スライドの表示フレーム範囲を定義する。

## 前提条件
- Step 16（スライドキャプチャ）でスライドPNGが存在すること
- Step 04（トランスクリプト解析）で無音区間・セクション区切りを把握していること
- Step 07（テロップデータ）で各セクションのフレーム範囲を把握していること

## 進め方（3段階）

### フェーズ1: AIが自動で配置案を提案

transcript_words.json と video-context.md から話題の変わり目を分析し、各スライドの表示区間を自動で決定する。

**判断基準：**
- 話題の変わり目（新しいセクションの開始）
- 無音区間（Step 04で特定したギャップ）
- ナレーションの論理的な区切り

配置案をユーザーに提示する：

```
📋 スライド配置案:

| スライド | 区間 | 内容 |
|---------|------|------|
| slide-01 | f0〜f500 | タイトル |
| slide-02 | f501〜f1200 | 〇〇の説明 |
| slide-03 | f1201〜f2000 | △△のポイント |
| ... | ... | ... |

この配置でよろしいですか？
```

### フェーズ2: 追加提案

ユーザーの承認後、以下を確認してさらに提案する：

- **ブロック分割**: 箇条書き・カード系スライドに段階表示が必要か
- **Ken Burnsモーション**: 静止画に動きをつけるか
- **表示時間が長すぎるスライド**: 分割やモーション追加を提案

### フェーズ3: ユーザーの希望を聞く

```
他に特別にスライドを入れたい場所はありますか？
（例: 「○○の話をしている辺りにslide-05を追加したい」など）
```

ユーザーの追加指示があれば反映する。なければそのまま確定。

## slideTimeline.ts の作成

```typescript
export interface SlideSegment {
  slideNumber: number;
  startFrame: number;
  endFrame: number;
  image?: string;       // スライドPNG以外の画像を使う場合
  hideWipe?: boolean;   // ワイプを非表示にするか
  motion?: "panRight" | "zoomIn" | "panUp" | "panDown"; // Ken Burnsモーション
}

export const slideTimeline: SlideSegment[] = [ ... ];
```

## ルール確認

- **隙間なし**: 前のセグメントの endFrame + 1 = 次の startFrame
- **全フレームカバー**: 0 〜 最終フレームまでカバー
- **画像挿入**: スライド以外の画像を使う区間は `image` を指定
- **ワイプ非表示**: 画像シーンではワイプを非表示にする場合 `hideWipe: true`
- **Ken Burns**: 静止画に動きをつける場合 `motion` を指定

## テロップとの整合性チェック

各スライドの表示区間が、対応するテロップのフレーム範囲と整合しているか確認する。

## TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## 完了条件
- `src/slideTimeline.ts` が存在する
- 全フレーム範囲を隙間なくカバーしている
- テロップデータとのフレーム範囲が整合している
- TypeScript ビルドが通る

## 完了後

```
✅ Step 18 完了: スライドタイムラインを作成しました。

【セグメント数】○○個
【スライド枚数】○○枚
【画像挿入区間】○○箇所
【Ken Burns適用】○○箇所

次のステップ → /step19-preview（最終プレビュー）
進めますか？
```
