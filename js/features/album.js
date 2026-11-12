
/* features/album */
let ALBUMF=null;
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
  const grid=list=>list.length?`<div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${list.map(p=>{const rc=Object.keys(p.reacts||{}).length;return `<button class="ph" data-ph="${p.id}"><img src="${p.img}" alt="${esc(p.caption)}" loading="lazy">${rc||cmtCount(p)?`<span class="rcb num">${rc?'♥ '+rc:''}${rc&&cmtCount(p)?' · ':''}${cmtCount(p)?'댓글 '+cmtCount(p):''}</span>`:''}</button>`}).join('')}</div>`:`<div class="card muted">사진이 없습니다</div>`;
  if(ALBUMF){const f=S.folders.find(x=>x.id===ALBUMF);const name=ALBUMF==='all'?'전체 사진':ALBUMF==='mem'?'추억 · 지난해 이맘때':f?f.name:'';
    const list=ALBUMF==='all'?vis:ALBUMF==='mem'?memories(vis):vis.filter(p=>p.folder===ALBUMF);
    return `<div class="albh"><button class="backlink" id="fback">${BACKSVG}폴더</button><b>${esc(name)}</b><span class="small muted num">${list.length}장</span>${canFolder(f)?`<button class="chip" id="fedit">편집</button>`:''}</div>
      <div class="row" style="margin:8px 0">${bySel}</div>${grid(list)}`}
  const cards=[{id:'all',name:'전체 사진',list:vis},...(memories(vis).length?[{id:'mem',name:'추억',list:memories(vis)}]:[]),...S.folders.map(f=>({id:f.id,name:f.name,list:vis.filter(p=>p.folder===f.id)}))];
  return `<div class="row between" style="margin-top:8px"><h2>앨범</h2>${bySel}</div>
    <div class="folders">${cards.map(c=>`<button class="fcard" data-f="${c.id}"><span class="fcov">${c.list[0]?`<img src="${c.list[0].img}" alt="">`:IC.folder}</span><b>${esc(c.name)}</b><span class="small muted num">${c.list.length}장</span></button>`).join('')}
      <button class="fcard fnew" id="fnew"><span class="fcov">${IC.plus}</span><b>새 폴더</b><span class="small muted">만들기</span></button></div>`;
}
function bindAlbum(){
  $('#byf').onchange=e=>{FILTER.by=e.target.value;renderMain()};
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{ALBUMF=b.dataset.f;renderMain();window.scrollTo(0,0)});
  if($('#fback'))$('#fback').onclick=()=>{ALBUMF=null;renderMain()};
  if($('#fnew'))$('#fnew').onclick=()=>folderForm();
  if($('#fedit'))$('#fedit').onclick=()=>folderForm(S.folders.find(x=>x.id===ALBUMF));
  document.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>photoDetail(b.dataset.ph));
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
function photoDetail(id){
  const p=S.photos.find(x=>x.id===id);const mine=p.by===ME||isAdmin();const my=(p.reacts||{})[ME];p.comments=p.comments||[];
  const tm=ts=>{const d=new Date(ts);return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
  const cm=(c,pid)=>`<div class="cmt ${pid?'re':''}">${av(mem(c.by)||{name:'?',color:'#888'})}<div class="cmtb"><div><b>${esc((mem(c.by)||{name:'?'}).name)}</b> <span class="small muted">${tm(c.ts)}</span></div><div class="cmtt">${esc(c.text)}</div>
    <div class="cmta">${pid?'':`<button class="link" data-rep="${c.id}">답글</button>`}${c.by===ME?`<button class="link" data-cdel="${pid?pid+':'+c.id:c.id}">삭제</button>`:''}</div></div></div>`;
  const rp=REPLY&&p.comments.find(c=>c.id===REPLY);
  sheet(`<div class="stack"><img src="${p.img}" alt="" style="border-radius:12px;width:100%;max-height:46vh;object-fit:cover">
    <div><b>${esc(p.caption)}</b><div class="small muted">${esc(byLabel(mem(p.by)))} · ${md(parse(p.date))} · ${SCOPES[p.scope]}</div></div>
    ${mine?`<div class="field"><label for="pfold">폴더</label>${folderSel(p.folder)}</div>`:`<div class="small muted">폴더 · ${esc(fname(p.folder))}</div>`}
    <div class="emorow">${EMO6.map(e=>`<button data-r="${e}" class="${my===e?'on':''}" aria-label="${e} 남기기">${e}</button>`).join('')}</div>
    ${Object.keys(p.reacts||{}).length?`<div class="rsums">${reactSummary(p)}</div>`:''}
    <div class="cmts"><div class="small muted">댓글 ${cmtCount(p)}</div>${p.comments.map(c=>cm(c)+(c.replies||[]).map(r=>cm(r,c.id)).join('')).join('')||''}</div>
    ${rp?`<div class="replybar"><span>${esc((mem(rp.by)||{name:''}).name)}님에게 답글</span><button class="link" id="repx">취소</button></div>`:''}
    <div class="cbar"><textarea id="pcq" rows="1" placeholder="${rp?'답글 달기':'댓글 달기'}"></textarea>${ib('pcsend','send','보내기','primary')}</div>
    ${mine?`<button class="btn ghost block" id="del">이 사진 삭제</button>`:''}</div>`);
  document.querySelectorAll('.emorow [data-r]').forEach(b=>b.onclick=()=>{p.reacts=p.reacts||{};if(p.reacts[ME]===b.dataset.r)delete p.reacts[ME];else p.reacts[ME]=b.dataset.r;save();photoDetail(id)});
  document.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>{REPLY=b.dataset.rep;photoDetail(id);setTimeout(()=>$('#pcq')&&$('#pcq').focus(),50)});
  if($('#repx'))$('#repx').onclick=()=>{REPLY=null;photoDetail(id)};
  document.querySelectorAll('[data-cdel]').forEach(b=>b.onclick=()=>{const [a,c]=b.dataset.cdel.split(':');if(c){const t=p.comments.find(x=>x.id===a);t.replies=(t.replies||[]).filter(x=>x.id!==c)}else p.comments=p.comments.filter(x=>x.id!==a);save();photoDetail(id)});
  const send=()=>{const t=$('#pcq').value.trim();if(!t)return;const c={id:uid(),by:ME,text:t.slice(0,300),ts:Date.now()};
    if(rp){rp.replies=rp.replies||[];rp.replies.push(c);REPLY=null}else p.comments.push(c);save();photoDetail(id);setTimeout(()=>{const s=$('.sheet');if(s)s.scrollTop=s.scrollHeight},30)};
  $('#pcsend').onclick=send;$('#pcq').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}};
  if($('#pfold'))$('#pfold').onchange=e=>{if(e.target.value==='__new')return folderForm(null,fid=>{p.folder=fid;p.tag=fname(fid);save();photoDetail(id)});p.folder=e.target.value;p.tag=fname(p.folder);save();toast(fname(p.folder)+' 폴더로 옮겼어요')};
  if($('#del'))$('#del').onclick=()=>{$('#del').outerHTML=`<button class="btn block" style="background:var(--red)" id="del2">삭제 확인</button>`;$('#del2').onclick=()=>{delMedia(p.img);S.photos=S.photos.filter(x=>x.id!==id);save();close();renderMain()}};
}
function newPhotos(){return S.photos.filter(canSee).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)}
