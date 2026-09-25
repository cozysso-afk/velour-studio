'use strict';

/* VELOUR — concept + relationship progression governor.
   Final prompt layer that unifies legacy tropes/recommended relationships,
   V4 relationship state/trajectory/dynamics, and V3.5 crossovers.
   It also prevents future relationship-state leakage and tracks dialogue cliche families
   without replaying disliked lines into the model prompt.
*/
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const GUARD = '__VELOUR_CONCEPT_RELATIONSHIP_GOVERNOR__';
  const V33_KEY = 'VELOUR_STORY_ENGINE_V33';
  const PHASE_RANK = { setup: 0, build: 1, transition: 2, payoff: 3 };
  const PHASE_LABEL = {
    setup: 'SETUP · 현재 관계 유지 / 변화 원인만 축적',
    build: 'BUILD · 예외와 감정 변화 축적 / 목표 상태는 아직 미래',
    transition: 'TRANSITION · 관계 재협상·자각 가능 / 결과 자동 확정 금지',
    payoff: 'PAYOFF · 충분한 인과가 있을 때만 목표 상태 전환 가능'
  };
  const PACE = {
    ultra: { build: 5, transition: 12, payoff: 18 },
    slow: { build: 3, transition: 8, payoff: 12 },
    balanced: { build: 2, transition: 5, payoff: 8 },
    fast: { build: 2, transition: 3, payoff: 5 }
  };

  const TRAJECTORY_DESTINATION = {
    organic: '별도 고정 목적지 없음 · 현재 관계에서 인과적으로 발전',
    slow_romance: '상호 로맨스 관계',
    physical_to_emotion: '신체적 관계와 별개로 형성되는 정서적 애착·로맨스',
    friends_to_lovers: '친구에서 연인',
    childhood_to_lovers: '소꿉친구에서 연인',
    enemies_to_lovers: '앙숙/라이벌에서 신뢰와 연애 관계',
    reunion_rebuild: '재회 후 신뢰 재구축',
    fwb_keep: '현재 FWB 합의 유지',
    fwb_to_lovers: 'FWB에서 상호 연인 관계',
    one_sided_to_mutual: '한쪽 감정에서 쌍방 감정',
    secret_love: '비밀 연애 관계의 성립·유지',
    long_distance: '장거리 관계의 유지와 조정',
    arranged_to_love: '정략/선결혼 관계에서 실제 애정 형성',
    love_hate_to_love: '애증에서 관계 재정립과 연애 관계',
    contract_to_real: '계약/가짜 관계에서 실제 감정 관계'
  };

  const CLICHE_LABELS = {
    blame_flip: '책임 전가형 도발',
    outcome_forecast: '결과·절정 예고',
    directed_outcome: '상대에게 결과를 요구하는 지시',
    generic_desire: '범용 욕망 선언'
  };

  const clean = (value, max = 500) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const uniq = values => [...new Set((values || []).map(v => clean(v, 180)).filter(Boolean))];

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function qsa(selector){
    try { return Array.from(document.querySelectorAll(selector)); }
    catch (_) { return []; }
  }

  function selectedOptionText(id){
    const el = document.getElementById(id);
    return clean(el?.selectedOptions?.[0]?.textContent || el?.value || '', 220);
  }

  function liveEpisodeNumber(state){
    try {
      if (typeof episodeCount !== 'undefined') {
        const n = Number(episodeCount || 1);
        if (Number.isFinite(n) && n > 0) return Math.floor(n);
      }
    } catch (_) {}
    const confirmed = Number(state?.runtime?.confirmedEpisode || 0);
    return Number.isFinite(confirmed) && confirmed >= 0 ? Math.floor(confirmed) + 1 : 1;
  }

  function textLabels(selector){
    return uniq(qsa(selector).map(el => el.textContent || el.innerText || ''));
  }

  function checkedLabelTexts(selector){
    return uniq(qsa(selector).map(el => el.closest('label')?.textContent || el.value || ''));
  }

  function conceptSelectionsFromDom(){
    return {
      recommendedRelationshipIds: uniq(qsa('[data-v33rel].active').map(el => el.dataset.v33rel)),
      crossoverIds: uniq(qsa('#v33Tags .v33-tag.on[data-id]').map(el => el.dataset.id))
    };
  }

  function collectConcepts(state = snapshot()){
    return {
      world: selectedOptionText('v4World') || clean(state.world, 180),
      coreRelationship: selectedOptionText('v4Relationship') || clean(state.relationship, 180),
      trajectory: selectedOptionText('v4Trajectory') || clean(state.trajectory, 180),
      trajectoryId: clean(state.trajectory, 80),
      pacing: clean(state.pacing || 'slow', 40),
      episode: liveEpisodeNumber(state),
      dynamics: checkedLabelTexts('#v4Dynamics input:checked'),
      legacyTropes: textLabels('#tropeTags .tag-pill.active'),
      recommendedRelationships: textLabels('[data-v33rel].active'),
      crossovers: textLabels('#v33Tags .v33-tag.on[data-id]'),
      nextInstruction: clean(document.getElementById('v33Next')?.value || '', 1000),
      stage: selectedOptionText('selectStage')
    };
  }

  function paceThresholds(state){
    const pacing = String(state?.pacing || 'slow');
    if (pacing !== 'custom') return PACE[pacing] || PACE.slow;
    const unlock = Math.max(2, Number(state?.customUnlockEpisode || 8));
    return {
      build: Math.max(2, unlock - 4),
      transition: unlock,
      payoff: unlock + 2
    };
  }

  function relationshipPhase(state = snapshot(), concepts = collectConcepts(state)){
    const ep = Math.max(1, Number(concepts.episode || 1));
    const t = paceThresholds(state);
    if (ep >= t.payoff) return 'payoff';
    if (ep >= t.transition) return 'transition';
    if (ep >= t.build) return 'build';
    return 'setup';
  }

  function explicitTransitionOverride(state, concepts){
    const src = `${clean(state?.hardCanon, 1600)} ${clean(concepts?.nextInstruction, 1000)}`;
    if (!src.trim()) return false;
    return /(?:연인|사귀|고백|쌍방|서로\s*좋아|관계\s*(?:정의|확정|전환)|재회|화해|신뢰\s*회복|계약.*진짜|진짜.*감정|독점|배타)/i.test(src);
  }

  function currentStateAlreadyTarget(state){
    const rel = String(state?.relationship || '');
    const traj = String(state?.trajectory || '');
    if (traj === 'fwb_keep' || traj === 'organic') return false;
    if (['dating','longtime_lovers','married'].includes(rel) && /(?:to_lovers|slow_romance|physical_to_emotion|arranged_to_love|contract_to_real|love_hate_to_love)/.test(traj)) return true;
    return false;
  }

  function destinationFor(state, concepts){
    const id = String(state?.trajectory || concepts?.trajectoryId || 'organic');
    return TRAJECTORY_DESTINATION[id] || concepts?.trajectory || id || TRAJECTORY_DESTINATION.organic;
  }

  function stripMeta(text){
    return String(text || '').replace(/\n?\[\[VELOUR_V4_META\]\][\s\S]*?\[\[\/VELOUR_V4_META\]\]\s*/g, '').trim();
  }

  function historyTail(maxChars = 26000){
    try {
      if (typeof storyHistory === 'undefined' || !storyHistory) return '';
      return stripMeta(String(storyHistory)).slice(-Math.max(2000, Number(maxChars || 26000)));
    } catch (_) { return ''; }
  }

  function extractDialogue(text, limit = 32){
    const out = [];
    const re = /[“"]([^”"\n]{2,240})[”"]/g;
    let m;
    while ((m = re.exec(String(text || '')))) {
      const line = clean(m[1], 240);
      if (line) out.push(line);
    }
    return out.slice(-Math.max(1, Number(limit || 32)));
  }

  function classifyCliche(raw){
    const line = clean(raw, 240);
    if (!line) return '';
    if (/(?:나한테|내게|내\s*(?:안|위|쪽)).{0,12}(?:싸|사정)|(?:싸줘|싸도\s*돼)/i.test(line)) return 'directed_outcome';
    if (/(?:갈\s*것\s*같|쌀\s*것\s*같|싸고\s*싶|사정(?:할|하|해|이)|절정)/i.test(line)) return 'outcome_forecast';
    if (/(?:네|니|너).{0,10}(?:먼저).{0,12}(?:시작|건드|유혹)|(?:네|니|너)\s*탓/i.test(line)) return 'blame_flip';
    if (/(?:원해|원한다|하고\s*싶|못\s*참|참을\s*수\s*없)/i.test(line)) return 'generic_desire';
    return '';
  }

  function clicheMemory(){
    const lines = extractDialogue(historyTail(), 32);
    const recent = lines.slice(-10);
    const counts = Object.fromEntries(Object.keys(CLICHE_LABELS).map(k => [k, 0]));
    const recentCounts = Object.fromEntries(Object.keys(CLICHE_LABELS).map(k => [k, 0]));
    for (const line of lines) {
      const id = classifyCliche(line);
      if (id) counts[id] += 1;
    }
    for (const line of recent) {
      const id = classifyCliche(line);
      if (id) recentCounts[id] += 1;
    }
    const cooldown = Object.keys(CLICHE_LABELS).filter(id => counts[id] >= 2 || recentCounts[id] >= 1);
    return { total: lines.length, recent: recent.length, counts, recentCounts, cooldown };
  }

  function stripLegacyConflicts(prompt){
    return String(prompt || '')
      .split('\n')
      .filter(line => {
        const t = line.trim();
        if (/^-\s*관계성\/Trope\s*:/.test(t)) return false;
        if (/기존\s*V3\.5\s*관계\s*태그.*비활성화/.test(t)) return false;
        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function conceptDirective(state, concepts){
    const core = concepts.coreRelationship || clean(state.relationship, 120) || '현재 설정값';
    const destination = destinationFor(state, concepts);
    const mods = uniq([...(concepts.dynamics || []), ...(concepts.legacyTropes || []), ...(concepts.recommendedRelationships || [])]);
    const cross = concepts.crossovers || [];
    return `
[CONCEPT RESOLVER V1 — 설정 반영 단일 권위]
- 핵심 현재 관계=${core}. 관계 변화 목적지=${destination}. 현재 페이싱=${concepts.pacing}. 현재 EP.${concepts.episode}.
- 선택된 관계/트로프 보조축=${mods.length ? mods.join(' / ') : '없음'}. 선택된 크로스오버=${cross.length ? cross.join(' / ') : '없음'}.
- ‘선택된 트로프’와 ‘이미 성립한 현재 사실’을 구분한다. 트로프는 장기적인 맛·갈등·역할 후보이지, 첫 화부터 그 결과가 이미 완성됐다는 뜻이 아니다.
- 추천 관계 태그는 인물의 역할·직업·사회적 구도를 구체화하는 보조축이다. 현재 관계 상태와 충돌하면 현재 관계를 덮어쓰지 말고 역할/상황 정보만 사용한다.
- 관계 변화 방향은 목적지다. 현재 화의 사실로 미리 당겨 쓰지 않는다. 현재 관계→감정 변화→상대 반응→재협상→목표 상태의 순서를 실제 장면으로 통과한다.
- 크로스오버가 선택되어 있으면 장식 문구로만 두지 않는다. 사용자 첫 장면/HARD CANON과 충돌하지 않는 범위에서 하나를 구체적인 장소·사건·반전의 원인으로 활성화한다. 여러 개를 골랐으면 한 화에 전부 소비하지 않는다.
- 추가 다이내믹은 현재 관계 단계가 허용하는 형태로만 발현한다. 미래의 소유권·배타성·연인 권리·관계 확정 결과를 트로프 선택만으로 선행시키지 않는다.
- 사용자 HARD CANON과 이번 화 직접 지시가 이 Resolver보다 우선한다.`.trim();
  }

  function relationshipDirective(state, concepts){
    const phase = relationshipPhase(state, concepts);
    const destination = destinationFor(state, concepts);
    const explicit = explicitTransitionOverride(state, concepts);
    const alreadyTarget = currentStateAlreadyTarget(state);
    const physicalCurrent = ['fwb','fwb_repeat','physical_only','one_night'].includes(String(state?.relationship || ''));
    const possessiveSelected = (state?.dynamics || []).includes('possessive') || (concepts.dynamics || []).some(x => /집착|소유욕/.test(x)) || (concepts.legacyTropes || []).some(x => /집착|소유욕/.test(x));
    const jealousySelected = (state?.dynamics || []).includes('jealousy') || (concepts.dynamics || []).some(x => /질투/.test(x));

    let phaseRules = '';
    if (phase === 'setup') {
      phaseRules = `- SETUP에서는 현재 관계의 합의·거리·호칭·권한을 그대로 유지한다. 목표 관계의 권리나 감정 확정을 암시하는 행동을 선행하지 않는다.\n- 변화는 ‘왜 평소와 달라지는가’의 원인만 만든다. 상대에게 권리를 주장하거나 관계를 이미 정의한 듯 행동하지 않는다.`;
    } else if (phase === 'build') {
      phaseRules = `- BUILD에서는 작은 예외, 비일상적 관심, 감정의 자기모순을 누적할 수 있다. 그러나 목표 관계를 사실처럼 부르거나 배타적 권리를 행사하지 않는다.\n- 한 장면의 강한 감정만으로 관계를 확정하지 않는다. 최소 여러 번의 선택과 상대 반응이 누적되어야 한다.`;
    } else if (phase === 'transition') {
      phaseRules = `- TRANSITION에서는 감정 자각, 경계 재협상, 관계 정의 시도를 다룰 수 있다. 상대의 동의와 반응 없이 결과를 자동 확정하지 않는다.\n- 현재 화가 전환의 원인과 반응을 충분히 보여주지 못했다면 결론 대신 미완의 질문·선택으로 남겨도 된다.`;
    } else {
      phaseRules = `- PAYOFF는 ‘무조건 전환’이 아니다. 앞선 확정 에피소드에서 충분한 원인·상호성·선택이 쌓였을 때만 ${destination}의 결과를 실행한다.\n- 누적 근거가 약하면 현 관계를 유지하고 한 단계 전의 변화만 진행한다.`;
    }

    return `
[RELATIONSHIP PROGRESSION GOVERNOR V1 — 미래 상태 누수 방지]
- 현재 관계=${concepts.coreRelationship || state.relationship || '미지정'}. 목적지=${destination}. 현재 관계 단계=${PHASE_LABEL[phase]}.
- 페이싱은 분위기 장식이 아니라 관계 상태 전환 속도 제한이다. SLOW/ULTRA SLOW의 초반 화에서 목적지 행동을 먼저 실행하지 않는다.
- 신체적 친밀도와 로맨틱 관계 상태는 별개 축이다. 이미 신체적으로 가까운 관계여도 연인 권리, 배타성, 소유권, 감정 확정이 자동으로 따라오지 않는다.
${phaseRules}
${physicalCurrent ? '- 현재 관계가 신체적 합의를 포함하더라도 그 합의 범위를 로맨틱 독점·연인 권리로 자동 확대하지 않는다.' : ''}
${possessiveSelected ? `- 집착/소유욕은 장기 다이내믹 후보다. ${phase === 'setup' ? 'SETUP에서는 겉으로 드러나는 소유 주장·통제·독점 행동으로 발현시키지 않는다.' : phase === 'build' ? 'BUILD에서는 본인도 설명하기 어려운 관심 변화 정도까지 허용하되 상대에 대한 권리 주장으로 바꾸지 않는다.' : '현재 단계와 상호성이 허용하는 범위에서만 점진적으로 발현한다.'}` : ''}
${jealousySelected ? `- 질투 트로프도 관계 단계보다 앞서지 않는다. ${PHASE_RANK[phase] < PHASE_RANK.transition ? '초기에는 질투 장면을 관계 증명처럼 쓰지 말고, 감정의 정체를 아직 확정하지 않는다.' : '관계의 상호성과 기존 사건을 근거로 사용한다.'}` : ''}
${explicit || alreadyTarget ? '- 이번 화 직접 지시/HARD CANON이 현재 전환을 명시했다면 그 명시 범위 안에서는 위 단계 제한보다 사용자 지시를 우선한다.' : '- 이번 화에는 관계 전환을 직접 명시한 사용자 지시가 없다. 자동 디렉터가 목적지를 앞당겨 완성하지 않는다.'}`.trim();
  }

  function clicheDirective(){
    const memory = clicheMemory();
    const labels = memory.cooldown.map(id => CLICHE_LABELS[id]);
    return `
[DIALOGUE CLICHE COOLDOWN V1]
- 최근 확정 대사 ${memory.total}개를 의미군으로만 분석했다. 원문 대사는 이 프롬프트에 재주입하지 않는다.
- 현재 냉각 대상=${labels.length ? labels.join(' / ') : '없음'}.
- 냉각 대상 의미군은 직접적인 서사 콜백이 꼭 필요한 경우가 아니면 이번 화에서 사용하지 않는다. 단어만 바꿔 같은 목적을 반복해도 같은 반복으로 본다.
- 긴장이 높아질수록 범용 클리셰를 세게 반복하는 대신, 상대가 방금 한 행동·표정·선택에만 성립하는 반응을 우선한다.
- 동일한 책임전가형 도발, 결과 예고, 결과 요구, 범용 욕망 선언을 대화의 자동 후렴구로 만들지 않는다.`.trim();
  }

  function applyConceptSelections(selection){
    const s = selection && typeof selection === 'object' ? selection : {};
    const recommended = new Set(Array.isArray(s.recommendedRelationshipIds) ? s.recommendedRelationshipIds.map(String) : []);
    const crossovers = new Set(Array.isArray(s.crossoverIds) ? s.crossoverIds.map(String) : []);
    qsa('[data-v33rel]').forEach(el => el.classList.toggle('active', recommended.has(String(el.dataset.v33rel || ''))));
    qsa('#v33Tags .v33-tag[data-id]').forEach(el => el.classList.toggle('on', crossovers.has(String(el.dataset.id || ''))));
    try {
      const cfg = JSON.parse(localStorage.getItem(V33_KEY) || '{}');
      if (cfg && typeof cfg === 'object') {
        cfg.selectedCrossovers = [...crossovers];
        localStorage.setItem(V33_KEY, JSON.stringify(cfg));
      }
    } catch (_) {}
  }

  function installStateSelectionBridge(){
    if (window.__VELOUR_CONCEPT_SELECTION_BRIDGE__) return;
    const oldSnapshot = window.__VELOUR_V4_STATE_SNAPSHOT__;
    if (typeof oldSnapshot === 'function') {
      window.__VELOUR_V4_STATE_SNAPSHOT__ = function(){
        const s = oldSnapshot.apply(this, arguments) || {};
        try { s.conceptSelections = conceptSelectionsFromDom(); } catch (_) {}
        return s;
      };
    }

    const oldRestore = window.__VELOUR_V4_STATE_RESTORE__;
    if (typeof oldRestore === 'function') {
      window.__VELOUR_V4_STATE_RESTORE__ = function(s){
        const out = oldRestore.apply(this, arguments);
        setTimeout(() => applyConceptSelections(s?.conceptSelections), 0);
        return out;
      };
    }

    for (const name of ['restoreStory','restoreDraftStory']) {
      const old = window[name];
      if (typeof old !== 'function' || old.__velourConceptWrapped) continue;
      const wrapped = function(){
        const out = old.apply(this, arguments);
        const apply = () => {
          const s = snapshot();
          if (s?.conceptSelections) applyConceptSelections(s.conceptSelections);
        };
        if (out && typeof out.then === 'function') out.finally(() => setTimeout(apply, 0));
        else setTimeout(apply, 0);
        return out;
      };
      wrapped.__velourConceptWrapped = true;
      window[name] = wrapped;
    }
    window.__VELOUR_CONCEPT_SELECTION_BRIDGE__ = true;
  }

  function install(){
    if (window[GUARD]) return true;
    if (typeof window.buildPrompt !== 'function') return false;
    if (!window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__) return false;
    if (typeof window.__VELOUR_V4_STATE_SNAPSHOT__ !== 'function') return false;

    installStateSelectionBridge();
    const previousBuild = window.buildPrompt;
    window[GUARD] = true;
    window.__VELOUR_CONCEPT_RELATIONSHIP_VERSION__ = VERSION;

    window.buildPrompt = function(){
      const raw = String(previousBuild.apply(this, arguments) || '');
      const state = snapshot();
      const concepts = collectConcepts(state);
      const cleaned = stripLegacyConflicts(raw);
      const blocks = [
        conceptDirective(state, concepts),
        relationshipDirective(state, concepts),
        clicheDirective()
      ];
      window.__VELOUR_LAST_CONCEPT_RESOLUTION__ = {
        at: new Date().toISOString(),
        version: VERSION,
        concepts,
        phase: relationshipPhase(state, concepts),
        destination: destinationFor(state, concepts),
        clicheMemory: clicheMemory()
      };
      return `${cleaned}\n\n${blocks.join('\n\n')}`.trim();
    };

    window.__VELOUR_CONCEPT_RELATIONSHIP_QA__ = {
      version: VERSION,
      collectConcepts,
      conceptSelectionsFromDom,
      paceThresholds,
      relationshipPhase,
      destinationFor,
      explicitTransitionOverride,
      extractDialogue,
      classifyCliche,
      clicheMemory,
      stripLegacyConflicts,
      conceptDirective,
      relationshipDirective,
      clicheDirective,
      applyConceptSelections
    };

    console.info('✦ VELOUR concept + relationship progression governor loaded');
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 400) clearInterval(timer);
  }, 50);
})();
