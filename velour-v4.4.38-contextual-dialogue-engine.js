'use strict';

/* VELOUR — contextual dialogue engine.
   Final prompt layer for scene-aware dialogue variation.
   It removes overlapping legacy dialogue directives, summarizes recent dialogue
   by function (never by replaying prior lines), then appends one authoritative
   dialogue rule set. Canon, relationship progression, storage and provider
   behavior are intentionally untouched.
*/
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const GUARD = '__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__';
  const META_RE = /\n?\[\[VELOUR_V4_META\]\][\s\S]*?\[\[\/VELOUR_V4_META\]\]\s*/g;
  const LABELS = {
    observation: '즉각 관찰·반응',
    tease: '도발·놀림',
    question: '질문·유도',
    request: '요구·선택 제시',
    coordination: '속도·거리·경계 조율',
    emotion: '감정 노출',
    desire: '욕망 고백',
    body: '외형·몸 반응',
    sensation: '감각 보고',
    climax: '절정·결과 예고',
    reassurance: '안심·다정함',
    humor: '장난·유머',
    other: '기타'
  };

  const MODE_BANK = {
    buildup: ['observation','tease','question','emotion','request','humor','reassurance'],
    intimate: ['observation','request','coordination','emotion','tease','question','reassurance'],
    aftercare: ['reassurance','emotion','observation','humor','question','coordination'],
    general: ['observation','question','emotion','humor','request','reassurance','tease']
  };

  const clean = (value, max = 240) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function stripMeta(text){
    return String(text || '').replace(META_RE, '').trim();
  }

  function historyTail(maxChars = 22000){
    try {
      if (typeof storyHistory === 'undefined' || !storyHistory) return '';
      return stripMeta(String(storyHistory)).slice(-Math.max(1200, Number(maxChars || 22000)));
    } catch (_) {
      return '';
    }
  }

  function extractDialogue(text, limit = 28){
    const src = String(text || '');
    const out = [];
    const re = /[“"]([^”"\n]{2,220})[”"]/g;
    let m;
    while ((m = re.exec(src))) {
      const line = clean(m[1], 220);
      if (line && !/^\[\[/.test(line)) out.push(line);
    }
    return out.slice(-Math.max(1, Number(limit || 28)));
  }

  function classifyDialogue(raw){
    const line = clean(raw, 220);
    if (!line) return 'other';

    // Outcome/climax family comes first because it is the main historical collapse mode.
    if (/(?:사정|절정|싸(?:고\s*싶|줘|도\s*돼|버릴)|갈\s*것\s*같.{0,8}(?:지금|여기|안|몸))/i.test(line)) return 'climax';
    if (/(?:괜찮|멈춰|천천히|조금만|그대로|힘\s*빼|아프|싫으면|원하면|불편|말해줘|말해\b)/i.test(line)) return 'coordination';
    if (/(?:농담|웃기|장난|놀리는|놀리네|귀엽|웃어)/i.test(line)) return 'humor';
    if (/(?:괜찮아|걱정\s*마|미안|안심|무서워하지|내가\s*있|옆에\s*있)/i.test(line)) return 'reassurance';
    if (/(?:알면서|모르는\s*척|왜\s+자꾸|왜\s+계속|버틸|참는\s*척|도망|겁나|쫄았|또\s*피하)/i.test(line)) return 'tease';
    if (/\?\s*$/.test(line) || /(?:왜|어디|뭐|어떻게|진짜|알아\?|맞아\?)/i.test(line)) return 'question';
    if (/(?:해줘|말해|봐\b|보여|하지\s*마|가만히|이리\s*와|다가와|기다려|앉아|서\s*있어|키스해|선택해)/i.test(line)) return 'request';
    if (/(?:사랑|좋아해|보고\s*싶|질투|미워|무서|서운|걱정|아끼|그리웠|행복|미안해)/i.test(line)) return 'emotion';
    if (/(?:원해|하고\s*싶|갖고\s*싶|못\s*참|참을\s*수\s*없|원했어|원한다)/i.test(line)) return 'desire';
    if (/(?:예쁘|잘생|몸|허리|어깨|가슴|다리|입술|목덜미|등\b|손끝)/i.test(line)) return 'body';
    if (/(?:뜨거|떨려|저려|숨차|감각|아파|간지|열나|소름|심장)/i.test(line)) return 'sensation';
    if (/(?:지금|아까|방금|그렇게|표정|눈빛|목소리|시선|손\b|숨\b)/i.test(line)) return 'observation';
    return 'other';
  }

  function countFunctions(lines){
    const counts = Object.fromEntries(Object.keys(LABELS).map(k => [k, 0]));
    for (const line of lines || []) counts[classifyDialogue(line)] += 1;
    return counts;
  }

  function dialogueMemory(){
    const lines = extractDialogue(historyTail(), 28);
    const recent = lines.slice(-10);
    const counts = countFunctions(lines);
    const recentCounts = countFunctions(recent);
    const overused = [];
    const recentN = Math.max(1, recent.length);

    for (const id of Object.keys(LABELS)) {
      if (id === 'other') continue;
      const n = recentCounts[id] || 0;
      if (n >= 3 || (recent.length >= 5 && n / recentN >= 0.4)) overused.push(id);
    }

    return {
      total: lines.length,
      recent: recent.length,
      counts,
      recentCounts,
      overused
    };
  }

  function sceneMode(){
    const stage = clean(document.getElementById('selectStage')?.value || '', 500);
    const direction = clean(document.getElementById('v33Next')?.value || '', 500);
    const raw = `${stage} ${direction}`;
    if (/(?:여운|애프터|후일담|aftercare|after\s*care)/i.test(raw)) return 'aftercare';
    if (/(?:빌드업|감정선|심리전|아슬아슬|긴장|플러팅)/i.test(raw)) return 'buildup';
    if (/(?:텐션\s*폭발|결합|스킨십|친밀\s*장면|intimate)/i.test(raw)) return 'intimate';
    return 'general';
  }

  function rotate(items, offset){
    if (!items.length) return [];
    const n = ((Number(offset || 0) % items.length) + items.length) % items.length;
    return items.slice(n).concat(items.slice(0, n));
  }

  function preferredFunctions(state, memory, mode){
    const base = MODE_BANK[mode] || MODE_BANK.general;
    const confirmed = Math.max(0, Number(state?.runtime?.confirmedEpisode || 0));
    const rotated = rotate(base, confirmed + 1);
    const notOverused = rotated.filter(id => !memory.overused.includes(id));
    const pool = notOverused.length >= 3 ? notOverused : rotated;
    return pool.slice(0, 4);
  }

  function stripNamedBlock(prompt, titlePrefix){
    const escaped = String(titlePrefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\n?\\[${escaped}[^\\]]*\\][\\s\\S]*?(?=\\n\\[[^\\n\\]]+\\]|$)`, 'g');
    return String(prompt || '').replace(re, '\n');
  }

  function stripLegacyDialogueDirectives(prompt){
    let out = String(prompt || '');
    out = stripNamedBlock(out, 'DIALOGUE FUNCTION ROTATION');
    out = stripNamedBlock(out, 'BODY PRAISE TALK');

    const dropLine = line => {
      const t = String(line || '').trim();
      if (!t) return false;
      if (/^-\s*더티톡\s*강도=/.test(t)) return true;
      if (/^-\s*더티톡은\s+문장/.test(t)) return true;
      if (/^-\s*대사는\s+절정\s*예고\s*대신/.test(t)) return true;
      if (/BODY PRAISE TALK/.test(t)) return true;
      if (/나한테\s*싸|싸줘\/싸도\s*돼|갈\s*것\s*같아/.test(t)) return true;
      return false;
    };

    out = out.split('\n').filter(line => !dropLine(line)).join('\n');
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }

  function directive(state){
    const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));
    const frequency = Math.max(0, Math.min(100, Number(state?.dirtyTalkFrequency ?? 70)));
    const praise = String(state?.bodyPraiseDirtyTalk || 'high').toLowerCase();
    const memory = dialogueMemory();
    const mode = sceneMode();
    const preferred = preferredFunctions(state, memory, mode);
    const overused = memory.overused.length ? memory.overused.map(id => LABELS[id]).join(' / ') : '뚜렷한 과사용 없음';
    const priority = preferred.map(id => LABELS[id]).join(' / ');

    return `\n[CONTEXTUAL DIALOGUE ENGINE V1 — 최종 대사 규칙]\n- 이 블록이 친밀 장면 대사 다양성에 대한 최종 권위다. 위쪽 레거시 지시와 충돌하면 이 블록을 따른다.\n- 현재 대화 모드=${mode}. 최근 확정 본문에서 분석한 대사=${memory.total}개(최근 ${memory.recent}개 집중 분석). 최근 과사용 기능=${overused}. 이번 화 우선 후보=${priority}.\n- 더티톡 강도=${dirty}/100은 선택된 대사가 얼마나 직접적일 수 있는지의 상한이고, 빈도=${frequency}/100은 친밀 장면에서 그런 대사를 선택할 성향이다. 강도나 빈도가 높다는 이유만으로 특정 결과 예고·감각 보고·욕망 선언을 자동 기본값으로 삼지 않는다.\n- 대사를 쓰기 전에 반드시 내부적으로 ① 상대가 방금 한 말·표정·행동 또는 둘 사이의 현재 사건에서 ‘촉발점’을 하나 잡고 ② 이 인물이 지금 상대에게 얻고 싶은 반응/결과를 하나 정한 뒤 ③ 그 목적에 맞는 대화 기능을 선택하고 ④ 캐릭터 고유 말투로 표현한다.\n- 장면 밖으로 떼어 다른 커플에게 그대로 붙여도 자연스러운 범용 대사는 우선 폐기한다. 핵심 대사는 현재 장소·직전 행동·표정 변화·둘만 아는 사건·호칭·관계의 거리 중 최소 하나와 실제로 연결되어야 한다.\n- 같은 의미를 단어만 바꿔 연속 출력하지 않는다. 최근 과사용 기능은 우선순위를 낮추고, 같은 기능이 필요하더라도 질문→명령→감탄처럼 표면만 기계적으로 돌리지 말고 대사의 목적 자체를 달리한다.\n- 질문형·명령형·감탄형·욕망 선언형 중 하나가 연속 기본값이 되지 않게 한다. 다만 다양성 체크리스트를 채우려고 부자연스럽게 교대하지 않는다.\n- bodyPraiseDirtyTalk=${praise}. 외형/몸 반응은 지금 실제로 보이는 변화나 움직임 때문에 그 말이 나올 이유가 있을 때만 사용하고, 최근에 같은 부위·같은 평가를 썼다면 다른 관찰 또는 다른 대화 기능을 우선한다.\n- 두 인물 모두 상대의 직전 말과 행동에 응답한다. 한쪽을 감탄·신음·감각 보고만 하는 수동 반응기로 만들거나, 다른 한쪽을 명령·평가만 하는 화자로 고정하지 않는다.\n- 감정이 고조될수록 캐릭터의 평소 말투가 완전히 사라지는 것이 아니라 문장 길이, 숨김 정도, 직접성, 호칭의 흔들림 같은 기존 성격 안의 변화로 보여준다. 호칭·존대·관계 CANON은 별도 전환 사건 없이 깨지지 않는다.\n- 사용자가 이번 화에 특정 대사 의도·말투·수위·표현을 직접 지정했다면 그 직접 지시가 최근 반복 회피보다 우선한다.\n- 최종 출력 전 대사를 훑어 같은 목적의 문장이 2회 이상 사실상 반복되면 하나를 지우거나 다른 기능으로 바꾸고, 대사가 장면을 실제로 앞으로 움직이는지 확인한다.`;
  }

  function install(){
    if (window[GUARD]) return true;
    if (typeof window.buildPrompt !== 'function') return false;
    // Install only after the current final anti-repetition layer exists so this
    // engine can normalize all older overlapping dialogue directives at once.
    if (!window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__) return false;

    const previousBuild = window.buildPrompt;
    window[GUARD] = true;
    window.__VELOUR_CONTEXTUAL_DIALOGUE_VERSION__ = VERSION;

    window.buildPrompt = function(){
      const raw = String(previousBuild.apply(this, arguments) || '');
      const state = snapshot();
      const cleaned = stripLegacyDialogueDirectives(raw);
      const block = directive(state);
      window.__VELOUR_LAST_DIALOGUE_MEMORY__ = Object.assign({
        at: new Date().toISOString(),
        mode: sceneMode(),
        version: VERSION
      }, dialogueMemory());
      return `${cleaned}\n${block}`.trim();
    };

    window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__ = {
      version: VERSION,
      extractDialogue,
      classifyDialogue,
      countFunctions,
      dialogueMemory,
      sceneMode,
      preferredFunctions,
      stripLegacyDialogueDirectives,
      directive
    };

    console.info('✦ VELOUR contextual dialogue engine loaded');
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 400) clearInterval(timer);
  }, 50);
})();
