# 한씨네 가족 앱

처가 전 세대(부모님·세 딸네·손주)가 함께 쓰는 가족 앱. GitHub Pages + Firebase.

## 구조
- `index.html` — 진입점 (스크립트 로드 순서가 곧 의존 순서)
- `css/tokens.css` — 색·테마·스킨 토큰, `css/app.css` — 화면 스타일
- `js/core/` — 공통: util(날짜·음력·공휴일), data(상태·권한), ui(시트·버튼·첨부), voice, ai, weather
- `js/features/` — 기능: senior(부모님 화면), home, calendar, album, chat, stickers, dues, bot(AI 비서), translate, exercise, games, settings, auth
- `js/main.js` — 렌더링 시작, 개발용 사용자 전환(`DEV`)
- `sw.js`, `manifest.json`, `icons/` — 홈 화면 설치(PWA)

## 배포 전 남은 작업
Firestore 동기화 · 초대/승인 로그인 · FCM 알림/알림 목록 · Functions(AI 프록시, 문자, 예약 알림) · Storage · 백업 · 되돌리기 · 안드로이드 APK(Capacitor)
