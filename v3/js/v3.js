/* 비투비티 홈 시안 v3 · v3.js (2026-11-10)
   GSAP + ScrollTrigger + Flip + Lenis (스크립트 태그, 빌드 없음). 헤더·Hero 영상·카드 레일은 v1 site.js가 맡는다. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var motion = hasG && !reduce;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!motion) root.classList.remove('v3-motion');
  window.B2BT_READY = true;
  if (hasG) { gsap.registerPlugin(ScrollTrigger); if (window.Flip) gsap.registerPlugin(Flip); }

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  /* ---------- 부드러운 스크롤 ---------- */
  var lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  // 서랍·창이 열리면 본문 스크롤을 멈춘다 (v1 서랍은 html.is-locked)
  var locks = 0;
  function syncLock() {
    var on = locks > 0 || root.classList.contains('is-locked');
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
    else if (locks > 0) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '';
  }
  new MutationObserver(syncLock).observe(root, { attributes: true, attributeFilter: ['class'] });
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + window.pageYOffset, behavior: reduce ? 'auto' : 'smooth' }); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-href')) return;
    var id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault(); scrollToY(t);
  });
  var toTop = $('#toTop');
  if (toTop && lenis) toTop.addEventListener('click', function (e) { e.stopImmediatePropagation(); lenis.scrollTo(0, { duration: 1.4 }); }, true);

  /* ---------- 공통: 자석 버튼, 숫자 올리기, 알약 탭 ---------- */
  if (motion && fine) {
    $$('[data-magnet]').forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-magnet')) || 0.3;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * k, y: (e.clientY - r.top - r.height / 2) * k, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.45)' }); });
    });
  }
  function fmt(n) { return Math.round(n).toLocaleString('ko-KR'); }
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), plain = el.hasAttribute('data-plain');
    if (!motion) return;
    var o = { v: plain ? to - 9 : 0 };
    el.textContent = plain ? String(o.v) : '0';
    gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () { el.textContent = plain ? String(Math.round(o.v)) : fmt(o.v); } });
  }
  $$('[data-count]').forEach(countUp);

  function pillTabs(el, onSelect) {
    var pill = $('.tabs__pill', el), tabs = $$('.tab', el);
    function move(t) { pill.style.width = t.offsetWidth + 'px'; pill.style.transform = 'translateX(' + t.offsetLeft + 'px)'; }
    function cur() { return $('[aria-selected="true"]', el); }
    function select(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
      move(t); if (focus) t.focus();
      onSelect(t.dataset.tab);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (t !== cur()) select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
      });
    });
    pill.style.transition = 'none'; move(tabs[0]); requestAnimationFrame(function () { pill.style.transition = ''; });
    window.addEventListener('resize', function () { move(cur()); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { move(cur()); });
  }
  function flipFilter(items, test) {
    var st = (window.Flip && motion) ? Flip.getState(items) : null;
    items.forEach(function (c) { c.style.display = test(c) ? '' : 'none'; });
    if (st) Flip.from(st, { duration: .7, ease: 'power3.inOut', absolute: true, stagger: .02,
      onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .5, delay: .15 }); },
      onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .9, duration: .3 }); },
      onComplete: function () { ScrollTrigger.refresh(); } });
  }

  /* ---------- 등장 ---------- */
  if (motion) {
    ScrollTrigger.batch('[data-rv]', { start: 'top 90%', once: true, onEnter: function (els) {
      gsap.fromTo(els, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: .95, stagger: .09, ease: 'power4.out', clearProps: 'transform' });
    } });
  }

  /* ---------- 1. Hero ---------- */
  (function () {
    var hero = $('#hero'); if (!hero || !motion) return;
    gsap.from($$('.hero__line>span', hero), { yPercent: 112, duration: 1.15, stagger: .12, ease: 'power4.out', delay: .15 });
    gsap.from([$('.hero__lead', hero), $('.hero__actions', hero), $('.hero__cats', hero)].filter(Boolean), { y: 28, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', delay: .55, clearProps: 'transform,opacity' });
    var st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to($('.hero__media', hero), { scale: 1.14, yPercent: 7, ease: 'none', scrollTrigger: st });
    gsap.to($('.hero__copy', hero), { y: -70, opacity: .15, ease: 'none', scrollTrigger: st });
  })();

  /* ---------- 2. 이용 방법: 단계가 차례로 한 번 켜진다 ---------- */
  (function () {
    var steps = $$('.tick__steps li'); if (!steps.length || !motion) return;
    ScrollTrigger.create({ trigger: steps[0], start: 'top 92%', once: true, onEnter: function () {
      steps.forEach(function (li, i) {
        gsap.delayedCall(.5 + i * .42, function () { li.classList.add('is-on'); });
        gsap.delayedCall(.5 + i * .42 + .5, function () { li.classList.remove('is-on'); });
      });
    } });
    steps.forEach(function (li) {
      li.addEventListener('pointerenter', function () { li.classList.add('is-on'); });
      li.addEventListener('pointerleave', function () { li.classList.remove('is-on'); });
    });
  })();

  /* ============================================================
     상품 데이터 · 카드
     ============================================================ */
  var IC = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>'
  };
  // MD 추천: 2026-11-10 noeul.shop 실제 상품. shots = 상품 상세의 색상별 사진(파일 번호, 색 이름, 점 색)
  var MD = [
    { id: 463, kind: '시즌', cat: '패딩', name: '세이프티 방한 패딩', size: '85 ~ 115', price: '59,000원~', code: 'NE 8_16', shots: [[3, '블랙', '#17181B'], [4, '네이비', '#1C2540']] },
    { id: 465, kind: '시즌', cat: '패딩', name: '모자 일체형 하프패딩', size: 'S (85) ~ 4XL (115)', price: '60,000원~', code: 'NE 8_18', shots: [[3, '라이트 그레이', '#C9D6E2'], [4, '블랙', '#17181B']] },
    { id: 206, kind: '시즌', cat: '겨울조끼', name: '뽀글이 양털 겨울조끼', size: 'M (90) ~ 5XL (120)', price: '28,000원~', code: 'NE 6_63', shots: [[3, '그레이', '#77797C'], [4, '블루', '#6F8FBF']] },
    { id: 194, kind: '시즌', cat: '겨울조끼', name: '리버시블 양면 겨울조끼', size: 'M (90) ~ 5XL (120)', price: '44,000원~', code: 'NE 6_51', shots: [[3, '그레이', '#C9C9CB'], [4, '오렌지', '#F26A1B']] },
    { id: 475, kind: '시즌', cat: '플리스', name: '데일리 투톤 플리스자켓', size: 'S (85) ~ 4XL (115)', price: '25,000원~', code: 'NE 7_71', shots: [[2, '아이보리 앞면', '#D8CFBD'], [3, '아이보리 뒷면', '#C9BFA9']] },
    { id: 288, kind: '베스트', cat: '카라티', name: '멀티연사 기능성 카라 티셔츠', size: 'S (85) ~ 3XL (110)', color: '색상 3종', price: '17,000원~', code: 'NE 2_2', shots: [[3, '블랙', '#222326'], [4, '화이트', '#F4F4F4']] },
    { id: 431, kind: '베스트', cat: '후드집업', name: '기모 T/C 후드집업', size: 'S ~ 4XL', color: '색상 3종', price: '23,000원~', code: 'NE 4_14', shots: [[3, '화이트', '#F4F4F4'], [4, '그레이', '#A9ABAE']] },
    { id: 227, kind: '베스트', cat: '맨투맨', name: '특양면 베이직 맨투맨', size: '15호 ~ 5XL', color: '색상 6종', price: '15,000원~', code: 'NE 3_9', shots: [[3, '블랙', '#17181B'], [4, '네이비', '#1B2233']] }
  ];
  var P = {}; // 화면에 쓰는 모든 상품 (키: 'm463' / 'c200')
  MD.forEach(function (d) {
    P['m' + d.id] = { key: 'm' + d.id, id: d.id, tag: d.kind + ' · ' + d.cat, kind: d.kind, name: d.name, code: d.code, size: d.size, colorText: d.color || '', price: d.price,
      imgs: ['img/products/md-pick-' + d.id + '.webp'].concat(d.shots.map(function (s) { return 'img/products/' + d.id + '-' + s[0] + '.webp'; })),
      dots: d.shots.map(function (s, i) { return { hex: s[2], label: s[1], i: i + 1 }; }), more: '', slot: 'md-pick-' + d.id };
  });
  var CATS = window.B2BT_CATALOG || [];
  CATS.forEach(function (c) {
    c.items.forEach(function (d) {
      P['c' + d.id] = { key: 'c' + d.id, id: d.id, tag: c.cat, name: d.name, code: d.code, size: d.size, colorText: '', price: d.price,
        imgs: ['img/catalog/' + d.f, 'img/catalog/' + d.b], dots: d.sw.map(function (h) { return { hex: h }; }), more: d.more, slot: 'catalog-' + d.id };
    });
  });

  function cardHTML(p) {
    var imgs = p.imgs.map(function (src, i) {
      // 둘째 사진부터는 카드에 처음 손이 갈 때 받는다 (첫 화면 요청 수 줄이기)
      return '<img' + (i ? ' data-src="' + src + '"' : ' class="is-on" src="' + src + '" loading="lazy" data-slot="' + p.slot + '"') + ' alt="' + (i ? '' : esc(p.name)) + '" width="800" height="800" decoding="async" draggable="false">';
    }).join('');
    var bars = p.imgs.map(function (_, i) { return '<i' + (i ? '' : ' class="is-on"') + '></i>'; }).join('');
    var dots = p.dots.map(function (d) {
      return d.i ? '<button type="button" class="dot" style="--c:' + d.hex + '" data-i="' + d.i + '" aria-label="' + esc(d.label) + ' 사진 보기"></button>' : '<span class="dot" style="--c:' + d.hex + '"></span>';
    }).join('') + (p.more ? '<span class="pc__swmore num">' + esc(p.more) + '</span>' : '');
    return '<article class="pc" data-key="' + p.key + '"' + (p.kind ? ' data-kind="' + p.kind + '"' : '') + ' data-flip-id="' + p.key + '">' +
      '<div class="pc__media">' + imgs + '<div class="pc__bars" aria-hidden="true">' + bars + '</div>' +
      (dots ? '<div class="pc__sw">' + dots + '</div>' : '') +
      '<div class="pc__acts"><button type="button" class="act act--view" aria-label="빠른 보기">' + IC.view + '</button><button type="button" class="act act--like" aria-pressed="false" aria-label="관심상품">' + IC.heart + '</button><button type="button" class="act act--cart" aria-label="장바구니 담기">' + IC.bag + '</button></div></div>' +
      '<p class="pc__cat">' + esc(p.tag) + '</p>' +
      '<a class="pc__name" href="#" data-href="product.php?id=' + p.id + '"><span>' + esc(p.name) + '</span></a>' +
      '<p class="pc__meta">' + esc(p.size) + (p.colorText ? '<br>' + esc(p.colorText) : '') + '</p>' +
      '<p class="pc__price num">' + esc(p.price) + '</p>' + (p.code ? '<p class="pc__code num">' + esc(p.code) + '</p>' : '') + '</article>';
  }
  var liked = {};
  function bindCard(card) {
    var p = P[card.dataset.key], media = $('.pc__media', card);
    var imgs = $$('img', media), bars = $$('.pc__bars i', media), dots = $$('button.dot', media), cur = 0;
    var loaded = false;
    function load() { if (loaded) return; loaded = true; imgs.forEach(function (im) { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }); }
    card.addEventListener('pointerenter', load); card.addEventListener('focusin', load); card.addEventListener('touchstart', load, { passive: true });
    function show(i) {
      load();
      if (i === cur) return; cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      bars.forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
      dots.forEach(function (d) { d.classList.toggle('is-on', +d.dataset.i === i); });
    }
    // 카드 전체를 덮는 링크가 위에 있어 카드에서 받고, 사진 영역 안일 때만 계산한다
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || e.target.closest('.pc__sw,.pc__acts')) return;
      var r = media.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      show(Math.max(0, Math.min(imgs.length - 1, Math.floor((e.clientX - r.left) / r.width * imgs.length))));
    });
    card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') show(0); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(+d.dataset.i === cur ? 0 : +d.dataset.i); });
      d.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(+d.dataset.i); });
    });
    var like = $('.act--like', card);
    if (liked[p.key]) like.setAttribute('aria-pressed', 'true');
    like.addEventListener('click', function () {
      var on = like.getAttribute('aria-pressed') !== 'true';
      like.setAttribute('aria-pressed', String(on)); liked[p.key] = on;
      $$('.pc[data-key="' + p.key + '"] .act--like').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
      if (motion) gsap.fromTo($('svg', like), { scale: .4 }, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.4)' });
    });
    $('.act--cart', card).addEventListener('click', function () { fly(imgs[cur], function () { Bag.add(p.key, 1, imgs[cur].getAttribute('src')); }); });
    $('.act--view', card).addEventListener('click', function () { QV.open(p.key, card); });
  }
  function renderGrid(grid, list) {
    grid.innerHTML = list.map(cardHTML).join('');
    var cards = $$('.pc', grid); cards.forEach(bindCard); return cards;
  }

  /* ---------- 3. MD 추천 ---------- */
  (function () {
    var grid = $('#mdGrid'); if (!grid) return;
    var cards = renderGrid(grid, MD.map(function (d) { return P['m' + d.id]; }));
    pillTabs($('#mdTabs'), function (key) { flipFilter(cards, function (c) { return key === 'all' || c.dataset.kind === key; }); });
    if (motion) gsap.from(cards, { y: 60, opacity: 0, duration: .9, stagger: .07, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: grid, start: 'top 85%', once: true } });
  })();

  /* ---------- 4. 카테고리별 추천 상품 ---------- */
  (function () {
    var list = $('#shopList'), grid = $('#shopGrid'); if (!list || !grid || !CATS.length) return;
    var mark = $('.shop__mark', list), nowName = $('#shopNow'), nowCount = $('#shopCount'), all = $('#shopAll'), allTxt = $('#shopAllTxt');
    list.insertAdjacentHTML('beforeend', CATS.map(function (c, i) {
      return '<button type="button" class="scat" role="tab" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? -1 : 0) + '" aria-controls="shopGrid" data-i="' + i + '">' + esc(c.cat) + '<span class="num">' + c.count + '</span></button>';
    }).join(''));
    var btns = $$('.scat', list), cur = -1, busy = null;
    function fill(i) {
      var c = CATS[i];
      nowName.textContent = c.cat; nowCount.textContent = c.count;
      var href = 'category.php?cat=' + encodeURIComponent(c.cat);
      all.setAttribute('data-href', href); allTxt.textContent = c.cat + ' ' + c.count + '개 전체 보기';
      return renderGrid(grid, c.items.map(function (d) { return P['c' + d.id]; }));
    }
    function select(i, focus) {
      if (i === cur) return;
      var first = cur < 0; cur = i;
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      mark.style.transform = 'translateY(' + btns[i].offsetTop + 'px)';
      if (focus) btns[i].focus();
      if (btns[i].scrollIntoView && window.innerWidth <= 768 && !first) list.scrollTo({ left: btns[i].offsetLeft - 20, behavior: 'smooth' });
      if (first || !motion) { fill(i); return; }
      if (busy) busy.kill();
      busy = gsap.timeline()
        .to($$('.pc', grid), { opacity: 0, y: -14, duration: .22, stagger: .025, ease: 'power2.in' })
        .to(nowName, { yPercent: -110, duration: .22, ease: 'power2.in' }, 0)
        .add(function () {
          var cards = fill(i);
          gsap.fromTo(nowName, { yPercent: 110 }, { yPercent: 0, duration: .5, ease: 'power4.out' });
          gsap.fromTo(cards, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: .75, stagger: .06, ease: 'power4.out', clearProps: 'transform,opacity' });
        });
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (!d) return; e.preventDefault(); select((i + d + btns.length) % btns.length, true);
      });
    });
    select(0);
    if (motion) gsap.from($$('.pc', grid), { y: 60, opacity: 0, duration: .9, stagger: .07, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: grid, start: 'top 85%', once: true } });
  })();

  /* ---------- 5. 사업 4장 ---------- */
  (function () {
    var wrap = $('#panels'); if (!wrap) return;
    var panels = $$('.panel', wrap), no = $('#bizNo'), follow = $('#follow');
    var wide = fine && window.innerWidth > 900;
    function activate(p) {
      if (p.classList.contains('is-on')) return;
      panels.forEach(function (x) { x.classList.toggle('is-on', x === p); });
      var i = panels.indexOf(p) + 1;
      if (motion) gsap.fromTo(no, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out', onStart: function () { no.textContent = '0' + i; } });
      else no.textContent = '0' + i;
    }
    panels.forEach(function (p) {
      p.addEventListener('pointerenter', function () { if (wide) activate(p); });
      p.addEventListener('focus', function () { activate(p); });
    });
    if (wide && motion) {
      root.classList.add('has-follow');
      var xTo = gsap.quickTo(follow, 'x', { duration: .35, ease: 'power3' }), yTo = gsap.quickTo(follow, 'y', { duration: .35, ease: 'power3' });
      wrap.addEventListener('pointermove', function (e) {
        xTo(e.clientX); yTo(e.clientY);
        var p = e.target.closest('.panel'); if (!p) return;
        var r = p.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        gsap.to($('.panel__img', p), { x: -dx * 26, y: -dy * 18, duration: .9, ease: 'power3.out', overwrite: 'auto' });
      });
      wrap.addEventListener('pointerenter', function (e) { gsap.set(follow, { x: e.clientX, y: e.clientY }); gsap.to(follow, { scale: 1, duration: .45, ease: 'back.out(1.8)' }); });
      wrap.addEventListener('pointerleave', function () { gsap.to(follow, { scale: 0, duration: .3, ease: 'power3.in' }); });
      wrap.addEventListener('pointerdown', function () { gsap.to(follow, { scale: .82, duration: .15 }); });
      wrap.addEventListener('pointerup', function () { gsap.to(follow, { scale: 1, duration: .3 }); });
      window.addEventListener('scroll', function () { if (follow._gsap && gsap.getProperty(follow, 'scale') > 0 && !wrap.matches(':hover')) gsap.to(follow, { scale: 0, duration: .2 }); }, { passive: true });
    }
    if (motion && window.innerWidth > 900) gsap.from(panels, { y: 80, opacity: 0, duration: 1, stagger: .09, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: wrap, start: 'top 82%', once: true } });
  })();

  /* ---------- 7. 협력브랜드 ---------- */
  (function () {
    var tiles = $$('.brand'); if (!tiles.length || !motion) return;
    gsap.from(tiles, { y: 50, opacity: 0, duration: .8, stagger: .05, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: tiles[0].parentNode, start: 'top 85%', once: true } });
  })();

  /* ---------- 8. 3D 무대 ---------- */
  (function () {
    var sec = $('#stage3d'); if (!sec) return;
    var ghost = $('.stage__ghost', sec), bar = $('.prog i', sec);
    var rows = { material: $('[data-row="material"]', sec), color: $('[data-row="color"]', sec), logo: $('[data-row="logo"]', sec) };
    var PI = Math.PI, FREE_AT = 0.84;
    // 스크롤 진행(0~1)에 따른 장면. FREE_AT부터는 직접 조작
    var STEPS = [
      { at: 0.00, row: 'material', s: { material: 'oxford', color: 'black', logos: ['lchest'] } },
      { at: 0.08, row: 'material', s: { material: 'mesh', color: 'black', logos: ['lchest'] } },
      { at: 0.16, row: 'material', s: { material: 'twill', color: 'black', logos: ['lchest'] } },
      { at: 0.24, row: 'color', s: { material: 'oxford', color: 'navy', logos: ['lchest'] } },
      { at: 0.30, row: 'color', s: { material: 'oxford', color: 'royal', logos: ['lchest'] } },
      { at: 0.36, row: 'color', s: { material: 'oxford', color: 'neon-orange', logos: ['lchest'] } },
      { at: 0.42, row: 'color', s: { material: 'oxford', color: 'neon-yellow', logos: ['lchest'] } },
      { at: 0.48, row: 'color', s: { material: 'oxford', color: 'khaki', logos: ['lchest'] } },
      { at: 0.54, row: 'logo', s: { material: 'oxford', color: 'khaki', logos: ['nape'] } },
      { at: 0.62, row: 'logo', s: { material: 'oxford', color: 'khaki', logos: ['center'] } },
      { at: 0.70, row: 'logo', s: { material: 'oxford', color: 'khaki', logos: ['nape', 'lower'] } },
      { at: 0.78, row: 'logo', s: { material: 'oxford', color: 'navy', logos: ['lchest'] } }
    ];
    // 방향 키프레임 [진행, 라디안]. 0 = 앞, PI = 뒤
    var AZ = [[0, 0.6], [0.22, -0.4], [0.5, 0.5], [0.56, PI - 0.35], [0.74, PI + 0.35], [0.8, 2 * PI + 0.3], [1, 2 * PI + 0.3]];
    function azAt(p) {
      for (var i = 1; i < AZ.length; i++) {
        if (p <= AZ[i][0]) { var a = AZ[i - 1], b = AZ[i]; var t = (p - a[0]) / (b[0] - a[0] || 1); t = t * t * (3 - 2 * t); return a[1] + (b[1] - a[1]) * t; }
      }
      return AZ[AZ.length - 1][1];
    }
    var progress = 0, stepIdx = -1, free = false, ready = false;
    function setRow(name) { Object.keys(rows).forEach(function (k) { rows[k].classList.toggle('is-on', k === name); }); }
    function render() {
      if (ghost) ghost.style.transform = 'translate3d(' + (-progress * 46).toFixed(2) + '%,-50%,0)';
      if (bar) bar.style.transform = 'scaleY(' + progress.toFixed(4) + ')';
      var wantFree = progress >= FREE_AT, idx = 0;
      for (var i = 0; i < STEPS.length; i++) if (progress >= STEPS[i].at) idx = i;
      if (!wantFree) setRow(STEPS[idx].row);
      if (!ready) { sec.classList.toggle('is-free', wantFree); return; }
      var V = window.B2BTVest;
      if (wantFree !== free) {
        free = wantFree;
        sec.classList.toggle('is-free', free);
        V.api.setFree(free);
        if (free) { V.api.setScrollAz(0.3); stepIdx = -1; }
      }
      if (free) return;
      V.api.setScrollAz(azAt(progress));
      if (idx !== stepIdx) {
        stepIdx = idx;
        var s = STEPS[idx].s;
        V.state.material = s.material; V.state.color = s.color; V.state.logos = new Set(s.logos);
        V.syncUI(); V.api.apply(null);
      }
    }
    document.addEventListener('vest:ready', function () { ready = true; free = false; render(); });
    if (hasG) ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: function (st) { progress = st.progress; render(); } });
    else { progress = 1; }
    render();
    // 회사명 입력 → 조끼 로고 글자
    var box = $('#nameBox'), input = $('#nameInput'), clear = $('#nameClear'), timer = 0;
    function pushName() {
      box.classList.toggle('has-text', !!input.value.trim());
      clearTimeout(timer);
      timer = setTimeout(function () { if (window.B2BTVest) window.B2BTVest.api.setText(input.value); }, 180);
    }
    input.addEventListener('input', pushName);
    clear.addEventListener('click', function () { input.value = ''; pushName(); input.focus(); });
  })();

  /* ---------- 9. 주문 흐름 ---------- */
  (function () {
    var sec = $('#flow'); if (!sec) return;
    var steps = $$('.step', sec), scenes = $$('.scene', sec), tls = [];
    function q(s, r) { return (r || sec).querySelectorAll(s); }
    function build() {
      // 1: 목록이 차례로 들어오고, 커서가 버튼을 누른다
      var s1 = scenes[0], btn = $('.s1__btn', s1), cur = $('.cursor', s1);
      var t1 = gsap.timeline({ paused: true });
      t1.from($('.card', s1), { y: 30, opacity: 0, duration: .6, ease: 'power3.out' })
        .from(q('.s1__row', s1), { x: 26, opacity: 0, duration: .5, stagger: .13, ease: 'power3.out' }, '-=.25')
        .from(btn, { opacity: 0, y: 10, duration: .4 }, '-=.15')
        .fromTo(cur, { opacity: 0, x: function () { return s1.clientWidth * .8; }, y: function () { return s1.clientHeight * .25; } },
          { opacity: 1, duration: .9, ease: 'power2.inOut',
            x: function () { var a = btn.getBoundingClientRect(), b = s1.getBoundingClientRect(); return a.left - b.left + a.width * .56; },
            y: function () { var a = btn.getBoundingClientRect(), b = s1.getBoundingClientRect(); return a.top - b.top + a.height * .5; } }, '-=.1')
        .to(cur, { scale: .82, duration: .12, yoyo: true, repeat: 1 })
        .add(function () { btn.classList.remove('is-hit'); void btn.offsetWidth; btn.classList.add('is-hit'); }, '-=.15')
        .to(btn, { scale: .97, duration: .1, yoyo: true, repeat: 1 }, '-=.15');
      // 2: 옷 위에 로고 틀이 자리를 잡고, 시안 확인이 찍힌다
      var s2 = scenes[1], t2 = gsap.timeline({ paused: true });
      t2.from($('.card', s2), { y: 30, opacity: 0, duration: .6, ease: 'power3.out' })
        .from($('.s2__img>img', s2), { scale: 1.12, duration: 1.2, ease: 'power2.out' }, '<')
        .from($('.s2__logo', s2), { left: '36%', top: '62%', scale: 2.1, opacity: 0, duration: .9, ease: 'power3.inOut' }, '-=.7')
        .from($('.s2__pos', s2), { opacity: 0, y: 6, duration: .3 })
        .to($('.s2__frame', s2), { opacity: 0, duration: .35 }, '+=.5')
        .from($('.s2__ok', s2), { scale: 0, opacity: 0, duration: .5, ease: 'back.out(2.4)' }, '-=.1');
      // 3: 검수 항목이 하나씩 체크되고 상자가 쌓인다
      var s3 = scenes[2], li = q('.s3__list li', s3), t3 = gsap.timeline({ paused: true });
      t3.add(function () { li.forEach(function (x) { x.classList.remove('is-ok'); }); })
        .from($('.card', s3), { y: 30, opacity: 0, duration: .6, ease: 'power3.out' });
      li.forEach(function (x, i) { t3.add(function () { x.classList.add('is-ok'); }, .55 + i * .38); });
      t3.from(q('.box', s3), { y: -70, opacity: 0, rotation: function (i) { return [-8, 6, -5][i]; }, duration: .6, stagger: .14, ease: 'bounce.out' }, 1.5);
      // 4: 이력이 쌓이고, 같은 구성이 맨 아래에 다시 들어온다
      var s4 = scenes[3], t4 = gsap.timeline({ paused: true });
      t4.from($('.card', s4), { y: 30, opacity: 0, duration: .6, ease: 'power3.out' })
        .from(q('.s4__item:not(.is-new)', s4), { opacity: 0, x: -18, duration: .45, stagger: .14, ease: 'power3.out' }, '-=.2')
        .from($('.s4__item.is-new', s4), { opacity: 0, y: -62, scale: .96, duration: .7, ease: 'power3.inOut' }, '+=.1')
        .from($('.s4__loop', s4), { scale: 0, duration: .45, ease: 'back.out(2.2)' }, '-=.2')
        .to($('.s4__loop svg', s4), { rotation: 360, duration: .9, ease: 'power2.inOut' }, '-=.3');
      tls = [t1, t2, t3, t4];
    }
    var current = -1;
    function go(i) {
      if (i === current) return; current = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); s.classList.toggle('is-done', k < i); });
      scenes.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      if (tls[i]) { if (reduce) tls[i].progress(1); else tls[i].restart(); }
    }
    if (hasG) {
      build();
      steps.forEach(function (s, i) { ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (st) { if (st.isActive) go(i); } }); });
      gsap.to($('.steps__line i', sec), { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps[0], start: 'center 55%', endTrigger: steps[steps.length - 1], end: 'center 55%', scrub: .4 } });
      go(0);
    } else { steps.forEach(function (s) { s.classList.add('is-on'); }); }
  })();

  /* ---------- 10. 납품처 ---------- */
  (function () {
    var tabs = $('#clTabs'); if (!tabs) return;
    var cells = $$('#logos .logo');
    pillTabs(tabs, function (key) { flipFilter(cells, function (c) { return key === 'all' || c.dataset.group === key; }); });
    if (motion) gsap.from(cells, { y: 26, opacity: 0, duration: .6, stagger: { each: .02, grid: 'auto', from: 'start' }, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '#logos', start: 'top 88%', once: true } });
  })();

  /* ---------- 11. FAQ: 한 번에 하나만 열린다 ---------- */
  (function () {
    var items = $$('.qa');
    items.forEach(function (it) {
      var b = $('.qa__q', it);
      b.addEventListener('click', function () {
        var open = !it.classList.contains('is-open');
        items.forEach(function (x) { x.classList.remove('is-open'); $('.qa__q', x).setAttribute('aria-expanded', 'false'); });
        if (open) { it.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
        if (hasG) setTimeout(function () { ScrollTrigger.refresh(); }, 650);
      });
    });
  })();

  /* ---------- 12. Final CTA: 빛이 커서를 따라온다 ---------- */
  (function () {
    var sec = $('#contact'), glow = sec && $('.final__glow', sec); if (!glow || !motion || !fine) return;
    var xTo = gsap.quickTo(glow, 'x', { duration: 1.1, ease: 'power3' }), yTo = gsap.quickTo(glow, 'y', { duration: 1.1, ease: 'power3' });
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); xTo(e.clientX - r.left - r.width / 2); yTo(e.clientY - r.top - r.height / 2); });
    sec.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
  })();

  /* ============================================================
     장바구니 (서랍 · 배지 · 날아가기 · 알림)
     ============================================================ */
  var Bag = (function () {
    var el = $('#bag'), listEl = $('#bagList'), sumEl = $('#bagSum'), cntEl = $('#bagCount'), fab = $('#bagFab'), toast = $('#toast');
    var items = [], lastFocus = null, toastT = 0;
    try { items = JSON.parse(sessionStorage.getItem('b2bt-v3-bag') || '[]').filter(function (x) { return P[x.key]; }); } catch (e) { items = []; }
    // 헤더 장바구니 아이콘(PC·모바일)에 수량 배지를 붙이고, 누르면 서랍을 연다
    var headBtns = $$('.hd__icon[aria-label="장바구니"], .mh__btn[aria-label="장바구니"]');
    headBtns.forEach(function (b) {
      b.style.position = 'relative';
      b.insertAdjacentHTML('beforeend', '<span class="badge num" aria-hidden="true"></span>');
      b.setAttribute('aria-haspopup', 'dialog');
      b.addEventListener('click', function (e) { e.preventDefault(); open(b); });
    });
    fab.addEventListener('click', function () { open(fab); });
    function total() { return items.reduce(function (n, x) { return n + x.qty; }, 0); }
    function save() { try { sessionStorage.setItem('b2bt-v3-bag', JSON.stringify(items)); } catch (e) {} }
    function paint(bump) {
      var n = total();
      $$('.badge').forEach(function (b) {
        b.textContent = n; b.classList.toggle('is-on', n > 0);
        if (bump && motion && n > 0) gsap.fromTo(b, { scale: 0 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' });
      });
      fab.classList.toggle('is-on', n > 0);
      fab.setAttribute('aria-label', '장바구니 ' + n + '개');
      cntEl.textContent = n; sumEl.textContent = n;
      listEl.innerHTML = items.length ? items.map(function (x) {
        var p = P[x.key];
        return '<div class="bitem" data-key="' + x.key + '"><img src="' + x.img + '" alt="" width="84" height="84"><div><p class="bitem__name">' + esc(p.name) + '</p><p class="bitem__price num">' + esc(p.price) + '</p>' +
          '<div class="bitem__row"><span class="qty"><button type="button" data-q="-1" aria-label="수량 줄이기">−</button><output class="num" aria-live="polite">' + x.qty + '</output><button type="button" data-q="1" aria-label="수량 늘리기">+</button></span><button type="button" class="bitem__del">삭제</button></div></div></div>';
      }).join('') : '<p class="bag__empty">장바구니에 담은 상품이 없습니다.</p>';
    }
    listEl.addEventListener('click', function (e) {
      var row = e.target.closest('.bitem'); if (!row) return;
      var x = items.filter(function (i) { return i.key === row.dataset.key; })[0]; if (!x) return;
      var qb = e.target.closest('[data-q]');
      if (qb) { x.qty = Math.max(1, Math.min(999, x.qty + (+qb.dataset.q))); save(); $('output', row).textContent = x.qty; var n = total(); cntEl.textContent = n; sumEl.textContent = n; $$('.badge').forEach(function (b) { b.textContent = n; }); return; }
      if (e.target.closest('.bitem__del')) {
        var done = function () { items = items.filter(function (i) { return i !== x; }); save(); paint(); };
        if (motion) gsap.to(row, { opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0, duration: .4, ease: 'power3.inOut', onComplete: done }); else done();
      }
    });
    function add(key, qty, img) {
      var x = items.filter(function (i) { return i.key === key; })[0];
      if (x) x.qty = Math.min(999, x.qty + qty); else items.push({ key: key, qty: qty, img: img || P[key].imgs[0] });
      save(); paint(true);
      if (motion) headBtns.concat([fab]).forEach(function (b) { gsap.fromTo(b, { scale: 1.2 }, { scale: 1, duration: .5, ease: 'elastic.out(1,.5)', clearProps: 'transform' }); });
      toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
    }
    function open(from) {
      lastFocus = from || document.activeElement;
      toast.classList.remove('is-on');
      el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false'); locks++; syncLock();
      setTimeout(function () { $('.bag__close', el).focus(); }, 60);
      if (motion) gsap.fromTo($$('.bitem', el), { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: .5, stagger: .05, delay: .2, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
    function close() {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); locks = Math.max(0, locks - 1); syncLock();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    $$('[data-bag-close]', el).forEach(function (b) { b.addEventListener('click', close); });
    $('button', toast).addEventListener('click', function () { open(); });
    paint();
    // 지금 화면에 보이는 장바구니 아이콘(헤더가 숨어 있으면 떠 있는 버튼)
    function target() {
      if (!root.classList.contains('is-head-off')) {
        for (var i = 0; i < headBtns.length; i++) { var r = headBtns[i].getBoundingClientRect(); if (r.width && r.top >= 0 && r.bottom <= window.innerHeight) return r; }
      }
      fab.classList.add('is-on');
      var f = fab.getBoundingClientRect();
      return { left: f.left + f.width / 2 - 26, top: f.top + f.height / 2 - 26, width: 52, height: 52 };
    }
    return { add: add, open: open, close: close, target: target, isOpen: function () { return el.classList.contains('is-open'); } };
  })();

  // 지금 보이는 사진이 장바구니 아이콘으로 날아간다
  function fly(img, done) {
    if (!motion) { done(); return; }
    var a = img.getBoundingClientRect(), b = Bag.target();
    var c = img.cloneNode();
    c.className = 'fly'; c.removeAttribute('loading'); c.removeAttribute('data-slot');
    c.style.cssText = 'width:' + a.width + 'px;height:' + a.height + 'px';
    document.body.appendChild(c);
    var dx = b.left + b.width / 2 - a.width / 2, dy = b.top + b.height / 2 - a.height / 2;
    gsap.timeline({ onComplete: function () { c.remove(); done(); } })
      .fromTo(c, { x: a.left, y: a.top, scale: 1 }, { scale: .55, duration: .25, ease: 'power2.out' })
      .to(c, { x: dx, duration: .75, ease: 'power2.in' }, '-=.05')
      .to(c, { y: dy, duration: .75, ease: 'power3.inOut' }, '<')
      .to(c, { scale: .06, opacity: .4, rotation: 14, duration: .75, ease: 'power2.in' }, '<');
  }

  /* ============================================================
     빠른 보기
     ============================================================ */
  var QV = (function () {
    var el = $('#qv'), gal = $('#qvGal'), thumbs = $('#qvThumbs'), out = $('#qvQty'), key = null, qty = 1, lastFocus = null;
    function show(i) {
      $$('img', gal).forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      $$('.qv__thumb', thumbs).forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-pressed', String(k === i)); });
    }
    function setQty(n) { qty = Math.max(1, Math.min(999, n)); out.textContent = qty; }
    function open(k, from) {
      var p = P[k]; key = k; lastFocus = from ? $('.act--view', from) : document.activeElement;
      gal.innerHTML = p.imgs.map(function (s, i) { return '<img src="' + s + '" alt="' + (i ? '' : esc(p.name)) + '"' + (i ? '' : ' class="is-on"') + '>'; }).join('');
      thumbs.innerHTML = p.imgs.map(function (s, i) { return '<button type="button" class="qv__thumb' + (i ? '' : ' is-on') + '" aria-pressed="' + (i ? 'false' : 'true') + '" aria-label="사진 ' + (i + 1) + '" data-i="' + i + '"><img src="' + s + '" alt=""></button>'; }).join('');
      $('#qvCat').textContent = p.tag; $('#qvName').textContent = p.name; $('#qvCode').textContent = p.code; $('#qvPrice').textContent = p.price; $('#qvSize').textContent = p.size;
      var col = p.dots.map(function (d) { return '<span class="dot" style="--c:' + d.hex + '"' + (d.label ? ' title="' + esc(d.label) + '"' : '') + '></span>'; }).join('') + (p.more ? '<span class="num">' + esc(p.more) + '</span>' : '') + (p.colorText ? '<span>' + esc(p.colorText) + '</span>' : '');
      $('#qvColor').innerHTML = col; $('#qvColorRow').hidden = !col;
      $('#qvDetail').setAttribute('data-href', 'product.php?id=' + p.id);
      setQty(1);
      el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false'); locks++; syncLock();
      setTimeout(function () { $('.qv__close', el).focus(); }, 60);
      if (motion) gsap.fromTo($$('.qv__info>*', el), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, stagger: .05, delay: .18, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
    function close() {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); locks = Math.max(0, locks - 1); syncLock();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    thumbs.addEventListener('click', function (e) { var t = e.target.closest('.qv__thumb'); if (t) show(+t.dataset.i); });
    $$('[data-qv-q]', el).forEach(function (b) { b.addEventListener('click', function () { setQty(qty + (+b.dataset.qvQ)); }); });
    $$('[data-qv-close]', el).forEach(function (b) { b.addEventListener('click', close); });
    $('#qvAdd').addEventListener('click', function () {
      var im = $('img.is-on', gal), k = key, n = qty;
      close(); fly(im, function () { Bag.add(k, n, im.getAttribute('src')); });
    });
    return { open: open, close: close, isOpen: function () { return el.classList.contains('is-open'); } };
  })();

  /* ---------- 검색 즉시 결과: 입력하면 화면에 있는 상품(62개)에서 바로 찾는다 ---------- */
  (function () {
    var input = $('.hd-search__input'), box = $('.hd-sx'); if (!input || !box) return;
    var keep = [].slice.call(box.children);
    var out = document.createElement('div'); out.className = 'sr'; out.hidden = true; out.setAttribute('aria-live', 'polite'); box.appendChild(out);
    var all = Object.keys(P).map(function (k) { return P[k]; }), seen = {};
    all = all.filter(function (p) { if (seen[p.id]) return false; seen[p.id] = 1; return true; });
    function hl(t, q) { var i = t.toLowerCase().indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      keep.forEach(function (el) { el.hidden = !!q; }); out.hidden = !q;
      if (!q) return;
      var hit = all.filter(function (p) { return (p.name + ' ' + p.tag + ' ' + p.code).toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
      out.innerHTML = hit.length ? hit.map(function (p) {
        return '<a href="#" data-href="product.php?id=' + p.id + '"><img src="' + p.imgs[0] + '" alt="" width="56" height="56"><span><b>' + hl(p.name, q) + '</b><span class="num">' + esc(p.tag) + ' · ' + esc(p.price) + '</span></span></a>';
      }).join('') : '<p class="sr__none">찾는 상품이 없습니다.</p>';
      if (motion) gsap.fromTo(out.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, stagger: .03, ease: 'power3.out', clearProps: 'transform,opacity' });
    });
  })();

  // Esc로 닫기, 창 안에서 Tab 가두기
  document.addEventListener('keydown', function (e) {
    var box = QV.isOpen() ? $('#qv') : Bag.isOpen() ? $('#bag') : null; if (!box) return;
    if (e.key === 'Escape') { e.stopPropagation(); if (QV.isOpen()) QV.close(); else Bag.close(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input', box).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }, true);

  window.addEventListener('load', function () { if (hasG) ScrollTrigger.refresh(); });
})();
