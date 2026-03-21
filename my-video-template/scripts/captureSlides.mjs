import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slidesHtml = path.resolve(
  __dirname,
  "../../gas-genspark/slides.html"
);
const outputDir = path.resolve(__dirname, "../public/slides");

const TOTAL_SLIDES = 10;
const WIDTH = 1920;
const HEIGHT = 1080;

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const url = `file://${slidesHtml}?slide=${i}`;
    await page.goto(url, { waitUntil: "networkidle0" });

    // Override CSS to render at 1920x1080
    await page.addStyleTag({
      content: `
        #stage, .slide, .slide-container {
          width: ${WIDTH}px !important;
          height: ${HEIGHT}px !important;
        }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: ${HEIGHT}px;
        }
        #nav { display: none !important; }
      `,
    });

    // Wait for re-layout
    await page.waitForFunction(() => true, { timeout: 1000 });

    const padded = String(i).padStart(2, "0");
    const outPath = path.join(outputDir, `slide-${padded}.png`);

    // Clip to exact 1920x1080
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    console.log(`✅ Slide ${i} → ${outPath}`);
  }

  await browser.close();
  console.log(`\n🎉 All ${TOTAL_SLIDES} slides captured!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
