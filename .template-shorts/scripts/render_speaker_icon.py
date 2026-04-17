"""
話者アイコン: 対談動画の指定話者の顔にアイコン画像を追従させて焼き込む。
使い方:
  python3.12 scripts/render_speaker_icon.py <アイコン画像> --side left|right [options]

出力: public/main/input_cut.mp4 を上書き（元ファイルは input_cut_backup.mp4 に保存）
"""
import sys
import os
import argparse
import time
import subprocess
import shutil
import cv2
import numpy as np
from PIL import Image

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(THIS_DIR)
MODEL = os.path.join(PROJECT_DIR, "models", "face_detection_yunet_2023mar.onnx")
VIDEO_DIR = os.path.join(PROJECT_DIR, "public", "main")


def overlay(frame_bgr, icon_pil, cx, cy):
    pil = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)).convert('RGBA')
    iw, ih = icon_pil.size
    pil.paste(icon_pil, (cx - iw // 2, cy - ih // 2), icon_pil)
    return cv2.cvtColor(np.array(pil.convert('RGB')), cv2.COLOR_RGB2BGR)


def main():
    ap = argparse.ArgumentParser(description="話者アイコン焼き込み")
    ap.add_argument("icon", help="アイコン画像パス")
    ap.add_argument("--side", choices=["left", "right"], required=True,
                    help="アイコンを載せる話者の位置")
    ap.add_argument("--size", type=int, default=440, help="アイコンサイズ(px)")
    ap.add_argument("--smooth", type=float, default=0.06, help="追従の滑らかさ(0.01〜0.2)")
    ap.add_argument("--head-offset", type=float, default=0.35,
                    help="顔中心→頭中心への補正比率")
    ap.add_argument("--down-shift", type=float, default=0.125,
                    help="アイコン下方向シフト(サイズ比)")
    ap.add_argument("--right-shift", type=float, default=0.125,
                    help="アイコン右方向シフト(サイズ比)")
    ap.add_argument("--detect-every", type=int, default=3,
                    help="何フレームごとに顔検出するか")
    ap.add_argument("--video", default=None,
                    help="入力動画パス(省略時はpublic/main/の_cut.mp4を自動検出)")
    args = ap.parse_args()

    if args.video:
        video_path = args.video
    else:
        cuts = [f for f in os.listdir(VIDEO_DIR) if f.endswith("_cut.mp4")]
        if not cuts:
            print("Error: public/main/ に _cut.mp4 が見つかりません")
            sys.exit(1)
        video_path = os.path.join(VIDEO_DIR, cuts[0])

    if not os.path.exists(video_path):
        print(f"Error: {video_path} が見つかりません")
        sys.exit(1)

    backup_path = video_path.replace(".mp4", "_backup.mp4")
    if not os.path.exists(backup_path):
        shutil.copy2(video_path, backup_path)
        print(f"Backup: {backup_path}")

    icon_size = args.size
    icon_down = int(icon_size * args.down_shift)
    icon_right = int(icon_size * args.right_shift)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"{W}x{H} @ {fps:.2f}fps, {total} frames, icon={icon_size}px, side={args.side}")

    detector = cv2.FaceDetectorYN.create(MODEL, '', (W, H), score_threshold=0.5)
    icon = Image.open(args.icon).convert('RGBA').resize((icon_size, icon_size), Image.LANCZOS)

    tmp_out = video_path.replace(".mp4", "_icons_tmp.mp4")
    writer = cv2.VideoWriter(tmp_out, cv2.VideoWriter_fourcc(*'mp4v'), fps, (W, H))

    target = None
    displayed = None
    frame_idx = 0
    t0 = time.time()

    pick_face = (lambda faces: min(faces, key=lambda f: f[0])
                 if args.side == "left"
                 else lambda faces: max(faces, key=lambda f: f[0]))

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if frame_idx % args.detect_every == 0:
            _, faces = detector.detect(frame)
            if faces is not None and len(faces) >= 1:
                f = pick_face(faces)
                fx, fy, fw, fh = f[0], f[1], f[2], f[3]
                cx = int(fx + fw / 2) + icon_right
                cy = int(fy + fh / 2 - fh * args.head_offset) + icon_down

                half = W // 2
                valid = (cx < half) if args.side == "left" else (cx > half)
                if valid:
                    if target is None:
                        target = (cx, cy)
                        displayed = (float(cx), float(cy))
                    else:
                        target = (cx, cy)

        if target is not None and displayed is not None:
            dx = target[0] - displayed[0]
            dy = target[1] - displayed[1]
            displayed = (displayed[0] + dx * args.smooth, displayed[1] + dy * args.smooth)

        out = frame
        if displayed:
            out = overlay(out, icon, int(displayed[0]), int(displayed[1]))
        writer.write(out)

        frame_idx += 1
        if frame_idx % 600 == 0:
            elapsed = time.time() - t0
            pct = frame_idx / total * 100
            print(f"  {frame_idx}/{total} ({pct:.0f}%) elapsed={elapsed:.0f}s")

    cap.release()
    writer.release()

    final_out = video_path.replace(".mp4", "_icons.mp4")
    print("Audio merge...")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", tmp_out,
        "-i", backup_path,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac",
        final_out
    ], capture_output=True)
    os.remove(tmp_out)

    os.replace(final_out, video_path)

    elapsed = time.time() - t0
    print(f"Done: {video_path} ({elapsed:.0f}s)")
    print(f"Backup: {backup_path}")


if __name__ == "__main__":
    main()
