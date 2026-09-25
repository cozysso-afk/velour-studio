'use strict';

/* VELOUR — Verbal Chemistry Engine V2.2
   Unified tactic/state planner for contextual dialogue. V2.2 replaces the
   previous V2 + refinement prompt layering with one final verbal-chemistry block.
*/
(() => {
  'use strict';

  const VERSION='2.2.0';
  const GUARD='__VELOUR_VERBAL_CHEMISTRY_V2__';
  const KEY='VELOUR_VERBAL_CHEMISTRY_V2';
  const MODE_ORDER=['allowed','priority','off'];
  const TACTICS=[
    ['witty_observation','짓궂은 관찰'],
    ['comeback','받아치기'],
    ['contradiction','말·행동 모순 찌르기'],
    ['challenge','도전·허세 건드리기'],
    ['twisted_praise','칭찬 비틀기'],
    ['callback','둘만의 콜백'],
    ['restrained_pressure','절제된 압박'],
    ['playful_affection','다정한 희롱']
  ];
  const TACTIC_IDS=TACTICS.map(x=>x[0]);
  const DEFAULT={
    directness:55,mischief:78,playfulness:68,emotionalExposure:34,verbalDominance:48,specificity:92,
    tacticModes:{
      witty_observation:'priority', comeback:'priority', contradiction:'allowed', challenge:'allowed',
      twisted_praise:'allowed', callback:'allowed', restrained_pressure:'allowed', playful_affection:'off'
    }
  };
  const TARGET_LABELS={
    behavior:'방금 행동·반응',expression:'표정·시선·목소리',contradiction:'말과 행동의 모순',
    history:'둘만 아는 과거 사건',confidence:'허세·평정심·자신감',relationship:'현재 관계의 거리',
    choice:'방금 한 선택·양보·회피',general:'현재 장면의 구체 맥락'
  };
  const PATTERN_LABELS={
    contradiction_refrain:'모순 지적 후렴', endurance_test:'허세·감당 시험', rhetorical_question:'수사적 질문 연타',
    directive_streak:'짧은 지시 연타', reaction_assumption:'상대 반응 단정', praise_twist:'칭찬 뒤 비꼬기', callback_overuse:'과거 콜백 과사용'
  };

  const clean=(v,max=300)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,max);
  const clamp=v=>Math.max(0,Math.min(100,Number(v||0)));
  const uniq=arr=>[...new Set((arr||[]).map(String).filter(Boolean))];
  const pct=(n,d)=>d?Math.round((n/d)*100):0;

  function tacticLabel(id){return (TACTICS.find(x=>x[0]===id)||[id,id])[1];}
  function defaultModes(){return Object.assign({},DEFAULT.tacticModes);}

  function normalizeCfg(cfg){
    const legacy=uniq(Array.isArray(cfg?.tactics)?cfg.tactics:[]).filter(x=>TACTIC_IDS.includes(x));
    const supplied=cfg?.tacticModes&&typeof cfg.tacticModes==='object'?cfg.tacticModes:null;
    const modes={};
    for(const id of TACTIC_IDS){
      let mode=supplied?.[id];
      if(!['priority','allowed','off'].includes(mode)){
        // Old V2 settings migrate without silently upgrading a user's choice to priority.
        mode=legacy.length?(legacy.includes(id)?'allowed':'off'):DEFAULT.tacticModes[id];
      }
      modes[id]=mode;
    }
    if(!Object.values(modes).some(x=>x!=='off')) modes.witty_observation='allowed';
    const active=TACTIC_IDS.filter(id=>modes[id]!=='off');
    return {
      directness:clamp(cfg?.directness??DEFAULT.directness),
      mischief:clamp(cfg?.mischief??DEFAULT.mischief),
      playfulness:clamp(cfg?.playfulness??DEFAULT.playfulness),
      emotionalExposure:clamp(cfg?.emotionalExposure??DEFAULT.emotionalExposure),
      verbalDominance:clamp(cfg?.verbalDominance??DEFAULT.verbalDominance),
      specificity:clamp(cfg?.specificity??DEFAULT.specificity),
      tacticModes:modes,
      tactics:active
    };
  }

  function loadCfg(){
    try{return normalizeCfg(Object.assign({},DEFAULT,JSON.parse(localStorage.getItem(KEY)||'{}')||{}));}
    catch(_){return normalizeCfg(DEFAULT);}
  }
  function saveCfg(cfg){const next=normalizeCfg(cfg);try{localStorage.setItem(KEY,JSON.stringify(next));}catch(_){}return next;}
  function snapshot(){try{return window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{};}catch(_){return {};}}
  function historyTail(maxChars=24000){try{return typeof storyHistory==='undefined'?'':String(storyHistory||'').replace(/\n?\[\[VELOUR_V4_META\]\][\s\S]*?\[\[\/VELOUR_V4_META\]\]\s*/g,'').slice(-maxChars);}catch(_){return '';}}

  function extractDialogue(text,limit=40){
    const out=[];const re=/[“"]([^”"\n]{2,240})[”"]/g;let m;
    while((m=re.exec(String(text||'')))){const line=clean(m[1],240);if(line)out.push(line);}
    return out.slice(-Math.max(1,Number(limit||40)));
  }
  function lineShape(line){
    const t=clean(line,240);if(!t)return 'statement';
    if(/[?？]$/.test(t))return 'question';
    if(/(?:해봐|말해|하지\s*마|기다려|선택해|버텨|그만해|대답해|봐\b)/i.test(t))return 'directive';
    if(/[!！]$/.test(t))return 'exclamation';
    return t.length<=12?'short_statement':'statement';
  }
  function classifyTactic(line){
    const t=clean(line,240);if(!t)return 'other';
    if(/(?:아까|그때|지난번|전에|저번|기억나|기억하지)/i.test(t))return 'callback';
    if(/(?:말은|말로는|입으로는|아니라더니|싫다더니|괜찮다더니|그만이라더니)/i.test(t))return 'contradiction';
    if(/(?:자신|허세|여유|침착|버텨|감당|끝까지|어디까지)/i.test(t))return 'challenge';
    if(/(?:잘하네|기특|착하|예쁘|귀엽|훌륭|제법)/i.test(t))return 'twisted_praise';
    if(/(?:그러는\s*(?:너|네)|네가\s*그랬|누가\s*할\s*말|그건\s*너도)/i.test(t))return 'comeback';
    if(/(?:표정|눈빛|시선|목소리|말투|손|숨|웃음|반응)/i.test(t))return 'witty_observation';
    if(/(?:웃|장난|놀리|귀엽)/i.test(t))return 'playful_affection';
    if(t.length<=18&&!/[!?！？]/.test(t))return 'restrained_pressure';
    return 'other';
  }
  function classifyTarget(line){
    const t=clean(line,240);
    if(/(?:말은|말로는|입으로는|아니라더니|싫다더니|괜찮다더니|그만이라더니)/i.test(t))return 'contradiction';
    if(/(?:아까|그때|지난번|전에|저번|기억)/i.test(t))return 'history';
    if(/(?:표정|눈빛|시선|목소리|말투|숨|웃음)/i.test(t))return 'expression';
    if(/(?:자신|허세|여유|침착|버텨|감당)/i.test(t))return 'confidence';
    if(/(?:우리|사이|관계|약속|거리)/i.test(t))return 'relationship';
    if(/(?:선택|피하|도망|양보|먼저|기다|멈춰)/i.test(t))return 'choice';
    if(/(?:손|움직|행동|반응|고개|몸짓)/i.test(t))return 'behavior';
    return 'general';
  }
  function classifyPattern(line){
    const t=clean(line,240),shape=lineShape(t);
    if(/(?:말은|말로는|아니라더니|싫다더니|괜찮다더니|그만이라더니)/i.test(t))return 'contradiction_refrain';
    if(/(?:버텨|감당|끝까지|어디까지|자신\s*있)/i.test(t))return 'endurance_test';
    if(shape==='directive')return 'directive_streak';
    if(shape==='question'&&/(?:왜|정말|그래|어때|알겠|맞지|아니야|할래|할까)/i.test(t))return 'rhetorical_question';
    if(/(?:부끄|당황|흔들|떨고|원하잖|좋아하잖|못\s*참|솔직하)/i.test(t))return 'reaction_assumption';
    if(/(?:잘하네|기특|예쁘|귀엽|제법).*(?:근데|그런데|치고|주제|면서)/i.test(t))return 'praise_twist';
    if(/(?:아까|그때|지난번|저번|기억)/i.test(t))return 'callback_overuse';
    return 'other';
  }

  function chemistryMemory(){
    const lines=extractDialogue(historyTail(),40),recent=lines.slice(-16);
    const tacticCounts={},signatureCounts={},patternCounts={};
    for(const line of recent){
      const tactic=classifyTactic(line),target=classifyTarget(line),shape=lineShape(line),pattern=classifyPattern(line);
      if(tactic!=='other')tacticCounts[tactic]=(tacticCounts[tactic]||0)+1;
      signatureCounts[`${tactic}|${target}|${shape}`]=(signatureCounts[`${tactic}|${target}|${shape}`]||0)+1;
      if(pattern!=='other')patternCounts[pattern]=(patternCounts[pattern]||0)+1;
    }
    return {
      total:lines.length,recent:recent.length,tacticCounts,signatureCounts,patternCounts,
      overusedTactics:Object.keys(tacticCounts).filter(k=>tacticCounts[k]>=3),
      overusedSignatures:Object.keys(signatureCounts).filter(k=>signatureCounts[k]>=2),
      overusedPatterns:Object.keys(patternCounts).filter(k=>patternCounts[k]>=2)
    };
  }

  function voiceFingerprint(){
    const lines=extractDialogue(historyTail(),24);
    if(!lines.length)return {sample:0,length:'unknown',question:'unknown',politeness:'unknown',directives:'unknown',energy:'unknown'};
    const avg=lines.reduce((s,x)=>s+x.length,0)/lines.length;
    const questions=lines.filter(x=>/[?？]$/.test(x)).length;
    const directives=lines.filter(x=>lineShape(x)==='directive').length;
    const polite=lines.filter(x=>/(?:요|습니다|습니까|세요|죠)[.!?…]?$/.test(x)).length;
    const exclaim=lines.filter(x=>/[!！]$/.test(x)).length;
    return {
      sample:lines.length,
      length:avg<14?'짧음':avg<28?'중간':'김',
      question:pct(questions,lines.length)>=35?'높음':pct(questions,lines.length)>=15?'중간':'낮음',
      politeness:pct(polite,lines.length)>=55?'존대 우세':pct(polite,lines.length)>=20?'혼합':'비존대 우세',
      directives:pct(directives,lines.length)>=30?'높음':pct(directives,lines.length)>=12?'중간':'낮음',
      energy:pct(exclaim,lines.length)>=25?'높음':pct(exclaim,lines.length)>=8?'중간':'낮음'
    };
  }

  function relationshipPhase(){
    try{
      const last=window.__VELOUR_LAST_CONCEPT_RESOLUTION__;if(last?.phase)return String(last.phase);
      const state=snapshot(),qa=window.__VELOUR_CONCEPT_RELATIONSHIP_QA__;
      if(qa?.collectConcepts&&qa?.relationshipPhase)return String(qa.relationshipPhase(state,qa.collectConcepts(state))||'setup');
    }catch(_){}return 'setup';
  }
  function sceneMode(){try{return window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__?.sceneMode?.()||'general';}catch(_){return 'general';}}
  function rotate(arr,offset){if(!arr.length)return[];const n=((Number(offset||0)%arr.length)+arr.length)%arr.length;return arr.slice(n).concat(arr.slice(0,n));}
  function modeIds(cfg,mode){return TACTIC_IDS.filter(id=>cfg.tacticModes[id]===mode);}

  function chooseTactics(cfg,memory,state){
    const offset=Math.max(0,Number(state?.runtime?.confirmedEpisode||0))+memory.recent+1;
    const priority=rotate(modeIds(cfg,'priority'),offset),allowed=rotate(modeIds(cfg,'allowed'),offset);
    const fresh=a=>a.filter(id=>!memory.overusedTactics.includes(id));
    const chosen=[];
    for(const id of [...fresh(priority),...priority,...fresh(allowed),...allowed])if(!chosen.includes(id))chosen.push(id);
    return chosen.slice(0,3);
  }
  function targetPriority(memory){
    const candidates=['behavior','expression','contradiction','history','confidence','choice','relationship'],used={};
    for(const sig of Object.keys(memory.signatureCounts||{})){const p=sig.split('|');used[p[1]]=(used[p[1]]||0)+memory.signatureCounts[sig];}
    return candidates.sort((a,b)=>(used[a]||0)-(used[b]||0)).slice(0,4);
  }
  function teaseBudget(state,cfg){
    const frequency=clamp(state?.dirtyTalkFrequency??70),mischief=clamp(cfg.mischief);
    if(frequency<20||mischief<20)return 1;
    if(frequency<65||mischief<60)return 2;
    return 3;
  }
  function attitude(cfg){
    return [
      cfg.mischief>=70?'짓궂음 높음':cfg.mischief>=40?'짓궂음 중간':'짓궂음 낮음',
      cfg.playfulness>=70?'장난기 높음':cfg.playfulness>=40?'장난기 중간':'장난기 낮음',
      cfg.emotionalExposure>=65?'감정 노출 높음':cfg.emotionalExposure>=35?'감정 노출 중간':'감정 노출 낮음',
      cfg.verbalDominance>=65?'대화 주도 높음':cfg.verbalDominance>=35?'대화 주도 중간':'대화 주도 낮음'
    ].join(' / ');
  }
  function listLabels(ids){return ids.length?ids.map(tacticLabel).join(' / '):'없음';}
  function stripOldBlocks(raw){
    return String(raw||'')
      .replace(/\n?\[VERBAL CHEMISTRY ENGINE V2[^\]]*\][\s\S]*?(?=\n\[[A-Z가-힣][^\n\]]*\]|$)/g,'')
      .replace(/\n?\[VERBAL CHEMISTRY V2\.1[^\]]*\][\s\S]*?(?=\n\[[A-Z가-힣][^\n\]]*\]|$)/g,'')
      .trim();
  }

  function directive(state,cfg){
    const memory=chemistryMemory(),preferred=chooseTactics(cfg,memory,state),targets=targetPriority(memory),voice=voiceFingerprint();
    const phase=relationshipPhase(),mode=sceneMode(),dirty=clamp(state?.dirtyTalk??70),frequency=clamp(state?.dirtyTalkFrequency??70),profanity=clamp(state?.profanity??20);
    const insultMode=String(state?.insultMode||'off').toLowerCase();
    const priority=modeIds(cfg,'priority'),allowed=modeIds(cfg,'allowed'),off=modeIds(cfg,'off'),budget=teaseBudget(state,cfg);
    const cooledPatterns=memory.overusedPatterns.length?memory.overusedPatterns.map(x=>PATTERN_LABELS[x]||x).join(' / '):'없음';
    const cooledSigs=memory.overusedSignatures.length?memory.overusedSignatures.slice(0,5).join(', '):'없음';
    return `
[VERBAL CHEMISTRY ENGINE V2.2 — 통합 최종 대사 설계]
- 이 블록 하나가 Verbal Chemistry의 최종 권위다. 관계 단계/동의/HARD CANON은 Relationship Governor와 사용자 직접 지시를 우선한다.
- sceneMode=${mode}, relationshipPhase=${phase}. 더티톡 강도=${dirty}/100, 빈도=${frequency}/100, 욕설 강도=${profanity}/100. 강도와 빈도는 상한이지 범용 직설 문장을 반복하라는 지시가 아니다.
- 전략 상태: 주력=${listLabels(priority)} / 허용=${listLabels(allowed)} / OFF=${listLabels(off)}. 핵심 희롱은 OFF 전략을 쓰지 않는다. 주력 전략을 먼저 검토하고 장면에 실제 근거가 없으면 허용 전략으로 내려간다.
- 이번 화 우선 후보=${listLabels(preferred)}. 한 줄에는 한 전략만 중심으로 쓰고, 같은 tactic+target+문장형 조합을 연속 반복하지 않는다.
- 이번 장면 핵심 희롱 비트 예산=${budget}. 예산은 최대치다. 희롱 비트 뒤에는 상대의 응답·행동·침묵·주제 전환 같은 실제 반응 비트를 두고, 희롱만 연속 발사하지 않는다.
- 설정: 직접성=${cfg.directness}/100, 짓궂음=${cfg.mischief}/100, 장난기=${cfg.playfulness}/100, 감정노출=${cfg.emotionalExposure}/100, 대화주도=${cfg.verbalDominance}/100, 상황특이성=${cfg.specificity}/100. 현재 태도=${attitude(cfg)}.
- 우선 표적=${targets.map(id=>TARGET_LABELS[id]).join(' / ')}. 상황특이성 70 이상이면 핵심 희롱은 직전 행동·표정·선택·모순·과거 콜백 중 실제로 확인된 하나에 묶는다. 근거가 없으면 범용 희롱을 만들지 않는다.
- 최근 확정 대사 voice fingerprint: 문장길이=${voice.length}, 질문비율=${voice.question}, 존대성=${voice.politeness}, 지시형=${voice.directives}, 에너지=${voice.energy} (표본 ${voice.sample}). 이 값은 기존 캐릭터별 voice memory를 대체하지 않고 말투 급변을 막는 보조 장치다.
- 한 줄을 쓰기 전 Trigger → Intent → Tactic → Target → Attitude → Character Voice → Line 순서로 결정한다. 문장을 먼저 만들고 이유를 붙이지 않는다.
- 직접성이 높아도 문맥 없이 센 단어만 던지지 않는다. 짓궂음은 책임 전가형 도발이나 같은 멸칭의 반복으로 대체하지 않는다. 대화주도는 소유권·관계 권한·동의 우위를 뜻하지 않는다.
- 의미 패턴 냉각=${cooledPatterns}. 최근 반복 시그니처 냉각=${cooledSigs}. 모순 지적 후렴, 허세·감당 시험, 수사적 질문 연타, 짧은 지시 연타, 상대 반응 단정, 칭찬 뒤 비꼬기, 과거 콜백이 반복되면 다른 목적·전략·문장형으로 바꾼다.
- 상대가 부끄러워한다/원한다/굴복했다고 근거 없이 단정하지 않는다. 관찰 가능한 행동과 실제 대사만 희롱의 재료로 삼는다.
- 고급스러움은 완곡함이 아니라 정밀도와 맥락성이다. 인물 이름만 바꿔 다른 커플에게 붙여도 자연스러운 핵심 대사는 다시 쓴다.
- 상대 비하형 성별 멸칭 설정=${insultMode}. ${insultMode==='custom'?'사용자 HARD CANON의 명시적 언어 지시를 따른다.':'HARD OFF. 욕설 강도·짓궂음·직접성이 높아도 성별을 낮춰 부르는 사람 멸칭은 사용하지 않는다.'}
- 최종 검사: ① 이 캐릭터만 할 법한가 ② 직전 장면 때문에 나온 말인가 ③ 현재 관계 단계가 허용하는가 ④ 최근과 같은 tactic+target+shape/pattern인가. 2개 이상 실패하면 다시 쓴다.`.trim();
  }

  function style(){
    if(document.getElementById('velourVerbalChemistryV2Style'))return;
    const el=document.createElement('style');el.id='velourVerbalChemistryV2Style';
    el.textContent=`.velour-vc2{margin-top:10px;padding:10px;border:1px solid rgba(220,170,105,.22);border-radius:10px;background:rgba(255,245,230,.025)}.velour-vc2-title{font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:8px}.velour-vc2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.velour-vc2-field label{display:flex;justify-content:space-between;font-size:9px;opacity:.9;margin-bottom:4px}.velour-vc2-field input[type=range]{width:100%}.velour-vc2-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.velour-vc2-tag{font-size:9px;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px 7px;cursor:pointer;user-select:none;opacity:.5}.velour-vc2-tag.allowed{opacity:.9;border-color:rgba(255,255,255,.25)}.velour-vc2-tag.priority{opacity:1;border-color:rgba(236,190,120,.7);background:rgba(236,190,120,.14)}.velour-vc2-tag.off{text-decoration:line-through}.velour-vc2-tag small{font-size:7px;opacity:.72;margin-left:3px}.velour-vc2-note{font-size:8.5px;line-height:1.55;opacity:.64;margin-top:7px}@media(max-width:520px){.velour-vc2-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(el);
  }
  function modeLabel(mode){return mode==='priority'?'주력':mode==='allowed'?'허용':'OFF';}
  function nextMode(mode){const i=MODE_ORDER.indexOf(mode);return MODE_ORDER[(i+1+MODE_ORDER.length)%MODE_ORDER.length];}
  function tagMarkup(id,label,cfg){const mode=cfg.tacticModes[id];return `<span class="velour-vc2-tag ${mode}" data-vc2-tactic="${id}">${label}<small>${modeLabel(mode)}</small></span>`;}
  function renderUI(){
    if(document.getElementById('velourVerbalChemistryV2'))return true;
    const anchor=document.getElementById('v4DirtyFrequency')||document.getElementById('v4Dirty');if(!anchor)return false;
    const host=anchor.closest('.v40-grid')||anchor.closest('.v40-field')||anchor.parentElement;if(!host?.parentElement)return false;
    const cfg=loadCfg(),wrap=document.createElement('div');wrap.id='velourVerbalChemistryV2';wrap.className='velour-vc2';
    const sliders=[['directness','직접성'],['mischief','짓궂음'],['playfulness','장난기'],['emotionalExposure','감정 노출'],['verbalDominance','대화 주도'],['specificity','상황 특이성']];
    wrap.innerHTML=`<div class="velour-vc2-title">VERBAL CHEMISTRY · 대사 성향</div><div class="velour-vc2-grid">${sliders.map(([id,label])=>`<div class="velour-vc2-field"><label>${label}<span data-vc2-val="${id}">${cfg[id]}</span></label><input type="range" min="0" max="100" value="${cfg[id]}" data-vc2-range="${id}"></div>`).join('')}</div><div class="velour-vc2-tags">${TACTICS.map(([id,label])=>tagMarkup(id,label,cfg)).join('')}</div><div class="velour-vc2-note">전략 버튼을 누르면 허용 → 주력 → OFF 순환. 주력은 먼저 검토하고, 허용은 장면에 맞을 때 사용하며, OFF는 핵심 희롱에서 제외됨.</div>`;
    host.insertAdjacentElement('afterend',wrap);
    wrap.querySelectorAll('[data-vc2-range]').forEach(el=>el.addEventListener('input',()=>{const next=loadCfg();next[el.dataset.vc2Range]=clamp(el.value);saveCfg(next);const out=wrap.querySelector(`[data-vc2-val="${el.dataset.vc2Range}"]`);if(out)out.textContent=String(next[el.dataset.vc2Range]);}));
    wrap.querySelectorAll('[data-vc2-tactic]').forEach(el=>el.addEventListener('click',()=>{const cfgNow=loadCfg(),id=String(el.dataset.vc2Tactic||'');cfgNow.tacticModes[id]=nextMode(cfgNow.tacticModes[id]);const saved=saveCfg(cfgNow),mode=saved.tacticModes[id];el.classList.remove('priority','allowed','off');el.classList.add(mode);const small=el.querySelector('small');if(small)small.textContent=modeLabel(mode);}));
    return true;
  }

  function installStateBridge(){
    if(window.__VELOUR_VERBAL_CHEMISTRY_STATE_BRIDGE__)return;
    const oldSnapshot=window.__VELOUR_V4_STATE_SNAPSHOT__;
    if(typeof oldSnapshot==='function')window.__VELOUR_V4_STATE_SNAPSHOT__=function(){const s=oldSnapshot.apply(this,arguments)||{};s.verbalChemistry=loadCfg();return s;};
    const oldRestore=window.__VELOUR_V4_STATE_RESTORE__;
    if(typeof oldRestore==='function')window.__VELOUR_V4_STATE_RESTORE__=function(s){if(s?.verbalChemistry)saveCfg(s.verbalChemistry);const out=oldRestore.apply(this,arguments);setTimeout(()=>{document.getElementById('velourVerbalChemistryV2')?.remove();renderUI();},0);return out;};
    window.__VELOUR_VERBAL_CHEMISTRY_STATE_BRIDGE__=true;
  }

  function install(){
    if(window[GUARD])return true;
    if(typeof window.buildPrompt!=='function'||!window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__||!window.__VELOUR_CONCEPT_RELATIONSHIP_GOVERNOR__)return false;
    style();renderUI();installStateBridge();
    const previousBuild=window.buildPrompt;window[GUARD]=true;window.__VELOUR_VERBAL_CHEMISTRY_VERSION__=VERSION;
    window.buildPrompt=function(){
      const raw=stripOldBlocks(String(previousBuild.apply(this,arguments)||'')),state=snapshot(),cfg=loadCfg(),block=directive(state,cfg);
      window.__VELOUR_LAST_VERBAL_CHEMISTRY__={at:new Date().toISOString(),version:VERSION,config:cfg,memory:chemistryMemory(),voice:voiceFingerprint(),relationshipPhase:relationshipPhase(),sceneMode:sceneMode(),budget:teaseBudget(state,cfg)};
      return `${raw}\n\n${block}`.trim();
    };
    window.__VELOUR_VERBAL_CHEMISTRY_QA__={version:VERSION,loadCfg,saveCfg,normalizeCfg,extractDialogue,lineShape,classifyTactic,classifyTarget,classifyPattern,chemistryMemory,voiceFingerprint,relationshipPhase,chooseTactics,targetPriority,teaseBudget,directive,stripOldBlocks,renderUI};
    console.info('✦ VELOUR Verbal Chemistry Engine V2.2 loaded');return true;
  }
  if(!install()){let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(timer);},80);}
})();
