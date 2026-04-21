# 更新履歴 (CHANGELOG)

naoki-blueprint のバージョンアップ履歴です。バージョンは [Semantic Versioning](https://semver.org/lang/ja/) に従います:
- **major**: 破壊的変更（テンプレ構造の大改変など）
- **minor**: 機能追加
- **patch**: バグ修正・ドキュメント改善・細かいチューニング

現在の最新バージョンは [`VERSION`](./VERSION) ファイルで確認できます。

最新版への更新は:
```bash
./アップデート.sh
```
または新規プロジェクト作成時は自動で最新版に同期されます:
```bash
./新規作成.sh
```

---

## [v1.5.2] - 2026-04-22

### 📚 ドキュメント
- **リポジトリ取得手順の `git clone` と `cd` を分離**（index.html / activate.html）: Step 1 の「② リポジトリをダウンロードして中に入る」で `git clone ...` と `cd naoki-blueprint` を同じコードブロックに入れていたため、丸ごとコピーするユーザーが `cd` の実行で失敗するケースがあった。「② リポジトリをダウンロード」「③ ダウンロードしたフォルダに入る」の2ブロックに分離。

---

## [v1.5.1] - 2026-04-22

### 📚 ドキュメント
- **アップデート手順の `cd` と `bash` を分離**（index.html / activate.html）: `cd ~/Desktop/Cursor/naoki-blueprint` と `bash アップデート.sh` を同じコードブロックに入れていたため、丸ごとコピーするユーザーが `~/Desktop/Cursor/naoki-blueprint` 以外の場所にいると `bash アップデート.sh` が見つからずエラーになるケースがあった。「① naoki-blueprint ディレクトリに移動」「② アップデートスクリプトを実行」の2ブロックに分離し、①の `~/Desktop/Cursor` は clone 先に合わせて読み替えるよう明記。

---

## [v1.5.0] - 2026-04-21

### 🎯 新機能
- **step05 で Remotion Studio を起動（横・ショート両方）**: カット直後に最小版の `MainComposition.tsx` / `Root.tsx` / `index.ts`（カット済み動画を全画面表示するだけ）を生成し、Remotion Studio をバックグラウンド起動。従来は step09 まで起動を遅らせていたため、カットミスが step06〜08 の手戻りに繋がっていた。step05 でフレーム単位の精密確認ができるようになる。
- **step09 を「新規生成」から「拡張」に変更（横・ショート両方）**: step05 で既に MainComposition.tsx / Root.tsx が存在するため、step09 はテロップレンダラーと SE を既存ファイルに追加する形に変更。Remotion Studio 起動処理は削除（既に起動済みのためホットリロードで反映）。

### 🔧 改善
- **step05 の確認フローを QuickTime から Remotion Studio に一本化**: 従来の `open-file.mjs` による即時プレビューは削除。Remotion Studio のスクラブ・フレーム移動機能の方がカットミス検出に適している。
- **CLAUDE.md のワークフロー説明を更新（横・ショート両方）**: step05 と step09 の役割変更を反映。

---

## [v1.4.0] - 2026-04-21

### 🎯 新機能
- **テロップ2行対応（ショート動画）**: normal / normal_emphasis / section / third_party の4テンプレートで `text` に `\n` を含めることで2行表示に対応。`calcTextWidth` を複数行対応に拡張、`<tspan x y>` で各行を中央揃えで描画、svgHは中心基準で上下に振り分け。1行時の表示位置は従来と変わらない。これまで禁止扱いだった2行テロップを正式機能化（従来の「getCurrentTelop が壊れる」懸念は現行実装では発生しないことを確認済み）。
- **emphasisWord の複数単語対応（横・ショート両方）**: `emphasisWord?: string | string[]` に拡張。対句（「前衛 vs 後衛」「体力0 vs 知識と戦術」等の対比構造）や、1テロップ内に複数の強調ワードがある場合は配列で指定すると全単語が赤く塗られる。単一文字列指定も従来通り動作（後方互換）。

### 🔧 改善
- **テロップの句読点削除ルール（横・ショート両方）**: `text` から `、` と `。` を削除する運用に統一。`?` `!` は残す。テロップでは読点が冗長で読みにくいため。分割方法の優先順位からも「句読点で分割」を除外し、「助詞（は/の/に/を/が/で/も/て/と）で分割」に一本化。
- **引用符を半角 `｢｣` に変更（横・ショート両方）**: 全角「」は全角・半角マスの不均等でセンタリングがズレるため半角に統一。third_party テンプレートが自動付与する引用符も `｢｣`。
- **2行化/1行化の判断基準を追加（ショート動画）**:
  - 2行化条件A: 1行制限超 + 分割すると意味が取れない（主語述語が散る／対句が分断される）
  - 2行化条件B: 隣接する短エントリが連続 + 統合で意味のまとまりが良い
  - 1行化条件: 2行合計が1行制限以下なら `\n` を削除して1行連結
- **test-shorts-tennis/CLAUDE.md を最新版に同期**: `.template-shorts/CLAUDE.md` からコピーして古い「2行禁止」記述等を除去。

### 📚 ドキュメント
- **CLAUDE.md / step08-telop / step09-composition を新ルールで更新（横・ショート両方）**: 句読点削除・半角`｢｣`・emphasisWord 配列対応の運用ルールと実装例を記載。

---

## [v1.3.0] - 2026-04-21

### 🔧 改善
- **セットアップ手順の Claude Code 起動タイミングを修正**（activate.html / index.html / workshop-slides）: Step 02 で Claude Code を起動すると、(1) `bash 新規作成.sh` のカレントディレクトリ変化が Claude Code に反映されず `/step01-context` が発動しない、(2) `git reset --hard origin/main` 自動アップデートが認証直後の `.license` と干渉する、という2つの問題があった。新しいフローでは Step 02〜04 を通常ターミナルで進め、Step 05 で `cd projects/XXX` してから初めて Claude Code を起動する構成に変更。
- **リポジトリ取得手順の `cd` を分離**（activate.html / index.html）: `cd ~/Desktop/Cursor` と `git clone ...` を同じコードブロックに入れていたため、丸ごとコピーするユーザーが <code>~/Desktop/Cursor</code> 前提で動かせないケースがあった。「① 置きたいフォルダに移動」「② clone して cd」の2ブロックに分離し、①の <code>~/Desktop/Cursor</code> は例に過ぎないと明記。
- workshop-slides slide05 / slide17 もセミナー版を同調修正。

### 📚 ドキュメント
- **activate.html にワークフロー詳細セクション追加**: セットアップ5ステップの後に「全20step ワークフロー詳細」セクションを追加。Phase 1〜4 を色分けし、各スラッシュコマンドに1行説明を付与。ショート動画（14 step）との違いと `/catchup` 便利機能も併記。配布後のユーザーが「次に何を打つか」を迷わず進められる導線に。
- **workshop-slides をセミナー版に再編**: 対象者を「naoki-blueprint を既に使っている人」に絞り、環境構築・ライセンス発行・Whisper内部・ショート特有注意点 等 8枚を削除。代わりに「編集のコツ 3枚（カット後確認 / Studio目視調整 / AI画像のGoogle規約遵守）」と「Video Use（browser-use チーム公開のOSS）との比較 1枚」を追加して全21枚構成に。v1.3.0新機能（loudnorm・word-boundary snap・step15-images 3フェーズ・新規作成.shの自動更新）も反映済み。

### 🎯 新機能
- **ラウドネス正規化**（`scripts/loudnorm.mjs`）: 最終MP4を YouTube/TikTok/X 共通基準 **-14 LUFS / -1 dBTP / LRA 11** に二段階loudnormで揃える。step20（横）と step14（ショート）の最終段に組込済み。
- **新規作成.sh の自動アップデート**: 新規プロジェクト作成前に `git fetch + git reset --hard origin/main` を自動実行。配布済みユーザーがアップデートに気づかない問題を解消。
- **配布ページに更新履歴セクション追加**: [index.html](https://coachnaoki.github.io/naoki-blueprint/) と [activate.html](https://coachnaoki.github.io/naoki-blueprint/activate.html) の両方に、スクロール可能な更新履歴パネルを追加。配布済みユーザーが Web からも最新の変更内容を把握できる。

### 🔧 改善
- **step05-cut に word-boundary snap 導入**: カット境界を `transcript_words.json` の word 境界にスナップし、発話末尾 +150ms / 次発話開始 -50ms の非対称 padding を適用。silencedetect のタイムスタンプズレ (±50-100ms) を吸収して「発話がプツッと切れる」問題を防止。snap成功率92%（Teleprompter テストで実測）。
- **SE音量基準を 0.1 → 0.06 に変更**（CLAUDE.md 横・ショート両方）。
- **`アップデート.sh` と `プロジェクト更新.sh` を統合**: スクリプトを `アップデート.sh` 1本に一本化。本体の git pull と projects/ 配下の最新テンプレ同期を1コマンドで完結。`プロジェクト更新.sh` は削除（機能は `アップデート.sh` に吸収）。
- **step15-images / step12-images を3フェーズ構造に再編**: 「インサート画像」「オーバーレイ画像」「顔アイコン」で明確に分離。
  - **インサート画像**（横動画のみ）: 話者位置（左/中央/右）を1回質問→ video-context.md に保存→ 画像配置を自動決定（右/左/中央+周囲ぼかし）。話者が中央の場合は背景ぼかし+前景中央の2層構造で挿入。
  - **オーバーレイ画像**（全画面）: アニメーション（zoom/slideUp/slideLeft）を画像ごとにランダム選択（SE選択と同じシード方式、直近2回と同じを回避）。単調さを排除。
  - **顔アイコン**（対談動画）: 固定配置を推奨デフォルトに。追従は transcript に speaker情報がある場合のみのオプション扱い（処理時間大のため非推奨）。

---

## [v1.2.0] - 2026-04-20

### ✨ 改善
- **FPS を動画から自動検出**（step02）: 動画タイプから固定 FPS 設定を撤廃し、本編動画から FFprobe で自動取得するように変更。
- **尺の記載を削除**: 動画タイプ選択から尺の記述を外し、解像度のみで区別するシンプルな構成に。
- **Claude Code 起動を前倒し**: Mac/Windows 分岐を削減しドキュメントを整理。

---

## [v1.1.0] - 2026-04-19

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

## [v1.0.0] - 2026-04-18: 🎉 初回配布

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
