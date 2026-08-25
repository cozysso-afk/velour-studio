'use strict';

/* VELOUR V4.4.38 — narrow continuity hotfix
   - vault acceptance stays available
   - legacy age-stage detection is advisory only
   - canon prompt priority + compact character identity anchors
   - no automatic Gemini retry, no new content filter
*/
(() => {
  'use strict';
  if(window.__VELOUR_VAULT_ACCEPT_HOTFIX__) return;
  window.__VELOUR_VAULT_ACCEPT_HOTFIX__=true;
  const qa=window.__VELOUR_STORAGE_QA__;
  if(!qa){console.error('VELOUR hotfix: V4.4.38 QA bridge not found');return;}
  const RESPONSE_STORE='responses';
  const nEp=v=>{const n=Number(v||0);return Number.isFinite(n)&&n>0?Math.floor(n):0};
  function parseMeta(raw){const s=String(raw||''),a=s.indexOf('[[VELOUR_V4_META]]');if(a<0)return null;const z=s.indexOf('[[/VELOUR_V4_META]]',a),x=(z>=0?s.slice(a+18,z):s.slice(a+18)).trim();try{return JSON.parse(x)}catch(_){return null}}
  function pendingEpisode(){try{return nEp(qa.pendingRetryEpisode?.())}catch(_){return 0}}
  function confirmedEpisode(){try{const n=Number(qa.confirmedEpisode?.()||0);return Number.isFinite(n)&&n>=0?Math.floor(n):0}catch(_){return 0}}
  function isAcceptableRecord(r){const ep=nEp(r?.attemptedEpisode),text=String(r?.readerText||r?.rawText||'').trim();if(!ep||!text)return false;if(String(r?.finishReason||'').toUpperCase()==='SAFETY'||String(r?.promptBlock||'').trim())return false;const p=pendingEpisode(),c=confirmedEpisode();return ep===c+1&&(p===0||p===ep)}
  function guardedMeta(meta){if(!meta||typeof meta!=='object')return null;const m=JSON.parse(JSON.stringify(meta));m.ageStageViolation=false;const hard=!!(m.canonViolation||m.storylineSkipped||m.futureBeatLeak||m.residenceViolation||m.expressionViolation||m.professionalBoundaryViolation);if(hard)m.beatComplete=false;if(m.storylineSkipped||m.futureBeatLeak||m.canonViolation){m.beatComplete=false;m.beatProgress=Math.min(85,Math.max(0,Number(m.beatProgress||0)))}return m}
  async function acceptVelourVaultResponse(id,options={}){
    let r=null;try{r=await qa.responseVaultGet(RESPONSE_STORE,String(id))}catch(e){if(!options.silent)alert('응답 금고를 읽지 못했어: '+String(e?.message||e));return false}
    if(!r){if(!options.silent)alert('응답 금고에서 해당 본문을 찾지 못했어.');return false}
    const ep=nEp(r.attemptedEpisode);if(!isAcceptableRecord(r)){if(!options.silent)alert(`이 응답은 현재 이어쓰기 위치에 붙일 수 없어.\n현재 확정: EP.${confirmedEpisode()}\n선택 응답: EP.${ep||'-'}`);return false}
    const clean=String(r.readerText||'').trim();if(!options.silent&&!confirm(`EP.${String(ep).padStart(2,'0')} 미확정 응답을 정식 본문으로 채택할까?\n\n✓ 새 Gemini 요청 없음\n✓ 현재 본문을 EP.${ep}로 확정\n✓ 다음 화는 EP.${ep+1}부터 진행`))return false;
    try{
      let history='';try{history=String(storyHistory||'')}catch(_){}const norm=history.replace(/\s+/g,' ').trim(),tail=clean.slice(-320).replace(/\s+/g,' ').trim();if(!norm||!tail||!norm.includes(tail))history=history.trim()?history.trimEnd()+'\n\n'+clean:clean;try{storyHistory=history}catch(_){}try{episodeCount=ep}catch(_){}
      const meta=guardedMeta(parseMeta(r.rawText||''));qa.rememberConfirmedEpisode?.(ep,false);qa.clearPendingRetryEpisode?.();if(meta)qa.updateMemory?.(meta,ep);
      const novel=document.getElementById('novelText'),title=document.getElementById('resultTitle'),panel=document.getElementById('resultPanel'),counter=document.getElementById('v35CharCount'),next=document.getElementById('btnNext'),dir=document.getElementById('v33Next');if(novel)novel.innerText=clean;if(title)title.innerText=`EPISODE ${String(ep).padStart(2,'0')}`;if(panel)panel.style.display='block';if(next)next.style.display='block';if(dir)dir.value='';document.getElementById('velourHardLockReviewNotice')?.remove();const da=document.getElementById('velourGenerationDiagnosticActions');if(da)da.style.display='none';qa.markGenerationOutcome?.('committed',{episode:ep,attemptedEpisode:ep,userAcceptedVault:!options.silent,ageStageAdvisoryAutoCommit:!!options.ageStageOnly,responseVaultId:String(r.id||id)});if(counter){counter.style.color='#bca7b2';counter.textContent=`본문 ${clean.length.toLocaleString()}자 · 확정 · ENGINE V4.4.38`}
      try{await window.__VELOUR_IDB_SAVE_DRAFT__?.()}catch(e){console.warn('VELOUR vault save warning',e)}try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(window.__VELOUR_V4_STATE_SNAPSHOT__?.())}catch(_){}const modal=document.getElementById('velourResponseVaultModal');if(modal)modal.style.display='none';if(!options.silent){panel?.scrollIntoView({behavior:'smooth',block:'start'});alert(`✓ EP.${String(ep).padStart(2,'0')}로 확정했어.`)}return true;
    }catch(e){console.error('VELOUR vault accept failed',e);if(!options.silent)alert('응답 채택 중 오류: '+String(e?.message||e));return false}
  }
  window.acceptVelourVaultResponse=acceptVelourVaultResponse;
  const originalShowVault=window.showVelourResponseVault;
  if(typeof originalShowVault==='function')window.showVelourResponseVault=async function(){await originalShowVault.apply(this,arguments);const list=document.getElementById('velourVaultList');if(!list)return;let rows=[];try{rows=await qa.responseVaultAll(RESPONSE_STORE)}catch(_){return}rows.sort((a,b)=>String(b.receivedAt||'').localeCompare(String(a.receivedAt||'')));const cards=Array.from(list.children);rows.forEach((r,i)=>{const card=cards[i];if(!card||!isAcceptableRecord(r))return;const actions=card.lastElementChild;if(!actions||actions.querySelector('[data-vault-accept]'))return;const btn=document.createElement('button');btn.type='button';btn.dataset.vaultAccept='1';btn.textContent='✓ 이 응답으로 확정';btn.style.cssText='flex:1;border:1px solid rgba(126,224,160,.35);background:rgba(90,200,130,.10);color:#bff4cf;border-radius:8px;padding:7px;font-size:9.5px;font-weight:800';btn.onclick=()=>acceptVelourVaultResponse(r.id);actions.prepend(btn)})};
  function ageStageOnlyReview(note){const s=String(note?.textContent||'');return /(?:CANON 연령 단계|연령\/학년 HARD LOCK|다음 연령\/학년 단계|연령\/학년 단계를 임의로)/i.test(s)&&!/(?:거주 HARD LOCK|HARD CANON 위반|현재 CANON 단계 건너뜀|미래 단계 선행 실행|본문이 너무 짧|출력 미완료|금지된|professional|expression)/i.test(s)}
  let ageAutoCommitBusy=false;
  const observer=new MutationObserver(async()=>{const note=document.getElementById('velourHardLockReviewNotice');if(!note)return;if(ageStageOnlyReview(note)&&!ageAutoCommitBusy){ageAutoCommitBusy=true;try{let rows=await qa.responseVaultAll(RESPONSE_STORE);rows=rows.filter(isAcceptableRecord).sort((a,b)=>String(b.receivedAt||'').localeCompare(String(a.receivedAt||'')));if(rows.length)await acceptVelourVaultResponse(rows[0].id,{silent:true,ageStageOnly:true})}catch(e){console.warn('VELOUR age advisory commit warning',e)}finally{ageAutoCommitBusy=false}return}if(note.querySelector('[data-vault-accept-review]'))return;const ep=pendingEpisode();if(!ep)return;const box=document.createElement('div'),btn=document.createElement('button');box.style.cssText='display:flex;gap:7px;margin-top:10px;flex-wrap:wrap';btn.type='button';btn.dataset.vaultAcceptReview='1';btn.textContent='✓ 현재 미확정 응답 채택';btn.style.cssText='flex:1;border:1px solid rgba(126,224,160,.35);background:rgba(90,200,130,.11);color:#bff4cf;border-radius:9px;padding:8px 10px;font-size:10px;font-weight:800';btn.onclick=async()=>{let rows=[];try{rows=await qa.responseVaultAll(RESPONSE_STORE)}catch(_){return alert('응답 금고를 읽지 못했어.')}rows=rows.filter(isAcceptableRecord).sort((a,b)=>String(b.receivedAt||'').localeCompare(String(a.receivedAt||'')));if(!rows.length)return window.showVelourResponseVault?.();if(rows.length===1)return acceptVelourVaultResponse(rows[0].id);window.showVelourResponseVault?.()};box.appendChild(btn);note.appendChild(box)});observer.observe(document.body,{subtree:true,childList:true});

  if(!window.__VELOUR_CANON_PROMPT_STABILIZER__){
    window.__VELOUR_CANON_PROMPT_STABILIZER__=true;const priorBuildPrompt=window.buildPrompt;
    const beatsFromState=s=>String(s?.storyline||'').split(/\n+/).map(x=>x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/,'').trim()).filter(Boolean);
    const explicitCanonStage=(text,max)=>{const s=String(text||'');for(const rx of [/(?:캐논|CANON)(?:\s*스토리라인)?[^\d]{0,18}(\d+)\s*단계/i,/(?:스토리라인|storyline)[^\d]{0,18}(\d+)\s*단계/i,/(\d+)\s*단계\s*(?:캐논|CANON)/i]){const n=Number(s.match(rx)?.[1]||0);if(n>=1&&n<=max)return n-1}return -1};
    const removeAgeHardLock=prompt=>{const lines=String(prompt||'').split('\n'),out=[];let skip=false;for(const line of lines){if(/^\[AGE\/TIMELINE HARD LOCK\b/i.test(line.trim())){skip=true;continue}if(skip){if(!line.trim()){skip=false;continue}if(/^\[[^\]]+\]/.test(line.trim())){skip=false;out.push(line)}continue}out.push(line)}return out.join('\n')};
    const restoreNeutralAdultProfiles=prompt=>String(prompt||'').replace(/^- ([AB]) 성인 시기 프로필\(미래 참고값 · 현재 단계 적용 금지\): (.*?) \/ 신분 (.*?)\.$/gm,'- $1: $2 / 신분 $3.');
    const compactRepeatedAnchorLines=prompt=>{const seen=new Set();return String(prompt||'').split('\n').filter(line=>{const t=line.trim();if(!t)return true;if(!/^(?:- )?(?:현재 실행 단계|현재 CANON 단계|이번 화의 주목적|사용자 다음 화 지시|READ-ONLY ROADMAP)/i.test(t))return true;if(seen.has(t))return false;seen.add(t);return true}).join('\n')};
    // Only repeat compact, explicitly written identity facts. Do not invent or infer a surname/name.
    const identityAnchor=(snapshot,prompt)=>{
      const sources=[String(snapshot?.hardCanon||''),String(document.getElementById('inputChars')?.value||''),String(document.getElementById('inputPlot')?.value||'')].filter(Boolean).join('\n');
      const rows=sources.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      const identityRx=/(?:남주|여주|주인공|A\s*[:：]|B\s*[:：]|이름\s*[:：]|성명\s*[:：]|본명\s*[:：]|성씨\s*[:：]|나이\s*[:：]|직업\s*[:：]|신분\s*[:：]|가족\s*[:：]|형제|자매|오빠|언니|누나|형\b|부모|출신\s*[:：]|고향\s*[:：]|호칭\s*[:：])/i;
      const picked=[];const seen=new Set();
      for(const row of rows){if(!identityRx.test(row))continue;const clean=row.slice(0,220);if(seen.has(clean))continue;seen.add(clean);picked.push(clean);if(picked.length>=8)break}
      // Fallback: reuse explicit A/B profile lines already present in the built prompt.
      if(!picked.length){for(const m of String(prompt||'').matchAll(/^-\s*([AB])\s*:\s*([^\n]{1,180})$/gm)){const line=`${m[1]}: ${m[2].trim()}`;if(!seen.has(line)){seen.add(line);picked.push(line)}if(picked.length>=4)break}}
      if(!picked.length)return '';
      return ['[CHARACTER IDENTITY ANCHOR — 핵심 신원]',...picked.map(x=>`- ${x}`),'- 위에 명시된 이름·성씨·가족관계·출신·호칭·신분은 최근 장면의 즉흥 설정으로 덮어쓰지 않는다. 사용자가 이번 화에서 명시적으로 변경한 항목만 변경한다.','- 이 블록은 신원 연속성 참고용이다. 장면 전개를 제한하거나 본문을 검열·재생성하는 조건으로 사용하지 않는다.'].join('\n');
    };
    if(typeof priorBuildPrompt==='function')window.buildPrompt=function(isContinue=false){
      let prompt=String(priorBuildPrompt(isContinue)||''),snapshot=null;try{snapshot=window.__VELOUR_V4_STATE_SNAPSHOT__?.()||null}catch(_){}
      const userNext=String(document.getElementById('v33Next')?.value||'').trim(),beats=beatsFromState(snapshot||{}),storedIndex=Math.max(0,Number(snapshot?.beatIndex||0)),requestedIndex=explicitCanonStage(userNext,beats.length),effectiveIndex=requestedIndex>=0?requestedIndex:Math.min(storedIndex,Math.max(0,beats.length-1)),currentBeat=beats[effectiveIndex]||'',beforeChars=prompt.length;
      prompt=removeAgeHardLock(prompt);prompt=restoreNeutralAdultProfiles(prompt);prompt=compactRepeatedAnchorLines(prompt);
      const identity=identityAnchor(snapshot,prompt);
      const canon=['[CURRENT CANON PRIORITY — 생성 방향 정리]',userNext?`- 사용자 다음 화 지시: ${userNext}`:'',currentBeat?`- 이번 화의 현재 CANON 단계: ${effectiveIndex+1}/${beats.length} · ${currentBeat}`:'',requestedIndex>=0?'- 사용자가 이번 요청에서 단계 번호를 직접 지정했으므로 저장된 진행 커서보다 이 요청의 단계 지정을 우선한다.':'','- 최근 장면 메모·열린 떡밥·이전 화의 자생 사건은 현재 CANON 단계와 사용자 지시를 보조하는 참고자료다. 충돌하면 현재 CANON 단계와 사용자 지시를 따른다.','- 과거 시절 언급이나 회상은 현재 시점을 자동으로 되돌리는 근거로 사용하지 않는다.','- 이 지시는 생성 방향 정리용이며 본문 검열·차단·자동 재생성을 요구하지 않는다.'].filter(Boolean).join('\n');
      prompt=`${canon}${identity?'\n\n'+identity:''}\n\n${prompt}`.trim();window.__VELOUR_CANON_PROMPT_STABILIZER_LAST__={beforeChars,afterChars:prompt.length,storedBeatIndex:storedIndex,effectiveBeatIndex:effectiveIndex,explicitBeatOverride:requestedIndex>=0,currentBeat,userDirectionPresent:!!userNext,identityAnchorLines:identity?identity.split('\n').length-3:0,at:new Date().toISOString()};return prompt;
    };
  }
  console.info('✦ VELOUR V4.4.38 vault + canon/age + compact identity hotfix loaded');
})();