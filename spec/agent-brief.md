# 하위 페이지 제작 지침 (작업자 공통)

여러 작업자가 같은 폴더(`~/Downloads/b2bt-home-v10`)에서 동시에 일한다. 이 문서와 과제 설명을 끝까지 읽고 시작한다.

## 1. 무슨 일인가
비투비티는 주식회사 노을상사의 B2B 쇼핑몰이다. 기업·관공서 구매 담당자에게 단체복·작업복·협력 브랜드 상품과 맞춤 작업복을 판다. 결제보다 장바구니에서 견적·시안 요청으로 넘어가는 흐름이 중심이다.
홈 화면은 이미 새로 디자인했다(`index.html`). 네 일은 맡은 하위 페이지를 **같은 디자인의 정적 HTML 시안**으로 만드는 것이다. 사장님이 브라우저로 열어 보고 "이대로 개발하자"고 정할 수 있는 수준이어야 한다. 서버 연결은 범위가 아니고, 화면 안 조작(선택, 수량 입력, 펼치기, 상태 바꿔 보기)만 JS로 붙인다.
질문하지 않는다. 가장 무난한 해석으로 끝까지 만들고, 결정이 필요했던 곳은 `spec/questions/<키>.md`에 한 줄씩 적는다.

## 2. 자료와 우선순위 (위가 우선)
1. 이 문서와 과제 설명.
2. `spec/page-elements.md` — 페이지마다 있어야 하는 요소. `python3 tools/els.py "절 이름 일부"`로 맡은 절을 줄 번호와 함께 본다. **이 목록의 요소는 하나도 빠지면 안 되고, 목록에 없는 기능을 새로 만들어 넣지도 않는다.** 위치·순서·모양은 적혀 있지 않다. 그건 네가 정한다.
3. `DESIGN.md`, `index.html`, `css/` — 어떻게 보여야 하는가. 색·글자·간격·모서리·문구 말투는 `DESIGN.md`가 정답이다. (단, 그 문서의 "페이지 유형별 조립법" 표와 "Subpage Components"는 초안이라 따르지 않아도 된다. `class="sub"`도 지금은 `subp`다.)
4. `research/refs/<유형>/` — 레퍼런스 캡처와 기록(`notes.md`). 구조와 흐름을 어떻게 풀지의 근거다.

홈이 어떻게 생겼는지는 `review/home/home-1440.jpg`, `home-390.jpg`를 직접 열어 본다. 이미 만든 하위 페이지는 `category.html`(상품 목록)과 `kit.html`(공용 부품 견본)이다. `python3 tools/reviewsheet.py kit category`가 만든 `review/sheets/kit-*.png`, `category-*.png`를 열어 보면 톤을 알 수 있다.

## 3. 하지 않는 것
- **운영 중인 사이트를 보지 않는다.** `https://noeul.shop`과 `~/noeul.shop` 폴더는 열지 않는다. 사장님은 기존 화면에 묶이지 않은 새 디자인을 원한다.
- **홈 시안을 고치지 않는다.** `index.html`, `css/`의 ds-blue · site · v4 · v8-base · v8 · ui-v8 · v9 · v10, `js/`의 site-v10 · v10 · bgfx · catalog · brands · rank · extra · reviews는 읽기만 한다.
- **공용 파일과 남의 파일을 고치지 않는다.** `tools/*.py`, `tools/css/00-base.css · 10-form.css · 20-list.css · 90-index.css · 95-icons.css`, `js/sub.js · sub-data.js · sub-list.js`, `spec/coverage-map.json`, `spec/coverage.json`, `spec/plan.md`, `DESIGN.md`, 다른 작업자의 페이지 조각·CSS·JS. 공용 부품에 버그나 모자란 점이 있으면 네 CSS 조각에서 덮어쓰지 말고 보고서의 "공용 부품에 필요한 것"에 적는다(급하면 네 조각에 임시로 넣고 그 사실을 적는다).
- **루트의 `*.html`, `css/sub.css`, `pages.html`, `spec/pages.json`을 직접 고치지 않는다.** 빌드가 만든다.
- `git` 명령을 실행하지 않는다. 폴더 밖 파일을 고치지 않는다. 어디에도 올리지 않는다. 외부 서비스에 사람·회사의 이름·이메일·연락처를 보내지 않는다.
- `frontend-design` 같은 디자인 스킬을 쓰지 않는다. 미감은 `DESIGN.md`로 이미 정해져 있다.

## 4. 네가 주인인 파일 (과제에 적힌 키·접두어 기준)
- 페이지 조각: `tools/pages/<페이지>.html`
- CSS 조각: `tools/css/<번호>-<키>.css` (과제에 적힌 이름 하나)
- JS: `js/sub-<키>.js` (필요할 때)
- 요소 점검 보조표: `spec/coverage-map/<키>.json` (필요할 때)
- 결정 문서: `research/decisions/<과제에 적힌 이름>.md`
- 질문 기록: `spec/questions/<키>.md`, 진행 메모: `spec/agents/<키>.md`
**먼저 이 파일들이 이미 있는지 확인한다.** 있으면 앞 작업자가 하다 끊긴 것이다. `spec/agents/<키>.md`를 읽고 이어서 한다(다시 처음부터 만들지 않는다). 페이지 하나를 끝낼 때마다 진행 메모에 끝난 것·남은 것을 한두 줄로 적는다.

## 5. 순서
1. 읽기: 이 문서 → `DESIGN.md` 전체 → 맡은 요소 목록 절(`tools/els.py`) → `tools/pages/kit.html`(부품 마크업)과 `tools/pages/category.html`(실제 페이지 예) → `review/home/home-1440.jpg` · `home-390.jpg`.
2. 레퍼런스: `research/refs/<유형>/notes.md`를 읽고(아직 없으면 생략) **캡처를 직접 연다.** 여러 장은 `python3 tools/refsheet.py /tmp/x.png 600 1500 a-pc.jpg b-pc.jpg c-pc.jpg`(PC 3장) / `... 300 1500 …-m.jpg ×6`(모바일)로 붙여 본다. 기억으로 쓰지 않는다.
3. 결정 문서: `research/decisions/<이름>.md`. 구조 후보를 두세 개 세우고 하나를 고른 뒤 근거를 적는다. 근거는 (가) 캡처에서 본 사실 (나) 요소 목록의 요구 (다) `DESIGN.md` 규칙에서 나와야 한다. 형용사("세련됨", "직관적")로 끝내지 않고 "수량 입력을 색상 행 × 사이즈 열 표로 둔다"처럼 그대로 만들 수 있는 문장으로 쓴다. 제목과 문장은 평문. 본보기: `research/decisions/list.md`. 가져오는 것은 구조·흐름·조작 방식뿐이다(색·글꼴·모서리·그림자는 `DESIGN.md`, 레퍼런스의 사진·문구·로고는 가져오지 않는다).
4. 만들기: 과제의 첫 페이지(대표 페이지)를 상태까지 완성 → 점검 → 캡처를 눈으로 보고 고침 → 나머지 페이지.
5. 마지막 점검(7절)과 보고(9절).

## 6. 만드는 방법

### 6.1 페이지 조각
`tools/pages/<이름>.html` 한 파일이 한 페이지다. 헤더·푸터는 쓰지 않는다(빌드가 `index.html`에서 잘라 붙인다).
```html
<!--{"title": "장바구니", "desc": "한 문장 설명", "name": "장바구니", "group": 3, "order": 1, "type": "cart",
 "sections": ["장바구니"], "scripts": ["js/catalog.js", "js/brands.js", "js/rank.js", "js/extra.js", "js/sub-data.js", "js/sub-cart.js"],
 "states": [["default", "기본"], ["state=empty", "빈 장바구니"], ["state=guest", "비로그인"]]}-->
<section class="sub-head">…</section>
<div class="wrap sub-body">…</div>
<!--@after-->
<div class="pop" id="…" hidden>…</div>   <!-- 팝업·옆 패널은 여기 -->
```
- `title`: 브라우저 제목(뒤에 " | 비투비티"가 붙는다). `name`: 요소 목록의 페이지 이름. `group`: 과제에 적힌 묶음 번호. `order`: 묶음 안 순서.
- `sections`: 이 파일이 맡는 요소 목록 절 이름(`##` 제목 그대로, 여러 개 가능). 요소 점검이 이것을 본다.
- `shell`: 기본 `"full"`(헤더·푸터 있음). 따로 열리는 창은 `"shell": "bare", "win": true`. `"nocs": true`면 빠른 상담(하단 상담 바·우측 플로팅)을 감춘다. `"auth": "guest"`면 기본 상태가 비로그인.
- `scripts`: `js/sub.js`는 항상 들어간다. 상품 자료가 필요하면 위 예처럼 다섯 파일을 순서대로, 후기 자료는 `js/reviews.js`.
- `states`: `[키, 이름]`. 첫 항목은 반드시 `"default"`. 나머지 키는 **주소 뒤에 붙는 값 그대로** 쓴다(`"state=empty"`, `"tab=notice&state=empty"`, `"section=orders"`). `pages.html`(검수 목록)과 점검 스크립트가 이 목록으로 모든 상태를 연다. **요소 목록의 "안내·상태"에 있는 것(빈 상태, 오류, 비로그인, 처리 중, 완료, 조건별 화면)은 전부 상태로 볼 수 있어야 한다.**
- `<main id="main" class="v4 v5 v6 v7 v8 v9 v10 subp">` 안에 들어간다. 본문 내용은 `.wrap`(좌우 여백) 안에 둔다. `h1`은 화면에 보이는 것이 정확히 하나.

### 6.2 상태 보기 (`js/sub.js`)
- `?state=a+b`처럼 여러 키를 함께 줄 수 있다. `data-st="a b"` = 그 상태 중 하나일 때만 보임. `data-st-not="a"` = 그 상태에서는 숨김. `@member` / `@guest` = 로그인 여부(`?state=guest`로 비로그인). **기본 상태에서만 보일 내용에는 `data-st="default"`를 쓰지 말고 `data-st-not="다른상태들"`을 쓴다**(다른 상태와 조합될 수 있다).
- 팝업을 그 상태에서 연 채로: `<div class="pop" data-open-st="detail" hidden>`. 알림: `<i hidden data-toast-st="fail" data-toast="문구" data-toast-err></i>`. 입력 오류 표시: `<div class="fld" data-err-st="err" data-err="안내 문구">`. 확인 완료 표시: `data-ok-st`. 처리 중 버튼: `data-busy-st`.
- JS에서: `SUB.has('empty')`, `SUB.hit('a b')`, `SUB.auth`('member'|'guest'), `SUB.qs`(URLSearchParams).

### 6.3 요소 점검용 표시
요소 목록의 줄 번호를 그 요소에 `data-el="L123 L124"`로 붙인다(한 요소에 여러 줄 가능, JS가 그리는 요소라면 그 그릇에). 붙일 수 없는 항목(실행 중에만 뜨는 알림 등)은 `spec/coverage-map/<키>.json`에 적는다:
```json
{ "L315": {"file": "cart.html", "state": "state=fail", "selector": ".sub-toast--err.is-on"},
  "L756": {"status": "na", "note": "고객이 열어 본 시각을 서버가 기록하는 동작이라 화면 요소가 없다"} }
```
`state`는 조각의 states 키 그대로(기본은 생략). `na`는 화면에 아무것도 없는 서버 동작일 때만 쓰고 이유를 적는다. 화면에 조금이라도 보이는 것은 `na`가 아니다.

### 6.4 빌드와 점검
```
python3 tools/build.py                              # 전부 다시 만든다(10초 안쪽). 조각이나 CSS를 고칠 때마다
python3 tools/check.py pages 이름 [이름…] --fast    # Chromium 1440·390만. 작업 중 빠른 확인
python3 tools/check.py pages 이름 [이름…]           # Chromium 1440·1024·768·390 + WebKit 1710·390. 마지막에 반드시
python3 tools/check.py els 이름 [이름…]             # 맡은 절의 요소가 다 있는지
python3 tools/clash.py                               # 새 클래스 이름이 홈 CSS와 겹치는지
python3 tools/reviewsheet.py 이름 [이름…]           # 캡처를 몇 장으로 붙여 review/sheets/ 에 저장(눈으로 볼 때)
```
- 화면 점검이 실패로 보는 것: 가로 스크롤, 콘솔 오류, 깨진 이미지, 보이는 `h1`이 하나가 아님, 헤더·푸터가 `index.html`과 다름, CSS 순서, `<main>` 클래스, 홈 전용 스크립트(`v10.js`·`bgfx.js`), `data-rv`.
- 캡처는 `review/shots/<페이지>/<상태>-<c|w><폭>.jpg`. `check.py pages`를 인자 없이 돌리지 않는다(전체를 돌려 느리다). `check.py coverage`도 돌리지 않는다(공용 파일을 쓴다).
- 다른 작업자가 같은 때에 빌드해도 괜찮게 되어 있다. 남의 페이지가 실패로 나와도 네 일이 아니다.

### 6.5 CSS
- 네 조각의 선택자는 빌드 때 자동으로 앞에 `.subp `가 붙는다. **평범하게 `.co__row{…}`처럼 쓴다**(직접 `.subp`를 붙이지 않아도 된다). 덕분에 홈 CSS의 `.v4 h1{font-weight:800}` 같은 규칙보다 우선한다.
- **새 클래스는 과제에 적힌 접두어로 시작한다**(예: `co__row`, `co-sum`). 접두어 없는 새 이름은 만들지 않는다. 만들고 나면 `tools/clash.py`.
- 값은 `DESIGN.md` 토큰만 쓴다. 이미 있는 변수: `var(--ink)` #0E0E10, `var(--accent)`, `var(--accent-text)`, `var(--accent-soft)`, `var(--gut)`, `var(--sec)`, `var(--ease)`, `var(--f-en)`, `var(--f-mono)`, 그리고 `#main.subp`의 `--fg`(#000) `--fg2`(#474747) `--fg3`(#6B6B70) `--ln`(#DEDEE2) `--tint`(#F5F5F6) `--blk`(64/44px) `--blk-s`(40/28px). 강조색 hex를 직접 쓰지 않는다.
- 미디어쿼리는 `max-width:768px`(폰) / `min-width:769px` / `1024px` / `1100px` / `600px`만.
- 움직임은 `prefers-reduced-motion:reduce`에서 끈다. 스크롤 등장 효과(`data-rv`)는 쓰지 않는다.
- Safari: 세로 flex 안에서 `aspect-ratio` 칸에 좌우 margin을 주고 stretch시키는 조합을 쓰지 않는다(폭을 `calc`로 직접 준다).

### 6.6 공용 부품 (먼저 이것을 쓴다. 마크업은 `tools/pages/kit.html`에서 베낀다)
| 용도 | 클래스 |
|---|---|
| 페이지 머리 | `.sub-head` > `.wrap` > `.crumb`(경로) + `h1.sub-head__t`(+`small`) + `p.sub-head__d`. 가운데 정렬 `.sub-head--c`. 본문 시작 `.wrap.sub-body` |
| 폭 | `.wrap`(본문 틀), 좁은 열 `.wrap--760` `.wrap--560` `.wrap--440`. 묶음 사이 `.blk`(64/44) `.blk-s`(40/28) |
| 작은 제목 | `h2.st`(20) `.st--s`(17) + `small`, 제목 줄 `.st-row`, 설명 `.sd` |
| 페이지 안 메뉴 | 밑줄 탭 `.stab`(a `aria-current="page"` / button `role="tab" aria-selected`), 가운데 `.stab--c`. 홈의 떠 있는 알약 줄 `.bh`(분류 고르기)는 `category.html` 조각 참고 |
| 버튼 | 주 버튼 `.bt.bt--ink`(검정) `.bt--acc`(파랑, 한 화면에 하나) `.bt--line` `.bt--wh`(사진 위) + `.bt--full` `.bt--noi`(화살표 칸 없음). 보조 `.sb` + `--ink --line --gray --soft --acc` + `--s --m --l` `.sb--block`. 전체 보기 `.pbtn`, 글자 링크 `.lnk`(화살표) `.tl`(밑줄). 버튼 줄 `.acts`(`--c` `--end`). 처리 중 `.is-busy`, 못 누름 `disabled` |
| 표시 | 상태 칩 `.stag`(+`--ink --acc --line --red --l`), 새 소식 수 `.nb`, 점 `.nd` |
| 안내 | `.note`(회색 상자, `.note__t` + `ul`), `.msg` `.msg--err` `.msg--ok`(한 줄), `.empty`(빈 상태: `.empty__ic` `.empty__t` `.empty__d` `.acts`), `.gate`(한 가지 결과만 알리는 화면: `.smark` + `.gate__t` + `.gate__d` + `.gate__box` — `tools/pages/unsubscribe.html` 참고), 둥근 표식 `.smark`(+`--ink --gray --red`), 불러오는 중 `.busy` `.skel` |
| 상자 | `.cbox`(선 상자) `.cbox--tint` `.cbox--s` |
| 정보 줄·표 | `dl.dl`(dt/dd 줄) `.dl--sm` `.dl--plain`, `table.tbl`(+`.tbl--stack` 폰에서 쌓임, `td[data-th]`, 오른쪽 정렬 `.r`), `.tbl-scroll`, 쪽 번호 `.pager`(`SUBDATA.pager(cur,total,all)`) |
| 펼침 | `.qlist` > `details` > `summary` + `.qlist__a` |
| 단계 표시 | `ol.stp` > `li.is-done|.is-on` > `b`(번호) + `span`. 순서를 알려 주는 용도로만 쓴다 |
| 팝업 | `.pop` > `.pop__dim[data-pop-close]` + `.pop__box(--m|--l|--xl)` > `.pop__head`(`.pop__t` + `.pop__x`) + `.pop__body` + `.pop__foot`. 가운데 확인형 `.pop--c`. 여는 버튼 `data-pop="id"`. 옆 패널 `.side` > `.side__dim` + `.side__panel` > `.side__head` `.side__body` `.side__foot` |
| 알림·확인 | `data-toast="문구"`(+`data-toast-err`), `SUB.toast(msg,{error,action,onAction})`. 확인 창 `data-confirm="제목" data-confirm-desc data-confirm-ok data-done="끝난 뒤 알림" data-go="주소"` 또는 `SUB.confirm({title,desc,ok,onOk})`. 복사 `data-copy="값" data-copy-ok="문구"` |
| 양식 | 묶음 `fieldset.fset` > `legend.fset__t`, 2열 `.fgrid`(`.full` 전체 폭) / 1열 `.fstack`. 항목 `.fld` > `.fld__l`(`em` 필수 *, `small` 보조, `.r` 글자 수) + 입력 + `.fld__help` + `.fld__msg--err|--ok`. 입력 `.inp` `.sel` `.txa`, 입력+버튼 `.inrow`, 3칸 `.inrow--3`, 주소 `.addr`, 비밀번호 보기 `.pw` + `.pw__eye`, 체크 `.chk`, 라디오 `.rdo`(묶음 `.choice`), 알약 선택 `.seg`, 카드형 선택 `.opts(--2|--3|--4)` > `.opt`(큰 것 `.opt--l` + `.opt__chk`), 칩 `.fchip`(`aria-pressed`) 묶음 `.fchips`, 파일 첨부 `label.upl[data-upl]` + `ul.files`(이름 목록) 또는 `ul.thumbs`(미리보기), 수량 `.qty`(버튼 `data-q="-1|1"` + `input[type=number]`), 자동등록방지 `.cap`, 동의 `.agree`, 버튼 줄 `.form-acts` |
| 양식 동작 | `data-fmt="phone|biz|digits|id|money"`(자동 맞춤), `data-rule="email|phone|mobile|biz|zip|pw|birth|cap"`, `required`, `data-msg`, `data-same="다른 입력 id"`, `data-min`, `data-count="글자수 표시 id"`. `<form data-check="위에 띄울 요약 문구" data-done="완료 알림" data-go="이동할 주소" data-done-pop="열 팝업 id" novalidate>`: 제출하면 항목별로 `.fld.is-err` + 안내가 붙고 첫 항목으로 간다. 고치면 바로 사라진다. `.fld[data-need="checked"]`는 `.is-ok`가 붙어야 통과(중복확인 등). JS: `SUB.checkForm(form)`, `SUB.setErr(fld,msg)`, `SUB.initUpl(el)` |
| 파일 첨부 값 | `data-upl='{"max":10,"mb":10,"total":100,"accept":"jpg,png,pdf","first":"대표"}'`, 견본 파일 `data-files='[["로고.ai",2400000]]'`. 개수·용량·형식·중복 안내는 `sub.js`가 한다. 바뀌면 `upl:change` 이벤트 |
| 부분 전환 | 주소로 나뉘는 부분: `<div data-views="tab" data-views-default="faq">` 안의 `<section data-view="faq">`, 링크 `data-view-link="faq"`(주소가 `?tab=faq`로 바뀌고 새로 불러오지 않는다). 탭: `[role=tablist]` > `[role=tab][aria-controls]` ↔ `[role=tabpanel]` |
| 그 밖 | 기간 빠른 선택 `[data-period]` 안의 `button[data-range="7|30|90"]` + `input[type=date]` 둘. 관심상품 `button[data-like="상품키"][aria-pressed]`. 창 닫기 `data-win-close`. 방문 기록 설정 다시 띄우기 `data-ck-open`. 숫자는 `.num`, 낭독용 글자는 `.sr-only` |
| 아이콘 | `<i class="i i-이름" aria-hidden="true"></i>` 크기 `.i--14 --16 --18 --22 --24 --28 --32`(기본 20). 이름: search user bag heart heart-on x check arrow-r arrow-l chev-r chev-l chev-d chev-u first last plus minus filter phone chat pen file doc clip upload download trash info alert help cal truck box card copy eye eye-off pin star image building lock clock refresh mail external home receipt shirt coin bell zoom play kakao grid1 grid2 send logout undo insta youtube nblog. 없는 그림은 `DESIGN.md` 아이콘 규칙대로 인라인 SVG. 이모지·아이콘 폰트는 쓰지 않는다 |
| 홈 부품 | 상품 카드 `.pc`(`SUBDATA.card(p,{rank,liked,slim,plain})`가 그린다), 격자 `.pgrid`, 후기 카드 `.rv__card`, 화살표 `.arw`, 수량 `.qty`, 섹션 제목 `.vh` + `.tt__pre` + `.tt__key` — `DESIGN.md` Components 참고 |

### 6.7 시안끼리 이동
링크는 홈과 같이 `href="#" data-href="파일.php?값"`로 쓴다. `sub.js`가 만든 페이지면 `파일.html?값`으로 보내 준다. 상태가 붙은 시안 주소로 바로 보내려면 `href="order-complete.html?state=card"`처럼 직접 쓴다. 전화는 `href="tel:050713786094"`, 카카오톡 채널은 `href="https://pf.kakao.com/_uxjxmxjn" target="_blank" rel="noopener"`.
파일 이름: category · brand · search · product · cart · order · order-now · nicepay-return · order-complete · quote-intro · quote · custom-intro · login · signup · signup-general · signup-business · signup-general-info · signup-business-info · mypage(`?section=orders|inquiries|safety|wishlist|points|addresses|profile|password|withdraw`) · draft-preview · inquiry-draft · customer-center(`?tab=faq|order-guide|qna|notice`) · reviews · review-view · event · event-view · delivery-cases · partnership · quote-preview · quote-document · quote-request-document · custom-quote-preview · custom-quote-document · safety-quote-preview · safety-quote-document · terms · refund-policy · privacy · guest-privacy · unsubscribe.

### 6.8 상품·후기 자료 (`js/sub-data.js` → `window.SUBDATA`)
- `SUBDATA.P['c460']`(단체복 85종: key id cat name code size sizes[{l,n}] price priceNum colors[{hex,name}] nColors imgs[앞,뒤] hi gallery sub season material form), `SUBDATA.P['b3026']`(협력브랜드 72종: 가격·사이즈·색상 없음 → "견적문의"), `SUBDATA.list`, `SUBDATA.brands`(9곳: key en ko count logo items), `SUBDATA.card(p,opt)`, `SUBDATA.pager()`.
- 사진: `img/catalog/<번호>-f.webp · -b.webp`(상품 앞·뒤), `img/shop/<번호>-front.webp · -back.webp`(1200px, 15종), `img/products/<번호>-1~4.webp`(상세 사진: 194 206 227 288 431 463 465 475), `img/brandp/<번호>.webp`, `img/brandlogo/<키>.webp`, `img/reviews/<id>-01.webp`(작은 것 `-01t.webp`) + `js/reviews.js`(`window.B2BT_REVIEWS`: 실제 후기 23건), 현장 사진 `img/v5/*.webp` `img/v7/*.webp` `img/v9/*.webp` `img/gnb/*.webp`(전부 AI 연출 사진).
- 회사 정보는 `index.html` 푸터 값만 쓴다(상호 주식회사 노을상사, 대표이사 고도혁, 사업자등록번호 885-87-03544, 통신판매번호 2026-부산 해운대-0131호, 대표전화 0507-1378-6094, 이메일 noeul@noeul.co, 부산사업부 부산광역시 해운대구 반여로 96, 고객센터 주중 10시~18시·점심 12시~13시·주말 공휴일 제외).

## 7. 디자인과 내용

### 7.1 꼭 지킬 것 (`DESIGN.md` 요약 — 원문이 정답)
- 흰 바탕, 검정 잉크, 상품 사진이 화면을 이끈다. 장식은 거의 없다. **파랑은 포인트로만**(선택 상태·주요 버튼은 검정. 한 화면에 파란 버튼은 하나까지).
- 모서리는 두 가지: 버튼·탭·칩은 알약(999px), 사진·카드·상자·팝업은 16px(입력칸·작은 칸 12px). 8px·6px·4px는 쓰지 않는다.
- 그림자는 떠 있는 것(팝업, 붙어 따라오는 바)에만. 구역은 회색 바탕(#F5F5F6)과 1px 선으로 나눈다.
- 섹션 간격은 `var(--sec)`(120/96/72), 좌우 여백은 `.wrap`. 한 페이지 안의 작은 묶음 사이는 `.blk`/`.blk-s`.
- 글자: 페이지 제목 32/700(폰 24), 묶음 제목 20/700, 본문 15/1.7, 보조 13~14. 800은 상품명·가격에만. 섹션 제목에 영문 라벨을 쓰지 않는다. 숫자는 `.num`.
- 터치 대상 44px 이상. `:focus-visible`을 지우지 않는다. 폰(390)에서 가로 스크롤 없음.

### 7.2 사장님 취향
국내 대기업 사이트처럼 깔끔하고 세련된 인상. AI가 만든 티가 나면 안 된다.
- 싫다고 한 것: **갑자기 나오는 검은 섹션 배경, 뜬금없이 큰 글자, 장식용 단계 번호, 회색 빈 상자로 남긴 자리, 자동으로 흘러가는 띠, 높이가 들쭉날쭉한 카드, 모바일에서 끝없이 긴 스크롤.**
- "너무 깔끔해서 밋밋하다"는 말도 했다. 장식을 더하라는 뜻이 아니다. **사진, 글자 위계, 정보 밀도**로 완성도를 낸다. 빈 화면에 글자 몇 줄만 두지 말고, 그 화면에서 실제로 필요한 정보를 표·목록·요약으로 촘촘히 정리한다.
- 지난 리디자인이 "어색하고 빈약했다"는 평을 받은 이유: 레퍼런스를 눈으로 보지 않음, 방향을 형용사로만 정함, 회색 상자와 임시 문구를 남김, 상태 화면을 빠뜨림, 만든 화면을 스스로 확인하지 않음. 이번에는 다섯 가지를 모두 한다.
- 폰에서는 긴 내용을 접거나 옆으로 넘기거나 요약해서 길이를 줄인다. 카드는 같은 줄에서 높이가 같게 한다.

### 7.3 문구와 내용
- 버튼·라벨·안내·빈 상태·오류 문구는 **실제로 쓸 최종 문구**로 쓴다. 한국어 평서문("~습니다", "~하세요"), 짧게, 사실만. 과장·감탄·이모지 없음. "Lorem", "내용이 들어갑니다" 같은 임시 문구 금지.
- 요소 목록에 적힌 조건(파일 개수·용량, 글자 수, 기간, 할인율, 운영 시간)은 그대로 쓴다.
- **회사에 대한 새 사실을 만들지 않는다**(수치, 실적, 인증, 납기, 할인율, 후기, 고객사 이름).
- 운영하면서 채워질 자리(주문 내역, 공지 제목, 문의 글, 약관 본문, 계좌 등)는 그럴듯한 예시 값을 넣고 그 요소에 `data-sample`을 붙인다.
- 사진이 필요한데 자료가 없으면 회색 상자로 두지 말고, 있는 사진을 쓰고 `data-slot="자리-이름"`을 붙인다. AI 연출 사진에는 `data-temp="ai"`와 사진 위 "연출 이미지입니다."(`.lhero__note` 모양 참고). 모든 `img`에 `width`·`height`, 첫 화면 밖은 `loading="lazy" decoding="async"`.

### 7.4 견본 값은 모두 같은 것을 쓴다 (페이지끼리 이어져 보이게)
- 회원: **김민준**, 기업 회원, **한결산업 주식회사**(대표자 한정우, 사업자등록번호 123-45-67890, 업태 제조업, 업종 금속 가공), 휴대전화 010-1234-5678, 이메일 mj.kim@example.com, 주소 (48058) 부산광역시 해운대구 센텀중앙로 97, 5층. 일반 회원 예시는 **이서연**(seoyeon@example.com, 010-2345-6789). 보유 포인트 12,450P.
- 장바구니에 담긴 상품 3건:
  1. `c460` 방한 후드 패딩 · 블랙 · 인쇄 있음(자수 인쇄, 왼쪽 가슴·등, 첨부 `로고_시안.ai` 2.4MB · `가슴_인쇄_위치.png` 480KB) · 개별 폴리백 · 90 5벌 · 95 20벌 · 100 30벌 · 105 15벌 = 70벌 · 단가 59,000원
  2. `c195` 웰론 보온 겨울조끼 · 네이비 · 인쇄 없음 · 기본 포장 · M 10 · L 12 · XL 8 = 30벌 · 단가 28,000원
  3. `b3026` 케이투 JK-F6101 · 인쇄 없음 · 12벌 · 견적문의(단가 없음)
- 번호: 시안 요청 `R-20261112-0031`, 견적 요청 `R-20261110-0027`, 주문 `O-20261115-0007`, 견적문의 `Q-20261110-0012`, 맞춤작업복 문의 `C-20261109-0004`, 1:1 문의 `A-20261113-0008`. 날짜는 2026년 11월 초~중순(오늘 2026-11-17).
- 수량 할인(상품 상세): 10벌 이상 5% · 30벌 이상 10% · 50벌 이상 15%. 제작 기간: 인쇄 없는 상품 3~4일, 인쇄 상품 4~7일(주말 제외). 견적서 유효기간: 견적일로부터 15일.
- 입금 계좌 견본: 부산은행 101-2000-0000-00 · 예금주 주식회사 노을상사 (`data-sample`).

## 8. 끝내기 전에 스스로 확인
1. `python3 tools/build.py` → `python3 tools/check.py pages <네 페이지들>`(6가지 화면 전부) 실패 0.
2. `python3 tools/check.py els <네 페이지들>` 빠짐 0. `python3 tools/clash.py` 겹침 0(네 클래스 기준).
3. `python3 tools/reviewsheet.py <네 페이지들>` → `review/sheets/`의 그림을 **전부 직접 열어 본다.** 홈 캡처와 견줘 같은 사이트로 보이는지, 정렬선·간격·제목 구조가 맞는지, 한 화면에 파란 버튼이 하나인지, 카드 높이가 고른지, 폰이 촘촘하고 지나치게 길지 않은지, 7.2의 "싫다고 한 것"이 없는지, 글자가 넘치거나 겹치거나 잘린 곳이 없는지 본다. 어색한 곳은 고치고 다시 캡처한다. 글자가 안 읽히면 `review/shots/`의 원본을 연다.
4. `DESIGN.md` "Generation Checklist" 열 항목.
5. 요소 목록을 처음부터 다시 훑어 빠진 요소·상태가 없는지, 목록에 없는 기능을 넣지 않았는지 본다.

## 9. 보고 (마지막 답)
만든 파일, 페이지별 상태 수, 점검 결과(실패 0인지), 구조를 왜 그렇게 정했는지 한두 문장, 결정이 필요했던 곳(`spec/questions/<키>.md`에도 적는다), 못 한 것·확인하지 못한 것, 공용 부품에 필요한 것, 홈 시안에도 넣어야 하는 공통 요소가 있으면 그것. 사실만 쓴다. 점검을 돌리지 않았으면 돌리지 않았다고 쓴다.
