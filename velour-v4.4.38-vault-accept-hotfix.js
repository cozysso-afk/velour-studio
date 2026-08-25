'use strict';

/* VELOUR V4.4.38 — Response Vault acceptance hotfix
   Load AFTER velour-v4.4.38.js.

   What it does
   - A pending/unconfirmed response in the Response Vault can be explicitly promoted
     to the NEXT confirmed episode without another Gemini request.
   - It only allows the exact pending retry episode (confirmed + 1).
   - API SAFETY-blocked responses are never promotable.
   - During a minor/current-age clean-room stage, explicit adult content is not promotable.
   - The selected prose is appended to storyHistory, V4 memory is updated conservatively,
     the confirmed ledger advances, and the IndexedDB draft is committed.
*/
(() => {
  'use strict';
  if (window.__VELOUR_VAULT_ACCEPT_HOTFIX__) return;
  window.__VELOUR_VAULT_ACCEPT_HOTFIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa) {
    console.error('VELOUR vault-accept hotfix: V4.4.38 QA bridge not found');
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
    } catch (_) {
      return 0;
    }
  }

  function isAcceptableRecord(r) {
    const ep = nEp(r?.attemptedEpisode);
    if (!ep || !String(r?.readerText || r?.rawText || '').trim()) return false;
    if (String(r?.finishReason || '').toUpperCase() === 'SAFETY') return false;
    if (String(r?.promptBlock || '').trim()) return false;

    const pending = pendingEpisode();
    const confirmed = confirmedEpisode();
    // A pre-hotfix/reloaded draft can lose the volatile pending marker while its
    // received prose remains in the vault. With no marker, only the exact next
    // episode is eligible. A live pending marker must still match the record.
    return ep === confirmed + 1 && (pending === 0 || pending === ep);
  }

  function currentMinorSafetyReason(text, ep) {
    let phase = null;
    try { phase = qa.promptStagePhase?.(ep) || null; } catch (_) {}
    if (!phase?.ageForced) return '';

    const explicit = /(?:성관계|섹스|정사|베드\s*씬|성인\s*장면|잠자리|성기|발기|삽입|사정|오르가즘|체위|보지|자지|좆|젖통)/i;
    return explicit.test(String(text || ''))
      ? '현재 CANON이 성인 이전 단계라 이 응답은 안전 잠금을 우회해 확정할 수 없어.'
      : '';
  }

  function guardedMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const m = JSON.parse(JSON.stringify(meta));

    const hard = !!(
      m.canonViolation ||
      m.storylineSkipped ||
      m.futureBeatLeak ||
      m.ageStageViolation ||
      m.residenceViolation ||
      m.expressionViolation ||
      m.professionalBoundaryViolation
    );

    // “본문 채택”은 허용하되, 의심스러운 META가 CANON 단계를 건너뛰게 하지는 않는다.
    if (hard) m.beatComplete = false;

    if (m.storylineSkipped || m.futureBeatLeak || m.canonViolation) {
      m.beatComplete = false;
      m.beatProgress = Math.min(85, Math.max(0, Number(m.beatProgress || 0)));
    }

    return m;
  }

  async function acceptVelourVaultResponse(id) {
    let r = null;
    try {
      r = await qa.responseVaultGet(RESPONSE_STORE, String(id));
    } catch (e) {
      return alert('응답 금고를 읽지 못했어: ' + String(e?.message || e));
    }

    if (!r) return alert('응답 금고에서 해당 본문을 찾지 못했어.');

    const ep = nEp(r.attemptedEpisode);
    if (!isAcceptableRecord(r)) {
      const pending = pendingEpisode();
      const confirmed = confirmedEpisode();
      return alert(
        `이 응답은 현재 이어쓰기 위치에 안전하게 붙일 수 없어.\n\n` +
        `현재 확정: EP.${confirmed}\n` +
        `현재 재시도 대기: ${pending ? 'EP.' + pending : '없음'}\n` +
        `선택 응답: EP.${ep || '-'}\n\n` +
        `해당 작품의 직전 확정 화 상태에서만 채택할 수 있어.`
      );
    }

    const clean = String(r.readerText || '').trim();
    const stageBlock = currentMinorSafetyReason(clean, ep);
    if (stageBlock) return alert(stageBlock);

    if (!confirm(
      `EP.${String(ep).padStart(2, '0')}의 미확정 응답을 정식 본문으로 채택할까?\n\n` +
      `✓ 새 Gemini 요청 없음\n` +
      `✓ 현재 본문을 EP.${ep}로 확정\n` +
      `✓ 다음 화는 EP.${ep + 1}부터 진행\n` +
      `✓ 응답 금고 원문은 그대로 보존\n\n` +
      `설정 검토 경고가 있었던 응답이면 그 경고를 알고도 이 본문을 선택하는 거야.`
    )) return;

    try {
      // 1) 확정 history에 본문 편입
      let history = '';
      try { history = String(storyHistory || ''); } catch (_) {}

      const normalizedHistory = history.replace(/\s+/g, ' ').trim();
      const tail = clean.slice(-320).replace(/\s+/g, ' ').trim();
      if (!normalizedHistory || !tail || !normalizedHistory.includes(tail)) {
        history = history.trim()
          ? history.trimEnd() + '\n\n' + clean
          : clean;
      }

      try { storyHistory = history; } catch (_) {}
      try { episodeCount = ep; } catch (_) {}

      // 2) V4 memory는 보수적으로 반영 — 본문은 채택하지만 의심 META로 단계 점프 금지
      const meta = guardedMeta(parseMeta(r.rawText || ''));
      qa.rememberConfirmedEpisode?.(ep, false);
      qa.clearPendingRetryEpisode?.();
      if (meta) qa.updateMemory?.(meta, ep);

      // 3) 화면을 정식 확정 상태로 복구
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

      document.getElementById('velourHardLockReviewNotice')?.remove();
      const diagActions = document.getElementById('velourGenerationDiagnosticActions');
      if (diagActions) diagActions.style.display = 'none';

      qa.markGenerationOutcome?.('committed', {
        episode: ep,
        attemptedEpisode: ep,
        userAcceptedVault: true,
        hardLockOverride: true,
        responseVaultId: String(r.id || id)
      });

      if (counter) {
        let mode = 'long4000';
        try { mode = localStorage.getItem('VELOUR_V35_LENGTH_MODE') || mode; } catch (_) {}
        const target = mode === 'normal2500' ? 2500 : 4000;
        const ok = clean.length >= target;

        counter.style.color = ok ? '#bca7b2' : '#ffd08a';
        counter.textContent = ok
          ? `본문 ${clean.length.toLocaleString()}자 · 사용자 채택 확정 · ENGINE V4.4.38`
          : `본문 ${clean.length.toLocaleString()}자 · 사용자 채택 확정 · 목표 ${target.toLocaleString()}자 · ENGINE V4.4.38`;
      }

      // 4) 정상 생성 성공 때와 같은 IndexedDB draft commit
      try {
        await window.__VELOUR_IDB_SAVE_DRAFT__?.();
      } catch (e) {
        console.warn('VELOUR vault accept: draft save warning', e);
      }

      try {
        await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(
          window.__VELOUR_V4_STATE_SNAPSHOT__?.()
        );
      } catch (_) {}

      const modal = document.getElementById('velourResponseVaultModal');
      if (modal) modal.style.display = 'none';

      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      alert(
        `✓ EP.${String(ep).padStart(2, '0')}로 확정했어.\n` +
        `이제 다음 화는 EP.${String(ep + 1).padStart(2, '0')}부터 이어져.`
      );
    } catch (e) {
      console.error('VELOUR vault response accept failed', e);
      alert('응답 채택 중 오류가 났어: ' + String(e?.message || e));
    }
  }

  window.acceptVelourVaultResponse = acceptVelourVaultResponse;

  // 응답 금고를 연 뒤 “현재 pending EP”에 해당하는 카드에만 채택 버튼 추가
  const originalShowVault = window.showVelourResponseVault;
  if (typeof originalShowVault === 'function') {
    window.showVelourResponseVault = async function() {
      await originalShowVault.apply(this, arguments);

      const list = document.getElementById('velourVaultList');
      if (!list) return;

      let rows = [];
      try {
        rows = await qa.responseVaultAll(RESPONSE_STORE);
      } catch (_) {
        return;
      }

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
        btn.style.cssText =
          'flex:1;border:1px solid rgba(126,224,160,.35);' +
          'background:rgba(90,200,130,.10);color:#bff4cf;' +
          'border-radius:8px;padding:7px;font-size:9.5px;font-weight:800';
        btn.onclick = () => acceptVelourVaultResponse(r.id);
        actions.prepend(btn);
      });
    };
  }

  // HARD LOCK 검토 안내에도 바로 채택 버튼 추가
  const observer = new MutationObserver(() => {
    const note = document.getElementById('velourHardLockReviewNotice');
    if (!note || note.querySelector('[data-vault-accept-review]')) return;

    const ep = pendingEpisode();
    if (!ep) return;

    const box = document.createElement('div');
    box.style.cssText = 'display:flex;gap:7px;margin-top:10px;flex-wrap:wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.vaultAcceptReview = '1';
    btn.textContent = '✓ 현재 미확정 응답 채택';
    btn.style.cssText =
      'flex:1;border:1px solid rgba(126,224,160,.35);' +
      'background:rgba(90,200,130,.11);color:#bff4cf;' +
      'border-radius:9px;padding:8px 10px;font-size:10px;font-weight:800';

    btn.onclick = async () => {
      let rows = [];
      try {
        rows = await qa.responseVaultAll(RESPONSE_STORE);
      } catch (_) {
        return alert('응답 금고를 읽지 못했어.');
      }

      rows = rows
        .filter(r => isAcceptableRecord(r))
        .sort((a, b) => String(b.receivedAt || '').localeCompare(String(a.receivedAt || '')));

      if (!rows.length) return window.showVelourResponseVault?.();
      if (rows.length === 1) return acceptVelourVaultResponse(rows[0].id);

      // 같은 EP를 여러 번 생성했다면 금고에서 마음에 드는 버전을 직접 고르게 함
      window.showVelourResponseVault?.();
    };

    box.appendChild(btn);
    note.appendChild(box);
  });

  observer.observe(document.body, { subtree: true, childList: true });

  console.info('✦ VELOUR V4.4.38 Response Vault acceptance hotfix loaded');
})();
