#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync('velour-v4.4.38-narrative-variation-v2.js','utf8');
const elements=new Map([
  ['inputChars',{value:'서진과 하윤'}],['v33Next',{value:''}]
]);
const window={buildPrompt:()=> 'BASE',__VELOUR_V4_STATE_SNAPSHOT__:()=>({world:'modern',relationship:'friends',runtime:{confirmedEpisode:4,scenes:[]}})};
const context={window,document:{getElementById:id=>elements.get(id)||null},console,setTimeout,clearTimeout};context.globalThis=context;
vm.runInNewContext(source,context,{filename:'narrative'});
assert.equal(window.__VELOUR_NARRATIVE_VARIATION_V2_VERSION__,'1.0.0');
const qa=window.__VELOUR_NARRATIVE_VARIATION_V2_QA__;assert.ok(qa);
assert.ok(qa.STRUCTURES.length>=10);assert.ok(qa.CONVERSATIONS.length>=10);assert.ok(qa.ENDINGS.length>=8);
const p5=qa.plan(window.__VELOUR_V4_STATE_SNAPSHOT__());
const p6=qa.plan({...window.__VELOUR_V4_STATE_SNAPSHOT__(),runtime:{confirmedEpisode:5,scenes:[]}});
assert.notEqual(p5.structure[0],p6.structure[0],'consecutive episodes should rotate macro structure');
const prompt=window.buildPrompt(false);
assert.match(prompt,/CAUSAL BUILDUP.*인과관계 검사/);
assert.match(prompt,/모든 화를 ‘일상 시작/);
assert.match(prompt,/Scene Governor는 장소\/상황 후보/);
assert.match(prompt,/Contextual Dialogue는 개별 대사의 기능/);
assert.match(prompt,/Verbal Chemistry는 말하는 태도·전략/);
console.log('PASS: narrative governor rotates episode macro structure and separates dialogue/scene authorities');
