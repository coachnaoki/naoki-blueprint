---
name: step15-slides-gen
description: 台本（ユーザー提供）をもとに、gas-gensparkのテンプレートシステムでHTMLスライドを自動生成する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node *)
---

# Step 15: スライド生成（台本→HTML）

ユーザーから受け取った台本をもとに、`gas-genspark/slides.html` のテンプレートシステムを使ってHTMLスライドを生成する。

## 前提条件
- Step 05（文字起こし修正）が完了していること
- ユーザーから台本（スライドの構成・内容）が提供されていること

## テンプレート一覧

| テンプレート | 用途 | 必須フィールド |
|---|---|---|
| `title` | タイトルスライド | icon, title, subtitle |
| `three-cards` | 3カラムカード | title, cards[{icon, title, lines}] |
| `three-tactics` | 3戦術カード | title, cards[{role, icon, main, sub}] |
| `two-columns` | 左右比較 | title, columns[{badge, icon, main}] |
| `steps` | 縦ステップリスト | title, steps[{label, icon, style, content, num}] |
| `big-message` | 大メッセージ | title, icon, message |
| `closing` | クロージング | title, icon, cards[{title, desc}] |

## やること

### 1. 台本の確認

ユーザーから台本を受け取る。台本には以下が含まれる：
- 各スライドに表示する内容（テキスト、構成）
- 動画の流れに沿った順番

### 2. テンプレートの選定

台本の各スライドに最適なテンプレートを選ぶ：

| 台本の内容 | 推奨テンプレート |
|---|---|
| タイトル・章の始まり | `title` |
| 3つのポイント・コツ | `three-cards` または `three-tactics` |
| 比較・対比 | `two-columns` |
| 手順・ステップ | `steps` |
| 警告・重要メッセージ | `big-message` |
| まとめ・締めくくり | `closing` |

### 3. SLIDE_SCRIPT の生成

`gas-genspark/slides.html` の `SLIDE_SCRIPT` 配列を台本の内容で書き換える。

#### テキスト記述ルール（必須）
1. 1項目につき最大2行まで
2. 改行は文節の境界で行う（助詞・て形・文末の直後など）
3. 改行直前に「、」「。」は付けない（削除する）
4. 単語の途中で改行しない
5. 1行に収まる文には改行を入れない

#### 改行の書き方
- steps の content/label、closing の desc、panel の label → `<br>` を使う
- big-message の message、title の title → `\n` を使う（自動で `<br>` に変換）

#### ハイライト（黄色マーカー）
```html
<span style='background:#CCFF00'>強調テキスト</span>
```
※ px-2 などのパディングは絶対に付けない

#### FontAwesome アイコン
よく使うアイコン例：
- `fa-trophy` — 優勝・実績
- `fa-bullseye` — 的・精度
- `fa-map-marker-alt` — 位置・場所
- `fa-brain` — 知識・戦術・考え方
- `fa-eye` — 観察・視点
- `fa-exclamation-triangle` — 警告・注意
- `fa-check-circle` — 確認・OK
- `fa-hand-holding-heart` — 安心・サポート
- `fa-chalkboard-teacher` — 指導・レッスン
- `fa-play-circle` — スタート・再生
- `fa-lightbulb` — アイデア・ヒント
- `fa-chart-line` — 成長・データ
- `fa-star` — おすすめ・重要

### 4. slides.html の更新

`gas-genspark/slides.html` の `SLIDE_SCRIPT` 部分のみを編集する。テンプレートエンジン（renderTitle等の関数群）やCSS・HTMLは変更しない。

### 5. ブラウザで確認

```bash
open gas-genspark/slides.html
```

ユーザーに確認してもらい、修正があれば対応する。

## 完了条件
- `gas-genspark/slides.html` の SLIDE_SCRIPT が台本の内容で更新されている
- テキスト記述ルールに準拠している
- ユーザーが内容を確認済み

## 完了後

```
✅ Step 06 完了: スライドHTMLを生成しました。

【生成スライド】
- スライド数: ○○枚
- テンプレート: title × ○, big-message × ○, ...

次のステップ → /step16-slides-capture（スライドキャプチャ）
進めますか？
```
