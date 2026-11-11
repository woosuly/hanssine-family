
/* features/stickers */
const STK=[['thanks','고마워','#F2B544','smile'],['love','사랑해','#E8798C','heart'],['best','최고!','#4E9A6B','star'],['congrats','축하해','#9B6BC8','party'],
  ['cheer','힘내!','#E08A3C','fist'],['meal','밥 먹었어?','#C98B4A','smile2'],['night','잘 자요','#5B6FA8','sleep'],['miss','보고 싶어','#6FA3C8','tear'],
  ['lol','ㅋㅋㅋ','#E3AE2E','laugh'],['ok','알겠어요','#5AA88A','smile'],['sorry','미안해','#9AA3AD','sad'],['bday','생일 축하','#E06A6A','party'],
  ['health','건강하세요','#4E8F5A','smile2'],['call','전화 줘','#3F7FBF','open'],['wow','와~','#F09A48','open'],['hello','안녕하세요','#7B9E4A','smile'],
  ['proud','장하다','#C0864A','star'],['hug','안아 줄게','#E59A7A','heart'],['good','잘했어','#3E8E9E','smile2'],['home','집에 왔어','#8A7A5A','smile']];
const STKC={};
function sticker(id){if(STKC[id])return STKC[id];const s=STK.find(x=>x[0]===id);if(!s)return '';const [,txt,c,ex]=s;const k='#2B2B2B';
  const dots=`<circle cx="45" cy="52" r="4.5" fill="${k}"/><circle cx="75" cy="52" r="4.5" fill="${k}"/>`;
  const arcs=`<path d="M38 54q7-8 14 0M68 54q7-8 14 0" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const smile=`<path d="M46 66q14 13 28 0" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const heart=(x,y)=>`<path transform="translate(${x} ${y})" d="M0 4c-3-6-11-4-10 2 1 5 10 10 10 10s9-5 10-10c1-6-7-8-10-2z" fill="#D7263D"/>`;
  const star=(x,y)=>`<path transform="translate(${x} ${y})" d="M0-9l2.6 5.5 6 .8-4.4 4.1 1.1 6L0 4.5-5.3 7.4l1.1-6-4.4-4.1 6-.8z" fill="#FFF3B0" stroke="${k}" stroke-width="1.5"/>`;
  const openM=`<path d="M45 64h30q-2 17-15 17t-15-17z" fill="${k}"/><path d="M52 75q8 4 16 0" stroke="#E46B6B" stroke-width="4" fill="none"/>`;
  const F={smile:arcs+smile,smile2:dots+smile+`<circle cx="36" cy="64" r="5" fill="#fff" opacity=".35"/><circle cx="84" cy="64" r="5" fill="#fff" opacity=".35"/>`,
    heart:heart(45,46)+heart(75,46)+smile,star:star(45,52)+star(75,52)+openM,
    party:arcs+openM+`<path d="M60 4l-12 22h24z" fill="#FFD25A" stroke="${k}" stroke-width="2"/><g fill="#fff"><rect x="18" y="20" width="5" height="5" transform="rotate(20 20 22)"/><rect x="96" y="26" width="5" height="5" transform="rotate(-20 98 28)"/><circle cx="100" cy="12" r="3"/></g>`,
    fist:`<path d="M38 48l13 5M82 48l-13 5" stroke="${k}" stroke-width="4" stroke-linecap="round"/>`+dots+`<path d="M50 72q10-6 20 0" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M96 34q4 8 0 12" stroke="#fff" stroke-width="3" fill="none"/>`,
    sleep:`<path d="M38 54h13M69 54h13" stroke="${k}" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="70" r="4" fill="${k}"/><text x="88" y="30" font-size="18" font-weight="700" fill="#fff">z</text><text x="98" y="18" font-size="13" font-weight="700" fill="#fff">z</text>`,
    tear:dots+`<path d="M50 74q10-7 20 0" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M41 60q-4 7 0 10q4-3 0-10z" fill="#5AA9E6"/>`,
    laugh:`<path d="M38 47l11 6-11 6M82 47l-11 6 11 6" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`+openM,
    sad:dots+`<path d="M48 74q12-9 24 0" stroke="${k}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    open:dots+`<ellipse cx="60" cy="71" rx="7" ry="8" fill="${k}"/>`};
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="58" r="40" fill="${c}"/><ellipse cx="48" cy="34" rx="12" ry="6" fill="#fff" opacity=".25"/>${F[ex]}
    <rect x="8" y="92" width="104" height="24" rx="12" fill="#fff" stroke="${c}" stroke-width="2.5"/><text x="60" y="109" text-anchor="middle" font-size="${txt.length>4?12:14}" font-weight="700" fill="#2B2B2B" font-family="Noto Sans KR,Apple SD Gothic Neo,sans-serif">${txt}</text></svg>`;
  return STKC[id]='data:image/svg+xml;utf8,'+encodeURIComponent(svg)}
const EMOJI=['😀','😃','😄','😁','😆','😅','😂','🤣','🙂','😊','😇','🥰','😍','😘','😋','😎','🤗','🤔','😴','🥲','😢','😭','😤','🥺','😮','👍','👏','🙏','💪','👋','🤝','🙌','❤️','🧡','💛','💚','💙','💜','🎂','🎉','🎁','💐','🌸','🌷','🍁','🍂','❄️','⛄','☀️','🌧️','🌈','🍚','🍜','🍲','🥟','🍎','🍊','☕','🍵','🏔️','🚗','✈️','🏠','📞','📷','🏥','💊','👵','👴','👨‍👩‍👧‍👦'];
const ACTS=[['hearts','하트 뿅','❤️','rise',['❤️','💕','💗','💖']],['confetti','축하 폭죽','🎉','burst',['🎉','🎊','✨','🎈']],['cake','생일 축하','🎂','fall',['🎂','🎁','🎈','🍰']],
  ['thumbs','최고','👍','fall',['👍','👍','⭐']],['clap','박수','👏','fall',['👏','👏','✨']],['flower','꽃다발','💐','fall',['🌸','🌷','💐','🌼']],
  ['balloon','풍선','🎈','rise',['🎈','🎈','🎈']],['fire','불꽃놀이','🎆','fireworks',[]],['laugh','빵 터짐','🤣','burst',['🤣','😂','😆']],
  ['snow','함박눈','⛄','fall',['❄️','❄️','⛄']],['money','용돈 송금','💸','fall',['💸','💵','💰']],['kiss','뽀뽀','😘','rise',['😘','💋','❤️']]];
function playAct(id){const a=ACTS.find(x=>x[0]===id);if(!a)return;const old=$('.actfx');if(old)old.remove();
  const cv=document.createElement('canvas');cv.className='actfx';document.body.appendChild(cv);const dpr=window.devicePixelRatio||1;
  const W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  const font=s=>`${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;const ems=a[4],mode=a[3];
  const P=[];const R=Math.random;
  const add=(n,f)=>{for(let i=0;i<n;i++)P.push(f(i))};
  if(mode==='rise')add(36,()=>({x:R()*W,y:H+R()*H*.6,vx:(R()-.5)*1,vy:-(2.5+R()*3.5),s:26+R()*26,e:ems[Math.floor(R()*ems.length)],ph:R()*6}));
  if(mode==='fall')add(42,()=>({x:R()*W,y:-R()*H*.8,vx:(R()-.5)*1.2,vy:2.5+R()*3.5,s:24+R()*26,e:ems[Math.floor(R()*ems.length)],ph:R()*6,rot:(R()-.5)*.1}));
  if(mode==='burst')add(46,()=>{const an=R()*6.28,sp=5+R()*9;return {x:W/2,y:H*.55,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-4,g:.22,s:22+R()*24,e:ems[Math.floor(R()*ems.length)],ph:0}});
  const cols=['#FF5A5F','#FFC145','#5BC0EB','#9BC53D','#C77DFF','#FF8FAB'];
  if(mode==='fireworks')for(let k=0;k<5;k++){const cx=W*(.2+R()*.6),cy=H*(.18+R()*.35),c=cols[k%cols.length],t0=k*320;add(40,()=>{const an=R()*6.28,sp=1.5+R()*4;return {dot:1,x:cx,y:cy,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,g:.04,c,t0,s:3}})}
  const T0=performance.now(),DUR=2800;
  const step=now=>{const t=now-T0;ctx.clearRect(0,0,W,H);
    const pop=Math.min(1,t/350),fade=t>DUR-600?Math.max(0,(DUR-t)/600):1;
    ctx.globalAlpha=fade*.95;ctx.font=font(110*(.6+.4*pop));ctx.textAlign='center';ctx.textBaseline='middle';if(t<1500)ctx.fillText(a[2],W/2,H*.45);
    for(const p of P){if(p.t0&&t<p.t0)continue;p.x+=p.vx;p.y+=p.vy;if(p.g)p.vy+=p.g;if(p.ph!==undefined&&!p.g){p.ph+=.05;p.x+=Math.sin(p.ph)*.8}
      ctx.globalAlpha=fade*(p.dot?Math.max(0,1-(t-(p.t0||0))/1400):1);
      if(p.dot){ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.28);ctx.fill()}else{ctx.font=font(p.s);ctx.fillText(p.e,p.x,p.y)}}
    ctx.globalAlpha=1;if(t<DUR&&cv.isConnected)requestAnimationFrame(step);else cv.remove()};
  requestAnimationFrame(step);cv.onclick=()=>cv.remove();
  try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}}
function emoPanel(){return `<div class="emotabs seg" id="emot"><button data-v="stk" class="on">이모티콘</button><button data-v="act">액션</button><button data-v="emo">이모지</button></div>
  <div class="emogrid stkg" id="emog">${STK.map(s=>`<button data-stk="${s[0]}" aria-label="${s[1]}"><img src="${sticker(s[0])}" alt=""></button>`).join('')}</div>`}
function bindEmo(onStk,onEmo,onAct){segBind('#emot',v=>{const g=$('#emog');
    if(v==='stk'){g.className='emogrid stkg';g.innerHTML=STK.map(s=>`<button data-stk="${s[0]}" aria-label="${s[1]}"><img src="${sticker(s[0])}" alt=""></button>`).join('')}
    else if(v==='act'){g.className='emogrid actg';g.innerHTML=ACTS.map(a=>`<button data-act="${a[0]}"><span>${a[2]}</span><small>${a[1]}</small></button>`).join('')}
    else{g.className='emogrid emog';g.innerHTML=EMOJI.map(e=>`<button data-emo="${e}">${e}</button>`).join('')}
    wire()});
  const wire=()=>{document.querySelectorAll('[data-stk]').forEach(b=>b.onclick=()=>onStk(b.dataset.stk));document.querySelectorAll('[data-emo]').forEach(b=>b.onclick=()=>onEmo(b.dataset.emo));
    document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>onAct(b.dataset.act))};wire()}
const EMO6=['❤️','👍','😂','😮','👏','🙏'];
