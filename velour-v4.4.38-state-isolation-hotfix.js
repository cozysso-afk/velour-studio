'use strict';

/* VELOUR — story identity / branch isolation hotfix.
   Keeps NEW, CONTINUE, and BRANCH storage identities from bleeding into each other.
   Branch history is rebuilt only from per-episode rows belonging to the selected story id.
*/
(() => {
  'use strict';
  if (window.__VELOUR_STATE_ISOLATION_HOTFIX__) return;

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa?.idbGet || !qa?.idbPut || !qa?.idbGetAll || typeof window.generateStory !== 'function') {
    if (!window.__VELOUR_STATE_ISOLATION_RETRY_TIMER__) {
      window.__VELOUR_STATE_ISOLATION_RETRY_TIMER__ = setInterval(() => {
        const ready = window.__VELOUR_STORAGE_QA__?.idbGet && window.__VELOUR_STORAGE_QA__?.idbPut &&
          window.__VELOUR_STORAGE_QA__?.idbGetAll && typeof window.generateStory === 'function';
        if (!ready) return;
        clearInterval(window.__VELOUR_STATE_ISOLATION_RETRY_TIMER__);
        window.__VELOUR_STATE_ISOLATION_RETRY_TIMER__ = null;
        const script = document.createElement('script');
        script.src = './velour-v4.4.38-state-isolation-hotfix.js?v=1&late=1';
        script.async = false;
        (document.head || document.documentElement).appendChild(script);
      }, 80);
    }
    return;
  }

  window.__VELOUR_STATE_ISOLATION_HOTFIX__ = true;
  window.__VELOUR_STATE_ISOLATION_VERSION__ = '1.0.0';

  const STORIES = 'stories';
  const BACKUPS = 'storyBackups';
  const DRAFTS = 'drafts';
  const META_RE = /\n?\[\[VELOUR_V4_META\]\]([\s\S]*?)\[\[\/VELOUR_V4_META\]\]\s*/g;
  const clone = value => JSON.parse(JSON.stringify(value || {}));
  const stripMeta = value => String(value || '').replace(META_RE, '').trim();

  let mode = 'idle';
  let activeStoryId = null;
  let branchInProgress = false;

  function nowISO(){ return new Date().toISOString(); }
  function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : `story-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function cleanStory(item){
    const out = clone(item);
    for (const key of ['currentText', 'storyHistory', 'text']) if (typeof out[key] === 'string') out[key] = stripMeta(out[key]);
    if (Array.isArray(out.episodes)) out.episodes = out.episodes.map(ep => ep && typeof ep === 'object' ? { ...ep, text: stripMeta(ep.text || '') } : ep);
    return out;
  }

  async function stampDraftIdentity(id, title = '', nextMode = mode){
    try {
      const d = await qa.idbGet(DRAFTS, 'current');
      if (!d) return null;
      const next = cleanStory({
        ...d,
        id: 'current',
        activeStoryId: id || null,
        activeStoryTitle: id ? String(title || d.activeStoryTitle || '') : '',
        velourStorageMode: nextMode,
        savedAt: nowISO()
      });
      await qa.idbPut(DRAFTS, next);
      return next;
    } catch (_) { return null; }
  }

  function normalizeRows(item, keep){
    const limit = Math.max(0, Number(keep || 0));
    const rows = (Array.isArray(item?.episodes) ? item.episodes : [])
      .map(ep => ({ episode: Number(ep?.episode || 0), text: stripMeta(ep?.text || '') }))
      .filter(ep => ep.episode > 0 && ep.episode <= limit && ep.text);
    const currentEp = Number(item?.episodeCount || 0);
    const currentText = stripMeta(item?.currentText || '');
    if (currentEp > 0 && currentEp <= limit && currentText && !rows.some(ep => ep.episode === currentEp)) {
      rows.push({ episode: currentEp, text: currentText });
    }
    rows.sort((a, b) => a.episode - b.episode);
    return rows;
  }

  async function isolatedRowsFor(source, keep){
    const candidates = [{ story: source, at: String(source?.updatedAt || source?.savedAt || source?.date || '') }];
    try {
      const backups = await qa.idbGetAll(BACKUPS);
      for (const row of backups || []) {
        if (String(row?.storyId || '') !== String(source.id) || !row?.story) continue;
        candidates.push({ story: row.story, at: String(row?.savedAt || row?.story?.updatedAt || row?.story?.savedAt || row?.story?.date || '') });
      }
    } catch (_) {}
    const sourceRow = candidates.shift();
    candidates.sort((a, b) => b.at.localeCompare(a.at));
    candidates.unshift(sourceRow);

    const byEpisode = new Map();
    for (const candidate of candidates) {
      for (const row of normalizeRows(candidate.story, keep)) {
        if (!byEpisode.has(row.episode)) byEpisode.set(row.episode, row);
      }
    }
    return [...byEpisode.values()].sort((a, b) => a.episode - b.episode);
  }

  function branchStateFrom(sourceState, keep){
    const s = clone(sourceState || {});
    const oldRuntime = s.runtime || {};
    const userFacts = (Array.isArray(oldRuntime.durableFacts) ? oldRuntime.durableFacts : [])
      .map(String)
      .filter(f => {
        if (!f.startsWith('[사용자 확정 지속 상태')) return false;
        const m = f.match(/\bEP\s*0*(\d+)\b/i);
        return m && Number(m[1]) <= keep;
      })
      .slice(-20);

    // Do not inherit unproven timeline/scenes/open threads from the currently open story.
    // The selected story's own episode text is the branch's authoritative continuity source.
    s.runtime = {
      timeline: [],
      openThreads: [],
      scenes: [],
      durableFacts: userFacts,
      arcSummaries: [],
      arcBuffer: [],
      relationshipState: '',
      causalCarry: '',
      lastAdultEpisode: 0,
      retryCount: 0,
      confirmedEpisode: Number(keep || 0),
      positionUsage: {},
      lastSuggestedPositions: [],
      playUsage: {},
      lastSuggestedPlays: [],
      beatTracker: { index: 0, beatKey: '', phase: 'setup', episodes: 0, lastProgress: 0, evidence: [] }
    };
    s.beatIndex = 0;
    return s;
  }

  const originalGenerate = window.generateStory;
  if (typeof originalGenerate === 'function') {
    window.generateStory = async function(isContinue = false){
      const oldDraft = !isContinue ? await qa.idbGet(DRAFTS, 'current').catch(() => null) : null;
      if (!isContinue) {
        mode = 'new';
        activeStoryId = null;
        // Clear stale identity before any downstream autosave wrapper can copy it forward.
        if (oldDraft) await stampDraftIdentity(null, '', 'new');
      }

      let out;
      try {
        out = await originalGenerate.apply(this, arguments);
      } catch (err) {
        if (!isContinue && oldDraft) await qa.idbPut(DRAFTS, oldDraft).catch(() => {});
        throw err;
      }

      const outcome = window.__VELOUR_LAST_GENERATION_OUTCOME__ || {};
      if (!isContinue) {
        if (outcome.status === 'committed') {
          // Core V4 clears its private active id; also clear the persisted draft id so reload cannot revive the old slot.
          await stampDraftIdentity(null, '', 'new');
          mode = 'new';
          activeStoryId = null;
        } else if (oldDraft) {
          await qa.idbPut(DRAFTS, oldDraft).catch(() => {});
          const id = oldDraft?.activeStoryId ? String(oldDraft.activeStoryId) : null;
          activeStoryId = id;
          mode = id ? 'continue' : 'idle';
        }
      } else if (mode === 'idle') {
        const d = await qa.idbGet(DRAFTS, 'current').catch(() => null);
        activeStoryId = d?.activeStoryId ? String(d.activeStoryId) : activeStoryId;
        mode = activeStoryId ? 'continue' : 'idle';
      }
      return out;
    };
  }

  const originalRestore = window.restoreStory;
  if (typeof originalRestore === 'function') {
    window.restoreStory = async function(id){
      const out = await originalRestore.apply(this, arguments);
      const item = await qa.idbGet(STORIES, String(id)).catch(() => null);
      if (item) {
        activeStoryId = String(item.id);
        mode = branchInProgress ? 'branch' : 'continue';
        await stampDraftIdentity(item.id, item.title || '', mode);
      }
      return out;
    };
  }

  const originalRestoreDraft = window.restoreDraftStory;
  if (typeof originalRestoreDraft === 'function') {
    window.restoreDraftStory = async function(){
      const d = await qa.idbGet(DRAFTS, 'current').catch(() => null);
      const out = await originalRestoreDraft.apply(this, arguments);
      if (d?.velourStorageMode === 'new' || !d?.activeStoryId) {
        activeStoryId = null;
        mode = 'new';
        await stampDraftIdentity(null, '', 'new');
      } else {
        activeStoryId = String(d.activeStoryId);
        mode = d.velourStorageMode === 'branch' ? 'branch' : 'continue';
      }
      return out;
    };
  }

  const originalSave = window.saveCurrentStory;
  if (typeof originalSave === 'function') {
    window.saveCurrentStory = async function(){
      if (mode !== 'new') return originalSave.apply(this, arguments);

      await window.__VELOUR_STORAGE_READY__;
      const d = cleanStory(await qa.idbGet(DRAFTS, 'current') || {});
      if (!String(d.currentText || '').trim() && !String(d.storyHistory || '').trim() && !(Array.isArray(d.episodes) && d.episodes.length)) {
        return alert('저장할 스토리가 아직 없어. 먼저 한 화를 생성해줘.');
      }

      const settings = d.settings || {};
      const defaultName = `${String(settings.chars || 'VELOUR Story').slice(0, 28) || 'VELOUR Story'} · ${new Date().toLocaleDateString('ko-KR')}`;
      const entered = prompt('처음 한 번만 작품 제목을 정해줘', defaultName);
      if (entered === null) return null;
      const id = uuid();
      const title = String(entered || '').trim() || defaultName;
      const now = nowISO();
      const item = cleanStory({
        ...d,
        id,
        title,
        createdAt: now,
        updatedAt: now,
        date: new Date().toLocaleString('ko-KR'),
        activeStoryId: id,
        activeStoryTitle: title,
        velourStorageMode: 'continue'
      });
      await qa.idbPut(STORIES, item);
      await qa.idbPut(DRAFTS, cleanStory({ ...d, id: 'current', savedAt: now, activeStoryId: id, activeStoryTitle: title, velourStorageMode: 'continue' }));

      activeStoryId = id;
      mode = 'continue';
      // Synchronize V4's private active-story closure through its own restore path.
      await window.restoreStory?.(id);
      await window.renderStoryLibrary?.();
      alert('💾 새 작품 저장 완료! 이후 저장은 이 작품에 이어 저장돼.');
      return item;
    };
  }

  async function branchStoryFromEpisodeIsolated(id, restartEpisode = null){
    await window.__VELOUR_STORAGE_READY__;
    const source = await qa.idbGet(STORIES, String(id));
    if (!source) return alert('분기할 작품을 찾지 못했어.');

    const allRows = await isolatedRowsFor(source, Number(source.episodeCount || 0));
    const maxEp = Math.max(Number(source.episodeCount || 0), ...allRows.map(ep => Number(ep.episode || 0)), 1);
    let restart = restartEpisode;
    if (restart == null) {
      const raw = prompt(`몇 화부터 다시 쓸까?\n기존 작품은 그대로 보존하고 새 분기를 만들 거야.\n현재 저장본: EP${maxEp}`, '2');
      if (raw === null) return null;
      restart = Number(String(raw).replace(/[^0-9]/g, ''));
    }
    restart = Math.floor(Number(restart || 0));
    if (!Number.isFinite(restart) || restart < 2 || restart > maxEp) return alert(`EP2 ~ EP${maxEp} 사이로 입력해줘.`);

    const keep = restart - 1;
    const keptRows = await isolatedRowsFor(source, keep);
    const target = keptRows.find(ep => ep.episode === keep);
    if (!target) {
      return alert(`EP${keep} 본문을 선택한 작품의 화별 저장본/동일 작품 백업에서 찾지 못했어.\n다른 작품의 누적 history를 대신 섞지 않고 안전하게 중단했어.`);
    }

    if (!confirm(`EP${restart}부터 다시 쓸까?\n\n✅ 원본 “${source.title || 'VELOUR Story'}” EP1~${maxEp} 보존\n✅ 새 분기는 선택한 작품의 EP1~${keep} 화별 본문만 사용\n✅ 다른 작품/현재 열린 작품의 런타임 메모리는 가져오지 않음\n✅ 다음 생성은 EP${restart}`)) return null;

    const history = keptRows.map(ep => stripMeta(ep.text)).filter(Boolean).join('\n\n');
    const last = keptRows.at(-1);
    const branchState = branchStateFrom(source.v4State, keep);
    const newId = uuid();
    const baseTitle = String(source.title || 'VELOUR Story').replace(/\s*·\s*EP\d+\s*재작성.*$/, '');
    const newTitle = `${baseTitle} · EP${restart} 재작성`;
    const now = nowISO();
    const branch = cleanStory({
      ...source,
      id: newId,
      title: newTitle,
      date: new Date().toLocaleString('ko-KR'),
      createdAt: now,
      updatedAt: now,
      episodeCount: keep,
      episodes: keptRows,
      storyHistory: history,
      currentText: last?.text || '',
      v4State: branchState,
      activeStoryId: newId,
      activeStoryTitle: newTitle,
      velourStorageMode: 'branch',
      branchOf: String(source.id),
      branchSourceTitle: source.title || '',
      branchRestartEpisode: restart,
      branchedAt: now,
      branchSnapshotSource: 'episode-rows-only'
    });

    await qa.idbPut(STORIES, branch);
    await qa.idbPut(DRAFTS, cleanStory({
      id: 'current',
      savedAt: now,
      episodeCount: keep,
      episodes: keptRows,
      storyHistory: history,
      currentText: last?.text || '',
      settings: source.settings || {},
      activeStoryId: newId,
      activeStoryTitle: newTitle,
      velourStorageMode: 'branch',
      v4State: branchState
    }));

    branchInProgress = true;
    try { await window.restoreStory?.(newId); }
    finally { branchInProgress = false; }
    activeStoryId = newId;
    mode = 'branch';
    qa.clearPendingRetryEpisode?.();
    qa.rememberConfirmedEpisode?.(keep, true);
    await window.renderStoryLibrary?.();
    alert(`↩️ 새 분기 생성 완료\n\n원본은 그대로 보존했어.\n새 분기: EP1~${keep}\n다음 생성: EP${restart}\n선택한 작품의 화별 본문만 사용했어.`);
    return branch;
  }

  window.branchStoryFromEpisode = branchStoryFromEpisodeIsolated;
  qa.branchStoryFromEpisodeIDB = branchStoryFromEpisodeIsolated;

  function rebindBranchButtons(){
    const list = document.getElementById('velourLibraryList');
    if (!list) return;
    for (const card of list.querySelectorAll('.velour-story-card')) {
      const actions = card.querySelector('.velour-story-actions');
      const btn = actions?.querySelector('[data-episode-branch]');
      if (!btn || btn.dataset.stateIsolationBound === '1') continue;
      const restore = Array.from(actions.querySelectorAll('button')).find(x => /restoreStory\(/.test(x.getAttribute('onclick') || ''));
      const m = String(restore?.getAttribute('onclick') || '').match(/restoreStory\(['\"]([^'\"]+)['\"]\)/);
      if (!m) continue;
      btn.onclick = () => branchStoryFromEpisodeIsolated(m[1]);
      btn.dataset.stateIsolationBound = '1';
    }
  }

  rebindBranchButtons();
  const branchButtonObserver = new MutationObserver(rebindBranchButtons);
  branchButtonObserver.observe(document.body, { subtree: true, childList: true });

  window.__VELOUR_STATE_ISOLATION_QA__ = {
    version: window.__VELOUR_STATE_ISOLATION_VERSION__,
    mode: () => mode,
    activeStoryId: () => activeStoryId,
    isolatedRowsFor,
    branchStateFrom,
    stampDraftIdentity
  };
  console.info('✦ VELOUR story identity / branch isolation loaded');
})();
