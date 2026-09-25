#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('velour-v4.4.38-concept-relationship-governor.js', 'utf8');
const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js', 'utf8');
const relationGuardSource = readFileSync('velour-v4.4.38-continuity-relation-grammar-hotfix.js', 'utf8');

function cls(active=false){
  const set = new Set(active ? ['active'] : []);
  return { toggle(k,on){ on ? set.add(k) : set.delete(k); }, contains:k => set.has(k) };
}

const legacyTrope = { textContent:'과외선생님 × 성인 학생', innerText:'과외선생님 × 성인 학생', classList:cls(true) };
const tropeWrap = { dataset:{}, addEventListener(){}, querySelectorAll(){ return [legacyTrope]; } };
const recRel = { textContent:'비서 × 대표/사장', dataset:{v33rel:'secretary_ceo'}, classList:cls(true) };
const cross1 = { textContent:'엘리베이터·정전·밀폐공간', dataset:{id:'elevator'}, classList:{...cls(false), contains:k => k === 'on'} };
const cross2 = { textContent:'출장·레이오버·호텔 오예약', dataset:{id:'travel'}, classList:{...cls(false), contains:k => k === 'on'} };
const dynInput = { value:'possessive', checked:true, closest(){ return {textContent:'집착 · 소유욕'}; } };
const elements = {
  tropeTags:tropeWrap,
  v4World:{value:'modern_general', selectedOptions:[{textContent:'현대 · 일반'}]},
  v4Relationship:{value:'fwb', selectedOptions:[{textContent:'섹파 / FWB'}]},
  v4Trajectory:{value:'fwb_to_lovers', selectedOptions:[{textContent:'섹파 → 연인'}]},
  v33Mix:{value:'1'},
  v33Next:{value:''},
  selectStage:{value:'[빌드업 & 감정선 중심]', selectedOptions:[{textContent:'01. 서사 빌드업'}]}
};
const document = {
  getElementById(id){ return elements[id] || null; },
  querySelectorAll(sel){
    if (sel === '#v4Dynamics input:checked') return [dynInput];
    if (sel === '#tropeTags > .tag-pill.active') return [legacyTrope];
    if (sel === '#tropeTags > .tag-pill') return [legacyTrope];
    if (sel === '[data-v33rel].active') return [recRel];
    if (sel === '#v33Tags .v33-tag.on[data-id]') return [cross1, cross2];
    if (sel === '[data-v33rel]') return [recRel];
    if (sel === '#v33Tags .v33-tag[data-id]') return [cross1, cross2];
    return [];
  }
};
const state = {
  world:'modern_general', relationship:'fwb', trajectory:'fwb_to_lovers', pacing:'slow', customUnlockEpisode:8,
  hardCanon:'두 사람은 나중에 충분한 감정 축적 뒤 연인이 된다.', dynamics:['possessive'], runtime:{confirmedEpisode:0}
};
const legacyPrompt = `BASE
[작품 기본 설정]
- 관계성/Trope: 치명적인 긴장감과 소유욕
- 인물 구도: A × B
[장소·사건·기믹 크로스오버]
1. 옛 중복 크로스오버 블록
[KEEP]
- 기존 V3.5 관계 태그는 V4.4.32 관계축과 중복되므로 이번 프롬프트에서는 비활성화했다.
- KEEP_ME`;
const storyHistory = [
  '“네가 먼저 시작한 거야.”',
  '“오늘도 네가 먼저 건드렸잖아.”',
  '“갈 것 같아.”',
  '“또 갈 것 같아.”',
  '“나한테 싸.”',
  '“이번에도 내게 싸.”'
].join('\n');
const window = {
  __VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__:true,
  __VELOUR_V4_STATE_SNAPSHOT__:() => JSON.parse(JSON.stringify(state)),
  __VELOUR_V4_STATE_RESTORE__:() => {},
  __VELOUR_STORAGE_QA__:{ confirmedEpisode:() => 0 },
  buildPrompt:() => legacyPrompt
};
const context = {
  window, document, storyHistory, episodeCount:1, console, Date, setInterval, clearInterval, setTimeout,
  localStorage:{ getItem(){return null;}, setItem(){} }
};
context.globalThis = context;

vm.runInNewContext(source, context, { filename:'velour-v4.4.38-concept-relationship-governor.js' });

assert.equal(window.__VELOUR_CONCEPT_RELATIONSHIP_VERSION__, '1.2.0');
const qa = window.__VELOUR_CONCEPT_RELATIONSHIP_QA__;
const concepts = qa.collectConcepts(state);
assert.equal(qa.relationshipPhase(state, concepts), 'setup');
assert.equal(qa.relationshipPhase({...state,pacing:'slow'}, {...concepts,episode:7}), 'build');
assert.equal(qa.relationshipPhase({...state,pacing:'slow'}, {...concepts,episode:8}), 'transition');
assert.equal(qa.relationshipPhase({...state,pacing:'slow'}, {...concepts,episode:12}), 'payoff');
assert.equal(qa.explicitTransitionOverride(state, concepts), false, 'future hard canon must not unlock current relationship transition');
assert.equal(concepts.crossovers.length, 1, 'crossover mix count must cap active prompt devices');
assert.deepEqual(Array.from(concepts.legacyTropes), [], 'default legacy active trope must be ignored until user touches the legacy trope area');
assert.equal(qa.classifyCliche('네가 먼저 시작한 거야.'), 'blame_flip');
assert.equal(qa.classifyCliche('갈 것 같아.'), 'outcome_forecast');
assert.equal(qa.classifyCliche('나한테 싸.'), 'directed_outcome');

const memory = qa.clicheMemory();
assert.ok(memory.cooldown.includes('blame_flip'));
assert.ok(memory.cooldown.includes('outcome_forecast'));
assert.ok(memory.cooldown.includes('directed_outcome'));

const output = window.buildPrompt(false);
assert.match(output, /CONCEPT RESOLVER V1/);
assert.match(output, /RELATIONSHIP PROGRESSION GOVERNOR V1/);
assert.match(output, /DIALOGUE CLICHE COOLDOWN V1/);
assert.match(output, /현재 관계=섹파 \/ FWB/);
assert.match(output, /관계 변화 목적지=FWB에서 상호 연인 관계/);
assert.match(output, /추천 관계 태그는 인물의 역할/);
assert.match(output, /엘리베이터·정전·밀폐공간/);
assert.doesNotMatch(output, /출장·레이오버·호텔 오예약/, 'mixCount=1 must not leak extra crossover');
assert.doesNotMatch(output, /과외선생님 × 성인 학생/, 'untouched legacy default must not contaminate the final prompt');
assert.match(output, /현재는 관계 전환 잠금 상태/);
assert.match(output, /초반에는 소유 주장·통제·독점 행동으로 발현시키지 않는다/);
assert.doesNotMatch(output, /관계성\/Trope: 치명적인 긴장감과 소유욕/);
assert.doesNotMatch(output, /기존 V3\.5 관계 태그는 .*비활성화/);
assert.doesNotMatch(output, /옛 중복 크로스오버 블록/);
assert.doesNotMatch(output, /네가 먼저 시작한 거야|갈 것 같아|나한테 싸/);
assert.match(output, /책임 전가형 도발/);
assert.match(output, /결과·절정 예고/);
assert.match(output, /상대에게 결과를 요구하는 지시/);

const snap = window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.deepEqual(Array.from(snap.conceptSelections.recommendedRelationshipIds), ['secretary_ceo']);
assert.deepEqual(Array.from(snap.conceptSelections.crossoverIds), ['elevator','travel']);
assert.equal(snap.conceptSelections.legacyTropeTouched, false);

tropeWrap.dataset.velourLegacyTropeTouched = '1';
assert.deepEqual(Array.from(qa.activeLegacyTropes()), ['과외선생님 × 성인 학생']);

state.hardCanon = '현재 두 사람은 이미 연인 관계다.';
assert.equal(qa.explicitTransitionOverride(state, qa.collectConcepts(state)), true, 'explicit current canon may override the transition lock');

assert.match(loader, /contextual-dialogue-engine\.js\?v=3/);
assert.match(loader, /concept-relationship-governor\.js\?v=2/);
assert.match(relationGuardSource, /__VELOUR_CONCEPT_RELATIONSHIP_GOVERNOR_LOADER__/);
assert.match(relationGuardSource, /concept-relationship-governor\.js\?v=2/);
assert.doesNotMatch(relationGuardSource, /__VELOUR_CONCEPT_GOVERNOR_LOADER__/);

console.log('PASS: concept resolver, slow relationship guard, user-touch legacy trope gating, concept persistence bridge, semantic cliche cooldown, and loader wiring work together');
