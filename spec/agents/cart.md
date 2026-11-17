# 진행 메모 — cart (장바구니 · 주문서 작성 · 주문 정보 입력)

담당 파일: `tools/pages/cart.html` · `order.html` · `order-now.html`, `tools/css/40-cart.css`, `js/sub-cart.js`, `spec/coverage-map/cart.json`, `research/decisions/cart-checkout.md`, `spec/questions/cart.md`

## 지금까지
- 읽기 끝: 지침, DESIGN.md, 요소 목록 세 절, kit · category 조각, 공용 CSS · sub.js, 레퍼런스 기록과 캡처(장바구니 PC·모바일, 주문서 PC·모바일).
- 결정 문서 작성: `research/decisions/cart-checkout.md`.
- cart.html 끝(상태 10개). 조작 확인: 선택·전체 선택(일부 선택 표시)·수량·0이면 삭제 확인·하나 삭제·선택 삭제·빈 장바구니 전환·요청 종류별 이동.
- order.html 끝(상태 23개). 결제수단·증빙·현금영수증 용도·포인트(초과·후불 0)·배송지 방식·저장된 배송지·오류 요약·카드/무통장/후불 이동 확인.
- order-now.html 끝(상태 10개). 접수 → 완료 팝업 → 마이페이지 주문내역 확인.
- 질문 기록 `spec/questions/cart.md` 작성.

## 2026-11-17 오후 이어서 한 것(반장 공용 변경 반영)
- `js/sub-cart.js`의 임시 조치(`html[data-pop]` 제거) 삭제. 공용 sub.js 수정(`[data-pop]:not(html)`)만으로 클릭·체크·라디오·팝업 닫기가 동작하는 것을 Playwright로 63개 조작 확인(콘솔 오류 0).
- 13.5px · 12.5px 글자를 14px · 13px · 12px로. `.stab`는 쓰지 않아 덮어쓴 것 없음.
- cart 비로그인 화면에서 진행 순서 감춤(주문서와 같게). 주문서 견적서 파일 줄은 폰에서 이름 → 파일 두 줄로(파일 이름이 잘리지 않게).
- 마지막 점검: build → check pages 3페이지 6화면 실패 0 · els 빠짐 0 · clash 내 클래스 겹침 0. reviewsheet 캡처 전부 확인.

## 2026-11-17 오후 검수 지적 반영(layout 790 외)
- 터치 44px: cart 선택 삭제 `.sb--m`, 상품명·자세히 보기·쇼핑 계속하기·견적서 보기·동의 보기·문장 안 링크는 min-height 44 + 음수 margin, 체크·라디오는 입력을 줄 전체에 덮음(줄 44). order-now 자세히 보기·삭제 `.sb--m`. 390 실측 스크립트로 내 요소 중 44 미만 0(수량 40 · 공용 경로 링크 · 문장 안 전화번호만 남음).
- order noquote·saved: 결제 버튼(요약·아래 띠) 대신 "담당자에게 문의" / "주문내역 보기" 선 버튼, 동의 칸 감춤, 숨긴 결제 버튼 disabled.
- 결과 문장 한 곳: 769 이상 요약 상자(.co-sum__msg), 폰 본문 맨 위(.co-srv). cart 미선택·저장 실패도 같은 규칙(맨 위 사본 추가).
- 폰 진행 순서 `.co-stp` 감춤. 12.5px → 13px 임시 덮어쓰기(공용 10-form). `.co-errs`는 공용 `.msg--err` 색을 써서 hex 없앰. 날짜 칸 "날짜를 고르세요" 자리 글자(Chromium·WebKit 확인, Safari 글자 세로 가운데 정렬 포함).
- 점검: build → check pages 3페이지 6화면 실패 0 · els 빠짐 0 · 선택자 문제 0 · clash 내 클래스 겹침 0. reviewsheet 캡처 확인. 조작 44개 Playwright 확인(콘솔 오류 0).

## 남은 것
- 없음. `nicepay-return.html`(result 담당)의 처리 중 화면이 `order-complete.html?state=card`로 넘어가는 동작은 그쪽 몫(질문 기록에 적음).
