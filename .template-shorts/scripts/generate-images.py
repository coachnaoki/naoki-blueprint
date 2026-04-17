#!/usr/bin/env python3
"""
Gemini API を使って動画用画像を一括生成するスクリプト

セットアップ:
1. Google AI Studio (https://aistudio.google.com/apikey) でAPIキーを取得
2. pip install google-genai Pillow
3. APIキーを渡す方法は3通り（どれか1つ）:
   A. プロジェクト直下に `.env` を作成して `GEMINI_API_KEY=xxx` と書く（Mac/Win共通・推奨）
   B. 環境変数を直接設定
      - Mac/Linux: `export GEMINI_API_KEY=xxx`
      - Windows (PowerShell): `$env:GEMINI_API_KEY="xxx"`
   C. Mac Keychain 連携（Naoki本人向け）: `export-gemini` 関数を使用
"""
import time
import os

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("google-genai がインストールされていません。以下を実行してください:")
    print("  pip install google-genai Pillow")
    exit(1)


# ============================================================
# .env ファイルがあれば読み込む（クロスプラットフォーム対応）
# ============================================================
def _load_env_file() -> None:
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


_load_env_file()

# ============================================================
# 設定: APIキーは環境変数から読み込む
# ============================================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = ""  # step16実行時にAIが最新モデルを設定する

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# 画像リスト: プロンプトを編集して使う
# - filename: 出力ファイル名
# - frame_start / frame_end: 表示フレーム範囲（参考用）
# - prompt: 英語プロンプト（末尾に "no text no words no letters" 必須）
# ============================================================
IMAGES = [
    # {
    #     "filename": "gen_01_example.jpg",
    #     "frame_start": 250,
    #     "frame_end": 400,
    #     "prompt": "A person working at a desk with a laptop, modern illustration style, no text no words no letters"
    # },
]


def generate_image(client, prompt: str, output_path: str) -> bool:
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image = part.as_image()
                image.save(output_path)
                size = os.path.getsize(output_path)
                print(f"  ✓ Saved ({size:,} bytes)")
                return True
        print("  ⚠ No image in response")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def main():
    if not IMAGES:
        print("IMAGES リストが空です。プロンプトを追加してから実行してください。")
        return

    if not MODEL:
        print("MODEL が設定されていません。/step16-images を実行してください。")
        return

    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY が設定されていません。以下のどれかで設定してください:")
        print("  A. プロジェクト直下に .env を作成:")
        print("     GEMINI_API_KEY=your-api-key-here")
        print("  B. 環境変数を直接設定:")
        print("     Mac/Linux: export GEMINI_API_KEY=xxx")
        print("     Windows (PowerShell): $env:GEMINI_API_KEY=\"xxx\"")
        print("  取得先: https://aistudio.google.com/apikey")
        return

    client = genai.Client(api_key=GEMINI_API_KEY)
    print(f"=== 画像一括生成 ({len(IMAGES)}枚) ===\n")
    success = 0
    for i, img in enumerate(IMAGES, 1):
        output_path = os.path.join(OUTPUT_DIR, img["filename"])
        if os.path.exists(output_path):
            print(f"[{i}/{len(IMAGES)}] {img['filename']} - already exists, skipping")
            success += 1
            continue
        print(f"[{i}/{len(IMAGES)}] {img['filename']}")
        print(f"  Prompt: {img['prompt'][:80]}...")
        if generate_image(client, img["prompt"], output_path):
            success += 1
        # Rate limit対策
        if i < len(IMAGES):
            time.sleep(5)

    print(f"\n=== 完了: {success}/{len(IMAGES)} 枚生成 ===")


if __name__ == "__main__":
    main()
