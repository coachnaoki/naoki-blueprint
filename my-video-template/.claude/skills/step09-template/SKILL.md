---
name: step09-template
description: テロップのテンプレート設定（templateConfig.ts）を作成する。フォント・サイズ・SE対応を定義する。
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Step 09: テンプレート設定

`src/templateConfig.ts` を作成し、テロップの種類ごとにフォント・サイズ・SE対応を定義する。

## 前提条件
- Step 02（素材チェック）でSEファイルの一覧を把握済み
- CLAUDE.md の「テロップスタイル早見表」「SE配置ルール」を確認済み

## やること

### 1. CLAUDE.md のルール確認

CLAUDE.md から以下を読み取る：
- テロップスタイル早見表（テンプレート名・用途・SE対応）
- カラールール
- フォント・サイズ基準
- SE対応表

### 2. templateConfig.ts の作成

以下の型と設定を定義する：

```typescript
export type TemplateName = "normal" | "normal_emphasis" | "emphasis" | ...;

export interface TemplateConfig {
  label: string;           // 日本語ラベル
  fontFamily: string;      // フォント
  fontSize: number;        // 文字サイズ
  maxChars: number;        // 1行の最大文字数（全角基準、半角=0.6換算）
  seFolder: string | null; // SEフォルダパス（nullはSEなし）
}

export const templateConfig: Record<TemplateName, TemplateConfig> = { ... };
```

**SEはフォルダ指定（個別ファイル名ではない）。** 再生時にフォルダ内のファイルからランダムに選択する：
- startFrameをシードにした疑似乱数で選択（毎回同じ結果を保証）
- 直近2回と同じSEにならないよう自動回避

### 3. SE フォルダとの整合性チェック

templateConfig で指定した SE フォルダが `public/se/` 内に実際に存在し、中に `.mp3` ファイルが入っているか確認する。

### 4. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## フォントルール

2種類のフォントをテンプレートの性格に合わせて使い分ける：

| フォント定数 | フォント名 | 用途 |
|-------------|-----------|------|
| FONT_MPLUS | `'M PLUS Rounded 1c', sans-serif` | 通常系・情報系・CTA系（丸ゴシック・読みやすさ重視） |
| FONT_SHIPPORI | `'Shippori Mincho', serif` | 強調系・ネガティブ系（感情・インパクト重視） |

## テンプレート一覧（実装ベース）

| テンプレート名 | fontFamily | fontSize | maxChars | SEフォルダ |
|---------------|-----------|----------|----------|-----------|
| normal | FONT_MPLUS | 84 | 20 | null |
| normal_emphasis | FONT_MPLUS | 84 | 20 | se/強調/ |
| emphasis | FONT_SHIPPORI | 102 | 16 | se/ポジティブ/ |
| emphasis2 | FONT_SHIPPORI | 135 | 12 | se/ポジティブ/ |
| emphasis_large | FONT_MPLUS | 150 | 12 | se/強調/ |
| negative | FONT_SHIPPORI | 96 | 16 | se/ネガティブ/ |
| negative2 | FONT_SHIPPORI | 120 | 12 | se/ネガティブ/ |
| third_party | FONT_MPLUS | 84 | 20 | se/強調/ |
| mascot | FONT_MPLUS | 78 | 20 | se/ネガティブ/ |
| bullet_list | FONT_MPLUS | 72 | 22 | se/強調/ |
| table | FONT_MPLUS | 72 | 22 | se/強調/ |
| line_cta | FONT_MPLUS | 66 | 24 | （専用SE） |
| subscribe_cta | FONT_MPLUS | 72 | 22 | （専用SE） |
| theme | FONT_MPLUS | 108 | 14 | （専用SE） |
| profile | FONT_MPLUS | 90 | 18 | se/強調/ |
| heading | FONT_MPLUS | 54 | 30 | null |

## 完了条件
- `src/templateConfig.ts` が存在する
- 全テンプレートの型・設定が定義されている
- SE フォルダとの整合性が取れている
- TypeScript ビルドが通る

## 完了後

```
✅ Step 09 完了: テンプレート設定を作成しました。

【定義テンプレート数】○○種類
【SE対応】○○個のSEファイルを紐付け

次のステップ → /step10-telop（テロップデータ作成）
進めますか？
```
