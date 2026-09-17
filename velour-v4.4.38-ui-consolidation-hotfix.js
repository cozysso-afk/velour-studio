'use strict';

/* VELOUR — consolidate the authoring UI without replacing or deleting controls.
   Existing control nodes, IDs, listeners, storage keys, and prompt wiring remain intact. */
(() => {
  'use strict';
  if (window.__VELOUR_UI_CONSOLIDATION_HOTFIX__) return;

  const REQUIRED_CONTROL_IDS = [
    'inputChars', 'inputPlot',
    'velourV33Panel', 'v33Mix', 'v33Auto', 'v33Dialogue', 'v33Next', 'v33Tags',
    'v35LengthMode', 'v35ThinkingLevel',
    'velourV40Panel', 'v4World', 'v4Relationship', 'v4HardCanon', 'v4Storyline',
    'v4Pacing', 'selectIntensity', 'v4Dirty', 'v4DirtyFrequency', 'v4Profanity'
  ];

  function allControlsReady() {
    return REQUIRED_CONTROL_IDS.every(id => document.getElementById(id));
  }

  function makeDetails(id, label) {
    const details = document.createElement('details');
    details.id = id;
    details.className = 'velour-control-details';
    const summary = document.createElement('summary');
    summary.textContent = label;
    const body = document.createElement('div');
    body.className = 'velour-control-details-body';
    details.append(summary, body);
    return {details, body};
  }

  function fieldRow(id) {
    return document.getElementById(id)?.closest('.form-row') || null;
  }

  function setFieldLabel(id, text, hint) {
    const row = fieldRow(id);
    const label = row?.querySelector('label');
    if (!label) return;
    label.textContent = text;
    if (hint) {
      const small = document.createElement('small');
      small.className = 'velour-field-hint';
      small.textContent = hint;
      label.appendChild(small);
    }
  }

  function installCss() {
    if (document.getElementById('velour-ui-consolidation-css')) return;
    const style = document.createElement('style');
    style.id = 'velour-ui-consolidation-css';
    style.textContent = `
      #velourV33Panel,
      #velourV40Panel,
      .velour-primary-story-card{
        margin-bottom:12px!important;
      }
      .velour-primary-story-card .panel-tag,
      #velourV33Panel>.panel-tag{
        margin-bottom:12px;
        color:#f3cb7d;
        font-family:'Noto Serif KR',serif;
        font-size:13px!important;
        letter-spacing:.04em!important;
      }
      .velour-primary-story-card .form-row{
        margin-bottom:12px;
      }
      .velour-primary-story-card #inputChars{
        min-height:48px;
      }
      .velour-field-hint{
        display:inline;
        margin-left:6px;
        color:#9f8794;
        font-size:11px;
        font-weight:500;
      }
      #velourV33Panel{
        padding:15px!important;
      }
      #velourV33Panel .velour-quick-grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:9px;
        margin:0;
      }
      #velourV33Panel .velour-quick-grid>.form-row,
      #velourV33Panel .velour-quick-grid>.v33-check{
        margin:0!important;
      }
      #velourV33Panel .velour-quick-grid>.form-row{
        grid-column:1/-1;
      }
      #velourV33Panel .velour-quick-grid>.v33-check{
        min-height:48px;
        box-sizing:border-box;
      }
      #velourV33Panel .velour-next-row{
        margin:12px 0 0!important;
      }
      #velourV33Panel .velour-next-row textarea{
        min-height:82px;
      }
      .velour-control-details{
        margin-top:10px;
        border:1px solid rgba(239,194,112,.24);
        border-radius:14px;
        background:linear-gradient(180deg,rgba(66,22,31,.26),rgba(18,5,11,.42));
        overflow:hidden;
      }
      .velour-control-details>summary{
        position:relative;
        display:flex;
        align-items:center;
        min-height:46px;
        box-sizing:border-box;
        padding:10px 38px 10px 12px;
        list-style:none;
        cursor:pointer;
        color:#f3d18e;
        font-size:13px;
        font-weight:700;
      }
      .velour-control-details>summary::-webkit-details-marker{
        display:none;
      }
      .velour-control-details>summary::after{
        content:'＋';
        position:absolute;
        right:13px;
        top:50%;
        transform:translateY(-50%);
        color:#ad939d;
        font-size:15px;
      }
      .velour-control-details[open]>summary::after{
        content:'－';
      }
      .velour-control-details[open]>summary{
        border-bottom:1px solid rgba(239,194,112,.12);
      }
      .velour-control-details-body{
        padding:12px;
      }
      .velour-control-details-body>.form-row:last-child{
        margin-bottom:0;
      }
      #velourCrossoverSettings .velour-crossover-count{
        margin:0 0 11px;
      }
      #velourCrossoverSettings .velour-crossover-picker{
        margin:0;
      }
      #velourAdvancedGeneration .form-row{
        margin:0;
      }
      #velourGenerationSummary{
        margin-top:10px;
        color:#bda8b0;
        font-size:11.5px;
        line-height:1.5;
      }
      #velourV33Panel #v33Status,
      #velourV33Panel #v35Status,
      #velourV33Panel>.v33-note,
      #velourV33Panel .velour-empty-layout,
      #velourV40Panel #v4Status{
        display:none!important;
      }
      #velourV40Panel{
        padding:14px!important;
      }
      #velourV40Panel .v40-title{
        margin-bottom:9px;
      }
      #velourV40Panel .v40-title b{
        font-family:'Noto Serif KR',serif;
        font-size:13px!important;
        letter-spacing:.04em;
      }
      #velourV40Panel .v40-badge{
        font-size:10px;
      }
      #velourV40Panel details.v40-section{
        margin-top:7px;
      }
      #velourV40Panel details.v40-section summary{
        min-height:46px;
        box-sizing:border-box;
        padding:10px 12px;
        font-size:12.5px!important;
      }
      @media(max-width:390px){
        #velourV33Panel .velour-quick-grid{
          grid-template-columns:1fr 1fr;
          gap:8px;
        }
        #velourV33Panel .velour-quick-grid>.v33-check{
          padding:9px 10px;
          font-size:11px;
        }
        .velour-field-hint{
          display:block;
          margin:3px 0 0;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function arrangePrimaryFlow() {
    const chars = document.getElementById('inputChars');
    const plot = document.getElementById('inputPlot');
    const characterCard = chars?.closest('.card-panel');
    const helper = document.getElementById('velourV33Panel');
    const engine = document.getElementById('velourV40Panel');
    const hero = document.querySelector('.hero-banner');
    if (!characterCard || !helper || !engine || !hero || !plot) return false;

    characterCard.classList.add('velour-primary-story-card');
    const cardTag = characterCard.querySelector('.panel-tag');
    if (cardTag) cardTag.textContent = '01. 인물과 첫 장면';
    setFieldLabel('inputChars', '인물 · 관계 · 성격');
    setFieldLabel('inputPlot', '첫 화 시작 상황 · 갈등', '새 이야기용 · 비워도 자동 생성');

    const anchor = document.getElementById('velourDraftBanner') || hero;
    anchor.insertAdjacentElement('afterend', characterCard);
    characterCard.insertAdjacentElement('afterend', helper);
    helper.insertAdjacentElement('afterend', engine);
    return true;
  }

  function arrangeGenerationOptions() {
    const panel = document.getElementById('velourV33Panel');
    if (!panel) return false;
    const tag = panel.querySelector(':scope>.panel-tag');
    if (tag) tag.textContent = '02. 생성 옵션';

    const lengthRow = fieldRow('v35LengthMode');
    const thinkingRow = fieldRow('v35ThinkingLevel');
    const mixRow = fieldRow('v33Mix');
    const nextRow = fieldRow('v33Next');
    const crossoverRow = document.getElementById('v33Tags')?.closest('.form-row');
    const auto = document.getElementById('v33Auto')?.closest('.v33-check');
    const dialogue = document.getElementById('v33Dialogue')?.closest('.v33-check');
    if (!lengthRow || !thinkingRow || !mixRow || !nextRow || !crossoverRow || !auto || !dialogue) return false;

    setFieldLabel('v33Next', '이번 화 추가 지시', '이어쓰기용 · 생성 성공 후 자동 비움');
    nextRow.classList.add('velour-next-row');
    mixRow.classList.add('velour-crossover-count');
    crossoverRow.classList.add('velour-crossover-picker');

    const quick = document.createElement('div');
    quick.className = 'velour-quick-grid';
    tag?.insertAdjacentElement('afterend', quick);
    quick.append(lengthRow, auto, dialogue);
    quick.insertAdjacentElement('afterend', nextRow);

    const crossover = makeDetails('velourCrossoverSettings', '장소 · 사건 크로스오버');
    crossover.body.append(mixRow, crossoverRow);
    nextRow.insertAdjacentElement('afterend', crossover.details);

    const advanced = makeDetails('velourAdvancedGeneration', '고급 생성 설정');
    advanced.body.append(thinkingRow);
    crossover.details.insertAdjacentElement('afterend', advanced.details);

    panel.querySelectorAll(':scope>.v33-grid').forEach(grid => {
      if (!grid.children.length || [...grid.children].every(child => child.classList.contains('v33-note'))) {
        grid.classList.add('velour-empty-layout');
      }
    });
    panel.querySelectorAll(':scope>.v33-note').forEach(note => note.hidden = true);
    document.getElementById('v33Status')?.setAttribute('aria-hidden', 'true');
    document.getElementById('v35Status')?.setAttribute('aria-hidden', 'true');

    const summary = document.createElement('div');
    summary.id = 'velourGenerationSummary';
    summary.setAttribute('aria-live', 'polite');
    advanced.details.insertAdjacentElement('afterend', summary);
    return true;
  }

  function simplifyEngineLabels() {
    const panel = document.getElementById('velourV40Panel');
    if (!panel) return false;
    const title = panel.querySelector('.v40-title b');
    const badge = panel.querySelector('.v40-badge');
    if (title) title.textContent = '03. 세부 설정';
    if (badge) badge.textContent = '기존 설정 모두 유지';

    const labels = {
      v41SecWorld: '세계관 · 관계 · 트로프',
      v41SecOccupation: '직업 · 신분 · 외형',
      v41SecCanon: '스토리라인 · 설정 잠금',
      v41SecPacing: '전개 속도 · 장면 구성',
      v41SecLanguage: '문체 · 수위 · 표현'
    };
    Object.entries(labels).forEach(([id, label]) => {
      const summary = document.querySelector(`#${id}>summary`);
      if (summary) summary.textContent = label;
    });
    const status = document.getElementById('v4Status');
    if (status) {
      status.hidden = true;
      status.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  function updateGenerationSummary() {
    const summary = document.getElementById('velourGenerationSummary');
    if (!summary) return;
    const length = document.getElementById('v35LengthMode');
    const auto = document.getElementById('v33Auto');
    const dialogue = document.getElementById('v33Dialogue');
    const mix = document.getElementById('v33Mix');
    const selected = document.querySelectorAll('#v33Tags .v33-tag.on[data-id]').length;
    const lengthText = length?.selectedOptions?.[0]?.textContent?.replace(/\s*목표\s*$/, '') || '분량 설정';
    summary.textContent = [
      lengthText,
      `자동 전개 ${auto?.checked ? 'ON' : 'OFF'}`,
      `대사 강화 ${dialogue?.checked ? 'ON' : 'OFF'}`,
      selected ? `크로스오버 ${selected}/${mix?.value || selected}` : '크로스오버 없음'
    ].join(' · ');
  }

  function bindSummary() {
    const panel = document.getElementById('velourV33Panel');
    if (!panel || panel.dataset.velourConsolidationBound) return;
    panel.dataset.velourConsolidationBound = '1';
    panel.addEventListener('change', updateGenerationSummary);
    panel.addEventListener('click', event => {
      if (event.target.closest('#v33Tags, #v33RandomMix')) setTimeout(updateGenerationSummary, 0);
    });
    updateGenerationSummary();
  }

  function install() {
    if (window.__VELOUR_UI_CONSOLIDATION_HOTFIX__) return true;
    if (!allControlsReady()) return false;
    installCss();
    if (!arrangePrimaryFlow()) return false;
    if (!arrangeGenerationOptions()) return false;
    if (!simplifyEngineLabels()) return false;
    bindSummary();
    window.__VELOUR_UI_CONSOLIDATION_HOTFIX__ = true;
    console.info('✦ VELOUR authoring UI consolidation loaded');
    return true;
  }

  if (!install()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries >= 120) clearInterval(timer);
    }, 100);
  }
})();
