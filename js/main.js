
/* main */
// 개발 보기: 주소 끝에 ?dev=1 로 한 번 열면 이 폰에서 켜짐, ?dev=0 으로 끔
const DEV=(()=>{try{const q=location.search;if(/[?&]dev=1/.test(q))localStorage.setItem('hanssine-dev','1');if(/[?&]dev=0/.test(q))localStorage.removeItem('hanssine-dev');return LOCAL||localStorage.getItem('hanssine-dev')==='1'}catch(e){return LOCAL}})();
function devBar(){if(!DEV)return '';return `<div class="devbar"><span>개발</span><select id="devsel" aria-label="보기 전환">${S.members.map(m=>`<option value="${m.id}" ${m.id===ME?'selected':''}>${esc(byLabel(m))}${m.role==='parent'?' (어르신 화면)':''}${m.id===S.master.member?' · 관리자':''}</option>`).join('')}</select></div>`}
function bindDev(){const d=$('#devsel');if(!d)return;d.onchange=()=>{ME=d.value;closeRoom();CROOM=null;roomsListen();try{localStorage.setItem(KEY+'-device',ME)}catch(e){};close();stopFx();stopListen();TAB='home';SR_TAB='home';VI=0;CHAT=[];render()}}
function render(){ensureFolders();if(!ME||!mem(ME))renderWho();else if(me().role==='parent')renderSenior();else renderMain();bindDev()}
boot();
