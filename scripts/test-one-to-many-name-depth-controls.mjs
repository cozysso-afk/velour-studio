#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('velour-v4.4.38-ui-hierarchy-v2.js','utf8');
const index=readFileSync('index.html','utf8');
const canonical=readFileSync('scripts/build-github-pages-canonical.mjs','utf8');
assert.match(ui,/const VERSION='1\.1\.2'/);
assert.match(ui,/function depthCardForCharacter\(/);
assert.match(ui,/cfg\?\.partners\?\.\[index\]/,'extra partners must map to stable ensemble character IDs');
assert.match(ui,/function proxyDepthSection\(/);
assert.match(ui,/original\.click\(\)/,'depth proxies must reuse original depth state listeners');
assert.match(ui,/proxyDepthSection\(depthCard,'style','성적 스타일'\)/);
assert.match(ui,/proxyDepthSection\(depthCard,'stim','자극 · 플레이'\)/);
assert.doesNotMatch(ui,/depthSectionsByIndex/,'depth source DOM must never be moved out of the hidden source tree');
assert.doesNotMatch(ui,/profile\?\.addEventListener\?\.\('input',[^\n]*schedule\(true\)/,'name typing must not force whole-shelf rebuilds');
assert.match(ui,/profile\?\.addEventListener\?\.\('change',[^\n]*schedule\(true\)/,'name commit may refresh summaries once');
assert.match(index,/velour-v4\.4\.38-ui-hierarchy-v2\.js\?v=4/);
assert.match(canonical,/velour-v4\.4\.38-ui-hierarchy-v2\.js\?v=4/);
console.log('PASS: 1:many names avoid per-keystroke shelf rebuilds and all partners receive live depth proxies');
