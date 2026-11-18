/* 비투비티 홈 시안 v9 · v9.js (2026-11-14, _build_v9.py가 v8.js에서 만든다. 직접 고치지 말고 _src/partner.js, _src/shop.js를 고친 뒤 다시 조립)
   v8 그대로: 히어로(화면 쌓기 + 글자 3D 뒤집기) · 랭킹 · 겨울 시즌 · 장바구니 · 빠른 보기 · 검색 · 1:1 담당자 알림.
   v9: 케이투 배너 → 파트너 브랜드 배너(_src/partner.js), MD 추천 이하 → 상품 섹션 + 바텀 헤더(_src/shop.js).
   없앤 것: MD 추천, 현장별 착용 상품, 견적문의 배너, 협력브랜드 로고 칸, 품목별 보기, 맞춤제작, 3D 무대.
   GSAP + ScrollTrigger + Flip + Lenis (스크립트 태그, 빌드 없음). 헤더는 site-v9.js가 맡는다. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var motion = hasG && !reduce;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wideQ = window.matchMedia('(min-width: 901px)');
  if (!motion) root.classList.remove('v4-motion');
  window.B2BT_READY = true;
  if (hasG) { gsap.registerPlugin(ScrollTrigger); if (window.Flip) gsap.registerPlugin(Flip); }

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function store(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  // v4 첫 화면은 밝은 면이라 헤더의 투명 상태(is-top)를 쓰지 않는다
  function noTop() { if (root.classList.contains('is-top')) root.classList.remove('is-top'); }
  noTop();

  /* ---------- 부드러운 스크롤 ---------- */
  var lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  var locks = 0;
  function syncLock() {
    noTop();
    var on = locks > 0 || root.classList.contains('is-locked');
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
    else document.body.style.overflow = locks > 0 ? 'hidden' : '';
  }
  new MutationObserver(syncLock).observe(root, { attributes: true, attributeFilter: ['class'] });
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.3 }); else window.scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + window.pageYOffset, behavior: reduce ? 'auto' : 'smooth' }); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-href')) return;
    var id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault(); scrollToY(t);
  });
  var toTop = $('#toTop');
  if (toTop && lenis) toTop.addEventListener('click', function (e) { e.stopImmediatePropagation(); lenis.scrollTo(0, { duration: 1.4 }); }, true);

  /* ---------- 회사 이름: 첫 화면에서 입력하면 페이지 전체에 이어진다 ---------- */
  var Co = (function () {
    var v = (read('b2bt-v4-co') || '').slice(0, 12), subs = [];
    return {
      get: function () { return v; },
      set: function (n, from) { n = String(n || '').replace(/\s+/g, ' ').slice(0, 12); if (n === v) return; v = n; store('b2bt-v4-co', v); subs.forEach(function (f) { f(v, from); }); },
      on: function (f) { subs.push(f); f(v, 'init'); }
    };
  })();
  // 받침에 따라 을/를
  function josa(w) {
    var s = w.trim(), c = s.charCodeAt(s.length - 1);
    if (!s) return '을';
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? '을' : '를';
    if (/[0-9]$/.test(s)) return /[013678]$/.test(s) ? '을' : '를';
    return /[aeiouyAEIOUY]$/.test(s) ? '를' : '을';
  }
  Co.on(function (n) {
    $$('[data-co]').forEach(function (el) { el.textContent = n ? (el.getAttribute('data-co') || '%s').replace('%s', n) : (el.getAttribute('data-co-empty') || ''); });
    var who = $('#finalWho'); if (who) { who.textContent = n || '사내'; who.classList.toggle('final__name', !!n); }
  });

  /* ---------- 공통 ---------- */
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
  function countUp(el, trig) {
    var to = parseFloat(el.getAttribute('data-count')), plain = el.hasAttribute('data-plain');
    if (!motion) return;
    var o = { v: plain ? to - 9 : 0 };
    el.textContent = plain ? String(o.v) : '0';
    var cfg = { v: to, duration: 1.5, ease: 'power3.out', onUpdate: function () { el.textContent = plain ? String(Math.round(o.v)) : fmt(o.v); } };
    if (trig === false) return function () { gsap.to(o, cfg); };
    cfg.scrollTrigger = { trigger: el, start: 'top 92%', once: true };
    gsap.to(o, cfg);
  }
  $$('[data-count]:not([data-count-manual])').forEach(function (el) { countUp(el); });

  function lineTabs(el, onSelect) {
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
  function flipFilter(items, test, done) {
    var st = (window.Flip && motion) ? Flip.getState(items) : null;
    items.forEach(function (c) { c.style.display = test(c) ? '' : 'none'; });
    if (st) Flip.from(st, { duration: .7, ease: 'power3.inOut', absolute: true, stagger: .02,
      onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .5, delay: .15 }); },
      onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .92, duration: .3 }); },
      onComplete: function () { ScrollTrigger.refresh(); if (done) done(); } });
    else if (done) done();
  }

  /* ---------- 등장 ---------- */
  if (motion) {
    ScrollTrigger.batch('[data-rv]', { start: 'top 90%', once: true, onEnter: function (els) {
      gsap.fromTo(els, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: .95, stagger: .09, ease: 'power4.out', clearProps: 'transform' });
    } });
    // 큰 제목: 줄 단위로 올라온다
    $$('.sh__t, .faq__side h2, .final h2').forEach(function (h) {
      var ls = $$('.ln>span', h); if (!ls.length) return;
      gsap.from(ls, { yPercent: 115, duration: 1.1, stagger: .1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
    });
    $$('.sh__meta').forEach(function (m) {
      gsap.from(m, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: m, start: 'top 94%', once: true } });
    });
  }

  /* ============================================================
     상품 데이터
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
  var P = {};
  MD.forEach(function (d) {
    // 첫 사진 = 누끼, 둘째 = 착용컷, 그 뒤 = 색상별 사진
    P['m' + d.id] = { key: 'm' + d.id, id: d.id, tag: d.cat, kind: d.kind, name: d.name, code: d.code, size: d.size, colorText: d.color || '', price: d.price,
      imgs: ['img/catalog/' + d.id + '-f.webp', 'img/products/md-pick-' + d.id + '.webp'].concat(d.shots.map(function (s) { return 'img/products/' + d.id + '-' + s[0] + '.webp'; })),
      dots: d.shots.map(function (s, i) { return { hex: s[2], label: s[1], i: i + 2 }; }), more: '', slot: 'md-pick-' + d.id };
  });
  var CATS = window.B2BT_CATALOG || [];
  function catP(cat, d) {
    var sw = d.sw || [], nCol = sw.length + (parseInt(d.more, 10) || 0);
    return { key: 'c' + d.id, id: d.id, tag: cat, name: d.name, code: d.code, size: d.size, colorText: nCol > 1 ? '색상 ' + nCol + '종' : '', price: d.price,
      imgs: d.b && d.b !== d.f ? ['img/catalog/' + d.f, 'img/catalog/' + d.b] : ['img/catalog/' + d.f], dots: sw.map(function (h) { return { hex: h }; }), more: d.more || '', slot: 'catalog-' + d.id };
  }
  CATS.forEach(function (c) { c.items.forEach(function (d) { P['c' + d.id] = catP(c.cat, d); }); });
  // 랭킹 데이터(js/rank.js): 카탈로그에 없는 상품은 extra로 같이 온다
  var RK = window.B2BT_RANK || null;
  if (RK && RK.extra) RK.extra.forEach(function (c) { (c.items || []).forEach(function (d) { if (!P['c' + d.id]) P['c' + d.id] = catP(c.cat, d); }); });
  // v9: 시안 F 상품 섹션에 쓰는 상품 중 카탈로그에 없던 것(js/extra.js). hi = 크게 놓는 카드에 쓰는 1200px 앞·뒤 사진
  (window.B2BT_EXTRA || []).forEach(function (c) { (c.items || []).forEach(function (d) { if (!P['c' + d.id]) P['c' + d.id] = catP(c.cat, d); }); });
  (window.B2BT_HI || []).forEach(function (id) { if (P['c' + id]) P['c' + id].hi = ['img/shop/' + id + '-front.webp', 'img/shop/' + id + '-back.webp']; });

  // 협력브랜드 상품: 2026-11-11 noeul.shop 브랜드 목록 앞쪽 상품(js/brands.js). 쇼핑몰 표시가 "견적문의"라 가격·사이즈 칸은 비운다
  var BR = window.B2BT_BRANDS || [];
  BR.forEach(function (b) {
    b.items.forEach(function (d) {
      P['b' + d.id] = { key: 'b' + d.id, id: d.id, tag: b.en, brand: b.key, name: d.name, code: '', size: '', colorText: '', price: '견적문의',
        imgs: ['img/brandp/' + d.id + '.webp'], dots: [], more: '', slot: 'brand-' + d.id };
    });
  });
  // 사진 속 착용 상품: 배너·현장 사진을 만들 때 넣은 실제 상품(집사님 확인 목록). 2026-11-11 noeul.shop 상품 페이지 제목과 대표 사진으로 대조함
  var WORN = [
    [2041, 'tbuc', '티뷰크 TBS-5032 J/P'], [3026, 'k2', '케이투 JK-F6101'], [2771, 'k2', '케이투 비니'], [3330, 'k2', '케이투 PT-F4304'],
    [2762, 'k2', '케이투 넥게이터'], [3032, 'eider', '아이더 JK-F2429'], [3257, 'k2', '케이투 하이브리드 발열 자켓'], [3322, 'k2', '케이투 PT-A2301'],
    [3022, 'eider', '아이더 JK-F2425'], [3009, 'eider', '아이더 JK-F2428'], [2993, 'k2', '케이투 JK-F2105'], [3027, 'eider', '아이더 JK-F2626'], [3023, 'k2', '케이투 JK-F6102'],
    [1420, 'ace', '에이스 ACE-S315'], [2305, 'sseda', '쎄다 VISUAL(비주얼)']
  ];
  var BRAND_EN = {}; BR.forEach(function (b) { BRAND_EN[b.key] = b.en; });
  WORN.forEach(function (w) {
    if (P['b' + w[0]]) return;
    P['b' + w[0]] = { key: 'b' + w[0], id: w[0], tag: BRAND_EN[w[1]] || '', brand: w[1], name: w[2], code: '', size: '', colorText: '', price: '견적문의',
      imgs: ['img/brandp/' + w[0] + '.webp'], dots: [], more: '', slot: 'brand-' + w[0] };
  });

  // 상품 카드 통일(2026-11-11): 이전 시안(v3) 카드 구성 = 분류 · 이름 · 사이즈 · 색상 · 가격 · 품번이 위에서 아래로. 모서리는 직각.
  // opt.kind = 분류 앞에 붙는 말(시즌 · MD 추천 · 착용 상품), opt.rank = 사진 왼쪽 위 순위 번호
  function cardHTML(p, n, opt) {
    opt = opt || {};
    var kind = opt.kind || '', feat = !!opt.feat && n === 1, srcs = feat && p.hi ? p.hi : p.imgs, px = feat && p.hi ? 1200 : 600;
    var imgs = srcs.map(function (src, i) {
      return '<img' + (i ? ' data-src="' + src + '"' : ' class="is-on" src="' + src + '" loading="lazy" data-slot="' + p.slot + '"') + ' alt="' + (i ? '' : esc(p.name)) + '" width="' + px + '" height="' + px + '" decoding="async" draggable="false">';
    }).join('');
    var bars = srcs.length > 1 ? srcs.map(function (_, i) { return '<i' + (i ? '' : ' class="is-on"') + '></i>'; }).join('') : '';
    var dots = p.dots.map(function (d) {
      return d.i && !(feat && p.hi) ? '<button type="button" class="dot" style="--c:' + d.hex + '" data-i="' + d.i + '" aria-label="' + esc(d.label) + ' 사진 보기"></button>' : '<span class="dot" style="--c:' + d.hex + '"></span>';
    }).join('') + (p.more ? '<span class="pc__swmore">' + esc(p.more) + '</span>' : '');
    var cat = [kind, p.tag].filter(Boolean).map(esc).join(' · ');
    var metas = [p.size, p.colorText].filter(Boolean).map(function (m) { return '<p class="pc__meta">' + esc(m) + '</p>'; }).join('');
    if (metas) metas = '<div class="pc__ms">' + metas + '</div>';
    return '<article class="pc' + (kind === '착용 상품' ? ' pc--worn' : '') + (feat ? ' pc--feat' : '') + '" data-key="' + p.key + '"' + (p.brand ? ' data-brand="' + p.brand + '"' : '') + ' data-flip-id="' + (opt.fid || '') + p.key + '">' +
      '<div class="pc__media">' + imgs + '<div class="pc__bars" aria-hidden="true">' + bars + '</div>' +
      (opt.rank ? '<span class="pc__rank num"><span class="sr-only">순위 </span>' + n + '</span>' : '') +
      '<div class="pc__acts"><button type="button" class="act act--view" aria-label="빠른 보기">' + IC.view + '</button><button type="button" class="act act--like" aria-pressed="false" aria-label="관심상품">' + IC.heart + '</button><button type="button" class="act act--cart" aria-label="장바구니 담기">' + IC.bag + '</button></div>' +
      (dots ? '<div class="pc__sw">' + dots + '</div>' : '') + '</div>' +
      '<p class="pc__cat">' + cat + '</p><a class="pc__name" href="#" data-href="product.php?id=' + p.id + '"><span>' + esc(p.name) + '</span></a>' + metas +
      (p.price === '견적문의' ? '<button type="button" class="pc__price pc__quote" aria-label="' + esc(p.name) + ' 장바구니에 담아 견적 문의">견적문의 <i aria-hidden="true">+</i></button>' : '<p class="pc__price num">' + esc(p.price) + '</p>') +
      (p.code ? '<p class="pc__code">' + esc(p.code) + '</p>' : '') + '</article>';
  }
  var liked = {};
  function bindCard(card) {
    var p = P[card.dataset.key], media = $('.pc__media', card);
    var imgs = $$('img', media), bars = $$('.pc__bars i', media), dots = $$('button.dot', card), cur = 0, loaded = false;
    function load() { if (loaded) return; loaded = true; imgs.forEach(function (im) { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }); }
    card.addEventListener('pointerenter', load); card.addEventListener('focusin', load); card.addEventListener('touchstart', load, { passive: true });
    function show(i) {
      load();
      if (i === cur) return; cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      bars.forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
      dots.forEach(function (d) { d.classList.toggle('is-on', +d.dataset.i === i); });
    }
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
      liked[p.key] = on;
      $$('.pc[data-key="' + p.key + '"] .act--like').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
      if (motion) gsap.fromTo($('svg', like), { scale: .4 }, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.4)' });
    });
    function toBag() { fly(imgs[cur], function () { Bag.add(p.key, 1, imgs[cur].getAttribute('src')); }); }
    $('.act--cart', card).addEventListener('click', toBag);
    var qb = $('.pc__quote', card); if (qb) qb.addEventListener('click', toBag);
    $('.act--view', card).addEventListener('click', function () { QV.open(p.key, $('.act--view', card)); });
  }
  function pick(keys) { return keys.map(function (k) { return P[k]; }).filter(Boolean); }
  function renderGrid(grid, list, opt) {
    opt = opt || {};
    grid.innerHTML = list.map(function (p, i) { return cardHTML(p, i + 1, { kind: typeof opt.kind === 'function' ? opt.kind(p, i) : opt.kind, fid: opt.fid, rank: opt.rank, feat: opt.feat }); }).join('');
    var cards = $$('.pc', grid); cards.forEach(bindCard); return cards;
  }
  function reveal(cards, trigger, x) {
    if (!motion || !cards.length) return;
    var from = x ? { x: 100, opacity: 0 } : { y: 46, opacity: 0 };
    if (x) trigger.classList.add('is-reveal'); // css/v9.css 12번: 들어오는 동안 scroll-snap 끔
    gsap.from(cards, Object.assign(from, { duration: .9, stagger: .06, ease: 'power4.out', clearProps: 'transform,opacity', onComplete: function () { if (x) trigger.classList.remove('is-reveal'); }, scrollTrigger: { trigger: trigger, start: 'top 86%', once: true } }));
  }
  // 옆으로 끄는 줄: 화살표, 마우스 끌기, 진행 막대
  // v9 보정(2026-11-15) — 넘김이 끊기던 문제. 전에는 넘길 때 scrollLeft를 프레임마다 바꿨는데,
  // 줄에 걸린 scroll-snap이 그 값을 가로채 뚝뚝 끊겼고(랭킹), 프레임마다 스크롤 이벤트와 다시 재기가 따라붙었다.
  // 지금은 스크롤 값을 한 번에 목적지로 옮기고, 카드들을 그만큼 밀어 둔 뒤 translate만 0으로 되돌린다(스크롤 이벤트 1번, 레이아웃 없음).
  // translate는 gsap이 쓰는 transform과 따로 놀기 때문에 카드가 나타나는 움직임과 겹쳐도 서로 지우지 않는다.
  function railX(rail) { // 넘기는 중이면 카드가 지금 밀려 있는 거리(px)
    var s = rail._sl; if (!s || !s.cards[0]) return 0;
    var t = getComputedStyle(s.cards[0]).translate;
    return t && t !== 'none' ? parseFloat(t) || 0 : 0;
  }
  function railStop(rail, keep) { // 넘기던 것을 끝낸다. keep = 지금 보이는 자리에 그대로 멈춘다(손으로 잡았을 때). 아니면 남은 거리를 돌려준다
    var s = rail._sl; if (!s) return 0;
    var x = railX(rail);
    rail._sl = null;
    s.anims.forEach(function (a) { a.cancel(); });
    if (keep) { if (x) rail.scrollLeft -= x; x = 0; }
    rail.classList.remove('is-slide');
    return x;
  }
  // 넘기기 전에 카드에 걸려 있는 gsap 움직임(처음 나타나는 움직임, 탭을 바꿨을 때의 움직임)을 끝까지 보낸다.
  // gsap은 움직임을 끝내며 transform을 지울 때 카드의 translate 값을 읽어 transform에 굳혀 넣는다. 그래서 넘김(translate)과 겹친 채 끝나면 카드가 밀린 자리에 남는다.
  function railSettle(rail) {
    if (!window.gsap) return;
    var cards = [].slice.call(rail.children);
    gsap.getTweensOf(cards).forEach(function (t) { t.progress(1); });
    cards.forEach(function (c) { if (c.style.transform && !gsap.isTweening(c)) c.style.removeProperty('transform'); }); // 혹시 굳어 남은 것이 있으면 지운다
  }
  var EASE_OUT = 'cubic-bezier(.22,.61,.36,1)', EASE_IO = 'cubic-bezier(.65,.05,.36,1)';
  function railTo(rail, to, o) {
    o = o || {};
    var carry = railStop(rail, false), from;
    railSettle(rail);
    from = rail.scrollLeft;
    rail.classList.add('is-slide'); // 넘기는 동안 scroll-snap을 끈다(css/v9.css 12번)
    rail.scrollLeft = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, to));
    var d = rail.scrollLeft - from + carry, rr = rail.getBoundingClientRect();
    // 넘어가는 동안 화면에 한 번이라도 보이는 카드만 움직인다(나머지는 줄 밖이라 움직일 필요가 없다)
    var cards = [].filter.call(rail.children, function (c) {
      var r = c.getBoundingClientRect();
      return Math.max(r.right, r.right + d) > rr.left - 120 && Math.min(r.left, r.left + d) < rr.right + 120;
    });
    function end() { rail.classList.remove('is-slide'); if (o.done) o.done(); }
    if (!motion || !cards.length || !cards[0].animate || Math.abs(d) < 1) { end(); return; }
    var kf = { translate: [d.toFixed(2) + 'px 0', '0px 0'] }, tm = { duration: o.dur || 700, easing: o.ease || EASE_OUT };
    var st = rail._sl = { cards: cards, anims: cards.map(function (c) { return c.animate(kf, tm); }) };
    st.anims[0].onfinish = function () { if (rail._sl !== st) return; rail._sl = null; end(); };
  }
  // 줄이 화면 가까이 오면 줄 안의 사진을 미리 받는다(넘기는 도중에 사진이 늦게 뜨며 끊기지 않게). 돌려주는 함수 = 카드를 새로 그린 뒤 다시 부른다
  function railWarm(rail) {
    var near = !('IntersectionObserver' in window);
    function warm() { if (near) $$('img[loading="lazy"]', rail).forEach(function (im) { im.loading = 'eager'; }); }
    if (!near) new IntersectionObserver(function (es) { if (es[0].isIntersecting) { near = true; warm(); } }, { rootMargin: '600px 0px' }).observe(rail);
    return warm;
  }
  function dragRail(rail, o) {
    o = o || {};
    function vis() { return $$('.pc', rail).filter(function (c) { return c.style.display !== 'none'; }); }
    function step(v) { return v[0] ? v[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(rail).columnGap) || 16) : 1; }
    function sync() {
      var max = rail.scrollWidth - rail.clientWidth, v = vis();
      if (o.prog) o.prog.style.transform = 'scaleX(' + Math.min(1, (rail.scrollLeft + rail.clientWidth) / Math.max(1, rail.scrollWidth)).toFixed(4) + ')';
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 16, st = step(v);
      if (o.onSync) o.onSync({ step: st, per: Math.max(1, Math.floor((rail.clientWidth + gap + 2) / st)), max: max, n: v.length, w: v[0] ? v[0].offsetWidth : 0 });
      var seen = Math.min(v.length, Math.max(1, Math.round((rail.scrollLeft + rail.clientWidth - 40) / st)));
      if (o.now) o.now.textContent = ('0' + seen).slice(-2);
      if (o.tot) o.tot.textContent = ('0' + v.length).slice(-2);
      if (o.prev) o.prev.disabled = rail.scrollLeft < 4;
      if (o.next) o.next.disabled = rail.scrollLeft > max - 4;
    }
    rail.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync);
    function go(d) {
      var v = vis(), gap = parseFloat(getComputedStyle(rail).columnGap) || 16, unit = v[0] ? step(v) : 300, per = o.page ? Math.max(1, Math.floor((rail.clientWidth + gap + 2) / unit)) : 2;
      railTo(rail, (o.page ? Math.round(rail.scrollLeft / unit) * unit : rail.scrollLeft) + d * unit * per);
    }
    if (o.prev) o.prev.addEventListener('click', function () { go(-1); });
    if (o.next) o.next.addEventListener('click', function () { go(1); });
    // 넘기는 도중에 손을 대거나 휠로 밀면 보이는 자리 그대로 멈추고 손에 넘긴다
    rail.addEventListener('touchstart', function () { railStop(rail, true); }, { passive: true });
    rail.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) railStop(rail, true); }, { passive: true });
    var down = false, sx = 0, sl = 0, moved = 0, lastX = 0, lastT = 0, v = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
      railStop(rail, true);
      down = true; sx = lastX = e.clientX; sl = rail.scrollLeft; moved = 0; v = 0; lastT = performance.now();
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) { rail.classList.add('is-drag'); e.preventDefault(); }
      rail.scrollLeft = sl - dx;
      var t = performance.now(); if (t > lastT) { v = (e.clientX - lastX) / (t - lastT); lastX = e.clientX; lastT = t; }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved > 6) { // 놓은 뒤: 밀던 빠르기만큼 더 가서 카드 줄에 맞춰 선다
        var u = step(vis()), to = rail.scrollLeft - v * 420;
        if (o.snap !== false && u > 1) to = Math.round(to / u) * u;
        railTo(rail, to, { dur: 600, done: o.onRest });
      }
      setTimeout(function () { rail.classList.remove('is-drag'); }, 0);
    });
    rail.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var warm = railWarm(rail);
    sync();
    return { sync: sync, warm: warm, step: function () { return step(vis()); }, reset: function () { railTo(rail, 0, { dur: 500 }); } };
  }

  /* ============================================================
     1. 메인 배너: 영상 한 장 고정. 영상은 반복 재생하고, 멈춤 버튼·화면 밖·다음 면에 덮였을 때·탭이 가려졌을 때 멈춘다.
     (가) 화면 쌓기: 배너는 화면 위에 붙어 있고(sticky) 다음 면(#stkOver)이 그 위로 올라온다. 덮이는 만큼 배너가 어두워지고 문구가 물러난다
     (나) 제목 글자 3D 뒤집기: Magic UI Text 3D Flip을 React 없이 옮김. 글자마다 상자(앞면 + 아랫면)를 만들고 차례로 90도 굴린다
     ============================================================ */
  (function () {
    var bn = $('#hero'); if (!bn) return;
    var video = $('#bnFilm'), slide = $('.bn__slide', bn), btn = $('#bnPlay'), over = $('#stkOver'), shade = $('#hvShade'), copy = $('.bn__copy', bn);
    var covered = false, syncFilm = function () {};
    function cover() {
      if (!over) return;
      var h = bn.offsetHeight || 1, p = Math.max(0, Math.min(1, (bn.getBoundingClientRect().bottom - over.getBoundingClientRect().top) / h));
      var was = covered; covered = p >= .97;
      if (shade) shade.style.opacity = (p * .66).toFixed(3);
      if (copy && !reduce) copy.style.setProperty('--cv', p.toFixed(3));
      if (was !== covered) syncFilm();
    }
    window.addEventListener('scroll', cover, { passive: true }); window.addEventListener('resize', cover);
    if (lenis) lenis.on('scroll', cover);
    cover();

    var title = $('#heroTitle');
    if (title) {
      var seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null;
      var chars = function (w) { return seg ? Array.from(seg.segment(w), function (x) { return x.segment; }) : Array.from(w); };
      var lines = $$('.f3l', title), full = lines.map(function (l) { return l.textContent.trim(); });
      lines.forEach(function (l, li) {
        l.setAttribute('aria-hidden', 'true');
        l.innerHTML = full[li].split(/\s+/).map(function (w) {
          return '<span class="f3w">' + chars(w).map(function (c) { return '<span class="f3c"><span class="f3a">' + esc(c) + '</span><span class="f3b">' + esc(c) + '</span></span>'; }).join('') + '</span>';
        }).join(' ');
      });
      var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = full.join(' ');
      title.insertBefore(sr, title.firstChild);
      var cs = $$('.f3c', title), busy = false;
      var flip = function (from) {
        if (busy || reduce || !cs.length || !cs[0].animate) return;
        busy = true; title.classList.add('is-f3');
        var n = cs.length, STAG = 50, DUR = 680, z = -(cs[0].offsetHeight / 2), lastA = null, lastD = -1;
        cs.forEach(function (c, i) {
          var d = (from === 'center' ? Math.abs(Math.floor(n / 2) - i) : i) * STAG;
          var an = c.animate([{ transform: 'translateZ(' + z + 'px) rotateX(0deg)' }, { transform: 'translateZ(' + z + 'px) rotateX(90deg)' }], { duration: DUR, delay: d, easing: 'cubic-bezier(.3,1.2,.4,1)', fill: 'backwards' });
          if (d > lastD) { lastD = d; lastA = an; }
        });
        var done = function () { title.classList.remove('is-f3'); busy = false; };
        if (lastA && lastA.finished) lastA.finished.then(done, done); else setTimeout(done, lastD + DUR + 40);
      };
      title.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') flip('first'); });
      title.addEventListener('click', function () { flip('center'); });
      var kick = function () { setTimeout(function () { flip('first'); }, 900); };
      if (document.readyState === 'complete') kick(); else window.addEventListener('load', kick);
    }

    var conn = navigator.connection;
    var canFilm = !!video && !reduce && !(conn && (conn.saveData === true || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '')));
    if (!canFilm) { if (btn) btn.hidden = true; return; }
    var userPaused = false, inView = true;
    function filmSrc() {
      var w = window.innerWidth, base = w >= 1281 ? 'hero-film-1080' : (w >= 769 ? 'hero-film-720' : 'hero-film-9x16');
      return 'media/' + base + '.' + (video.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm');
    }
    function sync() {
      if (userPaused || !inView || covered || document.hidden) { if (!video.paused) video.pause(); return; }
      if (!video.getAttribute('src')) { video.src = filmSrc(); video.setAttribute('data-src-picked', video.src.split('/').pop()); }
      if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    }
    syncFilm = sync;
    video.addEventListener('playing', function () { slide.classList.add('is-film-on'); });
    video.addEventListener('error', function () { slide.classList.remove('is-film-on'); if (btn) btn.hidden = true; });
    btn.addEventListener('click', function () {
      userPaused = !userPaused;
      btn.setAttribute('aria-pressed', String(userPaused));
      btn.setAttribute('aria-label', userPaused ? '배너 영상 재생' : '배너 영상 멈춤');
      bn.classList.toggle('is-paused', userPaused);
      sync();
    });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: .25 }).observe(bn);
    // 첫 사진(포스터)을 먼저 그린 뒤 영상을 받는다
    if (document.readyState === 'complete') sync(); else window.addEventListener('load', sync);
  })();

  /* ============================================================
     2. 랭킹: 품목 탭 + 순위 번호가 붙은 상품 줄(한 번에 한 묶음씩 넘김). 순서는 js/rank.js, 없으면 카탈로그(추천순)에서 품목별로 돌아가며 고른다
     ============================================================ */
  (function () {
    var rail = $('#rkRail'), tabsEl = $('#rkTabs'), pagesEl = $('#rkPages'), stage = rail && rail.parentNode; if (!rail || !tabsEl) return;
    var by = {}; CATS.forEach(function (c) { by[c.cat] = c.items.map(function (d) { return P['c' + d.id]; }); });
    function mix(names, n) { var out = [], r = 0, ls = names.map(function (k) { return by[k] || []; }); while (out.length < n && ls.some(function (l) { return l.length > r; })) { ls.forEach(function (l) { if (l[r] && out.length < n) out.push(l[r]); }); r++; } return out; }
    var tabs = (RK && RK.tabs && RK.tabs.length) ? RK.tabs.map(function (t) { return { label: t.label, list: pick(t.keys) }; }) : [
      { label: '전체', list: mix(['패딩', '자켓', '조끼', '맨투맨 티셔츠', '후드 티셔츠', '카라 티셔츠', '바지', '라운드 티셔츠'], 10) },
      { label: '티셔츠', list: mix(['라운드 티셔츠', '카라 티셔츠'], 10) }, { label: '맨투맨 · 후드', list: mix(['맨투맨 티셔츠', '후드 티셔츠'], 10) },
      { label: '조끼', list: mix(['조끼'], 10) }, { label: '자켓', list: mix(['자켓'], 10) }, { label: '패딩', list: mix(['패딩'], 10) }, { label: '바지', list: mix(['바지'], 10) }
    ];
    tabs = tabs.filter(function (t) { return t.list.length; }); if (!tabs.length) return;
    tabsEl.insertAdjacentHTML('beforeend', tabs.map(function (t, i) { return '<button type="button" class="tab" role="tab" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + ' aria-controls="rkRail" data-tab="' + i + '">' + esc(t.label) + '</button>'; }).join(''));
    var pages = -1, per = 5, unit = 1;
    var ctl = dragRail(rail, { prev: $('#rkPrev'), next: $('#rkNext'), page: true, onSync: function (st) {
      per = st.per; unit = st.step;
      if (st.w) stage.style.setProperty('--ah', st.w + 'px');
      var n = Math.max(1, Math.ceil(st.n / st.per));
      if (n !== pages) { pages = n; pagesEl.innerHTML = n > 1 ? Array.apply(null, Array(n)).map(function (_, i) { return '<button type="button" class="rk__pg" data-p="' + i + '" aria-label="' + (i + 1) + '번째 묶음 보기"></button>'; }).join('') : ''; }
      var cur = st.max > 0 ? Math.round(rail.scrollLeft / st.max * (n - 1)) : 0;
      [].forEach.call(pagesEl.children, function (b, i) { b.classList.toggle('is-on', i === cur); });
    } });
    pagesEl.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.rk__pg'); if (!b) return;
      railTo(rail, +b.dataset.p * per * unit);
    });
    function show(i, first) {
      railStop(rail, false);
      var cards = renderGrid(rail, tabs[i].list, { rank: true, fid: 'rk-' }); ctl.warm();
      rail.scrollLeft = 0; pages = -1; ctl.sync();
      if (first) reveal(cards, rail, true);
      else if (motion) gsap.fromTo(cards, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .04, ease: 'power4.out', clearProps: 'transform,opacity' });
    }
    show(0, true);
    lineTabs(tabsEl, function (k) { show(+k); });
  })();

  /* ============================================================
     3. 겨울 시즌 상품 줄: 시간이 지나면 한 칸씩 오른쪽 상품으로 넘어가고 끝없이 돈다(같은 목록을 두 번 놓고 절반을 넘으면 처음으로 되돌린다).
     마우스를 올리거나, 손을 대거나, 포커스가 있거나, 멈춤 버튼을 누르면 멈춘다. 움직임 줄이기 설정이면 자동으로 넘기지 않는다
     ============================================================ */
  var SEASON = ['m465', 'c464', 'c472', 'm206', 'm194', 'c197', 'm475', 'c203'];
  (function () {
    var rail = $('#ssRail'); if (!rail) return;
    var list = pick(SEASON), n = list.length; if (!n) return;
    var cards = renderGrid(rail, list.concat(list), { kind: '시즌', fid: 'ss-' });
    cards.slice(n).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); $$('a,button', c).forEach(function (x) { x.tabIndex = -1; }); });
    var prog = $('#ssProg'), now = $('#ssNow'), tot = $('#ssTot'), auto = $('#ssAuto'), U = 0;
    if (tot) tot.textContent = ('0' + n).slice(-2);
    function unit() { return U || (U = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(rail).columnGap) || 16)); } // 한 칸 폭은 재 두고 쓴다(화면 폭이 바뀌면 다시 잰다)
    function norm() { var h = unit() * n; if (rail.scrollLeft >= h - 1) rail.scrollLeft -= h; }
    function paint() { var i = Math.round(rail.scrollLeft / unit()) % n; if (prog) prog.style.transform = 'scaleX(' + ((i + 1) / n).toFixed(4) + ')'; if (now) now.textContent = ('0' + (i + 1)).slice(-2); }
    rail.addEventListener('scroll', function () { if (!rail._sl) norm(); paint(); }, { passive: true });
    window.addEventListener('resize', function () { U = 0; paint(); });
    function go(d) {
      var u = unit(), h = u * n, s = rail.scrollLeft, c = railX(rail);
      // 같은 목록을 두 번 놓았으므로 h만큼 옮겨도 그림은 같다. 넘기는 중(c ≠ 0)에도 보이는 자리가 목록을 벗어나지 않을 때만 옮긴다
      if (s - c >= h - 1) rail.scrollLeft = s = s - h;
      else if (d < 0 && s < u * .5) rail.scrollLeft = s = s + h;
      railTo(rail, (Math.round(s / u) + d) * u, { dur: 820, ease: EASE_IO, done: function () { norm(); paint(); } });
    }
    dragRail(rail, { onRest: function () { norm(); paint(); } });
    var hold = false, userOff = false, inView = false, touchT = 0, timer = 0, GAP = 3200;
    function tick() { clearTimeout(timer); if (reduce) return; timer = setTimeout(function () { if (!userOff && !hold && inView && !document.hidden && !rail._sl && !rail.classList.contains('is-reveal') && locks === 0) go(1); tick(); }, GAP); }
    rail.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold = true; });
    rail.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hold = false; });
    rail.addEventListener('focusin', function () { hold = true; }); rail.addEventListener('focusout', function () { hold = false; });
    rail.addEventListener('touchstart', function () { hold = true; clearTimeout(touchT); }, { passive: true });
    rail.addEventListener('touchend', function () { clearTimeout(touchT); touchT = setTimeout(function () { hold = false; }, 4500); }, { passive: true });
    $('#ssPrev').addEventListener('click', function () { go(-1); tick(); });
    $('#ssNext').addEventListener('click', function () { go(1); tick(); });
    if (auto) {
      if (reduce) auto.hidden = true;
      auto.addEventListener('click', function () {
        userOff = !userOff; auto.setAttribute('aria-pressed', String(userOff));
        auto.setAttribute('aria-label', userOff ? '상품 자동 넘김 다시 시작' : '상품 자동 넘김 멈춤');
        rail.parentNode.classList.toggle('is-auto-off', userOff);
      });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: .4 }).observe(rail); else inView = true;
    tick(); paint(); reveal(cards.slice(0, 6), rail, true);
  })();

  /* ============================================================
     4. 파트너 브랜드 (v9): 움직이는 배너. 이전 On Site(현장별 착용 상품)의 사진·착용 상품을 브랜드별 장면으로 옮겼다.
     장면 = 사진 + 글(브랜드 라벨 · 제목 · 브랜드 상품 보기) + 사진 위 흰 사각형(상품 자리) + 착용 상품 칸.
     흰 사각형에서 착용 상품 칸까지 한 번 꺾이는 흰 선으로 잇는다(PC: 세로 → 가로로 옆 칸에 / 폰: 가로 → 세로로 아래 칸에).
     시간이 지나면 다음 장면으로 넘어간다. 마우스를 올리거나 포커스가 있거나 멈춤을 누르면 멈춘다. 움직임 줄이기 설정이면 자동으로 넘기지 않는다.
     items = [상품 키, PC 사진(2048×1152) 안 x, y, 폰 사진(1000×1250) 안 x, y] (0~1). 사진 속 인물이 실제로 입거나 쓴 상품만(근거는 v6·v7 On Site와 같다)
     ============================================================ */
  (function () {
    var sec = $('#partner'), frame = $('#pbFrame'), box = $('#pbSlides'); if (!sec || !frame || !box) return;
    var mq = window.matchMedia('(max-width: 768px)');
    var SL = (window.B2BT_PARTNER_DATA || [
      // K01: 집사님 착용 상품표로 확정(v6)
      { brand: 'k2', en: 'K2', ko: '케이투', title: '협력 브랜드 케이투의<br>방한 자켓', img: 'img/v6/k01.webp', imgM: 'img/v6/k01-m.webp', alt: '설산 능선을 오르는 짙은 회색 방한 자켓 차림의 남성', side: 'l', tags: 'top', items: [['b3026', .455, .6, .44, .58]] },
      // 제조(9차_I02): 상세 사진과 눈으로 대조(작업복 = 에이스 ACE-S315, 안전모 = 쎄다 VISUAL). 집사님 확인 대상
      { brand: 'ace', en: 'ACE · SSEDA', ko: '에이스', title: '제조 · 설비 현장의<br>에이스 작업복', img: 'img/v9/pb-plant.webp', imgM: 'img/v9/pb-plant-m.webp', alt: '공장에서 부품을 살피는 남색 상하일체형 작업복과 회색 안전모 차림의 작업자', side: 'l', tags: 'mid', act: 1, items: [['b2305', .522, .115, .35, .115], ['b1420', .622, .66, .57, .62]] },
      // 야외(W01): 집사님 착용 상품표로 확정(상의만)
      { brand: 'tbuc', en: 'T-BUC', ko: '티뷰크', title: '야외 · 방한 현장의<br>티뷰크 방한 자켓', img: 'img/v9/pb-outdoor.webp', imgM: 'img/v9/pb-outdoor-m.webp', alt: '설산에서 주황색 반사띠 방한 자켓을 입은 작업자', side: 'l', tags: 'top', items: [['b2041', .645, .52, .62, .52]] },
      // 건설(F04) 장면은 2026-11-15 집사님 지시로 뺌(사진 img/v9/pb-build*.webp는 남겨 둠)
      // 목공(8차_R050): 팔 포켓·패치·가슴 로고가 JK-F6101 상세 사진과 같음. 집사님 확인 대상
      { brand: 'k2', en: 'K2', ko: '케이투', title: '목공 · 인테리어 현장의<br>케이투 방한 자켓', img: 'img/v9/pb-wood.webp', imgM: 'img/v9/pb-wood-m.webp', alt: '목재를 자르는 짙은 회색 방한 자켓 차림의 작업자', side: 'r', tags: 'top', items: [['b3026', .34, .47, .43, .47]] }
    ]).map(function (s) { s.items = s.items.filter(function (it) { return P[it[0]]; }); return s; });
    var N = SL.length; if (!N) return;
    var ARW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    function two(n) { return ('0' + n).slice(-2); }
    function burl(k) { var b = BR.filter(function (x) { return x.key === k; })[0]; return b ? 'brand.php?cat=' + encodeURIComponent(b.en + ' ' + b.ko) : 'brand.php'; }

    box.innerHTML = SL.map(function (s, i) {
      return '<article class="pbs' + (s.side === 'r' ? ' pbs--r' : '') + '" data-i="' + i + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + N + ' · ' + esc(s.en) + '">' +
        '<div class="pbs__stage">' +
        '<div class="pbs__media"><picture><source media="(max-width:768px)" srcset="' + s.imgM + '" width="1000" height="1250"><img src="' + s.img + '" width="2048" height="1152" alt="' + esc(s.alt) + '" decoding="async" draggable="false" data-slot="partner-' + i + '" data-temp="ai"' + (i ? ' loading="lazy"' : '') + '></picture></div>' +
        '<div class="pbs__shade"></div>' +
        '<svg class="pbs__lines" aria-hidden="true" focusable="false">' + s.items.map(function (_, n) { return '<g data-n="' + n + '"><polyline class="pbl--u" pathLength="1"/><polyline class="pbl--w" pathLength="1"/></g>'; }).join('') + '</svg>' +
        s.items.map(function (it, n) { var p = P[it[0]]; return '<button type="button" class="spot pbs__pin" data-n="' + n + '" aria-label="' + esc(p.name) + ' 빠른 보기"><span class="spot__dot"></span></button>'; }).join('') +
        '<div class="pbs__tags pbs__tags--' + (s.tags || 'mid') + '">' + s.items.map(function (it, n) {
          var p = P[it[0]];
          return '<div class="pbt" data-n="' + n + '"><button type="button" class="pbt__img" aria-label="' + esc(p.name) + ' 빠른 보기"><img src="' + p.imgs[0] + '" width="144" height="144" alt="" loading="lazy" decoding="async" draggable="false"></button>' +
            '<div class="pbt__b"><p class="pbt__k">착용 상품 · ' + esc(p.tag) + '</p><a class="pbt__n" href="#" data-href="product.php?id=' + p.id + '">' + esc(p.name) + '</a>' +
            '<div class="pbt__acts"><button type="button" class="pbt__q">빠른 보기</button><button type="button" class="pbt__c" aria-label="' + esc(p.name) + ' 장바구니에 담아 견적 문의">담기 +</button></div></div></div>';
        }).join('') + '</div>' +
        '</div>' +
        '<div class="pbs__copy"><p class="bn__en">Partner Brand · ' + esc(s.en) + '</p><h3 class="pbs__t">' + s.title + '</h3>' +
        '<a class="bt bt--wh" href="#" data-href="' + burl(s.brand) + '"><span>' + esc(s.ko) + ' 상품 보기</span><i>' + ARW + '</i></a></div></article>';
    }).join('');

    var slides = $$('.pbs', box), barsEl = $('#pbBars'), nowEl = $('#pbNow'), totEl = $('#pbTot'), cur = -1;
    if (totEl) totEl.textContent = two(N);
    barsEl.innerHTML = SL.map(function (s, i) { return '<button type="button" class="pb__bar" data-i="' + i + '" aria-label="' + (i + 1) + '번째 배너 · ' + esc(s.en) + '"><i></i></button>'; }).join('');
    var bars = $$('.pb__bar', barsEl), fills = bars.map(function (b) { return $('i', b); });

    // 사각형 자리와 선: 사진이 틀을 꽉 채우며 잘리는 만큼(object-fit:cover) 보정해 놓는다
    function layout(i) {
      var s = SL[i], el = slides[i], stage = $('.pbs__stage', el), W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
      var m = mq.matches, iw = m ? 1000 : 2048, ih = m ? 1250 : 1152, sc = Math.max(W / iw, H / ih), ox = (W - iw * sc) / 2, oy = (H - ih * sc) / 2;
      // 폰: 착용 상품 칸의 자리(--tag-b = 틀 아래에서 띄우는 거리). 보통은 조작 줄 바로 위(60px).
      // 그 자리에 사각형이 하나라도 있으면 칸이 사각형을 덮지 않게 그 사각형 바로 위로 올린다(뺀 건설 장면의 바지 때문에 넣은 장치. 지금 장면에는 해당 없음). 장면마다 정해지고, 고른 상품이 바뀌어도 움직이지 않는다
      var tagsEl = $('.pbs__tags', el), tb = 60;
      if (m && tagsEl) {
        var at = $('.pbt.is-act', el), th = (at && at.offsetHeight) || 72, ys = s.items.map(function (it) { return oy + ih * sc * it[4]; }), guard = 0, hit = true;
        while (hit && guard++ < 4) {
          hit = false;
          ys.forEach(function (y) { if (y > H - tb - th - 18 && y < H - tb + 12) { tb = Math.round(H - y + 26); hit = true; } });
        }
      }
      if (tagsEl) { if (m && tb !== 60) tagsEl.style.setProperty('--tag-b', tb + 'px'); else tagsEl.style.removeProperty('--tag-b'); }
      s.items.forEach(function (it, n) {
        var px = ox + iw * sc * (m ? it[3] : it[1]), py = oy + ih * sc * (m ? it[4] : it[2]);
        var pin = $('.pbs__pin[data-n="' + n + '"]', el), tag = $('.pbt[data-n="' + n + '"]', el), g = $('.pbs__lines g[data-n="' + n + '"]', el), tags = tag.parentNode;
        pin.style.left = px.toFixed(1) + 'px'; pin.style.top = py.toFixed(1) + 'px';
        if (!tag.offsetWidth) { g.classList.add('is-off'); return; }
        g.classList.remove('is-off');
        var T = { l: tags.offsetLeft + tag.offsetLeft, t: tags.offsetTop + tag.offsetTop }; T.r = T.l + tag.offsetWidth; T.b = T.t + tag.offsetHeight;
        var my = (T.t + T.b) / 2, pts, ax;
        if (m) { ax = px < W / 2 ? T.l + 16 : T.r - 16; if (Math.abs(ax - px) < 28) ax = px < W / 2 ? T.r - 16 : T.l + 16; pts = [[px, py], [ax, py], [ax, py < T.t ? T.t : T.b]]; }
        else if (px < T.l) pts = [[px, py], [px, my], [T.l, my]];
        else if (px > T.r) pts = [[px, py], [px, my], [T.r, my]];
        else { ax = (px - T.l > T.r - px) ? T.l + 18 : T.r - 18; pts = [[px, py], [ax, py], [ax, py < T.t ? T.t : T.b]]; }
        var str = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
        $$('polyline', g).forEach(function (pl) { pl.setAttribute('points', str); });
      });
    }

    // 장면별: 사각형 ↔ 칸 서로 강조, 빠른 보기, 담기. 폰에서는 칸을 한 번에 하나만 보이고 사각형을 누르면 그 칸으로 바뀐다
    slides.forEach(function (el, i) {
      var s = SL[i], act = Math.min(s.act || 0, s.items.length - 1);
      function setAct(n) {
        act = n;
        $$('.pbt', el).forEach(function (t) { t.classList.toggle('is-act', +t.dataset.n === n); });
        $$('.pbs__pin', el).forEach(function (p) { p.classList.toggle('is-act', +p.dataset.n === n); });
        if (i === cur) layout(i);
      }
      s.items.forEach(function (it, n) {
        var key = it[0], p = P[key], pin = $('.pbs__pin[data-n="' + n + '"]', el), tag = $('.pbt[data-n="' + n + '"]', el), g = $('.pbs__lines g[data-n="' + n + '"]', el);
        function hot(v) { tag.classList.toggle('is-hot', v); pin.classList.toggle('is-on', v); $$('.pbs__lines g', el).forEach(function (x) { x.classList.toggle('is-dim', v && x !== g); }); }
        [pin, tag].forEach(function (x) {
          x.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hot(true); }); x.addEventListener('pointerleave', function () { hot(false); });
          x.addEventListener('focusin', function () { hot(true); }); x.addEventListener('focusout', function () { hot(false); });
        });
        pin.addEventListener('click', function () { if (mq.matches && act !== n) { setAct(n); return; } QV.open(key, pin); });
        $('.pbt__img', tag).addEventListener('click', function () { QV.open(key, this); });
        $('.pbt__q', tag).addEventListener('click', function () { QV.open(key, this); });
        $('.pbt__c', tag).addEventListener('click', function () { fly($('.pbt__img img', tag), function () { Bag.add(key, 1, p.imgs[0]); }); });
      });
      setAct(act);
    });

    // 넘김
    var DUR = 6500, elapsed = 0, userOff = false, hover = false, focus = false, inView = false, touchT = 0, touchHold = false;
    function held() { return userOff || hover || focus || touchHold || !inView || document.hidden || locks > 0 || !sec.classList.contains('is-open'); }
    function paintBars() {
      fills.forEach(function (f, k) { f.style.transform = 'scaleX(' + (k < cur ? 1 : k === cur ? (reduce || userOff ? 1 : Math.min(1, elapsed / DUR)).toFixed(4) : 0) + ')'; });
    }
    function show(i) {
      i = (i + N) % N; if (i === cur) return;
      cur = i; elapsed = 0;
      slides.forEach(function (el, k) { var on = k === i; el.classList.toggle('is-on', on); el.setAttribute('aria-hidden', String(!on)); if ('inert' in el) el.inert = !on; });
      layout(i);
      if (nowEl) nowEl.textContent = two(i + 1);
      bars.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      paintBars();
    }
    show(0);
    $('#pbPrev').addEventListener('click', function () { show(cur - 1); });
    $('#pbNext').addEventListener('click', function () { show(cur + 1); });
    bars.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    var auto = $('#pbAuto');
    if (reduce) { auto.hidden = true; frame.classList.add('is-static'); }
    auto.addEventListener('click', function () {
      userOff = !userOff; auto.setAttribute('aria-pressed', String(userOff));
      auto.setAttribute('aria-label', userOff ? '배너 자동 넘김 다시 시작' : '배너 자동 넘김 멈춤'); paintBars();
    });
    frame.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    frame.addEventListener('pointerleave', function () { hover = false; });
    frame.addEventListener('focusin', function () { focus = true; }); frame.addEventListener('focusout', function (e) { if (!frame.contains(e.relatedTarget)) focus = false; });
    // 손으로 넘기기(폰): 옆으로 48px 이상 밀면 한 장
    var tx = null, ty = 0;
    frame.addEventListener('touchstart', function (e) { var t = e.touches[0]; tx = t.clientX; ty = t.clientY; touchHold = true; clearTimeout(touchT); }, { passive: true });
    frame.addEventListener('touchend', function (e) {
      clearTimeout(touchT); touchT = setTimeout(function () { touchHold = false; }, 4500);
      if (tx === null) return; var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: .45 }).observe(frame); else inView = true;
    if (!reduce) {
      var last = performance.now();
      (function tick(t) {
        var dt = Math.min(100, t - last); last = t;
        if (!held()) { elapsed += dt; if (elapsed >= DUR) show(cur + 1); else paintBars(); }
        requestAnimationFrame(tick);
      })(last);
    }
    var rT = 0;
    function relayout() { clearTimeout(rT); rT = setTimeout(function () { if (cur >= 0) layout(cur); }, 60); }
    window.addEventListener('resize', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    window.addEventListener('load', relayout);

    // 스크롤하면 틀이 화면 끝까지 열린다(v6 케이투 배너의 장치 그대로)
    if (motion) {
      gsap.fromTo(frame, { clipPath: 'inset(10% 7% 10% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 90%', end: 'top 16%', scrub: .5, onUpdate: function (st) { sec.classList.toggle('is-open', st.progress > .7); } } });
    } else sec.classList.add('is-open');
  })();

  /* ============================================================
     5 ~ 7. 상품 섹션(겨울 아우터 · 협력브랜드 · 후드·맨투맨) + 바텀 헤더 (v9)
     바텀 헤더(.bh) = 섹션마다 하나씩 있는 선택 줄. 섹션 안에서는 헤더 바로 아래에 붙어 따라오고(position:sticky),
     섹션을 벗어나면 다음 섹션의 것이 그 자리에 온다. 그래서 상품을 한참 내려 보다가도 다른 분류·브랜드로 바로 바꿀 수 있다.
     탭을 바꾸면 상품 줄의 처음이 바텀 헤더 바로 아래로 오게 올려 준다.
     폰에서는 바텀 헤더 오른쪽의 버튼으로 한 줄에 1개 / 2개 보기를 고른다(페이지 전체에 같이 적용, 저장).
     ============================================================ */
  var Cols = (function () {
    var KEY = 'b2bt-v9-cols', v = root.getAttribute('data-cols') === '1' ? '1' : '2', subs = [];
    root.setAttribute('data-cols', v);
    return {
      get: function () { return v; },
      set: function (n) { if (n === v) return; v = n; root.setAttribute('data-cols', v); try { localStorage.setItem(KEY, v); } catch (e) {} subs.forEach(function (f) { f(v); }); },
      on: function (f) { subs.push(f); f(v); }
    };
  })();
  var VIEW = {
    1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5" width="13" height="14" rx="2"/></svg>',
    2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="6.5" height="14" rx="1.6"/><rect x="13.5" y="5" width="6.5" height="14" rx="1.6"/></svg>'
  };
  var bhEls = [];
  function goY(y) { y = Math.max(0, y); if (lenis) lenis.scrollTo(y, { duration: .7 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }
  function jumpBy(d) { var y = window.pageYOffset + d; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }
  function bottomHeader(el, labels, onSelect) {
    el.innerHTML = '<div class="bh__in"><div class="bh__scroll"><div class="bh__list" role="tablist" aria-label="' + esc(el.getAttribute('aria-label') || '분류') + '">' +
      labels.map(function (l, i) { return '<button type="button" class="bh__tab" role="tab" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + ' data-i="' + i + '">' + l + '</button>'; }).join('') + '</div></div>' +
      '<div class="bh__view" role="group" aria-label="상품 보기 방식"><button type="button" class="bh__vb" data-cols="1" aria-label="한 줄에 1개씩 보기">' + VIEW[1] + '</button><button type="button" class="bh__vb" data-cols="2" aria-label="한 줄에 2개씩 보기">' + VIEW[2] + '</button></div></div>';
    el.removeAttribute('aria-label');
    var tabs = $$('.bh__tab', el), sc = $('.bh__scroll', el), sec = el.closest('section'), cur = 0;
    function into(t) { // 고른 탭이 줄 안에서 보이게
      var a = t.getBoundingClientRect(), b = sc.getBoundingClientRect(), d = a.left < b.left + 8 ? a.left - b.left - 28 : a.right > b.right - 8 ? a.right - b.right + 28 : 0;
      if (d) sc.scrollBy({ left: d, behavior: reduce ? 'auto' : 'smooth' });
    }
    function select(i, user, focus) {
      cur = i;
      tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) tabs[i].focus({ preventScroll: true });
      into(tabs[i]); onSelect(i, !!user);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (i !== cur) select(i, true); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (k < 0) return; e.preventDefault(); select(k, true, true);
      });
    });
    // 1개 / 2개 보기: 바꿔도 보고 있던 상품이 같은 자리에 있게 스크롤을 맞춘다
    $$('.bh__vb', el).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.cols === Cols.get()) return;
        var line = el.getBoundingClientRect().bottom + 8, anchor = null, off = 0;
        $$('.pc', sec).some(function (c) { var r = c.getBoundingClientRect(); if (r.bottom > line) { anchor = c; off = r.top; return true; } return false; });
        Cols.set(b.dataset.cols);
        if (anchor) { var d = anchor.getBoundingClientRect().top - off; if (Math.abs(d) > 1) jumpBy(d); }
        if (hasG) ScrollTrigger.refresh();
      });
    });
    Cols.on(function (v) { $$('.bh__vb', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cols === v)); }); });
    bhEls.push(el);
    return { select: select, el: el };
  }
  // 붙어 있는지 표시(그림자). 탭을 바꿨을 때 상품 처음으로 올리는 기준도 여기서 잰다
  function bhSync() {
    bhEls.forEach(function (el) {
      var top = parseFloat(getComputedStyle(el).top) || 0, r = el.getBoundingClientRect(), pr = el.parentNode.getBoundingClientRect();
      el.classList.toggle('is-stuck', r.top <= top + 1 && pr.bottom > top + r.height + 1 && pr.top < top - 1);
    });
  }
  var bhRaf = 0;
  function bhReq() { if (!bhRaf) bhRaf = requestAnimationFrame(function () { bhRaf = 0; bhSync(); }); }
  window.addEventListener('scroll', bhReq, { passive: true }); window.addEventListener('resize', bhReq);
  function snapTop(sec, bh) {
    var body = $('.psec__body', sec), head = $('#siteHead'); if (!body) return;
    var want = (head ? head.offsetHeight : 0) + bh.offsetHeight + (window.innerWidth <= 768 ? 10 : 0), top = body.getBoundingClientRect().top;
    if (top < want - 2) goY(window.pageYOffset + top - want);
  }
  function enc(s) { return encodeURIComponent(s); }
  var refT = 0;
  function refresh() { if (!hasG) return; clearTimeout(refT); refT = setTimeout(function () { ScrollTrigger.refresh(); }, 700); }
  function swap(cards, first, grid) {
    if (first) reveal(cards, grid);
    else if (motion) gsap.fromTo(cards, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .04, ease: 'power4.out', clearProps: 'transform,opacity' });
  }

  // 겨울 아우터 · 후드·맨투맨: 2026-11-14 시안 F의 구성(상품과 순서 그대로). 겨울 아우터는 첫 상품을 크게 놓는다
  var SHOP = {
    outer: { kind: '시즌', feat: true, tabs: [
      { label: '패딩', keys: ['c455', 'c449', 'c472', 'c453', 'c458'], more: ['패딩 전체 보기', 'category.php?cat=' + enc('패딩')] },
      { label: '겨울조끼', keys: ['c202', 'c195', 'c200', 'c201', 'c204'], more: ['겨울조끼 전체 보기', 'category.php?cat=' + enc('조끼') + '&sub=' + enc('겨울조끼')] },
      { label: '플리스 자켓', keys: ['c403', 'c408', 'c412', 'c416', 'c418'], more: ['플리스 자켓 전체 보기', 'category.php?cat=' + enc('자켓') + '&sub=' + enc('플리스 자켓')] }
    ] },
    hood: { tabs: [
      { label: '후드', keys: ['c426', 'c440', 'c444', 'c433'], more: ['후드 티셔츠 전체 보기', 'category.php?cat=' + enc('후드 티셔츠')] },
      { label: '맨투맨', keys: ['c226', 'c224', 'c228', 'c225'], more: ['맨투맨 티셔츠 전체 보기', 'category.php?cat=' + enc('맨투맨 티셔츠')] }
    ] }
  };
  Object.keys(SHOP).forEach(function (id) {
    var cfg = SHOP[id], sec = $('#' + id); if (!sec) return;
    var bhEl = $('[data-bh]', sec), grid = $('[data-grid]', sec), more = $('[data-more]', sec);
    var tabs = cfg.tabs.map(function (t) { return { label: t.label, list: pick(t.keys), more: t.more }; }).filter(function (t) { return t.list.length; });
    if (!tabs.length || !bhEl || !grid) return;
    var first = true;
    bottomHeader(bhEl, tabs.map(function (t) { return esc(t.label); }), function (i, user) {
      var t = tabs[i], cards = renderGrid(grid, t.list, { kind: cfg.kind, fid: id + '-', feat: cfg.feat });
      if (more) { more.textContent = t.more[0]; more.setAttribute('data-href', t.more[1]); }
      swap(cards, first, grid); first = false;
      if (user) snapTop(sec, bhEl);
      refresh();
    }).select(0);
  });

  // 협력브랜드 9곳: 브랜드를 바텀 헤더에서 고른다. 상품은 2026-11-11·14 noeul.shop 브랜드 목록 앞쪽 8개(js/brands.js)
  (function () {
    var sec = $('#brands'); if (!sec || !BR.length) return;
    var bhEl = $('[data-bh]', sec), grid = $('[data-grid]', sec), more = $('[data-more]', sec); if (!bhEl || !grid) return;
    var order = ['k2', 'eider'], list = order.map(function (k) { return BR.filter(function (b) { return b.key === k; })[0]; }).filter(Boolean)
      .concat(BR.filter(function (b) { return order.indexOf(b.key) < 0; }));
    var first = true;
    bottomHeader(bhEl, list.map(function (b) { return '<span class="bh__en">' + esc(b.en) + '</span><small>' + esc(b.ko) + '</small>'; }), function (i, user) {
      var b = list[i], url = 'brand.php?cat=' + enc(b.en + ' ' + b.ko);
      var logo = $('#brLogo'); logo.src = 'img/brands/' + b.key + '.webp'; logo.width = b.w; logo.height = b.h; logo.alt = b.en;
      $('#brName').textContent = b.en; $('#brKo').textContent = b.ko; $('#brCnt').textContent = fmt(b.count);
      $('#brAllTxt').textContent = b.ko + ' 상품 전체 보기'; $('#brAll').setAttribute('data-href', url);
      if (more) { more.textContent = b.ko + ' 상품 전체 보기'; more.setAttribute('data-href', url); }
      var cards = renderGrid(grid, b.items.slice(0, 8).map(function (d) { return P['b' + d.id]; }).filter(Boolean), { fid: 'br-' });
      swap(cards, first, grid);
      if (motion && !first) gsap.fromTo($('#brInfo'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity' });
      first = false;
      if (user) snapTop(sec, bhEl);
      refresh();
    }).select(0);
  })();
  bhSync();

  /* ============================================================
     장바구니
     ============================================================ */
  var Bag = (function () {
    var el = $('#bag'), listEl = $('#bagList'), sumEl = $('#bagSum'), cntEl = $('#bagCount'), fab = $('#bagFab'), toast = $('#toast');
    var items = [], lastFocus = null, toastT = 0;
    try { items = JSON.parse(read('b2bt-v4-bag') || '[]').filter(function (x) { return P[x.key]; }); } catch (e) { items = []; }
    var headBtns = $$('.hd__icon[aria-label="장바구니"], .mh__btn[aria-label="장바구니"]');
    headBtns.forEach(function (b) {
      b.style.position = 'relative';
      b.insertAdjacentHTML('beforeend', '<span class="badge num" aria-hidden="true"></span>');
      b.setAttribute('aria-haspopup', 'dialog');
      b.addEventListener('click', function (e) { e.preventDefault(); open(b); });
    });
    fab.addEventListener('click', function () { open(fab); });
    function total() { return items.reduce(function (n, x) { return n + x.qty; }, 0); }
    function save() { store('b2bt-v4-bag', JSON.stringify(items)); }
    function paint(bump) {
      var n = total();
      $$('.badge').forEach(function (b) {
        b.textContent = n; b.classList.toggle('is-on', n > 0);
        if (bump && motion && n > 0) gsap.fromTo(b, { scale: 0 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' });
      });
      fab.classList.toggle('is-on', n > 0);
      fab.setAttribute('aria-label', '장바구니 ' + n + '개');
      cntEl.textContent = ('0' + n).slice(-2); sumEl.textContent = n;
      listEl.innerHTML = items.length ? items.map(function (x) {
        var p = P[x.key];
        return '<div class="bitem" data-key="' + x.key + '"><img src="' + x.img + '" alt="" width="88" height="88"><div><p class="bitem__name">' + esc(p.name) + '</p><p class="bitem__price num">' + esc(p.price) + '</p>' +
          '<div class="bitem__row"><span class="qty"><button type="button" data-q="-1" aria-label="수량 줄이기">−</button><output aria-live="polite">' + x.qty + '</output><button type="button" data-q="1" aria-label="수량 늘리기">+</button></span><button type="button" class="bitem__del">삭제</button></div></div></div>';
      }).join('') : '<p class="bag__empty">장바구니에 담은 상품이 없습니다.</p>';
    }
    listEl.addEventListener('click', function (e) {
      var row = e.target.closest('.bitem'); if (!row) return;
      var x = items.filter(function (i) { return i.key === row.dataset.key; })[0]; if (!x) return;
      var qb = e.target.closest('[data-q]');
      if (qb) { x.qty = Math.max(1, Math.min(999, x.qty + (+qb.dataset.q))); save(); $('output', row).textContent = x.qty; var n = total(); cntEl.textContent = ('0' + n).slice(-2); sumEl.textContent = n; $$('.badge').forEach(function (b) { b.textContent = n; }); return; }
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
      var p = P[k]; key = k; lastFocus = from || document.activeElement;
      gal.innerHTML = p.imgs.map(function (s, i) { return '<img src="' + s + '" alt="' + (i ? '' : esc(p.name)) + '"' + (i ? '' : ' class="is-on"') + '>'; }).join('');
      thumbs.innerHTML = p.imgs.map(function (s, i) { return '<button type="button" class="qv__thumb' + (i ? '' : ' is-on') + '" aria-pressed="' + (i ? 'false' : 'true') + '" aria-label="사진 ' + (i + 1) + '" data-i="' + i + '"><img src="' + s + '" alt=""></button>'; }).join('');
      $('#qvCat').textContent = p.tag; $('#qvName').textContent = p.name; $('#qvCode').textContent = p.code; $('#qvPrice').textContent = p.price; $('#qvSize').textContent = p.size;
      var col = p.dots.map(function (d) { return '<span class="dot" style="--c:' + d.hex + '"' + (d.label ? ' title="' + esc(d.label) + '"' : '') + '></span>'; }).join('') + (p.more ? '<span class="mono">' + esc(p.more) + '</span>' : '') + (p.colorText ? '<span>' + esc(p.colorText) + '</span>' : '');
      $('#qvColor').innerHTML = col; $('#qvColorRow').hidden = !col;
      $('#qvDetail').setAttribute('data-href', 'product.php?id=' + p.id);
      setQty(1);
      el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false'); locks++; syncLock();
      setTimeout(function () { $('.qv__close', el).focus(); }, 60);
      if (motion) gsap.fromTo($$('.qv__info>*', el), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .55, stagger: .05, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
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

  /* ---------- 검색 즉시 결과 ---------- */
  (function () {
    var input = $('.hd-search__input'), box = $('.hd-sx'); if (!input || !box) return;
    var keep = [].slice.call(box.children);
    var out = document.createElement('div'); out.className = 'sr'; out.hidden = true; out.setAttribute('aria-live', 'polite'); box.appendChild(out);
    var seen = {}, all = Object.keys(P).map(function (k) { return P[k]; }).filter(function (p) { if (seen[p.id]) return false; seen[p.id] = 1; return true; });
    function hl(t, q) { var i = t.toLowerCase().indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      keep.forEach(function (el) { el.hidden = !!q; }); out.hidden = !q;
      if (!q) return;
      var hit = all.filter(function (p) { return (p.name + ' ' + p.tag + ' ' + p.code).toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
      out.innerHTML = hit.length ? hit.map(function (p) {
        return '<a href="#" data-href="product.php?id=' + p.id + '"><img src="' + p.imgs[0] + '" alt="" width="56" height="56"><span><b>' + hl(p.name, q) + '</b><span class="num">' + esc(p.tag) + ' · ' + esc(p.price) + '</span></span></a>';
      }).join('') : '<p class="sr__none">찾는 상품이 없습니다.</p>';
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

  /* ============================================================
     10. 1:1 담당자 알림. 검수 상자에서 둘 다 / 접수 창만 / 안내 카드만 고른다. 담당자 문구를 끄면 둘 다 뜨지 않는다
     (가) 접수 확인 창: 장바구니 서랍의 "구매 목록으로 견적 문의"를 누르면 뜬다(시안이라 실제 전송 없음)
     (나) 안내 카드: 상품을 처음 담았을 때 또는 페이지의 40%를 지났을 때 한 번
     ============================================================ */
  (function () {
    var rc = $('#rcpt'), mg = $('#mgr'), quote = $('#bagQuote'); if (!rc || !mg) return;
    function mode() { return root.getAttribute('data-pop') || 'both'; }
    function claimOn() { return root.getAttribute('data-claim') !== 'off'; }
    function bagItems() { try { return JSON.parse(read('b2bt-v4-bag') || '[]'); } catch (e) { return []; } }
    var rcFocus = null;
    function rcOpen() { return rc.classList.contains('is-open'); }
    function openRc() {
      var items = bagItems(), co = Co.get();
      $('#rcWho').textContent = co ? co + ' ' : '';
      $('#rcKinds').textContent = items.length;
      $('#rcQty').textContent = items.reduce(function (n, x) { return n + (x.qty || 0); }, 0);
      hideMg();
      rcFocus = document.activeElement;
      rc.classList.add('is-open'); rc.setAttribute('aria-hidden', 'false'); locks++; syncLock();
      setTimeout(function () { $('.rc__ok', rc).focus(); }, 80);
    }
    function closeRc() {
      if (!rcOpen()) return;
      rc.classList.remove('is-open'); rc.setAttribute('aria-hidden', 'true'); locks = Math.max(0, locks - 1); syncLock();
      if (rcFocus && rcFocus.focus) rcFocus.focus({ preventScroll: true });
    }
    $$('[data-rc-close]', rc).forEach(function (b) { b.addEventListener('click', closeRc); });
    if (quote) quote.addEventListener('click', function (e) {
      if (mode() === 'card' || !claimOn() || !bagItems().length) return;
      e.preventDefault(); Bag.close(); openRc();
    });
    document.addEventListener('keydown', function (e) {
      if (rcOpen()) {
        if (e.key === 'Escape') { e.stopPropagation(); closeRc(); return; }
        if (e.key !== 'Tab') return;
        var f = $$('button', rc).filter(function (x) { return x.offsetParent !== null; });
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      } else if (e.key === 'Escape' && mg.classList.contains('is-on') && mg.contains(document.activeElement)) hideMg();
    }, true);

    var shown = read('b2bt-v5-mgr') === '1';
    function showMg() {
      if (shown || mode() === 'rcpt' || !claimOn() || rcOpen() || QV.isOpen() || Bag.isOpen()) return;
      shown = true; store('b2bt-v5-mgr', '1');
      mg.classList.add('is-on'); mg.setAttribute('aria-hidden', 'false'); mgAuto();
    }
    var mgT = 0;
    function hideMg() { clearTimeout(mgT); mg.classList.remove('is-on'); mg.setAttribute('aria-hidden', 'true'); }
    // 닫지 않아도 15초 뒤에는 스스로 들어간다. 포인터를 올리거나 포커스가 있으면 기다린다
    function mgAuto() { clearTimeout(mgT); mgT = setTimeout(function () { if (mg.matches(':hover') || mg.contains(document.activeElement)) mgAuto(); else hideMg(); }, 15000); }
    $('#mgrClose').addEventListener('click', hideMg);
    // 처음 담았을 때: 담았다는 알림이 사라진 뒤에 띄운다
    var add0 = Bag.add;
    Bag.add = function () { add0.apply(null, arguments); if (!shown) setTimeout(showMg, 3000); };
    function onScroll() {
      if (shown) { window.removeEventListener('scroll', onScroll); return; }
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.pageYOffset / max >= .4) showMg();
    }
    window.addEventListener('scroll', onScroll, { passive: true });

  })();

  window.addEventListener('load', function () { if (hasG) ScrollTrigger.refresh(); });
})();
