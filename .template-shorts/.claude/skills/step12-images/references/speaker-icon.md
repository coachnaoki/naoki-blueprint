# C. 話者アイコン（対談動画用）

対談動画で、指定の話者の顔にアイコン画像を追従させて焼き込む。YuNet顔検出で自動追従し、滑らかに移動する。

**対談動画専用。通常の1人撮影動画では使わない。**

## 前提
- `pip install opencv-python Pillow` 済み（Mac/Windows/Linux 共通）
- `models/face_detection_yunet_2023mar.onnx` が存在すること
- カット済み動画 (`public/videos/main/*_cut.mp4`) が存在すること

## ユーザーに確認すること（必須）

1. **どちらの話者にアイコンを載せるか**: `left`（画面左）or `right`（画面右）
2. **アイコン画像のパス**: `public/images/inserts/` に配置してもらう
3. **アイコンサイズ**: デフォルト 440px（変更したい場合のみ聞く）
4. **位置微調整が必要か**: デフォルトのオフセットで問題なければスキップ

## やること

### 1. フレーム抽出で顔検出を確認

```bash
ffmpeg -ss 5 -i public/videos/main/<動画名>_cut.mp4 -frames:v 1 -q:v 2 /tmp/speaker_check.jpg
python3.12 scripts/detect_face_center.py /tmp/speaker_check.jpg
```

**必ず `count: 2` 以上であることを確認する。** 1人しか検出されない場合、`--side` 判定により全フレームでアイコンが表示されない。別の秒数でフレームを再取得するか、`--score 0.3` でしきい値を下げて再試行する。

### 2. スクリプト実行

```bash
python3.12 scripts/render_speaker_icon.py public/images/inserts/<アイコン>.png --side right
```

**主要オプション**:

| オプション | デフォルト | 説明 |
|---|---|---|
| `--side` | （必須） | left / right |
| `--size` | 440 | アイコンサイズ(px) |
| `--smooth` | 0.06 | 追従の滑らかさ(0.01=遅い, 0.2=速い) |
| `--head-offset` | 0.35 | 顔中心→頭中心への補正比率 |
| `--down-shift` | 0.125 | 下方向シフト(サイズ比) |
| `--right-shift` | 0.125 | 右方向シフト(サイズ比) |
| `--detect-every` | 3 | 何フレームごとに顔検出 |
| `--video` | 自動検出 | 入力動画パス（省略時は `public/videos/main/` 内の `_cut.mp4` を使用） |

スクリプトは以下を自動で行う:
1. 元動画を `*_backup.mp4` にバックアップ（**初回のみ。2回目以降は元のバックアップを保持するため何度でもやり直し可能**）
2. 全フレームを処理してアイコンを焼き込み
3. 音声をバックアップから結合
4. 元のファイル名で上書き

**処理時間の目安**: 10分の動画で約5〜15分。全フレームを処理するため時間がかかる。

**顔検出失敗時の挙動**: 顔が検出されないフレームではアイコンは前回の位置に留まる（消えない）。TypeScript変更なし、`npx tsc` チェック不要。

### 3. 確認

Remotion Studio で対談動画を再生し、アイコンの位置・動きを確認する。

## やり直したい場合

バックアップから復元して再実行（OS別）:

```bash
# Mac/Linux
cp public/videos/main/<動画名>_cut_backup.mp4 public/videos/main/<動画名>_cut.mp4

# Windows (PowerShell)
Copy-Item public/videos/main/<動画名>_cut_backup.mp4 public/videos/main/<動画名>_cut.mp4

# 再実行
python3.12 scripts/render_speaker_icon.py public/images/inserts/<アイコン>.png --side right --size 330
```
