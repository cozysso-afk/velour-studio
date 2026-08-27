'use strict';

/* VELOUR — token usage dashboard + approximate KRW cost.
   Periods use the device's local timezone. Whole-history totals show the first locally stored usage date. */
(() => {
  'use strict';
  if (window.__VELOUR_USAGE_DASHBOARD_HOTFIX__) return;
  window.__VELOUR_USAGE_DASHBOARD_HOTFIX__ = true;

  const qa = window.__VELOUR_STORAGE_QA__;
  if (!qa?.responseVaultAll) return;

  const USAGE_STORE = 'usage';
  const DEFAULT_KRW_PER_USD = 1382.75;
  const TRACKING_ROLLOUT_DATE = '2026.08.25';
  const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;

  function krwRate() {
    try {
      const saved = Number(localStorage.getItem('VELOUR_USD_KRW_RATE'));
      if (Number.isFinite(saved) && saved > 0) return saved;
    } catch (_) {}
    return DEFAULT_KRW_PER_USD;
  }

  function pricingFor(model, usage) {
    const id = String(model || '').trim();
    const prompt = n(usage?.promptTokenCount);
    if (id === 'gemini-3.7-flash' || id === 'gemini-3.6-flash') {
      const promo = new Date() < new Date('2027-01-01T00:00:00');
      return promo
        ? { input: 0.75, output: 3.75, cache: 0.075 }
        : { input: 1.50, output: 7.50, cache: 0.15 };
    }
    if (id === 'gemini-3.1-pro-preview') {
      const high = prompt > 200000;
      return high
        ? { input: 4.00, output: 18.00, cache: 0.40 }
        : { input: 2.00, output: 12.00, cache: 0.20 };
    }
    return null;
  }

  function estimateUSD(usage, model) {
    const u = usage || {};
    const rates = pricingFor(model, u);
    if (!rates) return null;
    const prompt = Math.max(0, n(u.promptTokenCount));
    const cached = Math.min(prompt, Math.max(0, n(u.cachedContentTokenCount)));
    const regularInput = Math.max(0, prompt - cached);
    const output = Math.max(0, n(u.candidatesTokenCount)) + Math.max(0, n(u.thoughtsTokenCount));
    return (regularInput * rates.input + cached * rates.cache + output * rates.output) / 1000000;
  }

  function usdText(value) {
    if (!Number.isFinite(value)) return '-';
    if (value === 0) return '$0';
    if (value < 0.0001) return '<$0.0001';
    if (value < 0.01) return '$' + value.toFixed(4);
    if (value < 1) return '$' + value.toFixed(3);
    return '$' + value.toFixed(2);
  }

  function krwText(usd) {
    if (!Number.isFinite(usd)) return '-';
    const won = usd * krwRate();
    if (won <= 0) return '약 0원';
    if (won < 1) return '약 1원 미만';
    return `약 ${Math.round(won).toLocaleString('ko-KR')}원`;
  }

  function dateText(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return TRACKING_ROLLOUT_DATE;
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('.');
  }

  function localPeriodStarts() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today);
    const mondayOffset = (today.getDay() + 6) % 7;
    week.setDate(today.getDate() - mondayOffset);
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    return { today, week, month };
  }

  function emptyTotals() {
    return { calls: 0, promptTokenCount: 0, candidatesTokenCount: 0, thoughtsTokenCount: 0, totalTokenCount: 0, usd: 0, priced: 0, unpriced: 0 };
  }

  function addRow(total, row) {
    const u = row?.usage || {};
    total.calls += 1;
    total.promptTokenCount += n(u.promptTokenCount);
    total.candidatesTokenCount += n(u.candidatesTokenCount);
    total.thoughtsTokenCount += n(u.thoughtsTokenCount);
    total.totalTokenCount += n(u.totalTokenCount);
    const usd = estimateUSD(u, row?.model || '');
    if (Number.isFinite(usd)) { total.usd += usd; total.priced += 1; }
    else total.unpriced += 1;
  }

  async function usageSnapshot() {
    let rows = [];
    try { rows = await qa.responseVaultAll(USAGE_STORE); }
    catch (_) { return null; }
    const starts = localPeriodStarts();
    const totals = { today: emptyTotals(), week: emptyTotals(), month: emptyTotals(), all: emptyTotals(), firstRecordedAt: null };
    let firstMs = Infinity;
    for (const row of rows || []) {
      const at = new Date(row?.at || 0);
      const ms = at.getTime();
      if (!Number.isFinite(ms)) continue;
      if (ms < firstMs) { firstMs = ms; totals.firstRecordedAt = at; }
      addRow(totals.all, row);
      if (at >= starts.month) addRow(totals.month, row);
      if (at >= starts.week) addRow(totals.week, row);
      if (at >= starts.today) addRow(totals.today, row);
    }
    return totals;
  }

  function ensurePanel() {
    const summary = document.getElementById('velourUsageSummary');
    if (!summary) return null;
    let panel = document.getElementById('velourUsageDashboard');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'velourUsageDashboard';
    panel.style.cssText = 'width:100%;margin-top:8px;padding-top:9px;border-top:1px solid rgba(245,196,107,.12);font-size:10px;line-height:1.65;color:#cdbbc4';
    summary.appendChild(panel);
    return panel;
  }

  function rowHtml(label, t, sublabel = '') {
    const cost = t.priced > 0 ? `${usdText(t.usd)} ≈ ${krwText(t.usd)}` : '비용 계산 대기';
    const unpriced = t.unpriced > 0 ? ` · 가격표 미등록 ${t.unpriced}회 제외` : '';
    const labelHtml = `<b style="color:#ffe3a0">${label}${sublabel ? `<span style="display:block;color:#a99380;font-size:8.5px;font-weight:650;white-space:nowrap">${sublabel}</span>` : ''}</b>`;
    return `<div style="display:grid;grid-template-columns:76px 1fr;gap:7px;margin:3px 0">${labelHtml}<span>${t.calls.toLocaleString()}회 · 입력 ${Math.round(t.promptTokenCount).toLocaleString()} · 출력 ${Math.round(t.candidatesTokenCount).toLocaleString()} · 총 ${Math.round(t.totalTokenCount).toLocaleString()} tokens<br><span style="color:#e8d2b0">${cost}</span>${unpriced}</span></div>`;
  }

  let rendering = false;
  async function renderUsageDashboard() {
    if (rendering) return;
    const panel = ensurePanel();
    if (!panel) return;
    rendering = true;
    try {
      const s = await usageSnapshot();
      if (!s) { panel.textContent = '사용량 기록을 읽지 못했어.'; return; }
      const start = s.firstRecordedAt ? dateText(s.firstRecordedAt) : TRACKING_ROLLOUT_DATE;
      panel.innerHTML = `
        <div style="font-weight:800;color:#fff0c4;margin-bottom:4px">📊 API 사용량 · 비용</div>
        ${rowHtml('오늘', s.today)}
        ${rowHtml('이번 주', s.week)}
        ${rowHtml('이번 달', s.month)}
        ${rowHtml('전체 누적', s.all, `${start}~`)}
        <div style="margin-top:5px;color:#987f8b;font-size:9px">전체 누적 시작일은 이 기기의 최초 사용량 기록 기준 · 기록이 없으면 VELOUR 추적 기능 도입일 ${TRACKING_ROLLOUT_DATE} 기준 · 원화는 1달러≈${Math.round(krwRate()).toLocaleString('ko-KR')}원 참고 환율 · 실제 청구액과 차이 가능</div>`;
    } finally { rendering = false; }
  }

  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(renderUsageDashboard, 80); };
  const observer = new MutationObserver(mutations => {
    if (rendering) return;
    const touched = mutations.some(m => {
      const target = m.target?.nodeType === 3 ? m.target.parentElement : m.target;
      if (target?.id === 'velourUsageSummaryText') return true;
      return Array.from(m.addedNodes || []).some(node => node?.id === 'velourUsageSummary' || node?.id === 'velourUsageSummaryText' || node?.querySelector?.('#velourUsageSummaryText'));
    });
    if (touched) schedule();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });

  window.renderVelourUsageDashboard = renderUsageDashboard;
  qa.usagePeriodSnapshot = usageSnapshot;
  schedule();
  console.info('✦ VELOUR usage dashboard loaded · start-date aware');
})();
