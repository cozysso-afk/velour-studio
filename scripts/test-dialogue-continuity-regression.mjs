import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const continuity = readFileSync('velour-v4.4.38-continuity-hotfix.js','utf8');
assert.match(continuity, /최근 확정 관계\/타임라인\/인과 연결고리 > 기타 장기 사실 > 과거 아크 요약/);
assert.match(continuity, /ARCHIVED ARC는 과거 기록 참고용이며 현재 상태의 권위가 아니다/);
assert.match(continuity, /과거 시점으로 시간축을 되감지 않는다/);

const voice = readFileSync('velour-v4.4.38-continuity-voice-guard.js','utf8');
assert.match(voice, /직접성·노골성의 상한/);
assert.match(voice, /강도는 등장 횟수를 뜻하지 않는다/);
assert.match(voice, /몸\/외형 반응, 욕망 표현, 도발·놀림, 요구·질문/);
assert.match(voice, /감각 보고와 절정\/사정 예고.*기본값이 아니다/);
assert.match(voice, /문장 표면이 달라도 목적이 같으면 반복/);

const body = readFileSync('velour-v4.4.38-continuity-vault-hotfix.js','utf8');
assert.doesNotMatch(body, /2~4회 정도 분산/);
assert.match(body, /높은 우선순위 후보로 사용하되 장면마다 횟수를 의무 할당하지 않는다/);

const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');
assert.match(loader,/continuity-hotfix\.js\?v=3/);
assert.match(loader,/continuity-vault-hotfix\.js\?v=6/);
const html = readFileSync('index.html','utf8');
assert.match(html,/vault-accept-hotfix\.js\?v=17/);
assert.match(html,/continuity-voice-guard\.js\?v=5/);
console.log('PASS: dialogue function rotation + recent-state authority over archived arcs');
