'use strict';
/* VELOUR V4.4.38 — remove app-generated minor-stage prompt overrides.
   This hotfix does NOT alter Gemini/provider safety settings. It only prevents VELOUR's
   own age/timeline inference and clean-room prose from outranking current user canon.
*/
(() => {
  'use strict';
  if (window.__VELOUR_NO_MINOR_PROMPT_HOTFIX__) return;
  window.__VELOUR_NO_MINOR_PROMPT_HOTFIX__ = true;
  window.__VELOUR_NO_MINOR_PROMPT_HOTFIX_VERSION__ = '1.0.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR no-minor-prompt hotfix: buildPrompt not found');
    return;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function beatsFromState(s){
    return String(s?.storyline || '')
      .split(/\n+/)
      .map(x => x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean);
  }

  function explicitCanonStage(text, max){
    const s = String(text || '');
    for (const rx of [
      /(?:캐논|CANON)(?:\s*스토리라인)?[^\d]{0,18}(\d+)\s*단계/i,
      /(?:스토리라인|storyline)[^\d]{0,18}(\d+)\s*단계/i,
      /(\d+)\s*단계\s*(?:캐논|CANON)/i
    ]) {
      const n = Number(s.match(rx)?.[1] || 0);
      if (n >= 1 && n <= max) return n - 1;
    }
    return -1;
  }

  function currentCanonContext(s){
    const userNext = String(document.getElementById('v33Next')?.value || '').trim();
    const beats = beatsFromState(s);
    const stored = Math.max(0, Number(s?.beatIndex || 0));
    const explicit = explicitCanonStage(userNext, beats.length);
    const index = explicit >= 0 ? explicit : Math.min(stored, Math.max(0, beats.length - 1));
    return { userNext, beats, index, currentBeat: beats[index] || '' };
  }

  function removeBracketBlock(text, headerRx){
    const lines = String(text || '').split('\n');
    const out = [];
    let skipping = false;
    for (const line of lines) {
      const t = line.trim();
      if (!skipping && headerRx.test(t)) { skipping = true; continue; }
      if (skipping && /^\[[^\]]+\]/.test(t)) skipping = false;
      if (!skipping) out.push(line);
    }
    return out.join('\n');
  }

  function stripAppAgeControls(prompt){
    let out = String(prompt || '');
    out = removeBracketBlock(out, /^\[AGE\/TIMELINE HARD LOCK\b/i);
    out = removeBracketBlock(out, /^\[AGE\/TIMELINE HARD LOCK — 현재 단계 전용\]/i);
    out = out
      .replace(/^\[연령 안전 원칙\].*$/gmi, '')
      .replace(/^.*(?:성장 단계 CLEAN ROOM|MINOR-STAGE CLEAN ROOM|AGE FIREWALL).*$/gmi, '')
      .replace(/^\s*-?\s*\[연령 단계 유지[^\]]*\].*$/gmi, '')
      .replace(/^\s*-\s*현재 연령\/학년 앵커:.*$/gmi, '')
      .replace(/^\s*-\s*현재 장면의 연령\/학년 앵커:.*$/gmi, '')
      .replace(/^\s*-\s*현재가 유년\/중학생\/고등학생 단계면.*$/gmi, '')
      .replace(/^\s*-\s*현재 단계가 성인 이전이면.*$/gmi, '')
      .replace(/^\s*-\s*안전 격리는 민감 상세만.*$/gmi, '')
      .replace(/^\s*-\s*UI에 저장된 이후 시점의 나이·대학·직업 프로필.*$/gmi, '')
      .replace(/^\s*-\s*현재 단계의 완료 조건이 충분히 쌓이기 전에는 다음 연령\/학년.*$/gmi, '')
      .replace(/^\s*-\s*현재는 성인 이전 성장 단계일 수 있다\..*$/gmi, '')
      .replace(/^\s*-\s*현재 단계의 학교·가정·친구·동네·가족.*$/gmi, '')
      .replace(/^\s*-\s*사용자가 현재 단계에서 직접 시간 전환을 지시하지 않았다면.*$/gmi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return out;
  }

  function currentPriorityBlock(s){
    const c = currentCanonContext(s);
    const rows = ['[CURRENT CANON PRIORITY — 현재 사용자 설정 최우선]'];
    if (c.userNext) rows.push(`- 이번 화 사용자 지시: ${c.userNext}`);
    if (c.currentBeat) rows.push(`- 현재 CANON 단계: ${c.index + 1}/${c.beats.length} · ${c.currentBeat}`);
    if (String(s?.hardCanon || '').trim()) rows.push(`- HARD CANON:\n${String(s.hardCanon).trim()}`);
    if (s?.relationship) rows.push(`- 현재 관계 설정 ID: ${String(s.relationship)}`);
    if (s?.trajectory) rows.push(`- 관계 변화 방향 ID: ${String(s.trajectory)}`);
    if (s?.occupationA || s?.occupationB) rows.push(`- 현재 성인 프로필 직업: A ${String(s.occupationA || '-')} / B ${String(s.occupationB || '-')}`);
    rows.push('- 과거의 유년기·중학교·고등학교 언급은 과거 설정이나 회상일 수 있다. 그 단어만 보고 현재 시점을 학교 시절로 되돌리지 않는다.');
    rows.push('- 현재 시점/연령/직업/관계는 위 사용자 지시와 HARD CANON, 현재 CANON 단계에서만 결정한다.');
    rows.push('- 최근 메모, 과거 아크, 자동 추론이 위 설정과 충돌하면 위 설정을 우선한다.');
    return rows.join('\n');
  }

  window.buildPrompt = function(isContinue = false){
    const s = snapshot();
    const raw = String(previousBuild(isContinue) || '');
    const stripped = stripAppAgeControls(raw);
    const priority = currentPriorityBlock(s);
    const finalPrompt = `${priority}\n\n${stripped}`.trim();
    window.__VELOUR_NO_MINOR_PROMPT_LAST__ = {
      beforeChars: raw.length,
      afterChars: finalPrompt.length,
      removedChars: Math.max(0, raw.length - stripped.length),
      currentBeatIndex: currentCanonContext(s).index,
      at: new Date().toISOString()
    };
    return finalPrompt;
  };

  console.info('✦ VELOUR no-minor-prompt hotfix loaded');
})();