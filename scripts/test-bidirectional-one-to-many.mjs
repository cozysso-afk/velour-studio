#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ensembleSource=readFileSync('velour-v4.4.38-ensemble-character-preferences.js','utf8');
const authoringSource=readFileSync('velour-v4.4.38-authoring-experience-v1.js','utf8');
const coreSource=readFileSync('velour-v4.4.38.js','utf8');
const sceneAgencySource=readFileSync('velour-v4.4.38-scene-agency-hotfix.js','utf8');
const liveCanonSource=readFileSync('velour-v4.4.38-live-canon-scene-governor.js','utf8');

const store=new Map();
const localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))};
const elements=new Map([['v33Next',{value:'이번 화는 지수와 저녁 약속을 이어간다.'}]]);
const document={
  getElementById:id=>elements.get(id)||null,
  createElement(){return {style:{},dataset:{},remove(){},querySelectorAll(){return [];},addEventListener(){}};}
};
const baseState={sceneGovernor:{agencyIntensity:80,agencyFrequency:'high'},runtime:{confirmedEpisode:2,scenes:[{episode:2}]}};
const window={
  buildPrompt:()=> 'BASE PROMPT',
  __VELOUR_V4_STATE_SNAPSHOT__:()=>structuredClone(baseState),
  __VELOUR_V4_STATE_RESTORE__:()=>{},
  __VELOUR_IDB_PATCH_DRAFT_V4__:async()=>{}
};
const context={window,document,localStorage,console,setInterval(fn){fn();return 1;},clearInterval(){},setTimeout(fn){fn();return 1;},clearTimeout(){}};
context.globalThis=context;
vm.runInNewContext(ensembleSource,context,{filename:'velour-v4.4.38-ensemble-character-preferences.js'});

const qa=window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__;
assert.ok(qa);

const legacy=qa.normalizeCfg({
  mode:'one_to_many',
  heroine:{id:'heroine',name:'서윤',customNote:'기존 여주 설정'},
  partners:[{id:'p1',name:'도진',customNote:'기존 남주 설정'},{id:'p2',name:'태현'}]
});
assert.equal(legacy.protagonistGender,'female');
assert.equal(legacy.heroine.gender,'female');
assert.deepEqual(Array.from(legacy.partners,x=>x.gender),['male','male']);
assert.equal(legacy.heroine.customNote,'기존 여주 설정','legacy protagonist data must survive migration');
assert.equal(legacy.partners[0].customNote,'기존 남주 설정','legacy partner data must survive migration');

const harem=qa.normalizeCfg({
  mode:'one_to_many',protagonistGender:'male',
  heroine:{id:'heroine',name:'민준',role:'대표',relationshipNote:'각 상대와 별도 관계',speechPreset:'terse_dry'},
  partners:[
    {id:'f1',name:'지수',role:'비서',relationshipNote:'오랜 동료',speechPreset:'polite_formal'},
    {id:'f2',name:'하린',role:'변호사',relationshipNote:'계약 자문',speechPreset:'witty_teasing'}
  ]
});
assert.equal(harem.mode,'one_to_many');
assert.equal(harem.protagonistGender,'male');
assert.equal(harem.heroine.gender,'male');
assert.deepEqual(Array.from(harem.partners,x=>x.gender),['female','female']);
assert.equal(qa.activePartners(harem).length,2);
assert.equal(qa.focusPartner(harem,baseState).name,'지수');

const prompt=qa.directive(baseState,harem);
assert.match(prompt,/1:다 · 남주 1명과 여러 여성 상대 캐릭터/);
assert.match(prompt,/남주 민준: 성별=남성 \/ 대명사=그/);
assert.match(prompt,/여주 상대 지수: 성별=여성 \/ 대명사=그녀/);
assert.match(prompt,/여주 상대 하린: 성별=여성 \/ 대명사=그녀/);
assert.match(prompt,/각 상대의 이름·말투·관계메모·지식·감정 상태를 해당 edge에 묶고 다른 상대에게 전이하지 않는다/);
assert.match(prompt,/남주 적극성 강도\/빈도는 기존 SCENE AGENCY 설정만 사용/);

const switched=qa.applyGenderDefaults(qa.normalizeCfg({
  mode:'one_to_many',protagonistGender:'female',
  heroine:{name:'여주'},partners:[{name:'남주 1'},{name:'남주 2'}]
}),'male');
assert.equal(switched.heroine.name,'남주');
assert.deepEqual(Array.from(switched.partners,x=>x.name),['여주 1','여주 2']);
assert.equal(switched.heroine.gender,'male');
assert.ok(switched.partners.every(x=>x.gender==='female'));

const customNames=qa.applyGenderDefaults(harem,'female');
assert.equal(customNames.heroine.name,'민준','user names must not be rewritten when gender changes');
assert.deepEqual(Array.from(customNames.partners,x=>x.name),['지수','하린']);

assert.match(ensembleSource,/id="vcpProtagonistGender"/);
assert.match(ensembleSource,/여주 · 상대는 남성/);
assert.match(ensembleSource,/남주 · 상대는 여성/);
assert.match(ensembleSource,/baseCharacter\('partner',next\.partners\.length,next\.protagonistGender\)/);
assert.match(authoringSource,/maleLead \? occA : occB/,'male protagonist must receive occupation A');
assert.match(authoringSource,/maleLead \? occB : occA/,'female partners must receive occupation B');
assert.match(coreSource,/\['harem','하렘 · 한 남주 × 복수의 성인 여주 후보'\]/);
assert.match(coreSource,/ensemble\.protagonistGender==='male'/);
assert.match(coreSource,/하렘: 한 성인 남성 주인공과 복수의 성인 여성 후보 관계/);
assert.match(sceneAgencySource,/const cfg=window\.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__/);
assert.match(liveCanonSource,/protagonistGender==='male'\?'남주':'여주'/);

console.log('PASS: legacy reverse-harem data remains compatible and male-protagonist harem mode preserves independent female partner profiles, labels, and prompt roles');
