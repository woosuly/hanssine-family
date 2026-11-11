
/* core/voice */
let REC=null;
function stopListen(){if(REC){try{REC.stop()}catch(e){}REC=null}}
function micMsg(state,err){
  if(state==='unsupported')return '이 브라우저는 음성 입력을 지원하지 않습니다. 크롬(안드로이드) 또는 사파리(아이폰)에서 사용하세요.';
  if(err==='not-allowed'||err==='service-not-allowed')return '이 미리보기 화면에서는 마이크가 막혀 있습니다. 배포한 앱에서는 마이크 허용 후 사용할 수 있습니다.';
  if(err==='no-speech')return '말소리가 들리지 않았어요. 다시 눌러 주세요.';
  return '음성 입력을 시작하지 못했습니다.';
}
function speak(text){try{if(!window.speechSynthesis)return toast('이 기기는 읽어 주기를 지원하지 않습니다');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.9;speechSynthesis.speak(u)}catch(e){toast('읽어 주기를 할 수 없습니다')}}
function listen(onText,onState,lang){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){onState('unsupported');return}
  stopListen();const r=new SR();r.lang=lang||'ko-KR';r.interimResults=true;r.continuous=false;
  r.onresult=e=>{let t='';for(const x of e.results)t+=x[0].transcript;onText(t,e.results[e.results.length-1].isFinal)};
  r.onerror=e=>onState('error',e.error);r.onend=()=>{REC=null;onState('end')};
  try{r.start();REC=r;onState('listening')}catch(e){onState('error','start')}
}
function speakIn(text,lang){try{if(!window.speechSynthesis)return toast('이 기기는 읽어 주기를 지원하지 않습니다');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.9;speechSynthesis.speak(u)}catch(e){}}
