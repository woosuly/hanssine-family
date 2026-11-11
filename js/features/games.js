
/* features/games */
const LV=[['easy','쉬움'],['normal','보통'],['hard','어려움']];
const lvOf=g=>pref('lv_'+g,'easy');
const lvName=g=>LV.find(x=>x[0]===lvOf(g))[1];
const lvBar=g=>`<div class="seg lvseg" id="lvseg">${LV.map(([k,n])=>`<button data-v="${k}" class="${lvOf(g)===k?'on':''}">${n}</button>`).join('')}</div>`;
function bindLv(g,restart){segBind('#lvseg',v=>{setPref('lv_'+g,v);restart()})}
function resultView(title,lines,g,restart){
  const isEx=g==='ex';const up=g&&!isEx&&lvOf(g)!=='hard'?LV[LV.findIndex(x=>x[0]===lvOf(g))+1]:null;
  sheet(`<div class="result"><div class="big">${title}</div>${lines.map(l=>`<div class="fact">${l}</div>`).join('')}
    <p class="muted" style="font-size:.85em">완료 소식이 딸들에게 전해집니다</p>
    <div class="actions">${restart?`<button class="btn ghost" id="again">${isEx?'운동 더 기록':'한 번 더'}</button>`:''}${up?`<button class="btn" id="lvup">${up[1]}으로 해 보기</button>`:''}</div>
    <div class="actions">${isEx?'':'<button class="btn ghost" id="more">다른 놀이</button>'}<button class="btn ghost" id="ok">처음 화면</button></div></div>`,true);
  if($('#more'))$('#more').onclick=gameMenu;$('#ok').onclick=()=>{close();renderSenior()};
  if($('#again'))$('#again').onclick=restart;
  if($('#lvup'))$('#lvup').onclick=()=>{setPref('lv_'+g,up[0]);restart()};
}
const GAMES=[
  ['bingo','빙고','가족과 각자 폰으로 대결 · 혼자도 가능',()=>bingoSetup()],
  ['cross','낱말 가로세로','뜻풀이 보고 낱말 맞히기 · 힌트 있음',()=>crossword()],
  ['pairs','가족 얼굴 짝 맞추기','같은 얼굴 두 장 찾기',()=>gamePairs()],
  ['numbers','숫자 차례로 누르기','숫자를 순서대로 빨리 누르기',()=>gameNumbers()],
  ['who','누가 올린 사진일까요?','가족 사진 보고 맞히기',()=>gameWho()],
];
const todayGame=()=>GAMES[Math.floor(today0()/864e5)%GAMES.length][0];
function gameMenu(){
  const tg=todayGame();const order=[...GAMES].sort((a,b)=>(b[0]===tg)-(a[0]===tg));
  sheet(`<h2>두뇌 놀이</h2><p class="muted" style="font-size:.85em;margin:.2em 0 0">매일 추천 놀이가 바뀝니다</p>
    <div class="glist">${order.map(g=>`<button data-g="${g[0]}" class="${g[0]===tg?'today':''}"><b>${g[0]===tg?'오늘의 추천 · ':''}${g[1]}</b><span>${g[2]} · ${lvName(g[0])}</span></button>`).join('')}</div>`,true);
  document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>GAMES.find(g=>g[0]===b.dataset.g)[3]());
}
function gameNumbers(){
  const sz={easy:3,normal:4,hard:5}[lvOf('numbers')],N=sz*sz;
  const nums=[...Array(N)].map((_,i)=>i+1).sort(()=>Math.random()-.5);let next=1,t0=null;
  sheet(`${lvBar('numbers')}<h2 style="margin-top:.5em">1부터 ${N}까지 차례로 누르세요</h2><p class="muted num" id="gs">1을 찾아 누르세요</p>
    <div class="numgrid" style="grid-template-columns:repeat(${sz},minmax(0,1fr))">${nums.map(n=>`<button data-n="${n}" style="font-size:${sz>4?1.3:sz>3?1.6:2}em">${n}</button>`).join('')}</div>`,true,gameMenu);
  bindLv('numbers',gameNumbers);
  document.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{
    const n=+b.dataset.n;if(n!==next)return;if(n===1)t0=performance.now();b.classList.add('hit');next++;
    $('#gs').textContent=next<=N?next+'을(를) 찾아 누르세요':'다 했어요';
    if(next>N){const sec=Math.round((performance.now()-t0)/100)/10;const key='nb_'+N;const best=pref(key,0);markLog('game',true);markLog('rt',sec);
      const lines=[`오늘 기록 <b class="num">${sec}초</b> (${N}개)`];if(best&&sec<best)lines.push(`최고 기록 ${best}초보다 빨라졌어요`);else if(best)lines.push(`최고 기록 ${best}초`);
      if(!best||sec<best)setPref(key,sec);lines.push(partLine());setTimeout(()=>resultView('잘하셨어요',lines,'numbers',gameNumbers),400)}
  });
}
function gameWho(){
  const [Q,O]={easy:[3,3],normal:[5,3],hard:[5,4]}[lvOf('who')];
  const qs=S.photos.filter(p=>canSee(p)&&mem(p.by)).sort(()=>Math.random()-.5).slice(0,Q);let i=0,ok=0;
  if(!qs.length){sheet(`<div class="stack"><h2>아직 가족 사진이 없어요</h2><p class="muted">사진이 올라오면 할 수 있어요.</p></div>`,true,gameMenu);return}
  const ask=()=>{const p=qs[i],ans=mem(p.by);
    const opts=[ans,...S.members.filter(x=>x.id!==ans.id&&x.id!==ME).sort(()=>Math.random()-.5).slice(0,O-1)].sort(()=>Math.random()-.5);
    sheet(`${i===0?lvBar('who'):''}<h2 style="margin-top:.4em">이 사진은 누가 올렸을까요? <span class="muted num">${i+1}/${qs.length}</span></h2>
      <img src="${p.img}" alt="" style="width:100%;max-height:30vh;object-fit:cover;border-radius:.8em;margin-top:.5em">
      ${lvOf('who')==='easy'?`<p style="margin:.3em 0 0">${esc(p.caption)}</p>`:''}<div class="opts">${opts.map(o=>`<button data-o="${o.id}">${esc(o.name)}</button>`).join('')}</div>`,true,gameMenu);
    if(i===0)bindLv('who',gameWho);
    document.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;x.classList.add(x.dataset.o===ans.id?'right':'wrong')});
      if(b.dataset.o===ans.id)ok++;
      setTimeout(()=>{i++;if(i<qs.length)ask();else{markLog('game',true);resultView('다 하셨어요',[`<b class="num">${qs.length}문제 중 ${ok}문제</b> 맞히셨어요`,partLine()],'who',gameWho)}},900)});
  };ask();
}
function gamePairs(){
  const P={easy:4,normal:6,hard:8}[lvOf('pairs')];
  const pool=S.members.filter(x=>x.id!==ME).sort(()=>Math.random()-.5).slice(0,P);const NP=pool.length;
  const cards=[...pool,...pool].map(m=>({m})).sort(()=>Math.random()-.5);let open=[],found=0,tries=0;
  sheet(`${lvBar('pairs')}<h2 style="margin-top:.5em">같은 얼굴 두 장을 찾으세요</h2><p class="muted" id="ps" style="font-size:.85em;margin:.2em 0 0">카드를 두 장씩 뒤집어 보세요</p>
    <div class="pairs" style="grid-template-columns:repeat(4,minmax(0,1fr))">${cards.map((c,i)=>`<button data-c="${i}" aria-label="카드 ${i+1}">${esc(c.m.name)}</button>`).join('')}</div>`,true,gameMenu);
  bindLv('pairs',gamePairs);
  document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.c;if(open.length===2||open.includes(i)||b.classList.contains('done'))return;
    b.classList.add('open');b.style.background=cards[i].m.color;b.style.fontSize='.95em';open.push(i);
    if(open.length===2){tries++;const [a,c]=open;const ba=$(`[data-c="${a}"]`),bc=$(`[data-c="${c}"]`);
      if(cards[a].m.id===cards[c].m.id){ba.classList.add('done');bc.classList.add('done');open=[];found++;$('#ps').textContent=`${found} / ${NP} 쌍 찾음`;
        if(found===NP){markLog('game',true);setTimeout(()=>resultView('다 찾으셨어요',[`<b class="num">${tries}번</b> 만에 ${NP}쌍을 모두 찾으셨어요`,partLine()],'pairs',gamePairs),600)}}
      else setTimeout(()=>{[ba,bc].forEach(x=>{x.classList.remove('open');x.style.background='';x.style.fontSize=''});open=[]},900)}
  });
}
function bingoSetup(){
  const opp=S.members.filter(x=>x.id!==ME&&(x.role==='parent'||x.role==='grand'));const [n,goal]={easy:[3,1],normal:[4,2],hard:[5,3]}[lvOf('bingo')];
  sheet(`${lvBar('bingo')}<h2 style="margin-top:.5em">빙고 · 누구와 할까요?</h2><p class="muted" style="font-size:.85em;margin:.2em 0 0">${n}×${n} 판, 먼저 ${goal}줄을 만들면 이깁니다. 각자 자기 폰에서 내 판만 봅니다.</p>
    <div class="glist">${opp.map(o=>`<button data-op="${o.id}"><b>${esc(o.name)}에게 대결 신청</b><span>${esc(o.name)} 폰에 알림이 갑니다</span></button>`).join('')}
    <button data-op="cpu"><b>혼자 하기</b><span>컴퓨터와 대결</span></button></div>`,true,gameMenu);
  bindLv('bingo',bingoSetup);
  document.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{const id=b.dataset.op;
    if(id==='cpu')return bingo('컴퓨터',false);
    const o=mem(id);
    sheet(`<div class="result"><div class="big">${esc(o.name)} 기다리는 중</div><div class="fact">${esc(o.name)} 폰에 "빙고 한 판 하실래요?" 알림을 보냈어요</div>
      <p class="muted" style="font-size:.8em">시제품에서는 상대가 바로 수락하고 자동으로 숫자를 부릅니다.</p></div>`,true,bingoSetup);
    setTimeout(()=>bingo(o.name,true),1500)});
}
function bingo(oppName,remote){
  const [n,GOAL]={easy:[3,1],normal:[4,2],hard:[5,3]}[lvOf('bingo')],N=n*n;
  const board=()=>[...Array(N)].map((_,i)=>i+1).sort(()=>Math.random()-.5);
  const mine=board(),theirs=board(),called=new Set();let myTurn=true,over=false,last='';
  const R=[...Array(n).keys()];
  const lines=b=>{const mk=i=>called.has(b[i]);let c=0;
    R.forEach(r=>{if(R.every(k=>mk(r*n+k)))c++});R.forEach(k=>{if(R.every(r=>mk(r*n+k)))c++});
    if(R.every(i=>mk(i*n+i)))c++;if(R.every(i=>mk(i*n+(n-1-i))))c++;return c};
  const draw=()=>{
    sheet(`<div class="bhead"><span class="turn">${over?'끝':myTurn?'내 차례':esc(oppName)+' 차례'}</span>
        <span class="num" style="font-size:.85em">나 <b>${lines(mine)}</b>줄 · ${esc(oppName)} <b>${lines(theirs)}</b>줄 · 목표 ${GOAL}줄</span></div>
      <p class="muted" style="font-size:.85em;margin:0 0 .4em">${last||(myTurn?'부를 숫자를 누르세요':'')}${!myTurn&&!over?` ${esc(oppName)}${remote?' 폰에서':'가'} 고르는 중…`:''}</p>
      <div class="bingo" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${mine.map(x=>`<button data-b="${x}" class="${called.has(x)?'mk':''}" style="font-size:${n>4?1.15:1.5}em" ${called.has(x)||over||!myTurn?'disabled':''}>${x}</button>`).join('')}</div>
      ${remote?'<p class="muted" style="font-size:.75em;margin:.5em 0 0">상대 판은 보이지 않습니다. 실제 앱에서는 두 폰이 실시간으로 이어집니다.</p>':''}`,true,()=>{over=true;bingoSetup()});
    document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>call(+b.dataset.b,true));
  };
  const call=(x,byMe)=>{if(over||called.has(x))return;called.add(x);last=byMe?`내가 ${x}을(를) 불렀어요.`:`${oppName}이(가) ${x}을(를) 불렀어요.`;
    const a=lines(mine),b=lines(theirs);
    if(a>=GOAL||b>=GOAL){over=true;markLog('game',true);draw();
      const t=a>=GOAL&&b>=GOAL?'비겼어요':a>=GOAL?'빙고! 이겼어요':`${oppName} 빙고`;
      setTimeout(()=>resultView(t,[`나 ${a}줄 · ${esc(oppName)} ${b}줄`,`부른 숫자 <b class="num">${called.size}개</b>`,partLine()],'bingo',bingoSetup),1300);return}
    myTurn=!byMe;draw();
    if(!myTurn)setTimeout(()=>{if(over)return;const free=theirs.filter(y=>!called.has(y));let best=free[0],bs=-1;
      free.forEach(y=>{called.add(y);const s=lines(theirs)*10+Math.random()*6;called.delete(y);if(s>bs){bs=s;best=y}});call(best,false)},1100);
  };
  draw();
}
const PUZZLES={
  easy:[{w:2,h:2,words:[{a:'바다',r:0,c:0,d:'a',q:'파도치는 넓고 짠 물'},{a:'바지',r:0,c:0,d:'d',q:'두 다리에 꿰어 입는 옷'},{a:'다리',r:0,c:1,d:'d',q:'강을 건너는 길, 또는 몸을 받치는 부분'},{a:'지리',r:1,c:0,d:'a',q:'"길과 땅에 밝다"를 ○○에 밝다고 함'}]},
    {w:3,h:2,words:[{a:'자전거',r:0,c:0,d:'a',q:'두 바퀴로 발을 굴러 타는 것'},{a:'자두',r:0,c:0,d:'d',q:'여름에 나는 새콤한 붉은 과일'},{a:'거울',r:0,c:2,d:'d',q:'얼굴을 비춰 보는 물건'}]},
    {w:3,h:2,words:[{a:'고양이',r:0,c:0,d:'a',q:'"야옹" 하고 우는 동물'},{a:'고래',r:0,c:0,d:'d',q:'바다에 사는 아주 큰 동물'},{a:'이불',r:0,c:2,d:'d',q:'잘 때 덮는 것'}]}],
  normal:[{w:5,h:5,words:[{a:'무궁화',r:0,c:0,d:'a',q:'우리나라 꽃'},{a:'화요일',r:0,c:2,d:'d',q:'월요일 다음 날'},{a:'일기장',r:2,c:2,d:'a',q:'하루 있었던 일을 적는 공책'},{a:'장독대',r:2,c:4,d:'d',q:'장독을 올려놓는 곳'},{a:'등대',r:4,c:3,d:'a',q:'바닷가에서 불을 비춰 뱃길을 알려 주는 탑'}]},
    {w:4,h:6,words:[{a:'할머니',r:0,c:0,d:'a',q:'아버지의 어머니'},{a:'할아버지',r:0,c:0,d:'d',q:'아버지의 아버지'},{a:'지우개',r:3,c:0,d:'a',q:'연필 글씨를 지우는 물건'},{a:'개나리',r:3,c:2,d:'d',q:'봄에 피는 노란 꽃'},{a:'리본',r:5,c:2,d:'a',q:'선물 포장에 묶는 끈 장식'}]},
    {w:4,h:5,words:[{a:'고구마',r:0,c:0,d:'a',q:'겨울에 구워 먹는 땅속 덩이'},{a:'고등어',r:0,c:0,d:'d',q:'등이 푸른 생선, 구이로 많이 먹음'},{a:'어깨',r:2,c:0,d:'a',q:'목과 팔 사이'},{a:'깨소금',r:2,c:1,d:'d',q:'볶은 깨에 소금을 넣어 빻은 것'},{a:'금요일',r:4,c:1,d:'a',q:'목요일 다음 날'}]}],
  hard:[{w:7,h:8,words:[{a:'무궁화',r:0,c:0,d:'a',q:'우리나라 꽃'},{a:'화요일',r:0,c:2,d:'d',q:'월요일 다음 날'},{a:'일기장',r:2,c:2,d:'a',q:'하루 있었던 일을 적는 공책'},{a:'장독대',r:2,c:4,d:'d',q:'장독을 올려놓는 곳'},
    {a:'대나무',r:4,c:4,d:'a',q:'마디가 있고 곧게 자라며 죽순이 나는 나무'},{a:'무지개',r:4,c:6,d:'d',q:'비 갠 뒤 하늘에 뜨는 일곱 빛깔 띠'},{a:'지우개',r:6,c:4,d:'a',q:'연필 글씨를 지우는 물건'},{a:'우산',r:6,c:5,d:'d',q:'비 올 때 펴서 쓰는 것'}]}]};
function crossword(){
  const lvl=lvOf('cross'),set=PUZZLES[lvl],P=JSON.parse(JSON.stringify(set[Math.floor(today0()/864e5)%set.length]));const HMAX=lvl==='hard'?2:99;
  const cells={};P.words.forEach((w,wi)=>[...w.a].forEach((ch,k)=>{const r=w.r+(w.d==='d'?k:0),c=w.c+(w.d==='a'?k:0),key=r+','+c;
    cells[key]=cells[key]||{ch,ws:[],show:false,hint:false};cells[key].ws.push(wi)}));
  if(lvl==='easy')P.words.forEach(w=>{const k=w.r+','+w.c;cells[k].show=true});
  const num={};let n=1;P.words.forEach(w=>{const k=w.r+','+w.c;if(!num[k])num[k]=n++;w.n=num[k]});
  const solved=new Set();let sel=0,hints=0;const cs=P.w>5?1.7:2.1;
  const cellsOf=w=>[...w.a].map((_,k)=>(w.r+(w.d==='d'?k:0))+','+(w.c+(w.d==='a'?k:0)));
  const draw=(msg)=>{const w=P.words[sel];const selCells=new Set(cellsOf(w));
    let g='';for(let r=0;r<P.h;r++)for(let c=0;c<P.w;c++){const k=r+','+c,x=cells[k];
      g+=x?`<i class="c ${selCells.has(k)?'sel':''} ${x.hint&&!x.done?'h':''}" data-k="${k}" style="width:${cs}em;height:${cs}em">${num[k]?`<sup>${num[k]}</sup>`:''}${x.show?x.ch:''}</i>`:`<i style="width:${cs}em;height:${cs}em"></i>`}
    sheet(`${lvBar('cross')}<div class="bhead"><h2>낱말 가로세로</h2><span class="small muted num">${solved.size} / ${P.words.length}</span></div>
      <div class="cw" style="grid-template-columns:repeat(${P.w},${cs}em)">${g}</div>
      <div class="card" style="margin-top:.6em;padding:.6em .7em"><b>${w.n}번 ${w.d==='a'?'가로':'세로'} (${w.a.length}글자)</b><div style="font-size:.95em">${esc(w.q)}</div>
        ${solved.has(sel)?'<div style="color:var(--pine);font-weight:700;margin-top:.3em">맞혔어요</div>':`<div class="cwin"><input id="cin" maxlength="${w.a.length+2}" placeholder="정답 입력" autocomplete="off">
          <button id="cmic" class="micbtn" aria-label="음성 입력">음성</button><button id="cok" class="btn">확인</button></div>
          <div class="row" style="margin-top:.4em"><button class="btn ghost sm" id="chint" ${hints>=HMAX?'disabled':''}>힌트 (한 글자)${HMAX<99?` ${HMAX-hints}번 남음`:''}</button><span class="small muted" id="cmsg">${msg||''}</span></div>`}</div>
      <div class="clues">${P.words.map((x,i)=>`<button data-w="${i}" class="${i===sel?'on':''} ${solved.has(i)?'ok':''}">${x.n}. ${x.d==='a'?'가로':'세로'} · ${esc(x.q)}</button>`).join('')}</div>`,true,gameMenu);
    bindLv('cross',crossword);
    document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{sel=+b.dataset.w;draw()});
    document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const ws=cells[b.dataset.k].ws;const nx=ws.find(i=>!solved.has(i)&&i!==sel);sel=nx!=null?nx:ws[0];draw()});
    if(!solved.has(sel)){
      const check=()=>{const v=$('#cin').value.replace(/\s/g,'');if(!v)return;
        if(v===w.a){solved.add(sel);cellsOf(w).forEach(k=>{cells[k].show=true;cells[k].done=true});
          if(solved.size===P.words.length){markLog('game',true);setTimeout(()=>resultView('다 맞히셨어요',[`${P.words.length}낱말 · 힌트 <b class="num">${hints}번</b> 사용`,partLine()],'cross',crossword),500);draw();return}
          const nx=P.words.findIndex((_,i)=>!solved.has(i));sel=nx;draw('맞았어요! 다음 문제입니다')}
        else{$('#cmsg').textContent='아쉬워요. 다시 해 보세요';$('#cin').select()}};
      $('#cok').onclick=check;$('#cin').onkeydown=e=>{if(e.key==='Enter')check()};
      $('#chint').onclick=()=>{if(hints>=HMAX)return;const hid=cellsOf(w).filter(k=>!cells[k].show);if(!hid.length)return;const k=hid[Math.floor(Math.random()*hid.length)];cells[k].show=true;cells[k].hint=true;hints++;draw('한 글자를 보여 드렸어요')};
      $('#cmic').onclick=()=>{const b=$('#cmic');if(REC){stopListen();return}
        listen((t,fin)=>{$('#cin').value=t.replace(/\s/g,'');if(fin)check()},(st,err)=>{b.classList.toggle('rec',st==='listening');if(st!=='listening'&&st!=='end')$('#cmsg').textContent=micMsg(st,err)})};
    }
  };
  draw();
}
