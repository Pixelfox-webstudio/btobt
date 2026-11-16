/* ============================================================
   비투비티 홈 시안 v10 · bgfx.js (2026-11-15 보정)
   흰 바탕 섹션(랭킹 · 겨울 시즌 · 겨울 아우터 · 후드·맨투맨)에 까는 은은한 배경 4종 + 왼쪽 손잡이("배경")로 고르기.
     grad = 그라데이션  공용에셋 "그라데이션_flowlab_pastel"(담당자가 예쁘다고 한 파스텔 메시)의 구조를 그대로 쓰고
                        색만 밝은 하늘색 · 밝은 파랑으로 바꿔 아주 천천히 흐르게 했다(모서리 색 덩어리 + 양옆 흰 점 격자)
     dot  = 도트        같은 에셋의 점 격자를 바탕 전체에 깔고, 군데군데 파란 점이 천천히 밝아졌다 사라진다
     grid = 격자        공용에셋 "그리드펄스_21dev"(Grid Pulse)를 옮김: 옅은 격자선 + 칸이 하나씩 물들었다 사라짐
                        (2026-11-15 마우스가 지나간 자리에 그려지던 것은 뺌. 저절로 물드는 것만 남김)
     ring = 동그라미    2026-11-15 방향을 바꿈: 떠다니는 색 원 → 섹션 제목 뒤 한 점에서 퍼지는 얇은 동심원 물결(ripple)
     off  = 없음
   고른 값은 html[data-bg]에 있고 저장된다(localStorage b2bt-v10-bg, 주소 ?bg=grad|dot|grid|ring|off).
   화면에 보이는 섹션의 것만 움직이고, 움직임 줄이기 설정이면 멈춘 그림만 깐다. 모양은 css/v10.css 12번.
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement, KEY = 'b2bt-v10-bg', MODES = ['grad', 'dot', 'grid', 'ring', 'off'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var secs = ['#rank', '#season', '#outer', '#hood'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
  if (!secs.length) return;

  /* ---------- Grid Pulse (원본: 21st.dev, 공용에셋 그리드펄스_21dev/grid-pulse.js) ----------
     동작 · 상수는 이식본과 같다. 이 사이트용으로 바꾼 것: 색을 하늘색 → 파랑 한 계열로(hueTop 198, 아래로 갈수록 224),
     밝기 단계를 연하게, 글줄 피하기 · 테마 감지는 뺌(쓰지 않음), 캔버스는 1배율(장식이라 메모리를 아낀다), 켜진 칸만 지우고 다시 그림,
     마우스를 따라 칸이 켜지는 것(원본의 pointermove)은 뺌 */
  function gridPulse(el, o) {
    var cell = o.cell, ambient = o.ambient, maxLit = 90, TINTS = [84, 79, 74, 69, 64];
    var FADE_IN = 420, FADE_OUT = 1500;
    var paper = document.createElement('canvas'), ctx = paper.getContext('2d'); if (!ctx) return function () {};
    el.appendChild(paper);
    var cols = 1, rows = 1, cells = new Map(), frame = 0, visible = false, beat = 0;
    function measure() {
      var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      cols = Math.max(1, Math.ceil(w / cell)); rows = Math.max(1, Math.ceil(h / cell));
      paper.width = w; paper.height = h; cells.clear();
    }
    function ink(row) {
      var t = rows > 1 ? Math.min(1, row / (rows - 1)) : 0;
      return 'hsl(' + Math.round(198 + t * 26) + ' 92% ' + TINTS[Math.floor(Math.random() * TINTS.length)] + '%)';
    }
    function draw(now) {
      frame = 0;
      cells.forEach(function (c, key) {
        var a, x = c.col * cell + 1, y = c.row * cell + 1;
        ctx.clearRect(x, y, cell - 1, cell - 1);
        if (now < c.until) a = 1 - Math.pow(1 - Math.min(1, (now - c.born) / FADE_IN), 2);
        else { var t = (now - c.until) / FADE_OUT; if (t >= 1) { cells.delete(key); return; } a = 1 - t * t; }
        ctx.globalAlpha = a; ctx.fillStyle = c.colour; ctx.fillRect(x, y, cell - 1, cell - 1);
      });
      ctx.globalAlpha = 1;
      if (cells.size > 0) frame = requestAnimationFrame(draw);
    }
    function light(col, row, hold) {
      if (col < 0 || row < 0 || col >= cols || row >= rows || cells.size >= maxLit) return;
      var key = col + ',' + row, now = performance.now(), lit = cells.get(key);
      if (lit && now < lit.until) return;
      cells.set(key, { col: col, row: row, colour: lit ? lit.colour : ink(row), born: lit ? now - FADE_IN : now, until: now + hold });
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function drift() {
      beat = setTimeout(drift, 1100 + Math.random() * 1500);
      if (!visible || document.hidden) return;
      for (var i = 0; i < ambient; i++) light(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), 1400 + Math.random() * 2200);
    }
    var ro = new ResizeObserver(measure); ro.observe(el); measure();
    if (!reduce) beat = setTimeout(drift, 400);
    return { live: function (v) { visible = v; }, destroy: function () { ro.disconnect(); clearTimeout(beat); cancelAnimationFrame(frame); } };
  }

  /* ---------- 도트: 밝아지는 점 묶음(.bgx__hi)의 자리를 바탕 점 격자에 딱 맞춰 잡는다. 한 번 사라질 때마다 다른 자리로 옮긴다 ---------- */
  function dots(el) {
    var his = [].slice.call(el.querySelectorAll('.bgx__hi')), SPOT = [[.06, .1], [.9, .34], [.14, .66], [.84, .88], [.5, .5], [.3, .22], [.7, .7]], turn = 0;
    function place(h) {
      var g = parseFloat(getComputedStyle(el).getPropertyValue('--dg')) || 18, w = el.clientWidth - h.offsetWidth, hh = el.clientHeight - h.offsetHeight, s = SPOT[turn++ % SPOT.length];
      h.style.transform = 'translate3d(' + Math.round(w * s[0] / g) * g + 'px,' + Math.round(Math.max(0, hh) * s[1] / g) * g + 'px,0)';
    }
    function all() { turn = 0; his.forEach(place); }
    his.forEach(function (h) { h.addEventListener('animationiteration', function () { place(h); }); });
    var ro = new ResizeObserver(all); ro.observe(el); all();
    return { live: function () {}, destroy: function () { ro.disconnect(); } };
  }

  /* ---------- 섹션마다 배경 한 장(.bgx). 고른 종류에 맞는 조각을 넣는다 ---------- */
  var HTML = {
    grad: '<i class="bgx__b bgx__b--1"></i><i class="bgx__b bgx__b--2"></i><i class="bgx__b bgx__b--3"></i><i class="bgx__b bgx__b--4"></i><i class="bgx__dots"></i>',
    dot: '<i class="bgx__pat"></i><i class="bgx__hi bgx__hi--1"></i><i class="bgx__hi bgx__hi--2"></i><i class="bgx__hi bgx__hi--3"></i>',
    grid: '<i class="bgx__lines"></i>',
    ring: '<i class="bgx__rp bgx__rp--1"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i><i class="bgx__rp bgx__rp--2"><b></b><b></b><b></b><b></b><b></b></i>'
  };
  var layers = [];
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      e.target.classList.toggle('is-live', e.isIntersecting);
      var L = layers.filter(function (x) { return x.el === e.target; })[0]; if (L && L.fx) L.fx.live(e.isIntersecting);
    });
  }, { rootMargin: '80px 0px' }) : null;
  function clear() { layers.forEach(function (L) { if (io) io.unobserve(L.el); if (L.fx) L.fx.destroy(); L.el.remove(); }); layers = []; }
  function apply(mode) {
    clear();
    secs.forEach(function (sec, n) {
      sec.classList.toggle('has-bgx', mode !== 'off');
      if (mode === 'off') return;
      var el = document.createElement('div'); el.className = 'bgx bgx--' + mode + ' bgx--n' + (n % 2); el.setAttribute('aria-hidden', 'true'); el.innerHTML = HTML[mode];
      sec.insertBefore(el, sec.firstChild);
      var L = { el: el, fx: null };
      if (mode === 'grid') { var cell = window.innerWidth <= 768 ? 26 : 32; el.style.setProperty('--gc', cell + 'px'); L.fx = gridPulse(el, { cell: cell, ambient: window.innerWidth <= 768 ? 2 : 3 }); }
      if (mode === 'dot') L.fx = dots(el);
      layers.push(L);
      if (io) io.observe(el); else { el.classList.add('is-live'); if (L.fx) L.fx.live(true); }
    });
  }

  /* ---------- 고르기: 왼쪽 끝 손잡이("배경") → 단추 5개. 6초 동안 건드리지 않으면 다시 접힌다 ---------- */
  function cur() { var v = root.getAttribute('data-bg'); return MODES.indexOf(v) < 0 ? 'grad' : v; }
  var box = document.getElementById('rvw'), tog = document.getElementById('rvwT'), seg = document.getElementById('rvwSeg'), closeT = 0;
  var btns = box ? [].slice.call(box.querySelectorAll('[data-bg]')) : [];
  function paint() { var v = cur(); btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-bg') === v)); }); }
  function setOpen(v) { clearTimeout(closeT); seg.hidden = !v; tog.setAttribute('aria-expanded', String(v)); box.classList.toggle('is-open', v); if (v) closeT = setTimeout(function () { setOpen(false); }, 6000); }
  if (box && tog && seg) {
    tog.addEventListener('click', function () { setOpen(seg.hidden); });
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-bg');
        root.setAttribute('data-bg', v); try { localStorage.setItem(KEY, v); } catch (e) {}
        apply(v); paint(); setOpen(true);
      });
    });
  }
  apply(cur()); paint();
  window.B2BT_BG = { set: function (v) { if (MODES.indexOf(v) < 0) return; root.setAttribute('data-bg', v); apply(v); paint(); } };
})();
