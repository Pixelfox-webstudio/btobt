# 진행 기록

대화가 길어져 앞 내용이 요약되면 이 파일, `spec/coverage.json`, `git log`를 다시 읽고 이어 간다. 작업 지시는 `spec/subpage-design-prompt.md`.

## 끝난 것 (2026-11-17 13:30 기준, 작업 지시 1~5단계 모두)
- 하위 페이지 40개 · 상태 384개(+ 부품 견본 `kit.html`). 전체 목록과 상태 링크는 `pages.html`.
- 레퍼런스 8개 유형 캡처·기록(`research/refs/`), 구조 결정 문서 13개(`research/decisions/`).
- 점검: `python3 tools/check.py pages`(Chromium 1440·1024·768·390 + WebKit 1710·390, 2,300여 회 렌더링) 실패 0 · `python3 tools/check.py coverage` 1,287항목 중 완료 1,280 · 해당 없음 7 · 남음 0 · `python3 tools/clash.py` 홈과 겹침 0 · `npx @google/design.md lint DESIGN.md` 오류 0.
- 독립 검수 13묶음 평균 883점, 800점 미만 0(`review/scores.md`).
- `DESIGN.md` Page Shell · Subpage Components · 페이지 유형별 조립법 · 점검 항목 · 원본 위치를 실제 결과로 다시 씀.
- 주문방법 화면 예시(`img/guide/`)를 실제 페이지로 다시 찍음, 대표 페이지 모음 `review/golden.html`.
- 사장님 확인 항목 `spec/questions.md`(사이트 전체 18개 + 페이지별).

## 남은 것 (이번 작업 범위 밖)
- 홈 시안에 넣어야 할 것: `spec/questions.md` 2번·16번(공통 요소, 후기 링크, 후기 자료 값). 작업 지시대로 홈 파일은 고치지 않았다.
- 실제 자료로 바꿀 것: `data-sample`(견본 값), `data-slot`(사진 자리), 외부 서비스(우편번호·결제·택배 조회).
- `printing.php`·`guide-logo.php`는 요소 목록이 없어 만들지 않았다.

## 만드는 방법 (알아 둘 것)
- **페이지는 조각으로 쓴다.** `tools/pages/<이름>.html` 첫머리에 `<!--{ JSON }-->`(title · desc · name · group · type · shell · nocs · auth · scripts · states), 그 아래 `<main>` 안 내용, `<!--@after-->` 아래 팝업. `python3 tools/build.py`가 `index.html`의 헤더·서랍·푸터·하단 상담 바를 잘라 붙여 `<이름>.html`을 만들고, `css/sub.css`(`tools/css/*.css`를 이름순으로 이어 붙임), `spec/pages.json`, `pages.html`을 같이 만든다. **루트의 html과 `css/sub.css`는 직접 고치지 않는다.**
- **상태**: `?state=키`(여러 개는 `+`). `data-st="키 키2"` = 그 상태에서만 보임, `data-st-not="키"` = 그 상태에서 숨김, `@member` / `@guest` = 로그인 여부. 팝업은 `data-open-st`, 알림은 `data-toast-st` + `data-toast`, 오류 표시는 `.fld[data-err-st][data-err]`, 확인 완료는 `data-ok-st`, 처리 중은 `data-busy-st`. 상태 키에 `=`가 있으면(`tab=notice&state=empty`) 주소 값으로 그대로 붙는다.
- **요소 점검**: 요소 목록의 줄 번호를 `data-el="L123 L124"`로 붙인다. 번호는 `python3 tools/els.py "페이지 이름 일부"`로 본다. 헤더·푸터처럼 속성을 붙일 수 없는 항목은 `spec/coverage-map.json`에 선택자를 적는다. 화면 요소가 아닌 서버 동작은 같은 파일에 `{"status":"na","note":"이유"}`.
- **점검**: `python3 tools/check.py pages [이름…] [--fast]`, `python3 tools/check.py coverage`, `python3 tools/clash.py`(홈 CSS와 클래스 이름 겹침). 캡처는 `review/shots/<페이지>/<상태>-<c|w><폭>.jpg`(git 제외). 여러 장을 붙여 보려면 `tools/sheet.py`, 레퍼런스는 `tools/refsheet.py`.
- **클래스 이름**: `<main id="main" class="v4 v5 v6 v7 v8 v9 v10 subp">`. 홈 CSS에 `.sub .box .chip .faq .mark .steps .tg`가 이미 있어서 `.subp .cbox .fchip(.fchips) .qlist .smark .stp .stag`로 바꿔 쓴다. 새 클래스를 만들면 `tools/clash.py`를 돌린다.
- **공용 부품**(`tools/css/00-base.css`, `10-form.css`): 머리 `.sub-head .crumb .sub-head__t`, 작은 제목 `.st`, 밑줄 탭 `.stab`, 버튼 `.sb(--line|--ink|--gray|--soft|--acc)(--s|--m|--l)` + 홈의 `.bt` `.pbtn` `.lnk`, 칩 `.stag`, 안내 `.note` `.msg(--err|--ok)` `.empty` `.gate`, 표 `.dl` `.tbl` `.pager`, 펼침 `.qlist`, 팝업 `.pop`(`data-pop="id"` / `data-pop-close`) · 옆 패널 `.side`, 단계 `.stp`, 양식 `.fset .fgrid .fld .inp .sel .txa .inrow .addr .chk .rdo .seg .opt .upl(data-upl) .files .qty .cap .agree .form-acts`, 아이콘 `<i class="i i-이름">`(`tools/icons.py`).
- **`js/sub.js`**: 상태, 시안끼리 이동(`data-href="x.php"` → `x.html`), 헤더 보강(회원 이름 · 장바구니 수 · 최근/인기 검색어 · 이벤트), 방문 기록 동의, 상담 메뉴, 팝업, 알림(`SUB.toast`), 확인 창(`data-confirm`), 양식 검사(`form[data-check]`), 수량, 파일 첨부, 복사, 기간 빠른 선택, 관심상품, 탭, 부분 전환(`data-views="tab"` + `data-view` + `data-view-link`).
- **상품 자료**: `js/sub-data.js`의 `SUBDATA`(P · list · brands · card() · pager()). 홈의 catalog · rank · extra · brands 자료를 합친 것. 세부 분류·소재·형태·시즌·색 이름은 자료에 없어 상품명에서 읽어 낸 견본 값이다.
- **운영하면서 채워질 값**에는 `data-sample`, 교체할 사진 자리에는 `data-slot`, AI 사진에는 `data-temp="ai"`와 "연출 이미지입니다.".
- 사장님이 싫어한 것: 갑자기 나오는 검은 섹션, 뜬금없이 큰 글자, 장식용 단계 번호, 회색 빈 상자, 자동으로 흘러가는 띠, 높이가 들쭉날쭉한 카드, 폰에서 끝없이 긴 스크롤. Safari: 세로 flex 안 `aspect-ratio` 칸 + 좌우 margin + stretch 조합 금지(폭을 `calc`로).
- 운영 중인 사이트(noeul.shop, ~/noeul.shop)는 열지 않는다. 홈 시안 파일(`index.html`, 기존 `css/` `js/`)은 고치지 않는다.

## 결정이 필요했던 곳
`spec/questions.md`에 모은다(5단계에서 정리). 지금까지: 따로 열리는 창(견적서·시안)은 헤더·푸터 없이 만든다 / 마이페이지·고객센터는 한 파일에서 부분 전환 / 작업복 상품 자료가 없어 조끼·자켓·바지 상품을 견본으로 씀 / 헤더의 회원 이름·장바구니 수·인기 검색어·상담 메뉴·방문 기록 동의는 홈 시안에 없어 `js/sub.js`가 덧붙임(홈에도 넣어야 함) / 위 띠 문구가 요소 목록(공장 직납·후불 결제, 카카오톡 추가 할인)과 홈 시안이 다름.
