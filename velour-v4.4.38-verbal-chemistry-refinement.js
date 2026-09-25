'use strict';

/* VELOUR — Verbal Chemistry V2.2 language firewall.
   Prompt planning now lives only in verbal-chemistry-v2.js. This file is a
   deterministic display/history/persistence safety net for gendered insults.
*/
(() => {
  'use strict';

  const VERSION='2.2.2';
  const GUARD='__VELOUR_VERBAL_CHEMISTRY_REFINEMENT__';
  const YEAR_TOKEN='__VELOUR_YEARSPAN_';
  const clean=(v,max=120)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,max);
  const INSULT_PREFIXES=[
    '싸가지없는','재수없는','빌어먹을','좆같은','개같은','더러운','미친','씨발','시발','씨팔','시팔',
    '걸레','화냥','독한','천한','망할','못된','나쁜','썅','쌍','좆'
  ];
  const PARTICLES='이라고|한테|에게|께서|처럼|보다|밖에|부터|까지|조차|마저|같은|같이|하고|이랑|으로|이라|아|야|이|은|는|을|를|도|만|과|와|의|로';
  const PARTICLE_CHAIN=`(?:${PARTICLES}){0,2}`;
  const escapeRx=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const PREFIX_ALT=INSULT_PREFIXES.slice().sort((a,b)=>b.length-a.length).map(escapeRx).join('|');

  function snapshot(){try{return window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{};}catch(_){return {};}}
  function insultMode(){
    const s=snapshot();
    return clean(s?.insultMode||document.getElementById('v4Insult')?.value||'off',40).toLowerCase();
  }
  function firewallActive(mode=insultMode()){return String(mode||'').toLowerCase()!=='custom';}

  function protectYearSpans(text){
    const kept=[];
    const src=String(text||'');
    const protect=m=>{const i=kept.push(m)-1;return `${YEAR_TOKEN}${i}__`;};
    let out=src;
    const number='(?:\\d+|[일이삼사오육칠팔구십백천한두세네다섯여섯일곱여덟아홉열]+)';
    out=out.replace(new RegExp(`(${number}\\s*개년)(?=\\s*(?:계획|사업|정책|과정|주기|기간|동안|간|로드맵|프로젝트|전략|예산|목표|평균|단위|치)?(?:\\s|[.,!?…]|$))`,'g'),protect);
    const span='(?:\\d+|몇|수십|수백|수천|수만|십수|한두|두세|서너|여러|[일이삼사오육칠팔구십백천한두세네다섯여섯일곱여덟아홉열]+)';
    out=out.replace(new RegExp(`(${span}\\s*년)(?=\\s*(?:간|동안|째|차|후|뒤|전|사이|이상|이하|내|마다|주기|기간|도|대)?(?:\\s|[.,!?…]|$))`,'g'),protect);
    return {text:out,restore(value){return String(value||'').replace(new RegExp(`${YEAR_TOKEN}(\\d+)__`,'g'),(_m,n)=>kept[Number(n)]??_m);}};
  }

  function replacement(prefix,suffix=''){
    const p=String(prefix||'').replace(/\s+/g,'');
    const mapped={
      '미친':'미친 인간','썅':'빌어먹을 인간','쌍':'빌어먹을 인간','개같은':'개같은 인간',
      '씨발':'빌어먹을 인간','시발':'빌어먹을 인간','씨팔':'빌어먹을 인간','시팔':'빌어먹을 인간',
      '좆같은':'더러운 인간','좆':'더러운 인간','빌어먹을':'빌어먹을 인간',
      '걸레':'천박한 인간','화냥':'천박한 인간','독한':'독한 인간','천한':'천한 인간',
      '더러운':'더러운 인간','망할':'망할 인간','못된':'못된 인간','나쁜':'나쁜 인간',
      '재수없는':'재수없는 인간','싸가지없는':'싸가지없는 인간'
    };
    return `${mapped[p]||'못된 인간'}${suffix||''}`;
  }

  function prefixedGenderedRegex(flags='g'){
    return new RegExp(`(${PREFIX_ALT})\\s*년(${PARTICLE_CHAIN})`,flags);
  }
  function standaloneGenderedRegex(flags='g'){
    return new RegExp(`(^|[\\s“”'\"(])년(${PARTICLE_CHAIN})(?=[!?,.…\\s)”'\"}]|$)`,flags);
  }
  function standaloneGaeNyeonRegex(flags='g'){
    return new RegExp(`(^|[\\s“”'\"(])개\\s*년(${PARTICLE_CHAIN})(?=[!?,.…\\s)”'\"}]|$)`,flags);
  }
  function demonstrativeNyeonRegex(flags='g'){
    return new RegExp(`(^|[\\s“”'\"(])((?:이|저|그)\\s*)년(${PARTICLE_CHAIN})(?=[!?,.…\\s)”'\"}]|$)`,flags);
  }

  function sanitizeGenderedInsults(text,mode=insultMode()){
    let out=String(text||'');
    if(!firewallActive(mode)||!out)return out;
    const protectedYear=protectYearSpans(out);out=protectedYear.text;

    // Person-directed gendered insults are deterministic post-generation filters only.
    // They are never injected as examples into the model prompt.
    out=out.replace(prefixedGenderedRegex('g'),(_all,prefix,suffix)=>replacement(prefix,suffix||''));
    // Standalone profanity form "개년" is handled separately so numeric year-span terms can be protected first.
    out=out.replace(standaloneGaeNyeonRegex('g'),(_all,lead,suffix)=>`${lead}개같은 인간${suffix||''}`);
    out=out.replace(demonstrativeNyeonRegex('g'),(_all,lead,det,suffix)=>`${lead}${det}인간${suffix||''}`);
    // Any remaining standalone person-noun usage is forbidden in OFF/LIGHT mode.
    // Year expressions have already been token-protected above, so adjective + standalone noun forms
    // no longer require an ever-growing prefix dictionary. Chained particles are covered too.
    out=out.replace(standaloneGenderedRegex('g'),(_all,lead,suffix)=>`${lead}인간${suffix||''}`);
    return protectedYear.restore(out);
  }

  function containsForbiddenGenderedInsult(text,mode=insultMode()){
    if(!firewallActive(mode))return false;
    const protectedYear=protectYearSpans(String(text||''));
    const src=protectedYear.text;
    return [prefixedGenderedRegex(''),standaloneGaeNyeonRegex(''),demonstrativeNyeonRegex(''),standaloneGenderedRegex('')].some(rx=>rx.test(src));
  }

  function sanitizeSurfaces(){
    if(!firewallActive())return false;
    let changed=false;
    const novel=document.getElementById('novelText');
    if(novel){const before=String(novel.innerText||''),after=sanitizeGenderedInsults(before);if(after!==before){novel.innerText=after;changed=true;}}
    try{if(typeof storyHistory!=='undefined'&&storyHistory){const before=String(storyHistory),after=sanitizeGenderedInsults(before);if(after!==before){storyHistory=after;changed=true;}}}catch(_){}
    try{
      if(typeof sessionEpisodes!=='undefined'&&Array.isArray(sessionEpisodes)){
        sessionEpisodes=sessionEpisodes.map(row=>{if(!row||typeof row.text!=='string')return row;const after=sanitizeGenderedInsults(row.text);if(after!==row.text){changed=true;return Object.assign({},row,{text:after});}return row;});
      }
    }catch(_){}
    return changed;
  }
  async function persistIfChanged(changed){
    if(!changed)return;
    try{await window.__VELOUR_IDB_SAVE_DRAFT__?.();}catch(_){}
    try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(snapshot());}catch(_){}
  }

  function installGenerationWrapper(){
    if(window.__VELOUR_LANGUAGE_FIREWALL_GENERATION__)return true;
    if(typeof window.generateStory!=='function')return false;
    const previous=window.generateStory;
    window.generateStory=async function(){const result=await previous.apply(this,arguments);const changed=sanitizeSurfaces();await persistIfChanged(changed);return result;};
    window.__VELOUR_LANGUAGE_FIREWALL_GENERATION__=true;return true;
  }

  function sanitizeVaultList(){
    if(!firewallActive())return;
    const list=document.getElementById('velourVaultList');if(!list)return;
    list.querySelectorAll?.('*').forEach(el=>{if(el.children?.length)return;const before=String(el.textContent||'');const after=sanitizeGenderedInsults(before);if(after!==before)el.textContent=after;});
  }
  function installVaultDisplayWrapper(){
    if(window.__VELOUR_LANGUAGE_FIREWALL_VAULT_DISPLAY__)return true;
    if(typeof window.showVelourResponseVault!=='function')return false;
    const previous=window.showVelourResponseVault;
    window.showVelourResponseVault=async function(){const result=await previous.apply(this,arguments);sanitizeVaultList();setTimeout(sanitizeVaultList,0);return result;};
    window.__VELOUR_LANGUAGE_FIREWALL_VAULT_DISPLAY__=true;return true;
  }

  function install(){
    if(window[GUARD])return true;
    if(!window.__VELOUR_VERBAL_CHEMISTRY_V2__)return false;
    installGenerationWrapper();installVaultDisplayWrapper();
    window[GUARD]=true;
    window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_VERSION__=VERSION;
    window.__VELOUR_LANGUAGE_FIREWALL_QA__={version:VERSION,insultMode,protectYearSpans,sanitizeGenderedInsults,containsForbiddenGenderedInsult,sanitizeSurfaces,sanitizeVaultList};
    window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_QA__=window.__VELOUR_LANGUAGE_FIREWALL_QA__;
    console.info('✦ VELOUR Verbal Chemistry V2.2.2 language firewall loaded');return true;
  }
  if(!install()){let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(timer);},80);}
})();