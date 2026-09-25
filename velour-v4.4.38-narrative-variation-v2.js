'use strict';

/* VELOUR — Narrative Variation V2
   Rotates episode architecture, scene rhythm, conversation purpose, and endings.
   This layer does not alter canon, consent, relationship stage, or character identity.
*/
(() => {
  'use strict';
  if (window.__VELOUR_NARRATIVE_VARIATION_V2__) return;
  const VERSION='1.0.0';
  const GUARD='__VELOUR_NARRATIVE_VARIATION_V2__';

  const STRUCTURES=[
    ['bottle','한 장소 압축형','장소 이동을 최소화하고 작은 행동·침묵·대화 변화가 압력을 누적한다.'],
    ['task','공동 과업형','둘이 해결해야 할 실제 일이나 목적이 장면을 끌고 가고 감정은 그 과정에서 드러난다.'],
    ['interruption','계획 교란형','예정된 흐름이 현실적인 변수 하나로 틀어지고, 대응 방식에서 관계 차이가 드러난다.'],
    ['aftermath','결과 선행형','이미 일어난 작은 결과나 어색한 여운에서 시작해 원인과 의미를 뒤늦게 확인한다.'],
    ['converge','분리→합류형','각자 다른 일정/목적을 짧게 보여준 뒤 하나의 선택이나 사건에서 합류한다.'],
    ['ensemble','주변 인물 압력형','제3자의 평범한 요청·행사·업무가 둘의 태도 차이를 드러내되 억지 삼각관계는 만들지 않는다.'],
    ['discovery','발견 주도형','기록·물건·정보·행동의 작은 발견 하나가 기존 해석을 바꾸고 대화를 발생시킨다.'],
    ['mosaic','시간 점프 모자이크형','같은 날 또는 며칠의 짧은 비트를 2~4개 연결해 관계 변화가 생활 속에서 누적되는 모습을 보여준다.'],
    ['reversal','중반 반전형','초반 목표와 중반 이후 실제 쟁점이 달라진다. 반전은 새 악역이 아니라 인물의 선택·정보·우선순위에서 나온다.'],
    ['quiet_shift','잔잔한 전환형','큰 사건 없이 생활 장면을 유지하되 한 가지 선택·호칭·거리·약속이 관계의 의미를 바꾼다.'],
    ['deadline','마감/시간 제한형','정해진 시간·출발·업무 종료 같은 현실적 제한이 선택을 선명하게 만든다.'],
    ['choice','선택 중심형','외부 사건보다 두 가지 가능한 행동 중 무엇을 택할지가 에피소드의 중심 갈등이 된다.']
  ];
  const OPENINGS=[
    '설명 없이 이미 진행 중인 행동이나 업무 한가운데에서 시작',
    '대화가 이미 시작된 한 문장 뒤에서 시작하고 배경은 반응 속에서 공개',
    '직전 선택의 작은 결과·여운을 먼저 보여준 뒤 현재 문제로 이동',
    '시간이 조금 지난 뒤 달라진 일상 루틴에서 시작',
    '문자·전화·전달받은 일정 같은 구체적 용무로 시작',
    '제3자의 평범한 요청이나 호출로 동선이 바뀌는 순간에서 시작',
    '한 인물이 혼자 처리하던 일을 다른 인물이 발견하는 순간에서 시작',
    '조용한 일상 행동에서 평소와 다른 작은 디테일 하나를 발견하며 시작'
  ];
  const MIDPOINTS=[
    '초반 목표는 유지하되 해결 방법에 대한 의견 차이가 드러난다',
    '둘 중 한 사람이 예상과 다른 선택을 해 장면의 주도권이 바뀐다',
    '새 정보 하나가 같은 행동의 의미를 다르게 보이게 만든다',
    '외부 일정/사람의 개입으로 둘만의 계획을 수정해야 한다',
    '말로 해결하려던 문제가 행동·동선 선택 문제로 바뀐다',
    '실무적 문제는 해결되지만 감정 문제는 오히려 선명해진다',
    '감정적 오해가 풀리는 대신 현실적인 새 쟁점이 남는다',
    '한 사람이 물러서면서 갈등이 끝나는 듯하지만 다른 사람이 먼저 다시 연결한다'
  ];
  const ENDINGS=[
    '작은 결정을 실제 행동으로 옮긴 상태에서 종료',
    '다음 일정이나 약속이 구체적으로 바뀐 상태에서 종료',
    '새 정보의 의미는 알았지만 대응 선택은 아직 남겨둔 채 종료',
    '갈등은 해결됐지만 둘 사이의 거리/호칭/태도가 달라진 채 종료',
    '말보다 생활 행동 하나가 관계 변화를 보여주며 조용히 종료',
    '제3자나 업무에 돌아가지만 방금 선택의 후폭풍이 남은 상태로 종료',
    '초반에 나온 사소한 물건·대사·행동이 다른 의미로 되돌아오며 종료',
    '한 인물이 먼저 떠나거나 자리를 정리하고 남은 인물의 다음 행동이 암시되며 종료'
  ];
  const CONVERSATIONS=[
    '정보 교환·확인', '실무 조율·계획', '의견 충돌·협상', '장난과 견제',
    '부분적 감정 노출', '회피하다 핵심만 말하기', '공동 문제 해결', '과거 사건 재해석',
    '경계·조건 확인', '말보다 침묵·행동이 많은 대화', '서로 다른 우선순위 비교', '뜻밖의 솔직함 뒤 수습'
  ];
  const RHYTHMS=[
    '한 장면을 길게 밀고 가는 1장면 중심',
    '긴 장면 1개 + 짧은 후속 비트 1개',
    '서로 다른 목적의 2장면',
    '짧은 3장면을 시간 흐름으로 연결',
    '초반 짧은 장면 + 중반 긴 장면 + 아주 짧은 여운',
    '장소는 같지만 시간/사람의 흐름이 달라지는 2단 구성'
  ];

  const clean=(v,max=180)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,max);
  function snapshot(){try{return window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{};}catch(_){return {};}}
  function nextEpisode(state){
    const confirmed=Number(state?.runtime?.confirmedEpisode||0);
    const rows=Array.isArray(state?.runtime?.scenes)?state.runtime.scenes:[];
    return Math.max(confirmed,Number(rows.at(-1)?.episode||0))+1;
  }
  function hash(text){let h=2166136261;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function pick(list,ep,salt,step=5){return list[(hash(salt)+(Math.max(1,ep)-1)*step)%list.length];}
  function plan(state){
    const ep=nextEpisode(state);
    const seed=`${clean(state?.world,80)}|${clean(state?.relationship,80)}|${clean(document.getElementById('inputChars')?.value,120)}`;
    return {
      episode:ep,
      structure:pick(STRUCTURES,ep,seed+'|structure',5),
      opening:pick(OPENINGS,ep,seed+'|opening',3),
      midpoint:pick(MIDPOINTS,ep,seed+'|mid',5),
      ending:pick(ENDINGS,ep,seed+'|ending',3),
      conversation:pick(CONVERSATIONS,ep,seed+'|talk',5),
      rhythm:pick(RHYTHMS,ep,seed+'|rhythm',5)
    };
  }
  function stripPrior(prompt){return String(prompt||'').replace(/\n?===== VELOUR NARRATIVE VARIATION V2 =====[\s\S]*?===== \/VELOUR NARRATIVE VARIATION V2 =====\s*/g,'\n').trim();}
  function directive(state){
    const p=plan(state);
    const userDirection=clean(document.getElementById('v33Next')?.value,360);
    return `===== VELOUR NARRATIVE VARIATION V2 =====
[권위 분리]
- 이 블록은 에피소드의 거시 구조·장면 리듬·대화 목적·엔딩 형태만 담당한다.
- HARD CANON, CANON STORYLINE 순서, 관계 단계, 동의, 캐릭터 고유 말투와 사용자의 이번 화 지시는 항상 더 높은 권위다.
- 기존 CAUSAL BUILDUP의 원인→반응→선택→결과는 인과관계 검사이지 매 화 같은 4단 구성으로 쓰라는 템플릿이 아니다. 아래 구조에 맞춰 순서·비중·장면 수를 자유롭게 바꾼다.
- Scene Governor는 장소/상황 후보를 담당하고, Contextual Dialogue는 개별 대사의 기능을, Verbal Chemistry는 말하는 태도·전략을 담당한다. 서로의 역할을 대신하지 않는다.

[EP.${p.episode} 자동 구조]
- 구조: ${p.structure[1]} — ${p.structure[2]}
- 오프닝: ${p.opening}.
- 리듬: ${p.rhythm}.
- 중반 변화: ${p.midpoint}.
- 이번 화의 주 대화 목적: ${p.conversation}.
- 엔딩: ${p.ending}.
${userDirection?`- 사용자가 이번 화 추가 지시를 적었다: ${userDirection}. 이 지시가 위 구조와 충돌하면 사용자 지시를 따르되, 가능한 범위에서 리듬과 엔딩의 반복은 피한다.`:'- 별도 이번 화 지시가 없으므로 위 구조를 기본 뼈대로 사용한다.'}

[반복 방지]
- 모든 화를 ‘일상 시작 → 대화로 감정 확인 → 갈등/친밀도 상승 → 화해/여운’의 동일 순서로 쓰지 않는다.
- 매 화 반드시 갈등을 만들 필요도, 매 화 반드시 화해·고백·새 사건으로 끝낼 필요도 없다. 과업 해결, 정보 발견, 선택 유예, 생활 변화, 실패, 조용한 결정도 완결된 에피소드가 될 수 있다.
- 장면 수를 항상 3개로 고정하지 않는다. 한 장면을 길게 파는 화와 여러 짧은 비트를 잇는 화를 섞는다.
- 대화만으로 장면을 끝내지 말고 업무·이동·생활 행동·침묵·제3자의 현실적인 요청 등 현재 설정에 이미 존재하는 행동 자원을 활용한다.
- 직전 화와 같은 오프닝 방식, 같은 중반 전환, 같은 엔딩 기능을 단어만 바꿔 재사용하지 않는다.
===== /VELOUR NARRATIVE VARIATION V2 =====`;
  }

  const previousBuild=window.buildPrompt;
  if(typeof previousBuild==='function'){
    window.buildPrompt=function(){
      const out=stripPrior(previousBuild.apply(this,arguments));
      const state=snapshot();
      const block=directive(state);
      const p=plan(state);
      window.__VELOUR_LAST_NARRATIVE_VARIATION__={version:VERSION,episode:p.episode,structure:p.structure[0],conversation:p.conversation,rhythm:p.rhythm,at:new Date().toISOString()};
      return `${out}\n\n${block}`.trim();
    };
  }
  window[GUARD]=true;
  window.__VELOUR_NARRATIVE_VARIATION_V2_VERSION__=VERSION;
  window.__VELOUR_NARRATIVE_VARIATION_V2_QA__={STRUCTURES,OPENINGS,MIDPOINTS,ENDINGS,CONVERSATIONS,RHYTHMS,plan,directive};
  console.info('✦ VELOUR Narrative Variation V2 loaded');
})();