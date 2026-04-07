#!/usr/bin/env node
/**
 * セミナースライドをPuppeteerで撮影 → Google Slidesに自動挿入
 * 使い方: node import-slides.mjs
 */

import { readFileSync, createReadStream, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createServer } from 'http';

const require = createRequire(import.meta.url);
const puppeteer = require('/Users/kobayashinaoki/Desktop/7_AI/Cursor/naoki-blueprint/projects/test-customer/node_modules/puppeteer');
const { google } = require('/Users/kobayashinaoki/.npm-global/node_modules/googleapis');

const __dirname = dirname(fileURLToPath(import.meta.url));

const SLIDES_HTML = resolve(__dirname, process.argv[2] || 'seminar-slides.html');
const TMP_DIR = '/tmp/slides-capture';
const PRESENTATION_ID = process.argv[3] || '14UOt3rfC7zXiOuwysVzWxEujDGMlb8X3KGvrA7yxB-M';
const SERVICE_ACCOUNT = '/Users/kobayashinaoki/Desktop/7_AI/Cursor/auto-journal/service_account.json';

// --- 1. Puppeteerで全スライドPNG撮影 ---
async function captureSlides() {
  mkdirSync(TMP_DIR, { recursive: true });
  // 既存ファイル削除
  readdirSync(TMP_DIR).filter(f => f.endsWith('.png')).forEach(f => unlinkSync(`${TMP_DIR}/${f}`));

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto(`file://${SLIDES_HTML}`, { waitUntil: 'networkidle0', timeout: 30000 });
  const total = await page.evaluate(() => SLIDE_SCRIPT.length);
  await page.close();

  console.log(`📸 ${total}枚のスライドを撮影中...`);

  for (let i = 1; i <= total; i++) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await p.goto(`file://${SLIDES_HTML}?slide=${i}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await p.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const clip = await p.evaluate(() => {
      const el = document.querySelector('.slide-container');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });

    const filename = `${TMP_DIR}/slide-${String(i).padStart(2, '0')}.png`;
    if (clip) {
      await p.screenshot({ path: filename, clip });
    } else {
      await p.screenshot({ path: filename });
    }
    process.stdout.write(`  ✓ ${i}/${total}\r`);
    await p.close();
  }

  await browser.close();
  console.log(`\n📸 撮影完了: ${total}枚`);
  return total;
}

// --- 2. Google認証 ---
function getAuth() {
  const key = JSON.parse(readFileSync(SERVICE_ACCOUNT, 'utf8'));
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

// --- 3. ローカルHTTPサーバー + トンネルで画像配信 → Slidesに挿入 ---
async function importToSlides(totalSlides) {
  const auth = getAuth();
  const slides = google.slides({ version: 'v1', auth });

  // ローカルHTTPサーバー起動（PNG配信用）
  const PORT = 8765;
  const server = createServer((req, res) => {
    const file = req.url.replace('/', '');
    const filePath = `${TMP_DIR}/${file}`;
    try {
      const data = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  await new Promise(r => server.listen(PORT, r));
  console.log(`🌐 ローカルサーバー起動: http://localhost:${PORT}`);

  // localtunnelでトンネル作成
  const { default: localtunnel } = await import('localtunnel');
  const tunnel = await localtunnel({ port: PORT });
  console.log(`🔗 トンネルURL: ${tunnel.url}`);

  // 既存スライドを全削除
  console.log('🗑️  既存スライドを削除中...');
  const pres = await slides.presentations.get({ presentationId: PRESENTATION_ID });
  const existingSlides = pres.data.slides || [];
  if (existingSlides.length > 0) {
    const deleteRequests = existingSlides.map(s => ({
      deleteObject: { objectId: s.objectId }
    }));
    await slides.presentations.batchUpdate({
      presentationId: PRESENTATION_ID,
      requestBody: { requests: deleteRequests },
    });
  }

  console.log(`📤 ${totalSlides}枚をGoogle Slidesに挿入中...`);

  for (let i = 1; i <= totalSlides; i++) {
    const pngFile = `slide-${String(i).padStart(2, '0')}.png`;
    const imageUrl = `${tunnel.url}/${pngFile}`;

    const slideId = `slide_${i}`;
    const imageId = `image_${i}`;

    await slides.presentations.batchUpdate({
      presentationId: PRESENTATION_ID,
      requestBody: {
        requests: [
          {
            createSlide: {
              objectId: slideId,
              insertionIndex: i - 1,
              slideLayoutReference: { predefinedLayout: 'BLANK' },
            },
          },
          {
            createImage: {
              objectId: imageId,
              url: imageUrl,
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: 720, unit: 'PT' },
                  height: { magnitude: 405, unit: 'PT' },
                },
                transform: {
                  scaleX: 1, scaleY: 1,
                  translateX: 0, translateY: 0,
                  unit: 'PT',
                },
              },
            },
          },
        ],
      },
    });

    process.stdout.write(`  ✓ ${i}/${totalSlides}\r`);
  }

  // クリーンアップ
  tunnel.close();
  server.close();

  console.log(`\n✅ 完了！ Google Slidesに${totalSlides}枚挿入しました`);
  console.log(`   https://docs.google.com/presentation/d/${PRESENTATION_ID}/edit`);
}

// --- 実行 ---
// 撮影済みPNGがあればスキップ
mkdirSync(TMP_DIR, { recursive: true });
const existingPngs = readdirSync(TMP_DIR, { withFileTypes: true }).filter(f => f.name.endsWith('.png'));
let total;
if (existingPngs.length > 0) {
  total = existingPngs.length;
  console.log(`📸 撮影済み ${total}枚を再利用`);
} else {
  total = await captureSlides();
}
await importToSlides(total);
