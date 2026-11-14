
/* core/ui */
const MICSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2400)}
function sheet(html,full,back){BACK=back||null;$('#layer').innerHTML=`<div class="dim" id="dim"><div class="sheet ${full?'full':''}" role="dialog"><div class="shead"><button class="back" id="sback">${BACKSVG}<span>뒤로</span></button></div>${html}</div></div>`;
  $('#dim').addEventListener('click',e=>{if(e.target.id==='dim')goBack()});$('#sback').onclick=goBack}
function close(){stopListen();try{trWake(false)}catch(e){}$('#layer').innerHTML='';if(!LOCAL)syncAfterClose()}
const FS=[[1,'보통'],[1.15,'크게'],[1.3,'아주 크게']];
function scale(){return ((S.prefs||{})[ME]||{}).fs||1}
function applyScale(){applyTheme();const k=scale();
  if(isSenior()){document.body.style.setProperty('--k',k);$('#app').style.zoom=1;$('#layer').style.zoom=1}
  else{$('#app').style.zoom=k;$('#layer').style.zoom=k}}
function setScale(k){S.prefs=S.prefs||{};S.prefs[ME]={...(S.prefs[ME]||{}),fs:k};save();applyScale()}
const fsSeg=()=>`<div class="seg" id="fsseg">${FS.map(([k,n])=>`<button data-v="${k}" class="${scale()===k?'on':''}">${n}</button>`).join('')}</div>`;
function bindFs(after){segBind('#fsseg',v=>{setScale(+v);after&&after()})}
const BACKSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const GEARSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4z"/></svg>';
let BACK=null;
function goBack(){const f=BACK;if(f)f();else{close();render()}}
function pref(k,d){return ((S.prefs||{})[ME]||{})[k]??d}
function setPref(k,v){S.prefs=S.prefs||{};S.prefs[ME]={...(S.prefs[ME]||{}),[k]:v};save()}
const SKINS=[['forest','숲','#2E6A4E'],['sea','바다','#2D5F8B'],['sunset','노을','#B4532A'],['lavender','라벤더','#6A55A3'],['ink','먹','#3B4148']];
// 앱(APK) 위쪽 상태바 띠: 스킨 색, 아래쪽은 화면 바탕색
function nativeBar(){try{const P=typeof NPLUG==='function'&&NPLUG('HanssineNative');if(!P||!P.setBar)return;
  const sk=(ME&&mem(ME)&&!isSenior())?pref('skin','forest'):'forest',col=(SKINS.find(x=>x[0]===sk)||SKINS[0])[2];
  setTimeout(()=>{const bg=getComputedStyle(document.body).backgroundColor,m=bg.match(/\d+/g)||[243,244,239],hx='#'+m.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join('');P.setBar({color:col,bg:hx}).catch(()=>{})},50)}catch(e){}}
const THEMES=[['system','휴대폰 설정'],['light','주간'],['dark','야간']];
function applyTheme(){const r=document.documentElement;nativeBar();
  if(!ME||!mem(ME)||isSenior()){delete r.dataset.theme;delete r.dataset.skin;return}
  const th=pref('theme','system');if(th==='system')delete r.dataset.theme;else r.dataset.theme=th;
  const sk=pref('skin','forest');if(sk==='forest')delete r.dataset.skin;else r.dataset.skin=sk;}
const IC={
  mic:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  img:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
  cam:'<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  clip:'<svg viewBox="0 0 24 24"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5"/></svg>',
  smile:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 14.5a5 5 0 0 0 8 0"/><circle cx="9" cy="10" r=".8" fill="currentColor"/><circle cx="15" cy="10" r=".8" fill="currentColor"/></svg>',
  at:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.5 6.9"/></svg>',
  send:'<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/></svg>',
  spk:'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  swap:'<svg viewBox="0 0 24 24"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>'};
const ib=(id,ic,label,extra)=>`<button class="ibtn ${extra||''}" id="${id}" aria-label="${label}" title="${label}">${IC[ic]}</button>`;
function readFile(f){return new Promise(res=>{const r=new FileReader();r.onload=()=>res({name:f.name,size:f.size,type:f.type||'',data:r.result});r.readAsDataURL(f)})}
// 사진 긴 변: 저장소를 쓰면 2048px, 아니면 문서 한도 때문에 1600px
const LIM={img:1600,vidSec:60,vidMB:50,fileMB:20};
const imgMax=()=>typeof MEDIA_ON==='function'&&MEDIA_ON()?2048:LIM.img;
function vidDur(data){return new Promise(res=>{const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>res(v.duration||0);v.onerror=()=>res(0);v.src=data})}
async function prepFile(f){
  if(/^image\//.test(f.type)&&!/gif|svg/.test(f.type)){const x=await readFile(f);const d=await shrink(x.data,imgMax());return {...x,data:d,type:'image/jpeg',size:Math.round(d.length*.75)}}
  if(/^video\//.test(f.type)){if(f.size>LIM.vidMB*1e6){toast(`동영상은 ${LIM.vidMB}MB까지 올릴 수 있어요`);return null}
    const x=await readFile(f);const sec=await vidDur(x.data);if(sec>LIM.vidSec+1){toast(`동영상은 ${LIM.vidSec/60}분 이내만 올릴 수 있어요 (${Math.round(sec)}초)`);return null}return x}
  if(f.size>LIM.fileMB*1e6){toast(`파일은 ${LIM.fileMB}MB까지 올릴 수 있어요`);return null}
  return readFile(f)}
function compress(f){return prepFile(f).then(x=>x?x.data:Promise.reject())}
function shrink(img,max){return new Promise(res=>{const im=new Image();im.onload=()=>{const s=Math.min(1,(max||1600)/Math.max(im.width,im.height));if(s===1&&img.length<(max>1600?2.5e6:7e5))return res(img);
  const c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',max>1600?.85:.8))};im.onerror=()=>res(img);im.src=img})}
const fsize=n=>n>1e6?(n/1e6).toFixed(1)+'MB':Math.max(1,Math.round(n/1e3))+'KB';
const isImg=f=>/^image\//.test(f.type),isVid=f=>/^video\//.test(f.type),isAud=f=>/^audio\//.test(f.type);
const fileInputs=pfx=>`<input type="file" id="${pfx}img" accept="image/*,video/*" multiple hidden><input type="file" id="${pfx}cam" accept="image/*" capture="environment" hidden><input type="file" id="${pfx}file" multiple hidden>`;
function bindFiles(pfx,onFile){['img','cam','file'].forEach(k=>{const el=$('#'+pfx+k);if(el)el.onchange=async e=>{for(const f of e.target.files){const x=await prepFile(f);if(x)onFile(x)}e.target.value=''}})}
function viewFile(f){sheet(`<div class="stack">${isImg(f)?`<img src="${f.data}" alt="" style="width:100%;border-radius:12px">`:isVid(f)?`<video src="${f.data}" controls style="width:100%;border-radius:12px"></video>`:''}
  <div><b>${esc(f.name||'사진')}</b><div class="small muted">${f.size?fsize(f.size):''}</div></div>
  ${/^https?:/.test(f.data||'')?`<a class="btn block" href="${esc(f.data)}" target="_blank" rel="noopener">${isImg(f)||isVid(f)?'원본 열기':'열기 · 내려받기'}</a>`:''}</div>`,true)}
IC.plus='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
IC.trans='<svg viewBox="0 0 24 24"><path d="M3 5h9M7.5 3v2M5.5 5c0 3.5 2.5 6.5 5.5 8M9.5 5c-.5 3.5-2.8 6.6-6 8.2"/><path d="M12.5 21l4-9 4 9M14 18h5"/></svg>';
IC.folder='<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
const pmItem=(id,ic,l)=>`<button class="pmi" id="${id}"><span>${IC[ic]}</span>${l}</button>`;
function composer(p,o){return `<div class="plusmenu" id="${p}pm" hidden>${o.emoji?pmItem(p+'emo','smile','이모티콘'):''}${pmItem(p+'imgb','img','사진·동영상')}${pmItem(p+'camb','cam','카메라')}${pmItem(p+'fileb','clip','파일')}${o.trans?pmItem(p+'trb','trans','번역해서 보내기'):''}</div>
  <div class="cbar">${ib(p+'plus','plus','더보기')}<textarea id="${p}q" rows="1" placeholder="${o.ph}">${esc(o.draft||'')}</textarea>${ib(p+'mic','mic','음성 입력')}${ib(p+'send','send','보내기','primary')}</div>${fileInputs(p)}`}
function bindComposer(p,o){const q=$('#'+p+'q');
  const grow=()=>{q.style.height='auto';q.style.height=Math.min(140,q.scrollHeight)+'px'};grow();
  const pm=$('#'+p+'pm');$('#'+p+'plus').onclick=()=>{pm.hidden=!pm.hidden;$('#'+p+'plus').classList.toggle('open',!pm.hidden);if(o.onPlus)o.onPlus(!pm.hidden)};
  q.addEventListener('input',()=>{grow();if(o.onInput)o.onInput(q.value)});
  const send=()=>{const t=q.value.trim();if(!t&&!o.allowEmpty)return;q.value='';grow();pm.hidden=true;o.onSend(t)};
  // 휴대폰: 엔터는 줄바꿈, 보내기는 버튼 / PC: 엔터 보내기, Shift+엔터 줄바꿈
  $('#'+p+'send').onclick=send;q.onkeydown=e=>{if(matchMedia('(pointer:coarse)').matches)return;if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}};
  $('#'+p+'imgb').onclick=()=>{pm.hidden=true;$('#'+p+'img').click()};$('#'+p+'camb').onclick=()=>{pm.hidden=true;$('#'+p+'cam').click()};$('#'+p+'fileb').onclick=()=>{pm.hidden=true;$('#'+p+'file').click()};
  bindFiles(p,o.onFile);
  if($('#'+p+'emo'))$('#'+p+'emo').onclick=()=>{pm.hidden=true;o.onEmoji()};
  if($('#'+p+'trb'))$('#'+p+'trb').onclick=()=>{pm.hidden=true;o.onTrans(q.value.trim())};
  $('#'+p+'mic').onclick=()=>{const b=$('#'+p+'mic');if(REC){stopListen();return}
    listen(t=>{q.value=t;grow();if(o.onInput)o.onInput(t)},(st,err)=>{b.classList.toggle('rec',st==='listening');if(st!=='listening'&&st!=='end')toast(micMsg(st,err))})};
  return {q,grow}}
const SICON={home:ICON_HOME(),talk:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  todo:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9l2 2 4-4M8 15h8"/></svg>',
  fam:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M2.5 20c.5-4 3-6 5.5-6s5 2 5.5 6M13 20c.3-3 1.8-4.5 3.5-4.5S20 17 21.5 20"/></svg>'};
function ICON_HOME(){return '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>'}
const ICON={home:'<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
  album:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/></svg>',
  cal:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  dues:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.5"/></svg>',
  talk:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  trans:'<svg viewBox="0 0 24 24"><path d="M3 5h9M7.5 3v2M5.5 5c0 3.5 2.5 6.5 5.5 8M9.5 5c-.5 3.5-2.8 6.6-6 8.2"/><path d="M12.5 21l4-9 4 9M14 18h5"/></svg>',
  set:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'};

// 복사: 클립보드가 막힌 환경(앱 안 웹 화면)에서는 예전 방식으로
function copyText(t,msg){const ok=()=>toast(msg||'복사했어요');
  const old=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);const r=document.execCommand('copy');a.remove();r?ok():toast('복사할 수 없습니다')}catch(e){toast('복사할 수 없습니다')}};
  try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,old);else old()}catch(e){old()}}

// 키보드가 열렸는지: 브라우저는 보이는 영역이, 앱(APK)은 화면 높이 자체가 줄어듦 → 가장 컸던 높이와 비교
let KB_MAX={p:0,l:0};
function kbCheck(){const vv=window.visualViewport,h=vv?vv.height:innerHeight,o=innerWidth>innerHeight*1.2&&!(vv&&vv.height<innerHeight*.8)?'l':'p';
  const full=Math.max(innerHeight,h);if(full>KB_MAX[o])KB_MAX[o]=full;
  const ae=document.activeElement,typing=ae&&(ae.tagName==='TEXTAREA'||(ae.tagName==='INPUT'&&!['checkbox','radio','button','file','range'].includes(ae.type)));
  const kb=!!typing&&h<KB_MAX[o]*.78;document.body.classList.toggle('kbopen',kb);return kb}
['resize','focusin','focusout'].forEach(ev=>addEventListener(ev,()=>setTimeout(kbCheck,ev==='focusout'?120:0)));
if(window.visualViewport)visualViewport.addEventListener('resize',kbCheck);
