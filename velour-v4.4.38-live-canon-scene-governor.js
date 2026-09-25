'use strict';

/* VELOUR — Live Canon + Scene Variety Governor V1
   Final-boundary overlay for live HARD CANON, wardrobe continuity,
   scene-purpose/location rotation, and protagonist agency controls.
*/
(() => {
  'use strict';
  if (window.__VELOUR_LIVE_CANON_SCENE_GOVERNOR__) return;

  const VERSION='1.0.0';
  const GUARD='__VELOUR_LIVE_CANON_SCENE_GOVERNOR__';
  const KEY='VELOUR_SCENE_GOVERNOR_V1';
  const DEFAULT={agencyIntensity:72,agencyFrequency:'balanced'};
  const clone=v=>JSON.parse(JSON.stringify(v==null?{}:v));
  const clean=(v,max=240)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,max);
  const uniq=arr=>[...new Set((arr||[]).map(x=>clean(x)).filter(Boolean))];

  function loadCfg(){
    try{return Object.assign({},DEFAULT,JSON.parse(localStorage.getItem(KEY)||'{}'));}
    catch(_){return Object.assign({},DEFAULT);}
  }
  function saveCfg(next){
    const cfg=Object.assign({},DEFAULT,next||{});
    cfg.agencyIntensity=Math.max(0,Math.min(100,Number(cfg.agencyIntensity||0)));
    if(!['low','balanced','high','very_high'].includes(cfg.agencyFrequency))cfg.agencyFrequency='balanced';
    try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(_){}
    return cfg;
  }
  function liveHardCanon(){
    const el=document.getElementById('v4HardCanon');
    return el ? String(el.value||'').trim() : '';
  }
  function liveCharacterText(){
    return String(document.getElementById('inputChars')?.value||'').trim();
  }
  function recentScenes(state,count=8){
    const rows=Array.isArray(state?.runtime?.scenes)?state.runtime.scenes:[];
    return rows.slice(-Math.max(1,count));
  }
  function nextEpisode(state){
    const confirmed=Number(state?.runtime?.confirmedEpisode||0);
    const last=recentScenes(state,1)[0];
    return Math.max(confirmed,Number(last?.episode||0))+1;
  }
  function stableIndex(seed,size){
    if(!size)return 0;let h=2166136261;
    for(const ch of String(seed||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return Math.abs(h>>>0)%size;
  }

  function wardrobeFacts(hard){
    const rx=/(나시|민소매|티셔츠|셔츠|블라우스|반바지|바지|청바지|슬랙스|치마|스커트|원피스|후드|맨투맨|재킷|자켓|코트|가디건|니트|정장|교복|운동복|잠옷|속옷|브라|팬티|양말|신발|구두|운동화|슬리퍼|모자|안경|시계|목걸이|팔찌|귀걸이|가방)/i;
    return String(hard||'').split(/\n+/).map(x=>x.trim()).filter(x=>x&&rx.test(x)).slice(0,12);
  }

  function locationPalette(state,hard,chars){
    const src=`${hard}\n${chars}`.toLowerCase();
    const world=String(state?.world||'').toLowerCase();
    if(/교수|조교|대학|강의|연구실|캠퍼스/.test(src))return [
      '강의실·세미나실·교수실·학과 사무실처럼 역할이 실제로 작동하는 다른 교내 공간',
      '복도·계단·엘리베이터·주차장·차량 이동처럼 이동 자체가 대화 조건을 바꾸는 구간',
      '도서관·캠퍼스 카페·학생회관·운동장·산책로처럼 일상 루틴이 겹치는 공용 공간',
      '학회·발표·회의·출장·자료 전달처럼 직업 일정이 자연스럽게 장소를 바꾸는 장면',
      '퇴근 후 식사·장보기·편의점·주거지 방문처럼 업무 밖 생활이 드러나는 사적 시간',
      '학교 밖 카페·서점·식당·병원·은행·관공서처럼 실제 용무가 있는 생활 공간'
    ];
    if(/historical|eastern_fantasy|western_fantasy|martial_arts/.test(world))return [
      '같은 거처의 다른 방·회랑·뜰·별채',
      '직업·신분이 작동하는 집무·수련·의례 공간',
      '시장·찻집·나루·성문 같은 생활 공간',
      '마차·말·배·산길처럼 이동이 사건을 만드는 구간',
      '서고·정원·온실·치료 공간처럼 행동 방식이 달라지는 장소',
      '연회·축제·순행·공연처럼 현재 단계와 연결되는 일정'
    ];
    return [
      '집 안의 다른 생활 구역과 시간대',
      '직업·학업이 실제 사건을 만드는 업무 공간',
      '차량·역·주차장·복도·엘리베이터처럼 이동과 문턱이 있는 구간',
      '카페·서점·식당·시장·산책로 같은 일상 생활 공간',
      '전시·공연·운동·모임·약속처럼 명확한 목적이 있는 외출',
      '출장·여행·방문·숙소처럼 충분한 계기가 있는 생활 리듬 변화'
    ];
  }
  function scenePurposePalette(state,hard,chars){
    const src=`${hard}\n${chars}`;
    if(/교수|조교|대학|강의|연구/.test(src))return [
      '수업·연구·행정 일정이 겹치며 생기는 현실적인 시간 압박',
      '공적인 역할 경계와 사적인 감정이 충돌하는 선택',
      '자료·발표·피드백·업무 분담에서 생기는 작은 의견 차이',
      '다른 학생·동료·교직원의 자연스러운 요청 때문에 둘만의 계획이 바뀌는 상황',
      '퇴근·귀가·식사·이동 같은 일상 루틴에서 드러나는 관계 온도 차이',
      '같은 목표를 두고 표현 방식이나 우선순위가 달라 생기는 갈등'
    ];
    return [
      '일정·시간·약속이 어긋나며 생기는 현실적인 선택',
      '공적인 역할과 사적인 감정의 경계가 흔들리는 순간',
      '작은 오해를 확인하고 풀어가는 대화',
      '같은 목표를 두고 방식·속도·우선순위가 다른 갈등',
      '친구·동료·가족의 자연스러운 요청이 기존 계획을 바꾸는 상황',
      '식사·귀가·장보기·이동 같은 생활 루틴에서 관계가 드러나는 사건'
    ];
  }
  function sceneCandidates(state){
    const hard=String(state?.hardCanon||'');
    const chars=liveCharacterText();
    const loc=locationPalette(state,hard,chars);
    const purpose=scenePurposePalette(state,hard,chars);
    const ep=nextEpisode(state);
    const li=stableIndex(`${ep}|${state?.world||''}|${hard.slice(0,120)}`,loc.length);
    const pi=stableIndex(`${ep}|${state?.relationship||''}|${chars.slice(0,120)}`,purpose.length);
    return {
      locations:[0,2,4].map(n=>loc[(li+n)%loc.length]),
      purposes:[0,2,4].map(n=>purpose[(pi+n)%purpose.length])
    };
  }
  function agencyBudget(cfg){
    return {low:1,balanced:2,high:3,very_high:4}[cfg.agencyFrequency]||2;
  }
  function agencyTone(cfg){
    const n=Number(cfg.agencyIntensity||0);
    if(n>=80)return '강함: 먼저 제안·선택·접근·거절·조건 제시·장면 전환을 분명하게 할 수 있다';
    if(n>=55)return '중간: 필요할 때 먼저 행동하고 중요한 순간에는 장면 방향을 바꾼다';
    if(n>=30)return '절제: 반응형이 기본이지만 핵심 순간에는 스스로 선택을 표현한다';
    return '낮음: 적극성을 억지로 끌어올리지 않되 완전한 수동 인물로 고정하지 않는다';
  }

  function sceneMemory(state){
    const rows=recentScenes(state,8);
    const exact=uniq(rows.map(s=>[s?.location,s?.purpose].filter(Boolean).join(' + '))).slice(-6);
    const last3=rows.slice(-3);
    const blocking=last3.filter(s=>s?.adultScene).map(s=>[
      clean(s?.positionId||s?.position||'',60),clean(s?.pattern||'',40),clean(s?.initiation||'',40),clean(s?.control||'',40)
    ].filter(Boolean).join('|')).filter(Boolean);
    return {exact,blockingCount:new Set(blocking).size,adultRecent:last3.filter(s=>s?.adultScene).length};
  }

  function stripPriorLiveBlock(prompt){
    return String(prompt||'').replace(/\n?===== VELOUR LIVE CANON · SCENE GOVERNOR V1 =====[\s\S]*?===== \/VELOUR LIVE CANON · SCENE GOVERNOR V1 =====\s*/g,'\n').trim();
  }
  function directive(state){
    const hard=String(state?.hardCanon||'').trim();
    const clothes=wardrobeFacts(hard);
    const candidates=sceneCandidates(state);
    const memory=sceneMemory(state);
    const cfg=loadCfg();
    const budget=agencyBudget(cfg);
    const canonText=hard||'(없음)';
    return `===== VELOUR LIVE CANON · SCENE GOVERNOR V1 =====
[최신 HARD CANON — 생성 순간의 현재 입력값이 최종 권위]
- 아래 원문은 지금 화면의 ‘절대 바뀌면 안 되는 설정’ 최신값이다. 앞쪽 프롬프트·저장 스냅샷·이전 화 메모에 다른 버전이 있으면 전부 무시하고 아래 최신값을 따른다.
${canonText}

[의상·소품 연속성]
- HARD CANON에서 잡힌 복장/소품 관련 줄: ${clothes.length?clothes.join(' / '):'명시 없음'}.
- 한 화 안에서 착용 상태와 손에 든 소품은 사건으로 추적한다. 본문에 벗음·입음·갈아입음·건네줌·놓아둠 같은 변화가 실제로 쓰이지 않았다면 새 의복/소품을 편의상 생성하거나 기존 것을 다른 것으로 바꾸지 않는다.
- 장면의 분위기나 친밀도가 바뀌었다는 이유만으로 셔츠·재킷·바지 같은 새 품목을 자동 생성하지 않는다. 직전 확정 문단의 상태를 이어받는다.

[장소·상황 자연 회전]
- 최근 정확한 장소+목적 조합: ${memory.exact.length?memory.exact.join(' / '):'기록 없음'}.
- 직전 장면을 직접 이어가는 경우가 아니면 최근 3장면과 같은 ‘정확한 장소+같은 목적’을 기본값으로 다시 쓰지 않는다. 같은 건물이라도 구역·시간대·방문 목적·사람의 흐름이 달라야 한다.
- 이번 화 장소 후보축: ${candidates.locations.join(' / ')}.
- 이번 화 상황·갈등 후보축: ${candidates.purposes.join(' / ')}.
- 후보는 강제 랜덤 이벤트가 아니다. 현재 직업·일정·관계 단계·직전 선택에서 인과가 자연스러운 1개만 골라 구체화한다. 새 악역·사고·우연한 위기를 다양화 목적으로 억지 투입하지 않는다.
- 공용/공개 공간은 대화·이동·긴장·사건 전개에 활용하고, 높은 사생활이 필요한 장면은 인과적으로 적절한 사적 공간으로 이동시킨다.

[주인공(여주) 적극성]
- 강도 ${cfg.agencyIntensity}/100 — ${agencyTone(cfg)}.
- 빈도 ${cfg.agencyFrequency}; 한 화에 장면 방향을 실제로 바꾸는 능동 선택 목표 ${budget}회 안팎. 숫자 채우기식 반복은 금지한다.
- 능동성은 먼저 말하기만 뜻하지 않는다. 제안·질문·접근·거절·조건 제시·이동 제안·일정 변경·속도/거리/배치 전환 등 현재 장면에 맞는 서로 다른 방식으로 나타낸다.
- 친밀 장면에서도 관계 단계와 동의 규칙을 지키며 한쪽 인물만 계속 주도하는 패턴에 고정되지 않도록 한다.

[장면 블로킹 반복 억제]
- 최근 3장면 중 친밀 장면 ${memory.adultRecent}회, 서로 다른 기록된 배치 시그니처 ${memory.blockingCount}개.
- 최근 장면과 같은 배치 ID·방향·지지점·주도권 조합을 이름만 바꿔 반복하지 않는다. 충분한 길이의 장면에서 전환이 필요하면 최소 2개 축이 실제로 달라질 때만 ‘다른 배치’로 본다.
- 전환은 다양화 체크리스트 때문에 일어나면 안 된다. 상대 반응 또는 환경 제약 → 인물의 선택 → 거리/배치/동선 변화 순으로 인과를 만든다.
===== /VELOUR LIVE CANON · SCENE GOVERNOR V1 =====`;
  }

  function installStateBridge(){
    if(window.__VELOUR_LIVE_CANON_STATE_BRIDGE__)return;
    const oldSnapshot=window.__VELOUR_V4_STATE_SNAPSHOT__;
    if(typeof oldSnapshot==='function')window.__VELOUR_V4_STATE_SNAPSHOT__=function(){
      const s=oldSnapshot.apply(this,arguments)||{};
      const el=document.getElementById('v4HardCanon');
      if(el)s.hardCanon=String(el.value||'');
      s.sceneGovernor=loadCfg();
      return s;
    };
    const oldRestore=window.__VELOUR_V4_STATE_RESTORE__;
    if(typeof oldRestore==='function')window.__VELOUR_V4_STATE_RESTORE__=function(s){
      if(s?.sceneGovernor)saveCfg(s.sceneGovernor);
      const out=oldRestore.apply(this,arguments);
      setTimeout(renderUI,0);
      return out;
    };
    window.__VELOUR_LIVE_CANON_STATE_BRIDGE__=true;
  }

  let persistTimer=0;
  function scheduleDraftPatch(){
    clearTimeout(persistTimer);
    persistTimer=setTimeout(async()=>{
      try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(window.__VELOUR_V4_STATE_SNAPSHOT__?.());}catch(_){}
    },180);
  }
  function bindLiveCanonPersistence(){
    const el=document.getElementById('v4HardCanon');
    if(!el||el.dataset.velourLiveCanonBound==='1')return;
    el.dataset.velourLiveCanonBound='1';
    el.addEventListener('input',scheduleDraftPatch);
    el.addEventListener('change',scheduleDraftPatch);
  }

  function renderUI(){
    bindLiveCanonPersistence();
    if(document.getElementById('velourSceneGovernorV1'))return;
    const anchor=document.getElementById('velourVerbalChemistryV2')||document.getElementById('velourV40Panel');
    if(!anchor||!anchor.parentNode)return;
    const cfg=loadCfg();
    const wrap=document.createElement('div');
    wrap.id='velourSceneGovernorV1';
    wrap.style.cssText='margin-top:10px;padding:10px;border:1px solid rgba(180,190,210,.18);border-radius:10px;background:rgba(255,255,255,.025)';
    wrap.innerHTML=`<div style="font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:8px">SCENE AGENCY · 여주 적극성</div>
      <label style="display:block;font-size:10px;margin-bottom:4px">적극성 강도 <b id="vsgAgencyIntensityValue">${cfg.agencyIntensity}</b></label>
      <input id="vsgAgencyIntensity" type="range" min="0" max="100" step="5" value="${cfg.agencyIntensity}" style="width:100%">
      <label style="display:block;font-size:10px;margin:8px 0 4px">적극성 빈도</label>
      <select id="vsgAgencyFrequency" style="width:100%"><option value="low">낮음</option><option value="balanced">균형</option><option value="high">높음</option><option value="very_high">매우 높음</option></select>
      <div style="font-size:9px;opacity:.65;margin-top:6px;line-height:1.5">대화·선택·이동·거절·조건 제시·장면 전환 전반에 적용. 단순히 말수가 많아지는 설정은 아님.</div>`;
    anchor.insertAdjacentElement?.('afterend',wrap) || anchor.parentNode.appendChild(wrap);
    const intensity=wrap.querySelector?.('#vsgAgencyIntensity')||document.getElementById('vsgAgencyIntensity');
    const value=wrap.querySelector?.('#vsgAgencyIntensityValue')||document.getElementById('vsgAgencyIntensityValue');
    const freq=wrap.querySelector?.('#vsgAgencyFrequency')||document.getElementById('vsgAgencyFrequency');
    if(freq)freq.value=cfg.agencyFrequency;
    intensity?.addEventListener('input',()=>{const next=saveCfg(Object.assign(loadCfg(),{agencyIntensity:Number(intensity.value)}));if(value)value.textContent=String(next.agencyIntensity);scheduleDraftPatch();});
    freq?.addEventListener('change',()=>{saveCfg(Object.assign(loadCfg(),{agencyFrequency:freq.value}));scheduleDraftPatch();});
  }

  function install(){
    if(window[GUARD])return true;
    if(typeof window.buildPrompt!=='function'||typeof window.__VELOUR_V4_STATE_SNAPSHOT__!=='function')return false;
    installStateBridge();
    const previousBuild=window.buildPrompt;
    window.buildPrompt=function(){
      const out=stripPriorLiveBlock(previousBuild.apply(this,arguments));
      const state=window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{};
      const block=directive(state);
      window.__VELOUR_LAST_LIVE_CANON_SCENE_GOVERNOR__={version:VERSION,hardCanonChars:String(state.hardCanon||'').length,episode:nextEpisode(state),at:new Date().toISOString()};
      return `${out}\n\n${block}`.trim();
    };
    window[GUARD]=true;
    window.__VELOUR_LIVE_CANON_SCENE_GOVERNOR_VERSION__=VERSION;
    window.__VELOUR_LIVE_CANON_SCENE_GOVERNOR_QA__={loadCfg,saveCfg,liveHardCanon,wardrobeFacts,sceneCandidates,sceneMemory,directive,agencyBudget};
    renderUI();
    console.info('✦ VELOUR Live Canon + Scene Variety Governor V1 loaded');
    return true;
  }

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(install()||tries>160)clearInterval(timer);},80);
  }
  setTimeout(renderUI,250);
})();