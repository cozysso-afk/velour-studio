#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('velour-v4.4.38-ensemble-character-preferences.js','utf8');
const loader=readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');

const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};

const cfg={
  mode:'one_to_many',
  heroine:{
    id:'heroine',name:'서윤',role:'대학원 조교',relationshipNote:'',customNote:'',speechPreset:'casual_soft',
    personalities:['calm','proactive'],tendencies:['initiative','boundary'],initiativeIntensity:15,initiativeFrequency:'low',
    positionModes:{missionary:'off',rider_forward:'priority',lotus:'priority',side_face:'allowed'},
    caressModes:{long_kiss:'priority',embrace:'allowed',playful_touch:'off'}
  },
  partners:[
    {id:'p1',name:'도진',role:'교수',relationshipNote:'지도교수',customNote:'',speechPreset:'terse_dry',personalities:['calm'],tendencies:['boundary'],initiativeIntensity:55,initiativeFrequency:'balanced',positionModes:{missionary:'allowed',rider_forward:'priority',lotus:'allowed'},caressModes:{long_kiss:'priority',embrace:'allowed',playful_touch:'allowed'}},
    {id:'p2',name:'태현',role:'연구원',relationshipNote:'공동 프로젝트',customNote:'',speechPreset:'witty_teasing',personalities:['playful'],tendencies:['responsive'],initiativeIntensity:68,initiativeFrequency:'high',positionModes:{missionary:'off',rider_forward:'allowed',lotus:'off',side_face:'priority'},caressModes:{long_kiss:'allowed',embrace:'priority',playful_touch:'off'}}
  ]
};
store.set('VELOUR_ENSEMBLE_CHARACTER_PREFS_V1',JSON.stringify(cfg));

const elements=new Map();
elements.set('v33Next',{value:'이번 화는 태현과 프로젝트 발표 후 대화가 이어진다.'});
const document={getElementById:id=>elements.get(id)||null,createElement(){return {style:{},dataset:{},remove(){},querySelectorAll(){return [];},addEventListener(){}};}};

let restored=null;
const baseState={
  intimacyPatterns:['face','rear','side','seated','standing','oral_manual','bed','sofa_chair','shower','floor_wall'],
  sceneGovernor:{agencyIntensity:91,agencyFrequency:'very_high'},
  runtime:{confirmedEpisode:4,scenes:[{episode:4}],positionUsage:{rider_forward:0,side_face:0},lastSuggestedPositions:['missionary']}
};
const window={
  buildPrompt:()=> 'BASE PROMPT',
  __VELOUR_V4_STATE_SNAPSHOT__:()=>JSON.parse(JSON.stringify(baseState)),
  __VELOUR_V4_STATE_RESTORE__:s=>{restored=s;},
  __VELOUR_IDB_PATCH_DRAFT_V4__:async()=>{}
};
const context={window,document,localStorage,console,setInterval(fn){fn();return 1;},clearInterval(){},setTimeout(fn){fn();return 1;},clearTimeout(){}};
context.globalThis=context;
vm.runInNewContext(source,context,{filename:'velour-v4.4.38-ensemble-character-preferences.js'});

assert.equal(window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_VERSION__,'1.0.3');
const qa=window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__;
assert.ok(qa);
assert.equal(qa.POSITION_CATALOG.length,40,'core mirror should keep all 40 current position entries');
assert.equal(qa.CARESS_CATALOG.length,12);
assert.match(qa.heroineAgencySummary(baseState),/91\/100/);
assert.match(qa.heroineAgencySummary(baseState),/very_high/);

const loaded=qa.loadCfg();
assert.equal(loaded.mode,'one_to_many');
assert.equal(qa.activePartners(loaded).length,2);
assert.equal(loaded.heroine.positionModes.missionary,'off');
assert.equal(loaded.heroine.positionModes.rider_forward,'priority');
assert.equal(loaded.partners[1].speechPreset,'witty_teasing');

const focus=qa.focusPartner(loaded,baseState);
assert.equal(focus.name,'태현','current episode directive should focus the named partner');

const mutual=qa.mutualPositionCandidates(loaded.heroine,focus,baseState,40);
assert.ok(mutual.some(x=>x.id==='rider_forward'));
assert.ok(mutual.some(x=>x.id==='side_face'));
assert.ok(!mutual.some(x=>x.id==='missionary'),'heroine OFF must exclude a candidate even if partner allows it');
assert.ok(!mutual.some(x=>x.id==='lotus'),'partner OFF must exclude a candidate even if heroine prioritizes it');
const caress=qa.mutualCaressCandidates(loaded.heroine,focus,40);
assert.ok(caress.some(x=>x.id==='long_kiss'));
assert.ok(caress.some(x=>x.id==='embrace'));
assert.ok(!caress.some(x=>x.id==='playful_touch'));

assert.equal(qa.cycleMode('allowed'),'priority');
assert.equal(qa.cycleMode('priority'),'off');
assert.equal(qa.cycleMode('off'),'allowed');
assert.equal(qa.initiativeBudget(loaded.partners[1]),3);

const snapshot=window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.equal(snapshot.ensemblePreferences.mode,'one_to_many');
assert.equal(snapshot.ensemblePreferences.partners.length,2);
assert.equal(snapshot.ensemblePreferences.heroine.name,'서윤');

const prompt=window.buildPrompt();
assert.match(prompt,/ENSEMBLE CHARACTER · PREFERENCE ENGINE V1/);
assert.match(prompt,/1:다/);
assert.match(prompt,/독립적인 1:1 관계 edge/);
assert.match(prompt,/focus=태현/);
assert.match(prompt,/서윤/);
assert.match(prompt,/도진/);
assert.match(prompt,/태현/);
assert.match(prompt,/여주 적극성 강도\/빈도는 기존 SCENE AGENCY 설정만 사용/);
assert.match(prompt,/적극성=91\/100, 빈도 very_high — SCENE AGENCY 단일 설정/);
assert.doesNotMatch(prompt,/서윤:.*적극성=15\/100/,'stale duplicate heroine agency value must not reach the prompt');
assert.match(prompt,/OFF는 자동 생성 후보에서 완전히 제외/);
assert.match(prompt,/이 엔진 자체가 장면을 조기 해금하지 않는다/);
assert.match(prompt,/상호 허용되는 저사용 구도 후보/);

const single=qa.normalizeCfg({...loaded,mode:'one_to_one'});
assert.equal(qa.activePartners(single).length,1,'existing 1:1 stories must stay one-partner by default');
const tooMany=qa.normalizeCfg({...loaded,partners:[...loaded.partners,...loaded.partners,...loaded.partners,...loaded.partners]});
assert.equal(tooMany.partners.length,5,'partner count must be capped');

window.__VELOUR_V4_STATE_RESTORE__({ensemblePreferences:{...loaded,mode:'one_to_one'}});
assert.ok(restored,'base restore must still run');
assert.equal(qa.loadCfg().mode,'one_to_one');

const ensembleIndex=loader.indexOf('__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_LOADER__');
const liveCanonIndex=loader.indexOf('__VELOUR_LIVE_CANON_SCENE_GOVERNOR_LOADER__');
assert.ok(ensembleIndex>0&&liveCanonIndex>ensembleIndex,'ensemble planner must load before the final live HARD CANON governor');
assert.match(loader,/ensemble-character-preferences\.js\?v=2/);

console.log('PASS: ensemble character preferences keep 1:1 compatibility, isolate multi-partner edges, reuse the single heroine agency authority, persist profiles, and enforce mutual tri-state preferences');
