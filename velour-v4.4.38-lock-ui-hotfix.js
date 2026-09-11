'use strict';

/* VELOUR — move the authenticated lock control into the header action cluster. */
(() => {
  'use strict';
  if (window.__VELOUR_LOCK_UI_HOTFIX__) return;
  window.__VELOUR_LOCK_UI_HOTFIX__ = true;

  const style = document.createElement('style');
  style.id = 'velour-lock-ui-hotfix-css';
  style.textContent = `
    header.velour-header-lock-layout{align-items:center;gap:10px}
    .velour-header-actions{display:flex;gap:7px;justify-content:flex-end;align-items:center;flex:0 0 auto}
    #velourLogoutBtn.velour-header-lock-btn{
      position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
      z-index:auto!important;flex:0 0 44px;width:44px!important;min-width:44px!important;min-height:44px;margin:0!important;
      border:1px solid rgba(245,196,107,.24)!important;border-radius:999px!important;
      background:rgba(26,8,17,.82)!important;color:#f3d48c!important;padding:0!important;
      font-size:0!important;font-weight:750!important;line-height:1!important;opacity:1!important;
      backdrop-filter:blur(12px);box-shadow:0 4px 14px rgba(0,0,0,.28);touch-action:manipulation
    }
    #velourLogoutBtn.velour-header-lock-btn::before{content:'🔒';font-size:15px;line-height:1}
    @media(max-width:390px){
      header.velour-header-lock-layout{gap:7px}
      .velour-header-actions{gap:5px}
      .velour-header-actions .icon-btn{padding:8px 11px;font-size:11px}
      #velourLogoutBtn.velour-header-lock-btn{flex-basis:42px;width:42px!important;min-width:42px!important;min-height:42px;padding:0!important;font-size:0!important}
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
    if (lock.textContent !== '🔒 잠금') lock.textContent = '🔒 잠금';
    lock.setAttribute('aria-label', 'VELOUR 잠금 및 로그아웃');
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
