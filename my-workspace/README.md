# my-workspace/ — あなたのテンプレ改変を記憶する場所

このフォルダは、自分流に改変したテロップ・アニメ・コンポーネントの**設定を保存しておく場所**です。
naoki-blueprint のすべての動画プロジェクトから自動参照されます。

新しい動画を作るたびに「またあのカスタマイズやり直し…」が不要になります。
1度書いておけば、Claude Code が次の動画でも改変済みの状態で生成してくれます。

---

## 使い方（初回セットアップ）

### `my-customizations.md` を作成する

同じフォルダの `my-customizations.example.md` をコピーして、自分用に書き換えてください。

```bash
cp my-customizations.example.md my-customizations.md
```

`my-customizations.md` に「改変したテロップデザイン」「改変したアニメ」「改変したコンポ」「その他カスタマイズ」を書きます。
具体的な数値・色コード・パラメータを書いておくと Claude Code が忠実に反映します。

書いたら保存。次の動画作成時から step01 / step08 / step09 等が自動的に読み込みます。

---

## 自動アップデートで消えないの？

消えません。

- `my-customizations.md` は `.gitignore` で除外されており、`git reset --hard` のアップデートでも保持されます
- `my-customizations.example.md` と `README.md` だけはテンプレ側で更新されます (上書きOK)

---

## Claude Code はどう使う？

各 step (特に step08-telop / step09-composition / step16-special-components 等) が
開始時に `../../my-workspace/my-customizations.md` の存在を確認し、あれば読み込みます。
内容に応じて生成物のテロップデザイン・アニメ・コンポを調整します。

`my-customizations.md` が無い場合は従来通り Naoki式デフォルトで生成されます。

---

## 注意事項

- CLAUDE.md の**固定値ルール** (テロップ色パレット・フォント・8文字制限等) を覆す変更は
  自己責任になります。可能な限り **小さな調整** にとどめると安全です
- 大幅な改変はテンプレの整合性を崩す場合があります
- 書いた内容に問題があれば Claude Code がそのままエラーで止まることがあります
