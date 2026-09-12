'use strict';

// Named authoring presets are independent of generated stories and drafts.
(() => {
  const form=window.__VELOUR_SETTINGS_FORM__, storage=window.__VELOUR_STORAGE_QA__;
  const anchor=document.getElementById('v4HardCanon')?.closest('.v40-field');
  if(!form||!storage||!anchor||document.getElementById('velourSettingsLibrary'))return;
  const box=document.createElement('div');box.id='velourSettingsLibrary';box.className='v40-field';
  box.innerHTML='<label>설정 보관함</label><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="v4SaveSettings">설정만 저장</button><select id="v4SavedSettings" aria-label="저장한 설정"></select><button type="button" id="v4LoadSettings">불러오기</button><button type="button" id="v4DeleteSettings">삭제</button></div><small id="v4SettingsStatus" role="status" aria-live="polite">소설을 생성하지 않아도 이름을 붙여 설정을 보관할 수 있어요.</small>';
  anchor.before(box);
  const select=box.querySelector('select'),status=box.querySelector('small');
  const PREFIX='authoring-preset:';
  const say=text=>{status.textContent=text;};
  async function write(key,value){
    await window.__VELOUR_STORAGE_READY__;
    const db=await storage.idbOpen();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('meta','readwrite');
      tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||new Error('저장 중단'));
      if(value)tx.objectStore('meta').put(value);else tx.objectStore('meta').delete(key);
    });
  }
  async function list(){
    await window.__VELOUR_STORAGE_READY__;
    return (await storage.idbGetAll('meta')).filter(x=>x.kind==='authoring-preset').sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
  }
  async function refresh(id=select.value){
    const rows=await list();select.replaceChildren(new Option('저장한 설정 선택',''));
    for(const row of rows)select.add(new Option(row.title,row.key));
    select.value=rows.some(x=>x.key===id)?id:'';
  }
  function helpers(){
    return {
      controls:[...document.querySelectorAll('#velourV33Panel input[id],#velourV33Panel select[id],#velourV33Panel textarea[id]')]
        .filter(el=>el.id!=='v33Next').map(el=>({id:el.id,value:el.value,checked:el.checked})),
      crossovers:[...document.querySelectorAll('#velourV33Panel .v33-tag.on[data-id]')].map(el=>el.dataset.id)
    };
  }
  async function savePreset(title){
    // Capture before any await: later typing cannot alter this named snapshot.
    const payload=form.capture(),helper=helpers();
    const key=PREFIX+crypto.randomUUID();
    const row={key,kind:'authoring-preset',title:String(title).trim()||'이름 없는 설정',savedAt:new Date().toISOString(),...payload,helper};
    await write(key,row);await refresh(key);say('설정 저장 완료 · 소설 생성 없이 보관했어요.');return row;
  }
  async function loadPreset(key){
    const row=await storage.idbGet('meta',key);
    if(row?.kind!=='authoring-preset')throw new Error('저장한 설정을 찾지 못했어요.');
    await window.__VELOUR_CANON_FLUSH__?.();
    for(const item of row.helper?.controls||[]){
      const el=document.getElementById(item.id);
      if(!el?.closest('#velourV33Panel')||el.id==='v33Next')continue;
      el.value=item.value;if(el.type==='checkbox')el.checked=item.checked;
    }
    const wanted=new Set(row.helper?.crossovers||[]);
    document.querySelectorAll('#velourV33Panel .v33-tag[data-id]').forEach(el=>el.classList.toggle('on',wanted.has(el.dataset.id)));
    const control=document.getElementById('v33Mix');control?.dispatchEvent(new Event('change',{bubbles:true}));
    const persisted=form.apply(row);
    say(persisted?'설정을 불러왔어요. 본문과 현재 진행 기록은 유지됩니다.':'설정은 불러왔지만 자동저장하지 못했어요. 보관함의 저장본은 유지됩니다.');
    return row;
  }
  let busy=false;
  async function action(fn){if(busy)return;busy=true;try{await fn();}catch(e){say('처리하지 못했어요. 입력과 저장본은 유지됩니다. '+String(e.message||e));}finally{busy=false;}}
  box.querySelector('#v4SaveSettings').onclick=()=>action(async()=>{const title=prompt('저장할 설정 이름을 적어줘','새 소설 설정');if(title!==null)await savePreset(title);});
  box.querySelector('#v4LoadSettings').onclick=()=>action(async()=>{if(select.value&&confirm('현재 입력 설정을 저장본으로 바꿀까요? 본문과 진행 기록은 유지됩니다.'))await loadPreset(select.value);});
  box.querySelector('#v4DeleteSettings').onclick=()=>action(async()=>{if(select.value&&confirm('선택한 설정 저장본을 삭제할까요?')){await write(select.value);await refresh();say('선택한 설정 저장본을 삭제했어요.');}});
  window.__VELOUR_SETTINGS_LIBRARY__={save:savePreset,load:loadPreset,list};
  action(()=>refresh());
})();
