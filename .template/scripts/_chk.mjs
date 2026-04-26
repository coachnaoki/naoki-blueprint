#!/usr/bin/env node
/* License guard & auto-update - do not modify */
import{createHash as _h}from"crypto";
import{existsSync as _e,readFileSync as _r,writeFileSync as _wf,readdirSync as _rd,statSync as _st}from"fs";
import{hostname as _hn,userInfo as _ui,platform as _pf,arch as _ar}from"os";
import{dirname as _d,resolve as _rv,join as _j}from"path";
import{fileURLToPath as _fp}from"url";
import{execSync as _ex,spawnSync as _sp}from"child_process";

const __=_d(_fp(import.meta.url));
const _p=_rv(__,"..");
const _lf=_j(_p,".license");
const _k=Buffer.from("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6NTB4Si11VmZUTWdISTRlMEZURmE3YjIxcTNTNG9NZnRmSTJTaWRXSlBTYkNfYmhLWWttcUZPal9SRzBGV1lrUWUvZXhlYw==","base64").toString();
const _g=()=>{const r=`${_hn()}|${_ui().username}|${_pf()}|${_ar()}`;return _h("sha256").update(r).digest("hex").slice(0,16)};

const _rp=async(id)=>{try{const root=_rv(_p,"..","..");const c=_j(_p,".last-rp"),nw=Date.now();if(_e(c)){const l=parseInt(_r(c,"utf-8"),10);if(!isNaN(l)&&Math.abs(nw-l)<86400000)return;}try{_wf(c,String(nw));}catch{}let v="?";try{v=_r(_j(root,"VERSION"),"utf-8").trim();}catch{}await fetch(_k,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"rp",license_id:id,version:v}),signal:AbortSignal.timeout(3000)});}catch{}};

// === AUTO-UPDATE (naoki-blueprint v1.5.5+, hardened v1.5.6) ===
// 各 step 実行前に呼ばれる。24h に1回だけ本体の最新版を取得して projects/XXX を同期する。
// 失敗時は静かにスキップするが、致命的なエラーは簡易メッセージを出す。
const _autoUpdate=async()=>{
  try{
    const root=_rv(_p,"..","..");
    if(!_e(_j(root,".git")))return;
    const cache=_j(_p,".last-update-check");
    const now=Date.now();

    // 1) キャッシュチェック（未来時刻も考慮して Math.abs）
    if(_e(cache)){
      const last=parseInt(_r(cache,"utf-8"),10);
      if(!isNaN(last)&&Math.abs(now-last)<86400000)return;
    }

    // 2) 先にキャッシュを書く（失敗ループ防止: ネット不調で毎step待ちになるのを回避）
    try{_wf(cache,String(now));}catch{}

    // 3) git fetch（タイムアウト10秒、失敗時はスキップ）
    try{_ex("git fetch origin",{cwd:root,stdio:"ignore",timeout:10000});}catch{return;}

    // 3.5) アップデート権限 + version_track 取得（v1 → main, v2 → v2.0）
    let targetBranch="main";
    if(_e(_lf)){try{const d=JSON.parse(_r(_lf,"utf-8"));const fp=_g();const r=await fetch(`${_k}?action=check_update&id=${encodeURIComponent(d.license_id)}&fp=${fp}`,{signal:AbortSignal.timeout(5000)});const j=await r.json();if(j.update_allowed===false)return;if(j.version_track==="v2")targetBranch="v2.0";}catch{}}

    // 4) HEAD と origin/${targetBranch} を比較
    let local,remote;
    try{
      local=_ex("git rev-parse HEAD",{cwd:root}).toString().trim();
      remote=_ex(`git rev-parse origin/${targetBranch}`,{cwd:root}).toString().trim();
    }catch{return;}
    if(local===remote)return;

    // 5) バージョン取得
    let cv="?",nv="?";
    try{cv=_r(_j(root,"VERSION"),"utf-8").trim();}catch{}
    try{nv=_ex(`git show origin/${targetBranch}:VERSION`,{cwd:root}).toString().trim();}catch{}

    process.stderr.write(`\x1b[33m📦 naoki-blueprint v${cv} → v${nv} に自動更新中... (${targetBranch})\x1b[0m\n`);

    // 6) アップデート.sh を /tmp/ にコピーしてから実行（自己書き換え問題の回避）
    //    git reset --hard でスクリプト自身が書き換わる可能性があるため、
    //    必ず別パスにコピーしたものを実行する
    const tmpScript=`/tmp/naoki-blueprint-update-${process.pid}-${now}.sh`;
    try{
      _ex(`cp "${_j(root,"アップデート.sh")}" "${tmpScript}"`,{stdio:"ignore"});
      const result=_sp("bash",[tmpScript,targetBranch],{cwd:root,stdio:"inherit"});
      if(result.status!==0){
        process.stderr.write(`\x1b[31m⚠ アップデートスクリプトが異常終了しました (exit ${result.status})\x1b[0m\n`);
      }else{
        process.stderr.write(`\x1b[32m✓ 更新完了\x1b[0m\n`);
      }
    }catch(err){
      process.stderr.write(`\x1b[31m⚠ 自動更新に失敗: ${err.message}\x1b[0m\n`);
    }finally{
      try{_ex(`rm -f "${tmpScript}"`,{stdio:"ignore"});}catch{}
    }
  }catch(err){
    // 全体的な失敗: 受講生が気づけるよう薄めの表示（step実行自体は継続）
    try{process.stderr.write(`\x1b[2m（自動更新チェックをスキップ: ${err.message}）\x1b[0m\n`);}catch{}
  }
};

(async()=>{
  await _autoUpdate();
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
    await _rp(d.license_id);
    process.exit(0);
  }catch{
    process.stderr.write("\x1b[31m✗ .licenseファイルが破損しています\x1b[0m\n");
    process.exit(1);
  }
})();
