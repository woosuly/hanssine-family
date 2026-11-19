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
  const N=7,AN=['🐶','🐱','🐰','🐷','🐵','🐥','🐼'],[K,T]={easy:[6,60],normal:[7,60],hard:[7,45]}[lvOf('pang')];
  let g=[],score=0,left=T,timer=0,started=false,busy=false,sel=-1,over=false;
  const rnd=()=>Math.floor(Math.random()*K),wait=ms=>new Promise(r=>setTimeout(r,ms));
  const sw=(i,j)=>{const t=g[i];g[i]=g[j];g[j]=t};
  const adj=(i,j)=>(Math.abs(i-j)===1&&Math.floor(i/N)===Math.floor(j/N))||Math.abs(i-j)===N;
  const runs=()=>{const m=new Set(),groups=[];
    for(const [step,lineStep] of [[1,N],[N,1]])for(let L=0;L<N;L++){let k=0;
      while(k<N){const at=q=>L*lineStep+q*step;let e=k;while(e+1<N&&g[at(e+1)]===g[at(k)]&&g[at(k)]>=0)e++;
        if(e-k>=2){const gr=[];for(let q=k;q<=e;q++){m.add(at(q));gr.push(at(q))}groups.push(gr)}k=e+1}}
    return {m,groups}};
  const hasMove=()=>{for(let i=0;i<N*N;i++)for(const j of [i+1,i+N]){if((j===i+1&&i%N===N-1)||j>=N*N)continue;sw(i,j);const ok=runs().m.size>0;sw(i,j);if(ok)return true}return false};
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
    <div class="pgbar"><i id="pgt"></i></div><div class="pgb" id="pgb"></div>
    <p class="muted" style="font-size:.78em;margin:.4em 0 0">동물을 옆 칸으로 밀거나, 두 칸을 차례로 누르면 자리가 바뀝니다. 첫 번째로 움직이면 시간이 갑니다. 4개·5개를 한 번에 맞추거나 연속으로 터지면 점수가 더 큽니다.</p>`,true,()=>{clearInterval(timer);over=true;gameMenu()});
  bindLv('pang',()=>{clearInterval(timer);over=true;gamePang()});paint();
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
const hwCard=(c,attr='',cls='')=>`<div class="hw ${c.t} ${cls}" ${attr}><b>${c.m}</b><i>${c.t==='g'?'<em>光</em>':c.t==='y'?HWY[c.m]:c.t==='t'?`<u class="rb ${c.rib}"></u>`:HWF[c.m]}</i><s>${c.t==='t'?HWR[c.rib]:HWN[c.t]}</s></div>`;
const hwName=c=>`${c.m}월 ${c.t==='t'?HWR[c.rib]:HWN[c.t]}`;
const piCnt=cap=>cap.reduce((a,x)=>a+(x.t==='p'?1:x.t==='pp'?2:0),0);
function mgScore(cap){const of=t=>cap.filter(x=>x.t===t),g=of('g'),y=of('y'),t=of('t'),pi=piCnt(cap),P=[];let s=0;
  if(g.length>=3){const v=g.length===5?15:g.length===4?4:g.some(x=>x.rain)?2:3;s+=v;P.push(`광 ${v}`)}
  if(y.length>=5){s+=y.length-4;P.push(`열끗 ${y.length-4}`)}
  if(y.filter(x=>x.bird).length===3){s+=5;P.push('고도리 5')}
  if(t.length>=5){s+=t.length-4;P.push(`띠 ${t.length-4}`)}
  ['hong','cheong','cho'].forEach(r=>{if(t.filter(x=>x.rib===r).length===3){s+=3;P.push(HWR[r]+' 3')}});
  if(pi>=10){s+=pi-9;P.push(`피 ${pi-9}`)}
  return {s,P,pi,g:g.length}}
function gameMatgo(){const lv=lvOf('matgo');
  let d;do{d=hwDeck().sort(()=>Math.random()-.5)}while([...Array(12)].some((_,m)=>d.slice(20,28).filter(x=>x.m===m+1).length===4));
  let hand=[d.slice(0,10),d.slice(10,20)],floor=d.slice(20,28),deck=d.slice(28),cap=[[],[]],go=[0,0],decl=[0,0],turn=0,busy=false,over=false,pick=null,ask=null,hot=[];
  let msg='내 차례입니다. 낼 패를 고르세요';
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const who=p=>p?'컴퓨터':'내';
  const V=(c,p)=>{let v=c.t==='g'?(c.rain?10:20):c.t==='y'?(c.bird?14:8):c.t==='t'?(c.rib!=='bi'?9:6):c.t==='pp'?7:4;
    if(lv==='hard'){const mine=cap[p];if(c.bird)v+=mine.filter(x=>x.bird).length*6;if(c.rib&&c.rib!=='bi')v+=mine.filter(x=>x.rib===c.rib).length*5;if(c.t==='g')v+=mine.filter(x=>x.t==='g').length*6;if(c.t==='p'||c.t==='pp')v+=piCnt(mine)>=7?3:0}
    return v};
  const steal=p=>{const o=cap[1-p];let i=o.findIndex(x=>x.t==='p');if(i<0)i=o.findIndex(x=>x.t==='pp');if(i>=0)cap[p].push(o.splice(i,1)[0])};
  const choose=(p,opts)=>{if(p===1)return Promise.resolve(opts.slice().sort((a,b)=>V(b,1)-V(a,1))[0]);
    return new Promise(r=>{pick={opts,res:r};msg='같은 달 패가 두 장이에요. 가져올 패를 누르세요';draw()})};
  const aiGo=sc=>{const opp=mgScore(cap[0]).s;return lv==='easy'?Math.random()<.5:lv==='normal'?deck.length>=6&&opp<5:deck.length>=8&&opp<4&&go[1]<3};
  const askGo=sc=>new Promise(r=>{ask={sc,res:r};msg=`${sc}점이 났어요. 고 또는 스톱을 고르세요`;draw()});
  const capView=cp=>`<div class="mgcap">${[['g','광'],['y','열끗'],['t','띠'],['p','피']].map(([k,n])=>{const a=cp.filter(x=>k==='p'?x.t==='p'||x.t==='pp':x.t===k);
    return `<div class="cg"><span>${n} <b class="num">${k==='p'?piCnt(cp):a.length}</b></span><div>${a.map(c=>hwCard(c,'','mini')).join('')}</div></div>`}).join('')}</div>`;
  const draw=()=>{const s0=mgScore(cap[0]),s1=mgScore(cap[1]),fl=[...floor].sort((a,b)=>a.m-b.m),H=hand[0].slice().sort((a,b)=>a.m-b.m||a.id-b.id);
    const myT=turn===0&&!busy&&!over&&!pick&&!ask;
    sheet(`${lvBar('matgo')}
      <div class="mgbar"><span>컴퓨터 · 손패 ${hand[1].length}장</span><b class="num">${s1.s}점${go[1]?` · ${go[1]}고`:''}</b></div>${capView(cap[1])}
      <div class="mgfloor">${fl.map(c=>{const pk=pick&&pick.opts.includes(c);return hwCard(c,pk?`data-pk="${c.id}"`:'',`${hot.includes(c.id)?'nw':''} ${pk?'pk':''}`)}).join('')}<div class="hw back"><b class="num">${deck.length}</b></div></div>
      <p class="mgmsg">${msg}</p>
      ${ask?`<div class="actions"><button class="btn" id="mggo">고 · 계속</button><button class="btn ghost" id="mgstop">스톱 · ${ask.sc}점으로 끝</button></div>`:''}
      ${capView(cap[0])}<div class="mgbar"><span>나</span><b class="num">${s0.s}점${go[0]?` · ${go[0]}고`:''}</b></div>
      <div class="mghand ${myT?'':'wait'}">${H.map(c=>hwCard(c,`data-hc="${c.id}"`,floor.some(x=>x.m===c.m)?'mt':'')).join('')}</div>
      <p class="muted" style="font-size:.75em;margin:.4em 0 0">숫자는 달(월)입니다. 바닥과 같은 달 패는 초록 테두리로 표시돼요. 7점부터 고·스톱을 고르고, 뻑·쪽·따닥·싹쓸이는 상대 피를 1장 가져옵니다.</p>`,true,()=>{over=true;gameMenu()});
    bindLv('matgo',()=>{over=true;gameMatgo()});
    document.querySelectorAll('[data-hc]').forEach(b=>b.onclick=()=>{if(turn!==0||busy||over||pick||ask)return;play(0,hand[0].find(x=>x.id===+b.dataset.hc))});
    document.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{if(!pick)return;const r=pick.res,c=pick.opts.find(x=>x.id===+b.dataset.pk);pick=null;r(c)});
    if(ask){$('#mggo').onclick=()=>{const r=ask.res;ask=null;r(true)};$('#mgstop').onclick=()=>{const r=ask.res;ask=null;r(false)}}
  };
  async function play(p,c){if(over)return;busy=true;const H=hand[p];H.splice(H.indexOf(c),1);let st=0,got=[];const note=[];
    const fm=floor.filter(x=>x.m===c.m);let placed=null,pend=null;
    if(!fm.length)placed=c;else if(fm.length===1)pend=[c,fm[0]];else if(fm.length===2)pend=[c,await choose(p,fm)];else{pend=[c,...fm];st++;note.push('뻑 먹기')}
    if(over)return;floor.push(c);hot=[c.id];msg=`${who(p)}가 ${hwName(c)}을(를) 냈어요`;draw();await wait(650);if(over)return;
    const f=deck.pop();floor.push(f);hot=[c.id,f.id];msg=`뒤집은 패: ${hwName(f)}`;draw();await wait(650);if(over)return;
    if(pend&&pend.length===2&&f.m===c.m){
      if(fm.length===1)note.push('뻑');else{got.push(...floor.filter(x=>x.m===c.m));st++;note.push('따닥')}
    }else{
      const fm2=floor.filter(x=>x.m===f.m&&x!==f&&!(pend&&pend.includes(x)));
      if(placed&&f.m===placed.m){got.push(placed,f);st++;note.push('쪽')}
      else if(fm2.length===1)got.push(f,fm2[0]);
      else if(fm2.length===2)got.push(f,await choose(p,fm2));
      else if(fm2.length===3){got.push(f,...fm2);st++;note.push('뻑 먹기')}
      if(pend)got.push(...pend)}
    if(over)return;
    got=[...new Set(got)];floor=floor.filter(x=>!got.includes(x));cap[p].push(...got);
    if(!floor.length&&deck.length){st++;note.push('싹쓸이')}
    for(let k=0;k<st;k++)steal(p);
    hot=[];msg=`${who(p)}가 ${got.length?got.length+'장 가져갔어요':'못 가져갔어요'}${note.length?' · '+note.join(' · ')+(st?` (피 ${st}장 가져옴)`:''):''}`;draw();await wait(600);if(over)return;
    const sc=mgScore(cap[p]).s,last=!hand[0].length&&!hand[1].length;
    if(sc>=7&&sc>decl[p]){const g1=last?false:p===1?aiGo(sc):await askGo(sc);if(over)return;
      if(!g1)return end(p);go[p]++;decl[p]=sc;msg=`${who(p)}가 ${go[p]}고!`;draw();await wait(800);if(over)return}
    if(last)return end(-1);
    turn=1-p;busy=false;msg=turn?'컴퓨터 차례…':'내 차례입니다. 낼 패를 고르세요';draw();if(turn===1)setTimeout(cpu,700)}
  function cpu(){if(over)return;const H=hand[1];let best=H[0],bv=-1e9;
    H.forEach(c=>{const fm=floor.filter(x=>x.m===c.m);
      let v=fm.length?V(c,1)+(fm.length===3?fm.reduce((a,x)=>a+V(x,1),0)+8:Math.max(...fm.map(x=>V(x,1)))):-V(c,1)*.4;
      if(lv!=='easy'&&!fm.length&&H.filter(x=>x.m===c.m).length>1)v+=3;
      if(lv==='hard'&&!fm.length)v-=V(c,0)*.3;
      v+=Math.random()*(lv==='easy'?14:2);if(v>bv){bv=v;best=c}});play(1,best)}
  function end(w){over=true;busy=false;draw();markLog('game',true);
    if(w<0)return setTimeout(()=>resultView('나가리 (무승부)',['패를 다 낼 때까지 아무도 스톱을 못 했어요',partLine()],'matgo',gameMatgo),900);
    const a=mgScore(cap[w]),b=mgScore(cap[1-w]),n=go[w],why=[];let pts=a.s,mul=1;
    if(n===1||n===2){pts+=n;why.push(`${n}고 +${n}`)}else if(n>=3){pts+=2;mul*=2**(n-2);why.push(`${n}고 ×${2**(n-2)}`)}
    if(a.pi>=10&&b.pi<7){mul*=2;why.push('피박 ×2')}
    if(a.g>=3&&b.g===0){mul*=2;why.push('광박 ×2')}
    if(go[1-w]>0){mul*=2;why.push('고박 ×2')}
    const total=pts*mul,lines=[`${w?'컴퓨터':'나'} <b class="num">${total}점</b>`,a.P.join(' · ')+(why.length?' · '+why.join(' · '):'')];
    if(w===0)lines.push(recLine('matgo',total));lines.push(partLine());
    setTimeout(()=>resultView(w?'컴퓨터가 이겼어요':'스톱! 이겼어요',lines,'matgo',gameMatgo),900)}
  draw();
}
