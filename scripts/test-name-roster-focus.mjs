#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui=readFileSync('velour-v4.4.38-ui-hierarchy-v2.js','utf8');
const index=readFileSync('index.html','utf8');
const canonical=readFileSync('scripts/build-github-pages-canonical.mjs','utf8');
assert.match(ui,/const VERSION='1\.1\.1'/);
assert.match(ui,/roster&&roster\.contains\(document\.activeElement\)/);
const rawInputLine=(ui.match(/input\.addEventListener\('input'[^\n]*/)||[])[0]||'';
assert.match(rawInputLine,/syncValue\('input'\)/);
assert.doesNotMatch(rawInputLine,/syncSummary|schedule\(true\)/);
assert.match(ui,/input\.addEventListener\('change',[^\n]*syncSummary\(\)[^\n]*schedule\(true\)/);
assert.match(index,/ui-hierarchy-v2\.js\?v=3/);
assert.match(canonical,/ui-hierarchy-v2\.js\?v=3/);
console.log('PASS: name roster preserves focus while typing');
