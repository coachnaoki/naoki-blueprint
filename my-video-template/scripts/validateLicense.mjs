#!/usr/bin/env node
// =====================================================
// Naoki式ライセンス認証スクリプト
// 使い方: node scripts/validateLicense.mjs <LICENSE_ID>
// =====================================================

import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const LICENSE_FILE = path.join(PROJECT_ROOT, ".license");

const API_URL = "https://script.google.com/macros/s/AKfycbz50xJ-uVfTMgHI4e0FTFa7b21q3S4oMftfI2SidWJPSbC_bhKYkmqFOj_RG0FWYkQe/exec";

// =====================================================
// マシンフィンガープリント生成
// hostname + username + platform のハッシュ
// =====================================================
function getMachineFingerprint() {
  const raw = `${os.hostname()}|${os.userInfo().username}|${os.platform()}|${os.arch()}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

// =====================================================
// メイン
// =====================================================
async function main() {
  const fingerprint = getMachineFingerprint();

  // 既に認証済みかチェック
  if (fs.existsSync(LICENSE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LICENSE_FILE, "utf-8"));

      // マシンフィンガープリントが一致するか確認
      if (data.fingerprint !== fingerprint) {
        console.error("❌ このライセンスは別のPCで認証されています");
        console.error("   .license ファイルを削除して再認証してください");
        process.exit(1);
      }

      // オンライン検証（ステータス・有効期限の確認）
      try {
        const url = `${API_URL}?action=verify&id=${encodeURIComponent(data.license_id)}&fp=${fingerprint}`;
        const res = await fetch(url);
        const result = await res.json();

        if (!result.valid) {
          console.error(`❌ ライセンス無効: ${result.error}`);
          fs.unlinkSync(LICENSE_FILE);
          process.exit(1);
        }
      } catch {
        // オフライン時はローカルの .license を信頼
      }

      console.log(`✅ 認証済み: ${data.name}（${data.license_id}）`);
      process.exit(0);
    } catch {
      // ファイル破損 → 再認証
    }
  }

  // 引数からライセンスIDを取得
  const licenseId = process.argv[2];
  if (!licenseId) {
    console.error("❌ ライセンスIDを指定してください");
    console.error("   node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX");
    process.exit(1);
  }

  // API認証（アクティベーション）
  console.log(`🔑 認証中: ${licenseId} ...`);

  try {
    const url = `${API_URL}?action=activate&id=${encodeURIComponent(licenseId)}&fp=${fingerprint}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.valid) {
      const licenseData = {
        license_id: data.license_id,
        name: data.name,
        fingerprint: fingerprint,
        activated_at: new Date().toISOString(),
      };
      fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2));
      console.log(`✅ 認証成功！ようこそ ${data.name} さん`);
      console.log(`   このPCに紐付けられました`);
      process.exit(0);
    } else {
      console.error(`❌ 認証失敗: ${data.error}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ 通信エラー: ${e.message}`);
    process.exit(1);
  }
}

main();
