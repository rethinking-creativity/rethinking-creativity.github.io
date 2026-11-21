# HANDOVER
기준: 2026-11-21 밤(논문·ACM 갱신 포함), `main` = `submit-form` = 이 문서 커밋. 작업 트리 깨끗하고 둘 다 push됨. GitHub Pages는 `main`에서 배포.
이 저장소는 CHI 2027 Meet-Up 사이트야. 작품 제출 → QR 작품 페이지 → 관리·인쇄(Supabase)로 이어져.
확정된 디자인 결정: `~/Projects/scratch/rc-submit/docs/interface/decisions.md`. 홍보 영상: `promotion/videos/README.md`, `RELEASE.md`.

## 하던 일
홍보 영상 5종을 완성해서 공개하고, 사이트 문구와 제출 폼을 영상의 메시지("작품을 공유하면 도구를 만드는 연구자들이 네 방식에서 배운다")에 맞추기.

| 커밋 | 한 일 |
|---|---|
| `603b727`·`e25b209` | 예시 카드를 실제 영상에 맞춤(Horse Tram, Underwater의 pink and black). practice 카드 축소·답변 정리 |
| `2a6256e`·`08cffaf`·`583d22b` | About을 메인 `#about`으로 옮김(`about.html`은 리다이렉트). CHI 2027 티저 + 우리 영상(`8aQmj_SJc9c`, scroll 가로판) 임베드. 둘 다 누를 때만 youtube-nocookie를 불러옴. 캡션은 "Our meet-up promotion video" |
| `c6f718b`…`12444f1`, `9d4c3ec` | 제출 폼 "Your take (optional)": 네 질문(you 문구) + Future tools(`tool_wish`). 주제어 라벨만 있고 번호 없음. 답은 QR 상세 페이지의 "The artist's take"에 공개. DB `answers jsonb` |
| `c9a5840` | "What do you make?" / "Your background"(자유 입력). QR 상세 페이지의 "About the artist"에 공개. DB `practice`, `background` |
| `58de797` | 예시 카드는 "See what the cards look like"를 눌러야 펼쳐짐 |
| `1e90e12`·`332e7c5` | 버튼 "Submit your work"를 "Share your artwork"로(폼 마지막 버튼은 "Share my artwork"). 제출 페이지 첫 문단과 Contribute 문구는 "researchers … want to learn about your practice", 맞히기 게임은 "playful warm-up". "discuss your work"는 평가처럼 들려서 뺌 |
| `2488ea3` | "No sign-up" → "no extra/separate sign-up". CHI 등록(유료)한 사람 기준이라는 뜻 |
| 영상 `kinetic.py` (`27230fd` 등) | 확정 대본(훅 → 4 questions → CHI 2027 Meet-Up → 우리가 모으는 것 → 연구자가 배우고 싶은 것 → Share a piece → 아웃트로). 가로판은 밋업 안내 장면 없이 작품 모집 중심. 출처 표기(사람 작품은 Commons PD 대조: `_tools/sources.md`). 썸네일(`_tools/thumbs.py`, 가로 + Shorts/Reels 커버), X용 커버 0.5초 버전(`_tools/x_versions.sh`) |
- 영상 기법과 음악 합성기는 hy-agent `skills/video-authoring`(`references/kinetic-promo.md`, `scripts/kmusic.py`)에 기록함.

## 어디까지
- **영상 10개:** 전부 렌더 완료. 사용자 폴더 `~/Downloads/CHI2027-meetup-promo/`(X용은 `for-X/`)에 썸네일과 같이 있음.
- **YouTube:** 10개 모두 업로드했고 링크는 `RELEASE.md` 표에 있어.
- **SNS 공개:** 사용자가 scroll 버전으로 전 채널 공개. X·LinkedIn은 세로판으로 정함.
  - LinkedIn은 게시물을 수정할 때 영상을 붙일 수 없어서, 영상을 직접 올린 새 게시물로 내기로 함. 캡션은 `RELEASE.md`에 저장.
- **SQL:** 두 개 모두 사용자가 실행 완료. 함수 3개(`meetup-submit`, `meetup-work`, `meetup-admin`) 배포 완료.
- **답을 기다리는 질문:** 없음.

### 논문(CHI EA '27) 카메라레디 · ACM 출판 절차 (2026-11-21)
- **원고:** Overleaf 원고(`~/Projects/Overleaf/CHI27_Meet-Up_Rethinking_Creativity`, git=Overleaf)에 준의 요청 세 가지를 반영함(`7fe7aa5`).
  - Tweeq 대신 ProConte(UIST '26) 인용
  - SIGCCC extended abstract(CHI EA '23) 인용
  - JST PRESTO JPMJPR25I1 · CRONOS JPMJCS25K1 사사
- **원고 메타데이터:** `78c169f`에서 SkillBench에 Santa Barbara, California를 넣고 `\acmDOI{10.1145/3856832.3872011}`를 채움.
- **ACM 데이터 검증 양식:** 원고 기준으로 고치고 Save Only까지 함("Save complete!").
  - Elise: "Chenxinran (Elise)", elise@dgp.toronto.edu, 학과 비움
  - Erzhen: erzhenhu@microsoft.com
  - Nicolai: nicmarquardt@microsoft.com
  - Juho: 두 번째 소속 SkillBench(Santa Barbara, CA) 추가
  - Funders: JST 두 건(FundRef 501100002241)
- **eRights 서명:** 아직 안 함("Save And Proceed to eRights Form"). 사용자가 2026-11-21에 공저자 전원에게 양식 PDF를 보내고, 2026-12-02(AoE)까지 👍로 확인해 달라고 함.
- **ACM 마감:** 2027-04-04. 원고 최종본 마감 2026-12-17 전에 서명해서, ACM이 주는 저작권 정보(`\setcopyright`, `\acmISBN` 등)를 원고에 넣는 게 목표.

## 확인할 것
- [ ] 2026-12-02(AoE)까지 공저자 확인 답 모으기. 고칠 게 있으면 ACM 양식과 원고 둘 다 고치기 → ACM 페이지 맨 아래 체크박스 → "Save And Proceed to eRights Form" → 서명(사용자가 직접). 서명 후 받은 저작권 정보와 ISBN을 원고에 넣기.
- [ ] Overleaf에서 재컴파일: Juho 소속 줄바꿈, ProConte·SIGCCC 인용, 사사, 페이지 수 확인(이 컴퓨터엔 LaTeX 없음).
- [ ] 실제 사이트에서 작품 1건 제출하기("Your take"와 "What do you make / Your background" 채워서) → `admin.html`에 나오는지, Copy QR link로 연 QR 페이지에 "The artist's take"와 "About the artist"가 나오는지 확인 → Withdraw → Delete. Turnstile 때문에 Claude는 시험 못 함.
- [ ] LinkedIn 새 영상 게시물 올리고, 기존 게시물에 "Watch the video:" 댓글 달기.
- [ ] SELPHY CP1500 도착 후: Print card 시험, 접기, 폰으로 QR 스캔, 현장 등록 리허설(`admin.html` → On-site entry).

## 남은 것
- 공동 주최자에게 알리기: 활동 변경(짝짓기 폐지, 답·프로필을 QR 페이지에 공개), 홍보 영상에 사진이 들어간다는 것. Overleaf 최종본 마감은 2026-12-17이고 새 폼 항목을 반영할지도 정해야 해.
- Underwater(사용자 실제 작품)의 프로필과 Your take는 비어 있음. 채울지는 사용자가 정할 일.
- `RELEASE.md` 일정: 2027-02-15, 03-15, 04-05, 04-19, 05-03 (캘린더에 넣음).
- DB 정리: `pair_id` drop(지우는 작업이라 SQL Editor에서 사용자가 직접). 프린터 결과를 보고 QR 크기와 주소 길이 결정. 정적 파일 캐시 무력화 검토.

## 다음 세션 주의
- **ACM 양식 링크:** 메일(no-reply@acm.org, 2026-11-21)에 있는 교신저자용 편집 링크라 받은 사람 누구나 양식을 고칠 수 있어. 저장소나 공유 문서에 적지 말 것. 링크를 공유하지 말고 PDF로 확인받기로 한 이유도 이거야.
  - Chrome 확장으로 이 페이지를 다룰 때: Save를 누르면 `alert()`가 떠서 탭이 멈춤. 먼저 `window.alert`를 덮어쓴 뒤 버튼을 눌렀더니 "Save complete!"를 읽을 수 있었어.
  - Funding Body 칸은 자동완성 목록에서 골라야 FundRef ID가 붙어.
- **원고 원칙:** ACM 양식은 최종 PDF와 똑같아야 해. 원고를 기준으로 양식을 고치는 게 원칙(사용자 지시).
- **말투:** 답은 무조건 한국어 반말, 짧게. 영어 자료를 읽은 직후에 영어로 답했다가 이번 세션에서도 세 번 지적받음.
- **문구는 먼저 확정:** 사용자는 문구(영상·사이트)를 텍스트로 먼저 같이 확정한 다음에 렌더하거나 배포하길 원해. 확정 전에 렌더를 돌렸다가 멈춘 적이 있음.
- **제출 폼에 칸을 추가할 때 순서:** 추가용 SQL(`~/Projects/scratch/rc-submit/sql/*.sql` + `run-*.sh`를 사용자가 실행) → 함수 배포(`supabase functions deploy <name> --project-ref rojnzjoznpkcqfgweohk --no-verify-jwt --use-api`) → 사이트 배포. 칸이 생기기 전에 폼을 배포하면 제출이 실패해.
- **답변 공개 범위:** Your take와 프로필은 "이름 없이 공유"가 아니라 QR 상세 페이지에 공개야. 이번에 잘못 이해했던 부분.
- **영상 다시 만들기:** `uv run --with numpy --with scipy promotion/videos/_tools/kinetic.py [NN]` → `bash promotion/videos/_tools/render_kinetic.sh <folder>`.
  - 문구는 `kinetic.py`의 `content()`와 `credit()`에 있어. 가로판만 빼는 장면은 `WEB_SKIP`.
  - 음악 캐시 키에 구간 구성이 들어 있어서, 구성이 바뀌면 자동으로 다시 합성돼.
- **YouTube 임베드:** `file://`로 열면 Error 153이 남(Referer가 없어서). 그래서 로컬에서는 `js/about.js`가 새 탭으로 열어. 실제 사이트에서는 정상 재생돼.
- **로컬 미리보기·브라우저:** `preview-about-*.html`은 `.git/info/exclude`로 제외돼 있어. Chrome 확장은 `file://`를 못 여니까 `open -a "Google Chrome" <파일>`을 써. Playwright는 `channel: 'chrome'`, 스크립트는 `~/Projects/scratch/rc-submit/demo/`.
- **Supabase:** 프로젝트 `personal`(ref `rojnzjoznpkcqfgweohk`)엔 다른 프로젝트 데이터도 있어. `meetup` 스키마·`meetup-works` 버킷·`meetup-*` 함수 말고는 건드리지 마. Secrets(`TURNSTILE_SECRET`, `MEETUP_ADMIN_KEY`, `MEETUP_END`)는 값을 출력하거나 커밋하지 마.
- **배포:** 사이트 수정은 커밋 → push → `main` fast-forward. 반영 확인은 `curl`로 해(1–2분 걸려).
