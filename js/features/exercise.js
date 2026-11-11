
/* features/exercise */
const EXK=[['walk','걷기'],['stretch','스트레칭'],['gym','맨손 체조'],['etc','기타 운동']];
const exName=k=>(EXK.find(x=>x[0]===k)||['','운동'])[1];
function exMin(id,k,kind){const x=((S.log[k]||{})[id]||{});return (x.ev||[]).filter(e=>!kind||e.k===kind).reduce((a,e)=>a+e.m,0)}
function exRange(id,from,to,kind){let sum=0,days=0,best=[0,''];for(let d=parse(from);ymd(d)<=to;d=addDays(d,1)){const m=exMin(id,ymd(d),kind);sum+=m;if(m)days++;if(m>best[0])best=[m,ymd(d)]}return {sum,days,best}}
function exStat(id){const t=today0(),k=ymd(t);const mon=exRange(id,ymd(new Date(t.getFullYear(),t.getMonth(),1)),k);return {today:exMin(id,k),yest:exMin(id,ymd(addDays(t,-1))),month:mon.sum,days:mon.days}}
const diffTxt=(a,b)=>a===b?'어제와 같아요':a>b?`어제보다 ${a-b}분 더`:`어제보다 ${b-a}분 덜`;
function exercise(){
  sheet(`<h2>어떤 운동을 하셨어요?</h2><div class="opts">${EXK.map(([k,n])=>`<button data-x="${k}">${n}</button>`).join('')}</div>
    <p class="muted" style="font-size:.8em;margin-top:.8em">무리하지 않는 만큼만 하세요.</p>`,true);
  document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>exAmount(b.dataset.x));
}
function exAmount(k){let m=k==='walk'?30:10;
  sheet(`<h2>${exName(k)}, 몇 분 하셨어요?</h2>
    <div class="mins">${[10,20,30,40,60].map(v=>`<button data-m="${v}" class="${v===m?'on':''}">${v}분</button>`).join('')}</div>
    <div class="stepper"><button id="mminus" aria-label="5분 줄이기">−</button><b id="mval" class="num">${m}분</b><button id="mplus" aria-label="5분 늘리기">+</button></div>
    <button class="sendbig" id="msave" style="width:100%;margin-top:.8em">기록하기</button>`,true,exercise);
  const set=v=>{m=Math.max(5,Math.min(300,v));$('#mval').textContent=m+'분';document.querySelectorAll('[data-m]').forEach(b=>b.classList.toggle('on',+b.dataset.m===m))};
  document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>set(+b.dataset.m));
  $('#mminus').onclick=()=>set(m-5);$('#mplus').onclick=()=>set(m+5);
  $('#msave').onclick=()=>{const key=ymd(today0());S.log[key]=S.log[key]||{};const x=S.log[key][ME]=S.log[key][ME]||{};x.ev=x.ev||[];x.ev.push({k,m});x.ex=true;save();
    const st=exStat(ME);
    resultView('수고하셨어요',[`오늘 ${exName(k)} <b class="num">${m}분</b>`,`오늘 합계 <b class="num">${hm(st.today)}</b> · ${diffTxt(st.today,st.yest)}`,`이번 달 누적 <b class="num">${hm(st.month)}</b> (${st.days}일)`],'ex',exercise)};
}
function exBars(id){const t=today0();const ds=[...Array(14)].map((_,i)=>addDays(t,i-13));const v=ds.map(d=>exMin(id,ymd(d)));const mx=Math.max(30,...v);
  return `<div class="exbars">${ds.map((d,i)=>`<div class="exb"><i style="height:${Math.round(v[i]/mx*100)}%" title="${ymd(d)} ${v[i]}분"></i><span>${i%2?'':d.getDate()}</span></div>`).join('')}</div>`}
function exAnalysis(t){const now=today0();let y=now.getFullYear(),mo=now.getMonth();const m=t.match(/(\d{1,2})\s*월/);
  if(m){mo=+m[1]-1;if(mo>now.getMonth())y--}else if(/지난\s*달|저번\s*달/.test(t)){mo--;if(mo<0){mo=11;y--}}
  const kind=/(걷기|산책|걸)/.test(t)?'walk':/스트레칭/.test(t)?'stretch':/체조/.test(t)?'gym':'';
  let ps=S.members.filter(x=>x.role==='parent'&&t.includes(x.name));if(!ps.length)ps=isSenior()&&/(나|내)/.test(t)?[me()]:S.members.filter(x=>x.role==='parent');
  const from=ymd(new Date(y,mo,1)),last=new Date(y,mo+1,0),to=ymd(last<now?last:now);
  const cur=y===now.getFullYear()&&mo===now.getMonth();const pf=ymd(new Date(y,mo-1,1)),pt=cur?ymd(new Date(y,mo-1,Math.min(now.getDate(),new Date(y,mo,0).getDate()))):ymd(new Date(y,mo,0));
  return ps.map(p=>{const r=exRange(p.id,from,to,kind),q=exRange(p.id,pf,pt,kind);const avg=r.days?Math.round(r.sum/r.days):0;
    const cmp=q.sum?` 지난달${cur?' 같은 기간':''}(${hm(q.sum)})보다 ${r.sum>=q.sum?Math.round((r.sum-q.sum)/q.sum*100)+'% 많아요':Math.round((q.sum-r.sum)/q.sum*100)+'% 적어요'}.`:'';
    return `${p.name} ${mo+1}월 ${kind?exName(kind):'운동'}: 총 ${hm(r.sum)}, ${r.days}일 운동, 운동한 날 평균 ${avg}분${r.best[0]?`, 가장 많이 한 날 ${md(parse(r.best[1]))} ${r.best[0]}분`:''}.${cmp}`}).join('\n')}
function markLog(field,val){const k=ymd(today0());S.log[k]=S.log[k]||{};S.log[k][ME]=S.log[k][ME]||{};S.log[k][ME][field]=val;save()}
function monthStats(){
  const t=today0(),cur=t.getFullYear()+'-'+pad(t.getMonth()+1),pv=addDays(new Date(t.getFullYear(),t.getMonth(),1),-1),prev=pv.getFullYear()+'-'+pad(pv.getMonth()+1);
  let c=0,p=0,rts=[];Object.entries(S.log).forEach(([k,v])=>{const x=v[ME];if(!x||!(x.game||x.ex))return;if(k.startsWith(cur))c++;if(k.startsWith(prev)){p++;if(x.rt)rts.push(x.rt)}});
  return {c,p,prevRt:rts.length?rts.reduce((a,b)=>a+b,0)/rts.length:null};
}
const partLine=()=>{const st=monthStats();return `이번 달 <b class="num">${st.c}일</b> 참여${st.p?` · 지난달 ${st.p}일`:''}`};
