#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui=readFileSync('velour-v4.4.38-ui-hierarchy-v2.js','utf8');
const index=readFileSync('index.html','utf8');
const canonical=readFileSync('scripts/build-github-pages-canonical.mjs','utf8');

assert.match(ui,/const VERSION='1\.0\.0'/);
assert.match(ui,/velourCharacterProfileHub/);
assert.match(ui,/인물 설정 · 성격\/말투\/적극성/);
assert.match(ui,/velourIntimacyPreferenceHub/);
assert.match(ui,/친밀 취향 · 캐릭터별 선호/);
assert.match(ui,/document\.getElementById\('velourSceneGovernorV1'\)/);
assert.match(ui,/document\.getElementById\('velourEnsemblePrefsV1'\)/);
assert.match(ui,/document\.getElementById\('velourIntimacyDepthV1'\)/);
assert.match(ui,/velour-v2-pref-source/);
assert.match(ui,/original\.click\(\)/,'preference proxies must reuse original state listeners');
assert.match(ui,/document\.getElementById\('v41SecLanguage'\)/);
assert.match(ui,/velourVerbalChemistryPanel/);
assert.match(ui,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(ui,/#velourIntimacyDepthV1\{display:none!important\}/);
assert.doesNotMatch(ui,/window\.buildPrompt\s*=/,'UI hierarchy layer must not wrap prompt generation');
assert.doesNotMatch(ui,/buildPrompt=function/,'UI hierarchy layer must remain presentation-only');

assert.match(index,/velour-v4\.4\.38-vault-accept-hotfix\.js\?v=30/);
assert.match(canonical,/velour-v4\.4\.38-vault-accept-hotfix\.js\?v=30/);
assert.match(index,/velour-v4\.4\.38-ui-hierarchy-v2\.js\?v=1/);
assert.match(canonical,/velour-v4\.4\.38-ui-hierarchy-v2\.js\?v=1/);
console.log('PASS: UI hierarchy separates character, intimacy, and writing-style controls without changing prompt/state logic');
