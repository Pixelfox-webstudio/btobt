# 진행 메모 — policy (개인정보처리방침 · 이용약관 · 취소/환불 정책 · 비회원 개인정보처리방침)

담당 파일: `tools/pages/privacy.html` · `terms.html` · `refund-policy.html` · `guest-privacy.html`, `tools/css/85-policy.css`, `js/sub-policy.js`, `spec/coverage-map/policy.json`, `research/decisions/document-policy.md`, `spec/questions/policy.md`

## 지금까지
- 처음 시작(앞 작업자 파일 없음). 읽기 끝: 지침, DESIGN.md, 요소 목록 네 절, kit · category · unsubscribe 조각, 공용 CSS(00-base) · sub.js, 레퍼런스 기록과 캡처.
- 결정 문서 `research/decisions/document-policy.md` 작성.
- privacy.html(상태 6) 완성 · 고정 목차와 방문 기록 설정 버튼 동작 확인. CSS `85-policy.css`, JS `sub-policy.js`.
- terms.html(2) · refund-policy.html(2) · guest-privacy.html(4) 작성. els 빠짐 0, pages --fast 실패 0.

- 캡처 확인 후 고침: 항목 사이 이중 선 정리, 목차 번호 칸 폭, 전화번호 줄바꿈 막음(.po-tel), 이전 방침 칩 중복 제거, 약관 표 뒤 간격.
- 질문 기록 `spec/questions/policy.md` 작성. 요소 점검 보조표 `spec/coverage-map/policy.json`(L504 na).
- 마지막 점검: pages 4개 · 상태 14 · 렌더링 84회 실패 0, els 빠짐 0 · 선택자 문제 0, clash 겹침 0.

## 검수 지적 고침 (2026-11-17)
- 1·6 약관 묶음 메뉴: 밑줄 탭 → 필터칩 묶음(`.fchips` > `a.fchip[aria-current]`), 폰은 두 줄로 네 개 모두 보임. 탭 자동 스크롤 JS 제거.
- 2 이전 방침 안내: `.msg` → `.note`(16px). 반장도 공용 `.msg`를 16px로 고침.
- 3 13.5px → 14px(.po-meta, .po-toc__list a).
- 4 폰 길이: 긴 표 4개 `details.po-fold`로 접고 요약 한 줄, 목차 상자를 지나면 따라오는 `목차` 알약(.po-totoc). 390 기본 6,804px(푸터 포함), 13번까지 캡처에 들어옴.
- 5 터치 대상: .po-meta .lnk 44px, 경로 '홈' 44×44(.po-crumb a), po-hist__go 기본 48px 버튼.
- 7 guest-privacy `state=custom` 추가(pages.json에 빌드로 반영).
- 결정 문서·질문 기록을 지금 구조에 맞게 고침.
- 점검: build → pages 4개 · 상태 15 · 렌더링 90회 실패 0, els 빠짐 0 · 선택자 문제 0, clash 내 클래스 겹침 0. reviewsheet 전부 봄.

## 남은 것
- 없음(보고만).
