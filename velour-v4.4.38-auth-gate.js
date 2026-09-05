'use strict';

/* VELOUR — single-user Supabase Auth gate */
(() => {
  'use strict';
  if (window.__VELOUR_AUTH_GATE__) return;
  window.__VELOUR_AUTH_GATE__ = true;

  const SUPABASE_URL = 'https://safcnvwojjthhursiers.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_NQ0pSTq8gE8JrKDrIyXJww_HTapFg_x';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.min.js';
  const ACCESS_FUNCTION = 'velour-access';
  const TRUST_KEY = 'velour-auth-trusted-v2';

  const css = document.createElement('style');
  css.id = 'velour-auth-gate-css';
  css.textContent = `
    #velourAuthGate{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at 50% 20%,#35101f 0,#17070f 52%,#0b0307 100%);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;color:#fff6f8;font-family:-apple-system,BlinkMacSystemFont,"Pretendard",sans-serif}
    #velourAuthGate[hidden]{display:none!important}
    .velour-auth-card{width:min(100%,390px);background:rgba(28,8,18,.94);border:1px solid rgba(245,196,107,.27);border-radius:24px;padding:26px 22px 22px;box-sizing:border-box;box-shadow:0 28px 80px rgba(0,0,0,.58);backdrop-filter:blur(18px)}
    .velour-auth-mark{text-align:center;font-family:"Noto Serif KR",serif;color:#f5c46b;font-size:12px;letter-spacing:.22em;margin-bottom:8px}
    .velour-auth-title{text-align:center;font-family:"Noto Serif KR",serif;font-size:25px;font-weight:700;margin:0;color:#fff4e4;letter-spacing:.03em}
    .velour-auth-sub{text-align:center;color:#bca7b2;font-size:11px;line-height:1.65;margin:9px 0 22px}
    .velour-auth-label{display:block;color:#d8c0cb;font-size:10px;font-weight:750;margin:12px 2px 6px;letter-spacing:.04em}
    .velour-auth-input{width:100%;box-sizing:border-box;border:1px solid rgba(245,196,107,.18);border-radius:12px;background:#11060c;color:#fff6f8;padding:13px 14px;font-size:15px;outline:none;-webkit-appearance:none}
    .velour-auth-input:focus{border-color:rgba(245,196,107,.62);box-shadow:0 0 0 3px rgba(245,196,107,.07)}
    .velour-auth-btn{width:100%;border:0;border-radius:12px;margin-top:18px;padding:13px 14px;background:linear-gradient(135deg,#eab75f,#f7d68e);color:#291508;font-size:13px;font-weight:850;letter-spacing:.02em;box-shadow:0 8px 24px rgba(234,183,95,.16)}
    .velour-auth-btn:disabled{opacity:.55}
    .velour-auth-link{display:block;width:100%;border:0;background:transparent;color:#d8b86f;font-size:10.5px;text-decoration:underline;text-underline-offset:3px;margin-top:11px;padding:5px;cursor:pointer}
    .velour-auth-msg{min-height:18px;margin:10px 2px 0;text-align:center;color:#ffb5c1;font-size:10.5px;line-height:1.5}
    .velour-auth-security{text-align:center;margin-top:13px;color:#806b76;font-size:9.5px;line-height:1.5}
    #velourLogoutBtn{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:2147483000;border:1px solid rgba(245,196,107,.20);border-radius:999px;background:rgba(18,5,11,.78);color:#d8c0cb;padding:7px 10px;font-size:9px;font-weight:700;backdrop-filter:blur(12px);display:none}
  `;
  document.head.appendChild(css);

  const gate = document.createElement('div');
  gate.id = 'velourAuthGate';
  gate.hidden = true;
  gate.innerHTML = `
    <form class="velour-auth-card" id="velourAuthForm" autocomplete="on">
      <div class="velour-auth-mark">PRIVATE STUDIO</div>
      <h1 class="velour-auth-title">✦ VELOUR</h1>
      <div class="velour-auth-sub" id="velourAuthSub">개인 스튜디오입니다.<br>인증된 계정으로 로그인해 주세요.</div>
      <div id="velourLoginFields">
        <label class="velour-auth-label" for="velourAuthEmail">EMAIL</label>
        <input class="velour-auth-input" id="velourAuthEmail" name="email" type="email" inputmode="email" autocomplete="username" required>
        <label class="velour-auth-label" for="velourAuthPassword">PASSWORD</label>
        <input class="velour-auth-input" id="velourAuthPassword" name="password" type="password" autocomplete="current-password" required>
        <button class="velour-auth-btn" id="velourAuthSubmit" type="submit">로그인</button>
        <button class="velour-auth-link" id="velourForgotBtn" type="button">비밀번호 재설정</button>
      </div>
      <div id="velourRecoveryFields" hidden>
        <label class="velour-auth-label" for="velourNewPassword">새 비밀번호</label>
        <input class="velour-auth-input" id="velourNewPassword" type="password" autocomplete="new-password" minlength="8">
        <label class="velour-auth-label" for="velourNewPassword2">새 비밀번호 확인</label>
        <input class="velour-auth-input" id="velourNewPassword2" type="password" autocomplete="new-password" minlength="8">
        <button class="velour-auth-btn" id="velourRecoverySubmit" type="button">새 비밀번호 저장</button>
      </div>
      <div class="velour-auth-msg" id="velourAuthMsg" role="status" aria-live="polite"></div>
      <div class="velour-auth-security">회원가입 기능 없음 · 허용된 계정 1개만 입장 가능</div>
    </form>`;
  document.body.appendChild(gate);

  const logout = document.createElement('button');
  logout.id = 'velourLogoutBtn';
  logout.type = 'button';
  logout.textContent = '잠금';
  logout.title = 'VELOUR 로그아웃';
  document.body.appendChild(logout);

  const form = gate.querySelector('#velourAuthForm');
  const email = gate.querySelector('#velourAuthEmail');
  const password = gate.querySelector('#velourAuthPassword');
  const submit = gate.querySelector('#velourAuthSubmit');
  const forgot = gate.querySelector('#velourForgotBtn');
  const msg = gate.querySelector('#velourAuthMsg');
  const sub = gate.querySelector('#velourAuthSub');
  const loginFields = gate.querySelector('#velourLoginFields');
  const recoveryFields = gate.querySelector('#velourRecoveryFields');
  const newPassword = gate.querySelector('#velourNewPassword');
  const newPassword2 = gate.querySelector('#velourNewPassword2');
  const recoverySubmit = gate.querySelector('#velourRecoverySubmit');
  let client = null;
  let recoveryMode = false;

  function trusted(){ try{return localStorage.getItem(TRUST_KEY)==='1';}catch(_){return false;} }
  function rememberTrusted(value){ try{value?localStorage.setItem(TRUST_KEY,'1'):localStorage.removeItem(TRUST_KEY);}catch(_){} }
  function message(text, ok=false){ msg.textContent=String(text||''); msg.style.color=ok?'#bff4cf':'#ffb5c1'; }
  function lock(reason=''){
    if(!recoveryMode) rememberTrusted(false);
    gate.hidden=false;
    logout.style.display='none';
    if(reason) message(reason);
    setTimeout(()=>recoveryMode?newPassword?.focus():email?.focus(),80);
  }
  function unlock(){
    recoveryMode=false;
    rememberTrusted(true);
    message('인증 완료',true);
    gate.hidden=true;
    logout.style.display='block';
    password.value='';
  }
  function showRecovery(){
    recoveryMode=true;
    rememberTrusted(false);
    loginFields.hidden=true;
    recoveryFields.hidden=false;
    sub.innerHTML='복구 링크 인증이 완료됐습니다.<br>새 비밀번호를 설정해 주세요.';
    message('새 비밀번호는 8자 이상으로 설정해 주세요.',true);
    gate.hidden=false;
    logout.style.display='none';
    setTimeout(()=>newPassword?.focus(),80);
  }
  function loadSdk(){
    if(window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-velour-supabase-sdk]');
      if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.src=SDK_URL;s.async=true;s.dataset.velourSupabaseSdk='1';
      s.onload=resolve;s.onerror=()=>reject(new Error('인증 모듈을 불러오지 못했습니다.'));document.head.appendChild(s);
    });
  }
  async function serverAllows(session){
    if(!session?.access_token) return false;
    const {data,error}=await client.functions.invoke(ACCESS_FUNCTION,{body:{purpose:'velour-entry'}});
    if(error) return false;
    return data?.ok===true;
  }
  async function verifyExistingSession(){
    const hadTrust=trusted();
    if(hadTrust){ gate.hidden=true; logout.style.display='block'; }
    try{
      await loadSdk();
      const {createClient}=window.supabase;
      client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'velour-auth-session-v1'}});
      client.auth.onAuthStateChange((event)=>{
        if(event==='PASSWORD_RECOVERY') showRecovery();
      });
      const hashRecovery=/type=recovery/i.test(location.hash||'');
      if(hashRecovery) recoveryMode=true;
      const {data:{session}}=await client.auth.getSession();
      if(recoveryMode){ showRecovery(); return; }
      if(session && await serverAllows(session)) return unlock();
      if(session) await client.auth.signOut({scope:'local'}).catch(()=>{});
      lock();
    }catch(e){
      console.error('VELOUR auth init failed',e);
      if(hadTrust && !recoveryMode){ gate.hidden=true; logout.style.display='block'; return; }
      lock('인증 연결에 실패했습니다. 네트워크를 확인해 주세요.');
    }
  }
  form.addEventListener('submit',async(ev)=>{
    ev.preventDefault();if(recoveryMode)return;if(!client)return message('인증 모듈을 준비 중입니다.');submit.disabled=true;message('확인 중…',true);
    try{
      const {data,error}=await client.auth.signInWithPassword({email:email.value.trim(),password:password.value});
      if(error||!data?.session){message('이메일 또는 비밀번호를 확인해 주세요.');return;}
      if(!(await serverAllows(data.session))){await client.auth.signOut({scope:'local'}).catch(()=>{});rememberTrusted(false);message('이 계정은 VELOUR에 접근할 수 없습니다.');return;}
      unlock();
    }catch(e){console.error('VELOUR login failed',e);message('로그인 처리 중 오류가 발생했습니다.');}
    finally{submit.disabled=false;}
  });
  forgot.addEventListener('click',async()=>{
    if(!client)return message('인증 모듈을 준비 중입니다.');
    const address=email.value.trim();
    if(!address)return message('이메일을 먼저 입력해 주세요.');
    forgot.disabled=true;message('복구 메일 보내는 중…',true);
    try{
      const redirectTo=location.origin+location.pathname;
      const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo});
      if(error){console.error('VELOUR reset email failed',error);message('복구 메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');return;}
      message('복구 메일을 보냈어요. 메일의 링크를 눌러 새 비밀번호를 설정해 주세요.',true);
    }catch(e){console.error('VELOUR reset request failed',e);message('복구 메일 전송 중 오류가 발생했습니다.');}
    finally{forgot.disabled=false;}
  });
  recoverySubmit.addEventListener('click',async()=>{
    const a=newPassword.value,b=newPassword2.value;
    if(a.length<8)return message('새 비밀번호는 8자 이상이어야 합니다.');
    if(a!==b)return message('새 비밀번호가 서로 일치하지 않습니다.');
    recoverySubmit.disabled=true;message('비밀번호 변경 중…',true);
    try{
      const {error}=await client.auth.updateUser({password:a});
      if(error){console.error('VELOUR password update failed',error);message('비밀번호 변경에 실패했습니다. 복구 링크를 다시 열어 주세요.');return;}
      const {data:{session}}=await client.auth.getSession();
      if(!session || !(await serverAllows(session))){message('비밀번호는 변경됐지만 접근 확인에 실패했습니다. 새 비밀번호로 다시 로그인해 주세요.');recoveryMode=false;loginFields.hidden=false;recoveryFields.hidden=true;sub.innerHTML='개인 스튜디오입니다.<br>인증된 계정으로 로그인해 주세요.';return;}
      history.replaceState(null,'',location.pathname+location.search);
      unlock();
    }catch(e){console.error('VELOUR recovery failed',e);message('비밀번호 변경 중 오류가 발생했습니다.');}
    finally{recoverySubmit.disabled=false;}
  });
  logout.addEventListener('click',async()=>{
    rememberTrusted(false);
    try{await client?.auth.signOut({scope:'local'});}catch(_){}
    lock('잠겼습니다.');
  });
  window.__VELOUR_AUTH_QA__={version:'1.2.0',isLocked:()=>!gate.hidden,lock,async verify(){const {data:{session}}=await client.auth.getSession();return !!(session&&await serverAllows(session));}};
  verifyExistingSession();
})();
