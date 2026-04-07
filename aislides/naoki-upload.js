#!/usr/bin/env node
/**
 * Naoki式セミナーのPNGをGoogle Driveにアップロード
 */
const { google } = require('/Users/kobayashinaoki/Desktop/7_AI/Cursor/gas-slides-gen/node_modules/googleapis');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, 'naoki-slides-output');
const TOTAL = 45;

// clasp認証情報を再利用
const clasprc = JSON.parse(fs.readFileSync(path.join(require('os').homedir(), '.clasprc.json'), 'utf-8'));
const tokens = clasprc.tokens.default;

const oauth2Client = new google.auth.OAuth2(
  tokens.client_id,
  tokens.client_secret,
);
oauth2Client.setCredentials({
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  token_type: tokens.token_type,
  expiry_date: tokens.expiry_date,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function main() {
  // 1. Google Driveにフォルダ作成
  console.log('📁 Driveフォルダ作成中...');
  const folder = await drive.files.create({
    requestBody: {
      name: 'naoki-seminar-slides',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  const folderId = folder.data.id;
  console.log(`✅ フォルダ作成: ${folderId}`);

  // 2. PNGをアップロード
  console.log('\n📤 画像アップロード中...');
  for (let i = 1; i <= TOTAL; i++) {
    const filename = `slide-${String(i).padStart(2, '0')}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: 'image/png',
        body: fs.createReadStream(filepath),
      },
      fields: 'id',
    });

    // 公開リンクを設定
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    process.stdout.write(`✓ ${filename}  `);
    if (i % 5 === 0) console.log('');
  }

  console.log(`\n\n🎉 アップロード完了！`);
  console.log(`📁 フォルダID: ${folderId}`);
  console.log(`このIDをGASスクリプトのDRIVE_FOLDER_IDに設定してください`);
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
