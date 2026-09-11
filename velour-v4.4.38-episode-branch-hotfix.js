'use strict';

/* VELOUR — restore "specific episode" branching removed after V4.4.35.
   V2.1: keep NEW-story save identity isolated from the previously restored slot,
   tolerate legacy/migrated stories whose per-episode rows are incomplete,
   and add paid-tier Gemini cost estimates beside token usage. */
(() => {
  'use strict';
  if (window.__VELOUR_EPISODE_BRANCH_HOTFIX__) return;
  window.__VELOUR_EPISODE_BRANCH_HOTFIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa?.idbGet || !qa?.idbPut || !qa?.idbGetAll) {
    console.error('VELOUR episode branch: storage bridge not found');
    return;
  }

  const STORIES = 'stories';
  const BACKUPS = 'storyBackups';
  const DRAFTS = 'drafts';
  const MAX_SCENES = 12;
  const ARC_WINDOW = 6;
  const MAX_ARC_SUMMARIES = 12;
  const META_RE = /\n?\[\[VELOUR_V4_META\]\]([\s\S]*?)\[\[\/VELOUR_V4_META\]\]\s*/g;
  const clone = v => JSON.parse(JSON.stringify(v || {}));
  const stripMeta = v => String(v || '').replace(META_RE, '').trim();

  function parseTimelineEpisode(line, fallback = 0) {
    const m = String(line || '').match(/\bEP\s*0*(\d+)\s*:/i);
    return m ? Number(m[1]) : Number(fallback || 0);
  }

  function episodeRowsThrough(item, keepThrough) {
    const keep = Number(keepThrough || 0);
    const rows = (Array.isArray(item?.episodes) ? item.episodes : [])
      .filter(ep => Number(ep?.episode || 0) > 0 && Number(ep.episode) <= keep)
      .map(ep => ({ episode: Number(ep.episode), text: stripMeta(ep.text || '') }))
      .filter(ep => ep.text.trim());

    const currentEp = Number(item?.episodeCount || 0);
    const currentText = stripMeta(item?.currentText || '');
    if (currentEp > 0 && currentEp <= keep && currentText && !rows.some(ep => ep.episode === currentEp)) {
      rows.push({ episode: currentEp, text: currentText });
    }

    return rows.sort((a, b) => a.episode - b.episode);
  }

  function mergeEpisodeRows(candidates, keepThrough) {
    const byEpisode = new Map();
    for (const item of candidates || []) {
      for (const row of episodeRowsThrough(item, keepThrough)) {
        if (!byEpisode.has(row.episode)) byEpisode.set(row.episode, row);
      }
    }
    return [...byEpisode.values()].sort((a, b) => a.episode - b.episode);
  }

  function historyFromEpisodeRows(rows) {
    return (rows || []).map(ep => stripMeta(ep?.text || '').trim()).filter(Boolean).join('\n\n');
  }

  function defaultRuntime() {
    return {
      timeline: [], openThreads: [], scenes: [], durableFacts: [], arcSummaries: [], arcBuffer: [],
      relationshipState: '', causalCarry: '', lastAdultEpisode: 0, retryCount: 0,
      positionUsage: {}, lastSuggestedPositions: [], playUsage: {}, lastSuggestedPlays: [],
      beatTracker: { index: 0, beatKey: '', phase: 'setup', episodes: 0, lastProgress: 0, evidence: [] }
    };
  }

  function derivedBranchRuntimeSnapshot(snapshot, keepThrough) {
    const s = clone(snapshot || window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {});
    s.runtime = Object.assign(defaultRuntime(), s.runtime || {});
    const keep = Math.max(0, Number(keepThrough || 0));
    s.runtime.timeline = (Array.isArray(s.runtime.timeline) ? s.runtime.timeline : []).filter(line => {
      const n = parseTimelineEpisode(line, 0);
      return n > 0 && n <= keep;
    });
    s.runtime.scenes = (Array.isArray(s.runtime.scenes) ? s.runtime.scenes : [])
      .filter(x => Number(x?.episode || 0) > 0 && Number(x.episode) <= keep).slice(-MAX_SCENES);
    s.runtime.arcBuffer = (Array.isArray(s.runtime.arcBuffer) ? s.runtime.arcBuffer : [])
      .filter(x => Number(x?.episode || 0) > 0 && Number(x.episode) <= keep).slice(-ARC_WINDOW);
    s.runtime.arcSummaries = (Array.isArray(s.runtime.arcSummaries) ? s.runtime.arcSummaries : [])
      .filter(x => Number(x?.endEpisode || 0) > 0 && Number(x.endEpisode) <= keep).slice(-MAX_ARC_SUMMARIES);
    s.runtime.durableFacts = [];
    s.runtime.openThreads = [];
    s.runtime.relationshipState = [...s.runtime.arcBuffer].reverse()
      .map(x => String(x?.relationshipState || '').trim()).find(Boolean) || '';
    s.runtime.causalCarry = '';
    s.runtime.retryCount = 0;
    s.runtime.lastSuggestedPositions = [];
    s.runtime.lastSuggestedPlays = [];
    s.runtime.positionUsage = {};
    s.runtime.playUsage = {};
    s.runtime.lastAdultEpisode = 0;
    for (const scene of s.runtime.scenes) {
      if (scene?.adultScene) s.runtime.lastAdultEpisode = Math.max(s.runtime.lastAdultEpisode, Number(scene.episode || 0));
      const pid = String(scene?.positionId || '').trim();
      if (scene?.adultScene && pid) s.runtime.positionUsage[pid] = Number(s.runtime.positionUsage[pid] || 0) + 1;
      for (const playId of (Array.isArray(scene?.playIds) ? scene.playIds : [])) {
        if (scene?.adultScene && playId) s.runtime.playUsage[playId] = Number(s.runtime.playUsage[playId] || 0) + 1;
      }
    }
    s.runtime.confirmedEpisode = keep;
    s.beatIndex = 0;
    s.runtime.beatTracker = Object.assign(defaultRuntime().beatTracker, {
      index: 0, phase: 'setup', episodes: 0, lastProgress: 0, evidence: []
    });
    return s;
  }

  async function branchCandidatesFor(story) {
    const rows = [];
    try {
      const backups = await qa.idbGetAll(BACKUPS);
      for (const row of backups || []) {
        if (String(row?.storyId || '') === String(story.id) && row?.story) {
          rows.push({ story: row.story, at: String(row?.savedAt || row?.story?.updatedAt || row?.story?.savedAt || row?.story?.date || '') });
        }
      }
    } catch (_) {}
    rows.sort((a, b) => b.at.localeCompare(a.at));
    return [story, ...rows.map(x => x.story)];
  }

  async function exactBranchSnapshotFor(story, keepThrough, candidates = null) {
    const keep = Number(keepThrough || 0);
    const pool = Array.isArray(candidates) && candidates.length ? candidates : await branchCandidatesFor(story);
    const exact = pool.filter(x => Number(x?.episodeCount || 0) === keep && episodeRowsThrough(x, keep).some(ep => ep.episode === keep));
    exact.sort((a, b) => String(b?.updatedAt || b?.savedAt || b?.date || '').localeCompare(String(a?.updatedAt || a?.savedAt || a?.date || '')));
    return exact[0] || null;
  }

  function cleanStoryObject(item) {
    const out = clone(item);
    for (const key of ['currentText', 'storyHistory', 'text']) if (typeof out[key] === 'string') out[key] = stripMeta(out[key]);
    if (Array.isArray(out.episodes)) out.episodes = out.episodes.map(ep => ep && typeof ep === 'object' ? Object.assign({}, ep, { text: stripMeta(ep.text || '') }) : ep);
    return out;
  }

  /* Storage identity edge: a successful NEW generation must never keep the
     previously restored story slot, even if a downstream draft wrapper sees
     the old ID while generation is in flight. This lives in the existing
     storage/branch owner rather than another runtime hotfix file. */
  let saveMode = 'idle';
  let modeStoryId = null;
  const freshStoryId = () => crypto.randomUUID ? crypto.randomUUID() : `story-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  async function stampDraftIdentity(id, title = '', mode = saveMode) {
    try {
      const draft = await qa.idbGet(DRAFTS, 'current');
      if (!draft) return null;
      const next = cleanStoryObject({
        ...draft,
        id: 'current',
        activeStoryId: id || null,
        activeStoryTitle: id ? String(title || draft.activeStoryTitle || '') : '',
        velourStorageMode: mode,
        savedAt: new Date().toISOString()
      });
      await qa.idbPut(DRAFTS, next);
      return next;
    } catch (_) { return null; }
  }

  const originalGenerateForIdentity = window.generateStory;
  if (typeof originalGenerateForIdentity === 'function') {
    window.generateStory = async function(isContinue = false) {
      const oldDraft = !isContinue ? await qa.idbGet(DRAFTS, 'current').catch(() => null) : null;
      if (!isContinue) {
        saveMode = 'new';
        modeStoryId = null;
        if (oldDraft) await stampDraftIdentity(null, '', 'new');
      }

      let out;
      try {
        out = await originalGenerateForIdentity.apply(this, arguments);
      } catch (err) {
        if (!isContinue && oldDraft) await qa.idbPut(DRAFTS, oldDraft).catch(() => {});
        if (!isContinue) {
          modeStoryId = oldDraft?.activeStoryId ? String(oldDraft.activeStoryId) : null;
          saveMode = modeStoryId ? 'continue' : 'idle';
        }
        throw err;
      }

      const outcome = window.__VELOUR_LAST_GENERATION_OUTCOME__ || {};
      if (!isContinue) {
        if (outcome.status === 'committed') {
          await stampDraftIdentity(null, '', 'new');
          saveMode = 'new';
          modeStoryId = null;
        } else {
          if (oldDraft) await qa.idbPut(DRAFTS, oldDraft).catch(() => {});
          modeStoryId = oldDraft?.activeStoryId ? String(oldDraft.activeStoryId) : null;
          saveMode = modeStoryId ? 'continue' : 'idle';
        }
      } else if (saveMode === 'idle') {
        const draft = await qa.idbGet(DRAFTS, 'current').catch(() => null);
        modeStoryId = draft?.activeStoryId ? String(draft.activeStoryId) : null;
        saveMode = modeStoryId ? 'continue' : 'idle';
      }
      return out;
    };
  }

  const originalRestoreForIdentity = window.restoreStory;
  if (typeof originalRestoreForIdentity === 'function') {
    window.restoreStory = async function(id) {
      const out = await originalRestoreForIdentity.apply(this, arguments);
      const item = await qa.idbGet(STORIES, String(id)).catch(() => null);
      if (item) {
        modeStoryId = String(item.id);
        saveMode = 'continue';
        await stampDraftIdentity(item.id, item.title || '', 'continue');
      }
      return out;
    };
  }

  const originalRestoreDraftForIdentity = window.restoreDraftStory;
  if (typeof originalRestoreDraftForIdentity === 'function') {
    window.restoreDraftStory = async function() {
      const before = await qa.idbGet(DRAFTS, 'current').catch(() => null);
      const out = await originalRestoreDraftForIdentity.apply(this, arguments);
      if (before?.velourStorageMode === 'new' || !before?.activeStoryId) {
        modeStoryId = null;
        saveMode = 'new';
        await stampDraftIdentity(null, '', 'new');
      } else {
        modeStoryId = String(before.activeStoryId);
        saveMode = 'continue';
      }
      return out;
    };
  }

  const originalSaveForIdentity = window.saveCurrentStory;
  if (typeof originalSaveForIdentity === 'function') {
    window.saveCurrentStory = async function() {
      if (saveMode !== 'new') return originalSaveForIdentity.apply(this, arguments);

      await window.__VELOUR_STORAGE_READY__;
      const draft = cleanStoryObject(await qa.idbGet(DRAFTS, 'current') || {});
      if (!String(draft.currentText || '').trim() && !String(draft.storyHistory || '').trim() && !(Array.isArray(draft.episodes) && draft.episodes.length)) {
        return alert('저장할 스토리가 아직 없어. 먼저 한 화를 생성해줘.');
      }

      const settings = draft.settings || {};
      const defaultName = `${String(settings.chars || 'VELOUR Story').slice(0, 28) || 'VELOUR Story'} · ${new Date().toLocaleDateString('ko-KR')}`;
      const entered = prompt('처음 한 번만 작품 제목을 정해줘', defaultName);
      if (entered === null) return null;
      const id = freshStoryId();
      const title = String(entered || '').trim() || defaultName;
      const now = new Date().toISOString();
      const item = cleanStoryObject({
        ...draft,
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
      await qa.idbPut(DRAFTS, cleanStoryObject({
        ...draft,
        id: 'current',
        savedAt: now,
        activeStoryId: id,
        activeStoryTitle: title,
        velourStorageMode: 'continue'
      }));

      modeStoryId = id;
      saveMode = 'continue';
      // Synchronize V4's private active-story closure through its own restore path.
      await window.restoreStory?.(id);
      await window.renderStoryLibrary?.();
      alert('💾 새 작품으로 저장했어. 이후 저장은 이 작품에 이어 저장돼.');
      return item;
    };
  }

  async function branchStoryFromEpisodeIDB(id, restartEpisode = null) {
    try {
      await window.__VELOUR_STORAGE_READY__;
      const source = await qa.idbGet(STORIES, String(id));
      if (!source) return alert('분기할 작품을 찾지 못했어.');
      const rowsAll = (Array.isArray(source.episodes) ? source.episodes : [])
        .filter(ep => Number(ep?.episode || 0) > 0).sort((a, b) => Number(a.episode) - Number(b.episode));
      const maxEp = Math.max(Number(source.episodeCount || 0), ...rowsAll.map(ep => Number(ep.episode || 0)), 1);
      let restart = restartEpisode;
      if (restart == null) {
        const raw = prompt(`몇 화부터 다시 쓸까?\n기존 작품은 그대로 보존하고 새 분기를 만들 거야.\n현재 저장본: EP${maxEp}`, '2');
        if (raw === null) return;
        restart = Number(String(raw).replace(/[^0-9]/g, ''));
      }
      restart = Math.floor(Number(restart || 0));
      if (!Number.isFinite(restart) || restart < 2 || restart > maxEp) return alert(`EP2 ~ EP${maxEp} 사이로 입력해줘.`);
      const keep = restart - 1;
      if (!confirm(`EP${restart}부터 다시 쓸까?\n\n✅ 기존 “${source.title || 'VELOUR Story'}” EP1~${maxEp} 저장본은 그대로 보존\n✅ 새 분기는 EP1~${keep}까지만 가진 상태로 생성\n✅ 다음 생성은 EP${restart}\n\n원본을 덮어쓰지 않아.`)) return;

      const candidates = await branchCandidatesFor(source);
      const exact = await exactBranchSnapshotFor(source, keep, candidates);
      const keptRows = mergeEpisodeRows(candidates, keep);
      if (!keptRows.some(ep => ep.episode === keep)) {
        return alert(`EP${keep} 본문을 현재 저장본·롤링백업·레거시백업에서 찾지 못해서 안전 분기를 만들지 않았어.\n\n이 경우는 실제로 해당 화 본문 스냅샷이 남아 있지 않은 저장본이야.`);
      }

      const exactRows = exact ? episodeRowsThrough(exact, keep) : [];
      const exactHasTarget = exactRows.some(ep => ep.episode === keep);
      const history = exact && exactHasTarget && String(exact.storyHistory || '').trim()
        ? stripMeta(exact.storyHistory)
        : historyFromEpisodeRows(keptRows);
      const last = keptRows.filter(ep => ep.episode <= keep).at(-1);
      let branchState = exact?.v4State ? clone(exact.v4State) : derivedBranchRuntimeSnapshot(source.v4State || window.__VELOUR_V4_STATE_SNAPSHOT__?.(), keep);
      branchState.runtime = Object.assign(defaultRuntime(), branchState.runtime || {});
      branchState.runtime.confirmedEpisode = keep;
      branchState.runtime.retryCount = 0;

      const newId = crypto.randomUUID ? crypto.randomUUID() : `branch-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const baseTitle = String(source.title || 'VELOUR Story').replace(/\s*·\s*EP\d+\s*재작성.*$/, '');
      const newTitle = `${baseTitle} · EP${restart} 재작성`;
      const now = new Date().toISOString();
      const branch = cleanStoryObject({
        ...source,
        id: newId,
        title: newTitle,
        date: new Date().toLocaleString('ko-KR'),
        createdAt: now,
        updatedAt: now,
        episodeCount: keep,
        episodes: keptRows.filter(ep => ep.episode <= keep),
        storyHistory: history,
        currentText: last?.text || '',
        v4State: branchState,
        activeStoryId: newId,
        activeStoryTitle: newTitle,
        branchOf: String(source.id),
        branchSourceTitle: source.title || '',
        branchRestartEpisode: restart,
        branchedAt: now,
        branchSnapshotSource: exact ? 'rolling/exact' : 'merged-safe'
      });
      await qa.idbPut(STORIES, branch);
      await qa.idbPut(DRAFTS, cleanStoryObject({
        id: 'current', savedAt: now, episodeCount: keep, episodes: branch.episodes,
        storyHistory: history, currentText: last?.text || '', settings: source.settings || {},
        activeStoryId: newId, activeStoryTitle: newTitle, v4State: branchState
      }));
      window.__VELOUR_V4_STATE_RESTORE__?.(branchState);
      qa.clearPendingRetryEpisode?.();
      qa.rememberConfirmedEpisode?.(keep, true);
      await window.restoreStory?.(newId);
      await window.renderStoryLibrary?.();
      alert(`↩️ 새 분기 생성 완료\n\n원본: EP1~${maxEp} 그대로 보존\n새 분기: EP1~${keep}\n다음 생성: EP${restart}\n${exact ? `EP${keep} 시점 저장 스냅샷을 사용했어.` : '현재본+백업의 화별 본문을 합쳐 미래 메모리를 제거한 안전 상태로 만들었어.'}`);
      return branch;
    } catch (e) {
      console.error('VELOUR branch failed', e);
      alert('분기 생성 실패: ' + String(e?.message || e));
      return null;
    }
  }

  function installButtons() {
    const list = document.getElementById('velourLibraryList');
    if (!list) return;
    for (const card of list.querySelectorAll('.velour-story-card')) {
      const actions = card.querySelector('.velour-story-actions');
      if (!actions || actions.querySelector('[data-episode-branch]')) continue;
      const restore = Array.from(actions.querySelectorAll('button')).find(btn => /restoreStory\(/.test(btn.getAttribute('onclick') || ''));
      const m = String(restore?.getAttribute('onclick') || '').match(/restoreStory\(['\"]([^'\"]+)['\"]\)/);
      if (!m) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.episodeBranch = '1';
      btn.textContent = '↩ 특정 화부터';
      btn.onclick = () => branchStoryFromEpisodeIDB(m[1]);
      restore.insertAdjacentElement('afterend', btn);
    }
  }

  const originalRender = window.renderStoryLibrary;
  if (typeof originalRender === 'function') {
    window.renderStoryLibrary = async function() {
      const out = await originalRender.apply(this, arguments);
      installButtons();
      return out;
    };
  }
  const observer = new MutationObserver(installButtons);
  observer.observe(document.body, { subtree: true, childList: true });

  window.branchStoryFromEpisode = branchStoryFromEpisodeIDB;
  window.__VELOUR_STORAGE_QA__.branchStoryFromEpisodeIDB = branchStoryFromEpisodeIDB;
  window.__VELOUR_STORAGE_QA__.derivedBranchRuntimeSnapshot = derivedBranchRuntimeSnapshot;
  window.__VELOUR_STORAGE_QA__.mergeBranchEpisodeRows = mergeEpisodeRows;
  window.__VELOUR_STORAGE_QA__.storySaveMode = () => ({ mode: saveMode, activeStoryId: modeStoryId });
  installButtons();
  console.info('✦ VELOUR specific-episode branch restored v2.1 · new-story identity isolated');
})();

(() => {
  'use strict';
  if (window.__VELOUR_USAGE_COST_HOTFIX__) return;
  window.__VELOUR_USAGE_COST_HOTFIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa?.responseVaultAll) return;
  const USAGE_STORE = 'usage';

  const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const sameLocalDay = iso => {
    if (!iso) return false;
    const d = new Date(iso), now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  function pricingFor(model, usage) {
    const id = String(model || '').trim();
    const prompt = n(usage?.promptTokenCount);
    if (id === 'gemini-3.7-flash' || id === 'gemini-3.6-flash') {
      const promo = new Date() < new Date('2027-01-01T00:00:00');
      return promo
        ? { input: 0.75, output: 3.75, cache: 0.075, label: '유료 Standard' }
        : { input: 1.50, output: 7.50, cache: 0.15, label: '유료 Standard' };
    }
    if (id === 'gemini-3.1-pro-preview') {
      const high = prompt > 200000;
      return high
        ? { input: 4.00, output: 18.00, cache: 0.40, label: '유료 Standard · >200k' }
        : { input: 2.00, output: 12.00, cache: 0.20, label: '유료 Standard · ≤200k' };
    }
    return null;
  }

  function estimateUSD(usage, model) {
    const u = usage || {};
    const rates = pricingFor(model, u);
    if (!rates) return null;
    const prompt = Math.max(0, n(u.promptTokenCount));
    const cached = Math.min(prompt, Math.max(0, n(u.cachedContentTokenCount)));
    const regularInput = Math.max(0, prompt - cached);
    const output = Math.max(0, n(u.candidatesTokenCount)) + Math.max(0, n(u.thoughtsTokenCount));
    const usd = (regularInput * rates.input + cached * rates.cache + output * rates.output) / 1000000;
    return { usd, rates, prompt, cached, output };
  }

  function usdText(value) {
    if (!Number.isFinite(value)) return '-';
    if (value === 0) return '$0';
    if (value < 0.0001) return '<$0.0001';
    if (value < 0.01) return '$' + value.toFixed(4);
    if (value < 1) return '$' + value.toFixed(3);
    return '$' + value.toFixed(2);
  }

  async function costSnapshot() {
    let rows = [];
    try { rows = await qa.responseVaultAll(USAGE_STORE); } catch (_) { return null; }
    rows = (rows || []).filter(Boolean).sort((a, b) => String(b?.at || '').localeCompare(String(a?.at || '')));
    const latest = rows[0] || null;
    let todayUSD = 0, pricedToday = 0, unpricedToday = 0;
    for (const row of rows) {
      if (!sameLocalDay(row?.at)) continue;
      const c = estimateUSD(row?.usage || {}, row?.model || '');
      if (c) { todayUSD += c.usd; pricedToday++; }
      else unpricedToday++;
    }
    return { latest, latestCost: latest ? estimateUSD(latest.usage || {}, latest.model || '') : null, todayUSD, pricedToday, unpricedToday };
  }

  let costRenderBusy = false;
  async function renderUsageCost() {
    if (costRenderBusy) return;
    const el = document.getElementById('velourUsageSummaryText');
    if (!el) return;
    const base = String(el.textContent || '').replace(/\n?예상 비용 ·[^\n]*/g, '').trim();
    if (!base) return;
    costRenderBusy = true;
    try {
      const snap = await costSnapshot();
      if (!snap) return;
      let line = '';
      if (snap.latestCost && /^이번 API\s*·/.test(base)) {
        line = `예상 비용 · 이번 ${usdText(snap.latestCost.usd)} · 오늘 ${usdText(snap.todayUSD)} (${snap.latestCost.rates.label} 기준)`;
      } else if (snap.pricedToday > 0) {
        line = `예상 비용 · 오늘 ${usdText(snap.todayUSD)} (유료 Standard 기준)`;
      }
      if (line && snap.unpricedToday > 0) line += ` · 가격표 미등록 ${snap.unpricedToday}회 제외`;
      const next = line ? `${base}\n${line}` : base;
      if (el.textContent !== next) el.textContent = next;
    } finally {
      costRenderBusy = false;
    }
  }

  let timer = 0;
  const scheduleCostRender = () => {
    clearTimeout(timer);
    timer = setTimeout(renderUsageCost, 40);
  };
  const observer = new MutationObserver(mutations => {
    if (costRenderBusy) return;
    const touched = mutations.some(m => {
      const target = m.target?.nodeType === 3 ? m.target.parentElement : m.target;
      if (target?.id === 'velourUsageSummaryText' || target?.closest?.('#velourUsageSummary')) return true;
      return Array.from(m.addedNodes || []).some(node => node?.id === 'velourUsageSummary' || node?.id === 'velourUsageSummaryText' || node?.querySelector?.('#velourUsageSummaryText'));
    });
    if (touched) scheduleCostRender();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });

  const oldShowVault = window.showVelourResponseVault;
  if (typeof oldShowVault === 'function') {
    window.showVelourResponseVault = async function() {
      const out = await oldShowVault.apply(this, arguments);
      try {
        const rows = (await qa.responseVaultAll('responses') || []).sort((a, b) => String(b?.receivedAt || '').localeCompare(String(a?.receivedAt || '')));
        const cards = Array.from(document.querySelectorAll('#velourVaultList > div'));
        rows.forEach((r, i) => {
          const card = cards[i];
          if (!card || card.querySelector('[data-velour-cost]')) return;
          const meta = card.children?.[1];
          const cost = estimateUSD(r?.usage || {}, r?.model || '');
          if (!meta || !cost) return;
          const span = document.createElement('span');
          span.dataset.velourCost = '1';
          span.textContent = ` · 예상 ${usdText(cost.usd)}`;
          meta.appendChild(span);
        });
      } catch (_) {}
      return out;
    };
  }

  window.__VELOUR_ESTIMATE_GEMINI_COST__ = estimateUSD;
  qa.estimateGeminiCostUSD = estimateUSD;
  scheduleCostRender();
  console.info('✦ VELOUR token cost estimator loaded');
})();