import assert from 'node:assert/strict';
import {runtime} from './canon-test-runtime.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const r=await runtime();const {w}=r;
const qa=w.__VELOUR_CANON_INPUT_QA__, storage=w.__VELOUR_STORAGE_QA__;
const hard=w.document.getElementById('v4HardCanon'), story=w.document.getElementById('v4Storyline');
const longHard=Array.from({length:150},(_,i)=>`인물${i}: 현재 기록관리자다.\n인물${i}는 35세이며 호칭은 유지한다! “따옴표”, 괄호(조건); 특수기호 & < > — ${i}.`).join('\n')+'\nC:\nC는 현재 사진작가다.\nC는 여주에게 항상 존댓말.\nC는 몇 차례 촬영 후 매니저가 된다.\n';
const longStory=Array.from({length:180},(_,i)=>`${i+1}. C와 촬영 준비 ${i}: 사건의 원인과 반응을 확인한다. “대사” / 괄호(조건) · ${i}`).join('\n')+'\n';
assert.ok(longHard.length>10000&&longStory.length>5000);
let writes=0;
const originalSet=w.Storage.prototype.setItem;
w.Storage.prototype.setItem=function(k,v){if(k==='VELOUR_STORY_ENGINE_V44')writes++;return originalSet.call(this,k,v);};
const state=w.__VELOUR_V4_STATE_SNAPSHOT__();state.beatIndex=5;w.__VELOUR_V4_STATE_RESTORE__(state);
writes=0;
const dispatch=(el,type,opts={})=>el.dispatchEvent(type==='input'?new w.InputEvent(type,{bubbles:true,...opts}):new w.Event(type,{bubbles:true}));
for(const [el,text,key] of [[hard,longHard,'hardCanon'],[story,longStory,'storyline']]){
  el.focus();const node=el;const quickNode=w.document.querySelector('#v41Quick')?.firstChild;
  dispatch(el,'compositionstart');
  const before=writes, indexBuilds=w.__VELOUR_CANON_INDEX__.builds;
  for(let i=1;i<=15;i++){el.value=text.slice(0,i*10);dispatch(el,'input',{isComposing:true});}
  await delay(260);
  assert.equal(writes,before,'No localStorage during composition');
  assert.equal(w.__VELOUR_CANON_INDEX__.builds,indexBuilds,'No indexing while typing');
  assert.equal(w.document.querySelector('#v41Quick')?.firstChild,quickNode,'No full UI rendering during composition');
  assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__()[key],el.value,'IME memory immediately updated');
  el.value=text;el.setSelectionRange(17,17);
  dispatch(el,'compositionend');
  assert.equal(writes,before+1,'Composition end immediately persists');
  assert.equal(el.value,text);assert.equal(el.selectionStart,17);assert.equal(w.document.getElementById(el.id),node);
  // Browsers may send a trailing non-composing input event after compositionend.
  dispatch(el,'input');dispatch(el,'input');dispatch(el,'input');
  assert.equal(writes,before+1);
  await delay(260);assert.equal(writes,before+2,'Burst is debounced to one write');
  el.blur();await w.__VELOUR_CANON_FLUSH__();
  assert.equal(el.value,text);
}
assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().beatIndex,5,'Typing must not reset beat index');
assert.equal(qa.storylineBeats().length,180);
w.document.getElementById('v4BeatNext').click();assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().beatIndex,6);
w.document.getElementById('v4BeatPrev').click();assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().beatIndex,5);
const prompt=w.buildPrompt(true);
assert.match(prompt,/6\. \[현재 실행\]/);assert.match(prompt,/7\. \[다음 목적지 · 계획만\]/);
assert.match(prompt,/현재 단계.*실행|현재 단계.*진행/);
assert.match(prompt,/C는 현재 사진작가다/);assert.match(prompt,/미래\/조건부 · 미성립 · 실행 금지/);
assert.ok(!prompt.includes(longHard),'Continuation does not paste the entire raw canon');
assert.match(prompt,/HARD CANON EXPOSURE FIREWALL/);
assert.match(prompt,/CONDITIONAL CANON/);
// localStorage reload is exact, including trailing newlines and punctuation.
const saved=Object.fromEntries(Object.entries(w.localStorage));
const reloaded=await runtime({saved,database:r.database});
assert.equal(reloaded.w.__VELOUR_V4_STATE_SNAPSHOT__().hardCanon,longHard);
assert.equal(reloaded.w.__VELOUR_V4_STATE_SNAPSHOT__().storyline,longStory);
reloaded.close();
// Seed a real isolated story, restore it through the app, then edit and save.
const snapshot=w.__VELOUR_V4_STATE_SNAPSHOT__();
await storage.idbPut('stories',{id:'canon-story',title:'Canon test',episodeCount:2,episodes:[{episode:1,text:'첫 기록.'},{episode:2,text:'둘째 기록.'}],storyHistory:'첫 기록.\n둘째 기록.',currentText:'둘째 기록.',v4State:snapshot});
await w.restoreStory('canon-story');
assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().hardCanon,longHard);
hard.focus();hard.value=longHard+'C의 추가 고정 규칙: 이름 유지.\n';dispatch(hard,'input');
const edited=hard.value;
hard.blur();await w.__VELOUR_CANON_FLUSH__();
assert.equal((await storage.idbGet('drafts','current')).v4State.hardCanon,edited);
assert.equal((await storage.idbGet('drafts','current')).v4State.storyline,longStory);
hard.focus();hard.value=edited;dispatch(hard,'input');
await w.saveCurrentStory();hard.blur();
const stored=await storage.idbGet('stories','canon-story');
assert.equal(stored.v4State.hardCanon,edited);assert.equal(stored.v4State.storyline,longStory);
await w.restoreDraftStory();assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().hardCanon,edited);
// Exact branch snapshot preserves the canon at that historical point.
await storage.idbPut('storyBackups',{backupId:'canon-story:ep1',storyId:'canon-story',source:'rolling',story:{...stored,episodeCount:1,episodes:[{episode:1,text:'첫 기록.'}],storyHistory:'첫 기록.',currentText:'첫 기록.',v4State:{...snapshot,beatIndex:2}}});
const branch=await w.branchStoryFromEpisode('canon-story',2);
assert.ok(branch?.id&&branch.id!=='canon-story');
assert.equal(branch.v4State.hardCanon,longHard);assert.equal(branch.v4State.storyline,longStory);
assert.equal((await storage.idbGet('stories','canon-story')).v4State.hardCanon,edited,'Source unchanged by branch');
// localStorage failure is visible; typed text and cursor are never reverted.
const failText=longHard+'저장 실패 중 추가한 원문';
hard.focus();hard.value=failText;hard.setSelectionRange(10,10);
w.Storage.prototype.setItem=function(){throw new w.DOMException('Full','QuotaExceededError');};
dispatch(hard,'input');dispatch(hard,'change');await w.__VELOUR_CANON_FLUSH__();
assert.equal(hard.value,failText);assert.equal(hard.selectionStart,10);
assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().hardCanon,failText);
assert.equal(w.document.getElementById('v4HardCanonSaveStatus').dataset.status,'error');
w.Storage.prototype.setItem=originalSet;
hard.blur();await w.__VELOUR_CANON_FLUSH__();
assert.equal(w.document.getElementById('v4HardCanonSaveStatus').dataset.status,'saved');
// Failed IndexedDB transaction must not be reported as saved.
const db=await storage.idbOpen(), originalTransaction=db.transaction;
db.transaction=function(names,mode,...rest){
  const tx=originalTransaction.call(this,names,mode,...rest);
  if(names==='drafts'&&mode==='readwrite'){
    const objectStore=tx.objectStore.bind(tx);
    tx.objectStore=name=>{const os=objectStore(name);os.put=()=>{tx.abort();};return os;};
  }
  return tx;
};
hard.focus();hard.value=failText+'\nIDB 실패 시 보존';dispatch(hard,'input');dispatch(hard,'change');
await w.__VELOUR_CANON_FLUSH__();
assert.equal(w.document.getElementById('v4HardCanonSaveStatus').dataset.status,'error');
assert.ok(hard.value.endsWith('IDB 실패 시 보존'));
db.transaction=originalTransaction;hard.blur();await w.__VELOUR_CANON_FLUSH__();
assert.equal(w.document.getElementById('v4HardCanonSaveStatus').dataset.status,'saved');
// A queued authoring edit cannot follow a restore and overwrite another story.
hard.focus();hard.value='이전 작품의 미완료 입력';dispatch(hard,'input');
const other={...w.__VELOUR_V4_STATE_SNAPSHOT__(),hardCanon:'다른 작품의 고정 설정',storyline:'1. 다른 출발'};
w.__VELOUR_V4_STATE_RESTORE__(other);
await delay(260);
assert.equal(w.__VELOUR_CANON_INPUT_QA__.load().hardCanon,other.hardCanon);
assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().storyline,other.storyline);
assert.equal(hard.value,other.hardCanon,'Explicit restore hydrates the former focused editor');
dispatch(hard,'blur');await w.__VELOUR_CANON_FLUSH__();
assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().hardCanon,other.hardCanon);
// Oversized mandatory canon fails before any generation request; raw text survives.
const oversized={...other,hardCanon:Array.from({length:1000},(_,i)=>`C는 반드시 고정 규칙 ${i}를 유지한다. ${'정해진 조건을 준수한다 '.repeat(8)}`).join('\n')};
w.__VELOUR_V4_STATE_RESTORE__(oversized);
assert.throws(()=>qa.canonDirective(),error=>error.code==='CANON_BUDGET_EXCEEDED');
assert.match(w.document.getElementById('v4CanonBudgetStatus').textContent,/안전 예산/);
assert.equal(w.__VELOUR_V4_STATE_SNAPSHOT__().hardCanon,oversized.hardCanon);
assert.deepEqual(r.errors.map(e=>e.message),[]);
r.close();
console.log('PASS: real V4 bindings, IME event sequence, 220ms debounce, node/cursor preservation, exact reload/story/draft/branch roundtrip, beat navigation, full prompt stack, quota/IDB failure/retry, stale restore isolation');
