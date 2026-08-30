'use strict';

/* VELOUR — long-run continuity + prompt cost hotfix
   - no extra Gemini call
   - interprets settled HARD CANON as already-established state, not a scene to replay
   - promotes durable user next-episode directions only after a committed episode
   - compacts redundant longform context while retaining durable continuity
*/
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_COST_HOTFIX__) return;
  window.__VELOUR_CONTINUITY_COST_HOTFIX__ = true;
  window.__VELOUR_CONTINUITY_COST_VERSION__ = '1.0.0';

  const qa = window.__VELOUR_STORAGE_QA__ || {};
  const USER_FACT_PREFIX = '[사용자 확정 지속 상태';
  const MAX_USER_FACTS_IN_PROMPT = 12;
  const MAX_OTHER_DURABLE_IN_PROMPT = 6;
  const HANDOFF_TAIL_CHARS = 1550;

  const clone = value => JSON.parse(JSON.stringify(value || {}));
  const clean = (value, max = 220) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const compactKey = value => clean(value, 220).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function confirmedEpisode(){
    try {
      const n = Number(qa.confirmedEpisode?.() || snapshot()?.runtime?.confirmedEpisode || 0);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    } catch (_) { return 0; }
  }

  function lineCandidates(raw){
    return String(raw || '')
      .split(/\n+|(?<=[.!?。！？])\s+|\s*[;；]\s*/)
      .map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 24);
  }

  function settledCanonLines(state){
    const hard = String(state?.hardCanon || '');
    const settled = /(?:하기로\s*(?:함|했다|했음|결정|합의)|하게\s*(?:됨|됐다|되었|되기로)|시작(?:함|했다|했음|하기로)|합의(?:함|했다|됨)?|결정(?:함|했다|됨)?|약속(?:함|했다|됨)?|계약(?:함|했다|체결)|맡기로|배우기로|가르치기로|사귀기로|동거하기로|과외하기로|연재하기로|근무하기로)/i;
    return lineCandidates(hard).filter(line => settled.test(line)).slice(-10);
  }

  const PERSISTENT_CUE = /(?:앞으로|이후(?:에도|부터)?|계속|계속해서|지속|유지|반복|정기(?:적)?|상시|장기|당분간|한동안|내내|매(?:일|주|달|월|번)|주\s*\d+\s*회|월\s*\d+\s*회|몇\s*(?:주|달|개월)|수\s*개월|수개월|\d+\s*(?:주|개월|달)\s*(?:간|동안)|동안)/i;
  const SETTLED_CUE = /(?:하기로\s*(?:함|했다|했음|결정|합의)|하게\s*(?:됨|됐다|되었|되기로)|시작(?:함|했다|했음|하기로)|합의(?:함|했다)?|결정(?:함|했다)?|약속(?:함|했다)?|계약(?:함|했다|체결)?|맡기로|배우기로|가르치기로|사귀기로|동거하기로)/i;
  const ONGOING_DOMAIN = /(?:과외|수업|레슨|훈련|연습|상담|치료|프로젝트|연재|업무|근무|출근|동거|연애|사귀|계약|경호|보호|돌봄|방문|연락|만남|정기적으로)/i;
  const ONE_SHOT = /(?:이번\s*화|다음\s*화|오늘|내일|그날|이번만|한\s*번|1회|잠깐|잠시)/i;
  const END_CUE = /(?:그만두|그만하|중단|종료|끝내|취소|해지|관두|더\s*이상[^.!?]{0,30}(?:않|안\s*하)|하지\s*않기로|안\s*하기로|쉬기로)/i;
  const CHANGE_CUE = /(?:변경|바꾸|조정|줄이|늘리|주\s*\d+\s*회|월\s*\d+\s*회)/i;

  const TOPICS = [
    ['과외', /과외|개인\s*수업/], ['수업', /수업|레슨/], ['훈련', /훈련|연습/], ['상담', /상담/],
    ['치료', /치료/], ['프로젝트', /프로젝트|공동\s*작업/], ['연재', /연재/], ['근무', /근무|출근|직장/],
    ['동거', /동거|같이\s*살/], ['연애', /연애|사귀/], ['계약', /계약/], ['경호', /경호|보호/],
    ['돌봄', /돌봄|간병|보살피/], ['방문', /방문|찾아오|찾아가/], ['연락', /연락/], ['만남', /만남|만나기로/]
  ];

  function topicOf(text){
    for (const [id, rx] of TOPICS) if (rx.test(String(text || ''))) return id;
    return '';
  }

  function isDurableUserClause(clause){
    const text = clean(clause, 360);
    if (!text || text.length < 5) return false;
    const persistent = PERSISTENT_CUE.test(text);
    const settled = SETTLED_CUE.test(text);
    const domain = ONGOING_DOMAIN.test(text);
    if (ONE_SHOT.test(text) && !persistent && !settled) return false;
    if (END_CUE.test(text) && (domain || topicOf(text))) return true;
    return persistent || settled || (domain && /(?:하기로|하게\s*됐|하게\s*됨|시작)/.test(text));
  }

  function normalizedCommittedFact(clause, ep){
    let text = clean(clause, 300);
    text = text
      .replace(/다음\s*화부터/g, `EP${ep}부터`)
      .replace(/이번\s*화부터/g, `EP${ep}부터`)
      .replace(/다음\s*화에서/g, `EP${ep}에서`)
      .replace(/이번\s*화에서/g, `EP${ep}에서`)
      .replace(/다음\s*화에/g, `EP${ep}에`)
      .replace(/이번\s*화에/g, `EP${ep}에`);
    return clean(`${USER_FACT_PREFIX} · EP${ep}] ${text}`, 360);
  }

  function factPayload(text){
    return clean(String(text || '').replace(/^\[사용자 확정 지속 상태[^\]]*\]\s*/, ''), 300);
  }

  function promoteCommittedDirection(rawDirection, ep){
    const clauses = lineCandidates(rawDirection).filter(isDurableUserClause);
    if (!clauses.length || !ep) return [];
    const state = snapshot();
    state.runtime = Object.assign({}, state.runtime || {});
    let facts = Array.isArray(state.runtime.durableFacts) ? state.runtime.durableFacts.map(String).filter(Boolean) : [];
    const added = [];

    for (const clause of clauses) {
      const topic = topicOf(clause);
      const replacing = END_CUE.test(clause) || CHANGE_CUE.test(clause);
      if (topic && replacing) {
        const topicRx = TOPICS.find(([id]) => id === topic)?.[1];
        if (topicRx) facts = facts.filter(f => !String(f).startsWith(USER_FACT_PREFIX) || !topicRx.test(factPayload(f)));
      }
      const next = normalizedCommittedFact(clause, ep);
      const key = compactKey(factPayload(next));
      if (!key || facts.some(f => compactKey(factPayload(f)) === key)) continue;
      facts.push(next);
      added.push(next);
    }

    if (!added.length) return [];
    const userFacts = facts.filter(f => String(f).startsWith(USER_FACT_PREFIX)).slice(-20);
    const modelFacts = facts.filter(f => !String(f).startsWith(USER_FACT_PREFIX)).slice(-20);
    state.runtime.durableFacts = [...modelFacts, ...userFacts].slice(-32);
    try { window.__VELOUR_V4_STATE_RESTORE__?.(state); } catch (_) { return []; }
    try { window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(state); } catch (_) {}
    window.__VELOUR_LAST_USER_CARRY_PROMOTION__ = { episode: ep, added: clone(added), at: new Date().toISOString() };
    return added;
  }

  function compactLongformMemory(state){
    const runtime = state?.runtime || {};
    const durableAll = Array.isArray(runtime.durableFacts) ? runtime.durableFacts.map(x => clean(x, 170)).filter(Boolean) : [];
    const userDurable = durableAll.filter(x => String(x).startsWith(USER_FACT_PREFIX)).slice(-MAX_USER_FACTS_IN_PROMPT);
    const otherDurable = durableAll.filter(x => !String(x).startsWith(USER_FACT_PREFIX)).slice(-MAX_OTHER_DURABLE_IN_PROMPT);
    const durable = [...otherDurable, ...userDurable];
    const arcs = (Array.isArray(runtime.arcSummaries) ? runtime.arcSummaries : []).slice(-3);
    const timeline = (Array.isArray(runtime.timeline) ? runtime.timeline : []).slice(-7).map(x => clean(x, 170)).filter(Boolean);
    const threads = (Array.isArray(runtime.openThreads) ? runtime.openThreads : []).slice(-6).map(x => clean(x, 145)).filter(Boolean);
    const scenes = (Array.isArray(runtime.scenes) ? runtime.scenes : []).slice(-2);

    return `[LONGFORM MEMORY — COST-AWARE 3-TIER]
[TIER 0 · USER-ESTABLISHED CONTINUING STATE]
${userDurable.length ? userDurable.map(x => `- ${x}`).join('\n') : '- 별도 자동 승격된 지속 상태 없음.'}
- 이 항목은 사용자가 직접 지정했고 확정 화가 성공한 뒤 저장된 상태다. 새 사건 제안보다 우선하며, 사용자가 종료·변경하기 전까지 계속 참인 현재 조건으로 취급한다.
- ‘과외하기로 함/동거하기로 함/계약함/시작함’처럼 이미 성립한 전환은 매 화 다시 결정하거나 첫날로 되돌리지 않는다. 누적된 횟수와 관계를 이어간다.

[TIER 1 · DURABLE FACTS]
${durable.length ? durable.map(x => `- ${x}`).join('\n') : '- 추가 장기 사실 없음.'}

[TIER 2 · ARCHIVED ARC MEMORY]
${arcs.length ? arcs.map(a => `- EP${a?.startEpisode || '?'}~${a?.endEpisode || '?'}: ${clean(a?.summary || '', 440)}`).join('\n') : '- 완결된 과거 아크 요약 없음.'}
- 이미 지나간 사건은 역사다. 현재 화에서 처음 일어난 일처럼 재연하지 않는다.

[TIER 3 · RECENT ACTIVE MEMORY]
${timeline.length ? `최근 확정 타임라인:\n${timeline.map(x => `- ${x}`).join('\n')}` : '최근 확정 타임라인 없음.'}
- 현재 관계 상태: ${clean(runtime.relationshipState || '초기값', 180)}
- 직전 인과 연결고리: ${clean(runtime.causalCarry || '없음', 180)}
${threads.length ? `미회수 복선/약속/갈등:\n${threads.map(x => `- ${x}`).join('\n')}` : '미회수 복선/약속/갈등 없음.'}
${scenes.length ? `최근 장면 지문:\n${scenes.map(s => `- EP${s?.episode || '?'} | ${clean(s?.location || '?', 45)} | 목적 ${clean(s?.purpose || '?', 65)} | 엔딩 ${clean(s?.ending || '?', 55)}`).join('\n')}` : '최근 장면 지문 없음.'}
- 우선순위: 사용자 인물 설정/HARD CANON > CANON STORYLINE > 이번 화 사용자 지시 > 사용자 확정 지속 상태 > 기타 장기 사실 > 과거 아크 > 최근 메모리 > 즉흥 아이디어.`;
  }

  function stateSemanticsDirective(state){
    const settled = settledCanonLines(state);
    return `[VELOUR CONTINUITY SEMANTICS — RESET 금지]
- ‘상황 & 서사적 갈등’, 초기 플롯/서사 단계는 작품의 출발 조건이다. 이어쓰기에서는 최근 확정 타임라인·관계 상태·사용자 확정 지속 상태가 현재 시점의 진실이다. 사용자가 초기 상황 칸을 매 화 수정하지 않아도 된다.
- HARD CANON의 완료형·상태형 표현(예: ‘~하기로 함’, ‘~했다’, ‘~하게 됨’, ‘~시작함’)은 이미 성립한 사실이다. 그 합의·결정·첫 시작을 새 사건처럼 반복하지 말고 그 이후 누적 상태에서 진행한다.
- ‘과외하기로 함’이 있고 이미 1회차가 본문에서 끝났다면 다음 화는 2회차 이후다. 캐논에 ‘과외하기로 함’ 문장이 계속 보인다는 이유로 매번 과외 첫날을 다시 쓰지 않는다.
- ‘다음 화 추가 지시’는 기본적으로 1회성이다. 다만 몇 주/몇 달간 지속, 계속/정기/유지, 합의·계약·시작처럼 지속성이 명백한 사용자의 지시는 확정 성공 뒤 장기 사실로 승격되며 이후에도 유지한다.
${settled.length ? `[현재 HARD CANON에서 ‘이미 성립한 상태’로 읽어야 할 항목]\n${settled.map(x => `- ${clean(x, 220)}`).join('\n')}` : '- HARD CANON에서 별도 추출된 완료형 상태 항목 없음.'}`;
  }

  function shortenHandoffTail(prompt){
    const rx = /(\[CONTINUATION HANDOFF LOCK[^\n]*\]\s*\n직전 확정 본문의 마지막 부분:\s*\n---\s*\n)([\s\S]*?)(\n---)/;
    return String(prompt || '').replace(rx, (all, head, body, tail) => {
      const src = String(body || '').trim();
      if (src.length <= HANDOFF_TAIL_CHARS) return all;
      return `${head}[앞부분 생략 · 구조화 메모리로 대체]\n…${src.slice(-HANDOFF_TAIL_CHARS)}${tail}`;
    });
  }

  function replaceLongformMemory(prompt, state){
    const marker = '[LONGFORM MEMORY — 3-TIER]';
    const next = '[EPISODE PURPOSE — ‘진전 강박’ 금지]';
    const src = String(prompt || '');
    const start = src.indexOf(marker);
    if (start < 0) return src;
    const end = src.indexOf(next, start);
    if (end < 0) return src;
    return src.slice(0, start) + compactLongformMemory(state) + '\n\n' + src.slice(end);
  }

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild === 'function') {
    window.buildPrompt = function(isContinue = false){
      const before = String(previousBuild(isContinue) || '');
      const state = snapshot();
      let out = shortenHandoffTail(before);
      out = replaceLongformMemory(out, state);
      out = `${out}\n\n${stateSemanticsDirective(state)}`.trim();
      window.__VELOUR_CONTINUITY_PROMPT_STATS__ = {
        beforeChars: before.length,
        afterChars: out.length,
        savedChars: Math.max(0, before.length - out.length),
        confirmedEpisode: confirmedEpisode(),
        at: new Date().toISOString()
      };
      return out;
    };
  }

  const previousGenerate = window.generateStory;
  if (typeof previousGenerate === 'function') {
    window.generateStory = async function(isContinue = false){
      const direction = isContinue ? String(document.getElementById('v33Next')?.value || '').trim() : '';
      const beforeEp = confirmedEpisode();
      const out = await previousGenerate.apply(this, arguments);
      const outcome = window.__VELOUR_LAST_GENERATION_OUTCOME__ || {};
      const afterEp = confirmedEpisode();
      const committedEp = Number(outcome.episode || outcome.attemptedEpisode || afterEp || 0);
      if (isContinue && direction && outcome.status === 'committed' && committedEp > beforeEp) {
        promoteCommittedDirection(direction, committedEp);
      }
      return out;
    };
  }

  const previousVaultAccept = window.acceptVelourVaultResponse;
  if (typeof previousVaultAccept === 'function') {
    window.acceptVelourVaultResponse = async function(id){
      const direction = String(document.getElementById('v33Next')?.value || '').trim();
      const beforeEp = confirmedEpisode();
      const out = await previousVaultAccept.apply(this, arguments);
      const afterEp = confirmedEpisode();
      if (direction && afterEp > beforeEp) promoteCommittedDirection(direction, afterEp);
      return out;
    };
  }

  window.__VELOUR_CONTINUITY_QA__ = {
    settledCanonLines,
    isDurableUserClause,
    normalizedCommittedFact,
    promoteCommittedDirection,
    compactLongformMemory,
    stateSemanticsDirective,
    shortenHandoffTail,
    replaceLongformMemory
  };

  console.info('✦ VELOUR long-run continuity + prompt cost hotfix loaded');
})();
