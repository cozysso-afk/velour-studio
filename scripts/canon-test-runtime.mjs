import { JSDOM, VirtualConsole } from 'jsdom';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';

// Isolated offline runtime using the actual page, bindings, storage engine and
// prompt wrappers. No production account, network, authentication or AI calls.
export async function runtime({saved={},database=new IDBFactory(),wrappers=true}={}) {
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://canon-test.invalid/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;
  w.indexedDB=database;w.IDBKeyRange=IDBKeyRange;w.structuredClone=structuredClone;
  w.fetch=()=>{throw new Error('Network/paid API calls prohibited in tests');};
  w.confirm=()=>true;w.alert=()=>{};w.prompt=()=> 'Canon regression fixture';
  w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,'\\$&')};
  Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;},set(v){this.textContent=v;},configurable:true});
  w.HTMLElement.prototype.scrollIntoView=function(){};
  Object.entries(saved).forEach(([key,value])=>w.localStorage.setItem(key,value));
  // Prevent timers used only for telemetry/late override polling. Debounce timers
  // remain real; no application code is rewritten to make tests pass.
  w.setInterval=()=>0;
  for(const script of [...w.document.scripts]) if(!script.src&&script.textContent.trim()) w.eval(script.textContent);
  for(const name of ['velour-v3.5.js','velour-canon-authoring.js','velour-canon-index.js','velour-v4.4.38.js','velour-settings-library.js'])w.eval(readFileSync(name,'utf8'));
  await w.__VELOUR_STORAGE_READY__;
  if(wrappers) for(const suffix of ['state-isolation-hotfix','episode-branch-hotfix','state-isolation-reclaim-hotfix','visual-theme-hotfix','ui-consolidation-hotfix','quality-restore','scene-agency-hotfix','continuity-hotfix','continuity-vault-hotfix','internal-label-firewall','prose-qa-hotfix','style-dna-hotfix','scene-voice-memory-hotfix','continuity-voice-guard','continuity-relation-grammar-hotfix'])w.eval(readFileSync(`velour-v4.4.38-${suffix}.js`,'utf8'));
  return {w,dom,errors,database,close:()=>w.close()};
}
