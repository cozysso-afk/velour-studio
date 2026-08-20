'use strict';

/*
  VELOUR Story Engine V3.3
  - relationships are separated from crossover settings/events/gimmicks
  - autonomous continuation with no extra scene prompt
  - slow-burn pacing
  - detailed non-explicit adult visual/body profile
  - existing generator/save/library preserved
*/
(() => {
  if (window.__VELOUR_V33_INSTALLED__) return;
  window.__VELOUR_V33_INSTALLED__ = true;

  const V33_KEY = 'VELOUR_STORY_ENGINE_V33';
  const V32_KEY = 'VELOUR_STORY_ENGINE_V32';
  const NEXT_KEY = 'VELOUR_NEXT_DIRECTIVE_V33';

  const RELATIONSHIPS = [["secretary_ceo", "비서 × 대표/사장"], ["office_hierarchy", "신입·대리 × 과장·팀장"], ["coworker_rival", "앙숙 동료·라이벌"], ["contract", "계약연애·쇼윈도 관계"], ["reunion", "재회커플 · 헤어진 연인 × 다시 시작"], ["fake_dating", "가짜 연애·질투 작전"], ["younger_scheme", "조신한 연하 계략가 × 연상"], ["bodyguard", "보디가드 × 경호 대상"], ["actor_manager", "배우 × 매니저/스타일리스트"], ["actor_actor", "배우 × 배우"], ["idol_manager", "성인 아이돌 × 매니저"], ["photo_model", "사진작가 × 성인 모델"], ["artist_model", "화가 × 성인 크로키 모델"], ["tattoo_client", "타투이스트 × 성인 손님"], ["fitness_client", "PT·필라테스·요가 강사 × 성인 회원"], ["dance_partner", "댄스·발레·탱고 파트너"], ["bartender_regular", "바텐더·소믈리에 × 단골"], ["maestro_soloist", "지휘자 × 솔리스트"], ["writer_assistant", "작가 × 성인 보조작가"], ["law_partner", "검사·변호사·수사 파트너"], ["spy_pair", "스파이·잠입 위장 커플"], ["hunter_support", "헌터 × 서포터/힐러"], ["goddess_gladiator", "여신 × 검투사"], ["paladin_mage", "성기사 × 성녀/마법사"], ["palace_guard", "후궁·귀족 × 호위무사"], ["royal_contract", "왕실 정략결혼 상대"], ["doctor_patient", "주치의 × 성인 환자 · 치료 경계 존중"], ["rehab_patient", "재활치료사 × 성인 환자 · 치료 종료 후 관계 변화"], ["team_doctor", "팀닥터 × 성인 선수"], ["medical_colleague", "야간 당직 의료진 동료"], ["research_participant", "연구원 × 성인 임상 참가자 · 연구 윤리 준수"], ["caregiver_guardian", "간병·돌봄 종사자 × 성인 보호자"], ["nonfamily_house", "가족처럼 지낸 비혈연 성인 동거인"], ["family_friend", "집안끼리 오래 알고 지낸 두 성인"], ["creator_whale", "크리에이터 × 익명 후원자/큰손"], ["streamer_partner", "스트리머·성우 × 협업 파트너"]];
  const CROSSOVERS = [["anonymous_match", "익명 앱/보이스 매칭 정체 발각", "익명으로 가까워진 상대가 현실의 지인·라이벌임이 드러나는 반전"], ["double_life", "이중생활·정체 반전", "공적 이미지와 사적 성격이 크게 다른 이중생활"], ["thin_wall", "옆집·얇은 벽", "생활 소음과 반복되는 마주침이 서로를 의식하게 만드는 공간 기믹"], ["sharehouse", "셰어하우스·룸메이트", "생활 동선과 사적 경계가 자연스럽게 겹치는 공간"], ["elevator", "엘리베이터·정전·밀폐공간", "예상치 못한 고립으로 대화와 거리감이 가까워지는 사건"], ["snow_cabin", "폭설 산장·펜션 고립", "외부와 며칠간 단절되어 함께 생활해야 하는 상황"], ["safehouse", "세이프하우스·경호", "위험을 피해 폐쇄된 안전 공간에서 장기간 머무는 상황"], ["travel", "출장·레이오버·호텔 오예약", "낯선 도시와 숙박 변수가 평소 경계를 흐리는 사건"], ["camping", "차박·캠핑·폭우", "좁은 공간과 악천후 속 생활 밀착"], ["island", "섬·외딴 지역 발령", "좁은 생활권과 반복되는 마주침이 쌓이는 장기 배경"], ["night_hospital", "병원 야간 당직·빈 복도", "긴 당직과 호출 사이 생기는 조용한 공백과 긴장"], ["sleep_lab", "수면 연구·관찰실", "반복 관찰과 취약한 일상을 공유하게 되는 연구 공간"], ["darkroom", "암실·촬영 스튜디오", "제한된 조명과 집중된 시선이 만들어내는 감각적 공간"], ["backstage", "백스테이지·대기실", "무대 전후의 긴장과 짧은 사각지대"], ["onair", "온에어·마이크/카메라 사각지대", "공적인 방송과 사적인 신호가 동시에 존재하는 상황"], ["bunker", "지하 벙커·아포칼립스", "폐쇄된 생존 공간에서 장기 신뢰가 쌓이는 배경"], ["vr", "VR·감각 동기화 SF", "가상공간 임무에서 감각과 감정이 연결되는 SF 기믹"], ["fantasy_mark", "각인·마법적 연결", "상호 합의 가능한 판타지 연결 때문에 감정이 증폭되는 설정"], ["vampire", "뱀파이어·수인·인외 본능", "인간과 다른 감각·본능을 지닌 성인 캐릭터의 판타지"], ["palace_intrigue", "궁중 암투·비밀 임무", "정치적 위험과 비밀 보호 관계가 얽히는 사건"], ["time_loop", "타임루프·회귀", "반복되는 시간 속에서 관계 정보가 축적되는 기믹"], ["body_swap", "바디 스왑", "서로의 일상과 약점을 직접 체험하며 관계가 달라지는 기믹"], ["mystery_voice", "목소리 정체 반전", "익숙한 목소리의 주인이 예상 밖 인물임을 알아차리는 미스터리"], ["slow_domestic", "일상 침범·가짜 동거", "도어락·식사·옷·생활 습관이 연애보다 먼저 깊어지는 흐름"], ["jealousy", "제3자 등장·질투 촉발", "관계 정의를 미루던 두 사람이 외부 인물 때문에 감정을 자각"], ["care", "아플 때 간호·무방비 일상", "완벽한 모습이 무너진 순간 돌봄으로 가까워지는 사건"], ["rule_break", "연락/키스 금지 룰 붕괴", "감정을 막기 위해 세운 규칙 하나가 서서히 흔들리는 구조"], ["pillow_talk", "밤보다 깊어지는 새벽 대화", "관계 후보다 일상 대화와 정서적 의존이 더 중요해지는 흐름"], ["one_night_after", "하룻밤 이후 뜻밖의 재회", "과거의 충동적 사건 이후 다시 마주쳐 어색함과 미련이 쌓이는 전개"]];

  const DEFAULT_CFG = {
    pacing:'slow3',
    autoContinue:true,
    mixCount:2,
    provocativeDialogue:true,
    defaultProfile:true,
    selectedCrossovers:[],
    profile:{
      femaleHeight:'165',
      femaleBust:'D+',
      femaleWaist:'slim',
      femaleHips:'round',
      femaleSkin:'bright',
      femaleImpression:'soft',
      maleHeight:'188',
      maleBuild:'broad',
      maleImpression:'clean'
    }
  };

  function cloneDefault() { return JSON.parse(JSON.stringify(DEFAULT_CFG)); }

  function loadCfg() {
    let cfg = cloneDefault();
    try {
      const saved33 = JSON.parse(localStorage.getItem(V33_KEY) || 'null');
      if (saved33 && typeof saved33 === 'object') {
        cfg = Object.assign(cfg, saved33);
        cfg.profile = Object.assign({}, DEFAULT_CFG.profile, saved33.profile || {});
        return cfg;
      }

      // One-time V3.2 migration.
      const saved32 = JSON.parse(localStorage.getItem(V32_KEY) || 'null');
      if (saved32 && typeof saved32 === 'object') {
        cfg.pacing = saved32.pacing || cfg.pacing;
        cfg.autoContinue = saved32.autoContinue !== false;
        cfg.mixCount = Number(saved32.mixCount || cfg.mixCount);
        cfg.provocativeDialogue = saved32.dirtyDialogue !== false;
        cfg.defaultProfile = saved32.defaultProfile !== false;
        const allowed = new Set(CROSSOVERS.map(x => x[0]));
        cfg.selectedCrossovers = (saved32.selected || []).filter(id => allowed.has(id));
      }
    } catch(e) {}
    return cfg;
  }

  function saveCfg(cfg) {
    try { localStorage.setItem(V33_KEY, JSON.stringify(cfg)); } catch(e) {}
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function installCss() {
    if (document.getElementById('velour-v33-css')) return;
    const st = document.createElement('style');
    st.id = 'velour-v33-css';
    st.textContent = `
      .v33-panel{border:1px solid rgba(245,196,107,.28);background:rgba(21,7,14,.76);border-radius:20px;padding:16px;margin-bottom:15px}
      .v33-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px} .v33-grid .form-row{margin:0}
      .v33-check{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(245,196,107,.16);background:rgba(255,255,255,.035);padding:10px 11px;border-radius:12px;font-size:11px}
      .v33-check input{width:auto;accent-color:#f5c46b}
      .v33-tags{display:flex;flex-wrap:wrap;gap:6px;max-height:230px;overflow:auto;padding:4px 1px}
      .v33-tag{border:1px solid rgba(245,196,107,.18);background:rgba(255,255,255,.035);color:#c9b1bd;border-radius:10px;padding:6px 9px;font-size:10.5px;cursor:pointer}
      .v33-tag.on{border-color:#f5c46b;background:rgba(245,196,107,.17);color:#ffebaa}
      .v33-note{color:#a98e9a;font-size:10px;line-height:1.55;margin-top:7px}
      .v33-status{margin:8px 0 0;padding:8px 10px;border-radius:11px;background:rgba(245,196,107,.07);color:#e9d6bd;font-size:10.5px;line-height:1.55}
      .v33-rel-block{margin-top:12px;padding-top:12px;border-top:1px solid rgba(245,196,107,.12)}
      .v33-rel-title{font-size:11px;color:#f5c46b;font-weight:700;margin-bottom:7px}
      .v33-profile{margin-top:12px;border-top:1px solid rgba(245,196,107,.12);padding-top:12px}
      .v33-profile summary{cursor:pointer;color:#ffebaa;font-size:11.5px;font-weight:700;margin-bottom:10px}
      .v33-mini{font-size:9.5px;color:#9f8794;line-height:1.45;margin-top:4px}
      @media(max-width:390px){.v33-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function relationshipExists(label) {
    return [...document.querySelectorAll('#tropeTags .tag-pill')].some(el => el.textContent.trim() === label);
  }

  function installRelationshipExpansion() {
    const wrap = document.getElementById('tropeTags');
    if (!wrap || document.getElementById('v33RelationshipBlock')) return;

    const block = document.createElement('div');
    block.id = 'v33RelationshipBlock';
    block.className = 'v33-rel-block';
    block.innerHTML = `<div class="v33-rel-title">V3.3 관계성 확장 · 누구 × 누구</div><div class="v33-tags" id="v33RelationshipTags"></div>
      <div class="v33-mini">의료·직업 관계도 여기에서 선택. 기존 위쪽 관계성과 함께 여러 개 선택할 수 있어.</div>`;
    wrap.insertAdjacentElement('afterend', block);

    const tags = block.querySelector('#v33RelationshipTags');
    RELATIONSHIPS.forEach(([id,label]) => {
      if (relationshipExists(label)) return;
      const el = document.createElement('span');
      el.className = 'tag-pill';
      el.dataset.v33rel = id;
      el.textContent = label;
      el.onclick = function() { this.classList.toggle('active'); };
      tags.appendChild(el);
    });
  }

  function installPanel() {
    if (document.getElementById('velourV33Panel')) return;
    const cards = [...document.querySelectorAll('.card-panel')];
    const anchor = cards[0] || document.querySelector('.hero-banner');
    if (!anchor) return;

    const panel = document.createElement('div');
    panel.className = 'v33-panel';
    panel.id = 'velourV33Panel';
    panel.innerHTML = `
      <span class="panel-tag">01-B. PACING, PROFILE & CROSSOVER · V3.3</span>
      <div class="v33-grid">
        <div class="form-row">
          <label>서사 속도</label>
          <select id="v33Pacing">
            <option value="adaptive">AUTO · 상황 따라 조절</option>
            <option value="slow2">SLOW 2 · 2화까지 텐션 축적</option>
            <option value="slow3">SLOW 3 · 3화까지 텐션 축적</option>
            <option value="slow4">SLOW 4 · 4화까지 긴 호흡</option>
            <option value="romance">ROMANCE · 감정선 최우선</option>
          </select>
        </div>
        <div class="form-row">
          <label>크로스오버 수</label>
          <select id="v33Mix">
            <option value="1">1개 집중</option>
            <option value="2">2개 교차</option>
            <option value="3">3개 크로스오버</option>
          </select>
        </div>
      </div>

      <div class="v33-grid" style="margin-top:9px">
        <label class="v33-check"><span>AI 자동 다음화 전개</span><input type="checkbox" id="v33Auto"></label>
        <label class="v33-check"><span>도발적 대사·말싸움 강화</span><input type="checkbox" id="v33Dialogue"></label>
      </div>

      <label class="v33-check" style="margin-top:9px"><span>기본 성인 캐릭터 비주얼 프리셋 사용</span><input type="checkbox" id="v33ProfileOn"></label>

      <details class="v33-profile" open>
        <summary>👤 기본 비주얼 세부 설정</summary>
        <div class="v33-grid">
          <div class="form-row"><label>여주 키 (cm)</label><input id="v33FemaleHeight" inputmode="numeric" type="number" min="145" max="195" step="1"></div>
          <div class="form-row"><label>여주 가슴 볼륨</label>
            <select id="v33FemaleBust"><option value="D+">풍만 · D 이상</option><option value="full">풍만</option><option value="medium">중간</option><option value="custom">사용자 인물설정 우선</option></select>
          </div>
          <div class="form-row"><label>여주 허리</label>
            <select id="v33FemaleWaist"><option value="slim">가늘고 선명한 허리선</option><option value="natural">자연스러운 곡선</option></select>
          </div>
          <div class="form-row"><label>여주 힙</label>
            <select id="v33FemaleHips"><option value="round">크고 둥글며 탄탄한 힙</option><option value="balanced">균형 잡힌 힙</option></select>
          </div>
          <div class="form-row"><label>여주 피부톤</label>
            <select id="v33FemaleSkin"><option value="bright">밝고 깨끗한 피부톤</option><option value="warm">따뜻한 피부톤</option><option value="custom">사용자 설정 우선</option></select>
          </div>
          <div class="form-row"><label>여주 인상</label>
            <select id="v33FemaleImpression"><option value="soft">부드럽고 단정함</option><option value="cool">도회적·차분함</option><option value="fox">여우상·도발적</option></select>
          </div>
          <div class="form-row"><label>남주 키 (cm)</label><input id="v33MaleHeight" inputmode="numeric" type="number" min="160" max="210" step="1"></div>
          <div class="form-row"><label>남주 체격</label>
            <select id="v33MaleBuild"><option value="broad">큰 체격·넓은 어깨·강한 피지컬</option><option value="lean">키 크고 날렵한 근육형</option><option value="balanced">균형 잡힌 체격</option></select>
          </div>
          <div class="form-row"><label>남주 인상</label>
            <select id="v33MaleImpression"><option value="clean">단정하고 선명한 인상</option><option value="cold">냉정하고 날카로운 인상</option><option value="soft">조신하고 부드러운 인상</option></select>
          </div>
        </div>
        <div class="v33-mini">키·체격·가슴 볼륨·허리·힙·피부톤 같은 비노골적 외형만 기본값으로 유지해. 인물 구도 칸에 별도 외형을 쓰면 그 설정이 우선해.</div>
      </details>

      <div class="form-row" style="margin-top:12px">
        <label>다음 화 추가 지시 <small style="color:#9f8794">(선택 · 비우면 AI가 자동 전개)</small></label>
        <textarea id="v33Next" placeholder="예: 다음 화엔 출장지 호텔에서 둘만 남게 해줘. 비워두면 이전 화를 분석해 AI가 새 사건을 만든다."></textarea>
      </div>

      <div class="form-row">
        <label style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span>크로스오버 · 장소/사건/기믹 <small style="color:#9f8794">(여러 개 선택)</small></span>
          <button type="button" id="v33RandomMix" class="v33-tag" style="white-space:nowrap">🎲 자동 믹스</button>
        </label>
        <div class="v33-tags" id="v33Tags"></div>
      </div>

      <div class="v33-status" id="v33Status"></div>
      <div class="v33-note">관계성은 위의 관계성 영역에서, 크로스오버는 여기서 고른다. 상황 칸과 다음 화 지시를 모두 비워도 자동 전개 ON이면 AI가 사건을 스스로 만든다.</div>
    `;
    anchor.insertAdjacentElement('afterend', panel);

    const tagBox = panel.querySelector('#v33Tags');
    CROSSOVERS.forEach(([id,label,desc]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'v33-tag';
      b.dataset.id = id;
      b.title = desc;
      b.textContent = label;
      b.onclick = () => { b.classList.toggle('on'); persist(); updateStatus(); };
      tagBox.appendChild(b);
    });

    const cfg = loadCfg();
    panel.querySelector('#v33Pacing').value = cfg.pacing;
    panel.querySelector('#v33Mix').value = String(cfg.mixCount);
    panel.querySelector('#v33Auto').checked = !!cfg.autoContinue;
    panel.querySelector('#v33Dialogue').checked = !!cfg.provocativeDialogue;
    panel.querySelector('#v33ProfileOn').checked = !!cfg.defaultProfile;

    panel.querySelector('#v33FemaleHeight').value = cfg.profile.femaleHeight;
    panel.querySelector('#v33FemaleBust').value = cfg.profile.femaleBust;
    panel.querySelector('#v33FemaleWaist').value = cfg.profile.femaleWaist;
    panel.querySelector('#v33FemaleHips').value = cfg.profile.femaleHips;
    panel.querySelector('#v33FemaleSkin').value = cfg.profile.femaleSkin;
    panel.querySelector('#v33FemaleImpression').value = cfg.profile.femaleImpression;
    panel.querySelector('#v33MaleHeight').value = cfg.profile.maleHeight;
    panel.querySelector('#v33MaleBuild').value = cfg.profile.maleBuild;
    panel.querySelector('#v33MaleImpression').value = cfg.profile.maleImpression;

    try { panel.querySelector('#v33Next').value = localStorage.getItem(NEXT_KEY) || ''; } catch(e) {}
    new Set(cfg.selectedCrossovers || []).forEach(id => {
      panel.querySelector(`.v33-tag[data-id="${CSS.escape(id)}"]`)?.classList.add('on');
    });

    panel.querySelector('#v33RandomMix')?.addEventListener('click', () => {
      panel.querySelectorAll('.v33-tag[data-id]').forEach(x => x.classList.remove('on'));
      const count = Math.max(1, Math.min(3, Number(panel.querySelector('#v33Mix')?.value || 2)));
      const pool = [...CROSSOVERS];
      for (let i=pool.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [pool[i],pool[j]] = [pool[j],pool[i]];
      }
      new Set(pool.slice(0,count).map(x=>x[0])).forEach(id => {
        panel.querySelector(`.v33-tag[data-id="${CSS.escape(id)}"]`)?.classList.add('on');
      });
      persist(); updateStatus();
    });

    [
      'v33Pacing','v33Mix','v33Auto','v33Dialogue','v33ProfileOn',
      'v33FemaleHeight','v33FemaleBust','v33FemaleWaist','v33FemaleHips','v33FemaleSkin',
      'v33FemaleImpression','v33MaleHeight','v33MaleBuild','v33MaleImpression'
    ].forEach(id => panel.querySelector('#'+id)?.addEventListener('change', () => { persist(); updateStatus(); }));

    panel.querySelector('#v33Next')?.addEventListener('input', e => {
      try { localStorage.setItem(NEXT_KEY, e.target.value); } catch(err) {}
    });

    updateStatus();
  }

  function persist() {
    const p = document.getElementById('velourV33Panel');
    if (!p) return;
    const cfg = {
      pacing:p.querySelector('#v33Pacing').value,
      mixCount:Number(p.querySelector('#v33Mix').value || 2),
      autoContinue:p.querySelector('#v33Auto').checked,
      provocativeDialogue:p.querySelector('#v33Dialogue').checked,
      defaultProfile:p.querySelector('#v33ProfileOn').checked,
      selectedCrossovers:[...p.querySelectorAll('.v33-tag.on[data-id]')].map(x => x.dataset.id),
      profile:{
        femaleHeight:p.querySelector('#v33FemaleHeight').value || '165',
        femaleBust:p.querySelector('#v33FemaleBust').value,
        femaleWaist:p.querySelector('#v33FemaleWaist').value,
        femaleHips:p.querySelector('#v33FemaleHips').value,
        femaleSkin:p.querySelector('#v33FemaleSkin').value,
        femaleImpression:p.querySelector('#v33FemaleImpression').value,
        maleHeight:p.querySelector('#v33MaleHeight').value || '188',
        maleBuild:p.querySelector('#v33MaleBuild').value,
        maleImpression:p.querySelector('#v33MaleImpression').value
      }
    };
    saveCfg(cfg);
  }

  function activeCrossovers(cfg) {
    const all = new Map(CROSSOVERS.map(x => [x[0], x]));
    const selected = (cfg.selectedCrossovers || []).map(id => all.get(id)).filter(Boolean);
    return selected.slice(0, Math.max(1, Math.min(3, Number(cfg.mixCount) || 2)));
  }

  function updateStatus() {
    const el = document.getElementById('v33Status');
    if (!el) return;
    const cfg = loadCfg();
    const cross = activeCrossovers(cfg);
    const pace = {adaptive:'자동',slow2:'2화 빌드업',slow3:'3화 빌드업',slow4:'4화 빌드업',romance:'감정선 장기'}[cfg.pacing] || cfg.pacing;
    el.innerHTML = `<b>V3.3 활성</b> · ${esc(pace)} · 자동연재 ${cfg.autoContinue?'ON':'OFF'} · 비주얼 ${cfg.defaultProfile?'ON':'OFF'} · 크로스오버 ${cross.length?cross.map(x=>esc(x[1])).join(' × '):'선택 없음'}`;
  }

  function liveEpisodeNumber() {
    try { if (typeof episodeCount !== 'undefined') return Number(episodeCount || 1); } catch(e) {}
    const t = document.getElementById('resultTitle')?.textContent || '';
    const m = t.match(/(\d+)/);
    return m ? Number(m[1]) : 1;
  }

  function historyTail(maxChars=6000) {
    try { if (typeof storyHistory !== 'undefined' && storyHistory) return String(storyHistory).slice(-maxChars); } catch(e) {}
    return '';
  }

  function pacingDirective(cfg, ep) {
    const n = Number(ep || 1);
    if (cfg.pacing === 'romance') {
      return `이번 화는 관계의 감정적 진전, 대화, 일상 침범, 질투, 망설임, 작은 접촉과 여운을 우선한다. 성급한 관계 진전을 피하고 장기 연재처럼 천천히 변화시킨다.`;
    }
    const limit = cfg.pacing==='slow2'?2:cfg.pacing==='slow4'?4:cfg.pacing==='slow3'?3:0;
    if (limit && n <= limit) {
      return `SLOW-BURN 잠금: 현재 EP.${n}은 빌드업 구간이다. 대화의 이중 의미, 시선, 거리, 우연한 접촉, 질투, 생활 침범, 비밀 공유, 갈등을 통해 텐션만 한 단계 올린다. 매 화 끝을 똑같은 상황으로 반복하지 말고 사건·대사·선택 중 하나로 마감한다.`;
    }
    if (limit && n === limit + 1) {
      return `SLOW-BURN 해제 직후: 앞선 ${limit}화에서 축적한 감정과 긴장을 회수한다. 먼저 관계 정의 또는 명확한 상호 선택을 보여주고 친밀도를 한 단계 높인다.`;
    }
    return `서사 속도는 이전 화의 진척을 분석해 자동 조절한다. 같은 감정 단계에 머물지 말고 사건 또는 관계를 정확히 한 단계만 전진시킨다.`;
  }

  function profileText(cfg) {
    if (!cfg.defaultProfile) return '';
    const p = cfg.profile || DEFAULT_CFG.profile;
    const bust = {'D+':'풍만한 가슴 볼륨(D 이상)','full':'풍만한 가슴 볼륨','medium':'중간 정도의 가슴 볼륨','custom':'가슴 볼륨은 사용자 인물 설정을 우선'}[p.femaleBust] || '풍만한 가슴 볼륨';
    const waist = {slim:'가는 허리와 선명한 허리선',natural:'자연스럽고 균형 잡힌 허리 곡선'}[p.femaleWaist] || '가는 허리';
    const hips = {round:'크고 둥글며 탄탄한 힙',balanced:'균형 잡힌 힙'}[p.femaleHips] || '둥글고 탄탄한 힙';
    const skin = {bright:'밝고 깨끗하며 뽀얀 피부톤',warm:'따뜻하고 건강한 피부톤',custom:'피부톤은 사용자 인물 설정 우선'}[p.femaleSkin] || '밝고 깨끗한 피부톤';
    const fim = {soft:'부드럽고 단정한 인상',cool:'도회적이고 차분한 인상',fox:'여우상에 가까운 도발적인 인상'}[p.femaleImpression] || '부드럽고 단정한 인상';
    const build = {broad:'큰 체격, 넓은 어깨와 강한 피지컬',lean:'키 크고 날렵한 근육형 체격',balanced:'균형 잡힌 성인 남성 체격'}[p.maleBuild] || '큰 체격과 넓은 어깨';
    const mim = {clean:'단정하고 선명한 인상',cold:'냉정하고 날카로운 인상',soft:'조신하고 부드러운 인상'}[p.maleImpression] || '단정한 인상';

    return `
[기본 성인 캐릭터 비주얼 프리셋]
- 두 주연은 모두 21세 이상 성인이다.
- 여주 기본: 약 ${p.femaleHeight||165}cm, ${bust}, ${waist}, ${hips}, ${skin}, ${fim}.
- 남주 기본: 약 ${p.maleHeight||188}cm, ${build}, ${mim}.
- 사용자가 인물 구도 칸에서 다른 외형을 지정하면 사용자 설정을 우선한다.
- 외형을 매 문단 되풀이하지 말고 첫인상, 옷맵시, 움직임, 실루엣, 거리 변화 속에서 자연스럽게 유지한다.`;
  }

  function crossoverDirective(cfg) {
    const xs = activeCrossovers(cfg);
    if (!xs.length) return '';
    return `
[장소·사건·기믹 크로스오버]
${xs.map((x,i)=>`${i+1}. ${x[1]} — ${x[2]}`).join('\n')}
- 관계성은 별도 관계성 선택을 우선한다.
- 위 크로스오버는 관계를 대체하지 않고, 장소·사건·반전·세계관 장치로 기능하게 한다.
- 여러 개를 골랐다면 하나의 사건 구조 안에서 원인/공간/반전처럼 자연스럽게 교차한다.`;
  }

  function continuationDirector(cfg, isContinue) {
    if (!isContinue) {
      const plot = (document.getElementById('inputPlot')?.value || '').trim();
      if (!plot && cfg.autoContinue) {
        return `
[AUTO DIRECTOR — 첫 화 발단 자동 생성]
사용자가 '상황 & 서사적 갈등'을 비워두었다.
선택한 세계관, 현재 활성 관계성, 크로스오버를 바탕으로 구체적인 장소·시간·목적·작은 사건을 스스로 만들어 첫 장면을 시작한다.
추상적인 '서로의 경계가 무너지기 시작한다'를 그대로 반복하지 않는다.
첫 화에 모든 감정을 해결하지 말고 다음 화로 이어질 미해결 변수 하나를 남긴다.`;
      }
      return '';
    }

    const next = (document.getElementById('v33Next')?.value || '').trim();
    if (next) {
      return `
[사용자가 지정한 이번 화 추가 방향]
${next}
- 이 지시는 이번 화에만 적용한다. 첫 화 발단을 처음부터 반복하지 말고 현재 지점에서 이어간다.`;
    }
    if (!cfg.autoContinue) return '';
    return `
[AUTO DIRECTOR — 추가 상황 없음]
사용자가 새 상황을 주지 않았다. 작가가 스스로 다음 사건을 만든다.
1. 직전 화의 미해결 감정/행동 하나를 회수한다.
2. 직전 화와 다른 장소·시간·목적 중 최소 하나를 바꾼다.
3. 업무, 약속, 제3자, 이동, 연락, 오해 해소, 비밀 발견, 공동 과제, 뜻밖의 재회 중 가장 자연스러운 외부 변수 하나를 새로 넣는다.
4. 같은 대화·같은 접촉·같은 갈등을 반복하지 않는다.
5. 이번 화 끝에는 관계 상태를 한 단계 바꾸는 새 사실/선택/약속/거리 변화가 남아야 한다.
6. 다음 화 지시가 비어 있어도 연재소설처럼 스스로 플롯을 계속 굴린다.`;
  }

  function dialogueDirective(cfg) {
    return cfg.provocativeDialogue ? `
[대사 톤]
- 성인 캐릭터의 도발적인 농담, 이중 의미, 직설적인 호감 표현, 존댓말/반말 포지션 변화를 관계와 성격에 맞춰 활용한다.
- 같은 문구를 반복하지 말고 인물마다 말버릇과 공격/회피 방식을 다르게 만든다.` : '';
  }

  function antiRepeat(isContinue) {
    if (!isContinue) return '';
    return `
[반복 방지]
- 직전 화 첫 장면과 같은 장소·자세·대사로 시작하지 않는다.
- 이미 설명한 외모/과거/관계 설정을 다시 장황하게 소개하지 않는다.
- 직전 화 마지막을 그대로 요약하며 시작하지 않는다.
- 매 화 최소 하나: 관계정보, 사건정보, 생활영역, 감정 자각, 약속/규칙 중 새로운 것을 추가한다.`;
  }

  const originalBuild = window.buildPrompt;
  if (typeof originalBuild === 'function') {
    window.buildPrompt = function(isContinue=false) {
      const cfg = loadCfg();
      const ep = liveEpisodeNumber();
      let base = originalBuild(isContinue);

      if (isContinue) {
        base = base.replace(/\n- 발단 상황\/갈등: .*?\n/, '\n- 기존 발단 상황/갈등: 첫 화의 배경 정보로만 참고하고 반복하지 말 것\n');
        base = base.replace(
          /지시사항: 위 이전 줄거리의 감정선과 상황을 자연스럽게 이어받아 다음 전개 에피소드를 계속 작성하십시오\./,
          '지시사항: 위 이전 줄거리에서 아직 해결되지 않은 지점만 이어받고, 새로운 장면과 사건을 스스로 전개하십시오.'
        );
      }

      return `${base}

===== VELOUR STORY ENGINE V3.3 =====
${pacingDirective(cfg, ep)}
${profileText(cfg)}
${crossoverDirective(cfg)}
${continuationDirector(cfg, isContinue)}
${dialogueDirective(cfg)}
${antiRepeat(isContinue)}
${isContinue && historyTail() ? `\n[장기 연속성 보강 — 최근 이야기]\n${historyTail()}\n- 이미 일어난 사건과 관계 진척을 되돌리거나 처음처럼 다시 설명하지 않는다.` : ''}

[연재 구조 원칙]
- 에피소드 하나가 모든 갈등을 해결하지 않는다.
- 장면 전환과 시간 경과를 활용해 2~5화 단위의 작은 아크를 만든다.
- 관계 변화는 긴장 → 신뢰/갈등 → 자각 → 선택 → 후폭풍처럼 단계적으로 이동한다.
- 모든 등장인물은 명백한 성인이며, 친밀한 관계는 상호 선택과 동의가 분명한 상황에서만 진행한다.
===== END V3.3 =====`;
    };
  }

  const originalGenerate = window.generateStory;
  if (typeof originalGenerate === 'function') {
    window.generateStory = async function(isContinue=false) {
      const nextEl = document.getElementById('v33Next');
      const usedNext = nextEl?.value?.trim() || '';
      await originalGenerate(isContinue);
      const txt = document.getElementById('novelText')?.innerText || '';
      const ok = txt && !txt.startsWith('[API 오류]') && !txt.startsWith('[통신 오류]') && !txt.includes('응답이 생성되지 않았습니다');
      if (ok && isContinue && usedNext && nextEl) {
        nextEl.value = '';
        try { localStorage.removeItem(NEXT_KEY); } catch(e) {}
      }
      updateStatus();
    };
  }

  installCss();
  installRelationshipExpansion();
  installPanel();

  const badge = document.createElement('div');
  badge.style.cssText = 'font-size:9.5px;color:#bca7b2;text-align:center;margin:-5px 0 12px';
  badge.textContent = '✦ Story Engine V3.3 · Relationship Split + Auto Director + Detailed Visual Profile';
  document.getElementById('velourV33Panel')?.insertAdjacentElement('afterend', badge);

  console.info('✦ VELOUR Story Engine V3.3 loaded');
})();
/* =========================================================
   VELOUR V3.4 LONGFORM PATCH
   붙이는 위치: 기존 velour-v3.3.js 파일의 맨 마지막 줄 아래

   기능:
   - 장편 4,000자+ / 일반 2,500~3,500자 선택
   - Gemini maxOutputTokens = 8192
   - 장편 묘사 강제 + 반복 방지
   - 이어쓰기 최근 문맥 최대 약 10,000자 보강
   - 생성 후 실제 글자 수 표시
   ========================================================= */
(() => {
  'use strict';

  if (window.__VELOUR_V34_LONGFORM_PATCH__) return;
  window.__VELOUR_V34_LONGFORM_PATCH__ = true;

  const LENGTH_KEY = 'VELOUR_V34_LENGTH_MODE';
  const DEFAULT_LENGTH = 'long4000';

  function getLengthMode() {
    try {
      return localStorage.getItem(LENGTH_KEY) || DEFAULT_LENGTH;
    } catch (e) {
      return DEFAULT_LENGTH;
    }
  }

  function setLengthMode(value) {
    try {
      localStorage.setItem(LENGTH_KEY, value);
    } catch (e) {}
  }

  function minimumChars() {
    return getLengthMode() === 'normal2500' ? 2500 : 4000;
  }

  function lengthLabel() {
    return getLengthMode() === 'normal2500'
      ? '일반 · 2,500~3,500자'
      : '장편 · 최소 4,000자 목표';
  }

  function installLengthUI() {
    const panel = document.getElementById('velourV33Panel');
    if (!panel || document.getElementById('v34LengthMode')) return;

    // 화면의 버전 표기를 V3.4로 갱신
    const panelTag = panel.querySelector('.panel-tag');
    if (panelTag) {
      panelTag.textContent = panelTag.textContent.replace(/V3\.3/g, 'V3.4');
    }

    const relTitle = document.querySelector('.v33-rel-title');
    if (relTitle) {
      relTitle.textContent = relTitle.textContent.replace(/V3\.3/g, 'V3.4');
    }

    // 서사 속도/크로스오버 수가 있는 첫 그리드에 분량 선택 추가
    const firstGrid = panel.querySelector('.v33-grid');

    if (firstGrid) {
      const row = document.createElement('div');
      row.className = 'form-row';

      row.innerHTML = `
        <label>한 화 분량</label>
        <select id="v34LengthMode">
          <option value="long4000">
            장편 · 최소 4,000자 목표
          </option>

          <option value="normal2500">
            일반 · 2,500~3,500자
          </option>
        </select>
      `;

      firstGrid.appendChild(row);

      const select = row.querySelector('#v34LengthMode');

      select.value = getLengthMode();

      select.addEventListener('change', () => {
        setLengthMode(select.value);
        updateV34Status();
      });
    }

    // 기존 V3.3 상태창 아래에 V3.4 분량 상태 추가
    const status = panel.querySelector('#v33Status');

    if (
      status &&
      !document.getElementById('v34LengthStatus')
    ) {
      const extra = document.createElement('div');

      extra.id = 'v34LengthStatus';
      extra.className = 'v33-status';
      extra.style.marginTop = '7px';

      status.insertAdjacentElement('afterend', extra);
    }

    // 기존 하단 엔진 배지를 V3.4로 갱신
    const possibleBadges =
      [...document.querySelectorAll('div')]
        .filter(el =>
          /Story Engine V3\.3/.test(
            el.textContent || ''
          )
        );

    possibleBadges.forEach(el => {
      el.textContent =
        '✦ Story Engine V3.4 · ' +
        '4K Longform + ' +
        '8192 Output Tokens + ' +
        'Auto Director';
    });

    updateV34Status();
  }

  function updateV34Status() {
    const el =
      document.getElementById(
        'v34LengthStatus'
      );

    if (!el) return;

    el.innerHTML =
      `<b>V3.4 LONGFORM</b>` +
      ` · ${lengthLabel()}` +
      ` · Gemini 출력 한도 8192 tokens`;
  }

  function longformDirective() {
    if (
      getLengthMode() ===
      'normal2500'
    ) {
      return `
[VELOUR V3.4 · 분량 지시]

- 공백 포함 약 2,500~3,500자를 목표로 한 화를 작성한다.

- 짧은 대사만 연속시키지 말고,
  대사 사이의 심리 변화,
  시선,
  손동작,
  몸의 방향,
  주변 소리,
  공간의 거리와
  사건의 원인을 충분히 서술한다.

- 같은 감정,
  같은 외모 설명,
  같은 문장을 되풀이해서
  분량을 채우지 않는다.
`;
    }

    return `
[VELOUR V3.4 · 장편 4,000자+ 강제]

- 공백 포함 최소 4,000자 이상을 목표로 한다.

- 권장 분량은 약 4,200~5,500자다.

- 대화 사이의 심리 묘사를 생략하지 않는다.

- 인물의 시선이 어디에 머무르는지,
  왜 피하는지,
  언제 다시 상대를 보는지까지
  장면의 감정 변화와 연결해 서술한다.

- 손동작,
  자세 변화,
  몸의 방향,
  두 사람 사이의 물리적 거리 변화를
  장면 속에서 구체적으로 보여준다.

- 주변의 빛,
  소리,
  온도,
  냄새,
  공간의 크기,
  문이나 창문,
  가구의 위치처럼
  장면의 분위기를 만드는 환경 요소를
  적절히 활용한다.

- 중요한 장면을
  한두 문장으로 요약해서
  건너뛰지 않는다.

- 장면은 기본적으로

  행동
  → 상대의 반응
  → 내면 변화
  → 다음 선택

  의 흐름이 느껴지도록 쓴다.

- 한 화 안에 최소 2개의
  작은 장면 비트를 포함한다.

- 또는 한 번 이상의
  자연스러운 시간 변화,
  공간 이동,
  외부 사건 변화를 사용한다.

- 긴 분량이어도
  한 장소에서 같은 대화만
  끝없이 반복하지 않는다.

- 인물의 감정은
  설명문으로 선언하기보다

  침묵,
  말투 변화,
  시선,
  행동,
  선택,
  회피,
  질투,
  망설임

  등을 통해 보여준다.

- 분량을 채우기 위해
  같은 표현을 반복하지 않는다.

- 이미 설명한 외모를
  매 문단 다시 묘사하지 않는다.

- 같은 과거 회상을
  여러 번 반복하지 않는다.

- 같은 긴장 문장,
  같은 신체 반응,
  같은 대사를
  변형해서 되풀이하지 않는다.

- 장면의 디테일은 늘리되
  사건과 관계는 반드시 앞으로 진행한다.

- 마지막 부분이라고
  갑자기 사건을 압축하지 않는다.

- 마지막 약 15%에서도

  새로운 감정 정보,
  새로운 선택,
  새로운 약속,
  새로운 갈등,
  다음 화로 이어질 사건 단서

  가운데 최소 하나를 추가한다.

- 매 화의 마지막을
  항상 똑같은 종류의 긴장 장면으로
  끝내지 않는다.

- 질문,
  발각,
  전화,
  메시지,
  약속,
  질투,
  이동,
  새로운 임무,
  뜻밖의 방문,
  관계 정의,
  작은 거짓말,
  비밀 발견

  등 다양한 방식으로
  다음 화의 문을 연다.
`;
  }

  /*
   * Gemini REST 요청 직전에
   * generationConfig.maxOutputTokens를
   * 8192로 추가한다.
   *
   * 기존 safetySettings,
   * temperature,
   * topP 등은 그대로 보존한다.
   */
  function installGeminiFetchPatch() {
    if (
      window.__VELOUR_V34_FETCH_PATCHED__
    ) {
      return;
    }

    window.__VELOUR_V34_FETCH_PATCHED__ =
      true;

    const nativeFetch =
      window.fetch.bind(window);

    window.fetch =
      async function(input, init) {
        try {
          const url =
            typeof input === 'string'
              ? input
              : (
                  input &&
                  input.url
                    ? input.url
                    : ''
                );

          const isGemini =
            /generativelanguage\.googleapis\.com\/.*:generateContent/i
              .test(url);

          const isPost =
            init &&
            String(
              init.method || 'GET'
            ).toUpperCase() === 'POST';

          if (
            isGemini &&
            isPost &&
            typeof init.body === 'string'
          ) {
            const payload =
              JSON.parse(init.body);

            payload.generationConfig =
              Object.assign(
                {},
                payload.generationConfig || {},
                {
                  maxOutputTokens: 8192
                }
              );

            init =
              Object.assign(
                {},
                init,
                {
                  body:
                    JSON.stringify(
                      payload
                    )
                }
              );
          }
        } catch (err) {
          console.warn(
            '[VELOUR V3.4] ' +
            'maxOutputTokens 패치 실패 — ' +
            '기존 요청으로 계속 진행:',
            err
          );
        }

        return nativeFetch(
          input,
          init
        );
      };
  }

  function recentHistory(
    maxChars = 10000
  ) {
    try {
      if (
        typeof storyHistory !==
          'undefined' &&
        storyHistory
      ) {
        return String(
          storyHistory
        ).slice(
          -maxChars
        );
      }
    } catch (e) {}

    return '';
  }

  /*
   * V3.3이 이미 만들어둔
   * buildPrompt를 한 번 더 감싼다.
   */
  function installPromptPatch() {
    if (
      window.__VELOUR_V34_PROMPT_PATCHED__
    ) {
      return;
    }

    if (
      typeof window.buildPrompt !==
      'function'
    ) {
      return;
    }

    window.__VELOUR_V34_PROMPT_PATCHED__ =
      true;

    const previousBuildPrompt =
      window.buildPrompt;

    window.buildPrompt =
      function(
        isContinue = false
      ) {
        let prompt =
          previousBuildPrompt(
            isContinue
          );

        /*
         * 원본에 남아 있는
         * "2,000자 내외" 지시를
         * 현재 분량 모드에 맞게 교체
         */
        prompt =
          prompt.replace(
            /등장인물은 모두 성인이며,\s*성인 독자를 위해 깊이 있는 호흡으로 2,000자 내외의 에피소드를 집필하십시오\./,
            getLengthMode() ===
              'normal2500'
              ? (
                '등장인물은 모두 성인이며, ' +
                '공백 포함 약 2,500~3,500자의 ' +
                '충분한 호흡으로 한 화를 집필하십시오.'
              )
              : (
                '등장인물은 모두 성인이며, ' +
                '공백 포함 최소 4,000자 이상, ' +
                '권장 4,200~5,500자의 긴 호흡으로 ' +
                '한 화를 집필하십시오.'
              )
          );

        /*
         * 문구 형태가 조금 다를 때를 위한
         * 보조 치환
         */
        prompt =
          prompt.replace(
            /2,000자 내외의 에피소드를 집필하십시오\./g,
            getLengthMode() ===
              'normal2500'
              ? (
                '공백 포함 약 ' +
                '2,500~3,500자의 ' +
                '에피소드를 집필하십시오.'
              )
              : (
                '공백 포함 최소 4,000자 이상, ' +
                '권장 4,200~5,500자의 ' +
                '에피소드를 집필하십시오.'
              )
          );

        prompt += `

${longformDirective()}
`;

        /*
         * 이어쓰기에서는
         * V3.3의 직전 문맥에 더해서
         * 최근 약 10,000자를 추가 참고
         */
        if (isContinue) {
          const history =
            recentHistory(
              10000
            );

          if (history) {
            prompt += `

[VELOUR V3.4 · 장기 연속성 보강]

아래는 최근 이야기의
연속성 참고 자료다.

이미 일어난 일을
처음처럼 다시 설명하거나
되돌리지 않는다.

관계의 진척,
약속,
비밀,
감정 자각,
서로 알고 있는 정보,
이미 벌어진 사건을
그대로 기억하고 이어간다.

직전 화와 완전히 같은 장소,
같은 대화,
같은 접촉,
같은 갈등을
다시 반복하지 않는다.

[최근 이야기]

${history}
`;
          }
        }

        return prompt;
      };
  }

  function installCharCounter() {
    const novel =
      document.getElementById(
        'novelText'
      );

    if (!novel) return;

    if (
      !document.getElementById(
        'v34CharCount'
      )
    ) {
      const counter =
        document.createElement(
          'div'
        );

      counter.id =
        'v34CharCount';

      counter.style.cssText =
        'font-size:10px;' +
        'color:#bca7b2;' +
        'text-align:right;' +
        'margin-top:8px;' +
        'line-height:1.45;';

      novel.insertAdjacentElement(
        'afterend',
        counter
      );
    }
  }

  function updateCharCounter() {
    installCharCounter();

    const novel =
      document.getElementById(
        'novelText'
      );

    const counter =
      document.getElementById(
        'v34CharCount'
      );

    if (
      !novel ||
      !counter
    ) {
      return;
    }

    const text =
      (
        novel.innerText || ''
      ).trim();

    if (
      !text ||
      text.startsWith(
        '[API 오류]'
      ) ||
      text.startsWith(
        '[통신 오류]'
      ) ||
      text.includes(
        '응답이 생성되지 않았습니다'
      )
    ) {
      counter.textContent = '';
      return;
    }

    const count =
      text.length;

    const minimum =
      minimumChars();

    if (
      count >= minimum
    ) {
      counter.style.color =
        '#bca7b2';

      counter.textContent =
        `본문 ${count.toLocaleString()}자` +
        ` · 목표 분량 충족`;
    } else {
      counter.style.color =
        '#ffd08a';

      counter.textContent =
        `본문 ${count.toLocaleString()}자` +
        ` · 목표 ${minimum.toLocaleString()}자+` +
        `보다 짧게 종료됨`;
    }
  }

  /*
   * 실제 생성 함수도 한 번 감싸서
   * 생성 완료 후 글자 수를 표시한다.
   */
  function installGeneratePatch() {
    if (
      window.__VELOUR_V34_GENERATE_PATCHED__
    ) {
      return;
    }

    if (
      typeof window.generateStory !==
      'function'
    ) {
      return;
    }

    window.__VELOUR_V34_GENERATE_PATCHED__ =
      true;

    const previousGenerateStory =
      window.generateStory;

    window.generateStory =
      async function(
        isContinue = false
      ) {
        await previousGenerateStory(
          isContinue
        );

        updateCharCounter();
        updateV34Status();
      };
  }

  /*
   * 설치 순서 중요
   *
   * 기존 V3.3이 먼저 실행된 뒤
   * 이 패치가 실행되는 구조다.
   */
  installGeminiFetchPatch();

  installLengthUI();

  installPromptPatch();

  installCharCounter();

  installGeneratePatch();

  console.info(
    '✦ VELOUR V3.4 LONGFORM PATCH loaded · ' +
    'maxOutputTokens 8192'
  );
})();
/* =========================================================
   VELOUR V3.4 LONGFORM PATCH
   붙이는 위치: 기존 velour-v3.3.js 파일의 맨 마지막 줄 아래

   기능:
   - 장편 4,000자+ / 일반 2,500~3,500자 선택
   - Gemini maxOutputTokens = 8192
   - 장편 묘사 강제 + 반복 방지
   - 이어쓰기 최근 문맥 최대 약 10,000자 보강
   - 생성 후 실제 글자 수 표시
   ========================================================= */
(() => {
  'use strict';

  if (window.__VELOUR_V34_LONGFORM_PATCH__) return;
  window.__VELOUR_V34_LONGFORM_PATCH__ = true;

  const LENGTH_KEY = 'VELOUR_V34_LENGTH_MODE';
  const DEFAULT_LENGTH = 'long4000';

  function getLengthMode() {
    try {
      return localStorage.getItem(LENGTH_KEY) || DEFAULT_LENGTH;
    } catch (e) {
      return DEFAULT_LENGTH;
    }
  }

  function setLengthMode(value) {
    try {
      localStorage.setItem(LENGTH_KEY, value);
    } catch (e) {}
  }

  function minimumChars() {
    return getLengthMode() === 'normal2500' ? 2500 : 4000;
  }

  function lengthLabel() {
    return getLengthMode() === 'normal2500'
      ? '일반 · 2,500~3,500자'
      : '장편 · 최소 4,000자 목표';
  }

  function installLengthUI() {
    const panel = document.getElementById('velourV33Panel');
    if (!panel || document.getElementById('v34LengthMode')) return;

    // 화면의 버전 표기를 V3.4로 갱신
    const panelTag = panel.querySelector('.panel-tag');
    if (panelTag) {
      panelTag.textContent = panelTag.textContent.replace(/V3\.3/g, 'V3.4');
    }

    const relTitle = document.querySelector('.v33-rel-title');
    if (relTitle) {
      relTitle.textContent = relTitle.textContent.replace(/V3\.3/g, 'V3.4');
    }

    // 서사 속도/크로스오버 수가 있는 첫 그리드에 분량 선택 추가
    const firstGrid = panel.querySelector('.v33-grid');

    if (firstGrid) {
      const row = document.createElement('div');
      row.className = 'form-row';

      row.innerHTML = `
        <label>한 화 분량</label>
        <select id="v34LengthMode">
          <option value="long4000">
            장편 · 최소 4,000자 목표
          </option>

          <option value="normal2500">
            일반 · 2,500~3,500자
          </option>
        </select>
      `;

      firstGrid.appendChild(row);

      const select = row.querySelector('#v34LengthMode');

      select.value = getLengthMode();

      select.addEventListener('change', () => {
        setLengthMode(select.value);
        updateV34Status();
      });
    }

    // 기존 V3.3 상태창 아래에 V3.4 분량 상태 추가
    const status = panel.querySelector('#v33Status');

    if (
      status &&
      !document.getElementById('v34LengthStatus')
    ) {
      const extra = document.createElement('div');

      extra.id = 'v34LengthStatus';
      extra.className = 'v33-status';
      extra.style.marginTop = '7px';

      status.insertAdjacentElement('afterend', extra);
    }

    // 기존 하단 엔진 배지를 V3.4로 갱신
    const possibleBadges =
      [...document.querySelectorAll('div')]
        .filter(el =>
          /Story Engine V3\.3/.test(
            el.textContent || ''
          )
        );

    possibleBadges.forEach(el => {
      el.textContent =
        '✦ Story Engine V3.4 · ' +
        '4K Longform + ' +
        '8192 Output Tokens + ' +
        'Auto Director';
    });

    updateV34Status();
  }

  function updateV34Status() {
    const el =
      document.getElementById(
        'v34LengthStatus'
      );

    if (!el) return;

    el.innerHTML =
      `<b>V3.4 LONGFORM</b>` +
      ` · ${lengthLabel()}` +
      ` · Gemini 출력 한도 8192 tokens`;
  }

  function longformDirective() {
    if (
      getLengthMode() ===
      'normal2500'
    ) {
      return `
[VELOUR V3.4 · 분량 지시]

- 공백 포함 약 2,500~3,500자를 목표로 한 화를 작성한다.

- 짧은 대사만 연속시키지 말고,
  대사 사이의 심리 변화,
  시선,
  손동작,
  몸의 방향,
  주변 소리,
  공간의 거리와
  사건의 원인을 충분히 서술한다.

- 같은 감정,
  같은 외모 설명,
  같은 문장을 되풀이해서
  분량을 채우지 않는다.
`;
    }

    return `
[VELOUR V3.4 · 장편 4,000자+ 강제]

- 공백 포함 최소 4,000자 이상을 목표로 한다.

- 권장 분량은 약 4,200~5,500자다.

- 대화 사이의 심리 묘사를 생략하지 않는다.

- 인물의 시선이 어디에 머무르는지,
  왜 피하는지,
  언제 다시 상대를 보는지까지
  장면의 감정 변화와 연결해 서술한다.

- 손동작,
  자세 변화,
  몸의 방향,
  두 사람 사이의 물리적 거리 변화를
  장면 속에서 구체적으로 보여준다.

- 주변의 빛,
  소리,
  온도,
  냄새,
  공간의 크기,
  문이나 창문,
  가구의 위치처럼
  장면의 분위기를 만드는 환경 요소를
  적절히 활용한다.

- 중요한 장면을
  한두 문장으로 요약해서
  건너뛰지 않는다.

- 장면은 기본적으로

  행동
  → 상대의 반응
  → 내면 변화
  → 다음 선택

  의 흐름이 느껴지도록 쓴다.

- 한 화 안에 최소 2개의
  작은 장면 비트를 포함한다.

- 또는 한 번 이상의
  자연스러운 시간 변화,
  공간 이동,
  외부 사건 변화를 사용한다.

- 긴 분량이어도
  한 장소에서 같은 대화만
  끝없이 반복하지 않는다.

- 인물의 감정은
  설명문으로 선언하기보다

  침묵,
  말투 변화,
  시선,
  행동,
  선택,
  회피,
  질투,
  망설임

  등을 통해 보여준다.

- 분량을 채우기 위해
  같은 표현을 반복하지 않는다.

- 이미 설명한 외모를
  매 문단 다시 묘사하지 않는다.

- 같은 과거 회상을
  여러 번 반복하지 않는다.

- 같은 긴장 문장,
  같은 신체 반응,
  같은 대사를
  변형해서 되풀이하지 않는다.

- 장면의 디테일은 늘리되
  사건과 관계는 반드시 앞으로 진행한다.

- 마지막 부분이라고
  갑자기 사건을 압축하지 않는다.

- 마지막 약 15%에서도

  새로운 감정 정보,
  새로운 선택,
  새로운 약속,
  새로운 갈등,
  다음 화로 이어질 사건 단서

  가운데 최소 하나를 추가한다.

- 매 화의 마지막을
  항상 똑같은 종류의 긴장 장면으로
  끝내지 않는다.

- 질문,
  발각,
  전화,
  메시지,
  약속,
  질투,
  이동,
  새로운 임무,
  뜻밖의 방문,
  관계 정의,
  작은 거짓말,
  비밀 발견

  등 다양한 방식으로
  다음 화의 문을 연다.
`;
  }

  /*
   * Gemini REST 요청 직전에
   * generationConfig.maxOutputTokens를
   * 8192로 추가한다.
   *
   * 기존 safetySettings,
   * temperature,
   * topP 등은 그대로 보존한다.
   */
  function installGeminiFetchPatch() {
    if (
      window.__VELOUR_V34_FETCH_PATCHED__
    ) {
      return;
    }

    window.__VELOUR_V34_FETCH_PATCHED__ =
      true;

    const nativeFetch =
      window.fetch.bind(window);

    window.fetch =
      async function(input, init) {
        try {
          const url =
            typeof input === 'string'
              ? input
              : (
                  input &&
                  input.url
                    ? input.url
                    : ''
                );

          const isGemini =
            /generativelanguage\.googleapis\.com\/.*:generateContent/i
              .test(url);

          const isPost =
            init &&
            String(
              init.method || 'GET'
            ).toUpperCase() === 'POST';

          if (
            isGemini &&
            isPost &&
            typeof init.body === 'string'
          ) {
            const payload =
              JSON.parse(init.body);

            payload.generationConfig =
              Object.assign(
                {},
                payload.generationConfig || {},
                {
                  maxOutputTokens: 8192
                }
              );

            init =
              Object.assign(
                {},
                init,
                {
                  body:
                    JSON.stringify(
                      payload
                    )
                }
              );
          }
        } catch (err) {
          console.warn(
            '[VELOUR V3.4] ' +
            'maxOutputTokens 패치 실패 — ' +
            '기존 요청으로 계속 진행:',
            err
          );
        }

        return nativeFetch(
          input,
          init
        );
      };
  }

  function recentHistory(
    maxChars = 10000
  ) {
    try {
      if (
        typeof storyHistory !==
          'undefined' &&
        storyHistory
      ) {
        return String(
          storyHistory
        ).slice(
          -maxChars
        );
      }
    } catch (e) {}

    return '';
  }

  /*
   * V3.3이 이미 만들어둔
   * buildPrompt를 한 번 더 감싼다.
   */
  function installPromptPatch() {
    if (
      window.__VELOUR_V34_PROMPT_PATCHED__
    ) {
      return;
    }

    if (
      typeof window.buildPrompt !==
      'function'
    ) {
      return;
    }

    window.__VELOUR_V34_PROMPT_PATCHED__ =
      true;

    const previousBuildPrompt =
      window.buildPrompt;

    window.buildPrompt =
      function(
        isContinue = false
      ) {
        let prompt =
          previousBuildPrompt(
            isContinue
          );

        /*
         * 원본에 남아 있는
         * "2,000자 내외" 지시를
         * 현재 분량 모드에 맞게 교체
         */
        prompt =
          prompt.replace(
            /등장인물은 모두 성인이며,\s*성인 독자를 위해 깊이 있는 호흡으로 2,000자 내외의 에피소드를 집필하십시오\./,
            getLengthMode() ===
              'normal2500'
              ? (
                '등장인물은 모두 성인이며, ' +
                '공백 포함 약 2,500~3,500자의 ' +
                '충분한 호흡으로 한 화를 집필하십시오.'
              )
              : (
                '등장인물은 모두 성인이며, ' +
                '공백 포함 최소 4,000자 이상, ' +
                '권장 4,200~5,500자의 긴 호흡으로 ' +
                '한 화를 집필하십시오.'
              )
          );

        /*
         * 문구 형태가 조금 다를 때를 위한
         * 보조 치환
         */
        prompt =
          prompt.replace(
            /2,000자 내외의 에피소드를 집필하십시오\./g,
            getLengthMode() ===
              'normal2500'
              ? (
                '공백 포함 약 ' +
                '2,500~3,500자의 ' +
                '에피소드를 집필하십시오.'
              )
              : (
                '공백 포함 최소 4,000자 이상, ' +
                '권장 4,200~5,500자의 ' +
                '에피소드를 집필하십시오.'
              )
          );

        prompt += `

${longformDirective()}
`;

        /*
         * 이어쓰기에서는
         * V3.3의 직전 문맥에 더해서
         * 최근 약 10,000자를 추가 참고
         */
        if (isContinue) {
          const history =
            recentHistory(
              10000
            );

          if (history) {
            prompt += `

[VELOUR V3.4 · 장기 연속성 보강]

아래는 최근 이야기의
연속성 참고 자료다.

이미 일어난 일을
처음처럼 다시 설명하거나
되돌리지 않는다.

관계의 진척,
약속,
비밀,
감정 자각,
서로 알고 있는 정보,
이미 벌어진 사건을
그대로 기억하고 이어간다.

직전 화와 완전히 같은 장소,
같은 대화,
같은 접촉,
같은 갈등을
다시 반복하지 않는다.

[최근 이야기]

${history}
`;
          }
        }

        return prompt;
      };
  }

  function installCharCounter() {
    const novel =
      document.getElementById(
        'novelText'
      );

    if (!novel) return;

    if (
      !document.getElementById(
        'v34CharCount'
      )
    ) {
      const counter =
        document.createElement(
          'div'
        );

      counter.id =
        'v34CharCount';

      counter.style.cssText =
        'font-size:10px;' +
        'color:#bca7b2;' +
        'text-align:right;' +
        'margin-top:8px;' +
        'line-height:1.45;';

      novel.insertAdjacentElement(
        'afterend',
        counter
      );
    }
  }

  function updateCharCounter() {
    installCharCounter();

    const novel =
      document.getElementById(
        'novelText'
      );

    const counter =
      document.getElementById(
        'v34CharCount'
      );

    if (
      !novel ||
      !counter
    ) {
      return;
    }

    const text =
      (
        novel.innerText || ''
      ).trim();

    if (
      !text ||
      text.startsWith(
        '[API 오류]'
      ) ||
      text.startsWith(
        '[통신 오류]'
      ) ||
      text.includes(
        '응답이 생성되지 않았습니다'
      )
    ) {
      counter.textContent = '';
      return;
    }

    const count =
      text.length;

    const minimum =
      minimumChars();

    if (
      count >= minimum
    ) {
      counter.style.color =
        '#bca7b2';

      counter.textContent =
        `본문 ${count.toLocaleString()}자` +
        ` · 목표 분량 충족`;
    } else {
      counter.style.color =
        '#ffd08a';

      counter.textContent =
        `본문 ${count.toLocaleString()}자` +
        ` · 목표 ${minimum.toLocaleString()}자+` +
        `보다 짧게 종료됨`;
    }
  }

  /*
   * 실제 생성 함수도 한 번 감싸서
   * 생성 완료 후 글자 수를 표시한다.
   */
  function installGeneratePatch() {
    if (
      window.__VELOUR_V34_GENERATE_PATCHED__
    ) {
      return;
    }

    if (
      typeof window.generateStory !==
      'function'
    ) {
      return;
    }

    window.__VELOUR_V34_GENERATE_PATCHED__ =
      true;

    const previousGenerateStory =
      window.generateStory;

    window.generateStory =
      async function(
        isContinue = false
      ) {
        await previousGenerateStory(
          isContinue
        );

        updateCharCounter();
        updateV34Status();
      };
  }

  /*
   * 설치 순서 중요
   *
   * 기존 V3.3이 먼저 실행된 뒤
   * 이 패치가 실행되는 구조다.
   */
  installGeminiFetchPatch();

  installLengthUI();

  installPromptPatch();

  installCharCounter();

  installGeneratePatch();

  console.info(
    '✦ VELOUR V3.4 LONGFORM PATCH loaded · ' +
    'maxOutputTokens 8192'
  );
})();

