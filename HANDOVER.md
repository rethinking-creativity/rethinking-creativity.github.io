# HANDOVER
기준: 2026-11-20(현지) / 2026-11-21 UTC, `main` = `submit-form` = 이 커밋(사이트 코드는 `632ec54`), 작업 트리 깨끗함, 둘 다 origin에 push됨. **main에 머지 완료 → 공개 사이트에 배포됨**(GitHub Pages는 main에서 배포).
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
| `f37525c`…`632ec54` (2026-11-20, 모두 main 배포) | QR 미리보기 버튼 삭제, 관리 페이지 Credit 줄; 참석 질문(Yes/Not sure yet/No, `attending`); About 페이지(CHI·meet-up·우리 meet-up·Why share); 선택 의견 칸 "What should future creativity tools do, or never do?"(`tool_wish`, 이름 없이 meet-up에서 공유 가능); 메일링 리스트 opt-in(`keep_posted`) + 관리 페이지 Copy mailing list; **짝짓기 폐지**(카드를 펼쳐 놓고 한 장씩 추측; `pair_id`는 미사용으로 남김); 문구 정리("made by hand or with AI", 바닥글 풀어쓰기) |

## 어디까지
- 완료·검증: 실제 제출(이미지·링크·영상·소리·YouTube·PDF), 버킷 업로드, QR 페이지, 날짜 규칙(MEETUP_END 과거로 바꿔 확인 후 2027-05-15 복구), 표지 자동 생성, 4x6 시트 1800×1200, 현장 등록→인쇄 시트. 스크린샷: `~/Projects/scratch/rc-submit/demo/shots/`.
- 2026-11-20 결정: 색·점 간격 적용, 작품 벽은 설명 문단으로, 승인 없음(Withdraw는 작가 메일 요청 시 주최자가 누름; Delete는 Withdrawn 뒤에만 — 인쇄된 QR 보호). SQL(`~/Projects/scratch/rc-submit/sql/2026-11-21-no-approval.sql`)은 사용자가 SQL Editor에서 실행 완료.
- 테스트 데이터 모두 삭제(행 0, 버킷 0) — 2026-11-21 UTC 05:0x 기준.
- 미해결 관찰: `meetup-work` 콜드 스타트 첫 요청이 한 번 150초 걸려 504(2026-11-21 04:53 UTC). 재현 안 됨. `connect_timeout` 10s·`statement_timeout` 10s·`step()` 로그를 넣음 → 다시 나면 함수 로그에서 `[db]`/`[sign]` 등 어느 단계인지 확인.
- main 머지 완료(2026-11-20, fast-forward `7e1bd9a`). 공개 사이트 확인: 모든 페이지 200, 함수 CORS(github.io) 통과, 실제 도메인에서 Turnstile 토큰 발급, `work.html?id=kettle` 정상, 없는 키는 "Work not found". 공개 사이트에서 실제 제출은 안 함(지울 권한이 사용자 비밀번호뿐이라).
- 관리자 비밀번호: 사용자가 설정 완료(2026-11-20). Claude는 값을 모름 → 이후 `meetup-admin` 호출이 필요한 시험은 사용자가 admin.html에 로그인한 브라우저에서 하거나, 사용자가 정리(Delete)해야 함.
- QR: 인쇄 시트 PNG에서 두 QR 모두 디코드됨(작품 `work.html?k=…` version 5, 사이트 URL version 3) → 열면 그 작품. 카드 위 작품 QR 약 14mm, 모듈 0.38mm(300dpi에서 4.5px). **실물 스캔은 프린터 도착 후 시험하기로 함.** 작으면 QR 키우기(디자인 변경) 또는 주소 줄이기.

## 확인할 것
- [ ] 공개 사이트에서 직접 한 번: `rethinking-creativity.github.io/submit.html`로 작품 1건 제출 → `admin.html` 로그인 → 목록에 보이는지 → Copy QR link로 작품 페이지 열기 → Withdraw → Delete로 정리.
- [ ] SELPHY CP1500 도착 후: RP-108 용지로 admin.html의 Print card 시험(6×4in, 여백 0), 접기, **폰으로 앞면 작품 QR·뒷면 사이트 QR 실제 스캔**. 맥 인쇄가 안 되면 Download print sheet PNG를 SD카드로.
- [ ] 현장 흐름 리허설: admin.html → On-site entry → 제출 → Print card → Enter another.

## 남은 것
- Overleaf 원고(`~/Projects/Overleaf/CHI27_Meet-Up_Rethinking_Creativity`, git=Overleaf)도 짝 없이·비참석자 제출·의견 칸에 맞춰 고쳐 push함(`984802b`, `26235d3`). 공동 저자에게 활동 변경 알리기. 최종본 마감 2026-12-17.
- SNS 글 초안: `~/Projects/scratch/rc-submit/posts.md`(LinkedIn·X 확정본).
- DB 정리 거리(삭제성이라 SQL Editor로): `pair_id` 칸 drop.
- 프린터 시험 결과에 따라 QR 크기/주소 길이 결정.
- Underwater 예시의 Description/Process는 Hye-Young이 줄 내용 대기(decisions.md Open).
- 정적 파일 캐시 무력화(버전 쿼리) 검토: GitHub Pages가 ~10분 캐시해서 배포 직후 CSS/JS가 섞일 수 있음. 인쇄 시트는 레이아웃 CSS를 `card-render.js`에 넣어 이미 독립시킴.

## 다음 세션 주의
- Supabase 프로젝트 `personal`(ref `rojnzjoznpkcqfgweohk`)에는 paper-reader·Map2Video 데이터도 있음. **`meetup` 스키마·`meetup-works` 버킷·`meetup-*` 함수 외엔 절대 건드리지 말 것.** Supabase Auth 설정도 공유라 안 씀(그래서 관리자 비밀번호 방식).
- `meetup` 스키마는 API에 노출 안 함: 함수가 `SUPABASE_DB_URL`로 직접 붙는다(`supabase/functions/_shared/common.ts`).
- Secrets(값 출력·커밋 금지): `TURNSTILE_SECRET`, `MEETUP_ADMIN_KEY`, `MEETUP_END`(2027-05-15). `MEETUP_IP_SALT`는 삭제됨. 사용자가 넣는 비밀 값은 Supabase 입력창이 이 보드에서 안 떠서 `read -s` 스크립트 + `open -a Terminal <script>`로 받았다.
- 함수 배포: `supabase functions deploy <name> --project-ref rojnzjoznpkcqfgweohk --no-verify-jwt --use-api`. secret 바꾼 직후 수십 초 함수 응답이 느려짐.
- 이 보드에선 삭제성 SQL/마이그레이션(drop, delete)이 자동 거절된다 → SQL을 파일로 만들어 `pbcopy` 후 SQL Editor(`/dashboard/project/<ref>/sql/new`)를 `open`해 주고 실행을 부탁한다. 채팅에 줄인(`...`) SQL을 보이면 그대로 붙여 넣어 오류가 난다 — 예시는 항상 전체로. 다른 경로로 우회하지 말 것.
- 업로드 TUS 엔드포인트는 서명 토큰이면 `/storage/v1/upload/resumable/sign`(그냥 `/resumable`은 RLS 403).
- 브라우저 데모: Playwright Chrome은 Turnstile을 못 넘김 → 일반 Chrome을 `--remote-debugging-port=9333 --user-data-dir=/tmp/rc-chrome`로 띄우고 `connectOverCDP`. 이 Chrome이 옛 CSS/HTML을 캐시해서 두 번 헛짚었음 → `Network.clearBrowserCache` 먼저. 데모 스크립트: `~/Projects/scratch/rc-submit/demo/*.mjs`.
- 사이트 배포 = main push. 배포 확인은 `curl -s https://rethinking-creativity.github.io/robots.txt` 등으로 새 내용이 나올 때까지 기다리기(1–2분). 공개 페이지의 Turnstile은 처음 몇 초~수십 초 걸릴 수 있음.
- 사용자 규칙: 한국어 반말, 단계마다 확인, 정공법 우선(우회는 먼저 상의), 길게 쓰지 말 것, 코드·커밋은 영어.
