'use strict';

/* VELOUR — narrow Korean relationship-transition grammar repair.
   Covers conjugated forms such as "연인이 된다" that the base guard's
   stem-oriented matcher can miss, without promoting one-off scene directions. */
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__) return;

  const RELATION_FORM = /연인(?:이|으로)?\s*(?:된다|됐다|되었다|되어|되는|될|된)(?:\b|\s|[.!?。！？,，]|$)/i;
  const PREFIX = '[사용자 확정 지속 상태';

  function install(){
    if (window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__) return true;
    const guardQa = window.__VELOUR_CONTINUITY_VOICE_GUARD_QA__;
    const storageQa = window.__VELOUR_STORAGE_QA__;
    if (!guardQa?.normalizeTransition || !storageQa || typeof window.generateStory !== 'function') return false;

    window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__ = true;

    function promoteIfMissed(direction, ep){
      const raw = String(direction || '').trim();
      if (!raw || !RELATION_FORM.test(raw)) return [];

      let state;
      try { state = window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
      catch (_) { return []; }
      state.runtime = Object.assign({}, state.runtime || {});
      let facts = Array.isArray(state.runtime.durableFacts) ? state.runtime.durableFacts.map(String).filter(Boolean) : [];

      const candidates = raw.split(/\n+|(?<=[.!?。！？])\s+|\s*[;；]\s*/).map(x => x.trim()).filter(x => RELATION_FORM.test(x));
      const added = [];
      for (const clause of candidates) {
        if (window.__VELOUR_CONTINUITY_QA__?.hasPendingCondition?.(clause)) continue;
        const fact = guardQa.normalizeTransition(clause, ep);
        const key = String(fact).replace(/\s+/g, ' ').trim();
        if (facts.some(existing => String(existing).replace(/\s+/g, ' ').trim() === key)) continue;
        // Do not delete other character pairs based on a relationship keyword.
        facts.push(fact);
        added.push(fact);
      }
      if (!added.length) return [];

      const userFacts = facts.filter(f => String(f).startsWith(PREFIX)).slice(-20);
      const otherFacts = facts.filter(f => !String(f).startsWith(PREFIX)).slice(-20);
      state.runtime.durableFacts = [...otherFacts, ...userFacts].slice(-32);
      try { window.__VELOUR_V4_STATE_RESTORE__?.(state); }
      catch (_) { return []; }
      try { Promise.resolve(window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(state)).catch(() => {}); } catch (_) {}
      window.__VELOUR_LAST_DURABLE_TRANSITION_PROMOTION__ = { episode:Number(ep), added:[...added], at:new Date().toISOString(), grammar_hotfix:true };
      return added;
    }

    const previousGenerate = window.generateStory;
    window.generateStory = async function(isContinue = false){
      const direction = isContinue ? String(document.getElementById('v33Next')?.value || '').trim() : '';
      const before = Number(storageQa.confirmedEpisode?.() || window.__VELOUR_V4_STATE_SNAPSHOT__?.()?.runtime?.confirmedEpisode || 0);
      const out = await previousGenerate.apply(this, arguments);
      const outcome = window.__VELOUR_LAST_GENERATION_OUTCOME__ || {};
      const after = Number(storageQa.confirmedEpisode?.() || window.__VELOUR_V4_STATE_SNAPSHOT__?.()?.runtime?.confirmedEpisode || 0);
      const ep = Math.floor(Number(outcome.episode || outcome.attemptedEpisode || after || 0));
      if (isContinue && direction && outcome.status === 'committed' && ep > before) promoteIfMissed(direction, ep);
      return out;
    };

    window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_QA__ = { version:'1.0.0', matches:value => RELATION_FORM.test(String(value || '')), promoteIfMissed };
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 300) clearInterval(timer);
  }, 80);
})();
