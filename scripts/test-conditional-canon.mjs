import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let state = {hardCanon:'B는 몇 차례 촬영 후 매니저를 맡기로 함.', runtime:{}};
let direction = '';
const context = vm.createContext({console:{info(){}}, document:{getElementById:id => ({value:id === 'v33Next' ? direction : ''})}, setInterval(){throw new Error('Unexpected installation retry');}, clearInterval(){}});
context.window = context;
context.__VELOUR_V4_STATE_SNAPSHOT__ = () => structuredClone(state);
context.__VELOUR_V4_STATE_RESTORE__ = next => { state = structuredClone(next); };
context.__VELOUR_STORAGE_QA__ = {};
context.__VELOUR_SCENE_VOICE_MEMORY_HOTFIX__ = true;
context.buildPrompt = () => `[HARD CANON]\n${state.hardCanon}\n[CURRENT STEP] 촬영`;
context.generateStory = async () => {};
for (const file of ['continuity-hotfix','continuity-vault-hotfix','continuity-voice-guard','continuity-relation-grammar-hotfix','hard-canon-lock-hotfix']) {
  vm.runInContext(readFileSync(`velour-v4.4.38-${file}.js`,'utf8'), context);
}
const continuity = context.__VELOUR_CONTINUITY_QA__;
const voice = context.__VELOUR_CONTINUITY_VOICE_GUARD_QA__;
const grammar = context.__VELOUR_CONTINUITY_RELATION_GRAMMAR_QA__;
const pending = [
  'B는 몇 차례 촬영 후 매니저를 맡기로 함.',
  'B는 친해지면 연애를 시작함.',
  'B는 신뢰가 형성된 뒤 계약하기로 함.',
  'B는 5화부터 연인이 된다.',
  'B는 촬영을 마친 후 매니저가 되고 이후 연인이 된다.',
  'B will start a relationship after several meetings.'
];
for (const text of pending) {
  assert.equal(continuity.hasPendingCondition(text), true, text);
  assert.equal(continuity.settledCanonLines({hardCanon:text}).length, 0, text);
  assert.equal(continuity.isDurableUserClause(text), false, text);
  assert.equal(voice.isDurableTransitionClause(text), false, text);
  const before = JSON.stringify(state);
  continuity.promoteCommittedDirection(text, 2);
  voice.promoteDurableTransitions(text, 2);
  grammar.promoteIfMissed(text, 2);
  assert.equal(JSON.stringify(state), before, 'Pending directions must not mutate memory');
}
assert.equal(continuity.settledCanonLines({hardCanon:'B와 이미 계약하기로 합의함.'}).length, 1);
assert.equal(voice.isDurableTransitionClause('이번 화에서 B와 연애를 시작한다.'), true);

// Guard must survive first-episode semantics pruning and continuation selection.
for (const hardCanon of ['', pending[0], 'B와 이미 계약하기로 합의함.', 'A는 동료다.\nB는 몇 차례 촬영 후 매니저가 된다.']) {
  state = {hardCanon,runtime:{relationshipState:'A: 동료; B: 촬영 상대'}};
  for (const isContinue of [false,true]) {
    const before = JSON.stringify(state);
    const prompt = context.buildPrompt(isContinue);
    assert.equal(prompt.split('[CONDITIONAL CANON —').length - 1, 1);
    assert.match(prompt, /미래 계획·미충족 조건·잠재 성향을 완료 사실로 저장하지 않는다/);
    if (hardCanon) assert.ok(prompt.includes(hardCanon), 'Full HARD CANON must survive final prompt assembly');
    assert.equal(JSON.stringify(state), before);
  }
}
// All retained facts remain scoped to their original named parties.
state = {hardCanon:'',runtime:{durableFacts:[
  '[사용자 확정 지속 상태 · EP1] A와 연애를 시작한다.',
  '[사용자 확정 지속 상태 · EP1] A에게 존댓말을 쓴다.'
]}};
voice.promoteDurableTransitions('B와 연애를 시작한다. B에게 반말을 쓴다.',2);
assert.equal(state.runtime.durableFacts.length,4);
grammar.promoteIfMissed('C와 연인이 된다.',3);
assert.equal(state.runtime.durableFacts.length,5);
grammar.promoteIfMissed('C와 연인이 된다.',3);
assert.equal(state.runtime.durableFacts.length,5,'Duplicate transition must not accumulate');
voice.promoteDurableTransitions('B와 이별한다.',4);
assert.ok(state.runtime.durableFacts.some(f=>f.includes('A와 연애')));
assert.ok(state.runtime.durableFacts.some(f=>f.includes('C와 연인')));
assert.ok(state.runtime.durableFacts.at(-1).includes('B와 이별'));

state = {runtime:{durableFacts:['[사용자 확정 지속 상태 · EP1] A와 계약함.']}};
continuity.promoteCommittedDirection('B와 계약을 종료함.', 2);
assert.ok(state.runtime.durableFacts.some(f=>f.includes('A와 계약함')));
assert.ok(state.runtime.durableFacts.some(f=>f.includes('B와 계약을 종료함')));

for (const age of ['35세', '35 세', '35살', '만 35세', '35세이다']) {
  const hint = voice.addressCanon({hardCanon:`B: ${age}`,runtime:{}});
  assert.ok(hint.includes(`• B: ${age}`), age);
}

const html = readFileSync('index.html','utf8');
const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');
assert.match(html,/vault-accept-hotfix.js\?v=16/);
assert.match(loader,/continuity-hotfix.js\?v=3/);
assert.match(loader,/continuity-vault-hotfix.js\?v=5/);
assert.match(loader,/hard-canon-lock-hotfix.js\?v=1/);
console.log('PASS: pending conditions, first/continuation prompts, settled baseline, full hard canon, per-character facts, deduplication, cache URLs');
