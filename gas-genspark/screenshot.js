#!/usr/bin/env node
/**
 * slides.html の各スライドを PNG 画像として保存する
 * 使い方: node screenshot.js [保存先ディレクトリ]
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SLIDES_HTML = path.resolve(__dirname, 'slides.html');
const DEFAULT_OUTPUT = path.resolve(__dirname, '..', '.template', 'public', 'slides');
const OUTPUT_DIR = process.argv[2] || DEFAULT_OUTPUT;

// スライドの固定サイズ
const WIDTH = 1280;
const HEIGHT = 720;

(async () => {
  // 保存先ディレクトリを作成
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // まず全スライド数を取得
  const countPage = await browser.newPage();
  await countPage.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await countPage.goto(`file://${SLIDES_HTML}`, { waitUntil: 'networkidle0', timeout: 30000 });

  const totalSlides = await countPage.evaluate(() => {
    return typeof SLIDE_SCRIPT !== 'undefined' ? SLIDE_SCRIPT.length : 0;
  });
  await countPage.close();

  console.log(`スライド数: ${totalSlides}`);

  for (let i = 1; i <= totalSlides; i++) {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

    // スクリーンショットモードで1枚ずつ開く
    await page.goto(`file://${SLIDES_HTML}?slide=${i}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // フォント・CSS の読み込みを待つ
    await page.evaluate(() => document.fonts.ready);

    // 追加の安定待機
    await new Promise(r => setTimeout(r, 500));

    // #stage 要素（スライド本体）をクリップしてスクショ
    const stageBox = await page.evaluate(() => {
      const el = document.querySelector('.slide-container');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });

    const filename = `slide-${String(i).padStart(2, '0')}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (stageBox) {
      await page.screenshot({
        path: filepath,
        clip: {
          x: stageBox.x,
          y: stageBox.y,
          width: stageBox.width,
          height: stageBox.height,
        },
      });
    } else {
      // フォールバック: ビューポート全体
      await page.screenshot({ path: filepath });
    }

    console.log(`✓ ${filename}`);
    await page.close();
  }

  await browser.close();
  console.log(`\n完了！ ${totalSlides}枚を ${OUTPUT_DIR} に保存しました`);
})();
