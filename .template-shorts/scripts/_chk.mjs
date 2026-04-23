#!/usr/bin/env node
/* License guard & auto-update - do not modify */
import{createHash as _h}from"crypto";
import{existsSync as _e,readFileSync as _r,writeFileSync as _wf}from"fs";
import{hostname as _hn,userInfo as _ui,platform as _pf,arch as _ar}from"os";
import{dirname as _d,resolve as _rv,join as _j}from"path";
import{fileURLToPath as _fp}from"url";
import{execSync as _ex,spawnSync as _sp}from"child_process";

const __=_d(_fp(import.meta.url));
const _p=_rv(__,"..");
const _lf=_j(_p,".license");
const _k=Buffer.from("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6NTB4Si11VmZUTWdISTRlMEZURmE3YjIxcTNTNG9NZnRmSTJTaWRXSlBTYkNfYmhLWWttcUZPal9SRzBGV1lrUWUvZXhlYw==","base64").toString();
const _g=()=>{const r=`${_hn()}|${_ui().username}|${_pf()}|${_ar()}`;return _h("sha256").update(r).digest("hex").slice(0,16)};

// === AUTO-UPDATE (naoki-blueprint v1.5.5+) ===
// 24h に1回、本体の最新版を自動取得して projects/XXX を同期する
const _autoUpdate=()=>{
  try{
    const root=_rv(_p,"..","..");
    if(!_e(_j(root,".git")))return;
    const cache=_j(_p,".last-update-check");
    const now=Date.now();
    if(_e(cache)){
      const last=parseInt(_r(cache,"utf-8"),10);
      if(!isNaN(last)&&now-last<86400000)return;
    }
    try{_ex("git fetch origin",{cwd:root,stdio:"ignore",timeout:10000});}catch{return;}
    let local,remote;
    try{
      local=_ex("git rev-parse HEAD",{cwd:root}).toString().trim();
      remote=_ex("git rev-parse origin/main",{cwd:root}).toString().trim();
    }catch{return;}
    if(local!==remote){
      let cv="?",nv="?";
      try{cv=_r(_j(root,"VERSION"),"utf-8").trim();}catch{}
      try{nv=_ex("git show origin/main:VERSION",{cwd:root}).toString().trim();}catch{}
      process.stderr.write(`\x1b[33m📦 naoki-blueprint v${cv} → v${nv} に自動更新中...\x1b[0m\n`);
      _sp("bash",[_j(root,"アップデート.sh")],{cwd:root,stdio:"inherit"});
      process.stderr.write(`\x1b[32m✓ 更新完了\x1b[0m\n`);
    }
    try{_wf(cache,String(now));}catch{}
  }catch{}
};

(async()=>{
  _autoUpdate();
  if(!_e(_lf)){
    process.stderr.write("\x1b[31m✗ ライセンス未認証。node scripts/validateLicense.mjs NK-XXXX-XXXX-XXXX を実行してください\x1b[0m\n");
    process.exit(1);
  }
  try{
    const d=JSON.parse(_r(_lf,"utf-8"));
    const fp=_g();
    if(d.fingerprint!==fp){
      process.stderr.write("\x1b[31m✗ 別PCのライセンスです\x1b[0m\n");
      process.exit(1);
    }
    try{
      const r=await fetch(`${_k}?action=verify&id=${encodeURIComponent(d.license_id)}&fp=${fp}`);
      const j=await r.json();
      if(!j.valid){
        process.stderr.write(`\x1b[31m✗ ${j.error}\x1b[0m\n`);
        process.exit(1);
      }
    }catch{}
    process.exit(0);
  }catch{
    process.stderr.write("\x1b[31m✗ .licenseファイルが破損しています\x1b[0m\n");
    process.exit(1);
  }
})();
