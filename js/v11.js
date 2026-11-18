/* 비투비티 홈 시안 v11 · v11.js (2026-11-17)
   v10 위에 더하는 홈 섹션 동작(히어로 제외). js/v10.js · js/v11-hero.js 다음에 불러온다.
   1 파트너 배너(폰): 글 자리에 사각형(상품 자리)이 걸리면 글을 그 아래로 내린다
   2 캠페인 배너(.cb): v6 케이투 배너 구성(사진 + 글 한 줄 + 단추) + v8 스크롤 장치(틀이 화면 끝까지 열림 + 사진 당김 + 글 등장 + 마우스 따라 움직임)
   3 옆으로 넘기는 줄(품목별 보기 · 업종별 추천)의 사진 미리 받기(폰에서 처음 넘길 때 빈 카드가 보이지 않게)
   GSAP · ScrollTrigger · Lenis는 index.html 아래에서 먼저 불러온다. 움직임을 쓸지는 js/v10.js와 같은 규칙(GSAP이 있고 움직임 줄이기가 아닐 때)으로 정한다. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var motion = hasG && !reduce;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var phoneQ = window.matchMedia('(max-width: 768px)');
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function onMq(q, f) { if (q.addEventListener) q.addEventListener('change', f); else if (q.addListener) q.addListener(f); }
  if (hasG) gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     1. 파트너 배너(폰 ≤768). 글(제목 + 상품 보기)을 위 왼쪽에 다시 보이게 했다(css/v11.css 4번).
     사각형(상품 자리) 위치는 js/v10.js 4번 layout()이 장면을 보일 때마다 단추의 left/top으로 적는다. 그 값이 바뀌면 여기서 글 상자와 겹치는지 보고,
     겹치면 글을 그 사각형 바로 아래로 내린다(--copy-t). 지금 장면 중에는 제조 장면의 안전모가 해당된다.
     내린 글이 아래 착용 상품 칸에 닿으면 내리지 않는다(칸을 덮는 것보다 사각형 하나와 겹치는 편이 낫다). PC에서는 아무것도 하지 않는다
     ============================================================ */
  (function () {
    var box = $('#pbSlides'); if (!box) return;
    var R = 22, GAP = 4, BASE = 24; // 사각형 단추 반지름(44px 단추의 절반) · 글과 띄울 거리 · 글의 기본 위 여백(css 4번 --copy-t 기본값)
    function textRight(copy) { // 글 상자 안에서 실제 글자 · 단추가 차지하는 오른쪽 끝(상자는 양옆 여백까지 넓다)
      var w = 0;
      $$(':scope > *', copy).forEach(function (c) {
        var r;
        if (c.tagName === 'A') r = c.getBoundingClientRect();
        else { var rg = document.createRange(); rg.selectNodeContents(c); r = rg.getBoundingClientRect(); }
        w = Math.max(w, r.right);
      });
      return w - copy.getBoundingClientRect().left;
    }
    function fit(el) {
      var copy = $('.pbs__copy', el); if (!copy) return;
      el.style.removeProperty('--copy-t');
      if (!phoneQ.matches) return;
      var L = copy.offsetLeft, W = textRight(copy), H = copy.offsetHeight, top = BASE;
      var pins = $$('.pbs__pin', el).map(function (p) { return [parseFloat(p.style.left), parseFloat(p.style.top)]; }).filter(function (p) { return !isNaN(p[0]) && !isNaN(p[1]); });
      for (var k = 0; k < 4; k++) {
        var hit = false;
        pins.forEach(function (p) { if (p[0] + R > L && p[0] - R < L + W && p[1] + R > top && p[1] - R < top + H) { top = p[1] + R + GAP; hit = true; } });
        if (!hit) break;
      }
      if (top === BASE) return;
      var tag = $('.pbt.is-act', el) || $('.pbt', el), tags = tag && tag.parentNode;
      var tagTop = tag && tag.offsetWidth ? tags.offsetTop + tag.offsetTop : el.clientHeight;
      if (top + H > tagTop - 12) return; // 착용 상품 칸에 닿으면 그대로 둔다
      el.style.setProperty('--copy-t', Math.round(top) + 'px');
    }
    var slides = $$('.pbs', box), T = 0, rzT = 0, dirty = [];
    function later(el) { if (dirty.indexOf(el) < 0) dirty.push(el); cancelAnimationFrame(T); T = requestAnimationFrame(function () { var d = dirty; dirty = []; d.forEach(fit); }); }
    function all() { slides.forEach(later); }
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function (rs) { rs.forEach(function (r) { var el = r.target.closest('.pbs'); if (el) later(el); }); });
      $$('.pbs__pin', box).forEach(function (p) { mo.observe(p, { attributes: true, attributeFilter: ['style'] }); });
    }
    all();
    onMq(phoneQ, all);
    window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(all, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all); // 글꼴이 바뀌면 제목 폭이 달라진다
    window.addEventListener('load', all);
  })();

  /* ============================================================
     2. 캠페인 배너(#campaign, 후드·맨투맨 다음). 2026-11-18 v6 케이투 배너 구성(사진 + 글 한 줄 + 단추 두 개. 점 · 착용 상품 카드는 담당자 요청으로 뺌).
     스크롤 장치는 v8 js/v8.js 4번과 같은 값: 틀이 inset(10% 7% 10% 7%) → 0(화면 끝까지)으로 열리고, 사진은 1.16배에서 제자리로(scrub .5, 'top 90%' → 'top 16%').
     70%를 넘게 열리면 .is-open → 글이 차례로 나온다(css/v11.css 5번). 마우스(PC)를 따라 사진은 x ±28 · y ±18, 글은 x ±12 움직인다.
     움직임 줄이기 · GSAP이 없으면 처음부터 열린 모습
     ============================================================ */
  (function () {
    var sec = $('#campaign'), frame = $('#cbFrame'), img = $('#cbImg'); if (!sec || !frame) return;
    var media = $('.cb__media', frame), copy = $('.cb__copy', frame);
    if (!motion) { sec.classList.add('is-open'); return; }
    function stg(extra) { var o = { trigger: sec, start: 'top 90%', end: 'top 16%', scrub: .5, invalidateOnRefresh: true }; for (var k in extra) o[k] = extra[k]; return o; }
    function openAt(st) { sec.classList.toggle('is-open', st.progress > .7); }
    gsap.fromTo(frame, { clipPath: 'inset(10% 7% 10% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: stg({ onUpdate: openAt, onRefresh: openAt }) });
    gsap.fromTo(media, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: stg() });
    if (fine && img && copy) {
      // 2026-11-18: 사진은 왼쪽 아래 가장자리까지 보여야 해서 움직이지 않는다(글만 x ±12)
      var cx = gsap.quickTo(copy, 'x', { duration: 1.1, ease: 'power3.out' });
      var rest = function () { cx(0); };
      frame.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || phoneQ.matches) return; // 폰 폭에서는 사진에 여유 크기가 없어 움직이지 않는다
        var r = frame.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        cx(dx * 12);
      });
      frame.addEventListener('pointerleave', rest);
      onMq(phoneQ, rest);
    }
    // 위치 다시 재기: 사진(늦게 불러옴)이 들어오거나 글꼴이 바뀌면 한 번 더(틀 높이는 사진과 상관없지만 위쪽 섹션 높이가 바뀔 수 있다)
    var rT = 0;
    function refresh() { clearTimeout(rT); rT = setTimeout(function () { ScrollTrigger.refresh(); }, 150); }
    if (img && !img.complete) img.addEventListener('load', refresh, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  })();

  /* ============================================================
     3. 옆으로 넘기는 줄의 사진 미리 받기: 품목별 보기(#cgRow)와 업종별 추천(#industry .ind__list).
     폰에서는 두 줄이 옆으로 넘기는 카드라 화면 오른쪽 밖 카드의 사진(loading=lazy)이 넘겨서 들어올 때에야 받아져 처음 넘길 때 빈 카드가 보였다.
     줄이 화면 600px 안으로 가까워지면 줄 안 사진을 모두 바로 받게(eager) 바꾼다. js/v11-look.js 1번(룩북 줄) · js/v10.js railWarm()과 같은 방법
     ============================================================ */
  (function () {
    ['#cgRow', '#industry .ind__list'].forEach(function (s) {
      var row = $(s); if (!row) return;
      var imgs = $$('img[loading="lazy"]', row);
      function warm() { imgs.forEach(function (im) { im.loading = 'eager'; }); }
      if (!('IntersectionObserver' in window)) { warm(); return; }
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { warm(); io.disconnect(); } }, { rootMargin: '600px 0px' });
      io.observe(row);
    });
  })();
})();
