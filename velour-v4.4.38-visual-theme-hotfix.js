'use strict';

/* VELOUR — visual-only burgundy / antique-gold polish and supplied hero artwork.
   No storage, generation, prompt, or authentication behavior is changed here. */
(() => {
  'use strict';
  if (window.__VELOUR_VISUAL_THEME_HOTFIX__) return;
  window.__VELOUR_VISUAL_THEME_HOTFIX__ = true;

  const style = document.createElement('style');
  style.id = 'velour-visual-theme-hotfix-css';
  style.textContent = `
    :root{
      --gold-light:#fff0bd;
      --gold-main:#edc273;
      --gold-dark:#9c5f21;
      --burgundy-deep:#120409;
      --panel-bg:rgba(25,7,15,.86);
      --panel-border:rgba(239,194,112,.38);
      --text-pure:#fff8f3;
      --text-sub:#d3bbc2;
    }
    body{
      background-color:#120409;
      background-image:
        linear-gradient(180deg,rgba(13,2,7,.10),rgba(13,2,7,.42)),
        url('bg.PNG'),url('bg.png');
      background-position:center top;
    }
    .app-container{
      padding-top:max(22px,calc(env(safe-area-inset-top) + 12px));
      backdrop-filter:blur(3px) saturate(1.08);
      -webkit-backdrop-filter:blur(3px) saturate(1.08);
    }
    header.velour-header-lock-layout{
      align-items:flex-start;
      margin-bottom:16px;
    }
    .brand-text h1{
      font-size:27px;
      letter-spacing:3.8px;
      filter:drop-shadow(0 2px 8px rgba(239,194,112,.18));
    }
    .brand-text p{
      margin-top:4px;
      color:#d8ad63;
      letter-spacing:1.65px;
      line-height:1.45;
    }
    .velour-header-actions{
      gap:7px 7px;
    }
    .velour-header-actions .icon-btn,
    #velourLogoutBtn.velour-header-lock-btn{
      min-height:38px;
      border:1px solid rgba(239,194,112,.46)!important;
      border-radius:999px!important;
      background:
        linear-gradient(180deg,rgba(78,31,37,.62),rgba(24,7,14,.88))!important;
      color:#ffebba!important;
      padding:9px 12px!important;
      font-size:11px!important;
      font-weight:750!important;
      box-shadow:
        inset 0 1px 0 rgba(255,238,194,.10),
        0 6px 18px rgba(0,0,0,.34)!important;
      backdrop-filter:blur(14px) saturate(1.15);
      -webkit-backdrop-filter:blur(14px) saturate(1.15);
    }
    #velourLogoutBtn.velour-header-lock-btn{
      flex:0 0 44px;
      width:44px!important;
      min-width:44px;
      padding:0!important;
      font-size:0!important;
      opacity:1!important;
    }
    .hero-banner{
      height:auto;
      aspect-ratio:16/9;
      margin-bottom:18px;
      border:1px solid rgba(248,207,129,.66);
      border-radius:22px;
      background:#210811;
      box-shadow:
        inset 0 0 0 1px rgba(255,241,199,.07),
        0 18px 42px rgba(0,0,0,.62),
        0 0 24px rgba(141,45,55,.14);
    }
    .hero-banner::after{
      content:'';
      position:absolute;
      inset:7px;
      z-index:2;
      border:1px solid rgba(255,229,166,.16);
      border-radius:16px;
      pointer-events:none;
    }
    .hero-banner img{
      object-position:center 48%;
      filter:saturate(.98) contrast(1.03) brightness(.92);
    }
    .hero-overlay{
      z-index:3;
      padding:31px 18px 15px;
      background:linear-gradient(to top,rgba(12,2,6,.96) 0%,rgba(20,4,9,.58) 54%,transparent 100%);
    }
    .hero-overlay h2{
      color:#fff0bd;
      font-size:18px;
      letter-spacing:.02em;
      text-shadow:0 2px 12px rgba(0,0,0,.82);
    }
    .hero-overlay p{
      color:#ead7d1;
      font-size:11.5px;
      text-shadow:0 1px 8px rgba(0,0,0,.92);
    }
    .card-panel,.result-panel,.velour-library-shell,.modal-box,.v33-panel,.v40-panel{
      border-color:rgba(239,194,112,.38)!important;
      background:
        radial-gradient(circle at 88% 0%,rgba(128,44,51,.15),transparent 34%),
        linear-gradient(150deg,rgba(39,12,22,.94),rgba(20,5,12,.92))!important;
      box-shadow:
        inset 0 1px 0 rgba(255,236,190,.055),
        0 14px 34px rgba(0,0,0,.48)!important;
    }
    .card-panel{
      position:relative;
      overflow:hidden;
      padding:19px 16px;
    }
    .card-panel::before{
      content:'';
      position:absolute;
      inset:7px;
      border:1px solid rgba(239,194,112,.055);
      border-radius:16px;
      pointer-events:none;
    }
    .panel-tag{
      color:#efc270;
      font-size:10.5px;
      letter-spacing:1.7px;
      text-shadow:0 0 12px rgba(239,194,112,.14);
    }
    .v40-title b,.v33-rel-title,.v40-section h4{
      color:#f4cb7e!important;
    }
    details.v40-section,.v33-check,.v40-chip{
      border-color:rgba(239,194,112,.24)!important;
      background:linear-gradient(180deg,rgba(66,22,31,.34),rgba(18,5,11,.48))!important;
      box-shadow:inset 0 1px 0 rgba(255,238,196,.035);
    }
    details.v40-section summary{
      min-height:44px;
      color:#f8d894!important;
      font-size:12px!important;
    }
    .form-row label{
      color:#f0ddd6;
      font-size:13px;
    }
    input,select,textarea{
      border-color:rgba(239,194,112,.26);
      background:linear-gradient(180deg,rgba(18,4,10,.70),rgba(42,13,22,.66));
      color:#fff9f4;
      font-size:14px;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
    }
    input:focus,select:focus,textarea:focus{
      border-color:rgba(247,208,132,.72);
      box-shadow:0 0 0 3px rgba(237,194,115,.075),0 0 18px rgba(126,39,49,.18);
    }
    .tag-pill{
      border-color:rgba(239,194,112,.27);
      border-radius:999px;
      background:rgba(12,3,8,.36);
      color:#d9c3c2;
      padding:7px 11px;
      font-size:11.5px;
    }
    .tag-pill.active,.v33-tag.on{
      border-color:rgba(252,218,149,.72);
      background:linear-gradient(135deg,rgba(145,82,39,.36),rgba(99,31,39,.54));
      color:#fff0bd;
      box-shadow:inset 0 1px 0 rgba(255,239,196,.10),0 0 13px rgba(218,155,71,.10);
    }
    .btn-gold{
      min-height:50px;
      border:1px solid rgba(255,236,185,.58);
      border-radius:999px;
      background:linear-gradient(135deg,#fff0bd 0%,#eabd69 47%,#b7772d 100%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.52),0 10px 27px rgba(196,122,42,.25);
      color:#251006;
    }
    .btn-outline,.velour-small-btn,.velour-story-actions button,.v40-beat button{
      border-color:rgba(239,194,112,.36)!important;
      background:linear-gradient(180deg,rgba(75,26,34,.48),rgba(22,6,13,.72))!important;
      color:#ffe8b3!important;
      box-shadow:inset 0 1px 0 rgba(255,238,196,.055),0 6px 15px rgba(0,0,0,.20);
    }
    .btn-outline{
      min-height:45px;
      border-radius:999px;
      font-size:13px;
    }
    .v41-pill,.v33-tag{
      border-color:rgba(239,194,112,.25)!important;
      background:rgba(16,4,9,.38)!important;
      color:#d9c3c2!important;
      border-radius:999px!important;
      padding:6px 9px!important;
      font-size:10px!important;
    }
    .icon-btn:active,.btn-outline:active,.velour-small-btn:active,.velour-story-actions button:active,
    #velourLogoutBtn.velour-header-lock-btn:active{
      transform:translateY(1px);
      filter:brightness(1.12);
    }
    @media(max-width:390px){
      .app-container{padding-left:13px;padding-right:13px}
      .brand-text h1{font-size:24px;letter-spacing:3px}
      .brand-text p{max-width:144px;font-size:8.5px;letter-spacing:1.35px}
      .velour-header-actions .icon-btn,
      #velourLogoutBtn.velour-header-lock-btn{min-height:36px;padding:8px 10px!important;font-size:10px!important}
      #velourLogoutBtn.velour-header-lock-btn{flex-basis:42px;width:42px!important;min-width:42px;padding:0!important;font-size:0!important}
      .hero-banner{height:238px;aspect-ratio:auto}
      .hero-overlay{padding:25px 15px 12px}
      .hero-overlay h2{font-size:15.5px}
      .hero-overlay p{font-size:10px}
    }
    @media(min-width:391px) and (max-width:430px){
      .hero-banner{height:250px;aspect-ratio:auto}
      .hero-overlay{padding:27px 16px 13px}
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function install(){
    document.body?.classList.add('velour-imperial-polish');
    const cover = document.querySelector('.hero-banner img');
    if (!cover) return false;
    if (!cover.dataset.velourSuppliedCover) {
      cover.dataset.velourSuppliedCover = '1';
      cover.src = './velour-cover-20260911.jpg?v=1';
      cover.alt = '촛불이 켜진 고딕풍 살롱의 연인';
    }
    return true;
  }

  install();
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 100) clearInterval(timer);
  }, 100);

  console.info('✦ VELOUR supplied cover / imperial visual polish loaded');
})();
