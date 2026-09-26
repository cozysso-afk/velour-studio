'use strict';

/* VELOUR — UI Hierarchy V2
   Presentation-only layer. It does not wrap buildPrompt or change story state.
   Goals:
   - keep character profile controls out of the writing-style section
   - keep intimacy preferences in their own top-level accordion
   - move heroine scene agency beside character controls
   - preserve all original controls/listeners/state by moving nodes or proxying clicks
   - reduce nested borders, tiny type, and vertical sprawl on mobile
*/
(() => {
  'use strict';
  const GUARD='__VELOUR_UI_HIERARCHY_V2__';
  if(window[GUARD])return;
  window[GUARD]=true;
  const VERSION='1.1.1';
  let scheduled=false;
  let elementSeq=0;
  const elementIds=new WeakMap();

  const eid=el=>{
    if(!el)return 'none';
    if(!elementIds.has(el))elementIds.set(el,`e${++elementSeq}`);
    return elementIds.get(el);
  };

  function installCss(){
    if(document.getElementById('velour-ui-hierarchy-v2-css'))return;
    const style=document.createElement('style');
    style.id='velour-ui-hierarchy-v2-css';
    style.textContent=`
      #velourCharacterProfileHub,#velourIntimacyPreferenceHub{
        margin-top:7px!important;border:1px solid rgba(239,194,112,.28)!important;
        border-radius:14px!important;background:rgba(22,7,13,.96)!important;overflow:hidden;
      }
      #velourCharacterProfileHub>summary,#velourIntimacyPreferenceHub>summary{
        min-height:48px;padding:11px 38px 11px 13px!important;box-sizing:border-box;
        color:#f3d18e!important;font-size:13px!important;font-weight:800!important;line-height:1.4!important;
        cursor:pointer;list-style:none;position:relative;
      }
      #velourCharacterProfileHub>summary::-webkit-details-marker,#velourIntimacyPreferenceHub>summary::-webkit-details-marker{display:none}
      #velourCharacterProfileHub>summary::after,#velourIntimacyPreferenceHub>summary::after{
        content:'＋';position:absolute;right:13px;top:50%;transform:translateY(-50%);color:#a99199;font-size:15px;
      }
      #velourCharacterProfileHub[open]>summary::after,#velourIntimacyPreferenceHub[open]>summary::after{content:'－'}
      #velourCharacterProfileHub[open]>summary,#velourIntimacyPreferenceHub[open]>summary{border-bottom:1px solid rgba(239,194,112,.12)}
      .velour-v2-hub-body{padding:11px}
      .velour-v2-hub-note{margin:0 0 9px;color:#bda9b1;font-size:11px;line-height:1.55}
      .velour-v2-group{margin-top:9px;padding:10px;border:1px solid rgba(239,194,112,.17);border-radius:12px;background:rgba(37,11,19,.92)}
      .velour-v2-group:first-child{margin-top:0}
      .velour-v2-group-label{margin:0 0 8px;color:#e9c982;font-size:11px;font-weight:800;letter-spacing:.04em}

      #velourSceneGovernorV1,#velourEnsemblePrefsV1{
        margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;
      }
      #velourEnsemblePrefsV1>div:first-child{display:none!important}
      #velourEnsemblePrefsV1 [data-char-kind]{
        margin-top:8px!important;padding:0!important;border:1px solid rgba(239,194,112,.18)!important;
        border-radius:11px!important;background:rgba(24,7,13,.96)!important;overflow:hidden;
      }
      #velourEnsemblePrefsV1 [data-char-kind]>summary{
        min-height:44px;padding:10px 11px!important;display:flex;align-items:center;cursor:pointer;
        color:#f2ddb1!important;font-size:12.5px!important;font-weight:800!important;line-height:1.4!important;
      }
      #velourEnsemblePrefsV1 [data-char-kind]>div{padding:0 10px 10px!important;gap:8px!important}
      #velourEnsemblePrefsV1 input,#velourEnsemblePrefsV1 select,#velourEnsemblePrefsV1 textarea{
        min-height:42px!important;font-size:12.5px!important;line-height:1.45!important;border-radius:10px!important;
        background:rgba(14,4,9,.96)!important;color:#f7ece6!important;
      }
      #velourEnsemblePrefsV1 button{min-height:38px!important;font-size:11.5px!important;line-height:1.35!important}
      #velourEnsemblePrefsV1 .velour-source-note{font-size:10.5px!important;line-height:1.5!important;padding:7px 8px!important}
      #velourEnsemblePrefsV1 .velour-chip-picker{background:rgba(14,4,9,.55)!important;border-color:rgba(239,194,112,.14)!important}
      #velourEnsemblePrefsV1 .velour-chip-picker>summary{min-height:40px;padding:9px!important;font-size:11.5px!important;display:flex;align-items:center}
      #velourEnsemblePrefsV1 .vcp-tag{font-size:11px!important;min-height:36px!important;padding:7px 9px!important}
      .velour-v2-name-roster{display:grid;gap:7px;margin-bottom:9px}
      .velour-v2-name-row{display:grid;grid-template-columns:74px minmax(0,1fr);gap:8px;align-items:center}
      .velour-v2-name-row label{font-size:11px;color:#d5c2c8;font-weight:700}
      .velour-v2-name-row input{min-width:0;min-height:42px;border-radius:9px;font-size:12.5px;padding:8px 10px;background:rgba(14,4,9,.96);color:#f7ece6;border:1px solid rgba(239,194,112,.20)}
      .velour-v2-name-source,.velour-v2-pref-source{display:none!important}

      #velourIntimacyDepthV1{display:none!important}
      .velour-v2-intimacy-shelf{display:grid;gap:8px}
      .velour-v2-intimacy-card{
        border:1px solid rgba(239,194,112,.18);border-radius:11px;background:rgba(24,7,13,.96);overflow:hidden;
      }
      .velour-v2-intimacy-card>summary{
        min-height:44px;padding:10px 11px!important;display:flex;align-items:center;cursor:pointer;
        color:#f2ddb1!important;font-size:12.5px!important;font-weight:800!important;line-height:1.4!important;
      }
      .velour-v2-intimacy-body{padding:0 9px 9px}
      .velour-v2-intimacy-section,.velour-v2-depth-section{
        margin-top:7px;border:1px solid rgba(239,194,112,.14);border-radius:9px;background:rgba(13,4,9,.76);overflow:hidden;
      }
      .velour-v2-intimacy-section>summary,.velour-v2-depth-section>summary{
        min-height:40px;padding:9px!important;display:flex;align-items:center;cursor:pointer;
        color:#e8d8cf!important;font-size:11.5px!important;font-weight:700!important;line-height:1.4!important;
      }
      .velour-v2-mode-grid,.velour-v2-depth-section>div{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;margin:0!important;padding:0 7px 7px!important;
      }
      .velour-v2-mode-btn,.velour-v2-depth-section [data-depth-kind]{
        min-width:0!important;min-height:40px!important;padding:7px 8px!important;text-align:left!important;
        border-radius:8px!important;font-size:11px!important;line-height:1.35!important;white-space:normal!important;
        border:1px solid rgba(239,194,112,.22)!important;background:rgba(255,255,255,.035)!important;color:#ebd9d0!important;
      }
      .velour-v2-mode-btn[data-mode='priority'],.velour-v2-depth-section [data-mode='priority']{
        border-color:rgba(245,196,107,.68)!important;background:rgba(245,196,107,.17)!important;color:#ffebaa!important;
      }
      .velour-v2-mode-btn[data-mode='off'],.velour-v2-depth-section [data-mode='off']{
        border-color:rgba(145,137,149,.18)!important;background:rgba(120,115,130,.06)!important;color:rgba(220,210,215,.46)!important;
      }

      #velourVerbalChemistryPanel{margin-top:9px;border:1px solid rgba(239,194,112,.14);border-radius:10px;background:rgba(20,6,12,.72);overflow:hidden}
      #velourVerbalChemistryPanel>summary{min-height:42px;padding:9px 10px!important;display:flex;align-items:center;cursor:pointer;color:#e7d2aa!important;font-size:11.5px!important;font-weight:750!important}
      #velourVerbalChemistryPanel .velour-v2-subpanel-body{padding:0 9px 9px}
      #velourVerbalChemistryV2{margin:0!important;padding:9px!important;border:0!important;background:transparent!important}
      #velourVerbalChemistryV2 .velour-vc2-title{display:none!important}
      #velourVerbalChemistryV2 .velour-vc2-field label,#velourVerbalChemistryV2 .velour-vc2-tag{font-size:11px!important}
      #velourVerbalChemistryV2 .velour-vc2-note{font-size:10.5px!important;line-height:1.5!important}

      @media(max-width:390px){
        #velourCharacterProfileHub>summary,#velourIntimacyPreferenceHub>summary{font-size:12.5px!important}
        .velour-v2-hub-body{padding:9px}
        .velour-v2-group{padding:9px}
        .velour-v2-mode-grid,.velour-v2-depth-section>div{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important}
        .velour-v2-mode-btn,.velour-v2-depth-section [data-depth-kind]{font-size:10.5px!important;padding:7px!important}
      }
    `;
    (document.head||document.documentElement).appendChild(style);
  }

  function makeHub(id,label,note){
    const details=document.createElement('details');
    details.id=id;
    details.className='v40-section velour-v2-hub';
    const summary=document.createElement('summary');summary.textContent=label;
    const body=document.createElement('div');body.className='velour-v2-hub-body';
    if(note){const p=document.createElement('div');p.className='velour-v2-hub-note';p.textContent=note;body.appendChild(p);}
    details.append(summary,body);
    return details;
  }

  function ensureHubs(){
    const engine=document.getElementById('velourV40Panel');
    const occupation=document.getElementById('v41SecOccupation');
    if(!engine||!occupation)return null;
    let profile=document.getElementById('velourCharacterProfileHub');
    if(!profile){
      profile=makeHub('velourCharacterProfileHub','인물 설정 · 성격/말투/적극성','직업·외형·현재 관계는 위 기본 설정을 그대로 사용하고, 여기서는 인물별 말투·성격·행동 성향과 적극성만 조정해.');
      occupation.insertAdjacentElement('afterend',profile);
    }
    let intimacy=document.getElementById('velourIntimacyPreferenceHub');
    if(!intimacy){
      intimacy=makeHub('velourIntimacyPreferenceHub','친밀 취향 · 캐릭터별 선호','인물 프로필과 분리된 선택 영역. 기본 화면에서는 접혀 있고, 필요한 캐릭터만 열어서 주력/허용/OFF를 조정해.');
      profile.insertAdjacentElement('afterend',intimacy);
    }else if(intimacy.previousElementSibling!==profile){
      profile.insertAdjacentElement('afterend',intimacy);
    }
    return {engine,profile,intimacy,profileBody:profile.querySelector('.velour-v2-hub-body'),intimacyBody:intimacy.querySelector('.velour-v2-hub-body')};
  }

  function ensureGroup(parent,id,label){
    let box=document.getElementById(id);
    if(!box){
      box=document.createElement('div');box.id=id;box.className='velour-v2-group';
      const title=document.createElement('div');title.className='velour-v2-group-label';title.textContent=label;
      box.appendChild(title);parent.appendChild(box);
    }
    return box;
  }

  function moveProfileModules(ctx){
    const oldHub=document.getElementById('velourCharacterPreferenceHub');
    const agency=document.getElementById('velourSceneGovernorV1');
    const ensemble=document.getElementById('velourEnsemblePrefsV1');
    const agencyBox=ensureGroup(ctx.profileBody,'velourCharacterAgencyGroup','여주 적극성 · SCENE AGENCY');
    const profileBox=ensureGroup(ctx.profileBody,'velourCharacterProfilesGroup','인물 프로필 · 말투/성격/행동');
    if(agency&&agency.parentNode!==agencyBox)agencyBox.appendChild(agency);
    if(ensemble&&ensemble.parentNode!==profileBox)profileBox.appendChild(ensemble);
    if(oldHub){
      const depth=oldHub.querySelector('#velourIntimacyDepthV1');
      if(depth&&depth.parentNode===oldHub.querySelector('.velour-authoring-hub-body'))ctx.intimacyBody.appendChild(depth);
      if(!oldHub.querySelector('#velourEnsemblePrefsV1')&&!oldHub.querySelector('#velourIntimacyDepthV1'))oldHub.remove();
    }
    if(!ensemble)return null;
    ensemble.querySelectorAll('[data-char-kind]').forEach(card=>{
      card.querySelectorAll('[data-pref-grid="position"],[data-pref-grid="caress"]').forEach(grid=>grid.closest('details')?.classList.add('velour-v2-pref-source'));
    });
    return ensemble;
  }

  function rebuildNameRoster(ctx,ensemble,force=false){
    if(!ctx?.profileBody||!ensemble)return;
    const cards=Array.from(ensemble.querySelectorAll('[data-char-kind]'));
    const fingerprint=cards.map((card,i)=>`${card.dataset.charKind}:${card.dataset.charIndex||i}:${cleanName(card,i+1)}`).join('|');
    let roster=document.getElementById('velourCharacterNameRoster');
    // Never replace the active name editor while the user is typing.
    if(roster&&roster.contains(document.activeElement))return;
    if(roster&&!force&&roster.dataset.fingerprint===fingerprint)return;
    roster?.remove?.();
    roster=document.createElement('div');
    roster.id='velourCharacterNameRoster';roster.className='velour-v2-group';roster.dataset.fingerprint=fingerprint;
    const title=document.createElement('div');title.className='velour-v2-group-label';title.textContent='이름 · 인물 고정';
    const note=document.createElement('div');note.className='velour-v2-hub-note';note.textContent='여기에 적은 이름이 캐릭터 이름의 단일 원본이야. 1:다에서는 상대별 이름을 모두 고정해 두면 생성 중 임의 개명이나 인물 혼동을 막을 수 있어.';
    const list=document.createElement('div');list.className='velour-v2-name-roster';
    cards.forEach((card,i)=>{
      const original=card.querySelector('[data-field="name"]');if(!original)return;original.classList.add('velour-v2-name-source');
      const row=document.createElement('div');row.className='velour-v2-name-row';
      const label=document.createElement('label');label.textContent=card.dataset.charKind==='heroine'?'여주':`상대 ${Number(card.dataset.charIndex||i)+1}`;
      const input=document.createElement('input');input.type='text';input.value=original.value||'';input.placeholder=card.dataset.charKind==='heroine'?'여주 이름':'상대 이름을 고정';
      const syncValue=(kind)=>{original.value=input.value;original.dispatchEvent(new Event(kind,{bubbles:true}));};
      const syncSummary=()=>{const summary=card.querySelector(':scope>summary');if(summary)summary.textContent=`${card.dataset.charKind==='heroine'?'여주':`상대 ${Number(card.dataset.charIndex||i)+1}`} · ${String(input.value||'').trim()||'이름 미설정'}`;};
      input.addEventListener('input',()=>syncValue('input'));
      input.addEventListener('change',()=>{syncValue('change');syncSummary();schedule(true);});
      row.append(label,input);list.appendChild(row);
    });
    roster.append(title,note,list);
    const firstGroup=ctx.profileBody.querySelector('.velour-v2-group');
    if(firstGroup)ctx.profileBody.insertBefore(roster,firstGroup);else ctx.profileBody.appendChild(roster);
  }

  function cleanName(card,index){
    const name=String(card?.querySelector?.('[data-field="name"]')?.value||'').trim();
    if(name)return name;
    return card?.dataset?.charKind==='heroine'?'여주':`상대 ${index}`;
  }

  function syncProxy(proxy,original){
    if(!proxy||!original)return;
    const mode=String(original.dataset.mode||'allowed');
    proxy.dataset.mode=mode;
    proxy.textContent=String(original.textContent||'').trim();
    proxy.setAttribute('aria-pressed',mode==='priority'?'true':'false');
  }

  function proxySection(card,gridName,label){
    const originalGrid=card.querySelector(`[data-pref-grid="${gridName}"]`);
    if(!originalGrid)return null;
    const originals=Array.from(originalGrid.querySelectorAll('[data-pref-id]'));
    if(!originals.length)return null;
    const details=document.createElement('details');details.className='velour-v2-intimacy-section';
    const summary=document.createElement('summary');summary.textContent=label;
    const grid=document.createElement('div');grid.className='velour-v2-mode-grid';
    originals.forEach(original=>{
      const proxy=document.createElement('button');proxy.type='button';proxy.className='velour-v2-mode-btn';
      syncProxy(proxy,original);
      proxy.addEventListener('click',()=>{
        original.click();
        Promise.resolve().then(()=>syncProxy(proxy,original));
      });
      grid.appendChild(proxy);
    });
    details.append(summary,grid);
    return details;
  }

  function depthSectionsByIndex(depth){
    if(!depth)return [];
    return Array.from(depth.querySelectorAll('[data-depth-char]')).map(card=>{
      const sections=Array.from(card.querySelectorAll(':scope>details'));
      sections.forEach((section,i)=>{
        section.classList.add('velour-v2-depth-section');
        const summary=section.querySelector(':scope>summary');
        if(summary)summary.textContent=i===0?'성적 스타일':'자극 · 플레이';
      });
      return sections;
    });
  }

  function rebuildIntimacy(ctx,ensemble,force=false){
    if(!ensemble)return;
    const depth=document.getElementById('velourIntimacyDepthV1');
    if(depth&&depth.parentNode!==ctx.intimacyBody)ctx.intimacyBody.appendChild(depth);
    const cards=Array.from(ensemble.querySelectorAll('[data-char-kind]'));
    const fingerprint=`${eid(ensemble)}|${eid(depth)}|${depth?.dataset?.characterSignature||''}|${cards.map((c,i)=>`${c.dataset.charKind}:${cleanName(c,i+1)}`).join('|')}`;
    let shelf=document.getElementById('velourIntimacyPreferenceShelf');
    if(shelf&&!force&&shelf.dataset.fingerprint===fingerprint)return;
    if(shelf)shelf.remove();
    shelf=document.createElement('div');shelf.id='velourIntimacyPreferenceShelf';shelf.className='velour-v2-intimacy-shelf';shelf.dataset.fingerprint=fingerprint;
    const depthRows=depthSectionsByIndex(depth);
    cards.forEach((card,i)=>{
      const item=document.createElement('details');item.className='velour-v2-intimacy-card';
      const summary=document.createElement('summary');summary.textContent=`${card.dataset.charKind==='heroine'?'여주':'상대'} · ${cleanName(card,i+1)}`;
      const body=document.createElement('div');body.className='velour-v2-intimacy-body';
      const position=proxySection(card,'position','친밀 구도');if(position)body.appendChild(position);
      const caress=depth?null:proxySection(card,'caress','애정 · 애무');if(caress)body.appendChild(caress);
      (depthRows[i]||[]).forEach(section=>body.appendChild(section));
      item.append(summary,body);shelf.appendChild(item);
    });
    const note=ctx.intimacyBody.querySelector('.velour-v2-hub-note');
    if(note)note.insertAdjacentElement('afterend',shelf);else ctx.intimacyBody.prepend(shelf);
  }

  function normalizeLanguageSection(){
    const language=document.getElementById('v41SecLanguage');
    const chemistry=document.getElementById('velourVerbalChemistryV2');
    if(!language||!chemistry)return;
    let panel=document.getElementById('velourVerbalChemistryPanel');
    if(!panel){
      panel=document.createElement('details');panel.id='velourVerbalChemistryPanel';
      const summary=document.createElement('summary');summary.textContent='대사 성향 · 케미스트리';
      const body=document.createElement('div');body.className='velour-v2-subpanel-body';
      panel.append(summary,body);language.appendChild(panel);
    }
    const body=panel.querySelector('.velour-v2-subpanel-body');
    if(body&&chemistry.parentNode!==body)body.appendChild(chemistry);
  }

  function layout(force=false){
    const ctx=ensureHubs();if(!ctx)return false;
    const ensemble=moveProfileModules(ctx);
    if(!ensemble)return false;
    rebuildNameRoster(ctx,ensemble,force);
    rebuildIntimacy(ctx,ensemble,force);
    normalizeLanguageSection();
    return true;
  }

  function schedule(force=false){
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;layout(force);},0);
  }

  installCss();
  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    if(layout(true)||tries>220){clearInterval(timer);if(tries>220)return;
      const engine=document.getElementById('velourV40Panel');
      if(typeof MutationObserver==='function'&&engine){
        const observer=new MutationObserver(()=>schedule(false));
        observer.observe(engine,{subtree:true,childList:true});
        window.__VELOUR_UI_HIERARCHY_V2_OBSERVER__=observer;
      }
      const profile=document.getElementById('velourCharacterProfileHub');
      profile?.addEventListener?.('input',ev=>{if(ev.target?.matches?.('[data-field="name"]'))schedule(true);},true);
      window.__VELOUR_UI_HIERARCHY_V2_VERSION__=VERSION;
      window.__VELOUR_UI_HIERARCHY_V2_QA__={VERSION,layout,rebuildNameRoster,rebuildIntimacy,normalizeLanguageSection};
      console.info('✦ VELOUR UI Hierarchy V2 loaded');
    }
  },80);
})();