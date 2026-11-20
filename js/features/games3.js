/* features/games3 — 가족 기록 순위, 애니팡, 맞고
   기록: S.grec = {놀이[_난이도]: {구성원id: {v, ts}}} — 사람마다 최고 기록 하나만 남김
   time: 짧을수록 위, score: 높을수록 위, win: 가족 대결 이긴 횟수 */
const RECK={numbers:'time',pairs:'time',mines:'time',freecell:'time',cross:'time',who:'score',g2048:'score',pang:'score',matgo:'score',bingo:'win',omok:'win'};
const recKeyL=(g,l)=>RECK[g]!=='win'&&LVG.includes(g)?g+'_'+l:g;
const recKey=g=>recKeyL(g,lvOf(g));
const fmtRec=(k,v)=>k==='time'?(v<60?`${v}초`:`${Math.floor(v/60)}분 ${Math.round(v%60*10)/10}초`):k==='score'?`${v}점`:`${v}승`;
const recList=(key,kind)=>Object.entries((S.grec||{})[key]||{}).filter(([id])=>mem(id)).map(([id,o])=>({id,v:o.v})).sort((a,b)=>kind==='time'?a.v-b.v:b.v-a.v);
const recMine=g=>{const o=((S.grec||{})[recKey(g)]||{})[ME];return o?o.v:null};
function recPut(g,v){const kind=RECK[g],key=recKey(g);S.grec=S.grec||{};const t=S.grec[key]=S.grec[key]||{};const old=t[ME]?t[ME].v:null;
  const better=kind==='win'||old==null||(kind==='time'?v<old:v>old);
  if(better){t[ME]={v:kind==='win'?(old||0)+1:v,ts:Date.now()};save()}
  const l=recList(key,kind);return {old,better,rank:l.findIndex(x=>x.id===ME)+1,n:l.length}}
function recLine(g,v){const kind=RECK[g],r=recPut(g,v);
  const head=r.old==null?'첫 기록이에요':r.better?`내 최고 기록 경신 (이전 ${fmtRec(kind,r.old)})`:`내 최고 기록 ${fmtRec(kind,r.old)}`;
  return `${head} · 가족 중 <b class="num">${r.rank}위</b>${r.n>1?` / ${r.n}명`:''}`}
function gameRanks(g0,l0){const ids=GAMES.map(x=>x[0]).filter(x=>RECK[x]);const g=g0&&RECK[g0]?g0:ids[0],l=l0||lvOf(g);
  const kind=RECK[g],hasL=kind!=='win'&&LVG.includes(g),list=recList(recKeyL(g,l),kind);
  sheet(`<h2>놀이 기록 순위</h2>
    <div class="rkg">${ids.map(x=>`<button data-rg="${x}" class="${x===g?'on':''}">${GAMES.find(y=>y[0]===x)[1]}</button>`).join('')}</div>
    ${hasL?`<div class="seg" id="rkseg" style="margin-top:.6em">${LV.map(([k,n])=>`<button data-v="${k}" class="${k===l?'on':''}">${n}</button>`).join('')}</div>`:''}
    <p class="muted" style="font-size:.8em;margin:.6em 0 .3em">${kind==='time'?'걸린 시간이 짧을수록 높은 순위':kind==='score'?'점수가 높을수록 높은 순위':'가족 대결에서 이긴 횟수'}</p>
    <div class="rk">${list.length?list.map((r,i)=>{const m=mem(r.id);return `<div class="rkr ${r.id===ME?'me':''}"><b class="num">${i+1}</b>${av(m)}<span>${esc(m.name)}</span><em class="num">${fmtRec(kind,r.v)}</em></div>`}).join(''):'<p class="muted">아직 기록이 없어요</p>'}</div>
    <div class="actions" style="margin-top:.8em"><button class="btn" id="rkplay">${GAMES.find(y=>y[0]===g)[1]} 하기</button></div>`,true,gameMenu);
  document.querySelectorAll('[data-rg]').forEach(b=>b.onclick=()=>gameRanks(b.dataset.rg));
  if(hasL)segBind('#rkseg',v=>gameRanks(g,v));
  $('#rkplay').onclick=()=>{if(hasL)setPref('lv_'+g,l);gameStart(g)};
}

// ── 애니팡: 7×7, 이웃한 두 칸을 바꿔 같은 동물 3개 이상 가로·세로로 ──
function gamePang(){
  // 쉬움 7×7·7종·45초, 보통 8×8·8종·45초, 어려움 9×9·9종·40초
  const AN=['🐶','🐱','🐰','🐷','🐵','🐥','🐼','🐸','🦊'],[N,K,T]={easy:[7,7,45],normal:[8,8,45],hard:[9,9,40]}[lvOf('pang')];
  let g=[],score=0,left=T,timer=0,started=false,busy=false,sel=-1,over=false,hintN=3;
  const rnd=()=>Math.floor(Math.random()*K),wait=ms=>new Promise(r=>setTimeout(r,ms));
  const sw=(i,j)=>{const t=g[i];g[i]=g[j];g[j]=t};
  const adj=(i,j)=>(Math.abs(i-j)===1&&Math.floor(i/N)===Math.floor(j/N))||Math.abs(i-j)===N;
  const runs=()=>{const m=new Set(),groups=[];
    for(const [step,lineStep] of [[1,N],[N,1]])for(let L=0;L<N;L++){let k=0;
      while(k<N){const at=q=>L*lineStep+q*step;let e=k;while(e+1<N&&g[at(e+1)]===g[at(k)]&&g[at(k)]>=0)e++;
        if(e-k>=2){const gr=[];for(let q=k;q<=e;q++){m.add(at(q));gr.push(at(q))}groups.push(gr)}k=e+1}}
    return {m,groups}};
  const findMove=()=>{for(let i=0;i<N*N;i++)for(const j of [i+1,i+N]){if((j===i+1&&i%N===N-1)||j>=N*N)continue;sw(i,j);const ok=runs().m.size>0;sw(i,j);if(ok)return [i,j]}return null};
  const hasMove=()=>!!findMove();
  const gen=()=>{do{g=[];for(let i=0;i<N*N;i++){let v;do{v=rnd()}while((i%N>=2&&g[i-1]===v&&g[i-2]===v)||(i>=2*N&&g[i-N]===v&&g[i-2*N]===v));g.push(v)}}while(!hasMove())};
  const paint=(pop,cb)=>{const el=$('#pgb');if(!el)return;
    el.innerHTML=g.map((v,i)=>`<div class="pc ${i===sel?'sel':''} ${pop&&pop.has(i)?'pop':''}" data-p="${i}">${v>=0?AN[v]:''}</div>`).join('');
    $('#pgs').textContent=score;$('#pgc').textContent=cb>1?cb+'연속!':''};
  const tick=()=>{if(!$('#pgb')){clearInterval(timer);return}left--;
    $('#pgt').style.width=Math.max(0,left/T*100)+'%';$('#pgl').textContent=Math.max(0,left)+'초';$('#pgt').classList.toggle('low',left<=10);
    if(left<=0){clearInterval(timer);if(!busy)finish()}};
  const finish=()=>{if(over)return;over=true;markLog('game',true);
    setTimeout(()=>resultView('시간이 다 됐어요',[`점수 <b class="num">${score}점</b>`,recLine('pang',score),partLine()],'pang',gamePang),500)};
  async function resolve(){let combo=0;
    while(true){const {m,groups}=runs();if(!m.size)break;combo++;
      let pts=0;groups.forEach(gr=>pts+=gr.length>=5?150:gr.length===4?60:30);score+=pts*combo;
      paint(m,combo);try{navigator.vibrate&&navigator.vibrate(20)}catch(e){}await wait(260);
      m.forEach(i=>g[i]=-1);
      for(let x=0;x<N;x++){const col=[];for(let y=N-1;y>=0;y--)if(g[y*N+x]>=0)col.push(g[y*N+x]);
        for(let y=N-1,k=0;y>=0;y--,k++)g[y*N+x]=k<col.length?col[k]:rnd()}
      paint(null,combo);await wait(200)}
    if(!hasMove()){toast('바꿀 곳이 없어서 다시 섞었어요');gen();paint()}}
  async function trySwap(i,j){if(busy||over||left<=0||!adj(i,j))return;
    if(!started){started=true;timer=setInterval(tick,1000)}
    busy=true;sel=-1;sw(i,j);paint();await wait(140);
    if(!runs().m.size){sw(i,j);paint();busy=false;return}
    await resolve();busy=false;if(left<=0)finish()}
  gen();
  sheet(`${lvBar('pang')}<div class="bhead" style="margin-top:.4em"><span class="turn">점수 <b class="num" id="pgs">0</b> <span id="pgc" class="pgc"></span></span>
      <span class="num" style="font-size:.85em">${recMine('pang')!=null?`내 최고 ${recMine('pang')}점 · `:''}<b id="pgl">${T}초</b></span></div>
    <div class="pgbar"><i id="pgt"></i></div><div class="pgb" id="pgb" style="grid-template-columns:repeat(${N},minmax(0,1fr))${N>7?`;font-size:${N>8?.78:.88}em`:''}"></div>
    <div class="actions" style="margin-top:.5em"><button class="btn ghost" id="pghint">힌트 (3번 남음)</button></div>
    <p class="muted" style="font-size:.78em;margin:.4em 0 0">동물을 옆 칸으로 밀거나, 두 칸을 차례로 누르면 자리가 바뀝니다. 첫 번째로 움직이면 시간이 갑니다. 4개·5개를 한 번에 맞추거나 연속으로 터지면 점수가 더 큽니다.</p>`,true,()=>{clearInterval(timer);over=true;gameMenu()});
  bindLv('pang',()=>{clearInterval(timer);over=true;gamePang()});paint();
  $('#pghint').onclick=()=>{if(busy||over||hintN<=0)return;const mv=findMove();if(!mv)return;hintN--;
    $('#pghint').textContent=hintN?`힌트 (${hintN}번 남음)`:'힌트 다 썼어요';$('#pghint').disabled=!hintN;
    mv.forEach(i=>{const c=$(`#pgb [data-p="${i}"]`);if(c)c.classList.add('hint')});};
  const el=$('#pgb');let si=-1,sx=0,sy=0,moved=false;
  el.addEventListener('pointerdown',e=>{const c=e.target.closest('[data-p]');if(!c)return;si=+c.dataset.p;sx=e.clientX;sy=e.clientY;moved=false;e.preventDefault()});
  el.addEventListener('pointermove',e=>{if(si<0||moved)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;moved=true;
    const x=si%N,j=Math.abs(dx)>Math.abs(dy)?(dx>0?(x<N-1?si+1:-1):(x>0?si-1:-1)):(dy>0?si+N:si-N);if(j>=0&&j<N*N)trySwap(si,j);si=-1});
  el.addEventListener('pointerup',()=>{if(si<0)return;const i=si;si=-1;if(moved||busy)return;
    if(sel<0||sel===i){sel=sel===i?-1:i;paint()}else if(adj(sel,i))trySwap(sel,i);else{sel=i;paint()}});
}

// ── 맞고: 화투 48장, 2인 고스톱 (7점부터 고·스톱) ──
// 광 g · 열끗 y · 띠 t · 피 p · 쌍피 pp
const HWT=[['g','t','p','p'],['y','t','p','p'],['g','t','p','p'],['y','t','p','p'],['y','t','p','p'],['y','t','p','p'],['y','t','p','p'],['g','y','p','p'],['y','t','p','p'],['y','t','p','p'],['g','p','p','pp'],['g','y','t','pp']];
const HWRIB={1:'hong',2:'hong',3:'hong',4:'cho',5:'cho',7:'cho',6:'cheong',9:'cheong',10:'cheong',12:'bi'};
const HWF=['','🌲','🌸','🌸','🍃','🌾','🌺','🍂','🌕','🌼','🍁','🌳','☔'];
const HWY={2:'🐦',4:'🐦',8:'🦢',5:'🌉',6:'🦋',7:'🐗',9:'🍶',10:'🦌',12:'🐦'};
const HWN={g:'광',y:'열끗',p:'피',pp:'쌍피'},HWR={hong:'홍단',cheong:'청단',cho:'초단',bi:'띠'};
const hwDeck=()=>{const o=[];HWT.forEach((ts,i)=>ts.forEach((t,k)=>o.push({id:i*4+k,m:i+1,t,rib:t==='t'?HWRIB[i+1]:null,bird:t==='y'&&[2,4,8].includes(i+1),rain:i===11&&t==='g'})));return o};
const hwCard=(c,attr='',cls='')=>c.m===0?`<div class="hw bonus ${cls}" ${attr} aria-label="${hwName(c)}"><i>★</i><b>${c.t==='b3'?'쓰리피':'쌍피'}</b><span>보너스</span></div>`:`<div class="hw ${c.t} ${cls}" ${attr} aria-label="${hwName(c)}" style="background-image:url(img/hw/${c.id}.webp)">${c.t==='g'?'<em>光</em>':c.t==='pp'?'<em class="pp">쌍피</em>':''}</div>`;
const hwName=c=>c.m===0?`보너스 ${c.t==='b3'?'쓰리피':'쌍피'}`:`${c.m}월 ${c.t==='t'?HWR[c.rib]:HWN[c.t]}`;
const piCnt=cap=>cap.reduce((a,x)=>a+(x.t==='p'?1:x.t==='pp'||x.t==='b2'?2:x.t==='b3'?3:0),0);
function mgScore(cap){const of=t=>cap.filter(x=>x.t===t),g=of('g'),y=of('y'),t=of('t'),pi=piCnt(cap),P=[];let s=0;
  if(g.length>=3){const v=g.length===5?15:g.length===4?4:g.some(x=>x.rain)?2:3;s+=v;P.push(`광 ${v}`)}
  if(y.length>=5){s+=y.length-4;P.push(`열끗 ${y.length-4}`)}
  if(y.filter(x=>x.bird).length===3){s+=5;P.push('고도리 5')}
  if(t.length>=5){s+=t.length-4;P.push(`띠 ${t.length-4}`)}
  ['hong','cheong','cho'].forEach(r=>{if(t.filter(x=>x.rib===r).length===3){s+=3;P.push(HWR[r]+' 3')}});
  if(pi>=10){s+=pi-9;P.push(`피 ${pi-9}`)}
  return {s,P,pi,g:g.length}}
// 보너스(조커) 패: 쌍피 2장(b2) · 쓰리피 1장(b3) — 내면 바로 가져가고 한 장 더 받아 다시 냄, 뒤집혀 나오면 가져가고 한 장 더 뒤집음
const hwBonus=()=>[{id:48,m:0,t:'b2'},{id:49,m:0,t:'b2'},{id:50,m:0,t:'b3'}];
// 효과: 화면 가운데 큰 글씨 + 터지는 조각, 폭탄은 화면 흔들림, 패 놓는 소리
let HWAC=null;
function hwSound(kind){if(!hwSndOn())return;try{HWAC=HWAC||new (window.AudioContext||window.webkitAudioContext)();const ac=HWAC,t=ac.currentTime;
  if(kind==='slap'){const n=ac.sampleRate*.08,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
    const s=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;g.gain.value=.5;s.buffer=b;s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);return}
  const notes=kind==='bomb'?[110,82]:kind==='win'?[523,659,784,1047]:kind==='lose'?[392,330,262]:[659,880];
  notes.forEach((hz,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=kind==='bomb'?'sawtooth':'triangle';o.frequency.value=hz;
    g.gain.setValueAtTime(.0001,t+i*.11);g.gain.exponentialRampToValueAtTime(.18,t+i*.11+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.11+(kind==='bomb'?.6:.25));
    o.connect(g);g.connect(ac.destination);o.start(t+i*.11);o.stop(t+i*.11+.7)})}catch(e){}}
function hwFx(text,kind='hit'){const box=document.createElement('div');box.className='hwfx '+kind;
  const em={bomb:'💥',bonus:'⭐',go:'🔥',win:'🎉',shake:'✋',lose:'💧'}[kind]||'✨';
  box.innerHTML=`<b>${text}</b>`+[...Array(kind==='lose'?0:16)].map((_,i)=>{const a=i/16*Math.PI*2,r=90+Math.random()*80;
    return `<i style="--x:${Math.cos(a)*r}px;--y:${Math.sin(a)*r}px;animation-delay:${Math.random()*.12}s">${em}</i>`}).join('');
  document.body.appendChild(box);setTimeout(()=>box.remove(),1500);
  if(kind==='bomb')document.querySelectorAll('.mgfloor,.mghand').forEach(l=>{l.classList.remove('hwquake');void l.offsetWidth;l.classList.add('hwquake')});
  try{navigator.vibrate&&navigator.vibrate(kind==='bomb'?[80,40,140]:kind==='win'?[60,40,60,40,120]:40)}catch(e){}
  hwSound(kind==='hit'||kind==='shake'||kind==='go'?'hit':kind)}
// 패 묶음 — 카드 id = HWALL 순번 (0~47 화투, 48~50 보너스). 대결 때는 id 배열로 주고받음
const HWALL=[...hwDeck(),...hwBonus()];
const hw4=(cards,m)=>cards.filter(x=>x.m===m).length===4;
function hwDeal(noChong){let d;
  do{d=HWALL.slice().sort(()=>Math.random()-.5)}while([...Array(12)].some((_,m)=>hw4(d.slice(20,28),m+1))||(noChong&&[0,1].some(p=>[...Array(12)].some((_,m)=>hw4(d.slice(p*10,p*10+10),m+1)))));
  const G={hand:[d.slice(0,10),d.slice(10,20)],floor:d.slice(20,28),deck:d.slice(28),cap:[[],[]],go:[0,0],decl:[0,0],shake:[0,0],pass:[0,0],turn:0};
  // 바닥에 깔린 보너스 패는 선이 가져가고 그 자리를 더미에서 채움
  while(G.floor.some(x=>x.m===0)){const b=G.floor.find(x=>x.m===0);G.floor.splice(G.floor.indexOf(b),1);G.cap[0].push(b);G.floor.push(G.deck.pop())}
  return G}
const hwPack=G=>{const ids=a=>a.map(c=>c.id);return JSON.stringify({...G,hand:G.hand.map(ids),floor:ids(G.floor),deck:ids(G.deck),cap:G.cap.map(ids)})};
const hwUnpack=s=>{const G=JSON.parse(s),cs=a=>a.map(i=>HWALL[i]);G.hand=G.hand.map(cs);G.floor=cs(G.floor);G.deck=cs(G.deck);G.cap=G.cap.map(cs);return G};
const hwSndOn=()=>pref('hwsnd',true)!==false;

// 맞고 첫 화면: 가족에게 대결 신청 또는 컴퓨터와
function matgoSetup(){const online=!LOCAL&&SYNC.live,opp=S.members.filter(x=>x.id!==ME);
  if(!online)return gameMatgo();
  sheet(`${lvBar('matgo')}<h2 style="margin-top:.5em">맞고 · 누구와 칠까요?</h2><p class="muted" style="font-size:.85em;margin:.2em 0 0">대결은 신청한 사람이 먼저 칩니다. 각자 자기 폰에서 내 패만 봅니다.</p>
    <div class="glist">${opp.map(o=>`<button data-mo="${o.id}"><b>${esc(o.name)}에게 대결 신청</b><span>${esc(o.name)} 폰에 알림이 갑니다</span></button>`).join('')}
    <button data-mo="cpu"><b>혼자 하기</b><span>컴퓨터와 대결 · ${lvName('matgo')}</span></button></div>`,true,gameMenu);
  bindLv('matgo',matgoSetup);
  document.querySelectorAll('[data-mo]').forEach(b=>b.onclick=async()=>{const id=b.dataset.mo;if(id==='cpu')return gameMatgo();b.disabled=true;
    try{const d=await gamesRef().add({type:'matgo',a:ME,b:id,s:hwPack(hwDeal(true)),seq:0,status:'invite',ts:Date.now()});matgoOnline(d.id)}
    catch(e){console.warn(e);toast('대결을 신청하지 못했어요');b.disabled=false}})}
function matgoOnline(gid){if(GUNSUB){GUNSUB();GUNSUB=null}let core=null,ended=false;
  const stop=()=>{if(GUNSUB){GUNSUB();GUNSUB=null}};
  const quit=d=>{stop();if(core)core.kill();if(d&&['invite','play'].includes(d.status))gamesRef().doc(gid).update({status:'cancel',by:ME}).catch(()=>{});gameMenu()};
  GUNSUB=gamesRef().doc(gid).onSnapshot(snap=>{if(ended)return;const d=snap.data();if(!d){stop();return}
    const role=d.a===ME?'a':'b',opp=mem(d[role==='a'?'b':'a'])||{name:'상대'};
    if(d.status==='invite'){sheet(`<div class="result"><div class="big">${esc(opp.name)} 기다리는 중</div><div class="fact">${esc(opp.name)} 폰에 "맞고 한 판 하실래요?" 알림을 보냈어요</div>
        <div class="actions"><button class="btn ghost" id="gcx">신청 취소</button></div></div>`,true,()=>quit(d));$('#gcx').onclick=()=>quit(d);return}
    if(['cancel','decline'].includes(d.status)){ended=true;stop();if(core)core.kill();const t=d.status==='decline'?`${opp.name}님이 다음에 하자고 했어요`:d.by===ME?'대결을 그만뒀어요':`${opp.name}님이 대결을 그만뒀어요`;
      sheet(`<div class="result"><div class="big">${esc(t)}</div><div class="actions"><button class="btn ghost" id="more">다른 놀이</button><button class="btn ghost" id="ok">처음 화면</button></div></div>`,true,gameMenu);
      $('#more').onclick=gameMenu;$('#ok').onclick=()=>{close();render()};return}
    if(!core)core=gameMatgo({gid,me:role==='a'?0:1,name:opp.name,quit:()=>quit(d)},d);else core.sync(d);
    if(d.status==='over'){ended=true;stop()}
  },e=>{console.warn('matgo',e);toast('대결 정보를 받지 못했어요')})}

// net: 대결이면 {gid, me(내 자리 0|1), name(상대 이름), quit}, 없으면 컴퓨터와
function gameMatgo(net,d0){const lv=lvOf('matgo'),cpuG=!net,me=net?net.me:0,op=1-me,oname=net?net.name:'컴퓨터';
  let G=net?hwUnpack(d0.s):hwDeal(false),seq=net?d0.seq||0:0;
  let busy=false,over=false,pick=null,ask=null,opt=null,hot=[];
  let msg=G.turn===me?'내 차례입니다. 낼 패를 고르세요':`${esc(oname)}님 차례…`;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const subj=p=>p===me?'내가':cpuG?'컴퓨터가':`${esc(oname)}님이`;
  const isB=c=>c.m===0;
  const V=(c,p)=>{if(isB(c))return 30;let v=c.t==='g'?(c.rain?10:20):c.t==='y'?(c.bird?14:8):c.t==='t'?(c.rib!=='bi'?9:6):c.t==='pp'?7:4;
    if(lv==='hard'){const mine=G.cap[p];if(c.bird)v+=mine.filter(x=>x.bird).length*6;if(c.rib&&c.rib!=='bi')v+=mine.filter(x=>x.rib===c.rib).length*5;if(c.t==='g')v+=mine.filter(x=>x.t==='g').length*6;if(c.t==='p'||c.t==='pp')v+=piCnt(mine)>=7?3:0}
    return v};
  const steal=p=>{const o=G.cap[1-p];let i=o.findIndex(x=>x.t==='p');if(i<0)i=o.findIndex(x=>x.t==='pp');if(i<0)i=o.findIndex(x=>isB(x));if(i>=0)G.cap[p].push(o.splice(i,1)[0])};
  const choose=(p,opts)=>{if(p!==me)return Promise.resolve(opts.slice().sort((a,b)=>V(b,p)-V(a,p))[0]);
    return new Promise(r=>{pick={opts,res:r};msg='같은 달 패가 두 장이에요. 가져올 패를 누르세요';draw()})};
  const askOpt=(text,opts)=>new Promise(r=>{opt={opts,res:r};msg=text;draw()});
  const aiGo=sc=>{const opp=mgScore(G.cap[0]).s;return lv==='easy'?Math.random()<.5:lv==='normal'?G.deck.length>=6&&opp<5:G.deck.length>=8&&opp<4&&G.go[1]<3};
  const capView=cp=>`<div class="mgcap">${[['g','광'],['y','열끗'],['t','띠'],['p','피']].map(([k,n])=>{const a=cp.filter(x=>k==='p'?['p','pp','b2','b3'].includes(x.t):x.t===k);
    return `<div class="cg"><span>${n} <b class="num">${k==='p'?piCnt(cp):a.length}</b></span><div>${a.map(c=>hwCard(c,'','mini')).join('')}</div></div>`}).join('')}</div>`;
  const tags=p=>[G.go[p]?`${G.go[p]}고`:'',G.shake[p]?`흔들기·폭탄 ${G.shake[p]}`:''].filter(Boolean).map(x=>` · ${x}`).join('');
  // 대결: 내 차례가 끝날 때 판 전체를 올리고, 상대 폰은 받은 판으로 다시 그림
  const push=(last,extra={})=>{if(!net)return Promise.resolve();seq++;
    return gamesRef().doc(net.gid).update({s:hwPack(G),seq,last:{...last,by:me},ts:Date.now(),...extra}).catch(e=>{console.warn(e);toast('판을 보내지 못했어요')})};
  const draw=()=>{if(over==='killed')return;const sm=mgScore(G.cap[me]),so=mgScore(G.cap[op]),fl=[...G.floor].sort((a,b)=>a.m-b.m),H=G.hand[me].slice().sort((a,b)=>a.m-b.m||a.id-b.id);
    const myT=G.turn===me&&!busy&&!over&&!pick&&!ask&&!opt;
    sheet(`<div class="mgtop">${cpuG?lvBar('matgo'):`<span class="mgvs">${esc(oname)}님과 대결</span>`}<button class="mgsnd" id="mgsnd" aria-label="소리 켜고 끄기">${hwSndOn()?'🔊':'🔇'}</button></div>
      <div class="mgbar"><span>${esc(oname)} · 손패 ${G.hand[op].length}장${G.pass[op]?` · 폭탄패 ${G.pass[op]}`:''}</span><b class="num">${so.s}점${tags(op)}</b></div>${capView(G.cap[op])}
      <div class="mgfloor">${[...new Set(fl.map(c=>c.m))].map(m=>`<div class="hstk">${fl.filter(c=>c.m===m).map(c=>{const pk=pick&&pick.opts.includes(c);return hwCard(c,pk?`data-pk="${c.id}"`:'',`${hot.includes(c.id)?'nw':''} ${pk?'pk':''}`)}).join('')}</div>`).join('')}<div class="hw back"><b class="num">${G.deck.length}</b></div></div>
      <p class="mgmsg">${msg}</p>
      ${ask?`<div class="actions"><button class="btn" id="mggo">고 · 계속</button><button class="btn ghost" id="mgstop">스톱 · ${ask.sc}점으로 끝</button></div>`:''}
      ${opt?`<div class="actions">${opt.opts.map(([v,t],i)=>`<button class="btn ${i?'ghost':''}" data-opt="${v}">${t}</button>`).join('')}</div>`:''}
      ${capView(G.cap[me])}<div class="mgbar"><span>나</span><b class="num">${sm.s}점${tags(me)}</b></div>
      <div class="mghand ${myT?'':'wait'}">${H.map(c=>{const n3=!isB(c)&&H.filter(x=>x.m===c.m).length>=3;return hwCard(c,`data-hc="${c.id}"`,`${G.floor.some(x=>x.m===c.m)?'mt':''} ${n3?'three':''}`)}).join('')}${G.pass[me]?`<div class="hw passc" data-pass="1"><b>뒤집기</b><span>폭탄패 ×${G.pass[me]}</span></div>`:''}</div>
      <p class="muted" style="font-size:.75em;margin:.4em 0 0">같은 달 패를 3장 들고 있으면(노란 표시) 흔들기(×2), 바닥에 같은 달이 1장 있으면 폭탄(3장 한꺼번에, ×2)을 할 수 있어요. 별 패는 보너스(조커)로 내면 바로 가져오고 한 장 더 받습니다.${net?' 뒤로 가면 대결을 그만둡니다.':''}</p>`,true,()=>{over='killed';net?net.quit():gameMenu()});
    if(cpuG)bindLv('matgo',()=>{over='killed';gameMatgo()});
    $('#mgsnd').onclick=()=>{setPref('hwsnd',!hwSndOn());$('#mgsnd').textContent=hwSndOn()?'🔊':'🔇'};
    document.querySelectorAll('[data-hc]').forEach(b=>b.onclick=()=>{if(!myT)return;tapHand(G.hand[me].find(x=>x.id===+b.dataset.hc))});
    if($('[data-pass]'))$('[data-pass]').onclick=()=>{if(!myT)return;play(me,null,'pass')};
    document.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{if(!pick)return;const r=pick.res,c=pick.opts.find(x=>x.id===+b.dataset.pk);pick=null;r(c)});
    document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{if(!opt)return;const r=opt.res;opt=null;r(b.dataset.opt)});
    if(ask){$('#mggo').onclick=()=>{const r=ask.res;ask=null;r(true)};$('#mgstop').onclick=()=>{const r=ask.res;ask=null;r(false)}}
  };
  const gone=()=>!!over;
  // 내 패 고르기: 보너스·폭탄·흔들기 확인
  async function tapHand(c){hwSound('slap');
    if(isB(c))return bonusPlay(me,c);
    const n=G.hand[me].filter(x=>x.m===c.m).length,f=G.floor.filter(x=>x.m===c.m).length;let shook=false;
    if(n>=3&&f===1){busy=true;const v=await askOpt(`${c.m}월 패가 3장이에요. 폭탄을 할까요?`,[['bomb','폭탄! (3장 한꺼번에)'],['one','한 장만 내기']]);busy=false;if(gone())return;if(v==='bomb')return play(me,c,'bomb')}
    else if(n>=3&&f===0){busy=true;const v=await askOpt(`${c.m}월 패가 3장이에요. 흔들까요? (이기면 ×2)`,[['shake','흔들기'],['one','그냥 내기']]);busy=false;if(gone())return;
      if(v==='shake'){G.shake[me]++;shook=true;hot=G.hand[me].filter(x=>x.m===c.m).map(x=>x.id);hwFx('흔들기!','shake');draw();await wait(900)}}
    play(me,c,'n',shook)}
  async function bonusPlay(p,c){busy=true;G.hand[p].splice(G.hand[p].indexOf(c),1);G.cap[p].push(c);
    if(G.deck.length)G.hand[p].push(G.deck.pop());
    msg=`${subj(p)} 보너스 패(${c.t==='b3'?'쓰리피':'쌍피'})를 가져왔어요 · 한 장 더 받아 다시 냅니다`;hwFx('보너스!','bonus');draw();
    await push({ids:[c.id],notes:['보너스'],msg});await wait(1100);if(gone())return;
    busy=false;msg=p===me?'한 장 더 내세요':`${cpuG?'컴퓨터':esc(oname)+'님'} 차례…`;draw();if(cpuG&&p===1)setTimeout(cpu,600)}
  async function play(p,c,mode,shook){if(gone())return;busy=true;let st=0,got=[];const note=shook?['흔들기']:[];let fm=[],placed=null,pend=null,ids=[];
    if(mode==='pass'){G.pass[p]--;hot=[];msg=`${subj(p)} 폭탄패로 뒤집기만 해요`;draw();await wait(500)}
    else if(mode==='bomb'){const three=G.hand[p].filter(x=>x.m===c.m);G.hand[p]=G.hand[p].filter(x=>x.m!==c.m);fm=G.floor.filter(x=>x.m===c.m);G.floor.push(...three);
      hot=three.map(x=>x.id);pend=[...three,...fm];st++;G.shake[p]++;G.pass[p]+=2;note.push('폭탄');msg=`${subj(p)} ${c.m}월 폭탄!`;draw();hwFx('폭탄!','bomb');await wait(1200)}
    else{G.hand[p].splice(G.hand[p].indexOf(c),1);fm=G.floor.filter(x=>x.m===c.m);
      if(!fm.length)placed=c;else if(fm.length===1)pend=[c,fm[0]];else if(fm.length===2)pend=[c,await choose(p,fm)];else{pend=[c,...fm];st++;note.push('뻑 먹기')}
      if(gone())return;G.floor.push(c);hot=[c.id];msg=`${subj(p)} ${hwName(c)}을(를) 냈어요`;draw();hwSound('slap');await wait(650)}
    if(gone())return;ids=hot.slice();
    let f=null;while(G.deck.length){const x=G.deck.pop();if(isB(x)){G.cap[p].push(x);note.push('보너스');msg=`보너스 패가 뒤집혀 ${subj(p)} 가져가요`;hwFx('보너스!','bonus');draw();await wait(1000);if(gone())return;continue}f=x;break}
    if(f){G.floor.push(f);hot=[...hot,f.id];ids=hot.slice();msg=`뒤집은 패: ${hwName(f)}`;draw();hwSound('slap');await wait(650);if(gone())return;
      if(mode==='n'&&pend&&pend.length===2&&f.m===c.m){
        if(fm.length===1)note.push('뻑');else{got.push(...G.floor.filter(x=>x.m===c.m));st++;note.push('따닥')}pend=null}
      else{const fm2=G.floor.filter(x=>x.m===f.m&&x!==f&&!(pend&&pend.includes(x)));
        if(placed&&f.m===placed.m){got.push(placed,f);st++;note.push('쪽')}
        else if(fm2.length===1)got.push(f,fm2[0]);
        else if(fm2.length===2)got.push(f,await choose(p,fm2));
        else if(fm2.length===3){got.push(f,...fm2);st++;note.push('뻑 먹기')}}}
    if(pend)got.push(...pend);
    if(gone())return;
    got=[...new Set(got)];G.floor=G.floor.filter(x=>!got.includes(x));G.cap[p].push(...got);
    if(!G.floor.length&&G.deck.length){st++;note.push('싹쓸이')}
    for(let k=0;k<st;k++)steal(p);
    hot=[];msg=`${subj(p)} ${got.length?got.length+'장 가져갔어요':'못 가져갔어요'}${note.filter(x=>x!=='보너스'&&x!=='흔들기').length?' · '+note.filter(x=>x!=='보너스'&&x!=='흔들기').join(' · ')+(st?` (피 ${st}장 가져옴)`:''):''}`;draw();
    const big=note.filter(x=>!['폭탄','보너스','흔들기'].includes(x));for(const t of big){hwFx(t+'!',t==='뻑'?'lose':'hit');await wait(900);if(gone())return}
    await wait(400);if(gone())return;
    const sc=mgScore(G.cap[p]).s,last=!G.hand[0].length&&!G.hand[1].length&&!G.pass[0]&&!G.pass[1];let goN=0;
    if(sc>=7&&sc>G.decl[p]){const g1=last?false:p!==me?aiGo(sc):await new Promise(r=>{ask={sc,res:r};msg=`${sc}점이 났어요. 고 또는 스톱을 고르세요`;draw()});if(gone())return;
      if(!g1)return end(p,null,{ids,notes:[...note,'스톱'],msg:`${subj(p)} ${sc}점에서 스톱!`});
      G.go[p]++;G.decl[p]=sc;goN=G.go[p];msg=`${subj(p)} ${G.go[p]}고!`;draw();hwFx(`${G.go[p]}고!`,'go');await wait(1100);if(gone())return}
    if(last)return end(-1,null,{ids,notes:note,msg});
    G.turn=1-p;if(!G.hand[G.turn].length&&!G.pass[G.turn])G.turn=p;
    const lastMsg=goN?`${subj(p)} ${goN}고!`:msg;
    busy=false;msg=G.turn===me?'내 차례입니다. 낼 패를 고르세요':`${cpuG?'컴퓨터':esc(oname)+'님'} 차례…`;draw();
    await push({ids,notes:goN?[...note,`${goN}고`]:note,msg:lastMsg});
    if(cpuG&&G.turn===1)setTimeout(cpu,700)}
  async function cpu(){if(gone())return;const H=G.hand[1];
    const b=H.find(isB);if(b)return bonusPlay(1,b);
    if(!H.length&&G.pass[1])return play(1,null,'pass');
    let best=H[0],bv=-1e9,mode='n',shook=false;
    H.forEach(c=>{const fm=G.floor.filter(x=>x.m===c.m),n=H.filter(x=>x.m===c.m).length;
      let v=fm.length?V(c,1)+(fm.length===3?fm.reduce((a,x)=>a+V(x,1),0)+8:Math.max(...fm.map(x=>V(x,1)))):-V(c,1)*.4;
      if(n>=3&&fm.length===1&&(lv!=='easy'||Math.random()<.5))v+=40;
      if(lv!=='easy'&&!fm.length&&n>1)v+=3;
      if(lv==='hard'&&!fm.length)v-=V(c,0)*.3;
      v+=Math.random()*(lv==='easy'?14:2);if(v>bv){bv=v;best=c}});
    if(!best)return;
    const n=H.filter(x=>x.m===best.m).length,f=G.floor.filter(x=>x.m===best.m).length;
    if(n>=3&&f===1&&bv>=30)mode='bomb';
    else if(n>=3&&f===0&&(lv!=='easy'||Math.random()<.5)){G.shake[1]++;shook=true;hot=H.filter(x=>x.m===best.m).map(x=>x.id);msg='컴퓨터가 흔들었어요!';draw();hwFx('흔들기!','shake');await wait(1000);if(gone())return}
    play(1,best,mode,shook)}
  // 결과: 점수 계산은 이긴 쪽 기준. 대결이면 결과도 같이 올림
  function score(w){const a=mgScore(G.cap[w]),b=mgScore(G.cap[1-w]),n=G.go[w],why=[];let pts=a.s,mul=1;
    if(n===1||n===2){pts+=n;why.push(`${n}고 +${n}`)}else if(n>=3){pts+=2;mul*=2**(n-2);why.push(`${n}고 ×${2**(n-2)}`)}
    if(G.shake[w]){mul*=2**G.shake[w];why.push(`흔들기·폭탄 ×${2**G.shake[w]}`)}
    if(a.pi>=10&&b.pi<7){mul*=2;why.push('피박 ×2')}
    if(a.g>=3&&b.g===0){mul*=2;why.push('광박 ×2')}
    if(G.go[1-w]>0){mul*=2;why.push('고박 ×2')}
    return {total:pts*mul,detail:a.P.join(' · ')+(why.length?' · '+why.join(' · '):''),why}}
  function showEnd(w,res){over=true;busy=false;draw();markLog('game',true);
    if(w<0){hwFx('나가리','lose');return setTimeout(()=>resultView('나가리 (무승부)',['패를 다 낼 때까지 아무도 스톱을 못 했어요',partLine()],'matgo',cpuG?gameMatgo:matgoSetup),1100)}
    const mine=w===me,lines=[`${mine?'나':esc(oname)} <b class="num">${res.total}점</b>`,res.detail];
    (res.why||[]).filter(x=>/박/.test(x)).forEach((x,i)=>setTimeout(()=>hwFx(x.replace(' ×2','!'),mine?'hit':'lose'),300+i*700));
    hwFx(mine?(res.special||'승리!'):`${cpuG?'컴퓨터':esc(oname)} 승`,mine?'win':'lose');if(mine)setTimeout(()=>hwSound('win'),200);else hwSound('lose');
    if(mine)lines.push(recLine('matgo',res.total));
    lines.push(partLine());
    setTimeout(()=>resultView(mine?'이겼어요':`${cpuG?'컴퓨터가':esc(oname)+'님이'} 이겼어요`,lines,'matgo',cpuG?gameMatgo:matgoSetup),1600)}
  async function end(w,special,last){let res=null;
    if(w>=0)res=special?{total:10,detail:`${special} — 처음 받은 패에 같은 달 4장`,special}:score(w);
    await push(last||{ids:[],notes:[],msg:''},{status:'over',winner:w,res});showEnd(w,res)}
  // 상대가 올린 판 받기: 놓인 패 표시 → 효과 → 내 차례
  async function sync(d){if(over||!d.seq||d.seq<=seq)return;seq=d.seq;G=hwUnpack(d.s);const L=d.last||{};
    hot=L.ids||[];msg=(L.msg||'').replace(/내가/g,`${esc(oname)}님이`);draw();hwSound('slap');
    for(const t of (L.notes||[])){hwFx(t+'!',t==='폭탄'?'bomb':t==='보너스'?'bonus':t==='뻑'?'lose':/고$/.test(t)?'go':t==='흔들기'?'shake':'hit');await wait(800)}
    if(d.status==='over')return showEnd(d.winner,d.res);
    hot=[];msg=G.turn===me?'내 차례입니다. 낼 패를 고르세요':`${esc(oname)}님 차례…`;draw()}
  draw();
  // 총통(컴퓨터와 할 때만): 처음 받은 패에 같은 달 4장이면 바로 이김
  if(cpuG)for(const p of [0,1]){const m=[...Array(12)].findIndex((_,i)=>hw4(G.hand[p],i+1));if(m>=0){setTimeout(()=>end(p,`${m+1}월 총통`),500);break}}
  return {sync,kill:()=>{over='killed'}}
}

// ── 낱말 가로세로: 낱말 창고에서 판을 그때그때 만듦 (난이도가 높을수록 낱말 수·판 크기 늘어남) ──
const CW_BANK=`바다:파도치는 넓고 짠 물|바지:두 다리에 꿰어 입는 옷|다리:강을 건너는 길, 또는 몸을 받치는 부분|자두:여름에 나는 새콤한 붉은 과일|거울:얼굴을 비춰 보는 물건|고래:바다에 사는 아주 큰 동물|이불:잘 때 덮는 것|우산:비 올 때 펴서 쓰는 것|사과:빨갛고 둥근 가을 과일|수박:여름에 먹는 초록 줄무늬 큰 과일|포도:송이로 열리는 보라색 과일|감자:땅속에서 캐는 둥근 덩이, 쪄 먹거나 볶아 먹음|배추:김치를 담그는 잎채소|시계:시간을 알려 주는 물건|가방:물건을 넣어 들고 다니는 것|모자:머리에 쓰는 것|신발:발에 신는 것|의자:앉을 때 쓰는 가구|기차:철길 위를 달리는 긴 차|자리:앉거나 설 수 있는 곳|사자:'백수의 왕'이라 불리는 동물|사진:카메라로 찍은 그림|가수:노래를 부르는 사람|수저:숟가락과 젓가락|나무:줄기와 가지가 있는 식물|나비:꽃 사이를 나는 날개 고운 곤충|하늘:머리 위로 보이는 넓은 공간|구름:하늘에 떠 있는 하얀 덩어리|마을:여러 집이 모여 사는 곳|가을:단풍이 드는 계절|겨울:눈이 오는 추운 계절|여름:가장 더운 계절|라면:꼬불꼬불한 면을 끓여 먹는 음식|김밥:김에 밥과 재료를 말아 썬 음식|부채:부쳐서 바람을 일으키는 물건|소리:귀로 듣는 것|노래:가락에 맞춰 부르는 것|도시:사람이 많이 모여 사는 큰 고장|시장:물건을 사고파는 곳|장미:가시가 있는 붉은 꽃|미소:소리 없이 빙긋 웃는 웃음|가지:보라색 길쭉한 채소, 또는 나무에서 뻗은 줄기|지구:우리가 사는 별|구두:가죽으로 만든 신|두부:콩으로 만든 하얀 음식|부모:아버지와 어머니|모기:여름밤 피를 빠는 곤충|기린:목이 아주 긴 동물|이사:사는 곳을 옮기는 일|사위:딸의 남편|위로:슬픈 사람의 마음을 달래 줌|자식:아들과 딸|식사:밥을 먹는 일|사랑:아끼고 위하는 마음|누나:남동생이 손위 여자 형제를 부르는 말|나라:국가|오리:꽥꽥 우는 물새|리본:선물 포장에 묶는 끈 장식|기억:지난 일을 잊지 않고 떠올림|고기:소·돼지 등의 살|기름:참기름·들기름처럼 미끈한 액체|마늘:쪽으로 나뉘는 매운 양념 채소|양말:발에 신는 천|말씀:'말'의 높임말|고추:빨갛고 매운 채소|추석:음력 8월 15일 명절|석류:알알이 붉은 씨가 든 과일|설날:음력 1월 1일 명절|날씨:비·바람·기온 같은 그날의 하늘 상태|씨앗:싹이 트는 식물의 씨|약국:약을 파는 곳|국수:가늘고 긴 면 음식|수건:몸이나 얼굴을 닦는 천|건강:몸과 마음이 튼튼함|강물:강에 흐르는 물|치마:다리가 갈라지지 않은 여자 아래옷|마당:집 앞뒤의 평평한 빈 땅|당근:주황색 뿌리채소|근처:가까운 곳|처음:맨 앞|음식:먹고 마시는 것|식구:한집에 사는 가족|구멍:뚫어진 자리|명절:설·추석 같은 큰 날|편지:종이에 써서 보내는 글|지도:땅의 모양을 줄여 그린 그림|도로:차가 다니는 길|주사:바늘로 몸에 약을 넣는 일|사탕:달고 딱딱한 과자|수영:물에서 헤엄치는 운동|영화:극장에서 보는 움직이는 이야기|화분:꽃을 심어 기르는 그릇|분수:물을 뿜어 올리는 장치|수도:나라의 중심 도시, 또는 물이 나오는 시설|도장:이름을 새겨 찍는 것|장갑:손에 끼는 것|차표:기차·버스를 탈 때 사는 표|표정:얼굴에 나타난 마음|정원:꽃과 나무를 가꾸는 뜰|숭늉:밥 지은 솥에 물을 부어 끓인 물|이마:눈썹 위 얼굴 부분|마음:생각하고 느끼는 곳|음악:소리로 만든 예술|악수:손을 잡고 하는 인사|박수:손뼉을 침|수첩:들고 다니며 적는 작은 공책|가위:종이나 천을 자르는 도구|보리:보리차를 만드는 곡식|고향:태어나 자란 곳|향기:좋은 냄새|기분:마음의 상태|분홍:흰빛이 섞인 연한 빨강|홍시:말랑하게 잘 익은 감|시골:도시에서 떨어진 마을|골목:집 사이의 좁은 길|목욕:몸을 씻는 일|욕실:씻는 방|실내:방이나 건물 안|내일:오늘 다음 날|일기:날마다 적는 글|기침:목에서 '콜록' 하는 것|침대:누워 자는 가구|대문:집의 큰 문|문어:다리가 여덟 개인 바다 동물|어깨:목과 팔 사이|소금:짠맛을 내는 하얀 가루|요리:음식을 만드는 일|인사:만나거나 헤어질 때 하는 예절|사슴:뿔이 멋진 숲속 동물|나팔:불어서 소리 내는 금관 악기|팔찌:손목에 끼는 장신구|연필:나무로 된 필기도구|필통:연필을 넣는 통|통장:은행에 맡긴 돈이 적힌 책|장마:여름에 오래 내리는 비|마차:말이 끄는 수레|차례:순서, 또는 명절에 조상께 지내는 제사|약속:서로 하기로 정한 것|속담:옛날부터 전해 오는 짧은 말|담요:털 등으로 짠 덮개|가족:부모·자식·형제로 이루어진 집안|족발:돼지 발을 삶은 음식|발목:발과 다리를 잇는 부분|무궁화:우리나라 꽃|화요일:월요일 다음 날|일기장:하루 있었던 일을 적는 공책|장독대:장독을 올려놓는 곳|대나무:마디가 있고 곧게 자라는 나무|무지개:비 갠 뒤 하늘에 뜨는 일곱 빛깔 띠|지우개:연필 글씨를 지우는 물건|할머니:아버지의 어머니|개나리:봄에 피는 노란 꽃|고구마:겨울에 구워 먹는 땅속 덩이|고등어:등이 푸른 생선, 구이로 많이 먹음|자전거:두 바퀴로 발을 굴러 타는 것|고양이:"야옹" 하고 우는 동물|소나무:사철 푸른 바늘잎 나무|도자기:흙으로 빚어 구운 그릇|라디오:소리로 방송을 듣는 기계|물고기:물속에 사는 동물|탕수육:튀긴 고기에 새콤달콤한 소스를 얹은 음식|원숭이:바나나를 좋아하는 동물|갑자기:생각할 새 없이 급히|자동차:바퀴로 길을 달리는 차|리모컨:멀리서 텔레비전을 켜고 끄는 것|깨소금:볶은 깨에 소금을 넣어 빻은 것|금요일:목요일 다음 날|목도리:목에 두르는 것|아버지:나를 낳아 주신 남자 어른|어머니:나를 낳아 주신 여자 어른|비빔밥:밥에 나물과 고추장을 넣어 비벼 먹는 음식|냉장고:음식을 차게 보관하는 기계|도서관:책을 빌려 보는 곳|관광지:구경하러 가는 이름난 곳|지하철:땅속으로 다니는 전철|철새:계절 따라 옮겨 사는 새|새우:등이 굽은 바다 동물, 튀김으로 많이 먹음|우체국:편지와 소포를 보내는 곳|국화:가을에 피는 꽃|화장실:볼일 보는 곳|대통령:나라를 대표하는 사람|영수증:값을 치렀다는 종이|생일:태어난 날|일요일:토요일 다음 날|수요일:화요일 다음 날|월요일:한 주를 시작하는 날|목요일:수요일 다음 날|토요일:금요일 다음 날|미나리:물가에서 자라는 향긋한 나물|호랑이:줄무늬가 있는 큰 맹수|이야기:어떤 일을 말해 주는 것|기와집:기와로 지붕을 얹은 집|집안일:빨래·청소 같은 집의 일|안경:눈에 쓰는 것|경찰:질서를 지키는 사람|찰떡:차지고 쫀득한 떡|떡국:설날에 먹는 음식|국밥:국에 밥을 만 음식|밥상:밥을 차려 놓는 상|상추:고기를 싸 먹는 잎채소|추위:추운 기운|위치:놓여 있는 자리|치약:칫솔에 짜서 이를 닦는 것|약초:약이 되는 풀|초가집:짚으로 지붕을 얹은 옛집|가마솥:밥 짓는 큰 무쇠 솥|솥뚜껑:솥을 덮는 것|손자:아들이나 딸의 아들|손녀:아들이나 딸의 딸|자장면:춘장으로 비벼 먹는 면|면도기:수염을 깎는 것|기러기:줄지어 나는 가을 철새|기차역:기차를 타는 곳|역사:지난날의 일|사다리:높은 곳을 오르는 도구|카메라:사진을 찍는 기계|면허증:운전할 수 있다는 증명|증거:사실을 밝히는 근거|거북이:등딱지가 있는 느린 동물|이웃:가까이 사는 집|웃음:웃는 것|음료수:마시는 물이나 주스|수영장:헤엄치는 곳|장날:시장이 서는 날|날개:새가 나는 데 쓰는 것|개구리:'개굴개굴' 우는 동물|손수건:들고 다니는 작은 수건|건물:사람이 쓰려고 지은 집|물감:그림에 색을 칠하는 것|감기:콧물·기침이 나는 흔한 병|기념일:특별한 일을 기억하는 날|일출:해가 뜸|출근:일터로 나감|근육:몸을 움직이는 힘살|육지:바다가 아닌 땅|지갑:돈을 넣는 것|옷장:옷을 넣어 두는 가구|장모님:아내의 어머니|장인어른:아내의 아버지|어른:다 자란 사람|은행:돈을 맡기는 곳|행주:그릇이나 상을 닦는 천|주말:토요일과 일요일|꿀벌:꿀을 모으는 벌|산책:천천히 걷는 일|책상:공부하는 상|상자:물건을 담는 네모난 것|자장가:아기를 재우는 노래|가요:대중이 즐겨 부르는 노래|요금:쓴 값으로 내는 돈|금반지:금으로 만든 반지|지붕:집 위를 덮는 것|보름달:음력 15일에 뜨는 둥근 달|달걀:닭이 낳은 알|등산:산에 오르는 일|산소:숨 쉬는 데 필요한 기체, 또는 조상의 무덤|소풍:바깥에 놀러 나가는 일|풍선:바람을 넣어 부풀린 것|선물:남에게 주는 물건|물병:물을 담는 병|병원:아플 때 가는 곳|원두막:참외밭을 지키는 다락집|막걸리:쌀로 빚은 하얀 술|김치:배추를 절여 양념한 음식|비누:거품 내어 씻는 것|누룽지:솥 바닥에 눌은 밥|지렁이:땅속에 사는 길쭉한 동물|이발소:머리를 깎는 곳|소주:투명한 우리 술|주전자:물을 끓이거나 따르는 그릇|자연:사람이 만들지 않은 산·강·바다|연못:물이 고인 못|연꽃:연못에 피는 꽃|꽃병:꽃을 꽂는 병|병아리:닭의 새끼|아리랑:대표적인 우리 민요|기타:줄을 튕기는 악기|타조:가장 큰 새|조개:껍데기가 둘인 바다 동물|개미:줄지어 다니는 작은 곤충|미역국:생일에 먹는 국|할아버지:아버지의 아버지|고속도로:차가 빠르게 달리는 큰길|해바라기:해를 따라 도는 노란 꽃|대한민국:우리나라 이름|윷놀이:명절에 윷을 던지는 놀이|줄넘기:줄을 돌려 넘는 운동|숨바꼭질:숨고 찾는 놀이|비행기:하늘을 나는 탈것|전화기:전화를 거는 기계|사진관:사진을 찍어 주는 가게|소방차:불을 끄러 가는 차|구급차:아픈 사람을 병원에 싣고 가는 차|차례상:명절에 조상께 차리는 상|상다리:상을 받치는 다리|다리미:옷의 주름을 펴는 것|미끄럼틀:비탈을 미끄러져 내려오는 놀이 기구|세탁기:빨래하는 기계|기상청:날씨를 알려 주는 기관|청소기:먼지를 빨아들이는 기계|기와:지붕에 얹는 구운 흙판|와이셔츠:양복 안에 입는 셔츠|주머니:옷에 달린 물건 넣는 곳|머리:목 위의 부분|리어카:사람이 끄는 짐수레`.split('|').map(x=>{const [a,q]=x.split(':');return {a,q}});
function cwGen(n,maxW,maxH){
  let best=null;
  for(let tr=0;tr<40;tr++){
    const bank=CW_BANK.slice().sort(()=>Math.random()-.5),grid={},words=[],used=new Set();
    const get=(r,c)=>grid[r+','+c];
    const fits=(a,r,c,d)=>{const dr=d==='d'?1:0,dc=d==='a'?1:0;let cross=0;
      if(get(r-dr,c-dc)||get(r+dr*a.length,c+dc*a.length))return -1;
      for(let k=0;k<a.length;k++){const rr=r+dr*k,cc=c+dc*k,x=get(rr,cc);
        if(x){if(x.ch!==a[k]||x[d])return -1;cross++}
        else if(get(rr+dc,cc+dr)||get(rr-dc,cc-dr))return -1}
      const rs=Object.keys(grid).map(k=>+k.split(',')[0]).concat([r,r+dr*(a.length-1)]),cs=Object.keys(grid).map(k=>+k.split(',')[1]).concat([c,c+dc*(a.length-1)]);
      if(Math.max(...rs)-Math.min(...rs)+1>maxH||Math.max(...cs)-Math.min(...cs)+1>maxW)return -1;
      return cross};
    const put=(w,r,c,d)=>{const dr=d==='d'?1:0,dc=d==='a'?1:0;[...w.a].forEach((ch,k)=>{const key=(r+dr*k)+','+(c+dc*k);grid[key]=grid[key]||{ch};grid[key][d]=1});words.push({a:w.a,q:w.q,r,c,d});used.add(w.a)};
    const first=bank.find(w=>w.a.length>=3);put(first,0,0,'a');
    let grew=true;while(words.length<n&&grew){grew=false;let cand=null;
      for(const w of bank){if(used.has(w.a))continue;
        for(const key of Object.keys(grid)){const x=grid[key],[r0,c0]=key.split(',').map(Number);
          for(let k=0;k<w.a.length;k++){if(w.a[k]!==x.ch)continue;
            for(const d of ['a','d']){if(x[d])continue;const r=d==='d'?r0-k:r0,c=d==='a'?c0-k:c0,s=fits(w.a,r,c,d);
              if(s>0){const sc=s*10+w.a.length+Math.random()*3;if(!cand||sc>cand.sc)cand={w,r,c,d,sc}}}}}
        if(cand&&cand.sc>=20)break}
      if(cand){put(cand.w,cand.r,cand.c,cand.d);grew=true}}
    if(!best||words.length>best.words.length)best={words:words.slice()};if(words.length>=n)break}
  const r0=Math.min(...best.words.map(w=>w.r)),c0=Math.min(...best.words.map(w=>w.c));
  best.words.forEach(w=>{w.r-=r0;w.c-=c0});best.words.sort((x,y)=>x.r-y.r||x.c-y.c);
  best.w=Math.max(...best.words.map(w=>w.c+(w.d==='a'?w.a.length:1)));best.h=Math.max(...best.words.map(w=>w.r+(w.d==='d'?w.a.length:1)));
  return best}
