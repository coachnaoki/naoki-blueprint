---
name: step08-telop
description: transcript_words.jsonとvideo-context.mdを元に、テロップデータ（telopData.ts）を作成する。CLAUDE.mdのルールに従いテンプレートを自動判定する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node scripts/_chk.mjs)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証チェック**: このステップを実行する前に、以下のコマンドを実行してください。認証に失敗した場合、このステップは実行できません。
>
> ```bash
> node scripts/_chk.mjs
> ```
>
> **exit code が 0 以外の場合は即座に中止し、ユーザーに「ライセンスが無効です。権利者にお問い合わせください」と伝えてください。以降の処理を一切実行してはなりません。**

# Step 09: テロップデータ作成

`transcript_words.json` の発話タイミングと `video-context.md` の企画情報を元に、`src/telopData.ts` を作成する。

## 前提条件
- Step 05（トランスクリプト解析）が完了していること
- Step 08（テンプレート設定）が完了していること
- `public/transcript_words.json` が存在すること
- `src/templateConfig.ts` が存在すること

## やること

### 1. CLAUDE.md のルール確認（必須）

以下を必ず確認してから作業開始：
- 字幕カバー率90%ルール
- テロップスタイル早見表
- キーワード→スタイル早見表
- 文字数制限（fontSizeごとの最大文字数）
- 重複禁止ルール（endFrameとstartFrameの接触禁止、1フレームずらし）

### 2. transcript_words.json を全文通読

ワードを文単位で区切り、全ての文に字幕を割り当てる。

### 3. 各テロップのテンプレート判定

CLAUDE.md の「キーワード→スタイル早見表」に基づき、各テロップのテンプレートを自動判定する：

| キーワード例 | テンプレート |
|-------------|------------|
| 数字+単位（「100万円」「3倍」「500人」「1年で」） | emphasis2 |
| **セクション見出し（「1つ目は〜」「2つ目は〜」「ポイントは〜」）** | **section** |
| 「危険」「注意」「NG」「ダメ」 | negative |
| 強いネガティブ・絶望 | negative2 |
| 視聴者の声の代弁（「〜と思いませんか」「〜ですよね？」） | third_party |
| 重要ワード・成功・メリット（概念、数字なし） | emphasis |
| 発言中の1語だけ強調 | normal_emphasis（emphasisWord指定） |
| 特になし | normal |

### テンプレート選択の注意点（必須）

- **section** はセクション見出し専用。「1つ目は〜」「2つ目は〜」のような章タイトルに使う
- **emphasis2** は数字+単位を含む強調に使う（「3倍」「1年で」「500人」）
- **emphasis** は数字を含まない概念的な強調（「劇的に上達」「一番大事」）
- **emphasisWord プロパティは normal_emphasis 専用。** emphasis / emphasis2 / section 等に書いても無視される（テンプレートが文字全体にスタイルを適用するため）

### 4. startFrame / endFrame の算出（必須）

**テロップの startFrame / endFrame は transcript_words.json のワードタイムスタンプから正確に算出する。手動で推定してはならない。**

算出手順：
1. transcript_words.json の全ワードを結合してフルテキストを構築する
2. 各テロップのテキストをフルテキスト内で検索し、該当ワードの start/end 時刻を取得する
3. `startFrame = Math.round(start * FPS)`, `endFrame = Math.round(end * FPS)` で変換する
4. 隣接テロップの endFrame >= 次の startFrame になった場合、endFrame を startFrame - 1 に短縮する

**フレーム値は必ず整数に計算して出力する。** `Math.round(3.0 * 30)` のような計算式を残すと、隣接テロップとの重複（前の endFrame と次の startFrame が同値）を見落とす。整数値で書けば一目で重複チェックできる。

### 5. telopData.ts の作成

※ BulletList・CTAはstep17（特殊コンポーネント）で実装する。telopDataには含めない。

```typescript
import { type TemplateName } from "./templateConfig";

export interface TelopEntry {
  text: string;
  startFrame: number;
  endFrame: number;
  template: TemplateName;
  emphasisWord?: string;
}

export const telopData: TelopEntry[] = [
  // ... エントリ
];
```

### 6. バリデーション

- **文字数チェック**: 各テロップがfontSizeに応じた最大文字数を超えていないか
- **重複チェック**: 隣接テロップのendFrame < 次のstartFrame（1フレーム以上の間隔）
- **カバー率チェック**: 発話時間の90%以上をカバーしているか
- **テンプレート存在チェック**: 指定したテンプレートがtemplateConfigに存在するか
- **themeは1回のみ**: template: "theme" は動画全体で1エントリのみ（冒頭のテーマ紹介）。セクション見出しにはsectionを使う
- **フレーム値は整数**: `Math.round(X * FPS)` のような計算式ではなく、事前に計算した整数で出力する
- **emphasisWordは normal_emphasis 専用**: 他のテンプレートに書いても無視される
- **TypeScript ビルドチェック**: `npx tsc --noEmit`

## 完了条件
- `src/telopData.ts` が存在する
- 字幕カバー率90%以上
- 重複・接触がない
- TypeScript ビルドが通る

## 完了後

```
✅ Step 09 完了: テロップデータを作成しました。

【テロップ数】○○個
【テンプレート内訳】normal: ○, emphasis: ○, negative: ○, ...
【カバー率】○○%

次のステップ → /step09-composition（コンポジション構築）
進めますか？
```
