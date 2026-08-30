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

  window.__VELOUR_CONTINUITY_COST_VERSION__ = '1.0.1';
  console.info('✦ VELOUR continuity vault edge fix loaded');
})();
