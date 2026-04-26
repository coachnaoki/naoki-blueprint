#!/usr/bin/env node
/**
 * Naoki式 ライセンス Google アカウント連携 (v2.0)
 *
 * 使い方:
 *   node scripts/linkGoogle.mjs NK-XXXX-XXXX-XXXX
 *
 * 動作:
 *   1. PKCE フローで Google OAuth 認証（ブラウザ自動オープン）
 *   2. localhost callback で auth code 受信
 *   3. GAS の oauth_link エンドポイントで token 交換 + ライセンス紐付け
 *   4. refresh_token を .license に追加保存
 *
 * 効果:
 *   - このライセンスは Google アカウントで紐付けられ、最大2台まで使えるようになる
 *   - 既存の fingerprint 認証は維持される（既存 PC は引き続き使える）
 *   - 別 PC から `node scripts/_chk.mjs` を走らせると、紐付けされた Google ID + 2台目スロットで認証される
 */

import { createServer } from "node:http";
import { exec } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import os from "node:os";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const licenseFile = path.join(projectRoot, ".license");

const CLIENT_ID = "894011090900-h4899sisf83avnb636mtl462qp827i2g.apps.googleusercontent.com";
const GAS_URL = "https://script.google.com/macros/s/AKfycbz50xJ-uVfTMgHI4e0FTFa7b21q3S4oMftfI2SidWJPSbC_bhKYkmqFOj_RG0FWYkQe/exec";
const SCOPES = "openid email profile";

const fingerprint = () => {
  const raw = `${os.hostname()}|${os.userInfo().username}|${os.platform()}|${os.arch()}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
};

const generatePKCE = () => {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
};

const successHtml = `
<!doctype html>
<html><head><meta charset="utf-8"><title>認証完了</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff;
         text-align: center; padding-top: 25vh; }
  h1 { color: #22c55e; font-size: 32px; }
  p { color: #94a3b8; }
</style></head><body>
<h1>✅ 認証成功</h1>
<p>このウィンドウを閉じて、ターミナルに戻ってください。</p>
</body></html>`;

const errorHtml = (msg) => `
<!doctype html>
<html><head><meta charset="utf-8"><title>エラー</title>
<style>body { font-family: system-ui; background: #0f172a; color: #fff;
       text-align: center; padding-top: 25vh; } h1 { color: #ef4444; }</style>
</head><body>
<h1>❌ ${String(msg).slice(0, 100)}</h1>
<p>ターミナルで詳細を確認してください。</p>
</body></html>`;

const runPKCEFlow = (licenseId) => {
  return new Promise((resolve, reject) => {
    const state = randomBytes(16).toString("hex");
    const { verifier, challenge } = generatePKCE();
    let port;
    let timeoutHandle;

    const server = createServer((req, res) => {
      const u = new URL(req.url, "http://localhost");
      if (u.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }
      const code = u.searchParams.get("code");
      const errorParam = u.searchParams.get("error");
      const returnedState = u.searchParams.get("state");

      const finish = (cleanup) => {
        clearTimeout(timeoutHandle);
        server.close();
        cleanup();
      };

      if (errorParam) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(errorHtml(errorParam));
        finish(() => reject(new Error(`OAuth エラー: ${errorParam}`)));
        return;
      }
      if (returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(errorHtml("state 不一致 (CSRF 防止)"));
        finish(() => reject(new Error("state 不一致")));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(successHtml);
      finish(() => resolve({ code, verifier, redirect_uri: `http://localhost:${port}/callback` }));
    });

    server.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      const redirectUri = `http://localhost:${port}/callback`;

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");

      process.stdout.write("\x1b[36m🔐 ブラウザで Google ログインを開きます...\x1b[0m\n");
      process.stdout.write(`   ライセンス: \x1b[33m${licenseId}\x1b[0m\n\n`);

      const opener =
        process.platform === "darwin" ? "open" :
        process.platform === "win32" ? "start" : "xdg-open";
      exec(`${opener} "${authUrl.toString()}"`, (err) => {
        if (err) {
          process.stdout.write(`手動でこのURLを開いてください:\n  ${authUrl.toString()}\n\n`);
        }
      });
      process.stdout.write("\x1b[33m⏳ 認証完了を待機中（最大10分）...\x1b[0m\n");
    });

    timeoutHandle = setTimeout(() => {
      server.close();
      reject(new Error("タイムアウト: 10分経過しました"));
    }, 10 * 60 * 1000);
  });
};

(async () => {
  const licenseId = process.argv[2];
  if (!licenseId) {
    process.stderr.write("\x1b[31m✗ ライセンスIDを指定してください\x1b[0m\n");
    process.stderr.write("  node scripts/linkGoogle.mjs NK-XXXX-XXXX-XXXX\n");
    process.exit(1);
  }
  if (!/^NK-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i.test(licenseId)) {
    process.stderr.write("\x1b[31m✗ ライセンスIDの形式が不正です (NK-XXXX-XXXX-XXXX)\x1b[0m\n");
    process.exit(1);
  }

  const fp = fingerprint();

  try {
    const { code, verifier, redirect_uri } = await runPKCEFlow(licenseId);

    process.stdout.write("\n\x1b[33m⏳ ライセンス紐付け中...\x1b[0m\n");

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "oauth_link",
        license_id: licenseId,
        fingerprint: fp,
        code,
        code_verifier: verifier,
        redirect_uri,
      }),
    });
    const result = await res.json();

    if (!result.success) {
      process.stderr.write(`\n\x1b[31m✗ ${result.error}\x1b[0m\n\n`);
      process.exit(1);
    }

    // 既存の .license にマージ（旧方式の fingerprint データを残す）
    let existing = {};
    if (fs.existsSync(licenseFile)) {
      try { existing = JSON.parse(fs.readFileSync(licenseFile, "utf-8")); } catch {}
    }
    const licenseData = {
      ...existing,
      license_id: result.license_id,
      name: result.name,
      fingerprint: fp,
      google_email: result.google_email,
      refresh_token: result.refresh_token,
      slot_used: result.slot_used,
      linked_at: new Date().toISOString(),
    };
    fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2));

    const slotLabel = result.slot_used === "fp2" ? "2台目" : "1台目";
    process.stdout.write("\n\x1b[32m✅ Google 連携完了！\x1b[0m\n\n");
    process.stdout.write(`   名前:        ${result.name}\n`);
    process.stdout.write(`   ライセンス:  ${result.license_id}\n`);
    process.stdout.write(`   Google:      ${result.google_email}\n`);
    process.stdout.write(`   このPC:      ${slotLabel}として登録\n\n`);
    process.stdout.write("\x1b[36m   これで最大2台まで使えるようになりました。\x1b[0m\n");
    process.stdout.write("\x1b[36m   別のPCで使う時は、そのPCで Claude Code を開いて /link-google と入力してください。\x1b[0m\n\n");
  } catch (err) {
    process.stderr.write(`\n\x1b[31m✗ ${err.message}\x1b[0m\n\n`);
    process.exit(1);
  }
})();
