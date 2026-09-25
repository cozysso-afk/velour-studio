#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('velour-v4.4.38-concept-relationship-governor.js', 'utf8');

function cls(active=false){
  const set = new Set(active ? ['active'] : []);
  return { toggle(k,on){ on ? set.add(k) : set.delete(k); }, contains:k => set.has(k) };
}

const legacyTrope = { textContent:'강박적 집착 & 소유욕', innerText:'강박적 집착 & 소유욕', classList:cls(true) };
const recRel = { textContent:'비서 × 대표/사장', dataset:{v33rel:'secretary_ceo'}, classList:cls(true) };
const cross = { textContent:'엘리베이터·정전·밀폐공간', dataset:{id:'elevator'}, classList:{...cls(false), contains:k => k === 'on'} };
const dynInput = { value:'possessive', closest(){ return {textContent:'집착 · 소유욕'}; } };
const elements = {
  v4World:{value:'modern_general', selectedOptions:[{textContent:'현대 · 일반'}]},
  v4Relationship:{value:'fwb', selectedOptions:[{textContent:'섹파 / FWB'}]},
  v4Trajectory:{value:'fwb_to_lovers', selectedOptions:[{textContent:'섹파 → 연인'}]},
  v33Next:{value:''},
  selectStage:{value:'[빌드업 & 감정선 중심]', selectedOptions:[{textContent:'01. 서사 빌드업'}]}
};
const document = {
  getElementById(id){ return elements[id] || null; },
  querySelectorAll(sel){
    if (sel === '#v4Dynamics input:checked') return [dynInput];
    if (sel === '#tropeTags .tag-pill.active') return [legacyTrope];
    if (sel === '[data-v33rel].active') return [recRel];
    if (sel === '#v33Tags .v33-tag.on[data-id]') return [cross];
    if (sel === '[data-v33rel]') return [recRel];
    if (sel === '#v33Tags .v33-tag[data-id]') return [cross];
    return [];
  }
};
const state = {
  world:'modern_general', relationship:'fwb', trajectory:'fwb_to_lovers', pacing:'slow', customUnlockEpisode:8,
  hardCanon:'', dynamics:['possessive'], runtime:{confirmedEpisode:0}
};
const legacyPrompt = `BASE
[작품 기본 설정]
- 관계성/Trope: 치명적인 긴장감과 소유욕
- 인물 구도: A × B
- 기존 V3.5 관계 태그는 V4.4.32 관계축과 중복되므로 이번 프롬프트에서는 비활성화했다.
[KEEP]
- KEEP_ME`;
const storyHistory = [
  '“네가 먼저 시작한 거야.”',
  '“오늘도 네가 먼저 건드렸잖아.”',
  '“갈 것 같아.”',
  '“나한테 싸.”'
].join('\n');
const window = {
  __VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__:true,
  __VELOUR_V4_STATE_SNAPSHOT__:() => JSON.parse(JSON.stringify(state)),
  __VELOUR_V4_STATE_RESTORE__:() => {},
  buildPrompt:() => legacyPrompt
};
const context = {
  window, document, storyHistory, episodeCount:1, console, Date, setInterval, clearInterval, setTimeout,
  localStorage:{ getItem(){return null;}, setItem(){} }
};
context.globalThis = context;

vm.runInNewContext(source, context, { filename:'velour-v4.4.38-concept-relationship-governor.js' });

assert.equal(window.__VELOUR_CONCEPT_RELATIONSHIP_VERSION__, '1.0.0');
const qa = window.__VELOUR_CONCEPT_RELATIONSHIP_QA__;
assert.equal(qa.relationshipPhase(state, qa.collectConcepts(state)), 'setup');
assert.equal(qa.classifyCliche('네가 먼저 시작한 거야.'), 'blame_flip');
assert.equal(qa.classifyCliche('갈 것 같아.'), 'outcome_forecast');
assert.equal(qa.classifyCliche('나한테 싸.'), 'directed_outcome');

const output = window.buildPrompt(false);
assert.match(output, /CONCEPT RESOLVER V1/);
assert.match(output, /RELATIONSHIP PROGRESSION GOVERNOR V1/);
assert.match(output, /DIALOGUE CLICHE COOLDOWN V1/);
assert.match(output, /현재 관계=섹파 \/ FWB/);
assert.match(output, /관계 변화 목적지=FWB에서 상호 연인 관계/);
assert.match(output, /추천 관계 태그는 인물의 역할/);
assert.match(output, /엘리베이터·정전·밀폐공간/);
assert.match(output, /SETUP에서는 겉으로 드러나는 소유 주장·통제·독점 행동으로 발현시키지 않는다/);
assert.doesNotMatch(output, /관계성\/Trope: 치명적인 긴장감과 소유욕/);
assert.doesNotMatch(output, /기존 V3\.5 관계 태그는 .*비활성화/);
assert.doesNotMatch(output, /네가 먼저 시작한 거야|갈 것 같아|나한테 싸/);
assert.match(output, /책임 전가형 도발/);
assert.match(output, /결과·절정 예고/);
assert.match(output, /상대에게 결과를 요구하는 지시/);

console.log('PASS: concept resolver, slow relationship guard, and cliche cooldown work together');
