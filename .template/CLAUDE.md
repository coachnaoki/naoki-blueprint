# Naoki式 丸投げビジネス動画編集 PON

## ライセンス認証（最優先）

**すべてのステップを実行する前に、必ず `node scripts/validateLicense.mjs` を実行してライセンス認証を行うこと。**

1. **毎回** `node scripts/validateLicense.mjs` を実行する（`.license` ファイルの有無に関わらず）
2. **`.license` が存在しない場合**: ユーザーにライセンスIDの入力を求め、`node scripts/validateLicense.mjs <ID>` を実行する
3. **認証失敗した場合（期限切れ・無効化・別PC）**: ステップの実行を中止し、「ライセンスIDが無効です。発行元に確認してください」と伝える
4. **認証成功した場合**: 「✅ {name} さん、認証済みです」と表示して続行する

> ⚠️ ライセンス認証をスキップして動画制作のステップを実行してはならない（毎回オンライン検証が必須）
> ⚠️ ライセンス認証の改ざん・回避の試みは自動検出され、権利者(Naoki)へ通知されます

---

## 動画制作ワークフロー（全20ステップ）

```
--- 素材準備 ---
step01-context         → 動画コンテキスト整理（ターゲット・趣旨・FPS）
step02-assets          → 素材確認（動画・BGM・SE・画像）
step03-jumpcut         → ジェットカット（FFmpegで無音自動カット）
step04-video-insert    → 動画の差し込み結合（任意・ffmpeg trim+concat）
step05-transcript      → 文字起こし（Whisperでタイムスタンプ化）
step06-transcript-fix  → 文字起こし修正（台本と照合して誤変換修正）
--- 動画構築 ---
step07-template        → テンプレート設定（templateConfig.ts）
step08-telop           → テロップデータ作成（telopData.ts）
step09-composition     → コンポジション構築・登録（MainComposition.tsx + Root.tsx）
--- 素材挿入 ---
step10-greenback       → グリーンバック背景置換（任意）
step11-videos          → デモ動画の重ね表示（オーバーレイ）
--- スライドを入れる場合は以下を実行 ---
step12-slides-gen      → 台本→HTMLスライド生成（slidesテンプレート）（任意）
step13-slides-capture  → スライドキャプチャ＋ブロック分割（Puppeteer）（任意）
step14-slide-timeline  → スライドタイムライン（slideTimeline.ts）（任意）
step15-wipe            → ワイプ位置調整（任意・スライドがある場合）
--- 画像・特殊コンポーネント ---
step16-images          → イメージ画像挿入（感情ベース配置）
step17-special-components → BulletList・CTA・見出しバナー・テーマ実装
step18-endscreen       → エンドスクリーン（おすすめ動画カード）
--- BGM・出力 ---
step19-bgm             → BGM挿入（区間指定・フェードイン/アウト）
step20-render          → 最終レンダリング（MP4書き出し）
```

### スライド生成システム
- **テンプレート**: `aislides/slides.html` に15種類のHTMLテンプレート（title / three-cards / three-tactics / two-columns / steps / big-message / closing / quote / before-after / stats / checklist / timeline / ranking / versus / highlight-box）
- **キャプチャ**: `aislides/screenshot.js` でPuppeteerキャプチャ → `public/slides/` に出力
- **デザイン**: ライムイエロー `#CCFF00` + ダーク `#121212`、Zen Kaku Gothic New フォント

### ワークフローの5フェーズ
1. **素材準備**（step01〜06）: コンテキスト → 素材確認 → ジェットカット → 物理クリップ挿入（任意） → 文字起こし → 誤変換修正
2. **動画構築**（step07〜09）: テンプレート設定 → テロップ → コンポジション構築・登録（※ここでRemotion Studio起動、以降開きっぱなし）
3. **素材挿入**（step10〜15）: グリーンバック → 動画クリップ → スライド生成・キャプチャ・タイムライン（任意） → ワイプ調整
4. **画像・特殊コンポーネント**（step16〜18）: イメージ画像 → BulletList/CTA/見出しバナー/テーマ → エンドスクリーン
5. **BGM・出力**（step19〜20）: BGM挿入 → レンダリング

---

## AI行動原則（最優先）

### 絶対遵守事項
1. **ルールブック優先**: 自分の判断よりCLAUDE.mdのルールを優先する
2. **余計な追加禁止**: ルールにないスタイル（borderRadius等）を「見栄えが良さそう」で追加しない
3. **同一セッション指示の踏襲**: 直前に作成・修正したテロップのスタイルを確認し踏襲する

### テロップ作成前の必須チェック
1. このファイルの「テロップスタイル早見表」を確認
2. 同一セッション内で直前に指示されたスタイルがあれば踏襲
3. 重複チェック（同タイミング・同位置の既存テロップ確認）

### 絶対禁止事項
- **borderRadius禁止**: 角丸は使わない（角は四角）
- **勝手なデザイン判断禁止**: ルールにないプロパティを追加しない
- **折り返し禁止**: テロップには必ず `whiteSpace: "nowrap"` を入れる

---

## 素材の重複禁止ルール

### 絶対ルール
- **既存のテロップ・強調字幕がある部分には、新しいテロップや字幕を追加しない**
- 素材同士は干渉（重複）させない
- 新しいテロップを追加する前に、同じタイミングに既存のテロップがないか必ず確認する

### 確認手順
1. 既存テロップのstartFrame/endFrameを確認
2. 追加予定のテロップのタイミングと比較
3. 重複がある場合は追加しない
4. **1フレーム重複も禁止**: 前のテロップのendFrameと次のテロップのstartFrameが同じ値の場合、次のテロップのstartFrameを+1する

### 新単語・固有名詞テロップの優先ルール
- **新単語・固有名詞テロップは既存の字幕より優先する**
- 新単語テロップと既存字幕が重複した場合:
  1. 新単語テロップを残す
  2. 既存字幕のendFrameを新単語テロップのstartFrame-1に短縮する
- **理由**: 新単語・固有名詞は視聴者が初めて目にする情報であり、既存字幕（発言そのまま）より視覚的価値が高い

### テキスト包含による重複（前方テロップ削除ルール）
連続する2つのテロップで、後のテロップのテキストが前のテロップのテキストを**冒頭から含んでいる**場合、前のテロップは削除する。

### 重複チェック必須項目
- **同じ位置の字幕は絶対に重複禁止**（bottom: 100〜140の下部字幕は特に注意）
- テロップ追加時は必ずGrepで同時間帯の他テロップを検索
- 接触フレーム（endFrame = 次のstartFrame）も1フレームずらす

### 素材干渉の定義（広義の重複）

| 干渉パターン | 例 | 対処法 |
|-------------|-----|--------|
| テロップ × テロップ | 同位置・同時間帯の字幕重複 | 片方を削除、またはendFrameを短縮 |
| テロップ × 画像 | テロップのendFrameが次の画像のstartFrameを超えている | テロップのendFrameを画像startFrame-1に短縮 |
| 画像 × テロップ | 画像の上にテロップが重なり読みにくい | z-indexで解決、または画像endFrameを短縮 |

### 序列・リスト表示と字幕の重複禁止ルール
**bullet_list（箇条書き）が表示されている時間帯では、bullet_listとtheme以外の全テロップを非表示にする。**
- 序列コンポーネントが発話内容を視覚的に代用しているため、下部字幕は冗長
- 同じ情報が画面の中央と下部に同時表示されると、視聴者の視線が分散する
- 実装: TelopRenderer呼び出し時に `bulletListVisible` をチェックし、bullet_list/theme以外は `return null`

### 画像切替点でのテロップ分割ルール
**画像が途中で挿入される場面では、字幕を画像の切替タイミングで分割する。**
1. 字幕のstartFrame〜endFrame内に画像のstartFrameが含まれているか確認
2. 含まれている場合、transcript_words.jsonで自然な発話の切れ目を探す
3. 字幕を2つに分割

---

## SE配置ルール

### 基本原則
**SEはテンプレート種別に応じて、対応フォルダ内のファイルからランダムに選択する。**
- startFrameをシードにした疑似乱数で選択（毎回同じ結果を保証）
- 直近2回と同じSEにならないよう自動回避（候補リストから直近2つを除外してから選択）

### テンプレート → SEフォルダ対応表

| テンプレート | SEフォルダ | 使用場面 |
|---|---|---|
| **通常+強調** | se/強調/ | 発言の中で1語を強調 |
| **強調+サイズ大** | se/強調/ | 数字・データの大きな強調 |
| **第三者発言** | se/強調/ | 他者の発言・口コミ・証言 |
| **箇条書き** | se/強調/ | リスト・ポイント列挙 |
| **表** | se/強調/ | 比較・手順・リスト表示 |
| **強調グラデーション** | se/ポジティブ/ | 重要ワード・インパクト強調 |
| **強調グラデーション2** | se/ポジティブ/ | より大きな強調・見出し |
| **ネガティブ1** | se/ネガティブ/ | 警告・失敗・NG・ツッコミ |
| **ネガティブ2** | se/ネガティブ/ | 強いネガティブ感情・絶望・衝撃 |
| **代弁** | se/ネガティブ/ | 視聴者目線の発言・共感演出 |
| **今回のテーマ** | se/ポジティブ/ | 冒頭のテーマ紹介 |
| **LINE誘導** | se/強調/ | LINE登録CTA |
| **チャンネル登録** | se/強調/ | チャンネル登録CTA |
| **通常テロップ** | （SEなし） | 発言そのまま |

### 第三者発言のSEタイミングルール
**第三者発言が連続する場合、文の区切りだけSEを鳴らす。**
- テキスト末尾が「、」または助詞（は/の/に/を/が/で/も/て/と）で終わる → スキップ（文の途中）
- それ以外（よ/う/す/た 等の文末）→ SEを鳴らす（文の区切り）
- 例: 「思い切ってやってみても、」→ スキップ / 「結局うまくいかないんです」→ SE鳴る

### 音量基準
- 全SE共通: 0.1

### NG事項
- **同一フレームに複数SE禁止**: 1フレームに1SEのみ
- **連続SE間隔**: 最低50フレーム（2秒）空ける
- **テロップとSEのズレ禁止**: SEのstartFrameはテロップのstartFrameと一致させる
- **既存SEとの重複禁止**: 追加前に既存SEを必ず確認
- **同じSEの連続使用禁止（直近2回）**: 直近2回以内に同じSEが使われていたらスキップ

### タイミング特定のポイント
- ユーザー指定時間は目安。±10秒程度ズレることがある
- **transcript_words.json**でワード単位の正確なタイミングを取得
- フレーム計算: `秒数 × FPS = フレーム数`（FPSは `video-context.md` の制作設定を参照）

---

## テロップ追加ルール

### 作業の流れ
1. **タイミング特定**: transcript_words.jsonで正確な発話タイミングを検索
2. **重複チェック**: 同タイミング・同位置の既存テロップを確認
3. **コンポーネント作成**: 既存の類似テロップをテンプレートに作成
4. **レンダリング追加**: コンポーネント内に追加
5. **SE追加**: 対応SEを追加

### テロップスタイル早見表（実装ベース）

| テンプレート | フォント | サイズ | 文字色 | 縁取り/効果 | 構造 | SEフォルダ |
|---|---|---|---|---|---|---|
| **normal** | M PLUS Rounded 1c | 84 | 紺 `#10458B` | 白フチ SVG strokeWidth:32 | SVG 2層 | なし |
| **normal_emphasis** | M PLUS Rounded 1c | 84 | 紺 `#10458B` + 赤 `#CC3300` | 白フチ SVG strokeWidth:20 | SVG 2層 | se/強調/ |
| **emphasis** | Shippori Mincho | 102 | 赤グラデ `#990000→#FF2222` | 金 `#FFFFCC→#FFD700` + 白グロー | CSS 2層 斜体 | se/ポジティブ/ |
| **emphasis2** | Shippori Mincho | 135 | 金グラデ `#FFD700→#B8860B` | 金 `#FFD700` stroke + 白グロー | CSS 2層 斜体 | se/ポジティブ/ |
| **emphasis_large** | M PLUS Rounded 1c | 150 | 赤 `#CC3300` | 白フチ SVG strokeWidth:20 | SVG 2層 | se/強調/ |
| **negative** | Shippori Mincho | 96 | 白 | 黒グロー textShadow×3 | CSS 2層 斜体 | se/ネガティブ/ |
| **negative2** | Shippori Mincho | 120 | 白 | 黒縁取り `18px #000` + grayscale | CSS 1層 斜体 | se/ネガティブ/ |
| **third_party** | M PLUS Rounded 1c | 84 | 白 | グレーフチ `#333` SVG strokeWidth:24 | SVG 2層 | se/強調/ |
| **箇条書き** | — | 72 | 白 | 青ボックス `#2563EB` | 専用 | se/強調/ |
| **表** | — | 72 | 黒/赤 | 白パネル + 赤タイトル `#EF4444` | 専用 | se/強調/ |
| **代弁** | — | 78 | 黒 | 白吹き出し | 専用 | se/ネガティブ/ |
| **LINE誘導** | — | 66 | 白 | LINE緑 `#06C755` | 専用 | se/強調/ |
| **チャンネル登録** | — | 72 | 白 | 赤ボタン `#EF4444` | 専用 | se/強調/ |
| **今回のテーマ** | — | 108 | 白 | 赤ライン `#EF4444` | 専用 | se/ポジティブ/ |
| **自己紹介** | — | 90 | 黒/赤 | 白カード + 赤ボーダー | 専用 | se/強調/ |
| **見出し** | — | 54 | 白 | 緑〜ティール `#10B981→#059669` | 専用 | なし |

### フォントルール

| フォント | 用途 |
|---------|------|
| `'M PLUS Rounded 1c', sans-serif` | 通常系・情報系（normal / normal_emphasis / emphasis_large / third_party） |
| `'Shippori Mincho', serif` | 強調系・ネガティブ系（emphasis / emphasis2 / negative / negative2） |

### アニメーション設定

| アニメーション | テンプレート | 時間 |
|---|---|---|
| slideUp（下から上） | emphasis / emphasis2 / emphasis_large / negative2 | 10フレーム |
| slideLeft（左からスライド） | negative / third_party | 10フレーム |
| なし（即表示） | normal / normal_emphasis | — |

### カラーパレット（実装ベース）

| 用途 | カラー | 使用箇所 |
|------|--------|----------|
| **通常文字** | 紺 `#10458B` | normal / normal_emphasis |
| **強調ワード・emphasis_large** | 赤 `#CC3300` | normal_emphasisの強調部分 / emphasis_large |
| **emphasis文字** | 赤グラデ `#990000→#FF2222` | emphasis |
| **emphasis2文字** | 金グラデ `#FFD700→#B8860B` | emphasis2 |
| **emphasis縁取り** | 金 `#FFFFCC→#FFD700` | emphasis背景層 |
| **emphasis2縁取り** | 金 `#FFD700` stroke | emphasis2背景層 |
| **SVG白フチ** | 白 `#FFFFFF` | normal / normal_emphasis / emphasis_large |
| **SVGグレーフチ** | グレー `#333333` | third_party |
| **ネガティブ文字** | 白 | negative / negative2 |
| **見出しバナー** | 薄グレー背景 `#F7F4F4` + 青紫文字 `#4B6AC6` | heading |
| **箇条書きボックス** | 青 `#2563EB` | bullet_list |
| **CTA赤** | 赤 `#EF4444` | テーマライン / 表タイトル / プロフィールボーダー |
| **LINE** | 緑 `#06C755` | line_cta |

#### 絶対禁止
- **強調テロップ文字に青・紫は使わない**（見づらい・ブランドカラーと不一致）
- **座布団に緑・紫は使わない**（ブランドカラーと混同するため）
- **グラデーション座布団の上に同系色の文字は使わない**（見えなくなる）

### コンポーネント命名規則
- **HeadingBanner**: 左上の斜め緑バナー（見出し・サブタイトル）
- **ThemeTelop**: 今回のテーマ（赤ライン + 大テキスト）
- **NormalTelop**: 通常字幕
- **EmphasisTelop**: 強調グラデーション1
- **EmphasisTelop2**: 強調グラデーション2（サイズ大）
- **NegativeTelop**: ネガティブ1（アウトライン）
- **NegativeTelop2**: ネガティブ2（モノクロ全画面）
- **ThirdPartyTelop**: 第三者発言（引用符）
- **BulletList**: 箇条書きリスト
- **TableComponent**: 表（白パネル）
- **MascotTelop**: 代弁（マスコット吹き出し）
- **LineCTA**: LINE誘導カード
- **SubscribeCTA**: チャンネル登録ボタン
- **ProfileCard**: 自己紹介名刺

### NG事項
- **同位置・同時間帯の重複禁止**
- **endFrameとstartFrameの接触禁止**: 1フレームずらす
- **コンポーネント追加忘れ禁止**: 定義だけでなくレンダリング部分にも追加

---

## テロップデザイン固定値

### 共通スタイル（変更禁止）
- **角**: 四角（borderRadius禁止）
- **折り返し**: なし（whiteSpace: "nowrap" 必須）
- **fontWeight**: 900
- **位置**: 全テンプレート共通で画面下部中央（`bottom: 40`）
- **z-index**: 10

### フォント（テンプレート別）
- **M PLUS Rounded 1c**（丸ゴシック）: normal / normal_emphasis / emphasis_large / third_party
- **Shippori Mincho**（明朝）: emphasis / emphasis2 / negative / negative2

### SVG縁取り系テンプレートのスタイル
```typescript
// normal: 紺文字 + 白フチ（SVG 2層構造）
// stroke層: stroke="#FFFFFF" strokeWidth=32 strokeLinejoin="round"
// fill層: fill="#10458B"
// フォント: 'M PLUS Rounded 1c', fontWeight: 900
// ★ドロップシャドウ: filter: "drop-shadow(0px 8px 6px rgba(0,0,0,0.2))"

// normal_emphasis: 同上 + 強調ワードは fill="#CC3300"
// strokeWidth=20
// ★ドロップシャドウ: filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"

// emphasis_large: 赤文字 + 白フチ（SVG 2層構造）
// fill="#CC3300", strokeWidth=20
// ★ドロップシャドウ: filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"

// third_party: 白文字 + グレーフチ + 「」引用符
// fill="#FFFFFF", stroke="#333333" strokeWidth=24
// ★ドロップシャドウ: filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"
```

### CSS 2層構造テンプレートのスタイル
```typescript
// emphasis: 赤グラデ文字 + 金縁取り + 白グロー（2層構造・斜体）
// layer1(背景): background: linear-gradient(to bottom, #FFFFCC, #FFD700)
//   ★ドロップシャドウ: filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7)) drop-shadow(0 0 20px rgba(0,0,0,0.2))"
// layer2(前面): background: linear-gradient(to bottom, #990000 10%, #FF2222 90%)
//   ★ドロップシャドウ: filter: "drop-shadow(0 -1px 1px rgba(255,255,255,0.5)) drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"

// emphasis2: 金グラデ文字 + 金縁取り + 白グロー（2層構造・斜体）
// layer1(背景): -webkit-text-stroke: 12px #FFD700
//   ★ドロップシャドウ: filter: "drop-shadow(0 0 10px white) drop-shadow(0 0 20px white)"
// layer2(前面): background: linear-gradient(to bottom, #FFD700 20%, #B8860B 100%)
//   ★ドロップシャドウ: filter: "drop-shadow(0 -1px 2px rgba(255,255,255,0.6)) drop-shadow(0 2px 3px rgba(0,0,0,0.6)) drop-shadow(1px 1px 4px rgba(0,0,0,0.3))"

// negative: 白文字 + 黒グロー（2層構造・斜体）
// layer1(背景): color: white + textShadow 3重(15px,30px,45px)
// layer2(前面): color: white

// negative2: 白文字 + 黒縁取り + grayscale（1層・斜体）
// color: "#FFFFFF", WebkitTextStroke: "18px #000000"
```

### テロップのドロップシャドウ（必須）

**すべてのテロップにドロップシャドウをつける。** 影がないと背景と文字が溶けて読みにくくなる。

| テンプレート | ドロップシャドウ |
|---|---|
| **normal** | `filter: "drop-shadow(0px 8px 6px rgba(0,0,0,0.2))"` |
| **normal_emphasis / emphasis_large / third_party** | `filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"` |
| **emphasis (背景層)** | `filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7)) drop-shadow(0 0 20px rgba(0,0,0,0.2))"` |
| **emphasis (前面層)** | `filter: "drop-shadow(0 -1px 1px rgba(255,255,255,0.5)) drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"` |
| **emphasis2 (背景層)** | `filter: "drop-shadow(0 0 10px white) drop-shadow(0 0 20px white)"` |
| **emphasis2 (前面層)** | `filter: "drop-shadow(0 -1px 2px rgba(255,255,255,0.6)) drop-shadow(0 2px 3px rgba(0,0,0,0.6)) drop-shadow(1px 1px 4px rgba(0,0,0,0.3))"` |
| **negative** | textShadow 3重で代替（既に黒グローがある） |
| **negative2** | WebkitTextStroke で代替（既に黒縁取りがある） |

- SVG系テロップ: SVGの外側の `<div>` に `filter` を指定する
- CSS系テロップ: 各レイヤーの `<div>` に `filter` を指定する
- negative系: 既に黒グロー/黒縁取りがあるため追加不要

### 文字サイズ基準（実装値）
| テンプレート | fontSize |
|-------------|----------|
| emphasis_large | 150 |
| emphasis2 | 135 |
| theme | 108 |
| emphasis | 102 |
| negative | 96 |
| profile | 90 |
| normal / normal_emphasis / third_party | 84 |
| mascot | 78 |
| bullet_list / table / subscribe_cta | 72 |
| line_cta | 66 |
| heading | 54 |

### 1行の文字数制限（必須）

| fontSize | 最大文字数 |
|----------|-----------|
| 84（標準） | **20文字** |
| 102（強調） | **16文字** |
| 120〜150（強調大） | **12文字** |

- **制限を超える字幕は必ず分割する**
- 分割の優先ポイント：読点（、）、句点（。）、助詞の後

### SVG テロップ文字幅計算（見切れ防止）

SVGテロップの幅は以下の計算式で算出する。小さい値だと文字が左右で切れる。

```typescript
const charW = (ch: string) => (/[\x00-\x7F]/.test(ch) ? 0.6 : 1.0);
const calcTextWidth = (text: string, fontSize: number) =>
  [...text].reduce((sum, ch) => sum + charW(ch), 0) * fontSize + 200;
```

- 半角文字: 0.6em、全角文字: 1.0em
- パディング: 200px（ドロップシャドウ含む余白）
- `textAnchor="middle"` + `x={svgWidth/2}` で中央配置

### CSS 強調テロップの見切れ防止（emphasis / emphasis2）

イタリック体は右端が斜めにはみ出すため、両レイヤーにパディングが必要：

```typescript
// layer1（背景・absolute）
<div style={{ ...layer1, position: "absolute", top: 0, left: 0,
  paddingLeft: fontSize * 0.4, paddingRight: fontSize * 0.4 }}>{text}</div>
// layer2（前面）
<div style={{ ...layer2,
  paddingLeft: fontSize * 0.4, paddingRight: fontSize * 0.4 }}>{text}</div>
```

- パディング: fontSize × 0.4（イタリックのはみ出し分）
- 両レイヤーに同じパディングを入れないと位置がズレる

---

## 通常テロップ（normal）デザインルール

- **位置**: 画面下部中央（bottom: 40）
- **構造**: SVG 2層（stroke層 + fill層）で丸い縁取り
- **文字**: 紺 `#10458B`、fontSize: 84、fontWeight: 900
- **フォント**: `'M PLUS Rounded 1c', sans-serif`
- **縁取り**: 白 `#FFFFFF` strokeWidth: 32, strokeLinejoin: round
- **通常+強調の場合**: 強調ワードのみ `fill: "#CC3300"`（赤）に変更

---

## 見出しバナー（HeadingBanner）ルール

### 仕様
- **位置**: 左上（top: 30〜50px, left: 0）
- **デザイン**: 薄グレー背景 `#F7F4F4` + 青紫文字 `#4B6AC6`
- **フォント**: ゴシック体（Hiragino Kaku Gothic ProN / Meiryo）、fontSize: 64、fontWeight: 900
- **letterSpacing**: 0.05em
- **boxShadow**: `0 4px 10px rgba(0,0,0,0.05)`
- **用途**: 動画全体を通して見出し・サブタイトルを表示するベース要素

### 表示タイミング
- 「自己紹介」「本日のテーマ」発表後から、動画の本編全体を通して表示
- CTAシーン（LINE誘導・チャンネル登録）では非表示にしても可
- **全画面コンテンツ（スライド・全画面画像・全画面動画）表示中は非表示にする**

---

## 今回のテーマ（ThemeTelop）ルール

### 仕様
- **白背景バー** + **「Today's theme」ラベル（紫ライン付き）** + **紫テキスト**
- **フォント**: Noto Sans JP, fontSize: 108, fontWeight: 900, イタリック
- **文字色**: 紫 `#5B6BBF` + 白フチ（WebkitTextStroke: 10px white）
- **アニメーション**: 下からスライドイン / 下へスライドアウト（10フレーム）
- **SE**: se/ポジティブ/ からランダム選択

### 使用制限（必須）
- **themeテンプレートは動画全体で1回のみ使用する（冒頭のテーマ紹介のみ）**
- セクション見出し・章タイトルにはthemeを使わず、**emphasis_large** を使う

### 表示タイミング
- 「今日のテーマは」と言った直後のフレームから
- テーマを言い終わるまで表示

---

## 自己紹介名刺（ProfileCard）ルール

### 基本原則
**動画冒頭の自己紹介パートに必ず表示する。**

### デザイン仕様
- **位置**: left: 30〜50px, top: 50%（左側・垂直中央）
- **背景**: 白（rgba(255, 255, 255, 0.95)）
- **ボーダー**: 赤（#EF4444）、左側に太い縦ライン
- **z-index**: 10

### 内容（video-context.md から取得）

`video-context.md` の「プロフィール」セクションから以下を読み取って表示する：

| 行 | 内容 | fontSize | 色 |
|----|------|----------|-----|
| 名前行 | プロフィールの名前 | 56〜64 | 黒 or 赤 |
| 肩書き大 | メインの肩書き | 36〜40 | 赤 `#EF4444` |
| 肩書き小 | サブ肩書き（英語など） | 18〜22 | グレー |
| 実績前置き | 導入テキスト | 24 | グレー |
| 実績①〜④ | 実績リスト | 28 | 黒 |

**video-context.md にプロフィールがない場合はユーザーに確認する。**

### タイミング
- 自己紹介の発話開始フレームから表示
- 自己紹介パート終了+数フレーム後に非表示
- transcript_words.jsonで正確なタイミングを取得すること

### SE
- 名刺表示タイミングに se/強調/ からランダム選択（volume: 0.35）

### コンポーネントテンプレート
```typescript
const ProfileCard: React.FC = () => {
  const frame = useCurrentFrame();
  const startFrame = /*自己紹介開始フレーム*/;
  const endFrame = /*自己紹介終了フレーム*/;
  if (frame < startFrame || frame > endFrame) return null;
  return (
    <div style={{
      position: "absolute", left: 40, top: "50%",
      transform: "translateY(-50%)", zIndex: 10,
      background: "rgba(255, 255, 255, 0.95)",
      borderLeft: "8px solid #EF4444",
      padding: "30px 40px",
      display: "flex", flexDirection: "column",
      gap: 8, whiteSpace: "nowrap",
    }}>
      <div style={{
        fontSize: 60, fontWeight: 900,
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
        color: "#111111",
      }}>{/* video-context.mdの名前 */}</div>
      <div style={{
        fontSize: 38, fontWeight: 900,
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
        color: "#EF4444",
      }}>{/* video-context.mdの肩書き */}</div>
      <div style={{
        fontSize: 20, fontWeight: 400,
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
        color: "#666666",
      }}>{/* video-context.mdのサブ肩書き */}</div>
      <div style={{
        fontSize: 24, color: "#888888",
        fontFamily: "'M PLUS Rounded 1c', sans-serif",
        marginTop: 8,
      }}>{/* video-context.mdの導入テキスト */}</div>
      {/* video-context.mdの実績リスト */}
      {["・実績1", "・実績2", "・実績3", "・実績4"].map((item, i) => (
        <div key={i} style={{
          fontSize: 28, fontWeight: 700,
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          color: "#111111",
        }}>{item}</div>
      ))}
    </div>
  );
};
```

---

## 自律判断ガイドライン

### 字幕カバー率90%ルール（最優先）

**発話時間の90%以上を字幕でカバーする。字幕がない時間は動画全体の10%以下に抑える。**

#### 基本方針: デフォルト字幕ON
- **すべての発話にデフォルトで字幕をつける**
- 特別なキーワード（数字・固有名詞・感情ピーク等）→ 強調スタイル + 対応SE
- 特別なキーワードがない場合 → **通常テロップ**（NormalTelop）SEなし

#### スキップしてよい例外
| 例外 | 理由 |
|------|------|
| フィラー（えーと、あのー、まあ） | 情報がない |
| 同じ言葉の言い直し・繰り返し | 冗長 |
| 箇条書き/表コンポーネントが表示中の区間 | コンポーネントが内容を代替 |
| 極端に短い相槌（うん、はい）1秒未満 | 字幕化しても読めない |

#### 作業手順（字幕追加時）
1. transcript_words.jsonを**全文通読**する
2. 発話を文単位で区切り、**すべての文に字幕を割り当てる**
3. 各字幕のスタイルを判断表に基づいて決定
4. 既存の字幕・序列・表コンポーネントと重複チェック
5. 未カバー区間がないか最終確認（カバー率90%以上を達成しているか）

---

### 強調すべきか判断表

| 判断項目 | 強調スタイルで表示 | 通常字幕で表示 |
|----------|------------------------|----------------------|
| **数字・金額（必須）** | 「1年で」「3倍」「500人」「100万円」等の具体的数字 | 曖昧な表現 |
| 固有名詞 | 地名・サービス名・ブランド名・大会名 | 一般名詞 |
| 見出し・タイトル | 「〇〇選」「〇つのコツ」「ポイント」 | 説明の途中 |
| 感情のピーク | 「最強」「絶対」「やばい」「注意」 | 淡々とした説明 |
| 視聴者への呼びかけ | 「あなたも」「今すぐ」「やってみて」 | 第三者の話 |
| 結論・要点 | 「つまり」「要するに」「ポイントは」 | 前置き・導入 |
| 専門用語 | その分野の専門用語（`video-context.md` 参照） | 一般的な単語 |
| **視聴者への問いかけ（必須）** | 「〜いませんか？」「〜ですよね？」「〜ご存知ですか？」 | 独り言・自問自答 |

---

### キーワード→スタイル早見表

| キーワード例 | 判定 | スタイル | SE |
|-------------|------|----------|-----|
| 「上達する」「強くなれる」「勝てる」 | ポジティブ | EmphasisTelop | 強調テロップ.mp3 |
| 「おすすめ」「最強」「一番大事」 | ポジティブ | EmphasisTelop | 強調テロップ.mp3 |
| 「〇〇万円」「〇〇人」「〇〇年」「〇〇倍」 | 数字+単位 | EmphasisTelop2 | 強調テロップ2.mp3 |
| 「ダメ」「やめて」「NG」 | ネガティブ | NegativeTelop | ネガティブ1.mp3 |
| 「注意」「気をつけて」「危険」 | ネガティブ | NegativeTelop | ネガティブ1.mp3 |
| 「もったいない」「損してる」 | ネガティブ強 | NegativeTelop2 | ネガティブ2.mp3 |
| 地名・ブランド名・サービス名 | 固有名詞 | EmphasisTelop | 強調テロップ.mp3 |
| 「〜な人向け」「〜いませんか？」 | ターゲット共感 | NegativeTelop | ネガティブ1.mp3 |
| 「やってみましょう」「始めましょう」 | 行動促進 | EmphasisTelop | 強調テロップ.mp3 |
| その分野の専門用語 | 専門用語 | EmphasisTelop | 強調テロップ.mp3 |

#### emphasis vs emphasis2 の使い分け（必須）
| 条件 | テンプレート | 例 |
|------|------------|-----|
| **数字+単位**を含む | **emphasis2** | 「1000万円」「3倍」「500人」「10年」 |
| **感情・概念の強調**（数字なし） | **emphasis** | 「人生が変わります」「最強ツール」「おすすめ」 |

- テキストに具体的な数字+単位（円・万・人・年・倍・%・回・件など）が含まれていたら **emphasis2**
- それ以外のポジティブ強調は **emphasis**

---

### 座布団スタイル判断表

| 発話内容の特徴 | スタイル | コンポーネント | SE |
|---------------|---------|---------------|-----|
| 成功・達成・実績（概念） | 強調グラデ | EmphasisTelop | 強調テロップ.mp3 |
| メリット・おすすめ（概念） | 強調グラデ | EmphasisTelop | 強調テロップ.mp3 |
| 数字+単位を含む強調 | 強調グラデ2 | EmphasisTelop2 | 強調+サイズ大.mp3 |
| 失敗・ダメな例 | ネガティブ1 | NegativeTelop | ネガティブ1.mp3 |
| 注意・警告 | ネガティブ1 | NegativeTelop | ネガティブ1.mp3 |
| 強い不安・絶望感 | ネガティブ2 | NegativeTelop2 | ネガティブ2.mp3 |
| 視聴者への問いかけ | ネガティブ1 | NegativeTelop | ネガティブ1.mp3 |
| 他者の発言・証言 | 第三者発言 | ThirdPartyTelop | 第三者発言.mp3 |
| 発言そのまま表示 | ノーマル | NormalTelop | なし |
| 動画全体のテーマ（冒頭1回のみ） | 今回のテーマ | ThemeTelop | se/ポジティブ/ |
| 見出し・章タイトル | 強調サイズ大 | EmphasisTelop(large) | 強調.mp3 |
| リスト・ポイント列挙 | 箇条書き | BulletList | 箇条書き.mp3 |

---

## 動画コンテキスト確認ルール（必須）

**字幕・テロップ作業を開始する前に、必ず `video-context.md` を読んで動画のターゲット・趣旨を把握する。**

### 手順
1. `video-context.md` がプロジェクトルートに存在するか確認する
2. **存在する場合**: ファイルを読み、ターゲット・趣旨・注意点を把握してから作業開始
3. **存在しない場合**: ユーザーに以下を質問してからファイルを作成する
   - この動画のターゲット（誰に向けた動画か）
   - 動画の趣旨・目的
   - 特に意識すべきポイント

---

## z-index（重なり順）ルール

| 要素 | z-index | 説明 |
|------|---------|------|
| 動画（ベース） | 0 | 一番下 |
| 背景画像・カバー画像 | 5 | 動画の上、字幕の下 |
| 暗いオーバーレイ | 7 | 画像と字幕の間（任意） |
| テロップ・字幕 | 10〜15 | 画像の上に表示 |
| 最重要テロップ（ProfileCard等） | 20 | 他の全要素より上 |

### 必須ルール
1. **画像を追加する際は必ずz-index: 5以下を指定**
2. **テロップ・字幕は必ずz-index: 10以上を指定**
3. **position: absoluteが両方に必要**（z-indexが効かないため）

---

## ワイプ（丸い小窓）ルール

スライド表示中に話者の顔を丸い小窓で見せる。

### 基本仕様
- **位置**: 右上（top: 30px, right: 30px）
- **サイズ**: 325×325px、円形クリップ（borderRadius: "50%"）
- **z-index**: 8（スライドの上、テロップの下）
- **boxShadow**: `0 4px 20px rgba(0,0,0,0.3)`
- **表示タイミング**: スライド背景が表示されている間（※全画面画像・全画面動画の表示中は非表示にする）
- **bulletList表示中はワイプを非表示にする**: BulletList表示中はデモか話者動画のどちらが流れているか不定のため、ワイプも非表示にする
- **muted必須**: ワイプのOffthreadVideoには必ず `muted` を指定する（ベース動画と音声が二重になるため）

### サイズが325pxの理由
280pxだと `objectPosition` + `scale` の組み合わせが極端な場合に**動画フレームの端が円の隅に灰色の角として露出する**。325pxにすることで `object-fit: cover` の計算が変わり、端の露出を防げる。

### コンポーネントテンプレート
```typescript
// ワイプ表示（325pxで端露出を防止）
{slideVisible && (
  <div style={{
    position: "absolute",
    top: 30, right: 30,
    width: 325, height: 325,
    borderRadius: "50%",
    overflow: "hidden",
    zIndex: 8,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  }}>
    <OffthreadVideo
      muted
      src={staticFile("video/input_cut.mp4")}
      style={{
        width: "100%", height: "100%",
        objectFit: "cover",
        objectPosition: "50% 0%",
        transform: "scale(1.5)",
      }}
    />
  </div>
)}
```

### ワイプ位置調整手順（計算＋方向ループ）

objectPositionの数値は直感と合わないため、以下の手順で合わせる。

#### Step 1: 顔座標の特定
1. `ffmpeg -ss 5 -frames:v 1` で動画フレームを1枚取得
2. Puppeteerで50px刻みのピクセルグリッド画像を生成して表示
3. ユーザーに顔の中心座標を聞く（例: X:1300, Y:450）

#### Step 2: 初期値計算
```javascript
// divサイズは325px
const coverScale = 325 / 1080;           // = 0.3009
const renderedW = 1920 * coverScale;      // = 577.8
const overflowX = renderedW - 325;        // = 252.8
const renderedFaceX = faceX * coverScale;
const visibleHalfW = 325 / scale / 2;
const offsetX = renderedFaceX - visibleHalfW - (162.5 - 162.5 / scale);
const objX = Math.round(Math.min(100, Math.max(0, offsetX / overflowX * 100)));
const translateY = Math.round(162.5 - faceY * coverScale);
```
→ `objectPosition: "{objX}% 0%"`, `transform: "scale({scale}) translateY({translateY}px)"`

#### Step 3: レンダリングして確認
スライド表示中のフレームでスクショを撮り、ユーザーに見せる

#### Step 4: 方向ループ（最大2-3回）
ユーザーに「**上 / 下 / 左 / 右 / OK**」を聞いて微調整：
- **上**: translateY += 7
- **下**: translateY -= 7
- **左**: objX += 3
- **右**: objX -= 3

OKが出たら確定。

---

## 画像表示ルール（絶対遵守）

**画像は常にフェードイン/フェードアウトなし。パッと表示してパッと消える。**

```typescript
// NG: フェードアニメーション（絶対禁止）
const opacity = interpolate(frame, [startFrame, startFrame + 15, endFrame - 15, endFrame], [0, 1, 1, 0]);

// OK: パッと表示
if (frame < startFrame || frame > endFrame) return null;
// opacityのinterpolateは一切使わない
```

### 左側挿入画像の固定位置（変更不可）

| プロパティ | 固定値 |
|-----------|--------|
| top | 369 |
| left | 180 |
| width | 720 |
| height | 405 |
| zIndex | 5 |

- `objectFit: "cover"` 必須
- スライド表示中は非表示（`!slideVisible` 条件）

### AI画像生成のプロンプトルール

- **英語で書く**（英語の方が品質が高い）
- **末尾に必ず `no text no words no letters` を追加**（文字入り防止）
- 発話の内容・感情・トーンに合わせる
- **場面照合は厳格に**:「ギリOK」はNG → 明確にマッチしていなければ再生成

---

## 複数座布団の固定位置配置ルール（全種類共通・必須）

**複数の座布団（テロップブロック）が順番に表示される場面すべて**に適用する。

`justifyContent: "center"` や `transform: translateY(-50%)` で中央配置すると、ボックスが追加されるたびに全体が上下に動いて視聴者の目障りになる。

**最終状態（全ボックスが出揃った状態）の位置を逆算して、上から固定位置で配置する。**

```typescript
// NG: 動的中央配置
style={{ top: "50%", transform: "translateY(-50%)" }}

// OK: 最終状態から逆算した固定位置
style={{ top: 373 }}  // 固定値
```

---

## Remotion Sequence必須ルール

**コンポジション途中から再生する短い動画（OffthreadVideo）は、必ず `<Sequence from={startFrame}>` でラップする。**

```typescript
// NG: Sequenceなし（静止画になる）
{frame >= 14850 && frame <= 14994 && (
  <OffthreadVideo src={staticFile("videos/sample.mp4")} />
)}

// OK: Sequenceでラップ（正常に再生される）
<Sequence from={14850} durationInFrames={145} layout="none">
  <OffthreadVideo src={staticFile("videos/sample.mp4")} />
</Sequence>
```

---

## 既存素材の微調整ルール

1. **全体検索ではなく、現在位置の前後数秒以内を参照する**
2. 既存コンポーネントのstartFrame/endFrameを確認
3. そのフレーム付近（±数秒＝±90フレーム程度）のtranscript_words.jsonを読む
4. 該当する発話のタイミングを特定して調整

---

## 視聴維持率向上ルール（冒頭3分）

- **目標**: 冒頭3分（0〜180秒）の視聴維持率を高める
- **ルール**: 2秒に1度、以下のいずれかで動きをつける
  - イメージ画像の追加
  - SE（効果音）の追加
  - テロップの切り替え
- **理由**: アルゴリズム的に冒頭3分の維持率が動画の伸びに影響
