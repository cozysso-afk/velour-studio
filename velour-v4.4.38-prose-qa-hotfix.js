'use strict';

/* VELOUR — prose QA + repetition memory hotfix.
   Adds compact recent-prose fingerprints and narrative-quality guidance.
   Does not alter canon progression, safety/provider behavior, or storyline state.
*/
(() => {
  'use strict';
  if (window.__VELOUR_PROSE_QA_HOTFIX__) return;
  window.__VELOUR_PROSE_QA_HOTFIX__ = true;
  window.__VELOUR_PROSE_QA_VERSION__ = '1.0.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR prose QA: buildPrompt not found');
    return;
  }

  const STOP = new Set(['그리고','하지만','그러나','그런데','그래서','그렇게','그대로','그녀는','그녀가','그녀의','그는','그가','그의','나는','내가','너는','네가','우리','다시','조금','아주','이미','아직','그저','마치','순간','이번','지금','그때','했다','있었다','없었다','하는','되는','것처럼','것을','것이']);

  function stripMeta(text){
    return String(text || '').replace(/\n?\[\[VELOUR_V4_META\]\][\s\S]*?\[\[\/VELOUR_V4_META\]\]\s*/g, '').trim();
  }

  function historyTail(max = 18000){
    try { return stripMeta(typeof storyHistory !== 'undefined' ? storyHistory : '').slice(-max); }
    catch (_) { return ''; }
  }

  function sentences(text){
    return String(text || '').replace(/\s+/g,' ').split(/(?<=[.!?。！？])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=12 && x.length<=180);
  }

  function words(text){
    return (String(text || '').toLowerCase().match(/[가-힣a-z0-9]{2,}/g) || []).filter(x => !STOP.has(x));
  }

  function topTerms(text, limit = 10){
    const counts = new Map();
    for (const w of words(text)) counts.set(w, (counts.get(w)||0)+1);
    return [...counts.entries()].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1] || b[0].length-a[0].length).slice(0,limit).map(([w,n])=>`${w}×${n}`);
  }

  function normalizedLead(sentence){
    return words(sentence).slice(0,4).join(' ');
  }

  function repeatedLeads(text, limit = 6){
    const counts = new Map();
    for (const s of sentences(text)) {
      const lead = normalizedLead(s);
      if (lead.length < 5) continue;
      counts.set(lead, (counts.get(lead)||0)+1);
    }
    return [...counts.entries()].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([x,n])=>`${x}×${n}`);
  }

  function paragraphOpeners(text, limit = 6){
    const rows = String(text || '').split(/\n\s*\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
    const counts = new Map();
    for (const p of rows) {
      const key = words(p).slice(0,3).join(' ');
      if (key.length < 4) continue;
      counts.set(key,(counts.get(key)||0)+1);
    }
    return [...counts.entries()].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([x,n])=>`${x}×${n}`);
  }

  function fingerprint(){
    const tail = historyTail();
    return {
      chars: tail.length,
      terms: topTerms(tail),
      sentenceLeads: repeatedLeads(tail),
      paragraphOpeners: paragraphOpeners(tail)
    };
  }

  function directive(){
    const fp = fingerprint();
    const terms = fp.terms.length ? fp.terms.join(' / ') : '뚜렷한 과반복 없음';
    const leads = fp.sentenceLeads.length ? fp.sentenceLeads.join(' / ') : '뚜렷한 반복 없음';
    const paras = fp.paragraphOpeners.length ? fp.paragraphOpeners.join(' / ') : '뚜렷한 반복 없음';
    return `\n===== VELOUR PROSE QA · RECENT-DNA V1 =====\n[최근 본문 반복 기억 — 내부 작가용]\n- 최근 본문 고빈도 어휘 후보: ${terms}. 단순 등장 횟수만 보고 필수 고유명사·호칭을 억지로 바꾸지 말고, 감각어·감탄사·수식어·동작 동사가 습관적으로 반복될 때만 변주한다.\n- 반복 문장 시작 후보: ${leads}.\n- 반복 문단 시작 후보: ${paras}.\n\n[문체 QA — 생성 전에 스스로 점검]\n- 직전 몇 화와 같은 첫 문장 구조, 같은 문단 도입, 같은 감탄→침묵→시선 같은 반응 순서를 자동 기본값으로 재사용하지 않는다. 현재 장면의 원인에 맞는 다른 문장 리듬과 행동 순서를 선택한다.\n- 같은 감정은 같은 신체 반응 하나로만 표시하지 않는다. 대사, 선택, 회피, 거리 변화, 사소한 행동, 침묵의 기능을 상황에 따라 교대한다.\n- 같은 호칭·고유명사는 연속성 때문에 유지할 수 있지만, 호칭 뒤에 붙는 서술 패턴과 대사 태그까지 반복하지 않는다.\n- 설정 설명, 과거 recap, 내부 영어 라벨, 체크리스트/앵커 문구, 작가용 메타 지시가 독자 본문에 노출되지 않았는지 최종 출력 직전에 확인한다.\n- 장면이 바뀔 때는 장소명 선언이나 메타 설명보다 원인이 되는 행동→공간/거리의 변화→그 변화에 대한 인물 반응 순으로 연결한다.\n- 한 장면 안에서 감정·대화·행동이 제자리걸음하면 새 수식어를 추가해 버티지 말고 인물 한 명이 의미 있는 선택을 하게 한다.\n- 최근 본문과 달라 보이기 위해 캐릭터 성격이나 CANON을 바꾸는 것은 금지한다. 다양성은 사실 변경이 아니라 표현·행동 경로·장면 목적에서 만든다.\n===== /VELOUR PROSE QA · RECENT-DNA V1 =====`;
  }

  window.buildPrompt = function(){
    const out = String(previousBuild.apply(this, arguments) || '');
    const block = directive();
    window.__VELOUR_LAST_PROSE_FINGERPRINT__ = Object.assign({ at:new Date().toISOString() }, fingerprint());
    return `${out}\n${block}`.trim();
  };

  window.__VELOUR_PROSE_QA__ = { fingerprint, topTerms, repeatedLeads, paragraphOpeners, directive };
  console.info('✦ VELOUR prose QA + recent-DNA memory loaded');
})();
