'use strict';

/* VELOUR — Authoring Experience V1
   Mobile-first consolidation layer.
   Goals:
   - keep one source of truth for occupation / relationship / appearance
   - compress ensemble + intimacy preference UI into one accordion
   - improve contrast and minimum type size on image backgrounds
   - group crossovers by narrative function and diversify auto-mix
   - preserve old saved crossover IDs and existing prompt/state engines
*/
(() => {
  'use strict';
  if (window.__VELOUR_AUTHORING_EXPERIENCE_V1__) return;

  const VERSION = '1.0.1';
  const GUARD = '__VELOUR_AUTHORING_EXPERIENCE_V1__';
  const V33_KEY = 'VELOUR_STORY_ENGINE_V33';
  const UX_KEY = 'VELOUR_AUTHORING_EXPERIENCE_V1';

  const GROUPS = [
    {id:'space', label:'공간 · 환경', note:'장소와 이동 조건이 장면 행동을 바꾸는 축'},
    {id:'constraint', label:'사건 · 제약', note:'일정·교통·과제·날씨 같은 외부 제약 축'},
    {id:'reveal', label:'정보 · 반전', note:'정체·과거·기록·오해가 새 사실로 바뀌는 축'},
    {id:'social', label:'사회적 압력 · 역할', note:'평판·행사·경쟁·집단 상황이 관계를 압박하는 축'},
    {id:'speculative', label:'판타지 · SF 기믹', note:'현실 규칙을 바꾸는 초현실·SF 장치 축'},
    {id:'legacy', label:'기존 설정과 겹침 · 호환용', note:'V4 관계/다이내믹/세계관과 겹칠 수 있어 자동 믹스에서는 제외'}
  ];

  const GROUP_BY_ID = {
    anonymous_match:'reveal', double_life:'reveal', mystery_voice:'reveal',
    elevator:'space', snow_cabin:'space', safehouse:'space', travel:'space', camping:'space', island:'space',
    night_hospital:'space', sleep_lab:'space', darkroom:'space', backstage:'space', onair:'space', bunker:'space',
    care:'constraint', rule_break:'constraint', pillow_talk:'constraint',
    palace_intrigue:'social',
    vr:'speculative', fantasy_mark:'speculative',
    thin_wall:'legacy', sharehouse:'legacy', vampire:'legacy', time_loop:'legacy', body_swap:'legacy',
    slow_domestic:'legacy', jealousy:'legacy', one_night_after:'legacy'
  };

  const EXTRA_CROSSOVERS = [
    {id:'campus_afterhours', label:'야간 캠퍼스·빈 강의실/세미나실', group:'space', desc:'수업·연구·발표 준비가 끝난 뒤 평소와 다른 캠퍼스 동선이 생기는 상황'},
    {id:'long_drive_detour', label:'장거리 차 이동·우회·휴게소', group:'space', desc:'차량 이동과 예상 밖 우회가 평소와 다른 대화 시간과 동선을 만드는 상황'},
    {id:'archive_afterhours', label:'도서관·자료실·아카이브 야간 작업', group:'space', desc:'자료 조사와 마감 때문에 조용한 공간을 오래 공유하게 되는 상황'},
    {id:'rooftop_night', label:'옥상·테라스·야간 휴식 동선', group:'space', desc:'업무나 행사 사이 짧은 휴식 장소가 사적인 대화를 만드는 상황'},

    {id:'missed_last_train', label:'막차 놓침·교통편 중단', group:'constraint', desc:'귀가 계획이 틀어져 새로운 이동 선택과 일정 조정이 필요한 사건'},
    {id:'schedule_swap', label:'갑작스러운 일정 변경·대타 투입', group:'constraint', desc:'예정에 없던 업무·수업·촬영·당직을 함께 맡게 되는 사건'},
    {id:'shared_deadline', label:'공동 마감·발표·프로젝트 압박', group:'constraint', desc:'같은 결과물을 완성해야 해서 협업 방식과 갈등이 자연스럽게 드러나는 사건'},
    {id:'weather_delay', label:'폭우·폭설·항공/교통 지연', group:'constraint', desc:'날씨 때문에 계획이 미뤄지고 대기 시간이 길어지는 사건'},

    {id:'anonymous_note', label:'익명 메모·필체·문서 정체 발각', group:'reveal', desc:'익명으로 남은 메시지나 기록의 작성자가 가까운 인물임을 알아차리는 반전'},
    {id:'past_connection', label:'예상 못한 과거 접점 발견', group:'reveal', desc:'사진·기록·지인의 말 등을 통해 두 사람이 과거에 이미 연결됐음을 알게 되는 반전'},
    {id:'mistaken_identity', label:'오인·착각이 풀리며 관계 재해석', group:'reveal', desc:'상대에 대해 믿고 있던 전제가 틀렸음을 알게 되어 이전 장면의 의미가 달라지는 반전'},
    {id:'hidden_record', label:'사진·녹음·기록 속 숨은 사실 발견', group:'reveal', desc:'합법적으로 접근 가능한 기록에서 기존 판단을 바꾸는 사실을 발견하는 반전'},

    {id:'rumor_pressure', label:'소문·평판·오해가 번지는 상황', group:'social', desc:'주변 사람들의 해석 때문에 두 사람이 공개적 태도와 사적 태도를 조정해야 하는 상황'},
    {id:'group_trip', label:'워크숍·학회·단체 출장/MT', group:'social', desc:'여럿이 함께 움직이는 일정 속에서 역할과 거리감이 달라지는 상황'},
    {id:'formal_event', label:'공식 행사·시상·가족/지인 모임', group:'social', desc:'평소와 다른 사회적 역할을 수행해야 해서 관계의 다른 면이 드러나는 상황'},
    {id:'rival_project', label:'경쟁 프로젝트·평가·선발', group:'social', desc:'같은 목표를 두고 경쟁하거나 서로 평가받으며 감정과 업무가 충돌하는 상황'},

    {id:'shared_dream', label:'공유 꿈·같은 장면을 기억함', group:'speculative', desc:'두 성인이 같은 꿈이나 감각적 장면을 기억해 현실 관계를 다시 해석하는 기믹'},
    {id:'memory_echo', label:'기억 파편·감정 잔상 동기화', group:'speculative', desc:'특정 조건에서 서로의 기억이나 감정의 일부가 잔상처럼 겹치는 기믹'},
    {id:'parallel_glimpse', label:'평행세계의 다른 선택을 잠깐 목격', group:'speculative', desc:'다른 선택을 한 세계의 짧은 단서를 보고 현재 관계의 선택을 재고하는 기믹'},
    {id:'temporary_link', label:'일시적 감각·상태 연결', group:'speculative', desc:'한시적이고 상호 인지 가능한 연결이 생겨 행동의 결과를 더 직접적으로 느끼는 기믹'}
  ];

  for (const item of EXTRA_CROSSOVERS) GROUP_BY_ID[item.id] = item.group;

  const extraById = new Map(EXTRA_CROSSOVERS.map(x => [x.id, x]));
  const groupMeta = id => GROUPS.find(x => x.id === id) || GROUPS[1];
  const groupFor = id => GROUP_BY_ID[id] || 'constraint';
  const clean = (v, max=240) => String(v || '').replace(/\s+/g, ' ').trim().slice(0,max);
  const selectedText = id => {
    const el = document.getElementById(id);
    return clean(el?.selectedOptions?.[0]?.textContent || el?.value || '', 160);
  };

  function readJson(key, fallback){
    try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v && typeof v === 'object' ? v : fallback; }
    catch (_) { return fallback; }
  }
  function writeJson(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }

  function installCss(){
    if (document.getElementById('velour-authoring-experience-css')) return;
    const st = document.createElement('style');
    st.id = 'velour-authoring-experience-css';
    st.textContent = `
      #velourCharacterPreferenceHub{
        margin-top:8px!important;
        border:1px solid rgba(239,194,112,.30)!important;
        border-radius:14px!important;
        background:linear-gradient(180deg,rgba(45,13,22,.94),rgba(20,6,12,.96))!important;
        overflow:hidden;
      }
      #velourCharacterPreferenceHub>summary{
        min-height:48px;display:flex;align-items:center;padding:10px 12px!important;
        color:#f3d18e!important;font-size:13px!important;font-weight:800!important;cursor:pointer;
      }
      #velourCharacterPreferenceHub .velour-authoring-hub-body{padding:0 10px 10px}
      #velourEnsemblePrefsV1,#velourIntimacyDepthV1{
        margin:8px 0 0!important;padding:11px!important;border-radius:12px!important;
        border:1px solid rgba(239,194,112,.24)!important;
        background:linear-gradient(180deg,rgba(54,17,26,.96),rgba(23,7,13,.98))!important;
        color:#f4e7df!important;backdrop-filter:none!important;
      }
      #velourEnsemblePrefsV1>div:first-child,#velourIntimacyDepthV1>div:first-child{
        font-size:12px!important;line-height:1.45!important;color:#f4d69a!important;letter-spacing:.03em!important;
      }
      #velourEnsemblePrefsV1 label,#velourIntimacyDepthV1 label,
      #velourEnsemblePrefsV1 summary,#velourIntimacyDepthV1 summary{
        font-size:11.5px!important;line-height:1.45!important;
      }
      #velourEnsemblePrefsV1 input,#velourEnsemblePrefsV1 select,#velourEnsemblePrefsV1 textarea,
      #velourIntimacyDepthV1 input,#velourIntimacyDepthV1 select,#velourIntimacyDepthV1 textarea{
        font-size:12px!important;min-height:42px!important;border-radius:10px!important;
        background:rgba(25,7,13,.92)!important;color:#f5e9e2!important;
      }
      #velourEnsemblePrefsV1 button,#velourIntimacyDepthV1 button{
        font-size:11px!important;line-height:1.4!important;min-height:36px!important;
      }
      #velourEnsemblePrefsV1 [data-char-kind]{
        background:rgba(26,7,13,.78)!important;border-color:rgba(239,194,112,.24)!important;
      }
      .velour-source-note{
        padding:8px 9px;border:1px solid rgba(239,194,112,.18);border-radius:9px;
        background:rgba(245,196,107,.055);color:#cdbdc2;font-size:11px;line-height:1.55;
      }
      .velour-chip-picker{
        border:1px solid rgba(239,194,112,.16);border-radius:9px;background:rgba(255,255,255,.025);overflow:hidden;
      }
      .velour-chip-picker>summary{padding:8px 9px;cursor:pointer;color:#e9d9d0!important;font-size:11.5px!important}
      .velour-chip-picker>.velour-chip-body{padding:2px 8px 8px}
      #v33Tags.velour-crossover-groups{display:block!important;max-height:none!important;overflow:visible!important;padding:0!important}
      #v33Tags .velour-crossover-group{
        display:block;width:100%;margin:7px 0;border:1px solid rgba(239,194,112,.20);border-radius:11px;
        background:rgba(26,7,13,.70);overflow:hidden;
      }
      #v33Tags .velour-crossover-group>summary{
        display:flex;justify-content:space-between;gap:8px;padding:9px 10px;cursor:pointer;
        color:#efd6a2;font-size:12px;font-weight:700;line-height:1.4;
      }
      #v33Tags .velour-crossover-group[data-group='legacy']{opacity:.70}
      #v33Tags .velour-crossover-group .velour-crossover-note{padding:0 10px 7px;color:#aa969f;font-size:10.5px;line-height:1.45}
      #v33Tags .velour-crossover-group .velour-crossover-body{display:flex;flex-wrap:wrap;gap:7px;padding:0 9px 9px}
      #v33Tags .v33-tag{font-size:11px!important;line-height:1.35!important;padding:7px 9px!important}
      #v33RandomMix{font-size:11px!important}
      .velour-primary-story-card #inputChars{min-height:70px!important}
      @media(max-width:430px){
        #velourCharacterPreferenceHub>summary{font-size:13px!important}
        #velourEnsemblePrefsV1,#velourIntimacyDepthV1{padding:10px!important}
        #velourEnsemblePrefsV1 [data-pref-grid],#velourIntimacyDepthV1 [data-depth-grid]{grid-template-columns:1fr!important}
        #v33Tags .velour-crossover-group .velour-crossover-body{gap:6px}
      }
    `;
    (document.head || document.documentElement).appendChild(st);
  }

  function updatePrimaryLabels(){
    const input = document.getElementById('inputChars');
    const row = input?.closest?.('.form-row');
    const label = row?.querySelector?.('label');
    if (!label) return;
    label.textContent = '이름 · 핵심 인물 메모';
    const hint = document.createElement('small');
    hint.className = 'velour-field-hint';
    hint.textContent = '선택 · 직업/외형/현재 관계는 03 세부 설정을 사용하므로 반복 입력 불필요';
    label.appendChild(hint);
    if (input && !input.dataset.velourPlaceholderV2) {
      input.dataset.velourPlaceholderV2 = '1';
      input.placeholder = '예: 서진과 하윤. 둘만의 과거 사건이나 꼭 유지할 성격 포인트만 적어줘. 직업·외형은 아래 설정에서 선택하면 여기엔 다시 안 적어도 돼.';
    }
  }

  function hideLegacyVisualProfile(){
    const legacyToggle = document.getElementById('v33ProfileOn')?.closest?.('.v33-check');
    const legacyProfile = document.querySelector('#velourV33Panel .v33-profile');
    if (legacyToggle) legacyToggle.style.display = 'none';
    if (legacyProfile) legacyProfile.style.display = 'none';
    const sec = document.getElementById('v41SecOccupation');
    if (sec && !sec.querySelector('[data-appearance-source-note]')) {
      const note = document.createElement('div');
      note.dataset.appearanceSourceNote = '1';
      note.className = 'v40-note';
      note.style.margin = '8px 0 2px';
      note.textContent = '직업·신분·외형은 이 섹션이 단일 원본이야. 생성 옵션의 구형 비주얼 입력은 중복 방지를 위해 숨겼어.';
      sec.appendChild(note);
    }
  }

  function syncBaseCharacterSources(){
    const qa = window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__;
    if (!qa?.loadCfg || !qa?.saveCfg) return false;
    const cfg = qa.loadCfg();
    if (!cfg?.heroine || !Array.isArray(cfg.partners) || !cfg.partners[0]) return false;
    const occA = selectedText('v4OccA');
    const occB = selectedText('v4OccB');
    const rel = selectedText('v4Relationship');
    let changed = false;
    const assign = (obj,key,value) => {
      if (!value || obj[key] === value) return;
      obj[key] = value; changed = true;
    };
    assign(cfg.heroine,'role',occB);
    assign(cfg.partners[0],'role',occA);
    if (rel) {
      assign(cfg.heroine,'relationshipNote',`V4 현재 관계: ${rel}`);
      assign(cfg.partners[0],'relationshipNote',`V4 현재 관계: ${rel}`);
    }
    if (changed) qa.saveCfg(cfg);
    return changed;
  }

  function sourceSummary(kind,index){
    const role = kind === 'heroine' ? selectedText('v4OccB') : selectedText('v4OccA');
    const rel = selectedText('v4Relationship');
    const agencyNote = kind === 'heroine' ? '여주 적극성은 위 SCENE AGENCY에서 설정' : '이 상대의 적극성은 이 카드에서 개별 설정';
    return `직업 ${role || '기존 V4 설정'} · 현재 관계 ${rel || '기존 V4 설정'} · ${agencyNote} — 직업/관계는 여기서 다시 입력하지 않아도 돼.`;
  }

  function compactTagPicker(card, kind, title){
    const tags = card.querySelector?.(`[data-tags='${kind}']`);
    const holder = tags?.parentElement;
    if (!tags || !holder || holder.dataset.velourCompact === '1') return;
    holder.dataset.velourCompact = '1';
    const selected = tags.querySelectorAll?.('.vcp-tag[style*="245,196,107,.16"]')?.length || 0;
    const details = document.createElement('details');
    details.className = 'velour-chip-picker';
    const summary = document.createElement('summary');
    summary.textContent = `${title} · ${selected ? `${selected}개 선택` : '자동'}`;
    const body = document.createElement('div');
    body.className = 'velour-chip-body';
    holder.parentElement.insertBefore(details, holder);
    details.append(summary, body);
    body.appendChild(tags);
    holder.remove();
  }

  function compactBaseCards(){
    const root = document.getElementById('velourEnsemblePrefsV1');
    if (!root) return;
    root.querySelectorAll?.('[data-char-kind]').forEach(card => {
      const kind = card.dataset.charKind;
      const index = Number(card.dataset.charIndex || 0);
      const isBase = kind === 'heroine' || (kind === 'partner' && index === 0);
      if (isBase) {
        const role = card.querySelector?.('[data-field="role"]');
        const rel = card.querySelector?.('[data-field="relationshipNote"]');
        if (role) role.style.display = 'none';
        if (rel) rel.style.display = 'none';
        if (!card.querySelector?.('[data-base-source-note]')) {
          const name = card.querySelector?.('[data-field="name"]');
          const note = document.createElement('div');
          note.dataset.baseSourceNote = '1';
          note.className = 'velour-source-note';
          note.textContent = sourceSummary(kind,index);
          name?.insertAdjacentElement?.('afterend', note);
        }
      }
      compactTagPicker(card,'personality','성격');
      compactTagPicker(card,'tendency','행동 성향');
    });
  }

  function consolidateCharacterPanels(){
    const ensemble = document.getElementById('velourEnsemblePrefsV1');
    const depth = document.getElementById('velourIntimacyDepthV1');
    const engine = document.getElementById('velourV40Panel');
    if (!ensemble || !depth || !engine) return false;
    let hub = document.getElementById('velourCharacterPreferenceHub');
    if (!hub) {
      hub = document.createElement('details');
      hub.id = 'velourCharacterPreferenceHub';
      hub.className = 'v40-section velour-authoring-hub';
      const summary = document.createElement('summary');
      summary.textContent = '인물별 설정 · 말투/성격/취향';
      const body = document.createElement('div');
      body.className = 'velour-authoring-hub-body';
      hub.append(summary, body);
      const occupation = document.getElementById('v41SecOccupation');
      (occupation || engine.lastElementChild)?.insertAdjacentElement?.('afterend', hub);
      if (!hub.parentNode) engine.appendChild(hub);
    }
    const body = hub.querySelector('.velour-authoring-hub-body');
    if (body && ensemble.parentNode !== body) body.appendChild(ensemble);
    if (body && depth.parentNode !== body) body.appendChild(depth);
    compactBaseCards();
    return true;
  }

  function currentSelectedIds(){
    return Array.from(document.querySelectorAll('#v33Tags .v33-tag.on[data-id]')).map(x => x.dataset.id).filter(Boolean);
  }

  function persistSelectedCrossovers(){
    const cfg = readJson(V33_KEY, {});
    cfg.selectedCrossovers = currentSelectedIds();
    const mix = Number(document.getElementById('v33Mix')?.value || cfg.mixCount || 2);
    cfg.mixCount = Math.max(1, Math.min(3, mix));
    writeJson(V33_KEY, cfg);
  }

  function restoreExtraSelections(){
    const cfg = readJson(V33_KEY, {});
    const selected = new Set(Array.isArray(cfg.selectedCrossovers) ? cfg.selectedCrossovers : []);
    selected.forEach(id => document.querySelector(`#v33Tags .v33-tag[data-id="${CSS.escape(id)}"]`)?.classList.add('on'));
  }

  function createExtraButton(item){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'v33-tag';
    b.dataset.id = item.id;
    b.dataset.velourExtraCrossover = '1';
    b.title = item.desc;
    b.textContent = item.label;
    b.addEventListener('click', () => {
      b.classList.toggle('on');
      persistSelectedCrossovers();
      refreshCrossoverSummaries();
    });
    return b;
  }

  function refreshCrossoverSummaries(){
    document.querySelectorAll('#v33Tags .velour-crossover-group').forEach(group => {
      const summary = group.querySelector(':scope>summary');
      if (!summary) return;
      const id = group.dataset.group;
      const meta = groupMeta(id);
      const total = group.querySelectorAll('.v33-tag[data-id]').length;
      const selected = group.querySelectorAll('.v33-tag.on[data-id]').length;
      summary.textContent = `${meta.label} · ${selected ? `${selected} 선택` : `${total}개`}`;
    });
  }

  function buildCrossoverGroups(){
    const box = document.getElementById('v33Tags');
    if (!box || box.dataset.velourGrouped === '1') return !!box;
    for (const item of EXTRA_CROSSOVERS) {
      if (!box.querySelector(`.v33-tag[data-id="${CSS.escape(item.id)}"]`)) box.appendChild(createExtraButton(item));
    }
    const buttons = Array.from(box.querySelectorAll('.v33-tag[data-id]'));
    const buckets = Object.fromEntries(GROUPS.map(g => [g.id, []]));
    buttons.forEach(btn => {
      const group = groupFor(btn.dataset.id);
      btn.dataset.crossoverGroup = group;
      buckets[group].push(btn);
    });
    box.textContent = '';
    box.classList.add('velour-crossover-groups');
    for (const meta of GROUPS) {
      const details = document.createElement('details');
      details.className = 'velour-crossover-group';
      details.dataset.group = meta.id;
      const summary = document.createElement('summary');
      const note = document.createElement('div');
      note.className = 'velour-crossover-note';
      note.textContent = meta.note;
      const body = document.createElement('div');
      body.className = 'velour-crossover-body';
      for (const btn of buckets[meta.id]) body.appendChild(btn);
      details.append(summary,note,body);
      box.appendChild(details);
    }
    box.dataset.velourGrouped = '1';
    restoreExtraSelections();
    refreshCrossoverSummaries();
    return true;
  }

  function recentState(){
    const s = readJson(UX_KEY, {});
    return {
      recentIds:Array.isArray(s.recentIds)?s.recentIds.slice(-12):[],
      recentGroups:Array.isArray(s.recentGroups)?s.recentGroups.slice(-8):[]
    };
  }

  function chooseMixIds(count, available, history=recentState()){
    const wanted = Math.max(1, Math.min(3, Number(count || 2)));
    const rows = (available || []).filter(x => x && x.id && x.group && x.group !== 'legacy');
    const groups = [...new Set(rows.map(x => x.group))];
    const recentGroupRank = id => {
      const i = history.recentGroups.lastIndexOf(id);
      return i < 0 ? -999 : i;
    };
    groups.sort((a,b) => recentGroupRank(a)-recentGroupRank(b) || Math.random()-.5);
    const chosen = [];
    const usedGroups = new Set();
    for (const group of groups) {
      if (chosen.length >= wanted) break;
      const pool = rows.filter(x => x.group === group && !usedGroups.has(group));
      if (!pool.length) continue;
      pool.sort((a,b) => {
        const ar = history.recentIds.includes(a.id) ? 1 : 0;
        const br = history.recentIds.includes(b.id) ? 1 : 0;
        return ar-br || Math.random()-.5;
      });
      chosen.push(pool[0].id); usedGroups.add(group);
    }
    if (chosen.length < wanted) {
      const rest = rows.filter(x => !chosen.includes(x.id) && !history.recentIds.includes(x.id));
      while (chosen.length < wanted && rest.length) {
        chosen.push(rest.splice(Math.floor(Math.random()*rest.length),1)[0].id);
      }
    }
    return chosen.slice(0,wanted);
  }

  function availableCrossoverRows(){
    return Array.from(document.querySelectorAll('#v33Tags .v33-tag[data-id]')).map(btn => ({
      id:btn.dataset.id,
      group:btn.dataset.crossoverGroup || groupFor(btn.dataset.id)
    }));
  }

  function applyDiversifiedAutoMix(){
    const count = Math.max(1, Math.min(3, Number(document.getElementById('v33Mix')?.value || 2)));
    const history = recentState();
    const ids = chooseMixIds(count, availableCrossoverRows(), history);
    document.querySelectorAll('#v33Tags .v33-tag.on[data-id]').forEach(x => x.classList.remove('on'));
    ids.forEach(id => document.querySelector(`#v33Tags .v33-tag[data-id="${CSS.escape(id)}"]`)?.classList.add('on'));
    persistSelectedCrossovers();
    const groups = ids.map(groupFor);
    writeJson(UX_KEY, {
      recentIds:[...history.recentIds,...ids].slice(-12),
      recentGroups:[...history.recentGroups,...groups].slice(-8)
    });
    refreshCrossoverSummaries();
    document.getElementById('velourGenerationSummary')?.dispatchEvent?.(new Event('change',{bubbles:true}));
    return ids;
  }

  function patchRandomMix(){
    const btn = document.getElementById('v33RandomMix');
    if (!btn || btn.dataset.velourDiverseMix === '1') return !!btn;
    btn.dataset.velourDiverseMix = '1';
    btn.textContent = '🎲 축 분산 자동 믹스';
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      applyDiversifiedAutoMix();
    }, true);
    return true;
  }

  function selectedExtraDetails(){
    return currentSelectedIds().map(id => extraById.get(id)).filter(Boolean);
  }

  function crossoverPromptBlock(){
    const extras = selectedExtraDetails();
    if (!extras.length) return '';
    const mix = Math.max(1, Math.min(3, Number(document.getElementById('v33Mix')?.value || 2)));
    return `\n[CROSSOVER DIVERSITY V1 — 구조화 보조]\n- 현재 선택된 추가 크로스오버 중 최대 ${mix}개만 실제 장면 원인으로 사용한다. 태그를 나열만 하지 않는다.\n${extras.slice(0,mix).map(x=>`- ${x.label}: ${x.desc}`).join('\n')}\n- 서로 다른 축을 골랐다면 하나의 인과 사슬로 연결하되, 모든 장치를 한 장면에 억지로 폭발시키지 않는다.\n- V4의 현재 관계·직업·세계관과 충돌하는 경우 기존 V4 설정이 우선이다.`;
  }

  function bindV4SourceSync(){
    const panel = document.getElementById('velourV40Panel');
    if (!panel || panel.dataset.velourAuthoringSourceSync === '1') return;
    panel.dataset.velourAuthoringSourceSync = '1';
    panel.addEventListener('change', event => {
      if (!event.target?.closest?.('#v41SecOccupation,#v41SecWorld')) return;
      syncBaseCharacterSources();
      document.querySelectorAll('#velourEnsemblePrefsV1 [data-base-source-note]').forEach(note => {
        const card = note.closest('[data-char-kind]');
        if (!card) return;
        note.textContent = sourceSummary(card.dataset.charKind,Number(card.dataset.charIndex||0));
      });
    });
  }

  function installBuildBridge(){
    if (window.__VELOUR_AUTHORING_EXPERIENCE_BUILD_BRIDGE__) return;
    if (typeof window.buildPrompt !== 'function') return;
    const previousBuild = window.buildPrompt;
    window.buildPrompt = function(){
      syncBaseCharacterSources();
      const out = previousBuild.apply(this, arguments);
      const block = crossoverPromptBlock();
      return block ? `${String(out||'').trim()}\n\n${block}`.trim() : out;
    };
    window.__VELOUR_AUTHORING_EXPERIENCE_BUILD_BRIDGE__ = true;
  }

  function install(){
    if (window[GUARD]) return true;
    if (!document.getElementById('velourV40Panel') || !document.getElementById('velourV33Panel')) return false;
    if (!window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__) return false;
    if (!document.getElementById('velourEnsemblePrefsV1') || !document.getElementById('velourIntimacyDepthV1')) return false;
    installCss();
    updatePrimaryLabels();
    hideLegacyVisualProfile();
    syncBaseCharacterSources();
    consolidateCharacterPanels();
    buildCrossoverGroups();
    patchRandomMix();
    bindV4SourceSync();
    installBuildBridge();
    window[GUARD] = true;
    window.__VELOUR_AUTHORING_EXPERIENCE_VERSION__ = VERSION;
    window.__VELOUR_AUTHORING_EXPERIENCE_QA__ = {
      VERSION,GROUPS,EXTRA_CROSSOVERS,GROUP_BY_ID,groupFor,chooseMixIds,
      syncBaseCharacterSources,currentSelectedIds,applyDiversifiedAutoMix,crossoverPromptBlock
    };
    console.info('✦ VELOUR Authoring Experience V1 loaded');
    return true;
  }

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries >= 180) clearInterval(timer);
    },80);
  }
})();
