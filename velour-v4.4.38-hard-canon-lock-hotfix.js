'use strict';

/* VELOUR — authoritative HARD CANON lock.
   Loaded after all prompt/continuity wrappers.
   Restores the full user canon at the final prompt boundary and prevents
   legacy broad presets from mutating residence / calendar facts.
*/
(() => {
  'use strict';
  if (window.__VELOUR_HARD_CANON_LOCK_V1__) return;
  window.__VELOUR_HARD_CANON_LOCK_V1__ = true;
  window.__VELOUR_HARD_CANON_LOCK_VERSION__ = '1.0.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR hard canon lock: buildPrompt not found');
    return;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function normalizePrompt(text){
    return String(text || '').replace(/\r\n/g, '\n');
  }

  function stripLegacyBroadPreset(prompt, state){
    let out = normalizePrompt(prompt);
    if (state?.world || window.__VELOUR_V44_INSTALLED__) {
      // The old V2 genre selector contains examples such as “캠퍼스/자취방”.
      // V4 has its own world axis, so this legacy line must never become a fact.
      out = out.replace(/^\s*-\s*배경 세계관:\s*.*(?:\n|$)/gm, '');
    }
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }

  function authorityDirective(state, includeCanon){
    const hard = String(state?.hardCanon || '').trim();
    const canonText = hard && includeCanon
      ? `\n[사용자 HARD CANON 원문 — 생략/요약 금지]\n${hard}\n`
      : hard
        ? '\n- 사용자 HARD CANON 원문은 위 프롬프트에 이미 전체 포함되어 있다. 그 원문 전체를 동일한 권위로 유지한다.\n'
        : '\n- 사용자 HARD CANON 원문 없음.\n';

    return `[AUTHORITATIVE HARD CANON — FINAL LOCK]
- 이 블록은 이전의 selective/relevance-sampled HARD CANON, 장면 다양화 지시, 레거시 장르 예시보다 우선한다.
- HARD CANON의 각 줄은 현재 장면의 키워드와 직접 겹치지 않아도 계속 유효하다. 관련성 점수 때문에 삭제·약화·추정 교체하지 않는다.${canonText}
[불변 사실 적용 규칙]
- 거주 사실은 장면 장소와 별개다. 아파트/빌라/원룸/오피스텔, 자가/전월세, 옆집/윗집/아랫집/같은 건물 같은 주거 형태·인접 관계를 임의로 바꾸지 않는다. 카페·학교·회사·여행지로 장면이 이동해도 이사한 것이 아니다.
- 현재 시간·학사 상태도 별도 확정 사실이다. 방학/학기 중/개강 전후/휴학/졸업/재학 상태를 분위기나 캠퍼스 장르 때문에 자동 변경하지 않는다.
- ‘캠퍼스’, ‘대학 연구실’, ‘자취방’처럼 넓은 장르 프리셋에 들어 있던 예시는 선택 가능한 배경 후보일 뿐, HARD CANON에 없는 거주 형태·개강·통학·자취 사실을 생성하는 근거가 아니다.
- HARD CANON과 충돌하는 변경은 사용자가 이번 화 지시에서 명시적으로 바꾸었거나, 확정된 본문/타임라인에서 그 변경 사건이 실제로 성립한 경우에만 허용한다. 단순 시간 경과 추정이나 장면 다양화 목적으로 변경하지 않는다.
- 장면 다양화는 고정 사실 안에서 한다. 장소를 바꾸고 싶다면 ‘아파트 옆집 거주’는 유지한 채 외출·방문·공용공간 등 사건 장소만 바꾼다.
- 출력 직전 인물 설정/HARD CANON/현재 확정 상태와 본문을 대조한다. 충돌을 발견하면 본문을 먼저 고치고, 고칠 수 없는 충돌이 남으면 canonViolation=true로 표시한다.
- HARD CANON을 지키는 것과 본문에서 매번 설정을 복창하는 것은 다르다. 내부적으로 항상 적용하되, 현재 장면에 필요 없는 설정은 설명문으로 반복하지 않는다.`;
  }

  window.buildPrompt = function(){
    const state = snapshot();
    let out = stripLegacyBroadPreset(previousBuild.apply(this, arguments), state);
    const hard = String(state?.hardCanon || '').trim();
    const fullCanonAlreadyPresent = !!hard && out.includes(hard);
    out = `${out}\n\n${authorityDirective(state, !fullCanonAlreadyPresent)}`.trim();

    window.__VELOUR_LAST_HARD_CANON_LOCK__ = {
      version: window.__VELOUR_HARD_CANON_LOCK_VERSION__,
      hardCanonChars: hard.length,
      fullCanonAlreadyPresent,
      legacyWorldRemoved: !/^\s*-\s*배경 세계관:/m.test(out),
      at: new Date().toISOString()
    };
    return out;
  };

  window.__VELOUR_HARD_CANON_LOCK_QA__ = {
    snapshot,
    stripLegacyBroadPreset,
    authorityDirective
  };

  console.info('✦ VELOUR authoritative HARD CANON final lock loaded');
})();
