import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = readFileSync('velour-v4.4.38.js','utf8');
assert.match(base,/dirtyTalk:70, dirtyTalkFrequency:70/);
assert.match(base,/id="v4DirtyFrequency"/);
assert.match(base,/v4DirtyFrequency:'dirtyTalkFrequency'/);
assert.match(base,/v4DirtyFrequencyVal/);

const voice = readFileSync('velour-v4.4.38-continuity-voice-guard.js','utf8');
assert.match(voice,/dirtyTalkFrequency \?\? 70/);
assert.match(voice,/더티톡 빈도=\$\{frequency\}\/100/);
assert.match(voice,/강도는 등장 횟수를 뜻하지 않는다/);
assert.match(voice,/빈도가 높아도 같은 기능군을 늘려 채우지 않는다/);
assert.match(voice,/감각 보고와 절정\/사정 예고.*기본값이 아니다/);

const quality = readFileSync('velour-v4.4.38-quality-restore.js','utf8');
assert.match(quality,/dirtyTalkFrequency \?\? 70/);
assert.match(quality,/강도는 직접성, 빈도는 등장 성향/);

const body = readFileSync('velour-v4.4.38-continuity-vault-hotfix.js','utf8');
assert.match(body,/dirtyTalkFrequency \?\? 70/);
assert.match(body,/강도는 표현의 직접성, 빈도는 등장 성향/);
assert.doesNotMatch(body,/2~4회 정도 분산/);

const html = readFileSync('index.html','utf8');
assert.match(html,/velour-v4\.4\.38\.js\?v=443707/);
assert.match(html,/vault-accept-hotfix\.js\?v=17/);
assert.match(html,/continuity-voice-guard\.js\?v=5/);
const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');
assert.match(loader,/quality-restore\.js\?v=6/);
assert.match(loader,/continuity-vault-hotfix\.js\?v=6/);
console.log('PASS: dirty-talk intensity/frequency axes are separate and cached for GitHub Pages');
