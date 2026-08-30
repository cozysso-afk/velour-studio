'use strict';

/* VELOUR — continuity edge fixes loaded after continuity-hotfix.js */
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__) return;
  window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__ || {};
  const continuity = window.__VELOUR_CONTINUITY_QA__ || {};

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
        try { settled = continuity.settledCanonLines(window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}); } catch (_) {}
        if (!settled.length) {
          out = out.replace(/\n\n\[VELOUR CONTINUITY SEMANTICS — RESET 금지\][\s\S]*$/,'').trim();
        }
      }
      return out;
    };
  }

  window.__VELOUR_CONTINUITY_COST_VERSION__ = '1.0.2';
  console.info('✦ VELOUR continuity vault edge fix loaded');
})();
