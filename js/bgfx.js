/* ============================================================
   비투비티 홈 시안 v11 · bgfx.js
   흰 바탕 섹션에 까는 은은한 파스텔 그라데이션(모양은 css/v10.css 16번 .bgx--grad, 3곳 보정은 css/v11-fx.css 1번).
     공용에셋 "그라데이션_flowlab_pastel"(담당자가 예쁘다고 한 파스텔 메시)의 구조를 그대로 쓰고
     색만 밝은 하늘색 · 밝은 파랑으로 바꿔 아주 천천히 흐르게 했다(모서리 색 덩어리 + 양옆 흰 점 격자).
   2026-11-18 7차 담당자: "배경에 그라데이션 있지. 그거 2~3개 섹션정도에만 넣어봐봐."
     → 늘 켬. 딱 3곳: 윈터 룩북(#lookbook) · 상품 랭킹(#rank) · 후드·맨투맨(#hood). 섹션 하나 건너 하나쯤 되게 골랐다.
     → 저장값(localStorage b2bt-v11-bg) · 주소(?bg=) · html[data-bg]는 더 이상 보지 않는다(무엇이 저장돼 있어도 이 3곳은 그라데이션).
     → 검수용 고르기(왼쪽 손잡이 #rvw "배경": 그라데이션 · 도트 · 격자 · 없음)는 배경이 정해져서 연결을 뺐다(손잡이는 css/v11-m.css에서 이미 모두에게 숨김).
       도트(dot) · 격자(grid, 공용에셋 그리드펄스_21dev) 그림 코드도 같이 뺐다. 다시 볼 일이 있으면 _qa/_bak_7cha_20261118/js/bgfx.js에 있다.
   (지난 기록: 2026-11-15 더 연하게 · 2026-11-17 동그라미(ring) 뺌 — 담당자 "너무 별로" · 2026-11-18 기본 '없음')
   위아래 가장자리는 css/v10.css 16번 mask가 흐려 주어 이웃 흰 섹션과 경계가 보이지 않는다(PC 140px · 폰 90px).
   화면 가까이(위아래 80px) 온 섹션의 것만 움직이고(.is-live), 움직임 줄이기 설정이면 멈춘 그림만 깐다(css/v10.css 16번 끝).
   ============================================================ */
(function () {
  'use strict';
  var SECS = ['#lookbook', '#rank', '#hood'];
  var secs = SECS.map(function (s) { return document.querySelector(s); }).filter(Boolean);
  if (!secs.length) return;
  // 색 덩어리 4개 + 양옆 흰 점 격자(css/v10.css 16번 (1))
  var HTML = '<i class="bgx__b bgx__b--1"></i><i class="bgx__b bgx__b--2"></i><i class="bgx__b bgx__b--3"></i><i class="bgx__b bgx__b--4"></i><i class="bgx__dots"></i>';
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
  }, { rootMargin: '80px 0px' }) : null;
  secs.forEach(function (sec, n) {
    if (sec.querySelector(':scope > .bgx')) return; // 두 번 깔지 않게
    sec.classList.add('has-bgx', 'has-bgx--grad');
    // bgx--n1 = 좌우를 뒤집은 그림(섹션마다 번갈아 같은 그림이 되풀이되지 않게: 룩북 · 후드는 그대로, 랭킹은 뒤집힘)
    var el = document.createElement('div');
    el.className = 'bgx bgx--grad bgx--n' + (n % 2);
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = HTML;
    sec.insertBefore(el, sec.firstChild);
    if (io) io.observe(el); else el.classList.add('is-live');
  });
})();
