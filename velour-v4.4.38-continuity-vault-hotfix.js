'use strict';

/* VELOUR — continuity edge fixes loaded after continuity-hotfix.js */
(() => {
  'use strict';
  if (window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__) return;
  window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__ || {};
  const continuity = window.__VELOUR_CONTINUITY_QA__ || {};

  const STOPWORDS = new Set([
    '그리고','그러나','하지만','또한','그런데','이번','다음','현재','이후','이미','계속','정도','관련','상태','설정','캐논','하드','사용자','인물','장면','본문','사실','관계','서사','스토리','에피소드','episode','hard','canon','story'
  ]);
  const clean = (value, max = 280) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function canonLines(raw){
    return String(raw || '')
      .split(/\n+|(?<=[.!?。！？])\s+|\s*[;；]\s*/)
      .map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 40);
  }

  function keywords(raw){
    const words = String(raw || '').toLowerCase().match(/[가-힣a-z0-9_]{2,}/g) || [];
    return new Set(words.filter(w => !STOPWORDS.has(w)));
  }

  function relevanceScore(line, contextKeys){
    const keys = keywords(line);
    let score = 0;
    keys.forEach(k => { if (contextKeys.has(k)) score += k.length >= 4 ? 3 : 2; });
    if (/(?:절대|금지|아님|아니다|없음|없다|반드시|오직|만\s*(?:가능|허용))/.test(line) && score > 0) score += 2;
    return score;
  }

  // Kept for QA/backward compatibility. HARD CANON is no longer relevance-pruned.
  function selectiveCanon(state){
    const hard = String(state?.hardCanon || '').trim();
    if (!hard) return '';
    return `[HARD CANON 전체 원문 · 내부 제약]\n${hard}\n- 모든 줄은 장면 키워드 관련성과 무관하게 계속 유효하다. 본문에 필요 없는 설정은 설명하지 않되 사실 자체는 절대 버리지 않는다.`;
  }

  function stripLegacyBroadPreset(prompt, state){
    let out = String(prompt || '');
    if (state?.world || window.__VELOUR_V44_INSTALLED__) {
      // V2's broad selector contains examples such as campus/self-rental room.
      // V4 has an authoritative world axis, so the legacy example line must not
      // invent residence or semester facts.
      out = out.replace(/^\s*-\s*배경 세계관:\s*.*(?:\n|$)/gm, '');
    }
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }

  function reduceHardCanonExposure(prompt, state, isContinue){
    let out = String(prompt || '');
    const hard = String(state?.hardCanon || '').trim();
    if (!hard) return out;

    // HARD CANON must remain fully visible to the model on every episode.
    // “Do not recap it in prose” is a presentation rule, not permission to hide
    // canon from the prompt. If an older wrapper omitted it, restore it here.
    if (!out.includes(hard)) out = `${out}\n\n${selectiveCanon(state)}`;

    if (isContinue) {
      out = out.replace(
        /\[현재 HARD CANON에서 ‘이미 성립한 상태’로 읽어야 할 항목\]\n(?:- [^\n]*\n?)+/g,
        '- HARD CANON 중 조건 없는 초기 사실 또는 확정 본문에서 실제 성립한 상태만 내부 현재값으로 유지한다. 장면의 직접 원인이 아니면 본문에서 다시 설명하지 않는다.\n'
      );
    }

    out += `\n\n[HARD CANON EXPOSURE FIREWALL]\n- HARD CANON은 모순 방지용 내부 제약이지 매 화 독자에게 보여줄 설정집이 아니다. 원문 전체는 모델 내부에 항상 유지하고, 본문에서는 현재 장면에 필요한 사실만 자연스럽게 드러낸다.\n- 캐논 문구가 프롬프트에 보인다는 이유만으로 서술자 설명·설정 해설·관계사 복습에 넣지 않는다.\n- 거주지/주거 형태와 현재 장면 장소를 분리한다. 아파트·빌라·원룸·오피스텔, 옆집·윗집·아랫집·같은 건물 같은 확정 주거 사실은 사용자가 바꾸거나 확정 본문에서 실제 이사가 성립하기 전까지 유지한다. 외출·학교·회사·카페 장면은 이사 근거가 아니다.\n- 방학·학기 중·개강 전후·휴학·졸업·재학 같은 현재 시간/학사 상태도 확정 사실로 유지한다. 넓은 ‘캠퍼스’ 프리셋이나 시간 경과 추정만으로 방학을 개강으로 바꾸지 않는다.\n- ‘캠퍼스/대학 연구실/자취방’ 같은 레거시 장르 예시는 사실이 아니라 후보 예시다. 구체적인 HARD CANON과 충돌하면 반드시 HARD CANON을 따른다.\n- 단, 현재 장면에서 인물이 상대의 외형이나 몸에 실제로 반응하며 하는 자연스러운 칭찬·도발·더티톡은 설정 복창으로 취급하지 않는다. 아래 BODY PRAISE TALK 규칙을 따른다.\n- 이미 독자가 아는 외모·직업·가족·과거·관계·세계관을 서술자가 재소개하지 않는다. 현재 장면에서 새 정보가 아니면 설명문을 만들지 않는다.\n- 연속성은 설정 복창이 아니라 인물의 행동, 익숙한 루틴, 호칭, 거리감, 선택의 결과로 보여준다.`;
    return out.trim();
  }

  function relationshipProgressionDirective(){
    return `[CONDITIONAL CANON — 인물별 현재 상태와 미래 전개 분리]
- 인물 설정/HARD CANON의 권위는 유지하되 사실의 적용 시점을 구분한다. 초기·현재 사실, 미래 목표, 조건부 변화, 잠재 성향을 문맥으로 구별한다. 미래 관계가 적혀 있다는 사실은 현재 관계 성립의 증거가 아니다. 사용자가 별도 조건칸·반복 금지문을 작성할 필요는 없다.
- ‘몇 차례 촬영 후 매니저가 되고 이후 연인이 된다’는 순차 계획이다. 첫 화부터 매니저/연인으로 취급하거나 그 역할·호칭·행동을 앞당기지 않는다. 횟수·신뢰·합의 등 선행 조건을 실제 확정 사건에서 확인하고, 미확인 조건은 충족됐다고 발명하지 않는다.
- CANON STORYLINE이 있으면 현재 단계에서 허용한 사건만 실행한다. 미래 단계는 계획 참고이며 현재 상태가 아니다. 현재 단계 진입만으로 관계 전환이 완료되지는 않는다. 단계가 없으면 명시적 초기 설정과 실제 진행된 사건을 기준으로 자연스럽게 발전시킨다. 애매하면 현재 관계를 유지하며 필요한 과정을 쌓는다.
- 각 인물 쌍의 직업/역할, 친밀도, 관계 합의, 호칭, 알고 있는 정보를 독립적으로 판단한다. A와의 진전·합의·기억을 B/C에게 전파하지 않는다. 기존 relationshipState가 한 인물만 설명하면 다른 인물의 관계까지 같은 상태로 추정하지 않는다.
- 잠재적 취향·성향은 그 인물의 설정일 뿐 지금 실행할 지시가 아니다. 관련 관계와 장면의 맥락이 실제로 성립하기 전에는 해당 행동·대사·암시를 의무적으로 넣지 않는다. 인물의 기본 성격은 유지하되 미래의 친밀 관계를 선행 실행하지 않는다.
- 처음부터 이미 성립했다고 명시된 관계와 실제 확정 본문에서 성립한 관계는 유지한다. 미래 설정 차단을 이유로 기존 관계를 초기화하거나 전환 장면을 반복하지 않는다.
- 관계 전환은 현재 단계 안에서 본문에 실제로 성립한 뒤에만 relationshipState/timeline/durableFacts에 현재 사실로 기록한다. 인물 이름 또는 인물 쌍을 명시하고, 영향을 받지 않은 인물의 기존 상태도 보존한다. 미래 계획·미충족 조건·잠재 성향을 완료 사실로 저장하지 않는다.
- 사용자 확정 지속 상태도 문장에 미래 조건이 있으면 성립 증거가 아니다. 동일 인물 쌍의 같은 속성이 실제로 변경됐을 때만 최신 확정 상태를 적용한다. 인물 쌍이 불명확하면 다른 인물의 사실을 덮어쓰지 않는다.
- 출력 전 현재 단계와 인물별 성립 근거를 점검한다. 미래 관계 선행은 futureBeatLeak, 단계 건너뜀은 storylineSkipped, 설정 모순은 canonViolation에 정직하게 표시한다.`;
  }

  function bodyPraiseDialogueDirective(state){
    const richness = String(state?.bodyDescriptionRichness || 'rich').toLowerCase();
    const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));
    const rich = /rich|high|very_high|max|lush/.test(richness);
    const medium = /medium|balanced|normal/.test(richness);
    const density = rich ? '친밀감·욕망이 활성화된 장면에서는 외형/몸에 대한 직접 반응 대사를 높은 우선순위 후보로 사용하되 장면마다 횟수를 의무 할당하지 않는다. 지금 실제로 보이거나 접촉·자세·옷차림 때문에 강조된 특징이 있을 때 자연스럽게 선택한다.' : medium ? '친밀 장면에서는 외형/몸 반응 대사를 장면 맥락이 만들 때 자연스럽게 선택하고, 최근에 같은 부위·같은 평가를 썼다면 다른 관찰이나 다른 대화 기능으로 전환한다.' : '외형 칭찬 대사는 장면상 자연스러울 때만 드물게 사용한다.';
    return `[BODY PRAISE TALK — 외형 묘사 풍부도의 실제 의미]\n- bodyDescriptionRichness=${richness}는 서술자의 신체 설명량이 아니라 “상대방이 상대의 외형/몸을 보고 느끼며 입 밖으로 표현하는 밀도”를 뜻한다.\n- ${density}\n- 기본은 쌍방이다. 남주→여주뿐 아니라 여주→남주도 각자의 성격과 욕망에 맞게 칭찬·감탄·도발·질문·반응형 대사를 한다. 한쪽만 계속 평가자처럼 말하지 않는다.\n- 더티톡 강도=${dirty}/100과 결합한다. 수위가 높을수록 외형 칭찬도 단순 미사여구보다 지금 보고 있거나 만지고 있는 부분, 상대 반응, 움직임과 연결된 직접적인 대사로 만든다.\n- 같은 고정 특징을 매번 같은 말로 복창하지 않는다. “너는 원래 ~한 체형이야” 같은 설정문 낭독이 아니라 그 순간의 시선·접촉·반응 때문에 튀어나오는 말이어야 한다.\n- 서술자는 대사를 받쳐주는 최소한의 시선·표정·움직임만 쓴다. 외형 설정을 대신 설명하는 해설 문단으로 되돌아가지 않는다.\n- 컵 문자·cm·정확한 치수는 사용자가 이번 화에 직접 요구하지 않는 한 대사에서도 설정표처럼 읊지 않는다.\n- 비친밀 장면에서는 외형 칭찬을 의무적으로 끼워 넣지 않는다. 맥락 없는 칭찬 때문에 사건 흐름을 끊지 않는다.`;
  }

  // Response Vault buttons call qa.updateMemory() through their lexical handler.
  // Wrap that bridge so a user-authored persistent direction is promoted even
  // when the response is accepted from the vault rather than normal generation.
  const previousUpdateMemory = qa.updateMemory;
  if (typeof previousUpdateMemory === 'function' && !qa.__velourCarryPromotionWrapped) {
    qa.__velourCarryPromotionWrapped = true;
    qa.updateMemory = function(meta, ep, userDirection){
      const out = previousUpdateMemory.apply(this, arguments);
      const n = Number(ep || 0);
      if (userDirection && Number.isFinite(n) && n > 0 && typeof continuity.promoteCommittedDirection === 'function') {
        continuity.promoteCommittedDirection(String(userDirection), Math.floor(n));
      }
      return out;
    };
  }

  // Keep bounded instructions bounded: “3개월간/몇 주 동안” remains active
  // for that stated duration/condition rather than forever.
  const previousBuild = window.buildPrompt;
  if (typeof previousBuild === 'function') {
    window.buildPrompt = function(isContinue = false){
      let out = String(previousBuild.apply(this, arguments) || '');
      const state = snapshot();
      out = stripLegacyBroadPreset(out, state);
      out = out.replace(
        '사용자가 종료·변경하기 전까지 계속 참인 현재 조건으로 취급한다.',
        '사용자가 종료·변경하거나 문장에 명시된 기간·조건이 끝날 때까지 현재 조건으로 취급한다.'
      );

      // Memory exists to preserve the current baseline, not to make the prose
      // repeatedly prove that it remembers prior episodes.
      if (isContinue) {
        out = `${out}\n\n[CONTINUITY USE — 기억은 내부 기준, 본문은 현재 진행]\n- LONGFORM MEMORY, HARD CANON, 과거 아크와 타임라인은 작가용 내부 참고자료다. 기억하고 있다는 사실을 독자에게 증명하려고 매 화 과거를 요약·복습·나열하지 않는다.\n- 기본값은 현재 시점의 장면과 새 진행이다. 사용자 직접 회상/플래시백 요청이나 현재 장면의 핵심 목적이 과거 사건을 다루는 경우가 아니라면, 명시적인 과거 회상·관계사 요약은 본문 전체의 5% 안팎 이하로 제한하고 가능하면 더 적게 쓴다.\n- 직전 화 연결에 과거 언급이 필요해도 장황한 recap 문단을 만들지 않는다. 필요한 사실 1개를 1~2문장 안에서 현재 행동·대사·감정의 원인으로만 연결하고 곧바로 현재 장면으로 돌아온다.\n- 여러 과거 사건을 차례로 열거하거나 “그동안/돌이켜보면/처음부터 지금까지” 식으로 관계사를 다시 설명하지 않는다. 이미 독자가 본 사건은 설명 대상이 아니다.\n- 연속성은 회상문이 아니라 달라진 기본 상태로 보여준다. 익숙한 행동, 이미 형성된 루틴, 호칭과 거리감, 누적된 신뢰·경계·욕망, 이전 선택의 후속 행동처럼 현재 장면에 자연스럽게 스며들게 한다.\n- 과거 사실이 현재 선택에 아무 영향도 주지 않으면 본문에서 언급하지 않아도 된다. 기억에서 삭제하는 것과 본문에서 말하지 않는 것은 다르다.\n- 한 화의 중심은 현재의 사건·상호작용·빌드업·새로운 선택이다. 과거 설명 때문에 현재 CANON 단계의 SETUP→BUILD→PAYOFF나 새 장면 분량을 잠식하지 않는다.`.trim();
      }

      // On a brand-new story, do not pay for the extra continuity semantics block
      // unless HARD CANON actually contains an already-settled state that needs it.
      if (!isContinue && typeof continuity.settledCanonLines === 'function') {
        let settled = [];
        try { settled = continuity.settledCanonLines(state); } catch (_) {}
        if (!settled.length) {
          out = out.replace(/\n\n\[VELOUR CONTINUITY SEMANTICS — RESET 금지\][\s\S]*$/,'').trim();
        }
      }

      out = reduceHardCanonExposure(out, state, isContinue);
      out = `${out}\n\n${bodyPraiseDialogueDirective(state)}\n\n${relationshipProgressionDirective()}`.trim();
      window.__VELOUR_LAST_SELECTIVE_CANON__ = {
        enabled: false,
        mode: 'full-hard-canon',
        originalChars: String(state?.hardCanon || '').length,
        injected: selectiveCanon(state),
        bodyPraiseRichness: String(state?.bodyDescriptionRichness || 'rich'),
        at: new Date().toISOString()
      };
      return out;
    };
  }

  window.__VELOUR_SELECTIVE_CANON_QA__ = {
    relationshipProgressionDirective,
    canonLines,
    keywords,
    relevanceScore,
    selectiveCanon,
    stripLegacyBroadPreset,
    reduceHardCanonExposure,
    bodyPraiseDialogueDirective
  };

  window.__VELOUR_CONTINUITY_COST_VERSION__ = '1.4.0';
  console.info('✦ VELOUR full HARD CANON + continuity vault fix loaded');
})();
