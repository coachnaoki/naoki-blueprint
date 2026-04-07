import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slidesHtml = path.resolve(__dirname, "../../slides/slides.html");
const outputDir = path.resolve(__dirname, "../public/slides");

// 元のscreenshot.jsと同じ設定
const WIDTH = 1280;
const HEIGHT = 720;

// ブロック分割定義
// 各スライドの設定:
//   steps: 段階表示の配列。suffix=ファイル名接尾辞, hide=非表示CSSセレクタ(null=全表示)
//   extraCss: (任意) スライド全体に適用する追加CSS（ワイプ・テロップ回避等）
//
// CSSセレクタ早見表:
//   two-columns の右カラム非表示: ".flex-1.flex.px-10 > .flex-1:nth-child(2)"
//   three-cards のN番目以降非表示: ".grid.grid-cols-3 > div:nth-child(n+N)"
//   steps のN番目以降非表示: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(n+N)"
//   closing のN番目以降非表示: ".grid > div:nth-child(n+N)"
const BLOCK_CONFIGS = {
  // 例: two-columns（左カラム→全表示）
  // 2: {
  //   steps: [
  //     { suffix: "col1", hide: ".flex-1.flex.px-10 > .flex-1:nth-child(2)" },
  //     { suffix: "full", hide: null },
  //   ],
  // },

  // 例: three-cards（カード1→2→全表示）
  // 3: {
  //   steps: [
  //     { suffix: "card1", hide: ".grid.grid-cols-3 > div:nth-child(n+2)" },
  //     { suffix: "card2", hide: ".grid.grid-cols-3 > div:nth-child(3)" },
  //     { suffix: "full", hide: null },
  //   ],
  // },

  // 例: steps×3（ステップ1→2→全表示）
  // 4: {
  //   steps: [
  //     { suffix: "step1", hide: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(n+2)" },
  //     { suffix: "step2", hide: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(n+3)" },
  //     { suffix: "full", hide: null },
  //   ],
  // },

  // 例: steps×5 + ワイプ・テロップ回避CSS
  // 6: {
  //   extraCss: `
  //     .flex-1.flex.flex-col.px-12.pb-10 {
  //       padding-left: 14rem !important;
  //       padding-right: 16rem !important;
  //       padding-bottom: 12rem !important;
  //       gap: 2px !important;
  //     }
  //     .rounded-2xl.py-3 { padding-top: 5px !important; padding-bottom: 5px !important; }
  //     .rounded-2xl .text-xl { display: none !important; }
  //     .rounded-2xl > .right-6 { right: 1rem !important; }
  //     .rounded-2xl .text-4xl { font-size: 3.25rem !important; }
  //   `,
  //   steps: [
  //     { suffix: "step1", hide: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(n+2)" },
  //     { suffix: "step2", hide: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(n+3)" },
  //     { suffix: "step3", hide: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(n+4)" },
  //     { suffix: "step4", hide: ".flex-1.flex.flex-col.px-12.pb-10 > div:nth-child(5)" },
  //     { suffix: "full", hide: null },
  //   ],
  // },
};

async function main() {
  const configKeys = Object.keys(BLOCK_CONFIGS);
  if (configKeys.length === 0) {
    console.log("BLOCK_CONFIGS が空です。対象スライドを設定してください。");
    return;
  }

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

      // スライドレベルの追加CSS（ワイプ・テロップ回避等）
      if (config.extraCss) {
        await page.addStyleTag({ content: config.extraCss });
      }

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
