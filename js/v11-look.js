/* 비투비티 홈 시안 v11 · v11-look.js (2026-11-17)
   윈터 룩북 섹션(#lookbook) 동작. js/v11.js 다음에 불러온다.
   1 카드 줄 조작: 마우스로 끌기(놓으면 밀던 만큼 더 가서 카드에 맞춰 섬) · 화살표 = 한 장씩 · 진행 막대 · 끝에서 화살표 흐리게 · 사진 미리 받기
   2 등장: 섹션이 올라오면 카드가 엇갈려 올라오며 아래에서부터 드러난다(v8 품목별 보기 등장과 같은 방식, 스크롤에 맞춰 scrub)
   손가락(터치)은 브라우저 기본 가로 스크롤 + CSS 멈춤 자리(scroll-snap)에 맡긴다. 줄의 data-lenis-prevent-touch로 Lenis가 가로 밀기를 가로채지 않는다.
   움직임을 쓸지는 js/v10.js와 같은 규칙(GSAP이 있고 움직임 줄이기가 아닐 때). 움직임 줄이기면 등장 없이 처음부터 보이고, 화살표 · 놓기는 미끄러지지 않고 바로 옮긴다. */
(function () {
  'use strict';
  var rail = document.getElementById('lkRail'); if (!rail) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var motion = hasG && !reduce;
  var prev = document.getElementById('lkPrev'), next = document.getElementById('lkNext'), prog = document.getElementById('lkProg');
  var items = [].slice.call(rail.querySelectorAll('.lk__it'));
  if (hasG) gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     1. 카드 줄 조작
     카드의 멈춤 자리 = 그 카드 왼쪽이 본문 왼쪽 선(줄의 왼쪽 안쪽 여백 = --gut)에 오는 스크롤 위치.
     화살표: 지금 자리보다 오른쪽(왼쪽)에 있는 첫 멈춤 자리로 .75s 미끄러진다. 맨 끝은 줄 끝까지.
     끌기(PC 마우스만): 6px 넘게 움직이면 끌기로 보고 그 뒤 누름(링크 이동)은 막는다. 놓으면 밀던 빠르기 × 380ms만큼 더 가서 가장 가까운 카드에 선다.
     넘기는 도중 손을 대거나(터치) 휠을 옆으로 밀면 미끄러지던 것을 멈추고 손에 넘긴다
     ============================================================ */
  var tw = null;
  function maxX() { return Math.max(0, rail.scrollWidth - rail.clientWidth); }
  function padL() { return parseFloat(getComputedStyle(rail).paddingLeft) || 0; }
  function stops() { // 카드마다의 멈춤 자리(작은 수부터). 줄이 position:relative라 offsetLeft는 줄 기준
    var p = padL(), m = maxX();
    return items.map(function (li) { return Math.min(m, Math.max(0, li.offsetLeft - p)); });
  }
  function nearest(x) {
    var s = stops(), best = s[0] || 0;
    s.forEach(function (v) { if (Math.abs(v - x) < Math.abs(best - x)) best = v; });
    if (Math.abs(maxX() - x) < Math.abs(best - x)) best = maxX(); // 끝에 거의 닿았으면 끝까지
    return best;
  }
  function stop() { if (tw) { tw.kill(); tw = null; } rail.classList.remove('is-tween'); }
  function goTo(x) {
    x = Math.max(0, Math.min(maxX(), x));
    stop();
    if (!motion || Math.abs(x - rail.scrollLeft) < 1) { rail.scrollLeft = x; return; }
    rail.classList.add('is-tween'); // 미끄러지는 동안 CSS 멈춤 자리 맞추기를 끈다(css 2번)
    tw = gsap.to(rail, { scrollLeft: x, duration: .75, ease: 'power3.out', overwrite: true, onComplete: function () { tw = null; rail.classList.remove('is-tween'); } });
  }
  function step(d) {
    var x = rail.scrollLeft, s = stops(), to;
    if (d > 0) { to = maxX(); for (var i = 0; i < s.length; i++) if (s[i] > x + 4) { to = s[i]; break; } }
    else { to = 0; for (var k = s.length - 1; k >= 0; k--) if (s[k] < x - 4) { to = s[k]; break; } }
    goTo(to);
  }
  // 진행 막대 + 화살표 흐리게(맨 앞 = 이전, 맨 끝 = 다음). 스크롤 · 크기 바뀜마다 한 프레임에 한 번만
  var raf = 0;
  function sync() {
    raf = 0;
    var x = rail.scrollLeft, m = maxX();
    if (prog) prog.style.transform = 'scaleX(' + Math.min(1, (x + rail.clientWidth) / Math.max(1, rail.scrollWidth)).toFixed(4) + ')';
    // 끝에 닿아 흐려질 화살표에 키보드 초점이 있으면, 흐리게(disabled) 하기 전에 반대쪽 화살표로 초점을 넘긴다
    // (disabled 단추는 초점을 잃어 <body>로 떨어지고, 다음 Tab이 페이지 맨 위부터 다시 시작되기 때문)
    var atS = x < 4, atE = x > m - 4, ae = document.activeElement;
    if (atE && ae === next && prev && !atS) prev.focus({ preventScroll: true });
    if (atS && ae === prev && next && !atE) next.focus({ preventScroll: true });
    if (prev) prev.disabled = atS;
    if (next) next.disabled = atE;
  }
  function later() { if (!raf) raf = requestAnimationFrame(sync); }
  rail.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  window.addEventListener('load', later);
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });
  rail.addEventListener('touchstart', stop, { passive: true });
  rail.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop(); }, { passive: true });

  // 마우스 끌기
  var down = false, sx = 0, sl = 0, moved = 0, lastX = 0, lastT = 0, vel = 0;
  rail.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    stop();
    down = true; moved = 0; vel = 0; sx = lastX = e.clientX; sl = rail.scrollLeft; lastT = performance.now();
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 6) { rail.classList.add('is-drag'); e.preventDefault(); }
    rail.scrollLeft = sl - dx;
    var t = performance.now();
    if (t > lastT) { vel = vel * .4 + ((e.clientX - lastX) / (t - lastT)) * .6; lastX = e.clientX; lastT = t; } // px/ms, 튀지 않게 조금 섞는다
  });
  function release() {
    if (!down) return;
    down = false;
    if (moved > 6) {
      if (performance.now() - lastT > 90) vel = 0; // 멈췄다가 놓으면 더 가지 않는다
      goTo(nearest(rail.scrollLeft - vel * 380));
    }
    setTimeout(function () { rail.classList.remove('is-drag'); }, 0);
    // 끌기 표시(moved)도 이 손 뗌 바로 다음에 지운다. 손 뗌에서 생기는 누름(click)은 이보다 먼저 와서 그대로 막히고,
    // 줄 밖에서 손을 떼 그 누름이 줄을 거치지 않았어도 다음 키보드 Enter · 터치 누름이 먹히지 않는다
    setTimeout(function () { moved = 0; }, 0);
  }
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  // 끈 다음에 오는 누름(click)은 링크 이동으로 보지 않는다. 다음 누름은 다시 받는다
  rail.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  rail.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // 줄이 화면 가까이(600px) 오면 줄 안 사진을 모두 미리 받는다(옆으로 넘길 때 사진이 늦게 뜨며 끊기지 않게)
  (function () {
    var imgs = [].slice.call(rail.querySelectorAll('img[loading="lazy"]'));
    function warm() { imgs.forEach(function (im) { im.loading = 'eager'; }); }
    if (!('IntersectionObserver' in window)) { warm(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { warm(); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(rail);
  })();
  sync();

  /* ============================================================
     2. 등장(움직임을 쓸 때만). 카드 안쪽 겹(.lk__rv)이 아래에서 올라오며(yPercent) 아래쪽부터 드러난다(clip-path inset 위 100% → 0).
     카드마다 시작 높이를 조금씩 다르게(짝수 · 홀수 + 차례) 해서 엇갈려 올라온다. 스크롤에 맞춰 움직인다(scrub .6, 줄 위가 화면 94% → 40%).
     v8 품목별 보기(js/v8.js 6번)와 같은 값의 방식. 폰은 덜 올라오게(카드가 화면 폭에 가까워 많이 움직이면 어지럽다).
     a가 아니라 안쪽 겹을 움직여서 초점 테두리가 잘리지 않는다
     ============================================================ */
  if (!motion) return;
  var layers = items.map(function (li) { return li.querySelector('.lk__rv'); }).filter(Boolean);
  var phoneQ = window.matchMedia('(max-width: 768px)');
  gsap.fromTo(layers,
    { yPercent: function (i) { return (phoneQ.matches ? 6 : 10) + (i % 2 ? 6 : 0) + i * 1.2; }, clipPath: 'inset(100% 0% 0% 0%)' },
    { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', stagger: .08,
      scrollTrigger: { trigger: rail, start: 'top 94%', end: 'top 40%', scrub: .6, invalidateOnRefresh: true } });
  // 사진(늦게 불러옴) · 글꼴 · 위쪽 상품 격자가 바뀌면 시작 위치가 달라지므로 한 번 더 잰다
  var rT = 0;
  function refresh() { clearTimeout(rT); rT = setTimeout(function () { ScrollTrigger.refresh(); }, 200); }
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();
