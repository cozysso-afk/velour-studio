#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('velour-v4.4.38-intimacy-preference-depth.js','utf8');
const loader=readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};

const heroine={id:'heroine',name:'서윤'};
const partner={id:'p1',name:'도진'};
const ensembleCfg={mode:'one_to_one',heroine,partners:[partner]};
const ensembleQA={
  loadCfg:()=>ensembleCfg,
  activePartners:cfg=>cfg.partners.slice(0,cfg.mode==='one_to_many'?cfg.partners.length:1),
  focusPartner:()=>partner
};

const initial={profiles:{
  heroine:{id:'heroine',styleModes:{dominant_lead:'priority',sadistic_light:'priority',verbal_arousal:'priority',adventure_setting:'priority',exposure_fantasy:'allowed'},stimModes:{ear_neck:'priority',nipple_bite_light:'priority',adult_lactation:'off',anal_oral:'off',prostate:'allowed'}},
  p1:{id:'p1',styleModes:{submissive_lean:'priority',masochistic_light:'priority',verbal_arousal:'allowed',adventure_setting:'allowed',exposure_fantasy:'allowed'},stimModes:{ear_neck:'allowed',nipple_bite_light:'priority',adult_lactation:'allowed',anal_oral:'allowed',prostate:'priority'}}
}};
store.set('VELOUR_INTIMACY_PREFERENCE_DEPTH_V1',JSON.stringify(initial));

const elements=new Map();
const anchor={parentNode:{appendChild(){}},insertAdjacentElement(){},querySelectorAll(){return [];}};
elements.set('velourEnsemblePrefsV1',anchor);
const document={
  body:null,
  getElementById:id=>elements.get(id)||null,
  createElement(){return {id:'',style:{},dataset:{},parentNode:null,innerHTML:'',querySelectorAll(){return [];},insertAdjacentElement(){},remove(){}};}
};

let restored=null;
const baseState={runtime:{confirmedEpisode:3,scenes:[{episode:3}]}};
const window={
  buildPrompt:()=> 'BASE',
  __VELOUR_V4_STATE_SNAPSHOT__:()=>JSON.parse(JSON.stringify(baseState)),
  __VELOUR_V4_STATE_RESTORE__:s=>{restored=s;},
  __VELOUR_IDB_PATCH_DRAFT_V4__:async()=>{},
  __VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__:ensembleQA
};
const context={window,document,localStorage,console,setInterval(fn){fn();return 1;},clearInterval(){},setTimeout(fn){fn();return 1;},clearTimeout(){}};
context.globalThis=context;
vm.runInNewContext(source,context,{filename:'velour-v4.4.38-intimacy-preference-depth.js'});

assert.equal(window.__VELOUR_INTIMACY_PREFERENCE_DEPTH_VERSION__,'1.0.1');
const qa=window.__VELOUR_INTIMACY_PREFERENCE_DEPTH_QA__;
assert.ok(qa);
assert.equal(qa.STYLE_CATALOG.length,19);
assert.equal(qa.STIM_CATALOG.length,24);

const cfg=qa.loadCfg();
const hp=qa.getProfile(heroine,cfg),pp=qa.getProfile(partner,cfg);
assert.equal(hp.styleModes.sadistic_light,'priority');
assert.equal(pp.styleModes.masochistic_light,'priority');
assert.equal(hp.stimModes.adult_lactation,'off');

const stim=qa.mutualStimCandidates(heroine,partner,cfg,30,baseState);
assert.ok(stim.some(x=>x.id==='ear_neck'));
assert.ok(stim.some(x=>x.id==='nipple_bite_light'));
assert.ok(stim.some(x=>x.id==='prostate'));
assert.ok(!stim.some(x=>x.id==='adult_lactation'),'one-side OFF must exclude mutual act');
assert.ok(!stim.some(x=>x.id==='anal_oral'),'one-side OFF must exclude mutual act');

const compat=qa.styleCompatibility(heroine,partner,cfg);
assert.ok(compat.complements.some(x=>x.title==='주도/맡김'));
assert.ok(compat.complements.some(x=>x.title==='가벼운 S/M'));
assert.ok(compat.shared.some(x=>x.id==='adventure_setting'));
assert.ok(!compat.shared.some(x=>x.id==='exposure_fantasy'),'allowed-only context must not auto-activate');

const neutral=qa.normalizeCfg({});
const neutralStim=qa.mutualStimCandidates(heroine,partner,neutral,30,baseState);
assert.equal(neutralStim.length,0,'neutral defaults must not auto-activate detailed play candidates');
const neutralCompat=qa.styleCompatibility(heroine,partner,neutral);
assert.equal(neutralCompat.complements.length,0,'neutral defaults must not auto-activate S/M or control complements');
assert.equal(neutralCompat.shared.length,0,'neutral defaults must not auto-activate setting/exposure preferences');

const sigBefore=qa.characterSignature(ensembleCfg);
ensembleCfg.mode='one_to_many';
ensembleCfg.partners.push({id:'p2',name:'태현'});
const sigAfter=qa.characterSignature(ensembleCfg);
assert.notEqual(sigBefore,sigAfter,'dynamic partner changes must invalidate the depth UI signature');
ensembleCfg.partners.pop();
ensembleCfg.mode='one_to_one';

const prompt=window.buildPrompt();
assert.match(prompt,/INTIMACY PREFERENCE DEPTH V1/);
assert.match(prompt,/가벼운 S\/M/);
assert.match(prompt,/허용은 금지가 아니라 가능 범위일 뿐 자동 추천 신호가 아니다/);
assert.match(prompt,/임신·출산·수유 상태를 임의로 만들어내지 않는다/);
assert.match(prompt,/전립선·항문·회음부/);
assert.match(prompt,/이 블록은 성인 캐릭터의 합의된 취향 프로필/);

const snapshot=window.__VELOUR_V4_STATE_SNAPSHOT__();
assert.ok(snapshot.intimacyDepthPreferences);
assert.equal(snapshot.intimacyDepthPreferences.profiles.heroine.styleModes.sadistic_light,'priority');
window.__VELOUR_V4_STATE_RESTORE__({intimacyDepthPreferences:initial});
assert.ok(restored);

assert.equal(qa.cycleMode('allowed'),'priority');
assert.equal(qa.cycleMode('priority'),'off');
assert.equal(qa.cycleMode('off'),'allowed');

const ensembleIndex=loader.indexOf('__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_LOADER__');
const depthIndex=loader.indexOf('__VELOUR_INTIMACY_PREFERENCE_DEPTH_LOADER__');
const liveCanonIndex=loader.indexOf('__VELOUR_LIVE_CANON_SCENE_GOVERNOR_LOADER__');
assert.ok(ensembleIndex>0&&depthIndex>ensembleIndex&&liveCanonIndex>depthIndex,'depth engine must run after ensemble but before final HARD CANON governor');
assert.match(loader,/intimacy-preference-depth\.js\?v=2/);

console.log('PASS: intimacy depth requires active priorities, syncs dynamic partners, preserves mutual OFF rules, privacy guards, persistence, and final canon order');