from pathlib import Path

p=Path('velour-v4.4.38-ui-hierarchy-v2.js')
s=p.read_text()
s=s.replace("const VERSION='1.1.1';","const VERSION='1.1.2';",1)

old="""  function depthSectionsByIndex(depth){
    if(!depth)return [];
    return Array.from(depth.querySelectorAll('[data-depth-char]')).map(card=>{
      const sections=Array.from(card.querySelectorAll(':scope>details'));
      sections.forEach((section,i)=>{
        section.classList.add('velour-v2-depth-section');
        const summary=section.querySelector(':scope>summary');
        if(summary)summary.textContent=i===0?'성적 스타일':'자극 · 플레이';
      });
      return sections;
    });
  }
"""
new="""  function depthCardForCharacter(depth,card,fallbackIndex){
    if(!depth||!card)return null;
    const rows=Array.from(depth.querySelectorAll('[data-depth-char]'));
    const qa=window.__VELOUR_ENSEMBLE_CHARACTER_PREFERENCES_QA__;
    let cfg=null;
    try{cfg=qa?.loadCfg?.()||null;}catch(_){}
    const index=Number(card.dataset.charIndex||0);
    const character=card.dataset.charKind==='heroine'?cfg?.heroine:cfg?.partners?.[index];
    const id=String(character?.id||'').trim();
    return (id?rows.find(row=>String(row.dataset.depthChar||'')===id):null)||rows[fallbackIndex]||null;
  }

  function syncDepthProxy(proxy,original){
    if(!proxy||!original)return;
    const mode=String(original.dataset.mode||'allowed');
    proxy.dataset.mode=mode;
    proxy.textContent=String(original.textContent||'').trim();
    proxy.setAttribute('aria-pressed',mode==='priority'?'true':'false');
  }

  function proxyDepthSection(depthCard,kind,label){
    if(!depthCard)return null;
    const originals=Array.from(depthCard.querySelectorAll(`[data-depth-kind="${kind}"]`));
    if(!originals.length)return null;
    const details=document.createElement('details');details.className='velour-v2-depth-section';
    const summary=document.createElement('summary');summary.textContent=label;
    const grid=document.createElement('div');
    originals.forEach(original=>{
      const proxy=document.createElement('button');proxy.type='button';proxy.dataset.depthKind=kind;proxy.className='velour-v2-mode-btn';
      syncDepthProxy(proxy,original);
      proxy.addEventListener('click',()=>{
        original.click();
        Promise.resolve().then(()=>syncDepthProxy(proxy,original));
      });
      grid.appendChild(proxy);
    });
    details.append(summary,grid);
    return details;
  }
"""
if old not in s: raise SystemExit('depth section marker missing')
s=s.replace(old,new,1)

old="""    const depthRows=depthSectionsByIndex(depth);
    cards.forEach((card,i)=>{
      const item=document.createElement('details');item.className='velour-v2-intimacy-card';
      const summary=document.createElement('summary');summary.textContent=`${card.dataset.charKind==='heroine'?'여주':'상대'} · ${cleanName(card,i+1)}`;
      const body=document.createElement('div');body.className='velour-v2-intimacy-body';
      const position=proxySection(card,'position','친밀 구도');if(position)body.appendChild(position);
      const caress=depth?null:proxySection(card,'caress','애정 · 애무');if(caress)body.appendChild(caress);
      (depthRows[i]||[]).forEach(section=>body.appendChild(section));
      item.append(summary,body);shelf.appendChild(item);
    });"""
new="""    cards.forEach((card,i)=>{
      const item=document.createElement('details');item.className='velour-v2-intimacy-card';
      const summary=document.createElement('summary');summary.textContent=`${card.dataset.charKind==='heroine'?'여주':'상대'} · ${cleanName(card,i+1)}`;
      const body=document.createElement('div');body.className='velour-v2-intimacy-body';
      const position=proxySection(card,'position','친밀 구도');if(position)body.appendChild(position);
      const caress=depth?null:proxySection(card,'caress','애정 · 애무');if(caress)body.appendChild(caress);
      const depthCard=depthCardForCharacter(depth,card,i);
      const style=proxyDepthSection(depthCard,'style','성적 스타일');if(style)body.appendChild(style);
      const stim=proxyDepthSection(depthCard,'stim','자극 · 플레이');if(stim)body.appendChild(stim);
      item.append(summary,body);shelf.appendChild(item);
    });"""
if old not in s: raise SystemExit('rebuild intimacy marker missing')
s=s.replace(old,new,1)

old="""      profile?.addEventListener?.('input',ev=>{if(ev.target?.matches?.('[data-field="name"]'))schedule(true);},true);"""
new="""      // Name typing already updates the ensemble source. Rebuilding the entire intimacy shelf per keystroke caused mobile lag and detached depth controls.
      profile?.addEventListener?.('change',ev=>{if(ev.target?.matches?.('[data-field="name"]'))schedule(true);},true);"""
if old not in s: raise SystemExit('name schedule marker missing')
s=s.replace(old,new,1)
p.write_text(s)

for name in ['index.html','scripts/build-github-pages-canonical.mjs']:
    q=Path(name)
    t=q.read_text().replace('velour-v4.4.38-ui-hierarchy-v2.js?v=3','velour-v4.4.38-ui-hierarchy-v2.js?v=4')
    q.write_text(t)

q=Path('scripts/test-ui-hierarchy-v2.mjs')
t=q.read_text()
t=t.replace("const VERSION='1\\.1\\.1'","const VERSION='1\\.1\\.2'")
t=t.replace('ui-hierarchy-v2\\.js\\?v=3','ui-hierarchy-v2\\.js\\?v=4')
q.write_text(t)

Path('scripts/test-one-to-many-name-depth-controls.mjs').write_text(r'''#!/usr/bin/env node
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
''')
