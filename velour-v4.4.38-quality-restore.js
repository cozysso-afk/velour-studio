'use strict';
/* VELOUR quality restore hotfix.
   Restores prose-quality guidance only. It does not alter CANON progression,
   timeline logic, response-vault behavior, or provider safety behavior.
*/
(() => {
  'use strict';
  if (window.__VELOUR_QUALITY_RESTORE__) return;
  window.__VELOUR_QUALITY_RESTORE__ = true;
  window.__VELOUR_QUALITY_RESTORE_VERSION__ = '1.3.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR quality restore: buildPrompt not found');
    return;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function userDirection(){
    return String(document.getElementById('v33Next')?.value || '').trim();
  }

  function asksExactMeasurements(text){
    const raw = String(text || '');
    const mentions = /(?:컵\s*사이즈|몇\s*컵|[A-H]\s*컵|브라\s*사이즈|신체\s*치수|정확한\s*(?:키|치수|사이즈)|몇\s*cm|센티미터)/i.test(raw);
    const asks = /(?:정확히|직접|명시적으로|숫자로)\s*(?:언급|표기|말해|말하|써|쓰|밝혀|밝히)|(?:사이즈|치수|컵)\s*(?:를|은|는)?\s*(?:언급|표기|말해|써|밝혀)/i.test(raw);
    const denies = /(?:언급|표기|말하|쓰|밝히)(?:지\s*마|지\s*말|지\s*않|면\s*안)|문학적|자연스럽게|설정값으로만|내부\s*(?:설정|참고)|직접\s*(?:표현|언급)\s*(?:금지|없이|말고)/i.test(raw);
    return mentions && asks && !denies;
  }

  function asksLongForeplay(text){
    const raw = String(text || '');
    return /(?:애무|전희|키스)[^\n]{0,18}(?:길게|오래|충분히|천천히|짧지\s*않게)|(?:길게|오래|충분히|천천히)[^\n]{0,18}(?:애무|전희|키스)/i.test(raw);
  }

  function caressDirective(level){
    const value = String(level || 'high').toLowerCase();
    if (value === 'very_high') return '전환 뒤에도 접촉을 매우 높은 밀도로 이어가며, 자세·구도가 바뀌는 사이와 감정이 고조되거나 가라앉는 구간에도 손길·입맞춤·끌어안는 반응이 끊기지 않게 한다.';
    if (value === 'high') return '전환 뒤에도 접촉을 높은 밀도로 이어가며, 자세·구도가 바뀌는 사이에도 손길·입맞춤·끌어안는 반응이 갑자기 끊기지 않게 한다.';
    return '전환 뒤의 접촉은 장면 흐름에 맞는 보통 밀도로 자연스럽게 이어간다.';
  }

  function kissingDirective(level, dir){
    const value = String(level || 'high').toLowerCase();
    const directlyLong = asksLongForeplay(dir);
    if (value === 'very_high' || directlyLong) return '- 키스 밀도=VERY HIGH. 시작에 한 번 넣고 끝내지 말고 친밀 장면의 도입·감정 고조·구도 전환·마무리에 최소 4개의 서로 다른 키스 비트를 분산한다. 매번 같은 문장으로 반복하지 말고 길이, 주도권, 호흡, 대사와 감정 기능을 달리한다.';
    if (value === 'high') return '- 키스 밀도=HIGH. 도입·중간 전환·마무리에 최소 3개의 서로 다른 키스 비트를 분산하고, 키스가 장면의 감정과 움직임을 실제로 연결하게 한다.';
    return '- 키스 밀도=NORMAL. 한 번의 형식적인 언급으로 끝내지 말고 장면 흐름에 맞는 최소 2개의 서로 다른 키스 비트를 둔다.';
  }

  function foreplayDirective(foreplay, dir, caressLevel){
    const value = String(foreplay).toLowerCase();
    const forceLong = asksLongForeplay(dir) || value === 'long' || value === 'very_long';
    const continuation = caressDirective(caressLevel);
    if (forceLong) {
      const veryLong = value === 'very_long';
      return `- 애무 길이=${veryLong?'VERY LONG':'LONG'} 강제. 친밀 장면이 시작되면 초반 키스·애무·반응 축적 구간을 요약 몇 문장으로 건너뛰지 않는다. 본격적인 다음 단계로 넘어가기 전까지 친밀 장면 서술의 최소 ${veryLong?'50':'40'}% 안팎을 이 빌드업에 배정하고, 최소 ${veryLong?'4':'3'}개의 서로 다른 감각/반응 비트가 누적된 뒤 전환한다. 같은 행동을 반복해 글자만 늘리지 말고 접촉 방식, 호흡, 시선, 대사, 자세, 감정 반응을 변화시키며 점진적으로 고조한다. ${continuation}`;
    }
    if (value === 'medium' || value === 'balanced') {
      return `- 애무 길이=BALANCED. 친밀 장면의 초반 빌드업을 한두 문장으로 압축하지 말고 최소 2개의 반응 비트를 보여준 뒤 다음 단계로 전환한다. ${continuation}`;
    }
    return `- 애무 길이=${String(foreplay).toUpperCase()}. 선택값보다 길게 억지로 늘이지 않되, 장면 연결이 끊기지 않게 자연스럽게 전환한다. ${continuation}`;
  }

  function blockingAnchor(s){
    const confirmed = Math.max(0, Number(s?.runtime?.confirmedEpisode || 0));
    const anchors = [
      '서 있거나 이동하는 구도 — 문·벽·복도·창가 등 공간을 활용하고 두 사람이 같은 자리에 고정되지 않는다',
      '앉은 구도 — 소파·의자·침대 가장자리 등 높이 차와 시선 높이를 활용한다',
      '기대거나 지지하는 구도 — 벽·가구·헤드보드 등 주변 환경과 몸의 방향을 활용한다',
      '나란히 또는 옆으로 기울어진 구도 — 정면 대치만 반복하지 않고 옆선과 시선 방향을 바꾼다',
      '짧은 장소 이동이 있는 구도 — 장면 중 자연스러운 이동으로 거리와 방향을 한 번 이상 바꾼다',
      '주도권이 교대되는 구도 — 한 사람만 계속 움직임을 이끌지 않고 상대의 선택과 반응으로 배치를 바꾼다'
    ];
    return anchors[(confirmed + 1) % anchors.length];
  }

  function blockingDirective(s, variety){
    const level = String(variety || 'high').toLowerCase();
    const anchor = blockingAnchor(s);
    if (level === 'low') {
      return `- 장면 블로킹 다양성=LOW. 억지 전환은 하지 않되 최근 화와 완전히 같은 정면 고정 구도는 피한다. 이번 화 우선 앵커: ${anchor}.`;
    }
    if (level === 'medium') {
      return `- 장면 블로킹 다양성=MEDIUM. 친밀 장면 안에서 최소 1회는 몸의 방향·높이·거리·위치 중 하나를 실제로 바꾼다. 단순한 손 위치 변화만으로 ‘구도 변경’ 처리하지 않는다. 이번 화 우선 앵커: ${anchor}.`;
    }
    return `- 장면 블로킹 다양성=HIGH 강제. 같은 정면 밀착 구도를 기본값처럼 계속 반복하지 않는다. 친밀 장면마다 최소 2개의 명확히 다른 비노골적 블로킹 단계가 있어야 하며, 몸의 방향·높이·거리·장소·누가 움직임을 이끄는지 중 최소 2가지가 실제로 달라져야 한다. 최근 장면과 같은 시작 구도는 우선 회피하고, 한 단계가 충분히 전개된 뒤 자연스러운 동작·대사·감정 변화 때문에 다음 배치로 넘어가게 한다. 이번 화 우선 앵커: ${anchor}. 앵커 문구를 본문에 설명하거나 체크리스트처럼 나열하지 말고 장면 속 행동으로만 구현한다.`;
  }

  function qualityDirective(s){
    const dir = userDirection();
    const exact = asksExactMeasurements(dir);
    const kissing = String(s?.kissingDensity || 'high');
    const foreplay = String(s?.foreplayLength || 'long');
    const caress = String(s?.inSceneCaress || 'high');
    const dirty = Math.max(0, Math.min(100, Number(s?.dirtyTalk ?? 70)));
    const richness = String(s?.bodyDescriptionRichness || 'rich');
    const variety = String(s?.variety || 'high');
    const foreplayRule = foreplayDirective(foreplay, dir, caress);
    const kissingRule = kissingDirective(kissing, dir);
    const blockingRule = blockingDirective(s, variety);

    return `\n[PROSE QUALITY RESTORE — CANON을 바꾸지 않는 문체 품질 지시]\n- HARD CANON, 현재 CANON STORYLINE 단계, 이번 화 사용자 지시가 항상 우선이다. 이 블록은 사건·연령·직업·관계를 새로 만들지 않는다.\n- 신체 설정값은 외형 일관성을 위한 내부 참고값이다. ${exact ? '이번 화 사용자가 정확한 수치 언급을 직접 요구했으므로 필요한 범위에서만 수치를 사용할 수 있다.' : '저장된 컵 문자는 본문에 그대로 쓰지 않는다. 컵사이즈·cm·정확한 신체 치수를 설정표처럼 낭독하거나 반복하지 말고, 실루엣·비율·촉감·움직임·옷맵시 등 자연스럽고 문학적인 묘사로 변환한다.'}\n- 신체 묘사 풍부도=${richness}. 같은 부위·같은 형용사·같은 문장 구조를 반복하지 말고 시선, 동작, 촉감, 온도, 호흡, 자세 변화, 옷과 피부의 대비 등 묘사 초점을 장면마다 회전한다.\n- 키스 밀도=${kissing}, 애무 길이=${foreplay}, 장면 중 지속 애무=${caress}. 키스와 애무를 짧은 통과 의례처럼 처리하지 않는다.\n${kissingRule}\n${foreplayRule}\n- 이번 화 사용자 지시에 ‘애무/전희/키스를 길게·오래·충분히’가 들어 있으면 UI 선택값보다 그 직접 지시를 우선한다.\n- 더티톡 강도=${dirty}/100. 같은 문구를 반복하지 말고 관계·감정·상황에 맞춰 어휘, 문장 길이, 질문/칭찬/도발/반응형 대사를 다양하게 바꾼다. 캐릭터 말투와 성격은 유지한다.\n${blockingRule}\n- 구도 전환은 장면을 산만하게 만들기 위한 것이 아니다. 한 구도가 충분히 살아난 뒤 공간·감정·상대 반응이 다음 움직임을 만들게 하며, 최근 화와 똑같은 시작→진행 패턴을 반복하지 않는다.\n- LONG 선택은 실제 장면 배분을 늘리라는 뜻이다. 단, 같은 묘사를 반복해서 분량만 부풀리지 말고 서로 다른 반응과 감정 변화로 밀도를 높인다.`;
  }

  window.buildPrompt = function(isContinue = false){
    const raw = String(previousBuild(isContinue) || '');
    const s = snapshot();
    const block = qualityDirective(s);
    const out = `${raw}\n${block}`.trim();
    window.__VELOUR_QUALITY_RESTORE_LAST__ = {
      beforeChars: raw.length,
      afterChars: out.length,
      addedChars: Math.max(0, out.length - raw.length),
      blockingAnchor: blockingAnchor(s),
      variety: String(s?.variety || 'high'),
      at: new Date().toISOString()
    };
    return out;
  };

  console.info('✦ VELOUR quality restore hotfix loaded');
})();
