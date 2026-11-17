# 진행 메모 — quote (견적문의 · 견적문의 안내)

담당 파일: `tools/pages/quote.html` · `quote-intro.html`, `tools/css/50-quote.css`, `js/sub-quote.js`, `spec/coverage-map/quote.json`, `research/decisions/quote-form.md`, `spec/questions/quote.md`

## 지금까지
- 읽기 끝: 지침, DESIGN.md, 요소 목록 다섯 절, kit · category 조각, 공용 CSS · sub.js · sub-data.js, 레퍼런스 기록과 캡처.
- 결정 문서 작성: `research/decisions/quote-form.md`.
- quote.html 끝(상태 31개: 대화형 18 · 한 화면 양식 12 · 비회원 1). 조작 확인(Playwright): 답하면 다음 질문이 쌓임, 수정(제자리 카드 · 수정 취소 · 상품 유형 변경 시 그 상품 뒤 답 지움), 건너뛰기, 진행률 %, 수량 0 오류, 첨부, 두 번째 상품 표시, 상품 검색(자동완성 6개 · 방향키 · Enter · Esc), 보내기 → 완료 팝업 → `mypage.html?section=inquiries`, 양식 상품 추가·삭제·검색 팝업·검사 오류 요약. 콘솔 오류 0.
- quote-intro.html 끝(상태 2개).

## 2026-11-17 오후 이어서 한 것(반장 공용 변경 반영)
- `js/sub-quote.js`의 임시 조치(`html[data-pop]` 제거) 삭제. 공용 sub.js 수정만으로 라디오·팝업·새 창 링크가 동작하는 것을 확인.
- 13.5px → 14px, 12.5px → 13px, 10px → 11px, 선택 칩 11.5px → 12px. `.stab`·`.sub-toast--err`는 쓰지 않아 덮어쓴 것 없음.
- 홈과 겹치던 `.is-empty`를 `.qt-none`으로 바꿈.
- 안내 1단계 사진 교체, 비회원 3단계 설명을 안내와 같게, 연출 사진 주석 위치, 상품 상세 인쇄방법(실크 인쇄) 선택지 추가, 대화형 상품 검색 팝업 상태(`state=search+pick`), 1024 머리 줄바꿈, 첨부 한도 초과 상태 견본(5 / 5개 + 안내 두 줄).
- 질문 기록 `spec/questions/quote.md` 작성.

## 2026-11-17 검수 지적 반영
- 대화형 선택지 → 알약(`.seg.qt-seg`, 44). 상품 유형·인쇄 여부 설명은 카드 도움말로 옮김.
- 수량 −/+ → 44 원형 버튼, 숫자 칸 12px 입력칸. 그래서 앞에 넣었던 `.qty button` 임시 덮어쓰기는 지움(공용 문제 자체는 다른 페이지에 남아 보고에 그대로 적음).
- 상태 추가: `state=attach-total`(전체 20개·100MB 오류 줄), `mode=form&state=err-attach`(상품당 5개·전체 20개·100MB), `mode=form&state=err-empty`(상품 0개·회사명·담당자·연락처). 양식 검사가 상품당 5개 초과를 직접 찾고, 요약에 첨부 합계 용량을 보인다. 첨부 문제가 있으면 1단계 완료 표시를 하지 않는다.
- 사진 모서리 16/14, `.qt-wait p` 16.
- 고친 버그: 양식 1번째 상품의 첨부 파일 삭제 버튼이 동작하지 않던 것(`data-ft="0"`이 빠짐).
- 점검: build → check.py pages(36상태) 실패 0, els 빠짐 0, clash 0, reviewsheet 확인.

## 남은 것
- 없음. 공용 쪽에 필요한 것: `.qty button` 흰 바탕이 바깥 선을 가림(이 페이지는 원형 버튼으로 바꿔 해당 없음), `.upl__cnt` 폰 줄바꿈(CSS 조각에 임시로 넣음).
