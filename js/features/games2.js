/* features/games2 — 빙고 원격 대결, 지뢰찾기, 프리셀, 2048
   빙고 대결: families/hanssine/games/{id} {type:'bingo', a:신청한 사람, b:상대, n, goal, status:invite|play|over|cancel|decline,
             called:[부른 숫자], turn:'a'|'b', lines:{a,b}, winner:'a'|'b'|'draw', ts}
   각자 자기 판은 자기 폰에만 있고, 부른 숫자와 줄 수만 주고받음 */
const gamesRef=()=>famRef().collection('games');
const GBOARD={};let GUNSUB=null,GINV=null;const GSEEN=new Set();
const bingoLv=()=>({easy:[3,1],normal:[4,2],hard:[5,3]}[lvOf('bingo')]);

function bingoSetup(){
  const [n,goal]=bingoLv(),online=!LOCAL&&SYNC.live;
  const opp=S.members.filter(x=>x.id!==ME);
  sheet(`${lvBar('bingo')}<h2 style="margin-top:.5em">빙고 · 누구와 할까요?</h2><p class="muted" style="font-size:.85em;margin:.2em 0 0">${n}×${n} 판, 먼저 ${goal}줄을 만들면 이깁니다. 각자 자기 폰에서 내 판만 봅니다.</p>
    <div class="glist">${online?opp.map(o=>`<button data-op="${o.id}"><b>${esc(o.name)}에게 대결 신청</b><span>${esc(o.name)} 폰에 알림이 갑니다</span></button>`).join(''):''}
    <button data-op="cpu"><b>혼자 하기</b><span>컴퓨터와 대결</span></button></div>`,true,gameMenu);
  bindLv('bingo',bingoSetup);
  document.querySelectorAll('[data-op]').forEach(b=>b.onclick=async()=>{const id=b.dataset.op;
    if(id==='cpu')return bingo('컴퓨터',false);
    b.disabled=true;
    try{const d=await gamesRef().add({type:'bingo',a:ME,b:id,n,goal,status:'invite',called:[],turn:'a',lines:{a:0,b:0},ts:Date.now()});bingoOnline(d.id)}
    catch(e){console.warn(e);toast('대결을 신청하지 못했어요');b.disabled=false}});
}

// 대결 화면: 문서가 바뀔 때마다 다시 그림
function bingoOnline(gid){if(GUNSUB){GUNSUB();GUNSUB=null}
  let waitT=0,done=false,claim=false;
  const stop=()=>{if(GUNSUB){GUNSUB();GUNSUB=null}clearTimeout(waitT)};
  const quit=d=>{stop();if(d&&['invite','play'].includes(d.status))gamesRef().doc(gid).update({status:'cancel',by:ME}).catch(()=>{});gameMenu()};
  GUNSUB=gamesRef().doc(gid).onSnapshot(snap=>{if(done)return;const d=snap.data();if(!d){stop();return}
    const role=d.a===ME?'a':'b',other=role==='a'?'b':'a',opp=mem(d[other])||{name:'상대'},n=d.n,N=n*n;
    if(!GBOARD[gid])GBOARD[gid]=[...Array(N)].map((_,i)=>i+1).sort(()=>Math.random()-.5);
    const mine=GBOARD[gid],called=new Set(d.called||[]);
    const R=[...Array(n).keys()],mk=i=>called.has(mine[i]);
    const whoCalled=x=>{const i=(d.called||[]).indexOf(x);return i<0?null:(i%2===0?'a':'b')};
    let ln=0;R.forEach(r=>{if(R.every(k=>mk(r*n+k)))ln++});R.forEach(k=>{if(R.every(r=>mk(r*n+k)))ln++});
    if(R.every(i=>mk(i*n+i)))ln++;if(R.every(i=>mk(i*n+(n-1-i))))ln++;
    if(d.status==='invite'){
      sheet(`<div class="result"><div class="big">${esc(opp.name)} 기다리는 중</div><div class="fact">${esc(opp.name)} 폰에 "빙고 한 판 하실래요?" 알림을 보냈어요</div>
        <p class="muted" style="font-size:.8em" id="gwait">상대가 수락하면 바로 시작합니다</p><div class="actions"><button class="btn ghost" id="gcx">신청 취소</button></div></div>`,true,()=>quit(d));
      $('#gcx').onclick=()=>quit(d);
      clearTimeout(waitT);waitT=setTimeout(()=>{if($('#gwait'))$('#gwait').textContent='아직 응답이 없어요. 상대가 앱을 열면 신청이 보입니다.'},60e3);return}
    if(['cancel','decline'].includes(d.status)){done=true;stop();
      const t=d.status==='decline'?`${opp.name}님이 다음에 하자고 했어요`:d.by===ME?'대결을 그만뒀어요':`${opp.name}님이 대결을 그만뒀어요`;
      sheet(`<div class="result"><div class="big">${esc(t)}</div><div class="actions"><button class="btn ghost" id="more">다른 놀이</button><button class="btn ghost" id="ok">처음 화면</button></div></div>`,true,gameMenu);
      $('#more').onclick=gameMenu;$('#ok').onclick=()=>{close();render()};return}
    if(d.status==='play'){
      if((d.lines||{})[role]!==ln)gamesRef().doc(gid).update({['lines.'+role]:ln}).catch(()=>{});
      if(ln>=d.goal&&!claim){claim=true;firebase.firestore().runTransaction(async tx=>{const s=await tx.get(gamesRef().doc(gid));const x=s.data();
          if(x.status==='play')tx.update(gamesRef().doc(gid),{status:'over',winner:role,overAt:(x.called||[]).length,['lines.'+role]:ln});
          else if(x.status==='over'&&x.winner!==role&&x.overAt===(x.called||[]).length)tx.update(gamesRef().doc(gid),{winner:'draw'})}).catch(()=>{claim=false})}}
    const over=d.status==='over',myTurn=d.turn===role&&d.status==='play';
    const lastN=(d.called||[]).at(-1),lastBy=d.turn===role?opp.name:'내가';
    sheet(`<div class="bhead"><span class="turn">${over?'끝':myTurn?'내 차례':esc(opp.name)+' 차례'}</span>
        <span class="num" style="font-size:.85em">나 <b>${ln}</b>줄 · ${esc(opp.name)} <b>${(d.lines||{})[other]||0}</b>줄 · 목표 ${d.goal}줄</span></div>
      <p class="muted" style="font-size:.85em;margin:0 0 .4em">${lastN?`${lastBy===`내가`?'내가':esc(lastBy)+'님이'} ${lastN}을(를) 불렀어요. `:''}${over?'':myTurn?'부를 숫자를 누르세요':esc(opp.name)+'님 폰에서 고르는 중…'}</p>
      <div class="bingo" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${mine.map(x=>`<button data-b="${x}" class="${called.has(x)?'mk '+(whoCalled(x)===role?'bme':'bop'):''} ${x===lastN?'last':''}" style="font-size:${n>4?1.15:1.5}em" ${called.has(x)||!myTurn?'disabled':''}>${x}</button>`).join('')}</div>${bLegend(opp.name)}
      <p class="muted" style="font-size:.75em;margin:.5em 0 0">상대 판은 보이지 않습니다. 뒤로 가면 대결을 그만둡니다.</p>`,true,()=>quit(d));
    document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-b]').forEach(x=>x.disabled=true);const x=+b.dataset.b;
      firebase.firestore().runTransaction(async tx=>{const s=await tx.get(gamesRef().doc(gid));const v=s.data();
        if(v.status!=='play'||v.turn!==role||(v.called||[]).includes(x))return;
        tx.update(gamesRef().doc(gid),{called:[...(v.called||[]),x],turn:other,ts:Date.now()})}).catch(e=>{console.warn(e);toast('보내지 못했어요')})});
    if(over){done=true;stop();const w=d.winner;markLog('game',true);
      const t=w==='draw'?'비겼어요':w===role?'빙고! 이겼어요':`${opp.name} 빙고`;
      setTimeout(()=>resultView(t,[`나 ${ln}줄 · ${esc(opp.name)} ${(d.lines||{})[other]||0}줄`,`부른 숫자 <b class="num">${called.size}개</b>`,partLine()],'bingo',bingoSetup),1300)}
  },e=>{console.warn('game',e);toast('대결 정보를 받지 못했어요')});
}

// 나에게 온 대결 신청 듣기 (앱 시작 때)
function gamesListen(){if(GINV){GINV();GINV=null}if(LOCAL||!SYNC.live||!ME)return;const me0=ME;
  GINV=gamesRef().where('b','==',ME).where('status','==','invite').onSnapshot(qs=>{if(ME!==me0)return;
    qs.docs.forEach(doc=>{const d=doc.data();if(GSEEN.has(doc.id)||Date.now()-d.ts>30*60e3)return;GSEEN.add(doc.id);
      try{navigator.vibrate&&navigator.vibrate([120,60,120])}catch(e){}gameInvite(doc.id,d)})},e=>console.warn('games',e))}
function gameInvite(gid,d){const who=mem(d.a)||{name:'가족'},om=d.type==='omok';
  sheet(`<div class="result"><div class="big">${esc(who.name)}님의 ${om?'오목':'빙고'} 대결 신청</div><div class="fact">${om?`${d.size||OM_N}×${d.size||OM_N} 판 · ${esc(who.name)}님이 흑(먼저)`:`${d.n}×${d.n} 판 · 먼저 ${d.goal}줄`}</div>
    <div class="actions"><button class="btn ghost" id="gno">다음에</button><button class="btn" id="gyes">한 판 하기</button></div></div>`,true,null);
  $('#gno').onclick=()=>{gamesRef().doc(gid).update({status:'decline'}).catch(()=>{});close();render()};
  $('#gyes').onclick=async()=>{try{const s=await gamesRef().doc(gid).get();const x=s.data();
      if(!x||x.status!=='invite'){toast('신청이 취소됐어요');close();return}
      await gamesRef().doc(gid).update({status:'play',ts:Date.now()});(x.type==='omok'?omokOnline:bingoOnline)(gid)}catch(e){console.warn(e);toast('시작하지 못했어요')}}}
async function gameFromPush(id){try{const s=await gamesRef().doc(id).get();const d=s.data();if(d&&d.b===ME&&d.status==='invite'){GSEEN.add(id);gameInvite(id,d)}}catch(e){}}

// ── 지뢰찾기 ──
function gameMines(){
  const [W,H,M]={easy:[8,8,8],normal:[9,11,15],hard:[10,13,24]}[lvOf('mines')];
  let cells=null,flagMode=false,over=false,t0=0,open=0;
  const nb=i=>{const x=i%W,y=Math.floor(i/W),o=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const a=x+dx,b=y+dy;if(a>=0&&a<W&&b>=0&&b<H)o.push(b*W+a)}return o};
  const lay=first=>{const safe=new Set([first,...nb(first)]);const idx=[...Array(W*H).keys()].filter(i=>!safe.has(i)).sort(()=>Math.random()-.5).slice(0,M);
    cells=[...Array(W*H)].map(()=>({m:false,o:false,f:false,n:0}));idx.forEach(i=>cells[i].m=true);cells.forEach((c,i)=>c.n=nb(i).filter(j=>cells[j].m).length);t0=performance.now()};
  const flags=()=>cells?cells.filter(c=>c.f).length:0;
  const reveal=i=>{const st=[i];while(st.length){const j=st.pop(),c=cells[j];if(c.o||c.f)continue;c.o=true;open++;if(!c.n&&!c.m)nb(j).forEach(k=>{if(!cells[k].o)st.push(k)})}};
  const draw=()=>{
    sheet(`${lvBar('mines')}<div class="bhead" style="margin-top:.5em"><span class="turn">지뢰 ${M}개</span><span class="num" style="font-size:.85em">깃발 ${flags()} / ${M}</span></div>
      <div class="mgrid" style="grid-template-columns:repeat(${W},minmax(0,1fr))">${[...Array(W*H).keys()].map(i=>{const c=cells?cells[i]:{};
        return `<button data-m="${i}" class="${c.o?'op':''} ${c.o&&c.m?'boom':''} ${c.f&&!c.o?'fl':''}" ${over&&!c.m?'disabled':''}>${c.o?(c.m?'●':c.n||''):c.f?'⚑':''}</button>`}).join('')}</div>
      <div class="actions" style="margin-top:.6em"><button class="btn ${flagMode?'':'ghost'}" id="mflag">${flagMode?'깃발 꽂는 중 (누르면 열기로)':'깃발 꽂기'}</button></div>
      <p class="muted" style="font-size:.78em;margin:.3em 0 0">숫자는 주변 8칸에 있는 지뢰 수입니다. 길게 눌러도 깃발을 꽂을 수 있어요.</p>`,true,gameMenu);
    bindLv('mines',gameMines);
    $('#mflag').onclick=()=>{flagMode=!flagMode;draw()};
    document.querySelectorAll('[data-m]').forEach(b=>{const i=+b.dataset.m;let lp=0,long=false;
      b.onpointerdown=()=>{long=false;lp=setTimeout(()=>{long=true;tap(i,true)},450)};b.onpointerup=b.onpointerleave=()=>clearTimeout(lp);
      b.onclick=()=>{if(long)return;tap(i,flagMode)}});
  };
  const tap=(i,flag)=>{if(over)return;if(!cells){if(flag)return;lay(i)}const c=cells[i];
    if(flag){if(!c.o){c.f=!c.f;try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}}draw();return}
    if(c.f)return;
    if(c.o&&c.n){const nf=nb(i).filter(j=>cells[j].f).length;if(nf===c.n)nb(i).forEach(j=>{if(!cells[j].f&&!cells[j].o){if(cells[j].m)c.boom=j;reveal(j)}})}
    else reveal(i);
    const hit=cells.some(x=>x.o&&x.m);
    if(hit){over=true;cells.forEach(x=>{if(x.m)x.o=true});draw();markLog('game',true);
      setTimeout(()=>resultView('아쉬워요, 지뢰를 밟았어요',[`연 칸 <b class="num">${cells.filter(x=>x.o&&!x.m).length}</b> / ${W*H-M}`,partLine()],'mines',gameMines),1100);return}
    if(cells.filter(x=>x.o&&!x.m).length===W*H-M){over=true;cells.forEach(x=>{if(x.m)x.f=true});draw();markLog('game',true);
      const sec=Math.round((performance.now()-t0)/1000),key='mb_'+lvOf('mines'),best=pref(key,0);if(!best||sec<best)setPref(key,sec);
      setTimeout(()=>resultView('모두 찾았어요',[`걸린 시간 <b class="num">${sec}초</b>`,best&&sec>=best?`최고 기록 ${best}초`:'최고 기록이에요',partLine()],'mines',gameMines),700);return}
    draw()};
  draw();
}

// ── 프리셀 ──
function gameFreecell(){
  const SU=['♠','♥','♦','♣'],RK=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'],red=c=>c.s===1||c.s===2;
  let cols,free,found,sel=null,hist=[],moves=0;
  const deal=()=>{const d=[];for(let s=0;s<4;s++)for(let r=1;r<=13;r++)d.push({r,s});d.sort(()=>Math.random()-.5);
    cols=[[],[],[],[],[],[],[],[]];d.forEach((c,i)=>cols[i%8].push(c));free=[null,null,null,null];found=[0,0,0,0];sel=null;hist=[];moves=0};
  const snap=()=>hist.push(JSON.stringify({cols,free,found,moves}));
  const runLen=col=>{let n=1;for(let i=col.length-1;i>0;i--){const a=col[i-1],b=col[i];if(a.r===b.r+1&&red(a)!==red(b))n++;else break}return col.length?n:0};
  const cap=toEmpty=>{const ef=free.filter(x=>!x).length,ec=cols.filter(c=>!c.length).length-(toEmpty?1:0);return (ef+1)*Math.pow(2,Math.max(0,ec))};
  const fits=(card,col)=>!col.length||(col.at(-1).r===card.r+1&&red(col.at(-1))!==red(card));
  const toFound=c=>found[c.s]===c.r-1;
  const auto=()=>{let mv=true;while(mv){mv=false;
    const safe=c=>c.r<=2||(red(c)?Math.min(found[0],found[3]):Math.min(found[1],found[2]))>=c.r-1;
    for(const col of cols){const c=col.at(-1);if(c&&toFound(c)&&safe(c)){found[c.s]=c.r;col.pop();mv=true}}
    for(let i=0;i<4;i++){const c=free[i];if(c&&toFound(c)&&safe(c)){found[c.s]=c.r;free[i]=null;mv=true}}}};
  const cardHtml=(c,attr,cls='')=>`<div class="pcard ${red(c)?'red':''} ${cls}" ${attr}><b>${RK[c.r]}</b><i>${SU[c.s]}</i></div>`;
  const draw=()=>{
    const isSel=(k,i,j)=>sel&&sel.k===k&&sel.i===i&&(k!=='c'||j>=cols[i].length-sel.n);
    sheet(`<div class="bhead"><span class="turn">프리셀</span><span class="num" style="font-size:.85em">이동 ${moves}</span></div>
      <div class="fctop"><div class="fcrow">${free.map((c,i)=>`<div class="fslot" data-fr="${i}">${c?cardHtml(c,`data-fr="${i}"`,isSel('f',i)?'sel':''):''}</div>`).join('')}</div>
        <div class="fcrow">${found.map((r,s)=>`<div class="fslot fnd" data-fd="${s}">${r?cardHtml({r,s},`data-fd="${s}"`):`<span class="${s===1||s===2?'red':''}">${SU[s]}</span>`}</div>`).join('')}</div></div>
      <div class="fccols">${cols.map((col,i)=>`<div class="fccol" data-col="${i}">${col.map((c,j)=>cardHtml(c,`data-col="${i}" data-j="${j}"`,isSel('c',i,j)?'sel':'')).join('')}</div>`).join('')}</div>
      <div class="actions" style="margin-top:.6em"><button class="btn ghost" id="fcu" ${hist.length?'':'disabled'}>되돌리기</button><button class="btn ghost" id="fcn">새 판</button></div>
      <p class="muted" style="font-size:.78em;margin:.3em 0 0">카드를 누른 뒤 옮길 곳을 누르세요. 같은 카드를 한 번 더 누르면 위쪽 칸으로 올라갑니다.</p>`,true,gameMenu);
    $('#fcu').onclick=()=>{const h=JSON.parse(hist.pop());cols=h.cols;free=h.free;found=h.found;moves=h.moves;sel=null;draw()};
    $('#fcn').onclick=()=>{deal();draw()};
    document.querySelectorAll('[data-col]').forEach(el=>el.onclick=e=>{e.stopPropagation();const i=+el.dataset.col,j=el.dataset.j===undefined?null:+el.dataset.j;tapCol(i,j)});
    document.querySelectorAll('[data-fr]').forEach(el=>el.onclick=e=>{e.stopPropagation();tapFree(+el.dataset.fr)});
    document.querySelectorAll('[data-fd]').forEach(el=>el.onclick=e=>{e.stopPropagation();tapFound()});
  };
  const take=()=>sel.k==='f'?[free[sel.i]]:cols[sel.i].slice(cols[sel.i].length-sel.n);
  const drop=()=>{if(sel.k==='f')free[sel.i]=null;else cols[sel.i].splice(cols[sel.i].length-sel.n)};
  const done=()=>{moves++;sel=null;auto();draw();
    if(found.every(r=>r===13)){markLog('game',true);const key='fcb',best=pref(key,0);if(!best||moves<best)setPref(key,moves);
      setTimeout(()=>resultView('다 올렸어요',[`이동 <b class="num">${moves}번</b>`,best&&moves>=best?`최고 기록 ${best}번`:'최고 기록이에요',partLine()],null,gameFreecell),500)}};
  const quick=()=>{const cs=take();if(cs.length===1&&toFound(cs[0])){snap();drop();found[cs[0].s]=cs[0].r;return done()}
    if(sel.k==='c'&&cs.length===1){const fi=free.findIndex(x=>!x);if(fi>=0){snap();drop();free[fi]=cs[0];return done()}}
    sel=null;draw()};
  function tapCol(i,j){const col=cols[i];
    if(sel){if(sel.k==='c'&&sel.i===i){quick();return}
      const cs=take();
      // 옮길 수 있는 만큼만 (빈 줄이면 가능한 길이로 맞춤)
      let mv=cs;if(sel.k==='c'&&!col.length){mv=cs.slice(-Math.min(cs.length,cap(true)))}
      if(mv.length<=cap(!col.length)&&fits(mv[0],col)){snap();if(sel.k==='f')free[sel.i]=null;else cols[sel.i].splice(cols[sel.i].length-mv.length);col.push(...mv);return done()}
      if(j!==null&&col.length){sel=null;tapCol(i,j);return}
      toast('거기로는 옮길 수 없어요');sel=null;draw();return}
    if(!col.length)return;const k=j===null?col.length-1:j,n=col.length-k;
    if(n>runLen(col)){toast('색이 번갈아 이어진 카드만 함께 옮길 수 있어요');return}
    sel={k:'c',i,n};draw()}
  function tapFree(i){if(sel){if(sel.k==='f'&&sel.i===i){quick();return}
      const cs=take();if(!free[i]&&cs.length===1){snap();drop();free[i]=cs[0];return done()}sel=null;draw();return}
    if(free[i]){sel={k:'f',i,n:1};draw()}}
  function tapFound(){if(!sel)return;const cs=take();if(cs.length===1&&toFound(cs[0])){snap();drop();found[cs[0].s]=cs[0].r;return done()}toast('그 카드는 아직 올릴 수 없어요');sel=null;draw()}
  deal();auto();draw();
}

// ── 2048 ──
function game2048(){
  let g=[...Array(16)].fill(0),score=0,over=false;
  const add=()=>{const e=g.map((v,i)=>v?-1:i).filter(i=>i>=0);if(e.length)g[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4};
  const lineIdx=d=>[0,1,2,3].map(k=>[0,1,2,3].map(m=>d==='l'?k*4+m:d==='r'?k*4+3-m:d==='u'?m*4+k:(3-m)*4+k));
  const move=d=>{if(over)return;let moved=false;
    lineIdx(d).forEach(ix=>{const v=ix.map(i=>g[i]).filter(Boolean),o=[];for(let i=0;i<v.length;i++){if(v[i]===v[i+1]){o.push(v[i]*2);score+=v[i]*2;i++}else o.push(v[i])}
      while(o.length<4)o.push(0);ix.forEach((i,k)=>{if(g[i]!==o[k])moved=true;g[i]=o[k]})});
    if(!moved)return;add();
    const can=g.includes(0)||g.some((v,i)=>(i%4<3&&v===g[i+1])||(i<12&&v===g[i+4]));
    draw();if(!can){over=true;markLog('game',true);const best=pref('b2048',0);if(score>best)setPref('b2048',score);
      setTimeout(()=>resultView('더 움직일 수 없어요',[`점수 <b class="num">${score}</b> · 가장 큰 수 ${Math.max(...g)}`,score>best?'최고 점수예요':`최고 점수 ${best}`,partLine()],null,game2048),700)}};
  const draw=()=>{sheet(`<div class="bhead"><span class="turn">2048</span><span class="num" style="font-size:.85em">점수 ${score} · 최고 ${pref('b2048',0)}</span></div>
      <div class="g48" id="g48">${g.map(v=>`<div class="t t${Math.min(v,4096)}">${v||''}</div>`).join('')}</div>
      <div class="g48k"><span></span><button data-d="u" aria-label="위">▲</button><span></span><button data-d="l" aria-label="왼쪽">◀</button><button data-d="d" aria-label="아래">▼</button><button data-d="r" aria-label="오른쪽">▶</button></div>
      <p class="muted" style="font-size:.78em;margin:.3em 0 0">판을 밀거나 화살표를 누르세요. 같은 숫자가 만나면 합쳐집니다.</p>`,true,gameMenu);
    document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>move(b.dataset.d));
    const el=$('#g48');let sx=0,sy=0;el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
    el.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
    el.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
      move(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'))})};
  add();add();draw();
}

// ── 오목: 13×13, 흑(먼저)·백, 다섯 개 이상 이으면 승리 ──
// 대결: games/{id} {type:'omok', a(흑), b(백), size, moves:[칸 번호], turn, status, winner, line:[이긴 다섯 칸]}
const OM_N=13;
function omWin(st,i,n){const x=i%n,y=Math.floor(i/n),c=st[i];if(!c)return null;
  for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){const L=[i];
    for(const s of [1,-1]){let k=1;while(true){const a=x+dx*k*s,b=y+dy*k*s;if(a<0||b<0||a>=n||b>=n||st[b*n+a]!==c)break;L.push(b*n+a);k++}}
    if(L.length>=5)return L}return null}
const omStones=(moves,n)=>{const st=Array(n*n).fill(0);moves.forEach((m,k)=>st[m]=k%2===0?1:2);return st};
// 컴퓨터: 빈칸마다 '내가 두면'·'상대가 두면' 이어지는 정도를 점수로 매겨 가장 좋은 칸
function omAI(st,n,me,lv){const op=me===1?2:1,cand=[];
  const near=i=>{const x=i%n,y=Math.floor(i/n);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<n&&b<n&&st[b*n+a])return true}return false};
  const score=(i,c)=>{const x=i%n,y=Math.floor(i/n);let s=0;
    for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let cnt=1,open=0;
      for(const sg of [1,-1]){let k=1;while(true){const a=x+dx*k*sg,b=y+dy*k*sg;if(a<0||b<0||a>=n||b>=n)break;const v=st[b*n+a];if(v===c){cnt++;k++;continue}if(!v)open++;break}}
      s+=cnt>=5?1e6:cnt===4?(open===2?1e5:open?1e4:0):cnt===3?(open===2?5e3:open?400:0):cnt===2?(open===2?200:open?30:0):open?5:0}return s};
  st.forEach((v,i)=>{if(v||!near(i))return;const a=score(i,me),d=score(i,op);cand.push([i,Math.max(a*1.1,d*(lv==='easy'?0.6:1))+Math.random()])});
  if(!cand.length)return Math.floor(n*n/2);
  cand.sort((p,q)=>q[1]-p[1]);const top=lv==='easy'?cand.slice(0,4):lv==='normal'?cand.slice(0,2):cand.slice(0,1);
  return top[Math.floor(Math.random()*top.length)][0]}
function omBoard(st,n,o){const last=o.last,line=new Set(o.line||[]);
  return `<div class="omok" style="--n:${n}">${st.map((v,i)=>`<button data-om="${i}" ${v||o.lock?'disabled':''} aria-label="${i%n+1}열 ${Math.floor(i/n)+1}줄">${v?`<i class="st ${v===1?'bk':'wt'} ${i===last?'last':''} ${line.has(i)?'win':''}"></i>`:''}</button>`).join('')}</div>`}
function gameOmok(){const online=!LOCAL&&SYNC.live,opp=S.members.filter(x=>x.id!==ME);
  sheet(`${lvBar('omok')}<h2 style="margin-top:.5em">오목 · 누구와 할까요?</h2><p class="muted" style="font-size:.85em;margin:.2em 0 0">13×13 판에 가로·세로·대각선으로 다섯 개를 먼저 이으면 이깁니다. 대결은 신청한 사람이 흑(먼저)입니다.</p>
    <div class="glist">${online?opp.map(o=>`<button data-oo="${o.id}"><b>${esc(o.name)}에게 대결 신청</b><span>${esc(o.name)} 폰에 알림이 갑니다</span></button>`).join(''):''}
    <button data-oo="cpu"><b>혼자 하기</b><span>컴퓨터와 대결 · ${lvName('omok')}</span></button></div>`,true,gameMenu);
  bindLv('omok',gameOmok);
  document.querySelectorAll('[data-oo]').forEach(b=>b.onclick=async()=>{const id=b.dataset.oo;if(id==='cpu')return omokCpu();b.disabled=true;
    try{const d=await gamesRef().add({type:'omok',a:ME,b:id,size:OM_N,moves:[],turn:'a',status:'invite',ts:Date.now()});omokOnline(d.id)}catch(e){console.warn(e);toast('대결을 신청하지 못했어요');b.disabled=false}})}
function omokCpu(){const n=OM_N,lv=lvOf('omok');let moves=[],over=false,busy2=false;
  const draw=()=>{const st=omStones(moves,n),meTurn=moves.length%2===0&&!over;
    sheet(`<div class="bhead"><span class="turn">${over?'끝':meTurn?'내 차례 · 흑':'컴퓨터 생각 중…'}</span><span class="num" style="font-size:.85em">${moves.length}수 · ${lvName('omok')}</span></div>
      ${omBoard(st,n,{last:moves.at(-1),line:over&&over.line,lock:!meTurn})}
      <div class="blg"><span><i class="bk"></i>나 (흑)</span><span><i class="wt"></i>컴퓨터 (백)</span></div>
      <div class="actions" style="margin-top:.5em"><button class="btn ghost" id="omu" ${moves.length<2||over?'disabled':''}>한 수 무르기</button><button class="btn ghost" id="omn">새 판</button></div>`,true,gameOmok);
    $('#omu').onclick=()=>{moves=moves.slice(0,-2);draw()};$('#omn').onclick=()=>{moves=[];over=false;draw()};
    document.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{if(!meTurn||busy2)return;put(+b.dataset.om)})};
  const end=(t,line)=>{over={line};draw();markLog('game',true);setTimeout(()=>resultView(t,[`${moves.length}수`,partLine()],'omok',omokCpu),1400)};
  const put=i=>{const st=omStones(moves,n);if(st[i])return;moves.push(i);const s2=omStones(moves,n),w=omWin(s2,i,n);if(w)return end('이겼어요',w);
    if(moves.length>=n*n)return end('비겼어요',[]);busy2=true;draw();
    setTimeout(()=>{const s3=omStones(moves,n),j=omAI(s3,n,2,lv);moves.push(j);busy2=false;const w2=omWin(omStones(moves,n),j,n);if(w2)return end('컴퓨터가 이겼어요',w2);draw()},500)};
  draw()}
function omokOnline(gid){if(GUNSUB){GUNSUB();GUNSUB=null}let ended=false;
  const stop=()=>{if(GUNSUB){GUNSUB();GUNSUB=null}};
  const quit=d=>{stop();if(d&&['invite','play'].includes(d.status))gamesRef().doc(gid).update({status:'cancel',by:ME}).catch(()=>{});gameMenu()};
  GUNSUB=gamesRef().doc(gid).onSnapshot(snap=>{if(ended)return;const d=snap.data();if(!d){stop();return}
    const role=d.a===ME?'a':'b',other=role==='a'?'b':'a',opp=mem(d[other])||{name:'상대'},n=d.size||OM_N,moves=d.moves||[];
    if(d.status==='invite'){sheet(`<div class="result"><div class="big">${esc(opp.name)} 기다리는 중</div><div class="fact">${esc(opp.name)} 폰에 "오목 한 판 하실래요?" 알림을 보냈어요</div>
        <div class="actions"><button class="btn ghost" id="gcx">신청 취소</button></div></div>`,true,()=>quit(d));$('#gcx').onclick=()=>quit(d);return}
    if(['cancel','decline'].includes(d.status)){ended=true;stop();const t=d.status==='decline'?`${opp.name}님이 다음에 하자고 했어요`:d.by===ME?'대결을 그만뒀어요':`${opp.name}님이 대결을 그만뒀어요`;
      sheet(`<div class="result"><div class="big">${esc(t)}</div><div class="actions"><button class="btn ghost" id="more">다른 놀이</button><button class="btn ghost" id="ok">처음 화면</button></div></div>`,true,gameMenu);
      $('#more').onclick=gameMenu;$('#ok').onclick=()=>{close();render()};return}
    const st=omStones(moves,n),over=d.status==='over',myTurn=d.status==='play'&&d.turn===role,myCol=role==='a'?'흑':'백';
    sheet(`<div class="bhead"><span class="turn">${over?'끝':myTurn?`내 차례 · ${myCol}`:esc(opp.name)+' 차례'}</span><span class="num" style="font-size:.85em">${moves.length}수</span></div>
      ${omBoard(st,n,{last:moves.at(-1),line:d.line,lock:!myTurn})}
      <div class="blg"><span><i class="${role==='a'?'bk':'wt'}"></i>나 (${myCol})</span><span><i class="${role==='a'?'wt':'bk'}"></i>${esc(opp.name)} (${role==='a'?'백':'흑'})</span></div>
      <p class="muted" style="font-size:.75em;margin:.5em 0 0;text-align:center">뒤로 가면 대결을 그만둡니다.</p>`,true,()=>quit(d));
    document.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{if(!myTurn)return;const i=+b.dataset.om;document.querySelectorAll('[data-om]').forEach(x=>x.disabled=true);
      firebase.firestore().runTransaction(async tx=>{const s=await tx.get(gamesRef().doc(gid));const v=s.data();const mv=v.moves||[];
        if(v.status!=='play'||v.turn!==role||mv.includes(i))return;const nm=[...mv,i],w=omWin(omStones(nm,n),i,n);
        tx.update(gamesRef().doc(gid),w?{moves:nm,status:'over',winner:role,line:w,ts:Date.now()}:nm.length>=n*n?{moves:nm,status:'over',winner:'draw',ts:Date.now()}:{moves:nm,turn:other,ts:Date.now()})})
        .catch(e=>{console.warn(e);toast('두지 못했어요')})});
    if(over){ended=true;stop();markLog('game',true);const w=d.winner;
      setTimeout(()=>resultView(w==='draw'?'비겼어요':w===role?'오목! 이겼어요':`${opp.name} 승리`,[`${moves.length}수`,partLine()],null,gameOmok),1500)}
  },e=>{console.warn('omok',e);toast('대결 정보를 받지 못했어요')})}
