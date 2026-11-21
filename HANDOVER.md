# HANDOVER
기준: 2026-11-20(현지) / 2026-11-21 UTC, `submit-form` = `da2d927`, 작업 트리 깨끗함, origin에 push됨. main은 손대지 않음(GitHub Pages가 main에서 배포).
CHI 2027 Meet-Up 사이트의 작품 제출 → QR 작품 페이지 → 주최자 관리·인쇄 백엔드. 확정된 결정: `~/Projects/scratch/rc-submit/docs/interface/decisions.md` (디자인·문구·동의서는 바꾸지 않는다).

## 하던 일
프론트 프로토타입(`0cda35d`)에 Supabase 백엔드를 붙이고, 현장 등록·인쇄와 접근성까지 끝내기.

| 커밋 | 한 일 |
|---|---|
| `3f430c3` | `meetup-submit`(Turnstile→검증→행 저장→서명 TUS 업로드), `meetup-work`(qr_key로 approved 작품, MEETUP_END 뒤엔 consent_web만), `work.html?k=`, robots/noai |
| `7b051e4` | `admin.html` + `meetup-admin`, 카드 표지 자동 생성(영상 프레임·소리 원형 파형·링크 썸네일), 업로드 실패 시 같은 행 재사용, PDF 보기, 완료 화면의 짝 이메일 문장 삭제 |
| `51b22ec` | 주최자 모드(현장 등록: Turnstile 생략·바로 approved·완료 화면 Print card), `print-sheet.js`, IP 제한·IP 해시 제거, PDF 앞 두 줄(pdf.js) |
| `aee6a91` | 접근성: 카드 뒤집기 버튼 분리, skip link, landmark, reduced-motion, 관리 페이지 대비 |
| `24dd66f` | 대비: With AI `#2563eb`, 회색 `#736a88`(카드·QR 페이지·인쇄); 질문 점 24px 타깃(간격 넓힘) |
| `da2d927` | 승인 단계 제거(status `active`/`withdrawn`), 관리 페이지 Not printed/Printed/Withdrawn 탭·Permission·Mark printed·Withdraw/Restore, 작품 벽은 화면낭독기에 한 문단 설명, 함수 DB 대기 시간 제한·단계 로그 |

## 어디까지
- 완료·검증: 실제 제출(이미지·링크·영상·소리·YouTube·PDF), 버킷 업로드, QR 페이지, 날짜 규칙(MEETUP_END 과거로 바꿔 확인 후 2027-05-15 복구), 표지 자동 생성, 4x6 시트 1800×1200, 현장 등록→인쇄 시트. 스크린샷: `~/Projects/scratch/rc-submit/demo/shots/`.
- 2026-11-20 결정: 색·점 간격 적용, 작품 벽은 설명 문단으로, 승인 없음(Withdraw는 작가 메일 요청 시 주최자가 누름; Delete는 Withdrawn 뒤에만 — 인쇄된 QR 보호). SQL(`~/Projects/scratch/rc-submit/sql/2026-11-21-no-approval.sql`)은 사용자가 SQL Editor에서 실행 완료.
- 테스트 데이터 모두 삭제(행 0, 버킷 0) — 2026-11-21 UTC 05:0x 기준.
- 미해결 관찰: `meetup-work` 콜드 스타트 첫 요청이 한 번 150초 걸려 504(2026-11-21 04:53 UTC). 재현 안 됨. `connect_timeout` 10s·`statement_timeout` 10s·`step()` 로그를 넣음 → 다시 나면 함수 로그에서 `[db]`/`[sign]` 등 어느 단계인지 확인.
- main 머지: 사용자가 허락함(2026-11-20). 아직 안 함 — 위 결정 반영 후 머지하고 공개 사이트에서 실제 제출 1건 확인할 계획.

## 확인할 것
- [ ] 관리자 비밀번호 설정: `bash ~/Projects/scratch/rc-submit/set-admin-key.sh` (터미널에서; 입력 숨김, 2회). 지금은 Claude가 만든 테스트 비밀번호가 들어 있음(`~/Projects/scratch/rc-submit/.admin-test-key`, 스크립트가 지움).
- [ ] 로컬 확인: 레포에서 `python3 -m http.server 8765` → `localhost:8765/admin.html` 로그인 → On-site entry → 제출 → Print card 인쇄 창.
- [ ] SELPHY CP1500 도착 후 RP-108 용지로 시험 인쇄(6×4in, 여백 0)와 접기. 맥 인쇄가 안 되면 PNG를 SD카드로.

## 남은 것
- main 머지(허락받음) → 공개 사이트(`rethinking-creativity.github.io`)에서 실제 제출·QR·관리 페이지 확인.
- Underwater 예시의 Description/Process는 Hye-Young이 줄 내용 대기(decisions.md Open).
- 정적 파일 캐시 무력화(버전 쿼리) 검토: GitHub Pages가 ~10분 캐시해서 배포 직후 CSS/JS가 섞일 수 있음. 인쇄 시트는 레이아웃 CSS를 `card-render.js`에 넣어 이미 독립시킴.

## 다음 세션 주의
- Supabase 프로젝트 `personal`(ref `rojnzjoznpkcqfgweohk`)에는 paper-reader·Map2Video 데이터도 있음. **`meetup` 스키마·`meetup-works` 버킷·`meetup-*` 함수 외엔 절대 건드리지 말 것.** Supabase Auth 설정도 공유라 안 씀(그래서 관리자 비밀번호 방식).
- `meetup` 스키마는 API에 노출 안 함: 함수가 `SUPABASE_DB_URL`로 직접 붙는다(`supabase/functions/_shared/common.ts`).
- Secrets(값 출력·커밋 금지): `TURNSTILE_SECRET`, `MEETUP_ADMIN_KEY`, `MEETUP_END`(2027-05-15). `MEETUP_IP_SALT`는 삭제됨. 사용자가 넣는 비밀 값은 Supabase 입력창이 이 보드에서 안 떠서 `read -s` 스크립트 + `open -a Terminal <script>`로 받았다.
- 배포: `supabase functions deploy <name> --project-ref rojnzjoznpkcqfgweohk --no-verify-jwt --use-api`. secret 바꾼 직후 수십 초 함수 응답이 느려짐.
- 이 보드에선 삭제성 SQL/마이그레이션(drop, delete)이 자동 거절된다 → SQL을 파일로 만들어 `pbcopy` 후 SQL Editor(`/dashboard/project/<ref>/sql/new`)를 `open`해 주고 실행을 부탁한다. 채팅에 줄인(`...`) SQL을 보이면 그대로 붙여 넣어 오류가 난다 — 예시는 항상 전체로. 다른 경로로 우회하지 말 것.
- 업로드 TUS 엔드포인트는 서명 토큰이면 `/storage/v1/upload/resumable/sign`(그냥 `/resumable`은 RLS 403).
- 브라우저 데모: Playwright Chrome은 Turnstile을 못 넘김 → 일반 Chrome을 `--remote-debugging-port=9333 --user-data-dir=/tmp/rc-chrome`로 띄우고 `connectOverCDP`. 이 Chrome이 옛 CSS/HTML을 캐시해서 두 번 헛짚었음 → `Network.clearBrowserCache` 먼저. 데모 스크립트: `~/Projects/scratch/rc-submit/demo/*.mjs`.
- 사용자 규칙: 한국어 반말, 단계마다 확인, 정공법 우선(우회는 먼저 상의), 길게 쓰지 말 것, 코드·커밋은 영어.
