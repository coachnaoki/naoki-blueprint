---
name: slides-to-gslides
description: 台本からHTMLスライドを生成し、Puppeteerで撮影してGoogle Slidesに自動挿入する（台本→HTML→PNG→Google Slides）
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(node *), Bash(ls *), Bash(open *), Bash(rm *)
---

# 台本 → HTMLスライド → Google Slides 自動挿入

台本を受け取り、HTMLスライドを生成 → Puppeteerで撮影 → Google Slidesに自動挿入する一気通貫スキル。

## フェーズ1: 台本 → HTMLスライド生成

### 1-1. 台本の確認

ユーザーから台本を受け取る。台本には以下が含まれる：
- 各スライドに表示する内容（テキスト、構成）
- スライドの順番

### 1-2. テンプレートの選定

`gas-genspark/seminar-slides.html` のテンプレートシステムを使う。

| テンプレート | 用途 | 必須フィールド |
|---|---|---|
| `title` | タイトルスライド | icon, title, subtitle |
| `three-cards` | 3カラムカード | title, cards[{icon, title, lines}] |
| `three-tactics` | 3戦術カード | title, cards[{role, icon, main, sub}] |
| `two-columns` | 左右比較 | title, columns[{badge, icon, main}] |
| `steps` | 縦ステップリスト | title, steps[{label, icon, style, content, num}] |
| `big-message` | 大メッセージ | title, icon, message |
| `closing` | クロージング | title, icon, cards[{title, desc}] |

| 台本の内容 | 推奨テンプレート |
|---|---|
| タイトル・章の始まり | `title` |
| 3つのポイント・コツ | `three-cards` または `three-tactics` |
| 比較・対比 | `two-columns` |
| 手順・ステップ | `steps` |
| 警告・重要メッセージ | `big-message` |
| まとめ・締めくくり | `closing` |

### 1-3. SLIDE_SCRIPT の生成

`gas-genspark/seminar-slides.html` の `SLIDE_SCRIPT` 配列を台本の内容で書き換える。

**テンプレートエンジン（renderTitle等の関数群）やCSS・HTMLは変更しない。SLIDE_SCRIPT部分のみ編集。**

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
- `fa-brain` — 知識・戦術・考え方
- `fa-eye` — 観察・視点
- `fa-exclamation-triangle` — 警告・注意
- `fa-check-circle` — 確認・OK
- `fa-lightbulb` — アイデア・ヒント
- `fa-chart-line` — 成長・データ
- `fa-star` — おすすめ・重要
- `fa-chalkboard-teacher` — 指導・レッスン

### 1-4. ブラウザで確認

```bash
open gas-genspark/seminar-slides.html
```

ユーザーに確認してもらい、修正があれば対応する。
**ユーザーのOKが出てからフェーズ2に進む。**

---

## フェーズ2: 撮影 → Google Slides挿入

### 2-1. キャッシュ削除（HTMLを変更した場合）

```bash
rm -rf /tmp/seminar-slides/*.png
```

### 2-2. 撮影 → 挿入の実行

```bash
node gas-genspark/import-slides.mjs
```

スクリプトが自動で以下を実行する：
1. **撮影**: Puppeteerで全スライドをPNG撮影（1920x1080, deviceScaleFactor: 2, `.slide-container`をクリップ）
   - 撮影済みPNGが `/tmp/seminar-slides/` にあればスキップ
2. **配信**: ローカルHTTPサーバー（port 8765）+ localtunnelで一時公開
3. **挿入**: Google Slides APIで既存スライド全削除 → 新規スライド+画像挿入
4. **クリーンアップ**: トンネル・サーバーを自動停止

### 2-3. 結果確認

```bash
open "https://docs.google.com/presentation/d/14UOt3rfC7zXiOuwysVzWxEujDGMlb8X3KGvrA7yxB-M/edit"
```

---

## 環境情報

| 項目 | 値 |
|------|-----|
| HTMLスライド | `gas-genspark/seminar-slides.html` |
| 挿入スクリプト | `gas-genspark/import-slides.mjs` |
| PNG一時保存先 | `/tmp/seminar-slides/` |
| Google Slides ID | `14UOt3rfC7zXiOuwysVzWxEujDGMlb8X3KGvrA7yxB-M` |
| サービスアカウント | `cursor@gen-lang-client-0767362512.iam.gserviceaccount.com` |
| サービスアカウントキー | `/Users/kobayashinaoki/Desktop/7_AI/Cursor/auto-journal/service_account.json` |

### なぜlocaltunnelが必要か
- サービスアカウントにはGoogle Driveのストレージ容量がない（アップロード不可）
- Google Slides APIの`createImage`はURLからしか画像を取得できない
- ローカルのPNGを一時的にインターネットに公開してURLを渡す

---

## 完了後

```
✅ 完了: 台本 → Google Slidesに挿入しました

【結果】
- スライド数: ○○枚
- テンプレート: title × ○, big-message × ○, ...
- プレゼンテーション: https://docs.google.com/presentation/d/.../edit
```
