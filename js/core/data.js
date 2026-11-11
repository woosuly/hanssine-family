
/* core/data */
const HOUSES={p:'부모님',h1:'큰딸네',h2:'둘째딸네',h3:'셋째딸'};
const COLORS=['#2E6A4E','#9A5B2E','#3D5F8C','#8A3F5E','#5B6A2A','#6A4C8F','#2F7A7A','#A0632C','#4E6B8A','#7A3E3E'];
const SCOPES={all:'전체 공개',adults:'어른들만 (손주 제외)',kids:'세 딸네만 (부모님 제외)'};
const REACTS=['최고!','사랑해','고마워','멋지다'];
function seed(){
  const t=today0();const D=n=>ymd(addDays(t,n));
  const members=[
    {id:'f',name:'아버지',role:'parent',house:'p',bd:{m:10,d:28,cal:'lunar',leap:false},phone:''},
    {id:'m',name:'어머니',role:'parent',house:'p',bd:{m:3,d:14,cal:'solar',leap:false},phone:''},
    {id:'d1',name:'큰딸',role:'child',house:'h1',bd:{m:5,d:20,cal:'solar'},phone:'010-0000-0001'},
    {id:'s1',name:'큰사위',role:'child',house:'h1',bd:{m:8,d:2,cal:'solar'},phone:'010-0000-0002'},
    {id:'d2',name:'둘째딸',role:'child',house:'h2',bd:{m:12,d:9,cal:'solar'},phone:'010-0000-0003'},
    {id:'s2',name:'둘째사위',role:'child',house:'h2',bd:{m:2,d:11,cal:'lunar'},phone:'010-0000-0004'},
    {id:'g1',name:'채연',role:'grand',house:'h2',bd:{m:11,d:27,cal:'solar'},phone:''},
    {id:'g2',name:'현도',role:'grand',house:'h2',bd:{m:1,d:15,cal:'solar'},phone:''},
    {id:'d3',name:'셋째딸',role:'child',house:'h3',bd:{m:7,d:7,cal:'solar'},phone:'010-0000-0005'},
  ];
  members.forEach((m,i)=>m.color=COLORS[i]);
  const photos=[
    {id:uid(),by:'g1',tag:'손주',caption:'미술 실기 과제 — 자화상',date:D(0),scope:'all',img:art('drawing'),reacts:{d2:'❤️'},comments:[{id:uid(),by:'d1',text:'채연이 실력 많이 늘었네',ts:Date.now()-3*36e5,replies:[{id:uid(),by:'g1',text:'고마워요 이모!',ts:Date.now()-2*36e5}]}]},
    {id:uid(),by:'s1',tag:'풍경',caption:'속리산 문장대 가는 길, 단풍 끝물',date:D(-1),scope:'all',img:art('autumn'),reacts:{d2:'최고다'}},
    {id:uid(),by:'g2',tag:'손주',caption:'실습 시간에 만든 기어 박스',date:D(-2),scope:'all',img:art('craft'),reacts:{m:'최고다'}},
    {id:uid(),by:'d3',tag:'풍경',caption:'회사 화단 국화',date:D(-6),scope:'all',img:art('flower'),reacts:{m:'풍경 좋네',f:'풍경 좋네'}},
    {id:uid(),by:'d1',tag:'모임',caption:'추석 저녁상',date:D(-47),scope:'all',img:art('meal'),reacts:{f:'고맙다',m:'고맙다'}},
    {id:uid(),by:'s1',tag:'풍경',caption:'작년 이맘때 청남대 산책',date:ymd(new Date(t.getFullYear()-1,t.getMonth(),t.getDate())),scope:'all',img:art('mountain'),reacts:{m:'풍경 좋네'}},
  ];
  const jl=(()=>{try{return S2L(addDays(t,30))}catch(e){return null}})();
  const events=[
    {id:uid(),date:D(6),title:'아버지 정기검진 (대학병원)',type:'hospital',scope:'adults',escort:'h2',time:'10:30',place:'충북대병원',remind:['d1']},
    {id:uid(),date:D(13),title:'채연 실기 발표회',type:'school',scope:'all',time:'14:00',remind:['d1']},
    {id:uid(),date:D(34),title:'아버지 재진 · 약 처방',type:'hospital',scope:'adults',escort:'h1',remind:['d1']},
    {id:uid(),date:D(20),title:'어머니 생신 선물 의논',type:'custom',scope:'kids',remind:[]},
    {id:uid(),date:D(24),end:D(26),title:'가족 여행 (제주)',type:'trip',scope:'all',remind:['d7'],rsvp:{h1:'yes',h2:'yes'}},
    {id:uid(),date:D(45),title:'연말 가족 식사',type:'family',scope:'all',time:'18:00',place:'부모님 댁 근처',remind:['d1'],rsvp:{h1:'yes'}},
    {id:uid(),date:D(30),title:'할머니 기일',type:'jesa',scope:'adults',repeat:jl?'lunar':'solar',lm:jl?jl.m:0,ld:jl?jl.d:0,remind:['d7','d1']},
  ];
  const poll={id:uid(),q:'아버지 생신 식사, 언제가 좋을까요?',open:true,opts:[{t:'토요일 저녁',v:['d1','s1','m']},{t:'일요일 점심',v:['d2','d3']}]};
  const ym=t.getFullYear()+'-'+pad(t.getMonth()+1);
  const dues={mode:'monthly',monthly:50000,perHouse:{h1:50000,h2:50000,h3:50000},treasurer:'h1',paid:{[ym]:{h1:true,h2:true,h3:false}},
    accounts:[{id:'a1',name:'가족 모임통장',kind:'bank',bank:'카카오뱅크',num:'3333-01-2345678',holder:'큰딸'},{id:'a2',name:'현금 (총무 보관)',kind:'cash'}],
    tx:[{id:uid(),date:D(-3),desc:'11월 회비 (큰딸네)',amt:50000,acc:'a1'},{id:uid(),date:D(-3),desc:'11월 회비 (둘째딸네)',amt:50000,acc:'a1'},
      {id:uid(),date:D(-47),desc:'추석 장보기',amt:-286000,acc:'a1'},{id:uid(),date:D(-46),desc:'추석 과일',amt:-40000,acc:'a2'},
      {id:uid(),date:D(-60),desc:'이월 잔액',amt:1316000,acc:'a1'},{id:uid(),date:D(-60),desc:'현금 보관분',amt:100000,acc:'a2'}]};
  const settles=[{id:uid(),date:D(-47),title:'추석 외식',total:420000,fromDues:0,houses:['h1','h2','h3']}];
  // 부모님 활동 기록 (예시): 최근 40일
  const log={};
  for(let i=1;i<=75;i++){const k=D(-i);const r=(i*37)%10;
    const mev=r<7?[{k:'walk',m:20+((i*13)%5)*10}].concat(r<4?[{k:'stretch',m:10}]:[]):[],fev=r<5?[{k:'walk',m:10+((i*7)%3)*10}]:[];
    log[k]={m:{game:r<8,ex:!!mev.length,ev:mev,rt:r<8?13+((i*7)%5):null},f:{game:r<4,ex:!!fev.length,ev:fev,rt:r<4?17+((i*3)%5):null}};}
  const notices=[{id:uid(),by:'s1',text:'12월 첫째 주 토요일 김장, 부모님 댁에서 합니다. 오전 9시까지 오세요.',date:D(-1),scope:'all',sms:true},
    {id:uid(),by:'d2',text:'아버지 검진 결과는 다음 진료 때 같이 들어요.',date:D(-4),scope:'adults',sms:false}];
  const weather={loc:'청주 상당구',week:[[8,1,'맑음',0,'보통'],[11,3,'구름 많음',30,'보통'],[9,4,'비',70,'좋음'],[2,-3,'눈',60,'좋음'],[5,-3,'맑음',0,'보통'],[7,-2,'흐림',10,'나쁨'],[9,0,'구름 많음',20,'보통']]};
  const now=Date.now(),H=36e5;
  const chat=[{id:uid(),by:'d2',ts:now-26*H,text:'아버지 검진 예약 다음 주로 잡았어요. 제가 모시고 갈게요.'},{id:uid(),by:'m',ts:now-25*H,sticker:'thanks'},
    {id:uid(),by:'g1',ts:now-5*H,text:'할머니 할아버지 제 자화상 앨범에 올렸어요!'},{id:uid(),by:'f',ts:now-4*H,sticker:'proud'},{id:uid(),by:'s1',ts:now-2*H,text:'김장 날 장보기는 저희가 할게요'},{id:uid(),by:'d3',ts:now-1*H,sticker:'best'}];
  return {v:7,myPhr:{},seen:{m:Date.now()-2*36e5,f:Date.now()-30*36e5},trPacks:{},family:'한씨네',members,photos,events,poll,dues,settles,log,notices,weather,chat,prefs:{},emergency:['d1','d2','d3'],
    ai:{def:'gemini',keys:{gemini:'',openai:'',claude:''},models:{}},master:{member:'s1',pin:'0000'},notify:{smsParents:true,smsAll:false,items:{notice:true,hospital:true,bday:true}}};
}
const KEY='hanssine-proto-v7';
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||S.v!==7)S=seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let ME=null;
try{ME=localStorage.getItem(KEY+'-device')}catch(e){}
let TAB='home',CSUB='cal',DSUB='dues',CHAT=[],CAL=today0(),SEL=today0(),FILTER={tag:'전체',by:''},VI=0;
const mem=id=>S.members.find(m=>m.id===id);
const me=()=>mem(ME);
const canSee=item=>{const r=me().role;if(item.scope==='custom')return item.by===ME||(item.who||[]).includes(ME);return item.scope==='all'||(item.scope==='adults'&&r!=='grand')||(item.scope==='kids'&&r==='child')};
const ini=m=>m.name.slice(0,1);
const av=(m,cls='')=>`<span class="av ${cls}" style="background:${m.color}">${esc(ini(m))}</span>`;
const byLabel=m=>m.role==='parent'||HOUSES[m.house]===m.name?m.name:HOUSES[m.house]+' '+m.name;
function bdText(m){const b=m.bd;if(!b||!b.m)return '미입력';return (b.cal==='lunar'?'음력 ':'양력 ')+b.m+'.'+b.d+(b.cal==='lunar'&&b.leap?' (윤달생, 평달로 지냄)':'')}
function bdIn(m,y){const b=m.bd;if(!b||!b.m)return null;return b.cal==='lunar'?L2S(y,b.m,b.d):new Date(y,b.m-1,b.d)}
function nextBd(m){const t=today0();let best=null;for(const y of [t.getFullYear()-1,t.getFullYear(),t.getFullYear()+1]){const d=bdIn(m,y);if(d&&d>=t&&(!best||d<best))best=d}return best}
const dday=n=>n===0?'오늘':'D-'+n;
const isSenior=()=>ME&&mem(ME)&&me().role==='parent';
const isAdmin=()=>ME===S.master.member;
