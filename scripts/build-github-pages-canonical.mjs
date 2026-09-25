#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const LOADER_COMMIT = '72b2b96a875fa40e98c32228cd93f629f3b1298c';
const APP_COMMIT = '89a8931f8219fe9c3245cfbc0468932def227fe5';

function gitFile(commit, path) {
  return execFileSync('git', ['show', `${commit}:${path}`], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

function extractRawConstant(source, name) {
  const marker = `const ${name} = String.raw\``;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${name} in recovery loader`);
  const valueStart = start + marker.length;
  const valueEnd = source.indexOf('\`;\n', valueStart);
  if (valueEnd < 0) throw new Error(`Unterminated ${name} in recovery loader`);
  return source.slice(valueStart, valueEnd);
}

const recoveryLoader = gitFile(LOADER_COMMIT, 'index.html');
let app = gitFile(APP_COMMIT, 'index.html');

const libraryCss = extractRawConstant(recoveryLoader, 'FIX_CSS');
const libraryHtml = extractRawConstant(recoveryLoader, 'LIBRARY_HTML');
const libraryPatch = extractRawConstant(recoveryLoader, 'PATCH_JS');

const headAssets = `
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="VELOUR">
  <meta name="theme-color" content="#16070e">
  <link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon-velour-v2.png?v=1">
  <link rel="icon" type="image/png" href="./apple-touch-icon-velour-v2.png?v=1">
`;

const runtimeScripts = `
<script src="./velour-v3.5.js?v=3502"></script>
<script src="./velour-v4.4.38.js?v=443707"></script>
<script src="./velour-v4.4.38-vault-accept-hotfix.js?v=27"></script>
<script src="./velour-v4.4.38-state-isolation-hotfix.js?v=1"></script>
<script src="./velour-v4.4.38-state-isolation-reclaim-hotfix.js?v=1"></script>
<script src="./velour-v4.4.38-lock-ui-hotfix.js?v=4"></script>
<script src="./velour-v4.4.38-visual-theme-hotfix.js?v=4"></script>
<script src="./velour-v4.4.38-ui-consolidation-hotfix.js?v=1"></script>
<script src="./velour-v4.4.38-continuity-voice-guard.js?v=5"></script>
<script src="./velour-v4.4.38-continuity-relation-grammar-hotfix.js?v=3"></script>
`;

if (!app.includes('src="cover.PNG"')) {
  throw new Error('Canonical cover replacement marker is missing');
}
app = app.replace('src="cover.PNG"', 'src="./velour-cover-20260911.jpg?v=2"');

if (!app.includes('</head>')) throw new Error('Canonical head marker is missing');
app = app.replace('</head>', `${libraryCss}\n${headAssets}</head>`);

if (!app.includes('</body>')) throw new Error('Canonical body marker is missing');
app = app.replace(
  '</body>',
  `${libraryHtml}\n<script>\n${libraryPatch}\n</script>\n${runtimeScripts}</body>`,
);

const forbidden = [
  'raw.githubusercontent.com',
  'document.write(',
  'src="cover.PNG"',
];
for (const token of forbidden) {
  if (app.includes(token)) throw new Error(`Canonical output still contains ${token}`);
}

writeFileSync('index.html', app, 'utf8');
console.log('Built canonical GitHub Pages index.html');
