#!/usr/bin/env node
/**
 * v2.0: aislides/slides.html をキャプチャ + ブロック分割PNG生成
 *
 * - ビューポート 1920×1080 / deviceScaleFactor=2 (実質3840×2160)
 * - `<section class="slide" data-blocks="N">` のスライドはブロック分割
 *   → `data-block-index="K"` の要素を K まで表示してキャプチャ
 *   → block 1, 2, ..., N の N枚を生成
 * - data-blocks が無いスライドは通常キャプチャ1枚
 *
 * 使い方:
 *   node scripts/captureSlides.mjs
 *
 * 出力: public/slides/slide-NN.png または slide-NN-blockK.png
 */
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SLIDES_HTML = path.resolve(__dirname, "../aislides/slides.html");
const OUTPUT_DIR = path.resolve(__dirname, "../public/slides");

const WIDTH = 1920;
const HEIGHT = 1080;

(async () => {
  if (!fs.existsSync(SLIDES_HTML)) {
    console.error(`❌ slides.html が見つかりません: ${SLIDES_HTML}`);
    process.exit(1);
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. スライド構成を一括取得
  const infoPage = await browser.newPage();
  await infoPage.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await infoPage.goto(`file://${SLIDES_HTML}`, { waitUntil: "networkidle0", timeout: 30000 });

  const slideInfo = await infoPage.evaluate(() => {
    return Array.from(document.querySelectorAll("section.slide")).map((sec, i) => ({
      index: i + 1,
      blocks: parseInt(sec.getAttribute("data-blocks"), 10) || 0,
    }));
  });
  await infoPage.close();

  console.log(`📑 スライド数: ${slideInfo.length}`);
  const totalPNGs = slideInfo.reduce((sum, s) => sum + (s.blocks || 1), 0);
  console.log(`🎨 生成PNG数: ${totalPNGs}\n`);

  // 2. 各スライドをキャプチャ
  for (const info of slideInfo) {
    if (info.blocks > 0) {
      for (let k = 1; k <= info.blocks; k++) {
        await capture(browser, info.index, k, info.blocks);
      }
    } else {
      await capture(browser, info.index, null, 0);
    }
  }

  await browser.close();
  console.log(`\n✅ 完了: ${OUTPUT_DIR}`);
})();

async function capture(browser, slideN, blockK, totalBlocks) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

  await page.goto(`file://${SLIDES_HTML}`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  // 表示制御 (HTML側にJSを書かなくてもpuppeteer側で行う)
  await page.evaluate(
    ({ slideN, blockK }) => {
      document.body.classList.add("capture-mode");
      const slides = document.querySelectorAll("section.slide");
      slides.forEach((sec, i) => {
        if (i + 1 !== slideN) {
          sec.style.display = "none";
        } else {
          sec.setAttribute("data-capture-target", "1");
        }
      });
      if (blockK !== null) {
        const target = slides[slideN - 1];
        if (target) {
          target.querySelectorAll("[data-block-index]").forEach((el) => {
            const idx = parseInt(el.getAttribute("data-block-index"), 10);
            if (idx > blockK) el.style.visibility = "hidden";
          });
        }
      }
    },
    { slideN, blockK }
  );
  await new Promise((r) => setTimeout(r, 400));

  const box = await page.evaluate(() => {
    const el = document.querySelector('section.slide[data-capture-target="1"]');
    if (!el) return null;
    el.scrollIntoView({ block: "start", inline: "start" });
    const rect = el.getBoundingClientRect();
    return {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    };
  });

  const filename =
    blockK !== null
      ? `slide-${String(slideN).padStart(2, "0")}-block${blockK}.png`
      : `slide-${String(slideN).padStart(2, "0")}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  if (box) {
    await page.screenshot({
      path: filepath,
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
  } else {
    await page.screenshot({ path: filepath });
  }

  const blockInfo = blockK !== null ? ` (block ${blockK}/${totalBlocks})` : "";
  console.log(`  ✓ ${filename}${blockInfo}`);
  await page.close();
}
