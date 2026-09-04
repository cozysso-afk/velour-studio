'use strict';

/* VELOUR — internal planning label firewall
   Prevents scene/blocking/position planning labels from leaking into prose.
   Does not change canon, relationship state, or scene safety rules.
*/
(() => {
  'use strict';
  if (window.__VELOUR_INTERNAL_LABEL_FIREWALL__) return;
  window.__VELOUR_INTERNAL_LABEL_FIREWALL__ = true;
  window.__VELOUR_INTERNAL_LABEL_FIREWALL_VERSION__ = '1.0.0';

  const previousBuild = window.buildPrompt;
  if (typeof previousBuild !== 'function') {
    console.error('VELOUR internal-label firewall: buildPrompt not found');
    return;
  }

  function firewallDirective(){
    return `\n[INTERNAL LABEL FIREWALL — 계획 용어 본문 노출 금지]\n- 프롬프트 안의 장면 앵커, 블로킹 앵커, 구도명, 포지션명, 자세명, 단계명, 체크리스트명은 모두 작가용 내부 메타데이터다. 독자에게 보여줄 문장이 아니다.\n- 위 내부 라벨은 한국어든 영어든 다른 언어든 본문·대사·소제목·괄호 설명으로 그대로 출력하지 않는다. “~포지션”, “~자세”, “~구도”, “~style”, “~position”, “~pose”처럼 이름을 호명해서 장면 전환을 설명하지 않는다.\n- 내부 앵커가 무엇이든 결과 본문에는 그 이름 대신 인물의 실제 움직임, 시선 높이, 몸의 방향, 거리, 지지점, 공간 사용, 누가 움직임을 이끄는지의 변화만 자연스러운 서술로 드러낸다.\n- 장면이 바뀔 때 “다음 자세로 바꿨다/이번에는 ~였다”처럼 카탈로그식 전환문을 쓰지 않는다. 앞선 행동·대사·감정·공간 제약이 다음 움직임을 자연스럽게 만들게 한다.\n- 내부 계획어를 번역해서 노출하는 것도 금지한다. 영어 이름을 한국어로, 한국어 이름을 영어로 바꿔 적는 것은 해결이 아니다. 이름 자체를 숨기고 장면만 보여준다.\n- 독자가 읽었을 때 내부 설계표나 촬영 콘티를 보고 있다는 느낌이 들면 실패다. 장면의 연속된 행동과 감정만 남겨야 한다.\n- 사용자 지시가 특정 내부 명칭 자체를 본문에 쓰라고 명시적으로 요구한 경우에만 그 명칭을 사용할 수 있다.`;
  }

  window.buildPrompt = function(){
    let out = String(previousBuild.apply(this, arguments) || '');

    // Reframe planning anchors as explicitly non-output metadata before the
    // final directive is appended. This preserves planning usefulness while
    // reducing the chance that the model treats the anchor as prose copy.
    out = out
      .replace(/이번 화 우선 앵커:/g, '내부 배치 힌트(본문에 명칭 출력 금지):')
      .replace(/장면 블로킹 다양성=/g, '내부 장면 배치 다양성=');

    out = `${out}\n${firewallDirective()}`.trim();
    window.__VELOUR_INTERNAL_LABEL_FIREWALL_LAST__ = {
      added: true,
      at: new Date().toISOString()
    };
    return out;
  };

  window.__VELOUR_INTERNAL_LABEL_FIREWALL_QA__ = { firewallDirective };
  console.info('✦ VELOUR internal planning label firewall loaded');
})();
