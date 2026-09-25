'use strict';

/* VELOUR — Verbal Chemistry Engine V2
   Adds tactic-aware, character-aware verbal tension planning on top of the
   existing contextual dialogue engine. It does not raise content boundaries;
   it improves variation, specificity, subtext and relationship-stage fidelity.
*/
(() => {
  'use strict';

  const VERSION = '2.0.0';
  const GUARD = '__VELOUR_VERBAL_CHEMISTRY_V2__';
  const KEY = 'VELOUR_VERBAL_CHEMISTRY_V2';

  const TACTICS = [
    ['witty_observation','짓궂은 관찰'],
    ['comeback','받아치기'],
    ['contradiction','말·행동 모순 찌르기'],
    ['challenge','도전·허세 건드리기'],
    ['twisted_praise','칭찬 비틀기'],
    ['callback','둘만의 콜백'],
    ['restrained_pressure','절제된 압박'],
    ['playful_affection','다정한 희롱']
  ];

  const DEFAULT = {
    directness:55,
    mischief:78,
    playfulness:68,
    emotionalExposure:34,
    verbalDominance:48,
    specificity:92,
    tactics:['witty_observation','comeback','contradiction','challenge','twisted_praise','callback','restrained_pressure']
  };

  const TARGET_LABELS = {
    behavior:'방금 행동·반응',
    expression:'표정·시선·목소리',
    contradiction:'말과 행동의 모순',
    history:'둘만 아는 과거 사건',
    confidence:'허세·평정심·자신감',
    relationship:'현재 관계의 거리',
    choice:'방금 한 선택·양보·회피',
    general:'현재 장면의 구체 맥락'
  };

  const clean = (v,max=240) => String(v || '').replace(/\s+/g,' ').trim().slice(0,max);
  const clamp = v => Math.max(0, Math.min(100, Number(v || 0)));
  const uniq = arr => [...new Set((arr || []).map(String).filter(Boolean))];

  function loadCfg(){
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return normalizeCfg(Object.assign({}, DEFAULT, saved || {}));
    } catch (_) { return normalizeCfg(DEFAULT); }
  }

  function normalizeCfg(cfg){
    const valid = new Set(TACTICS.map(x => x[0]));
    const tactics = uniq(Array.isArray(cfg?.tactics) ? cfg.tactics : DEFAULT.tactics).filter(x => valid.has(x));
    return {
      directness:clamp(cfg?.directness ?? DEFAULT.directness),
      mischief:clamp(cfg?.mischief ?? DEFAULT.mischief),
      playfulness:clamp(cfg?.playfulness ?? DEFAULT.playfulness),
      emotionalExposure:clamp(cfg?.emotionalExposure ?? DEFAULT.emotionalExposure),
      verbalDominance:clamp(cfg?.verbalDominance ?? DEFAULT.verbalDominance),
      specificity:clamp(cfg?.specificity ?? DEFAULT.specificity),
      tactics:tactics.length ? tactics : [...DEFAULT.tactics]
    };
  }

  function saveCfg(cfg){
    const next = normalizeCfg(cfg);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function historyTail(maxChars=22000){
    try {
      if (typeof storyHistory === 'undefined' || !storyHistory) return '';
      return String(storyHistory).replace(/\n?\[\[VELOUR_V4_META\]\][\s\S]*?\[\[\/VELOUR_V4_META\]\]\s*/g,'').slice(-maxChars);
    } catch (_) { return ''; }
  }

  function extractDialogue(text, limit=36){
    const out=[];
    const re=/[“"]([^”"\n]{2,220})[”"]/g;
    let m;
    while ((m=re.exec(String(text || '')))) {
      const line=clean(m[1],220);
      if (line) out.push(line);
    }
    return out.slice(-Math.max(1,Number(limit || 36)));
  }

  function lineShape(line){
    const t=clean(line,220);
    if (!t) return 'statement';
    if (/\?$/.test(t)) return 'question';
    if (/(?:해봐|말해|봐\b|하지\s*마|기다려|와\b|가\b|선택해|버텨)/i.test(t)) return 'directive';
    if (/[!！]$/.test(t)) return 'exclamation';
    return t.length <= 12 ? 'short_statement' : 'statement';
  }

  function classifyTactic(line){
    const t=clean(line,220);
    if (!t) return 'other';
    if (/(?:아까|그때|지난번|전에|저번|기억나|기억하지)/i.test(t)) return 'callback';
    if (/(?:말은|말로는|입으로는|아니라더니|싫다더니|괜찮다더니|그만이라더니)/i.test(t)) return 'contradiction';
    if (/(?:자신|허세|여유|침착|버텨|감당|끝까지|어디까지)/i.test(t)) return 'challenge';
    if (/(?:잘하네|기특|착하|예쁘|귀엽|훌륭|제법)/i.test(t)) return 'twisted_praise';
    if (/(?:그러는\s*(?:너|네)|네가\s*그랬|누가\s*할\s*말|그건\s*너도)/i.test(t)) return 'comeback';
    if (/(?:표정|눈빛|시선|목소리|말투|손|숨|웃음|반응)/i.test(t)) return 'witty_observation';
    if (/(?:웃|장난|놀리|귀엽)/i.test(t)) return 'playful_affection';
    if (t.length <= 18 && !/[!?！？]/.test(t)) return 'restrained_pressure';
    return 'other';
  }

  function classifyTarget(line){
    const t=clean(line,220);
    if (/(?:말은|말로는|입으로는|아니라더니|싫다더니|괜찮다더니|그만이라더니)/i.test(t)) return 'contradiction';
    if (/(?:아까|그때|지난번|전에|저번|기억)/i.test(t)) return 'history';
    if (/(?:표정|눈빛|시선|목소리|말투|숨|웃음)/i.test(t)) return 'expression';
    if (/(?:자신|허세|여유|침착|버텨|감당)/i.test(t)) return 'confidence';
    if (/(?:우리|사이|관계|약속|거리)/i.test(t)) return 'relationship';
    if (/(?:선택|피하|도망|양보|먼저|기다|멈춰)/i.test(t)) return 'choice';
    if (/(?:손|움직|행동|반응|고개|몸짓)/i.test(t)) return 'behavior';
    return 'general';
  }

  function chemistryMemory(){
    const lines=extractDialogue(historyTail(),36);
    const recent=lines.slice(-14);
    const tacticCounts={};
    const signatureCounts={};
    for (const line of recent) {
      const tactic=classifyTactic(line);
      const target=classifyTarget(line);
      const shape=lineShape(line);
      if (tactic !== 'other') tacticCounts[tactic]=(tacticCounts[tactic] || 0)+1;
      const sig=`${tactic}|${target}|${shape}`;
      signatureCounts[sig]=(signatureCounts[sig] || 0)+1;
    }
    const overusedTactics=Object.keys(tacticCounts).filter(k => tacticCounts[k] >= 3);
    const overusedSignatures=Object.keys(signatureCounts).filter(k => signatureCounts[k] >= 2);
    return { total:lines.length, recent:recent.length, tacticCounts, signatureCounts, overusedTactics, overusedSignatures };
  }

  function relationshipPhase(){
    try {
      const last=window.__VELOUR_LAST_CONCEPT_RESOLUTION__;
      if (last?.phase) return String(last.phase);
      const state=snapshot();
      const qa=window.__VELOUR_CONCEPT_RELATIONSHIP_QA__;
      if (qa?.collectConcepts && qa?.relationshipPhase) {
        const concepts=qa.collectConcepts(state);
        return String(qa.relationshipPhase(state, concepts) || 'setup');
      }
    } catch (_) {}
    return 'setup';
  }

  function sceneMode(){
    try {
      if (window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__?.sceneMode) return window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__.sceneMode();
    } catch (_) {}
    return 'general';
  }

  function tacticLabel(id){ return (TACTICS.find(x => x[0] === id) || [id,id])[1]; }

  function rotate(arr, offset){
    if (!arr.length) return [];
    const n=((Number(offset || 0)%arr.length)+arr.length)%arr.length;
    return arr.slice(n).concat(arr.slice(0,n));
  }

  function chooseTactics(cfg, memory, state){
    const confirmed=Math.max(0,Number(state?.runtime?.confirmedEpisode || 0));
    const base=rotate(cfg.tactics, confirmed + memory.recent + 1);
    const fresh=base.filter(id => !memory.overusedTactics.includes(id));
    return (fresh.length >= 3 ? fresh : base).slice(0,3);
  }

  function targetPriority(memory){
    const candidates=['behavior','expression','contradiction','history','confidence','choice','relationship'];
    const used={};
    for (const sig of Object.keys(memory.signatureCounts || {})) {
      const parts=sig.split('|');
      used[parts[1]]=(used[parts[1]] || 0)+memory.signatureCounts[sig];
    }
    return candidates.sort((a,b)=>(used[a] || 0)-(used[b] || 0)).slice(0,4);
  }

  function attitude(cfg){
    const parts=[];
    parts.push(cfg.mischief >= 70 ? '짓궂음 높음' : cfg.mischief >= 40 ? '짓궂음 중간' : '짓궂음 낮음');
    parts.push(cfg.playfulness >= 70 ? '장난기 높음' : cfg.playfulness >= 40 ? '장난기 중간' : '장난기 낮음');
    parts.push(cfg.emotionalExposure >= 65 ? '감정 노출 높음' : cfg.emotionalExposure >= 35 ? '감정 노출 중간' : '감정 노출 낮음');
    parts.push(cfg.verbalDominance >= 65 ? '대화 주도 높음' : cfg.verbalDominance >= 35 ? '대화 주도 중간' : '대화 주도 낮음');
    return parts.join(' / ');
  }

  function directive(state, cfg){
    const memory=chemistryMemory();
    const preferred=chooseTactics(cfg,memory,state);
    const targets=targetPriority(memory);
    const phase=relationshipPhase();
    const mode=sceneMode();
    const dirty=clamp(state?.dirtyTalk ?? 70);
    const frequency=clamp(state?.dirtyTalkFrequency ?? 70);
    const profanity=clamp(state?.profanity ?? 20);
    const tacticText=preferred.map(tacticLabel).join(' / ') || '상황 맞춤형 반응';
    const targetText=targets.map(id => TARGET_LABELS[id]).join(' / ');
    const cooled=memory.overusedSignatures.length ? memory.overusedSignatures.join(', ') : '없음';

    return `
[VERBAL CHEMISTRY ENGINE V2 — 최종 대사 화법 설계]
- 이 블록은 대사의 화법·짓궂음·상황 특이성에 대한 최종 권위다. 관계 단계/동의/HARD CANON은 Relationship Governor와 사용자 직접 지시를 우선한다.
- 현재 sceneMode=${mode}, relationshipPhase=${phase}. 더티톡 강도=${dirty}/100, 빈도=${frequency}/100, 욕설 강도=${profanity}/100. 이 값은 수위와 출현 빈도의 상한이지, 범용 직설 문장을 반복하라는 명령이 아니다.
- Verbal Chemistry 설정: 직접성=${cfg.directness}/100, 짓궂음=${cfg.mischief}/100, 장난기=${cfg.playfulness}/100, 감정노출=${cfg.emotionalExposure}/100, 대화주도=${cfg.verbalDominance}/100, 상황특이성=${cfg.specificity}/100. 현재 태도=${attitude(cfg)}.
- 이번 화 우선 희롱 전략=${tacticText}. 우선 표적=${targetText}. 최근 반복 시그니처 냉각=${cooled}.
- 한 줄을 쓰기 전 내부적으로 Trigger → Intent → Tactic → Target → Attitude → Character Voice → Line 순서로 결정한다. 문장을 먼저 만들고 이유를 붙이지 않는다.
- Trigger는 상대가 방금 한 말·표정·행동·선택 또는 둘만 아는 직전 사건이어야 한다. 상황특이성이 높을수록 핵심 대사는 현재 장면이 없으면 성립하기 어렵게 만든다.
- Tactic은 선택된 전략 중 장면과 캐릭터에 맞는 1개를 고른다. 여러 전략을 한 문장에 억지로 섞지 않는다. 최근 과사용 전략이나 같은 tactic+target+문장형 조합은 우선순위를 낮춘다.
- Target은 상대의 방금 행동, 표정, 말과 행동의 모순, 허세, 이전 콜백, 방금 한 선택처럼 구체적인 한 지점으로 좁힌다. 막연한 외모 평가나 범용 욕망 선언을 기본 표적으로 삼지 않는다.
- 직접성은 표현의 노골성/우회 정도를 조절한다. 직접성이 높아도 문맥 없이 센 단어만 던지는 방식은 금지하고, 낮아도 의미 없는 완곡어법으로 흐리지 않는다.
- 짓궂음은 상대가 스스로 반응하거나 인정하게 만드는 언어적 장난의 강도다. 책임을 떠넘기거나 같은 도발을 후렴처럼 반복하는 것으로 대체하지 않는다.
- 장난기는 웃음과 긴장을 함께 만드는 정도다. 모든 장면을 가볍게 만들지 말고 캐릭터가 실제로 장난칠 성격과 상황일 때만 사용한다.
- 감정노출은 화자가 자신의 감정을 얼마나 숨기거나 드러내는지 조절한다. 낮으면 관찰·받아치기·절제된 압박을, 높으면 현재 관계 단계가 허용하는 범위에서 진심이 섞인 표현을 늘린다.
- 대화주도는 상대의 답을 끌어내고 대화의 리듬을 주도하는 정도다. 상대에 대한 소유권·관계 권한·동의 우위를 의미하지 않는다. relationshipPhase보다 앞선 권리 주장은 금지한다.
- 캐릭터 보이스는 전략보다 우선한다. 냉정한 인물은 짧고 건조하게, 능글맞은 인물은 모르는 척 유도하는 식으로 같은 전략도 평소 어휘·문장 길이·존대·호칭 안에서 다르게 구현한다.
- 고급스러움은 완곡함이 아니라 정밀도와 맥락성이다. 인물 이름만 바꿔 다른 커플에게 그대로 붙여도 자연스러운 문장은 폐기 후보로 보고, 현재 장면/과거 사건/관계 거리 중 최소 하나에 묶어서 다시 쓴다.
- 한 장면의 핵심 대사를 같은 목적·같은 리듬으로 연속 반복하지 않는다. 질문형·명령형·짧은 단정형 중 하나가 자동 기본값이 되지 않게 하고, 문장형보다 먼저 대화 목적을 바꾼다.
- 최종 출력 전 핵심 대사마다 ① 이 캐릭터만 할 법한가 ② 직전 장면 때문에 나온 말인가 ③ 현재 관계 단계가 허용하는가 ④ 최근과 같은 tactic+target+shape인가를 검사하고, 2개 이상 실패하면 다시 쓴다.`.trim();
  }

  function style(){
    if (document.getElementById('velourVerbalChemistryV2Style')) return;
    const el=document.createElement('style');
    el.id='velourVerbalChemistryV2Style';
    el.textContent=`
      .velour-vc2{margin-top:10px;padding:10px;border:1px solid rgba(220,170,105,.22);border-radius:10px;background:rgba(255,245,230,.025)}
      .velour-vc2-title{font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:8px}
      .velour-vc2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      .velour-vc2-field label{display:flex;justify-content:space-between;font-size:9px;opacity:.9;margin-bottom:4px}
      .velour-vc2-field input[type=range]{width:100%}
      .velour-vc2-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      .velour-vc2-tag{font-size:9px;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px 7px;cursor:pointer;user-select:none}
      .velour-vc2-tag.on{border-color:rgba(236,190,120,.55);background:rgba(236,190,120,.12)}
      .velour-vc2-note{font-size:8.5px;line-height:1.55;opacity:.64;margin-top:7px}
      @media(max-width:520px){.velour-vc2-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(el);
  }

  function renderUI(){
    if (document.getElementById('velourVerbalChemistryV2')) return true;
    const anchor=document.getElementById('v4DirtyFrequency') || document.getElementById('v4Dirty');
    if (!anchor) return false;
    const host=anchor.closest('.v40-grid') || anchor.closest('.v40-field') || anchor.parentElement;
    if (!host?.parentElement) return false;

    const cfg=loadCfg();
    const wrap=document.createElement('div');
    wrap.id='velourVerbalChemistryV2';
    wrap.className='velour-vc2';
    const sliders=[
      ['directness','직접성'],['mischief','짓궂음'],['playfulness','장난기'],
      ['emotionalExposure','감정 노출'],['verbalDominance','대화 주도'],['specificity','상황 특이성']
    ];
    wrap.innerHTML=`<div class="velour-vc2-title">VERBAL CHEMISTRY · 대사 성향</div>
      <div class="velour-vc2-grid">${sliders.map(([id,label])=>`<div class="velour-vc2-field"><label>${label}<span data-vc2-val="${id}">${cfg[id]}</span></label><input type="range" min="0" max="100" value="${cfg[id]}" data-vc2-range="${id}"></div>`).join('')}</div>
      <div class="velour-vc2-tags">${TACTICS.map(([id,label])=>`<span class="velour-vc2-tag ${cfg.tactics.includes(id)?'on':''}" data-vc2-tactic="${id}">${label}</span>`).join('')}</div>
      <div class="velour-vc2-note">강도보다 ‘어떻게 말하는지’를 정하는 설정. 여러 개를 골라도 장면마다 1~3개만 자동 선택하며 관계 단계와 캐릭터 말투를 우선함.</div>`;
    host.insertAdjacentElement('afterend',wrap);

    wrap.querySelectorAll('[data-vc2-range]').forEach(el=>el.addEventListener('input',()=>{
      const next=loadCfg();
      next[el.dataset.vc2Range]=clamp(el.value);
      saveCfg(next);
      const out=wrap.querySelector(`[data-vc2-val="${el.dataset.vc2Range}"]`);
      if (out) out.textContent=String(next[el.dataset.vc2Range]);
    }));
    wrap.querySelectorAll('[data-vc2-tactic]').forEach(el=>el.addEventListener('click',()=>{
      const next=loadCfg();
      const id=String(el.dataset.vc2Tactic || '');
      const set=new Set(next.tactics);
      set.has(id) ? set.delete(id) : set.add(id);
      if (!set.size) set.add('witty_observation');
      next.tactics=[...set];
      saveCfg(next);
      el.classList.toggle('on',set.has(id));
    }));
    return true;
  }

  function installStateBridge(){
    if (window.__VELOUR_VERBAL_CHEMISTRY_STATE_BRIDGE__) return;
    const oldSnapshot=window.__VELOUR_V4_STATE_SNAPSHOT__;
    if (typeof oldSnapshot === 'function') {
      window.__VELOUR_V4_STATE_SNAPSHOT__=function(){
        const s=oldSnapshot.apply(this,arguments) || {};
        s.verbalChemistry=loadCfg();
        return s;
      };
    }
    const oldRestore=window.__VELOUR_V4_STATE_RESTORE__;
    if (typeof oldRestore === 'function') {
      window.__VELOUR_V4_STATE_RESTORE__=function(s){
        if (s?.verbalChemistry) saveCfg(s.verbalChemistry);
        const out=oldRestore.apply(this,arguments);
        setTimeout(()=>{ document.getElementById('velourVerbalChemistryV2')?.remove(); renderUI(); },0);
        return out;
      };
    }
    window.__VELOUR_VERBAL_CHEMISTRY_STATE_BRIDGE__=true;
  }

  function install(){
    if (window[GUARD]) return true;
    if (typeof window.buildPrompt !== 'function') return false;
    if (!window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__) return false;
    if (!window.__VELOUR_CONCEPT_RELATIONSHIP_GOVERNOR__) return false;

    style();
    renderUI();
    installStateBridge();

    const previousBuild=window.buildPrompt;
    window[GUARD]=true;
    window.__VELOUR_VERBAL_CHEMISTRY_VERSION__=VERSION;

    window.buildPrompt=function(){
      const raw=String(previousBuild.apply(this,arguments) || '');
      const state=snapshot();
      const cfg=loadCfg();
      const block=directive(state,cfg);
      window.__VELOUR_LAST_VERBAL_CHEMISTRY__={
        at:new Date().toISOString(), version:VERSION, config:cfg,
        memory:chemistryMemory(), relationshipPhase:relationshipPhase(), sceneMode:sceneMode()
      };
      return `${raw}\n\n${block}`.trim();
    };

    window.__VELOUR_VERBAL_CHEMISTRY_QA__={
      version:VERSION, loadCfg, normalizeCfg, extractDialogue, lineShape,
      classifyTactic, classifyTarget, chemistryMemory, relationshipPhase,
      chooseTactics, targetPriority, directive, renderUI
    };

    console.info('✦ VELOUR Verbal Chemistry Engine V2 loaded');
    return true;
  }

  if (install()) return;
  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    style();
    renderUI();
    if (install() || tries>400) clearInterval(timer);
  },50);
})();
