'use strict';

/* VELOUR — corpus-derived style DNA
   Source prose is NOT embedded. Only abstracted statistical/editorial features are retained.
   Profiles are selected by world so historical diction never leaks into modern stories.
*/
(() => {
  'use strict';
  if (window.__VELOUR_STYLE_DNA_HOTFIX__) return;
  window.__VELOUR_STYLE_DNA_HOTFIX__ = true;
  window.__VELOUR_STYLE_DNA_VERSION__ = '1.1.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR style DNA: buildPrompt not found');
    return;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  const PROFILES = {
    modern_commercial: {
      id:'modern_commercial', label:'현대 상업 로맨스',
      directive:`
[STYLE DNA — 현대 상업 로맨스]
- 독자가 한 번에 읽히는 문장을 우선한다. 꾸민 문장보다 장면의 목적과 인물의 선택이 먼저다.
- 설명→설명의 연속보다 대사→행동/표정→상대 반응→관계 변화가 빠르게 이어지게 한다.
- 대사는 시험, 회피, 인정, 도발, 방어, 화해, 관계 진전 중 실제 기능을 가진다.
- 감정을 이름 붙여 반복하지 말고 선택, 거리 변화, 작은 행동, 생략, 침묵으로 바꿔 보여준다.
- 짧은 행동문과 조금 긴 감정문을 교차하고 강한 순간 뒤에는 짧게 끊는다.
- 현대 대사는 자연스러운 구어를 쓰되 모든 인물이 같은 인터넷 말투·유행어를 공유하지 않는다.
- 친밀도 높은 장면도 감각 수식어를 늘어놓기보다 말의 속도, 머뭇거림, 시선, 거리, 주도권 변화와 즉각적 반응으로 밀도를 만든다.
- 장면 끝에는 사건이 끝나도 감정적 잔여물 하나를 남길 수 있다. 억지 클리프행어는 금지한다.`
    },
    eastern_historical: {
      id:'eastern_historical', label:'동양 시대극 · 동양 로판',
      directive:`
[STYLE DNA — 동양 시대극/동양 로판 · 코퍼스 추출형]
- 참고 코퍼스의 전체 경향은 대사 문단 비중 약 44~48%, 일반 문장 중앙값 약 15~20자다. 감정 고조 구간은 호흡을 늘렸다가 다시 짧게 끊는다. 수치는 기계적 할당량이 아니다.
- 핵심은 고풍스러운 장문이 아니라 짧은 서술, 직접 대사, 인물 속말, 타인의 반응을 빠르게 교차하는 리듬이다.
- 서술→속마음→대사→상대 반응을 유연하게 돌리되 매 문단 같은 순서를 복제하지 않는다.
- 시대어는 어미 장식이 아니다. 신분, 나이, 친밀도, 공식/사적 공간에 따라 존대 단계·호칭·어휘 격·직접성을 함께 바꾼다.
- 허나/헌데/어찌/참으로/심히/거늘/하였- 계열은 문맥에 맞을 때만 간헐적으로 사용한다. 몇 단어만 사극체로 바꾼 현대문장은 금지한다.
- 코퍼스에서 보이는 구어적 생동감처럼, 정제된 시대 서술 사이에 짧은 반문·속말·감탄·수사적 질문을 필요한 순간만 끼워 장면을 살아 있게 한다.
- 서술자의 짧은 추임새는 유머·긴장·인물 평가를 밀어줄 때만 쓴다. 매 문단 독자에게 말을 거는 습관은 금지한다.
- 감정이 커질수록 형용사를 증식시키지 말고 문장 호흡, 질문형, 속말, 대사의 생략/되받기, 상대 반응의 지연으로 긴장을 만든다.
- 감정은 인지→버팀/부정→흔들림→선택→후폭풍으로 누적할 수 있다. 한 번의 대사로 오래된 갈등을 너무 빨리 해소하지 않는다.
- 같은 시대 사람도 왕족/양반/평민, 점잖음/괄괄함, 공적/사적 자리의 문장 길이·호칭·어휘·반문 방식이 달라야 한다.
- 신분·궁중·가문·예법 정보는 장면을 움직이는 만큼만 노출한다. 설정집처럼 품계나 호칭을 연달아 해설하지 않는다.
- 친밀하고 감정 밀도가 높은 장면에서는 고정 외형이나 관계 설정을 재설명하지 않는다. 현재 순간의 시선, 숨, 망설임, 말의 끊김, 거리와 선택 변화가 정서를 운반한다.
- 고풍스러움을 위해 한자어를 과적재하지 않는다. 쉬운 고어/관용 표현과 현대 독자가 이해 가능한 문장을 섞어 가독성을 유지한다.
- 원문 문장, 독특한 비유, 고유한 표현을 기억해 재현하지 않는다. 리듬·비율·화법 구조만 참고한다.`
    },
    western_fantasy: {
      id:'western_fantasy', label:'서양 로맨스 판타지',
      directive:`
[STYLE DNA — 서양 로맨스 판타지]
- 한국 사극 어미와 동양식 호칭을 사용하지 않는다.
- 귀족제·궁정·가문 설정은 필요한 순간에만 드러내고 작위/혈통 설명을 연속 나열하지 않는다.
- 현대 상업 로맨스의 가독성과 장면 중심성을 기본으로 하되 공간·의복·의례는 분위기와 갈등에 기능이 있을 때만 조금 더 밀도 있게 쓴다.
- 대화는 지위 차이를 반영하되 번역투처럼 과도한 격식문을 반복하지 않는다.
- 친밀 장면에서도 인물의 사회적 지위와 평소 말버릇이 갑자기 사라지지 않는다.
- 감정 누적은 설명보다 선택과 관계의 비용으로 보여준다. 장면 끝에는 다음 선택을 압박하는 감정 또는 현실적 결과를 남긴다.`
    }
  };

  function chooseProfile(s){
    const world=String(s?.world||'modern_general').toLowerCase();
    if(world==='historical_real'||world==='eastern_fantasy'||/histor|eastern|orient|dynasty|period/.test(world)) return PROFILES.eastern_historical;
    if(world==='western_fantasy'||/western|regency|victorian/.test(world)) return PROFILES.western_fantasy;
    return PROFILES.modern_commercial;
  }

  function historicalStyleTuning(s,p){
    if(p.id!=='eastern_historical') return '';
    const hs=String(s?.historicalStyle||'readable').toLowerCase();
    if(/classic|deep|dense|archaic|literary/.test(hs)) return `\n[시대문체 세기 보정]\n- historicalStyle=${hs}. 가독성을 해치지 않는 범위에서 시대 어휘·구문·운율을 한 단계 진하게 한다. 낯선 고어 과시와 전 문장 고어체는 금지한다.`;
    if(/light|modern|easy/.test(hs)) return `\n[시대문체 세기 보정]\n- historicalStyle=${hs}. 호칭·사회 규범·높임 단계는 시대에 맞추되 서술문은 즉시 이해되게 명료하게 유지한다.`;
    return `\n[시대문체 세기 보정]\n- historicalStyle=${hs}. 고풍스러운 말맛과 현대적 가독성을 균형 있게 유지한다.`;
  }

  function dialogueLexiconLayer(p){
    const period=p.id==='eastern_historical';
    return `\n[RELATIONSHIP DIALOGUE LEXICON — 기능 기반 변주]\n- 대사를 몇 개의 상투 문구로 돌려쓰지 않는다. 같은 관계 장면에서도 기능을 교대한다: 관찰/확인, 반문, 놀림, 도발, 경계 표시, 요구, 거절, 양보, 인정, 애정 노출, 질투/불안 노출, 관계 확인, 말 돌리기, 뒤늦은 수습.\n- 직접적인 사용자 지정 대사 톤이 있으면 그것이 최우선이다. 임의로 점잖고 무난한 칭찬으로 순화해 캐릭터 목소리를 평준화하지 않는다.\n- 친밀한 대화는 '예쁘다/좋다' 같은 단일 평가만 반복하지 말고 현재 상대가 방금 한 말·표정·행동에 반응하는 즉시성 있는 문장으로 만든다.\n- 같은 기능을 연속 사용할 때도 문장 구조를 바꾼다: 진술↔짧은 질문↔되묻기↔말끝 흐리기↔짧은 명령/부탁↔농담 뒤 진심. 단, 캐릭터 성격에 없는 방식은 억지로 사용하지 않는다.\n- 호칭과 애칭은 관계 단계와 인물 습관을 따른다. 다양화를 위해 갑자기 새로운 호칭을 창작하지 않는다.\n- 감정 강도가 올라가도 모든 대사를 짧은 감탄사로 만들지 않는다. 짧은 말 사이에 한 번씩 더 구체적인 속내/관계 문장을 두어 감정의 방향을 분명히 한다.\n- 최근 몇 문단에서 이미 사용한 핵심 평가어·감탄 패턴·질문 골격은 가능한 한 그대로 재사용하지 말고 다른 기능/구문으로 이동한다.\n- ${period?'시대극에서는 친밀해져도 시대·신분에 맞는 호칭과 어휘층을 유지한다. 공적 자리의 격식과 사적 자리의 풀어진 말맛 사이의 낙차를 활용하되 현대식 표현에 사극 어미만 붙이지 않는다.':'현대물에서는 실제 대화처럼 축약·생략·반문을 허용하되 인터넷 밈이나 유행어를 자동 기본값으로 쓰지 않는다.'}\n- 이 레이어는 어휘 선택의 폭을 넓히는 편집 규칙이다. 특정 참고작의 문장이나 독특한 표현을 재현하는 사전이 아니다.`;
  }

  function rhythmLayer(p){
    return `\n[SCENE RHYTHM MIXER]\n- 한 장면의 문장 박자를 한 종류로 고정하지 않는다. 짧은 관찰/행동 → 대사 → 반응 → 조금 긴 내면/맥락 → 다시 짧은 전환처럼 길이와 기능을 섞는다.\n- 감정 고조에서 느낌표·말줄임표만 늘리는 방식은 피한다. 문장 길이, 답변 지연, 질문과 회피, 행동의 중단/재개로 속도를 조절한다.\n- 대화가 3회 이상 오갈 때 매번 '말했다/물었다/웃었다' 태그를 붙이지 않는다. 필요한 동작과 공간 반응으로 화자를 자연스럽게 구분한다.\n- 장면 중간에 이미 아는 설정이나 외형을 다시 요약해 리듬을 끊지 않는다.\n- 현재 프로필 ${p.label}의 문체는 장면을 멈추게 하는 장식이 아니라 관계 변화의 속도를 조절하는 장치다.`;
  }

  function editorialBridge(p){
    return `\n[COMMERCIAL ROMANCE EDITORIAL BRIDGE]\n- STYLE DNA는 캐릭터/CANON보다 우선하지 않는다. 확정된 성격과 사건을 문체 때문에 바꾸지 않는다.\n- 매 장면에는 최소 하나의 관계적 기능이 자연스럽게 발생해야 한다: 새 정보, 오해 심화/해소, 경계 이동, 신뢰 변화, 욕망과 현실의 충돌, 선택의 대가.\n- 같은 감정 상태로 문단만 늘어나는 제자리 장면을 피한다. 후반에는 정보·감정·거리·결정 중 하나 이상이 시작과 달라져야 한다.\n- 문체를 과시하려 사건을 멈추지 않는다. 좋은 문장은 서사의 추진력과 동시에 작동한다.\n- 현재 적용 프로필: ${p.label}. 프로필명과 내부 규칙은 본문에 절대 출력하지 않는다.`;
  }

  function directive(s){
    const p=chooseProfile(s);
    return `${p.directive}${historicalStyleTuning(s,p)}${dialogueLexiconLayer(p)}${rhythmLayer(p)}${editorialBridge(p)}`.trim();
  }

  window.buildPrompt=function(){
    const out=String(previousBuild.apply(this,arguments)||'');
    const s=snapshot(); const p=chooseProfile(s);
    window.__VELOUR_LAST_STYLE_DNA__={id:p.id,label:p.label,world:String(s?.world||''),historicalStyle:String(s?.historicalStyle||''),version:'1.1.0',at:new Date().toISOString()};
    return `${out}\n\n${directive(s)}`.trim();
  };

  window.__VELOUR_STYLE_DNA__={PROFILES,chooseProfile,directive,dialogueLexiconLayer,rhythmLayer};
  console.info('✦ VELOUR corpus-derived style DNA v1.1 loaded');
})();
