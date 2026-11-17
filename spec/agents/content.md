# 진행 메모 — content (구매후기 목록·상세 · 이벤트 목록·상세 · 납품사례)

담당 파일: `tools/pages/reviews.html` · `review-view.html` · `event.html` · `event-view.html` · `delivery-cases.html`, `tools/css/75-content.css`, `js/sub-content.js`, `spec/coverage-map/content.json`, `research/decisions/support-board-content.md`, `spec/questions/content.md`

## 끝난 것 (2026-11-17)
- 읽기: 지침, DESIGN.md, 요소 목록 다섯 절, kit · category 조각, 공용 CSS · sub.js · sub-data.js · reviews.js, 홈 후기 카드 CSS·JS(읽기만), 레퍼런스 기록과 캡처, 홈 캡처.
- 결정 문서 `research/decisions/support-board-content.md`.
- CSS `tools/css/75-content.css`, JS `js/sub-content.js`(다섯 페이지 공용, body[data-page]로 가름).
- reviews.html(상태 3: 기본 · page=2 · empty), review-view.html(3: 기본 · id=maeil · notfound), event.html(2: 기본 · empty), event-view.html(3: 기본 · id=2 · notfound), delivery-cases.html(5: 기본 · co=taeseo · co=meister · zoom · empty).
- 요소 점검 보조표 `spec/coverage-map/content.json`(상태로만 보이는 요소 10줄), 질문 기록 `spec/questions/content.md`.
- 마지막 점검: build → check.py pages 5페이지 6화면 실패 0, check.py els 빠짐 0 · 선택자 문제 0, clash 내 클래스 겹침 0. reviewsheet 전부 열어 봄. 조작 확인(카드 사진 넘기기·쪽 번호·상세 작은 그림·업체 고르기·크게 보기·키보드) 콘솔 오류 없음.

## 검수 지적 고침 (2026-11-17 오후)
- 1 납품 업체 줄(폰): 칸 폭 `calc(%)` → 130px 고정(% · vw면 Chromium 다시 그리기 때 스크롤이 잘려 고른 칸이 밀림), snap mandatory → proximity + 칸 왼쪽. JS `reveal()`이 고른 칸 왼쪽을 줄 왼쪽 여백에 맞추고 load 뒤 · 폭 바뀔 때 다시 맞춘다(WebKit은 load 때 줄을 0으로 되돌림). co=meister 390 Chromium · WebKit 확인.
- 2 · 8 폰 카드 줄 맞춤 · 업종: 23건 모두 견본 업종, 폰 평가 줄 + 업종 칩 두 줄 고정(회사명 줄 위치 12장 모두 같음 확인).
- 3 터치: 사진 화살표 전부 44px(`.ct-car__nav` 기본값), 크게 보기 화살표 44, 폰 점 버튼 높이 44, 쪽 번호는 공용 `.pager` 44(내 덮어쓰기 지움).
- 4 768 업체 줄: 601~768은 6열 격자, 600 이하만 가로 밀기. 5 모서리: 폰 `.ct-ph` 14, 썸네일 10. 6 13.5px 없음(사례 정보 폰 13). 7 폰 카드 여백 16 18 20 · 글 1.75.
- 점검: build → check.py pages 5페이지 6화면 실패 0, els 빠짐 0, clash 내 클래스 겹침 0, reviewsheet 다섯 페이지 다시 봄.

## 남은 것
- 없음. 실제 로고 · 후기 평가 수치 · 업종 · 등록일 · 이벤트 자료가 오면 `js/sub-content.js` 위쪽 표(META · EVENTS · CASE_DESC · NOCASE)를 바꾼다.
