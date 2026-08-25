'use strict';
/* VELOUR V4.4.38 hotfix
   - keep response-vault acceptance
   - stop VELOUR's own minor-stage / age-firewall prompt from overriding current canon
   - do not alter Gemini/provider safety settings
*/
(() => {
  'use strict';
  if (window.__VELOUR_VAULT_ACCEPT_HOTFIX__) return;
  window.__VELOUR_VAULT_ACCEPT_HOTFIX__ = true;
  window.__VELOUR_HOTFIX_VERSION__ = '7-no-minor-stage-override';

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa) { console.error('VELOUR hotfix: QA bridge not found'); return; }
  const RESPONSE_STORE = 'responses';
  const nEp = v => { const n = Number(v || 0); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };
  const snapshot = () => { try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; } catch (_) { return {}; } };

  function parseMeta(raw){
    const s=String(raw||''),a=s.indexOf('[[VELOUR_V4_META]]'); if(a<0)return null;
    const z=s.indexOf('[[/VELOUR_V4_META]]',a),x=(z>=0?s.slice(a+18,z):s.slice(a+18)).trim();
    try{return JSON.parse(x)}catch(_){return null}
  }
  function pendingEpisode(){try{return nEp(qa.pendingRetryEpisode?.())}catch(_){return 0}}
  function confirmedEpisode(){try{const n=Number(qa.confirmedEpisode?.()||0);return Number.isFinite(n)&&n>=0?Math.floor(n):0}catch(_){return 0}}
  function isAcceptableRecord(r){
    const ep=nEp(r?.attemptedEpisode),text=String(r?.readerText||r?.rawText||'').trim();
    if(!ep||!text)return false;
    if(String(r?.finishReason||'').toUpperCase()==='SAFETY'||String(r?.promptBlock||'').trim())return false;
    const p=pendingEpisode(),c=confirmedEpisode(); return ep===c+1&&(p===0||p===ep);
  }
  function guardedMeta(meta){
    if(!meta||typeof meta!=='object')return null;
    const m=JSON.parse(JSON.stringify(meta));
    m.ageStageViolation=false;
    if(m.canonViolation||m.storylineSkipped||m.futureBeatLeak||m.residenceViolation||m.expressionViolation||m.professionalBoundaryViolation)m.beatComplete=false;
    return m;
  }

  async function acceptVelourVaultResponse(id,options={}){
    let r=null;
    try{r=await qa.responseVaultGet(RESPONSE_STORE,String(id))}catch(e){if(!options.silent)alert('응답 금고를 읽지 못했어: '+String(e?.message||e));return false}
    if(!r){if(!options.silent)alert('응답 금고에서 해당 본문을 찾지 못했어.');return false}
    const ep=nEp(r.attemptedEpisode);
    if(!isAcceptableRecord(r)){if(!options.silent)alert(`이 응답은 현재 이어쓰기 위치에 붙일 수 없어.\n현재 확정: EP.${confirmedEpisode()}\n선택 응답: EP.${ep||'-'}`);return false}
    const clean=String(r.readerText||'').trim();
    if(!options.silent&&!confirm(`EP.${String(ep).padStart(2,'0')} 미확정 응답을 정식 본문으로 채택할까?\n\n✓ 새 Gemini 요청 없음\n✓ 현재 본문을 EP.${ep}로 확정\n✓ 다음 화는 EP.${ep+1}부터 진행`))return false;
    try{
      let history=''; try{history=String(storyHistory||'')}catch(_){}
      const norm=history.replace(/\s+/g,' ').trim(),tail=clean.slice(-320).replace(/\s+/g,' ').trim();
      if(!norm||!tail||!norm.includes(tail))history=history.trim()?history.trimEnd()+'\n\n'+clean:clean;
      try{storyHistory=history}catch(_){} try{episodeCount=ep}catch(_){}
      const meta=guardedMeta(parseMeta(r.rawText||'')); qa.rememberConfirmedEpisode?.(ep,false); qa.clearPendingRetryEpisode?.(); if(meta)qa.updateMemory?.(meta,ep);
      const novel=document.getElementById('novelText'),title=document.getElementById('resultTitle'),panel=document.getElementById('resultPanel'),counter=document.getElementById('v35CharCount'),next=document.getElementById('btnNext'),dir=document.getElementById('v33Next');
      if(novel)novel.innerText=clean; if(title)title.innerText=`EPISODE ${String(ep).padStart(2,'0')}`; if(panel)panel.style.display='block'; if(next)next.style.display='block'; if(dir)dir.value='';
      document.getElementById('velourHardLockReviewNotice')?.remove(); const da=document.getElementById('velourGenerationDiagnosticActions'); if(da)da.style.display='none';
      qa.markGenerationOutcome?.('committed',{episode:ep,attemptedEpisode:ep,userAcceptedVault:!options.silent,responseVaultId:String(r.id||id)});
      if(counter){counter.style.color='#bca7b2';counter.textContent=`본문 ${clean.length.toLocaleString()}자 · 확정 · ENGINE V4.4.38`}
      try{await window.__VELOUR_IDB_SAVE_DRAFT__?.()}catch(e){console.warn('VELOUR vault save warning',e)}
      try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(window.__VELOUR_V4_STATE_SNAPSHOT__?.())}catch(_){}
      const modal=document.getElementById('velourResponseVaultModal'); if(modal)modal.style.display='none';
      if(!options.silent){panel?.scrollIntoView({behavior:'smooth',block:'start'});alert(`✓ EP.${String(ep).padStart(2,'0')}로 확정했어.`)}
      return true;
    }catch(e){console.error('VELOUR vault accept failed',e);if(!options.silent)alert('응답 채택 중 오류: '+String(e?.message||e));return false}
  }
  window.acceptVelourVaultResponse=acceptVelourVaultResponse;

  const originalShowVault=window.showVelourResponseVault;
  if(typeof originalShowVault==='function')window.showVelourResponseVault=async function(){
    await originalShowVault.apply(this,arguments);
    const list=document.getElementById('velourVaultList'); if(!list)return;
    let rows=[]; try{rows=await qa.responseVaultAll(RESPONSE_STORE)}catch(_){return}
    rows.sort((a,b)=>String(b.receivedAt||'').localeCompare(String(a.receivedAt||'')));
    const cards=Array.from(list.children);
    rows.forEach((r,i)=>{
      const card=cards[i]; if(!card||!isAcceptableRecord(r))return;
      const actions=card.lastElementChild; if(!actions||actions.querySelector('[data-vault-accept]'))return;
      const btn=document.createElement('button'); btn.type='button'; btn.dataset.vaultAccept='1'; btn.textContent='✓ 이 응답으로 확정';
      btn.style.cssText='flex:1;border:1px solid rgba(126,224,160,.35);background:rgba(90,200,130,.10);color:#bff4cf;border-radius:8px;padding:7px;font-size:9.5px;font-weight:800';
      btn.onclick=()=>acceptVelourVaultResponse(r.id); actions.prepend(btn);
    });
  };

  function beatsFromState(s){
    return String(s?.storyline||'').split(/\n+/).map(x=>x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/,'').trim()).filter(Boolean);
  }
  function explicitCanonStage(text,max){
    const s=String(text||'');
    for(const rx of [/(?:캐논|CANON)(?:\s*스토리라인)?[^\d]{0,18}(\d+)\s*단계/i,/(?:스토리라인|storyline)[^\d]{0,18}(\d+)\s*단계/i,/(\d+)\s*단계\s*(?:캐논|CANON)/i]){
      const n=Number(s.match(rx)?.[1]||0); if(n>=1&&n<=max)return n-1;
    }
    return -1;
  }
  function currentCanonContext(s){
    const userNext=String(document.getElementById('v33Next')?.value||'').trim(),beats=beatsFromState(s),stored=Math.max(0,Number(s?.beatIndex||0)),explicit=explicitCanonStage(userNext,beats.length),index=explicit>=0?explicit:Math.min(stored,Math.max(0,beats.length-1));
    return {userNext,beats,index,currentBeat:beats[index]||''};
  }
  function removeBracketBlock(text,headerRx){
    const lines=String(text||'').split('\n'),out=[]; let skipping=false;
    for(const line of lines){const t=line.trim(); if(!skipping&&headerRx.test(t)){skipping=true;continue} if(skipping&&/^\[[^\]]+\]/.test(t))skipping=false; if(!skipping)out.push(line)}
    return out.join('\n');
  }
  function stripAppMinorControls(prompt){
    let out=String(prompt||'');
    out=removeBracketBlock(out,/^\[AGE\/TIMELINE HARD LOCK\b/i);
    out=out
      .replace(/^\[연령 안전 원칙\].*$/gmi,'')
      .replace(/^.*(?:성장 단계 CLEAN ROOM|MINOR-STAGE CLEAN ROOM|AGE FIREWALL).*$/gmi,'')
      .replace(/^\s*-?\s*\[연령 단계 유지[^\]]*\].*$/gmi,'')
      .replace(/^\s*-\s*현재 연령\/학년 앵커:.*$/gmi,'')
      .replace(/^\s*-\s*현재 장면의 연령\/학년 앵커:.*$/gmi,'')
      .replace(/^\s*-\s*현재가 유년\/중학생\/고등학생 단계면.*$/gmi,'')
      .replace(/^\s*-\s*현재 단계가 성인 이전이면.*$/gmi,'')
      .replace(/^\s*-\s*안전 격리는 민감 상세만.*$/gmi,'')
      .replace(/^\s*-\s*UI에 저장된 이후 시점의 나이·대학·직업 프로필.*$/gmi,'')
      .replace(/^\s*-\s*현재 단계의 완료 조건이 충분히 쌓이기 전에는 다음 연령\/학년.*$/gmi,'')
      .replace(/^\s*-\s*현재는 성인 이전 성장 단계일 수 있다\..*$/gmi,'')
      .replace(/^\s*-\s*현재 단계의 학교·가정·친구·동네·가족.*$/gmi,'')
      .replace(/^\s*-\s*사용자가 현재 단계에서 직접 시간 전환을 지시하지 않았다면.*$/gmi,'')
      .replace(/^\s*-\s*현재는 .*?단계다\. UI의 성인 직업\/대학 전공은 미래 프로필.*$/gmi,'')
      .replace(/^\s*- ([AB]) 성인 시기 프로필\(미래 참고값 · 현재 단계 적용 금지\): (.*?) \/ 신분 (.*?)\.$/gm,'- $1: $2 / 신분 $3.')
      .replace(/\n{3,}/g,'\n\n').trim();
    return out;
  }
  function identityAnchor(s,prompt){
    const sources=[String(s?.hardCanon||''),String(document.getElementById('inputChars')?.value||''),String(document.getElementById('inputPlot')?.value||'')].filter(Boolean).join('\n');
    const rows=sources.split(/\n+/).map(x=>x.trim()).filter(Boolean),picked=[],seen=new Set();
    const rx=/(?:남주|여주|주인공|A\s*[:：]|B\s*[:：]|이름\s*[:：]|성명\s*[:：]|본명\s*[:：]|성씨\s*[:：]|나이\s*[:：]|직업\s*[:：]|신분\s*[:：]|가족\s*[:：]|형제|자매|오빠|언니|누나|형\b|부모|출신\s*[:：]|고향\s*[:：]|호칭\s*[:：])/i;
    for(const row of rows){if(!rx.test(row))continue;const clean=row.slice(0,220);if(seen.has(clean))continue;seen.add(clean);picked.push(clean);if(picked.length>=8)break}
    if(!picked.length){for(const m of String(prompt||'').matchAll(/^-\s*([AB])\s*:\s*([^\n]{1,180})$/gm)){const line=`${m[1]}: ${m[2].trim()}`;if(!seen.has(line)){seen.add(line);picked.push(line)}if(picked.length>=4)break}}
    if(!picked.length)return '';
    return ['[CHARACTER IDENTITY ANCHOR — 핵심 신원]',...picked.map(x=>`- ${x}`),'- 위에 명시된 신원·가족·호칭·직업·신분은 최근 장면의 즉흥 설정으로 덮어쓰지 않는다.'].join('\n');
  }

  const priorBuildPrompt=window.buildPrompt;
  if(typeof priorBuildPrompt==='function')window.buildPrompt=function(isContinue=false){
    const s=snapshot(),ctx=currentCanonContext(s); let prompt=String(priorBuildPrompt(isContinue)||''),before=prompt.length;
    prompt=stripAppMinorControls(prompt);
    const identity=identityAnchor(s,prompt);
    const priority=['[CURRENT CANON PRIORITY — 사용자 현재 설정 최우선]',ctx.userNext?`- 이번 화 사용자 지시: ${ctx.userNext}`:'',ctx.currentBeat?`- 현재 CANON 단계: ${ctx.index+1}/${ctx.beats.length} · ${ctx.currentBeat}`:'',String(s?.hardCanon||'').trim()?`- HARD CANON:\n${String(s.hardCanon).trim()}`:'',s?.relationship?`- 현재 관계 설정 ID: ${String(s.relationship)}`:'',s?.trajectory?`- 관계 변화 방향 ID: ${String(s.trajectory)}`:'',(s?.occupationA||s?.occupationB)?`- 현재 프로필 직업: A ${String(s.occupationA||'-')} / B ${String(s.occupationB||'-')}`:'','- 과거의 유년기·중학교·고등학교 언급은 과거 설정이나 회상일 수 있다. 그 단어만 보고 현재 시점을 학교 시절로 되돌리지 않는다.','- 현재 시점/연령/직업/관계는 사용자 이번 화 지시, HARD CANON, 현재 CANON 단계에서만 결정한다.','- 최근 메모·과거 아크·자동 연령 추론이 위 설정과 충돌하면 위 설정을 우선한다.'].filter(Boolean).join('\n');
    prompt=`${priority}${identity?'\n\n'+identity:''}\n\n${prompt}`.trim();
    window.__VELOUR_NO_MINOR_PROMPT_LAST__={beforeChars:before,afterChars:prompt.length,currentBeatIndex:ctx.index,currentBeat:ctx.currentBeat,at:new Date().toISOString()};
    return prompt;
  };

  // Age-only client review is advisory. Other hard-lock checks remain unchanged.
  let busy=false;
  const observer=new MutationObserver(async()=>{
    const note=document.getElementById('velourHardLockReviewNotice'); if(!note||busy)return;
    const s=String(note.textContent||'');
    const ageOnly=/(?:CANON 연령 단계|연령\/학년 HARD LOCK|다음 연령\/학년 단계|연령\/학년 단계를 임의로)/i.test(s)&&!/(?:거주 HARD LOCK|HARD CANON 위반|현재 CANON 단계 건너뜀|미래 단계 선행 실행|본문이 너무 짧|출력 미완료|professional|expression)/i.test(s);
    if(!ageOnly)return;
    busy=true;
    try{let rows=await qa.responseVaultAll(RESPONSE_STORE);rows=rows.filter(isAcceptableRecord).sort((a,b)=>String(b.receivedAt||'').localeCompare(String(a.receivedAt||'')));if(rows.length)await acceptVelourVaultResponse(rows[0].id,{silent:true})}catch(e){console.warn('VELOUR age advisory commit warning',e)}finally{busy=false}
  });
  observer.observe(document.body,{subtree:true,childList:true});

  console.info('✦ VELOUR V4.4.38 vault + no-minor-stage-override hotfix loaded');
})();