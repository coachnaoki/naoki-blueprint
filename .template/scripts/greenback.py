#!/usr/bin/env python3
"""
グリーンバック背景置換（素人撮影対応・v7パイプライン）

rembg (u2net + CoreML) でAIセグメンテーション → 二値化マスク → 境界スマートdespill で合成。
色ムラ・照明ムラ・シワありの素人グリーンバックでも高品質に処理する。

依存:
  pip install rembg[cpu] opencv-python pillow

初回実行時に u2net.onnx (~170MB) が ~/.u2net/ にダウンロードされる。

使い方:
  python scripts/greenback.py <入力動画> <背景画像> <出力動画>
  python scripts/greenback.py public/videos/main/input_cut.mp4 public/images/overlays/background.jpg public/videos/main/input_cut_greenback.mp4

処理時間の目安（M1 Mac、CoreML加速あり）:
  1920x1080 / 60fps / 10秒動画 → 約4.5分
"""
from rembg import new_session, remove
from PIL import Image
import cv2
import numpy as np
import sys
import time
import subprocess


def despill_hsv(rgb, strength=0.85):
    """HSV空間で緑ヒュー(H=30-95)の彩度を一括カット。
    肌や服の色相には影響しないが、緑味だけを除去する。"""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    green = ((hsv[..., 0] > 30) & (hsv[..., 0] < 95)).astype(np.float32)
    hsv[..., 1] = hsv[..., 1] * (1 - green * strength)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def smart_edge_despill(rgb):
    """境界限定の超強despill。緑支配的(G>R+5 かつ G>B+5)なピクセルだけ G=min(R,B)。
    肌(R>G>B)を壊さないのがポイント。"""
    out = rgb.astype(np.float32)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    is_green = (g > r + 5) & (g > b + 5)
    out[..., 1] = np.where(is_green, np.minimum(r, b), g)
    return out.astype(np.uint8)


def main():
    if len(sys.argv) < 4:
        print("Usage: python greenback.py <input_video> <background_image> <output_video>")
        sys.exit(1)

    input_path = sys.argv[1]
    bg_path = sys.argv[2]
    output_path = sys.argv[3]
    model = sys.argv[4] if len(sys.argv) > 4 else "u2net"
    edge_px = int(sys.argv[5]) if len(sys.argv) > 5 else 3

    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"入力: {w}x{h}@{fps:.2f} {total}frames  model={model}  edge_px={edge_px}")

    bg = cv2.cvtColor(cv2.imread(bg_path), cv2.COLOR_BGR2RGB)
    if bg.shape[:2] != (h, w):
        bg = cv2.resize(bg, (w, h))

    session = new_session(
        model,
        providers=["CoreMLExecutionProvider", "CPUExecutionProvider"],
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (edge_px * 2 + 1,) * 2)

    ffmpeg = subprocess.Popen(
        [
            "ffmpeg", "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
            "-i", input_path,
            "-map", "0:v", "-map", "1:a?",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "veryfast",
            "-c:a", "aac",
            output_path,
        ],
        stdin=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )

    t0 = time.time()
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        # 1. AIセグメンテーション
        mask_raw = np.array(remove(pil_img, session=session))[..., 3].astype(np.float32) / 255.0
        # 2. 二値化(境界くっきり)
        mask = (mask_raw > 0.5).astype(np.float32)
        # 3. 全体HSV despill(緑彩度カット)
        fg = despill_hsv(rgb, 0.85)
        # 4. 境界 edge_px 内側だけスマート超despill
        inner = cv2.erode(mask, kernel)
        edge_zone = ((mask > 0.5) & (inner < 0.5))[..., None]
        fg = np.where(edge_zone, smart_edge_despill(rgb), fg)
        # 5. 合成
        alpha = mask[..., None]
        comp = (fg.astype(np.float32) * alpha + bg.astype(np.float32) * (1 - alpha)).astype(np.uint8)
        ffmpeg.stdin.write(comp.tobytes())
        idx += 1
        if idx % 60 == 0:
            el = time.time() - t0
            print(f"  {idx}/{total} ({idx/el:.1f}fps, ETA {(total-idx)/(idx/el):.0f}s)")

    ffmpeg.stdin.close()
    ffmpeg.wait()
    cap.release()
    print(f"完了: {idx}フレーム / {time.time()-t0:.1f}秒 → {output_path}")


if __name__ == "__main__":
    main()
