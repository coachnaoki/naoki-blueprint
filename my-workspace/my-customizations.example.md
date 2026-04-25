# My Customizations — 自分が改変したテンプレを記憶する場所

このファイルは Claude Code が動画生成時に自動参照します。
**自分流に変えたテロップ・アニメーション・コンポーネントの設定をここに書いておけば、
新しい動画を作るときも改変済みの状態で反映されます。**

毎回同じカスタマイズをやり直す手間がなくなります。

`my-customizations.example.md` をコピーして `my-customizations.md` にリネームし、
自分用に書き換えてください。

```bash
cp my-customizations.example.md my-customizations.md
```

---

## 改変したテロップデザイン

自分流に変えたテロップの設定をここに書きます。フォント・色・サイズ・縁取り など。

例:
- emphasis のフォントを `Shippori Mincho` から `Noto Serif JP` に変更
- emphasis2 の金グロー外光を弱く (strokeWidth 22 → 18)
- normal_emphasis の強調ワード色を `#CC3300` から `#FF6600` (オレンジ寄り) に変更
- third_party の引用符を半角 ｢｣ から全角 「」 に戻す

書き方は自由。具体的な値・色コード・パラメータを書いておくと反映されやすいです。

---

## 改変したアニメーション

slideUp のフレーム数・easing・delay 等の調整を記録。

例:
- emphasis の slideUp を 10フレーム → 15フレーム (ゆっくり)
- normal_emphasis に slideLeft アニメを追加 (デフォルトはアニメなし)
- フェードアウトを全テンプレに復活 (デフォルトは即消し)

---

## 改変したコンポーネント

特殊コンポ (BulletList / CTA / HeadingBanner / ThemeTelop など) の改変を記録。

例:
- BulletList のボックス色を青 `#2563EB` → 緑 `#10B981`
- LineCTA の文字サイズを 66 → 72 に拡大
- ThemeTelop のフォントを Yu Gothic → Noto Sans JP に変更

---

## その他のカスタマイズ

BGM フェード時間・画像挿入の挙動・SE 音量など。

例:
- BGM フェードインを 30フレーム → 60フレームに延長
- SE 音量を 0.06 → 0.08 (やや大きく)
- 画像挿入の全画面表示時間を最低 60フレーム → 90フレームに延長

---

## 書き方のコツ

- **具体的な数値・色コードを書く** → Claude Code が即反映
- **「なぜそうしたか」を一言添える** → 自分が後で見て分かる
- **CLAUDE.md の固定値ルール (色パレット・フォント等) を覆す変更は自己責任**で
  - 大幅な変更は Naoki 式から外れる場合あり
- **書いた内容はアップデートで上書きされません** (`.gitignore` で保護されています)
