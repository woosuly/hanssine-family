
/* features/chat */
const FXS=[['auto','자동'],['leaves','낙엽'],['snow','눈'],['rain','비'],['petals','꽃잎'],['off','끄기']];
let FXRAF=null;
function stopFx(){if(FXRAF)cancelAnimationFrame(FXRAF);FXRAF=null}
function fxKind(){let k=pref('fx','off');if(k!=='auto')return k;const w=wxToday()[2];if(w==='눈')return 'snow';if(w==='비'||w==='소나기')return 'rain';
  const m=today0().getMonth()+1;if(m===12||m<=2)return 'snow';if(m>=3&&m<=4)return 'petals';if(m>=10&&m<=11)return 'leaves';return 'off'}
function startFx(cv,kind){stopFx();if(!cv||kind==='off')return;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
  const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1;cv.width=cv.clientWidth*dpr;cv.height=cv.clientHeight*dpr;const W=cv.width,H=cv.height;
  const mk=init=>({x:Math.random()*W,y:init?Math.random()*H:-20*dpr,s:(.6+Math.random()*.8)*dpr,r:Math.random()*6.28,vr:(Math.random()-.5)*.06,ph:Math.random()*6.28,c:Math.floor(Math.random()*3)});
  const P=[...Array(kind==='rain'?55:kind==='snow'?45:20)].map(()=>mk(true));
  const leafC=['#C8642A','#D99A2B','#A8432A'],petC=['#F2B0C2','#F6C8D3','#E996AE'];
  const step=()=>{if(!cv.isConnected){stopFx();return}ctx.clearRect(0,0,W,H);
    for(const p of P){
      if(kind==='rain'){p.y+=9*p.s;p.x-=1.2*p.s;ctx.strokeStyle='rgba(80,135,200,.42)';ctx.lineWidth=1.3*dpr;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+2*p.s,p.y-12*p.s);ctx.stroke()}
      else if(kind==='snow'){p.y+=1.1*p.s;p.ph+=.02;p.x+=Math.sin(p.ph)*.5*dpr;ctx.fillStyle='rgba(150,178,206,.85)';ctx.beginPath();ctx.arc(p.x,p.y,2.4*p.s,0,6.28);ctx.fill()}
      else{p.y+=1.2*p.s;p.ph+=.03;p.x+=Math.sin(p.ph)*1.1*dpr;p.r+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=(kind==='leaves'?leafC:petC)[p.c];
        ctx.beginPath();ctx.ellipse(0,0,(kind==='leaves'?7:5)*p.s,(kind==='leaves'?3.4:2.8)*p.s,0,0,6.28);ctx.fill();ctx.restore()}
      if(p.y>H+20*dpr||p.x<-30*dpr||p.x>W+30*dpr)Object.assign(p,mk(false))}
    FXRAF=requestAnimationFrame(step)};
  step()}
function whoOf(by){if(by.startsWith('ai:')){const a=AIS[by.slice(3)];return {name:a[0],color:a[1],ai:true}}const m=mem(by);return m?{name:m.name,color:m.color,photo:m.photo}:{name:'?',color:'#888'}}
// 지금 보고 있는 방의 메시지 (CROOM 없으면 가족 대화방)
const curMsgs=()=>CROOM?RMSG:(S.chat||[]);
const findMsg=id=>curMsgs().find(x=>x.id===id);
function chatLogHtml(){return curMsgs().slice(-60).map(m=>chatMsgHtml(m)).join('')||'<div class="muted small" style="text-align:center;padding:20px">첫 메시지를 보내 보세요</div>'}
function bindSay(root){root.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>{const m=findMsg(b.dataset.say);if(m)speak(m.text)})}
let DRAFT='';
function attHtml(m){const f=m.file;if(m.img)return `<button class="attimg" data-view="${m.id}"><img src="${m.img}" alt="사진"></button>`;
  if(!f)return '';if(isImg(f))return `<button class="attimg" data-view="${m.id}"><img src="${f.data}" alt="${esc(f.name)}"></button>`;
  if(isVid(f))return `<video class="attvid" src="${f.data}" controls preload="metadata"></video>`;
  if(isAud(f))return `<audio src="${f.data}" controls></audio>`;
  return `<button class="attfile" data-view="${m.id}"><span class="fic">${IC.clip}</span><span><b>${esc(f.name)}</b><span class="small muted">${fsize(f.size)}</span></span></button>`}
function chatMsgHtml(m){if(m.sys)return `<div class="sysmsg" id="cm-${esc(m.id)}"><span>${esc(m.text)}</span></div>`;const mine=m.by===ME,w=whoOf(m.by);const a=m.act&&ACTS.find(x=>x[0]===m.act);
  const body=m.del?`<div class="bub deleted ${mine?'mine':''}">삭제된 메시지입니다</div>`:a?`<button class="actmsg" data-play="${a[0]}"><span class="ae">${a[2]}</span><span><b>${a[1]}</b><span class="small muted">눌러서 다시 보기</span></span></button>`
    :m.sticker?`<img class="stk" src="${sticker(m.sticker)}" alt="이모티콘" data-mid="${esc(m.id)}">`
    :(m.img||m.file)?attHtml(m)+(m.text?`<div class="bub ${mine?'mine':''}">${esc(m.text)}</div>`:'')
    :`<div class="bub ${mine?'mine':''} ${w.ai?'aib':''}" data-mid="${esc(m.id)}">${esc(m.text)}${m.orig?`<span class="orig">${esc(m.orig)}</span>`:''}${w.ai&&!m.wait?`<button class="tts" data-say="${esc(m.id)}">읽어 주기</button>`:''}</div>`;
  const rq=m.reply?`<button class="rq" data-jump="${esc(m.reply.id)}"><b>${esc(whoOf(m.reply.by).name)}</b> ${esc(m.reply.t)}</button>`:'';
  return `<div class="cm ${mine?'mine':''}" id="cm-${esc(m.id)}">${mine?'':w.ai?`<span class="av aiav" style="background:${w.color}">AI</span>`:`<button class="av" data-prof="${esc(m.by)}" style="${avBg(w)}" aria-label="${esc(w.name)} 정보">${w.photo?'':esc(w.name.slice(0,1))}</button>`}
    <div class="cmb">${mine?'':w.ai?`<span class="cmn">${esc(w.name)}</span>`:`<button class="cmn" data-prof="${esc(m.by)}">${esc(w.name)}</button>`}${rq}${body}<span class="cmt">${rcHtml(m)}${m.edited&&!m.del?'<span class="edtag">수정됨</span>':''}${hhmm(m.ts)}</span></div></div>`}
// 답장: 말풍선 메뉴에서 '답장' → 입력창 위에 원래 메시지 표시 → 보내면 인용과 함께 저장
let CREPLY=null;
function msgSnip(m){return m.text?m.text.replace(/\s+/g,' ').slice(0,40):m.sticker?'이모티콘':m.act?'움직이는 이모티콘':m.img?'사진':m.file?(isImg(m.file)?'사진':isVid(m.file)?'동영상':'파일'):''}
function replyBarHtml(){return CREPLY?`<div class="rbar"><span class="rbt"><b>${esc(whoOf(CREPLY.by).name)}에게 답장</b><span class="small muted">${esc(CREPLY.t)}</span></span><button class="chip" id="rbx">취소</button></div>`:''}
function bindReplyBar(){if($('#rbx'))$('#rbx').onclick=()=>{CREPLY=null;showReplyBar()}}
function showReplyBar(){const el=$('#rbar');if(!el)return;el.innerHTML=replyBarHtml();bindReplyBar()}
function setReply(id){const m=findMsg(id);if(!m)return;CREPLY={id:m.id,by:m.by,t:msgSnip(m)};close();showReplyBar();const q=$('#kq')||$('#tq');if(q)q.focus()}
function jumpTo(id){const el=document.getElementById('cm-'+id);if(!el){toast('예전 메시지라 화면에 없어요');return}
  el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1400)}
// 입력 중 표시: 입력하는 동안 3초에 한 번 알리고, 받은 쪽은 7초 안에 소식이 없으면 지움
const TYPING={};let TYPE_T=0,TYPE_ON=false;
function typingPing(on){if(LOCAL||!SYNC.live||!ME||(on&&CROOM))return;const now=Date.now();if(on===TYPE_ON&&(!on||now-TYPE_T<3000))return;
  TYPE_ON=on;TYPE_T=now;famRef().collection('state').doc('typing_'+ME).set({on,at:now}).catch(()=>{})}
function typingGot(k,d){if(d&&d.on&&Math.abs(Date.now()-(d.at||0))>15000)return;TYPING[k]={on:!!(d&&d.on),rx:Date.now()};typingUi()}
function typingText(){const now=Date.now(),ns=Object.entries(TYPING).filter(([k,v])=>k!==ME&&v.on&&now-v.rx<7000).map(([k])=>(mem(k)||{}).name).filter(Boolean);return ns.length?ns.join(', ')+' 입력 중…':''}
function typingUi(){const el=$('#typing');if(el)el.textContent=typingText()}
setInterval(typingUi,2000);
function postMsg(o){if(CROOM)return roomPost(o);S.chat=S.chat||[];if(CREPLY){o={...o,reply:CREPLY};CREPLY=null;showReplyBar()}typingPing(false);const m={id:uid(),by:ME,ts:Date.now(),...o};S.chat.push(m);save();return m}
async function postChat(text,stk){
  postMsg(stk?{sticker:stk}:{text});
  const at=!CROOM&&text&&text.match(/@(Gemini|GPT|Claude)/i);if(!at)return;
  const prov={gemini:'gemini',gpt:'openai',claude:'claude'}[at[1].toLowerCase()];
  const r={id:uid(),by:'ai:'+prov,ts:Date.now(),text:'생각하고 있어요…',wait:true};S.chat.push(r);refreshChat();
  const hist=S.chat.filter(x=>x.text&&!x.wait).slice(-10).map(x=>({role:x.by.startsWith('ai:')?'ai':'user',text:(x.by.startsWith('ai:')?'':whoOf(x.by).name+': ')+x.text.replace(/@\S+\s?/,'')}));
  try{r.text=await callAI(aiSystem(true),hist,prov)}catch(e){r.text=aiErr(e)}delete r.wait;r.ts=Date.now();save();refreshChat()}
function refreshChat(){const box=$('#clog');if(box){box.innerHTML=chatLogHtml();box.scrollTop=box.scrollHeight;bindMsgs(box)}if(CROOM)markRoomRead(CROOM);else markFamRead()}
function talkView(){
  const fx=fxKind();
  if(RLOADED&&CROOM&&!ROOMS.some(r=>r.id===CROOM)){closeRoom();CROOM=null}const room=CROOM&&ROOMS.find(r=>r.id===CROOM);
  return `<div class="talk" id="talk">${roomBarHtml()}<div class="row between"><h2>${room?esc(room.title):'가족 대화'}</h2>${room?`<button class="ibtn rmenu" id="rset" aria-label="방 메뉴"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>`:`<button class="chip" id="fxc">효과 · ${FXS.find(x=>x[0]===pref('fx','off'))[1]}${pref('fx','off')==='auto'&&fx!=='off'?`(${FXS.find(x=>x[0]===fx)[1]})`:''}</button>`}</div>
    ${room?`<div class="small muted rmem">${esc(roomMembers(room))}</div>`:''}
    <div class="clogw"><div class="clog" id="clog">${chatLogHtml()}</div><canvas class="fxc" id="fxcv"></canvas></div>
    ${room?'':`<div class="typing" id="typing">${typingText()}</div>`}<div id="rbar">${replyBarHtml()}</div>
    <div class="atpick" id="atpick" hidden>${Object.entries(AIS).filter(([k])=>(aiCfg().keys||{})[k]||k===aiCfg().def).map(([k,[n,c]])=>`<button data-at="${n}"><span class="av aiav" style="background:${c}">AI</span>${n}${aiCfg().def===k?' <span class="small muted">기본</span>':''}</button>`).join('')}</div>
    <div class="emopanel" id="emop" hidden>${emoPanel()}</div>
    ${composer('k',{emoji:true,trans:false,ph:room?'메시지':'메시지 · @로 AI 부르기',draft:DRAFT})}</div>`;
}
function bindTalk(){
  fitTalk();
  const box=$('#clog');box.scrollTop=box.scrollHeight;bindMsgs(box);
  startFx($('#fxcv'),fxKind());const pick=$('#atpick');
  bindReplyBar();bindRoomBar();if(CROOM)markRoomRead(CROOM);else markFamRead();
  const c=bindComposer('k',{onInput:v=>{DRAFT=v;pick.hidden=!!CROOM||!/@\w*$/.test(v);typingPing(!!v.trim()&&!/^@/.test(v.trim()))},onPlus:()=>{$('#emop').hidden=true},
    onSend:t=>{DRAFT='';pick.hidden=true;postChat(t);refreshChat()},
    onFile:async f=>{const u=await upFile(f).catch(upFail);if(u){postMsg({file:u});refreshChat()}},onEmoji:()=>{$('#emop').hidden=!$('#emop').hidden},onTrans:t=>trSendSheet(t)});
  c.q.addEventListener('blur',()=>typingPing(false));
  document.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{c.q.value=c.q.value.replace(/@\w*$/,'')+'@'+b.dataset.at+' ';DRAFT=c.q.value;pick.hidden=true;c.q.focus()});
  bindEmo(id=>{postChat('',id);$('#emop').hidden=true;refreshChat()},e=>{c.q.value+=e;DRAFT=c.q.value},id=>{postMsg({act:id});$('#emop').hidden=true;refreshChat();playAct(id)});
  if($('#rset'))$('#rset').onclick=()=>roomMenu(CROOM);
  if($('#fxc'))$('#fxc').onclick=()=>{sheet(`<div class="stack"><h2>대화 배경 효과</h2><div class="glist2">${FXS.map(([k,n])=>`<button data-fx="${k}" class="${pref('fx','off')===k?'on':''}">${n}${k==='auto'?' <span class="small muted">(오늘 날씨·계절에 맞춤)</span>':''}</button>`).join('')}</div></div>`);
    document.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{setPref('fx',b.dataset.fx);close();renderMain()})};
}
const TRM={};
function bindMsgs(root){bindSay(root);
  root.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playAct(b.dataset.play));
  root.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const m=findMsg(b.dataset.view);if(m)viewFile(m.file||{data:m.img,type:'image/jpeg',name:'사진'})});
  root.querySelectorAll('[data-mid]').forEach(b=>b.onclick=e=>{if(e.target.closest('.tts'))return;msgMenu(b.dataset.mid)});
  root.querySelectorAll('[data-prof]').forEach(b=>b.onclick=e=>{e.stopPropagation();profileSheet(b.dataset.prof)});
  root.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
  root.querySelectorAll('[data-rc]').forEach(b=>b.onclick=e=>{e.stopPropagation();readSheet(b.dataset.rc)});
  // 길게 누르면 메뉴 (사진·파일·움직이는 이모티콘도 답장·삭제 가능)
  root.querySelectorAll('.cm[id^="cm-"]').forEach(el=>{const id=el.id.slice(3);let t=null;
    el.addEventListener('touchstart',()=>{t=setTimeout(()=>{t=null;msgMenu(id)},550)},{passive:true});
    ['touchend','touchmove','touchcancel'].forEach(ev=>el.addEventListener(ev,()=>{if(t){clearTimeout(t);t=null}},{passive:true}));
    el.addEventListener('contextmenu',e=>{e.preventDefault();msgMenu(id)})})}
// 내가 보낸 메시지 고치기·지우기 (가족 대화방은 공유 데이터, 따로 만든 방은 방 메시지 문서)
function patchMsg(m,patch){Object.assign(m,patch);
  if(CROOM){roomsRef().doc(CROOM).collection('msgs').doc(m.id).set({j:JSON.stringify(m),ts:m.ts,by:m.by}).catch(e=>{console.warn(e);toast('저장하지 못했어요')})}else save();
  if($('#clog'))refreshChat();else if(me().role==='parent')renderSenior()}
function editMsg(id){const m=findMsg(id);if(!m)return;
  sheet(`<div class="stack"><h2>메시지 수정</h2><div class="field"><label for="medt">내용</label><textarea id="medt" rows="3">${esc(m.text)}</textarea></div>
    <div class="actions"><button class="btn ghost" id="medx">취소</button><button class="btn" id="medok">수정</button></div></div>`);
  $('#medx').onclick=close;$('#medok').onclick=()=>{const t=$('#medt').value.trim();if(!t){toast('내용을 입력해 주세요');return}close();if(t!==m.text)patchMsg(m,{text:t,edited:Date.now(),orig:undefined})}}
function delMsg(id){const m=findMsg(id);if(!m)return;if(m.file&&m.file.data)delMedia(m.file.data);if(m.img)delMedia(m.img);
  close();patchMsg(m,{del:true,text:'',file:null,img:null,sticker:null,act:null,orig:undefined});toast('메시지를 삭제했어요')}
function mineBtns(m){return m.by===ME&&!m.del?`${m.text?`<button id="medit">${MI.edit}<span>수정</span></button>`:''}<button id="mdel" class="red">${MI.del}<span>삭제</span></button>`:''}
function bindMine(id){if($('#medit'))$('#medit').onclick=()=>editMsg(id);
  if($('#mdel'))$('#mdel').onclick=()=>{const b=$('#mdel');if(!b.dataset.sure){b.dataset.sure=1;b.querySelector('span').textContent='한 번 더';return}delMsg(id)}}
const MI={reply:'<svg viewBox="0 0 24 24"><path d="M10 8L5 12l5 4"/><path d="M5 12h9a5 5 0 0 1 5 5v1"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  del:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'};
// 말풍선을 누르면 바로 옆에 작은 메뉴
function msgMenu(id){const m=findMsg(id);if(!m||m.wait||m.del||m.sys)return;
  const ko=m.text&&/[가-힣]/.test(m.text),to=ko?pref('chatTr','en'):'ko',r=m.text?TRM[id+to]:null;
  const btns=`<button id="mrp">${MI.reply}<span>답장</span></button>${m.text?`<button id="mtr">${IC.trans}<span>번역</span></button><button id="mcp">${IC.copy}<span>복사</span></button><button id="mtt">${IC.spk}<span>읽기</span></button>`:''}${mineBtns(m)}`;
  const tr=r?`<div class="mpop-tr"><div class="tr-t">${esc(r.t)}</div>${r.p?`<div class="tr-p">발음 · ${esc(r.p)}</div>`:''}</div>`:'';
  const lang=ko&&m.text?`<label class="mpop-lang">번역 언어 <select id="mtl">${LANGS.map(([c,n])=>`<option value="${c}" ${c===to?'selected':''}>${n}</option>`).join('')}</select></label>`:'';
  $('#layer').innerHTML=`<div class="mpop-dim" id="mdim"><div class="mpop" id="mpop" role="menu"><div class="mpop-b">${btns}</div>${tr}${lang}</div></div>`;BACK=null;
  $('#mdim').onclick=e=>{if(e.target.id==='mdim')close()};
  placePop(id);bindMine(id);
  $('#mrp').onclick=()=>setReply(id);
  if(!m.text)return;
  if($('#mtl'))$('#mtl').onchange=e=>{setPref('chatTr',e.target.value);msgMenu(id)};
  $('#mtr').onclick=async()=>{$('#mtr span').textContent='번역 중';try{TRM[id+to]=await translate(m.text,ko?'ko':'auto',to);msgMenu(id)}catch(e){$('#mtr span').textContent='번역';toast(aiErr(e).split('.')[0])}};
  $('#mcp').onclick=()=>{try{navigator.clipboard.writeText(m.text).then(()=>{toast('복사했어요');close()},()=>toast('복사할 수 없습니다'))}catch(e){}};
  $('#mtt').onclick=()=>speakIn(r?r.t:m.text,r?(to==='ko'?'ko-KR':lg(to)[2]):'ko-KR');
}
// 메뉴 위치: 말풍선 아래(공간이 없으면 위), 내 메시지는 오른쪽 맞춤
function placePop(id){const p=$('#mpop'),el=document.querySelector('#cm-'+CSS.escape(id));if(!p)return;
  const k=isSenior()?1:(scale()||1),W=innerWidth/k,H=(window.visualViewport?visualViewport.height:innerHeight)/k;
  const b=el?(el.querySelector('.bub,img,.cfile,.stk')||el).getBoundingClientRect():{top:H/2*k,bottom:H/2*k,left:12,right:W*k-12};
  const top=b.top/k,bot=b.bottom/k,mine=el&&el.classList.contains('mine'),pw=p.offsetWidth,ph=p.offsetHeight;
  let y=bot+6;if(y+ph>H-8)y=top-ph-6;if(y<8)y=Math.max(8,H-ph-8);
  let x=mine?b.right/k-pw:b.left/k;x=Math.max(8,Math.min(x,W-pw-8));
  p.style.left=x+'px';p.style.top=y+'px';if(el)el.classList.add('picked');
  const un=()=>{if(el)el.classList.remove('picked')};new MutationObserver((_,o)=>{if(!$('#mpop')){un();o.disconnect()}}).observe($('#layer'),{childList:true})}
function trSendSheet(t0){let res=null;const to=pref('chatTr','en');
  sheet(`<div class="stack"><h2>번역해서 보내기</h2>
    <div class="field"><label for="tsq">보낼 말 (한국어)</label><textarea id="tsq" rows="3">${esc(t0||'')}</textarea></div>
    <div class="field"><label for="tsl">언어</label><select id="tsl">${LANGS.map(([c,n])=>`<option value="${c}" ${c===to?'selected':''}>${n}</option>`).join('')}</select></div>
    <div id="tsr"></div><div class="actions"><button class="btn ghost" id="tsgo">번역 보기</button><button class="btn" id="tssend">보내기</button></div></div>`);
  $('#tsl').onchange=e=>{setPref('chatTr',e.target.value);res=null;$('#tsr').innerHTML=''};
  const run=async()=>{const v=$('#tsq').value.trim();if(!v)return null;res=await translate(v,'ko',$('#tsl').value);$('#tsr').innerHTML=`<div class="tr-out"><div class="tr-t" style="font-size:17px">${esc(res.t)}</div>${res.p?`<div class="tr-p">발음 · ${esc(res.p)}</div>`:''}</div>`;return res};
  $('#tsgo').onclick=()=>run().catch(e=>toast(aiErr(e).split('.')[0]));
  $('#tssend').onclick=async()=>{try{const v=$('#tsq').value.trim();if(!v)return;if(!res)await run();postMsg({text:res.t,orig:v,lang:$('#tsl').value});DRAFT='';close();renderMain()}catch(e){toast(aiErr(e).split('.')[0])}};
}

// 대화창 높이를 화면에 맞춤: 위쪽 위치부터 아래 칸 위까지. 키보드가 올라오면 아래 칸을 숨기고 다시 맞춤
function fitTalk(){const t=$('#talk');if(!t)return;const k=scale()||1,vv=window.visualViewport,vh=vv?vv.height:innerHeight;
  const kb=vv?vv.height<innerHeight*.8:false;document.body.classList.toggle('kbopen',kb);
  const tb=document.querySelector('.tabbar'),tbh=tb&&!kb?tb.getBoundingClientRect().height:0,top=t.getBoundingClientRect().top;
  t.style.height=Math.max(240,(vh-top-tbh-12)/k)+'px'}
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{if($('#talk')){fitTalk();const b=$('#clog');if(b)b.scrollTop=b.scrollHeight}});
addEventListener('resize',()=>{if($('#talk'))fitTalk()});
