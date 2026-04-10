import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slidesHtml = path.resolve(__dirname, "../../aislides/slides.html");
const outputDir = path.resolve(__dirname, "../public/slides");

// ★ プロジェクトごとに変更する
const TOTAL_SLIDES = 10;

const WIDTH = 1280;
const HEIGHT = 720;

// テンプレートタイプ → ブロック分割設定の自動マッピング
// 複数アイテムを持つテンプレートは自動でブロック分割画像を生成する
const BLOCK_TEMPLATE_MAP = {
  "three-cards":   { selector: ".grid-cols-3 > div", countKey: "cards" },
  "three-tactics": { selector: ".grid-cols-3 > div", countKey: "cards" },
  "two-columns":   { selector: ".gap-8 > .flex-1",   countKey: "columns" },
  "steps":         { selector: ".flex-col.px-12 > div.rounded-2xl", countKey: "steps" },
  "closing":       { selector: ".grid > div",         countKey: "cards" },
  "before-after":  { selector: ".gap-6.items-stretch > .flex-1", countKey: "_beforeAfter" },
  "stats":         { selector: ".gap-8 > .flex-1",   countKey: "stats" },
  "checklist":     { selector: ".flex-col.justify-start > div", countKey: "items" },
  "timeline":      { selector: ".flex-col.justify-start > div", countKey: "events" },
  "ranking":       { selector: ".flex-col.justify-start > div", countKey: "items" },
  "versus":        { selector: ".gap-6.items-stretch > .flex-1", countKey: "_versus" },
  "agenda":        { selector: ".flex-col.justify-center > div", countKey: "items" },
};

async function detectBlockSplits(browser) {
  const page = await browser.newPage();
  await page.goto(`file://${slidesHtml}`, { waitUntil: "networkidle0", timeout: 30000 });

  const slideTypes = await page.evaluate(() => {
    return SLIDE_SCRIPT.map((s) => ({
      type: s.type,
      itemCount:
        (s.cards && s.cards.length) ||
        (s.columns && s.columns.length) ||
        (s.steps && s.steps.length) ||
        (s.stats && s.stats.length) ||
        (s.items && s.items.length) ||
        (s.events && s.events.length) ||
        (s.before && s.after ? 2 : 0) ||
        (s.left && s.right ? 2 : 0) ||
        0,
    }));
  });

  await page.close();

  const blockSplits = {};
  slideTypes.forEach((slide, idx) => {
    const mapping = BLOCK_TEMPLATE_MAP[slide.type];
    if (mapping && slide.itemCount >= 2) {
      blockSplits[idx + 1] = {
        count: slide.itemCount,
        selector: mapping.selector,
      };
    }
  });

  return blockSplits;
}

async function capturePage(browser, url, outPath, blockConfig) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));

  if (blockConfig) {
    await page.evaluate(
      (sel, visibleCount) => {
        const items = document.querySelectorAll(sel);
        items.forEach((el, idx) => {
          if (idx >= visibleCount) el.style.visibility = "hidden";
        });
        // 一部のアイテムが非表示の場合、親内のabsolute要素（矢印等）も非表示
        if (visibleCount < items.length && items.length > 0) {
          const parent = items[0].parentElement;
          if (parent) {
            parent.querySelectorAll(":scope > .absolute").forEach((el) => {
              el.style.visibility = "hidden";
            });
          }
        }
      },
      blockConfig.selector,
      blockConfig.visibleCount
    );
    await new Promise((r) => setTimeout(r, 300));
  }

  const stageBox = await page.evaluate(() => {
    const el = document.querySelector(".slide-container");
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  if (stageBox) {
    await page.screenshot({
      path: outPath,
      clip: { x: stageBox.x, y: stageBox.y, width: stageBox.width, height: stageBox.height },
    });
  } else {
    await page.screenshot({ path: outPath });
  }

  await page.close();
}

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // SLIDE_SCRIPTからブロック分割対象を自動検出
  const BLOCK_SPLITS = await detectBlockSplits(browser);
  console.log("🔍 Auto-detected block splits:", JSON.stringify(BLOCK_SPLITS, null, 2));

  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const url = `file://${slidesHtml}?slide=${i}`;
    const padded = String(i).padStart(2, "0");

    const outPath = path.join(outputDir, `slide-${padded}.png`);
    await capturePage(browser, url, outPath);
    console.log(`✅ Slide ${i} → ${outPath}`);

    const split = BLOCK_SPLITS[i];
    if (split) {
      for (let b = 1; b <= split.count; b++) {
        const blockPath = path.join(outputDir, `slide-${padded}-block${b}.png`);
        await capturePage(browser, url, blockPath, {
          selector: split.selector,
          visibleCount: b,
        });
        console.log(`  📦 Block ${b} → ${blockPath}`);
      }
    }
  }

  await browser.close();
  console.log(`\n🎉 All ${TOTAL_SLIDES} slides captured!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
