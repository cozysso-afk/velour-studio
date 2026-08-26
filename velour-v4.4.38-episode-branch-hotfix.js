'use strict';

/* VELOUR — restore "specific episode" branching removed after V4.4.35. */
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
    return (Array.isArray(item?.episodes) ? item.episodes : [])
      .filter(ep => Number(ep?.episode || 0) > 0 && Number(ep.episode) <= Number(keepThrough))
      .map(ep => ({ episode: Number(ep.episode), text: stripMeta(ep.text || '') }))
      .filter(ep => ep.text.trim())
      .sort((a, b) => a.episode - b.episode);
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

  async function exactBranchSnapshotFor(story, keepThrough) {
    const keep = Number(keepThrough || 0);
    const candidates = [story];
    try {
      const backups = await qa.idbGetAll(BACKUPS);
      for (const row of backups || []) {
        if (String(row?.storyId || '') === String(story.id) && row?.story) candidates.push(row.story);
      }
    } catch (_) {}
    const exact = candidates.filter(x => Number(x?.episodeCount || 0) === keep && episodeRowsThrough(x, keep).some(ep => ep.episode === keep));
    exact.sort((a, b) => String(b?.updatedAt || b?.savedAt || b?.date || '').localeCompare(String(a?.updatedAt || a?.savedAt || a?.date || '')));
    return exact[0] || null;
  }

  function cleanStoryObject(item) {
    const out = clone(item);
    for (const key of ['currentText', 'storyHistory', 'text']) if (typeof out[key] === 'string') out[key] = stripMeta(out[key]);
    if (Array.isArray(out.episodes)) out.episodes = out.episodes.map(ep => ep && typeof ep === 'object' ? Object.assign({}, ep, { text: stripMeta(ep.text || '') }) : ep);
    return out;
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

      const exact = await exactBranchSnapshotFor(source, keep);
      let keptRows = episodeRowsThrough(exact || source, keep);
      if (!keptRows.some(ep => ep.episode === keep)) keptRows = episodeRowsThrough(source, keep);
      if (!keptRows.some(ep => ep.episode === keep)) return alert(`EP${keep} 본문을 저장본/롤링백업에서 찾지 못해서 안전 분기를 만들지 않았어.`);

      const history = exact && String(exact.storyHistory || '').trim() ? stripMeta(exact.storyHistory) : historyFromEpisodeRows(keptRows);
      const last = keptRows.at(-1);
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
        episodes: keptRows,
        storyHistory: history,
        currentText: last?.text || '',
        v4State: branchState,
        activeStoryId: newId,
        activeStoryTitle: newTitle,
        branchOf: String(source.id),
        branchSourceTitle: source.title || '',
        branchRestartEpisode: restart,
        branchedAt: now,
        branchSnapshotSource: exact ? 'rolling/exact' : 'derived-safe'
      });
      await qa.idbPut(STORIES, branch);
      await qa.idbPut(DRAFTS, cleanStoryObject({
        id: 'current', savedAt: now, episodeCount: keep, episodes: keptRows,
        storyHistory: history, currentText: last?.text || '', settings: source.settings || {},
        activeStoryId: newId, activeStoryTitle: newTitle, v4State: branchState
      }));
      window.__VELOUR_V4_STATE_RESTORE__?.(branchState);
      qa.clearPendingRetryEpisode?.();
      qa.rememberConfirmedEpisode?.(keep, true);
      await window.restoreStory?.(newId);
      await window.renderStoryLibrary?.();
      alert(`↩️ 새 분기 생성 완료\n\n원본: EP1~${maxEp} 그대로 보존\n새 분기: EP1~${keep}\n다음 생성: EP${restart}\n${exact ? `EP${keep} 시점 저장 스냅샷을 사용했어.` : '정확한 과거 스냅샷이 없어 미래 메모리를 제거한 안전 상태로 만들었어.'}`);
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
  installButtons();
  console.info('✦ VELOUR specific-episode branch restored');
})();
