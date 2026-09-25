#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('velour-v4.4.38-authoring-experience-v1.js','utf8');
const loader = readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');
const index = readFileSync('index.html','utf8');
const canonical = readFileSync('scripts/build-github-pages-canonical.mjs','utf8');

assert.match(source,/const VERSION = '1\.0\.2'/);
assert.match(source,/인물별 설정 · 말투\/성격\/취향/);
assert.match(source,/직업\/외형\/현재 관계는 03 세부 설정을 사용하므로 반복 입력 불필요/);
assert.match(source,/document\.getElementById\('v33ProfileOn'\)/);
assert.match(source,/document\.querySelector\('#velourV33Panel \.v33-profile'\)/);
assert.match(source,/selectedText\('v4OccA'\)/);
assert.match(source,/selectedText\('v4OccB'\)/);
assert.match(source,/selectedText\('v4Relationship'\)/);
assert.match(source,/assign\(cfg\.heroine,'role',occB\)/);
assert.match(source,/assign\(cfg\.partners\[0\],'role',occA\)/);
assert.match(source,/role\.style\.display = 'none'/);
assert.match(source,/rel\.style\.display = 'none'/);

const groupIds = [...source.matchAll(/\{id:'(space|constraint|reveal|social|speculative|legacy)', label:/g)].map(m=>m[1]);
assert.deepEqual(groupIds,['space','constraint','reveal','social','speculative','legacy']);

const extras = [...source.matchAll(/\{id:'([^']+)', label:'[^']+', group:'(space|constraint|reveal|social|speculative)', desc:/g)].map(m=>({id:m[1],group:m[2]}));
assert.equal(extras.length,20,'expected 20 new crossover devices');
for (const group of ['space','constraint','reveal','social','speculative']) {
  assert.ok(extras.filter(x=>x.group===group).length>=4, `${group} needs at least four new devices`);
}

for (const id of ['thin_wall','sharehouse','jealousy','time_loop','body_swap','slow_domestic','one_night_after','vampire']) {
  assert.match(source,new RegExp(`${id}:'legacy'`),`${id} should be compatibility-only`);
}
assert.match(source,/x\.group !== 'legacy'/,'auto mix must exclude compatibility overlaps');
assert.match(source,/recentIds/);
assert.match(source,/recentGroups/);
assert.match(source,/stopImmediatePropagation\(\)/,'new auto mix must override old flat randomizer');
assert.match(source,/축 분산 자동 믹스/);
assert.match(source,/CROSSOVER DIVERSITY V1/);

const intimacyPos = loader.indexOf('__VELOUR_INTIMACY_PREFERENCE_DEPTH_LOADER__');
const authoringPos = loader.indexOf('__VELOUR_AUTHORING_EXPERIENCE_V1_LOADER__');
const canonPos = loader.indexOf('__VELOUR_LIVE_CANON_SCENE_GOVERNOR_LOADER__');
assert.ok(intimacyPos>=0 && authoringPos>intimacyPos && canonPos>authoringPos,'authoring layer must load after preference panels and before final live canon');
assert.match(loader,/velour-v4\.4\.38-authoring-experience-v1\.js\?v=3/);

assert.match(index,/velour-v4\.4\.38-vault-accept-hotfix\.js\?v=30/);
assert.match(canonical,/velour-v4\.4\.38-vault-accept-hotfix\.js\?v=30/);

console.log('PASS: authoring UI consolidation removes duplicate sources, groups crossovers by narrative axis, excludes legacy overlaps from auto-mix, and preserves final canon order');
