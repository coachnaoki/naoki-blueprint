# Google生成AI 利用規約 遵守ガイド

**Gemini API（旧nanobanana系）で画像生成する際は、Google の Generative AI Prohibited Use Policy に従う必要がある。違反するとAPIキーの無効化・Googleアカウントの停止につながる。**

公式: https://policies.google.com/terms/generative-ai/use-policy

---

## 絶対NGリスト（業種関係なく全員NG）

以下の語・概念をプロンプトに**絶対に含めない**。AIが推論で生成してしまうため、明示的に「含めない」指定が必要。

| カテゴリ | NG例（プロンプトに書かない語） | 理由 |
|---|---|---|
| **実在人物** | フェデラー / イーロン・マスク / 大谷翔平 / Trump / Obama 等 | 識別可能な人物像の生成禁止 |
| **公人・著名人** | celebrity / president / famous athlete | 同上 |
| **未成年** | child / kid / boy / girl / student / minor / teenager / school | 未成年生成は厳禁 |
| **ブランド・商標** | Nike / Adidas / Apple / Disney / Coca-Cola / YONEX 等 | 商標侵害 |
| **著作権キャラ** | Pikachu / Mario / Mickey Mouse / アニメキャラ全般 | 著作権侵害 |
| **暴力** | blood / wound / weapon / gun / knife / fight / violence | 暴力描写禁止 |
| **性的描写** | nude / sexy / erotic / lingerie / bikini close-up | 性的コンテンツ禁止 |
| **医療** | medical diagnosis / prescription / pills close-up / surgery | 医療助言と誤認 |
| **政治・宗教** | politician / pope / cross / Buddha statue / mosque | 偏見コンテンツ |
| **金融偽造** | passport / ID card / banknote close-up / credit card | 詐欺・偽造扱い |
| **危険物** | drugs / explosives / hazardous chemicals | 違法行為扱い |

---

## 業種別 やりがちな違反パターン

| 動画ジャンル | やりがちな失敗 | 安全な代替 |
|---|---|---|
| 子育て・教育 | 「親子で勉強」「子供のレッスン」 | 「机と教科書だけ」「大人の手元」 |
| ビジネス・自己啓発 | 「マスク氏のような起業家」 | 「無名の大人のシルエット」 |
| スポーツ指導 | 「Nikeウェアの選手」 | 「unbranded sportswear」「シルエット」 |
| 副業・投資 | 「お札の山」「お金のクローズアップ」 | 「グラフ」「抽象的な成長イメージ」 |
| 美容・健康 | 「水着の女性」「肌のクローズアップ」 | 「化粧品のフラットレイ」「抽象画」 |
| 医療・健康 | 「処方薬」「診察シーン」 | 「観葉植物」「ヘルシーな食材」 |
| アニメ・ゲーム解説 | 「マリオ風キャラ」「アニメ調少女」 | 「抽象的なゲーム機」「コントローラー」 |
| 政治・社会問題 | 「政治家の肖像」 | 「議事堂の建物」「群衆のシルエット」 |
| ホラー・怖い話 | 「血まみれの手」「武器」 | 「霧の森」「閉ざされたドア」 |
| 占い・スピリチュアル | 「神」「教会」「十字架」 | 「夜空」「タロットカード（抽象）」 |
| 失敗談・挫折 | 「うずくまる人物」 | 「曇り空」「閉じたノート」「枯れた花」 |

---

## 安全な推奨フレーズ集（迷ったらこれを使う）

### 人物表現の逃げ方
- `fictional adult character` — 架空の大人
- `anonymous person` — 顔を特定できない人物
- `generic appearance` — 一般的な外見
- `back view` — 後ろ姿
- `silhouette` — シルエット
- `from distance` — 遠景
- `no faces visible` — 顔を写さない
- `hands only` — 手元のみ
- `unbranded clothing` — ブランドなしの服
- `plain attire` — シンプルな服装

### 物だけ・抽象表現
- `object only` — 物だけ
- `scene only with no people` — 人物なしの風景
- `abstract concept` — 抽象的概念
- `flat design illustration` — フラットデザイン
- `stylized illustration` — スタイライズされたイラスト
- `minimalist composition` — ミニマル構図

---

## プロンプト末尾の必須NG文字列（コピペ用）

すべての画像生成プロンプトの末尾に以下を必ず追加する。

```
no text, no words, no letters,
no real people, no celebrities, no public figures,
no children, no minors, no teenagers,
no logos, no brand names, no trademarks, no copyrighted characters,
no violence, no blood, no weapons, no explicit content,
no medical procedures, no religious symbols, no currency or IDs
```

縦動画の場合はさらに `vertical 9:16 aspect ratio` を、横動画の場合は `horizontal 16:9 aspect ratio` を追加。

---

## 生成前セルフチェックリスト（Claude必須実行）

プロンプトを確定する前に、以下を1つずつチェックする。1つでも該当したら**プロンプトを書き換える**こと。

- [ ] 実在の人物名・有名人名・公人名が含まれていないか？
- [ ] `child` / `kid` / `student` / `minor` / `teen` / `school` などの未成年を示す語が含まれていないか？（人物を出す場合は必ず `adult` を明示）
- [ ] ブランド名・商標（Nike / Apple / Disney 等）が含まれていないか？
- [ ] 著作権キャラ（Pokemon / Marvel / Anime characters など）が含まれていないか？
- [ ] 暴力・流血・武器を示す語が含まれていないか？
- [ ] 性的・露出度の高い表現が含まれていないか？
- [ ] 医療診断・処方・治療シーンが含まれていないか？
- [ ] 政治家・宗教指導者・宗教シンボルが含まれていないか？
- [ ] 通貨・身分証・パスポートのクローズアップが含まれていないか？
- [ ] **末尾の必須NG文字列を追加したか？**

---

## 大量生成（スパム判定）の回避

- **1セッション最大15枚まで**（多すぎるとスパム扱いされる）
- **同じプロンプトの連投禁止**（バリエーションを変える）
- 失敗作の再生成は最小限に（プロンプトを直してから1回だけ）

---

## 違反した場合のリスク

- APIキーの即時無効化
- **Googleアカウント自体の停止**（Gmail / Drive / YouTube など全Googleサービスにログイン不可）
- 復旧申請しても通らないケースあり

→ 違反は配布元（Naoki）の責任ではなく、**生成したユーザー本人の自己責任**。慎重に運用すること。

---

## 参考リンク

- Generative AI Prohibited Use Policy: https://policies.google.com/terms/generative-ai/use-policy
- Gemini API Additional Terms: https://ai.google.dev/gemini-api/terms
- Google Cloud Terms: https://cloud.google.com/terms
