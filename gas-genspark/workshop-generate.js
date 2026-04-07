#!/usr/bin/env node
/**
 * 作業会ガイドスライドをPNG化する
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, 'workshop-slides-output');
const HTML_PATH = path.resolve(__dirname, 'workshop-guide.html');
const WIDTH = 1280;
const HEIGHT = 720;
const TOTAL = 39;

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

  const fileUrl = `file://${HTML_PATH}`;

  for (let i = 1; i <= TOTAL; i++) {
    const url = `${fileUrl}?slide=${i}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const container = await page.$('.slide-container');
    if (container) {
      const outPath = path.join(OUTPUT_DIR, `slide-${String(i).padStart(2, '0')}.png`);
      await container.screenshot({ path: outPath });
      console.log(`✅ slide-${String(i).padStart(2, '0')}.png`);
    } else {
      console.log(`⚠️  slide-${i}: .slide-container が見つかりません`);
    }
  }

  await browser.close();
  console.log(`\n🎉 完了！ ${TOTAL}枚のPNGを ${OUTPUT_DIR} に出力しました`);
})();
