"""
顔の中心座標を自動検出する。
使い方:
  python3.12 scripts/detect_face_center.py <画像パス> [--side left|right]

出力 (JSON):
  {"x": 1300, "y": 450, "w": 165, "h": 198, "score": 0.93, "count": 2}

複数の顔が検出された場合、--side で left（最も左）/ right（最も右）を指定。
未指定なら最大スコアの顔を返す。1人プレゼン動画は --side 不要。
"""
import sys
import json
import argparse
import os
import cv2

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(os.path.dirname(THIS_DIR), "models", "face_detection_yunet_2023mar.onnx")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--side", choices=["left", "right"], default=None)
    ap.add_argument("--score", type=float, default=0.5)
    args = ap.parse_args()

    img = cv2.imread(args.image)
    if img is None:
        print(json.dumps({"error": f"cannot read {args.image}"}))
        sys.exit(1)

    h, w = img.shape[:2]
    detector = cv2.FaceDetectorYN.create(MODEL, "", (w, h), score_threshold=args.score)
    _, faces = detector.detect(img)

    if faces is None or len(faces) == 0:
        print(json.dumps({"error": "no face detected", "frame_size": [w, h]}))
        sys.exit(2)

    if args.side == "left":
        f = min(faces, key=lambda f: f[0])
    elif args.side == "right":
        f = max(faces, key=lambda f: f[0])
    else:
        f = max(faces, key=lambda f: f[14])

    fx, fy, fw, fh = float(f[0]), float(f[1]), float(f[2]), float(f[3])
    print(json.dumps({
        "x": int(fx + fw / 2),
        "y": int(fy + fh / 2),
        "w": int(fw),
        "h": int(fh),
        "score": float(f[14]),
        "count": int(len(faces)),
        "frame_size": [w, h],
    }))

if __name__ == "__main__":
    main()
