#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const v2=readFileSync('velour-v4.4.38-verbal-chemistry-v2.js','utf8');
const firewall=readFileSync('velour-v4.4.38-verbal-chemistry-refinement.js','utf8');
const vaultBridge=readFileSync('velour-v4.4.38-vault-language-firewall.js','utf8');
const loader=readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');

const stored=new Map();
stored.set('VELOUR_VERBAL_CHEMISTRY_V2',JSON.stringify({
  directness:61,mischief:82,playfulness:70,emotionalExposure:31,verbalDominance:50,specificity:95,
  tacticModes:{callback:'priority',contradiction:'allowed',witty_observation:'allowed',challenge:'off',twisted_praise:'off',comeback:'off',restrained_pressure:'off',playful_affection:'off'}
}));
const localStorage={getItem:k=>stored.has(k)?stored.get(k):null,setItem:(k,v)=>stored.set(k,String(v)),removeItem:k=>stored.delete(k)};

let storyHistory='그가 고개를 들었다. “아까 그 말 기억나?” 그녀가 웃었다. “그건 네가 먼저 말했잖아.” 그는 잠깐 멈췄다. “그래?”';
let sessionEpisodes=[];
const elements=new Map();
const novel={innerText:'',dataset:{}};
elements.set('novelText',novel);
elements.set('v4Insult',{value:'off',dataset:{}});
const head={appendChild(){}};
const body={};
const document={
  head,body,
  getElementById:id=>elements.get(id)||null,
  createElement(tag){return {tagName:String(tag).toUpperCase(),id:'',textContent:'',style:{},dataset:{},appendChild(){},remove(){}};},
  querySelectorAll(){return [];}
};
class MutationObserver{constructor(fn){this.fn=fn;}observe(){}}

const state={insultMode:'off',dirtyTalk:80,dirtyTalkFrequency:78,profanity:70,runtime:{confirmedEpisode:7}};
const window={
  __VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__:true,
  __VELOUR_CONCEPT_RELATIONSHIP_GOVERNOR__:true,
  __VELOUR_LAST_CONCEPT_RESOLUTION__:{phase:'build'},
  __VELOUR_V4_STATE_SNAPSHOT__:()=>({...state}),
  __VELOUR_V4_STATE_RESTORE__:()=>{},
  buildPrompt:()=>`BASE\n\n[VERBAL CHEMISTRY V2.1 — old duplicate]\n- stale rule`,
  generateStory:async()=>{},
  showVelourResponseVault:async()=>{},
  acceptVelourVaultResponse:async()=>{},
  __VELOUR_IDB_SAVE_DRAFT__:async()=>{},
  __VELOUR_IDB_PATCH_DRAFT_V4__:async()=>{}
};

const context={window,document,localStorage,MutationObserver,console,storyHistory,sessionEpisodes,
  setInterval(fn){fn();return 1;},clearInterval(){},setTimeout(fn){fn();return 1;}};
Object.defineProperty(context,'storyHistory',{get:()=>storyHistory,set:v=>{storyHistory=v;},configurable:true});
Object.defineProperty(context,'sessionEpisodes',{get:()=>sessionEpisodes,set:v=>{sessionEpisodes=v;},configurable:true});
context.globalThis=context;

vm.runInNewContext(v2,context,{filename:'velour-v4.4.38-verbal-chemistry-v2.js'});
assert.equal(window.__VELOUR_VERBAL_CHEMISTRY_VERSION__,'2.2.0');
const qa=window.__VELOUR_VERBAL_CHEMISTRY_QA__;
assert.ok(qa);

const cfg=qa.loadCfg();
assert.equal(cfg.tacticModes.callback,'priority');
assert.equal(cfg.tacticModes.challenge,'off');
assert.ok(cfg.tactics.includes('callback'));
assert.ok(!cfg.tactics.includes('challenge'));
const chosen=Array.from(qa.chooseTactics(cfg,qa.chemistryMemory(),state));
assert.ok(chosen.includes('callback'));
assert.ok(!chosen.includes('challenge'));
assert.equal(qa.teaseBudget(state,cfg),3);

const migrated=qa.normalizeCfg({tactics:['callback','contradiction']});
assert.equal(migrated.tacticModes.callback,'allowed');
assert.equal(migrated.tacticModes.challenge,'off');

const voice=qa.voiceFingerprint();
assert.ok(voice.sample>=3);
assert.notEqual(voice.length,'unknown');

const prompt=window.buildPrompt();
assert.equal((prompt.match(/VERBAL CHEMISTRY ENGINE V2\.2/g)||[]).length,1);
assert.ok(!prompt.includes('VERBAL CHEMISTRY V2.1'));
assert.match(prompt,/주력=둘만의 콜백/);
assert.match(prompt,/OFF=.*도전·허세 건드리기/);
assert.match(prompt,/핵심 희롱 비트 예산=3/);
assert.match(prompt,/voice fingerprint/);
assert.match(prompt,/성별을 낮춰 부르는 사람 멸칭은 사용하지 않는다/);

vm.runInNewContext(firewall,context,{filename:'velour-v4.4.38-verbal-chemistry-refinement.js'});
assert.equal(window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_VERSION__,'2.2.1');
const fw=window.__VELOUR_LANGUAGE_FIREWALL_QA__;
assert.ok(fw);

const abusive='그는 상대를 미친년이라고 불렀다. 저 년아! 개년아. 씨발년. 시발 년이라고 했다. 씨팔년은 안 된다. 좆같은년까지 막아야 한다.';
const cleaned=fw.sanitizeGenderedInsults(abusive,'off');
assert.equal(fw.containsForbiddenGenderedInsult(cleaned,'off'),false);
for(const token of ['미친년','년아','씨발년','시발 년','씨팔년','좆같은년']) assert.ok(!cleaned.includes(token),token);
assert.ok(cleaned.includes('빌어먹을 인간'));

const years='5개년 계획과 3개년 사업을 검토했다. 내년에는 다시 만나고, 몇 년 뒤 작년 일을 떠올렸다.';
assert.equal(fw.sanitizeGenderedInsults(years,'off'),years);
assert.equal(fw.containsForbiddenGenderedInsult(years,'off'),false);
assert.equal(fw.sanitizeGenderedInsults(abusive,'custom'),abusive);

novel.innerText=abusive;
storyHistory=abusive;
sessionEpisodes=[{episode:1,text:abusive}];
await window.generateStory(false);
assert.equal(fw.containsForbiddenGenderedInsult(novel.innerText,'off'),false);
assert.equal(fw.containsForbiddenGenderedInsult(storyHistory,'off'),false);
assert.equal(fw.containsForbiddenGenderedInsult(sessionEpisodes[0].text,'off'),false);

assert.match(loader,/verbal-chemistry-v2\.js\?v=2/);
assert.match(loader,/verbal-chemistry-refinement\.js\?v=3/);
assert.match(loader,/vault-language-firewall\.js\?v=1/);
assert.match(vaultBridge,/data-vault-accept/);
assert.match(vaultBridge,/sanitizeAndPersist/);

console.log('PASS: V2.2.1 language firewall blocks profanity-prefixed gendered insults and preserves year expressions');
