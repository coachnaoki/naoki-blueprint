#!/usr/bin/env node
/* ================================================================
 * License validation - Naoki式 動画編集テンプレート
 * このファイルを改変した場合、ライセンスは即時無効となります。
 * 改変の検出は自動的に行われます。
 * ================================================================ */
import{createHash as _h}from"crypto";import{existsSync as _e,readFileSync as _r,writeFileSync as _w,unlinkSync as _u}from"fs";import{hostname as _hn,userInfo as _ui,platform as _pf,arch as _ar}from"os";import{dirname as _d,resolve as _rv,join as _j}from"path";import{fileURLToPath as _fp}from"url";
const _=(s)=>Buffer.from(s,"base64").toString();const __=_d(_fp(import.meta.url));const _p=_rv(__,"..");const _lf=_j(_p,".license");
const _k=[_("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6NTB4Si11VmZUTWdISTRlMEZURmE3YjIxcTNTNG9NZnRmSTJTaWRXSlBTYkNfYmhLWWttcUZPal9SRzBGV1lrUWUvZXhlYw==")];
const _g=()=>{const r=`${_hn()}|${_ui().username}|${_pf()}|${_ar()}`;return _h("sha256").update(r).digest("hex").slice(0,16)};
const _c=async(a,p)=>{try{const r=await fetch(`${_k[0]}?${new URLSearchParams(p)}`);return await r.json()}catch{return null}};
const _v=async(d,fp)=>{const r=await _c("v",{action:"verify",id:d.license_id,fp});if(r&&!r.valid){process.stderr.write(`\x1b[31m✗ ${r.error}\x1b[0m\n`);try{_u(_lf)}catch{};return false}return true};
const _s=(n)=>{const t=_h("sha256").update(_r(_j(__,"validateLicense.mjs"))).digest("hex");const x=_h("sha256");x.update(t);x.update(n);return x.digest("hex").slice(0,8)};
(async()=>{const fp=_g();if(_e(_lf)){try{const d=JSON.parse(_r(_lf,"utf-8"));if(d.fingerprint!==fp){process.stderr.write("\x1b[31m✗ このライセンスは別のPCで認証されています\x1b[0m\n");process.exit(1)}const vr=await _v(d,fp);if(!vr)process.exit(1);process.stdout.write(`\x1b[32m✓ ${d.name}（${d.license_id}）\x1b[0m\n`);process.exit(0)}catch{}}const id=process.argv[2];if(!id){process.stderr.write("\x1b[31m✗ ライセンスIDを指定してください\x1b[0m\n");process.stderr.write("  node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX\n");process.exit(1)}process.stdout.write(`\x1b[33m⟳ 認証中: ${id}\x1b[0m\n`);const r=await _c("a",{action:"activate",id,fp});if(!r){process.stderr.write("\x1b[31m✗ 通信エラー\x1b[0m\n");process.exit(1)}if(r.valid){_w(_lf,JSON.stringify({license_id:r.license_id,name:r.name,fingerprint:fp,activated_at:new Date().toISOString(),_ck:_s(r.license_id)}));process.stdout.write(`\x1b[32m✓ 認証成功！ようこそ ${r.name} さん\x1b[0m\n`);process.exit(0)}else{process.stderr.write(`\x1b[31m✗ ${r.error}\x1b[0m\n`);process.exit(1)}})();
