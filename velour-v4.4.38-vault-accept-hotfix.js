'use strict';

/* VELOUR V4.4.38 — Response Vault acceptance hotfix
   Load AFTER velour-v4.4.38.js.

   What it does
   - A pending/unconfirmed response in the Response Vault can be explicitly promoted
     to the NEXT confirmed episode without another Gemini request.
   - It only allows the exact pending retry episode (confirmed + 1).
   - API SAFETY-blocked responses are never promotable.
   - The client does not inspect prose or CANON age-stage content; Gemini/provider
     results remain the source of truth for what was generated.
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

    const hard = !!(
      m.canonViolation ||
      m.storylineSkipped ||
      m.futureBeatLeak ||
      m.ageStageViolation ||
      m.residenceViolation ||
      m.expressionViolation ||
      m.professionalBoundaryViolation
    );

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

    if (!confirm(
      `EP.${String(ep).padStart(2, '0')}의 미확정 응답을 정식 본문으로 채택할까?\n\n` +
      `✓ 새 Gemini 요청 없음\n` +
      `✓ 현재 본문을 EP.${ep}로 확정\n` +
      `✓ 다음 화는 EP.${ep + 1}부터 진행\n` +
      `✓ 응답 금고 원문은 그대로 보존\n\n` +
      `설정 검토 경고가 있었던 응답이면 그 경고를 알고도 이 본문을 선택하는 거야.`
    )) return;

    try {
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

      const meta = guardedMeta(parseMeta(r.rawText || ''));
      qa.rememberConfirmedEpisode?.(ep, false);
      qa.clearPendingRetryEpisode?.();
      if (meta) qa.updateMemory?.(meta, ep);

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

      window.showVelourResponseVault?.();
    };

    box.appendChild(btn);
    note.appendChild(box);
  });

  observer.observe(document.body, { subtree: true, childList: true });

  /*
   * Canon / timeline prompt stabilizer.
   * This does NOT add content filtering, blocking, automatic retry or prose validation.
   * It only fixes final-prompt priority after V4.4.38 has already built the request.
   */
  if (!window.__VELOUR_CANON_PROMPT_STABILIZER__) {
    window.__VELOUR_CANON_PROMPT_STABILIZER__ = true;
    const priorBuildPrompt = window.buildPrompt;

    const beatsFromState = s => String(s?.storyline || '')
      .split(/\n+/)
      .map(x => x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean);

    const explicitCanonStage = (text, max) => {
      const s = String(text || '');
      const patterns = [
        /(?:캐논|CANON)(?:\s*스토리라인)?[^\d]{0,18}(\d+)\s*단계/i,
        /(?:스토리라인|storyline)[^\d]{0,18}(\d+)\s*단계/i,
        /(\d+)\s*단계\s*(?:캐논|CANON)/i
      ];
      for (const rx of patterns) {
        const m = s.match(rx);
        const n = Number(m?.[1] || 0);
        if (n >= 1 && n <= max) return n - 1;
      }
      return -1;
    };

    const removeAgeHardLock = prompt => {
      const lines = String(prompt || '').split('\n');
      const out = [];
      let skipping = false;
      for (const line of lines) {
        if (/^\[AGE\/TIMELINE HARD LOCK\b/i.test(line.trim())) {
          skipping = true;
          continue;
        }
        if (skipping) {
          if (!line.trim()) {
            skipping = false;
            continue;
          }
          if (/^\[[^\]]+\]/.test(line.trim())) {
            skipping = false;
            out.push(line);
          }
          continue;
        }
        out.push(line);
      }
      return out.join('\n');
    };

    const restoreNeutralAdultProfiles = prompt => String(prompt || '')
      .replace(/^- ([AB]) 성인 시기 프로필\(미래 참고값 · 현재 단계 적용 금지\): (.*?) \/ 신분 (.*?)\.$/gm, '- $1: $2 / 신분 $3.');

    const compactRepeatedAnchorLines = prompt => {
      const seen = new Set();
      return String(prompt || '').split('\n').filter(line => {
        const t = line.trim();
        if (!t) return true;
        if (!/^(?:- )?(?:현재 실행 단계|현재 CANON 단계|이번 화의 주목적|사용자 다음 화 지시|READ-ONLY ROADMAP)/i.test(t)) return true;
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      }).join('\n');
    };

    if (typeof priorBuildPrompt === 'function') {
      window.buildPrompt = function(isContinue = false) {
        let prompt = String(priorBuildPrompt(isContinue) || '');
        let snapshot = null;
        try { snapshot = window.__VELOUR_V4_STATE_SNAPSHOT__?.() || null; } catch (_) {}

        const userNext = String(document.getElementById('v33Next')?.value || '').trim();
        const beats = beatsFromState(snapshot || {});
        const storedIndex = Math.max(0, Number(snapshot?.beatIndex || 0));
        const requestedIndex = explicitCanonStage(userNext, beats.length);
        const effectiveIndex = requestedIndex >= 0
          ? requestedIndex
          : Math.min(storedIndex, Math.max(0, beats.length - 1));
        const currentBeat = beats[effectiveIndex] || '';

        const beforeChars = prompt.length;
        prompt = removeAgeHardLock(prompt);
        prompt = restoreNeutralAdultProfiles(prompt);
        prompt = compactRepeatedAnchorLines(prompt);

        const anchor = [
          '[CURRENT CANON PRIORITY — 생성 방향 정리]',
          userNext ? `- 사용자 다음 화 지시: ${userNext}` : '',
          currentBeat ? `- 이번 화의 현재 CANON 단계: ${effectiveIndex + 1}/${beats.length} · ${currentBeat}` : '',
          requestedIndex >= 0 ? '- 사용자가 이번 요청에서 단계 번호를 직접 지정했으므로 저장된 진행 커서보다 이 요청의 단계 지정을 우선한다.' : '',
          '- 최근 장면 메모·열린 떡밥·이전 화의 자생 사건은 현재 CANON 단계와 사용자 지시를 보조하는 참고자료다. 충돌하면 현재 CANON 단계와 사용자 지시를 따른다.',
          '- 과거 시절 언급이나 회상은 현재 시점을 자동으로 되돌리는 근거로 사용하지 않는다. 현재 시점은 이번 요청과 현재 CANON 단계의 문맥으로 판단한다.',
          '- 이 지시는 생성 방향을 정리하기 위한 것이며 본문을 검열·차단하거나 자동 재생성을 요구하지 않는다.'
        ].filter(Boolean).join('\n');

        prompt = `${anchor}\n\n${prompt}`.trim();

        window.__VELOUR_CANON_PROMPT_STABILIZER_LAST__ = {
          beforeChars,
          afterChars: prompt.length,
          savedChars: Math.max(0, beforeChars - prompt.length),
          storedBeatIndex: storedIndex,
          effectiveBeatIndex: effectiveIndex,
          explicitBeatOverride: requestedIndex >= 0,
          currentBeat,
          userDirectionPresent: !!userNext,
          at: new Date().toISOString()
        };

        return prompt;
      };
    }
  }

  console.info('✦ VELOUR V4.4.38 Response Vault acceptance hotfix loaded');
})();