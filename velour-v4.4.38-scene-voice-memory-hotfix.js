'use strict';

/* VELOUR — scene DNA + character voice memory.
   Compact continuity-aware prose guidance. No source prose or copyrighted phrases are stored.
*/
(() => {
  'use strict';
  if (window.__VELOUR_SCENE_VOICE_MEMORY_HOTFIX__) return;
  window.__VELOUR_SCENE_VOICE_MEMORY_HOTFIX__ = true;
  window.__VELOUR_SCENE_VOICE_MEMORY_VERSION__ = '1.0.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR scene/voice memory: buildPrompt not found');
    return;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }
  function clean(v,max=110){ return String(v||'').replace(/\s+/g,' ').trim().slice(0,max); }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function uniq(v){ return [...new Set(arr(v).map(x=>clean(x)).filter(Boolean))]; }

  function recentScenes(s,count=5){ return arr(s?.runtime?.scenes).slice(-count); }
  function recentTimeline(s,count=5){ return arr(s?.runtime?.timeline).slice(-count).map(x=>clean(x,150)); }

  function sceneDNA(s){
    const rows = recentScenes(s,5);
    const locations = uniq(rows.map(x=>x?.location)).slice(-4);
    const purposes = uniq(rows.map(x=>x?.purpose || x?.scenePurpose || x?.function)).slice(-4);
    const initiative = uniq(rows.map(x=>x?.initiation || x?.initiative || x?.control)).slice(-4);
    const moods = uniq(rows.map(x=>x?.mood || x?.tone)).slice(-4);
    const endings = uniq(rows.map(x=>x?.ending || x?.endingMode || x?.residue)).slice(-3);
    return { count:rows.length, locations, purposes, initiative, moods, endings, timeline:recentTimeline(s,4) };
  }

  function canonVoiceHints(s){
    const raw = [s?.hardCanon,s?.storyline,s?.periodNote].map(x=>String(x||'')).join('\n');
    const lines = raw.split(/\n+/).map(x=>clean(x,180)).filter(Boolean);
    return lines.filter(line => /말투|말버릇|호칭|존댓말|반말|대사|화법|어투|성격|무뚝뚝|다정|직설|능글|냉정|장난|수다|과묵|존칭|높임/.test(line)).slice(0,8);
  }

  function voiceDirective(s){
    const hints = canonVoiceHints(s);
    const period = /historical|eastern_fantasy|western_fantasy|martial_arts/.test(String(s?.world||''));
    return `\n[CHARACTER VOICE FINGERPRINT — 내부 작가용]\n- 캐릭터의 목소리는 단어 몇 개가 아니라 직접성, 문장 길이, 감정 공개 방식, 질문 습관, 농담/빈정거림, 회피 방식, 호칭과 높임 단계의 조합으로 유지한다.\n- 두 주인공이 같은 사건을 말해도 문장 구조와 반응 순서가 같지 않게 한다. 한쪽의 말투를 다른 쪽에 복사하지 않는다.\n- 감정이 커졌다는 이유로 모든 인물이 똑같이 말이 많아지거나 거칠어지지 않는다. 과묵한 인물은 생략·짧은 질문·행동으로, 직설적인 인물은 선택과 요구를 명료하게, 우회적인 인물은 함의와 반응 지연으로 성격을 보존한다.\n- 최근 대사의 특정 감탄사, 평가어, 질문 골격, 호칭+서술 태그 조합을 그대로 재사용하지 않는다. 의미가 같아도 대사의 기능과 문장 구조를 바꾼다.\n- 친밀도가 변하면 말투의 거리도 서서히 변할 수 있지만, 관계 이정표 없이 갑자기 호칭·존대 단계·성격이 바뀌면 안 된다.\n- ${period ? '시대물에서는 신분·공적/사적 공간·친밀도에 따른 높임과 호칭을 목소리의 일부로 유지한다.' : '현대물에서는 캐릭터 설정에 없는 사극체·번역투·과장된 문어체가 대사에 섞이지 않게 한다.'}\n${hints.length ? `- CANON에서 발견한 음성 힌트(재진술하지 말고 연기에만 사용): ${hints.join(' / ')}` : '- 명시적 말투 CANON이 적으면 기존 본문에서 이미 확립된 말의 길이·직접성·호칭을 우선 보존하고 새 말버릇을 임의로 고정하지 않는다.'}`;
  }

  function sceneDirective(s){
    const d = sceneDNA(s);
    const fmt = a => a.length ? a.join(' / ') : '기록 없음';
    return `\n[RECENT SCENE DNA — 최근 3~5화 반복 방지]\n- 최근 장소: ${fmt(d.locations)}. 직접 이어지는 장면이 아니라면 같은 장소+같은 장면 목적 조합을 자동 기본값으로 재사용하지 않는다.\n- 최근 장면 목적: ${fmt(d.purposes)}. 같은 감정 대화를 반복해야 한다면 이번에는 새로운 정보, 선택, 경계 이동 또는 현실적 결과가 생겨야 한다.\n- 최근 주도 패턴: ${fmt(d.initiative)}. 한 인물만 계속 질문하고 다른 인물만 반응하는 고정 배치를 피하고, 캐릭터 성격 범위 안에서 장면을 움직이는 주체를 교대한다.\n- 최근 분위기: ${fmt(d.moods)} / 최근 종결 방식: ${fmt(d.endings)}. 분위기와 엔딩을 억지로 반대로 만들지는 말되 같은 잔상·침묵·퇴장·전화/메시지 같은 마무리 장치를 연속 기본값으로 쓰지 않는다.\n- 최근 타임라인 요약: ${fmt(d.timeline)}. 이것은 사실 연속성 확인용이며 본문에서 recap 문단으로 다시 설명하지 않는다.\n- 새로움을 위해 CANON을 바꾸지 않는다. 다양성은 장면의 목적, 시작 방식, 주도권, 공간 사용, 대화 기능, 끝에 남는 결과에서 만든다.`;
  }

  function stateMachineDirective(){
    return `\n[SCENE STATE MACHINE — 제자리걸음 방지]\n- 장면은 필요에 따라 진입(entry) → 압력/긴장(pressure) → 선택(choice) → 결과(consequence) → 잔여감(residue) 중 현재 필요한 단계만 밟는다. 짧은 장면에 다섯 단계를 억지로 넣지 않는다.\n- 이어쓰기라면 직전 장면이 이미 압력 단계에 있는데 다시 배경 설명과 감정 정의부터 시작하지 않는다. 현재 단계에서 앞으로 진행한다.\n- 선택은 거창한 사건일 필요가 없다. 질문에 답함/피함, 머무름/떠남, 말함/숨김, 제안/거절처럼 관계 상태를 조금이라도 바꾸는 행동이면 된다.\n- consequence는 선택의 실제 반응이어야 하며, 즉시 모든 갈등을 해결하는 보상으로 쓰지 않는다. residue는 다음 장면에 이어질 감정·정보·현실적 비용 중 하나만 남겨도 충분하다.`;
  }

  function directive(s){ return `${sceneDirective(s)}${voiceDirective(s)}${stateMachineDirective()}`; }

  window.buildPrompt = function(){
    const out = String(previousBuild.apply(this, arguments) || '');
    const s = snapshot();
    const dna = sceneDNA(s);
    window.__VELOUR_LAST_SCENE_DNA__ = Object.assign({at:new Date().toISOString()},dna);
    window.__VELOUR_LAST_VOICE_HINTS__ = canonVoiceHints(s);
    return `${out}\n${directive(s)}`.trim();
  };

  window.__VELOUR_SCENE_VOICE_MEMORY_QA__ = { sceneDNA, canonVoiceHints, sceneDirective, voiceDirective, stateMachineDirective, directive };
  console.info('✦ VELOUR scene DNA + character voice memory loaded');
})();
