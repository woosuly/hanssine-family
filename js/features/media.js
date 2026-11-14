/* features/media — "○○ 틀어줘": 유튜브에서 노래·영상 바로 재생
   유튜브 검색 키(설정 > AI 연결의 Gemini 키에 YouTube Data API가 켜져 있으면 그대로 사용)가 있으면 첫 곡을 바로 재생,
   없으면 유튜브 검색 화면을 엶 (첫 곡을 한 번 누르면 재생) */
const YT_PKG='com.google.android.youtube';
const isMusicAsk=t=>/(틀어\s*(줘|주|줄|봐)|재생해|들려\s*(줘|주)|(노래|음악|트로트|동요|찬송가|가요|영상|뮤직비디오|노래방).*(듣고|보고)\s*싶)/.test(t)&&!/(알려\s*줘|일정|회비|사진\s*올려|에어컨|보일러|난방|히터|선풍기|불\s*좀|가습기)/.test(t);
function musicQuery(t){return t.replace(/(유튜브(에서)?|좀|한\s*번|한번|노래방|틀어\s*(줘|주세요|줄래|봐)|재생해\s*(줘|주세요)?|들려\s*(줘|주세요)|보여\s*(줘|주세요)|듣고\s*싶(어|다|네|어요)?|보고\s*싶(어|다|네|어요)?|[.?!~]+)/g,' ').replace(/\s+/g,' ').trim()}
function openApp(url,pkg){const P=NPLUG('HanssineNative');if(P&&P.openUrl){P.openUrl({url,pkg:pkg||''}).catch(()=>{try{window.open(url,'_blank')}catch(e){}});return}try{window.open(url,'_blank')}catch(e){location.href=url}}
async function ytFirst(q){const k=(aiCfg().keys||{}).gemini;if(!k)return null;
  const p=new URLSearchParams({part:'snippet',type:'video',maxResults:'1',q,key:k,regionCode:'KR',relevanceLanguage:'ko',videoEmbeddable:'true'});
  const r=await fetch('https://www.googleapis.com/youtube/v3/search?'+p);if(!r.ok)return null;const j=await r.json();const it=(j.items||[])[0];
  return it?{id:it.id.videoId,title:(it.snippet||{}).title||''}:null}
// 말에서 노래·영상 요청을 찾으면 유튜브를 열고 true
async function playAsk(t){if(!isMusicAsk(t))return false;const q=musicQuery(t);
  if(!q){toast('유튜브를 엽니다');openApp('https://www.youtube.com/',YT_PKG);return true}
  let hit=null;try{hit=await ytFirst(q)}catch(e){}
  if(hit){toast(`유튜브에서 '${hit.title.replace(/&quot;|&#39;|&amp;/g,'')}' 재생`);openApp('https://www.youtube.com/watch?v='+hit.id,YT_PKG)}
  else{toast(`유튜브에서 '${q}' 찾기`);openApp('https://www.youtube.com/results?search_query='+encodeURIComponent(q),YT_PKG)}
  return true}
