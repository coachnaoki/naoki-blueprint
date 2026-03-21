---
name: step10-telop
description: transcript_words.jsonとvideo-context.mdを元に、テロップデータ（telopData.ts）を作成する。CLAUDE.mdのルールに従いテンプレートを自動判定する。
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Step 10: テロップデータ作成

`transcript_words.json` の発話タイミングと `video-context.md` の企画情報を元に、`src/telopData.ts` を作成する。

## 前提条件
- Step 04（トランスクリプト解析）が完了していること
- Step 09（テンプレート設定）が完了していること
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
| 数字・金額（「3〜4球」「1年で」） | emphasis_large |
| 「危険」「注意」「NG」 | negative |
| 強いネガティブ・絶望 | negative2 |
| 視聴者の声の代弁（「〜と思いませんか」） | third_party |
| 重要ワード・成功・メリット | emphasis |
| 発言中の1語だけ強調 | normal_emphasis（emphasisWord指定） |
| 特になし | normal |

### 4. telopData.ts の作成

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

### 5. バリデーション

- **文字数チェック**: 各テロップがfontSizeに応じた最大文字数を超えていないか
- **重複チェック**: 隣接テロップのendFrame < 次のstartFrame（1フレーム以上の間隔）
- **カバー率チェック**: 発話時間の90%以上をカバーしているか
- **テンプレート存在チェック**: 指定したテンプレートがtemplateConfigに存在するか
- **TypeScript ビルドチェック**: `npx tsc --noEmit`

## 完了条件
- `src/telopData.ts` が存在する
- 字幕カバー率90%以上
- 重複・接触がない
- TypeScript ビルドが通る

## 完了後

```
✅ Step 10 完了: テロップデータを作成しました。

【テロップ数】○○個
【テンプレート内訳】normal: ○, emphasis: ○, negative: ○, ...
【カバー率】○○%

次のステップ → /step11-timeline（スライドタイムライン作成）
進めますか？
```
