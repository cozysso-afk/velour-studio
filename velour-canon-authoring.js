'use strict';

// Canon fields own their editing lifecycle. No state snapshots, indexing or UI
// synchronization run on input; the caller supplies access to the live state.
(() => {
  function create({ getState, persist, persistDraft, showStatus, refreshBeatStatus,
    schedule = setTimeout, cancel = clearTimeout, delay = 220 }) {
    let timer = null, revision = 0, pending = false, owner = null;
    let inFlight = Promise.resolve();
    const composing = new Set();
    const fields = new Map();
    const stop = () => { if (timer !== null) cancel(timer); timer = null; };
    const editing = () => composing.size > 0 || [...fields.keys()].some(el => el === document.activeElement);
    function flush() {
      stop();
      if (!pending || composing.size) return inFlight;
      const current = getState();
      if (current !== owner) { reset(); return; }
      const stamp = revision;
      let ok = false;
      try { ok = persist(current) === true; } catch (_) {}
      pending = !ok;
      showStatus(ok ? 'saving' : 'error');
      // Only the small beat label is updated, and only after editing has ended.
      if (!editing()) refreshBeatStatus();
      inFlight = Promise.resolve().then(() => persistDraft(current)).then(() => {
        if (revision === stamp && getState() === current) showStatus(ok ? 'saved' : 'error');
      }, () => {
        if (revision === stamp && getState() === current) { pending = true; showStatus('error'); }
      });
      return inFlight;
    }
    function capture(el, key) {
      const current = getState();
      // Assignment preserves whitespace, line breaks and IME intermediate text.
      current[key] = el.value;
      owner = current;
      pending = true;
      revision++;
      showStatus('pending');
    }
    function bind(el, key) {
      if (fields.has(el)) return;
      fields.set(el, key);
      el.addEventListener('compositionstart', () => { stop(); composing.add(el); });
      el.addEventListener('input', event => {
        capture(el, key); stop();
        if (!event.isComposing && !composing.size) timer = schedule(flush, delay);
      });
      el.addEventListener('compositionend', () => { composing.delete(el); capture(el, key); flush(); });
      for (const event of ['change', 'blur']) el.addEventListener(event, () => {
        capture(el, key);
        // Some mobile keyboards end composition at blur without compositionend.
        if (event === 'blur') composing.delete(el);
        flush();
      });
    }
    function reset() {
      // Explicit story restoration ends the old editor session before UI hydration.
      for (const el of fields.keys()) if (el === document.activeElement) el.blur();
      stop(); revision++; pending = false; owner = null; composing.clear(); showStatus('idle'); }
    return { bind, flush, reset, editing, get pending() { return pending; } };
  }
  window.__VELOUR_CANON_AUTHORING__ = { create };
})();
