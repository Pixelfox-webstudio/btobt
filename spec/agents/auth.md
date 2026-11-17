# 진행 메모 — auth (로그인·회원가입 6페이지)

담당 파일: `tools/pages/signup-business-info.html` · `login.html` · `signup.html` · `signup-general.html` · `signup-business.html` · `signup-general-info.html`, `tools/css/60-auth.css`, `js/sub-auth.js`, `spec/coverage-map/auth.json`, `research/decisions/auth.md`, `spec/questions/auth.md`

## 지금까지
- 읽기 끝: 지침, DESIGN.md, 요소 목록 6절, kit · category · unsubscribe 조각, 공용 CSS(00·10) · sub.js, 홈 캡처, 레퍼런스 기록과 캡처(PC·모바일).
- 결정 문서 `research/decisions/auth.md` 작성.
- CSS `tools/css/60-auth.css`, JS `js/sub-auth.js` 작성.
- signup-business-info(대표, 상태 11개) 완성 → 캡처 보고 고침(오류 상태 스크롤, 폰 짝 칸, 문구).
- login(14) · signup(4) · signup-general(1) · signup-business(1) · signup-general-info(11) 조각 작성.
- (11:30 이후 이어서) 공용 변경 반영: JS의 `data-pop` 임시 조치 지움, 13.5px → 14px. 사진 위쪽 옅은 어둠(밝은 사진에서 "연출 이미지입니다." 읽힘). 확인 실패 상태의 무효 번호 견본을 실제 규칙에도 무효인 123-45-67892로 바꿈.
- 조작 확인(Playwright): 중복확인(사용 중·사용 가능·바꾸면 초기화), 사업자번호(자릿수·무효·유효), 주소 검색 견본, 첨부(형식·용량 거부, 이미지 미리보기 팝업), 숫자 불일치 → 그림 교체, 가입 → 완료 화면(메인화면으로 index.html), 로그인 불일치·성공 이동·보던 페이지, 간편 로그인 → 유형 선택 → 정보 입력(간편 가입 중).
- 마지막 점검: pages 6페이지 42상태 252회 실패 0, els 빠짐 0, clash 내 클래스 겹침 0.

- (검수 1회 뒤 고침) 단계 표시 링크가 번호 원+이름을 감싸고 44px(폰은 이름 낭독용 숨김) · 확인 문구·필수 *·규칙 칩·"카카오 계정" 칩에서 파랑 뺌(검정+체크, 검정 칩, 회색 태그칩) · 첨부 상자·파일 줄·썸네일·크게 보기 16px(폰 14) · 단계 번호·PDF 표식 본문 글꼴 + 12.5px → 13px · 자동등록방지 만료(`capexp`)·시도 초과(`caplock`) 상태와 동작 추가 · 가입 완료 버튼을 `.bt--ink`(화살표)+`.bt--line` 세로 440 폭으로.
- 공용 부품 덮어쓰기는 `60-auth.css` 3절에 모아 둠(공용에 반영되면 지움).
- 점검: pages 6페이지 46상태 실패 0, els 빠짐 0, clash 겹침 0.

## 남은 것
- 없음.
