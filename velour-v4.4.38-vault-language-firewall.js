'use strict';

/* VELOUR — vault acceptance language-firewall bridge.
   Vault buttons close over the original accept function, so this bridge also
   wraps the actual DOM button handlers instead of relying only on window.*.
*/
(() => {
  'use strict';
  const GUARD='__VELOUR_VAULT_LANGUAGE_FIREWALL__';
  if(window[GUARD])return;
  window[GUARD]=true;

  function qa(){return window.__VELOUR_LANGUAGE_FIREWALL_QA__||null;}
  function snapshot(){try{return window.__VELOUR_V4_STATE_SNAPSHOT__?.()||{};}catch(_){return {};}}
  async function sanitizeAndPersist(){
    const q=qa();if(!q?.sanitizeSurfaces)return false;
    const changed=!!q.sanitizeSurfaces();
    if(!changed)return false;
    try{await window.__VELOUR_IDB_SAVE_DRAFT__?.();}catch(_){}
    try{await window.__VELOUR_IDB_PATCH_DRAFT_V4__?.(snapshot());}catch(_){}
    return true;
  }

  function bindButton(btn){
    if(!btn||btn.dataset?.velourLanguageFirewall==='1'||typeof btn.onclick!=='function')return;
    const original=btn.onclick;
    if(btn.dataset)btn.dataset.velourLanguageFirewall='1';
    btn.onclick=async function(event){
      const result=await original.call(this,event);
      await Promise.resolve();
      await sanitizeAndPersist();
      return result;
    };
  }
  function sweep(){
    document.querySelectorAll?.('[data-vault-accept],[data-vault-accept-review]').forEach(bindButton);
    try{qa()?.sanitizeVaultList?.();}catch(_){}
  }

  const oldAccept=window.acceptVelourVaultResponse;
  if(typeof oldAccept==='function'){
    window.acceptVelourVaultResponse=async function(){const result=await oldAccept.apply(this,arguments);await sanitizeAndPersist();return result;};
  }
  const oldShow=window.showVelourResponseVault;
  if(typeof oldShow==='function'){
    window.showVelourResponseVault=async function(){const result=await oldShow.apply(this,arguments);sweep();setTimeout(sweep,0);return result;};
  }

  const observer=new MutationObserver(sweep);
  observer.observe(document.body,{subtree:true,childList:true});
  sweep();
  console.info('✦ VELOUR vault language firewall bridge loaded');
})();
