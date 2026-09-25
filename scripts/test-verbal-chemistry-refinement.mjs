#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('velour-v4.4.38-verbal-chemistry-refinement.js','utf8');
const loader=readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');

const stored=new Map();
stored.set('VELOUR_VERBAL_CHEMISTRY_V2',JSON.stringify({
  directness:58,mischief:82,playfulness:72,emotionalExposure:30,verbalDominance:48,specificity:94,
  tactics:['callback','contradiction','witty_observation']
}));
const localStorage={
  getItem:k=>stored.has(k)?stored.get(k):null,
  setItem:(k,v)=>stored.set(k,String(v))
};

let storyHistory='';
let sessionEpisodes=[];
const elements=new Map();
const novel={innerText:'',dataset:{}};
elements.set('novelText',novel);
elements.set('v4Insult',{value:'off',dataset:{}});
const body={};
const document={
  body,
  getElementById:id=>elements.get(id)||null,
  querySelectorAll:()=>[],
};
class MutationObserver { constructor(fn){this.fn=fn;} observe(){} }

const state={insultMode:'off',dirtyTalk:80,dirtyTalkFrequency:75,profanity:70};
const window={
  __VELOUR_VERBAL_CHEMISTRY_V2__:true,
  __VELOUR_VERBAL_CHEMISTRY_QA__:{normalizeCfg:x=>x},
  __VELOUR_V4_STATE_SNAPSHOT__:()=>({...state}),
  buildPrompt:()=> 'BASE',
  generateStory:async()=>{},
  acceptVelourVaultResponse:async()=>{},
  showVelourResponseVault:async()=>{},
  __VELOUR_IDB_SAVE_DRAFT__:async()=>{},
  __VELOUR_IDB_PATCH_DRAFT_V4__:async()=>{}
};

const context={
  window,document,localStorage,MutationObserver,console,
  setInterval(fn){fn();return 1;},clearInterval(){},setTimeout(fn){fn();},
  storyHistory,sessionEpisodes
};
Object.defineProperty(context,'storyHistory',{get:()=>storyHistory,set:v=>{storyHistory=v;},configurable:true});
Object.defineProperty(context,'sessionEpisodes',{get:()=>sessionEpisodes,set:v=>{sessionEpisodes=v;},configurable:true});
context.globalThis=context;

vm.runInNewContext(source,context,{filename:'velour-v4.4.38-verbal-chemistry-refinement.js'});

assert.equal(window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_VERSION__,'2.1.0');
const qa=window.__VELOUR_VERBAL_CHEMISTRY_REFINEMENT_QA__;
assert.ok(qa);
assert.deepEqual(Array.from(qa.selectedTactics()),['callback','contradiction','witty_observation']);

const abusive='그는 상대를 미친년이라고 불렀다. 저 년아!';
const cleaned=qa.sanitizeGenderedInsults(abusive,'off');
assert.equal(qa.containsForbiddenGenderedInsult(cleaned,'off'),false);
assert.ok(!cleaned.includes('미친년'));
assert.ok(!cleaned.includes('년아'));

const years='내년에는 다시 만나고, 몇 년 뒤에 작년 일을 떠올렸다.';
assert.equal(qa.sanitizeGenderedInsults(years,'off'),years);
assert.equal(qa.containsForbiddenGenderedInsult(years,'off'),false);
assert.equal(qa.sanitizeGenderedInsults(abusive,'custom'),abusive);

const prompt=window.buildPrompt();
assert.match(prompt,/VERBAL CHEMISTRY V2\.1/);
assert.match(prompt,/둘만의 콜백 \/ 말·행동 모순 찌르기 \/ 짓궂은 관찰/);
assert.match(prompt,/선택한 팔레트 안에서만 전략을 고른다/);
assert.match(prompt,/상대 비하형 욕설은 HARD OFF/);
assert.match(prompt,/일반적인 연도 표현을 건드리지 않는다/);
assert.ok(!prompt.includes('미친년'));

novel.innerText=abusive;
storyHistory=abusive;
sessionEpisodes=[{episode:1,text:abusive}];
await window.generateStory(false);
assert.equal(qa.containsForbiddenGenderedInsult(novel.innerText,'off'),false);
assert.equal(qa.containsForbiddenGenderedInsult(storyHistory,'off'),false);
assert.equal(qa.containsForbiddenGenderedInsult(sessionEpisodes[0].text,'off'),false);

assert.match(loader,/verbal-chemistry-refinement\.js\?v=1/);
console.log('PASS: Verbal Chemistry V2.1 selection enforcement and language firewall');
