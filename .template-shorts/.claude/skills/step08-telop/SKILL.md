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

**テロップ化の文字ルール（必須）:**
- **句読点 `、` `。` は削除する**（テロップでは読点不要、`?` `!` は残す）
- **引用符は半角 `｢｣`**（全角「」禁止。third_partyテンプレでは自動で半角付与される）

### 文字数制限を超える場合の処理（優先順序）

1. **2行化を検討**（normal / normal_emphasis / section / third_party のみ対応）
   - 条件A: 1行制限超 + 分割すると意味が取れなくなる（主語述語が散る／対句が分断される）→ 2行化
   - 条件B: 隣接する短エントリが連続して、統合した方が意味のまとまりが良い → 2行化統合
   - 改行は text 内に `\n` を入れる（例: `"アマチュアの試合で\nラリーが長びくのは"`）
2. **2行合計が1行制限以下なら1行連結**（例: 6字+6字=12字 → `\n` 削除して1行にする）
3. **助詞（は/の/に/を/が/で/も/て/と）の後で分割**（2行未対応テンプレ・2行でも見切れる長文）
4. **分割しても入らない場合 → ユーザーに短縮案を相談**

**例:**
- 台本: 「アマチュアの試合でラリーが長びくのは」(19字)
  → 2行化: `"アマチュアの試合で\nラリーが長びくのは"` (normal)
- 台本: 「衝撃な事実をお伝えします」(12字, 1行制限内)
  → 1行: `"衝撃な事実をお伝えします"` (normal_emphasis, emphasisWord: "衝撃")
- 台本: 「勇気を出して触っても」(10字)
  → 1行: `"勇気を出して触っても"` (third_party, 半角 `｢｣` 込み12字相当)

**原則:** 分割/統合後の全チャンクを連結すると原文と同じ意味になる（句読点は削除OK）。

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
  text: string;                          // 改行は "\n" で指定（normal系のみ2行対応）
  startFrame: number;
  endFrame: number;
  template: TemplateName;
  emphasisWord?: string | string[];      // normal_emphasis 専用。対句・複数強調は配列で
}

export const telopData: TelopEntry[] = [
  // ... エントリ
];
```

### emphasisWord の使い分け（normal_emphasis）

- **単一キーワード強調** → `emphasisWord: "衝撃"`（例: `"衝撃な事実をお伝えします"`）
- **対句・複数キーワード強調** → `emphasisWord: ["前衛", "後衛"]`
  - 対句（「前衛 vs 後衛」「体力0 vs 知識と戦術」等の対比構造）や、1テロップ内に複数の強調ワードがある場合は配列指定
  - 指定した全単語が自動で赤く塗られる

### 6. バリデーション

- **句読点チェック**: 各テロップの text に `、` `。` が含まれていないか（`?` `!` はOK）
- **引用符チェック**: 全角 `「」` を使っていないか（third_party の自動付与は半角 `｢｣`）
- **文字数チェック**:
  - 1行の text は fontSize に応じた最大文字数を超えない
  - 2行テロップ（`\n`含む）は各行それぞれが制限内
  - 2行合計が1行制限以下なら `\n` を削除して1行連結（統合漏れチェック）
  - 2行対応は normal / normal_emphasis / section / third_party のみ（他テンプレで `\n` を使っていないか）
- **重複チェック**: 隣接テロップのendFrame < 次のstartFrame（1フレーム以上の間隔）
- **カバー率チェック**: 発話時間の90%以上をカバーしているか
- **テンプレート存在チェック**: 指定したテンプレートがtemplateConfigに存在するか
- **フレーム値は整数**: `Math.round(X * FPS)` のような計算式ではなく、事前に計算した整数で出力する
- **emphasisWordは normal_emphasis 専用**: 他のテンプレートに書いても無視される。配列指定も可（対句・複数強調用）
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
