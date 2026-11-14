
/* core/voice */
let REC=null;
// 안드로이드 앱(APK) 안인지. 앱 안에서는 음성 입력·읽기를 휴대폰 기능으로 처리
const NATIVE_APP=()=>!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const NPLUG=n=>NATIVE_APP()&&window.Capacitor.Plugins?Capacitor.Plugins[n]:null;
function stopListen(){if(REC){try{REC.stop()}catch(e){}REC=null}}
function micMsg(state,err){
  if(state==='unsupported')return '이 브라우저는 음성 입력을 지원하지 않습니다. 크롬(안드로이드) 또는 사파리(아이폰)에서 사용하세요.';
  if(err==='not-allowed'||err==='service-not-allowed')return '이 미리보기 화면에서는 마이크가 막혀 있습니다. 배포한 앱에서는 마이크 허용 후 사용할 수 있습니다.';
  if(err==='no-speech')return '말소리가 들리지 않았어요. 다시 눌러 주세요.';
  if(err==='network')return '인터넷 연결이 약해 말을 알아듣지 못했어요. 다시 눌러 주세요.';
  return '음성 입력을 시작하지 못했습니다.';
}
function speak(text){if(NPLUG('HanssineNative')){NPLUG('HanssineNative').speak({text,lang:'ko-KR',rate:.9}).catch(()=>toast('읽어 주기를 할 수 없습니다'));return}try{if(!window.speechSynthesis)return toast('이 기기는 읽어 주기를 지원하지 않습니다');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.9;speechSynthesis.speak(u)}catch(e){toast('읽어 주기를 할 수 없습니다')}}
function listen(onText,onState,lang){
  if(NPLUG('SpeechRecognition'))return nListen(onText,onState,lang);
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){onState('unsupported');return}
  stopListen();const r=new SR();r.lang=lang||'ko-KR';r.interimResults=true;r.continuous=false;
  r.onresult=e=>{let t='';for(const x of e.results)t+=x[0].transcript;onText(t,e.results[e.results.length-1].isFinal)};
  r.onerror=e=>onState('error',e.error);r.onend=()=>{REC=null;onState('end')};
  try{r.start();REC=r;onState('listening')}catch(e){onState('error','start')}
}
function speakIn(text,lang){if(NPLUG('HanssineNative')){NPLUG('HanssineNative').speak({text,lang,rate:.9}).catch(()=>{});return}try{if(!window.speechSynthesis)return toast('이 기기는 읽어 주기를 지원하지 않습니다');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.9;speechSynthesis.speak(u)}catch(e){}}

// 앱 안 음성 입력: 말을 마치면 결과 한 번에 받음
// 갤럭시 기본 인식기는 중간 결과를 보내지 않아 중간 결과 방식이면 멈춘 것처럼 보임 → 최종 결과 방식, 15초 제한
let NL_ACTIVE=false,NL_LAST=0;
async function nListen(onText,onState,lang){const SR=NPLUG('SpeechRecognition');stopListen();
  let done=false,tm=0;const end=err=>{if(done)return;done=true;clearTimeout(tm);REC=null;onState(err?'error':'end',err||undefined)};
  try{let p=await SR.checkPermissions().catch(()=>({}));if(p.speechRecognition!=='granted'){p=await SR.requestPermissions().catch(()=>({}));if(p.speechRecognition!=='granted')return end('not-allowed')}
    try{if(NPLUG('HanssineNative'))NPLUG('HanssineNative').stopSpeak().catch(()=>{})}catch(e){}
    // 이전 인식이 아직 돌거나 방금 끝났으면 잠깐 쉬었다 시작 (인식기 '바쁨' 오류 방지)
    if(NL_ACTIVE){await SR.stop().catch(()=>{});await new Promise(r=>setTimeout(r,400))}
    else if(Date.now()-NL_LAST<400)await new Promise(r=>setTimeout(r,400-(Date.now()-NL_LAST)));
    REC={stop:()=>{SR.stop().catch(()=>{});setTimeout(()=>end(null),1500)}};onState('listening');
    tm=setTimeout(()=>{SR.stop().catch(()=>{});end('no-speech')},15000);
    const go=async()=>{NL_ACTIVE=true;try{return await SR.start({language:lang||'ko-KR',maxResults:1,partialResults:false,popup:false})}finally{NL_ACTIVE=false;NL_LAST=Date.now()}};
    let r;try{r=await go()}catch(e){if(done||!/busy|recognizer|client/i.test(String(e&&e.message||e)))throw e;await SR.stop().catch(()=>{});await new Promise(x=>setTimeout(x,600));if(done)return;r=await go()}
    const t=r&&r.matches&&r.matches[0];
    if(t){onText(t,true);if(done){onState('end');return}}
    end(t?null:'no-speech');
  }catch(e){console.warn('speech',e);const m=String(e&&e.message||e);end(/permission|denied/i.test(m)?'not-allowed':/network|server/i.test(m)?'network':'no-speech')}}
