/* 한씨네 가족 앱 서버 기능: 새 대화·사진·일정·공지, 긴급 연락이 생기면 가족 폰에 푸시 알림 */
const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {Lunar} = require('lunar-javascript');
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
  if (doc.k === 'chat' && it.sys) {
    title = '가족 알림';
    body = it.text || '';
    tag = 'ann-' + it.id;
  } else if (doc.k === 'chat') {
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

// 빙고 대결 신청: 상대 폰에 알림
exports.notifyGame = onDocumentCreated('families/hanssine/games/{gid}', async (ev) => {
  const g = ev.data && ev.data.data();
  if (!g || g.status !== 'invite') return;
  const {members, devices} = await loadFamily();
  const who = members[g.a];
  const targets = devices.filter(d => d.member === g.b);
  const nm = g.type === 'omok' ? '오목' : '빙고';
  await send(targets, {k: 'game', id: ev.params.gid, title: `${nm} 대결 신청`, body: `${who ? who.name : '가족'}님이 ${nm} 한 판 하자고 해요`, tag: 'game-' + ev.params.gid});
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

// ── 예약 알림 ─────────────────────────────────────────────
// 날짜 계산은 한국 시간 기준. 날짜는 UTC 자정 Date로 다룸
const DAY = 864e5;
const kstToday = () => { const d = new Date(Date.now() + 9 * 3600e3); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
const ymd = d => d.toISOString().slice(0, 10);
const parseD = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
function L2S(y, m, d) { // 음력 → 양력 (없는 날은 하루 앞)
  for (let dd = d; dd >= d - 1; dd--) { try { const s = Lunar.fromYmd(y, m, dd).getSolar(); return new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay())); } catch (e) { /* 다음 */ } }
  return new Date(Date.UTC(y, m - 1, d));
}
// 앱의 evOn과 같은 규칙. 여러 날 일정은 시작일만 알림
function evOn(e, d) {
  const k = ymd(d);
  if (e.end) return e.date === k;
  if (!e.repeat || e.repeat === 'none') return e.date === k;
  if (k < e.date) return false;
  if (e.repeat === 'solar') { const s = parseD(e.date); return s.getUTCMonth() === d.getUTCMonth() && s.getUTCDate() === d.getUTCDate(); }
  for (const y of [d.getUTCFullYear() - 1, d.getUTCFullYear()]) if (ymd(L2S(y, e.lm, e.ld)) === k) return true;
  return false;
}
const bdIn = (m, y) => { const b = m.bd; if (!b || !b.m) return null; return b.cal === 'lunar' ? L2S(y, b.m, b.d) : new Date(Date.UTC(y, b.m - 1, b.d)); };
const isAnniv = e => e.type === 'bday' || e.type === 'jesa' || e.type === 'anniv' || (e.repeat && e.repeat !== 'none');
const whenTxt = n => (n === 0 ? '오늘' : n === 1 ? '내일' : '일주일 뒤');

// 매일 아침 8시: 기념일은 가족 대화방에 안내(→ 가족 알림), 그 밖의 일정은 '미리 알림'대로 본인들에게 알림, 부모님은 오늘 일정 모아서
exports.dailyEvents = onSchedule({schedule: '0 8 * * *', timeZone: 'Asia/Seoul'}, async () => {
  const [{state, members, devices}, evSnap] = await Promise.all([loadFamily(), FAM.collection('items').where('k', '==', 'events').get()]);
  const events = [];
  evSnap.forEach(d => { try { events.push(JSON.parse(d.data().j)); } catch (e) { /* 무시 */ } });
  const prefs = state.prefs || {};
  const today = kstToday();
  const per = {}; // 구성원 → 알림 줄
  const add = (id, line) => { (per[id] = per[id] || []).push(line); };
  const chatAnn = [];
  for (const n of [0, 1, 7]) {
    const d = new Date(today.getTime() + n * DAY), k = ymd(d);
    const items = events.filter(e => evOn(e, d));
    Object.values(members).forEach(m => { for (const y of [d.getUTCFullYear() - 1, d.getUTCFullYear()]) { const b = bdIn(m, y); if (b && ymd(b) === k) items.push({id: 'b' + m.id, title: m.name + (m.role === 'parent' ? ' 생신' : ' 생일') + (m.bd.cal === 'lunar' ? ' (음력)' : ''), type: 'bday', scope: 'all'}); } });
    for (const e of items) {
      const all = (e.scope || 'all') === 'all';
      if (isAnniv(e) && all) { if (n === 0 || n === 7) chatAnn.push({e, d, n}); continue; }
      const key = n === 0 ? 'day' : 'd' + n;
      const line = `${whenTxt(n)} ${e.title}${e.time ? ' ' + e.time : ''}${e.place ? ' · ' + e.place : ''}`;
      Object.values(members).forEach(m => {
        if (!canSee(e, m)) return;
        if ((e.remind || []).includes(key) || (n === 0 && m.role === 'parent')) add(m.id, line);
      });
    }
  }
  // 기념일 안내: 앱과 같은 id라 이미 남아 있으면 건너뜀(알림도 한 번만)
  for (const {e, d, n} of chatAnn) {
    const id = `ann-${ymd(d)}-${e.id}-${n}`;
    const text = n === 0 ? `오늘은 ${e.title}입니다` : `일주일 뒤 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일은 ${e.title}입니다`;
    await FAM.collection('items').doc('chat~' + id).create({k: 'chat', j: JSON.stringify({id, by: 'sys', ts: Date.now(), sys: true, text})}).catch(() => null);
  }
  for (const [mid, lines] of Object.entries(per)) {
    if ((prefs[mid] || {}).noti_event === false) continue;
    const uniq = [...new Set(lines)];
    await send(devices.filter(d => d.member === mid), {k: 'events', id: '', title: '일정 알림', body: clip(uniq.slice(0, 4).join('\n'), 160), tag: 'daily-' + ymd(today)});
  }
});

// 5분마다: '○시에 알려줘' 예약 알림 보내기 (보낸 예약은 지움)
// families/hanssine/rems/{id} {at, text, to:[구성원], by}
exports.sendReminders = onSchedule({schedule: 'every 5 minutes', timeZone: 'Asia/Seoul'}, async () => {
  const qs = await FAM.collection('rems').where('at', '<=', Date.now() + 60e3).limit(50).get();
  if (qs.empty) return;
  const {members, devices} = await loadFamily();
  for (const doc of qs.docs) {
    const r = doc.data();
    const by = members[r.by];
    const to = (r.to && r.to.length ? r.to : [r.by]);
    const mine = to.length === 1 && to[0] === r.by;
    await send(devices.filter(d => to.includes(d.member)), {k: 'rem', id: doc.id, title: mine ? '알림' : `알림 · ${by ? by.name : '가족'}`, body: clip(r.text, 160), tag: 'rem-' + doc.id}).catch(e => console.warn(e));
    await doc.ref.delete().catch(() => null);
  }
});
