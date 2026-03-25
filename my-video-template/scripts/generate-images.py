#!/usr/bin/env python3
"""
Cloudflare Workers AI (Flux) を使って動画用画像を一括生成するスクリプト

セットアップ:
1. Cloudflareアカウントを作成 (https://dash.cloudflare.com/sign-up)
2. Workers & Pages → Create → Start with Hello World!
3. Edit Code で worker.js を画像生成コードに差し替え → Deploy
4. Settings → Variables and Secrets → API_KEY を追加
5. Settings → Bindings → Workers AI を追加（Variable name: AI）
6. 以下の API_URL と API_KEY を更新

worker.js のコード:
```javascript
export default {
    async fetch(request, env) {
        const API_KEY = env.API_KEY;
        const url = new URL(request.url);
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${API_KEY}`) return json({ error: "Unauthorized" }, 401);
        if (request.method !== "POST" || url.pathname !== "/") return json({ error: "Not allowed" }, 405);
        try {
            const { prompt } = await request.json();
            if (!prompt) return json({ error: "Prompt is required" }, 400);
            const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt });
            if (result && result.image) {
                const binaryData = Uint8Array.from(atob(result.image), c => c.charCodeAt(0));
                return new Response(binaryData, { headers: { "Content-Type": "image/png" } });
            }
            return new Response(result, { headers: { "Content-Type": "image/jpeg" } });
        } catch (err) {
            return json({ error: "Failed to generate image", details: err.message }, 500);
        }
    },
};
function json(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
```
"""
import urllib.request
import json
import ssl
import time
import os

# ============================================================
# 設定: ここを自分の環境に合わせて変更する
# ============================================================
API_URL = "https://your-worker-name.your-subdomain.workers.dev/"
API_KEY = "your-api-key"

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


def generate_image(prompt: str, output_path: str) -> bool:
    ctx = ssl.create_default_context()
    data = json.dumps({"prompt": prompt}).encode()
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
            img = resp.read()
            if len(img) < 1000:
                print(f"  ⚠ Response too small ({len(img)} bytes), skipping")
                return False
            with open(output_path, "wb") as f:
                f.write(img)
            print(f"  ✓ Saved ({len(img):,} bytes)")
            return True
    except urllib.error.HTTPError as e:
        print(f"  ✗ HTTP Error {e.code}: {e.read().decode()[:200]}")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def main():
    if not IMAGES:
        print("IMAGES リストが空です。プロンプトを追加してから実行してください。")
        return

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
        if generate_image(img["prompt"], output_path):
            success += 1
        # Rate limit対策
        if i < len(IMAGES):
            time.sleep(2)

    print(f"\n=== 完了: {success}/{len(IMAGES)} 枚生成 ===")


if __name__ == "__main__":
    main()
