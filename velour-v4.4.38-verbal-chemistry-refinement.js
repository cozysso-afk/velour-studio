'use strict';

/* VELOUR — Verbal Chemistry refinement + language firewall.
   Final prompt enforcement for selected verbal tactics plus a deterministic
   post-generation sanitizer for gendered person-directed insults when the
   existing insult control is OFF/light. Ordinary year expressions are kept.
*/
(() => {
  'use strict';

  const VERSION = '2.1.0';
  const GUARD = '__VELOUR_VERBAL_CHEMISTRY_REFINEMENT__';
  const VC_KEY = 'VELOUR_VERBAL_CHEMISTRY_V2';
  const TACTIC_LABELS = {
    witty_observation:'짓궂은 관찰',
    comeback:'받아치기',
    contradiction:'말·행동 모순 찌르기',
    challenge:'도전·허세 건드리기',
    twisted_praise:'칭찬 비틀기',
    callback:'둘만의 콜백',
    restrained_pressure:'절제된 압박',
    playful_affection:'다정한 희롱'
  };

  const clean = (v,max=500) => String(v || '').replace(/\s+/g,' ').trim().slice(0,max);
  const uniq = arr => [...new Set((arr || []).map(String).filter(Boolean))];

  function snapshot(){
    try { return window.__VELOUR_V4_STATE_SNAPSHOT__?.() || {}; }
    catch (_) { return {}; }
  }

  function vcConfig(){
    try {
      const raw=JSON.parse(localStorage.getItem(VC_KEY) || '{}') || {};
      const qa=window.__VELOUR_VERBAL_CHEMISTRY_QA__;
      return qa?.normalizeCfg ? qa.normalizeCfg(raw) : raw;
    } catch (_) { return {}; }
  }

  function selectedTactics(){
    const cfg=vcConfig();
    const ids=uniq(Array.isArray(cfg?.tactics) ? cfg.tactics : []);
    return ids.filter(id => TACTIC_LABELS[id]);
  }

  function insultMode(){
    const state=snapshot();
    return clean(state?.insultMode || document.getElementById('v4Insult')?.value || 'off',40).toLowerCase();
  }

  function firewallActive(){ return insultMode() !== 'custom'; }

  function suffixAfterGenderedNoun(suffix=''){
    const s=String(suffix || '');
    if(!s) return '';
    return s;
  }

  function replacementForPrefix(prefix,suffix=''){
    const p=String(prefix || '').replace(/\s+/g,'');
    const mapped={
      '미친':'미친 인간', '썅':'빌어먹을 인간', '쌍':'빌어먹을 인간',
      '개':'개같은 인간', '개같은':'개같은 인간', '걸레':'천박한 인간',
      '화냥':'천박한 인간', '독한':'독한 인간', '천한':'천한 인간',
      '더러운':'더러운 인간', '망할':'망할 인간', '못된':'못된 인간',
      '나쁜':'나쁜 인간', '재수없는':'재수없는 인간', '싸가지없는':'싸가지없는 인간'
    };
    return `${mapped[p] || '못된 인간'}${suffixAfterGenderedNoun(suffix)}`;
  }

  function sanitizeGenderedInsults(text, mode=insultMode()){
    let out=String(text || '');
    if(String(mode || '').toLowerCase()==='custom' || !out) return out;

    // Preserve ordinary year expressions such as 내년/작년/몇 년. Only person-directed
    // gendered noun constructions are rewritten.
    out=out.replace(/(미친|썅|쌍|개같은|개|걸레|화냥|독한|천한|더러운|망할|못된|나쁜|재수없는|싸가지없는)\s*년(아|이|은|는|을|를|도|만|하고|과|에게|한테)?/g,
      (_all,prefix,suffix)=>replacementForPrefix(prefix,suffix || ''));
    out=out.replace(/(^|[\s“”'"(])((?:이|저|그)\s*)년(아|이|은|는|을|를|도|만|하고|과|에게|한테)?(?=[!?,.…\s)”'"}]|$)/g,
      (_all,lead,det,suffix)=>`${lead}${det}인간${suffix || ''}`);
    out=out.replace(/(^|[\s“”'"(])년아(?=[!?,.…\s)”'"}]|$)/g,'$1인간아');
    return out;
  }

  function containsForbiddenGenderedInsult(text, mode=insultMode()){
    if(String(mode || '').toLowerCase()==='custom') return false;
    const src=String(text || '');
    if(!src) return false;
    return [
      /(?:미친|썅|쌍|개같은|개|걸레|화냥|독한|천한|더러운|망할|못된|나쁜|재수없는|싸가지없는)\s*년(?:아|이|은|는|을|를|도|만|하고|과|에게|한테|[!?,.…\s]|$)/,
      /(?:^|[\s“”'"(])(?:이|저|그)\s*년(?:아|이|은|는|을|를|도|만|하고|과|에게|한테|[!?,.…\s]|$)/,
      /(?:^|[\s“”'"(])년아(?:[!?,.…\s]|$)/
    ].some(rx=>rx.test(src));
  }

  function settingBand(value, lowLabel, midLabel, highLabel){
    const n=Math.max(0,Math.min(100,Number(value || 0)));
    return n>=70?highLabel:n>=35?midLabel:lowLabel;
  }

  function directive(){
    const cfg=vcConfig();
    const selected=selectedTactics();
    const labels=selected.map(id=>TACTIC_LABELS[id]);
    const mode=insultMode();
    const specificity=Math.max(0,Math.min(100,Number(cfg?.specificity ?? 92)));
    const mischief=Math.max(0,Math.min(100,Number(cfg?.mischief ?? 78)));
    const directness=Math.max(0,Math.min(100,Number(cfg?.directness ?? 55)));
    const playfulness=Math.max(0,Math.min(100,Number(cfg?.playfulness ?? 68)));
    const selectionText=labels.length?labels.join(' / '):'상황 맞춤형 비희롱 대사';
    const insultRule=mode==='custom'
      ? '사용자 HARD CANON의 명시적 언어 지시를 따른다.'
      : '상대 비하형 욕설은 HARD OFF다. 성별을 낮춰 부르는 사람 멸칭은 욕설 강도·직접성·짓궂음이 높아도 사용하지 않는다.';
    return `
[VERBAL CHEMISTRY V2.1 — 선택 강제 + 언어 방화벽]
- 이 블록은 Verbal Chemistry 선택값 적용과 언어 금지 규칙의 최종 권위다. 관계 단계/HARD CANON/동의 규칙보다 우선하지 않는다.
- 현재 선택된 희롱 전략 팔레트=${selectionText}. 의도적으로 희롱하는 핵심 대사는 사용자가 선택한 팔레트 안에서만 전략을 고른다. 선택하지 않은 희롱 전략을 습관적 기본값으로 끌어오지 않는다.
- 선택 전략은 체크리스트가 아니다. 한 줄에는 1개 전략만 중심으로 쓰고, 한 장면에서는 서로 다른 전략을 필요한 만큼만 사용한다. 같은 전략+같은 표적+같은 문장형을 연속 반복하지 않는다.
- 상황특이성=${specificity}/100(${settingBand(specificity,'낮음','중간','높음')}). 70 이상이면 모든 핵심 희롱 대사는 직전 행동·표정·선택·모순·과거 콜백 중 최소 하나에 실제로 묶여야 한다. 구체적 촉발점이 없으면 범용 희롱 대사를 만들지 않는다.
- 짓궂음=${mischief}/100(${settingBand(mischief,'절제','중간','적극')}), 직접성=${directness}/100(${settingBand(directness,'우회','혼합','직접')}), 장난기=${playfulness}/100(${settingBand(playfulness,'낮음','중간','높음')}). 이 값은 화법 강도이며 범용 욕망 선언이나 같은 멸칭 반복으로 대체하지 않는다.
- 상대 반응을 놀릴 때는 그 장면에서 실제 관찰 가능한 변화만 사용한다. 근거 없이 상대가 부끄러워한다/원한다/굴복했다고 단정해 대사를 만들지 않는다.
- 희롱 두 줄 이상이 연달아 나오면 다음 비트는 상대의 응답·행동·침묵·주제 전환 중 하나로 리듬을 바꾼다. 한 인물을 계속 평가하고 다른 인물은 반응만 하는 구조를 피한다.
- 최종 범용성 검사: 이름만 바꿔 다른 커플에게 붙여도 자연스러운 핵심 대사는 다시 쓴다. 현재 화의 사건·관계 거리·직전 선택이 빠지면 성립하지 않는 대사를 우선한다.
- 언어 방화벽: ${insultRule}
- 언어 방화벽은 일반적인 연도 표현을 건드리지 않는다. 금지된 사람 멸칭 대신 캐릭터에 맞는 비성별 욕설·빈정거림·행동 반응 또는 침묵을 선택한다.`.trim();
  }

  function sanitizeSurfaces(){
    if(!firewallActive()) return false;
    let changed=false;
    const novel=document.getElementById('novelText');
    if(novel){
      const before=String(novel.innerText || '');
      const after=sanitizeGenderedInsults(before);
      if(after!==before){ novel.innerText=after; changed=true; }
    }
    try{
      if(typeof storyHistory!=='undefined' && storyHistory){
        const before=String(storyHistory);
        const after=sanitizeGenderedInsults(before);
        if(after!==before){ storyHistory=after; changed=true; }
      }
    }catch(_){}
    try{
      if(typeof sessionEpisodes!=='undefined' && Array.isArray(sessionEpisodes)){
        sessionEpisodes=sessionEpisodes.map(row=>{
          if(!row || typeof row.text!=='string') return row;
          const after=sanitizeGenderedInsults(row.text);
          if(after!==row.text){ changed=true; return Object.assign({},row,{text:after}); }
          return row;
        });
      }
    }catch(_){}
    return changed;
  }

  async function persistIfChanged(changed){
    if(!changed) return;
    try{ await window.__VELOUR_IDB_SAVE_DRAFT__?.(); }catch(_){}
    try{ await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(snapshot()); }catch(_){}
  }

  function installPromptWrapper(){
    if(window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_PROMPT__) return true;
    if(typeof window.buildPrompt!=='function' || !window.__VELOUR_VERBAL_CHEMISTRY_V2__) return false;
    const previous=window.buildPrompt;
    window.buildPrompt=function(){
      const raw=String(previous.apply(this,arguments) || '');
      return `${raw}\n\n${directive()}`.trim();
    };
    window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_PROMPT__=true;
    return true;
  }

  function installGenerationWrapper(){
    if(window.__VELOUR_LANGUAGE_FIREWALL_GENERATION__) return true;
    if(typeof window.generateStory!=='function') return false;
    const previous=window.generateStory;
    window.generateStory=async function(){
      const result=await previous.apply(this,arguments);
      const changed=sanitizeSurfaces();
      await persistIfChanged(changed);
      return result;
    };
    window.__VELOUR_LANGUAGE_FIREWALL_GENERATION__=true;
    return true;
  }

  function installVaultWrapper(){
    if(window.__VELOUR_LANGUAGE_FIREWALL_VAULT__) return true;
    if(typeof window.acceptVelourVaultResponse!=='function') return false;
    const previous=window.acceptVelourVaultResponse;
    window.acceptVelourVaultResponse=async function(){
      const result=await previous.apply(this,arguments);
      const changed=sanitizeSurfaces();
      await persistIfChanged(changed);
      return result;
    };

    const previousShow=window.showVelourResponseVault;
    if(typeof previousShow==='function'){
      window.showVelourResponseVault=async function(){
        const result=await previousShow.apply(this,arguments);
        setTimeout(()=>{
          document.querySelectorAll?.('[data-vault-accept]').forEach(btn=>{
            const original=btn.onclick;
            if(btn.dataset.languageFirewallBound==='1') return;
            btn.dataset.languageFirewallBound='1';
            btn.onclick=async event=>{
              if(typeof original==='function'){
                await original.call(btn,event);
                const changed=sanitizeSurfaces();
                await persistIfChanged(changed);
              }
            };
          });
        },0);
        return result;
      };
    }

    const observer=new MutationObserver(()=>{
      document.querySelectorAll?.('[data-vault-accept-review]').forEach(btn=>{
        if(btn.dataset.languageFirewallBound==='1') return;
        btn.dataset.languageFirewallBound='1';
        btn.onclick=()=>window.showVelourResponseVault?.();
      });
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.__VELOUR_LANGUAGE_FIREWALL_VAULT__=true;
    return true;
  }

  function install(){
    if(window[GUARD]) return true;
    if(!window.__VELOUR_VERBAL_CHEMISTRY_V2__) return false;
    if(!installPromptWrapper()) return false;
    installGenerationWrapper();
    installVaultWrapper();
    window[GUARD]=true;
    window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_VERSION__=VERSION;
    window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_QA__={
      version:VERSION, vcConfig, selectedTactics, insultMode, directive,
      sanitizeGenderedInsults, containsForbiddenGenderedInsult, sanitizeSurfaces
    };
    console.info('✦ VELOUR Verbal Chemistry refinement + language firewall loaded');
    return true;
  }

  if(install()) return;
  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    if(install() || tries>400) clearInterval(timer);
  },50);
})();
