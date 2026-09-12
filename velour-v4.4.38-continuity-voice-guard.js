'use strict';

/* VELOUR — durable transition + address canon + dialogue variation guard.
   Loaded after the existing continuity / scene-voice prompt stack is ready.
*/
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_VOICE_GUARD_BOOT__) return;
  window.__VELOUR_CONTINUITY_VOICE_GUARD_BOOT__ = true;

  const VERSION = '1.0.0';
  const USER_FACT_PREFIX = '[사용자 확정 지속 상태';
  const MAX_USER_FACTS = 20;

  const clean = (value, max = 320) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const clone = value => JSON.parse(JSON.stringify(value || {}));
  const compactKey = value => clean(value, 300).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function lines(raw){
    return String(raw || '')
      .split(/\n+|(?<=[.!?。！？])\s+|\s*[;；]\s*/)
      .map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 36);
  }

  // A next-episode instruction can be one-shot in execution but durable in result.
  // Example classes: relationship/status transition, address/register rule, residence/job/role change,
  // knowledge/reveal that cannot logically become unknown again, or an explicit ongoing boundary/routine.
  const RELATION_TRANSITION = /(?:사귀(?:게\s*되|기\s*시작|기로)|연인(?:이\s*되|관계)|연애(?:를?\s*시작|하기로)|고백(?:을?\s*받아들|이\s*성사)|헤어(?:지|짐)|이별|재결합|재회(?:해\s*관계|해서\s*다시)|약혼|결혼|혼인|동거(?:를?\s*시작|하기로|하게\s*되)|섹파|FWB|관계\s*정의|관계를?\s*(?:정리|확정|끝))/i;
  const ADDRESS_TRANSITION = /(?:호칭|존댓말|반말|존대|말투|어투|말버릇|(?:라고|이라)\s*부르|부르는\s*호칭|이름으로\s*부르|오빠|누나|형|언니|선배님?|후배|대표님|사장님|팀장님|선생님|교수님|씨\b|님\b)/i;
  const ROLE_TRANSITION = /(?:입사|퇴사|이직|전근|전직|승진|해고|복직|휴직|계약(?:을?\s*(?:체결|해지|종료))|직업(?:이|을)\s*(?:바뀌|변경)|소속(?:이|을)\s*(?:바뀌|변경)|역할(?:이|을)\s*(?:바뀌|변경)|상사|부하|매니저|비서|경호)/i;
  const RESIDENCE_TRANSITION = /(?:이사(?:하|함|했다)|동거(?:하|시작)|같이\s*살|집을?\s*(?:옮기|합치)|주소|거주지|기숙사|룸메이트)/i;
  const KNOWLEDGE_TRANSITION = /(?:정체(?:를?\s*(?:알게|밝히|들키|발각)|가\s*(?:밝혀|드러))|비밀(?:을?\s*(?:알게|밝히|들키|공유)|이\s*(?:밝혀|드러))|사실(?:을?\s*알게\s*되)|임신(?:을?\s*알게|사실)|기억(?:을?\s*되찾|이\s*돌아오))/i;
  const ONGOING_RULE = /(?:앞으로|이후(?:에도|부터)?|계속|유지|항상|매번|정기|당분간|한동안|내내|원칙|규칙|금지|하지\s*않|하지\s*말|하기로)/i;
  const PURE_SCENE = /(?:이번\s*화|다음\s*화|오늘|내일|그날|이번만|한\s*번|잠깐|잠시)/i;

  function isDurableTransitionClause(raw){
    const text = clean(raw, 360);
    if (!text || text.length < 4 || window.__VELOUR_CONTINUITY_QA__?.hasPendingCondition?.(text)) return false;
    const stateChange = RELATION_TRANSITION.test(text) || ADDRESS_TRANSITION.test(text) || ROLE_TRANSITION.test(text) || RESIDENCE_TRANSITION.test(text) || KNOWLEDGE_TRANSITION.test(text);
    if (stateChange) return true;
    if (ONGOING_RULE.test(text)) return true;
    if (PURE_SCENE.test(text)) return false;
    return false;
  }

  function normalizeTransition(raw, ep){
    let text = clean(raw, 300)
      .replace(/^(?:이번|다음)\s*화(?:에서|에는|에|부터)?\s*/,'')
      .replace(/^(?:EP|에피소드)\s*\d+\s*(?:에서|에는|에|부터)?\s*/i,'');
    return clean(`${USER_FACT_PREFIX} · EP${ep}] ${text}`, 360);
  }

  function promoteDurableTransitions(direction, ep){
    const n = Math.floor(Number(ep || 0));
    if (!n || !direction) return [];
    const candidates = lines(direction).filter(isDurableTransitionClause);
    if (!candidates.length) return [];

    const state = snapshot();
    state.runtime = Object.assign({}, state.runtime || {});
    let facts = Array.isArray(state.runtime.durableFacts) ? state.runtime.durableFacts.map(String).filter(Boolean) : [];
    const added = [];

    for (const raw of candidates) {
      const fact = normalizeTransition(raw, n);
      const key = compactKey(fact.replace(/^\[[^\]]+\]\s*/, ''));
      if (!key) continue;
      const duplicate = facts.some(existing => compactKey(String(existing).replace(/^\[[^\]]+\]\s*/, '')) === key);
      if (duplicate) continue;

      // Keep chronological facts: a shared relationship/address keyword does
      // not prove that two facts concern the same character pair.
      facts.push(fact);
      added.push(fact);
    }

    if (!added.length) return [];
    const userFacts = facts.filter(f => String(f).startsWith(USER_FACT_PREFIX)).slice(-MAX_USER_FACTS);
    const otherFacts = facts.filter(f => !String(f).startsWith(USER_FACT_PREFIX)).slice(-20);
    state.runtime.durableFacts = [...otherFacts, ...userFacts].slice(-32);
    try { window.__VELOUR_V4_STATE_RESTORE__?.(state); }
    catch (_) { return []; }
    try { Promise.resolve(window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(state)).catch(() => {}); } catch (_) {}
    window.__VELOUR_LAST_DURABLE_TRANSITION_PROMOTION__ = {episode:n, added:clone(added), at:new Date().toISOString()};
    return added;
  }

  const ADDRESS_HINT = /(?:(?:^|[^0-9])\d{1,3}\s*(?:세|살)(?=$|[^가-힣]|[이가의은는]|입니|이다)|연상|연하|나이\s*차|호칭|존댓말|반말|존대|말투|어투|(?:라고|이라)\s*부르|오빠|누나|형|언니|선배님?|후배|대표님|사장님|팀장님|선생님|교수님|\S+씨\b|\S+님\b)/i;

  function addressCanon(state){
    const characterSheet = String(document.getElementById('inputChars')?.value || '');
    const durable = (Array.isArray(state?.runtime?.durableFacts) ? state.runtime.durableFacts : []).join('\n');
    const api=window.__VELOUR_CANON_INDEX__;
    const selected=api.retrieve(state,{direction:document.getElementById('v33Next')?.value||''}).selected;
    const canonHints=selected.filter(f=>ADDRESS_HINT.test(f.text)).map(f=>!f.future && f.owners.some(n=>f.text.startsWith(n)) ? f.text : `[${f.owners.join(' × ')||f.block.label}${f.future?' · 미래/조건부 · 미성립':''}] ${f.text}`);
    const raw = [characterSheet, durable].filter(Boolean).join('\n');
    const sourceHints=raw.split(/\n+/).filter(line=>ADDRESS_HINT.test(line));
    const hints=[...canonHints,...sourceHints];
    const hintText=hints.join('\n');


    return `\n[ADDRESS / AGE CANON — 호칭·연상연하 오류 방지]\n- 인물 설정에 숫자 나이가 둘 다 있으면 실제 숫자를 비교해 누가 연상/연하인지 먼저 내부적으로 확인한다. 연상·연하 방향을 뒤집지 않는다.\n- 명시된 호칭, 존댓말/반말 규칙, 직급·신분 호칭은 단순 문체 취향이 아니라 CANON이다. 감정이 격해지거나 친밀 장면이어도 임의로 뒤집지 않는다.\n- 나이가 많다는 이유만으로 ‘오빠/누나/형/언니’를 자동 생성하지 않는다. 그런 호칭은 사용자 설정이나 이미 확립된 본문 관계에서 실제로 쓰였을 때만 유지한다. 명시가 없으면 기존에 확립된 이름/직함/호칭을 보존한다.\n- 한 화 안에서 같은 상대를 부르는 기본 호칭이 이유 없이 오락가락하지 않는다. 호칭 변화가 서사 사건이라면 변화가 일어난 시점 이후부터 새 규칙을 지속한다.\n${hints.length ? `- 현재 설정에서 추출한 연령/호칭 단서:\n${hintText.length<=2000 ? hints.map(x => `  • ${x}`).join('\n') : '  • CANON RETRIEVAL 및 인물 설정 원문의 인물별 연령/호칭을 참조한다. 이곳에 중복 낭독하지 않는다.'}` : '- 명시적 호칭 단서가 부족하면 새 친족형 호칭을 발명하지 말고 직전 확정 본문의 호칭을 우선한다.'}`;
  }

  function dialogueVariationDirective(state){
    const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));
    return `\n[DIALOGUE FUNCTION VARIATION — 성인 대사 반복 억제]\n- 더티톡 강도=${dirty}/100. 수위는 선택값을 따르되, 강도가 높다는 이유로 같은 짧은 감탄사·쾌감 보고·크기/강도 평가·절정 예고만 순환하지 않는다.\n- 특히 여성 인물을 ‘신음 → 강도 평가 → 절정 예고’만 반복하는 수동 반응기로 쓰지 않는다. 캐릭터 성격을 유지하면서 요구, 선택, 도발, 질문, 제지, 속도/거리 조율, 상대 반응에 대한 코멘트, 이름/호칭 사용, 감정 노출, 장난, 침묵 뒤 한마디 등 서로 다른 대화 기능을 장면 안에서 교대한다.\n- 남성 인물도 명령/칭찬 한 종류로 고정하지 않는다. 두 사람 모두 상대가 방금 한 말이나 행동에 실제로 응답해야 하며, 독백처럼 각자 정해진 문구를 출력하지 않는다.\n- 동일하거나 거의 같은 짧은 성인 대사를 한 장면에서 반복하지 않는다. 같은 의미가 다시 필요하면 문장 길이, 말의 목적, 상대를 부르는 방식, 감정의 방향 중 최소 하나를 바꾼다.\n- 신음은 대사의 대체물이 아니다. 호흡·말 끊김을 쓸 수 있지만 모든 반응을 같은 음절의 신음으로 시작하지 않는다.\n- 다양성을 위해 캐릭터에 없는 성격이나 호칭을 새로 만들지 않는다. ADDRESS / AGE CANON과 HARD CANON이 우선이다.`;
  }

  function transitionSemanticsDirective(){
    return `\n[NEXT-DIRECTION CONSEQUENCE LOCK — 다음화 지시 결과 유지]\n- ‘다음 화’ 입력은 실행 트리거 자체는 한 화용일 수 있다. 그러나 그 화에서 실제로 성립한 관계·호칭·직업/역할·거주·공개된 비밀·알게 된 사실은 다음 화가 되었다고 취소되지 않는다.\n- 예: 다음 화에서 연인이 되었다면 그 다음 화는 다시 썸/초면 상태로 돌아가지 않는다. 새 호칭을 쓰기로 했다면 이후에도 유지한다. 비밀을 알게 됐다면 특별한 기억상실 사건 없이 다시 모르는 상태가 되지 않는다.\n- 이번 화의 장소 이동, 옷, 일회성 행동 같은 장면 세부를 영구 규칙으로 만들지는 않는다. ‘한 번 실행할 지시’와 ‘실행 결과로 바뀐 현재 상태’를 구분한다.\n- 최근 확정 타임라인과 사용자 확정 지속 상태가 초기 플롯 설명과 충돌하면, 사용자가 명시적으로 리셋하지 않는 한 최근 확정 상태가 현재 시점의 진실이다.`;
  }

  function install(){
    if (window.__VELOUR_CONTINUITY_VOICE_GUARD__) return true;
    const qa = window.__VELOUR_STORAGE_QA__;
    if (!qa || typeof window.buildPrompt !== 'function' || typeof window.generateStory !== 'function') return false;
    // Wait until the existing final voice layer is present so this guard stays outermost.
    if (!window.__VELOUR_SCENE_VOICE_MEMORY_HOTFIX__ || !window.__VELOUR_CONTINUITY_COST_HOTFIX__) return false;

    window.__VELOUR_CONTINUITY_VOICE_GUARD__ = true;
    window.__VELOUR_CONTINUITY_VOICE_GUARD_VERSION__ = VERSION;

    const previousBuild = window.buildPrompt;
    window.buildPrompt = function(){
      const out = String(previousBuild.apply(this, arguments) || '');
      const state = snapshot();
      return `${out}\n${transitionSemanticsDirective()}\n${addressCanon(state)}\n${dialogueVariationDirective(state)}`.trim();
    };

    const previousGenerate = window.generateStory;
    window.generateStory = async function(isContinue = false){
      const direction = isContinue ? String(document.getElementById('v33Next')?.value || '').trim() : '';
      const before = Number(qa.confirmedEpisode?.() || snapshot()?.runtime?.confirmedEpisode || 0);
      const out = await previousGenerate.apply(this, arguments);
      const outcome = window.__VELOUR_LAST_GENERATION_OUTCOME__ || {};
      const after = Number(qa.confirmedEpisode?.() || snapshot()?.runtime?.confirmedEpisode || 0);
      const ep = Math.floor(Number(outcome.episode || outcome.attemptedEpisode || after || 0));
      if (isContinue && direction && outcome.status === 'committed' && ep > before) {
        promoteDurableTransitions(direction, ep);
      }
      return out;
    };

    const previousVaultAccept = window.acceptVelourVaultResponse;
    if (typeof previousVaultAccept === 'function') {
      window.acceptVelourVaultResponse = async function(){
        const direction = String(document.getElementById('v33Next')?.value || '').trim();
        const before = Number(qa.confirmedEpisode?.() || 0);
        const out = await previousVaultAccept.apply(this, arguments);
        const after = Number(qa.confirmedEpisode?.() || 0);
        if (direction && after > before) promoteDurableTransitions(direction, after);
        return out;
      };
    }

    window.__VELOUR_CONTINUITY_VOICE_GUARD_QA__ = {
      version: VERSION,
      lines,
      isDurableTransitionClause,
      normalizeTransition,
      promoteDurableTransitions,
      addressCanon,
      dialogueVariationDirective,
      transitionSemanticsDirective
    };
    console.info('✦ VELOUR durable transition / address / dialogue guard loaded');
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 300) clearInterval(timer);
  }, 80);
})();
