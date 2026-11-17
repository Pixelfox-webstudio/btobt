# 진행 메모 — custom (맞춤작업복 견적문의 · 파트너 제휴)

담당 파일: `tools/pages/custom-intro.html` · `partnership.html`, `tools/css/55-custom.css`, `js/sub-custom.js`, `spec/coverage-map/custom.json`, `research/decisions/quote-form-custom.md`, `spec/questions/custom.md`
접두어: `cf`

## 지금까지
- 시작할 때 담당 파일이 하나도 없었다(처음부터 만들었다).
- 읽기 끝: 지침, DESIGN.md, 요소 목록 두 절(L784~L812, L967~L992), kit · category · unsubscribe 조각, 공용 CSS · sub.js, 레퍼런스 기록과 캡처, 홈 캡처.
- 결정 문서 `research/decisions/quote-form-custom.md` 작성.
- custom-intro.html 끝: 상태 7개(회원 · 입력 오류 · 접수 중 · 접수 완료 · 서버 오류 · 비회원 · 로그인 풀림). 빠른 점검 실패 0, 요소 빠짐 0. 입력 → 오류 요약 → 접수 중 → 완료 팝업 흐름을 Playwright로 눌러 확인.
- partnership.html 끝: 상태 5개(기본 · 접수 완료 · 미입력·형식 오류 · 너무 잦은 요청 · 접수 실패). 제출 → `?state=done` 이동 확인.

## 공용 부품에 필요한 것
- (해결됨 11:30, 반장이 sub.js 를 고침) `js/sub.js` 6절 클릭 처리 `e.target.closest('[data-pop]')`가 `<html data-pop="both">`(index.html 머리 설정)에 걸려 **모든 클릭의 기본 동작이 막힌다**(제출 버튼, 체크박스, 라디오, href 링크). 선택자를 `[data-pop]:not(html)`처럼 좁혀야 한다. 지금은 `js/sub-custom.js` 첫머리에서 `<html>`의 data-pop 을 지워 임시로 피했다.

- 마지막 점검(2026-11-17): `check.py pages custom-intro partnership` 6가지 화면 72회 렌더링 실패 0, `check.py els` 빠짐 0 · 선택자 문제 0, `clash.py` 겹침 0. `review/sheets/custom-intro-*`, `partnership-*`를 열어 보고 오류 요약 순서(세로 2단) · 사진 주석 위치(아래 오른쪽 + 아래쪽 어둠) · 폰 소개 정보 줄(2×2)을 고쳤다.
- 질문 기록 `spec/questions/custom.md`, 요소 점검 보조표 `spec/coverage-map/custom.json`(모두 data-el 로 덮여 비어 있음).

## 검수 지적 반영(2026-11-17, 두 번째 담당)
- 1 묶음 메뉴: `.bh` 로 바꿔 두었던 것을 과제가 정한 마크업 `.wrap.sub-nav > nav.stab` 그대로 되돌렸다(공용 `.stab` 이 알약 탭 줄로 바뀌어 지적이 해소되고, 같은 묶음 세 페이지와 마크업이 같다). `.cf-nav` 규칙 삭제.
- 2 모서리: `.files li` `.upl` `.agree` 16px, 파일 표식 원(이 조각 안 임시 덮어쓰기). `.opt__b` `.msg` 는 공용이 16px 이 되어 덮어쓰기를 지웠다. 입력칸 12px 은 DESIGN.md `rounded.md` 그대로(질문 기록에 적음).
- 3 토스트 · 오류색: 공용 `.sub-toast--err` 가 검정이 되어 이 조각의 덮어쓰기 삭제. 오류색은 `--cf-err`(선) · `--cf-err-t`(글자) 변수로만 참조. 칸 아래 오류 문장은 공용 색 그대로.
- 4 상자 + 토스트 중복: 두 페이지 모두 토스트 없음, 상자로 스크롤 · 포커스만(Playwright 로 제출 흐름 확인: 토스트 0).
- 5 err 상태 첨부 실패 3줄(20MB · 100MB · 5개) + 요약에 파일별 줄. 6 버튼 줄은 입력칸 열 오른쪽 끝, 접수 중 안내 열 폭 100%. 7 1100 이하 사진 5 · 글 7, 값 덩어리 nowrap(첨부 상자 안내 문장도). 8 파일 표식 본문 글꼴 11/700.
- `js/sub-custom.js` 첫머리 data-pop 임시 줄 삭제(공용 sub.js 고쳐짐). 13.5px 글자 → 14px.
- 점검: `check.py pages` 72회 실패 0, `check.py els` 빠짐 0 · 선택자 문제 0, `clash.py` cf 겹침 0. reviewsheet 전부 열어 봄.

## 남은 것
- 없음.
