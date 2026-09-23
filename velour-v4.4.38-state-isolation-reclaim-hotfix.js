'use strict';

/* VELOUR — keep the isolated episode-branch handler authoritative even if
   a later runtime layer overwrites the public branch function. */
(() => {
  'use strict';
  if (window.__VELOUR_STATE_ISOLATION_RECLAIM_GUARD__) return;
  window.__VELOUR_STATE_ISOLATION_RECLAIM_GUARD__ = true;

  let isolatedBranch = null;

  function captureOrReclaim(){
    const qa = window.__VELOUR_STORAGE_QA__;
    const isolationReady = window.__VELOUR_STATE_ISOLATION_HOTFIX__ && window.__VELOUR_STATE_ISOLATION_QA__;
    if (!isolationReady || !qa) return;

    if (!isolatedBranch) {
      const candidate = qa.branchStoryFromEpisodeIDB || window.branchStoryFromEpisode;
      if (typeof candidate !== 'function') return;
      isolatedBranch = candidate;
    }

    if (window.branchStoryFromEpisode !== isolatedBranch) {
      window.branchStoryFromEpisode = isolatedBranch;
    }
    if (qa.branchStoryFromEpisodeIDB !== isolatedBranch) {
      qa.branchStoryFromEpisodeIDB = isolatedBranch;
    }
  }

  captureOrReclaim();
  window.__VELOUR_STATE_ISOLATION_RECLAIM_TIMER__ = setInterval(captureOrReclaim, 250);

  window.__VELOUR_STATE_ISOLATION_RECLAIM_QA__ = {
    version: '1.0.0',
    guarded: () => Boolean(isolatedBranch),
    reclaimNow: captureOrReclaim,
  };
})();

(() => {
  if (window.__VELOUR_CONTEXTUAL_DIALOGUE_LOADER__) return;
  window.__VELOUR_CONTEXTUAL_DIALOGUE_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-contextual-dialogue-engine.js?v=1';
  script.async = false;
  document.head.appendChild(script);
})();
