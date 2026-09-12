'use strict';

// Deterministic retrieval of intact, attributed clauses. No model calls and no
// mutation of saved canon. Only the last raw string is retained in this cache.
(() => {
  const TARGET_CHARS = 16000;
  const PROTECTED_CHARS = 64000; // Dedicated input allocation, not the model's context limit.
  const SPACE = value => String(value || '').replace(/\s+/g, ' ').trim();
  const ESC = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const STOP = new Set(['현재','이후','그리고','하지만','관계','설정','성격','말투','호칭','직업','나이','외형','취향','세계관','규칙','과거','미래','조건','그','그녀','그들','두사람','처음','전환','연인','신뢰','친밀감','매니저','촬영','이름','성씨','가족','기본','항상','반드시']);
  const VOICE = /말투|호칭|존댓말|반말|말버릇|화법|어투|존칭|높임|직접성|직설|농담|빈정|감정\s*공개|대사\s*습관/;
  const ABSOLUTE = /절대|반드시|금지|아님|아니다|바뀌면\s*안|고정|유지|항상|하지\s*않|부르지\s*않/;
  const IDENTITY = /이름|성씨|본명|정체|직책|담당|\S+(?:원|사|자|장)이다|\S+자다|(?:^|[^\d])\d{1,3}\s*(?:세|살)|나이|직업|신분|소속|사진작가|매니저|의사|교사|배우|기자|변호사|공무원|학생|대표|회장|비서|경호원|가족|부모|아버지|어머니|형제|자매|남매|아들|딸|세계관|세계\s*규칙|법칙|종족|현재|초기|기본\s*관계|이미|키\s*[:：]?\s*\d|외형|체형|머리색|눈동자|흉터/;
  const FUTURE = /친해지면|[가-힣]+(?:하면|되면|지면|으면)|경우|조건|전제|예정|계획|나중|향후|장차|언젠가|추후|몇\s*(?:차례|번|회)|여러\s*(?:차례|번)|(?:촬영|만남|합의|계약|전환|성립|형성|확인|충족|신뢰)[^.!?\n]{0,24}(?:후|뒤|다음)|(?:한|된|진|친|난)\s*(?:후|뒤)|이후|뒤에|후에|\b(?:if|when|after|once|until|eventually|later|will|planned)\b/i;
  const conditional = text => FUTURE.test(String(text || '').replace(/바뀌면\s*안|하면\s*안/g, '금지'));
  let cachedRaw = null, cached = null, builds = 0;
  function tokens(text) {
    return new Set((SPACE(text).toLowerCase().match(/[가-힣a-z0-9_]+/g) || [])
      .map(x => x.replace(/(?:에게|에서|으로|와의|과의|은|는|이|가|을|를|와|과)$/, ''))
      .filter(x => x && !STOP.has(x)));
  }
  function candidate(name) { return name && !STOP.has(name) && /^[A-Za-z가-힣][A-Za-z가-힣0-9_·-]{0,24}$/.test(name); }
  function heading(line) {
    const marked = line.match(/^\s*(?:#{1,6}\s+(.+)|\[([^\]]+)\]|([^:：]{1,40})[:：]\s*$)/);
    if (!marked) return null;
    const label = SPACE(marked[1] || marked[2] || marked[3]).replace(/\s*(?:설정|프로필|관계\s*루트)$/, '');
    const names = label.split(/\s*(?:×|&|\/|,|와|과)\s*/).filter(candidate);
    return { label, names };
  }
  function index(raw) {
    raw = String(raw || '');
    if (raw === cachedRaw) return cached;
    builds++;
    const rows = [], names = new Set();
    let block = { label:'공통/미지정', names:[] }, offset = 0;
    // Parse ALL lines and clauses. No prefix clipping and no content shortening.
    for (const line of raw.split('\n')) {
      const h = heading(line);
      if (h) {
        block = h; h.names.forEach(n => names.add(n));
        if(h.names.length) rows.push({text:line.trim(),sourceIndex:rows.length,sourceOffset:offset,block:h,header:true});
      }
      else for (const part of line.split(/(?<=[.!?。！？])\s+|[;；]/)) {
        const text = part.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim();
        if (!text) continue;
        const lead = text.match(/^([A-Za-z가-힣][A-Za-z가-힣0-9_·-]{0,24}?)(?:은|는|이|가|의|와|과|\s*[:：])/);
        if (lead && candidate(lead[1])) names.add(lead[1]);
        rows.push({ text, sourceIndex:rows.length, sourceOffset:offset, block, lead:lead?.[1] });
      }
      offset += line.length + 1;
    }
    // One entity matcher, reused across rows/context; no per-row all-pairs scan.
    const alternatives = [...names].sort((a,b)=>b.length-a.length || a.localeCompare(b)).map(ESC).join('|');
    const matcher = alternatives ? new RegExp(`(^|[^A-Za-z가-힣0-9_])(${alternatives})(?=$|[^A-Za-z가-힣0-9_]|은|는|이|가|의|에게|와|과|을|를)`, 'g') : null;
    function mentions(text) {
      if (!matcher) return [];
      matcher.lastIndex = 0;
      const found = new Set(); let m;
      while ((m = matcher.exec(String(text || '')))) found.add(m[2]);
      return [...found];
    }
    const seen = new Set(), fragments = [];
    for (const row of rows) {
      const explicit = mentions(row.text);
      // A named clause owns its explicit parties; otherwise inherit its header.
      const ownsLead = row.lead && names.has(row.lead);
      const pair = row.text.match(/^[A-Za-z가-힣0-9_·-]+(?:와|과)\s*([A-Za-z가-힣0-9_·-]+?)(?:은|는|이|가|의|\s)/);
      const owners = ownsLead ? [...new Set([row.lead, ...(pair && names.has(pair[1]) ? [pair[1]] : [])])] : row.block.names.length ? row.block.names : explicit;
      const future = conditional(row.text);
      const voice = VOICE.test(row.text);
      const absolute = ABSOLUTE.test(row.text);
      const type = row.header ? 'character identity' : future ? 'conditional/future' : voice ? 'speech/address' : /世界|세계|법칙/.test(row.text) ? 'world rule' : /관계|연인|친구|동료|배우자/.test(row.text) ? 'current relationship' : IDENTITY.test(row.text) ? 'core immutable' : /과거|어릴|이력|경력/.test(row.text) ? 'history' : /취향|선호/.test(row.text) ? 'preference' : 'personality/context';
      const core = row.header || absolute || voice || (!future && (IDENTITY.test(row.text) || type === 'current relationship'));
      const key = JSON.stringify([owners, row.block.label, SPACE(row.text)]);
      if (seen.has(key)) continue; // Only exact whitespace duplicates with identical scope.
      seen.add(key);
      fragments.push({ ...row, owners, future, voice, core, type, keys:tokens(row.text) });
    }
    cachedRaw = raw;
    cached = { fragments, names:[...names], mentions };
    return cached;
  }
  function episodeContext(state, direction = '', extra = '') {
    const rt = state?.runtime || {};
    const beats = String(state?.storyline || '').split(/\n+/).map(x=>x.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean);
    const current = beats[Math.max(0, Number(state?.beatIndex || 0))] || '';
    const scenes = (rt.scenes || []).slice(-2).map(s=>[s.location,s.purpose,s.ending].filter(Boolean).join(' '));
    return [direction,current,rt.causalCarry,rt.relationshipState,...(rt.openThreads || []).slice(-6),...(rt.timeline || []).slice(-4),...scenes,extra].filter(Boolean).join('\n');
  }
  function format(f) {
    const scope = f.owners.length ? f.owners.join(' × ') : f.block.label;
    return `- [${scope} | ${f.future ? '미래/조건부 · 미성립 · 실행 금지' : '설정 · 현재성은 확정 이력 확인'} | ${f.type}] ${f.text}`;
  }
  function retrieve(state, { direction = '', extra = '', target = TARGET_CHARS, ceiling = PROTECTED_CHARS } = {}) {
    const parsed = index(state?.hardCanon);
    const context = episodeContext(state, direction, extra), keys = tokens(context);
    const beats=String(state?.storyline||'').split(/\n+/).filter(x=>x.trim());
    const direct=[direction,beats[Math.max(0,Number(state?.beatIndex||0))]||'',extra].join('\n');
    const recent=[state?.runtime?.causalCarry,...(state?.runtime?.scenes||[]).slice(-1).map(s=>[s.location,s.purpose,s.ending].join(' '))].join('\n');
    const strong=parsed.mentions(direct), recentNames=parsed.mentions(recent);
    const active = new Set(strong.length ? strong : recentNames.length ? recentNames : parsed.mentions(context));
    const currentRelation=String(state?.runtime?.relationshipState||'');
    const memory=currentRelation.trim() ? [{text:currentRelation,sourceIndex:-1,block:{label:'확정 관계 메모 · 인물별 원문'},owners:[],future:conditional(currentRelation),voice:VOICE.test(currentRelation),core:true,type:'current relationship memory',keys:tokens(currentRelation)}] : [];
    const ranked = [...parsed.fragments,...memory].map(f => {
      let score = 0; for (const key of f.keys) if (keys.has(key)) score += key.length >= 4 ? 3 : 2;
      const isActive = f.owners.some(n=>active.has(n));
      return { ...f, active:isActive, tier:f.core ? 'A' : isActive ? 'B' : 'C', score, rendered:format(f) };
    }).sort((a,b) => a.tier.localeCompare(b.tier) || Number(b.active)-Number(a.active) || b.score-a.score || a.text.localeCompare(b.text) || a.sourceIndex-b.sourceIndex);
    const selected = [], mandatory = ranked.filter(f=>f.tier !== 'C');
    const requiredChars = mandatory.reduce((sum,f)=>sum+f.rendered.length+1,1024); // Reserve retrieval labels/instructions.
    // Never silently discard core or active-character canon to fit the budget.
    if (requiredChars > ceiling) {
      const error = new Error(`핵심·현재 인물 캐논이 이번 요청의 안전 예산(${ceiling.toLocaleString()}자)을 넘었어요. 원문은 보존되며 일부를 숨긴 채 생성하지 않습니다.`);
      error.code = 'CANON_BUDGET_EXCEEDED'; error.requiredChars = requiredChars; throw error;
    }
    let chars = requiredChars;
    selected.push(...mandatory);
    for (const f of ranked) {
      if (f.tier !== 'C' || f.score <= 0) continue;
      if (chars + f.rendered.length + 1 > Math.min(ceiling, Math.max(target, requiredChars))) continue;
      selected.push(f); chars += f.rendered.length + 1;
    }
    return { selected, active:[...active], chars, total:ranked.length,
      omitted:ranked.length-selected.length, requiredChars, ceiling, target };
  }
  function render(result) {
    return `[CANON RETRIEVAL — 전체 색인 ${result.total}개 · 이번 화 ${result.selected.length}개]\n` +
      '- 원문 항목의 인물/쌍과 조건을 그대로 유지한다. 다른 인물에 전파하지 않는다. 미래/조건부 항목은 성립 증거가 아니며 현재 STORYLINE 단계와 확정 이력이 충족하기 전 실행하지 않는다.\n' +
      ['A','B','C'].map(tier => result.selected.some(f=>f.tier===tier) ? `[TIER ${tier}]\n${result.selected.filter(f=>f.tier===tier).map(f=>f.rendered).join('\n')}` : '').filter(Boolean).join('\n') +
      '\n- 작가용 내부 제약이다. 설정 재소개·관계사 복습·미래 스포일러를 본문에 삽입하지 않는다.';
  }
  function voiceHints(state, direction = '') {
    // Shared retrieval prevents prefix-limited, unscoped voice copies. Voice
    // clauses themselves appear once in the main canon block, not again here.
    const result = retrieve(state, { direction });
    return result.selected.filter(f=>f.voice && (f.active || !f.owners.length)).map(f=>f.rendered);
  }
  window.__VELOUR_CANON_INDEX__ = { index, retrieve, render, format, episodeContext, voiceHints,
    isConditional:conditional, TARGET_CHARS, PROTECTED_CHARS,
    get builds() { return builds; } };
})();
