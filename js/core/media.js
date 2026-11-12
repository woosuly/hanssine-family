/* core/media — 사진·동영상·파일을 Firebase Storage에 올리고, 가족 데이터에는 주소만 저장
   저장 위치: families/hanssine/media/{연-월}/{이름} (등록된 폰만 올릴 수 있음) */
const MEDIA_ON=()=>!LOCAL&&SYNC.live&&typeof firebase!=='undefined'&&!!firebase.storage;
const isRemote=u=>typeof u==='string'&&/^https?:/.test(u);
function dataToBlob(d){const i=d.indexOf(','),mime=(d.slice(0,i).match(/data:([^;]+)/)||[])[1]||'application/octet-stream',bin=atob(d.slice(i+1)),u=new Uint8Array(bin.length);
  for(let k=0;k<bin.length;k++)u[k]=bin.charCodeAt(k);return new Blob([u],{type:mime})}
// data: 주소를 올리고 내려받기 주소를 돌려줌. 서버를 못 쓰는 상태면 그대로 돌려줌
async function upMedia(data,name){
  if(!MEDIA_ON()||typeof data!=='string'||!data.startsWith('data:'))return data;
  const blob=dataToBlob(data);
  let ext=(name&&name.includes('.')?name.split('.').pop():blob.type.split('/')[1]||'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'bin';
  if(ext==='jpeg')ext='jpg';
  const path=`families/hanssine/media/${ymd(today0()).slice(0,7)}/${Date.now().toString(36)}${uid()}.${ext}`;
  const task=firebase.storage().ref(path).put(blob,{contentType:blob.type,customMetadata:{by:ME||''}});
  const big=blob.size>2e6;let last=-1;
  if(big)task.on('state_changed',s=>{const p=Math.floor(s.bytesTransferred/s.totalBytes*10)*10;if(p!==last){last=p;toast(`올리는 중… ${p}%`)}});
  else toast('올리는 중…');
  const snap=await task;return await snap.ref.getDownloadURL()}
async function upFile(f){if(!f)return f;const data=await upMedia(f.data,f.name);return {...f,data}}
// 사진을 지울 때 저장소 파일도 지움 (실패해도 무시)
function delMedia(url){if(!MEDIA_ON()||!isRemote(url)||!/firebasestorage/.test(url))return;try{firebase.storage().refFromURL(url).delete().catch(()=>{})}catch(e){}}
const upFail=e=>{console.warn('upload',e);toast('올리지 못했어요. 인터넷 연결을 확인해 주세요');return null};
