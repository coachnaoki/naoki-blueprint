---
name: step08-telop
description: transcript_words.jsonとvideo-context.mdを元に、テロップデータ（telopData.ts）を作成する。CLAUDE.mdのルールに従いテンプレートを自動判定する。ユーザーが「テロップ」「字幕」「telop」「ステップ8」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 08: テロップデータ作成

`transcript_words.json` の発話タイミングと `video-context.md` の企画情報を元に、`src/telopData.ts` を作成する。

## 前提条件
- Step 06（カット後の再文字起こし）が完了していること
- Step 07（テンプレート設定）が完了していること
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

### ⚠️ 台本・発話の言葉を一字一句変えない（絶対遵守）

**テロップのtextは `public/transcript_words.json`（step04で修正済みの実際の発話）を一字一句そのまま使う。AIの判断で意訳・短縮・リフレーズ禁止。**

**優先順位（重要）:**
1. **最優先**: transcript_words.json の実際の発話（step04でWhisper誤変換は修正済み）
2. **参考**: `public/script/` の台本（アドリブ差分がある場合のみ、台本は参考程度に扱う）
3. **禁止**: AIの創作・意訳・要約

> step04の方針「アドリブは発話優先・台本は正しい漢字の参考のみ」に準拠。
> step04で修正済みのtranscript_words.jsonは**発話そのものの正規表記**なので、そのままテロップに使う。

- ❌ NG: 「勇気を出して触っても、ボレーが浮いて逆襲されてしまう」→「ボレーが浮いて」「逆襲されてしまう」（「勇気を出して触っても」を削除）
- ❌ NG: 「いやいや、自分たちの試合はもっとラリーが続いているよ」→「もっとラリー続いてる」（言い換え）
- ❌ NG: 「危険です」→「要注意」（類義語に置き換え）

**正しい分割方法（文字数制限超過時）:**
1. 句読点（、。）で分割 — 最優先
2. 助詞（は/の/に/を/が/で/も/て/と）の後で分割
3. どうしても1チャンクが制限を超える場合 → **ユーザーに「この文は長すぎるのでどう分割しますか？」と確認**

**分割例（正しい）:**
- 台本: 「勇気を出して触っても、ボレーが浮いて逆襲されてしまう」
  → ①「勇気を出して触っても」(11字) ②「ボレーが浮いて」(7字) ③「逆襲されてしまう」(8字)
- 台本: 「いやいや、自分たちの試合はもっとラリーが続いているよ」
  → ①「いやいや、」(5字) ②「自分たちの試合は」(8字) ③「もっとラリーが」(7字) ④「続いているよ」(6字)

**原則:** 分割後の全チャンクを連結すると**必ず原文と同じ**になる。

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
✅ Step 08 完了: テロップデータを作成しました。

【テロップ数】○○個
【テンプレート内訳】normal: ○, emphasis: ○, negative: ○, ...
【カバー率】○○%

次のステップ → /step09-composition（コンポジション構築）
進めますか？
```
