# Naoki式 ショート動画編集テンプレート

Claude Code のスキルシステムで、撮影済み縦動画から **YouTube Shorts / TikTok / Instagram Reels** 向けの動画を自動制作するテンプレートです。

## できること

1. 動画の無音部分をジャンプカット
2. Whisper で自動文字起こし → 台本と照合して誤変換修正
3. テロップ・字幕・SE・BGM を自動配置
4. 全画面画像・話者アイコンの自動挿入
5. Remotion で 1080×1920 縦動画を最終レンダリング

全 15 ステップを `/step01-context` 〜 `/step15-final` のスラッシュコマンドで順番に進めるだけで動画が完成します。

---

## ライセンス認証

本テンプレートはライセンス認証が必要です。

1. 権利者から発行された **ライセンスID**（NK-XXXX-XXXX-XXXX形式）を用意する
2. 初回起動時に以下を実行：
   ```bash
   node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX
   ```
3. 認証成功すると `.license` ファイルが生成され、以後は自動で認証されます

> ライセンスIDは1台のPCに紐付けられます。PCを変更する場合は権利者にご連絡ください。

---

## ワークフロー（全15ステップ）

```
【素材準備フェーズ】
/step01-context         → 動画コンテキスト整理（縦動画指定）
/step02-assets          → 素材確認＆役割確定
/step03-transcript      → 文字起こし（Whisper）
/step04-transcript-fix  → 台本照合で誤変換修正
/step05-cut             → 無音＋言い直し一括カット
/step06-transcript      → カット後の再文字起こし

【動画構築フェーズ】
/step07-template        → テンプレート設定
/step08-telop           → テロップデータ作成
/step09-composition     → コンポジション構築（1080×1920）

【素材挿入フェーズ】
/step10-greenback       → グリーンバック背景置換（任意）
/step11-videos          → デモ動画挿入
/step12-images          → 画像挿入（全画面・AI生成・話者アイコン）
/step13-special         → 箇条書き・CTA・見出しバナー

【BGM・出力フェーズ】
/step14-bgm             → BGM 挿入
/step15-final           → 最終レンダリング
```

---

## フォルダ構成

```
.template-shorts/
├── .claude/skills/     ← Claude Code スキル（15ステップ + catchup + remotion-best-practices）
├── CLAUDE.md           ← AI の行動ルール（編集不要）
├── video-context.md    ← 動画の設定（step01 で作成）
├── public/
│   ├── main/           ← 本編動画（縦動画 1080×1920）
│   ├── inserts/        ← 物理挿入動画
│   ├── overlays/       ← オーバーレイ動画
│   ├── bgm/            ← BGM（MP3）
│   ├── script/         ← 台本・ナレーション原稿
│   ├── se/             ← 効果音フォルダ
│   ├── images/         ← 挿入画像
│   ├── transcript_words.json  ← 文字起こし（自動生成）
│   └── output/         ← 完成動画の出力先
├── src/
│   ├── Root.tsx                ← Remotion ルート
│   ├── MainComposition.tsx     ← メインコンポジション（自動生成）
│   ├── templateConfig.ts       ← テンプレート設定（自動生成）
│   └── telopData.ts            ← テロップデータ（自動生成）
├── scripts/
│   ├── validateLicense.mjs        ← ライセンス認証
│   ├── detect_face_center.py      ← 顔検出（話者アイコン用）
│   ├── render_speaker_icon.py     ← 話者アイコン焼き込み
│   └── generate-images.py         ← AI画像生成
└── models/
    └── face_detection_yunet_2023mar.onnx  ← YuNet顔検出モデル
```

---

## 横動画を作りたい場合

YouTube用の通常動画（10〜20分・横向き）を作る場合は、`.template-shorts/` ではなく **`.template/`** を使ってください。

ステップ数・実装内容が異なります。
