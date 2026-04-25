---
name: step14-final
description: ショート動画の最終レンダリング。本編コンポジションを1080×1920のMP4に書き出して完成。ユーザーが「レンダリング」「書き出し」「出力」「最終」「render」「final」「ステップ14」と言ったら起動する。
argument-hint: [なし]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx tsc *), Bash(npx remotion render *), Bash(ls *), Bash(ffprobe *), Bash(mkdir *), Bash(df *), Bash(du *), Bash(node *), Bash(node scripts/loudnorm.mjs *)
---

<!-- LICENSE_GUARD: DO NOT REMOVE -->
> **認証必須**: このステップ開始前に `node scripts/_chk.mjs step14-final` を実行。exit code が 0 以外なら即中止し「ライセンスが無効です。権利者にお問い合わせください」と伝える。（詳細は CLAUDE.md の「ライセンス認証」セクション参照）

# Step 14: 最終レンダリング（ショート動画用）

本編コンポジションを縦動画MP4として書き出して完成。

## ショート動画は1回レンダリングで完結

YouTube横動画版（`.template/`）と違い、OP連結・ハイライト抽出は不要。
1回のレンダリングで `public/output/` に最終MP4が出る。

## 前提条件

- Step 13（BGM挿入）が完了していること
- TypeScript ビルドが通ること
- ディスク容量500MB以上の空き

## やること

### 1. ビルドチェック

```bash
npx tsc --noEmit
```

エラーが出たら修正してから次に進む。

### 2. ディスク空き容量確認

```bash
df -h .
```

500MB以上の空きがあることを確認。

### 3. レンダリング

```bash
mkdir -p public/output
npx remotion render MainVideo public/output/<出力ファイル名>.mp4
```

出力ファイル名の命名規則：`shorts-<トピック>-<日付>.mp4`
例: `shorts-tennis-tips-20260417.mp4`

### 4. ラウドネス正規化（YouTube Shorts/TikTok/Reels 共通基準 -14 LUFS）

最終MP4にラウドネス正規化を適用する。二段階loudnormで **-14 LUFS / -1 dBTP / LRA 11** に揃える。

```bash
node scripts/loudnorm.mjs public/output/<ファイル名>.mp4 public/output/<ファイル名>_normalized.mp4
```

`*_normalized.mp4` がアップロード用の完成品。各プラットフォームの normalization と一致するので、視聴時に音量が変動しない。

### 5. 完成確認

```bash
ls -la public/output/
ffprobe -v quiet -show_entries format=duration,size:stream=width,height,r_frame_rate -of default=noprint_wrappers=1 public/output/<ファイル名>_normalized.mp4
```

確認項目:
- **解像度**: 1080×1920（縦）
- **fps**: video-context.md の設定通り（step02 で本編動画から自動検出した値）
- **ラウドネス**: `I=-14.xx LUFS` 付近

### 6. プレビュー再生

```bash
node scripts/open-file.mjs public/output/<ファイル名>_normalized.mp4
```

### 6. アップロード前のチェックリスト

- [ ] 1080×1920 縦動画になっている
- [ ] 冒頭3秒で内容が伝わる
- [ ] テロップが画面中央に配置されている
- [ ] 下部UI領域（1500px以下）にテキストが入っていない
- [ ] BGM・SEが入っている

## 動画完成時の改変記録 (必須)

レンダリング完了後、以下を実行する:

1. 動画作成中に記録した `[STYLE-LOG]` (CLAUDE.md「動画作成中の改変追跡」参照) を集計
2. 改変が1件でもあった場合、ユーザーに以下を提示:

```
今回の動画作成中、以下の改変を行いました:
1. {step}: {テンプレ}: {変更内容}
2. ...

これらを ../../my-workspace/styles/{動画スタイル}.md に追記して、
次回以降同じスタイルの動画で自動反映しますか? (yes/no)
```

3. ユーザーが **yes** と答えた場合:
   - `../../my-workspace/styles/{video-context.md の style 値}.md` を開く (無ければ新規作成)
   - 末尾に `## YYYY-MM-DD 追記` ブロックを追加して全改変を箇条書きで記録
4. **no** の場合: 何もしない

`[STYLE-LOG]` が0件 (改変なし) なら確認スキップ。

## 完了後

```
✅ Step 14 完了: ショート動画が完成しました。

【ファイル】
- public/output/<ファイル名>.mp4

【次のアクション】
- YouTube Shorts / TikTok / Instagram Reels にアップロード
```
