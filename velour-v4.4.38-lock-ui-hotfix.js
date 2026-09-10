'use strict';

/* VELOUR — move the authenticated lock control into the header action cluster. */
(() => {
  'use strict';
  if (window.__VELOUR_LOCK_UI_HOTFIX__) return;
  window.__VELOUR_LOCK_UI_HOTFIX__ = true;

  const style = document.createElement('style');
  style.id = 'velour-lock-ui-hotfix-css';
  style.textContent = `
    header.velour-header-lock-layout{align-items:flex-start;gap:10px}
    .velour-header-actions{display:grid;grid-template-columns:max-content max-content;gap:7px 8px;justify-content:end;align-items:center;flex:0 0 auto}
    .velour-header-actions #btnStoryLibrary{grid-column:1;grid-row:1}
    .velour-header-actions .velour-api-settings-btn{grid-column:2;grid-row:1}
    #velourLogoutBtn.velour-header-lock-btn{
      position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
      z-index:auto!important;grid-column:2;grid-row:2;justify-self:stretch;min-height:40px;margin:0!important;
      border:1px solid rgba(245,196,107,.24)!important;border-radius:14px!important;
      background:rgba(26,8,17,.82)!important;color:#f3d48c!important;padding:8px 12px!important;
      font-size:11px!important;font-weight:750!important;line-height:1!important;opacity:1!important;
      backdrop-filter:blur(12px);box-shadow:0 4px 14px rgba(0,0,0,.28);touch-action:manipulation
    }
    @media(max-width:390px){
      header.velour-header-lock-layout{gap:7px}
      .velour-header-actions{gap:6px}
      .velour-header-actions .icon-btn{padding:8px 11px;font-size:11px}
      #velourLogoutBtn.velour-header-lock-btn{min-height:38px;padding:7px 10px!important;font-size:10.5px!important}
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function install(){
    const header = document.querySelector('header');
    const lock = document.getElementById('velourLogoutBtn');
    if (!header || !lock) return false;

    header.classList.add('velour-header-lock-layout');
    let actions = header.querySelector('.velour-header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'velour-header-actions';
      header.appendChild(actions);
    }

    const settings = header.querySelector('button[onclick*="openSettings"], .icon-btn:not(#btnStoryLibrary)');
    const library = document.getElementById('btnStoryLibrary');
    if (library && library.parentElement !== actions) actions.appendChild(library);
    if (settings) {
      settings.classList.add('velour-api-settings-btn');
      if (settings.parentElement !== actions) actions.appendChild(settings);
    }
    if (lock.parentElement !== actions) actions.appendChild(lock);
    lock.classList.add('velour-header-lock-btn');
    lock.textContent = '🔒 잠금';
    lock.title = 'VELOUR 잠금 / 로그아웃';
    return true;
  }

  install();
  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, {subtree:true, childList:true});
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 200) clearInterval(timer);
  }, 100);

  console.info('✦ VELOUR header lock UI loaded');
})();
