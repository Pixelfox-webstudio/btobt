/* 비투비티 홈 시안 v11 · v11-hero.js (2026-11-17, 2026-11-18 7차)
   히어로 전용: 첫 접속 인트로(화면이 열림) · WORKWEAR 위 바뀌는 단어 · WORKWEAR 글자 뒤집기. js/v10.js 다음에 불러온다.
   영상 고르기 · 재생 · 전체 영상 팝업은 js/v10.js 1번 블록 그대로(파일 이름만 hero-film으로 바꿈).
   순서: <body> 뒤 짧은 스크립트가 막(#hxIntro)을 띄워 둠 → 이 파일이 막을 위아래로 갈라 열고(영상은 1.12배 → 1배) → 단어 등장 → WORKWEAR → 단어 반복 · WORKWEAR 뒤집기.
   2026-11-18 7차 담당자: 가운데 문구(B2BT PRODUCTS · ○○을 · 한 곳에서 주문합니다.)를 빼고 WORKWEAR 위 단어 하나만(작업복 → 안전용품 → 단체복). 라벨 · 둘째 줄 코드는 지움.
   움직임 줄이기면 인트로 · 단어 굴림 · 뒤집기를 모두 끄고 첫 단어(작업복)만 보인다. */
(function () {
  'use strict';

  /* ---------- 0. 설정 ----------
     ONCE_PER_SESSION: true로 바꾸면 한 세션(탭)에서 처음 한 번만 인트로를 보여 준다(sessionStorage 'b2bt-v11-intro' = 'seen'이면
     <body> 뒤 스크립트가 막을 그리기 전에 지운다). 사장님 검토 중이라 지금은 false = 들어올 때마다 보여 준다.
     검수할 때 인트로 없이 보려면 주소 끝에 ?intro=off */
  var ONCE_PER_SESSION = false;
  var KEY = 'b2bt-v11-intro';
  var STEP = 2.2;          // WORKWEAR 위 파란 단어가 바뀌는 간격(초)
  var SPLIT_AT = 1.18;     // 접속 후 막이 갈라지기 시작하는 때(초). 로고가 다 나타난(0.92초) 뒤 잠깐 멈춤
  var OPEN = 1.05;         // 막이 열리는 시간(초)

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!window.gsap;
  var motion = hasG && !reduce;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  var hero = $('#hero'), intro = $('#hxIntro');
  if (intro) window.B2BT_INTRO_RUN = true;   // 막은 이 파일이 걷는다(<body> 뒤 스크립트의 4.2초 안전장치가 손대지 않게)
  window.B2BT_HX = true;                     // 문구 등장도 이 파일이 맡는다
  try { if (!ONCE_PER_SESSION) sessionStorage.removeItem(KEY); } catch (e) {}
  if (!hero) { root.classList.remove('hx-wait'); if (intro && intro.parentNode) intro.parentNode.removeChild(intro); root.classList.remove('is-intro'); return; }

  var slide = $('.bn__slide--film', hero), over = $('#stkOver');
  var words = $$('.hx__word', hero), ww = $('#hxWW');

  /* ---------- 1. WORKWEAR 글자 뒤집기 (v9.js 히어로 제목 그대로) ----------
     글자마다 상자(앞면 .f3a + 아랫면 .f3b)를 만들고, 상자를 X축으로 90도 굴려 아랫면이 앞으로 오게 한다.
     첫 등장 때 한 번, 마우스를 올리면 왼쪽부터, 누르면 가운데부터 굴린다 */
  var flip = function () {};
  if (ww) {
    var seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
    var chars = function (w) { return seg ? Array.from(seg.segment(w), function (x) { return x.segment; }) : Array.from(w); };
    $$('.f3l', ww).forEach(function (l) {
      l.innerHTML = l.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="f3w">' + chars(w).map(function (c) { return '<span class="f3c"><span class="f3a">' + esc(c) + '</span><span class="f3b">' + esc(c) + '</span></span>'; }).join('') + '</span>';
      }).join(' ');
    });
    var cs = $$('.f3c', ww), busy = false;
    flip = function (from) {
      if (busy || reduce || !cs.length || !cs[0].animate) return;
      busy = true; ww.classList.add('is-f3');
      var n = cs.length, STAG = 50, DUR = 680, z = -(cs[0].offsetHeight / 2), lastA = null, lastD = -1;
      cs.forEach(function (c, i) {
        var d = (from === 'center' ? Math.abs(Math.floor(n / 2) - i) : i) * STAG;
        var an = c.animate([{ transform: 'translateZ(' + z + 'px) rotateX(0deg)' }, { transform: 'translateZ(' + z + 'px) rotateX(90deg)' }], { duration: DUR, delay: d, easing: 'cubic-bezier(.3,1.2,.4,1)', fill: 'backwards' });
        if (d > lastD) { lastD = d; lastA = an; }
      });
      var done = function () { ww.classList.remove('is-f3'); busy = false; };
      if (lastA && lastA.finished) lastA.finished.then(done, done); else setTimeout(done, lastD + DUR + 40);
    };
    ww.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') flip('first'); });
    ww.addEventListener('click', function () { flip('center'); });
  }

  /* ---------- 2. 파란 단어 반복: 작업복 → 안전용품 → 단체복 → 작업복 (마크업 순서 그대로, 모션 영상 4장면과 같은 움직임) ----------
     2026-11-18 7차: 가운데 문구에서 WORKWEAR 바로 위 작은 단어로 옮김("을"을 뺀 세 단어만). 움직임은 그대로.
     나가는 단어는 위로(yPercent -110), 들어오는 단어는 아래에서(110 → 0), .42초 power3.inOut. STEP초마다.
     히어로가 화면 밖이거나 다음 면에 덮였거나 탭이 가려졌으면 바꾸지 않고 기다린다(0.6초마다 다시 확인) */
  var idx = 0, loopOn = false;
  function heroShown() {
    if (document.hidden) return false;
    var r = hero.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= window.innerHeight) return false;
    if (over) { var o = over.getBoundingClientRect(); if (o.top < r.top + r.height * .35) return false; }
    return true;
  }
  function tick() {
    if (!loopOn) return;
    if (!heroShown()) { gsap.delayedCall(.6, tick); return; }
    var a = words[idx], b = words[(idx + 1) % words.length];
    idx = (idx + 1) % words.length;
    gsap.to(a, { yPercent: -110, duration: .42, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.fromTo(b, { yPercent: 110 }, { yPercent: 0, duration: .42, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.delayedCall(STEP, tick);
  }
  function startLoop() {
    if (!motion || loopOn || words.length < 2) return;
    loopOn = true; gsap.delayedCall(STEP - .4, tick);
  }

  /* ---------- 3. 등장: 첫 단어(작업복)가 칸 아래에서 올라옴 → WORKWEAR가 살짝 올라오며 나타나고 글자를 한 번 굴림 ----------
     2026-11-18 7차: 라벨 · 둘째 줄이 빠져 단어 → WORKWEAR 두 단계만 남김(시간 간격은 예전 단어 · WORKWEAR와 같은 느낌으로 .06초 / .2초) */
  var entered = false, waited = root.classList.contains('hx-wait');
  function entrance() {
    if (entered) return; entered = true;
    if (!motion) { root.classList.remove('hx-wait'); return; }
    // 이 파일이 아주 늦게 불려 <body> 뒤 스크립트가 이미 문구를 보여 줬으면(4.2초 안전장치) 다시 숨겼다 띄우지 않고 반복만 시작
    if (!waited) { gsap.set(words, { y: 0, yPercent: function (i) { return i ? 110 : 0; } }); if (ww) flip('first'); startLoop(); return; }
    gsap.set(words, { y: 0, yPercent: 110 });
    if (ww) gsap.set(ww, { opacity: 0, y: 18 });
    root.classList.remove('hx-wait');
    var tl = gsap.timeline({ onComplete: function () { if (ww) gsap.set(ww, { clearProps: 'transform,opacity' }); } });
    tl.to(words[0], { yPercent: 0, duration: .6, ease: 'power4.out' }, .06);
    if (ww) tl.to(ww, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, .2).call(function () { flip('first'); }, null, .26);
    startLoop();
  }

  /* ---------- 4. 인트로: 막 두 장이 위아래로 갈라지며 열리고, 아래 영상은 1.12배에서 제자리로 ----------
     접속 순간부터 시간을 재(<body> 뒤 스크립트의 B2BT_INTRO_T0) 이 파일이 늦게 불려도 전체 길이는 2.2~2.4초 안팎.
     누르거나(탭) 아무 키 · 휠을 쓰면 바로 열고 빨리 감는다. 도는 동안 스크롤은 잠그고(js/v10.js B2BT_SCROLL_HOLD), 끝나면 막을 DOM에서 지운다 */
  var done = false, held = false, tl = null, safe = 0, skipped = false;
  var SKIP_EV = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  function finishIntro() {
    if (done) return; done = true;
    clearTimeout(safe);
    SKIP_EV.forEach(function (t) { window.removeEventListener(t, skip, true); });
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.remove('is-intro');
    if (held) { held = false; if (window.B2BT_SCROLL_HOLD) window.B2BT_SCROLL_HOLD(false); }
    if (ONCE_PER_SESSION) { try { sessionStorage.setItem(KEY, 'seen'); } catch (e) {} }
  }
  function skip(e) {
    if (skipped || done || !tl) return;
    skipped = true;
    // 막을 누른 손가락이 떼어질 때 열린 화면 아래 링크가 눌리지 않게 바로 다음 click 한 번은 버린다
    if (e && (e.type === 'pointerdown' || e.type === 'touchstart')) {
      var eat = function (ev) { ev.preventDefault(); ev.stopPropagation(); window.removeEventListener('click', eat, true); };
      window.addEventListener('click', eat, true);
      setTimeout(function () { window.removeEventListener('click', eat, true); }, 700);
    }
    var at = tl.labels.open || 0;
    if (tl.time() < at) tl.seek(Math.max(0, at - .001));
    tl.timeScale(2.2);
  }

  function playIntro() {
    if (!intro) { entrance(); return; }
    var t0 = window.B2BT_INTRO_T0 || 0, el = t0 ? (performance.now() - t0) / 1000 : 0;
    // GSAP이 없거나(네트워크) 너무 늦게 불려 CSS 안전장치(3.5초)가 이미 막을 걷는 중이면 그냥 지운다
    if (!motion || el > 3.3) { finishIntro(); entrance(); return; }
    intro.classList.add('is-run');
    if (window.B2BT_SCROLL_HOLD) { window.B2BT_SCROLL_HOLD(true); held = true; }
    var halves = $$('.hxi__half', intro), marks = $$('.hxi__mark', intro);
    if (slide) gsap.set(slide, { scale: 1.12, transformOrigin: '50% 50%' });
    tl = gsap.timeline({ onComplete: function () { if (slide) gsap.set(slide, { clearProps: 'transform,transformOrigin' }); } });
    tl.addLabel('open', Math.max(.12, SPLIT_AT - el))
      .call(function () { intro.classList.add('is-open'); }, null, 'open')
      .to(halves[0], { yPercent: -100, duration: OPEN, ease: 'expo.inOut' }, 'open')
      .to(halves[1], { yPercent: 100, duration: OPEN, ease: 'expo.inOut' }, 'open')
      .to(marks, { scale: 1.08, opacity: .4, duration: OPEN, ease: 'power2.in' }, 'open');
    if (slide) tl.fromTo(slide, { scale: 1.12 }, { scale: 1, duration: 1.7, ease: 'power3.out', immediateRender: false }, 'open+=0.16');
    tl.call(entrance, null, 'open+=0.6')
      .call(finishIntro, null, 'open+=' + (OPEN + .02));
    SKIP_EV.forEach(function (t) { window.addEventListener(t, skip, { capture: true, passive: true }); });
    // 안전장치: 타임라인이 어떤 이유로 멈춰도 4.5초 뒤에는 막을 걷고 문구를 보여 준다
    // (탭이 가려진 채 열려 rAF가 멈췄을 때도 여기로 온다. 타임라인을 끊어 나중에 탭을 열었을 때 영상이 다시 커졌다 줄지 않게)
    safe = setTimeout(function () { if (tl) tl.kill(); finishIntro(); if (slide) gsap.set(slide, { clearProps: 'transform,transformOrigin' }); entrance(); }, 4500);
  }

  playIntro();
})();
