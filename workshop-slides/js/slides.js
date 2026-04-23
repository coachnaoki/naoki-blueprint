// ================================================
// naoki-blueprint Workshop Slides (Dark × Premium)
// For existing users of naoki-blueprint
// ================================================

const T = 21;

function ph(num, tag) {
  return `<div class="page-header">
    <span class="chapter">${tag}</span>
    <span class="num">${String(num).padStart(2, '0')} / ${String(T).padStart(2, '0')}</span>
  </div>`;
}

// 01. 表紙
function slide01Cover() {
  return `<section class="slide hero-slide anim-blur-in" data-section="cover" data-anim-fixed
    data-notes="みなさん、おはようございます。今日はnaoki-blueprintを使いこなすためのセミナーです。手を動かしながら完成度の高い動画を1本作り切るコツをお伝えします。">
    <div class="hero">
      <div class="hero-tag">AI × Video Editing / Naoki's Blueprint</div>
      <h1 class="hero-title">naoki-blueprint を、<br/><span class="em">使いこなす。</span></h1>
      <div class="hero-rule"></div>
      <p class="hero-subtitle">環境構築は完了済み、ライセンス発行済みの方向け。<br/>今日は "編集のコツ" と "完成度を上げる型" を伝えます。</p>
      <div class="hero-meta">Naoki  /  Claude Code × Remotion</div>
      <div class="big-index">01</div>
    </div>
  </section>`;
}

// 02. AI が自動でやってくれる機能一覧
function slide02Features() {
  return `<section class="slide" data-section="intro"
    data-notes="このテンプレートがやってくれることは6つ。無音カット、文字起こし、テロップ配置、BGMとSE、レンダリング、そしてラウドネス正規化。word-boundary snapで発話末尾の切れ防止、loudnormでYouTube標準音量に自動で揃えてくれます。">
    ${ph(2, 'What it does')}
    <div class="slide-content">
      <h2>AI がやってくれる<span class="g-primary">6つのこと</span></h2>
      <div class="grid-3">
        <div class="feature-tile"><div class="tile-num">01</div><div class="tile-title">無音カット</div><div class="tile-body">FFmpeg で沈黙区間と言い直しを一発削除<br/>word-boundary snap 92%精度</div></div>
        <div class="feature-tile"><div class="tile-num">02</div><div class="tile-title">文字起こし</div><div class="tile-body">Whisper large-v3 で word-level の精度</div></div>
        <div class="feature-tile"><div class="tile-num">03</div><div class="tile-title">テロップ自動配置</div><div class="tile-body">8種のデザインから AI が自動判定<br/>句読点削除・半角｢｣・2行対応</div></div>
        <div class="feature-tile"><div class="tile-num">04</div><div class="tile-title">SE & BGM</div><div class="tile-body">発言内容に合わせてランダム配置・フェード付き</div></div>
        <div class="feature-tile"><div class="tile-num">05</div><div class="tile-title">レンダリング</div><div class="tile-body">Remotion で MP4 を自動書き出し</div></div>
        <div class="feature-tile" style="border-color:rgba(236,72,153,0.4)"><div class="tile-num" style="background:var(--grad-warm);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">06</div><div class="tile-title">ラウドネス正規化</div><div class="tile-body">YouTube/TikTok/X 共通基準<br/><span class="hl">-14 LUFS</span> に自動調整</div></div>
      </div>
    </div>
  </section>`;
}

// 03. 動画タイプ選択 + プロジェクト作成
function slide03TypeProject() {
  return `<section class="slide" data-section="start"
    data-notes="プロジェクト作成は新規作成.shスクリプト1コマンドで自動化されています。実行するとプロジェクト名と動画タイプを聞かれるので答えるだけ。フォルダ作成・npm installまで自動です。v1.5.5以降はstep実行時に24時間毎に自動更新が走るので、新規作成前に特別な操作は不要になりました。">
    ${ph(3, 'Create project')}
    <div class="slide-content">
      <h2>動画タイプを選んで<span class="g-primary">プロジェクト作成</span></h2>
      <p class="lead mb-24">naoki-blueprint フォルダで 1コマンド実行:</p>
      <div class="code">bash 新規作成.sh</div>
      <p class="mt-24">起動すると順番に2つ聞かれます:</p>
      <ol class="ordered" style="margin-top:12px;margin-bottom:24px">
        <li><span class="bold text-white">プロジェクト名</span>（例: <code>2026-04-23</code> など日付でOK）</li>
        <li><span class="bold text-white">動画タイプ</span>（1 or 2 を入力）</li>
      </ol>
      <div class="grid-2">
        <div class="card card--accent">
          <div class="pill pill--primary mb-16">1. YouTube 横動画</div>
          <div class="card-body">1920×1080<br/>20ステップ / スライド・ワイプ・OP・ハイライト対応</div>
        </div>
        <div class="card card--hot">
          <div class="pill pill--hot mb-16">2. ショート動画</div>
          <div class="card-body">1080×1920<br/>14ステップ / テロップ8種に絞り情報密度を優先</div>
        </div>
      </div>
      <p class="mt-32"><span class="pill pill--warm">v1.5.5〜</span>　本体の更新は <span class="hl">step実行時に24時間毎</span>に自動でチェック。<code>アップデート.sh</code>の手動実行は不要</p>
    </div>
  </section>`;
}

// 04. 素材の配置
function slide04Assets() {
  return `<section class="slide" data-section="start"
    data-notes="プロジェクトフォルダの中の public フォルダに、素材をドラッグアンドドロップで入れます。動画系は videos の下、画像系は images の下。必須はメイン動画、BGM、SE の3つです。">
    ${ph(4, 'Project start')}
    <div class="slide-content">
      <h2>素材を <code>public/</code> に配置</h2>
      <div class="code mt-16">
public/
├── videos/             <span class="cmt">動画素材</span>
│   ├── main/           <span class="cmt">本編動画 </span><span class="str">★必須</span>
│   ├── inserts/        <span class="cmt">物理挿入動画（任意）</span>
│   ├── overlays/       <span class="cmt">オーバーレイ動画（任意）</span>
│   ├── opening/        <span class="cmt">OP動画（横動画のみ・任意）</span>
│   └── highlight/      <span class="cmt">ハイライト動画（自動生成・横動画のみ）</span>
├── images/             <span class="cmt">画像素材</span>
│   ├── inserts/        <span class="cmt">横に表示する画像 720×405（任意）</span>
│   └── overlays/       <span class="cmt">全画面表示画像・アニメーション付き（任意）</span>
├── bgm/                <span class="cmt">BGM（MP3） </span><span class="str">★必須</span>
├── se/                 <span class="cmt">SE効果音 </span><span class="str">★必須</span>
│   ├── 強調/
│   ├── ポジティブ/
│   └── ネガティブ/
├── script/             <span class="cmt">ナレーション台本（推奨）</span>
└── output/             <span class="cmt">完成動画の出力先</span></div>
    </div>
  </section>`;
}

// 05. 作業開始
function slide05Start() {
  return `<section class="slide" data-section="start"
    data-notes="プロジェクトフォルダに入ってからClaude Codeを起動するのがポイント。naoki-blueprintフォルダで先にClaude Codeを立ち上げるとカレントディレクトリがズレてスラッシュコマンドが動かなくなるので、必ずこの順番で。あとはAIが次のコマンドを案内してくれます。">
    ${ph(5, 'Start work')}
    <div class="slide-content">
      <h2>作業<span class="g-primary">スタート。</span></h2>
      <p class="lead mb-16">プロジェクトフォルダに <span class="hl">入ってから</span> Claude Code を起動するのがポイント。</p>
      <div class="code">cd projects/<span class="hi">2026-04-19</span>
claude --dangerously-skip-permissions
/step01-context</div>
      <div class="card card--hot mt-32">
        <div class="card-title">⚠ 順番を間違えると…</div>
        <div class="card-body">naoki-blueprint フォルダで先に Claude Code を立ち上げると <span class="bold text-white">cwd がズレて</span> <code>/step01-context</code> が見つからない。必ず <code>cd projects/XXX</code> してから <code>claude</code> を起動</div>
      </div>
      <div class="card card--accent mt-32">
        <div class="card-title">中断しても大丈夫</div>
        <div class="card-body"><code>/catchup</code> で現在の進捗を確認、どのステップから再開するか AI が教えてくれる</div>
      </div>
    </div>
  </section>`;
}

// 06. 横動画ワークフロー
function slide06WorkflowLong() {
  return `<section class="slide" data-section="workflow"
    data-notes="横動画版は全20ステップ。4つのフェーズに分かれています。全部通しても3時間程度で1本完成します。">
    ${ph(6, 'Workflow / Long')}
    <div class="slide-content">
      <h2 style="margin-bottom:32px">横動画ワークフロー<span class="g-primary"> 20</span><span style="color:var(--ink-600);font-size:48px">　steps</span></h2>
      <div class="grid-3" style="gap:48px">
        <div class="phase-row">
          <div class="phase-title">Phase 1 / 素材準備</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">目的整理</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">素材確認</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">文字起こし</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">台本照合</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">無音+言い直し一括カット</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">カット後の再文字起こし</div>
          <div class="phase-title mt-24">Phase 2 / 動画構築</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">テンプレ設定</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">テロップ作成</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">コンポジション統合</div>
        </div>
        <div class="phase-row">
          <div class="phase-title">Phase 3 / 素材挿入</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">グリーンバック置換</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">デモ動画挿入</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">スライド生成</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">スライドキャプチャ</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">ワイプ位置調整</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">AI画像挿入</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">箇条書き・CTA</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">エンド画面</div>
        </div>
        <div class="phase-row">
          <div class="phase-title">Phase 4 / BGM・出力</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">BGM挿入</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">OP連結</div>
          <div class="step-item" style="font-size:24px;padding:9px 0">ハイライト抽出 + 完成</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 07. 縦動画ワークフロー
function slide07WorkflowShort() {
  return `<section class="slide" data-section="workflow"
    data-notes="ショート動画版は14ステップ。縦動画は情報密度が詰まりすぎるので、スライドもワイプも削っています。1本60秒の動画を1時間で作れます。">
    ${ph(7, 'Workflow / Shorts')}
    <div class="slide-content">
      <h2>ショート動画ワークフロー<span class="g-warm"> 14</span><span style="color:var(--ink-600);font-size:48px">　steps</span></h2>
      <div class="grid-2" style="gap:64px">
        <div class="phase-row">
          <div class="phase-title">Phase 1 / 素材準備</div>
          <div class="step-item">縦動画指定</div>
          <div class="step-item">素材確認</div>
          <div class="step-item">文字起こし</div>
          <div class="step-item">台本照合</div>
          <div class="step-item">無音+言い直し一括カット</div>
          <div class="step-item">カット後の再文字起こし</div>
          <div class="phase-title mt-32">Phase 2 / 動画構築</div>
          <div class="step-item">テンプレ設定（8種）</div>
          <div class="step-item">テロップ作成</div>
          <div class="step-item">1080×1920 コンポジション</div>
        </div>
        <div class="phase-row">
          <div class="phase-title">Phase 3 / 素材挿入</div>
          <div class="step-item">グリーンバック置換</div>
          <div class="step-item">デモ動画挿入</div>
          <div class="step-item">AI画像挿入</div>
          <div class="phase-title mt-32">Phase 4 / BGM・出力</div>
          <div class="step-item">BGM挿入</div>
          <div class="step-item">1080×1920 レンダリング</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 08. Phase 1
function slide08Phase1() {
  return `<section class="slide" data-section="workflow"
    data-notes="フェーズ1は素材準備。文字起こしから無音カットまでです。v1.3.0でword-boundary snapが導入されて、発話末尾が切れる問題がほぼ解消されました。ここで元動画の尺が40分くらいに縮みます。">
    ${ph(8, 'Phase 1')}
    <div class="slide-content">
      <h2>Phase 1　<span class="g-primary">素材準備</span>　step01〜06</h2>
      <div class="grid-2">
        <div class="card card--accent">
          <div class="card-title">step01〜02　準備</div>
          <div class="card-body">動画の目的・ターゲット確認。素材が揃っているか検証</div>
        </div>
        <div class="card card--accent">
          <div class="card-title">step03　文字起こし</div>
          <div class="card-body">Whisper <span class="text-cyan bold">large-v3</span> で word-level の精度。Mac / Windows 自動切替</div>
        </div>
        <div class="card card--accent">
          <div class="card-title">step04　台本照合</div>
          <div class="card-body">台本と照合して誤変換を修正。固有名詞・数字を重点チェック</div>
        </div>
        <div class="card card--accent">
          <div class="card-title">step05〜06　一括カット</div>
          <div class="card-body">無音 + 言い直しを FFmpeg 一発エンコード。<span class="hl">word-boundary snap 92%精度</span>で発話末尾プツッを防止</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 09. 🆕 編集のコツ① カット後確認
function slideTip1CutReview() {
  return `<section class="slide" data-section="workflow"
    data-notes="カット後は必ずcut.mp4を開いて目視確認してください。word-boundary snapで92%精度ですが、残り8%は人の耳が勝負。発話末尾がプツッと切れていないか、不自然な間が残っていないかを確認し、気になる箇所はtranscript_fixed.jsonを直接編集してstep05を再実行するだけです。">
    ${ph(9, 'Edit tip / Cut review')}
    <div class="slide-content">
      <div class="tag" style="color:#fbbf24">💡 編集のコツ ①</div>
      <h2 class="mt-16">カット後、必ず<span class="g-primary">目で確認する</span></h2>
      <div class="grid-2 mt-32">
        <div class="card card--accent">
          <div class="card-title">✅ やること</div>
          <div class="card-body">
            <span class="text-cyan bold">・</span> <code>/step06</code> 完了後、<code>cut.mp4</code> を開く<br/>
            <span class="text-cyan bold">・</span> 発話末尾がプツッと切れていないか<br/>
            <span class="text-cyan bold">・</span> 不自然な間が残っていないか<br/>
            <span class="text-cyan bold">・</span> 話の繋がりが途切れていないか
          </div>
        </div>
        <div class="card card--hot">
          <div class="card-title">⚠ 気になった時の直し方</div>
          <div class="card-body">
            <span class="text-pink bold">・</span> <code>transcript_fixed.json</code> を直接編集<br/>
            <span class="text-pink bold">・</span> <code>/step05</code> を再実行<br/>
            <span class="text-pink bold">・</span> 迷ったら必ず戻って直す<br/>
            <span class="text-pink bold">・</span> ここの手間が完成度を分ける
          </div>
        </div>
      </div>
      <p class="lead mt-48"><span class="hl">word-boundary snap</span> で92%は自動snap。残り8%は人の耳が勝負。</p>
    </div>
  </section>`;
}

// 10. Phase 2
function slide10Phase2() {
  return `<section class="slide" data-section="workflow"
    data-notes="フェーズ2は動画の骨格を作ります。テンプレート設定でフォントや色を決めて、テロップデータを作成、最後にコンポジションで組み上げます。ここでRemotion Studioが起動して、ブラウザで完成形のプレビューができます。">
    ${ph(10, 'Phase 2')}
    <div class="slide-content">
      <h2>Phase 2　<span class="g-primary">動画構築</span>　step07〜09</h2>
      <div class="grid-3">
        <div class="card">
          <div class="card-title">step07　テンプレ</div>
          <div class="card-body">フォント・サイズ・色・SE を <code>templateConfig.ts</code> に定義</div>
        </div>
        <div class="card">
          <div class="card-title">step08　テロップ</div>
          <div class="card-body">transcript から<span class="bold text-white">一字一句</span>テロップ化。AI が自動でスタイル判定</div>
        </div>
        <div class="card">
          <div class="card-title">step09　統合</div>
          <div class="card-body">MainComposition.tsx で動画 + テロップ + SE を統合。Studio 起動</div>
        </div>
      </div>
      <div class="card card--hot mt-48">
        <div class="card-title">Remotion Studio がブラウザで開く</div>
        <div class="card-body"><code>localhost:3000</code> で完成形をリアルタイムプレビュー。以降のステップでも開きっぱなしで使います</div>
      </div>
    </div>
  </section>`;
}

// 11. 🆕 編集のコツ② テンプレ確認
function slideTip2TemplateCheck() {
  return `<section class="slide" data-section="workflow"
    data-notes="step09でRemotion Studioが起動したら、localhost:3000をブラウザで開いてテロップ・スライド・ワイプを1枚ずつ確認してください。違和感があればtemplateConfig.tsを編集すれば即ブラウザに反映されます。目視で直すのが最速ルートです。">
    ${ph(11, 'Edit tip / Template')}
    <div class="slide-content">
      <div class="tag" style="color:#fbbf24">💡 編集のコツ ②</div>
      <h2 class="mt-16">Studio で<span class="g-primary">1枚ずつ目視調整</span></h2>
      <div class="card card--accent mt-32">
        <div class="card-title">Remotion Studio の使い方</div>
        <div class="card-body">
          <code>/step09</code> 実行で <code>localhost:3000</code> が起動<br/>
          左サイドバーから <span class="bold text-white">テロップ・スライド・ワイプ</span> を個別プレビュー可能
        </div>
      </div>
      <h3 class="mt-32" style="color:var(--white);font-size:28px">よくある修正ポイント</h3>
      <div class="grid-3 mt-16">
        <div class="card">
          <div class="card-title">テロップ</div>
          <div class="card-body">画面端で切れる / 改行位置が汚い → <code>templateConfig.ts</code> で max-width・余白を調整</div>
        </div>
        <div class="card">
          <div class="card-title">ワイプ位置</div>
          <div class="card-body">顔に被る / はみ出す → ピクセル座標で px 指定</div>
        </div>
        <div class="card">
          <div class="card-title">スライド背景</div>
          <div class="card-body">動画と色がぶつかる → 背景色・透明度を調整</div>
        </div>
      </div>
      <p class="mt-32"><span class="pill pill--primary">ポイント</span>　ブラウザで見ながら直すのが<span class="hl">最速ルート</span></p>
    </div>
  </section>`;
}

// 12. Phase 3
function slide12Phase3() {
  return `<section class="slide" data-section="workflow"
    data-notes="フェーズ3は素材挿入。任意のステップが多いので、必要な演出だけ使ってください。v1.3.0でstep15の画像挿入が3フェーズ構造になり、インサート画像・オーバーレイ画像・顔アイコンが明確に分離されました。">
    ${ph(12, 'Phase 3')}
    <div class="slide-content">
      <h2>Phase 3　<span class="g-primary">素材挿入</span>　任意</h2>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">step10　グリーンバック</div>
          <div class="card-body">クロマキー + rembg + despill の3段パイプライン。素人撮影でも背景を綺麗に置換</div>
        </div>
        <div class="card">
          <div class="card-title">step11　デモ動画挿入</div>
          <div class="card-body">物理挿入（Series分割）とオーバーレイ（上に重ね）の2方式</div>
        </div>
        <div class="card">
          <div class="card-title">step12　画像挿入（3フェーズ構造）</div>
          <div class="card-body"><span class="text-cyan bold">インサート画像 / オーバーレイ画像 / 顔アイコン</span> で明確分離</div>
        </div>
        <div class="card card--warm">
          <div class="card-title">横動画の追加</div>
          <div class="card-body">step12-17　スライド生成・キャプチャ・ワイプ・特殊要素・エンド画面</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 13. 🆕 編集のコツ③ AI画像生成の規約
function slideTip3ImagePolicy() {
  return `<section class="slide" data-section="workflow"
    data-notes="Geminiの画像生成にはGoogleのGenerative AI Prohibited Use Policyがあります。実在人物・児童・性的・暴力・なりすましは禁止。naoki-blueprintのstep15-imagesにはNG語リストと代替フレーズが搭載されているので、プロンプトを入れると自動で検出・言い換え提案されます。">
    ${ph(13, 'Edit tip / Image policy')}
    <div class="slide-content">
      <div class="tag" style="color:#fbbf24">💡 編集のコツ ③</div>
      <h2 class="mt-16">AI画像は <span class="g-warm">Google規約</span> <span class="g-primary">遵守が必須</span></h2>
      <div class="grid-2 mt-32" style="gap:32px">
        <div class="card card--hot">
          <div class="card-title">🚫 絶対NG（Google Policy）</div>
          <div class="card-body">
            <span class="text-pink bold">・</span> 実在の人物（芸能人・政治家・有名人）<br/>
            <span class="text-pink bold">・</span> 児童・性的・暴力コンテンツ<br/>
            <span class="text-pink bold">・</span> 医療・法律アドバイスの装い<br/>
            <span class="text-pink bold">・</span> なりすまし・誤情報
          </div>
        </div>
        <div class="card card--accent">
          <div class="card-title">📝 言い換え例</div>
          <div class="card-body">
            <span class="text-pink bold">×</span> 「ジョコビッチが構えている」<br/>
            <span class="text-cyan bold">○</span> 「プロテニス選手のシルエット」<br/>
            <br/>
            <span class="text-pink bold">×</span> 「経営者が契約書にサイン」<br/>
            <span class="text-cyan bold">○</span> 「ビジネスパーソンが書類に記入」
          </div>
        </div>
      </div>
      <div class="card card--warm mt-32">
        <div class="card-title">✅ naoki-blueprint の自動ガード</div>
        <div class="card-body"><code>step15-images</code> に NG語リスト・代替フレーズ・業種別違反パターン搭載済。プロンプトを入れると <span class="hl">AI が自動検出・言い換え提案</span></div>
      </div>
    </div>
  </section>`;
}

// 14. Phase 4
function slide14Phase4() {
  return `<section class="slide" data-section="workflow"
    data-notes="最後のフェーズ。BGMを入れて、OP連結して、ハイライトを自動抽出、そしてv1.3.0で追加されたラウドネス正規化でYouTube基準に揃えて完成です。">
    ${ph(14, 'Phase 4')}
    <div class="slide-content">
      <h2>Phase 4　<span class="g-primary">BGM・出力</span></h2>
      <div class="grid-2">
        <div class="card card--accent">
          <div class="card-title">BGM 挿入</div>
          <div class="card-body">フェードイン / アウト付き<br/>区間・音量はユーザー指定可<br/>足りない場合はループ再生</div>
        </div>
        <div class="card card--hot">
          <div class="card-title">最終レンダリング</div>
          <div class="card-body">Remotion で MP4 書き出し<br/>横動画: 1920×1080 / FPS自動検出<br/>ショート: 1080×1920 / FPS自動検出</div>
        </div>
      </div>
      <div class="card card--warm mt-32">
        <div class="card-title">🔊 ラウドネス正規化</div>
        <div class="card-body"><span class="hl">-14 LUFS / -1 dBTP / LRA 11</span>　YouTube/TikTok/X 共通基準に自動で揃える。二段階loudnormで声・SE・BGMのバランスは崩さない</div>
      </div>
      <p class="lead mt-32">完成動画は <code>public/output/</code> に出力されます</p>
    </div>
  </section>`;
}

// 15. テロップ8種
function slide15Telop() {
  return `<section class="slide" data-section="rules"
    data-notes="テロップは全部で8種類。発言の内容や感情に応じて、AIが自動で判定してくれます。v1.4.0からは句読点の自動削除・半角｢｣引用符・emphasisWord 複数単語対応・ショート動画の2行対応が入りました。">
    ${ph(15, 'Telop / 8 styles')}
    <div class="slide-content">
      <h2>テロップ<span class="g-primary">8デザイン</span></h2>
      <table>
        <thead><tr><th style="width:18%">テンプレ</th><th style="width:30%">用途</th><th style="width:28%">見た目</th><th>SEフォルダ</th></tr></thead>
        <tbody>
          <tr><td class="bold text-white">normal</td><td>通常の字幕</td><td>紺文字 + 白フチ（丸ゴ）</td><td class="text-ink-700">なし</td></tr>
          <tr><td class="bold text-white">normal_emphasis</td><td>1語だけ赤で強調</td><td>紺+赤 + 白フチ</td><td>se/強調</td></tr>
          <tr><td class="bold text-gold">emphasis</td><td>ポジティブ強調（概念）</td><td>赤グラデ + 金フチ + グロー</td><td>se/ポジティブ</td></tr>
          <tr><td class="bold text-gold">emphasis2</td><td>数字+単位の強調</td><td>金グラデ + ダークゴールド縁</td><td>se/ポジティブ</td></tr>
          <tr><td class="bold text-white">section</td><td>セクション見出し</td><td>赤文字 + 白フチ（大サイズ）</td><td>se/強調</td></tr>
          <tr><td class="bold text-pink">negative</td><td>警告・失敗</td><td>白文字 + 黒グロー（明朝）</td><td>se/ネガティブ</td></tr>
          <tr><td class="bold text-pink">negative2</td><td>絶望・衝撃</td><td>白文字 + 黒縁 + グレースケール</td><td>se/ネガティブ</td></tr>
          <tr><td class="bold text-white">third_party</td><td>他者の発言・視聴者の声</td><td>白文字 + グレーフチ + <span class="hl">｢｣</span></td><td>se/強調</td></tr>
        </tbody>
      </table>
      <div class="card card--warm mt-32">
        <div class="card-title">📝 v1.4.0 テロップ運用ルール</div>
        <div class="card-body">
          <span class="text-cyan bold">・</span> <span class="bold text-white">句読点削除</span>: <code>、</code> <code>。</code> は自動削除（<code>?</code> <code>!</code> は残す）<br/>
          <span class="text-cyan bold">・</span> <span class="bold text-white">引用符は半角</span> <code>｢｣</code>: 全角「」はセンタリングがズレるため統一<br/>
          <span class="text-cyan bold">・</span> <span class="bold text-white">emphasisWord は配列可</span>: <code>['前衛','後衛']</code> のように対句・複数強調に対応<br/>
          <span class="text-cyan bold">・</span> <span class="bold text-white">ショート動画は2行可</span>: <code>\\n</code> で改行。主語述語が散る時・対句が分断される時に使用
        </div>
      </div>
    </div>
  </section>`;
}

// 16. SE配置ルール
function slide16SE() {
  return `<section class="slide" data-section="rules"
    data-notes="SEは3つのフォルダに分けて管理します。テロップのテンプレに応じて、フォルダの中からランダムに選ばれます。v1.3.0でSE音量が0.06に調整されて、BGMとのバランスがより自然になりました。">
    ${ph(16, 'SE rules')}
    <div class="slide-content">
      <h2>SE 配置ルール</h2>
      <div class="grid-3">
        <div class="card">
          <div class="pill pill--primary mb-16">se/強調</div>
          <div class="card-body">normal_emphasis / section / third_party で使用。決定音・拍子木系</div>
        </div>
        <div class="card">
          <div class="pill pill--warm mb-16">se/ポジティブ</div>
          <div class="card-body">emphasis / emphasis2 で使用。きらーん・シャキーン・和太鼓系</div>
        </div>
        <div class="card">
          <div class="pill pill--hot mb-16">se/ネガティブ</div>
          <div class="card-body">negative / negative2 で使用。チーン・ポカン・間抜け系</div>
        </div>
      </div>
      <div class="card card--accent mt-48">
        <div class="card-title">AI の選択ロジック</div>
        <div class="card-body">
          <span class="text-cyan bold">・</span> startFrame をシードにした疑似乱数で選択（毎回同じ結果）<br/>
          <span class="text-cyan bold">・</span> 直近2回と同じSEは避ける<br/>
          <span class="text-cyan bold">・</span> 連続SE間隔は最低 <span class="hl">50フレーム（2秒）</span><br/>
          <span class="text-cyan bold">・</span> <span class="hl">SE音量 0.06</span>（BGM 0.03との自然バランス）
        </div>
      </div>
    </div>
  </section>`;
}

// 17. 2本目以降
function slide17SecondVideo() {
  return `<section class="slide" data-section="advanced"
    data-notes="2本目以降はもっと簡単です。ライセンス認証はもう終わっているので、新規作成.shでプロジェクトを作って、そのフォルダに入ってClaude Codeを起動するだけ。v1.5.5以降は各step実行時に24時間に1回だけ本体の最新版チェックが裏で自動実行されるので、アップデート.shを手動で叩く必要もありません。">
    ${ph(17, 'For next videos')}
    <div class="slide-content">
      <h2>2本目以降は、<span class="g-primary">3コマンド。</span></h2>
      <p class="lead mb-24">ライセンス認証は初回のみ。<span class="hl">通常のターミナル</span>で以下3行を順に実行:</p>
      <div class="code">
<span class="cmt"># ① naoki-blueprint フォルダでプロジェクト作成</span>
bash 新規作成.sh

<span class="cmt"># ② 作ったプロジェクトフォルダに移動</span>
cd projects/<span class="hi">2026-04-23</span>

<span class="cmt"># ③ そこで Claude Code を起動 → /step01-context</span>
claude --dangerously-skip-permissions</div>
      <div class="card card--accent mt-32">
        <div class="card-title">🔄 完全自動アップデート (v1.5.5〜)</div>
        <div class="card-body">各 <code>/step</code> 実行時に <span class="hl">24時間に1回</span>だけ最新版チェックが裏で走る。差分があれば自動で <code>git reset --hard origin/main</code> → projects同期。<span class="bold text-white"><code>アップデート.sh</code> の手動実行は不要</span>（ネット不調やgit未初期化でも静かにスキップして作業継続）</div>
      </div>
    </div>
  </section>`;
}

// 18. 🆕 Video Use vs naoki-blueprint 比較
function slideComparison() {
  return `<section class="slide" data-section="advanced"
    data-notes="Video Useはbrowser-useチームが先週公開したOSSです。技術的には非常に洗練されていて、loudnormや数学的なカラーグレードなど学ぶ価値はあります。ただし英語前提でBGM・SE・OP・ワイプ・グリーンバックがありません。talking head launch動画用途に特化しているので、日本の教育系YouTuberには機能が足りない。逆にnaoki-blueprintは日本人が教育動画を量産するための固定ワークフローとして設計されています。両者は競合ではなく用途が違う、が正解です。">
    ${ph(18, 'Tool comparison')}
    <div class="slide-content">
      <h2>Video Use <span style="color:var(--ink-600)">vs</span> <span class="g-primary">naoki-blueprint</span></h2>
      <p class="lead mb-24">browser-use チームが公開した OSS 動画編集ツール。<span class="hl">技術的には洗練</span>されているが用途が違う。</p>
      <table>
        <thead><tr><th style="width:26%">項目</th><th style="width:34%">Video Use</th><th>naoki-blueprint</th></tr></thead>
        <tbody>
          <tr><td class="bold text-white">文字起こし</td><td>ElevenLabs（$0.22/h）</td><td><span class="text-cyan bold">mlx/faster-whisper（0円）</span></td></tr>
          <tr><td class="bold text-white">日本語対応</td><td>△ 未検証</td><td><span class="text-cyan bold">✅ ネイティブ</span></td></tr>
          <tr><td class="bold text-white">BGM / SE</td><td>❌</td><td><span class="text-cyan bold">✅ 3カテゴリ</span></td></tr>
          <tr><td class="bold text-white">OP / エンド画面</td><td>❌</td><td><span class="text-cyan bold">✅</span></td></tr>
          <tr><td class="bold text-white">ハイライト自動生成</td><td>❌</td><td><span class="text-cyan bold">✅</span></td></tr>
          <tr><td class="bold text-white">ワイプ / グリーンバック</td><td>❌</td><td><span class="text-cyan bold">✅</span></td></tr>
          <tr><td class="bold text-white">ライセンス配布</td><td>OSSのみ</td><td><span class="text-cyan bold">✅ NK-ID 管理</span></td></tr>
          <tr><td class="bold text-gold">Video Useから学んで取込</td><td>loudnorm / word padding</td><td><span class="hl">取込済（v1.3.0以降）</span></td></tr>
        </tbody>
      </table>
      <div class="card card--accent mt-32">
        <div class="card-title">結論: "競合" ではなく "用途が違う"</div>
        <div class="card-body">
          🌐 英語 talking head → <span class="bold text-white">Video Use</span><br/>
          🇯🇵 日本語 教育動画 → <span class="bold text-white">naoki-blueprint</span>
        </div>
      </div>
    </div>
  </section>`;
}

// 19. Xへ投稿
function slide19Post() {
  return `<section class="slide anim-fade-up" data-section="post"
    data-notes="感想や成果物はぜひXにシェアしてください。QRに投稿本文があらかじめセットされているので、スマホで読み取ればそのまま投稿できます。投稿いただいた内容はこちらで拡散させていただきます。">
    ${ph(19, 'Share on X')}
    <div class="slide-content" style="align-items:center;text-align:center">
      <h2 style="font-size:96px;text-align:center;margin-bottom:24px">今日の成果を<span class="g-warm">投稿しましょう！</span></h2>
      <p class="lead" style="text-align:center;margin-bottom:56px">QRを読むだけで投稿画面が開きます。みんなで盛り上げよう。</p>
      <div class="qr-card" style="padding:32px">
        <div class="qr-box" style="width:400px;height:400px"><img src="assets/qr-post.png" alt="X post QR" /></div>
      </div>
      <p class="mt-48" style="text-align:center;font-size:28px;color:var(--white);font-weight:600">投稿いただいた内容は<span class="hl">こちらで拡散させていただきます</span></p>
    </div>
  </section>`;
}

// 20. サポート窓口
function slide20Support() {
  return `<section class="slide" data-section="closing"
    data-notes="このセミナーが終わったあとも、Chatworkのグループで1ヶ月間サポートします。1ヶ月経過後は個別でご案内します。">
    ${ph(20, 'Support')}
    <div class="slide-content" style="align-items:center;text-align:center">
      <h2 style="text-align:center">サポート窓口</h2>
      <div class="pill pill--primary" style="margin-bottom:40px">Chatwork グループ</div>
      <div style="display:flex;align-items:baseline;gap:24px;justify-content:center">
        <span class="g-primary" style="font-family:var(--font-num);font-size:220px;font-weight:800;letter-spacing:-0.04em;line-height:1">1</span>
        <span style="font-size:64px;font-weight:700;color:var(--white)">ヶ月間</span>
      </div>
      <p class="lead" style="text-align:center;max-width:1200px;margin-top:48px">
        参加者専用の Chatwork グループで、質問・相談いつでもOK。<br/>
        本セミナーから<span class="hl">1ヶ月間</span>は私たちが直接お応えします。
      </p>
      <p style="text-align:center;font-size:24px;color:var(--ink-600);margin-top:32px">1ヶ月経過後は個別にご案内させていただきます</p>
    </div>
  </section>`;
}

// 21. クロージング
function slide21Closing() {
  return `<section class="slide hero-slide anim-fade-up" data-section="closing" data-anim-fixed
    data-notes="最後まで参加いただきありがとうございました。今日学んだことを使って、ぜひ動画制作を習慣にしてください。また次のセミナーでお会いしましょう。">
    <div class="hero">
      <div class="hero-tag">Thank you for joining</div>
      <h1 class="hero-title">動画制作を、<br/><span class="em-warm">習慣に。</span></h1>
      <div class="hero-rule"></div>
      <p class="hero-subtitle">自動化で浮いた時間で、次のコンテンツを作ろう。<br/>また次のセミナーで会いましょう。</p>
      <div class="hero-meta">Naoki  /  AI × Video Editing</div>
      <div class="big-index">21</div>
    </div>
  </section>`;
}

// === Register ===
window.slideFactories = [
  slide01Cover,
  slide02Features,
  slide03TypeProject,
  slide04Assets,
  slide05Start,
  slide06WorkflowLong,
  slide07WorkflowShort,
  slide08Phase1,
  slideTip1CutReview,
  slide10Phase2,
  slideTip2TemplateCheck,
  slide12Phase3,
  slideTip3ImagePolicy,
  slide14Phase4,
  slide15Telop,
  slide16SE,
  slide17SecondVideo,
  slideComparison,
  slide19Post,
  slide20Support,
  slide21Closing
];

window.agendaItems = [
  { id: 'cover', label: '表紙' },
  { id: 'features', label: '6つの自動化機能' },
  { id: 'type-project', label: '動画タイプ+プロジェクト作成' },
  { id: 'assets', label: '素材の配置' },
  { id: 'start', label: '作業スタート' },
  { id: 'workflow-long', label: '横動画ワークフロー' },
  { id: 'workflow-short', label: '縦動画ワークフロー' },
  { id: 'phase1', label: 'Phase 1 / 素材準備' },
  { id: 'tip-cut', label: '💡 編集のコツ① カット後確認' },
  { id: 'phase2', label: 'Phase 2 / 動画構築' },
  { id: 'tip-template', label: '💡 編集のコツ② テンプレ確認' },
  { id: 'phase3', label: 'Phase 3 / 素材挿入' },
  { id: 'tip-image', label: '💡 編集のコツ③ AI画像の規約' },
  { id: 'phase4', label: 'Phase 4 / BGM・出力' },
  { id: 'telop', label: 'テロップ 8種' },
  { id: 'se', label: 'SE 配置ルール' },
  { id: 'second', label: '2本目以降' },
  { id: 'comparison', label: '⚖️ Video Use 比較' },
  { id: 'post', label: '🎯 X へ投稿' },
  { id: 'support', label: 'サポート窓口' },
  { id: 'closing', label: 'クロージング' }
];
