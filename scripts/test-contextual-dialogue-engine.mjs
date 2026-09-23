import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('velour-v4.4.38-dialogue-context-hotfix.js','utf8');
const legacy = `BASE\n[DIALOGUE FUNCTION ROTATION — 더티톡 수위와 빈도 분리]\n- 더티톡 강도=70/100\n- 절정/사정 예고\n[NEXT-DIRECTION CONSEQUENCE LOCK — 다음화 지시 결과 유지]\n- keep\n[PROSE QUALITY RESTORE — CANON을 바꾸지 않는 문체 품질 지시]\n- 더티톡 강도=70/100, 빈도=70/100. old duplicate\n- keep quality\n[INTIMATE SCENE ANTI-REPETITION LOCK — 장소·구도·대사 기본값 회피]\n- 갈 것 같아\n- 나한테 싸\n- 싸줘/싸도 돼`;

const els = {
  novelText:{innerText:'“왜 자꾸 피해?” 그가 물었다. “아까부터 계속 그러네.”'},
  selectStage:{value:'[빌드업 & 감정선 중심] 심리전'},
  v33Next:{value:''}
};
const window = {
  __VELOUR_QUALITY_RESTORE__:true,
  __VELOUR_CONTINUITY_VAULT_EDGE_FIX__:true,
  __VELOUR_SCENE_VOICE_MEMORY_HOTFIX__:true,
  __VELOUR_CONTINUITY_VOICE_GUARD__:true,
  __VELOUR_CONTINUITY_RELATION_GRAMMAR_HOTFIX__:true,
  __VELOUR_V4_STATE_SNAPSHOT__:()=>({dirtyTalk:70,dirtyTalkFrequency:70,bodyPraiseDirtyTalk:'high',intimacyPatterns:['face_to_face']}),
  buildPrompt:()=>legacy
};
const context = {
  window,
  document:{getElementById:(id)=>els[id]||null},
  storyHistory:'“왜 그래?” “진짜 괜찮아?” “왜 자꾸 모르는 척해?” “말해봐.”',
  console,
  setInterval,
  clearInterval
};
vm.createContext(context);
vm.runInContext(source, context);

assert.equal(window.__VELOUR_CONTEXTUAL_DIALOGUE_ENGINE__, true);
const out = window.buildPrompt();
assert.match(out,/\[CONTEXTUAL DIALOGUE ENGINE — 상황 반응형 대사\]/);
assert.match(out,/\[INTIMATE SCENE VARIETY — 장소·구도 반복 방지\]/);
assert.doesNotMatch(out,/\[DIALOGUE FUNCTION ROTATION — 더티톡 수위와 빈도 분리\]/);
assert.doesNotMatch(out,/\[INTIMATE SCENE ANTI-REPETITION LOCK — 장소·구도·대사 기본값 회피\]/);
assert.doesNotMatch(out,/나한테 싸|싸줘\/싸도 돼|갈 것 같아/);
assert.doesNotMatch(out,/더티톡 강도=70\/100, 빈도=70\/100\. old duplicate/);
assert.match(out,/최근 확정 대사 기능 분포:/);

const qa = window.__VELOUR_CONTEXTUAL_DIALOGUE_QA__;
assert.equal(qa.classifyDialogue('왜 자꾸 피해?'),'question_probe');
assert.equal(qa.classifyDialogue('천천히, 잠깐만.'),'boundary_coordination');
assert.equal(qa.classifyDialogue('보고 싶었어.'),'emotion_reveal');
const summary = qa.summarizeRecentDialogue(['왜 그래?','뭐 하는 거야?','진짜 몰라?','말해봐.']);
assert.ok(summary.overused.includes('question_probe'));
const priorities = qa.rankedPriorities({bodyPraiseDirtyTalk:'high'},summary);
assert.notEqual(priorities[0],'question_probe');
assert.equal(window.__VELOUR_LAST_DIALOGUE_CONTEXT__.stage,'buildup');
console.log('PASS: contextual dialogue engine strips lexical priming and rotates recent dialogue functions');
