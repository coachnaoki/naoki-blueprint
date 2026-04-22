# telop-svg フォルダ

emphasis3 テロップで使うSVG画像を配置するフォルダ。

## 使い方

1. キラーワードをロゴ/意匠化したSVGをここに置く（例: `逆転.svg`, `Japanese-Ninja.svg`, `カナダ式.svg`）
2. `src/telopData.ts` で emphasis3 テンプレートとして指定:

```typescript
{
  text: "逆転",                 // 分かりやすさのためSVG内の文言を入れておく
  svgFile: "逆転.svg",          // public/telop-svg/ 配下のファイル名
  svgWidth: 1000,              // 表示幅(px)。省略時1000。最大1400
  startFrame: 300,
  endFrame: 390,
  template: "emphasis3",
}
```

## SVGの推奨仕様

- **viewBox** を必ず設定（例: `viewBox="0 0 800 220"`）
- `width`/`height` の指定は自由（表示時は `svgWidth` で上書きされる）
- **文字はアウトライン化**（フォント依存を避ける）か、Webフォントを含める
- **透過背景**（白塗りは避ける。動画上に乗せるため）
- アスペクト比は自由だが、**高さ200〜300px相当**が視覚的バランス良い

## サンプル

- `sample-gyakuten.svg` — 「逆転」の赤座布団+金文字ロゴ
