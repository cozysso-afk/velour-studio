'use strict';

/* VELOUR scene freedom + protagonist agency hotfix.
   Keeps immutable canon facts locked while preventing the opening premise,
   first location, or one-sided scene blocking from becoming permanent defaults.
*/
(() => {
  'use strict';
  if (window.__VELOUR_SCENE_AGENCY_HOTFIX__) return;
  window.__VELOUR_SCENE_AGENCY_HOTFIX__ = true;
  window.__VELOUR_SCENE_AGENCY_VERSION__ = '1.0.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR scene agency hotfix: buildPrompt not found');
    return;
  }

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function clean(value, max = 90){
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function unique(values){
    return [...new Set((values || []).map(value => clean(value)).filter(Boolean))];
  }

  function scenes(state, count = 6){
    const rows = Array.isArray(state?.runtime?.scenes) ? state.runtime.scenes : [];
    return rows.slice(-Math.max(1, count));
  }

  function episodeNumber(state){
    const confirmed = Number(state?.runtime?.confirmedEpisode || 0);
    const recent = scenes(state, 1);
    const latestScene = Number(recent[0]?.episode || 0);
    return Math.max(0, confirmed, latestScene) + 1;
  }

  function stableIndex(seed, size){
    if (!size) return 0;
    let hash = 2166136261;
    for (const char of String(seed || '')) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0) % size;
  }

  function locationPalette(state){
    const world = String(state?.world || '').toLowerCase();
    const period = /historical|eastern_fantasy|western_fantasy|martial_arts/.test(world);
    const speculative = /fantasy|inhuman|dimension|game|reincarnation|omegaverse|supernatural/.test(world);
    if (period) return [
      '기존 거처 안의 다른 방·회랑·뜰·별채처럼 같은 생활권의 새 구역',
      '직업·신분이 실제로 작동하는 집무·수련·의례·상단·궁정 공간',
      '시장·찻집·나루·사찰·성문처럼 생활과 사람이 흐르는 외부 공간',
      '마차·말·배·산길·도성 길처럼 이동 자체가 사건을 만드는 공간',
      '정원·온실·목욕 공간·서고처럼 분위기와 행동 방식이 달라지는 장소',
      '연회·축제·공연·사냥·순행처럼 현재 단계와 연결되는 사회적 일정'
    ];
    if (speculative) return [
      '기존 거점 안의 다른 층·구역·시설처럼 물리 규칙이 달라지는 새 공간',
      '직업·능력·종족 규칙이 실제 사건을 만드는 업무·훈련·임무 공간',
      '시장·길드·정거장·중립 구역처럼 세계의 일상이 보이는 공공 공간',
      '차량·함선·포털·여정처럼 이동 중 선택과 변수가 생기는 공간',
      '휴식·치료·정비·기록처럼 전투 밖의 생활을 보여주는 사적 공간',
      '축제·회의·의식·공연처럼 현재 관계 단계와 연결되는 사회적 일정'
    ];
    return [
      '집 안에서도 침실만 반복하지 않는 현관·주방·거실·창가·발코니·욕실 같은 다른 구역',
      '두 사람의 직업이 실제 사건을 만드는 사무실·작업실·현장·연습실·매장',
      '차·엘리베이터·복도·계단·주차장·역처럼 이동과 문턱이 긴장을 만드는 공간',
      '카페·서점·편의점·산책로·시장처럼 평범한 생활 루틴이 겹치는 장소',
      '식사·전시·공연·운동·모임처럼 현재 단계와 인과적으로 맞는 약속',
      '교외·출장·여행·숙소처럼 충분한 계기 뒤 생활 리듬이 달라지는 짧은 외출'
    ];
  }

  function locationSeeds(state){
    const palette = locationPalette(state);
    const ep = episodeNumber(state);
    const start = stableIndex(`${state?.world || ''}|${state?.beatIndex || 0}|${ep}`, palette.length);
    return [0, 2, 4].map(offset => palette[(start + offset) % palette.length]);
  }

  function positionCandidates(prompt){
    const match = String(prompt || '').match(/최근 세부 체위[^\n]*?\/\s*저사용 후보\s+([^\n.]+)/);
    if (!match) return [];
    return unique(match[1].split(/\s*\/\s*/).filter(value => value && value !== '없음')).slice(0, 4);
  }

  function intensityMode(){
    const value = String(document.getElementById('selectIntensity')?.value || '');
    if (/R-19\s*Direct|직접적 감각|숨김없는/i.test(value)) return 'direct';
    if (/R-19\s*Literary|고밀도 감각|호흡, 체온/i.test(value)) return 'literary';
    return 'tension';
  }

  function eroticDirective(mode){
    if (mode === 'direct') return `
[R-19 DIRECT 장면 밀도 — 해금된 성인 장면에만]
- 장면을 선택했다면 페이드아웃·몇 문장 요약·완곡어만 이어지는 회피로 끝내지 않는다. 허용된 직접 어휘 범위 안에서 행동→상대 반응→다음 선택이 보이는 명료하고 감각적인 문장으로 쓴다.
- 야함은 단어를 거칠게 바꾸는 것만이 아니다. 욕망이 행동으로 드러나는 순간, 서로의 목소리·호흡·속도 변화, 주도권 교대, 쾌감과 감정의 피드백을 구체적으로 연결한다.
- 신체 명칭이나 신음 한 종류를 반복하지 말고, 시점·동작·감각·대사의 기능을 바꾼다. 사용자가 허용하지 않은 직접 신체 호칭을 새로 추가하지 않는다.`;
    if (mode === 'literary') return `
[R-19 LITERARY 장면 밀도 — 해금된 성인 장면에만]
- 장면을 선택했다면 페이드아웃이나 추상적 은유만으로 핵심 동작과 반응을 지우지 않는다. 호흡·체온·압력·리듬·시선·목소리와 감정 변화를 서로 원인이 되게 연결한다.
- 문학적이라는 이유로 수식어를 겹겹이 쌓거나 같은 떨림·열기·숨 표현을 반복하지 않는다. 행동과 선택이 선명한 고밀도 감각 문체를 유지한다.`;
    return `
[R-15 긴장 밀도]
- 직접 묘사 상한은 지키되, 끌림과 주도권을 흐릿하게 만들지 않는다. 시선·거리·선택·멈춤·접촉 전후의 반응으로 성적 긴장과 여주의 능동성을 분명히 보여준다.`;
  }

  function sceneFreedomDirective(prompt, state, isContinue){
    const recent = scenes(state, 6);
    const recentLocations = unique(recent.map(scene => scene?.location)).slice(-5);
    const recentAgency = unique(recent.map(scene => [scene?.initiation, scene?.control].filter(Boolean).join(' / '))).slice(-4);
    const candidates = positionCandidates(prompt);
    const seeds = locationSeeds(state);
    const variety = String(state?.variety || 'high').toLowerCase();
    const phaseRule = variety === 'max'
      ? '충분한 길이의 장면은 실제로 다른 3~4개 체위·배치 단계'
      : variety === 'high'
        ? '보통 길이 이상이면 실제로 다른 3개 체위·배치 단계(짧은 장면도 최소 2개)'
        : '길이가 충분하면 실제로 다른 2개 체위·배치 단계';
    const candidatePlan = candidates.length
      ? `이번 화 저사용 후보: ${candidates.join(' → ')}. 이 중 서로 다른 최소 2개를 우선 연결하고, 물리적으로 어색한 후보만 허용 풀의 다른 미사용 체위로 바꾼다.`
      : '저사용 후보가 비어 있으면 허용 풀에서 최근 장면과 방향·높이·지지점이 다른 체위를 고른다.';
    const continuationRule = isContinue
      ? '이어쓰기 첫머리는 직전 확정 장소·행동·감정을 먼저 받아 쓴다. 새 장소가 필요하면 이동의 계기와 짧은 과정을 본문 안에 보여주며 순간이동시키지 않는다.'
      : '새 이야기의 첫 설정은 출발점이다. HARD CANON이 작품 전체의 고정 장소라고 명시하지 않았다면 이후 화의 유일한 무대로 취급하지 않는다.';

    return `
===== VELOUR SCENE FREEDOM · AGENCY OVERRIDE V1 =====
[캐논의 잠금 범위 — 설정 보존과 장면 자유를 분리]
- HARD CANON은 인물 정체·나이·직업·확정 과거·세계 규칙·관계 이정표·금지사항을 잠근다. 첫 화의 장소·첫 사건·처음 쓴 소품·한 번 정한 대화 방식까지 영구 반복하라는 뜻이 아니다.
- CANON STORYLINE의 현재 단계는 ‘넘으면 안 되는 관계 이정표’다. 그 단계 안의 장소·일정·작은 사건·행동·감정의 원인까지 고정하는 대본이 아니다. 현재 단계의 결말을 선행하지 않는 범위에서 새 생활 사건과 새 장면 목적을 적극적으로 만든다.
- 활성 CANON 단계가 있다는 사실만으로 해금된 친밀 장면을 자동 연기하지 않는다. 현재 단계가 명시적으로 배제하지 않고 관계·연령·동의·쿨다운 조건이 맞으면, 친밀 장면이 현재 단계의 감정 기능을 수행할 수 있다. 이 규칙은 기존의 포괄적인 ‘활성 단계면 미뤄도 됨’ 문구보다 우선한다.

[장소·사건 회전]
- ${continuationRule}
- 최근 장소: ${recentLocations.length ? recentLocations.join(' / ') : '기록 없음'}. 직접 이어지는 장면이 아니라면 같은 정확한 장소+같은 목적 조합을 기본값으로 재사용하지 않는다.
- 이번 화에 검토할 공간 축: ${seeds.join(' / ')}. 세계관·직업·현재 인과에 맞는 하나를 구체적인 장소로 바꾸되, 무관한 사고나 새 악역을 억지로 투입하지 않는다.
- 고정 장소가 캐논이어도 그 안의 다른 구역·시간대·방문 목적·사람의 흐름을 바꾼다. 장소 변화가 장식이 아니라 행동 선택과 대화 방식에 실제 영향을 줘야 한다.

[여주 능동성 — 별도 지시가 없어도 기본 적용]
- 여주는 남주가 시키기 전까지 가만히 받기만 하는 인물이 아니다. 매 화 최소 한 번은 여주가 먼저 선택·제안·질문·접근·거절·조건 제시·행동 전환 중 하나로 장면의 방향을 실제로 바꾼다.
- 친밀 장면에서는 도입과 중간 전환에 걸쳐 최소 2회의 서로 다른 능동 행동을 둔다. 먼저 거리를 좁히거나 접촉하기, 원하는 것을 말하거나 손으로 이끌기, 속도·방향·배치를 바꾸기, 멈춤·경계·계속의 의사를 분명히 하기 중 캐릭터에게 맞는 행동을 고른다.
- 수줍거나 조용한 성격도 수동성과 같지 않다. 작은 손짓·몸의 이동·짧은 요구·상대 행동을 되돌려 주는 방식으로 선택권을 보여준다. 갑자기 성격을 뒤집어 과장된 지배자로 만들지는 않는다.
- 최근 주도 패턴: ${recentAgency.length ? recentAgency.join(' / ') : '기록 없음'}. 같은 사람이 같은 방식으로 시작하고 끝내는 구조를 반복하지 말고, 장면 안에서 주도권이 최소 한 번 자연스럽게 교대되게 한다.

[체위·블로킹 실행 — 권고가 아니라 실제 장면 설계]
- 성인 장면이 실제로 발생하고 사용자가 짧게 써 달라고 하지 않았다면 ${phaseRule}를 구현한다. 손 위치나 각도만 조금 바꾼 것은 새 단계로 세지 않는다.
- ${candidatePlan}
- 각 단계는 충분히 살아난 뒤 여주의 선택, 상대 반응, 공간 활용, 대사 또는 감정 변화 때문에 다음 단계로 넘어간다. 체위 이름과 계획표는 본문에 쓰지 않는다.
- 기본 장면 호흡은 빌드업 → 첫 구도 → 여주의 능동적 전환/주도권 교대 → 두 번째·세 번째 구도 → 감정적 여운이다. 모든 장면을 똑같은 순서로 복사하지는 않는다.

[머신 메타 정확도]
- location에는 실제 중심 장소를 구체적으로, initiation에는 누가 무엇으로 시작했는지, control에는 주도권이 어떻게 교대됐는지 기록한다. 여주가 능동 행동을 하지 않았다면 한 것처럼 꾸미지 말고 repeatRisk를 high로 자기검수한다.
${eroticDirective(intensityMode())}
===== END VELOUR SCENE FREEDOM · AGENCY OVERRIDE V1 =====`;
  }

  window.buildPrompt = function(isContinue = false){
    const raw = String(previousBuild(isContinue) || '');
    const state = snapshot();
    const block = sceneFreedomDirective(raw, state, !!isContinue);
    const out = `${raw}\n\n${block}`.trim();
    window.__VELOUR_SCENE_AGENCY_LAST__ = {
      beforeChars: raw.length,
      afterChars: out.length,
      addedChars: Math.max(0, out.length - raw.length),
      episode: episodeNumber(state),
      locations: locationSeeds(state),
      positions: positionCandidates(raw),
      intensity: intensityMode(),
      at: new Date().toISOString()
    };
    return out;
  };

  window.__VELOUR_SCENE_AGENCY_QA__ = {
    sceneFreedomDirective,
    positionCandidates,
    locationSeeds,
    intensityMode
  };

  console.info('✦ VELOUR scene freedom + protagonist agency hotfix loaded');
})();
