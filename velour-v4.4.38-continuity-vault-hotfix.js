'use strict';

/* VELOUR — continuity edge fixes loaded after continuity-hotfix.js */
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__) return;
  window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__ || {};
  const continuity = window.__VELOUR_CONTINUITY_QA__ || {};

  const STOPWORDS = new Set([
    '그리고','그러나','하지만','또한','그런데','이번','다음','현재','이후','이미','계속','정도','관련','상태','설정','캐논','하드','사용자','인물','장면','본문','사실','관계','서사','스토리','에피소드','episode','hard','canon','story'
  ]);
  const clean = (value, max = 280) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function canonLines(raw){
    return String(raw || '')
      .split(/\n+|(?<=[.!?。！？])\s+|\s*[;；]\s*/)
      .map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 40);
  }

  function keywords(raw){
    const words = String(raw || '').toLowerCase().match(/[가-힣a-z0-9_]{2,}/g) || [];
    return new Set(words.filter(w => !STOPWORDS.has(w)));
  }

  function relevanceScore(line, contextKeys){
    const keys = keywords(line);
    let score = 0;
    keys.forEach(k => { if (contextKeys.has(k)) score += k.length >= 4 ? 3 : 2; });
    if (/(?:절대|금지|아님|아니다|없음|없다|반드시|오직|만\s*(?:가능|허용))/.test(line) && score > 0) score += 2;
    return score;
  }

  function selectiveCanon(state, prompt){
    const lines = canonLines(state?.hardCanon || '');
    if (!lines.length) return '';
    const runtime = state?.runtime || {};
    const direction = String(document.getElementById('v33Next')?.value || '');
    const context = [
      direction,
      runtime.causalCarry,
      runtime.relationshipState,
      ...(Array.isArray(runtime.openThreads) ? runtime.openThreads.slice(-4) : []),
      ...(Array.isArray(runtime.timeline) ? runtime.timeline.slice(-4) : []),
      String(prompt || '').slice(-1800)
    ].filter(Boolean).join('\n');
    const contextKeys = keywords(context);
    const ranked = lines
      .map((line, index) => ({ line: clean(line, 260), index, score: relevanceScore(line, contextKeys) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 4)
      .map(x => x.line);

    if (!ranked.length) {
      return '[HARD CANON 원문은 내부 검증 기준으로 유지됨 · 이번 화 직접 관련 항목 없음]';
    }
    return `[이번 화 관련 HARD CANON · 내부 제약]\n${ranked.map(x => `- ${x}`).join('\n')}\n- 위 항목은 사실관계 검증용이다. 현재 장면에 필요하지 않으면 본문에서 설명·복습·언급하지 않는다.`;
  }

  function reduceHardCanonExposure(prompt, state, isContinue){
    if (!isContinue) return String(prompt || '');
    const hard = String(state?.hardCanon || '').trim();
    if (!hard) return String(prompt || '');
    const replacement = selectiveCanon(state, prompt);
    let out = String(prompt || '').split(hard).join(replacement);
    out = out.replace(
      /\[현재 HARD CANON에서 ‘이미 성립한 상태’로 읽어야 할 항목\]\n(?:- [^\n]*\n?)+/g,
      '- HARD CANON의 완료형 상태는 내부 현재값으로만 유지한다. 장면의 직접 원인이 아니면 본문에서 다시 설명하지 않는다.\n'
    );
    out += `\n\n[HARD CANON EXPOSURE FIREWALL]\n- HARD CANON은 모순 방지용 내부 제약이지 매 화 독자에게 보여줄 설정집이 아니다.\n- 캐논 문구가 프롬프트에 보인다는 이유만으로 그 사실을 대사·독백·서술에 넣지 않는다.\n- 이번 화의 사건·선택·감정 변화에 직접 필요한 사실만 자연스럽게 드러낸다. 필요 없는 고정 설정은 완전히 침묵한다.\n- 이미 독자가 아는 외모·직업·가족·과거·관계·세계관을 재소개하지 않는다. 현재 장면에서 새 정보가 아니면 설명문을 만들지 않는다.\n- 연속성은 설정 복창이 아니라 인물의 행동, 익숙한 루틴, 호칭, 거리감, 선택의 결과로 보여준다.`;
    return out.trim();
  }

  // Response Vault buttons call qa.updateMemory() through their lexical handler.
  // Wrap that bridge so a user-authored persistent direction is promoted even
  // when the response is accepted from the vault rather than normal generation.
  const previousUpdateMemory = qa.updateMemory;
  if (typeof previousUpdateMemory === 'function' && !qa.__velourCarryPromotionWrapped) {
    qa.__velourCarryPromotionWrapped = true;
    qa.updateMemory = function(meta, ep, userDirection){
      const out = previousUpdateMemory.apply(this, arguments);
      const n = Number(ep || 0);
      if (userDirection && Number.isFinite(n) && n > 0 && typeof continuity.promoteCommittedDirection === 'function') {
        continuity.promoteCommittedDirection(String(userDirection), Math.floor(n));
      }
      return out;
    };
  }

  // Keep bounded instructions bounded: “3개월간/몇 주 동안” remains active
  // for that stated duration/condition rather than forever.
  const previousBuild = window.buildPrompt;
  if (typeof previousBuild === 'function') {
    window.buildPrompt = function(isContinue = false){
      let out = String(previousBuild.apply(this, arguments) || '');
      const state = snapshot();
      out = out.replace(
        '사용자가 종료·변경하기 전까지 계속 참인 현재 조건으로 취급한다.',
        '사용자가 종료·변경하거나 문장에 명시된 기간·조건이 끝날 때까지 현재 조건으로 취급한다.'
      );

      // Memory exists to preserve the current baseline, not to make the prose
      // repeatedly prove that it remembers prior episodes.
      if (isContinue) {
        out = `${out}\n\n[CONTINUITY USE — 기억은 내부 기준, 본문은 현재 진행]\n- LONGFORM MEMORY, HARD CANON, 과거 아크와 타임라인은 작가용 내부 참고자료다. 기억하고 있다는 사실을 독자에게 증명하려고 매 화 과거를 요약·복습·나열하지 않는다.\n- 기본값은 현재 시점의 장면과 새 진행이다. 사용자 직접 회상/플래시백 요청이나 현재 장면의 핵심 목적이 과거 사건을 다루는 경우가 아니라면, 명시적인 과거 회상·관계사 요약은 본문 전체의 5% 안팎 이하로 제한하고 가능하면 더 적게 쓴다.\n- 직전 화 연결에 과거 언급이 필요해도 장황한 recap 문단을 만들지 않는다. 필요한 사실 1개를 1~2문장 안에서 현재 행동·대사·감정의 원인으로만 연결하고 곧바로 현재 장면으로 돌아온다.\n- 여러 과거 사건을 차례로 열거하거나 “그동안/돌이켜보면/처음부터 지금까지” 식으로 관계사를 다시 설명하지 않는다. 이미 독자가 본 사건은 설명 대상이 아니다.\n- 연속성은 회상문이 아니라 달라진 기본 상태로 보여준다. 익숙한 행동, 이미 형성된 루틴, 호칭과 거리감, 누적된 신뢰·경계·욕망, 이전 선택의 후속 행동처럼 현재 장면에 자연스럽게 스며들게 한다.\n- 과거 사실이 현재 선택에 아무 영향도 주지 않으면 본문에서 언급하지 않아도 된다. 기억에서 삭제하는 것과 본문에서 말하지 않는 것은 다르다.\n- 한 화의 중심은 현재의 사건·상호작용·빌드업·새로운 선택이다. 과거 설명 때문에 현재 CANON 단계의 SETUP→BUILD→PAYOFF나 새 장면 분량을 잠식하지 않는다.`.trim();
      }

      // On a brand-new story, do not pay for the extra continuity semantics block
      // unless HARD CANON actually contains an already-settled state that needs it.
      if (!isContinue && typeof continuity.settledCanonLines === 'function') {
        let settled = [];
        try { settled = continuity.settledCanonLines(state); } catch (_) {}
        if (!settled.length) {
          out = out.replace(/\n\n\[VELOUR CONTINUITY SEMANTICS — RESET 금지\][\s\S]*$/,'').trim();
        }
      }

      out = reduceHardCanonExposure(out, state, isContinue);
      window.__VELOUR_LAST_SELECTIVE_CANON__ = {
        enabled: !!isContinue,
        originalChars: String(state?.hardCanon || '').length,
        injected: isContinue ? selectiveCanon(state, out) : 'full canon on first episode',
        at: new Date().toISOString()
      };
      return out;
    };
  }

  window.__VELOUR_SELECTIVE_CANON_QA__ = {
    canonLines,
    keywords,
    relevanceScore,
    selectiveCanon,
    reduceHardCanonExposure
  };

  window.__VELOUR_CONTINUITY_COST_VERSION__ = '1.1.0';
  console.info('✦ VELOUR selective HARD CANON + continuity edge fix loaded');
})();