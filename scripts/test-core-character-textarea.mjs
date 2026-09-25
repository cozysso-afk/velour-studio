#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const index=readFileSync('index.html','utf8');
const authoring=readFileSync('velour-v4.4.38-authoring-experience-v1.js','utf8');
const loader=readFileSync('velour-v4.4.38-vault-accept-hotfix.js','utf8');
const canonical=readFileSync('scripts/build-github-pages-canonical.mjs','utf8');
assert.match(index,/<textarea id="inputChars" rows="5" wrap="soft"[^>]*><\/textarea>/);
assert.doesNotMatch(index,/<input[^>]+id="inputChars"/);
assert.match(authoring,/const VERSION = '1\.0\.2'/);
assert.match(authoring,/function setupCoreCharacterTextarea\(\)/);
assert.match(authoring,/input\.addEventListener\('input', autoGrow\)/);
assert.match(authoring,/min-height:112px/);
assert.match(loader,/authoring-experience-v1\.js\?v=3/);
assert.match(index,/vault-accept-hotfix\.js\?v=31/);
assert.match(canonical,/vault-accept-hotfix\.js\?v=31/);
console.log('PASS: core character memo is multiline and auto-grows on mobile');
