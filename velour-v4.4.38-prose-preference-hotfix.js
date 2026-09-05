'use strict';

/* VELOUR — user prose preference overlay
 * Era/world Style DNA remains automatic. This layer only tunes presentation preference.
 */
(() => {
  'use strict';
  if (window.__VELOUR_PROSE_PREFERENCE__) return;
  window.__VELOUR_PROSE_PREFERENCE__ = true;
  window.__VELOUR_PROSE_PREFERENCE_VERSION__ = '1.0.0';

  const KEY='VELOUR_PROSE_PREFERENCE_V1';
  const OPTIONS=[
    ['balanced','균형형','서술·대화·감정선 균형'],
    ['dialogue','대화 중심','대사 핑퐁·캐릭터 보이스 강화'],
    ['emotion','감정 밀도','내면·미묘한 반응·여운 강화'],
    ['fast','속도감','짧은 호흡·행동·사건 진행 강화'],
    ['lyrical','서정적','분위기·감각·심상 밀도 강화'],
    ['restrained','건조·절제','감정 직접 설명을 줄이고 행동·대사로 표현']
  ];
  const DIRECTIVES={
    balanced:`[문체 취향 오버레이 — 균형형]\n- 현재 시대/장르 Style DNA를 그대로 중심축으로 삼고 서술·대화·내면·행동의 비중을 장면 목적에 맞춰 균형 있게 조절한다.`,
    dialogue:`[문체 취향 오버레이 — 대화 중심]\n- 시대/장르 말투와 Character Voice는 그대로 유지하면서 대사 핑퐁과 상대의 즉각적 반응 비중을 높인다.\n- 설명 가능한 관계 정보는 가능한 한 대화의 기능과 행동 반응으로 전달한다.\n- 대사만 연속 나열하지 말고 필요한 동작·시선·공간 반응으로 화자와 긴장을 선명하게 한다.`,
    emotion:`[문체 취향 오버레이 — 감정 밀도]\n- 시대/장르 Style DNA는 유지하고 인물의 망설임, 오해, 자각, 숨긴 의도와 관계의 미세한 변화를 더 촘촘히 추적한다.\n- 감정을 같은 형용사로 반복하지 말고 내면의 논리, 선택 직전의 흔들림, 상대 반응을 통해 누적한다.\n- 사건 진행을 멈출 정도의 장황한 독백은 피한다.`,
    fast:`[문체 취향 오버레이 — 속도감]\n- 짧고 명료한 문장, 행동, 선택, 사건의 결과를 우선해 장면을 빠르게 전진시킨다.\n- 이미 아는 설정·외형·감정의 재설명과 장황한 분위기 묘사를 줄인다.\n- 속도가 빨라도 관계 변화의 원인과 결과를 생략하지 않는다.`,
    lyrical:`[문체 취향 오버레이 — 서정적]\n- 시대/장르 Style DNA를 해치지 않는 범위에서 공간의 분위기, 감각, 심상과 문장 호흡을 조금 더 풍부하게 한다.\n- 장식적 비유를 연속 사용하지 말고 현재 감정이나 선택을 실제로 선명하게 만드는 이미지에만 집중한다.\n- 아름다운 문장을 위해 장면 진행이나 Character Voice를 희생하지 않는다.`,
    restrained:`[문체 취향 오버레이 — 건조·절제]\n- 감정을 직접 명명하거나 해설하는 문장을 줄이고 행동, 대사, 침묵, 거리와 선택의 결과로 보여준다.\n- 수식어와 감탄을 절제하고 문장은 명료하게 유지한다.\n- 절제가 무감정이나 정보 요약으로 변하지 않도록 의미 있는 구체 행동과 반응은 남긴다.`
  };

  function get(){try{const v=localStorage.getItem(KEY)||'balanced';return DIRECTIVES[v]?v:'balanced';}catch(_){return 'balanced';}}
  function set(v){const next=DIRECTIVES[v]?v:'balanced';try{localStorage.setItem(KEY,next);}catch(_){};sync(next);return next;}
  function sync(v=get()){
    document.querySelectorAll('[data-velour-prose-pref]').forEach(el=>{if(el.value!==v)el.value=v;});
    const hint=document.querySelector('[data-velour-prose-pref-hint]');
    if(hint){const o=OPTIONS.find(x=>x[0]===v);hint.textContent=o?.[2]||'';}
  }
  function installUI(){
    if(document.getElementById('velourProsePreferenceField')) return sync();
    const anchor=document.getElementById('v41HistoricalField');
    const host=anchor?.parentElement || document.querySelector('.v40-grid') || document.querySelector('.v40-body');
    if(!host) return;
    const field=document.createElement('div');
    field.className='v40-field';field.id='velourProsePreferenceField';
    field.innerHTML=`<label>문체 취향</label><select data-velour-prose-pref>${OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><div data-velour-prose-pref-hint style="margin-top:5px;color:#9f8794;font-size:9.5px;line-height:1.45"></div>`;
    if(anchor?.parentElement===host) anchor.insertAdjacentElement('afterend',field); else host.appendChild(field);
    const sel=field.querySelector('select');sel.value=get();sel.addEventListener('change',()=>set(sel.value));sync();
  }

  const previousBuild=window.buildPrompt;
  if(typeof previousBuild==='function'){
    window.buildPrompt=function(){
      const out=previousBuild.apply(this,arguments);
      const directive=DIRECTIVES[get()]||DIRECTIVES.balanced;
      if(typeof out==='string') return out+`\n\n${directive}`;
      return out;
    };
  }

  const observer=new MutationObserver(()=>installUI());
  observer.observe(document.body,{childList:true,subtree:true});
  installUI();
  window.__VELOUR_PROSE_PREFERENCE_QA__={version:'1.0.0',get,set,options:OPTIONS.map(x=>({id:x[0],label:x[1]})),reinstallUI:installUI};
  console.info('✦ VELOUR prose preference overlay loaded:',get());
})();
