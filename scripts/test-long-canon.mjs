import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});ctx.window=ctx;
vm.runInContext(readFileSync('velour-canon-index.js','utf8'),ctx);
const api=ctx.__VELOUR_CANON_INDEX__;
const raw=[
 'A:', 'A는 35세. A는 여주에게 존댓말.',
 ...Array.from({length:52},(_,i)=>`A의 과거 일화 ${i}: 자료보관소 ${i}에서 낡은 사진첩을 펼친 경험.`),
 'B:', 'B는 여주에게 반말.',
 'C:', 'C는 현재 사진작가다.', 'C는 여주에게 항상 존댓말을 쓴다.',
 'C는 몇 차례 촬영 후 매니저 역할을 맡게 된다.',
 '취향: 푸른색과 조용한 음악을 선호한다.',
 'D:', 'D는 절대로 여주를 누나라고 부르지 않는다.',
 '공통:', '이 세계에서 기억의 임의 삭제는 절대 금지다.'
].join('\n');
const state={hardCanon:raw,storyline:'1. C와 첫 촬영\n2. 신뢰 형성\n3. C가 매니저로 전환',beatIndex:0,runtime:{relationshipState:'A: 친구; B: 동료; C: 촬영 상대; D: 동료'}};
const result=api.retrieve(state,{direction:'C와 여주가 촬영한다.'});
assert.ok(api.index(raw).fragments.length>60);
assert.deepEqual([...result.active],['C']);
for(const needle of ['C는 현재 사진작가다.','C는 여주에게 항상 존댓말','D는 절대로','기억의 임의 삭제'])assert.ok(api.render(result).includes(needle),needle);
const future=result.selected.find(f=>f.text.includes('매니저 역할'));
assert.equal(future.future,true);assert.equal(future.type,'conditional/future');
assert.match(future.rendered,/미래\/조건부 · 미성립 · 실행 금지/);
assert.deepEqual([...future.owners],['C']);
const preference=result.selected.find(f=>f.text.includes('푸른색'));
assert.deepEqual([...preference.owners],['C']);assert.equal(preference.tier,'B');
const voices=api.voiceHints(state,'C 촬영');
assert.ok(voices.some(x=>x.includes('C는 여주에게 항상 존댓말')));
assert.ok(!voices.some(x=>x.includes('B는 여주에게 반말')));
assert.ok(!voices.some(x=>x.includes('A는 여주에게 존댓말')));
assert.equal(state.hardCanon,raw);
const before=api.builds;api.retrieve(state,{direction:'B와 대화'});assert.equal(api.builds,before);
assert.ok(api.retrieve(state,{direction:'B와 대화'}).selected.some(f=>f.text==='B는 여주에게 반말.' && f.active));
api.index(raw+'\n마지막 설정');assert.equal(api.builds,before+1);
// Large canon: ranking considers the tail; unrelated early text is not injected.
const huge=Array.from({length:1000},(_,i)=>`공간${i}의 기록: ${'책과 종이와 기록물. '.repeat(4)}`).join('\n')+'\nC:\nC는 현재 사진작가다.\nC는 말버릇으로 질문을 되묻는다.\nC는 신뢰가 쌓인 후 매니저가 된다.\nD:\nD는 절대로 여주를 누나라고 부르지 않는다.';
assert.ok(huge.length>10000);
const hugeResult=api.retrieve({...state,hardCanon:huge});
assert.ok(api.render(hugeResult).includes('C는 말버릇으로 질문을 되묻는다.'));
assert.ok(api.render(hugeResult).includes('D는 절대로'));
assert.ok(hugeResult.omitted>900);
assert.ok(hugeResult.chars<api.TARGET_CHARS);
assert.ok(!api.render(hugeResult).includes(huge));
// Absolute rules are not gated by accidental Korean "if" morphology.
assert.equal(api.index('A의 이름은 바뀌면 안 됨.').fragments[0].future,false);
// Different owners and negations must never be semantically collapsed.
const scoped='A:\n여주에게 존댓말.\nB:\n여주에게 반말.\nC:\n여주에게 존댓말.\n여주에게 존댓말.';
const isolated=api.index(scoped).fragments.filter(f=>!f.header);
assert.equal(isolated.length,3);
assert.deepEqual(Array.from(isolated,f=>[...f.owners]),[['A'],['B'],['C']]);
// Over-budget mandatory facts fail visibly, rather than silently lose rules.
const over='A:\n'+Array.from({length:1500},(_,i)=>`A의 고정 규칙 ${i}: ${'기억을 임의로 변경하지 않는다. '.repeat(3)}`).join('\n');
assert.throws(()=>api.retrieve({hardCanon:over}),e=>e.code==='CANON_BUDGET_EXCEEDED');
// Korean names and optional particles retain ownership.
const korean=api.retrieve({hardCanon:'민준:\n민준은 35세.\n민준은 여주에게 존댓말.\n도윤:\n도윤은 25살.\n도윤은 여주에게 반말.',runtime:{}},{direction:'도윤과 촬영한다'});
assert.deepEqual([...korean.active],['도윤']);
assert.ok(korean.selected.some(f=>f.active&&f.text.includes('도윤은 여주에게 반말')));
console.log('PASS: full index, late rules, active ownership, Korean names, voice scope, future tags, exact dedup, cache, ranked budget/overflow');
