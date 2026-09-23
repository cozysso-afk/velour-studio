'use strict';

/* VELOUR — contextual intimate-dialogue engine.
   Consolidates overlapping dirty-talk guidance into one context-aware layer,
   tracks recent dialogue functions without re-injecting raw lines, and keeps
   canon / relationship / scene-continuity rules authoritative.
*/
(() => {
  'use strict';
  if (window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__) return;

  const VERSION = '1.0.0';
  const MAX_RECENT_DIALOGUE = 24;
  const STORY_TAIL_CHARS = 24000;

  const LABELS = {
    reaction_comment: '상대 반응 받아치기',
    observation: '현재 표정·행동 관찰',
    tease_banter: '도발·장난·티키타카',
    question_probe: '질문·확인·말하게 만들기',
    emotion_reveal: '감정 노출',
    relationship_reference: '둘 사이 관계·누적 서사 언급',
    body_praise: '현재 보이는 외형·움직임 반응',
    boundary_coordination: '속도·거리·의사 조율',
    reassurance: '안심·돌봄',
    direct_desire: '직접적인 욕망 표현',
    sensory_report: '감각 상태 보고',
    release_forecast: '장면 결말·절정 예고',
    command_request: '명령·요구'
  };

  const clean = (value, max = 220) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function storyText(){
    const parts = [];
    try {
      if (typeof storyHistory !== 'undefined' && storyHistory) parts.push(String(storyHistory));
    } catch (_) {}
    try {
      const visible = String(document.getElementById('novelText')?.innerText || '').trim();
      if (visible) parts.push(visible);
    } catch (_) {}
    return parts.join('\n').slice(-STORY_TAIL_CHARS);
  }

  function extractRecentDialogue(raw){
    const text = String(raw || '');
    const hits = [];
    const patterns = [
      /“([^”\n]{2,180})”/g,
      /"([^"\n]{2,180})"/g,
      /「([^」\n]{2,180})」/g,
      /『([^』\n]{2,180})』/g,
      /‘([^’\n]{2,180})’/g
    ];
    for (const re of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const value = clean(m[1], 180);
        if (value) hits.push({ index:m.index, value });
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
    }
    hits.sort((a,b) => a.index - b.index);
    const out = [];
    const seen = new Set();
    for (const row of hits) {
      const key = row.value.replace(/[\s\p{P}\p{S}]+/gu, '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(row.value);
    }
    return out.slice(-MAX_RECENT_DIALOGUE);
  }

  function classifyDialogue(raw){
    const s = clean(raw, 220);
    if (!s) return 'reaction_comment';

    // Classification happens only in JS. These lexical cues are never copied
    // into the model prompt; the prompt receives category counts only.
    if (/(?:사정|절정|오르가|싸(?:고|줘|도|버|겠)|쌀\s*것|가버릴\s*것)/i.test(s)) return 'release_forecast';
    if (/(?:괜찮|천천히|잠깐|멈춰|아프|싫어|하지\s*마|계속해|조금만|약하게|세게)/i.test(s)) return 'boundary_coordination';
    if (/(?:미안|괜찮아|걱정|무서워하지|안심|천천히\s*해도|기다릴게)/i.test(s)) return 'reassurance';
    if (/(?:좋아해|사랑해|보고\s*싶|질투|서운|그리웠|놓치기\s*싫|신경\s*쓰였)/i.test(s)) return 'emotion_reveal';
    if (/(?:우리|사귀|연인|남자친구|여자친구|처음\s*만났|예전|그때|약속)/i.test(s)) return 'relationship_reference';
    if (/(?:원해|하고\s*싶|갖고\s*싶|안고\s*싶|키스하고\s*싶)/i.test(s)) return 'direct_desire';
    if (/(?:예쁘|멋있|잘생|귀엽|섹시|눈|입술|목|어깨|손|허리|다리|가슴|엉덩|표정)/i.test(s) && /(?:예쁘|멋있|잘생|귀엽|섹시|좋|미치|눈을?\s*못\s*떼)/i.test(s)) return 'body_praise';
    if (/(?:뜨거|젖|저려|떨려|느껴|감각|숨\s*막|정신\s*없|머리\s*하얘|미치겠)/i.test(s)) return 'sensory_report';
    if (/[?？]\s*$/.test(s) || /^(?:왜|뭐|어디|어떻게|진짜|알아|기억해|말해봐)/i.test(s)) return 'question_probe';
    if (/(?:놀리|장난|뻔뻔|모르는\s*척|웃기|또\s*그러|이제\s*와서)/i.test(s)) return 'tease_banter';
    if (/(?:봐|말해|와|기다려|가만히|움직이지|해봐|해줘|잡아)/i.test(s)) return 'command_request';
    if (/(?:보여|표정|숨소리|목소리|떨고|피하|쳐다보|웃고|멈칫|긴장)/i.test(s)) return 'observation';
    return 'reaction_comment';
  }

  function sentenceForm(raw){
    const s = clean(raw, 220);
    if (!s) return 'other';
    if (/[?？]\s*$/.test(s)) return 'question';
    if (/(?:해|해봐|하지\s*마|봐|말해|와|기다려|멈춰|줘)\s*[.!…]*$/i.test(s)) return 'imperative';
    if (s.length <= 12) return 'fragment';
    return 'declarative';
  }

  function summarizeRecentDialogue(lines){
    const counts = {};
    const forms = {};
    const sequence = [];
    for (const line of lines.slice(-18)) {
      const category = classifyDialogue(line);
      const form = sentenceForm(line);
      counts[category] = (counts[category] || 0) + 1;
      forms[form] = (forms[form] || 0) + 1;
      sequence.push(category);
    }
    const overused = Object.keys(counts)
      .filter(key => counts[key] >= 3)
      .sort((a,b) => counts[b] - counts[a]);
    if (sequence.length >= 2 && sequence.at(-1) === sequence.at(-2) && !overused.includes(sequence.at(-1))) {
      overused.unshift(sequence.at(-1));
    }
    return { counts, forms, sequence, overused };
  }

  function stageKind(){
    const value = String(document.getElementById('selectStage')?.value || '');
    if (/여운|애프터|후일담/i.test(value)) return 'after';
    if (/텐션\s*폭발|결합|절정/i.test(value)) return 'intense';
    if (/빌드업|감정선|심리전/i.test(value)) return 'buildup';
    return 'general';
  }

  function basePriorities(kind){
    if (kind === 'buildup') return [
      'observation','tease_banter','question_probe','reaction_comment','emotion_reveal',
      'relationship_reference','body_praise','direct_desire','boundary_coordination','sensory_report','command_request','release_forecast'
    ];
    if (kind === 'intense') return [
      'reaction_comment','boundary_coordination','body_praise','direct_desire','emotion_reveal',
      'tease_banter','question_probe','observation','command_request','sensory_report','relationship_reference','release_forecast'
    ];
    if (kind === 'after') return [
      'reassurance','emotion_reveal','tease_banter','relationship_reference','reaction_comment',
      'question_probe','observation','body_praise','boundary_coordination','direct_desire','sensory_report','release_forecast'
    ];
    return [
      'reaction_comment','observation','question_probe','tease_banter','emotion_reveal',
      'relationship_reference','body_praise','boundary_coordination','direct_desire','command_request','sensory_report','release_forecast'
    ];
  }

  function rankedPriorities(state, recent){
    const kind = stageKind();
    const base = basePriorities(kind);
    const praise = String(state?.bodyPraiseDirtyTalk || 'high').toLowerCase();
    const last = recent.sequence.at(-1);
    const previous = recent.sequence.at(-2);
    const rows = base.map((key, index) => {
      let score = (base.length - index) * 3;
      score -= (recent.counts[key] || 0) * 4;
      if (last === key) score -= 7;
      if (last === key && previous === key) score -= 7;
      if (recent.overused.includes(key)) score -= 8;
      if (key === 'body_praise' && /high|very_high|max/.test(praise)) score += 2;
      if (key === 'release_forecast') {
        score -= kind === 'intense' ? 7 : 24;
        if ((recent.counts[key] || 0) > 0) score -= 12;
      }
      if (key === 'sensory_report' && (recent.counts[key] || 0) >= 2) score -= 8;
      return { key, score };
    });
    rows.sort((a,b) => b.score - a.score);
    return rows.map(x => x.key);
  }

  function formatCounts(recent){
    const rows = Object.entries(recent.counts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 7)
      .map(([key,count]) => `${LABELS[key] || key} ${count}`);
    return rows.length ? rows.join(' · ') : '최근 확정 대사 기록 부족';
  }

  function stripBlock(raw, heading){
    let out = String(raw || '');
    const marker = `\n[${heading}]`;
    let start = out.indexOf(marker);
    while (start >= 0) {
      const next = out.indexOf('\n[', start + marker.length);
      out = next >= 0 ? out.slice(0, start) + out.slice(next) : out.slice(0, start);
      start = out.indexOf(marker);
    }
    return out;
  }

  function stripLegacyDialogueDirectives(raw){
    let out = String(raw || '');
    out = stripBlock(out, 'DIALOGUE FUNCTION ROTATION — 더티톡 수위와 빈도 분리');
    out = stripBlock(out, 'INTIMATE SCENE ANTI-REPETITION LOCK — 장소·구도·대사 기본값 회피');
    // Older quality/body-praise layers repeat the same intensity/frequency rule.
    // Keep those blocks, but remove their duplicate dirty-talk control sentence.
    out = out.replace(/\n- 더티톡 강도=\d+\/100, 빈도=\d+\/100[^\n]*/g, '');
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }

  function sceneVarietyDirective(state){
    const enabledPatterns = Array.isArray(state?.intimacyPatterns) && state.intimacyPatterns.length
      ? state.intimacyPatterns.join(', ')
      : '사용자 설정에서 허용된 구도';
    return `\n[INTIMATE SCENE VARIETY — 장소·구도 반복 방지]\n- 사용자 설정과 HARD CANON의 범위를 넓히지 않는다. 현재 허용 구도=${enabledPatterns}.\n- 최근 친밀 장면과 같은 장소군·같은 몸 방향·같은 시작 동선을 자동 기본값으로 재사용하지 않는다. 서사상 자연스러운 대안이 있으면 덜 쓴 축을 우선한다.\n- 이름만 다른 같은 방향의 구도는 하나의 가족으로 본다. 최근 핵심 방향과 같은 가족은 다음 친밀 장면에서 우선순위를 낮춘다.\n- 한 장면에서 다양성 개수를 채우듯 계속 바꾸지 않는다. 1~2개의 중심 구도를 충분히 전개하고, 공간·감정·상대 반응이 실제 전환 이유를 만들 때만 이동한다.\n- 최근 반복 회피보다 캐릭터 성격, 현재 관계 단계, 물리적 동선, 직전 장면의 연속성과 사용자의 이번 화 직접 지시가 우선이다.`;
  }

  function contextualDialogueDirective(state, recent){
    const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));
    const frequency = Math.max(0, Math.min(100, Number(state?.dirtyTalkFrequency ?? 70)));
    const ranked = rankedPriorities(state, recent);
    const preferred = ranked.slice(0, 5).map(key => LABELS[key] || key).join(' → ');
    const downranked = recent.overused.length
      ? recent.overused.slice(0, 4).map(key => LABELS[key] || key).join(' · ')
      : '없음';
    const forms = Object.entries(recent.forms).sort((a,b) => b[1] - a[1]).map(([k,v]) => `${k} ${v}`).join(' · ') || '기록 부족';

    return `\n[CONTEXTUAL DIALOGUE ENGINE — 상황 반응형 대사]\n- 더티톡 강도=${dirty}/100은 “선택된 대사 기능을 얼마나 직접적으로 말할 수 있는가”의 상한이다. 더티톡 빈도=${frequency}/100은 친밀 장면에서 그런 대사가 자연스럽게 등장하는 성향이다. 강도나 빈도가 높아도 한 기능을 반복하라는 뜻이 아니다.\n- 대사를 쓰기 직전에 내부적으로 세 가지만 정한다: TRIGGER=상대가 방금 한 말·표정·행동, INTENT=이번 한마디의 목적, VOICE=그 캐릭터 특유의 문장 길이·직접성·호칭. 이 내부 라벨은 본문에 출력하지 않는다.\n- 모든 친밀 대사는 독립적인 욕망 문구가 아니라 직전 TRIGGER에 대한 실제 반응이어야 한다. 상대가 아무것도 하지 않았는데 범용적인 성적 문장을 삽입해 장면을 강제로 뜨겁게 만들지 않는다.\n- 이번 장면에서 우선 고려할 대사 기능: ${preferred}. 최근 많이 쓴 기능은 자동 감점한다.\n- 최근 확정 대사 기능 분포: ${formatCounts(recent)}. 최근 과사용 기능: ${downranked}. 문장 형식 분포: ${forms}. 이 통계는 반복 회피용이며 본문에 설명하지 않는다.\n- 같은 INTENT를 연속 두 비트 이상 기본값으로 이어가지 않는다. 같은 뜻을 단어만 바꾸거나, 같은 질문 골격·명령 골격·감탄 골격으로 재포장하는 것도 반복으로 본다.\n- 장면 결말을 미리 알리는 기능은 기본 우선순위가 낮다. 실제 장면이 그 지점에 도달했을 때만 짧게 사용할 수 있고, 최근 장면에서 이미 사용했다면 더 강하게 감점한다. 강한 수위의 장면이라고 해서 자동으로 결말 예고 대사가 필요한 것은 아니다.\n- 감각 상태 보고 역시 여러 기능 중 하나다. 현재 감각을 계속 말로 중계하기보다 관찰, 받아치기, 질문, 장난, 관계 감정, 조율 등 장면에 맞는 다른 기능으로 전환한다.\n- bodyPraiseDirtyTalk가 높아도 외형 칭찬을 의무 삽입하지 않는다. 실제로 시선·움직임·옷차림·접촉이 특정 특징을 새롭게 부각했을 때만 그 순간의 반응으로 사용한다.\n- 두 인물이 같은 방식으로 말하지 않는다. 주도권이 바뀌어도 CHARACTER VOICE FINGERPRINT의 문장 습관과 호칭은 유지한다. 한쪽은 계속 질문하고 다른 쪽은 계속 반응만 하는 고정 배치도 피한다.\n- 최종 출력 직전, 최근 제공 본문의 마지막 대사들을 내부적으로 한 번 대조한다. 핵심 의미와 문장 골격이 이미 반복됐다면 사건이나 감정을 바꾸지 말고 대사의 기능 또는 문장 구조를 한 번 재작성한다. 원문 대사를 복사해 ‘금지 목록’처럼 되뇌지 않는다.\n- 사용자가 이번 화에 특정 대사·말투·상황을 직접 지정했다면 그 지시가 자동 회전보다 우선한다. HARD CANON, 관계 단계, 동의·경계, ADDRESS / AGE CANON은 언제나 이 엔진보다 우선한다.`;
  }

  function install(){
    if (window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__) return true;
    if (typeof window.buildPrompt !== 'function') return false;

    // Wait until every older dialogue/continuity wrapper that can append prompt
    // blocks is installed. This layer must be the final cleanup/rotation layer.
    if (!window.__VELOUR_QUALITY_RESTORE__ ||
        !window.__VELOUR_CONTINUITY_VAULT_EDGE_FIX__ ||
        !window.__VELOUR_SCENE_VOICE_MEMORY_HOTFIX__ ||
        !window.__VELOUR_CONTINUITY_VOICE_GUARD__ ||
        !window.__VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__) return false;

    window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__ = true;
    window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE_VERSION__ = VERSION;

    const previousBuild = window.buildPrompt;
    window.buildPrompt = function(){
      const raw = String(previousBuild.apply(this, arguments) || '');
      const state = snapshot();
      const lines = extractRecentDialogue(storyText());
      const recent = summarizeRecentDialogue(lines);
      const cleaned = stripLegacyDialogueDirectives(raw);
      const result = `${cleaned}\n${sceneVarietyDirective(state)}\n${contextualDialogueDirective(state, recent)}`.trim();
      window.__VELOUR_LAST_DIALOGUE_CONTEXT__ = {
        version:VERSION,
        recentDialogueCount:lines.length,
        recentFunctionCounts:{...recent.counts},
        recentForms:{...recent.forms},
        overused:[...recent.overused],
        preferred:rankedPriorities(state, recent).slice(0,5),
        stage:stageKind(),
        beforeChars:raw.length,
        afterChars:result.length,
        at:new Date().toISOString()
      };
      return result;
    };

    window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__ = {
      version:VERSION,
      storyText,
      extractRecentDialogue,
      classifyDialogue,
      sentenceForm,
      summarizeRecentDialogue,
      stageKind,
      rankedPriorities,
      stripLegacyDialogueDirectives,
      sceneVarietyDirective,
      contextualDialogueDirective
    };
    console.info('✦ VELOUR contextual dialogue engine loaded');
    return true;
  }

  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 400) clearInterval(timer);
  }, 80);
})();
