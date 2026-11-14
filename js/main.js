
/* main */
// 개발 보기: 주소 끝에 ?dev=1 로 한 번 열면 이 폰에서 켜짐, ?dev=0 으로 끔
const DEV=(()=>{try{const q=location.search;if(/[?&]dev=1/.test(q))localStorage.setItem('hanssine-dev','1');if(/[?&]dev=0/.test(q))localStorage.removeItem('hanssine-dev');return LOCAL||localStorage.getItem('hanssine-dev')==='1'}catch(e){return LOCAL}})();
function devBar(){if(!DEV)return '';return `<div class="devbar"><span>개발</span><select id="devsel" aria-label="보기 전환">${S.members.map(m=>`<option value="${m.id}" ${m.id===ME?'selected':''}>${esc(byLabel(m))}${m.role==='parent'?' (어르신 화면)':''}${m.id===S.master.member?' · 관리자':''}</option>`).join('')}</select></div>`}
function bindDev(){const d=$('#devsel');if(!d)return;d.onchange=()=>{ME=d.value;closeRoom();CROOM=null;roomsListen();try{localStorage.setItem(KEY+'-device',ME)}catch(e){};close();stopFx();stopListen();TAB='home';SR_TAB='home';VI=0;CHAT=[];render()}}
function render(){ensureFolders();if(!ME||!mem(ME))renderWho();else if(me().role==='parent')renderSenior();else renderMain();bindDev()}
boot();

// 새 버전 빨리 반영: 앱으로 돌아올 때(1분 간격) 새 배포가 있으면 바로 다시 불러옴
// 쓰던 글이 있거나 창을 열어 둔 중이면 다음 기회로 미룸
const VER=(()=>{let v='';fetch('sw.js',{cache:'no-store'}).then(r=>r.text()).then(t=>{v=(t.match(/CACHE='([^']+)'/)||[])[1]||''}).catch(()=>{});return ()=>v})();
let VER_AT=Date.now();
async function checkNewVersion(){if(LOCAL||!VER()||Date.now()-VER_AT<60e3)return;VER_AT=Date.now();
  try{const t=await (await fetch('sw.js',{cache:'no-store'})).text(),nv=(t.match(/CACHE='([^']+)'/)||[])[1];if(!nv||nv===VER())return;
    const typing=[...document.querySelectorAll('textarea,input[type=text],input:not([type])')].some(e=>e.value&&e.value.trim());
    if(typing||busy()||REC)return;
    try{const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update()}catch(e){}
    location.reload()}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkNewVersion()});
