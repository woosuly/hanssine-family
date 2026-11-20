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
const hwCard=(c,attr='',cls='')=>`<div class="hw ${c.t} ${cls}" ${attr} aria-label="${hwName(c)}" style="background-image:url(img/hw/${c.id}.webp)">${c.t==='g'?'<em>光</em>':c.t==='pp'?'<em class="pp">쌍피</em>':''}</div>`;
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
      <div class="mgfloor">${[...new Set(fl.map(c=>c.m))].map(m=>`<div class="hstk">${fl.filter(c=>c.m===m).map(c=>{const pk=pick&&pick.opts.includes(c);return hwCard(c,pk?`data-pk="${c.id}"`:'',`${hot.includes(c.id)?'nw':''} ${pk?'pk':''}`)}).join('')}</div>`).join('')}<div class="hw back"><b class="num">${deck.length}</b></div></div>
      <p class="mgmsg">${msg}</p>
      ${ask?`<div class="actions"><button class="btn" id="mggo">고 · 계속</button><button class="btn ghost" id="mgstop">스톱 · ${ask.sc}점으로 끝</button></div>`:''}
      ${capView(cap[0])}<div class="mgbar"><span>나</span><b class="num">${s0.s}점${go[0]?` · ${go[0]}고`:''}</b></div>
      <div class="mghand ${myT?'':'wait'}">${H.map(c=>hwCard(c,`data-hc="${c.id}"`,floor.some(x=>x.m===c.m)?'mt':'')).join('')}</div>
      <p class="muted" style="font-size:.75em;margin:.4em 0 0">바닥과 같은 달 패는 초록 테두리로 표시되고, 낸 패는 같은 달 패 위에 겹쳐 놓입니다. 7점부터 고·스톱을 고르고, 뻑·쪽·따닥·싹쓸이는 상대 피를 1장 가져옵니다.</p>`,true,()=>{over=true;gameMenu()});
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
