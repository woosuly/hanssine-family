/* features/steps — 부모님 걸음 수 자동 반영
   폰의 삼성 헬스(또는 다른 걸음 앱)가 Health Connect에 남긴 걸음 수를 앱(APK)에서 읽어 S.log[날짜][부모님].steps 에 저장
   앱을 열 때·앱으로 돌아올 때 오늘·어제 걸음 수를 갱신 (15분 간격). 5,000걸음을 넘으면 그날 운동은 한 것으로 표시 */
const STEP_GOAL=5000;
const HC=()=>NPLUG('HealthPlugin');
const stepsOf=(id,k)=>(((S.log[k]||{})[id]||{}).steps)||0;
const stepsTxt=n=>n?Number(n).toLocaleString('ko-KR')+'걸음':'';
let STEPS_AT=0;
async function stepsReady(){const H=HC();if(!H)return 'noapp';
  try{const a=await H.isHealthAvailable();if(!a||!a.available)return 'nohc';
    const p=await H.checkHealthPermissions({permissions:['READ_STEPS']});const ok=(p.permissions||[]).some(x=>x.READ_STEPS);return ok?'ok':'noperm'}catch(e){console.warn('health',e);return 'err'}}
async function stepsSync(force){if(!ME||!me()||me().role!=='parent'||!HC())return;if(!force&&Date.now()-STEPS_AT<15*60e3)return;
  if(await stepsReady()!=='ok')return;STEPS_AT=Date.now();
  const t=today0(),y=addDays(t,-1);
  try{const r=await HC().queryAggregated({startDate:y.toISOString(),endDate:new Date().toISOString(),dataType:'steps',bucket:'day'});
    let ch=false;(r.aggregatedData||[]).forEach(s=>{const k=ymd(new Date(s.startDate)),v=Math.round(s.value||0);if(!v)return;
      S.log[k]=S.log[k]||{};const x=S.log[k][ME]=S.log[k][ME]||{};
      if(Math.abs((x.steps||0)-v)>=50){x.steps=v;ch=true}
      if(v>=STEP_GOAL&&!x.ex){x.ex=true;ch=true}});
    if(ch){save();if(!busy())render()}}catch(e){console.warn('steps',e)}}
// 처음 한 번: 부모님께 걸음 수 연결 안내
async function stepsSetup(back){const st=await stepsReady();
  if(st==='noapp'){toast('앱을 새 버전으로 설치하면 걸음 수를 자동으로 가져올 수 있어요');return}
  if(st==='ok'){await stepsSync(true);toast('걸음 수를 가져왔어요');if(back)back();return}
  if(st==='nohc'){sheet(`<div class="result"><div class="big">걸음 수 연결 준비</div>
      <div class="fact" style="text-align:left">휴대폰에 'Health Connect'가 필요합니다.<br>① 아래 [설치하기]로 설치<br>② 삼성 헬스 → 설정 → Health Connect에서 연결 켜기<br>③ 다시 이 버튼 누르기</div>
      <div class="actions"><button class="btn ghost" id="hx">나중에</button><button class="btn" id="hi">설치하기</button></div></div>`,true,back||null);
    $('#hx').onclick=()=>{close();if(back)back()};$('#hi').onclick=()=>HC().showHealthConnectInPlayStore().catch(()=>{});return}
  sheet(`<div class="result"><div class="big">걸음 수를 자동으로<br>가져올까요?</div>
    <div class="fact" style="text-align:left">삼성 헬스에 기록된 걸음 수를 앱이 읽어서, 운동 기록에 자동으로 넣습니다. 다음 화면에서 '걸음 수'를 허용해 주세요.<br><span class="muted" style="font-size:.85em">걸음 수가 안 나오면 삼성 헬스 → 설정 → Health Connect에서 연결을 켜 주세요.</span></div>
    <div class="actions"><button class="btn ghost" id="hx">나중에</button><button class="btn" id="hy">네, 허용</button></div></div>`,true,back||null);
  $('#hx').onclick=()=>{setPref('stepsAsked',Date.now());close();if(back)back()};
  $('#hy').onclick=async()=>{try{const r=await HC().requestHealthPermissions({permissions:['READ_STEPS']});const ok=(r.permissions||[]).some(x=>x.READ_STEPS);
      if(ok){await stepsSync(true);toast('걸음 수를 연결했어요')}else{toast('허용되지 않았어요. Health Connect 앱에서 직접 허용할 수 있어요');HC().openHealthConnectSettings().catch(()=>{})}}
    catch(e){toast('연결하지 못했어요')}close();if(back)back();else render()}}
// 앱을 열 때: 부모님이고 아직 안 물어봤으면 한 번 안내, 연결돼 있으면 갱신
async function stepsAfterBoot(){if(!HC()||!me()||me().role!=='parent')return;const st=await stepsReady();
  if(st==='ok')return stepsSync(true);
  if((st==='noperm'||st==='nohc')&&!pref('stepsAsked',0)&&!busy()){setPref('stepsAsked',Date.now());stepsSetup()}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&SYNC.booted)stepsSync(false)});
