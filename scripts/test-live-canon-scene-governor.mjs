#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('velour-v4.4.38-live-canon-scene-governor.js','utf8');
const loader=readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');

const stored=new Map();
const localStorage={
  getItem:k=>stored.has(k)?stored.get(k):null,
  setItem:(k,v)=>stored.set(k,String(v)),
  removeItem:k=>stored.delete(k)
};
const listeners={};
const hardCanonEl={
  value:'교수와 조교는 같은 대학에서 일한다.\n여주는 흰 나시와 반바지를 입고 있다.',
  dataset:{},
  addEventListener(type,fn){listeners[type]=fn;}
};
const charsEl={value:'남주: 교수. 여주: 조교. 둘 다 성인.'};
const elements=new Map([['v4HardCanon',hardCanonEl],['inputChars',charsEl]]);
const document={
  getElementById:id=>elements.get(id)||null,
  createElement(){return {id:'',style:{},dataset:{},innerHTML:'',addEventListener(){},querySelector(){return null;}};}
};

let patchCalls=0;
let restored=null;
const baseState={
  hardCanon:'예전 설정: 여주는 셔츠를 입는다.',
  world:'modern_general',relationship:'professor_assistant',
  runtime:{confirmedEpisode:4,scenes:[
    {episode:2,location:'연구실',purpose:'자료 정리',adultScene:false},
    {episode:3,location:'연구실',purpose:'자료 정리',adultScene:false},
    {episode:4,location:'연구실',purpose:'회의',adultScene:true,positionId:'p1',pattern:'same',initiation:'A',control:'A'}
  ]}
};
const window={
  __VELOUR_V4_STATE_SNAPSHOT__:()=>JSON.parse(JSON.stringify(baseState)),
  __VELOUR_V4_STATE_RESTORE__:s=>{restored=s;},
  __VELOUR_IDB_PATCH_DRAFT_V4__:async()=>{patchCalls++;},
  buildPrompt:()=>`BASE\n\n[AUTHORITATIVE HARD CANON — FINAL LOCK]\n예전 설정: 여주는 셔츠를 입는다.\n\n[VERBAL CHEMISTRY ENGINE V2.2]`,
};

const context={window,document,localStorage,console,
  setInterval(fn){fn();return 1;},clearInterval(){},
  setTimeout(fn){fn();return 1;},clearTimeout(){}};
context.globalThis=context;
vm.runInNewContext(source,context,{filename:'velour-v4.4.38-live-canon-scene-governor.js'});

assert.equal(window.__VELOUR_LIVE_CANON_SCENE_GOVERNOR_VERSION__,'1.0.0');
const qa=window.__VELOUR_LIVE_CANON_SCENE_GOVERNOR_QA__;
assert.ok(qa);

let snap=window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.equal(snap.hardCanon,hardCanonEl.value);
assert.ok(snap.sceneGovernor);
assert.deepEqual(Array.from(qa.wardrobeFacts(snap.hardCanon)),['여주는 흰 나시와 반바지를 입고 있다.']);

let prompt=window.buildPrompt();
assert.match(prompt,/최신 HARD CANON/);
assert.match(prompt,/여주는 흰 나시와 반바지를 입고 있다/);
assert.match(prompt,/새 의복\/소품을 편의상 생성하거나 기존 것을 다른 것으로 바꾸지 않는다/);
assert.match(prompt,/장소·상황 자연 회전/);
assert.match(prompt,/상황·갈등 후보축/);
assert.match(prompt,/주인공\(여주\) 적극성/);
assert.ok(prompt.lastIndexOf('VELOUR LIVE CANON · SCENE GOVERNOR V1')>prompt.indexOf('VERBAL CHEMISTRY ENGINE V2.2'));

const candidates=qa.sceneCandidates(snap);
assert.equal(candidates.locations.length,3);
assert.ok(candidates.locations.some(x=>/강의실|차량|도서관|학회|주거지|학교 밖/.test(x)),candidates.locations.join(' | '));
assert.ok(candidates.purposes.some(x=>/수업|연구|역할|자료|교직원|퇴근|우선순위/.test(x)),candidates.purposes.join(' | '));

qa.saveCfg({agencyIntensity:90,agencyFrequency:'very_high'});
snap=window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.equal(snap.sceneGovernor.agencyIntensity,90);
assert.equal(snap.sceneGovernor.agencyFrequency,'very_high');
assert.equal(qa.agencyBudget(snap.sceneGovernor),4);
prompt=window.buildPrompt();
assert.match(prompt,/강도 90\/100/);
assert.match(prompt,/빈도 very_high/);
assert.match(prompt,/능동 선택 목표 4회 안팎/);

hardCanonEl.value='교수와 조교는 같은 대학에서 일한다.\n여주는 검은 민소매와 회색 반바지를 입고 있다.';
snap=window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.match(snap.hardCanon,/검은 민소매/);
prompt=window.buildPrompt();
assert.match(prompt,/검은 민소매와 회색 반바지/);
assert.doesNotMatch(prompt,/최신 HARD CANON[^]*흰 나시와 반바지[^]*\/VELOUR LIVE CANON/);

window.__VELOUR_V4_STATE_RESTORE__({hardCanon:'다른 저장본',sceneGovernor:{agencyIntensity:35,agencyFrequency:'low'}});
assert.ok(restored);
assert.equal(qa.loadCfg().agencyIntensity,35);
assert.equal(qa.loadCfg().agencyFrequency,'low');

assert.ok(typeof listeners.input==='function');
listeners.input();
await Promise.resolve();
assert.ok(patchCalls>=1);

const refinementPos=loader.indexOf('VERBAL_CHEMISTRY_REFINEMENT_LOADER');
const livePos=loader.indexOf('LIVE_CANON_SCENE_GOVERNOR_LOADER');
assert.ok(refinementPos>=0&&livePos>refinementPos);
assert.match(loader,/verbal-chemistry-refinement\.js\?v=4/);
assert.match(loader,/live-canon-scene-governor\.js\?v=1/);

console.log('PASS: live HARD CANON overrides stale snapshots, wardrobe continuity is locked, scene variety and agency controls are active');