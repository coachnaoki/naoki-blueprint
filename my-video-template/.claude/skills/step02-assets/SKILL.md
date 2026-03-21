---
name: step02-assets
description: 動画制作に必要な素材（動画ファイル・BGM・SE・画像）がすべて揃っているか確認する。
allowed-tools: Read, Glob, Grep, Bash(ls *), Bash(ffprobe *)
---

# Step 02: 素材チェック

動画制作に必要な素材ファイルがすべて揃っているか確認する。

## やること

### 1. 必須素材の存在確認

以下のファイル・ディレクトリを確認する：

| 素材 | パス | 必須 |
|------|------|------|
| メイン動画 | `public/` 内の `.mp4` ファイル | ✅ |
| BGM | `public/bgm.mp3` | ✅ |
| SE（効果音） | `public/se/*.mp3` | ✅ |
| トランスクリプト | `public/transcript_words.json` | ✅ |
| スライドHTML | ユーザーに確認 | 任意 |
| 追加画像 | `public/slides/` 内の画像 | 任意 |

### 2. SE フォルダの網羅性チェック

SEはフォルダ単位で管理し、再生時にフォルダ内からランダム選択する。
以下のSEフォルダが `public/se/` 内に存在し、中に `.mp3` ファイルが入っているか確認する：

- `se/強調/` — normal_emphasis / emphasis_large / third_party / bullet_list / table / profile 用
- `se/ポジティブ/` — emphasis / emphasis2 用
- `se/ネガティブ/` — negative / negative2 / mascot 用
- 専用SE（LINE誘導 / チャンネル登録 / 本日のテーマ等）

### 3. 動画ファイルの情報取得

`ffprobe` でメイン動画の解像度・FPS・長さを確認し、表示する。

### 4. 不足素材の報告

不足しているファイルがあればリストアップし、ユーザーに対応を確認する。

## 完了条件
- 必須素材がすべて存在する
- 動画の解像度・FPS・長さを把握している
- 不足素材がある場合はユーザーに報告済み

## 完了後

```
✅ Step 02 完了: 素材チェックが完了しました。

【確認結果】
- メイン動画: ○○.mp4（1920x1080, 30fps, ○○秒）
- BGM: ✅
- SE: ✅（○○個）
- トランスクリプト: ✅
- 不足: （あれば記載）

次のステップ → /step03-jumpcut（ジェットカット）
進めますか？
```
