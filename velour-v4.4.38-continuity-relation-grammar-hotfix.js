'use strict';

/* VELOUR — narrow Korean relationship-transition grammar repair
   + final intimate-scene diversity guard.
   Loaded last so repeated scene defaults are suppressed without changing
   the core story engine or user-selected adult-scene options.
*/
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__) return;

  const VERSION = '1.1.0';
  const RELATION_FORM = /연인(?:이|으로)?\s*(?:된다|됐다|되었다|되어|되는|될|된)(?:\b|\s|[.!?。！？,，]|$)/i;
  const PREFIX = '[사용자 확정 지속 상태';

  function intimacyDiversityDirective(state){
    const enabledPatterns = Array.isArray(state?.intimacyPatterns) && state.intimacyPatterns.length
      ? state.intimacyPatterns.join(', ')
      : '사용자 설정에서 허용된 구도';
    return `
[INTIMATE SCENE ANTI-REPETITION LOCK — 장소·구도·대사 기본값 회피]
- 이 규칙은 사용자 설정을 넓히는 규칙이 아니다. 사용자가 허용한 성인 장면 옵션과 경계 안에서만 다양화한다. 현재 허용 구도=${enabledPatterns}.
- 친밀 장면을 쓰기 전, 프롬프트에 제공된 최근 본문에서 직전 2~3회의 친밀 장면을 짧게 내부 점검한다: (1) 장소군, (2) 주된 몸의 방향/구도, (3) 더티톡의 기능과 반복 문구. 그 다음 최근에 덜 쓴 축을 우선한다.
- 장소는 '침실/방 → 거실 소파 → 욕실' 3개만 순환시키지 않는다. 직전 친밀 장면과 같은 장소군은 원칙적으로 연속 사용하지 말고, 최근 2회 안에 쓴 장소군도 서사상 자연스러운 대안이 있으면 우선순위를 낮춘다.
- 집 안에서도 침대·소파·샤워만 기본값으로 삼지 않는다. 현재 동선과 사생활이 자연스럽다면 주방/아일랜드·식탁 주변·현관/복도·창가/발코니·러그/바닥·서재/책상 주변·드레스룸 같은 서로 다른 공간군을 후보로 둔다. 집 밖은 인물의 직업·이동·숙박 맥락이 실제로 있을 때만 호텔/펜션·차량의 사적인 정차 공간·작업실/사무실의 비공개 시간대·대기실/분장실 등으로 넓힌다. 장소를 바꾸기 위해 개연성을 희생하지 않는다.
- 체위/구도는 이름만 바꾼 같은 후면 구도를 다양성으로 계산하지 않는다. '뒤에서/후배위/엎드린 후면/뒤에서 기대기/리버스 계열'은 같은 후면 가족으로 묶어 본다. 직전 친밀 장면의 핵심 구도가 후면이었다면 다음 친밀 장면에서는 후면 가족 전체의 우선순위를 크게 낮춘다.
- 허용 범위 안에서 마주보기·옆으로 나란히·스푸닝·앉아서 마주보기·상위 마주보기·침대/가구 끝을 이용한 대면·서서 마주보기 등 방향 자체가 다른 구도를 적극적으로 고려한다. 단, 한 장면 안에서 체위 수를 채우듯 기계적으로 갈아타지 말고 1~2개의 중심 구도를 장면 흐름에 맞게 사용한다.
- 더티톡은 문장만 조금 바꾼 절정/사정 예고를 반복하지 않는다. 특히 '갈 것 같아', '나한테 싸', '싸줘/싸도 돼'와 그에 준하는 문구는 자동 기본값이 아니다. 최근 친밀 장면에서 이미 썼다면 최소 다음 2회의 친밀 장면에서는 사용자가 직접 요구하지 않는 한 우선순위를 매우 낮춘다.
- 대사는 절정 예고 대신 도발/놀림, 욕망 고백, 몸이나 표정에 대한 즉각적 반응, 질문/요구, 속도·거리 조율, 관계 감정 노출, 상대가 방금 한 말에 대한 받아치기 등 다른 기능을 선택할 수 있다. 같은 기능을 여러 문장으로 반복해 분량을 채우지 않는다.
- 최근 반복을 피하더라도 캐릭터 성격, 현재 관계 단계, 물리적 동선, 직전 장면의 연속성을 먼저 지킨다. 사용자가 이번 화에 특정 장소·구도·대사를 직접 지정했다면 그 지시가 이 회피 규칙보다 우선한다.`;
  }

  function install(){
    if (window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__) return true;
    const guardQa = window.__VELOUR_CONTINUITY_VOICE_GUARD_QA__;
    const storageQa = window.__VELOUR_STORAGE_QA__;
    if (!guardQa?.normalizeTransition || !storageQa || typeof window.generateStory !== 'function' || typeof window.buildPrompt !== 'function') return false;

    window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__ = true;

    const previousBuild = window.buildPrompt;
    window.buildPrompt = function(){
      const out = String(previousBuild.apply(this, arguments) || '');
      let state = {};
      try { state = window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; } catch (_) {}
      return `${out}\n${intimacyDiversityDirective(state)}`.trim();
    };

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

    window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_QA__ = {
      version:VERSION,
      matches:value => RELATION_FORM.test(String(value || '')),
      promoteIfMissed,
      intimacyDiversityDirective
    };
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 300) clearInterval(timer);
  }, 80);
})();
