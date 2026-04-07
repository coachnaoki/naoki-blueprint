// =====================================================
// 設定（デフォルト値）
// =====================================================
const CONFIG = {
  SCREENSHOT_WIDTH: 1280,
  SCREENSHOT_HEIGHT: 720,
  SCREENSHOTONE_KEY: "OVSD_aG2i15jVg",
};

// =====================================================
// メニュー
// =====================================================
function onOpen() {
  SlidesApp.getUi()
    .createMenu("★Genspark")
    .addItem("URLを入力してスライドを取り込む", "promptAndImport")
    .addItem("デバッグ: 1枚テスト", "debugSingleSlide")
    .addSeparator()
    .addItem("slides.html を取り込む", "promptAndImportHtml")
    .addToUi();
}

// =====================================================
// URLを入力するダイアログを表示してから取り込む
// =====================================================
function promptAndImport() {
  const ui = SlidesApp.getUi();

  // Step 1: URL入力
  const urlResult = ui.prompt(
    "Gensparkスライドを取り込む (1/2)",
    "GensparkスペースのURLを入力してください\n例: https://lykwidyl.gensparkspace.com/",
    ui.ButtonSet.OK_CANCEL
  );
  if (urlResult.getSelectedButton() !== ui.Button.OK) return;

  const inputUrl = urlResult.getResponseText().trim();
  if (!inputUrl) { ui.alert("URLが入力されていません。"); return; }

  // project_id取得
  let projectId, spaceUrl, totalSlides;
  try {
    const parsed = extractProjectInfo(inputUrl);
    projectId = parsed.projectId;
    spaceUrl = parsed.spaceUrl;
    const slideData = fetchSlideData(spaceUrl, projectId);
    totalSlides = slideData.data.file_contents.length;
  } catch (e) {
    ui.alert("エラー: " + e.message);
    return;
  }

  // Step 2: ページ範囲入力
  const pageResult = ui.prompt(
    "Gensparkスライドを取り込む (2/2)",
    `取り込むページを指定してください（全${totalSlides}枚）\n\n` +
    "・全ページ: 空欄のままOK\n" +
    "・個別指定: 1,3,5\n" +
    "・範囲指定: 2-10\n" +
    "・組み合わせ: 1,3,5-10,15",
    ui.ButtonSet.OK_CANCEL
  );
  if (pageResult.getSelectedButton() !== ui.Button.OK) return;

  // ページ番号をパース（空欄=全ページ）
  let pageIndices;
  try {
    pageIndices = parsePageSpec(pageResult.getResponseText().trim(), totalSlides);
  } catch (e) {
    ui.alert("ページ指定エラー: " + e.message);
    return;
  }

  const confirm = ui.alert(
    "確認",
    `${pageIndices.length}枚（${formatPageSpec(pageIndices)}）を取り込みます。\n現在のプレゼンのスライドはすべて削除されます。続けますか？`,
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  importGensparkSlides(spaceUrl, projectId, pageIndices);
}

// =====================================================
// "1,3,5-10" → [0,2,4,5,6,7,8,9] のインデックス配列に変換
// =====================================================
function parsePageSpec(spec, total) {
  if (!spec) {
    // 空欄 → 全ページ
    return Array.from({ length: total }, (_, i) => i);
  }

  const indices = new Set();
  spec.split(",").forEach(part => {
    part = part.trim();
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const from = parseInt(rangeMatch[1]);
      const to = parseInt(rangeMatch[2]);
      if (from < 1 || to > total || from > to) throw new Error(`範囲 "${part}" が無効です（1〜${total}）`);
      for (let p = from; p <= to; p++) indices.add(p - 1);
    } else if (/^\d+$/.test(part)) {
      const p = parseInt(part);
      if (p < 1 || p > total) throw new Error(`ページ ${p} は範囲外です（1〜${total}）`);
      indices.add(p - 1);
    } else {
      throw new Error(`"${part}" の形式が正しくありません`);
    }
  });

  return [...indices].sort((a, b) => a - b);
}

// =====================================================
// インデックス配列 → 表示用文字列 "1,3,5-10"
// =====================================================
function formatPageSpec(indices) {
  const pages = indices.map(i => i + 1);
  const parts = [];
  let start = pages[0], end = pages[0];

  for (let i = 1; i <= pages.length; i++) {
    if (i < pages.length && pages[i] === end + 1) {
      end = pages[i];
    } else {
      parts.push(start === end ? `${start}` : `${start}-${end}`);
      start = end = pages[i];
    }
  }
  return parts.join(",");
}

// =====================================================
// URLからspaceUrlとproject_idを取得
// =====================================================
function extractProjectInfo(inputUrl) {
  // URLの形式を整形
  const url = inputUrl.endsWith("/") ? inputUrl : inputUrl + "/";

  // gensparkspace.com のURLかチェック
  if (!url.includes("gensparkspace.com")) {
    throw new Error("gensparkspace.com のURLを入力してください。");
  }

  // spaceUrl (origin) を取得: https://xxx.gensparkspace.com
  const originMatch = url.match(/^(https?:\/\/[^/]+)/);
  if (!originMatch) throw new Error("URLの形式が正しくありません。");
  const spaceUrl = originMatch[1];

  // ページHTMLからproject_idを取得
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error(`ページ取得失敗 (HTTP ${response.getResponseCode()})`);
  }

  const html = response.getContentText();
  const match = html.match(/project_id:"([^"]+)"/);
  if (!match) throw new Error("project_idが見つかりません。URLが正しいか確認してください。");

  return { spaceUrl, projectId: match[1] };
}

// =====================================================
// メイン: Gensparkスライドを現在のプレゼンに取り込む
// =====================================================
function importGensparkSlides(spaceUrl, projectId, pageIndices) {
  const deck = SlidesApp.getActivePresentation();

  const slideData = fetchSlideData(spaceUrl, projectId);
  const allSlides = slideData.data.file_contents;

  // pageIndices未指定なら全ページ
  if (!pageIndices) pageIndices = Array.from({ length: allSlides.length }, (_, i) => i);
  const slides = pageIndices.map(i => allSlides[i]);
  Logger.log(`取り込み: ${slides.length}枚 (全${allSlides.length}枚中)`);

  deck.getSlides().forEach(s => s.remove());

  const width = deck.getPageWidth();
  const height = deck.getPageHeight();
  let successCount = 0;

  slides.forEach((slideInfo, i) => {
    Logger.log(`処理中: ${i + 1}/${slides.length} (p.${pageIndices[i] + 1})`);

    const htmlUrl = getCdnUrl(slideInfo);
    if (!htmlUrl) { Logger.log("  → スキップ (URLなし)"); return; }

    let screenshotUrl;
    try {
      screenshotUrl = getScreenshotImageUrl(htmlUrl);
    } catch (e) {
      Logger.log(`  → スクリーンショット失敗: ${e.message}`);
      return;
    }

    try {
      const slide = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
      const image = slide.insertImage(screenshotUrl);
      image.setWidth(width).setHeight(height).setLeft(0).setTop(0);
      successCount++;
    } catch (e) {
      Logger.log(`  → 挿入失敗: ${e.message}`);
    }

    if (i < slides.length - 1) Utilities.sleep(500);
  });

  SlidesApp.getUi().alert(`完了！ ${successCount}/${slides.length}枚のスライドを取り込みました。`);
}

// =====================================================
// slide_data API を取得（認証不要）
// =====================================================
function fetchSlideData(spaceUrl, projectId) {
  const url = `${spaceUrl}/api/project/slide_data?project_id=${projectId}`;
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { "Accept": "application/json" },
  });
  if (response.getResponseCode() !== 200) {
    throw new Error(`slide_data取得失敗 (HTTP ${response.getResponseCode()})`);
  }
  return JSON.parse(response.getContentText());
}

// =====================================================
// cdn_url → public.gensparkspace.com URL
// =====================================================
function getCdnUrl(slideInfo) {
  const match = (slideInfo.cdn_url || "").match(/\/s\/([A-Za-z0-9]+)$/);
  if (!match) return null;
  return `https://public.gensparkspace.com/api/files/s/${match[1]}`;
}

// =====================================================
// microlink.io でHTML→スクリーンショット画像URL取得
// 失敗時は thum.io にフォールバック（APIキー不要）
// =====================================================
function getScreenshotImageUrl(htmlUrl) {
  const { SCREENSHOT_WIDTH: w, SCREENSHOT_HEIGHT: h } = CONFIG;

  // Primary: microlink.io
  try {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(htmlUrl)}&screenshot=true&viewport.width=${w}&viewport.height=${h}&meta=false`;
    const res = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const data = JSON.parse(res.getContentText());
      if (data.status === "success") return data.data.screenshot.url;
      Logger.log(`microlink失敗: ${data.message || ""}, fallbackへ`);
    } else {
      Logger.log(`microlink HTTP ${res.getResponseCode()}, fallbackへ`);
    }
  } catch (e) {
    Logger.log(`microlink例外: ${e.message}, fallbackへ`);
  }

  // Fallback: screenshotone.com
  const key = CONFIG.SCREENSHOTONE_KEY;
  if (!key) throw new Error("SCREENSHOTONE_KEY が未設定です");
  const s1Url = `https://api.screenshotone.com/take`
    + `?access_key=${key}`
    + `&url=${encodeURIComponent(htmlUrl)}`
    + `&viewport_width=${w}`
    + `&viewport_height=${h}`
    + `&format=jpg`
    + `&image_quality=90`
    + `&delay=2`;
  const res2 = UrlFetchApp.fetch(s1Url, { muteHttpExceptions: true });
  const code2 = res2.getResponseCode();
  Logger.log(`screenshotone HTTP ${code2}`);
  if (code2 !== 200) throw new Error(`screenshotone HTTP ${code2}: ${res2.getContentText().slice(0, 200)}`);
  return res2.getBlob();
}

// =====================================================
// slides.html (GitHub Pages等) を取り込む
// =====================================================
function promptAndImportHtml() {
  const ui = SlidesApp.getUi();

  // Step 1: ベースURL入力
  const urlResult = ui.prompt(
    "slides.html を取り込む (1/2)",
    "slides.html の公開URL を入力してください\n例: https://yourname.github.io/slides/slides.html",
    ui.ButtonSet.OK_CANCEL
  );
  if (urlResult.getSelectedButton() !== ui.Button.OK) return;
  const baseUrl = urlResult.getResponseText().trim().replace(/\?.*$/, "");
  if (!baseUrl) { ui.alert("URLが入力されていません。"); return; }

  // スライド枚数を取得（HTMLから SLIDE_SCRIPT の長さを読む）
  let totalSlides;
  try {
    const html = UrlFetchApp.fetch(baseUrl, { muteHttpExceptions: true }).getContentText();
    const match = html.match(/SLIDE_SCRIPT\s*=\s*\[/);
    if (!match) throw new Error("SLIDE_SCRIPT が見つかりません");
    // ] の数を数えてスライド数を推定
    const countMatch = html.match(/type\s*:/g);
    totalSlides = countMatch ? countMatch.length : 0;
    if (totalSlides === 0) throw new Error("スライドが0枚です");
  } catch (e) {
    ui.alert("エラー: " + e.message);
    return;
  }

  // Step 2: ページ範囲入力
  const pageResult = ui.prompt(
    "slides.html を取り込む (2/2)",
    `取り込むページを指定してください（全${totalSlides}枚）\n\n` +
    "・全ページ: 空欄のままOK\n" +
    "・個別指定: 1,3,5\n" +
    "・範囲指定: 2-10",
    ui.ButtonSet.OK_CANCEL
  );
  if (pageResult.getSelectedButton() !== ui.Button.OK) return;

  let pageIndices;
  try {
    pageIndices = parsePageSpec(pageResult.getResponseText().trim(), totalSlides);
  } catch (e) {
    ui.alert("ページ指定エラー: " + e.message);
    return;
  }

  const confirm = ui.alert(
    "確認",
    `${pageIndices.length}枚を取り込みます。現在のスライドはすべて削除されます。続けますか？`,
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  importHtmlSlides(baseUrl, pageIndices);
}

function importHtmlSlides(baseUrl, pageIndices) {
  const deck = SlidesApp.getActivePresentation();
  const width = deck.getPageWidth();
  const height = deck.getPageHeight();

  deck.getSlides().forEach(s => s.remove());

  let successCount = 0;

  pageIndices.forEach((idx, i) => {
    const slideUrl = `${baseUrl}?slide=${idx + 1}`;
    Logger.log(`処理中: ${i + 1}/${pageIndices.length} → ${slideUrl}`);

    let screenshotUrl;
    try {
      screenshotUrl = getScreenshotImageUrl(slideUrl);
    } catch (e) {
      Logger.log(`  → スクリーンショット失敗: ${e.message}`);
      return;
    }

    try {
      const slide = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
      const image = slide.insertImage(screenshotUrl);
      image.setWidth(width).setHeight(height).setLeft(0).setTop(0);
      successCount++;
    } catch (e) {
      Logger.log(`  → 挿入失敗: ${e.message}`);
    }

    if (i < pageIndices.length - 1) Utilities.sleep(500);
  });

  SlidesApp.getUi().alert(`完了！ ${successCount}/${pageIndices.length}枚を取り込みました。`);
}

// =====================================================
// CLI用: 親プレゼンのIDを取得
// =====================================================
function getParentId() {
  const id = ScriptApp.getScriptId();
  const file = DriveApp.getFileById(id);
  const parents = file.getParents();
  if (parents.hasNext()) {
    return parents.next().getId();
  }
  return "parent not found";
}

// =====================================================
// CLI用: clasp run で実行（プレゼンIDを指定して取り込み）
// =====================================================
function importHtmlSlidesCli(presentationId, baseUrl, totalSlides) {
  const deck = SlidesApp.openById(presentationId);
  const width = deck.getPageWidth();
  const height = deck.getPageHeight();

  deck.getSlides().forEach(s => s.remove());

  const pageIndices = Array.from({ length: totalSlides }, (_, i) => i);
  let successCount = 0;

  pageIndices.forEach((idx, i) => {
    const slideUrl = `${baseUrl}?slide=${idx + 1}`;
    Logger.log(`処理中: ${i + 1}/${pageIndices.length} → ${slideUrl}`);

    let screenshotUrl;
    try {
      screenshotUrl = getScreenshotImageUrl(slideUrl);
    } catch (e) {
      Logger.log(`  → スクリーンショット失敗: ${e.message}`);
      return;
    }

    try {
      const slide = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
      const image = slide.insertImage(screenshotUrl);
      image.setWidth(width).setHeight(height).setLeft(0).setTop(0);
      successCount++;
    } catch (e) {
      Logger.log(`  → 挿入失敗: ${e.message}`);
    }

    if (i < pageIndices.length - 1) Utilities.sleep(500);
  });

  return `完了！ ${successCount}/${pageIndices.length}枚を取り込みました。`;
}

// =====================================================
// デバッグ: 最初の1枚だけ試す
// =====================================================
function debugSingleSlide() {
  const ui = SlidesApp.getUi();
  const result = ui.prompt("デバッグ用URL入力", "GensparkスペースのURLを入力:", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;

  try {
    const { spaceUrl, projectId } = extractProjectInfo(result.getResponseText().trim());
    Logger.log(`spaceUrl: ${spaceUrl}, projectId: ${projectId}`);

    const slideData = fetchSlideData(spaceUrl, projectId);
    const first = slideData.data.file_contents[0];
    Logger.log(`slideInfo full: ${JSON.stringify(first)}`);
    Logger.log(`page_id: ${first.page_id}`);

    const htmlUrl = getCdnUrl(first);
    Logger.log(`html URL: ${htmlUrl}`);

    const screenshotUrl = getScreenshotImageUrl(htmlUrl);
    Logger.log(`screenshot URL: ${screenshotUrl}`);

    const res = UrlFetchApp.fetch(screenshotUrl, { muteHttpExceptions: true });
    Logger.log(`HTTP: ${res.getResponseCode()}, Type: ${res.getHeaders()["Content-Type"]}, Size: ${res.getContent().length} bytes`);

    ui.alert("成功！ログを確認してください。");
  } catch (e) {
    ui.alert("エラー: " + e.message);
  }
}
