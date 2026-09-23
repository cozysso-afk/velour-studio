#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('velour-v4.4.38-contextual-dialogue-engine.js', 'utf8');

assert.match(source, /CONTEXTUAL DIALOGUE ENGINE V1/);
assert.match(source, /stripLegacyDialogueDirectives/);
assert.match(source, /dialogueMemory/);
assert.match(source, /preferredFunctions/);
assert.match(source, /상대가 방금 한 말·표정·행동/);

const legacyPrompt = `BASE
[BODY PRAISE TALK — legacy]
- legacy body rule
[CONDITIONAL CANON — keep]
- KEEP_CANON_RULE
[DIALOGUE FUNCTION ROTATION — legacy]
- legacy dialogue rule
[INTIMATE SCENE ANTI-REPETITION LOCK — keep scene variety]
- KEEP_LOCATION_RULE
- 더티톡은 문장만 조금 바꾼 절정/사정 예고를 반복하지 않는다. 특히 '갈 것 같아', '나한테 싸', '싸줘/싸도 돼' 같은 문구는 기본값이 아니다.
- 대사는 절정 예고 대신 다른 기능을 선택할 수 있다.`;

const storyHistory = [
  '“무슨 생각 해?”',
  '“오늘은 왜 조용해?”',
  '“지금 무슨 생각인데?”',
  '“진짜 그렇게 생각해?”',
  '“그럼 넌 어떻게 하고 싶은데?”',
  '“아까부터 자꾸 웃네.”'
].join('\n');

const elements = {
  selectStage: { value: '[빌드업 & 감정선 중심] 긴장과 심리전' },
  v33Next: { value: '' }
};

const context = {
  storyHistory,
  console,
  Date,
  setInterval,
  clearInterval,
  document: {
    getElementById(id){ return elements[id] || null; }
  },
  window: {
    __VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__: true,
    __VELOUR_V4_STATE_SNAPSHOT__: () => ({
      dirtyTalk: 70,
      dirtyTalkFrequency: 70,
      bodyPraiseDirtyTalk: 'high',
      runtime: { confirmedEpisode: 7 }
    }),
    buildPrompt: () => legacyPrompt
  }
};
context.globalThis = context;

vm.runInNewContext(source, context, { filename: 'velour-v4.4.38-contextual-dialogue-engine.js' });

assert.equal(context.window.__VELOUR_CONTEXTUAL_DIALOGUE_VERSION__, '1.0.0');
assert.ok(context.window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__);

const output = context.window.buildPrompt(false);
assert.match(output, /CONTEXTUAL DIALOGUE ENGINE V1/);
assert.match(output, /KEEP_CANON_RULE/);
assert.match(output, /KEEP_LOCATION_RULE/);
assert.doesNotMatch(output, /DIALOGUE FUNCTION ROTATION/);
assert.doesNotMatch(output, /BODY PRAISE TALK/);
assert.doesNotMatch(output, /나한테 싸|싸줘\/싸도 돼|갈 것 같아/);

const qa = context.window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__;
assert.equal(qa.sceneMode(), 'buildup');
assert.equal(qa.classifyDialogue('무슨 생각 해?'), 'question');
assert.equal(qa.classifyDialogue('천천히 해. 괜찮아?'), 'coordination');
assert.equal(qa.classifyDialogue('보고 싶었어.'), 'emotion');

const memory = context.window.__VELOUR_LAST_DIALOGUE_MEMORY__;
assert.ok(memory.total >= 6);
assert.ok(memory.overused.includes('question'));

console.log('PASS: contextual dialogue engine strips legacy overlap and rotates recent dialogue functions');
