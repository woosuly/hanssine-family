
/* core/ai */
// 목록을 못 불러올 때만 쓰는 예비값
const AI_DEF={gemini:'gemini-2.5-flash',openai:'gpt-4.1-mini',claude:'claude-sonnet-5-5'};
async function callAI(system,msgs,prov,img){
  const c=aiCfg();const provider=prov||c.def,key=(c.keys||{})[provider],model=(c.models||{})[provider];if(!key)throw new Error('NOKEY:'+provider);
  const mdl=model||await autoModel(provider,key);let res,j;const last=msgs.length-1;
  const im=img?{mime:img.slice(5,img.indexOf(';')),b64:img.slice(img.indexOf(',')+1)}:null;
  const txt=m=>m.text||'이 이미지를 보고 판단해 줘';
  if(provider==='gemini'){
    res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:msgs.map((m,i)=>({role:m.role==='user'?'user':'model',parts:i===last&&im?[{inline_data:{mime_type:im.mime,data:im.b64}},{text:txt(m)}]:[{text:txt(m)}]}))})});
    j=await res.json();if(!res.ok)throw new Error(j.error?.message||res.status);return (j.candidates?.[0]?.content?.parts||[]).map(p=>p.text).join('');
  }
  if(provider==='openai'){
    res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
      body:JSON.stringify({model:mdl,messages:[{role:'system',content:system},...msgs.map((m,i)=>({role:m.role==='user'?'user':'assistant',content:i===last&&im?[{type:'text',text:txt(m)},{type:'image_url',image_url:{url:img}}]:txt(m)}))]})});
    j=await res.json();if(!res.ok)throw new Error(j.error?.message||res.status);return j.choices[0].message.content;
  }
  res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:mdl,max_tokens:1000,system,messages:msgs.map((m,i)=>({role:m.role==='user'?'user':'assistant',content:i===last&&im?[{type:'image',source:{type:'base64',media_type:im.mime,data:im.b64}},{type:'text',text:txt(m)}]:txt(m)}))})});
  j=await res.json();if(!res.ok)throw new Error(j.error?.message||res.status);return j.content.map(c=>c.text||'').join('');
}
function aiErr(e){
  if(String(e.message).startsWith('NOKEY'))return `${(AIS[e.message.split(':')[1]]||['AI'])[0]} 키가 아직 등록되지 않았습니다. 관리자(${mem(S.master.member).name})가 설정 > AI 비서에서 등록하면 가족 모두 사용할 수 있습니다.`;
  if(e instanceof TypeError)return '이 미리보기 화면에서는 외부 AI 서버 연결이 막혀 있습니다. GitHub Pages에 올린 앱에서는 동작합니다.';
  return 'AI 응답 오류: '+e.message;
}
function aiContext(pub){const vis=x=>pub?x.scope==='all':canSee(x);
  const t=today0(),l=S2L(t),m=me(),L=[];
  L.push(`오늘: ${ymd(t)} ${DOW[t.getDay()]}요일${l?` (음력 ${l.m}월 ${l.d}일)`:''}`);
  L.push(`질문한 사람: ${byLabel(m)}`);
  L.push('[가족 구성원과 생일]');
  S.members.forEach(x=>{const nb=nextBd(x);L.push(`- ${byLabel(x)}: 생일 ${bdText(x)}${nb?`, 다음 생일 양력 ${ymd(nb)}`:''}`)});
  L.push('[앞으로 60일 일정]');upcoming(60).filter(vis).forEach(e=>L.push(`- ${ymd(e._d)} ${e.title}${e.escort?` (동행 ${HOUSES[e.escort]})`:''}`));
  L.push('[공지·소식]');S.notices.filter(vis).slice(-5).forEach(n=>L.push(`- ${n.date} ${mem(n.by).name}: ${n.text}`));
  const hs=Object.values(holidays(t.getFullYear())).length?Object.entries({...holidays(t.getFullYear()),...holidays(t.getFullYear()+1)}).filter(([k])=>k>=ymd(t)).slice(0,6):[];
  L.push('[다가오는 공휴일]');hs.forEach(([k,v])=>L.push(`- ${k} ${v}`));
  if(!pub&&m.role==='child'){L.push(`[회비] 전체 잔액 ${won(balance())} (${accs().map(a=>a.name+' '+won(balance(a.id))).join(', ')}), 방식 ${(MODES.find(x=>x[0]===S.dues.mode)||[,'미정'])[1]}, 총무 ${S.dues.treasurer?HOUSES[S.dues.treasurer]:'미정'}`)}
  if(me().role!=='grand'||!pub){L.push('[부모님 운동 기록(분), 최근 62일]');S.members.filter(x=>x.role==='parent').forEach(p=>{const a=[];for(let i=61;i>=0;i--){const k=ymd(addDays(t,-i));const x=(S.log[k]||{})[p.id]||{};if(x.ev&&x.ev.length)a.push(k.slice(5)+' '+x.ev.map(e=>exName(e.k)+e.m).join('+'))}L.push(`- ${p.name}: ${a.join(', ')||'기록 없음'}`)})}
  L.push(`[날씨 예보, 예시 데이터] ${S.weather.loc}: `+S.weather.week.map((w,i)=>`${md(addDays(t,i))} ${w[2]} ${w[1]}~${w[0]}° 강수 ${w[3]}%`).join(' / '));
  return L.join('\n');
}
function aiSystem(pub){return `너는 '${S.family}' 가족 앱의 AI 비서다.${pub?' 지금은 가족 단체 대화방에서 호출되었고, 대화 기록 중 마지막 질문에 답한다. 답은 가족 모두가 본다.':''} 가족 질문은 아래 데이터만 근거로 짧고 쉬운 한국어로 답한다. 데이터에 없는 가족 정보는 모른다고 말한다. 일반 질문(요리, 생활, 여행, 상식)은 일반 지식으로 답하되, 건강·약 관련은 일반 정보만 말하고 담당 의사 상담을 권한다. ${isSenior()?'질문자는 70대 어르신이므로 3문장 이내, 존댓말로 아주 쉽게 답한다.':'답은 5문장 이내로 한다.'}\n\n${aiContext(pub)}`}
// 키로 실제 쓸 수 있는 모델 목록 (최신순)
async function listModels(prov,key){let r,j;
  if(prov==='gemini'){r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`);j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
    const ver=n=>parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/)||[])[1]||0);
    return (j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')&&/^models\/gemini/.test(m.name)&&!/embedding|tts|image|audio|live|aqa|robotics|computer/.test(m.name)).map(m=>m.name.slice(7)).sort((a,b)=>ver(b)-ver(a))}
  if(prov==='openai'){r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+key}});j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
    return (j.data||[]).sort((a,b)=>(b.created||0)-(a.created||0)).map(m=>m.id).filter(id=>/^(gpt-|o\d|chatgpt)/.test(id)&&!/audio|realtime|tts|transcribe|image|search|embedding|instruct|codex|moderation/.test(id))}
  r=await fetch('https://api.anthropic.com/v1/models?limit=100',{headers:{'x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}});j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
  return (j.data||[]).map(m=>m.id)}
// 목록에서 일상 대화에 알맞은 모델 고르기: Gemini는 flash, GPT는 mini, Claude는 sonnet 중 최신
function pickModel(prov,list){const clean=list.filter(x=>!/preview|exp|lite|nano|-\d{4}-\d{2}-\d{2}$/.test(x));const want={gemini:/flash/,openai:/^gpt-.*mini/,claude:/sonnet/}[prov];
  return clean.find(x=>want.test(x))||list.find(x=>want.test(x))||clean[0]||list[0]||AI_DEF[prov]}
// 모델을 정하지 않았으면 처음 한 번 목록을 받아 자동으로 정함
async function autoModel(prov,key){const c=aiCfg();c.auto=c.auto||{};if(c.auto[prov])return c.auto[prov];
  try{const l=await listModels(prov,key);c.lists=c.lists||{};c.lists[prov]=l.slice(0,40);c.auto[prov]=pickModel(prov,l);save();return c.auto[prov]}catch(e){return AI_DEF[prov]}}
const keyTail=k=>k?'입력됨 · 끝자리 '+k.slice(-4):'미입력';
const AIS={gemini:['Gemini','#4C7BD9'],openai:['GPT','#2F8F74'],claude:['Claude','#C46A3D']};
function aiCfg(){const a=S.ai||{};if(!a.keys)S.ai={def:a.provider||'gemini',keys:{[a.provider||'gemini']:a.key||''},models:{}};return S.ai}
