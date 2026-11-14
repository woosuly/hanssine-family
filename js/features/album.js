
/* features/album */
let ALBUMF=null,SELM=false;const SELP=new Set();
const canEditPh=p=>p.by===ME||isAdmin();
// 폴더는 가족이 직접 만듦. 예전 기본 폴더(손주·풍경·모임)는 사진이 없으면 정리
function ensureFolders(){if(!S.folders)S.folders=[];if(!LOCAL&&!SYNC.live)return;if(S.foldersV===2)return;
  const used=new Set(S.photos.map(p=>p.folder));S.folders=S.folders.filter(f=>!['f_grand','f_scene','f_meet'].includes(f.id)||used.has(f.id));S.foldersV=2;save()}
const fname=id=>(S.folders.find(f=>f.id===id)||{name:'폴더 없음'}).name;
function memories(list){const t=today0();return list.filter(p=>{const d=parse(p.date);return d.getFullYear()<t.getFullYear()&&d.getMonth()===t.getMonth()&&Math.abs(d.getDate()-t.getDate())<=3})}
const canFolder=f=>f&&(f.by===ME||isAdmin());
function albumView(){
  const people=[...new Set(S.photos.map(p=>p.by))].map(mem);
  const vis=S.photos.filter(canSee).filter(p=>!FILTER.by||p.by===FILTER.by).sort((a,b)=>b.date.localeCompare(a.date));
  const bySel=`<select id="byf" class="chip" aria-label="올린 사람"><option value="">올린 사람 전체</option>${people.map(p=>`<option value="${p.id}" ${FILTER.by===p.id?'selected':''}>${esc(byLabel(p))}</option>`).join('')}</select>`;
  const grid=list=>list.length?`<div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${list.map(p=>{const rc=Object.keys(p.reacts||{}).length;return `<button class="ph ${SELM&&SELP.has(p.id)?'sel':''}" data-ph="${p.id}">${SELM?`<i class="ck">${SELP.has(p.id)?'✓':''}</i>`:''}<img src="${p.img}" alt="${esc(p.caption)}" loading="lazy">${rc||cmtCount(p)?`<span class="rcb num">${rc?'♥ '+rc:''}${rc&&cmtCount(p)?' · ':''}${cmtCount(p)?'댓글 '+cmtCount(p):''}</span>`:''}</button>`}).join('')}</div>`:`<div class="card muted">사진이 없습니다</div>`;
  if(ALBUMF){const f=S.folders.find(x=>x.id===ALBUMF);const name=ALBUMF==='all'?'전체 사진':ALBUMF==='mem'?'추억 · 지난해 이맘때':f?f.name:'';
    const list=ALBUMF==='all'?vis:ALBUMF==='mem'?memories(vis):vis.filter(p=>p.folder===ALBUMF);
    return `<div class="albh"><button class="backlink" id="fback">${BACKSVG}폴더</button><b>${esc(name)}</b><span class="small muted num">${list.length}장</span>${list.length?`<button class="chip ${SELM?'on':''}" id="selm">${SELM?'선택 끝':'선택'}</button>`:''}${canFolder(f)&&!SELM?`<button class="chip" id="fedit">편집</button>`:''}</div>
      <div class="row" style="margin:8px 0">${bySel}</div>${grid(list)}
      ${SELM?`<div class="selbar"><div class="in"><b>${SELP.size}장 선택</b><button class="btn ghost" id="selmv" ${SELP.size?'':'disabled'}>폴더로 옮기기</button><button class="btn" id="seldel" style="background:var(--red)" ${SELP.size?'':'disabled'}>삭제</button></div></div>`:''}`}
  const cards=[{id:'all',name:'전체 사진',list:vis},...(memories(vis).length?[{id:'mem',name:'추억',list:memories(vis)}]:[]),...S.folders.map(f=>({id:f.id,name:f.name,list:vis.filter(p=>p.folder===f.id)}))];
  return `<div class="row between" style="margin-top:8px"><h2>앨범</h2>${bySel}</div>
    <div class="folders">${cards.map(c=>`<button class="fcard" data-f="${c.id}"><span class="fcov">${c.list[0]?`<img src="${c.list[0].img}" alt="">`:IC.folder}</span><b>${esc(c.name)}</b><span class="small muted num">${c.list.length}장</span></button>`).join('')}
      <button class="fcard fnew" id="fnew"><span class="fcov">${IC.plus}</span><b>새 폴더</b><span class="small muted">만들기</span></button></div>`;
}
function bindAlbum(){
  $('#byf').onchange=e=>{FILTER.by=e.target.value;renderMain()};
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{ALBUMF=b.dataset.f;renderMain();window.scrollTo(0,0)});
  if($('#fback'))$('#fback').onclick=()=>{ALBUMF=null;SELM=false;SELP.clear();renderMain()};
  if($('#selm'))$('#selm').onclick=()=>{SELM=!SELM;SELP.clear();renderMain()};
  if($('#selmv'))$('#selmv').onclick=()=>moveSel();
  if($('#seldel'))$('#seldel').onclick=()=>delSel();
  if($('#fnew'))$('#fnew').onclick=()=>folderForm();
  if($('#fedit'))$('#fedit').onclick=()=>folderForm(S.folders.find(x=>x.id===ALBUMF));
  document.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{const id=b.dataset.ph;if(!SELM)return photoDetail(id);
    const p=S.photos.find(x=>x.id===id);if(!p)return;if(!canEditPh(p)){toast('다른 가족이 올린 사진은 고를 수 없어요');return}
    SELP.has(id)?SELP.delete(id):SELP.add(id);const y=scrollY;renderMain();scrollTo(0,y)});
  $('#add').onclick=()=>$('#file').click();
  $('#file').onchange=e=>{const f=e.target.files[0];if(f)compress(f).then(uploadForm).catch(()=>{});e.target.value=''};
}
function folderForm(f,after){const isNew=!f;
  sheet(`<div class="stack"><h2>${isNew?'새 폴더':'폴더 편집'}</h2>
    <div class="field"><label for="fn">폴더 이름</label><input id="fn" maxlength="20" value="${esc(f?f.name:'')}" placeholder="예: 2026 제주 여행"></div>
    <div class="actions">${isNew?'':`<button class="btn ghost" id="fdel">폴더 삭제</button>`}<button class="btn" id="fsv">${isNew?'만들기':'저장'}</button></div>
    ${isNew?'':'<div class="small muted">폴더를 지워도 사진은 지워지지 않고 \'모임\' 폴더로 옮겨집니다.</div>'}</div>`,false,after||null);
  $('#fsv').onclick=()=>{const n=$('#fn').value.trim();if(!n){toast('이름을 입력해 주세요');return}
    if(isNew){const nf={id:'f'+uid(),name:n,by:ME};S.folders.push(nf);save();toast('폴더를 만들었어요');if(after){after(nf.id);return}ALBUMF=nf.id}else{f.name=n;save()}close();renderMain()};
  if($('#fdel'))$('#fdel').onclick=()=>{$('#fdel').outerHTML='<button class="btn" style="background:var(--red)" id="fdel2">삭제 확인</button>';
    $('#fdel2').onclick=()=>{S.photos.forEach(p=>{if(p.folder===f.id)p.folder=''});S.folders=S.folders.filter(x=>x!==f);ALBUMF=null;save();close();renderMain()}};
}
function folderSel(cur){return `<select id="pfold"><option value="" ${cur?'':'selected'}>폴더 없음 (전체 사진에만)</option>${S.folders.map(f=>`<option value="${f.id}" ${f.id===cur?'selected':''}>${esc(f.name)}</option>`).join('')}<option value="__new">+ 새 폴더 만들기</option></select>`}
function uploadForm(img,fid){
  fid=fid||(ALBUMF&&S.folders.some(f=>f.id===ALBUMF)?ALBUMF:'');
  sheet(`<div class="stack"><h2>사진 올리기</h2><img src="${img}" alt="" style="border-radius:12px;max-height:240px;object-fit:cover;width:100%">
    <div class="field"><label for="cap">한 줄 설명</label><input id="cap" maxlength="40" placeholder="예: 시험 끝난 날"></div>
    <div class="field"><label for="pfold">폴더</label>${folderSel(fid)}</div>
    <div class="field"><label for="scope">공개 범위</label><select id="scope">${Object.entries(SCOPES).filter(([k])=>me().role==='child'||k!=='kids').map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
    <button class="btn block" id="up">올리기</button></div>`);
  $('#pfold').onchange=e=>{if(e.target.value==='__new')folderForm(null,id=>uploadForm(img,id))};
  $('#up').onclick=async()=>{const fd=$('#pfold').value,cap=$('#cap').value.trim()||'새 사진',sc=$('#scope').value;$('#up').disabled=true;
    const url=await upMedia(img,'photo.jpg').catch(upFail);if(!url){$('#up').disabled=false;return}
    S.photos.push({id:uid(),by:ME,folder:fd,tag:fname(fd),caption:cap,date:ymd(today0()),scope:sc,img:url,reacts:{}});save();close();toast('올렸어요');renderMain()};
}
function cmtCount(p){return (p.comments||[]).reduce((a,c)=>a+1+(c.replies||[]).length,0)}
function reactSummary(p){const g={};Object.entries(p.reacts||{}).forEach(([k,v])=>{(g[v]=g[v]||[]).push(mem(k)?mem(k).name:'')});
  return Object.entries(g).map(([v,ns])=>`<span class="rsum" title="${esc(ns.join(', '))}">${esc(v)} <b class="num">${ns.length}</b><span class="small muted">${esc(ns.join(', '))}</span></span>`).join('')}
let REPLY=null;
function photoInfo(id){
  const p=S.photos.find(x=>x.id===id);const mine=p.by===ME||isAdmin();const my=(p.reacts||{})[ME];p.comments=p.comments||[];
  const tm=ts=>{const d=new Date(ts);return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
  const cm=(c,pid)=>`<div class="cmt ${pid?'re':''}">${av(mem(c.by)||{name:'?',color:'#888'})}<div class="cmtb"><div><b>${esc((mem(c.by)||{name:'?'}).name)}</b> <span class="small muted">${tm(c.ts)}</span></div><div class="cmtt">${esc(c.text)}</div>
    <div class="cmta">${pid?'':`<button class="link" data-rep="${c.id}">답글</button>`}${c.by===ME?`<button class="link" data-cdel="${pid?pid+':'+c.id:c.id}">삭제</button>`:''}</div></div></div>`;
  const rp=REPLY&&p.comments.find(c=>c.id===REPLY);
  sheet(`<div class="stack"><div class="row" style="gap:10px;align-items:center"><img src="${p.img}" alt="" style="width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none">
    <div style="min-width:0"><b>${esc(p.caption||'사진')}</b><div class="small muted">${esc(byLabel(mem(p.by)))} · ${md(parse(p.date))} · ${SCOPES[p.scope]}</div></div></div>
    ${mine?`<div class="field"><label for="pfold">폴더</label>${folderSel(p.folder)}</div>`:`<div class="small muted">폴더 · ${esc(fname(p.folder))}</div>`}
    <div class="emorow">${EMO6.map(e=>`<button data-r="${e}" class="${my===e?'on':''}" aria-label="${e} 남기기">${e}</button>`).join('')}</div>
    ${Object.keys(p.reacts||{}).length?`<div class="rsums">${reactSummary(p)}</div>`:''}
    <div class="cmts"><div class="small muted">댓글 ${cmtCount(p)}</div>${p.comments.map(c=>cm(c)+(c.replies||[]).map(r=>cm(r,c.id)).join('')).join('')||''}</div>
    ${rp?`<div class="replybar"><span>${esc((mem(rp.by)||{name:''}).name)}님에게 답글</span><button class="link" id="repx">취소</button></div>`:''}
    <div class="cbar"><textarea id="pcq" rows="1" placeholder="${rp?'답글 달기':'댓글 달기'}"></textarea>${ib('pcsend','send','보내기','primary')}</div>
    ${mine?`<button class="btn ghost block" id="del">이 사진 삭제</button>`:''}</div>`,false,()=>photoView(id));
  document.querySelectorAll('.emorow [data-r]').forEach(b=>b.onclick=()=>{p.reacts=p.reacts||{};if(p.reacts[ME]===b.dataset.r)delete p.reacts[ME];else p.reacts[ME]=b.dataset.r;save();photoInfo(id)});
  document.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>{REPLY=b.dataset.rep;photoInfo(id);setTimeout(()=>$('#pcq')&&$('#pcq').focus(),50)});
  if($('#repx'))$('#repx').onclick=()=>{REPLY=null;photoInfo(id)};
  document.querySelectorAll('[data-cdel]').forEach(b=>b.onclick=()=>{const [a,c]=b.dataset.cdel.split(':');if(c){const t=p.comments.find(x=>x.id===a);t.replies=(t.replies||[]).filter(x=>x.id!==c)}else p.comments=p.comments.filter(x=>x.id!==a);save();photoInfo(id)});
  const send=()=>{const t=$('#pcq').value.trim();if(!t)return;const c={id:uid(),by:ME,text:t.slice(0,300),ts:Date.now()};
    if(rp){rp.replies=rp.replies||[];rp.replies.push(c);REPLY=null}else p.comments.push(c);save();photoInfo(id);setTimeout(()=>{const s=$('.sheet');if(s)s.scrollTop=s.scrollHeight},30)};
  $('#pcsend').onclick=send;$('#pcq').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}};
  if($('#pfold'))$('#pfold').onchange=e=>{if(e.target.value==='__new')return folderForm(null,fid=>{p.folder=fid;p.tag=fname(fid);save();photoInfo(id)});p.folder=e.target.value;p.tag=fname(p.folder);save();toast(fname(p.folder)+' 폴더로 옮겼어요')};
  if($('#del'))$('#del').onclick=()=>{$('#del').outerHTML=`<button class="btn block" style="background:var(--red)" id="del2">삭제 확인</button>`;$('#del2').onclick=()=>{delMedia(p.img);S.photos=S.photos.filter(x=>x.id!==id);save();close();renderMain()}};
}
function newPhotos(){return S.photos.filter(canSee).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)}

// 여러 장 선택: 폴더로 옮기기·삭제 (내가 올린 사진만, 관리자는 전부)
function moveSel(){const ids=[...SELP];
  sheet(`<div class="stack"><h2>${ids.length}장 옮기기</h2><div class="field"><label for="pfold">옮길 폴더</label>${folderSel(ALBUMF&&S.folders.some(f=>f.id===ALBUMF)?ALBUMF:'')}</div><button class="btn block" id="mvok">옮기기</button></div>`);
  const go=fid=>{S.photos.forEach(p=>{if(SELP.has(p.id)){p.folder=fid;p.tag=fname(fid)}});save();SELM=false;SELP.clear();close();renderMain();toast(`${ids.length}장을 ${fname(fid)}(으)로 옮겼어요`)};
  $('#pfold').onchange=e=>{if(e.target.value==='__new')folderForm(null,fid=>go(fid))};
  $('#mvok').onclick=()=>{const v=$('#pfold').value;if(v!=='__new')go(v)}}
function delSel(){const n=SELP.size;
  sheet(`<div class="stack"><h2>사진 ${n}장 삭제</h2><div>고른 사진 ${n}장을 지울까요? 지운 사진은 되돌릴 수 없어요.</div>
    <div class="actions"><button class="btn ghost" id="dx">취소</button><button class="btn" id="dok" style="background:var(--red)">삭제</button></div></div>`);
  $('#dx').onclick=close;
  $('#dok').onclick=()=>{S.photos.filter(p=>SELP.has(p.id)).forEach(p=>delMedia(p.img));S.photos=S.photos.filter(p=>!SELP.has(p.id));save();SELM=false;SELP.clear();close();renderMain();toast(`${n}장을 지웠어요`)}}

// ── 사진 크게 보기: 어두운 화면에 사진 전체, 확대(두 손가락·두 번 톡), 옆으로 밀어 넘기기,
//    아래 올린 사람·날짜·설명, 오른쪽 ♥·댓글 수, ⋯ 메뉴(폴더·공유·삭제)
let PVLIST=[];
function photoDetail(id){const ids=[...document.querySelectorAll('[data-ph]')].map(b=>b.dataset.ph);PVLIST=ids.includes(id)?ids:[id];photoView(id)}
function photoView(id){const p=S.photos.find(x=>x.id===id);if(!p){close();return}const who=mem(p.by)||{name:'?',color:'#888'};
  const rc=Object.keys(p.reacts||{}).length,cc=cmtCount(p),my=(p.reacts||{})[ME],k=PVLIST.indexOf(id);
  $('#layer').innerHTML=`<div class="pv" id="pv"><div class="pvtop"><button class="pvb" id="pvx" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><span class="small">${PVLIST.length>1?`${k+1} / ${PVLIST.length}`:''}</span><button class="pvb" id="pvm" aria-label="메뉴"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></div>
    <div class="pvstage" id="pvs"><img id="pvi" src="${p.img}" alt="${esc(p.caption||'')}" draggable="false"></div>
    <div class="pvside"><button class="pvb big ${my?'on':''}" id="pvh" aria-label="공감"><span>${my||'♡'}</span></button><button class="pvn" id="pvhn">${rc||''}</button>
      <button class="pvb big" id="pvc" aria-label="댓글"><svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg></button><span class="pvn">${cc||''}</span></div>
    <div class="pvbot">${av(who)}<div style="min-width:0"><b>${esc(who.name)}</b> <span class="small" style="opacity:.75">· ${md(parse(p.date))}${p.tag?' · '+esc(p.tag):''}</span>${p.caption?`<div class="pvcap">${esc(p.caption)}</div>`:''}
      ${(p.comments||[]).length?`<button class="pvlast" id="pvlast"><b>${esc((mem(p.comments.at(-1).by)||{}).name||'')}</b> ${esc(p.comments.at(-1).text)}${cc>1?` <span style="opacity:.7">· 댓글 ${cc}개 모두 보기</span>`:''}</button>`:''}</div></div></div>`;
  BACK=null;
  const go=d=>{const n=PVLIST[k+d];if(n)photoView(n)};
  $('#pvx').onclick=()=>{close();render()};
  $('#pvc').onclick=()=>photoInfo(id);if($('#pvlast'))$('#pvlast').onclick=()=>photoInfo(id);
  $('#pvh').onclick=()=>{p.reacts=p.reacts||{};if(p.reacts[ME])delete p.reacts[ME];else p.reacts[ME]='❤️';save();try{navigator.vibrate&&navigator.vibrate(15)}catch(e){}photoView(id)};
  $('#pvhn').onclick=()=>{if(!rc)return;sheet(`<div class="stack"><h2>공감 ${rc}</h2>${Object.entries(p.reacts).map(([m,e])=>`<div class="hh">${av(mem(m)||{name:'?',color:'#888'})}<span style="flex:1">${esc((mem(m)||{}).name||'')}</span><span style="font-size:22px">${e}</span></div>`).join('')}
      <div class="small muted">다른 표정으로 남기기</div><div class="emorow">${EMO6.map(e=>`<button data-r="${e}" class="${my===e?'on':''}">${e}</button>`).join('')}</div></div>`,false,()=>photoView(id));
    document.querySelectorAll('.emorow [data-r]').forEach(b=>b.onclick=()=>{p.reacts=p.reacts||{};p.reacts[ME]=b.dataset.r;save();photoView(id)})};
  $('#pvm').onclick=()=>{const mine=p.by===ME||isAdmin();
    sheet(`<div class="stack"><h2>사진</h2><button class="btn ghost block" id="pvsh">공유하기</button><button class="btn ghost block" id="pvo">원본으로 보기</button>
      ${mine?`<div class="field"><label for="pfold">폴더 옮기기</label>${folderSel(p.folder)}</div><button class="btn ghost block" id="pvd" style="color:var(--red)">이 사진 삭제</button>`:''}</div>`,false,()=>photoView(id));
    $('#pvsh').onclick=()=>{close();shareText([p.caption,/^https?:/.test(p.img)?p.img:''].filter(Boolean).join('\n')||'가족 사진');photoView(id)};
    $('#pvo').onclick=()=>viewFile({data:p.img,type:'image/jpeg',name:p.caption||'사진'});
    if($('#pfold'))$('#pfold').onchange=e=>{if(e.target.value==='__new')return folderForm(null,fid=>{p.folder=fid;p.tag=fname(fid);save();photoView(id)});p.folder=e.target.value;p.tag=fname(p.folder);save();toast(fname(p.folder)+' 폴더로 옮겼어요');photoView(id)};
    if($('#pvd'))$('#pvd').onclick=()=>{const b=$('#pvd');if(!b.dataset.sure){b.dataset.sure=1;b.textContent='삭제 확인';return}delMedia(p.img);S.photos=S.photos.filter(x=>x.id!==id);PVLIST=PVLIST.filter(x=>x!==id);save();close();renderMain()}};
  // 확대·이동·넘기기
  const st=$('#pvs'),im=$('#pvi');let sc=1,tx=0,ty=0,P=new Map(),d0=0,s0=1,sx=0,sy=0,tx0=0,ty0=0,lastTap=0,moved=false;
  const apply=()=>{im.style.transform=`translate(${tx}px,${ty}px) scale(${sc})`};
  const clampXY=()=>{const r=st.getBoundingClientRect(),mx=r.width*(sc-1)/2,my=r.height*(sc-1)/2;tx=Math.max(-mx,Math.min(mx,tx));ty=Math.max(-my,Math.min(my,ty))};
  st.onpointerdown=e=>{st.setPointerCapture(e.pointerId);P.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;
    if(P.size===2){const [a,b]=[...P.values()];d0=Math.hypot(a.x-b.x,a.y-b.y);s0=sc}else{sx=e.clientX;sy=e.clientY;tx0=tx;ty0=ty}};
  st.onpointermove=e=>{if(!P.has(e.pointerId))return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(P.size===2){const [a,b]=[...P.values()];sc=Math.max(1,Math.min(4,s0*Math.hypot(a.x-b.x,a.y-b.y)/(d0||1)));clampXY();apply();moved=true;return}
    const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>8)moved=true;
    if(sc>1){tx=tx0+dx;ty=ty0+dy;clampXY();apply()}else{im.style.transform=`translateX(${dx}px)`}};
  st.onpointerup=st.onpointercancel=e=>{const wasPinch=P.size===2;P.delete(e.pointerId);if(wasPinch){if(sc<1.05){sc=1;tx=ty=0;apply()}return}if(P.size)return;
    const dx=e.clientX-sx;
    if(sc===1&&moved){if(dx<-60&&PVLIST[k+1])return go(1);if(dx>60&&PVLIST[k-1])return go(-1);im.style.transform='';return}
    if(!moved){const now=Date.now();if(now-lastTap<300){if(sc>1){sc=1;tx=ty=0}else{sc=2.5;const r=st.getBoundingClientRect();tx=(r.left+r.width/2-e.clientX)*1.5;ty=(r.top+r.height/2-e.clientY)*1.5;clampXY()}apply();lastTap=0}else lastTap=now}};
}
