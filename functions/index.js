/* 한씨네 가족 앱 서버 기능: 새 대화·사진·일정·공지, 긴급 연락이 생기면 가족 폰에 푸시 알림 */
const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {setGlobalOptions} = require('firebase-functions/v2');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const {getMessaging} = require('firebase-admin/messaging');

initializeApp();
setGlobalOptions({region: 'asia-northeast3', maxInstances: 3});

const db = getFirestore();
const FAM = db.collection('families').doc('hanssine');
// 목록 종류 → 개인 알림 설정 키(설정 > 내 알림)
const NOTI_KEY = {chat: 'chat', photos: 'photo', events: 'event', notices: 'notice'};

// 가족 데이터 읽기: 구성원, 설정, 알림 받을 폰
async function loadFamily() {
  const [st, mem, dev] = await Promise.all([
    FAM.collection('state').get(),
    FAM.collection('items').where('k', '==', 'members').get(),
    FAM.collection('devices').get(),
  ]);
  const state = {};
  st.forEach(d => { const x = d.data(); if (typeof x.j === 'string') { try { state[d.id] = JSON.parse(x.j); } catch (e) { /* 무시 */ } } });
  const members = {};
  mem.forEach(d => { try { const m = JSON.parse(d.data().j); members[m.id] = m; } catch (e) { /* 무시 */ } });
  const devices = dev.docs.map(d => ({id: d.id, ...d.data()})).filter(x => x.fcm);
  return {state, members, devices};
}

// 앱의 공개 범위 규칙과 같음
function canSee(item, m) {
  if (!m) return false;
  const s = item.scope || 'all', r = m.role;
  if (s === 'custom') return item.by === m.id || (item.who || []).includes(m.id);
  return s === 'all' || (s === 'adults' && r !== 'grand') || (s === 'kids' && r === 'child');
}

// 데이터 메시지로 보내고, 알림 표시는 앱의 서비스 워커가 함 (중복 표시 방지)
async function send(devs, data) {
  const tokens = [...new Set(devs.map(d => d.fcm))];
  if (!tokens.length) return;
  const payload = {};
  Object.entries(data).forEach(([k, v]) => { payload[k] = String(v ?? ''); });
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    data: payload,
    webpush: {headers: {Urgency: 'high', TTL: data.k === 'sos' ? '3600' : '86400'}},
    android: {priority: 'high'},
  });
  // 더 이상 쓰지 않는 토큰 정리
  const dead = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) dead.push(tokens[i]);
  });
  await Promise.all(devs.filter(d => dead.includes(d.fcm))
    .map(d => FAM.collection('devices').doc(d.id).update({fcm: FieldValue.delete()}).catch(() => null)));
}

const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// 새 대화·사진·일정·공지
exports.notifyNewItem = onDocumentCreated('families/hanssine/items/{id}', async (ev) => {
  const doc = ev.data && ev.data.data();
  if (!doc || !NOTI_KEY[doc.k]) return;
  let it;
  try { it = JSON.parse(doc.j); } catch (e) { return; }
  if (String(it.by || '').startsWith('ai:')) return; // AI 답변은 알리지 않음

  const {state, members, devices} = await loadFamily();
  const who = members[it.by];
  const name = who ? who.name : '가족';
  let title, body, tag;
  if (doc.k === 'chat') {
    title = `${name} · 가족 대화`;
    body = it.text || (it.sticker || it.act ? '이모티콘을 보냈어요' : it.img ? '사진을 보냈어요' : it.file ? '파일을 보냈어요' : '메시지를 보냈어요');
    tag = 'chat';
  } else if (doc.k === 'photos') {
    title = '새 사진';
    body = `${name}님이 사진을 올렸어요${it.caption ? ' · ' + it.caption : ''}`;
    tag = 'photos';
  } else if (doc.k === 'events') {
    title = '새 일정';
    body = `${it.date || ''} ${it.title || ''}`.trim();
    tag = 'events-' + it.id;
  } else {
    title = `공지 · ${name}`;
    body = it.text || '';
    tag = 'notices-' + it.id;
  }
  const prefs = state.prefs || {};
  const targets = devices.filter(d => {
    const m = members[d.member];
    if (!m || d.member === it.by) return false;
    if (!canSee(it, m)) return false;
    return (prefs[d.member] || {})['noti_' + NOTI_KEY[doc.k]] !== false;
  });
  await send(targets, {k: doc.k, id: it.id || '', title: clip(title, 60), body: clip(body, 160), tag});
});

// 긴급 연락: 부모님이 '긴급 연락'을 누르면 지정된 가족에게 즉시 알림
exports.notifySos = onDocumentCreated('families/hanssine/alerts/{id}', async (ev) => {
  const a = ev.data && ev.data.data();
  if (!a || a.type !== 'sos') return;
  const {state, members, devices} = await loadFamily();
  const who = members[a.by];
  const to = state.emergency || [];
  const targets = devices.filter(d => d.member !== a.by && to.includes(d.member));
  await send(targets, {
    k: 'sos', id: ev.params.id,
    title: '긴급 연락',
    body: `${who ? who.name : '부모님'}께서 긴급 연락을 누르셨어요. 바로 전화해 주세요.${who && who.phone ? ' ' + who.phone : ''}`,
    tag: 'sos-' + ev.params.id,
  });
});

// 따로 만든 대화방: 방 멤버에게만 알림
exports.notifyRoomMsg = onDocumentCreated('families/hanssine/rooms/{rid}/msgs/{mid}', async (ev) => {
  const doc = ev.data && ev.data.data();
  if (!doc) return;
  let it;
  try { it = JSON.parse(doc.j); } catch (e) { return; }
  if (it.sys) return; // 초대·나감 안내는 알리지 않음
  const roomSnap = await FAM.collection('rooms').doc(ev.params.rid).get();
  if (!roomSnap.exists) return;
  const room = roomSnap.data();
  const {state, members, devices} = await loadFamily();
  const who = members[it.by];
  const prefs = state.prefs || {};
  const targets = devices.filter(d => d.member !== it.by && (room.members || []).includes(d.member)
    && (prefs[d.member] || {}).noti_chat !== false);
  const body = it.text || (it.sticker || it.act ? '이모티콘을 보냈어요' : it.img ? '사진을 보냈어요' : it.file ? '파일을 보냈어요' : '메시지를 보냈어요');
  await send(targets, {k: 'room', id: ev.params.rid, title: clip(`${who ? who.name : '가족'} · ${room.title || '대화방'}`, 60), body: clip(body, 160), tag: 'room-' + ev.params.rid});
});
