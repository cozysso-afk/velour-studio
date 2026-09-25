#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('velour-v4.4.38-verbal-chemistry-v2.js', 'utf8');
const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js', 'utf8');
const canonical = readFileSync('scripts/build-github-pages-canonical.mjs', 'utf8');

const stored = new Map();
const localStorage = {
  getItem(key){ return stored.has(key) ? stored.get(key) : null; },
  setItem(key,value){ stored.set(key,String(value)); }
};

function fakeNode(tag='div'){
  return {
    tagName:tag.toUpperCase(), id:'', className:'', dataset:{}, style:{}, textContent:'', innerHTML:'', parentElement:{},
    appendChild(){}, insertAdjacentElement(){}, addEventListener(){}, remove(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    closest(sel){ return sel === '.v40-grid' ? host : null; },
    classList:{ toggle(){}, add(){}, remove(){}, contains(){return false;} }
  };
}

const host = fakeNode('div');
host.parentElement = {};
host.insertAdjacentElement = (_where,node) => { elements.set(node.id,node); };
const dirtyAnchor = fakeNode('input');
dirtyAnchor.closest = sel => sel === '.v40-grid' ? host : null;

const elements = new Map([
  ['v4DirtyFrequency', dirtyAnchor]
]);
const head = { appendChild(node){ if (node?.id) elements.set(node.id,node); } };
const document = {
  head,
  getElementById(id){ return elements.get(id) || null; },
  createElement(tag){ return fakeNode(tag); }
};

const state = {
  dirtyTalk:72,
  dirtyTalkFrequency:64,
  profanity:18,
  relationship:'fwb',
  trajectory:'fwb_to_lovers',
  pacing:'slow',
  runtime:{confirmedEpisode:2}
};

const storyHistory = [
  '“그 표정, 아까랑 다르네.”',
  '“그 표정 또 그러네.”',
  '“지난번에도 그렇게 말했지?”',
  '“말은 괜찮다더니 행동은 다르네.”'
].join('\n');

const window = {
  __VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__:true,
  __VELOUR_CONCEPT_RELATIONSHIP_GOVERNOR__:true,
  __VELOUR_CONTEXTUAL_DIALOGUE_QA__:{ sceneMode:()=>'buildup' },
  __VELOUR_CONCEPT_RELATIONSHIP_QA__:{
    collectConcepts:()=>({episode:3,pacing:'slow'}),
    relationshipPhase:()=> 'setup'
  },
  __VELOUR_V4_STATE_SNAPSHOT__:()=> JSON.parse(JSON.stringify(state)),
  __VELOUR_V4_STATE_RESTORE__:()=>{},
  buildPrompt:()=> 'BASE PROMPT'
};

const context = {
  window, document, localStorage, storyHistory, console, Date,
  setInterval(fn){ fn(); return 1; }, clearInterval(){}, setTimeout(fn){ fn(); }
};
context.globalThis = context;

vm.runInNewContext(source, context, {filename:'velour-v4.4.38-verbal-chemistry-v2.js'});

assert.equal(window.__VELOUR_VERBAL_CHEMISTRY_VERSION__, '2.2.0');
const qa = window.__VELOUR_VERBAL_CHEMISTRY_QA__;
assert.ok(qa);

const normalized = qa.normalizeCfg({
  directness:140, mischief:-4, playfulness:50, emotionalExposure:20,
  verbalDominance:45, specificity:101,
  tactics:['callback','challenge','not-valid','callback']
});
assert.equal(normalized.directness,100);
assert.equal(normalized.mischief,0);
assert.equal(normalized.specificity,100);
assert.deepEqual(Array.from(normalized.tactics),['challenge','callback']);

assert.equal(qa.classifyTactic('아까 그렇게 여유 있더니?'),'callback');
assert.equal(qa.classifyTactic('말은 괜찮다더니 행동은 다르네.'),'contradiction');
assert.equal(qa.classifyTactic('그 표정은 숨길 생각이 없나 봐.'),'witty_observation');
assert.equal(qa.classifyTarget('지난번에도 그랬지?'),'history');
assert.equal(qa.classifyTarget('말은 괜찮다더니 행동은 다르네.'),'contradiction');
assert.equal(qa.relationshipPhase(),'setup');

const memory = qa.chemistryMemory();
assert.ok(memory.total >= 4);
assert.ok(memory.signatureCounts);

const prompt = window.buildPrompt(false);
assert.match(prompt,/VERBAL CHEMISTRY ENGINE V2\.2/);
assert.match(prompt,/relationshipPhase=setup/);
assert.match(prompt,/Trigger → Intent → Tactic → Target → Attitude → Character Voice → Line/);
assert.match(prompt,/대화주도는 .*소유권·관계 권한·동의 우위를 뜻하지 않는다/);
assert.match(prompt,/인물 이름만 바꿔 다른 커플에게 붙여도 자연스러운 핵심 대사는 다시 쓴다/);
assert.match(prompt,/현재 관계 단계가 허용하는가/);

const snap = window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.ok(snap.verbalChemistry);
assert.equal(snap.verbalChemistry.specificity,92);
assert.ok(document.getElementById('velourVerbalChemistryV2'));

assert.match(loader,/velour-v4\.4\.38-verbal-chemistry-v2\.js\?v=2/);
assert.match(canonical,/vault-accept-hotfix\.js\?v=30/);

console.log('PASS: Verbal Chemistry V2.2 UI/state bridge, tactic memory, relationship guard, and loader wiring are connected');