from pathlib import Path

p=Path('velour-v4.4.38-continuity-voice-guard.js')
s=p.read_text()
s=s.replace("const VERSION = '1.2.0';","const VERSION = '1.2.1';",1)

marker="""  const ADDRESS_HINT = /(?:(?:^|[^0-9])\\d{1,3}\\s*(?:세|살)(?=$|[^가-힣]|[이가의은는]|입니|이다)|연상|연하|나이\\s*차|호칭|존댓말|반말|존대|말투|어투|(?:라고|이라)\\s*부르|오빠|누나|형|언니|선배님?|후배|대표님|사장님|팀장님|선생님|교수님|\\S+씨\\b|\\S+님\\b)/i;\n\n"""
insert=marker+"""  function ensembleAddressContext(){
    const qa = window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__;
    let cfg = null;
    try { cfg = qa?.loadCfg?.() || null; } catch (_) {}
    if (!cfg) return {names:[], memoLines:[]};
    let partners = [];
    try { partners = qa?.activePartners?.(cfg) || cfg.partners || []; } catch (_) { partners = cfg.partners || []; }
    const chars = [cfg.heroine, ...partners].filter(Boolean);
    const names = [...new Set(chars.map(c => clean(c?.name, 60)).filter(Boolean))];
    const memoLines = [];
    for (const c of chars) {
      const owner = clean(c?.name, 60) || '인물';
      for (const raw of [c?.relationshipNote, c?.customNote]) {
        const text = clean(raw, 220);
        if (text) memoLines.push(`[메모 소유자: ${owner}] ${text}`);
      }
    }
    return {names, memoLines};
  }

  function annotateAddressHint(raw, names){
    const text = clean(raw, 220);
    const mentioned = (names || []).filter(name => name && text.includes(name));
    if (mentioned.length >= 2) return `[관련 인물: ${mentioned.join(' ↔ ')}] ${text}`;
    if (mentioned.length === 1) return `[관련 인물: ${mentioned[0]} / 상대 미명시] ${text}`;
    return `[관련 인물 불명확 — 다른 캐릭터로 전이 금지] ${text}`;
  }

"""
if marker not in s: raise SystemExit('ADDRESS_HINT marker missing')
s=s.replace(marker,insert,1)

old="""  function addressCanon(state){
    const characterSheet = String(document.getElementById('inputChars')?.value || '');
    const durable = (Array.isArray(state?.runtime?.durableFacts) ? state.runtime.durableFacts : []).join('\\n');
    const raw = [characterSheet, state?.hardCanon, state?.storyline, durable]
      .filter(Boolean).join('\\n');
    const hints = lines(raw).filter(line => ADDRESS_HINT.test(line)).slice(0, 14).map(x => clean(x, 220));

    return `\\n[ADDRESS / AGE CANON — 호칭·연상연하 오류 방지]\\n- 인물 설정에 숫자 나이가 둘 다 있으면 실제 숫자를 비교해 누가 연상/연하인지 먼저 내부적으로 확인한다. 연상·연하 방향을 뒤집지 않는다.\\n- 명시된 호칭, 존댓말/반말 규칙, 직급·신분 호칭은 단순 문체 취향이 아니라 CANON이다. 감정이 격해지거나 친밀 장면이어도 임의로 뒤집지 않는다.\\n- 나이가 많다는 이유만으로 ‘오빠/누나/형/언니’를 자동 생성하지 않는다. 그런 호칭은 사용자 설정이나 이미 확립된 본문 관계에서 실제로 쓰였을 때만 유지한다. 명시가 없으면 기존에 확립된 이름/직함/호칭을 보존한다.\\n- 한 화 안에서 같은 상대를 부르는 기본 호칭이 이유 없이 오락가락하지 않는다. 호칭 변화가 서사 사건이라면 변화가 일어난 시점 이후부터 새 규칙을 지속한다.\\n${hints.length ? `- 현재 설정에서 추출한 연령/호칭 단서:\\n${hints.map(x => `  • ${x}`).join('\\n')}` : '- 명시적 호칭 단서가 부족하면 새 친족형 호칭을 발명하지 말고 직전 확정 본문의 호칭을 우선한다.'}`;
  }
"""
new="""  function addressCanon(state){
    const characterSheet = String(document.getElementById('inputChars')?.value || '');
    const durable = (Array.isArray(state?.runtime?.durableFacts) ? state.runtime.durableFacts : []).join('\\n');
    const edge = ensembleAddressContext();
    const raw = [characterSheet, state?.hardCanon, state?.storyline, durable, ...edge.memoLines]
      .filter(Boolean).join('\\n');
    const hints = lines(raw).filter(line => ADDRESS_HINT.test(line)).slice(0, 18).map(x => annotateAddressHint(x, edge.names));

    return `\\n[ADDRESS / AGE CANON — 호칭·연상연하 오류 방지]\\n- 인물 설정에 숫자 나이가 둘 다 있으면 실제 숫자를 비교해 누가 연상/연하인지 먼저 내부적으로 확인한다. 연상·연하 방향을 뒤집지 않는다.\\n- 호칭은 캐릭터 전체의 공용 말투가 아니라 ‘화자 → 대상’ 방향성을 가진 관계 edge 사실이다. A가 B를 특정 호칭으로 부른다는 규칙을 A→C, C→B, B→A에 복사하지 않는다.\\n- 캐릭터 카드 메모의 호칭 규칙은 메모 소유 캐릭터의 규칙으로 읽는다. 문장에 대상이 명시되면 오직 그 대상에게만 적용하고, 대상이 빠졌다면 다른 이름 있는 캐릭터에게 임의 확장하지 않는다.\\n- 아래 추출 단서의 ‘관련 인물’ 범위를 벗어나 호칭을 전이하지 않는다. ‘상대 미명시’ 또는 ‘관련 인물 불명확’ 단서는 다른 캐릭터에게 새 호칭을 부여하는 근거로 사용하지 않는다.\\n- ‘선배님/오빠/누나/형/언니/직함’ 같은 단어가 한 edge에서 등장했다는 이유만으로 다른 edge의 호칭으로 재사용하지 않는다. 각각 별도로 확립되어야 한다.\\n- 명시된 호칭, 존댓말/반말 규칙, 직급·신분 호칭은 단순 문체 취향이 아니라 CANON이다. 감정이 격해지거나 친밀 장면이어도 임의로 뒤집지 않는다.\\n- 나이가 많다는 이유만으로 ‘오빠/누나/형/언니’를 자동 생성하지 않는다. 그런 호칭은 사용자 설정이나 이미 확립된 본문 관계에서 실제로 쓰였을 때만 유지한다. 명시가 없으면 기존에 확립된 이름/직함/호칭을 보존한다.\\n- 한 화 안에서 같은 상대를 부르는 기본 호칭이 이유 없이 오락가락하지 않는다. 호칭 변화가 서사 사건이라면 변화가 일어난 시점 이후부터 새 규칙을 지속한다.\\n${hints.length ? `- 현재 설정에서 추출한 연령/호칭 단서:\\n${hints.map(x => `  • ${x}`).join('\\n')}` : '- 명시적 호칭 단서가 부족하면 새 친족형 호칭을 발명하지 말고 직전 확정 본문의 호칭을 우선한다.'}`;
  }
"""
if old not in s: raise SystemExit('addressCanon block missing')
s=s.replace(old,new,1)

s=s.replace('      addressCanon,\n      dialogueVariationDirective,','      addressCanon,\n      ensembleAddressContext,\n      annotateAddressHint,\n      dialogueVariationDirective,',1)
p.write_text(s)

for name in ['index.html','scripts/build-github-pages-canonical.mjs']:
    q=Path(name)
    t=q.read_text().replace('velour-v4.4.38-continuity-voice-guard.js?v=5','velour-v4.4.38-continuity-voice-guard.js?v=6')
    q.write_text(t)

for name in ['scripts/test-dirty-talk-frequency.mjs','scripts/test-dialogue-continuity-regression.mjs']:
    q=Path(name)
    if q.exists(): q.write_text(q.read_text().replace('continuity-voice-guard\\.js\\?v=5','continuity-voice-guard\\.js\\?v=6'))

Path('scripts/test-address-edge-scope.mjs').write_text(r'''#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('velour-v4.4.38-continuity-voice-guard.js','utf8');
const state={hardCanon:'',storyline:'',runtime:{durableFacts:[]}};
const ensemble={
  heroine:{name:'하은',relationshipNote:'',customNote:''},
  partners:[
    {name:'민수',relationshipNote:'하은은 민수를 선배님이라고 부른다.',customNote:''},
    {name:'서준',relationshipNote:'',customNote:'하은을 누나라고 부른다.'}
  ]
};
const elements={inputChars:{value:'하은은 민수를 선배님이라고 부른다.'},v33Next:{value:''}};
const window={
  buildPrompt:()=> 'BASE',generateStory:async()=>{},
  __VELOUR_STORAGE_QA__:{confirmedEpisode:()=>0},
  __VELOUR_SCENE_VOICE_MEMORY_HOTFIX__:true,
  __VELOUR_CONTINUITY_COST_HOTFIX__:true,
  __VELOUR_V4_STATE_SNAPSHOT__:()=>state,
  __VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__:{loadCfg:()=>ensemble,activePartners:cfg=>cfg.partners}
};
const context=vm.createContext({window,document:{getElementById:id=>elements[id]||null},console,setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,Promise});
vm.runInContext(source,context);
const qa=window.__VELOUR_CONTINUITY_VOICE_GUARD_QA__;
assert.equal(qa.version,'1.2.1');
const out=qa.addressCanon(state);
assert.match(out,/화자 → 대상/);
assert.match(out,/A→C, C→B, B→A에 복사하지 않는다/);
assert.match(out,/관련 인물: 하은 ↔ 민수/);
assert.match(out,/메모 소유자: 서준/);
assert.match(out,/다른 캐릭터에게 새 호칭을 부여하는 근거로 사용하지 않는다/);
console.log('PASS: address honorifics remain scoped to the correct character edge');
''')
