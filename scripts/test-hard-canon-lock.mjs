import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const hardCanon = [
  '두 사람은 같은 아파트의 바로 옆집에 산다.',
  '현재는 방학 중이라 둘 다 시간 여유가 많다.'
].join('\n');

let state = {
  world: 'campus',
  hardCanon,
  runtime: { confirmedEpisode: 3 }
};

const context = vm.createContext({
  console: { info(){}, error(){ } },
  Date,
  document: { getElementById(){ return null; } }
});
context.window = context;
context.__VELOUR_V44_INSTALLED__ = true;
context.__VELOUR_V4_STATE_SNAPSHOT__ = () => structuredClone(state);
context.buildPrompt = () => `초기 프롬프트
- 배경 세계관: 현대 일상 & 캠퍼스 (과외/대학 연구실/자취방)

[이번 화 관련 HARD CANON · 내부 제약]
- 이번 장면과 직접 관련된 다른 설정만 남음
- 위 항목은 사실관계 검증용이다.

[HARD CANON 원문은 내부 검증 기준으로 유지됨 · 이번 화 직접 관련 항목 없음]

[CURRENT SCENE]
두 사람은 카페에서 만난다.`;

vm.runInContext(readFileSync('velour-v4.4.38-hard-canon-lock-hotfix.js', 'utf8'), context);

const prompt = context.buildPrompt(true);
assert.match(prompt, /두 사람은 같은 아파트의 바로 옆집에 산다\./);
assert.match(prompt, /현재는 방학 중이라 둘 다 시간 여유가 많다\./);
assert.doesNotMatch(prompt, /^\s*-\s*배경 세계관:/m);
assert.match(prompt, /거주 사실은 장면 장소와 별개다/);
assert.match(prompt, /현재 시간·학사 상태도 별도 확정 사실이다/);
assert.match(prompt, /캠퍼스.*자취방.*배경 후보/);
assert.match(prompt, /관련성 점수 때문에 삭제·약화·추정 교체하지 않는다/);

const lock = context.__VELOUR_LAST_HARD_CANON_LOCK__;
assert.equal(lock.hardCanonChars, hardCanon.length);
assert.equal(lock.fullCanonAlreadyPresent, false);
assert.equal(lock.legacyWorldRemoved, true);

// If the full canon is already present, the final lock must not duplicate its raw text.
const qa = context.__VELOUR_HARD_CANON_LOCK_QA__;
const already = `HEAD\n${hardCanon}\nTAIL`;
const stripped = qa.stripLegacyBroadPreset(already, state);
assert.equal((stripped.match(/두 사람은 같은 아파트의 바로 옆집에 산다\./g) || []).length, 1);

const owner = readFileSync('velour-v4.4.38-continuity-vault-hotfix.js', 'utf8');
assert.doesNotMatch(owner, /split\(hard\)\.join\(/, 'Owner must not replace full HARD CANON with a relevance sample');
assert.match(owner, /mode:\s*'full-hard-canon'/);
assert.match(owner, /방학을 개강으로 바꾸지 않는다/);

const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js', 'utf8');
assert.match(loader, /continuity-vault-hotfix\.js\?v=6/);
assert.match(loader, /hard-canon-lock-hotfix\.js\?v=1/);

const build = readFileSync('scripts/build-github-pages-canonical.mjs', 'utf8');
assert.match(build, /vault-accept-hotfix\.js\?v=17/);

console.log('PASS: owner no longer prunes HARD CANON; full canon survives prompt assembly; legacy campus\/자취방 cannot override residence or vacation state');
