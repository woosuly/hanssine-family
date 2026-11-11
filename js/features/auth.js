
/* features/auth */
function renderWho(){
  document.body.classList.remove('senior');applyScale();
  const parents=S.members.filter(m=>m.role==='parent'),others=S.members.filter(m=>m.role!=='parent');
  $('#app').innerHTML=`<div class="wrap" style="padding-bottom:40px">
    <div class="brand" style="font-size:28px;margin-top:18px">${esc(S.family)} 가족</div>
    <p class="muted" style="margin:4px 0 20px">이 휴대폰을 쓰는 사람을 골라 주세요. 한 번 정하면 관리자 PIN 없이는 바뀌지 않습니다.</p>
    <div class="who parents">${parents.map(m=>`<button data-me="${m.id}">${av(m)}<span>${esc(m.name)}</span></button>`).join('')}</div>
    <div class="sec"><h2>자녀·손주</h2>
    <div class="who">${others.map(m=>`<button data-me="${m.id}">${av(m)}<span>${esc(m.name)}</span><span class="small muted">${HOUSES[m.house]}</span></button>`).join('')}</div></div>
    <p class="small muted" style="margin-top:24px">부모님 폰은 자녀가 대신 설정해 드립니다. ${LOCAL?'시제품 모드: 데이터가 이 기기에만 저장되고, 관리자 PIN은 0000입니다.':'처음 등록할 때 가족 초대 코드가 필요합니다. 이미 등록했는데 이 화면이 보이면 다른 브라우저나 새로 설치한 앱으로 연 경우예요. 같은 이름으로 다시 등록하면 됩니다.'}</p>
  </div>`;
  document.querySelectorAll('[data-me]').forEach(b=>b.onclick=()=>{const m=mem(b.dataset.me);
    sheet(`<div class="stack">${av(m,'')}<h2>이 휴대폰을 ${esc(m.name)} 폰으로 정할까요?</h2>
      <p class="muted">다른 가족의 화면은 볼 수 없게 됩니다. 바꾸려면 관리자(${esc(mem(S.master.member).name)}) PIN이 필요합니다.</p>
      <div class="field"><label for="wph">${m.role==='parent'?'전화번호 (부모님 번호, 자녀가 대신 입력)':'내 전화번호'}</label><input id="wph" inputmode="tel" value="${esc(m.phone||'')}" placeholder="010-0000-0000" autocomplete="tel"></div>
      <div class="small muted" style="margin-top:-6px">긴급 연락·문자 알림에 쓰입니다</div>
      ${!LOCAL&&!SYNC.dev?`<div class="field"><label for="wcode">가족 초대 코드</label><input id="wcode" autocomplete="off" placeholder="관리자에게 받은 코드"></div>`:''}
      <div class="small" id="wphmsg" style="color:var(--red)"></div>
      <button class="btn block" id="ok">${esc(m.name)}(으)로 정하기</button><button class="btn ghost block" id="no">다시 고르기</button></div>`);
    $('#no').onclick=close;
    $('#ok').onclick=()=>{const d=$('#wph').value.replace(/\D/g,'');
      if(!/^01\d{8,9}$/.test(d)){$('#wphmsg').textContent='휴대폰 번호를 정확히 입력해 주세요 (예: 010-1234-5678)';$('#wph').focus();return}
      const ph=d.replace(/^(\d{3})(\d{3,4})(\d{4})$/,'$1-$2-$3');
      if(!LOCAL){const code=$('#wcode')?$('#wcode').value.trim():'';if(!SYNC.dev&&code.length<4){$('#wphmsg').textContent='초대 코드를 입력해 주세요 (4자 이상)';$('#wcode').focus();return}
        $('#ok').disabled=true;$('#wphmsg').textContent='';
        joinAs(m.id,ph,code).then(()=>{close();TAB='home';VI=0;CHAT=[];render()}).catch(e=>{console.warn(e);$('#ok').disabled=false;$('#wphmsg').textContent='초대 코드가 맞지 않거나 연결이 불안정합니다'});return}
      m.phone=ph;save();
      ME=m.id;try{localStorage.setItem(KEY+'-device',ME)}catch(e){};close();TAB='home';VI=0;CHAT=[];render()}});
}
function pinSheet(){
  sheet(`<div class="stack"><h2>사용자 변경</h2><p class="muted">관리자 PIN 4자리를 입력하세요.</p>
    <div class="field"><label for="pin">관리자 PIN</label><input id="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></div>
    <div class="small" id="pmsg" style="color:var(--red)"></div>
    <button class="btn block" id="ok">확인</button><button class="btn ghost block" id="no">취소</button></div>`,isSenior());
  $('#no').onclick=close;$('#pin').focus();
  $('#ok').onclick=()=>{if($('#pin').value!==S.master.pin){$('#pmsg').textContent='PIN이 맞지 않습니다';return}
    ME=null;try{localStorage.removeItem(KEY+'-device')}catch(e){};close();render()};
}
