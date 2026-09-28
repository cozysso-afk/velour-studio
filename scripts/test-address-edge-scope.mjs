#!/usr/bin/env node
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
