# 更新履歴 (CHANGELOG)

naoki-blueprint のバージョンアップ履歴です。

最新版への更新は:
```bash
./アップデート.sh
```
または新規プロジェクト作成時は自動で最新版に同期されます:
```bash
./新規作成.sh
```

---

## 2026-04-21

### 🎯 新機能
- **ラウドネス正規化**（`scripts/loudnorm.mjs`）: 最終MP4を YouTube/TikTok/X 共通基準 **-14 LUFS / -1 dBTP / LRA 11** に二段階loudnormで揃える。step20（横）と step14（ショート）の最終段に組込済み。
- **新規作成.sh の自動アップデート**: 新規プロジェクト作成前に `git fetch + git reset --hard origin/main` を自動実行。配布済みユーザーがアップデートに気づかない問題を解消。
- **配布ページに更新履歴セクション追加**: [index.html](https://coachnaoki.github.io/naoki-blueprint/) と [activate.html](https://coachnaoki.github.io/naoki-blueprint/activate.html) の両方に、スクロール可能な更新履歴パネルを追加。配布済みユーザーが Web からも最新の変更内容を把握できる。

### 🔧 改善
- **step05-cut に word-boundary snap 導入**: カット境界を `transcript_words.json` の word 境界にスナップし、発話末尾 +150ms / 次発話開始 -50ms の非対称 padding を適用。silencedetect のタイムスタンプズレ (±50-100ms) を吸収して「発話がプツッと切れる」問題を防止。snap成功率92%（Teleprompter テストで実測）。
- **SE音量基準を 0.1 → 0.06 に変更**（CLAUDE.md 横・ショート両方）。

---

## 2026-04-20

### ✨ 改善
- **FPS を動画から自動検出**（step02）: 動画タイプから固定 FPS 設定を撤廃し、本編動画から FFprobe で自動取得するように変更。
- **尺の記載を削除**: 動画タイプ選択から尺の記述を外し、解像度のみで区別するシンプルな構成に。
- **Claude Code 起動を前倒し**: Mac/Windows 分岐を削減しドキュメントを整理。

---

## 2026-04-19

### 🎯 新機能
- **`アップデート.sh` 追加**: `git fetch + reset --hard origin/main` で本体を最新版に同期するスクリプト。
- **`プロジェクト更新.sh` 追加**: 既存の `projects/` 内の全プロジェクトを最新テンプレートに同期（`projects/X` 指定で個別更新も可）。`.claude/skills/` と `scripts/` と `CLAUDE.md` を上書き、`public/` や TSX は保護。
- **step10-greenback 素人対応パイプライン**: 均一な緑背景は ffmpeg chromakey、色ムラ・照明ムラのある撮影は rembg u2net AI + HSV despill + CoreML で処理。
- **自動ライセンス発行フロー**: 同意書 → 自動ライセンス発行 → ブラウザ表示までの一連の UX を activate.html に実装。

### 🔧 改善
- **public/ フォルダ構造を再編**: `videos/` と `images/` の2階層に整理し、main/inserts/overlays/opening/highlight の役割を明確化。
- **新規作成.sh に動画タイプ選択を追加**: YouTube 横動画 / ショート動画 を選択できるように。
- **画像生成ポリシー遵守ルールを追加**（step15-images）: Google Generative AI Prohibited Use Policy に抵触しないためのNG語リスト・代替フレーズ・業種別違反パターンを整備。

### 📚 ドキュメント
- **activate.html 大幅改修**（14回の細かい調整）: Mac/Windows 分岐・Step01 の事前準備・素材配置ツリー・ライセンスIDパネル位置・サポート誘導の整理など、初見ユーザーの詰まりポイントを潰す改訂を集中実施。
- **workshop-slides 再編**: 自動ライセンス発行フロー・新フォルダ構造を反映し、slide 06-12 を activate.html の 5ステップに整列。
- **index.html 全面更新**: OpenCV 依存追加・新規作成.sh・videos/ 階層など現状に合わせて反映。Linux 案内・よくある質問は削除、Mac/Windows のみに統一。
- **terms.html**: サポート窓口を X フォローから Chatwork ID ベースに変更（第4条も同期）。

---

## 2026-04-18: 🎉 初回配布

### 🎯 新機能
- **Mac/Windows 両対応**: `scripts/transcribe.mjs` が OS を自動判定し、Mac は `mlx-whisper`、Windows/Linux は `faster-whisper` を使い分け。
- **スキル構造リファクタ**: 全ステップを `.claude/skills/` 配下に整理、横動画20ステップ・ショート動画14ステップの2テンプレート体制を確立。
- **workshop-slides**: 配布者向け作業会スライド 26枚を追加。
- **docs/index.html**: ショート動画テンプレート・Windows 対応を反映。

### 🔧 改善
- **BGM音量デフォルトを 0.03 に統一**（CLAUDE.md）。
- **terms.html**: メールアドレス → X アカウントID に変更、配布案内を X ベースに。

### 🛠️ 配布スタート
この日から Chatwork 経由でライセンス配布開始。

---

## 履歴の取得方法

この CHANGELOG に載っていない最新の変更は Git ログから確認できます:

```bash
# 最新10件
git log --oneline -10

# 2026-04-18 以降すべて
git log --since="2026-04-18" --oneline

# 自分が今使っているバージョン
git log -1 --format="%h %s (%ai)"
```
