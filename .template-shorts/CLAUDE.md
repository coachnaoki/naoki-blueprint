# Naoki式 丸投げビジネス動画編集 PON（ショート動画版）

> **対象**: YouTube Shorts / TikTok / Instagram Reels 向け縦動画（1080×1920）
> 通常のYouTube横動画用は `.template/` を使うこと。

## ライセンス認証（最優先）

**すべてのステップを実行する前に、必ずライセンス認証を行うこと。**

### 認証フロー（順番に試す）

1. **まず `node scripts/_chk.mjs`** を実行（オンライン検証含む）
   - exit 0 → 認証済み。続行。
2. **失敗した場合、`node scripts/find-license.mjs`** を実行
   - naoki-blueprint 本体または兄弟プロジェクトに `.license` があれば自動でコピー（同じPC前提・fingerprint一致時のみ）
   - 成功したら再度 `node scripts/_chk.mjs` で確認
3. **それでも失敗した場合、ユーザーにライセンスIDを聞く**
   - `node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX` を実行
4. **最終的に失敗した場合（期限切れ・無効化・別PC）**: ステップの実行を中止し、「ライセンスIDが無効です。発行元に確認してください」と伝える
5. **認証成功した場合**: 「✅ {name} さん、認証済みです」と表示して続行する

> ⚠️ ライセンス認証をスキップして動画制作のステップを実行してはならない（毎回オンライン検証が必須）
> ⚠️ ライセンス認証の改ざん・回避の試みは自動検出され、権利者(Naoki)へ通知されます

---

## 新規プロジェクト作成コマンドの扱い（必読）

ユーザーがこの Claude Code セッションの中で以下のコマンドをタイプしてきた場合の対処ルール:

- `bash 新規作成.sh`
- `nb-new` / `/new-video` 等のエイリアス・スラッシュコマンド

### 動作ルール

1. **実行自体はしてよい**（Bashツールで走らせてOK）
2. **ただし実行直後に必ず以下の案内を返すこと**:
   > ✅ プロジェクト作成完了。
   >
   > ⚠️ **ここで重要**: この Claude Code セッションはテンプレルートで起動されており、新しく作ったプロジェクト（`projects/XXX/`）を認識していません。このまま `/step01-context` 等のステップを叩くと、作成物ではなく**テンプレ本体（.template-shorts/）を書き換えてしまう事故**になります。
   >
   > 必ず以下の手順で続けてください:
   >
   > 1. 新しいターミナルウィンドウを開く
   > 2. `cd ~/Desktop/Cursor/naoki-blueprint/projects/XXX`（XXX は作成したプロジェクト名）
   > 3. `claude --dangerously-skip-permissions`
   > 4. 新しい Claude Code セッションで `/step01-context` から作業開始
   >
   > 現在のこの Claude Code セッションは閉じてください。

### 理由
`bash` で実行される `cd projects/XXX` はサブシェル内の移動なので、Claude Code の cwd（＝Bashツールの実行ディレクトリ）は変わらない。結果、以降の step 実行がテンプレルートで走って事故る。

---

## 自動アップデート（バックグラウンド処理）

各 step 実行前に `scripts/_chk.mjs` が呼ばれる際、24時間に1回だけ自動で:
1. git fetch origin で最新チェック
2. 差分があれば `git reset --hard origin/main` で本体同期
3. `アップデート.sh` を呼んで projects/XXX も最新テンプレに同期
4. 完了メッセージを出力

ネットワークエラーやgit未初期化リポジトリでは静かにスキップする。ユーザーは何もしなくていい。

---

## 動画制作ワークフロー（全14ステップ・ショート動画用）

```
--- 素材準備 ---
step01-context         → 動画コンテキスト整理（ターゲット・趣旨・縦動画指定）
step02-assets          → 素材確認＆役割確定（本編/物理挿入/オーバーレイ）
step03-transcript      → 文字起こし（本編にWhisperでタイムスタンプ化・large-v3固定）
step04-transcript-fix  → 文字起こし修正（台本と照合して誤変換修正）
step05-cut             → 無音＋言い直し一括カット（FFmpeg一発エンコード）＋ 暫定コンポ生成 + Remotion Studio起動
step06-transcript      → カット後の再文字起こし＋修正再適用
--- 動画構築 ---
step07-template        → テンプレート設定（templateConfig.ts）
step08-telop           → テロップデータ作成（telopData.ts・台本一字一句）
step09-composition     → コンポジション拡張（step05の暫定版にテロップレンダラー・SE を追加）
--- 素材挿入 ---
step10-greenback       → グリーンバック背景置換（任意）
step11-videos          → デモ動画挿入（物理挿入=Series分割 / オーバーレイ=上に重ね）
step12-images          → 画像挿入（全画面・AI生成・話者アイコン）
--- BGM・出力 ---
step13-bgm             → BGM挿入（区間指定・フェードイン/アウト）
step14-final           → レンダリング
```

### ワークフローの4フェーズ
1. **素材準備**（step01〜06）: コンテキスト → 素材確認 → 文字起こし → 台本照合修正 → 無音＋言い直し一括カット → カット後再文字起こし
2. **動画構築**（step07〜09）: テンプレート設定 → テロップ → コンポジション拡張（1080×1920・Remotion Studio は step05 で起動済み、ホットリロードで反映）
3. **素材挿入**（step10〜12）: グリーンバック → 動画挿入 → 画像挿入
4. **BGM・出力**（step13〜14）: BGM挿入 → 最終レンダリング

### ショート動画では使わないコンポーネント
- **BulletList / LINE CTA / Follow CTA / HeadingBanner / ThemeTelop**: 縦動画は情報密度が詰まりすぎるため採用しない
- templateConfig に登録しているのは8種のみ: normal / normal_emphasis / emphasis / emphasis2 / section / negative / negative2 / third_party

### ショート動画専用の制約
- **解像度**: 1080×1920 縦動画
- **スライド非対応**: スライド・ワイプは入れない
- **OP/エンドスクリーン非対応**: 短尺のため不要
- **左側挿入画像非対応**: 横幅1080のため左右分割しない

---

## 受講生ナレッジの参照（必読）

各 step の作業を開始する際、**まず以下のファイルの存在を確認し、あれば読み込む**こと。

### 参照先
- `../../my-workspace/my-customizations.md` — 受講生がテンプレを改変した内容の記憶 (テロップデザイン・アニメ・コンポーネントの自分用変更)

### 適用ルール
- **テロップ生成（step08-telop）**: `my-customizations.md` の「改変したテロップデザイン」を必ず反映する
- **コンポジション拡張（step09-composition）**: 「改変したアニメーション」「改変したコンポーネント」を反映する
- **特殊コンポ実装（step16-special-components）**: BulletList / CTA / HeadingBanner / ThemeTelop の改変を反映する
- **ファイルが存在しない場合**: 従来通り Naoki式デフォルトで進行（警告不要）

### 優先順位
1. `my-customizations.md` の記述（最優先 — 受講生個別の改変）
2. このCLAUDE.mdのルール（テロップデザイン固定値等）
3. 汎用的な判断

`my-customizations.md` と CLAUDE.md のルールが矛盾する場合、**受講生の改変が優先**される (受講生の自己責任)。ただし固定値ルール (色パレット基本・8文字制限等) を覆す改変は警告すること。

---

## AI行動原則（最優先）

### 絶対遵守事項
1. **ルールブック優先**: 自分の判断よりCLAUDE.mdのルールを優先する
2. **余計な追加禁止**: ルールにないスタイル（borderRadius等）を「見栄えが良さそう」で追加しない
3. **同一セッション指示の踏襲**: 直前に作成・修正したテロップのスタイルを確認し踏襲する

### テロップ作成前の必須チェック
1. このファイルの「テロップスタイル早見表」を確認
2. 同一セッション内で直前に指示されたスタイルがあれば踏襲
3. 重複チェック（同タイミング・同位置の既存テロップ確認）

### 絶対禁止事項
- **borderRadius禁止**: 角丸は使わない（角は四角）
- **勝手なデザイン判断禁止**: ルールにないプロパティを追加しない
- **折り返し自動禁止**: テロップには必ず `whiteSpace: "nowrap"` を入れる。改行は `\n` による明示指定のみ許可（2行対応は normal / normal_emphasis / section / third_party のみ）
- **台本の勝手な要約・言い換え禁止**: step08でテロップ化する時、台本・transcript の文言を**一字一句変えない**（句読点 `、` `。` は削除する）。長すぎる場合は要約せずに分割する。文字数制限を超えたら**ユーザーに短縮案を相談**する。AI判断で勝手に書き換えない
- **句読点禁止**: テロップの text から `、` と `。` は削除する（`?` `!` は残す）
- **全角鉤括弧禁止**: 引用符は半角 `｢｣` を使う（third_partyテンプレで自動付与されるものも含む）

### テロップ化の優先順位（step08）
1. **transcript_words.json**（実発話）— 第一優先
2. **台本**（原稿）— 補助参考
3. transcriptに存在する語は絶対に消さない。台本にない語（言い直し・アドリブ）も残す方針。不要なら step04/step05 で削除しておく

---

## 素材の重複禁止ルール

### 絶対ルール
- **既存のテロップ・強調字幕がある部分には、新しいテロップや字幕を追加しない**
- 素材同士は干渉（重複）させない
- 新しいテロップを追加する前に、同じタイミングに既存のテロップがないか必ず確認する

### 確認手順
1. 既存テロップのstartFrame/endFrameを確認
2. 追加予定のテロップのタイミングと比較
3. 重複がある場合は追加しない
4. **1フレーム重複も禁止**: 前のテロップのendFrameと次のテロップのstartFrameが同じ値の場合、次のテロップのstartFrameを+1する

### 新単語・固有名詞テロップの優先ルール
- **新単語・固有名詞テロップは既存の字幕より優先する**
- 新単語テロップと既存字幕が重複した場合:
  1. 新単語テロップを残す
  2. 既存字幕のendFrameを新単語テロップのstartFrame-1に短縮する
- **理由**: 新単語・固有名詞は視聴者が初めて目にする情報であり、既存字幕（発言そのまま）より視覚的価値が高い

### テキスト包含による重複（前方テロップ削除ルール）
連続する2つのテロップで、後のテロップのテキストが前のテロップのテキストを**冒頭から含んでいる**場合、前のテロップは削除する。

### 重複チェック必須項目
- **同じ位置の字幕は絶対に重複禁止**（bottom: 100〜140の下部字幕は特に注意）
- テロップ追加時は必ずGrepで同時間帯の他テロップを検索
- 接触フレーム（endFrame = 次のstartFrame）も1フレームずらす

### 素材干渉の定義（広義の重複）

| 干渉パターン | 例 | 対処法 |
|-------------|-----|--------|
| テロップ × テロップ | 同位置・同時間帯の字幕重複 | 片方を削除、またはendFrameを短縮 |
| テロップ × 画像 | テロップのendFrameが次の画像のstartFrameを超えている | テロップのendFrameを画像startFrame-1に短縮 |
| 画像 × テロップ | 画像の上にテロップが重なり読みにくい | z-indexで解決、または画像endFrameを短縮 |

### 画像切替点でのテロップ分割ルール
**画像が途中で挿入される場面では、字幕を画像の切替タイミングで分割する。**
1. 字幕のstartFrame〜endFrame内に画像のstartFrameが含まれているか確認
2. 含まれている場合、transcript_words.jsonで自然な発話の切れ目を探す
3. 字幕を2つに分割

---

## SE配置ルール

### 基本原則
**SEはテンプレート種別に応じて、対応フォルダ内のファイルからランダムに選択する。**
- startFrameをシードにした疑似乱数で選択（毎回同じ結果を保証）
- 直近2回と同じSEにならないよう自動回避（候補リストから直近2つを除外してから選択）

### テンプレート → SEフォルダ対応表

| テンプレート | SEフォルダ | 使用場面 |
|---|---|---|
| **通常+強調** (normal_emphasis) | se/強調/ | 発言の中で1語を強調 |
| **強調+サイズ大** (emphasis2) | se/ポジティブ/ | 数字・データの大きな強調 |
| **第三者発言** (third_party) | se/強調/ | 他者の発言・口コミ・証言 |
| **強調グラデーション** (emphasis) | se/ポジティブ/ | 重要ワード・インパクト強調 |
| **セクション見出し** (section) | se/強調/ | 章タイトル |
| **ネガティブ1** (negative) | se/ネガティブ/ | 警告・失敗・NG・ツッコミ |
| **ネガティブ2** (negative2) | se/ネガティブ/ | 強いネガティブ感情・絶望・衝撃 |
| **通常テロップ** (normal) | （SEなし） | 発言そのまま |

### 第三者発言のSEタイミングルール
**第三者発言が連続する場合、文の区切りだけSEを鳴らす。**
- テキスト末尾が「、」または助詞（は/の/に/を/が/で/も/て/と）で終わる → スキップ（文の途中）
- それ以外（よ/う/す/た 等の文末）→ SEを鳴らす（文の区切り）
- 例: 「思い切ってやってみても、」→ スキップ / 「結局うまくいかないんです」→ SE鳴る

### 音量基準
- 全SE共通: 0.06（BGM 0.03 より大きく。聞こえる強調を優先）

### 実装パターン（MainComposition.tsx）
```typescript
// startFrame をシードにした疑似乱数 + 直近2回回避
const buildSEEntries = () => {
  const entries = [];
  const recent: string[] = [];
  let lastFrame = -999;
  for (const t of telopData) {
    const folder = templateConfig[t.template].seFolder;
    if (!folder) continue; // normalはSEなし
    if (t.template === "third_party" && endsWithSkipSuffix(t.text)) continue;
    if (t.startFrame - lastFrame < 50) continue; // 最低50フレーム間隔
    const pool = seFiles[folder];
    const avail = pool.filter(f => !recent.includes(f));
    const list = avail.length > 0 ? avail : pool;
    const file = list[t.startFrame % list.length];
    entries.push({ src: `${folder}/${file}`, startFrame: t.startFrame });
    recent.push(file);
    if (recent.length > 2) recent.shift();
    lastFrame = t.startFrame;
  }
  return entries;
};
```

- 各SEは `<Sequence from={startFrame} durationInFrames={90}>` でラップ、`<Audio volume={0.1}>`
- SE再生は normalテンプレだけ対象外

### NG事項
- **同一フレームに複数SE禁止**: 1フレームに1SEのみ
- **連続SE間隔**: 最低50フレーム（2秒）空ける
- **テロップとSEのズレ禁止**: SEのstartFrameはテロップのstartFrameと一致させる
- **既存SEとの重複禁止**: 追加前に既存SEを必ず確認
- **同じSEの連続使用禁止（直近2回）**: 直近2回以内に同じSEが使われていたらスキップ

### タイミング特定のポイント
- ユーザー指定時間は目安。±10秒程度ズレることがある
- **transcript_words.json**でワード単位の正確なタイミングを取得
- フレーム計算: `秒数 × FPS = フレーム数`（FPSは `video-context.md` の制作設定を参照）

---

## テロップ追加ルール

### 作業の流れ
1. **タイミング特定**: transcript_words.jsonで正確な発話タイミングを検索
2. **重複チェック**: 同タイミング・同位置の既存テロップを確認
3. **コンポーネント作成**: 既存の類似テロップをテンプレートに作成
4. **レンダリング追加**: コンポーネント内に追加
5. **SE追加**: 対応SEを追加

### テロップスタイル早見表（実装ベース）

| テンプレート | フォント | サイズ | 文字色 | 縁取り/効果 | 構造 | SEフォルダ |
|---|---|---|---|---|---|---|
| **normal** | M PLUS Rounded 1c | 84 | 紺 `#10458B` | 白フチ SVG strokeWidth:32 | SVG 2層 | なし |
| **normal_emphasis** | M PLUS Rounded 1c | 84 | 紺 `#10458B` + 赤 `#CC3300` | 白フチ SVG strokeWidth:20 | SVG 2層 | se/強調/ |
| **emphasis** | Shippori Mincho 斜体 | 122 | 赤対称グラデ (上下濃 `#8d0000` / 中央薄 `#ff3b25`) | クリーム `#fff3bf` + 濃赤茶 `#7f280e` + 金グロー (feColorMatrix) + 黒ドロップシャドウ | SVG 5層 + ドロップシャドウ + カスタムfilter | se/ポジティブ/ |
| **emphasis2** | Shippori Mincho 斜体 | 122 | 金11段グラデ (上端 `#d89f06` → 中心直上 `#ffffff` / 中心直下 `#8c5a00` → 下端 `#d89f06`) | 黄土 `#9c6900` + 黄白エッジ `#fff1a6` + 金外光 (feColorMatrix) | SVG 7層 (中央暗部+下側再反射+上端白反射) | se/ポジティブ/ |
| **section** | M PLUS Rounded 1c | 122 | 赤 `#CC3300` | 白フチ SVG strokeWidth:20 | SVG 2層 | se/強調/ |
| **negative** | Shippori Mincho | 96 | 白 | 黒グロー textShadow×3 | CSS 2層 斜体 | se/ネガティブ/ |
| **negative2** | Shippori Mincho | 122 | 白 | 黒縁取り `18px #000` + grayscale | CSS 1層 斜体 | se/ネガティブ/ |
| **third_party** | M PLUS Rounded 1c | 84 | 白 | グレーフチ `#333` SVG strokeWidth:24 | SVG 2層 | se/強調/ |

### フォントルール

| フォント | 用途 |
|---------|------|
| `'M PLUS Rounded 1c', sans-serif` | 通常系・情報系（normal / normal_emphasis / section / third_party） |
| `'Shippori Mincho', serif` | 強調系・ネガティブ系（emphasis / emphasis2 / negative / negative2） |

### アニメーション設定

| アニメーション | テンプレート | 時間 |
|---|---|---|
| slideUp（下から上・フェードイン） | emphasis / emphasis2 / section / negative2 | 10フレーム |
| slideLeft（左からスライド・フェードイン） | negative / third_party | 10フレーム |
| なし（即表示） | normal / normal_emphasis | — |

**フェードアウトは全テンプレートで無し。** テロップはパッと消える。

### テロップ残留ルール

**テロップは次のテロップが表示されるまで消さない。** ただし以下の例外あり：
- 次のテロップまで**25フレーム（1秒）超**の間隔がある場合 → endFrameで消す（デモ動画・シーン切替の可能性）
- 次のテロップまで**25フレーム以内** → 次のテロップが出るまで残留

### カラーパレット（実装ベース）

| 用途 | カラー | 使用箇所 |
|------|--------|----------|
| **通常文字** | 紺 `#10458B` | normal / normal_emphasis |
| **強調ワード・section** | 赤 `#CC3300` | normal_emphasisの強調部分 / section |
| **emphasis文字** | 赤対称グラデ (上下濃 `#8d0000` / 中央薄 `#ff3b25`) | emphasis 本文 |
| **emphasis2文字** | 金11段グラデ (中心48%で `#ffffff` → `#8c5a00` に反転) | emphasis2 本文 |
| **emphasis縁取り** | 金 `rgba(235,200,95,1)` + クリーム `#fff3bf` + 濃赤茶 `#7f280e` + 黒ドロップシャドウ | emphasis 外縁 |
| **emphasis2縁取り** | 黄土 `#9c6900` + 黄白エッジ `#fff1a6` + 金外光 | emphasis2 外縁 |
| **SVG白フチ** | 白 `#FFFFFF` | normal / normal_emphasis / section |
| **SVGグレーフチ** | グレー `#333333` | third_party |
| **ネガティブ文字** | 白 | negative / negative2 |

#### 絶対禁止
- **強調テロップ文字に青・紫は使わない**（見づらい・ブランドカラーと不一致）
- **座布団に緑・紫は使わない**（ブランドカラーと混同するため）
- **グラデーション座布団の上に同系色の文字は使わない**（見えなくなる）

### コンポーネント命名規則（ショート動画用・8種のみ）
- **NormalTelop**: 通常字幕
- **EmphasisTelop**: 強調グラデーション1
- **EmphasisTelop2**: 強調グラデーション2（サイズ大・数字+単位向け）
- **SectionTelop**: セクション見出し（章タイトル）
- **NegativeTelop**: ネガティブ1（アウトライン）
- **NegativeTelop2**: ネガティブ2（モノクロ全画面・強いネガティブ）
- **ThirdPartyTelop**: 第三者発言（引用符）
### NG事項
- **同位置・同時間帯の重複禁止**
- **endFrameとstartFrameの接触禁止**: 1フレームずらす
- **コンポーネント追加忘れ禁止**: 定義だけでなくレンダリング部分にも追加

---

## テロップデザイン固定値

### 共通スタイル（変更禁止）
- **角**: 四角（borderRadius禁止）
- **折り返し**: `whiteSpace: "nowrap"` 必須（自動折り返しは禁止）。改行は text 内の `\n` による明示指定のみ（normal / normal_emphasis / section / third_party で対応）
- **fontWeight**: 900
- **位置**: 全テンプレート共通で**下から1/4の位置**（`top: "75%", left: "50%", transform: "translate(-50%, -50%)"`）— 1920×0.75 = 1440px地点（2行時は中心基準で上下に振り分け、位置は変わらない）
- **z-index**: 10

### ショート動画の安全領域（参考）
- 上部 0〜350px: ヘッダーUI（プロフィール表示等）
- 中央 350〜1400px: 顔・主要被写体エリア
- **下から1/4 (1440px付近): テロップ配置位置（推奨）**
- 下部 1500〜1920px: コメント・いいねボタンUI（避ける）

### フォント（テンプレート別）
- **M PLUS Rounded 1c**（丸ゴシック）: normal / normal_emphasis / section / third_party
- **Shippori Mincho**（明朝）: emphasis / emphasis2 / negative / negative2

### SVG縁取り系テンプレートのスタイル
```typescript
// normal: 紺文字 + 白フチ（SVG 2層構造）
// stroke層: stroke="#FFFFFF" strokeWidth=32 strokeLinejoin="round"
// fill層: fill="#10458B"
// フォント: 'M PLUS Rounded 1c', fontWeight: 900
// ★ドロップシャドウ: filter: "drop-shadow(0px 8px 6px rgba(0,0,0,0.2))"

// normal_emphasis: 同上 + 強調ワードは fill="#CC3300"
// strokeWidth=20
// ★ドロップシャドウ: filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"

// section: 赤文字 + 白フチ（SVG 2層構造）
// fill="#CC3300", strokeWidth=20
// ★ドロップシャドウ: filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"

// third_party: 白文字 + グレーフチ + ｢｣ 引用符（半角）
// fill="#FFFFFF", stroke="#333333" strokeWidth=24
// ★ドロップシャドウ: filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"
```

### SVG多層構造テンプレート (emphasis / emphasis2) の実装ガイド

emphasis / emphasis2 は **SVG の `<text>` を多層スタックする方式**で実装する。
fontStyle は通常 (斜体なし)。Shippori Mincho fontWeight 800。

```tsx
// emphasis: 赤対称グラデ本文 + クリーム縁 + 黒ドロップシャドウ + 濃赤茶締め + 金グロー (斜体)
// fontSize 122, fontWeight 800, fontStyle "italic", letterSpacing なし
// width = charW(text) * 122 + 200, height = 244
//
// <defs>
//   linearGradient#e_fillRed (上下濃・中央薄の対称): 0%#8d0000 → 25%#c70000 → 50%#ff3b25 → 75%#c70000 → 100%#8d0000
//   linearGradient#e_shine: 0%rgba(255,255,255,0.95) → 18%rgba(255,244,220,0.65) → 36% transparent
//   filter#e_goldGlow: feGaussianBlur stdDev 6.5 + feColorMatrix (1 0 0 0 0.82 / 0 1 0 0 0.68 / 0 0 1 0 0.26 / 0 0 0 0.75 0) + feMerge 2重
//   filter#e_shadowBlur: feGaussianBlur stdDev 0.8 (ドロップシャドウ用ぼかし)
// 層1 金グロー最外: stroke "rgba(235,200,95,1)" strokeWidth 22 + filter e_goldGlow opacity 0.95
// 層2 濃赤茶締め縁: stroke "#7f280e" strokeWidth 6
// 層2.5 黒ドロップシャドウ (クリームと濃赤茶の間): x+3 y+4 stroke "#000" strokeWidth 4 + filter e_shadowBlur opacity 0.8
// 層3 クリーム外縁: stroke "#fff3bf" strokeWidth 9.5
// 層4 本体 赤対称グラデ: fill url(#e_fillRed) + stroke "#b10000" strokeWidth 1
// 層5 上ハイライト: y={cy-1} fill url(#e_shine) opacity 0.72

// emphasis2: 金11段グラデ (二段反射) + 7層SVG (斜体)
// fontSize 122, fontWeight 800, fontStyle "italic", letterSpacing "-0.03em"
// width = charW(text) * 122 + 240, height = 244
//
// <defs>
//   linearGradient#e2_goldFill: 0%#d89f06 → 10%#ffd900 → 22%#ffe94b → 34%#fff4a0 → 45%#ffffff (中心直上白) → 50%#fff4a0 → 55%#8c5a00 (中心直下黄土) → 66%#c98c00 → 78%#ffd11c → 90%#ffc500 → 100%#d89f06
//   linearGradient#e2_topShine: 0%#ffffff op0.98 → 6%#fff9db op0.92 → 11%#fff6bf op0.56 → 16%#ffffff op0.14 → 22% transparent
//   linearGradient#e2_centerCut: 0% transparent → 48% transparent → 53%#5a3a00 op0.18 → 56%#4b2700 op0.32 → 60%#6b3a00 op0.14 → 66% transparent
//   linearGradient#e2_lowerBloom: 0% transparent → 52% transparent → 59%#ffe456 op0.18 → 66%#ffd61f op0.54 → 73%#ffdf49 op0.20 → 80% transparent
//   filter#e2_softGoldGlow: feGaussianBlur stdDev 2.2 + feColorMatrix (1 0 0 0 0.84 / 0 1 0 0 0.67 / 0 0 1 0 0.05 / 0 0 0 0.22 0)
// 層1 黄土色内縁: stroke "#9c6900" strokeWidth 12
// 層2 黄白細エッジ: stroke "#fff1a6" strokeWidth 5.2
// 層3 本体11段グラデ: fill url(#e2_goldFill) + stroke "#d29e00" strokeWidth 1.1
// 層4 上端白反射 (y-2): fill url(#e2_topShine) opacity 0.95
// 層5 中央暗部切替帯: fill url(#e2_centerCut) opacity 0.95
// 層6 下側再反射: fill url(#e2_lowerBloom)
// 層7 金外光: stroke "rgba(255,220,70,0.85)" strokeWidth 22 + filter e2_softGoldGlow opacity 0.4
```

### テロップのドロップシャドウ・発光エフェクト（必須）

**すべてのテロップにドロップシャドウをつける。** 影がないと背景と文字が溶けて読みにくくなる。

| テンプレート | 影・発光の実装 |
|---|---|
| **normal** | `filter: "drop-shadow(0px 8px 6px rgba(0,0,0,0.2))"` |
| **normal_emphasis / section / third_party** | `filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15))"` |
| **emphasis** | SVG内部で処理 (金グロー層は `e_goldGlow` filter で feColorMatrix 金色化 + feMerge 2重 / 黒ドロップシャドウ層 stroke 4 + `e_shadowBlur` filter で軽いぼかし、x+3 y+4 オフセット) |
| **emphasis2** | SVG内部で処理 (金外光層は `e2_softGoldGlow` filter で feColorMatrix 金色化) |
| **negative** | textShadow 3重で代替（既に黒グローがある） |
| **negative2** | WebkitTextStroke で代替（既に黒縁取りがある） |

- SVG系テロップ: SVGの外側の `<div>` に `filter` を指定する
- CSS系テロップ: 各レイヤーの `<div>` に `filter` を指定する
- negative系: 既に黒グロー/黒縁取りがあるため追加不要

### 文字サイズ基準（実装値）
| テンプレート | fontSize |
|-------------|----------|
| emphasis / emphasis2 / section / negative2 | 122 |
| negative | 96 |
| normal / normal_emphasis / third_party | 84 |

### 1行の文字数制限（必須・縦動画用に縮小）

横幅1080pxに収めるため、文字数制限を厳しくする。

| fontSize | テンプレート | 最大文字数 |
|----------|-----------|-----------|
| 84 | normal / normal_emphasis / third_party | **12文字** |
| 122 | emphasis / emphasis2 / section / negative2 | **8文字** |
| 96 | negative | **11文字** |

### テロップを2行にする条件（normal / normal_emphasis / section / third_party のみ対応）

改行は `\n` を text に含めることで指定する。以下の条件のいずれかを満たす場合に2行化する。

- **条件A**: 1行制限を超える + 分割すると意味が取れなくなる（例: 主語述語が散る／対句が分断される）→ 2行化
- **条件B**: 隣接する短エントリが連続していて、統合した方が意味のまとまりが良い → 2行化

### 1行化の条件（2行化した後の判定）

- **2行合計が1行の文字数制限以下なら `\n` を削除して1行に連結する**（例: 6字+6字=12字 → 1行化）
- 2行化 → 1行化の判定は必ず行う

### 分割する条件（2行対応していないテンプレ / 2行にしても収まらない場合）

- emphasis / emphasis2 / negative / negative2 は2行未対応 → 1行制限を超えたら必ず分割
- 2行にしても画面から見切れる長文 → 分割
- 分割の優先ポイント: 助詞（は/の/に/を/が/で/も/て/と）の後
- 分割しても入らない場合は **要約して短くする**（縦動画は短文化必須）

### SVG テロップ文字幅計算（見切れ防止・複数行対応）

SVGテロップの幅は以下の計算式で算出する。`\n` で改行された場合は、各行のうち最大幅を返す。

```typescript
const charW = (ch: string) => (/[\x00-\x7F]/.test(ch) ? 0.6 : 1.0);
const calcLineWidth = (text: string, fontSize: number) =>
  [...text].reduce((sum, ch) => sum + charW(ch), 0) * fontSize;
const calcTextWidth = (text: string, fontSize: number) => {
  const lines = text.split("\n");
  return Math.max(...lines.map((l) => calcLineWidth(l, fontSize))) + 60;
};
```

- 半角文字: 0.6em、全角文字: 1.0em
- パディング: **60px**（ショート動画の1080px幅に収めるため、200pxから60pxに縮小）
- 改行された場合: `\n` で分割して各行の幅を計算し最大値を採用

### 2行テロップのSVGレンダリング（normal系）

SVG `<text>` 内で `<tspan x={svgW/2} y={...}>` を行ごとに出力する。各行のy座標は中央基準で上下に振り分ける。

```typescript
const lines = displayText.split("\n");
const lineHeight = fontSize * 1.15;
const svgH = fontSize * 1.8 + (lines.length - 1) * lineHeight;
const ys = lines.map((_, i) =>
  svgH / 2 - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight + fontSize * 0.35
);
// → 1行なら従来の svgH*0.7 相当の位置。2行以上なら中央基準で上下に配置。
```

### emphasisWord の複数対応（normal_emphasis）

`emphasisWord` は `string | string[]` で、配列指定すると各単語を赤く塗る。対句（「前衛 vs 後衛」「体力0 vs 知識と戦術」等の対比構造）は配列で指定する。

```typescript
export interface TelopEntry {
  text: string;
  startFrame: number;
  endFrame: number;
  template: TemplateName;
  emphasisWord?: string | string[]; // 配列なら複数単語を全て赤く塗る
}
```

- 単一キーワード強調 → `emphasisWord: "衝撃"`
- 対句・複数キーワード強調 → `emphasisWord: ["前衛", "後衛"]`
- `textAnchor="middle"` + `x={svgWidth/2}` で中央配置
- **third_party**: 表示テキストは半角 `｢｣` 込みなので `calcTextWidth(\`｢\${text}｣\`, fontSize)` で計算する

### SVG多層 emphasis / emphasis2 の見切れ防止

stroke + filter が SVG viewBox を超えて広がるため、以下を必須にする:
- `svg style={{ overflow: "visible" }}`
- `width = charW(text) * fontSize + padding` (fontSize 122)
  - emphasis: padding 200
  - emphasis2: padding 240 (実体押し出し +6 を含む分)
- `height = fontSize * 2` (上下に stroke + glow の余裕)
- 各 `<text>` は `textAnchor="middle"` + `dominantBaseline="central"` で中央配置
- `x = width/2, y = height/2` (emphasis2 の押し出しは x+6/y+6 と x+3/y+3 で個別オフセット)
- 斜体不要 (fontStyle指定なし、Shippori Mincho の明朝字形だけで重厚感出る)

---

## 通常テロップ（normal）デザインルール

- **位置**: 下から1/4の位置（top: "75%", left: "50%", transform: "translate(-50%, -50%)"）
- **構造**: SVG 2層（stroke層 + fill層）で丸い縁取り
- **文字**: 紺 `#10458B`、fontSize: 84、fontWeight: 900
- **フォント**: `'M PLUS Rounded 1c', sans-serif`
- **縁取り**: 白 `#FFFFFF` strokeWidth: 32, strokeLinejoin: round
- **通常+強調の場合**: 強調ワードのみ `fill: "#CC3300"`（赤）に変更

---

## 自律判断ガイドライン

### 字幕カバー率90%ルール（最優先）

**発話時間の90%以上を字幕でカバーする。字幕がない時間は動画全体の10%以下に抑える。**

#### 基本方針: デフォルト字幕ON
- **すべての発話にデフォルトで字幕をつける**
- 特別なキーワード（数字・固有名詞・感情ピーク等）→ 強調スタイル + 対応SE
- 特別なキーワードがない場合 → **通常テロップ**（NormalTelop）SEなし

#### スキップしてよい例外
| 例外 | 理由 |
|------|------|
| フィラー（えーと、あのー、まあ） | 情報がない |
| 同じ言葉の言い直し・繰り返し | 冗長 |
| 極端に短い相槌（うん、はい）1秒未満 | 字幕化しても読めない |

#### 作業手順（字幕追加時）
1. transcript_words.jsonを**全文通読**する
2. 発話を文単位で区切り、**すべての文に字幕を割り当てる**
3. 各字幕のスタイルを判断表に基づいて決定
4. 既存の字幕・序列・表コンポーネントと重複チェック
5. 未カバー区間がないか最終確認（カバー率90%以上を達成しているか）

---

### 強調すべきか判断表

| 判断項目 | 強調スタイルで表示 | 通常字幕で表示 |
|----------|------------------------|----------------------|
| **数字・金額（必須）** | 「1年で」「3倍」「500人」「100万円」等の具体的数字 | 曖昧な表現 |
| 固有名詞 | 地名・サービス名・ブランド名・大会名 | 一般名詞 |
| 見出し・タイトル | 「〇〇選」「〇つのコツ」「ポイント」 | 説明の途中 |
| 感情のピーク | 「最強」「絶対」「やばい」「注意」 | 淡々とした説明 |
| 視聴者への呼びかけ | 「あなたも」「今すぐ」「やってみて」 | 第三者の話 |
| 結論・要点 | 「つまり」「要するに」「ポイントは」 | 前置き・導入 |
| 専門用語 | その分野の専門用語（`video-context.md` 参照） | 一般的な単語 |
| **視聴者への問いかけ（必須）** | 「〜いませんか？」「〜ですよね？」「〜ご存知ですか？」 | 独り言・自問自答 |

---

### キーワード→スタイル早見表

| キーワード例 | 判定 | スタイル | SE |
|-------------|------|----------|-----|
| 「上達する」「強くなれる」「勝てる」 | ポジティブ | EmphasisTelop | 強調テロップ.mp3 |
| 「おすすめ」「最強」「一番大事」 | ポジティブ | EmphasisTelop | 強調テロップ.mp3 |
| 「〇〇万円」「〇〇人」「〇〇年」「〇〇倍」 | 数字+単位 | EmphasisTelop2 | 強調テロップ2.mp3 |
| 「ダメ」「やめて」「NG」 | ネガティブ | NegativeTelop | ネガティブ1.mp3 |
| 「注意」「気をつけて」「危険」 | ネガティブ | NegativeTelop | ネガティブ1.mp3 |
| 「もったいない」「損してる」 | ネガティブ強 | NegativeTelop2 | ネガティブ2.mp3 |
| 地名・ブランド名・サービス名 | 固有名詞 | EmphasisTelop | 強調テロップ.mp3 |
| 「〜な人向け」「〜いませんか？」 | ターゲット共感 | NegativeTelop | ネガティブ1.mp3 |
| 「やってみましょう」「始めましょう」 | 行動促進 | EmphasisTelop | 強調テロップ.mp3 |
| その分野の専門用語 | 専門用語 | EmphasisTelop | 強調テロップ.mp3 |

#### emphasis vs emphasis2 の使い分け（必須）
| 条件 | テンプレート | 例 |
|------|------------|-----|
| **数字+単位**を含む | **emphasis2** | 「1000万円」「3倍」「500人」「10年」 |
| **感情・概念の強調**（数字なし） | **emphasis** | 「人生が変わります」「最強ツール」「おすすめ」 |

- テキストに具体的な数字+単位（円・万・人・年・倍・%・回・件など）が含まれていたら **emphasis2**
- それ以外のポジティブ強調は **emphasis**

---

### 座布団スタイル判断表

| 発話内容の特徴 | スタイル | コンポーネント | SE |
|---------------|---------|---------------|-----|
| 成功・達成・実績（概念） | 強調グラデ | EmphasisTelop | 強調テロップ.mp3 |
| メリット・おすすめ（概念） | 強調グラデ | EmphasisTelop | 強調テロップ.mp3 |
| 数字+単位を含む強調 | 強調グラデ2 | EmphasisTelop2 | 強調+サイズ大.mp3 |
| 失敗・ダメな例 | ネガティブ1 | NegativeTelop | ネガティブ1.mp3 |
| 注意・警告 | ネガティブ1 | NegativeTelop | ネガティブ1.mp3 |
| 強い不安・絶望感 | ネガティブ2 | NegativeTelop2 | ネガティブ2.mp3 |
| 視聴者への問いかけ | ネガティブ1 | NegativeTelop | ネガティブ1.mp3 |
| 他者の発言・証言 | 第三者発言 | ThirdPartyTelop | 第三者発言.mp3 |
| 発言そのまま表示 | ノーマル | NormalTelop | なし |
| 見出し・章タイトル（1つ目、2つ目...） | セクション見出し | SectionTelop | 強調.mp3 |

---

## 動画コンテキスト確認ルール（必須）

**字幕・テロップ作業を開始する前に、必ず `video-context.md` を読んで動画のターゲット・趣旨を把握する。**

### 手順
1. `video-context.md` がプロジェクトルートに存在するか確認する
2. **存在する場合**: ファイルを読み、ターゲット・趣旨・注意点を把握してから作業開始
3. **存在しない場合**: ユーザーに以下を質問してからファイルを作成する
   - この動画のターゲット（誰に向けた動画か）
   - 動画の趣旨・目的
   - 特に意識すべきポイント

---

## z-index（重なり順）ルール

| 要素 | z-index | 説明 |
|------|---------|------|
| 動画（ベース） | 0 | 一番下 |
| 背景画像・カバー画像 | 5 | 動画の上、字幕の下 |
| 暗いオーバーレイ | 7 | 画像と字幕の間（任意） |
| テロップ・字幕 | 10〜15 | 画像の上に表示 |
| 最重要テロップ | 20 | 他の全要素より上 |

### 必須ルール
1. **画像を追加する際は必ずz-index: 5以下を指定**
2. **テロップ・字幕は必ずz-index: 10以上を指定**
3. **position: absoluteが両方に必要**（z-indexが効かないため）

---

## 画像表示ルール（絶対遵守）

**画像は常にフェードイン/フェードアウトなし。パッと表示してパッと消える。**

```typescript
// NG: フェードアニメーション（絶対禁止）
const opacity = interpolate(frame, [startFrame, startFrame + 15, endFrame - 15, endFrame], [0, 1, 1, 0]);

// OK: パッと表示
if (frame < startFrame || frame > endFrame) return null;
// opacityのinterpolateは一切使わない
```

### 全画面画像の固定位置（縦動画）

| プロパティ | 固定値 |
|-----------|--------|
| top | 0 |
| left | 0 |
| width | 1080 |
| height | 1920 |
| zIndex | 5 |

- `objectFit: "cover"` 必須
- 表示中は見出しバナーを非表示にする

### AI画像生成のプロンプトルール

- **英語で書く**（英語の方が品質が高い）
- 発話の内容・感情・トーンに合わせる
- **場面照合は厳格に**:「ギリOK」はNG → 明確にマッチしていなければ再生成
- **末尾に必須NG文字列を必ず追加**（コピペ用）:
  ```
  no text, no words, no letters,
  no real people, no celebrities, no public figures,
  no children, no minors, no teenagers,
  no logos, no brand names, no trademarks, no copyrighted characters,
  no violence, no blood, no weapons, no explicit content,
  no medical procedures, no religious symbols, no currency or IDs,
  vertical 9:16 aspect ratio
  ```

### Google生成AI 利用ポリシー遵守（最優先・違反厳禁）

Gemini APIで画像生成する際は、Google の Generative AI Prohibited Use Policy に従うこと。違反すると **APIキー無効化・Googleアカウント停止** につながる。

**プロンプトに絶対含めないNG語:**
- 実在の人物名・有名人名・公人名（フェデラー / マスク / Trump 等）
- 未成年（child / kid / student / minor / teenager / school）→ 人物を出すなら必ず `adult` 明示
- ブランド名・商標（Nike / Apple / Disney / YONEX 等）→ `unbranded` を使う
- 著作権キャラ（Pikachu / Mario / アニメキャラ）
- 暴力・流血・武器（blood / weapon / gun / fight）
- 性的描写・露出（nude / sexy / erotic）
- 医療診断・処方薬のクローズアップ
- 政治家・宗教指導者・宗教シンボル
- 通貨・身分証・パスポートのクローズアップ

**安全な代替フレーズ（顔を出さずに人物を表現）:**
`fictional adult character` / `back view` / `silhouette` / `from distance` / `hands only` / `unbranded clothing` / `no faces visible`

**業種別の違反パターン・代替例・セルフチェックリストは `.claude/skills/step12-images/references/policy-compliance.md` を参照（必読）。**

---

## 複数座布団の固定位置配置ルール（全種類共通・必須）

**複数の座布団（テロップブロック）が順番に表示される場面すべて**に適用する。

`justifyContent: "center"` や `transform: translateY(-50%)` で中央配置すると、ボックスが追加されるたびに全体が上下に動いて視聴者の目障りになる。

**最終状態（全ボックスが出揃った状態）の位置を逆算して、上から固定位置で配置する。**

```typescript
// NG: 動的中央配置
style={{ top: "50%", transform: "translateY(-50%)" }}

// OK: 最終状態から逆算した固定位置
style={{ top: 373 }}  // 固定値
```

---

## Remotion Sequence必須ルール

**コンポジション途中から再生する短い動画（OffthreadVideo）は、必ず `<Sequence from={startFrame}>` でラップする。**

```typescript
// NG: Sequenceなし（静止画になる）
{frame >= 14850 && frame <= 14994 && (
  <OffthreadVideo src={staticFile("videos/overlays/sample.mp4")} />
)}

// OK: Sequenceでラップ（正常に再生される）
<Sequence from={14850} durationInFrames={145} layout="none">
  <OffthreadVideo src={staticFile("videos/overlays/sample.mp4")} />
</Sequence>
```

---

## 既存素材の微調整ルール

1. **全体検索ではなく、現在位置の前後数秒以内を参照する**
2. 既存コンポーネントのstartFrame/endFrameを確認
3. そのフレーム付近（±数秒＝±90フレーム程度）のtranscript_words.jsonを読む
4. 該当する発話のタイミングを特定して調整

---

## 視聴維持率向上ルール（ショート動画版）

- **目標**: 冒頭3秒で離脱を止め、最後まで見せる
- **ルール**: 1秒に1度、以下のいずれかで動きをつける（横動画より高頻度）
  - イメージ画像の切り替え
  - SE（効果音）の追加
  - テロップの切り替え
  - ズーム・パン動作
- **理由**: ショート動画は冒頭3秒で離脱判定される。スワイプされる前に視覚情報を詰め込む

### 冒頭3秒の必須要素
- 一発で内容が伝わる強いキーフレーズ（テロップ大）
- 動きのある映像（静止カットNG）
- 「結論を最初に言う」構成
