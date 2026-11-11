
/* main */
const DEV=true;
function devBar(){if(!DEV)return '';return `<div class="devbar"><span>개발</span><select id="devsel" aria-label="보기 전환">${S.members.map(m=>`<option value="${m.id}" ${m.id===ME?'selected':''}>${esc(byLabel(m))}${m.role==='parent'?' (어르신 화면)':''}${m.id===S.master.member?' · 관리자':''}</option>`).join('')}</select></div>`}
function bindDev(){const d=$('#devsel');if(!d)return;d.onchange=()=>{ME=d.value;try{localStorage.setItem(KEY+'-device',ME)}catch(e){};close();stopFx();stopListen();TAB='home';SR_TAB='home';VI=0;CHAT=[];render()}}
function render(){ensureFolders();if(!ME||!mem(ME))renderWho();else if(me().role==='parent')renderSenior();else renderMain();bindDev()}
render();
