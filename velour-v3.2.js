
'use strict';

/*
  VELOUR Story Engine V3.2
  - adult characters only
  - slow-burn 2~4 episode pacing
  - autonomous continuation when no next-scene instruction is given
  - 1~3 concept crossover mixer
  - repetition guard / scene rotation
  - existing save/library/generator preserved
*/
(() => {
  if (window.__VELOUR_V3_INSTALLED__) return;
  window.__VELOUR_V3_INSTALLED__ = true;

  const V3_KEY = 'VELOUR_STORY_ENGINE_V32';
  const NEXT_KEY = 'VELOUR_NEXT_DIRECTIVE_V32';

  const CONCEPTS = [
    ['office','오피스 권력전 · 상사×부하','낮에는 엄격한 업무 관계, 사적인 시간에는 주도권이 흔들리는 성인 로맨스'],
    ['secretary_ceo','비서×대표/사장','완벽한 프로페셔널 관계 속 의존과 감정 균열'],
    ['coworker_rival','앙숙 동료·라이벌','업무에서는 경쟁하고 사적으로는 서로를 과하게 의식하는 배틀 로맨스'],
    ['anonymous_match','익명 앱/보이스 매칭 발각','익명으로 가까워진 두 성인이 현실의 지인·라이벌임을 알게 되는 반전'],
    ['contract','계약연애·쇼윈도 관계','스킨십/감정 금지 룰을 만든 성인 커플의 규칙 붕괴'],
    ['reunion','재회·오래된 짝사랑','과거 감정이 남은 성인들이 예상치 못한 장소에서 다시 만남'],
    ['fake_dating','가짜 연애·질투 작전','다른 목적 때문에 연인 행세를 하다가 진짜 감정이 생김'],
    ['lesson','연애/스킨십 레슨','성인끼리 합의한 연애 연습이 실제 감정으로 번짐'],
    ['younger_scheme','조신한 연하의 계략','순진해 보이는 연하가 사실 관계의 흐름을 읽고 있는 갭'],
    ['double_life','이중생활·정체 반전','공적인 이미지와 사적인 성격이 크게 다른 성인 캐릭터'],
    ['one_night_after','하룻밤 이후 재회','과거의 실수/충동 이후 다시 마주치며 어색함과 미련이 쌓임'],
    ['thin_wall','옆집·얇은 벽','생활 소음과 반복되는 마주침 때문에 서로를 지나치게 의식하게 됨'],
    ['sharehouse','셰어하우스·룸메이트','성인 룸메이트 사이 사적인 경계가 천천히 흐려짐'],
    ['elevator','엘리베이터·정전·밀폐공간','예상치 못한 고립 상황에서 대화와 거리감이 급격히 가까워짐'],
    ['snow_cabin','폭설 산장·펜션 고립','며칠간 외부와 단절되어 함께 생활하며 감정이 축적됨'],
    ['safehouse','세이프하우스·경호','보호 대상과 경호원이 위험을 피해 장기간 같은 공간에 머묾'],
    ['travel','출장·레이오버·호텔 오예약','낯선 도시와 제한된 공간이 평소의 경계를 흐림'],
    ['camping','차박·캠핑·폭우','좁은 공간과 악천후 속에서 자연스럽게 가까워짐'],
    ['island','섬·외딴 지역 발령','좁은 지역사회와 반복되는 일상 속 서서히 깊어지는 관계'],
    ['doctor_colleague','의료계 동료 로맨스','성인 의료인 동료들이 긴 당직과 고압적 업무 환경 속 가까워짐'],
    ['pt','PT·필라테스·요가','성인 회원과 강사가 전문적 경계를 지키며도 생기는 긴장과 호감'],
    ['tattoo','타투이스트×성인 손님','오랜 작업 시간과 집중된 시선 속에서 쌓이는 심리적 텐션'],
    ['dance','댄스·발레·탱고 파트너','호흡·리듬·신뢰를 맞추는 과정에서 감정이 깊어짐'],
    ['photo','사진작가×모델','촬영 디렉팅과 렌즈 너머 시선이 만들어내는 긴장'],
    ['artist_model','화가×성인 누드/크로키 모델','예술적 관찰과 뮤즈 집착, 시선과 거리의 긴장'],
    ['writer_assistant','19+ 창작자×성인 보조작가','작품 취재·대사 검수·마감 작업 속 감정이 번짐'],
    ['music','지휘자·악기 레슨 파트너','호흡과 완벽주의, 소리와 침묵을 통한 심리전'],
    ['pottery','도예·조각 공방','손을 겹쳐 작업하고 형태를 교정하며 천천히 친밀해짐'],
    ['perfume','조향사·향수 제작','체취·향·기억을 매개로 감각적 친밀감이 쌓임'],
    ['bar','바텐더·소믈리에','영업 종료 후의 조용한 바와 오래 이어지는 대화'],
    ['showbiz','배우×매니저/스타일리스트','대중 앞 이미지와 백스테이지의 의존 관계'],
    ['actor_actor','배우×배우','로맨스 장면 리허설과 메소드 연기가 실제 감정과 충돌'],
    ['idol_manager','성인 아이돌×매니저','이동 차량·백스테이지·숙소 관리 속 비밀스러운 감정'],
    ['streamer','스트리머·성우·방송','온라인 페르소나와 현실 정체의 간극, 마이크 밖의 관계'],
    ['creator_whale','크리에이터×익명 큰손','익명 후원자가 현실의 가까운 성인 지인이라는 반전'],
    ['livecommerce','라이브커머스·온에어','카메라 앞 완벽한 태도와 방송 밖의 긴장'],
    ['bodyguard','보디가드×경호 대상','규정과 감정 사이의 줄다리기'],
    ['law_rivals','검사·변호사·수사 파트너','성인 법조인/수사 파트너 사이의 협업과 견제'],
    ['spy','스파이·잠입 위장 커플','임무상 연인 행세가 실제 감정으로 번지는 첩보 로맨스'],
    ['military_rivals','군사/SF 라이벌','성인 군인·요원들이 임무와 생존 압박 속 서로에게 의존'],
    ['bunker','지하 벙커·아포칼립스','폐쇄된 생존 공간에서 장기적 신뢰와 집착이 생김'],
    ['android','안드로이드·휴머노이드','성인형 안드로이드의 자아와 인간 파트너의 감정 경계'],
    ['vr','VR·감각 동기화 SF','가상공간 임무에서 감각과 감정이 동기화되는 성인 캐릭터'],
    ['hunter','헌터·던전 파트너','성인 헌터/서포터가 위험한 임무를 반복하며 신뢰를 쌓음'],
    ['fantasy_mark','각인·마법적 연결','상호 합의 가능한 판타지적 연결 때문에 감정이 증폭'],
    ['vampire','뱀파이어·수인·인외','성인 인간/인외 사이 본능과 이성을 둘러싼 로맨스'],
    ['goddess_gladiator','여신×검투사','신화적 권위와 인간 전사의 자존심이 충돌하는 장대한 로맨스'],
    ['paladin','성기사·성녀·마법사','서약·사명과 개인적 감정이 충돌하는 성인 판타지'],
    ['oriental_palace','동양 궁중·호위무사','궁중 암투와 비밀 보호 관계 속 느리게 쌓이는 감정'],
    ['royal_contract','정략결혼·왕실 계약','원수 가문 출신 성인 두 사람이 정치적 결혼 후 관계를 재정의'],
    ['assassin','후궁/귀족×비밀 해결사','정치적 공범 관계와 위험한 신뢰가 쌓이는 다크 로맨스'],
    ['time_loop','타임루프·회귀','반복되는 시간 속에서 서로만 기억하거나 관계가 달라지는 설정'],
    ['body_swap','바디 스왑','성인 두 사람이 서로의 일상과 약점을 알게 되며 감정이 변함'],
    ['mystery_voice','목소리 정체 반전','익숙한 목소리의 주인이 현실의 예상 밖 인물임을 알게 됨'],
    ['slow_domestic','일상 침범·가짜 동거','집 비밀번호, 식사, 옷 등 사소한 생활 공유가 연애보다 먼저 깊어짐'],
    ['jealousy','제3자 등장·질투 촉발','관계 정의를 미루던 두 사람이 다른 인물 등장으로 감정을 자각'],
    ['secret_crush','숨겨온 짝사랑','쿨한 관계를 연기하지만 한쪽은 오래전부터 진심이었던 구조'],
    ['care','아플 때 간호·무방비 일상','완벽한 모습이 무너진 순간 돌봄을 통해 관계가 깊어짐'],
    ['rule_break','키스/연락 금지 룰','감정을 막기 위해 만든 규칙 하나가 서서히 무너지는 구조'],
    ['pillow_talk','애프터보다 대화가 깊어지는 관계','신체적 관계보다 일상 대화와 정서적 의존이 먼저 깊어짐'],
    ['doctor_patient_slow','주치의×성인 환자 슬로우번','전문적 경계를 존중하며 치료와 회복 과정에서 신뢰와 감정이 천천히 깊어지는 관계'],
    ['rehab','재활치료사×성인 환자','재활 목표와 반복되는 만남 속에서 신뢰가 쌓이고 치료 종료 뒤 관계가 새로 정의됨'],
    ['team_doctor','팀닥터×성인 선수','부상 회복과 복귀 압박을 함께 견디며 생기는 신뢰와 긴장'],
    ['night_shift','야간 당직 의료진','긴 당직과 호출, 텅 빈 복도와 휴게실 속에서 서서히 가까워지는 의료계 동료'],
    ['sleep_lab','수면 연구·관찰실','성인 참가자와 연구진이 비성적 연구 환경에서 반복적으로 만나며 취약한 일상을 공유'],
    ['caregiver','간병·돌봄을 둘러싼 성인 관계','회복과 생활 보조 과정에서 생기는 신뢰와 일상적 친밀감'],
    ['island_clinic','섬 보건지소·파견 근무','외딴 지역에서 의료진과 성인 파견 인력이 좁은 생활권을 공유하며 쌓는 슬로우번'],
    ['nonfamily_house','가족처럼 지낸 비혈연 성인 동거인','오래 가족처럼 가까웠지만 실제 가족관계는 아닌 두 성인이 성인이 된 뒤 서로를 새롭게 의식함'],
    ['family_friend','집안끼리 가까운 두 성인','오래된 가족 지인 관계 때문에 쉽게 선을 넘지 못하고 감정을 숨기는 성인 로맨스']
  ];

  function loadCfg(){
    try { return Object.assign({
      pacing:'slow3',
      autoContinue:true,
      mixCount:2,
      dirtyDialogue:true,
      defaultProfile:true,
      selected:[]
    }, JSON.parse(localStorage.getItem(V3_KEY)||'{}')); }
    catch { return {pacing:'slow3',autoContinue:true,mixCount:2,dirtyDialogue:true,defaultProfile:true,selected:[]}; }
  }
  function saveCfg(cfg){ localStorage.setItem(V3_KEY, JSON.stringify(cfg)); }

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function installCss(){
    if(document.getElementById('velour-v3-css'))return;
    const st=document.createElement('style');
    st.id='velour-v3-css';
    st.textContent=`
      .v3-panel{border:1px solid rgba(245,196,107,.28);background:rgba(21,7,14,.76);border-radius:20px;padding:16px;margin-bottom:15px}
      .v3-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v3-grid .form-row{margin:0}
      .v3-check{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(245,196,107,.16);background:rgba(255,255,255,.035);padding:10px 11px;border-radius:12px;font-size:11px}
      .v3-check input{width:auto;accent-color:#f5c46b}
      .v3-tags{display:flex;flex-wrap:wrap;gap:6px;max-height:220px;overflow:auto;padding:4px 1px}
      .v3-tag{border:1px solid rgba(245,196,107,.18);background:rgba(255,255,255,.035);color:#c9b1bd;border-radius:10px;padding:6px 9px;font-size:10.5px;cursor:pointer}
      .v3-tag.on{border-color:#f5c46b;background:rgba(245,196,107,.17);color:#ffebaa}
      .v3-note{color:#a98e9a;font-size:10px;line-height:1.55;margin-top:7px}
      .v3-status{margin:8px 0 0;padding:8px 10px;border-radius:11px;background:rgba(245,196,107,.07);color:#e9d6bd;font-size:10.5px;line-height:1.55}
      @media(max-width:390px){.v3-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function installPanel(){
    if(document.getElementById('velourV3Panel'))return;
    const cards=[...document.querySelectorAll('.card-panel')];
    const anchor=cards[0]||document.querySelector('.hero-banner');
    if(!anchor)return;

    const panel=document.createElement('div');
    panel.className='v3-panel';
    panel.id='velourV3Panel';
    panel.innerHTML=`
      <span class="panel-tag">01-B. PACING & CROSSOVER · V3.2</span>
      <div class="v3-grid">
        <div class="form-row">
          <label>서사 속도</label>
          <select id="v3Pacing">
            <option value="adaptive">AUTO · 상황 따라 조절</option>
            <option value="slow2">SLOW 2 · 2화까지 텐션 축적</option>
            <option value="slow3">SLOW 3 · 3화까지 텐션 축적</option>
            <option value="slow4">SLOW 4 · 4화까지 긴 호흡</option>
            <option value="romance">ROMANCE · 감정선 최우선</option>
          </select>
        </div>
        <div class="form-row">
          <label>컨셉 믹스 수</label>
          <select id="v3Mix">
            <option value="1">1개 집중</option>
            <option value="2">2개 교차</option>
            <option value="3">3개 크로스오버</option>
          </select>
        </div>
      </div>
      <div class="v3-grid" style="margin-top:9px">
        <label class="v3-check"><span>AI 자동 다음화 전개</span><input type="checkbox" id="v3Auto"></label>
        <label class="v3-check"><span>도발적 대사/말싸움 강화</span><input type="checkbox" id="v3Dirty"></label>
      </div>
      <label class="v3-check" style="margin-top:9px"><span>기본 성인 캐릭터 비주얼 프리셋 사용</span><input type="checkbox" id="v3Profile"></label>
      <div class="form-row" style="margin-top:12px">
        <label>다음 화 추가 지시 <small style="color:#9f8794">(선택 · 비우면 AI가 자동 전개)</small></label>
        <textarea id="v3Next" placeholder="예: 다음 화엔 출장지 호텔에서 둘만 남게 해줘. 비워두면 AI가 이전 화를 분석해 새 사건을 스스로 만든다."></textarea>
      </div>
      <div class="form-row">
        <label style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span>크로스오버 컨셉 <small style="color:#9f8794">(여러 개 선택)</small></span>
          <button type="button" id="v3RandomMix" class="v3-tag" style="white-space:nowrap">🎲 자동 믹스</button>
        </label>
        <div class="v3-tags" id="v3Tags"></div>
      </div>
      <div class="v3-status" id="v3Status"></div>
      <div class="v3-note">모든 캐릭터는 명백한 성인. 의료·직업·권력차 소재도 서사에는 적극 활용하되, 친밀한 관계는 상호 선택이 분명한 방향으로 전개합니다.</div>
    `;
    anchor.insertAdjacentElement('afterend',panel);

    const tags=panel.querySelector('#v3Tags');
    CONCEPTS.forEach(([id,label,desc])=>{
      const b=document.createElement('button');
      b.type='button'; b.className='v3-tag'; b.dataset.id=id; b.title=desc; b.textContent=label;
      b.onclick=()=>{b.classList.toggle('on');persist();updateStatus();};
      tags.appendChild(b);
    });

    const cfg=loadCfg();
    panel.querySelector('#v3Pacing').value=cfg.pacing;
    panel.querySelector('#v3Mix').value=String(cfg.mixCount);
    panel.querySelector('#v3Auto').checked=!!cfg.autoContinue;
    panel.querySelector('#v3Dirty').checked=!!cfg.dirtyDialogue;
    panel.querySelector('#v3Profile').checked=!!cfg.defaultProfile;
    try{panel.querySelector('#v3Next').value=localStorage.getItem(NEXT_KEY)||''}catch{}
    new Set(cfg.selected||[]).forEach(id=>panel.querySelector(`.v3-tag[data-id="${CSS.escape(id)}"]`)?.classList.add('on'));

    panel.querySelector('#v3RandomMix')?.addEventListener('click',()=>{
      panel.querySelectorAll('.v3-tag[data-id]').forEach(x=>x.classList.remove('on'));
      const count=Math.max(1,Math.min(3,Number(panel.querySelector('#v3Mix')?.value||2)));
      const pool=[...CONCEPTS];
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      new Set(pool.slice(0,count).map(x=>x[0])).forEach(id=>panel.querySelector(`.v3-tag[data-id="${CSS.escape(id)}"]`)?.classList.add('on'));
      persist();updateStatus();
    });

    ['v3Pacing','v3Mix','v3Auto','v3Dirty','v3Profile'].forEach(id=>panel.querySelector('#'+id)?.addEventListener('change',()=>{persist();updateStatus();}));
    panel.querySelector('#v3Next')?.addEventListener('input',e=>{try{localStorage.setItem(NEXT_KEY,e.target.value)}catch{}});
    updateStatus();
  }

  function persist(){
    const p=document.getElementById('velourV3Panel');if(!p)return;
    saveCfg({
      pacing:p.querySelector('#v3Pacing').value,
      mixCount:Number(p.querySelector('#v3Mix').value||2),
      autoContinue:p.querySelector('#v3Auto').checked,
      dirtyDialogue:p.querySelector('#v3Dirty').checked,
      defaultProfile:p.querySelector('#v3Profile').checked,
      selected:[...p.querySelectorAll('.v3-tag.on')].map(x=>x.dataset.id)
    });
  }

  function activeConcepts(cfg){
    const all=new Map(CONCEPTS.map(x=>[x[0],x]));
    const selected=(cfg.selected||[]).map(id=>all.get(id)).filter(Boolean);
    if(!selected.length)return [];
    return selected.slice(0,Math.max(1,Math.min(3,Number(cfg.mixCount)||2)));
  }

  function updateStatus(){
    const el=document.getElementById('v3Status');if(!el)return;
    const cfg=loadCfg(), concepts=activeConcepts(cfg);
    const pace={adaptive:'자동',slow2:'2화 빌드업',slow3:'3화 빌드업',slow4:'4화 빌드업',romance:'감정선 장기'}[cfg.pacing]||cfg.pacing;
    el.innerHTML=`<b>V3.2 활성</b> · ${esc(pace)} · 자동연재 ${cfg.autoContinue?'ON':'OFF'} · 컨셉 ${concepts.length?concepts.map(x=>esc(x[1])).join(' × '):'기존 선택 사용'}`;
  }

  function liveEpisodeNumber(){
    try {
      if (typeof episodeCount !== 'undefined') return Number(episodeCount || 1);
    } catch(e) {}
    const t=document.getElementById('resultTitle')?.textContent||'';
    const m=t.match(/(\d+)/);
    return m?Number(m[1]):1;
  }

  function historyTail(maxChars=5500){
    try {
      if (typeof storyHistory !== 'undefined' && storyHistory) return String(storyHistory).slice(-maxChars);
    } catch(e) {}
    return '';
  }

  function pacingDirective(cfg, ep, isContinue){
    const n=Number(ep||1);
    if(cfg.pacing==='romance'){
      return `이번 화는 관계의 감정적 진전, 대화, 일상 침범, 질투, 망설임, 작은 접촉과 여운을 우선한다. 성급한 관계 진전을 피하고 장기 연재처럼 천천히 변화시킨다.`;
    }
    const limit=cfg.pacing==='slow2'?2:cfg.pacing==='slow4'?4:cfg.pacing==='slow3'?3:0;
    if(limit && n<=limit){
      return `SLOW-BURN 잠금: 현재 EP.${n}은 빌드업 구간이다. 이 에피소드에서는 성적인 행위로 급진전시키지 않는다. 대신 대화의 이중 의미, 시선, 거리, 우연한 접촉, 질투, 생활 침범, 비밀 공유, 갈등 후 화해 직전 등으로 텐션만 한 단계 올리고 끝낸다. 마지막은 다음 화를 궁금하게 하는 사건/대사/선택으로 마감한다.`;
    }
    if(limit && n===limit+1){
      return `SLOW-BURN 해제 직후: 앞선 ${limit}화에서 축적한 감정과 긴장을 회수한다. 그래도 장면을 급하게 건너뛰지 말고 먼저 관계 정의 또는 명확한 상호 선택을 보여준 뒤 자연스럽게 친밀도가 높아지게 한다.`;
    }
    return `서사 속도는 이전 화의 진척을 분석해 자동 조절한다. 같은 감정 단계에 머물지 말고 사건 또는 관계를 정확히 한 단계만 전진시킨다.`;
  }

  function defaultProfile(cfg){
    if(!cfg.defaultProfile)return '';
    return `
[기본 성인 캐릭터 비주얼 프리셋]
- 두 주연은 모두 21세 이상 성인이다.
- 여주 기본 비주얼: 글래머러스한 체형, 밝고 깨끗한 피부톤, 가는 허리와 볼륨감 있는 힙, 부드럽고 단정한 인상. 사용자가 별도 설정하면 사용자 설정을 우선한다.
- 남주 기본 비주얼: 큰 체격과 강한 존재감, 단정한 외형과 힘 있는 움직임. 사용자가 별도 설정하면 사용자 설정을 우선한다.
- 외형 수치를 매 문단 반복하지 말고 첫인상·옷맵시·움직임·거리감 속에서 자연스럽게 드러낸다.`;
  }

  function conceptDirective(cfg){
    const concepts=activeConcepts(cfg);
    if(!concepts.length)return '';
    return `
[이번 작품의 크로스오버 컨셉]
${concepts.map((x,i)=>`${i+1}. ${x[1]} — ${x[2]}`).join('\n')}
- 위 컨셉을 서로 따로 나열하지 말고 하나의 사건 구조로 섞는다.
- 각 컨셉이 장식어가 아니라 실제 갈등/장소/관계 변화에 최소 한 번씩 영향을 주게 한다.`;
  }

  function continuationDirector(cfg, isContinue){
    if(!isContinue){
      const plot=(document.getElementById('inputPlot')?.value||'').trim();
      if(!plot && cfg.autoContinue){
        return `
[AUTO DIRECTOR — 첫 화 발단 자동 생성]
사용자가 상황을 비워두었다. '서로의 경계가 무너지기 시작하는 순간' 같은 추상적 문장을 그대로 쓰지 말고,
선택한 세계관·관계·크로스오버 컨셉을 조합해 구체적인 장소, 시간, 목적, 작은 사건이 있는 첫 장면을 스스로 만든다.
첫 화에서 모든 감정을 해결하지 말고 다음 화로 이어질 미해결 변수 하나를 남긴다.`;
      }
      return '';
    }
    const next=(document.getElementById('v3Next')?.value||'').trim();
    if(next){
      return `
[사용자가 지정한 이번 화 추가 방향]
${next}
- 이 지시는 이번 화에만 적용한다. 이전 발단 상황을 처음부터 반복하지 말고 현재 스토리 지점에서 이어간다.`;
    }
    if(!cfg.autoContinue)return '';
    return `
[AUTO DIRECTOR — 사용자 추가 상황 없음]
사용자가 이번 화 새 상황을 입력하지 않았다. 따라서 이전 화를 문장만 바꿔 반복하지 말고 작가가 스스로 다음 사건을 만든다.
1. 이전 화 마지막의 미해결 감정/행동 하나를 회수한다.
2. 이전 화와 다른 장소·시간·목적 중 최소 하나를 바꾼다.
3. 새로운 외부 변수 하나를 도입한다: 업무, 약속, 제3자, 이동, 연락, 오해 해소, 비밀 발견, 공동 과제, 예상 밖 재회 중 현재 작품에 가장 자연스러운 것.
4. 같은 대화·같은 접촉·같은 갈등을 반복하지 않는다.
5. 이번 화 끝에는 관계 상태를 정확히 한 단계 변화시키는 새 사실/선택/약속/거리 변화가 남아야 한다.
6. 사용자가 다음 화 지시를 안 줘도 연재 소설처럼 스스로 플롯을 굴린다.`;
  }

  function dialogueDirective(cfg){
    return cfg.dirtyDialogue ? `
[대사 톤]
- 성인 캐릭터의 도발적인 농담, 이중 의미, 직설적인 욕망 표현, 존댓말/반말의 포지션 변화 등을 관계와 성격에 맞춰 활용한다.
- 같은 문구를 반복하지 말고 인물마다 말버릇과 공격/회피 방식을 다르게 만든다.` : '';
  }

  function antiRepeat(isContinue){
    if(!isContinue)return '';
    return `
[반복 방지]
- 직전 화 첫 장면과 같은 장소·자세·대사로 시작하지 않는다.
- 직전 화에서 이미 설명한 외모/과거/관계 설정을 다시 장황하게 소개하지 않는다.
- 이전 화의 마지막 2~3문장을 그대로 요약하며 시작하지 않는다.
- 매 화마다 최소 하나: 관계정보, 사건정보, 생활영역, 감정 자각, 약속/규칙 중 새로운 것을 추가한다.`;
  }

  const originalBuild=window.buildPrompt;
  if(typeof originalBuild==='function'){
    window.buildPrompt=function(isContinue=false){
      const cfg=loadCfg();
      const ep=liveEpisodeNumber();
      let base=originalBuild(isContinue);

      // On continuation, neutralize the old engine's tendency to re-use the initial plot as a fresh instruction.
      if(isContinue){
        base=base.replace(/\n- 발단 상황\/갈등: .*?\n/, '\n- 기존 발단 상황/갈등: 첫 화의 배경 정보로만 참고하고 반복하지 말 것\n');
        base=base.replace(/지시사항: 위 이전 줄거리의 감정선과 상황을 자연스럽게 이어받아 다음 전개 에피소드를 계속 작성하십시오\./,
          '지시사항: 위 이전 줄거리에서 아직 해결되지 않은 지점만 이어받고, 새로운 장면과 사건을 스스로 전개하십시오.');
      }

      return `${base}

===== VELOUR STORY ENGINE V3 =====
${pacingDirective(cfg,ep,isContinue)}
${defaultProfile(cfg)}
${conceptDirective(cfg)}
${continuationDirector(cfg,isContinue)}
${dialogueDirective(cfg)}
${antiRepeat(isContinue)}
${isContinue && historyTail() ? `\n[장기 연속성 보강 — 최근 이야기]\n${historyTail()}\n- 위에서 이미 일어난 사건과 관계 진척을 되돌리거나 처음처럼 다시 설명하지 않는다.` : ''}

[연재 구조 원칙]
- 에피소드 하나가 모든 갈등을 해결하지 않는다.
- 장면 전환과 시간 경과를 활용해 2~5화 단위의 작은 아크를 만든다.
- 관계의 변화는 '긴장 → 신뢰/갈등 → 자각 → 선택 → 후폭풍'처럼 단계적으로 이동한다.
- 모든 등장인물은 성인이며, 친밀한 관계는 상호 선택과 동의가 분명한 상황에서만 진행한다.
- 범죄·판타지·권력관계가 배경이어도 실제 강요나 의식이 불분명한 상태를 로맨틱한 친밀 행위로 처리하지 않는다.
===== END V3 =====`;
    };
  }

  const originalGenerate=window.generateStory;
  if(typeof originalGenerate==='function'){
    window.generateStory=async function(isContinue=false){
      const nextEl=document.getElementById('v3Next');
      const usedNext=nextEl?.value?.trim()||'';
      await originalGenerate(isContinue);
      const txt=document.getElementById('novelText')?.innerText||'';
      const ok=txt && !txt.startsWith('[API 오류]') && !txt.startsWith('[통신 오류]') && !txt.includes('응답이 생성되지 않았습니다');
      if(ok && isContinue && usedNext && nextEl){
        nextEl.value='';
        try{localStorage.removeItem(NEXT_KEY)}catch{}
      }
      updateStatus();
    };
  }

  installCss();
  installPanel();

  const badge=document.createElement('div');
  badge.style.cssText='font-size:9.5px;color:#bca7b2;text-align:center;margin:-5px 0 12px';
  badge.textContent='✦ Story Engine V3.2 · Slow Burn + Auto Director + Crossover';
  document.getElementById('velourV3Panel')?.insertAdjacentElement('afterend',badge);

  console.info('✦ VELOUR Story Engine V3.2 loaded');
})();
