'use strict';

/*
  VELOUR Story Engine V3.5
  - legacy generation helpers: crossover / auto director / visual profile
  - autonomous continuation with no extra scene prompt
  - pacing delegated to V4.1
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
    pacing:'adaptive',
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
    block.innerHTML = `<div class="v33-rel-title">V3.5 관계성 확장 · 누구 × 누구</div><div class="v33-tags" id="v33RelationshipTags"></div>
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
      <span class="panel-tag">02. GENERATION HELPERS · V3.5</span>
      <input type="hidden" id="v33Pacing" value="adaptive">
      <div class="v33-grid">
        <div class="form-row">
          <label>크로스오버 수</label>
          <select id="v33Mix">
            <option value="1">1개 집중</option>
            <option value="2">2개 교차</option>
            <option value="3">3개 크로스오버</option>
          </select>
        </div>
        <div class="v33-note" style="align-self:end;margin:0 0 8px">서사 속도·관계·직업은 위 V4.1에서 통합 관리해.</div>
      </div>

      <div class="v33-grid" style="margin-top:9px">
        <label class="v33-check"><span>AI 자동 다음화 전개</span><input type="checkbox" id="v33Auto"></label>
        <label class="v33-check"><span>도발적 대사·말싸움 강화</span><input type="checkbox" id="v33Dialogue"></label>
      </div>

      <label class="v33-check" style="margin-top:9px"><span>기본 성인 캐릭터 비주얼 프리셋 사용</span><input type="checkbox" id="v33ProfileOn"></label>

      <details class="v33-profile">
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
      <div class="v33-note">관계·직업·장기 페이싱은 V4.1에서 관리하고, 여기서는 비주얼·자동 전개·크로스오버만 보조한다. 상황 칸과 다음 화 지시를 모두 비워도 자동 전개 ON이면 AI가 사건을 스스로 만든다.</div>
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
    cfg.pacing = 'adaptive'; saveCfg(cfg); panel.querySelector('#v33Pacing').value = 'adaptive';
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
    el.innerHTML = `<b>HELPERS</b> · 자동연재 ${cfg.autoContinue?'ON':'OFF'} · 비주얼 ${cfg.defaultProfile?'ON':'OFF'} · 크로스오버 ${cross.length?cross.map(x=>esc(x[1])).join(' × '):'선택 없음'}`;
  }

  function liveEpisodeNumber() {
    try { if (typeof episodeCount !== 'undefined') return Number(episodeCount || 1); } catch(e) {}
    const t = document.getElementById('resultTitle')?.textContent || '';
    const m = t.match(/(\d+)/);
    return m ? Number(m[1]) : 1;
  }

  function historyTail(maxChars=10000) {
    try { if (typeof storyHistory !== 'undefined' && storyHistory) return String(storyHistory).slice(-maxChars); } catch(e) {}
    return '';
  }

  function pacingDirective(cfg, ep) {
    return `서사 속도는 V4.1 LONGFORM CANON의 페이싱 상태머신을 최우선으로 따른다. V3.5에서는 별도의 2~4화 단기 해제 규칙을 적용하지 않는다.`;
  }

  function profileText(cfg) {
    if (!cfg.defaultProfile) return '';
    const p = cfg.profile || DEFAULT_CFG.profile;
    const bust = {'D+':'풍만하고 볼륨감 있는 가슴선','full':'풍만한 가슴 볼륨','medium':'균형 잡힌 가슴선','custom':'가슴 볼륨은 사용자 인물 설정을 자연스러운 묘사로 반영'}[p.femaleBust] || '풍만한 가슴 볼륨';
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

===== VELOUR STORY ENGINE V3.5 =====
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
===== END V3.5 =====`;
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
  // V4.1 owns relationship selection; keep the legacy expansion code dormant.
  installPanel();

  const badge = document.createElement('div');
  badge.style.cssText = 'font-size:9.5px;color:#bca7b2;text-align:center;margin:-5px 0 12px';
  badge.textContent = '✦ Generation Helpers V3.5 · Auto Director + Crossover + Visual Profile';
  document.getElementById('velourV33Panel')?.insertAdjacentElement('afterend', badge);

  console.info('✦ VELOUR Story Engine V3.5 loaded');
})();

/* =========================================================
   VELOUR V3.5 FINAL INTEGRATED EXTENSION

   Features
   - 4,000+ longform / 2,500~3,500 normal
   - Gemini 3.7 Flash / 3.6 Flash / 3.1 Pro Preview
   - Thinking MEDIUM / HIGH selectable (default HIGH)
   - maxOutputTokens 16384 to leave room for thinking + 4K prose
   - Legacy Gemini 3.x sampling parameters stripped
   - Actual character count after generation
   - Existing V2 library/draft + V3.3 settings preserved
   ========================================================= */
(() => {
  'use strict';

  if (window.__VELOUR_V35_FINAL__) return;
  window.__VELOUR_V35_FINAL__ = true;

  const LENGTH_KEY = 'VELOUR_V35_LENGTH_MODE';
  const THINKING_KEY = 'VELOUR_V35_THINKING_LEVEL';
  const MODEL_KEY = 'VELOUR_MODEL';

  const DEFAULT_LENGTH = 'long4000';
  const DEFAULT_THINKING = 'high';
  const DEFAULT_MODEL = 'gemini-3.7-flash';

  const MODELS = [
    ['gemini-3.7-flash', '⚡ Gemini 3.7 Flash · 최신 / 빠름 / 추천'],
    ['gemini-3.6-flash', '⚡ Gemini 3.6 Flash · 빠름 / 안정'],
    ['gemini-3.1-pro-preview', '🧠 Gemini 3.1 Pro Preview · 고밀도 서사']
  ];

  function safeGet(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function getLengthMode() {
    const v = safeGet(LENGTH_KEY, DEFAULT_LENGTH);
    return ['long4000', 'normal2500'].includes(v) ? v : DEFAULT_LENGTH;
  }

  function getThinkingLevel() {
    const v = safeGet(THINKING_KEY, DEFAULT_THINKING);
    return ['medium', 'high'].includes(v) ? v : DEFAULT_THINKING;
  }

  function getModel() {
    const v = safeGet(MODEL_KEY, DEFAULT_MODEL);
    return MODELS.some(([id]) => id === v) ? v : DEFAULT_MODEL;
  }

  function modelLabel(id = getModel()) {
    return (MODELS.find(([mid]) => mid === id) || [id, id])[1];
  }

  function thinkingLabel() {
    return getThinkingLevel() === 'high'
      ? 'HIGH · 품질 우선'
      : 'MEDIUM · 균형';
  }

  function lengthLabel() {
    return getLengthMode() === 'normal2500'
      ? '일반 · 2,500~3,500자'
      : '장편 · 최소 4,000자';
  }

  function minimumChars() {
    return getLengthMode() === 'normal2500' ? 2500 : 4000;
  }

  function installControlUI() {
    const panel = document.getElementById('velourV33Panel');
    if (!panel || document.getElementById('v35LengthMode')) return;

    const firstGrid = panel.querySelector('.v33-grid');

    if (firstGrid) {
      const lengthRow = document.createElement('div');
      lengthRow.className = 'form-row';
      lengthRow.innerHTML = `
        <label>한 화 분량</label>
        <select id="v35LengthMode">
          <option value="long4000">장편 · 최소 4,000자 목표</option>
          <option value="normal2500">일반 · 2,500~3,500자</option>
        </select>
      `;

      const thinkingRow = document.createElement('div');
      thinkingRow.className = 'form-row';
      thinkingRow.innerHTML = `
        <label>추론 깊이</label>
        <select id="v35ThinkingLevel">
          <option value="high">HIGH · 품질 우선</option>
          <option value="medium">MEDIUM · 속도/비용 균형</option>
        </select>
      `;

      firstGrid.appendChild(lengthRow);
      firstGrid.appendChild(thinkingRow);

      const lengthSelect = lengthRow.querySelector('#v35LengthMode');
      const thinkingSelect = thinkingRow.querySelector('#v35ThinkingLevel');

      lengthSelect.value = getLengthMode();
      thinkingSelect.value = getThinkingLevel();

      lengthSelect.addEventListener('change', () => {
        safeSet(LENGTH_KEY, lengthSelect.value);
        updateStatus();
      });

      thinkingSelect.addEventListener('change', () => {
        safeSet(THINKING_KEY, thinkingSelect.value);
        updateStatus();
      });
    }

    const status = panel.querySelector('#v33Status');
    if (status && !document.getElementById('v35Status')) {
      const extra = document.createElement('div');
      extra.id = 'v35Status';
      extra.className = 'v33-status';
      extra.style.marginTop = '7px';
      status.insertAdjacentElement('afterend', extra);
    }

    updateStatus();
  }

  function installModelUI() {
    const select = document.getElementById('modelSelect');
    if (!select) return;

    select.innerHTML = MODELS.map(
      ([id, label]) => `<option value="${id}">${label}</option>`
    ).join('');

    select.value = getModel();

    // Original page resets model to 3.6 Flash whenever settings opens.
    // Run original open function first, then restore our saved choice.
    if (!window.__VELOUR_V35_OPEN_SETTINGS_PATCH__) {
      window.__VELOUR_V35_OPEN_SETTINGS_PATCH__ = true;
      const originalOpen = window.openSettings;

      if (typeof originalOpen === 'function') {
        window.openSettings = function() {
          originalOpen();
          const current = document.getElementById('modelSelect');
          if (current) current.value = getModel();
        };
      }
    }

    // Replace original hard-coded saveSettings so selected model persists.
    if (!window.__VELOUR_V35_SAVE_SETTINGS_PATCH__) {
      window.__VELOUR_V35_SAVE_SETTINGS_PATCH__ = true;

      window.saveSettings = function() {
        const key = document.getElementById('apiKeyInput')?.value?.trim() || '';

        if (!key) {
          return alert('API Key를 입력해주세요.');
        }

        const selected =
          document.getElementById('modelSelect')?.value || DEFAULT_MODEL;

        localStorage.setItem('VELOUR_API_KEY', key);
        safeSet(MODEL_KEY, selected);

        document.getElementById('settingsModal')?.classList.remove('show');
        updateStatus();

        alert(
          `✨ API 설정 저장 완료\n` +
          `모델: ${modelLabel(selected)}\n` +
          `추론: ${thinkingLabel()}`
        );
      };
    }

    select.addEventListener('change', () => {
      safeSet(MODEL_KEY, select.value);
      updateStatus();
    });
  }

  function updateStatus() {
    const el = document.getElementById('v35Status');
    if (!el) return;

    el.innerHTML =
      `<b>OUTPUT</b>` +
      ` · ${lengthLabel()}` +
      ` · ${modelLabel()}` +
      ` · ${thinkingLabel()}` +
      ` · Output cap 16,384`;
  }

  function longformDirective() {
    if (getLengthMode() === 'normal2500') {
      return `
[VELOUR V3.5 · 일반 분량]
- 공백 포함 약 2,500~3,500자를 목표로 한 화를 작성한다.
- 대사 사이의 심리 변화, 시선, 손동작, 자세, 거리와 주변 분위기를 생략하지 않는다.
- 같은 감정, 외모 설명, 대사, 긴장 반응을 표현만 바꿔 반복해 분량을 채우지 않는다.
- 이번 화 안에서도 사건 또는 관계 상태를 최소 한 단계 앞으로 진행한다.`;
    }

    return `
[VELOUR V3.5 · 장편 4,000자+]
- 공백 포함 최소 4,000자 이상, 권장 약 4,200~5,500자로 작성한다.
- 대화 사이의 심리 묘사와 인물의 시선 처리를 생략하지 않는다.
- 손동작, 자세 변화, 몸의 방향, 두 사람 사이 거리 변화를 장면 속 행동과 연결한다.
- 빛, 소리, 온도, 냄새, 공간 구조와 시간의 흐름을 감정 변화에 맞춰 구체적으로 사용한다.
- 중요한 사건과 감정 전환을 한두 문장으로 급하게 요약하지 않는다.
- 장면은 가능한 한 행동 → 상대 반응 → 내면 변화 → 다음 선택의 흐름을 가진다.
- 한 화 안에 최소 2개의 작은 장면 비트 또는 자연스러운 시간/공간/외부 사건 변화를 넣는다.
- 긴 분량이어도 한 장소에서 같은 대화와 같은 긴장을 반복하지 않는다.
- 이미 설명한 외모, 과거, 감정, 반응을 표현만 바꿔 되풀이하지 않는다.
- 마지막 약 15%에서도 새 감정 정보, 선택, 약속, 갈등 또는 다음 화 단서 중 하나 이상을 추가한다.
- 매 화의 끝을 같은 유형으로 반복하지 말고 질문, 발각, 연락, 약속, 이동, 임무, 방문, 비밀 발견 등으로 다양화한다.
- 분량을 늘리면서도 사건과 관계는 반드시 앞으로 진행한다.`;
  }

  function installPromptPatch() {
    if (window.__VELOUR_V35_PROMPT_PATCH__ ||
        typeof window.buildPrompt !== 'function') {
      return;
    }

    window.__VELOUR_V35_PROMPT_PATCH__ = true;
    const previousBuild = window.buildPrompt;

    window.buildPrompt = function(isContinue = false) {
      let prompt = previousBuild(isContinue);

      // Remove pinned original page's 2,000-character target.
      prompt = prompt.replace(
        /등장인물은 모두 성인이며,\s*성인 독자를 위해 깊이 있는 호흡으로 2,000자 내외의 에피소드를 집필하십시오\./,
        getLengthMode() === 'normal2500'
          ? '등장인물은 모두 성인이며, 공백 포함 약 2,500~3,500자의 충분한 호흡으로 한 화를 집필하십시오.'
          : '등장인물은 모두 성인이며, 공백 포함 최소 4,000자 이상, 권장 4,200~5,500자의 긴 호흡으로 한 화를 집필하십시오.'
      );

      prompt = prompt.replace(
        /2,000자 내외의 에피소드를 집필하십시오\./g,
        getLengthMode() === 'normal2500'
          ? '공백 포함 약 2,500~3,500자의 에피소드를 집필하십시오.'
          : '공백 포함 최소 4,000자 이상, 권장 4,200~5,500자의 에피소드를 집필하십시오.'
      );

      return `${prompt}

${longformDirective()}

[출력 품질 규칙]
- 본문만 자연스럽게 작성하고 분량·프롬프트·규칙에 관한 메타 설명은 출력하지 않는다.
- 장면을 늘리기 위해 같은 문단이나 비슷한 문장을 반복하지 않는다.
- 이전 화의 사건을 장황하게 요약하며 시작하지 않는다.
- 인물의 말투와 성격을 일관되게 유지한다.
- 새 사건이 생겨도 이전 화에서 확정된 관계 진척과 기억을 되돌리지 않는다.`;
    };
  }

  function installGeminiRequestPatch() {
    if (window.__VELOUR_V35_FETCH_PATCH__) return;
    window.__VELOUR_V35_FETCH_PATCH__ = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async function(input, init) {
      let nextInput = input;
      let nextInit = init;

      try {
        const url =
          typeof input === 'string'
            ? input
            : (input?.url || '');

        const isGemini =
          /generativelanguage\.googleapis\.com\/.*:generateContent/i.test(url);

        const isPost =
          String(init?.method || 'GET').toUpperCase() === 'POST';

        if (isGemini && isPost && typeof init?.body === 'string') {
          const selectedModel = getModel();
          const thinkingLevel = getThinkingLevel();

          const patchedUrl = url.replace(
            /\/v1beta\/models\/[^/:]+:generateContent/i,
            `/v1beta/models/${selectedModel}:generateContent`
          );

          const payload = JSON.parse(init.body);

          payload.generationConfig = Object.assign(
            {},
            payload.generationConfig || {}
          );

          // Cap only. Unused capacity is not billed.
          // 16K leaves comfortable room for HIGH thinking + 4K~5.5K Korean prose.
          payload.generationConfig.maxOutputTokens = 16384;

          // Gemini 3.x migration guidance: remove legacy sampling knobs.
          delete payload.generationConfig.temperature;
          delete payload.generationConfig.topP;
          delete payload.generationConfig.topK;
          delete payload.generationConfig.top_p;
          delete payload.generationConfig.top_k;

          payload.generationConfig.thinkingConfig = Object.assign(
            {},
            payload.generationConfig.thinkingConfig || {},
            { thinkingLevel }
          );

          nextInit = Object.assign({}, init, {
            body: JSON.stringify(payload)
          });

          if (typeof input === 'string') {
            nextInput = patchedUrl;
          } else {
            nextInput = new Request(patchedUrl, input);
          }
        }
      } catch (err) {
        console.warn(
          '[VELOUR V3.5] Gemini request patch failed; using original request.',
          err
        );
      }

      return nativeFetch(nextInput, nextInit);
    };
  }

  function installCharCounter() {
    const novel = document.getElementById('novelText');
    if (!novel || document.getElementById('v35CharCount')) return;

    const counter = document.createElement('div');
    counter.id = 'v35CharCount';
    counter.style.cssText =
      'font-size:10px;color:#bca7b2;text-align:right;margin-top:8px;line-height:1.45;';

    novel.insertAdjacentElement('afterend', counter);
  }

  function updateCharCounter() {
    installCharCounter();

    const novel = document.getElementById('novelText');
    const counter = document.getElementById('v35CharCount');

    if (!novel || !counter) return;

    const text = (novel.innerText || '').trim();

    if (
      !text ||
      text.startsWith('[API 오류]') ||
      text.startsWith('[통신 오류]') ||
      text.includes('응답이 생성되지 않았습니다') ||
      text.includes('서사 집필 중')
    ) {
      counter.textContent = '';
      return;
    }

    const count = text.length;
    const target = minimumChars();
    const ok = count >= target;

    counter.style.color = ok ? '#bca7b2' : '#ffd08a';

    counter.textContent = ok
      ? `본문 ${count.toLocaleString()}자 · 목표 충족 · ${modelLabel()} · ${thinkingLabel()}`
      : `본문 ${count.toLocaleString()}자 · 목표 ${target.toLocaleString()}자+보다 짧음 · ${modelLabel()} · ${thinkingLabel()}`;
  }

  function installGeneratePatch() {
    if (window.__VELOUR_V35_GENERATE_PATCH__ ||
        typeof window.generateStory !== 'function') {
      return;
    }

    window.__VELOUR_V35_GENERATE_PATCH__ = true;
    const previousGenerate = window.generateStory;

    window.generateStory = async function(isContinue = false) {
      await previousGenerate(isContinue);
      updateCharCounter();
      updateStatus();
    };
  }

  installControlUI();
  installModelUI();
  installPromptPatch();
  installGeminiRequestPatch();
  installCharCounter();
  installGeneratePatch();
  updateStatus();

  console.info('✦ VELOUR V3.5 FINAL loaded', {
    model: getModel(),
    thinking: getThinkingLevel(),
    length: getLengthMode(),
    maxOutputTokens: 16384
  });
})();
