'use strict';

/* VELOUR — Intimacy Preference Depth V1
   Character-level consensual adult preference taxonomy layered on top of the
   ensemble engine. This module does not unlock scenes. Existing consent,
   relationship, pacing, HARD CANON, and privacy/legal rules remain authoritative.
*/
(() => {
  'use strict';
  if (window.__VELOUR_INTIMACY_PREFERENCE_DEPTH__) return;

  const VERSION='1.0.1';
  const GUARD='__VELOUR_INTIMACY_PREFERENCE_DEPTH__';
  const KEY='VELOUR_INTIMACY_PREFERENCE_DEPTH_V1';
  const MODE_ORDER=['allowed','priority','off'];
  const normalizeMode=v=>MODE_ORDER.includes(String(v))?String(v):'allowed';
  const clean=(v,max=80)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,max);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));

  const STYLE_CATALOG=[
    ['tender_sensual','다정·감각 중심'],
    ['slow_foreplay','긴 전희·천천히 고조'],
    ['intense_pace','강한 텐션·집중도'],
    ['playful_teasing','장난·희롱형'],
    ['verbal_arousal','말·목소리로 흥분'],
    ['visual_arousal','시각적 자극 선호'],
    ['dominant_lead','합의된 주도·리드 성향'],
    ['submissive_lean','합의된 맡김·M 성향'],
    ['switch_dynamic','상황에 따라 주도권 전환'],
    ['sadistic_light','가벼운 가학 성향'],
    ['masochistic_light','가벼운 피학 성향'],
    ['control_restraint','합의된 통제·제약 플레이'],
    ['sensation_seek','감각 자극 다양성 선호'],
    ['novelty_seek','새로운 방식 탐색 선호'],
    ['familiar_routine','익숙한 방식 선호'],
    ['adventure_setting','여행지·야외 등 비일상 공간 선호'],
    ['exposure_fantasy','노출 위험 판타지 · 실제 공공노출 금지'],
    ['privacy_first','완전한 사적 공간 선호'],
    ['aftercare_high','애프터케어 중시']
  ].map(([id,label])=>({id,label}));

  const STIM_CATALOG=[
    ['long_kiss','긴 키스'],
    ['deep_kiss','깊은 입맞춤'],
    ['ear_neck','귀·목 자극'],
    ['nipple_touch','유두·가슴 자극'],
    ['nipple_oral','유두 구강 자극'],
    ['nipple_bite_light','가벼운 유두 깨물기'],
    ['adult_suckling','성인 수유형 자극'],
    ['adult_lactation','성인 유즙·수유 플레이'],
    ['body_kiss','전신 키스·입맞춤'],
    ['back_waist','등·허리 자극'],
    ['inner_thigh','허벅지 안쪽 자극'],
    ['perineal','회음부 자극'],
    ['anal_external','항문 주변 외부 자극'],
    ['anal_oral','항문 구강 자극'],
    ['prostate','전립선 자극'],
    ['manual_genital','손을 이용한 성기 자극'],
    ['oral_female','여성 대상 구강 자극'],
    ['oral_male','남성 대상 구강 자극'],
    ['mutual_oral','상호 구강 자극'],
    ['massage','마사지·긴장 완화'],
    ['playful_bite','가벼운 깨물기·장난성 자극'],
    ['spanking_light','가벼운 합의 스팽킹'],
    ['sensory_contrast','온도·압력 등 감각 대비'],
    ['aftercare_touch','장면 뒤 접촉·돌봄']
  ].map(([id,label])=>({id,label}));

  const COMPLEMENTS=[
    ['dominant_lead','submissive_lean','주도/맡김'],
    ['sadistic_light','masochistic_light','가벼운 S/M'],
    ['control_restraint','submissive_lean','통제/맡김']
  ];
  const CONTEXT_SHARED=new Set(['adventure_setting','exposure_fantasy','privacy_first']);

  const defaultModes=catalog=>Object.fromEntries(catalog.map(x=>[x.id,'allowed']));
  const normalizeModes=(raw,catalog)=>Object.fromEntries(catalog.map(x=>[x.id,normalizeMode(raw?.[x.id])]));
  const baseProfile=id=>({id,styleModes:defaultModes(STYLE_CATALOG),stimModes:defaultModes(STIM_CATALOG)});

  function ensembleQA(){return window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__||null;}
  function ensembleCfg(){try{return ensembleQA()?.loadCfg?.()||null;}catch(_){return null;}}
  function characterList(cfg=ensembleCfg()){
    if(!cfg)return [];
    const partners=ensembleQA()?.activePartners?.(cfg)||[];
    return [cfg.heroine,...partners].filter(Boolean);
  }
  function profileId(c){return clean(c?.id,48)||clean(c?.name,48)||'character';}
  function characterSignature(cfg=ensembleCfg()){
    return characterList(cfg).map(c=>`${profileId(c)}:${clean(c?.name,48)}`).join('|');
  }

  function normalizeCfg(raw){
    const src=raw&&typeof raw==='object'?raw:{};
    const profiles={};
    for(const c of characterList()){
      const id=profileId(c),prior=src.profiles?.[id]||{};
      profiles[id]={id,styleModes:normalizeModes(prior.styleModes,STYLE_CATALOG),stimModes:normalizeModes(prior.stimModes,STIM_CATALOG)};
    }
    return {profiles};
  }
  function loadCfg(){
    try{return normalizeCfg(JSON.parse(localStorage.getItem(KEY)||'null'));}
    catch(_){return normalizeCfg({});}
  }
  function saveCfg(next){
    const cfg=normalizeCfg(next);
    try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(_){}
    return cfg;
  }
  function getProfile(c,cfg=loadCfg()){
    const id=profileId(c);return cfg.profiles?.[id]||baseProfile(id);
  }
  function buckets(profile,catalog,key){
    const out={priority:[],allowed:[],off:[]};
    for(const item of catalog)out[normalizeMode(profile?.[key]?.[item.id])].push(item.id);
    return out;
  }
  const label=(catalog,id)=>catalog.find(x=>x.id===id)?.label||id;
  const names=(catalog,ids)=>ids.map(id=>label(catalog,id));

  function focusCharacter(state,ecfg=ensembleCfg()){
    if(!ecfg)return null;
    try{return ensembleQA()?.focusPartner?.(ecfg,state)||null;}catch(_){return null;}
  }
  function stableRank(seed){
    let h=2166136261;
    for(const ch of String(seed||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function mutualStimCandidates(a,b,cfg=loadCfg(),limit=10,state={}){
    if(!a||!b)return [];
    const pa=getProfile(a,cfg),pb=getProfile(b,cfg);
    const ep=Number(state?.runtime?.confirmedEpisode||0)+1;
    return STIM_CATALOG
      .filter(item=>pa.stimModes[item.id]!=='off'&&pb.stimModes[item.id]!=='off')
      .map(item=>({
        id:item.id,label:item.label,
        score:(pa.stimModes[item.id]==='priority'?2:0)+(pb.stimModes[item.id]==='priority'?2:0),
        rank:stableRank(`${ep}|${profileId(a)}|${profileId(b)}|${item.id}`)
      }))
      .filter(item=>item.score>0)
      .sort((x,y)=>y.score-x.score||x.rank-y.rank)
      .slice(0,limit);
  }
  function styleCompatibility(a,b,cfg=loadCfg()){
    if(!a||!b)return {complements:[],shared:[],warnings:[]};
    const pa=getProfile(a,cfg),pb=getProfile(b,cfg),complements=[],shared=[],warnings=[];
    const on=(p,id)=>normalizeMode(p.styleModes[id])!=='off';
    const pri=(p,id)=>normalizeMode(p.styleModes[id])==='priority';
    for(const [left,right,title] of COMPLEMENTS){
      const compatible=(on(pa,left)&&on(pb,right))||(on(pa,right)&&on(pb,left));
      const activated=pri(pa,left)||pri(pa,right)||pri(pb,left)||pri(pb,right);
      if(compatible&&activated){
        const score=(pri(pa,left)||pri(pa,right)?1:0)+(pri(pb,left)||pri(pb,right)?1:0);
        complements.push({title,score});
      }
    }
    for(const item of STYLE_CATALOG){
      if(!CONTEXT_SHARED.has(item.id))continue;
      if(on(pa,item.id)&&on(pb,item.id)&&(pri(pa,item.id)||pri(pb,item.id))){
        shared.push({id:item.id,label:item.label,score:(pri(pa,item.id)?1:0)+(pri(pb,item.id)?1:0)});
      }
    }
    if(shared.some(x=>x.id==='exposure_fantasy'))warnings.push('공공장소의 비동의 노출이나 불법 행위로 실행하지 말고, 사생활이 확보된 합법적 상황/판타지 긴장으로만 번역');
    return {complements:complements.sort((x,y)=>y.score-x.score),shared:shared.sort((x,y)=>y.score-x.score),warnings};
  }

  function profileLine(c,p){
    const sb=buckets(p,STYLE_CATALOG,'styleModes'),tb=buckets(p,STIM_CATALOG,'stimModes');
    return [
      `- ${c.name||'인물'} 성적 스타일: 주력=${names(STYLE_CATALOG,sb.priority).join(', ')||'없음'} / OFF=${names(STYLE_CATALOG,sb.off).join(', ')||'없음'} / 나머지=허용`,
      `- ${c.name||'인물'} 자극·플레이: 주력=${names(STIM_CATALOG,tb.priority).join(', ')||'없음'} / OFF=${names(STIM_CATALOG,tb.off).join(', ')||'없음'} / 나머지=허용`
    ].join('\n');
  }
  function stripPrior(prompt){return String(prompt||'').replace(/\n?===== VELOUR INTIMACY PREFERENCE DEPTH V1 =====[\s\S]*?===== \/VELOUR INTIMACY PREFERENCE DEPTH V1 =====\s*/g,'\n').trim();}
  function directive(state,cfg=loadCfg()){
    const ecfg=ensembleCfg();if(!ecfg)return '';
    const chars=characterList(ecfg),focus=focusCharacter(state,ecfg),compat=focus?styleCompatibility(ecfg.heroine,focus,cfg):{complements:[],shared:[],warnings:[]};
    const stim=focus?mutualStimCandidates(ecfg.heroine,focus,cfg,10,state):[];
    return `===== VELOUR INTIMACY PREFERENCE DEPTH V1 =====
[캐릭터별 성적 성향 · 자극 선호]
- 이 블록은 성인 캐릭터의 합의된 취향 프로필이다. 장면 자체를 조기 해금하지 않는다. 기존 동의, 관계 단계, 페이싱, HARD CANON이 항상 우선한다.
- 주력=적절한 장면에서 높은 우선순위, 허용=상황 맞으면 수동 후보, OFF=자동 후보에서 완전히 제외.
- 주력 지정이 없는 강한 성향·플레이를 이 블록만 보고 먼저 꺼내지 않는다. 허용은 금지가 아니라 가능 범위일 뿐 자동 추천 신호가 아니다.
- 강한 취향이라도 매 장면 의무 반복하지 않는다. 최근 장면의 방식·리듬을 반복하지 말고 인물/상황 인과를 우선한다.
${chars.map(c=>profileLine(c,getProfile(c,cfg))).join('\n')}

[현재 focus 상호 적합성]
- focus=${focus?.name||'없음'}.
- 상호 적합한 주력 기반 자극·플레이 후보: ${stim.map(x=>x.label).join(' / ')||'없음 — 세부 플레이를 억지로 추가하지 말 것'}.
- 주력으로 활성화된 보완 성향 조합: ${compat.complements.map(x=>x.title).join(' / ')||'없음'}.
- 주력으로 활성화된 공간/맥락 성향: ${compat.shared.map(x=>x.label).join(' / ')||'없음'}.
- S/M·주도/맡김·통제 계열은 명시적 또는 확실한 상호 동의와 관계 단계가 전제다. 성향 라벨을 상대의 동의나 권리 포기로 해석하지 않는다.
- 통증·제약·스팽킹 계열은 강도를 자동 상향하지 않는다. 설정된 범위를 넘는 행위를 임의 추가하지 않는다.
- 성인 수유·유즙 관련 항목은 성인 캐릭터끼리의 설정으로만 취급하며 임신·출산·수유 상태를 임의로 만들어내지 않는다. HARD CANON에 근거가 없으면 생리적 사실을 발명하지 않는다.
- 전립선·항문·회음부 등 특정 부위 선호는 OFF가 아닌 경우에도 장면 맥락과 상호 동의가 맞을 때만 사용한다. 단순 다양화 때문에 억지로 삽입하지 않는다.
- 야외·노출 위험 성향은 비동의 제3자 노출, 공공장소의 불법 행위, 사생활 침해로 실행하지 않는다. 합법적이고 사생활이 확보된 장소/판타지 긴장으로만 번역한다.
${compat.warnings.length?`- 추가 안전 제약: ${compat.warnings.join(' / ')}.`:''}
===== /VELOUR INTIMACY PREFERENCE DEPTH V1 =====`;
  }

  function installStateBridge(){
    if(window.__VELOUR_INTIMACY_DEPTH_STATE_BRIDGE__)return;
    const oldSnapshot=window.__VELOUR_V4_STATE_SNAPSHOT__;
    if(typeof oldSnapshot==='function')window.__VELOUR_V4_STATE_SNAPSHOT__=function(){const s=oldSnapshot.apply(this,arguments)||{};s.intimacyDepthPreferences=loadCfg();return s;};
    const oldRestore=window.__VELOUR_V4_STATE_RESTORE__;
    if(typeof oldRestore==='function')window.__VELOUR_V4_STATE_RESTORE__=function(s){if(s?.intimacyDepthPreferences)saveCfg(s.intimacyDepthPreferences);const out=oldRestore.apply(this,arguments);setTimeout(()=>{document.getElementById('velourIntimacyDepthV1')?.remove();renderUI();},0);return out;};
    window.__VELOUR_INTIMACY_DEPTH_STATE_BRIDGE__=true;
  }

  let persistTimer=0;
  function schedulePersist(){clearTimeout(persistTimer);persistTimer=setTimeout(async()=>{try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(window.__VELOUR_V4_STATE_SNAPSHOT__?.());}catch(_){}},180);}
  function cycleMode(mode){return MODE_ORDER[(MODE_ORDER.indexOf(normalizeMode(mode))+1)%MODE_ORDER.length];}
  function paint(btn,mode){
    const m=normalizeMode(mode);btn.dataset.mode=m;
    btn.textContent=`${btn.dataset.label} · ${m==='priority'?'주력':m==='off'?'OFF':'허용'}`;
    btn.style.background=m==='priority'?'rgba(245,196,107,.18)':m==='off'?'rgba(130,130,145,.07)':'rgba(255,255,255,.035)';
    btn.style.borderColor=m==='priority'?'rgba(245,196,107,.65)':m==='off'?'rgba(140,140,155,.20)':'rgba(245,196,107,.24)';
    btn.style.color=m==='off'?'rgba(220,210,215,.45)':'#f7e7c4';
  }
  function prefButtons(profile,catalog,key,kind){return catalog.map(item=>{const mode=normalizeMode(profile[key]?.[item.id]);return `<button type="button" data-depth-kind="${kind}" data-depth-id="${item.id}" data-label="${esc(item.label)}" data-mode="${mode}" style="text-align:left;border:1px solid rgba(245,196,107,.24);background:rgba(255,255,255,.035);color:#f7e7c4;border-radius:8px;padding:6px 7px;font-size:9px;line-height:1.35">${esc(item.label)} · ${mode==='priority'?'주력':mode==='off'?'OFF':'허용'}</button>`;}).join('');}
  function renderUI(){
    const anchor=document.getElementById('velourEnsemblePrefsV1');if(!anchor||!anchor.parentNode)return;
    const ecfg=ensembleCfg();if(!ecfg)return;
    const signature=characterSignature(ecfg),existing=document.getElementById('velourIntimacyDepthV1');
    if(existing?.dataset?.characterSignature===signature)return;
    existing?.remove?.();
    const cfg=loadCfg();
    const wrap=document.createElement('div');wrap.id='velourIntimacyDepthV1';wrap.dataset.characterSignature=signature;wrap.style.cssText='margin-top:10px;padding:10px;border:1px solid rgba(245,196,107,.18);border-radius:10px;background:rgba(255,255,255,.025)';
    wrap.innerHTML=`<div style="font-size:10px;font-weight:800;letter-spacing:.07em">INTIMACY DEPTH · 성적 성향/자극 선호</div><div style="font-size:9px;opacity:.66;line-height:1.5;margin-top:4px">캐릭터별 주력 → OFF → 허용 순환. 허용은 자동 추천이 아니며, 관계 단계와 동의 게이트를 해제하지 않습니다.</div>${characterList(ecfg).map(c=>{const p=getProfile(c,cfg);return `<details data-depth-char="${esc(profileId(c))}" style="margin-top:7px;border:1px solid rgba(245,196,107,.13);border-radius:9px;padding:7px"><summary style="font-size:9.5px;font-weight:800;cursor:pointer">${esc(c.name||'인물')} · 세부 취향</summary><details style="margin-top:6px"><summary style="font-size:9px;cursor:pointer">성적 스타일 ${STYLE_CATALOG.length}종</summary><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:5px">${prefButtons(p,STYLE_CATALOG,'styleModes','style')}</div></details><details style="margin-top:6px"><summary style="font-size:9px;cursor:pointer">자극·플레이 ${STIM_CATALOG.length}종</summary><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:5px">${prefButtons(p,STIM_CATALOG,'stimModes','stim')}</div></details></details>`;}).join('')}`;
    anchor.insertAdjacentElement?.('afterend',wrap)||anchor.parentNode.appendChild(wrap);
    wrap.querySelectorAll?.('[data-depth-kind]').forEach(btn=>{paint(btn,btn.dataset.mode);btn.addEventListener('click',()=>{const id=btn.closest('[data-depth-char]')?.dataset.depthChar;if(!id)return;const now=loadCfg(),p=now.profiles[id]||baseProfile(id),key=btn.dataset.depthKind==='style'?'styleModes':'stimModes';p[key][btn.dataset.depthId]=cycleMode(p[key][btn.dataset.depthId]);now.profiles[id]=p;saveCfg(now);paint(btn,p[key][btn.dataset.depthId]);schedulePersist();});});
  }

  function install(){
    if(window[GUARD])return true;
    if(typeof window.buildPrompt!=='function'||!ensembleQA()||typeof window.__VELOUR_V4_STATE_SNAPSHOT__!=='function')return false;
    installStateBridge();const previousBuild=window.buildPrompt;
    window.buildPrompt=function(){const out=stripPrior(previousBuild.apply(this,arguments)),state=window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{},cfg=loadCfg(),block=directive(state,cfg);window.__VELOUR_LAST_INTIMACY_PREFERENCE_DEPTH__={version:VERSION,focus:focusCharacter(state)?.name||'',at:new Date().toISOString()};return block?`${out}\n\n${block}`.trim():out;};
    window[GUARD]=true;window.__VELOUR_INTIMACY_PREFERENCE_DEPTH_VERSION__=VERSION;
    window.__VELOUR_INTIMACY_PREFERENCE_DEPTH_QA__={STYLE_CATALOG,STIM_CATALOG,COMPLEMENTS,normalizeCfg,loadCfg,saveCfg,getProfile,mutualStimCandidates,styleCompatibility,directive,cycleMode,characterSignature};
    renderUI();
    if(typeof MutationObserver==='function'&&document.body){
      const observer=new MutationObserver(()=>setTimeout(renderUI,0));
      observer.observe(document.body,{subtree:true,childList:true});
      window.__VELOUR_INTIMACY_DEPTH_UI_OBSERVER__=observer;
    }
    console.info('✦ VELOUR Intimacy Preference Depth V1 loaded');return true;
  }
  if(!install()){let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>200)clearInterval(timer);},80);}
  setTimeout(renderUI,400);
})();