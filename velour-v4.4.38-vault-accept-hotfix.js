'use strict';

/* VELOUR — Response Vault acceptance helper
   - lets the user promote the exact next pending response without another Gemini request
   - does not inspect prose, age, timeline, or content categories
   - provider/API blocked responses remain non-promotable
*/
(() => {
  'use strict';
  if (window.__VELOUR_VAULT_ACCEPT_HOTFIX__) return;
  window.__VELOUR_VAULT_ACCEPT_HOTFIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa) {
    console.error('VELOUR vault helper: storage bridge not found');
    return;
  }

  const RESPONSE_STORE = 'responses';
  const nEp = v => {
    const n = Number(v || 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };

  function parseMeta(raw) {
    const src = String(raw || '');
    const open = '[[VELOUR_V4_META]]';
    const close = '[[/VELOUR_V4_META]]';
    const a = src.indexOf(open);
    if (a < 0) return null;
    const b = src.indexOf(close, a + open.length);
    const chunk = (b >= 0 ? src.slice(a + open.length, b) : src.slice(a + open.length)).trim();
    try { return JSON.parse(chunk); } catch (_) { return null; }
  }

  function pendingEpisode() {
    try { return nEp(qa.pendingRetryEpisode?.()); } catch (_) { return 0; }
  }

  function confirmedEpisode() {
    try {
      const n = Number(qa.confirmedEpisode?.() || 0);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch (_) { return 0; }
  }

  function isAcceptableRecord(r) {
    const ep = nEp(r?.attemptedEpisode);
    const text = String(r?.readerText || r?.rawText || '').trim();
    if (!ep || !text) return false;
    if (String(r?.finishReason || '').toUpperCase() === 'SAFETY') return false;
    if (String(r?.promptBlock || '').trim()) return false;
    const pending = pendingEpisode();
    const confirmed = confirmedEpisode();
    return ep === confirmed + 1 && (pending === 0 || pending === ep);
  }

  function guardedMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const m = JSON.parse(JSON.stringify(meta));
    const hard = !!(m.canonViolation || m.storylineSkipped || m.futureBeatLeak || m.residenceViolation || m.expressionViolation || m.professionalBoundaryViolation);
    if (hard) m.beatComplete = false;
    if (m.storylineSkipped || m.futureBeatLeak || m.canonViolation) {
      m.beatComplete = false;
      m.beatProgress = Math.min(85, Math.max(0, Number(m.beatProgress || 0)));
    }
    return m;
  }

  async function acceptVelourVaultResponse(id) {
    let r = null;
    try { r = await qa.responseVaultGet(RESPONSE_STORE, String(id)); }
    catch (e) { return alert('응답 금고를 읽지 못했어: ' + String(e?.message || e)); }
    if (!r) return alert('응답 금고에서 해당 본문을 찾지 못했어.');

    const ep = nEp(r.attemptedEpisode);
    if (!isAcceptableRecord(r)) {
      return alert(`이 응답은 현재 이어쓰기 위치에 붙일 수 없어.\n현재 확정: EP.${confirmedEpisode()}\n선택 응답: EP.${ep || '-'}`);
    }

    const clean = String(r.readerText || '').trim();
    if (!confirm(`EP.${String(ep).padStart(2, '0')} 미확정 응답을 정식 본문으로 채택할까?\n\n✓ 새 Gemini 요청 없음\n✓ 다음 화는 EP.${ep + 1}부터 진행`)) return;

    try {
      let history = '';
      try { history = String(storyHistory || ''); } catch (_) {}
      const normalized = history.replace(/\s+/g, ' ').trim();
      const tail = clean.slice(-320).replace(/\s+/g, ' ').trim();
      if (!normalized || !tail || !normalized.includes(tail)) history = history.trim() ? history.trimEnd() + '\n\n' + clean : clean;
      try { storyHistory = history; } catch (_) {}
      try { episodeCount = ep; } catch (_) {}

      const meta = guardedMeta(parseMeta(r.rawText || ''));
      const acceptedDirection = String(document.getElementById('v33Next')?.value || '').trim();
      qa.rememberConfirmedEpisode?.(ep, false);
      qa.clearPendingRetryEpisode?.();
      if (meta) qa.updateMemory?.(meta, ep, acceptedDirection);

      const novel = document.getElementById('novelText');
      const title = document.getElementById('resultTitle');
      const panel = document.getElementById('resultPanel');
      const counter = document.getElementById('v35CharCount');
      const next = document.getElementById('btnNext');
      const dir = document.getElementById('v33Next');
      if (novel) novel.innerText = clean;
      if (title) title.innerText = `EPISODE ${String(ep).padStart(2, '0')}`;
      if (panel) panel.style.display = 'block';
      if (next) next.style.display = 'block';
      if (dir) dir.value = '';
      try { localStorage.removeItem('VELOUR_NEXT_DIRECTIVE_V33'); } catch (_) {}
      document.getElementById('velourHardLockReviewNotice')?.remove();
      const actions = document.getElementById('velourGenerationDiagnosticActions');
      if (actions) actions.style.display = 'none';
      qa.markGenerationOutcome?.('committed', { episode: ep, attemptedEpisode: ep, userAcceptedVault: true, responseVaultId: String(r.id || id) });
      if (counter) counter.textContent = `본문 ${clean.length.toLocaleString()}자 · 사용자 채택 확정`;
      try { await window.__VELOUR_IDB_SAVE_DRAFT__?.(); } catch (_) {}
      try { await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(window.__VELOUR_V4_STATE_SNAPSHOT__?.()); } catch (_) {}
      const modal = document.getElementById('velourResponseVaultModal');
      if (modal) modal.style.display = 'none';
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      alert(`✓ EP.${String(ep).padStart(2, '0')}로 확정했어.`);
    } catch (e) {
      console.error('VELOUR vault accept failed', e);
      alert('응답 채택 중 오류: ' + String(e?.message || e));
    }
  }

  window.acceptVelourVaultResponse = acceptVelourVaultResponse;

  const originalShowVault = window.showVelourResponseVault;
  if (typeof originalShowVault === 'function') {
    window.showVelourResponseVault = async function() {
      await originalShowVault.apply(this, arguments);
      const list = document.getElementById('velourVaultList');
      if (!list) return;
      let rows = [];
      try { rows = await qa.responseVaultAll(RESPONSE_STORE); } catch (_) { return; }
      rows.sort((a, b) => String(b.receivedAt || '').localeCompare(String(a.receivedAt || '')));
      const cards = Array.from(list.children);
      rows.forEach((r, i) => {
        const card = cards[i];
        if (!card || !isAcceptableRecord(r)) return;
        const actions = card.lastElementChild;
        if (!actions || actions.querySelector('[data-vault-accept]')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.vaultAccept = '1';
        btn.textContent = '✓ 이 응답으로 확정';
        btn.style.cssText = 'flex:1;border:1px solid rgba(126,224,160,.35);background:rgba(90,200,130,.10);color:#bff4cf;border-radius:8px;padding:7px;font-size:9.5px;font-weight:800';
        btn.onclick = () => acceptVelourVaultResponse(r.id);
        actions.prepend(btn);
      });
    };
  }

  const observer = new MutationObserver(() => {
    const note = document.getElementById('velourHardLockReviewNotice');
    if (!note || note.querySelector('[data-vault-accept-review]') || !pendingEpisode()) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.vaultAcceptReview = '1';
    btn.textContent = '✓ 현재 미확정 응답 채택';
    btn.style.cssText = 'margin-top:10px;width:100%;border:1px solid rgba(126,224,160,.35);background:rgba(90,200,130,.11);color:#bff4cf;border-radius:9px;padding:8px 10px;font-size:10px;font-weight:800';
    btn.onclick = async () => {
      let rows = [];
      try { rows = await qa.responseVaultAll(RESPONSE_STORE); } catch (_) { return; }
      rows = rows.filter(isAcceptableRecord).sort((a, b) => String(b.receivedAt || '').localeCompare(String(a.receivedAt || '')));
      if (rows.length === 1) return acceptVelourVaultResponse(rows[0].id);
      window.showVelourResponseVault?.();
    };
    note.appendChild(btn);
  });
  observer.observe(document.body, { subtree: true, childList: true });

  console.info('✦ VELOUR Response Vault acceptance helper loaded');
})();

(() => {
  if (window.__VELOUR_QUALITY_RESTORE_LOADER__) return;
  window.__VELOUR_QUALITY_RESTORE_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-quality-restore.js?v=5';
  script.async = false;
  document.head.appendChild(script);
})();

(() => {
  if (window.__VELOUR_SCENE_AGENCY_LOADER__) return;
  window.__VELOUR_SCENE_AGENCY_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-scene-agency-hotfix.js?v=1';
  script.async = false;
  document.head.appendChild(script);
})();

(() => {
  if (window.__VELOUR_EPISODE_BRANCH_LOADER__) return;
  window.__VELOUR_EPISODE_BRANCH_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-episode-branch-hotfix.js?v=3';
  script.async = false;
  document.head.appendChild(script);
})();

(() => {
  if (window.__VELOUR_USAGE_DASHBOARD_LOADER__) return;
  window.__VELOUR_USAGE_DASHBOARD_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-usage-dashboard-hotfix.js?v=2';
  script.async = false;
  document.head.appendChild(script);
})();

(() => {
  if (window.__VELOUR_CONTINUITY_COST_LOADER__) return;
  window.__VELOUR_CONTINUITY_COST_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-continuity-hotfix.js?v=1';
  script.async = false;
  document.head.appendChild(script);
})();

(() => {
  if (window.__VELOUR_CONTINUITY_VAULT_EDGE_LOADER__) return;
  window.__VELOUR_CONTINUITY_VAULT_EDGE_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-continuity-vault-hotfix.js?v=2';
  script.async = false;
  document.head.appendChild(script);
})();

(() => {
  if (window.__VELOUR_INTERNAL_LABEL_FIREWALL_LOADER__) return;
  window.__VELOUR_INTERNAL_LABEL_FIREWALL_LOADER__ = true;
  const script = document.createElement('script');
  script.src = './velour-v4.4.38-internal-label-firewall.js?v=1';
  script.async = false;
  document.head.appendChild(script);
})();
