---
name: catchup
description: 既存のソースコードを全て読み込み、現在の制作状況を把握・要約する。新しい会話の冒頭や、コンテキストを失った時に使う。
allowed-tools: Read, Glob, Grep, Bash(ls *), Bash(npx tsc *)
---

# キャッチアップ: 現在の制作状況を把握する

既存のソースコードと設定ファイルをすべて読み込み、現在どこまで作業が進んでいるか把握する。

## 読み込み対象ファイル（存在するもののみ）

### 設定・コンテキスト
1. `video-context.md` — 動画の企画情報
2. `CLAUDE.md` — プロジェクトルール

### ソースコード
3. `src/templateConfig.ts` — テンプレート設定
4. `src/telopData.ts` — テロップデータ
5. `src/slideTimeline.ts` — スライドタイムライン
6. `src/MainComposition.tsx` — メインコンポジション（または他のメインコンポーネント）
7. `src/Root.tsx` — コンポジション登録

### アセット確認
8. `public/slides/` — スライドPNG一覧
9. `public/se/` — SEファイル一覧
10. `public/video/` — 動画ファイル一覧
11. `public/bgm/` — BGMファイル一覧
12. `public/script/` — 台本ファイル一覧

## やること

1. 上記ファイルを順番に読み込む（存在しないファイルはスキップ）
2. 各ステップの完了状況を判定する
3. TypeScript ビルドチェック（`npx tsc --noEmit`）
4. 結果を要約して表示する

## 判定基準

| ステップ | 完了条件 |
|---------|---------|
| 01 context | `video-context.md` が存在する |
| 02 assets | メイン動画が `public/video/`・BGMが `public/bgm/`・SEが `public/se/` に存在する |
| 03 slides | `public/slides/slide-*.png` が存在する |
| 04 transcript | `public/transcript_words.json` が存在する |
| 05 template | `src/templateConfig.ts` が存在し、型が定義されている |
| 06 telop | `src/telopData.ts` が存在し、エントリがある |
| 07 timeline | `src/slideTimeline.ts` が存在し、エントリがある |
| 08 composition | メインコンポーネント（.tsx）が存在する |
| 09 register | `src/Root.tsx` にメインコンポジションが登録されている |
| 10 preview | （手動確認のため自動判定不可） |
| 11 render | `public/output/*.mp4` が存在する |

## 出力フォーマット

```
📋 制作状況キャッチアップ

| # | ステップ | 状態 |
|---|---------|------|
| 01 | context | ✅ / ❌ |
| 02 | assets | ✅ / ❌ |
| ... | ... | ... |

【現在地】Step ○○ まで完了
【次のアクション】`/stepXX-xxx` で続きから再開できます

【コード概要】
- テロップ数: ○○個
- スライド数: ○○枚
- テンプレート数: ○○種類
- 動画長: ○○秒（○○フレーム）
```
