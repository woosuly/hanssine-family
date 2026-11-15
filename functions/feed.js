/*
 * 설연(부부 앱)으로 한씨네 일정 보내기 — 읽기 전용 일정 피드
 *  calFeedLink POST (관리자 폰의 로그인 토큰) → 피드 주소(비밀 코드 포함) 돌려줌. 처음 부르면 코드를 만들어 private/feed에 저장
 *  calFeed     GET ?t=코드 → 관리자와 같은 가구가 볼 수 있는 일정 + 가족 생일 (지난 30일 ~ 앞으로 6개월, 반복·음력은 날짜별로 펼침)
 *  코드를 바꾸려면 calFeedLink에 {reset:true}
 */
const {onRequest} = require('firebase-functions/v2/https');
const {getFirestore} = require('firebase-admin/firestore');
const {getAuth} = require('firebase-admin/auth');
const {Lunar} = require('lunar-javascript');
const crypto = require('crypto');

const db = () => getFirestore();
const FAM = () => db().collection('families').doc('hanssine');
const DAY = 864e5;
const ymd = d => d.toISOString().slice(0, 10);
const parseD = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const kstToday = () => { const d = new Date(Date.now() + 9 * 3600e3); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
function L2S(y, m, d) { for (let dd = d; dd >= d - 1; dd--) { try { const s = Lunar.fromYmd(y, m, dd).getSolar(); return new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay())); } catch (e) { /* 다음 */ } } return new Date(Date.UTC(y, m - 1, d)); }
function onDay(e, d) {
  const k = ymd(d);
  if (e.end) return k >= e.date && k <= e.end;
  if (!e.repeat || e.repeat === 'none') return e.date === k;
  if (k < e.date) return false;
  if (e.repeat === 'solar') { const s = parseD(e.date); return s.getUTCMonth() === d.getUTCMonth() && s.getUTCDate() === d.getUTCDate(); }
  for (const y of [d.getUTCFullYear() - 1, d.getUTCFullYear()]) if (ymd(L2S(y, e.lm, e.ld)) === k) return true;
  return false;
}
function canSee(item, m) {
  if (!m) return false;
  const s = item.scope || 'all', r = m.role;
  if (s === 'custom') return item.by === m.id || (item.who || []).includes(m.id);
  return s === 'all' || (s === 'adults' && r !== 'grand') || (s === 'kids' && r === 'child');
}
const TYPE = {family: '가족 모임', trip: '여행', hospital: '병원', jesa: '제사·기일', anniv: '기념일', custom: '', etc: '', bday: '생일', school: '학교'};

async function family() {
  const [st, mem, ev] = await Promise.all([FAM().collection('state').doc('master').get(), FAM().collection('items').where('k', '==', 'members').get(), FAM().collection('items').where('k', '==', 'events').get()]);
  const raw = st.data() || {}; let master = {...raw}; try { if (raw.j) master = {...raw, ...JSON.parse(raw.j)}; } catch (e) { /* 무시 */ }
  const members = []; mem.forEach(d => { try { members.push(JSON.parse(d.data().j)); } catch (e) { /* 무시 */ } });
  const events = []; ev.forEach(d => { try { events.push(JSON.parse(d.data().j)); } catch (e) { /* 무시 */ } });
  return {master, members, events};
}
async function token(reset) {
  const ref = FAM().collection('private').doc('feed'), cur = (await ref.get()).data() || {};
  if (cur.token && !reset) return cur.token;
  const t = crypto.randomBytes(18).toString('base64url');
  await ref.set({token: t, at: Date.now()});
  return t;
}

exports.calFeedLink = onRequest({region: 'asia-northeast3', cors: true}, async (req, res) => {
  try {
    const id = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const u = await getAuth().verifyIdToken(id);
    const dev = (await FAM().collection('devices').doc(u.uid).get()).data() || {};
    const {master} = await family();
    if (!dev.member || dev.member !== master.member) return res.status(403).json({error: '관리자 폰에서만 만들 수 있습니다'});
    const t = await token(!!(req.body || {}).reset);
    res.json({url: `https://asia-northeast3-${process.env.GCLOUD_PROJECT || 'hanssine-family'}.cloudfunctions.net/calFeed?t=${t}`});
  } catch (e) { res.status(400).json({error: e.message}); }
});

exports.calFeed = onRequest({region: 'asia-northeast3'}, async (req, res) => {
  try {
    const cur = (await FAM().collection('private').doc('feed').get()).data() || {};
    if (!cur.token || String(req.query.t || '') !== cur.token) return res.status(401).json({error: 'bad token'});
    const {master, members, events} = await family();
    const me = members.find(m => m.id === master.member), house = me ? members.filter(m => m.house === me.house) : [];
    const seeAny = e => house.some(m => canSee(e, m));
    const start = new Date(kstToday().getTime() - 30 * DAY), out = [];
    for (let i = 0; i <= 213; i++) {
      const d = new Date(start.getTime() + i * DAY), k = ymd(d);
      events.filter(e => seeAny(e) && onDay(e, d)).forEach(e => out.push({id: e.id + '_' + k, date: k, title: e.title || TYPE[e.type] || '일정', type: e.type || '', time: e.time || '', place: e.place || '', multi: !!e.end}));
      members.forEach(m => { const b = m.bd; if (!b || !b.m) return; for (const y of [d.getUTCFullYear() - 1, d.getUTCFullYear()]) { const bd = b.cal === 'lunar' ? L2S(y, b.m, b.d) : new Date(Date.UTC(y, b.m - 1, b.d)); if (ymd(bd) === k) out.push({id: 'b' + m.id + '_' + k, date: k, title: m.name + (m.role === 'parent' ? ' 생신' : ' 생일') + (b.cal === 'lunar' ? ' (음력)' : ''), type: 'bday', who: m.name}); } });
    }
    res.set('cache-control', 'no-store').json({at: Date.now(), from: ymd(start), items: out});
  } catch (e) { res.status(500).json({error: e.message}); }
});
