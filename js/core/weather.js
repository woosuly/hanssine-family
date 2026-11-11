
/* core/weather */
function wxToday(){return S.weather.week[0]}
function wxNote(){const w=S.weather.week;for(let i=1;i<=2;i++)if(w[i]&&(w[i][3]>=60||w[i][2]==='눈'))return (i===1?'내일':'모레')+(w[i][2]==='눈'?' 눈 소식 · 길 미끄럼 조심':' 비 소식 · 우산 챙기세요');return '이번 주 큰 비·눈 소식 없음'}
function weatherSheet(){
  const t=today0();
  sheet(`<div class="stack"><div class="row between"><h2>${esc(S.weather.loc)} 주간 날씨</h2><span class="ex">예시</span></div>
    <div class="wk"><div class="hd">날짜</div><div class="hd">날씨</div><div class="hd">비</div><div class="hd">최저/최고</div>
    ${S.weather.week.map((w,i)=>{const d=addDays(t,i);return `<div><b>${i===0?'오늘':i===1?'내일':DOW[d.getDay()]}</b><br><span class="small muted num">${d.getMonth()+1}/${d.getDate()}</span></div>
      <div class="row" style="gap:6px;flex-wrap:nowrap">${wxIcon(w[2],30)}<span>${w[2]}<br><span class="small dust-${w[4]}">미세먼지 ${w[4]}</span></span></div><div class="num">${w[3]}%</div><div class="num"><span style="color:var(--pine)">${w[1]}°</span> / <span style="color:var(--red)">${w[0]}°</span></div>`}).join('')}</div>
    <p class="small muted">실제 앱은 기상청 단기·중기예보와 에어코리아 미세먼지를 받아 옵니다. 지역은 설정에서 바꿉니다.</p></div>`,isSenior());
  if($('#cl'))$('#cl').onclick=close;
}
function wxIcon(sky,sz){sz=sz||28;
  const sun=`<circle cx="12" cy="12" r="4.4" fill="#F2B544"/><g stroke="#F2B544" stroke-width="1.8" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>`<line x1="12" y1="2.6" x2="12" y2="5" transform="rotate(${a} 12 12)"/>`).join('')}</g>`;
  const cloud=(x,y,c)=>`<path transform="translate(${x} ${y})" d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 18z" fill="${c}"/>`;
  let g;
  if(sky==='맑음')g=sun;
  else if(sky==='구름 많음')g=`<g transform="translate(-2.5 -3.5) scale(.8)">${sun}</g>`+cloud(1,1.5,'#AEB8C2');
  else if(sky==='흐림')g=cloud(0,-1,'#98A3AE');
  else if(sky==='비'||sky==='소나기')g=cloud(0,-3.5,'#8C98A4')+`<g stroke="#4A8BD0" stroke-width="1.8" stroke-linecap="round"><line x1="8.5" y1="17" x2="7.5" y2="20.5"/><line x1="12.5" y1="17" x2="11.5" y2="21.5"/><line x1="16.5" y1="17" x2="15.5" y2="20.5"/></g>`;
  else if(sky==='눈')g=cloud(0,-3.5,'#A9B4BF')+`<g fill="#6FA8DC">${[[8.5,18.5],[12.5,21],[16.5,18.5]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.5"/>`).join('')}</g>`;
  else g=cloud(0,0,'#AEB8C2');
  return `<svg class="wxi" width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`}
