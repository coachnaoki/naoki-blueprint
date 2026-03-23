// =====================================================
// Naoki式ライセンス認証API
// スプレッドシート: ライセンス管理シート
// =====================================================

const SPREADSHEET_ID = "1U1qQixd8nPrYi5fs0phX-a8CGYf33nfjGu4RZwvGtZs";
const SHEET_NAME = "ライセンス";

// =====================================================
// Web App エンドポイント (GET)
// ?action=activate&id=XXXX&fp=YYYY  → 初回アクティベーション
// ?action=verify&id=XXXX&fp=YYYY    → 起動時検証
// ?action=issue&name=XXX&email=YYY  → ライセンス発行
// =====================================================
function doGet(e) {
  const action = (e.parameter.action || "").trim();
  const id = (e.parameter.id || "").trim();
  const fp = (e.parameter.fp || "").trim();

  let result;

  switch (action) {
    case "activate":
      result = activateLicense(id, fp);
      break;
    case "verify":
      result = verifyLicense(id, fp);
      break;
    case "issue":
      const name = (e.parameter.name || "").trim();
      const email = (e.parameter.email || "").trim();
      result = issueLicense(name, email);
      break;
    default:
      result = { valid: false, error: "unknown action" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// 行データ取得ヘルパー
// ヘッダー: license_id | name | email | status | expires | activated_at | fingerprint
// =====================================================
function findLicenseRow(sheet, data, licenseId) {
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === licenseId) {
      return {
        rowIndex: i,
        license_id: data[i][0],
        name: data[i][1],
        email: data[i][2],
        status: String(data[i][3]).trim().toLowerCase(),
        expires: data[i][4],
        activated_at: data[i][5],
        fingerprint: String(data[i][6] || "").trim()
      };
    }
  }
  return null;
}

// =====================================================
// 共通チェック（ステータス・有効期限）
// =====================================================
function checkStatusAndExpiry(row) {
  if (row.status !== "active") {
    return { valid: false, error: "このライセンスは無効です（status: " + row.status + "）" };
  }
  if (row.expires) {
    const expiryDate = new Date(row.expires);
    if (expiryDate < new Date()) {
      return { valid: false, error: "有効期限が切れています" };
    }
  }
  return null;
}

// =====================================================
// 初回アクティベーション
// - まだ紐付けされていない → fingerprint記録 → OK
// - 既に同じPCで紐付け済み → OK
// - 別のPCで紐付け済み → 拒否
// =====================================================
function activateLicense(licenseId, fp) {
  if (!licenseId) return { valid: false, error: "ライセンスIDが空です" };
  if (!fp) return { valid: false, error: "マシン情報がありません" };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return { valid: false, error: "シートが見つかりません" };

  const data = sheet.getDataRange().getValues();
  const row = findLicenseRow(sheet, data, licenseId);
  if (!row) return { valid: false, error: "ライセンスIDが見つかりません" };

  const statusErr = checkStatusAndExpiry(row);
  if (statusErr) return statusErr;

  // 既に別のPCで紐付け済み
  if (row.fingerprint && row.fingerprint !== fp) {
    return { valid: false, error: "このライセンスは既に別のPCで使用されています" };
  }

  // 初回 or 同じPC → fingerprint と activated_at を記録
  if (!row.fingerprint) {
    const r = row.rowIndex + 1;
    sheet.getRange(r, 6).setValue(new Date());       // activated_at (F列)
    sheet.getRange(r, 7).setValue(fp);               // fingerprint (G列)
  }

  return { valid: true, name: row.name, license_id: licenseId };
}

// =====================================================
// 起動時検証（毎回オンライン確認）
// - ステータス・有効期限・マシンIDを全チェック
// =====================================================
function verifyLicense(licenseId, fp) {
  if (!licenseId) return { valid: false, error: "ライセンスIDが空です" };
  if (!fp) return { valid: false, error: "マシン情報がありません" };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return { valid: false, error: "シートが見つかりません" };

  const data = sheet.getDataRange().getValues();
  const row = findLicenseRow(sheet, data, licenseId);
  if (!row) return { valid: false, error: "ライセンスIDが見つかりません" };

  const statusErr = checkStatusAndExpiry(row);
  if (statusErr) return statusErr;

  // マシンID不一致
  if (row.fingerprint && row.fingerprint !== fp) {
    return { valid: false, error: "このライセンスは別のPCに紐付けられています" };
  }

  return { valid: true, name: row.name, license_id: licenseId };
}

// =====================================================
// ライセンス発行
// =====================================================
function issueLicense(name, email) {
  const licenseId = generateLicenseId();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["license_id", "name", "email", "status", "expires", "activated_at", "fingerprint"]);
    sheet.getRange("1:1").setFontWeight("bold");
  }

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  sheet.appendRow([licenseId, name || "", email || "", "active", expires, "", ""]);

  return { license_id: licenseId, name: name, expires: expires.toISOString() };
}

// =====================================================
// ライセンスID生成
// =====================================================
function generateLicenseId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts = [];
  for (let p = 0; p < 3; p++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(seg);
  }
  return "NK-" + parts.join("-");
}

// =====================================================
// シート初期化（初回のみ実行）
// =====================================================
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["license_id", "name", "email", "status", "expires", "activated_at", "fingerprint"]);
    sheet.getRange("1:1").setFontWeight("bold");
    Logger.log("「ライセンス」シートを作成しました");
  } else {
    // fingerprint列がなければ追加
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("fingerprint") === -1) {
      sheet.getRange(1, headers.length + 1).setValue("fingerprint").setFontWeight("bold");
      Logger.log("fingerprint列を追加しました");
    }
    Logger.log("「ライセンス」シートは既に存在します");
  }
}

// =====================================================
// テスト用
// =====================================================
function testValidate() {
  const result = activateLicense("TEST-001", "test-fingerprint");
  Logger.log(JSON.stringify(result));
}
