'use strict';

/* VELOUR — Ensemble Character Preferences V1
   Adds 1:1 / 1:many character profiles, baseline voice/personality presets,
   per-character intimacy preference tri-state controls, and a prompt planner.
   This layer never unlocks an adult scene by itself. Existing consent, pacing,
   relationship and HARD CANON rules remain authoritative.
*/
(() => {
  'use strict';
  if (window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES__) return;

  const VERSION='1.0.0';
  const GUARD='__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES__';
  const KEY='VELOUR_ENSEMBLE_CHARACTER_PREFS_V1';
  const MAX_PARTNERS=5;
  const MODE_ORDER=['allowed','priority','off'];
  const clone=v=>JSON.parse(JSON.stringify(v==null?{}:v));
  const clean=(v,max=180)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,max);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uniq=arr=>[...new Set((arr||[]).map(x=>clean(x)).filter(Boolean))];

  // Mirrors the current V4.4.38 core position catalog so user preferences can
  // constrain the already-existing diversity engine instead of creating a second planner.
  const POSITION_CATALOG = [
    ['missionary','정상위 · 기본 대면','face'],
    ['legs_elevated_face','다리 올린 대면','face'],
    ['butterfly_edge','버터플라이 · 침대 끝 대면','face'],
    ['pillow_face','베개 받침 대면','face'],
    ['lateral_coital','측면 대면 · 래터럴','side'],
    ['side_face','옆으로 마주보기','side'],
    ['spooning','스푸닝','side'],
    ['side_rear','옆으로 뒤에서','side'],
    ['prone_flat','프론 · 엎드린 자세','rear'],
    ['rear_kneeling','후배위 · 무릎 자세','rear'],
    ['rear_bent_supported','뒤에서 · 몸을 기대는 자세','rear'],
    ['rider_forward','상위 · 마주보기','seated'],
    ['rider_reverse','리버스 라이더','seated'],
    ['rider_squat','스쿼트 라이더','seated'],
    ['reverse_rider_crab','크랩 리버스 라이더','seated'],
    ['lotus','로터스 · 마주 앉기','seated'],
    ['lap_face','무릎 위 대면','seated'],
    ['lap_reverse','무릎 위 역방향','seated'],
    ['chair_rider','의자 라이더','seated'],
    ['chair_reverse','의자 역방향 라이더','seated'],
    ['sofa_edge','소파 끝 지지','support'],
    ['bed_edge','침대 끝 · 한쪽은 서기','support'],
    ['tabletop_supported','테이블/카운터 지지','support'],
    ['standing_face','선 자세 · 마주보기','standing'],
    ['standing_wall','벽 기대기 · 대면','standing'],
    ['standing_rear','선 자세 · 뒤에서','standing'],
    ['shower_standing','샤워 공간 · 서서','standing'],
    ['scissors','시저스 · 교차 측면','side'],
    ['pretzel','프레첼 · 비스듬한 측면','side'],
    ['bridge','브리지','advanced'],
    ['crab','크랩 · 기대 앉기','advanced'],
    ['kneeling_face','무릎 대면','face'],
    ['supported_wheelbarrow','서포트 휠배로우','advanced'],
    ['standing_lift','리프트형 선 자세','advanced'],
    ['sixty_nine','69 · 상호 구강','oral_manual'],
    ['side_sixty_nine','옆으로 69','oral_manual'],
    ['oral_seated','앉은 자세 구강 중심','oral_manual'],
    ['oral_standing','선 자세 구강 중심','oral_manual'],
    ['face_sitting','페이스시팅','oral_manual'],
    ['mutual_touch_side','옆으로 상호 자극 중심','oral_manual']
  ].map(([id,label,group])=>({id,label,group}));

  const CARESS_CATALOG = [
    ['long_kiss','긴 키스·입맞춤'],
    ['embrace','포옹·끌어안기'],
    ['face_hair','얼굴·머리카락 쓰다듬기'],
    ['neck_shoulder','목·어깨 중심 스킨십'],
    ['back_waist','등·허리 중심 스킨십'],
    ['hands_fingers','손·손가락 맞잡기'],
    ['lap_closeness','품·무릎 가까이 붙기'],
    ['massage','마사지·긴장 풀어주기'],
    ['slow_touch','느리고 오래 이어지는 애무'],
    ['playful_touch','장난스럽고 짓궂은 스킨십'],
    ['verbal_affection','다정한 말과 접촉 병행'],
    ['aftercare','장면 뒤 다정한 돌봄']
  ].map(([id,label])=>({id,label}));

  const SPEECH_PRESETS = [
    ['auto','자동 · 인물 설정 우선'],
    ['terse_dry','짧고 건조함'],
    ['polite_formal','정중하고 단정함'],
    ['casual_soft','편안하고 부드러움'],
    ['witty_teasing','능청스럽고 재치 있음'],
    ['blunt_direct','직설적이고 군더더기 없음'],
    ['elegant_controlled','차분하고 절제된 어휘']
  ];
  const PERSONALITY_PRESETS = [
    ['calm','침착'],['playful','장난기'],['warm','다정함'],['reserved','과묵함'],
    ['proud','자존심 강함'],['rational','이성적'],['impulsive','충동적'],['sharp','예민·날카로움'],
    ['gentle','온화함'],['proactive','적극적'],['shy','수줍음'],['competitive','승부욕']
  ];
  const TENDENCY_PRESETS = [
    ['initiative','먼저 행동함'],['responsive','상대 반응을 잘 읽음'],['boundary','경계를 분명히 함'],
    ['protective','보호적'],['competitive','경쟁적'],['affectionate','애정 표현이 자연스러움'],
    ['private','사생활을 중시함'],['expressive','감정을 비교적 잘 드러냄'],['slow_to_open','마음을 늦게 엶']
  ];

  const DEFAULT_POSITION_MODES=()=>Object.fromEntries(POSITION_CATALOG.map(x=>[x.id,'allowed']));
  const DEFAULT_CARESS_MODES=()=>Object.fromEntries(CARESS_CATALOG.map(x=>[x.id,'allowed']));
  const normalizeMode=v=>MODE_ORDER.includes(String(v))?String(v):'allowed';
  const normalizeModes=(raw,catalog)=>Object.fromEntries(catalog.map(x=>[x.id,normalizeMode(raw?.[x.id])]));
  const clamp100=v=>Math.max(0,Math.min(100,Number(v||0)));
  const normalizeFreq=v=>['low','balanced','high','very_high'].includes(String(v))?String(v):'balanced';

  function baseCharacter(kind,index=0){
    return {
      id:kind==='heroine'?'heroine':`partner_${index+1}`,
      name:kind==='heroine'?'여주':`남주 ${index+1}`,
      role:'', relationshipNote:'', customNote:'',
      speechPreset:'auto', personalities:[], tendencies:[],
      initiativeIntensity:kind==='heroine'?72:60,
      initiativeFrequency:'balanced',
      positionModes:DEFAULT_POSITION_MODES(),
      caressModes:DEFAULT_CARESS_MODES()
    };
  }
  const DEFAULT={
    mode:'one_to_one',
    heroine:baseCharacter('heroine'),
    partners:[baseCharacter('partner',0)]
  };

  function normalizeCharacter(raw,kind,index){
    const base=baseCharacter(kind,index);
    const c=Object.assign(base,raw||{});
    c.id=clean(c.id,48)||base.id;
    c.name=clean(c.name,60)||base.name;
    c.role=clean(c.role,120);
    c.relationshipNote=clean(c.relationshipNote,180);
    c.customNote=clean(c.customNote,220);
    c.speechPreset=SPEECH_PRESETS.some(x=>x[0]===c.speechPreset)?c.speechPreset:'auto';
    c.personalities=uniq(c.personalities).filter(id=>PERSONALITY_PRESETS.some(x=>x[0]===id)).slice(0,5);
    c.tendencies=uniq(c.tendencies).filter(id=>TENDENCY_PRESETS.some(x=>x[0]===id)).slice(0,5);
    c.initiativeIntensity=clamp100(c.initiativeIntensity);
    c.initiativeFrequency=normalizeFreq(c.initiativeFrequency);
    c.positionModes=normalizeModes(c.positionModes,POSITION_CATALOG);
    c.caressModes=normalizeModes(c.caressModes,CARESS_CATALOG);
    return c;
  }
  function normalizeCfg(raw){
    const src=raw&&typeof raw==='object'?raw:{};
    const partners=(Array.isArray(src.partners)?src.partners:DEFAULT.partners).slice(0,MAX_PARTNERS).map((p,i)=>normalizeCharacter(p,'partner',i));
    if(!partners.length)partners.push(baseCharacter('partner',0));
    return {
      mode:src.mode==='one_to_many'?'one_to_many':'one_to_one',
      heroine:normalizeCharacter(src.heroine,'heroine',0),
      partners
    };
  }
  function loadCfg(){
    try{return normalizeCfg(JSON.parse(localStorage.getItem(KEY)||'null'));}
    catch(_){return normalizeCfg(DEFAULT);}
  }
  function saveCfg(next){
    const cfg=normalizeCfg(next);
    try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(_){}
    return cfg;
  }
  function activePartners(cfg=loadCfg()){
    return cfg.mode==='one_to_many'?cfg.partners:cfg.partners.slice(0,1);
  }

  const labelOf=(list,id)=>list.find(x=>x[0]===id)?.[1]||id;
  const itemLabel=(catalog,id)=>catalog.find(x=>x.id===id)?.label||id;
  function modeBuckets(character,catalog,key){
    const map=character?.[key]||{};
    const out={priority:[],allowed:[],off:[]};
    for(const item of catalog)out[normalizeMode(map[item.id])].push(item.id);
    return out;
  }
  function nextEpisode(state){
    const confirmed=Number(state?.runtime?.confirmedEpisode||0);
    const rows=Array.isArray(state?.runtime?.scenes)?state.runtime.scenes:[];
    return Math.max(confirmed,Number(rows.at(-1)?.episode||0))+1;
  }
  function currentDirective(){return String(document.getElementById('v33Next')?.value||'').trim();}
  function focusPartner(cfg,state,directive=currentDirective()){
    const partners=activePartners(cfg);
    if(!partners.length)return null;
    const text=String(directive||'');
    const named=partners.find(p=>p.name&&text.includes(p.name));
    if(named)return named;
    if(partners.length===1)return partners[0];
    return partners[(Math.max(1,nextEpisode(state))-1)%partners.length];
  }
  function legacyPositionAllowed(item,state){
    const selected=Array.isArray(state?.intimacyPatterns)?state.intimacyPatterns:[];
    if(!selected.length)return true;
    const map={
      face:['face'],side:['side'],rear:['rear'],seated:['seated'],standing:['standing'],oral_manual:['oral_manual'],
      support:['bed','sofa_chair','floor_wall'],advanced:['face','rear','side','seated','standing']
    };
    return (map[item.group]||[]).some(id=>selected.includes(id));
  }
  function mutualPositionCandidates(a,b,state,limit=8){
    if(!a||!b)return [];
    const usage=state?.runtime?.positionUsage&&typeof state.runtime.positionUsage==='object'?state.runtime.positionUsage:{};
    const recent=new Set(Array.isArray(state?.runtime?.lastSuggestedPositions)?state.runtime.lastSuggestedPositions.slice(-8):[]);
    const ep=nextEpisode(state);
    return POSITION_CATALOG
      .filter(item=>legacyPositionAllowed(item,state)&&a.positionModes[item.id]!=='off'&&b.positionModes[item.id]!=='off')
      .map(item=>{
        let score=0;
        if(a.positionModes[item.id]==='priority')score+=3;
        if(b.positionModes[item.id]==='priority')score+=3;
        score-=Math.min(5,Number(usage[item.id]||0)*0.55);
        if(recent.has(item.id))score-=4;
        score+=((ep+item.id.length)%7)*0.01;
        return {id:item.id,label:item.label,score};
      })
      .sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id))
      .slice(0,Math.max(1,limit));
  }
  function mutualCaressCandidates(a,b,limit=8){
    if(!a||!b)return [];
    return CARESS_CATALOG
      .filter(item=>a.caressModes[item.id]!=='off'&&b.caressModes[item.id]!=='off')
      .map(item=>({
        id:item.id,label:item.label,
        score:(a.caressModes[item.id]==='priority'?2:0)+(b.caressModes[item.id]==='priority'?2:0)
      }))
      .sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id))
      .slice(0,Math.max(1,limit));
  }
  function initiativeBudget(character){
    return {low:1,balanced:2,high:3,very_high:4}[character?.initiativeFrequency]||2;
  }
  function initiativeTone(character){
    const n=Number(character?.initiativeIntensity||0);
    if(n>=80)return '강함';
    if(n>=55)return '중간';
    if(n>=30)return '절제';
    return '낮음';
  }
  function characterLine(c,isHeroine=false){
    const speech=labelOf(SPEECH_PRESETS,c.speechPreset);
    const personality=c.personalities.map(id=>labelOf(PERSONALITY_PRESETS,id)).join(', ')||'자동';
    const tendency=c.tendencies.map(id=>labelOf(TENDENCY_PRESETS,id)).join(', ')||'자동';
    return `- ${isHeroine?'여주':'상대'} ${c.name}: 역할=${c.role||'미지정'} / 관계메모=${c.relationshipNote||'없음'} / 말투=${speech} / 성격=${personality} / 성향=${tendency} / 적극성=${c.initiativeIntensity}/100(${initiativeTone(c)}, 빈도 ${c.initiativeFrequency}, 장면방향 전환 ${initiativeBudget(c)}회 안팎)${c.customNote?` / 추가=${c.customNote}`:''}`;
  }
  function preferenceLine(c,catalog,key,label){
    const b=modeBuckets(c,catalog,key);
    const names=ids=>ids.map(id=>itemLabel(catalog,id));
    return `- ${c.name} ${label}: 주력=${names(b.priority).join(', ')||'없음'} / OFF=${names(b.off).join(', ')||'없음'} / 나머지=허용`;
  }

  function stripPriorBlock(prompt){
    return String(prompt||'').replace(/\n?===== VELOUR ENSEMBLE CHARACTER · PREFERENCE ENGINE V1 =====[\s\S]*?===== \/VELOUR ENSEMBLE CHARACTER · PREFERENCE ENGINE V1 =====\s*/g,'\n').trim();
  }
  function directive(state,cfg=loadCfg()){
    const partners=activePartners(cfg);
    const focus=focusPartner(cfg,state);
    const positionCandidates=focus?mutualPositionCandidates(cfg.heroine,focus,state):[];
    const caressCandidates=focus?mutualCaressCandidates(cfg.heroine,focus):[];
    const modeLabel=cfg.mode==='one_to_many'?'1:다 · 여주 1명과 여러 상대 캐릭터':'1:1';
    return `===== VELOUR ENSEMBLE CHARACTER · PREFERENCE ENGINE V1 =====
[캐릭터 구조]
- 모드: ${modeLabel}.
- 이 프리셋은 빠른 기본값이다. 사용자 인물 설정 원문과 최신 HARD CANON이 더 구체적이거나 충돌하면 그쪽이 우선한다.
- 모든 말투·성격·성향은 캐릭터별로 독립 유지한다. 다른 인물의 말버릇·지식·감정·관계 권리를 복사하지 않는다.
- 1:다 모드는 여러 개의 독립적인 1:1 관계 edge를 뜻한다. 자동으로 모두가 같은 관계가 되거나, 동시에 같은 장면의 친밀 관계가 되었다고 가정하지 않는다.
- 특별한 인과나 사용자 지시가 없으면 한 장면의 중심 상대는 1명으로 유지해 캐릭터 목소리와 관계 진전을 섞지 않는다.
- 친밀 설정은 성인 캐릭터 사이에서 기존 동의·관계 단계·페이싱 게이트가 이미 허용한 장면에만 적용한다. 이 엔진 자체가 장면을 조기 해금하지 않는다.

[캐릭터 프로필]
${characterLine(cfg.heroine,true)}
${partners.map(p=>characterLine(p,false)).join('\n')}

[이번 화 중심 상대]
- 기본 focus=${focus?.name||'없음'}. 이번 화 지시에서 다른 이름을 명시했거나 직전 인과가 다른 상대를 요구하면 그 인물을 우선한다.
- 1:다에서 다른 상대들은 필요한 사회적 장면에 등장할 수 있지만, 모두를 억지로 한 장면에 모으지 않는다.

[캐릭터별 친밀 취향 — 주력 / 허용 / OFF]
${preferenceLine(cfg.heroine,POSITION_CATALOG,'positionModes','구도')}
${focus?preferenceLine(focus,POSITION_CATALOG,'positionModes','구도'):''}
${preferenceLine(cfg.heroine,CARESS_CATALOG,'caressModes','애정·애무')}
${focus?preferenceLine(focus,CARESS_CATALOG,'caressModes','애정·애무'):''}
- OFF는 자동 생성 후보에서 완전히 제외한다. 주력은 장면에 적합할 때 강하게 우선하지만 매번 의무 반복하지 않는다.
- 두 인물이 함께 있는 장면에서는 둘 다 OFF가 아닌 교집합만 사용한다. 한쪽의 주력이라도 다른 쪽이 OFF면 사용하지 않는다.
- 기존 전역 친밀 패턴 설정이 더 좁으면 그 전역 허용 범위와의 교집합만 사용한다.
- 최근 사용 기록과 같은 항목을 단어만 바꿔 되풀이하지 않는다. 주력 안에서도 저사용 후보를 먼저 회전한다.
- 현재 focus와 상호 허용되는 저사용 구도 후보: ${positionCandidates.map(x=>x.label).join(' / ')||'없음 — 억지로 만들지 말 것'}.
- 현재 focus와 상호 허용되는 애정·애무 후보: ${caressCandidates.map(x=>x.label).join(' / ')||'없음 — 일반적인 대화/거리 조절로 대체'}.
- 다양성 때문에 부자연스럽게 전환하지 않는다. 상대 반응·환경·감정 변화 → 인물 선택 → 거리/동선 변화의 인과가 먼저다.
===== /VELOUR ENSEMBLE CHARACTER · PREFERENCE ENGINE V1 =====`;
  }

  function installStateBridge(){
    if(window.__VELOUR_ENSEMBLE_PREF_STATE_BRIDGE__)return;
    const oldSnapshot=window.__VELOUR_V4_STATE_SNAPSHOT__;
    if(typeof oldSnapshot==='function')window.__VELOUR_V4_STATE_SNAPSHOT__=function(){
      const s=oldSnapshot.apply(this,arguments)||{};
      s.ensemblePreferences=loadCfg();
      return s;
    };
    const oldRestore=window.__VELOUR_V4_STATE_RESTORE__;
    if(typeof oldRestore==='function')window.__VELOUR_V4_STATE_RESTORE__=function(s){
      if(s?.ensemblePreferences)saveCfg(s.ensemblePreferences);
      const out=oldRestore.apply(this,arguments);
      setTimeout(()=>{document.getElementById('velourEnsemblePrefsV1')?.remove();renderUI();},0);
      return out;
    };
    window.__VELOUR_ENSEMBLE_PREF_STATE_BRIDGE__=true;
  }

  let persistTimer=0;
  function scheduleDraftPatch(){
    clearTimeout(persistTimer);
    persistTimer=setTimeout(async()=>{
      try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(window.__VELOUR_V4_STATE_SNAPSHOT__?.());}catch(_){}
    },180);
  }
  function cycleMode(mode){return MODE_ORDER[(MODE_ORDER.indexOf(normalizeMode(mode))+1)%MODE_ORDER.length];}
  function paintMode(btn,mode){
    if(!btn)return;
    const m=normalizeMode(mode);btn.dataset.mode=m;
    btn.textContent=`${btn.dataset.label||''} · ${m==='priority'?'주력':m==='off'?'OFF':'허용'}`;
    btn.style.background=m==='priority'?'rgba(245,196,107,.18)':m==='off'?'rgba(130,130,145,.07)':'rgba(255,255,255,.035)';
    btn.style.borderColor=m==='priority'?'rgba(245,196,107,.65)':m==='off'?'rgba(140,140,155,.20)':'rgba(245,196,107,.24)';
    btn.style.color=m==='off'?'rgba(220,210,215,.45)':'#f7e7c4';
  }
  function tagButton(id,label,selected,kind){
    return `<button type="button" data-tag-kind="${kind}" data-tag-id="${esc(id)}" class="vcp-tag" style="border:1px solid ${selected?'rgba(245,196,107,.60)':'rgba(245,196,107,.20)'};background:${selected?'rgba(245,196,107,.16)':'rgba(255,255,255,.03)'};color:${selected?'#ffebaa':'#cdbbc4'};border-radius:8px;padding:5px 7px;font-size:9px">${esc(label)}</button>`;
  }
  function prefButtons(character,catalog,key,kind){
    return catalog.map(item=>{
      const mode=normalizeMode(character[key]?.[item.id]);
      return `<button type="button" data-pref-kind="${kind}" data-pref-id="${item.id}" data-label="${esc(item.label)}" data-mode="${mode}" style="text-align:left;border:1px solid rgba(245,196,107,.24);background:rgba(255,255,255,.035);color:#f7e7c4;border-radius:8px;padding:6px 7px;font-size:9px;line-height:1.35">${esc(item.label)} · ${mode==='priority'?'주력':mode==='off'?'OFF':'허용'}</button>`;
    }).join('');
  }
  function characterCard(character,kind,index,removable){
    const personalities=PERSONALITY_PRESETS.map(([id,label])=>tagButton(id,label,character.personalities.includes(id),'personality')).join('');
    const tendencies=TENDENCY_PRESETS.map(([id,label])=>tagButton(id,label,character.tendencies.includes(id),'tendency')).join('');
    return `<details data-char-kind="${kind}" data-char-index="${index}" style="margin-top:8px;border:1px solid rgba(245,196,107,.16);border-radius:10px;padding:8px;background:rgba(255,255,255,.02)">
      <summary style="cursor:pointer;font-size:10px;font-weight:800;color:#f4dfb1">${kind==='heroine'?'여주':`상대 ${index+1}`} · ${esc(character.name)}${removable?' <span style="opacity:.55">(삭제 가능)</span>':''}</summary>
      <div style="margin-top:8px;display:grid;gap:7px">
        <input data-field="name" value="${esc(character.name)}" placeholder="이름" style="font-size:10px;padding:7px 8px">
        <input data-field="role" value="${esc(character.role)}" placeholder="직업/역할" style="font-size:10px;padding:7px 8px">
        <input data-field="relationshipNote" value="${esc(character.relationshipNote)}" placeholder="여주와의 관계 메모" style="font-size:10px;padding:7px 8px">
        <select data-field="speechPreset" style="font-size:10px;padding:7px 8px">${SPEECH_PRESETS.map(([id,label])=>`<option value="${id}"${character.speechPreset===id?' selected':''}>${esc(label)}</option>`).join('')}</select>
        <div><div style="font-size:9px;margin-bottom:4px;opacity:.72">성격 기본값</div><div data-tags="personality" style="display:flex;flex-wrap:wrap;gap:4px">${personalities}</div></div>
        <div><div style="font-size:9px;margin-bottom:4px;opacity:.72">행동 성향</div><div data-tags="tendency" style="display:flex;flex-wrap:wrap;gap:4px">${tendencies}</div></div>
        <label style="font-size:9px">적극성 강도 <b data-intensity-value>${character.initiativeIntensity}</b><input data-field="initiativeIntensity" type="range" min="0" max="100" step="5" value="${character.initiativeIntensity}" style="width:100%"></label>
        <label style="font-size:9px">적극성 빈도<select data-field="initiativeFrequency" style="font-size:10px;padding:6px 8px;margin-top:3px"><option value="low"${character.initiativeFrequency==='low'?' selected':''}>낮음</option><option value="balanced"${character.initiativeFrequency==='balanced'?' selected':''}>균형</option><option value="high"${character.initiativeFrequency==='high'?' selected':''}>높음</option><option value="very_high"${character.initiativeFrequency==='very_high'?' selected':''}>매우 높음</option></select></label>
        <textarea data-field="customNote" placeholder="추가 성격/말투 메모" style="font-size:10px;min-height:54px">${esc(character.customNote)}</textarea>
        <details><summary style="font-size:9.5px;cursor:pointer">친밀 구도 40종 · 주력/허용/OFF</summary><div data-pref-grid="position" style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">${prefButtons(character,POSITION_CATALOG,'positionModes','position')}</div></details>
        <details><summary style="font-size:9.5px;cursor:pointer">애정·애무 성향 · 주력/허용/OFF</summary><div data-pref-grid="caress" style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">${prefButtons(character,CARESS_CATALOG,'caressModes','caress')}</div></details>
        ${removable?'<button type="button" data-remove-partner="1" style="border:1px solid rgba(255,140,155,.24);background:rgba(255,100,120,.05);color:#ffc0ca;border-radius:8px;padding:7px;font-size:9px">이 상대 캐릭터 삭제</button>':''}
      </div>
    </details>`;
  }
  function renderUI(){
    if(document.getElementById('velourEnsemblePrefsV1'))return;
    const anchor=document.getElementById('velourVerbalChemistryV2')||document.getElementById('velourV40Panel');
    if(!anchor||!anchor.parentNode)return;
    const cfg=loadCfg();
    const wrap=document.createElement('div');
    wrap.id='velourEnsemblePrefsV1';
    wrap.style.cssText='margin-top:10px;padding:10px;border:1px solid rgba(245,196,107,.20);border-radius:10px;background:rgba(255,255,255,.025)';
    wrap.innerHTML=`<div style="font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:7px">CHARACTERS · 관계/말투/취향</div>
      <label style="display:block;font-size:9.5px;margin-bottom:4px">관계 구조</label>
      <select id="vcpMode" style="font-size:10px;padding:7px 8px"><option value="one_to_one"${cfg.mode==='one_to_one'?' selected':''}>1:1</option><option value="one_to_many"${cfg.mode==='one_to_many'?' selected':''}>1:다 · 여주 1명 + 여러 상대</option></select>
      <div style="font-size:9px;opacity:.62;line-height:1.45;margin-top:5px">1:다는 각 상대와의 관계를 독립적으로 유지합니다. 자동 다인 친밀 장면 모드가 아닙니다.</div>
      <div id="vcpCards">${characterCard(cfg.heroine,'heroine',0,false)}${activePartners(cfg).map((p,i)=>characterCard(p,'partner',i,cfg.mode==='one_to_many'&&i>0)).join('')}</div>
      ${cfg.mode==='one_to_many'&&cfg.partners.length<MAX_PARTNERS?'<button type="button" id="vcpAddPartner" style="margin-top:8px;width:100%;border:1px solid rgba(245,196,107,.26);background:rgba(245,196,107,.07);color:#ffebaa;border-radius:8px;padding:7px;font-size:9.5px">+ 상대 캐릭터 추가</button>':''}`;
    anchor.insertAdjacentElement?.('afterend',wrap) || anchor.parentNode.appendChild(wrap);
    wrap.querySelectorAll?.('[data-pref-kind]').forEach(btn=>paintMode(btn,btn.dataset.mode));

    wrap.addEventListener('change',ev=>{
      const target=ev.target;
      if(target?.id==='vcpMode'){
        const next=loadCfg();next.mode=target.value==='one_to_many'?'one_to_many':'one_to_one';saveCfg(next);wrap.remove();renderUI();scheduleDraftPatch();return;
      }
      const card=target?.closest?.('[data-char-kind]');if(!card||!target?.dataset?.field)return;
      const next=loadCfg();const kind=card.dataset.charKind;const index=Number(card.dataset.charIndex||0);
      const character=kind==='heroine'?next.heroine:next.partners[index];if(!character)return;
      const field=target.dataset.field;
      if(field==='initiativeIntensity')character[field]=Number(target.value);else character[field]=target.value;
      saveCfg(next);scheduleDraftPatch();
    });
    wrap.addEventListener('input',ev=>{
      const target=ev.target;const card=target?.closest?.('[data-char-kind]');if(!card||!target?.dataset?.field)return;
      const next=loadCfg();const kind=card.dataset.charKind;const index=Number(card.dataset.charIndex||0);
      const character=kind==='heroine'?next.heroine:next.partners[index];if(!character)return;
      const field=target.dataset.field;
      if(field==='initiativeIntensity'){character[field]=Number(target.value);const v=card.querySelector?.('[data-intensity-value]');if(v)v.textContent=String(target.value);}else character[field]=target.value;
      saveCfg(next);scheduleDraftPatch();
    });
    wrap.addEventListener('click',ev=>{
      const target=ev.target;
      if(target?.id==='vcpAddPartner'){
        const next=loadCfg();if(next.partners.length<MAX_PARTNERS)next.partners.push(baseCharacter('partner',next.partners.length));saveCfg(next);wrap.remove();renderUI();scheduleDraftPatch();return;
      }
      const card=target?.closest?.('[data-char-kind]');if(!card)return;
      const next=loadCfg();const kind=card.dataset.charKind;const index=Number(card.dataset.charIndex||0);
      const character=kind==='heroine'?next.heroine:next.partners[index];if(!character)return;
      if(target?.dataset?.removePartner==='1'&&kind==='partner'&&index>0){next.partners.splice(index,1);saveCfg(next);wrap.remove();renderUI();scheduleDraftPatch();return;}
      if(target?.dataset?.tagId){
        const key=target.dataset.tagKind==='personality'?'personalities':'tendencies';const id=target.dataset.tagId;
        character[key]=character[key].includes(id)?character[key].filter(x=>x!==id):[...character[key],id].slice(-5);
        saveCfg(next);wrap.remove();renderUI();scheduleDraftPatch();return;
      }
      if(target?.dataset?.prefId){
        const key=target.dataset.prefKind==='position'?'positionModes':'caressModes';const id=target.dataset.prefId;
        character[key][id]=cycleMode(character[key][id]);saveCfg(next);paintMode(target,character[key][id]);scheduleDraftPatch();return;
      }
    });
  }

  function install(){
    if(window[GUARD])return true;
    if(typeof window.buildPrompt!=='function'||typeof window.__VELOUR_V4_STATE_SNAPSHOT__!=='function')return false;
    installStateBridge();
    const previousBuild=window.buildPrompt;
    window.buildPrompt=function(){
      const out=stripPriorBlock(previousBuild.apply(this,arguments));
      const state=window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{};
      const cfg=loadCfg();
      const block=directive(state,cfg);
      const focus=focusPartner(cfg,state);
      window.__VELOUR_LAST_ENSEMBLE_CHARACTER_PREFERENCES__={version:VERSION,mode:cfg.mode,partnerCount:activePartners(cfg).length,focusPartner:focus?.name||'',episode:nextEpisode(state),at:new Date().toISOString()};
      return `${out}\n\n${block}`.trim();
    };
    window[GUARD]=true;
    window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_VERSION__=VERSION;
    window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__={
      POSITION_CATALOG,CARESS_CATALOG,SPEECH_PRESETS,PERSONALITY_PRESETS,TENDENCY_PRESETS,
      normalizeCfg,loadCfg,saveCfg,activePartners,focusPartner,modeBuckets,mutualPositionCandidates,mutualCaressCandidates,directive,cycleMode,initiativeBudget
    };
    renderUI();
    console.info('✦ VELOUR Ensemble Character Preferences V1 loaded');
    return true;
  }

  if(!install()){
    let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>160)clearInterval(timer);},80);
  }
  setTimeout(renderUI,300);
})();
