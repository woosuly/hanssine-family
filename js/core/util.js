
/* core/util */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const today0=()=>{const t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())};
const won=n=>(n<0?'-':'')+Math.abs(n).toLocaleString('ko-KR')+'원';
const DOW='일월화수목금토';
const md=d=>(d.getMonth()+1)+'월 '+d.getDate()+'일';
const uid=()=>Math.random().toString(36).slice(2,9);
const HAS_LUNAR=typeof Lunar!=='undefined'&&typeof Solar!=='undefined';
function L2S(y,m,d){ // 음력 → 양력 Date
  if(!HAS_LUNAR) return new Date(y,m-1,d);
  for(let dd=d;dd>=d-1;dd--){try{const s=Lunar.fromYmd(y,m,dd).getSolar();return new Date(s.getYear(),s.getMonth()-1,s.getDay())}catch(e){}}
  return new Date(y,m-1,d);
}
function S2L(d){
  if(!HAS_LUNAR) return null;
  const l=Solar.fromYmd(d.getFullYear(),d.getMonth()+1,d.getDate()).getLunar();
  return {m:Math.abs(l.getMonth()),d:l.getDay(),leap:l.getMonth()<0};
}
const HCACHE={};
function holidays(y){
  if(HCACHE[y]) return HCACHE[y];
  const H={};const add=(d,n)=>{const k=ymd(d);if(!H[k])H[k]=n};
  [[1,1,'신정'],[3,1,'삼일절'],[5,5,'어린이날'],[6,6,'현충일'],[8,15,'광복절'],[10,3,'개천절'],[10,9,'한글날'],[12,25,'성탄절']]
    .forEach(([m,d,n])=>add(new Date(y,m-1,d),n));
  let seol=[],chu=[],bud=null;
  if(HAS_LUNAR){
    const s=L2S(y,1,1);seol=[addDays(s,-1),s,addDays(s,1)];
    const c=L2S(y,8,15);chu=[addDays(c,-1),c,addDays(c,1)];
    bud=L2S(y,4,8);
    seol.forEach(d=>add(d,'설날'));chu.forEach(d=>add(d,'추석'));add(bud,'부처님오신날');
  }
  const isOff=x=>x.getDay()===0||x.getDay()===6||H[ymd(x)];
  const nextFree=d=>{let x=addDays(d,1);while(isOff(x))x=addDays(x,1);return x};
  [seol,chu].forEach(g=>{if(g.length&&g.some(d=>d.getDay()===0))add(nextFree(g[2]),'대체공휴일')});
  const subs=[[3,1],[5,5],[8,15],[10,3],[10,9],[12,25]].map(([m,d])=>new Date(y,m-1,d));if(bud)subs.push(bud);
  subs.forEach(d=>{if(d.getDay()===0||d.getDay()===6)add(nextFree(d),'대체공휴일')});
  return HCACHE[y]=H;
}
const holidayOf=d=>holidays(d.getFullYear())[ymd(d)];
const hhmm=ts=>{const d=new Date(ts);return pad(d.getHours())+':'+pad(d.getMinutes())};
const shortD=d=>(d.getMonth()+1)+'/'+d.getDate()+'('+DOW[d.getDay()]+')';
const hm=m=>m>=60?`${Math.floor(m/60)}시간${m%60?' '+m%60+'분':''}`:m+'분';
function segBind(sel,fn){document.querySelectorAll(sel+' button').forEach(b=>b.onclick=e=>{e.preventDefault();document.querySelectorAll(sel+' button').forEach(x=>x.classList.remove('on'));b.classList.add('on');fn(b.dataset.v)})}
function agoText(ts){if(!ts)return '기록 없음';const h=(Date.now()-ts)/36e5;return h<1?'방금 전':h<24?Math.floor(h)+'시간 전':Math.floor(h/24)+'일 전'}
