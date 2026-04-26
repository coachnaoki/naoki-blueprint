---
name: link-google
description: 2台目のPCでこのライセンスを使えるようにするため、Google アカウントと連携する。「2台目で使いたい」「別PCで使いたい」「Google連携」と言われた時に起動する。
argument-hint: [なし]
allowed-tools: Read, Bash(node scripts/linkGoogle.mjs *), Bash(cat *), Bash(ls *)
---

# 2台目PCでライセンスを使うための Google 連携

このコマンドは、Google アカウントを連携することで**最大2台まで**ライセンスを使えるようにします。
（既存の1台目PCは引き続き使えます。何も変わりません。）

## やること

### 1. ライセンスID 確認

まず `.license` ファイルからライセンスIDを取得する。

```bash
cat .license
```

JSON 内の `license_id` フィールドを読み取る。形式は `NK-XXXX-XXXX-XXXX`。

`.license` が無い場合は、ユーザーに「ライセンスID（`NK-XXXX-XXXX-XXXX` 形式）を教えてください」と聞く。

### 2. linkGoogle.mjs 実行

ライセンスIDを取得できたら、以下を実行する:

```bash
node scripts/linkGoogle.mjs <ライセンスID>
```

### 3. ブラウザでの操作を案内

実行直後にユーザーへ以下を **必ず**伝える:

```
🔐 これからブラウザが自動で開きます

1. 普段使っている Google アカウントでログインしてください
2. 「未確認のアプリ」と警告が出る場合があります
   → 「詳細」をクリック
   → 「naoki-blueprint（安全ではないページ）に移動」をクリック
3. 「naoki-blueprint がメールアドレスとプロフィール情報の表示を希望しています」と出たら
   → 「続行」または「許可」をクリック
4. 「✅ 認証成功」と表示されたら、ブラウザのタブを閉じて、ここに戻ってきてください

⏳ 認証完了を待っています…
```

### 4. 結果確認

ターミナル出力を読み、以下のいずれかでフィードバックする:

#### 成功時（`✅ Google 連携完了！` が出た場合）

```
✅ 連携できました！

【あなたのアカウント】
- 名前: ○○さん
- Google: ○○@gmail.com
- スロット: fp1 / fp2 のどちらか

【これからできること】
- このPCでも引き続き使えます
- もう1台のPCでも、同じ手順で /link-google を実行すれば 2台まで使えます
```

#### エラー時

| エラーメッセージ | 対処 |
|---|---|
| ライセンスIDが見つかりません | 打ち間違いを疑う。`.license` の値を確認するか、発行元に問い合わせ |
| このライセンスは別の Google アカウントで紐付け済み | 過去に他の Google で連携済み。**発行元（Naoki）に連絡** して紐付け解除を依頼 |
| 既に2台まで登録されています | 3台目を使うには発行元（Naoki）に **fingerprint リセット** を依頼 |
| タイムアウト（10分経過しました） | ブラウザでの操作が遅かった。もう一度 `/link-google` を実行 |
| 別PCのライセンスです | 既存PCの fingerprint と違うPCで実行している。これは正常な動作で、Google 連携でこの問題が解消される |

エラーメッセージから問題を特定し、ユーザーに優しく説明する。

## 失敗時のフォローアップ

linkGoogle.mjs が失敗した場合、以下を確認:
1. インターネット接続があるか
2. `scripts/linkGoogle.mjs` ファイルが存在するか（無ければ親 naoki-blueprint からコピー）
3. ブラウザがブロックされてないか（ファイアウォール等）

ファイルが存在しない場合の対応:

```bash
# 親 naoki-blueprint の .template-shorts/scripts/ または .template/scripts/ からコピー
cp ../../.template-shorts/scripts/linkGoogle.mjs ./scripts/
# または
cp ../../.template/scripts/linkGoogle.mjs ./scripts/
```

その後再実行。

## 完了条件

- `.license` に `refresh_token` フィールドが追加されている
- ターミナルに「✅ Google 連携完了！」が表示された
- ユーザーが「2台目でも使えるようになった」と理解している
