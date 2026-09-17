from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def req(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing marker: {label}')
    return text.replace(old, new, 1)

# Base state + UI + save binding.
p = 'velour-v4.4.38.js'
s = read(p)
s = req(s, "dirtyTalk:70, profanity:20, insultMode:'off',", "dirtyTalk:70, dirtyTalkFrequency:70, profanity:20, insultMode:'off',", 'default dirty frequency')
s = req(
    s,
    '<div class="v40-field"><label>더티톡 강도</label><div class="v40-slider"><input id="v4Dirty" type="range" min="0" max="100" value="${Number(state.dirtyTalk||0)}"><span class="v40-value" id="v4DirtyVal"></span></div></div>\n          <div class="v40-field"><label>욕설 강도</label><div class="v40-slider"><input id="v4Profanity" type="range" min="0" max="100" value="${Number(state.profanity||0)}"><span class="v40-value" id="v4ProfanityVal"></span></div></div>',
    '<div class="v40-field"><label>더티톡 강도</label><div class="v40-slider"><input id="v4Dirty" type="range" min="0" max="100" value="${Number(state.dirtyTalk||0)}"><span class="v40-value" id="v4DirtyVal"></span></div></div>\n          <div class="v40-field"><label>더티톡 빈도</label><div class="v40-slider"><input id="v4DirtyFrequency" type="range" min="0" max="100" value="${Number(state.dirtyTalkFrequency ?? 70)}"><span class="v40-value" id="v4DirtyFrequencyVal"></span></div></div>\n          <div class="v40-field"><label>욕설 강도</label><div class="v40-slider"><input id="v4Profanity" type="range" min="0" max="100" value="${Number(state.profanity||0)}"><span class="v40-value" id="v4ProfanityVal"></span></div></div>',
    'dirty talk UI'
)
s = req(s, "v4Dirty:'dirtyTalk',v4Profanity:'profanity'", "v4Dirty:'dirtyTalk',v4DirtyFrequency:'dirtyTalkFrequency',v4Profanity:'profanity'", 'dirty talk save map')
s = req(
    s,
    "const d=p.querySelector('#v4DirtyVal'); if(d)d.textContent=String(state.dirtyTalk);\n    const pr=p.querySelector('#v4ProfanityVal');",
    "const d=p.querySelector('#v4DirtyVal'); if(d)d.textContent=String(state.dirtyTalk);\n    const df=p.querySelector('#v4DirtyFrequencyVal'); if(df)df.textContent=String(state.dirtyTalkFrequency ?? 70);\n    const pr=p.querySelector('#v4ProfanityVal');",
    'dirty frequency value display'
)
write(p, s)

# UI consolidation must wait for the new control too.
p = 'velour-v4.4.38-ui-consolidation-hotfix.js'
s = read(p)
s = req(s, "'v4Pacing', 'selectIntensity', 'v4Dirty', 'v4Profanity'", "'v4Pacing', 'selectIntensity', 'v4Dirty', 'v4DirtyFrequency', 'v4Profanity'", 'ui ready controls')
write(p, s)

# Voice guard: intensity and frequency are truly separate axes.
p = 'velour-v4.4.38-continuity-voice-guard.js'
s = read(p)
s = req(s, "const VERSION = '1.1.0';", "const VERSION = '1.2.0';", 'voice version')
s = req(
    s,
    "const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));\n    const praise = String(state?.bodyPraiseDirtyTalk || 'high').toLowerCase();",
    "const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));\n    const frequency = Math.max(0, Math.min(100, Number(state?.dirtyTalkFrequency ?? 70)));\n    const praise = String(state?.bodyPraiseDirtyTalk || 'high').toLowerCase();",
    'voice frequency const'
)
s = req(
    s,
    '- 더티톡 강도=${dirty}/100은 대사가 등장했을 때 허용되는 직접성·노골성의 상한이다. 친밀 장면마다 더티톡을 넣으라는 빈도 지시가 아니며, 강도가 높아도 매 씬·매 문단에 반복하지 않는다.\n- 더티톡의 기능을 하나로 취급하지 않는다.',
    '- 더티톡 강도=${dirty}/100은 대사가 등장했을 때 허용되는 직접성·노골성의 상한이다. 강도는 등장 횟수를 뜻하지 않는다.\n- 더티톡 빈도=${frequency}/100은 친밀 장면에서 더티톡을 선택할 가능성과 밀도 성향이다. 0에 가까우면 매우 드물게, 50 전후면 필요할 때 자연스럽게, 70 이상이면 적극적으로 사용한다. 단, 정확한 대사 개수를 할당하지 말고 장면 리듬과 캐릭터 대화에 맞춰 분산한다.\n- 빈도가 높아도 같은 기능군을 늘려 채우지 않는다. 더티톡의 기능을 하나로 취급하지 않는다.',
    'voice intensity frequency semantics'
)
write(p, s)

# Body-praise layer sees frequency too, without turning it into a quota.
p = 'velour-v4.4.38-continuity-vault-hotfix.js'
s = read(p)
s = req(s, "const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));", "const dirty = Math.max(0, Math.min(100, Number(state?.dirtyTalk ?? 70)));\n    const dirtyFrequency = Math.max(0, Math.min(100, Number(state?.dirtyTalkFrequency ?? 70)));", 'body praise frequency const')
s = req(s, "- 더티톡 강도=${dirty}/100과 결합한다. 수위가 높을수록", "- 더티톡 강도=${dirty}/100, 빈도=${dirtyFrequency}/100과 결합한다. 강도는 표현의 직접성, 빈도는 등장 성향이며 둘을 서로 대신하지 않는다. 수위가 높을수록", 'body praise frequency semantics')
write(p, s)

# Quality layer also names both axes so an inner prompt cannot re-merge them.
p = 'velour-v4.4.38-quality-restore.js'
s = read(p)
s = req(s, "window.__VELOUR_QUALITY_RESTORE_VERSION__ = '1.3.2';", "window.__VELOUR_QUALITY_RESTORE_VERSION__ = '1.3.3';", 'quality version')
s = req(s, "const dirty = Math.max(0, Math.min(100, Number(s?.dirtyTalk ?? 70)));\n    const richness", "const dirty = Math.max(0, Math.min(100, Number(s?.dirtyTalk ?? 70)));\n    const dirtyFrequency = Math.max(0, Math.min(100, Number(s?.dirtyTalkFrequency ?? 70)));\n    const richness", 'quality frequency const')
s = req(s, "- 더티톡 강도=${dirty}/100. 같은 문구를 반복하지 말고", "- 더티톡 강도=${dirty}/100, 빈도=${dirtyFrequency}/100. 강도는 직접성, 빈도는 등장 성향이다. 빈도를 높여도 같은 의미군을 반복해서 채우지 말고", 'quality frequency semantics')
write(p, s)

# Loader/cache bumps.
p = 'velour-v4.4.38-vault-accept-hotfix.js'
s = read(p)
s = req(s, 'quality-restore.js?v=5', 'quality-restore.js?v=6', 'quality cache')
s = req(s, 'continuity-vault-hotfix.js?v=5', 'continuity-vault-hotfix.js?v=6', 'continuity vault cache')
write(p, s)

for p in ['index.html', 'scripts/build-github-pages-canonical.mjs']:
    s = read(p)
    s = req(s, 'velour-v4.4.38.js?v=443706', 'velour-v4.4.38.js?v=443707', f'{p} base cache')
    s = req(s, 'vault-accept-hotfix.js?v=16', 'vault-accept-hotfix.js?v=17', f'{p} loader cache')
    s = req(s, 'continuity-voice-guard.js?v=4', 'continuity-voice-guard.js?v=5', f'{p} voice cache')
    write(p, s)

# Existing cache regression tests.
for p in ['scripts/test-hard-canon-lock.mjs', 'scripts/test-conditional-canon.mjs']:
    s = read(p)
    s = s.replace('continuity-vault-hotfix\\.js\\?v=5', 'continuity-vault-hotfix\\.js\\?v=6')
    s = s.replace('vault-accept-hotfix\\.js\\?v=16', 'vault-accept-hotfix\\.js\\?v=17')
    write(p, s)

# Dedicated regression.
Path('scripts/test-dirty-talk-frequency.mjs').write_text(r'''import assert from 'node:assert/strict';
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
''', encoding='utf-8')
