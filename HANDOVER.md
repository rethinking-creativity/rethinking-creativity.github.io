# HANDOVER
기준: 2026-11-21, `main` = `submit-form` = `0cc7cbd`(+ 이 문서), 둘 다 push됨. GitHub Pages는 `main`에서 배포.
이 저장소는 CHI 2027 Meet-Up 사이트야. 작품 제출 → QR 작품 페이지 → 관리·인쇄(Supabase)로 이어져.
확정된 결정은 `~/Projects/scratch/rc-submit/docs/interface/decisions.md`에 있어. 이번 흐름은 홍보 영상과 예시 카드 수정이었어.

## 하던 일
학회 전 SNS에 하나씩 올릴 홍보 영상 만들기, 그리고 사이트 예시 카드를 사실에 맞게 고치기.

| 커밋 | 한 일 |
|---|---|
| `603b727` | Tram 예시 카드를 실제 영상에 맞춤: 1890년대풍 마차 트램, Veo 클립 1개, "Horse Tram". Underwater의 장갑 단계를 그림에 보이는 색(pink and black)으로 고침. practice 카드 축소(최대 20rem, 글자 작게) |
| `e25b209` | practice 카드 답변: 이야기·대본·최종 편집은 내가, AI는 previs·자막 (이전 문구는 앞뒤가 안 맞았음) |
| `0cc7cbd` | 홍보 영상 도구 커밋: `kinetic.py`(스타일 5개 × 세로·가로), `kmusic.py`(영상마다 오리지널 곡 합성), 이전 라운드 `story.py`·`build.py`, `RELEASE.md`(공개 계획·캡션) |

- 영상 순서: 주제 → 네 질문 연달아 → CHI → 밋업 → 대상 → 작품 공유 → 맞히기 게임 한 컷 → 주최자 + 주소. 34–41초이고 컷이 전부 박자에 맞아.
- 처음 10개는 게임 위주라서 전부 탈락했어. 두 번째 라운드(`story.py`)는 67–70초라 너무 느렸어.
- 음악은 Map2Video에 쓴 `synth_music.py` 비트 대신 새로 합성했어. 사용자 요청이었어.
- 영상 기법은 hy-agent `skills/video-authoring/references/kinetic-promo.md`에 기록했어(hy-agent `5d388b0`).

## 어디까지
- 키네틱 영상 5개는 사용자가 "전부 좋아, 다 킵"이라고 함.
- 마지막 수정 두 가지를 반영해서 10개를 다시 렌더 중이야: "We've got / **4 questions** / for you."와 아웃트로의 "Link in bio" 삭제(주소만 남김). 결과물은 `promotion/videos/_out/kinetic/*.mp4`(git 제외)에 쌓여.
- 사용자에게 답을 기다리는 질문:
  1. 캘린더 공개 일정(`promotion/videos/RELEASE.md` 표)을 이대로 넣을지.
  2. 오늘(2026-11-21) Instagram에 01 punch(세로)를 올릴지.

## 확인할 것
- [ ] 렌더가 끝나면 `promotion/videos/_out/kinetic/index.html`에서 10개 재생. 4 questions 장면과 아웃트로가 바뀌었는지 확인.
- [ ] 음악은 Claude가 듣지 못하고 스펙트로그램·음량으로만 확인했어. 5곡을 귀로 들어 보기.
- [ ] 영상 속 네 질문은 구어체로 바꾼 문구야(`kinetic.py`의 `QUESTIONS`). 논문의 뜻과 맞는지 확인.
- [ ] (이전부터 남은 것) 공개 사이트에서 직접 제출 → `admin.html` → Withdraw → Delete로 정리.
- [ ] (이전부터 남은 것) SELPHY CP1500 도착 후: Print card 시험, 접기, 폰으로 QR 실제 스캔.

## 남은 것
- 고른 영상 중 20MB가 넘는 것(02 zoom, 05 glitch)을 업로드 전에 압축하기(`compress-video` 스킬).
- `RELEASE.md` 일정대로 공개. 날짜는 2026-11-21 Instagram, 2027-02-15, 03-15, 04-05, 04-19, 05-03.
- Overleaf 원고(`~/Projects/Overleaf/CHI27_Meet-Up_Rethinking_Creativity`) 최종본 마감은 2026-12-17. 공동 저자에게 활동 변경(짝짓기 폐지 등) 알리기.
- DB 정리: `pair_id` 칸 drop. 삭제성 작업이라 SQL Editor에서 사용자가 직접 실행.
- 프린터 시험 결과를 보고 QR 크기와 주소 길이 결정. 정적 파일 캐시 무력화(버전 쿼리) 검토.

## 다음 세션 주의
- **영상 다시 만들기:** `uv run --with numpy --with scipy promotion/videos/_tools/kinetic.py` → `bash promotion/videos/_tools/render_kinetic.sh`.
  - 문구는 `kinetic.py`의 `content()`에 있어. 생성된 프로젝트 폴더(`story/`, `kinetic/`, `vertical/`, `landscape/`)는 git에서 빠져 있어.
  - 곡을 바꾸면 `_tools/.cache/k_*.wav`를 지워야 새로 합성돼.
- **예시 카드 원칙:** 실제 작품은 사실만 적어. AI로 만든 가짜 예시는 지어내도 되지만, 카드에 실린 실제 매체(영상·소리)와는 맞아야 해.
  - 카드 문구는 세 곳에 중복돼 있어: `submit.html`, `cards.html`, `js/works-mock.js`.
- **Chrome·로컬 미리보기:** Chrome 확장 도구는 `file://`를 못 열어서 `open -a "Google Chrome" <파일>`로 열었어. 로컬 `python3 -m http.server`를 백그라운드로 띄우는 건 자동 거절됐어.
- **음원 다운로드:** Wikimedia Commons는 연속으로 받으면 막혀. `_tools/fetch_music.py`가 간격을 두고 받아.
- **Supabase:** 프로젝트 `personal`(ref `rojnzjoznpkcqfgweohk`)엔 다른 프로젝트 데이터도 있어. `meetup` 스키마·`meetup-works` 버킷·`meetup-*` 함수 말고는 건드리지 마.
  - Secrets(`TURNSTILE_SECRET`, `MEETUP_ADMIN_KEY`, `MEETUP_END`)는 값을 출력하거나 커밋하지 마.
- **배포:** 사이트 수정은 바로 커밋 → push → `main` fast-forward. 반영 확인은 `curl`로 해(1–2분 걸려).
- **말투:** 사용자 규칙은 한국어 반말, 간결하게, 정공법 우선. 코드와 커밋 메시지는 영어.
