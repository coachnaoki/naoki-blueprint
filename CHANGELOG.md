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

## [v1.8.0] - 2026-04-24

### 🔥 emphasis / emphasis2 全面リニューアル（両テンプレ同時）

**動画のHook部分に使う2つの強調テロップを、CSS 2層方式から SVG 多層+カスタムfilter方式に全面作り直し**。質感がPSD レイヤースタイル並みに底上げ。

#### emphasis (5層SVG + カスタムfilter)
旧: CSS 2層 赤グラデ文字 + 金縁 (`#990000→#FF2222` / `#FFFFCC→#FFD700`) の斜体
新: **PSD `text-style.psd` 忠実再現**
- 赤5段グラデ `#ff7a63 → #ff3b25 → #ea1208 → #c70000 → #8d0000`
- クリーム縁 `#fff3bf` + 濃赤茶締め `#7f280e` + 上ハイライト
- カスタムfilter: `feGaussianBlur + feColorMatrix` で金色グロー、`feDropShadow` で右下影
- fontSize 122 維持, Shippori Mincho 800, 斜体廃止

#### emphasis2 (10層SVG + カスタムfilter)
旧: SVG 2層 金グラデ `#FFF438→#FFFFFF→#E99B00` + ダークゴールド縁の斜体
新: **中心で割れる金属反射表現**
- 11段グラデ (上端 `#d89f06` → 中心直上 `#ffffff` / 中心直下 `#8c5a00` → 下端 `#d89f06`)
- 実体押し出し2段 (+6/+6 & +3/+3) + 濃茶外周 + 黄土内縁 + 黄白細エッジ
- 中央暗部切替帯 + 下側再反射 + 金外光の独立レイヤー
- fontSize 122 維持, Shippori Mincho 800, letterSpacing -0.03em, 斜体廃止

#### 運用への影響

- **書式は他テンプレと同じ** (`text` props のみ) — 生徒の学習コスト変化なし
- テンプレ判断表 (step08-telop) の使い分けルールは完全維持、見た目だけ豪華に
- **emphasis3 および python `generate-svg.py` 事前生成ワークフロー完全廃止** (emphasis2の新実装で包含)
- 更新: 両テンプレ (`.template` / `.template-shorts`) の CLAUDE.md・step09-composition SKILL.md

#### 文字数制限

fontSize 122 維持のため文字数制限も不変。縦 8文字max / 横 14文字max。

---

## [v1.7.0] - 2026-04-24

### 🔥 word-boundary snap の廃止（step05-cut）

v1.3.0 で導入した「カット境界を transcript_words.json の word.end/start にスナップする」方式を **完全廃止**し、v1.2.x 時代の **対称 0.075s padding（音量ベース）** に戻した。両テンプレ（横・ショート）共通で適用。

### 経緯

受講生フィードバックで「発話末尾がカットされすぎている」との声があり、Naoki が A/B 比較テストを実施：

- **A** = legacy（0.075s 対称 padding、音量ベース）
- **C** = word-boundary snap + AFTER 150ms / BEFORE 50ms（v1.3.0〜v1.6.0 の現行）

同一素材（Teleprompter 2分48秒）で両方生成して聴感比較した結果：
- A の方が発話末尾・先頭の余韻が自然に残る
- C は **100-300ms 単位で末尾/先頭を削りすぎる** 境界が多発（例: 「あなた」の「あ」が消える、「〜ね」の「ね」の息が切れる）

### 原因（技術的）

- video-use（browser-use チーム公開）の snap アルゴリズムは **ElevenLabs Scribe の timestamp 精度（ズレ 50-100ms）** を前提に 150ms padding で吸収する設計
- naoki-blueprint は **mlx-whisper（ローカル）** 運用で、word timestamps のズレは **100-300ms**（母音先頭・子音末尾を拾い損ねる）
- AFTER 150ms では吸収しきれず、snap するほど発話境界が削られる結果に

### 変更内容

両テンプレの `.claude/skills/step05-cut/SKILL.md` Phase 4 を以下に変更：

- **削除**: `word_before` / `word_after` 関数、`KEEP_AFTER` / `KEEP_BEFORE` / `FALLBACK` 定数、snap アルゴリズム全体
- **戻した実装**: `keeps = [(max(0, s - 0.075), min(total_duration, e + 0.075)) for s, e in keeps]` の1行

Phase 3 までの merge・keeps 計算は維持。言い直し検出（N-gram）も変更なし。

### 効果（Teleprompter 2分48秒での実測）

- **A (legacy)**: 116.75s keep（30.5% カット、38セグメント）← 本バージョン
- C (snap): 113.80s keep（32.3% カット、40セグメント）← 旧バージョン
- 差分 +2.95s。A の方が尺は長いが、発話末尾の自然さで勝る

### 既存受講生への影響

- **次回 `./アップデート.sh` で自動反映**。projects/XXX 配下にも step05-cut の新 SKILL.md が配布される
- 既に step05 を終えたプロジェクトは再カットしなくても OK（cut 結果がそのまま残る）
- 次回新規プロジェクトから A 方式で cut される

---

## [v1.6.0] - 2026-04-24

### ✨ 新機能: 新規プロジェクトへの .license 自動コピー

受講生が新規プロジェクトを作るたびにライセンスID入力を求められる問題を解消。

- **`新規作成.sh` が `.license` を自動コピー**: `projects/$NAME/` を作成した直後に、親の `naoki-blueprint/.license` をコピーする処理を追加。認証済みなら再入力不要。親に `.license` がない場合は警告表示のみで処理は続行。
- **`find-license.mjs` を新規追加**（横・ショート両方の `scripts/`）: 万が一 `.license` がコピーされていない環境でも、`node scripts/find-license.mjs` を実行すれば親 naoki-blueprint または兄弟プロジェクトから自動探索してコピーする。fingerprint（hostname|user|platform|arch）一致時のみコピー、別PCのライセンスは拒否する。naoki-slides の同名スクリプトと同じ思想。
- **`CLAUDE.md` のライセンス認証フロー刷新**（横・ショート両方）: 旧「毎回 validateLicense.mjs 実行」の4ステップから、新「_chk.mjs → find-license.mjs → validateLicense.mjs」の5ステップ順番試行フローに変更。naoki-slides と認証フローを統一。

### 🎨 個人環境の改善（`~/.claude/commands/new-video.md`）

Naoki本人の環境のみに適用される変更。

- **`/new-video` を osascript + Terminal.app から `cursor` コマンドに切替**: プロジェクト作成後、別アプリ（Terminal.app）を立ち上げずに **Cursor の新ウィンドウ** を開くよう変更。素材ドラッグ&ドロップも同じアプリ内で完結。Mac/Windows/Linux 共通で動作。
- **`.license` 自動コピーを `/new-video` にも組み込み**: `新規作成.sh` → `.license` コピー → `cursor` 起動 の順で実行し、新ウィンドウ側のセッションで即 `/step01-context` が叩ける状態に。

### 📌 既存受講生への影響

- 次回 `./アップデート.sh` または step 実行時の自動更新で、`projects/*/scripts/` に `find-license.mjs` が配布される
- 既存プロジェクトは `.license` がそのまま残るので影響なし
- 新規プロジェクト作成時（`bash 新規作成.sh`）から自動コピーが効くようになる

---

## [v1.5.7] - 2026-04-23

### 🐛 緊急修正: step12 が動かなかった不具合を解消

- **`aislides/slides.html` を復元**: v1.5.0 付近の整理時（2026-04-10 コミット `a765750`）に誤って削除していたテンプレートエンジン本体を復元。step12-slides-gen の SKILL.md は引き続き `aislides/slides.html` の `SLIDE_SCRIPT` を書き換える前提で書かれていたため、受講生が step12 を起動すると「slides.html が存在しません」で止まる状態になっていた。
  - 復元した中身: 17種類のスライドテンプレートを描画する `renderTitle` / `renderThreeCards` 等のレンダラー関数群、CSS、レンダリングループ（計767行、35.4KB）。ライムイエロー `#CCFF00` + ダーク `#121212` + Zen Kaku Gothic New。
  - `SLIDE_SCRIPT` 部分は `title` 1枚の最小雛形に差し替え済み（step12 が台本から書き換える前提のため、サンプルデータは不要）。
  - step12〜step14（スライド生成・キャプチャ・ワイプ調整）のワークフローがそのまま機能する状態に戻っている。

---

## [v1.5.6] - 2026-04-23

### 🛡️ 信頼性・堅牢性の強化（v1.5.5 レビュー指摘を反映）

v1.5.5 リリース後のコードレビューで発見された潜在的不具合を修正。受講生への配布前の安全強化。

- **`_chk.mjs` 自動アップデート: 自己書き換え問題の回避**（横・ショート両方）: `git reset --hard origin/main` で `アップデート.sh` 自身が書き換わった直後に同じファイルを実行していた。bash はスクリプトを行単位で読むため、中盤でファイル差し替えが発生すると未定義動作（途中切れ・エラー）になるリスクがあった。対策として `/tmp/` に一時コピーしてから実行するよう変更。
- **`_chk.mjs` 失敗ループ防止**（横・ショート両方）: git fetch 失敗時にキャッシュを書かずに return していたため、ネット不調の受講生は step実行のたびに10秒 fetch 待ちが発生する問題。関数冒頭で先にキャッシュを書くよう修正し、24h頻度制限が本来の目的通り効くように。
- **`_chk.mjs` 未来時刻対応**（横・ショート両方）: PC時計が狂っている場合 `now-last<0` で24h判定をパスして毎step走る問題。`Math.abs(now-last)` で対応。
- **`_chk.mjs` 失敗時の可視性改善**（横・ショート両方）: 全体を try/catch で包んでいたため失敗が完全silent。自動更新スキップ時に薄い表示で受講生に気づかせる。
- **`/new-video` ROOT解決を git rev-parse に変更**（横・ショート両方の `.claude/commands/new-video.md`）: `cd $(pwd)/../..` は「projects/XXX で実行」前提でサブディレクトリ実行時に破綻していた。`git rev-parse --show-toplevel` で確実に本体ルートを取得。`新規作成.sh` 存在チェックも追加。
- **`/new-video` Windows Git Bash 日本語ファイル名対応**（同上）: `bash 新規作成.sh`（相対パス）は locale 問題で失敗する可能性があった。`bash "$ROOT/新規作成.sh"` で絶対パス化。
- **`/new-video` osascript シングルクォートエスケープ**（同上）: パスに `'` が含まれると AppleScript が失敗。`sed` でエスケープ変数を作って対応。
- **`/new-video` Linux KDE環境対応**（同上）: `konsole` をフォールバックに追加（gnome-terminal → konsole → xterm の優先順序）。
- **`アップデート.sh` ローカル変更の自動退避**: `git reset --hard origin/main` 実行前に `git diff --quiet HEAD` でルート直下の変更をチェック → あれば `git stash push -u` で安全に退避。受講生がうっかり CLAUDE.md 等を編集した場合にもデータロスを防ぐ。

---

## [v1.5.5] - 2026-04-23

### 🎯 新機能: 完全自動アップデート
- **`bash アップデート.sh` の手動実行が不要に**（横・ショート両方）: 各 step 実行時に呼ばれる `scripts/_chk.mjs` に自動アップデート機能を内蔵。24時間に1回だけ `git fetch origin` で最新版チェック → 差分があれば自動で `git reset --hard origin/main` + projects/XXX 同期 → CHANGELOG差分を一瞬表示。ユーザーは何もしなくていい。ネットワークエラーや git 未初期化リポジトリでは静かにスキップする（作業は継続）。
  - 変更箇所: `.template/scripts/_chk.mjs` / `.template-shorts/scripts/_chk.mjs`
  - 24時間キャッシュ: `scripts/.last-update-check`（gitignore済み）
  - タイムアウト: 10秒（ネット不調時に待たされない）
  - docs/activate.html の「アップデート」セクションも「自動です。何もしなくてOK」に書き換え

### 🔧 新規プロジェクト作成フローの改善
- **`/new-video` スラッシュコマンド実装**（Naoki個人環境・`~/.claude/commands/new-video.md`）: Claude Code 内で `/new-video` とタイプすると、macOS の `osascript` で新しい Terminal.app ウィンドウを自動起動し、そこで `bash 新規作成.sh` を実行する。cwd 問題を回避してシンプルに新規プロジェクトが作れる。
- **CLAUDE.md に新規作成コマンドの取り扱いルール追加**（横・ショート両方）: ユーザーが Claude Code 内で `bash 新規作成.sh` をタイプした場合、実行は許可するが実行直後に「新しいターミナルで `cd projects/XXX && claude` で起動し直してください」という案内を返すルールを明記。cwd 問題で配布テンプレ本体を書き換える事故を防ぐ。

### 📌 既存受講生への影響
- `.license` ・素材（`public/`）・テロップデータ（`src/*.tsx`）・transcript は今まで通り完全保護
- 今回の `_chk.mjs` 更新は、**1回だけ手動で** `bash アップデート.sh` を実行すると反映される（以降は完全自動）
- または新規プロジェクト作成で `新規作成.sh` を走らせれば本体が最新化されるため、その際に projects/XXX も同期される

---

## [v1.5.4] - 2026-04-23

### 🔒 セキュリティ改善
- **Gemini APIキーの入力フローを「チャット貼付→自動 `.env` 作成」から「空 `.env` 作成→ユーザーがプレビューで直接入力」に変更**（横・ショート両方）: 従来は Claude Code のチャットにAPIキーを貼り付けさせ Write ツールで `.env` を自動作成していた。このフローではキーが Claude Code のローカルトランスクリプトに平文で残り、サブエージェントへのコンテキスト引き継ぎ・画面共有・スクショ経由での漏えいリスクがあった。新フローでは Claude Code が空の `.env` を Write で作成し、ユーザーが Cursor / VS Code のファイルプレビューで `.env` を開いてキーを直接貼り付け・保存する。完了後「OK」とだけ返答してもらい、Claude Code は `.env` を Read して形式検証する。キーは一切チャットを経由しない。
  - 変更箇所1: `.template/.claude/skills/step15-images/SKILL.md`（横動画・0-A セクション）
  - 変更箇所2: `.template-shorts/.claude/skills/step12-images/references/ai-generated.md`（ショート動画・0-A セクション）
  - 変更箇所3: `.template/scripts/generate-images.py` / `.template-shorts/scripts/generate-images.py`（docstring と未設定時のエラーメッセージ）
  - **既存ユーザーへの影響**: 既に `.env` が存在するプロジェクトは変更なしで動作継続。新規プロジェクト or APIキー未設定プロジェクトのみ新フローが適用される。

---

## [v1.5.3] - 2026-04-22

### 🐛 バグ修正
- **横動画のテロップ文字数制限が守られない問題を修正**（`.template/CLAUDE.md` / `.template/.claude/skills/step08-telop/SKILL.md`）: v1.4.0で「(横・ショート両方) 句読点削除ルールに統一」「分割優先順位を助詞のみに一本化」と更新したが、横動画 CLAUDE.md L378 の「分割の優先ポイント：読点（、）、句点（。）、助詞の後」が古いまま残っていた。テロップから句読点が既に削除されているため AI が分割キーを失い、20字超の長文をそのまま出力する事故が発生していた。
  - CLAUDE.md「1行の文字数制限」を全テンプレート別の表に拡充（normal/normal_emphasis=20字 / third_party=18字 / negative=17字 / theme=16字 / 強調系=14字）
  - 「1字でも超えたら分割」を絶対遵守として強調
  - 分割優先順位から句読点を完全削除し、助詞のみに一本化
  - step08-telop SKILL.md にも同じ文字数表を直接埋め込み（CLAUDE.md参照に依存させない）
  - 「生成時に毎回数える」「目分量NG」を明文化
- **横動画は1行のみであることを明記**: ショート動画で v1.4.0 に追加された `\n` での2行化機能は横動画には未実装。CLAUDE.md に明示して混同を防ぐ。

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
