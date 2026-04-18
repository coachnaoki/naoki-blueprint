// ================================================
// naoki-blueprint Workshop Slides (Dark × Premium)
// For executives & video creators
// ================================================

const T = 26;

function ph(num, tag) {
  return `<div class="page-header">
    <span class="chapter">${tag}</span>
    <span class="num">${String(num).padStart(2, '0')} / ${String(T).padStart(2, '0')}</span>
  </div>`;
}

// 01. 表紙（ドラマチックhero）
function slide01Cover() {
  return `<section class="slide hero-slide anim-blur-in" data-section="cover" data-anim-fixed
    data-notes="みなさん、おはようございます。今日から2日間の作業会、よろしくお願いします。手を動かしながら動画を1本完成させるまでやります。">
    <div class="hero">
      <div class="hero-tag">AI × Video Editing / Naoki's Blueprint</div>
      <h1 class="hero-title">動画編集を、<br/><span class="em">AI に丸投げ。</span></h1>
      <div class="hero-rule"></div>
      <p class="hero-subtitle">10時間の編集を、2時間で。<br/>外注費3万円を、ほぼゼロに。<br/>2日間ワークショップへようこそ。</p>
      <div class="hero-meta">Naoki  /  Claude Code × Remotion  /  2 Days Workshop</div>
      <div class="big-index">01</div>
    </div>
  </section>`;
}

// 02. Before/After の数字見せ
function slide02Numbers() {
  return `<section class="slide" data-section="intro"
    data-notes="従来の編集と比べて、何がどう変わるか。時間・コスト・精度、すべてが桁違いに変わります。">
    ${ph(2, 'Why this matters')}
    <div class="slide-content">
      <div class="tag">Before  →  After</div>
      <h2 class="mt-16">編集の<span class="g-primary">概念</span>が変わる。</h2>
      <div class="ba-wrap">
        <div class="ba-box">
          <div class="ba-label">Before</div>
          <div class="ba-num">10<span style="font-size:64px;vertical-align:top;margin-left:8px;color:var(--ink-500)">h</span></div>
          <div class="ba-desc">1本あたりの編集時間</div>
        </div>
        <div class="ba-arrow">→</div>
        <div class="ba-box" style="border-color:rgba(59,130,246,0.4)">
          <div class="ba-label" style="color:var(--blue-light)">After</div>
          <div class="ba-num ba-num--hot">2<span style="font-size:64px;vertical-align:top;margin-left:8px;color:var(--ink-500)">h</span></div>
          <div class="ba-desc">同じクオリティが<span class="hl">2時間で完成</span></div>
        </div>
      </div>
      <p class="mt-48"><span class="text-white bold" style="font-size:32px">外注費 ¥30,000 → ほぼ ¥0</span>　<span class="text-ink-700">電気代のみ</span></p>
    </div>
  </section>`;
}

// 03. 何ができるか
function slide03Features() {
  return `<section class="slide" data-section="intro"
    data-notes="このテンプレートがやってくれることは5つ。無音カット、文字起こし、テロップ配置、BGMとSE、そしてレンダリング。すべてスラッシュコマンドで回せます。">
    ${ph(3, 'What it does')}
    <div class="slide-content">
      <h2>AI がやってくれる<span class="g-primary">5つのこと</span></h2>
      <div class="grid-3">
        <div class="feature-tile"><div class="tile-num">01</div><div class="tile-title">無音カット</div><div class="tile-body">FFmpeg で沈黙区間と言い直しを一発で削除</div></div>
        <div class="feature-tile"><div class="tile-num">02</div><div class="tile-title">文字起こし</div><div class="tile-body">Whisper large-v3 で word-level の精度</div></div>
        <div class="feature-tile"><div class="tile-num">03</div><div class="tile-title">テロップ自動配置</div><div class="tile-body">8種のデザインから AI が自動判定</div></div>
        <div class="feature-tile"><div class="tile-num">04</div><div class="tile-title">SE & BGM</div><div class="tile-body">発言内容に合わせてランダム配置・フェード付き</div></div>
        <div class="feature-tile"><div class="tile-num">05</div><div class="tile-title">レンダリング</div><div class="tile-body">Remotion で MP4 を自動書き出し</div></div>
        <div class="feature-tile" style="border-color:rgba(236,72,153,0.4)"><div class="tile-num" style="background:var(--grad-warm);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">+α</div><div class="tile-title">AI 画像挿入</div><div class="tile-body">Gemini で感情ピークに自動で画像を生成</div></div>
      </div>
    </div>
  </section>`;
}

// 04. Mac セットアップ
function slide04MacSetup() {
  return `<section class="slide" data-section="setup"
    data-notes="Mac の方はこのコマンドを順に貼り付けてください。Homebrew を使います。Apple Silicon なら mlx-whisper が爆速で動きます。">
    ${ph(4, 'Setup / macOS')}
    <div class="slide-content">
      <h2>Mac セットアップ</h2>
      <div class="code">
<span class="cmt"># 1. Homebrew で3ツールを一括インストール</span>
brew install node python@3.12 ffmpeg

<span class="cmt"># 2. Whisper（Apple Silicon 最適化版）</span>
pip3.12 install mlx-whisper

<span class="cmt"># 3. OpenCV（話者アイコン・顔検出で使用）</span>
pip3.12 install opencv-python</div>
      <p class="mt-32"><span class="pill pill--hot">注意</span>　<code>python@3.12</code> 限定。3.14 では mlx-whisper が動きません。</p>
    </div>
  </section>`;
}

// 05. Windows セットアップ
function slide05WinSetup() {
  return `<section class="slide" data-section="setup"
    data-notes="Windowsの方はCursorを使ってインストールします。Pythonインストール時は必ず Add Python to PATH にチェックを入れてください。">
    ${ph(5, 'Setup / Windows')}
    <div class="slide-content">
      <h2>Windows セットアップ</h2>
      <p class="lead mb-24">Cursor のターミナルから順番に実行します。</p>
      <div class="code">
<span class="cmt"># 事前準備（ブラウザ経由）</span>
<span class="cmt"># Node.js   → nodejs.org から最新LTSをインストール</span>
<span class="cmt"># Python    → python.org から3.12（「Add Python to PATH」必須）</span>
<span class="cmt"># FFmpeg    → gyan.dev/ffmpeg からDLしてPATHに追加</span>

<span class="cmt"># Cursor のターミナルで実行</span>
pip install faster-whisper
pip install opencv-python</div>
      <p class="mt-32"><span class="hl">Windows は faster-whisper</span>　精度は mlx-whisper と同等です。</p>
    </div>
  </section>`;
}

// 06. テンプレートの受け取り方（自動発行フロー）
function slide06Delivery() {
  return `<section class="slide" data-section="template"
    data-notes="テンプレートはライセンスID制ですが、自動発行になりました。配布されたterms.htmlから同意書を送るだけで即ライセンスIDが発行されます。1台のPCに紐付くため、PC変更時はXのDMで連絡してください。">
    ${ph(6, 'Get the template')}
    <div class="slide-content">
      <h2>テンプレートの<span class="g-primary">受け取り方</span></h2>
      <ol class="ordered">
        <li>配布された <code>terms.html</code> を開く（パスワードは <span class="hl">当日の日付 YYYYMMDD</span>）</li>
        <li>同意書フォームに <span class="bold text-white">氏名 + XアカウントID</span> を入力 → 送信</li>
        <li>その場で <span class="bold text-cyan">activate.html の専用URL</span> が表示される（ブックマーク推奨）</li>
        <li>activate.html を開くと <span class="bold text-white">ライセンスID + インストール手順</span> が表示</li>
      </ol>
      <div class="card card--accent mt-32">
        <div class="card-title">完全自動・1台PC紐付け</div>
        <div class="card-body">手動承認なし、即発行。<span class="text-pink bold">PC変更時は X DM で連絡</span></div>
      </div>
    </div>
  </section>`;
}

// 07. Cursor で Claude Code 起動（新規）
function slide07ClaudeStart() {
  return `<section class="slide" data-section="template"
    data-notes="Cursorのターミナルで、naoki-blueprintを置きたいフォルダに移動してから、Claude Codeを起動します。Mac/Windowsでコマンドが違うので注意してください。既にClaude Codeを起動済みの人は、Ctrl+Cを2回押して終了してから実行してください。">
    ${ph(7, 'Start Claude Code')}
    <div class="slide-content">
      <h2>Cursor で <span class="g-primary">Claude Code 起動</span></h2>
      <p class="lead mb-24">保存先フォルダに移動してから、Claude Code を起動します（例: デスクトップ上の <code>Cursor</code> フォルダ）</p>
      <div class="grid-2">
        <div>
          <div class="pill pill--primary mb-16">macOS</div>
          <div class="code">cd ~/Desktop/Cursor</div>
        </div>
        <div>
          <div class="pill pill--hot mb-16">Windows (PowerShell)</div>
          <div class="code">cd ~\\Desktop\\Cursor</div>
        </div>
      </div>
      <p class="mt-32">そのフォルダで Claude Code を起動（Mac / Windows 共通）:</p>
      <div class="code">claude --dangerously-skip-permissions</div>
      <div class="card card--hot mt-32">
        <div class="card-title">⚠ すでに Claude Code 起動中の方</div>
        <div class="card-body">ターミナルで <strong>Ctrl+C</strong>（Mac は <strong>Control+C</strong>）を <strong>2回押して</strong>終了してから実行してください</div>
      </div>
    </div>
  </section>`;
}

// 08. リポジトリをダウンロード
function slide08Clone() {
  return `<section class="slide" data-section="template"
    data-notes="activate.htmlの手順通りにCursorのターミナルでgit cloneします。Claude Code起動中でもターミナルから実行可能です。">
    ${ph(8, 'Clone repo')}
    <div class="slide-content">
      <h2>リポジトリをダウンロード</h2>
      <div class="code">git clone https://github.com/coachnaoki/naoki-blueprint.git
cd naoki-blueprint</div>
      <p class="lead mt-32">フォルダ構成:</p>
      <div class="code mt-16">
naoki-blueprint/
├── .template/           <span class="cmt">YouTube 横動画テンプレ（20ステップ）</span>
├── .template-shorts/    <span class="cmt">ショート動画テンプレ（14ステップ）</span>
├── aislides/            <span class="cmt">スライド生成システム</span>
├── scripts/             <span class="cmt">ライセンス認証など</span>
├── 新規作成.sh          <span class="cmt">プロジェクト作成スクリプト</span>
└── projects/            <span class="cmt">あなたの動画プロジェクト置き場</span></div>
    </div>
  </section>`;
}

// 09. ライセンス認証
function slide09License() {
  return `<section class="slide" data-section="template"
    data-notes="activate.htmlに表示されているライセンスIDで認証します。成功したら.licenseファイルが生成されて、以降は自動認証です。">
    ${ph(9, 'License')}
    <div class="slide-content">
      <h2>ライセンス認証</h2>
      <p class="lead mb-24">activate.html のライセンスIDを貼り付けて認証:</p>
      <div class="code">cd .template
node scripts/validateLicense.mjs <span class="hi">NK-XXXX-XXXX-XXXX</span>
cd ..</div>
      <div class="grid-2 mt-48">
        <div class="card card--accent">
          <div class="card-title">認証成功時</div>
          <div class="card-body">「✅ 認証済み」と表示、<code>.license</code> が生成。以降は自動認証・1台PCに紐付き</div>
        </div>
        <div class="card card--hot">
          <div class="card-title">エラー時</div>
          <div class="card-body">IDの入力ミス / 別PCで認証済み のいずれか。X DM で権利者に連絡</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 10. 動画タイプ選択 + プロジェクト作成（統合）
function slide10TypeProject() {
  return `<section class="slide" data-section="start"
    data-notes="プロジェクト作成は新規作成.shスクリプト1コマンドで自動化されています。実行するとプロジェクト名と動画タイプを聞かれるので答えるだけ。フォルダ作成・npm installまで自動です。">
    ${ph(10, 'Create project')}
    <div class="slide-content">
      <h2>動画タイプを選んで<span class="g-primary">プロジェクト作成</span></h2>
      <p class="lead mb-24">naoki-blueprint フォルダで 1コマンド実行:</p>
      <div class="code">./新規作成.sh</div>
      <p class="mt-24">起動すると順番に2つ聞かれます:</p>
      <ol class="ordered" style="margin-top:12px;margin-bottom:24px">
        <li><span class="bold text-white">プロジェクト名</span>（例: <code>2026-04-19</code> など日付でOK）</li>
        <li><span class="bold text-white">動画タイプ</span>（1 or 2 を入力）</li>
      </ol>
      <div class="grid-2">
        <div class="card card--accent">
          <div class="pill pill--primary mb-16">1. YouTube 横動画</div>
          <div class="card-body">1920×1080 / 10〜20分<br/>20ステップ / スライド・ワイプ・OP・ハイライト対応</div>
        </div>
        <div class="card card--hot">
          <div class="pill pill--hot mb-16">2. ショート動画</div>
          <div class="card-body">1080×1920 / 30〜60秒<br/>14ステップ / テロップ8種に絞り情報密度を優先</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 11. 素材の配置
function slide11Assets() {
  return `<section class="slide" data-section="start"
    data-notes="プロジェクトフォルダの中の public フォルダに、素材をドラッグアンドドロップで入れます。動画系は videos の下、画像系は images の下。必須はメイン動画、BGM、SE の3つです。">
    ${ph(11, 'Project start')}
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

// 12. 作業開始
function slide12Start() {
  return `<section class="slide" data-section="start"
    data-notes="素材を配置したらプロジェクトフォルダに移動して最初のスラッシュコマンドを打つだけ。Claude Codeは既に起動済みなのでclaudeコマンドは不要。あとはAIが次のコマンドを案内してくれます。">
    ${ph(12, 'Start work')}
    <div class="slide-content">
      <h2>作業<span class="g-primary">スタート。</span></h2>
      <div class="code">cd projects/<span class="hi">2026-04-19</span>
/step01-context</div>
      <p class="lead mt-32">あとは AI が次のコマンドを案内してくれます。<br/>質問に答えながら <code>/step02-assets</code> → <code>/step03-transcript</code> と進めるだけ。</p>
      <div class="card card--accent mt-32">
        <div class="card-title">中断しても大丈夫</div>
        <div class="card-body"><code>/catchup</code> で現在の進捗を確認、どのステップから再開するか AI が教えてくれる</div>
      </div>
    </div>
  </section>`;
}

// 13. 横動画ワークフロー
function slide13WorkflowLong() {
  return `<section class="slide" data-section="workflow"
    data-notes="横動画版は全20ステップ。4つのフェーズに分かれています。全部通しても3時間程度で1本完成します。">
    ${ph(13, 'Workflow / Long')}
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

// 14. 縦動画ワークフロー
function slide14WorkflowShort() {
  return `<section class="slide" data-section="workflow"
    data-notes="ショート動画版は14ステップ。縦動画は情報密度が詰まりすぎるので、スライドもワイプも削っています。1本60秒の動画を1時間で作れます。">
    ${ph(14, 'Workflow / Shorts')}
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

// 15. Phase 1
function slide15Phase1() {
  return `<section class="slide" data-section="workflow"
    data-notes="フェーズ1は素材準備。文字起こしから無音カットまでです。ここで元動画の尺が40分くらいに縮みます。">
    ${ph(15, 'Phase 1')}
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
          <div class="card-body">無音 + 言い直しを FFmpeg 一発エンコード。カット後に再文字起こし</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 16. Phase 2
function slide16Phase2() {
  return `<section class="slide" data-section="workflow"
    data-notes="フェーズ2は動画の骨格を作ります。テンプレート設定でフォントや色を決めて、テロップデータを作成、最後にコンポジションで組み上げます。ここでRemotion Studioが起動して、ブラウザで完成形のプレビューができます。">
    ${ph(16, 'Phase 2')}
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

// 17. Phase 3
function slide17Phase3() {
  return `<section class="slide" data-section="workflow"
    data-notes="フェーズ3は素材挿入。任意のステップが多いので、必要な演出だけ使ってください。">
    ${ph(17, 'Phase 3')}
    <div class="slide-content">
      <h2>Phase 3　<span class="g-primary">素材挿入</span>　任意</h2>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">step10　グリーンバック</div>
          <div class="card-body">クロマキー処理で背景を画像に置換。グリーンバック撮影した人だけ</div>
        </div>
        <div class="card">
          <div class="card-title">step11　デモ動画挿入</div>
          <div class="card-body">物理挿入（Series分割）とオーバーレイ（上に重ね）の2方式</div>
        </div>
        <div class="card">
          <div class="card-title">step12　画像挿入</div>
          <div class="card-body">手動配置 or Gemini API で AI 画像生成。話者アイコンも対応</div>
        </div>
        <div class="card card--warm">
          <div class="card-title">横動画の追加</div>
          <div class="card-body">step12-17　スライド生成・キャプチャ・ワイプ・特殊要素・エンド画面</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 18. Phase 4
function slide18Phase4() {
  return `<section class="slide" data-section="workflow"
    data-notes="最後のフェーズ。BGMを入れてレンダリングして完成です。">
    ${ph(18, 'Phase 4')}
    <div class="slide-content">
      <h2>Phase 4　<span class="g-primary">BGM・出力</span></h2>
      <div class="grid-2">
        <div class="card card--accent">
          <div class="card-title">BGM 挿入</div>
          <div class="card-body">フェードイン / アウト付き<br/>区間・音量はユーザー指定可<br/>足りない場合はループ再生</div>
        </div>
        <div class="card card--hot">
          <div class="card-title">最終レンダリング</div>
          <div class="card-body">Remotion で MP4 書き出し<br/>横動画: 1920×1080 / 30fps<br/>ショート: 1080×1920 / 30fps</div>
        </div>
      </div>
      <p class="lead mt-48">完成動画は <code>public/output/</code> に出力されます</p>
    </div>
  </section>`;
}

// 19. テロップ8種
function slide19Telop() {
  return `<section class="slide" data-section="rules"
    data-notes="テロップは全部で8種類。発言の内容や感情に応じて、AIが自動で判定してくれます。">
    ${ph(19, 'Telop / 8 styles')}
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
          <tr><td class="bold text-white">third_party</td><td>他者の発言・視聴者の声</td><td>白文字 + グレーフチ + 「」</td><td>se/強調</td></tr>
        </tbody>
      </table>
    </div>
  </section>`;
}

// 20. SE配置ルール
function slide20SE() {
  return `<section class="slide" data-section="rules"
    data-notes="SEは3つのフォルダに分けて管理します。テロップのテンプレに応じて、フォルダの中からランダムに選ばれます。">
    ${ph(20, 'SE rules')}
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
          <span class="text-cyan bold">・</span> 第三者発言が「、」や助詞で終わる場合はスキップ（文の区切りだけ鳴る）
        </div>
      </div>
    </div>
  </section>`;
}

// 21. Whisperの仕組み
function slide21Whisper() {
  return `<section class="slide" data-section="rules"
    data-notes="Whisperは OS によって中身が違います。Mac は mlx-whisper、Windows は faster-whisper。両方とも large-v3 なので精度は同じです。自動で判別してくれます。">
    ${ph(21, 'Whisper')}
    <div class="slide-content">
      <h2>Whisper の仕組み　<span class="g-primary">自動切替</span></h2>
      <div class="grid-2">
        <div class="card card--accent">
          <div class="pill pill--cool mb-16">macOS</div>
          <div class="card-title">mlx-whisper</div>
          <div class="card-body">Apple Silicon 最適化で高速<br/>large-v3 モデルを使用</div>
        </div>
        <div class="card card--hot">
          <div class="pill pill--hot mb-16">Windows</div>
          <div class="card-title">faster-whisper</div>
          <div class="card-body">openai-whisper の4倍速<br/>large-v3 モデルを使用</div>
        </div>
      </div>
      <p class="lead mt-48"><span class="hl">精度は同等</span>　モデルは large-v3 固定で、タイムスタンプ精度を確保しています。</p>
    </div>
  </section>`;
}

// 22. ショート特有
function slide22ShortNotes() {
  return `<section class="slide" data-section="rules"
    data-notes="ショート動画を作る人への注意点です。縦動画は横幅が狭いので、文字数制限が厳しめ。テロップは1行に収まるよう短く分割してください。">
    ${ph(22, 'Shorts notes')}
    <div class="slide-content">
      <h2>ショート動画　特有の注意点</h2>
      <div class="grid-3">
        <div class="card">
          <div class="card-title">テンプレは8種のみ</div>
          <div class="card-body">BulletList / CTA / HeadingBanner / ThemeTelop は使わない</div>
        </div>
        <div class="card">
          <div class="card-title">テロップ位置 上から75%</div>
          <div class="card-body">1920×0.75=1440px 地点。下のコメントUIを避ける</div>
        </div>
        <div class="card">
          <div class="card-title">文字数制限が厳しい</div>
          <div class="card-body">emphasis 系8文字、normal 系12文字まで。2行禁止</div>
        </div>
      </div>
    </div>
  </section>`;
}

// 23. 2本目以降（新規作成.sh推し）
function slide23SecondVideo() {
  return `<section class="slide" data-section="advanced"
    data-notes="2本目以降はもっと簡単です。ライセンス認証はもう終わっているので、コマンドを1つ打つだけ。新規作成.shでプロジェクト作成から起動まで自動です。">
    ${ph(23, 'For next videos')}
    <div class="slide-content">
      <h2>2本目以降は、<span class="g-primary">1コマンド。</span></h2>
      <p class="lead mb-24">ライセンス認証は初回のみ。以降は Cursor のターミナルで1コマンド。</p>
      <div class="code">
<span class="cmt"># naoki-blueprint フォルダで</span>
./新規作成.sh

<span class="cmt"># プロジェクト名を聞かれるので入力するだけ</span>
<span class="cmt"># フォルダ作成 → npm install → Claude Code 起動まで自動</span></div>
      <div class="card card--accent mt-48">
        <div class="card-title">テンプレート更新時</div>
        <div class="card-body"><code>git pull</code> で最新テンプレを取得。既存プロジェクトには影響しません</div>
      </div>
    </div>
  </section>`;
}

// 24. Xへ投稿（2日間共通）
function slide24Post() {
  return `<section class="slide anim-fade-up" data-section="post"
    data-notes="感想や成果物はぜひXにシェアしてください。QRに投稿本文があらかじめセットされているので、スマホで読み取ればそのまま投稿できます。投稿いただいた内容はこちらで拡散させていただきます。">
    ${ph(24, 'Share on X')}
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

// 25. サポート窓口
function slide25Support() {
  return `<section class="slide" data-section="closing"
    data-notes="この作業会が終わったあとも、Chatworkのグループで1ヶ月間サポートします。1ヶ月経過後は個別でご案内します。">
    ${ph(25, 'Support')}
    <div class="slide-content" style="align-items:center;text-align:center">
      <h2 style="text-align:center">サポート窓口</h2>
      <div class="pill pill--primary" style="margin-bottom:40px">Chatwork グループ</div>
      <div style="display:flex;align-items:baseline;gap:24px;justify-content:center">
        <span class="g-primary" style="font-family:var(--font-num);font-size:220px;font-weight:800;letter-spacing:-0.04em;line-height:1">1</span>
        <span style="font-size:64px;font-weight:700;color:var(--white)">ヶ月間</span>
      </div>
      <p class="lead" style="text-align:center;max-width:1200px;margin-top:48px">
        参加者専用の Chatwork グループで、質問・相談いつでもOK。<br/>
        本作業会から<span class="hl">1ヶ月間</span>は私たちが直接お応えします。
      </p>
      <p style="text-align:center;font-size:24px;color:var(--ink-600);margin-top:32px">1ヶ月経過後は個別にご案内させていただきます</p>
    </div>
  </section>`;
}

// 26. クロージング
function slide26Closing() {
  return `<section class="slide hero-slide anim-fade-up" data-section="closing" data-anim-fixed
    data-notes="最後まで参加いただきありがとうございました。この2日間で学んだことを使って、ぜひ動画制作を習慣にしてください。また次の作業会でお会いしましょう。">
    <div class="hero">
      <div class="hero-tag">Thank you for joining</div>
      <h1 class="hero-title">動画制作を、<br/><span class="em-warm">習慣に。</span></h1>
      <div class="hero-rule"></div>
      <p class="hero-subtitle">自動化で浮いた時間で、次のコンテンツを作ろう。<br/>また次の作業会で会いましょう。</p>
      <div class="hero-meta">Naoki  /  AI × Video Editing</div>
      <div class="big-index">26</div>
    </div>
  </section>`;
}

// === Register ===
window.slideFactories = [
  slide01Cover, slide02Numbers, slide03Features,
  slide04MacSetup, slide05WinSetup,
  slide06Delivery, slide07ClaudeStart, slide08Clone,
  slide09License, slide10TypeProject, slide11Assets, slide12Start,
  slide13WorkflowLong, slide14WorkflowShort,
  slide15Phase1, slide16Phase2, slide17Phase3, slide18Phase4,
  slide19Telop, slide20SE, slide21Whisper, slide22ShortNotes,
  slide23SecondVideo, slide24Post, slide25Support, slide26Closing
];

window.agendaItems = [
  { id: 'cover', label: '表紙' },
  { id: 'numbers', label: '時間・コストが変わる' },
  { id: 'features', label: '5つの自動化機能' },
  { id: 'mac-setup', label: 'Mac セットアップ' },
  { id: 'win-setup', label: 'Windows セットアップ' },
  { id: 'delivery', label: 'テンプレの受け取り方' },
  { id: 'claude-start', label: 'Claude Code 起動' },
  { id: 'clone', label: 'リポジトリDL' },
  { id: 'license', label: 'ライセンス認証' },
  { id: 'type-project', label: '動画タイプ+プロジェクト作成' },
  { id: 'assets', label: '素材の配置' },
  { id: 'start', label: '作業スタート' },
  { id: 'workflow-long', label: '横動画ワークフロー' },
  { id: 'workflow-short', label: '縦動画ワークフロー' },
  { id: 'phase1', label: 'Phase 1 / 素材準備' },
  { id: 'phase2', label: 'Phase 2 / 動画構築' },
  { id: 'phase3', label: 'Phase 3 / 素材挿入' },
  { id: 'phase4', label: 'Phase 4 / BGM・出力' },
  { id: 'telop', label: 'テロップ 8種' },
  { id: 'se', label: 'SE 配置ルール' },
  { id: 'whisper', label: 'Whisper の仕組み' },
  { id: 'short-notes', label: 'ショート特有' },
  { id: 'second', label: '2本目以降' },
  { id: 'post', label: '🎯 X へ投稿' },
  { id: 'support', label: 'サポート窓口' },
  { id: 'closing', label: 'クロージング' }
];
