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
// ?action=sign&name=XXX&email=YYY   → 署名受付
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
    case "sign":
      result = recordSignature({
        name: (e.parameter.name || "").trim(),
        email: (e.parameter.email || "").trim(),
        address: (e.parameter.address || "").trim()
      });
      break;
    default:
      result = { valid: false, error: "unknown action" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// POST: 署名受付
// =====================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = (data.action || "").trim();

    if (action === "sign") {
      const result = recordSignature(data);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: "unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =====================================================
// 署名を記録
// =====================================================
function recordSignature(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const SIGN_SHEET = "署名";
  let sheet = ss.getSheetByName(SIGN_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(SIGN_SHEET);
    sheet.appendRow(["signed_at", "name", "email", "address", "agreed"]);
    sheet.getRange("1:1").setFontWeight("bold");
  }

  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const address = (data.address || "").trim();

  if (!name) return { success: false, error: "氏名が入力されていません" };
  if (!email) return { success: false, error: "メールアドレスが入力されていません" };

  sheet.appendRow([new Date(), name, email, address, "同意済み"]);

  return { success: true, name: name };
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
  expires.setMonth(expires.getMonth() + 1);

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
// スプレッドシートメニュー
// =====================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("★ライセンス管理")
    .addItem("新しいライセンスを発行", "menuIssueLicense")
    .addItem("ライセンスを無効化", "menuDeactivateLicense")
    .addItem("PC紐付けを解除", "menuResetFingerprint")
    .addToUi();
}

// =====================================================
// メニュー: 新しいライセンスを発行
// =====================================================
function menuIssueLicense() {
  const ui = SpreadsheetApp.getUi();

  const nameResult = ui.prompt("ライセンス発行 (1/2)", "受講生の名前:", ui.ButtonSet.OK_CANCEL);
  if (nameResult.getSelectedButton() !== ui.Button.OK) return;
  const name = nameResult.getResponseText().trim();
  if (!name) { ui.alert("名前を入力してください"); return; }

  const emailResult = ui.prompt("ライセンス発行 (2/2)", "メールアドレス（空欄OK）:", ui.ButtonSet.OK_CANCEL);
  if (emailResult.getSelectedButton() !== ui.Button.OK) return;
  const email = emailResult.getResponseText().trim();

  const result = issueLicense(name, email);

  ui.alert(
    "ライセンス発行完了",
    "名前: " + name + "\n"
    + "ID: " + result.license_id + "\n"
    + "有効期限: " + new Date(result.expires).toLocaleDateString("ja-JP") + "\n\n"
    + "このIDを受講生にお渡しください",
    ui.ButtonSet.OK
  );
}

// =====================================================
// メニュー: ライセンスを無効化
// =====================================================
function menuDeactivateLicense() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt("ライセンス無効化", "無効にするライセンスID:", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const licenseId = result.getResponseText().trim();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { ui.alert("シートが見つかりません"); return; }

  const data = sheet.getDataRange().getValues();
  const row = findLicenseRow(sheet, data, licenseId);
  if (!row) { ui.alert("ライセンスIDが見つかりません"); return; }

  sheet.getRange(row.rowIndex + 1, 4).setValue("inactive");
  ui.alert("無効化完了", row.name + " のライセンス（" + licenseId + "）を無効にしました", ui.ButtonSet.OK);
}

// =====================================================
// メニュー: PC紐付けを解除（PC変更時に使用）
// =====================================================
function menuResetFingerprint() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt("PC紐付け解除", "解除するライセンスID:", ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const licenseId = result.getResponseText().trim();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { ui.alert("シートが見つかりません"); return; }

  const data = sheet.getDataRange().getValues();
  const row = findLicenseRow(sheet, data, licenseId);
  if (!row) { ui.alert("ライセンスIDが見つかりません"); return; }

  sheet.getRange(row.rowIndex + 1, 6).setValue("");  // activated_at
  sheet.getRange(row.rowIndex + 1, 7).setValue("");  // fingerprint
  ui.alert("解除完了", row.name + " のPC紐付けを解除しました。\n新しいPCで再認証できます。", ui.ButtonSet.OK);
}

// =====================================================
// 利用規約ドキュメント更新
// GASエディタから updateTermsDoc() を実行
// =====================================================
function updateTermsDoc() {
  const DOC_ID = "1WjpWnquIB6K4RrJefsEUpjmkI0GsavYMKA6kMfZPacE";
  const doc = DocumentApp.openById(DOC_ID);
  const body = doc.getBody();

  // 本文をクリア
  body.clear();

  // --- タイトル ---
  body.appendParagraph("スキルファイル利用規約")
    .setHeading(DocumentApp.ParagraphHeading.HEADING1)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("AI動画編集 完全習得プログラム ｜ 株式会社Woda")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .editAsText().setFontSize(12).setBold(true);

  body.appendParagraph("");

  body.appendParagraph('本規約は、株式会社Woda（以下「当社」）が提供する「AI動画編集 完全習得プログラム」（以下「本プログラム」）において受講生に配布される、小林 尚貴（以下「権利者」）が制作したスキルファイル（マークダウンファイル、コマンドファイル、CLAUDE.md、SKILL.md、その他Claude Code用設定ファイルを含む。以下「本スキルファイル」）の利用条件を定めるものです。');

  body.appendParagraph("");

  body.appendParagraph("本スキルファイルをダウンロードまたは受領した時点で、本規約に同意したものとみなします。");

  body.appendParagraph("");

  // --- 第1条 ---
  body.appendParagraph("第1条（定義）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('1. 「本スキルファイル」とは、権利者が制作し、当社が本プログラムの受講生に対して配布する、Claude Code等のAIエージェントで利用するためのマークダウンファイル（.mdファイル）、コマンドファイル、設定ファイル、スクリプトファイルおよびこれらに付随する一切のデータをいいます。');
  body.appendParagraph('2. 「受講生」とは、本プログラムに正規に申し込み、受講料を支払った個人をいいます。');
  body.appendParagraph('3. 「ライセンスID」とは、各受講生に発行される固有の識別子（NK-XXXX-XXXX-XXXX形式）をいい、本スキルファイルの利用認証に使用されます。');
  body.appendParagraph('4. 「マシン紐付け」とは、ライセンスIDと受講生のPC固有情報を関連付け、認証済みのPC以外での利用を制限する仕組みをいいます。');

  body.appendParagraph("");

  // --- 第2条 ---
  body.appendParagraph("第2条（利用許諾の範囲）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 権利者は、受講生に対し、以下の範囲で本スキルファイルの利用を許諾します。");
  body.appendParagraph("　・受講生本人が自身の業務または個人利用目的でClaude Code等のAIエージェントに適用すること");
  body.appendParagraph("　・受講生本人が自身の開発環境内で本スキルファイルを複製・改変すること");
  body.appendParagraph("2. 前項の利用許諾は、非独占的かつ譲渡不能とします。");
  body.appendParagraph("3. 利用許諾の有効期間は、ライセンスID発行日から1ヶ月間とします。");
  body.appendParagraph("4. 有効期間満了後も継続して利用を希望する場合は、権利者（小林 尚貴）に直接お問い合わせください。権利者の承認を得た上で、利用期間を更新することができます。");
  body.appendParagraph("5. 本スキルファイルに関する利用許諾、変更、取消しに関する一切の権限は、権利者が単独で保有します。");

  body.appendParagraph("");

  // --- 第3条 ---
  body.appendParagraph("第3条（禁止事項）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("受講生は、本スキルファイルについて、以下の行為を行ってはなりません。");
  body.appendParagraph("");
  body.appendParagraph("1. 第三者への譲渡、貸与、配布、送信、共有（SNS、メール、チャット、クラウドストレージ等の手段を問わない）");
  body.appendParagraph("2. 第三者が閲覧可能な場所への公開（GitHub等のパブリックリポジトリ、Webサイト、ブログ、掲示板等を含む）");
  body.appendParagraph("3. 本スキルファイルの内容を実質的に複製した教材、テンプレート、スキルファイル等を作成し、第三者に提供する行為");
  body.appendParagraph("4. 本スキルファイルを利用した有償・無償を問わない講座、セミナー、コンサルティング等の運営");
  body.appendParagraph("5. ライセンスIDの第三者への共有、または認証システムの回避・無効化を試みる行為");
  body.appendParagraph("6. 受講生が所属する法人・団体の社内（従業員・業務委託先・関連会社を含む）における共有・配布。社内利用を希望される場合は、利用者ご本人に本プログラムへの参加をお願いしております");
  body.appendParagraph("7. 本規約に違反する態様での一切の利用");

  body.appendParagraph("");

  // --- 第4条 ---
  body.appendParagraph("第4条（ライセンス認証による管理）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 本スキルファイルの利用には、権利者が発行するライセンスIDによる認証が必要です。");
  body.appendParagraph("2. ライセンスIDは初回認証時に受講生のPCに紐付けられ、認証済みのPC以外では利用できません。");
  body.appendParagraph("3. 権利者は、発行したすべてのライセンスIDについて、受講生情報（氏名・メールアドレス）およびマシン紐付け情報の対応記録を保持します。");
  body.appendParagraph("4. 本スキルファイルが不正に流出・配布された場合、権利者はライセンスIDをもとに流出元の受講生を特定することができます。");
  body.appendParagraph("5. 受講生は、ライセンス認証およびマシン紐付けによる管理が行われていることを了承した上で、本スキルファイルを受領するものとします。");
  body.appendParagraph("6. PCの買い替え等により紐付けの解除が必要な場合は、権利者に申請することで再認証が可能です。");

  body.appendParagraph("");

  // --- 第5条 ---
  body.appendParagraph("第5条（知的財産権）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 本スキルファイルに関する著作権その他一切の知的財産権は、権利者に帰属します。");
  body.appendParagraph("2. 第2条に定める利用許諾は、本スキルファイルに関する知的財産権の移転を意味するものではありません。");
  body.appendParagraph("3. 当社は本プログラムの運営者であり、本スキルファイルの知的財産権を保有するものではありません。");

  body.appendParagraph("");

  // --- 第6条 ---
  body.appendParagraph("第6条（個人情報の取り扱い）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 権利者は、本スキルファイルの配布管理のために受講生のメールアドレスおよび氏名を取得・保持します。");
  body.appendParagraph("2. 取得した個人情報は、以下の目的でのみ使用し、法令に基づく場合を除き第三者に開示しません。");
  body.appendParagraph("　・本スキルファイルの配布およびライセンス管理");
  body.appendParagraph("　・不正利用が発覚した場合の流出元の特定");
  body.appendParagraph("　・本プログラムに関するご連絡");

  body.appendParagraph("");

  // --- 第7条 ---
  body.appendParagraph("第7条（違反時の措置）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 受講生が本規約に違反した場合、権利者は以下の措置を取ることができます。");
  body.appendParagraph("　・ライセンスIDの即時無効化");
  body.appendParagraph("　・本プログラムのサポートサービスの即時停止");
  body.appendParagraph("　・会員サイトおよび作業会参加者限定グループチャットへのアクセス権の剥奪");
  body.appendParagraph("　・違反行為の差止め請求");
  body.appendParagraph("　・損害賠償の請求");
  body.appendParagraph("2. 前項の損害賠償には、権利者が被った直接的損害のほか、調査費用、弁護士費用、逸失利益を含むものとします。");

  body.appendParagraph("");

  // --- 第8条 ---
  body.appendParagraph("第8条（免責事項）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 権利者は、本スキルファイルの利用により受講生が得る成果について、いかなる保証もいたしません。");
  body.appendParagraph("2. 本スキルファイルはAIエージェントの動作を補助するものであり、AIエージェントの仕様変更等により意図した動作をしなくなる場合があります。");

  body.appendParagraph("");

  // --- 第9条 ---
  body.appendParagraph("第9条（規約の変更）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("権利者は、必要に応じて本規約を変更できるものとします。変更後の規約は、権利者所定の方法で受講生に通知した時点から効力を生じるものとします。");

  body.appendParagraph("");

  // --- 第10条 ---
  body.appendParagraph("第10条（準拠法・管轄裁判所）").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. 本規約は日本法に準拠し、日本法に従い解釈されるものとします。");
  body.appendParagraph("2. 本規約に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。");

  body.appendParagraph("");
  body.appendParagraph("");

  body.appendParagraph("制定日：2026年3月24日").editAsText().setBold(true);
  body.appendParagraph("権利者：小林 尚貴").editAsText().setBold(true);

  body.appendParagraph("");
  body.appendParagraph("");

  // --- 同意書 ---
  body.appendParagraph("【同意書】")
    .setHeading(DocumentApp.ParagraphHeading.HEADING1)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("");

  body.appendParagraph("私は、上記「スキルファイル利用規約」の全条項を確認・理解した上で、これに同意し、本スキルファイルの受領を希望します。");

  body.appendParagraph("");
  body.appendParagraph("");

  body.appendParagraph("日付：");
  body.appendParagraph("");
  body.appendParagraph("住所：");
  body.appendParagraph("");
  body.appendParagraph("氏名（署名）：");
  body.appendParagraph("");
  body.appendParagraph("メールアドレス：");

  body.appendParagraph("");
  body.appendParagraph("");

  body.appendParagraph("※ 本同意書の提出をもって、ライセンスIDを発行いたします。")
    .editAsText().setFontSize(10).setItalic(true);

  doc.saveAndClose();
  Logger.log("利用規約ドキュメントを更新しました: https://docs.google.com/document/d/" + DOC_ID);
}
