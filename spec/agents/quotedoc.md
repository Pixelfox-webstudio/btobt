# 진행 메모 — quotedoc (견적서 7종)

담당 파일: `tools/pages/quote-document.html` · `quote-preview.html` · `quote-request-document.html` · `custom-quote-preview.html` · `custom-quote-document.html` · `safety-quote-preview.html` · `safety-quote-document.html`, `tools/css/80-quotedoc.css`, `js/sub-quotedoc.js`, `spec/coverage-map/quotedoc.json`, `research/decisions/document.md`, `spec/questions/quotedoc.md`

## 끝난 것
- 읽기, 레퍼런스 캡처 확인, 결정 문서(`research/decisions/document.md`).
- CSS 조각 · JS · 일곱 페이지 모두. 상태: quote-document 7 · quote-preview 7 · quote-request-document 9 · custom-quote-preview 4 · custom-quote-document 7 · safety-quote-preview 3 · safety-quote-document 7 (합계 44).
- 점검(2026-11-17 마지막): `check.py pages` 7페이지 44상태 264회 실패 0, `check.py els` 83항목 빠짐 0 · 선택자 문제 0, `clash.py` 겹침 0.
- 캡처 확인: PC·폰 모든 상태 시트, quote-document의 1024·768·WebKit 1710·390. 공급자 상자 높이 맞춤, 표 아래 두 묶음의 위 선 맞춤, 오류·없음 화면에 고객센터 정보 상자 추가.
- 버튼 흐름 확인(Playwright): 다운로드 준비 중 → 완료 알림, 오류 상태의 오류 알림, 견적 요청 → 완료 창 → 마이페이지 이동, 실패 상태에서 창 안 뜸, 닫힘 상태에서 버튼 못 누름.

## 남은 것
- 없음. 정할 것은 `spec/questions/quotedoc.md`(주문 견적서 금액을 order.html과 맞추기 등).
