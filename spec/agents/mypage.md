# 진행 메모 — mypage (마이페이지 13부분)

담당 파일: `tools/pages/mypage.html`, `tools/css/65-mypage.css`, `js/sub-mypage.js`, `spec/coverage-map/mypage.json`, `research/decisions/account.md`, `spec/questions/mypage.md`

## 지금까지
- 1차(앞 작업자): 읽기 · 결정 문서 · mypage.html 상태 50개 · 점검 실패 0 / 빠짐 0.
- 2차(이어서, 2026-11-17 오후): 반장 공용 변경(0절) 반영.
  - sub-mypage.js 첫머리의 `<html data-pop>` 임시 조치를 지웠다(공용 sub.js 가 고쳐짐).
  - 65-mypage.css: `.my-sub.stab` 의 좌우 여백 0 덮어쓰기 삭제(.stab 이 알약 줄로 바뀜), 13.5px → 14px, 11.5px → 12px, `#DEDEE2` → `var(--ln)`.
  - 폰 주문 카드를 줄였다(머리 줄 번호·상태·화살표 / 사진 56 + 상품명·옵션 / 접수일·금액 + 버튼). 기본 1개월 12건이 접지 않고 다 보여 조건별 버튼 9가지가 폰에서도 한 번씩 나온다. 12건을 넘으면 열 건 뒤를 접는다. 폰에서 뺀 상태 풀이 문장은 주문 상세 "현재 상태" 아래로 옮겼다.
  - 관심상품 견본에서 비슷한 검정 패딩 두 장이 나란히 오던 것을 카라 티셔츠(c288)로 바꿨다.
  - 결정 문서 · 질문 기록을 위 내용대로 고쳤다.
- 점검: check.py pages mypage(6화면) · els · clash 를 마지막에 다시 돌렸다(보고서 숫자 참고).
- 3차(독립 검수 지적 반영, 2026-11-17):
  - 폰 오류 알림이 한 줄로 늘어나 잘리던 것: 65-mypage.css 맨 아래 임시 묶음(`body[data-page="mypage"]`)에서 폰 알림을 좌우 16px 안에 가두고 줄바꿈 · min-height 48 · 여백 12/16. 390에서 두 줄(높이 68)로 다 보인다.
  - 배송지 카드: 기본 배송지의 안쪽 그림자(2px처럼 보이던 선)를 빼고 모든 카드 1px 선 · 16px, 기본은 선 색만 검정. 그리드 stretch + 버튼 줄 margin-top:auto(같은 줄 높이 212/212 확인), 버튼 min-height 44, 폰은 한 줄 같은 너비(100px × 3, 높이 44).
  - 글자 크기: 내 CSS의 12.5px 전부 → 13px, PC 14.5px 본문 → 15px, 18px 이름 → 17px. 공용 `.fset__t` PC 20px, `.fld__l small`·`.r`·`.upl__tx small`·`.files__s` 13px, `.nb` 12px, `.files__ext`·`.thumbs em` 12px을 임시 묶음에서 덮었다.
  - `.smark` 그림자 없앰(임시 묶음).
  - 오류 빨강은 지침 0절대로 그대로 둠(질문 기록 참고).
  - 공용에 넘길 것: 위 임시 묶음 내용을 00-base · 10-form 에 반영하면 65-mypage.css 맨 아래 묶음을 지운다.

## 남은 것
- 없음(draft-preview · inquiry-draft 는 이 과제 범위 밖).
