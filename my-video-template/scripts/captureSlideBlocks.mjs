import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slidesHtml = path.resolve(__dirname, "../../gas-genspark/slides.html");
const outputDir = path.resolve(__dirname, "../public/slides");

// 元のscreenshot.jsと同じ設定
const WIDTH = 1280;
const HEIGHT = 720;

// ブロック分割定義
const BLOCK_CONFIGS = {
  // スライド4: two-columns（問題1→問題2）
  4: {
    steps: [
      { suffix: "title", hide: ".flex-1.flex.px-10 > .flex-1" },
      { suffix: "col1", hide: ".flex-1.flex.px-10 > .flex-1:nth-child(2)" },
      { suffix: "full", hide: null },
    ],
  },

  // スライド8: three-cards（カード1→2→3）
  8: {
    steps: [
      { suffix: "title", hide: ".grid.grid-cols-3 > div" },
      { suffix: "card1", hide: ".grid.grid-cols-3 > div:nth-child(n+2)" },
      { suffix: "card2", hide: ".grid.grid-cols-3 > div:nth-child(3)" },
      { suffix: "full", hide: null },
    ],
  },

  // スライド9: steps（ステップ1→2）
  9: {
    steps: [
      { suffix: "title", hide: ".flex-1.flex.flex-col.px-12 > div" },
      { suffix: "step1", hide: ".flex-1.flex.flex-col.px-12 > div:nth-child(2)" },
      { suffix: "full", hide: null },
    ],
  },

  // スライド10: closing（3カード順次）
  10: {
    steps: [
      { suffix: "title", hide: ".grid > div" },
      { suffix: "card1", hide: ".grid > div:nth-child(n+2)" },
      { suffix: "card2", hide: ".grid > div:nth-child(3)" },
      { suffix: "full", hide: null },
    ],
  },
};

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const blocksDir = path.join(outputDir, "blocks");
  if (!fs.existsSync(blocksDir)) fs.mkdirSync(blocksDir, { recursive: true });

  for (const [slideNumStr, config] of Object.entries(BLOCK_CONFIGS)) {
    const slideNum = parseInt(slideNumStr);
    console.log(`\n📐 Slide ${slideNum}: ${config.steps.length} steps`);

    for (let stepIdx = 0; stepIdx < config.steps.length; stepIdx++) {
      const step = config.steps[stepIdx];

      // 毎回新しいページ（元のscreenshot.jsと同じ）
      const page = await browser.newPage();
      await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

      await page.goto(`file://${slidesHtml}?slide=${slideNum}`, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // ブロック非表示CSS追加
      if (step.hide) {
        await page.addStyleTag({
          content: `${step.hide} { visibility: hidden !important; }`,
        });
      }

      // フォント・CSSの読み込みを待つ（元のscreenshot.jsと同じ）
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 500));

      // .slide-container のBoundingRectでクリップ（元のscreenshot.jsと同じ）
      const stageBox = await page.evaluate(() => {
        const el = document.querySelector(".slide-container");
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });

      const outPath = path.join(
        blocksDir,
        `slide-${String(slideNum).padStart(2, "0")}-${step.suffix}.png`
      );

      if (stageBox) {
        await page.screenshot({
          path: outPath,
          clip: stageBox,
        });
      } else {
        await page.screenshot({ path: outPath });
      }

      console.log(`  ✅ Step ${stepIdx} (${step.suffix}) → ${outPath}`);
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n🎉 All block captures complete!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
