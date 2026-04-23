---
name: step07-template
description: テロップのテンプレート設定（templateConfig.ts）を作成する。フォント・サイズ・SE対応を定義する。ユーザーが「テンプレート」「template」「templateConfig」「ステップ7」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node *), Bash(npx tsc --noEmit)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step07-template` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 07: テンプレート設定

`src/templateConfig.ts` を作成し、テロップの種類ごとにフォント・サイズ・SE対応を定義する。

## 前提条件
- Step 02（素材チェック）でSEファイルの一覧を把握済み
- CLAUDE.md の「テロップスタイル早見表」「SE配置ルール」を確認済み

## やること

### 1. テンプレート一覧プレビューを表示（必須・絶対スキップ禁止）

**⚠️ このステップ最初に必ず実行する。templateConfig.ts を作る前にユーザーにスタイルを確認してもらう。**

「プレビュー開きますか？」と聞かずに、無条件で以下を実行してブラウザを開く:

```bash
node scripts/open-file.mjs public/template-preview.html
```

実行後、ユーザーに以下を伝えてフィードバックを待つ:

```
テロップのテンプレート一覧を開きました。
ブラウザでご確認ください。
色・フォント・サイズなど、変更したいスタイルはありますか？
特になければ「OK」でそのまま進めます。
```

**ユーザーから変更希望があった場合：**
- 該当テンプレートの設定値を変更して `templateConfig.ts` に反映する
- `template-preview.html` のCSSも合わせて更新し、再度ブラウザで確認してもらう

### 2. CLAUDE.md のルール確認

CLAUDE.md から以下を読み取る：
- テロップスタイル早見表（テンプレート名・用途・SE対応）
- カラールール
- フォント・サイズ基準
- SE対応表

### 3. templateConfig.ts の作成

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

**ショート動画では使わないコンポーネント（定義しない）:**
- `bullet_list` / `follow_cta` / `line_cta` / `theme` / `headingBannerConfig`
- 縦動画は情報密度が詰まりすぎるため、テロップ8種（normal / normal_emphasis / emphasis / emphasis2 / section / negative / negative2 / third_party）のみに絞る

**SEはフォルダ指定（個別ファイル名ではない）。** 再生時にフォルダ内のファイルからランダムに選択する：
- startFrameをシードにした疑似乱数で選択（毎回同じ結果を保証）
- 直近2回と同じSEにならないよう自動回避

### 4. SE フォルダとの整合性チェック

templateConfig で指定した SE フォルダが `public/se/` 内に実際に存在し、中に `.mp3` ファイルが入っているか確認する。

### 5. TypeScript ビルドチェック

```bash
npx tsc --noEmit
```

## フォントルール

2種類のフォントをテンプレートの性格に合わせて使い分ける：

| フォント定数 | フォント名 | 用途 |
|-------------|-----------|------|
| FONT_MPLUS | `'M PLUS Rounded 1c', sans-serif` | 通常系・情報系（丸ゴシック・読みやすさ重視） |
| FONT_SHIPPORI | `'Shippori Mincho', serif` | 強調系・ネガティブ系（感情・インパクト重視） |

## テンプレート一覧（実装ベース・ショート動画用・8種）

縦動画は横幅1080pxのため、横動画版より文字数制限を厳しくする。

| テンプレート名 | fontFamily | fontSize | maxChars | SEフォルダ |
|---------------|-----------|----------|----------|-----------|
| normal | FONT_MPLUS | 84 | 12 | null |
| normal_emphasis | FONT_MPLUS | 84 | 12 | se/強調/ |
| emphasis | FONT_SHIPPORI | 122 | 8 | se/ポジティブ/ |
| emphasis2 | FONT_SHIPPORI | 122 | 8 | se/ポジティブ/ |
| section | FONT_MPLUS | 122 | 8 | se/強調/ |
| negative | FONT_SHIPPORI | 96 | 11 | se/ネガティブ/ |
| negative2 | FONT_SHIPPORI | 122 | 8 | se/ネガティブ/ |
| third_party | FONT_MPLUS | 84 | 12 | se/強調/ |

## 完了条件
- `src/templateConfig.ts` が存在する
- 上記8種類の型・設定が定義されている
- SE フォルダとの整合性が取れている
- TypeScript ビルドが通る
- ユーザーがテンプレート一覧を確認し、スタイルに合意している

## 完了後

```
✅ Step 07 完了: テンプレート設定を作成しました。

【定義テンプレート数】8種類
【SE対応】○○個のSEファイルを紐付け
【スタイル変更】あり / なし

次のステップ → /step08-telop（テロップデータ作成）
進めますか？
```
