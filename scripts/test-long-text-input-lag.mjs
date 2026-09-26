#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const core=readFileSync('velour-v4.4.38.js','utf8');
const index=readFileSync('index.html','utf8');
const canonical=readFileSync('scripts/build-github-pages-canonical.mjs','utf8');
assert.match(core,/let longTextSaveTimer=0/);
assert.match(core,/setTimeout\(\(\)=>\{ longTextSaveTimer=0; save\(state\); \},450\)/);
const inputLine=(core.match(/el\.addEventListener\('input',\(\)=>\{ state\[key\]=el\.value;[^\n]*/)||[])[0]||'';
assert.match(inputLine,/scheduleLongTextSave\(\)/);
assert.doesNotMatch(inputLine,/save\(state\)|syncUI\(/);
assert.match(core,/el\.addEventListener\('change',\(\)=>\{ state\[key\]=el\.value; flushLongTextSave\(\); syncUI\(false\); \}\)/);
assert.match(index,/velour-v4\.4\.38\.js\?v=443708/);
assert.match(canonical,/velour-v4\.4\.38\.js\?v=443708/);
console.log('PASS: long textarea edits avoid synchronous save/UI work per keystroke');
