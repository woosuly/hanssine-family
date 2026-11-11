
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
function whoOf(by){if(by.startsWith('ai:')){const a=AIS[by.slice(3)];return {name:a[0],color:a[1],ai:true}}const m=mem(by);return m?{name:m.name,color:m.color}:{name:'?',color:'#888'}}
function chatLogHtml(){return (S.chat||[]).slice(-60).map(m=>chatMsgHtml(m)).join('')||'<div class="muted small" style="text-align:center;padding:20px">첫 메시지를 보내 보세요</div>'}
function bindSay(root){root.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>{const m=(S.chat||[]).find(x=>x.id===b.dataset.say);if(m)speak(m.text)})}
let DRAFT='';
function attHtml(m){const f=m.file;if(m.img)return `<button class="attimg" data-view="${m.id}"><img src="${m.img}" alt="사진"></button>`;
  if(!f)return '';if(isImg(f))return `<button class="attimg" data-view="${m.id}"><img src="${f.data}" alt="${esc(f.name)}"></button>`;
  if(isVid(f))return `<video class="attvid" src="${f.data}" controls preload="metadata"></video>`;
  if(isAud(f))return `<audio src="${f.data}" controls></audio>`;
  return `<button class="attfile" data-view="${m.id}"><span class="fic">${IC.clip}</span><span><b>${esc(f.name)}</b><span class="small muted">${fsize(f.size)}</span></span></button>`}
function chatMsgHtml(m){const mine=m.by===ME,w=whoOf(m.by);const a=m.act&&ACTS.find(x=>x[0]===m.act);
  const body=a?`<button class="actmsg" data-play="${a[0]}"><span class="ae">${a[2]}</span><span><b>${a[1]}</b><span class="small muted">눌러서 다시 보기</span></span></button>`
    :m.sticker?`<img class="stk" src="${sticker(m.sticker)}" alt="이모티콘">`
    :(m.img||m.file)?attHtml(m)+(m.text?`<div class="bub ${mine?'mine':''}">${esc(m.text)}</div>`:'')
    :`<div class="bub ${mine?'mine':''} ${w.ai?'aib':''}" data-mid="${esc(m.id)}">${esc(m.text)}${m.orig?`<span class="orig">${esc(m.orig)}</span>`:''}${w.ai&&!m.wait?`<button class="tts" data-say="${esc(m.id)}">읽어 주기</button>`:''}</div>`;
  return `<div class="cm ${mine?'mine':''}">${mine?'':`<span class="av ${w.ai?'aiav':''}" style="background:${w.color}">${w.ai?'AI':esc(w.name.slice(0,1))}</span>`}
    <div class="cmb">${mine?'':`<span class="cmn">${esc(w.name)}</span>`}${body}<span class="cmt">${hhmm(m.ts)}</span></div></div>`}
function postMsg(o){S.chat=S.chat||[];const m={id:uid(),by:ME,ts:Date.now(),...o};S.chat.push(m);save();return m}
async function postChat(text,stk){
  postMsg(stk?{sticker:stk}:{text});
  const at=text&&text.match(/@(Gemini|GPT|Claude)/i);if(!at)return;
  const prov={gemini:'gemini',gpt:'openai',claude:'claude'}[at[1].toLowerCase()];
  const r={id:uid(),by:'ai:'+prov,ts:Date.now(),text:'생각하고 있어요…',wait:true};S.chat.push(r);refreshChat();
  const hist=S.chat.filter(x=>x.text&&!x.wait).slice(-10).map(x=>({role:x.by.startsWith('ai:')?'ai':'user',text:(x.by.startsWith('ai:')?'':whoOf(x.by).name+': ')+x.text.replace(/@\S+\s?/,'')}));
  try{r.text=await callAI(aiSystem(true),hist,prov)}catch(e){r.text=aiErr(e)}delete r.wait;r.ts=Date.now();save();refreshChat()}
function refreshChat(){const box=$('#clog');if(box){box.innerHTML=chatLogHtml();box.scrollTop=box.scrollHeight;bindMsgs(box)}}
function talkView(){
  const fx=fxKind();
  return `<div class="talk" id="talk"><div class="row between"><h2>가족 대화</h2><button class="chip" id="fxc">효과 · ${FXS.find(x=>x[0]===pref('fx','off'))[1]}${pref('fx','off')==='auto'&&fx!=='off'?`(${FXS.find(x=>x[0]===fx)[1]})`:''}</button></div>
    <div class="clogw"><div class="clog" id="clog">${chatLogHtml()}</div><canvas class="fxc" id="fxcv"></canvas></div>
    <div class="atpick" id="atpick" hidden>${Object.entries(AIS).filter(([k])=>(aiCfg().keys||{})[k]||k===aiCfg().def).map(([k,[n,c]])=>`<button data-at="${n}"><span class="av aiav" style="background:${c}">AI</span>${n}${aiCfg().def===k?' <span class="small muted">기본</span>':''}</button>`).join('')}</div>
    <div class="emopanel" id="emop" hidden>${emoPanel()}</div>
    ${composer('k',{emoji:true,trans:false,ph:'메시지 · @로 AI 부르기',draft:DRAFT})}</div>`;
}
function bindTalk(){
  const talk=$('#talk');talk.style.height=Math.max(320,window.innerHeight/scale()-150)+'px';
  const box=$('#clog');box.scrollTop=box.scrollHeight;bindMsgs(box);
  startFx($('#fxcv'),fxKind());const pick=$('#atpick');
  const c=bindComposer('k',{onInput:v=>{DRAFT=v;pick.hidden=!/@\w*$/.test(v)},onPlus:()=>{$('#emop').hidden=true},
    onSend:t=>{DRAFT='';pick.hidden=true;postChat(t);refreshChat()},
    onFile:f=>{postMsg({file:f});refreshChat()},onEmoji:()=>{$('#emop').hidden=!$('#emop').hidden},onTrans:t=>trSendSheet(t)});
  document.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{c.q.value=c.q.value.replace(/@\w*$/,'')+'@'+b.dataset.at+' ';DRAFT=c.q.value;pick.hidden=true;c.q.focus()});
  bindEmo(id=>{postChat('',id);$('#emop').hidden=true;refreshChat()},e=>{c.q.value+=e;DRAFT=c.q.value},id=>{postMsg({act:id});$('#emop').hidden=true;refreshChat();playAct(id)});
  $('#fxc').onclick=()=>{sheet(`<div class="stack"><h2>대화 배경 효과</h2><div class="glist2">${FXS.map(([k,n])=>`<button data-fx="${k}" class="${pref('fx','off')===k?'on':''}">${n}${k==='auto'?' <span class="small muted">(오늘 날씨·계절에 맞춤)</span>':''}</button>`).join('')}</div></div>`);
    document.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{setPref('fx',b.dataset.fx);close();renderMain()})};
}
const TRM={};
function bindMsgs(root){bindSay(root);
  root.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playAct(b.dataset.play));
  root.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const m=(S.chat||[]).find(x=>x.id===b.dataset.view);if(m)viewFile(m.file||{data:m.img,type:'image/jpeg',name:'사진'})});
  root.querySelectorAll('[data-mid]').forEach(b=>b.onclick=e=>{if(e.target.closest('.tts'))return;msgMenu(b.dataset.mid)})}
function msgMenu(id){const m=(S.chat||[]).find(x=>x.id===id);if(!m||!m.text)return;
  const ko=/[가-힣]/.test(m.text),to=ko?pref('chatTr','en'):'ko',r=TRM[id+to];
  sheet(`<div class="stack"><div class="card" style="white-space:pre-wrap">${esc(m.text)}</div>
    ${ko?`<div class="row" style="gap:6px"><span class="small muted">번역할 언어</span><select id="mtl" class="chip">${LANGS.map(([c,n])=>`<option value="${c}" ${c===to?'selected':''}>${n}</option>`).join('')}</select></div>`:''}
    ${r?`<div class="tr-out"><div class="tr-t" style="font-size:17px">${esc(r.t)}</div>${r.p?`<div class="tr-p">발음 · ${esc(r.p)}</div>`:''}</div>`:''}
    <div class="actions"><button class="btn" id="mtr">${IC.trans}${r?'다시 번역':'번역'}</button><button class="btn ghost" id="mcp">${IC.copy}복사</button><button class="btn ghost" id="mtt">${IC.spk}읽기</button></div></div>`);
  if($('#mtl'))$('#mtl').onchange=e=>{setPref('chatTr',e.target.value);msgMenu(id)};
  $('#mtr').onclick=async()=>{$('#mtr').textContent='번역 중…';try{TRM[id+to]=await translate(m.text,ko?'ko':'auto',to);msgMenu(id)}catch(e){$('#mtr').textContent='번역';toast(aiErr(e).split('.')[0])}};
  $('#mcp').onclick=()=>{try{navigator.clipboard.writeText(m.text).then(()=>toast('복사했어요'),()=>toast('복사할 수 없습니다'))}catch(e){}};
  $('#mtt').onclick=()=>speakIn(r?r.t:m.text,r?(to==='ko'?'ko-KR':lg(to)[2]):'ko-KR');
}
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
