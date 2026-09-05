'use strict';

/* VELOUR — corpus-derived style DNA
   Source prose is NOT embedded. Only abstracted statistical/editorial features are retained.
   Profiles are selected by world so historical diction never leaks into modern stories.
*/
(() => {
  'use strict';
  if (window.__VELOUR_STYLE_DNA_HOTFIX__) return;
  window.__VELOUR_STYLE_DNA_HOTFIX__ = true;
  window.__VELOUR_STYLE_DNA_VERSION__ = '1.0.0';

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
      id: 'modern_commercial',
      label: '현대 상업 로맨스',
      directive: `
[STYLE DNA — 현대 상업 로맨스]
- 독자가 한 번에 읽히는 문장을 우선한다. 꾸민 문장보다 장면의 목적과 인물의 선택이 먼저다.
- 설명→설명→설명의 연속을 피하고, 대사→행동/표정→상대 반응→관계 변화가 빠르게 이어지게 한다.
- 대사는 정보 전달용이 아니라 시험, 회피, 인정, 도발, 방어, 화해, 관계 진전 중 하나의 기능을 가진다.
- 감정을 이름 붙여 반복 설명하지 않는다. 같은 감정도 선택, 거리 변화, 사소한 행동, 말의 생략, 침묵의 기능으로 바꿔 보여준다.
- 문장 길이를 한 톤으로 유지하지 않는다. 짧은 행동문과 조금 긴 감정문을 교차하고, 강한 순간 뒤에는 짧게 끊어 리듬을 만든다.
- 한 화의 끝에는 사건이 완결되어도 감정적 잔여물 하나는 남길 수 있다. 단 억지 클리프행어는 금지한다.
- 유행어와 인터넷 말투는 캐릭터 설정에 있을 때만 쓴다. 작가 서술까지 채팅체가 되지 않는다.`
    },
    eastern_historical: {
      id: 'eastern_historical',
      label: '동양 시대극 · 동양 로판',
      directive: `
[STYLE DNA — 동양 시대극/동양 로판 · 코퍼스 추출형]
- 참고 코퍼스에서 추출한 통계적 성향: 대사 문단 비중 약 44~48%, 일반 문장 중앙값 약 15~20자, 감정이 커지는 구간은 30~40자 안팎까지 호흡을 늘린 뒤 다시 짧게 끊는 패턴을 활용한다. 수치는 목표 범위이지 기계적 할당량이 아니다.
- 핵심은 '고풍스러운 긴 문장'이 아니라 짧은 서술, 직접 대사, 인물 속말, 타인의 반응을 빠르게 교차하는 리듬이다.
- 서술→속마음→대사→상대 반응을 유연하게 돌리되 매 문단 같은 순서로 반복하지 않는다.
- 시대어는 어미 치환 장식이 아니다. 신분, 나이, 친밀도, 공식/사적 공간에 따라 존대 단계와 호칭, 어휘의 격을 달리한다.
- '허나/헌데/어찌/참으로/심히/거늘/하였-' 같은 연결·강조 어휘는 문맥에 맞을 때만 간헐적으로 사용한다. 현대문장을 사극 어미로만 바꾸는 방식은 금지한다.
- 서술자의 짧은 추임새나 수사적 질문은 장면의 열기나 유머를 밀어줄 때만 제한적으로 허용한다. 매 문단 독자에게 말을 거는 버릇은 금지한다.
- 감정이 커질수록 형용사를 늘리지 말고 문장 호흡의 변화, 질문형, 속말, 대사의 생략과 반복, 상대 반응의 지연으로 긴장을 만든다.
- 감정은 인지→부정/버팀→흔들림→행동→후폭풍의 계단으로 누적할 수 있다. 한 번의 대사로 관계 갈등을 너무 빨리 정리하지 않는다.
- 인물 간 말맛은 서로 달라야 한다. 같은 시대에 살아도 왕족/양반/평민, 점잖은 인물/괄괄한 인물, 공적 자리/사적 자리의 문장 길이와 어휘가 같아서는 안 된다.
- 신분·궁중·가문·예법 정보는 장면을 움직이는 만큼만 노출한다. 설정집처럼 품계나 호칭을 연달아 해설하지 않는다.
- 친밀하고 감정 밀도가 높은 장면에서도 고정 외형이나 관계 설정을 해설하지 않는다. 현재 순간의 시선, 숨, 망설임, 말의 끊김, 거리와 선택의 변화가 정서를 운반하게 한다.
- 문장을 고풍스럽게 만들기 위해 한자어를 과적재하지 않는다. 쉬운 고어/관용 표현과 현대 독자가 이해 가능한 문장을 섞어 가독성을 유지한다.
- 원문 문장, 독특한 비유, 고유한 표현을 기억해서 재현하지 않는다. 이 프로필은 리듬·비율·화법 구조만 참고한다.`
    },
    western_fantasy: {
      id: 'western_fantasy',
      label: '서양 로맨스 판타지',
      directive: `
[STYLE DNA — 서양 로맨스 판타지]
- 한국 사극 어미와 동양식 호칭을 사용하지 않는다.
- 귀족제·궁정·가문 설정은 필요한 순간에만 자연스럽게 드러내고 작위/혈통 설명을 연속으로 나열하지 않는다.
- 현대 상업 로맨스의 가독성과 장면 중심성을 기본으로 하되, 공간·의복·의례 묘사는 분위기와 갈등에 실제 기능이 있을 때만 조금 더 밀도 있게 쓴다.
- 대화는 지위 차이를 반영하되 번역투처럼 과도하게 격식적인 문장을 반복하지 않는다.
- 감정 누적은 설명보다 선택과 관계의 비용으로 보여준다. 장면 끝에는 다음 선택을 압박하는 감정 또는 현실적 결과를 남긴다.`
    }
  };

  function chooseProfile(s){
    const world = String(s?.world || 'modern_general').toLowerCase();
    if (world === 'historical_real' || world === 'eastern_fantasy' || /histor|eastern|orient|dynasty|period/.test(world)) return PROFILES.eastern_historical;
    if (world === 'western_fantasy' || /western|regency|victorian/.test(world)) return PROFILES.western_fantasy;
    return PROFILES.modern_commercial;
  }

  function historicalStyleTuning(s, profile){
    if (profile.id !== 'eastern_historical') return '';
    const hs = String(s?.historicalStyle || 'readable').toLowerCase();
    if (/classic|deep|dense|archaic|literary/.test(hs)) {
      return `\n[시대문체 세기 보정]\n- 현재 historicalStyle=${hs}. 기본 가독성을 해치지 않는 범위에서 시대 어휘와 문장 운율을 한 단계 진하게 한다. 단, 고어 사전처럼 낯선 단어를 과시하거나 모든 문장을 고어체로 만들지 않는다.`;
    }
    if (/light|modern|easy/.test(hs)) {
      return `\n[시대문체 세기 보정]\n- 현재 historicalStyle=${hs}. 호칭·사회 규범·말의 높임 단계는 시대에 맞추되, 서술문 자체는 현대 독자가 즉시 이해할 수 있게 가볍고 명료하게 유지한다.`;
    }
    return `\n[시대문체 세기 보정]\n- 현재 historicalStyle=${hs}. 고풍스러운 말맛과 현대적 가독성을 균형 있게 유지한다.`;
  }

  function editorialBridge(profile){
    return `\n[COMMERCIAL ROMANCE EDITORIAL BRIDGE]\n- STYLE DNA는 캐릭터/CANON보다 우선하지 않는다. 이미 확정된 성격과 사건을 바꿔 문체에 맞추지 않는다.\n- 매 장면에는 최소 하나의 관계적 기능이 있어야 한다: 서로를 새로 알게 됨, 오해가 깊어짐, 경계가 이동함, 신뢰가 생김/깨짐, 욕망과 현실이 충돌함, 선택의 대가가 생김 중 해당되는 것이 자연스럽게 발생한다.\n- 같은 감정 상태로 문단만 늘어나는 '제자리 장면'을 피한다. 장면 후반에는 시작 때와 비교해 정보, 감정, 거리, 결정 중 하나 이상이 달라져야 한다.\n- 문체를 보여주기 위해 사건을 멈추지 않는다. 좋은 문장은 서사의 추진력과 동시에 작동해야 한다.\n- 현재 적용 프로필: ${profile.label}. 이 프로필명과 내부 규칙은 본문에 절대 출력하지 않는다.`;
  }

  function directive(s){
    const profile = chooseProfile(s);
    return `${profile.directive}${historicalStyleTuning(s, profile)}${editorialBridge(profile)}`.trim();
  }

  window.buildPrompt = function(){
    const out = String(previousBuild.apply(this, arguments) || '');
    const s = snapshot();
    const profile = chooseProfile(s);
    window.__VELOUR_LAST_STYLE_DNA__ = { id:profile.id, label:profile.label, world:String(s?.world||''), historicalStyle:String(s?.historicalStyle||''), at:new Date().toISOString() };
    return `${out}\n\n${directive(s)}`.trim();
  };

  window.__VELOUR_STYLE_DNA__ = { PROFILES, chooseProfile, directive };
  console.info('✦ VELOUR corpus-derived style DNA loaded');
})();
