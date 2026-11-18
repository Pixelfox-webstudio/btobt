/* 비투비티 홈 시안 v7 · v7.js (2026-11-12, v6.js에서 이어 고침)
   히어로(화면 쌓기 + 글자 3D 뒤집기) · 랭킹 · 겨울 시즌 · 케이투 배너 · 맞춤제작 · 3D 무대 · 장바구니 · 빠른 보기 · 검색은 v6 그대로.
   케이투 배너 아래를 새로 짬: MD 추천(붙은 면 + 두 묶음), 현장별 착용 상품(옆으로 넘어가는 룩북), Portfolio(로고 조명),
   진행순서(카드 쌓기) + 견적문의 배너, 협력브랜드(굴러가는 로고 칸), 품목별 보기(세로 조각). 예산별 · 단체복·작업복 · 카드 레일 섹션은 없앰.
   GSAP + ScrollTrigger + Flip + Lenis (스크립트 태그, 빌드 없음). 헤더는 기존 site.js가 맡는다. */
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
    var kind = opt.kind || '';
    var imgs = p.imgs.map(function (src, i) {
      return '<img' + (i ? ' data-src="' + src + '"' : ' class="is-on" src="' + src + '" loading="lazy" data-slot="' + p.slot + '"') + ' alt="' + (i ? '' : esc(p.name)) + '" width="600" height="600" decoding="async" draggable="false">';
    }).join('');
    var bars = p.imgs.length > 1 ? p.imgs.map(function (_, i) { return '<i' + (i ? '' : ' class="is-on"') + '></i>'; }).join('') : '';
    var dots = p.dots.map(function (d) {
      return d.i ? '<button type="button" class="dot" style="--c:' + d.hex + '" data-i="' + d.i + '" aria-label="' + esc(d.label) + ' 사진 보기"></button>' : '<span class="dot" style="--c:' + d.hex + '"></span>';
    }).join('') + (p.more ? '<span class="pc__swmore">' + esc(p.more) + '</span>' : '');
    var cat = [kind, p.tag].filter(Boolean).map(esc).join(' · ');
    var metas = [p.size, p.colorText].filter(Boolean).map(function (m) { return '<p class="pc__meta">' + esc(m) + '</p>'; }).join('');
    if (metas) metas = '<div class="pc__ms">' + metas + '</div>';
    return '<article class="pc' + (kind === '착용 상품' ? ' pc--worn' : '') + '" data-key="' + p.key + '"' + (p.brand ? ' data-brand="' + p.brand + '"' : '') + ' data-flip-id="' + (opt.fid || '') + p.key + '">' +
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
    grid.innerHTML = list.map(function (p, i) { return cardHTML(p, i + 1, { kind: typeof opt.kind === 'function' ? opt.kind(p, i) : opt.kind, fid: opt.fid, rank: opt.rank }); }).join('');
    var cards = $$('.pc', grid); cards.forEach(bindCard); return cards;
  }
  function reveal(cards, trigger, x) {
    if (!motion || !cards.length) return;
    var from = x ? { x: 100, opacity: 0 } : { y: 46, opacity: 0 };
    gsap.from(cards, Object.assign(from, { duration: .9, stagger: .06, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: trigger, start: 'top 86%', once: true } }));
  }
  // 옆으로 끄는 줄(v4 MD 추천의 동작을 그대로 함수로 뺌): 화살표, 마우스 끌기, 진행 막대
  function dragRail(rail, o) {
    o = o || {};
    function vis() { return $$('.pc', rail).filter(function (c) { return c.style.display !== 'none'; }); }
    function sync() {
      var max = rail.scrollWidth - rail.clientWidth, v = vis();
      if (o.prog) o.prog.style.transform = 'scaleX(' + Math.min(1, (rail.scrollLeft + rail.clientWidth) / Math.max(1, rail.scrollWidth)).toFixed(4) + ')';
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 16, step = v[0] ? v[0].offsetWidth + gap : 1;
      if (o.onSync) o.onSync({ step: step, per: Math.max(1, Math.floor((rail.clientWidth + gap + 2) / step)), max: max, n: v.length, w: v[0] ? v[0].offsetWidth : 0 });
      var seen = Math.min(v.length, Math.max(1, Math.round((rail.scrollLeft + rail.clientWidth - 40) / step)));
      if (o.now) o.now.textContent = ('0' + seen).slice(-2);
      if (o.tot) o.tot.textContent = ('0' + v.length).slice(-2);
      if (o.prev) o.prev.disabled = rail.scrollLeft < 4;
      if (o.next) o.next.disabled = rail.scrollLeft > max - 4;
    }
    rail.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync);
    function go(d) {
      var v = vis(), gap = parseFloat(getComputedStyle(rail).columnGap) || 16, unit = v[0] ? v[0].offsetWidth + gap : 300, per = o.page ? Math.max(1, Math.floor((rail.clientWidth + gap + 2) / unit)) : 2;
      var to = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, (o.page ? Math.round(rail.scrollLeft / unit) * unit : rail.scrollLeft) + d * unit * per));
      if (motion) gsap.to(rail, { scrollLeft: to, duration: .8, ease: 'power3.out', overwrite: true }); else rail.scrollLeft = to;
    }
    if (o.prev) o.prev.addEventListener('click', function () { go(-1); });
    if (o.next) o.next.addEventListener('click', function () { go(1); });
    var down = false, sx = 0, sl = 0, moved = 0, lastX = 0, lastT = 0, v = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
      down = true; sx = lastX = e.clientX; sl = rail.scrollLeft; moved = 0; v = 0; lastT = performance.now();
      if (window.gsap) gsap.killTweensOf(rail);
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
      if (moved > 6 && motion) gsap.to(rail, { scrollLeft: Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, rail.scrollLeft - v * 420)), duration: .9, ease: 'power3.out' });
      setTimeout(function () { rail.classList.remove('is-drag'); }, 0);
    });
    rail.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
    sync();
    return { sync: sync, reset: function () { if (motion) gsap.to(rail, { scrollLeft: 0, duration: .5, ease: 'power3.out' }); else rail.scrollLeft = 0; } };
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
      var to = Math.min(rail.scrollWidth - rail.clientWidth, +b.dataset.p * per * unit);
      if (motion) gsap.to(rail, { scrollLeft: to, duration: .8, ease: 'power3.out', overwrite: true }); else rail.scrollLeft = to;
    });
    function show(i, first) {
      if (window.gsap) gsap.killTweensOf(rail);
      var cards = renderGrid(rail, tabs[i].list, { rank: true, fid: 'rk-' });
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
    var prog = $('#ssProg'), now = $('#ssNow'), tot = $('#ssTot'), auto = $('#ssAuto'), tw = null;
    if (tot) tot.textContent = ('0' + n).slice(-2);
    function unit() { return cards[0].offsetWidth + (parseFloat(getComputedStyle(rail).columnGap) || 16); }
    function norm() { var h = unit() * n; if (rail.scrollLeft >= h - 1) rail.scrollLeft -= h; }
    function paint() { var i = Math.round(rail.scrollLeft / unit()) % n; if (prog) prog.style.transform = 'scaleX(' + ((i + 1) / n).toFixed(4) + ')'; if (now) now.textContent = ('0' + (i + 1)).slice(-2); }
    rail.addEventListener('scroll', function () { if (!tw) norm(); paint(); }, { passive: true });
    window.addEventListener('resize', paint);
    function go(d) {
      var u = unit();
      if (d < 0 && rail.scrollLeft < u * .5) rail.scrollLeft += u * n;
      var to = (Math.round(rail.scrollLeft / u) + d) * u;
      if (!motion) { rail.scrollLeft = to; norm(); paint(); return; }
      rail.classList.add('is-tween');
      tw = gsap.to(rail, { scrollLeft: to, duration: .9, ease: 'power3.inOut', overwrite: true,
        onComplete: function () { tw = null; rail.classList.remove('is-tween'); norm(); paint(); },
        onInterrupt: function () { tw = null; rail.classList.remove('is-tween'); } });
    }
    dragRail(rail, {});
    var hold = false, userOff = false, inView = false, touchT = 0, timer = 0, GAP = 3200;
    function tick() { clearTimeout(timer); if (reduce) return; timer = setTimeout(function () { if (!userOff && !hold && inView && !document.hidden && !tw && locks === 0) go(1); tick(); }, GAP); }
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
     4. 케이투 캠페인 사진(K01) 배너. 사진 속 자켓 = 케이투 JK-F6101(b3026, 집사님 확인 목록)
     스크롤하면 틀이 화면 끝까지 열리고(사진은 살짝 당겨졌다 제자리로), 커서를 따라 사진이 조금 움직여 깊이가 생긴다.
     자켓 위 점과 오른쪽 아래 착용 상품 카드는 빠른 보기로 이어진다
     ============================================================ */
  (function () {
    var sec = $('#k2'), frame = $('#kbFrame'), img = $('#kbImg'); if (!sec || !frame) return;
    var pin = $('#kbPin'), tag = $('#kbTag'), quick = $('#kbQuick'), KEY = 'b3026';
    if (!P[KEY]) { if (pin) pin.hidden = true; if (tag) tag.hidden = true; }
    // 점 위치: 사진 안 좌표(자켓 앞판)를 화면 크기에 맞춰 놓는다. object-fit:cover로 잘리는 만큼 보정
    var PT = { pc: [2048, 1152, .455, .6], m: [1000, 1250, .44, .58] };
    function place() {
      var d = window.innerWidth <= 768 ? PT.m : PT.pc, W = frame.clientWidth, H = frame.clientHeight, sc = Math.max(W / d[0], H / d[1]);
      pin.style.left = ((W - d[0] * sc) / 2 + d[0] * sc * d[2]) + 'px'; pin.style.top = ((H - d[1] * sc) / 2 + d[1] * sc * d[3]) + 'px';
    }
    place(); window.addEventListener('resize', place);
    function open(from) { if (P[KEY]) QV.open(KEY, from); }
    pin.addEventListener('click', function () { open(pin); });
    quick.addEventListener('click', function () { open(quick); });
    var kc = $('#kbCart'); if (kc) kc.addEventListener('click', function () { if (P[KEY]) Bag.add(KEY, 1, P[KEY].imgs[0]); });
    function link(a, b, cls) { ['pointerenter', 'focus'].forEach(function (ev) { a.addEventListener(ev, function () { b.classList.add(cls); }, true); }); ['pointerleave', 'blur'].forEach(function (ev) { a.addEventListener(ev, function () { b.classList.remove(cls); }, true); }); }
    link(pin, tag, 'is-hot'); link(tag, pin, 'is-on');
    if (motion) {
      var stg = { trigger: sec, start: 'top 90%', end: 'top 16%', scrub: .5 };
      gsap.fromTo(frame, { clipPath: 'inset(10% 7% 10% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: Object.assign({ onUpdate: function (st) { sec.classList.toggle('is-open', st.progress > .7); } }, stg) });
      gsap.fromTo($('picture', frame), { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: stg });
      if (fine) {
        var qx = gsap.quickTo(img, 'x', { duration: .9, ease: 'power3.out' }), qy = gsap.quickTo(img, 'y', { duration: .9, ease: 'power3.out' });
        var px = gsap.quickTo(pin, 'x', { duration: .9, ease: 'power3.out' }), py = gsap.quickTo(pin, 'y', { duration: .9, ease: 'power3.out' });
        var cx = gsap.quickTo($('.kb__copy', frame), 'x', { duration: 1.1, ease: 'power3.out' });
        frame.addEventListener('pointermove', function (e) {
          if (e.pointerType !== 'mouse') return;
          var r = frame.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
          qx(dx * -28); qy(dy * -18); px(dx * -28); py(dy * -18); cx(dx * 12);
        });
        frame.addEventListener('pointerleave', function () { qx(0); qy(0); px(0); py(0); cx(0); });
      }
    } else sec.classList.add('is-open');
  })();

  /* ============================================================
     5. MD 추천 (v7): 두 묶음. 묶음 안의 상품 사진은 한 종류만 쓴다(협력 브랜드 = 모델 착용 사진, 기본 품목 = 누끼).
     2026-11-12 임시 선정: 협력 브랜드 겨울 외투 6개(브랜드 목록과 착용 상품표에 있는 상품) / 계절과 관계없는 기본 품목 6개.
     PC에서는 왼쪽 면이 화면에 붙어 있고, 두 번째 묶음이 올라오면 스크롤에 맞춰 아래에서 위로 다음 면(큰 누끼)으로 넘어간다
     ============================================================ */
  var MDG = { a: ['b3257', 'b3227', 'b3001', 'b3022', 'b2746', 'b3023'], b: ['c328', 'c228', 'c426', 'c139', 'c482', 'c119'] };
  (function () {
    var ga = $('#mdGridA'), gb = $('#mdGridB'); if (!ga || !gb) return;
    reveal(renderGrid(ga, pick(MDG.a), { kind: 'MD 추천', fid: 'mda-' }), ga);
    reveal(renderGrid(gb, pick(MDG.b), { fid: 'mdb-' }), gb);
    var frame = $('#mkFrame'), fa = $('#mkA'), fb = $('#mkB'), ch1 = $('#mkCh1');
    if (!motion || !frame || !fb) return;
    gsap.matchMedia().add('(min-width: 901px)', function () {
      var ia = $('img', fa), ib = $('img', fb);
      gsap.fromTo(fb, { '--w': 0 }, { '--w': 1, ease: 'none', scrollTrigger: { trigger: ch1, start: 'top 84%', end: 'top 36%', scrub: .4 } });
      gsap.fromTo(ib, { scale: 1.26, yPercent: 10 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: ch1, start: 'top 84%', end: 'top 22%', scrub: .4 } });
      gsap.fromTo(ia, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#md', start: 'top 85%', end: 'top -20%', scrub: .5 } });
      if (!fine) return;
      var qx = gsap.quickTo(ia, 'x', { duration: .9, ease: 'power3.out' }), qy = gsap.quickTo(ia, 'y', { duration: .9, ease: 'power3.out' });
      function mv(e) { if (e.pointerType !== 'mouse') return; var r = frame.getBoundingClientRect(); qx(((e.clientX - r.left) / r.width - .5) * -18); qy(((e.clientY - r.top) / r.height - .5) * -14); }
      function out() { qx(0); qy(0); }
      frame.addEventListener('pointermove', mv); frame.addEventListener('pointerleave', out);
      return function () { frame.removeEventListener('pointermove', mv); frame.removeEventListener('pointerleave', out); };
    });
  })();

  /* ============================================================
     11. 맞춤제작: 회사 이름을 입력하면 실제 상품 가슴에 새겨지고 3D 조끼로 이어진다 (v4 첫 화면의 장치를 옮김)
     ============================================================ */
  (function () {
    var sec = $('#custom'); if (!sec) return;
    var garment = $('#opGarment'), emb = $('#opEmb'), field = $('#opField'), input = $('#opName'), mirror = $('#opMirror'), jo = $('#opJosa'), l2 = $('#opL2');
    // 실제 상품 4개. e = 가슴 로고 자리(사진 기준 %), f = 글자 크기 비율
    var G = [
      { key: 'c483', img: 'img/hero/g-483.webp', e: [62.5, 41, -1], f: .032 },
      { key: 'c199', img: 'img/hero/g-199.webp', e: [61, 38.5, 0], f: .03 },
      { key: 'c328', img: 'img/hero/g-328.webp', e: [62, 36.5, 0], f: .03 },
      { key: 'c426', img: 'img/hero/g-426.webp', e: [63, 47, -2], f: .03 }
    ].filter(function (g) { return P[g.key]; });
    var box = $('.op__g', garment), thumbs = $('#opThumbs'), gi = -1, seen = false, auto = 0;
    box.innerHTML = G.map(function (g, i) { return '<img src="' + (i ? '' : g.img) + '"' + (i ? ' data-src="' + g.img + '"' : ' loading="lazy"') + ' alt="' + (i ? '' : esc(P[g.key].name)) + '" width="1200" height="1200" decoding="async" draggable="false" data-slot="custom-garment-' + P[g.key].id + '">'; }).join('');
    thumbs.innerHTML = G.map(function (g, i) { return '<button type="button" class="op__thumb" aria-pressed="false" aria-label="' + esc(P[g.key].name) + '" data-i="' + i + '"><img src="img/catalog/' + P[g.key].id + '-f.webp" alt="" width="44" height="44" loading="lazy"></button>'; }).join('');
    var gimgs = $$('img', box), tbtns = $$('.op__thumb', thumbs);
    function pickG(i, user) {
      if (i === gi) return; gi = i;
      var g = G[i], p = P[g.key];
      // 다음 사진을 다 받은 뒤에 바꾼다(받는 동안 빈 화면이 보이지 않게)
      var im = gimgs[i];
      function swap() { if (gi !== i) return; gimgs.forEach(function (x, k) { x.classList.toggle('is-on', k === i); }); }
      if (im.dataset.src) { im.addEventListener('load', swap, { once: true }); im.src = im.dataset.src; im.removeAttribute('data-src'); im.alt = p.name; }
      else if (im.complete) swap(); else im.addEventListener('load', swap, { once: true });
      tbtns.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      emb.style.setProperty('--ex', g.e[0] + '%'); emb.style.setProperty('--ey', g.e[1] + '%'); emb.style.setProperty('--er', g.e[2] + 'deg'); emb.style.setProperty('--ef', g.f);
      $('#opNo').textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + G.length).slice(-2);
      var nm = $('#opTagName'); nm.textContent = p.name; nm.setAttribute('data-href', 'product.php?id=' + p.id);
      $('#opTagPrice').textContent = p.tag + ' · ' + p.price;
      if (motion && seen) gsap.fromTo([nm, $('#opTagPrice')], { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .05, ease: 'power3.out' });
      if (user) { clearInterval(auto); auto = 0; }
    }
    tbtns.forEach(function (b) { b.addEventListener('click', function () { pickG(+b.dataset.i, true); }); });
    $('#opQuick').addEventListener('click', function () { QV.open(G[gi].key, this); });
    pickG(0);
    var top = $('.cu__top', sec), topIn = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { topIn = es[0].isIntersecting; if (topIn) seen = true; }, { threshold: .3 }).observe(top);
    if (motion) auto = setInterval(function () { if (!document.hidden && topIn && !Co.get() && document.activeElement !== input) pickG((gi + 1) % G.length); }, 4200);
    // 가슴 글자 크기는 사진 크기를 따라간다
    function size() { emb.style.setProperty('--gs', garment.clientWidth + 'px'); }
    size(); window.addEventListener('resize', size);
    if (window.ResizeObserver) new ResizeObserver(size).observe(garment);

    var PH = '회사 이름';
    function paint(n, from) {
      if (from !== 'hero') input.value = n;
      mirror.textContent = n || PH;
      field.classList.toggle('has-text', !!n);
      jo.textContent = josa(n || PH) + '.';
      l2.style.fontSize = n.length > 7 ? (7 / n.length).toFixed(3) + 'em' : '';
      emb.classList.toggle('is-empty', !n);
      emb.firstElementChild.textContent = n || 'LOGO';
      if (n && from === 'hero' && motion) gsap.fromTo(emb, { scale: 1.25 }, { scale: 1, duration: .35, ease: 'back.out(3)', overwrite: true });
    }
    Co.on(paint);
    input.addEventListener('input', function () { Co.set(input.value, 'hero'); if (Co.get()) { clearInterval(auto); auto = 0; } });
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault(); input.blur();
      var s = $('#stage3d'); if (s && Co.get()) scrollToY(s.getBoundingClientRect().top + window.pageYOffset + window.innerHeight * 1.75);
    });
    field.addEventListener('click', function () { input.focus(); });
    if (motion) {
      gsap.from(garment, { scale: .9, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: top, start: 'top 78%', once: true } });
      gsap.from($$('.cu__copy>*', sec), { y: 30, opacity: 0, duration: .9, stagger: .07, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: top, start: 'top 78%', once: true } });
      // v7: PC에서 윗면이 화면보다 낮으면 화면에 붙여 두고, 3D 무대가 덮어 올라오는 동안 옷을 가슴 로고 쪽으로 당긴다(페이지를 열 때의 화면 쌓기와 짝)
      var stg3 = $('#stage3d', sec);
      if (stg3) gsap.matchMedia().add('(min-width: 901px)', function () {
        if (top.offsetHeight > window.innerHeight - 40) return;
        sec.classList.add('is-stack');
        var st = { trigger: stg3, start: function () { return 'top ' + top.offsetHeight + 'px'; }, end: 'top top', scrub: .4, invalidateOnRefresh: true };
        gsap.fromTo(garment, { scale: 1 }, { scale: 1.42, transformOrigin: '62% 40%', ease: 'none', immediateRender: false, scrollTrigger: st });
        gsap.fromTo([$('.cu__copy', sec), $('.cu__tag', sec)], { opacity: 1 }, { opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: stg3, start: st.start, end: 'top 45%', scrub: .4, invalidateOnRefresh: true } });
        return function () { sec.classList.remove('is-stack'); };
      });
    }
  })();

  /* ============================================================
     6. 현장별 착용 상품 (v7): 사진 속 인물이 실제로 입거나 쓴 상품만 붙인다(2026-11-11 사진과 상품 대표 사진 대조. 근거는 v6과 같다).
     items = [상품 키, PC 사진(3:2) 안 점 x%, y%, 폰 사진(6:7) 안 점 x%, y%]. more = 같은 품목을 더 볼 수 있는 링크(착용 상품이라고 하지 않는다)
     PC: 섹션이 화면에 붙은 채 스크롤만큼 사진 줄이 옆으로 넘어간다. 사진은 틀 안에서 반대쪽으로 조금 밀려 깊이가 생긴다.
     폰·움직임 줄이기: 붙이지 않고 손으로 넘긴다
     ============================================================ */
  (function () {
    var sec = $('#field'), track = $('#osTrack'), view = $('#osView'), nav = $('#osNav'); if (!sec || !track || !view || !nav) return;
    var cat = function (c) { return 'category.php?cat=' + encodeURIComponent(c); };
    var brandUrl = function (k) { var b = BR.filter(function (x) { return x.key === k; })[0]; return b ? { url: 'brand.php?cat=' + encodeURIComponent(b.en + ' ' + b.ko), label: b.ko + ' 상품 ' + b.count + '개' } : null; };
    var FIELD = window.B2BT_FIELD_DATA || [
      // 건설(F04): 집사님 착용 상품표로 확정. 넥워머는 표에 없고 로고가 안 보여 뺌
      { tab: '건설 현장', img: 'img/v7/fd-build-w.webp', imgM: 'img/v5/fd-build.webp', alt: '건설 현장에서 보온병을 든 검은 방한 자켓과 비니 차림의 작업자', brand: 'k2', items: [['b3026', 60, 55, 57, 54], ['b2771', 56, 12, 62, 13], ['b3330', 48, 92, 45, 91]], more: [['패딩', cat('패딩')], ['바지', cat('바지')]] },
      // 제조(9차_I02): 착용 정보를 받은 적 없음. 상세 사진과 눈으로 대조해 배색·구성이 같은 상품(작업복 = 에이스 ACE-S315, 안전모 = 쎄다 VISUAL). 집사님 확인 대상
      { tab: '제조 · 설비', img: 'img/v7/fd-plant-w.webp', imgM: 'img/v5/fd-plant.webp', alt: '공장에서 부품을 살피는 남색 상하일체형 작업복과 회색 안전모 차림의 작업자', brand: 'ace', items: [['b1420', 59, 50, 53, 50], ['b2305', 50, 12, 34, 10]], more: [['쎄다 상품 보기', 'brand.php?cat=' + encodeURIComponent('SSEDA 쎄다')], ['작업복', cat('작업복')]] },
      // 목공(8차_R050): 착용 정보를 받은 적 없음. 팔 포켓·패치·가슴 로고가 JK-F6101 상세 사진과 같음. 집사님 확인 대상
      { tab: '목공 · 인테리어', img: 'img/v7/fd-wood-w.webp', imgM: 'img/v5/fd-wood.webp', alt: '목재를 자르는 짙은 회색 방한 자켓 차림의 작업자', brand: 'k2', items: [['b3026', 40, 44, 58, 43]], more: [['패딩', cat('패딩')], ['자켓', cat('자켓')]] },
      // 야외(W01): 집사님 착용 상품표로 확정(상의만)
      { tab: '야외 · 방한', img: 'img/v7/fd-outdoor-w.webp', imgM: 'img/v5/fd-outdoor.webp', alt: '설산에서 주황색 반사띠 방한 자켓을 입은 작업자', brand: 'tbuc', items: [['b2041', 62, 50, 58, 50]], more: [['패딩', cat('패딩')], ['조끼', cat('조끼')]] }
    ];
    var ARW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    function two(n) { return ('0' + n).slice(-2); }
    nav.innerHTML = FIELD.map(function (f, i) { return '<button type="button" class="os__tab" role="tab" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + ' aria-controls="osp' + i + '" data-i="' + i + '">' + esc(f.tab) + '</button>'; }).join('');
    track.innerHTML = FIELD.map(function (f, i) {
      var items = f.items.filter(function (it) { return P[it[0]]; }), b = brandUrl(f.brand);
      var links = (b ? [[b.label, b.url]] : []).concat(f.more || []);
      return '<article class="osp" id="osp' + i + '" role="tabpanel" aria-label="' + esc(f.tab) + '" data-i="' + i + '">' +
        '<div class="osp__photo"><div class="osp__mv"><picture><source media="(max-width:900px)" srcset="' + f.imgM + '" width="1200" height="1400"><img src="' + f.img + '" width="1680" height="1120" alt="' + esc(f.alt) + '" decoding="async" draggable="false" data-slot="field-' + i + '" data-temp="ai"' + (i ? ' loading="lazy"' : '') + '></picture>' +
        items.map(function (it) { var p = P[it[0]]; return '<button type="button" class="spot" style="--x:' + it[1] + '%;--y:' + it[2] + '%;--mx:' + it[3] + '%;--my:' + it[4] + '%" data-key="' + p.key + '" aria-label="' + esc(p.name) + ' 빠른 보기"><span class="spot__dot"></span><span class="spot__lb">' + esc(p.name) + '</span></button>'; }).join('') +
        '</div><p class="fd__note">연출 이미지입니다.</p></div>' +
        '<div class="osp__side"><p class="osp__ix num" aria-hidden="true">' + two(i + 1) + '</p><h3 class="osp__t">' + esc(f.tab) + '</h3>' +
        '<div class="osp__hd"><p>사진 속 착용 상품</p>' + (items.length > 1 ? '<button type="button" class="lnk osp__all">모두 담기 <i aria-hidden="true">+</i></button>' : '') + '</div>' +
        '<ul class="osp__items">' + items.map(function (it) {
          var p = P[it[0]];
          return '<li class="osi" data-key="' + p.key + '"><button type="button" class="osi__img" aria-label="' + esc(p.name) + ' 빠른 보기"><img src="' + p.imgs[0] + '" width="144" height="144" alt="" loading="lazy" decoding="async" draggable="false"></button>' +
            '<div><p class="osi__k">' + esc(p.tag) + '</p><a class="osi__n" href="#" data-href="product.php?id=' + p.id + '">' + esc(p.name) + '</a>' +
            '<button type="button" class="osi__q" aria-label="' + esc(p.name) + ' 장바구니에 담아 견적 문의">견적문의 <i aria-hidden="true">+</i></button></div></li>';
        }).join('') + '</ul>' +
        '<p class="osp__more">' + links.map(function (l) { return '<a href="#" data-href="' + l[1] + '">' + esc(l[0]) + ' →</a>'; }).join('') + '</p></div></article>';
    }).join('') +
      '<div class="osp osp--cta"><p class="osp__ct">사내 구매 목록을 보내주시면<br>품목별 단가와 납기를<br>정리해 드립니다.</p><a class="bt bt--wh" href="#" data-href="quote-intro.php"><span>견적문의</span><i>' + ARW + '</i></a></div>';
    var panels = $$('.osp[data-i]', track), tabs = $$('.os__tab', nav), now = $('#osNow'), tot = $('#osTot'), prog = $('#osProg'), cur = -1;
    if (tot) tot.textContent = two(panels.length);
    function setCur(i) {
      if (i === cur) return; cur = i;
      tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (now) now.textContent = two(i + 1);
      if (window.innerWidth <= 900 && tabs[i]) { var nb = tabs[i], sl = nb.offsetLeft - 16; if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = sl; }
    }
    setCur(0);
    // 사진 위 점과 옆 목록을 서로 잇는다
    panels.forEach(function (pn) {
      var keys = [];
      $$('.osi', pn).forEach(function (li) {
        var key = li.dataset.key, p = P[key], sp = $('.spot[data-key="' + key + '"]', pn), im = $('.osi__img img', li); keys.push(key);
        function hot(v) { li.classList.toggle('is-hot', v); }
        function dot(v) { if (sp) sp.classList.toggle('is-on', v); }
        if (sp) {
          sp.addEventListener('pointerenter', function () { hot(true); }); sp.addEventListener('pointerleave', function () { hot(false); });
          sp.addEventListener('focus', function () { hot(true); }); sp.addEventListener('blur', function () { hot(false); });
          sp.addEventListener('click', function () { QV.open(key, sp); });
        }
        li.addEventListener('pointerenter', function () { dot(true); }); li.addEventListener('pointerleave', function () { dot(false); });
        li.addEventListener('focusin', function () { dot(true); }); li.addEventListener('focusout', function () { dot(false); });
        $('.osi__img', li).addEventListener('click', function () { QV.open(key, this); });
        $('.osi__q', li).addEventListener('click', function () { fly(im, function () { Bag.add(key, 1, p.imgs[0]); }); });
      });
      var all = $('.osp__all', pn);
      if (all) all.addEventListener('click', function () { keys.forEach(function (k, n) { setTimeout(function () { Bag.add(k, 1, P[k].imgs[0]); }, n * 120); }); });
    });
    var pinned = false, travel = 0, jump = null;
    function gutPx() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
    // 손으로 넘길 때(폰): 가장 가까운 사진을 지금 번호로
    view.addEventListener('scroll', function () {
      if (pinned) return;
      var x = view.scrollLeft + gutPx() + 4, best = 0;
      panels.forEach(function (pn, i) { if (pn.offsetLeft <= x + pn.offsetWidth * .35) best = i; });
      setCur(best);
    }, { passive: true });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (pinned && jump) jump(i);
        else view.scrollTo({ left: panels[i].offsetLeft - gutPx(), behavior: reduce ? 'auto' : 'smooth' });
      });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        e.preventDefault(); var k = (i + d + tabs.length) % tabs.length; tabs[k].focus(); tabs[k].click();
      });
    });
    if (!motion) return;
    gsap.matchMedia().add('(min-width: 901px) and (min-height: 560px)', function () {
      var K = .7, mvs = panels.map(function (pn) { return $('.osp__mv', pn); });
      sec.classList.add('is-pin'); pinned = true; view.scrollLeft = 0;
      function size() { sec.style.height = ''; travel = Math.max(0, track.scrollWidth - view.clientWidth); sec.style.height = Math.round(window.innerHeight + travel * K) + 'px'; }
      size();
      function paint(pr) {
        var x = -travel * pr, vw = view.clientWidth, mid = vw / 2 - x, best = 0, bd = 1e9;
        panels.forEach(function (pn, i) {
          var c = pn.offsetLeft + pn.offsetWidth / 2, d = Math.abs(c - mid);
          if (d < bd) { bd = d; best = i; }
          var ph = mvs[i].parentNode, t = Math.max(-1, Math.min(1, (pn.offsetLeft + ph.offsetWidth / 2 + x - vw / 2) / vw));
          mvs[i].style.transform = 'translate3d(' + (-t * ph.offsetWidth * .034).toFixed(1) + 'px,0,0)';
        });
        setCur(best);
        if (prog) prog.style.transform = 'scaleX(' + pr.toFixed(4) + ')';
      }
      var tw = gsap.to(track, { x: function () { return -travel; }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true, onRefreshInit: size, onUpdate: function (self) { paint(self.progress); }, onRefresh: function (self) { paint(self.progress); } } });
      jump = function (i) {
        var x = Math.min(travel, Math.max(0, panels[i].offsetLeft - gutPx())), top = sec.getBoundingClientRect().top + window.pageYOffset;
        scrollToY(top + (travel ? x / travel : 0) * (sec.offsetHeight - window.innerHeight) + 2);
      };
      paint(0);
      return function () {
        pinned = false; jump = null; sec.classList.remove('is-pin'); sec.style.height = '';
        mvs.forEach(function (m) { m.style.transform = ''; }); if (prog) prog.style.transform = '';
      };
    });
  })();

  /* ============================================================
     7. Portfolio (v7): 로고는 회색으로 놓고, 커서 둘레만 원래 색으로 밝힌다. 커서가 없으면(폰 포함) 화면 가운데를 지나는 줄이 밝아진다.
     칸마다 밝기 --l(0 ~ 1)을 넣고 색·투명도·크기는 CSS가 바꾼다. 움직임 줄이기 설정이면 처음부터 전부 원래 색
     ============================================================ */
  (function () {
    var grid = $('#pfGrid'); if (!grid) return;
    var cells = $$('.pfx__c:not(.pfx__c--lnk)', grid);
    if (reduce) { cells.forEach(function (c) { c.style.setProperty('--l', '1'); }); return; }
    var box = [], px = null, py = 0, live = false, raf = 0;
    function measure() { var sy = window.pageYOffset; box = cells.map(function (c) { var r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + sy + r.height / 2, w: r.width }; }); }
    function paint() {
      raf = 0; if (!box.length) return;
      var sy = window.pageYOffset, w = box[0].w, mid = window.innerHeight * .5;
      cells.forEach(function (c, i) {
        var b = box[i], l;
        if (px !== null) { var dx = b.x - px, dy = b.y - sy - py; l = 1.25 - Math.sqrt(dx * dx + dy * dy) / (w * 1.5); }
        else l = 1.3 - Math.abs(b.y - sy - mid) / (w * .9);
        c.style.setProperty('--l', Math.max(0, Math.min(1, l)).toFixed(3));
      });
    }
    function ask() { if (live && !raf) raf = requestAnimationFrame(paint); }
    if (fine) {
      grid.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY; ask(); });
      grid.addEventListener('pointerleave', function () { px = null; ask(); });
    }
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', function () { measure(); ask(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; if (live) { measure(); ask(); } }, { rootMargin: '20% 0px' }).observe(grid);
    else { live = true; measure(); ask(); }
  })();

  /* ============================================================
     8. 진행순서 (v7): 단계 카드 쌓기. 카드는 CSS(position:sticky)로 붙고, 여기서는 위에 얹힌 카드 수만큼 아래 카드를 조금 줄인다.
     제목 줄을 누르면 그 단계로 간다. 폰에서는 쌓지 않고, 왼쪽 선이 스크롤만큼 채워진다.
     화면 캡처 5장과 3D 아이콘 5개(2026-11-11 집사님 생성)는 v6과 같은 파일
     ============================================================ */
  (function () {
    var stack = $('#pzStack'); if (!stack) return;
    var sheets = $$('.pzs', stack), n = sheets.length;
    function wide() { return window.innerWidth > 900; }
    function stickTop(el) { return parseFloat(getComputedStyle(el).top) || 0; }
    sheets.forEach(function (s, i) {
      $('.pzs__tab', s).addEventListener('click', function () {
        if (!wide()) return;
        // 카드마다 높이가 달라서(뒤로 갈수록 낮다) 앞 카드들의 높이와 간격을 더해 제자리를 구한다
        var mb = parseFloat(getComputedStyle(sheets[0]).marginBottom) || 0, y = stack.getBoundingClientRect().top + window.pageYOffset;
        for (var k = 0; k < i; k++) y += sheets[k].offsetHeight + mb;
        scrollToY(y - stickTop(s) + 2);
      });
      // 아이콘이 포인터를 따라 살짝 기운다
      if (fine && !reduce) {
        var ic = $('.pzs__big', s) || $('.pzs__ic', s);
        s.addEventListener('pointermove', function (e) {
          var r = ic.getBoundingClientRect(); if (!r.width) r = s.getBoundingClientRect();
          var dx = (e.clientX - r.left - r.width / 2) / 420, dy = (e.clientY - r.top - r.height / 2) / 300;
          s.style.setProperty('--ry', Math.max(-1, Math.min(1, dx)) * 28 + 'deg'); s.style.setProperty('--rx', Math.max(-1, Math.min(1, dy)) * -24 + 'deg');
        });
        s.addEventListener('pointerleave', function () { s.style.setProperty('--rx', '0deg'); s.style.setProperty('--ry', '0deg'); });
      }
    });
    if (reduce) return;
    var raf = 0, live = false;
    function paint() {
      raf = 0;
      var vh = window.innerHeight;
      if (!wide()) {
        var r = stack.getBoundingClientRect(), line = vh * .62;
        stack.style.setProperty('--p', Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height))).toFixed(4));
        sheets.forEach(function (s) { s.classList.toggle('is-past', s.getBoundingClientRect().top < line - 20); s.style.transform = ''; });
        return;
      }
      // p[j] = j번째 카드가 제자리에 얼마나 올라왔는가(0 ~ 1)
      var p = sheets.map(function (s) { var st = stickTop(s), t = s.getBoundingClientRect().top, from = vh * .96; return Math.max(0, Math.min(1, (from - t) / Math.max(1, from - st))); });
      sheets.forEach(function (s, i) {
        var c = 0; for (var j = i + 1; j < n; j++) c += p[j];
        s.style.transform = c > .001 ? 'scale(' + (1 - c * .017).toFixed(4) + ')' : '';
      });
    }
    function ask() { if (live && !raf) raf = requestAnimationFrame(paint); }
    window.addEventListener('scroll', ask, { passive: true }); window.addEventListener('resize', ask);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; ask(); }, { rootMargin: '30% 0px' }).observe(stack);
    else { live = true; ask(); }
  })();

  /* ---------- 8-1. 견적문의 배너(F02): 가운데 틈에서 양옆으로 열린다. 커서를 따라 사진이 조금 움직인다 ---------- */
  (function () {
    var sec = $('#quoteBand'), frame = $('#qxFrame'), img = $('#qxImg'); if (!sec || !frame) return;
    if (!motion) { sec.classList.add('is-open'); return; }
    var stg = { trigger: sec, start: 'top 90%', end: 'top 14%', scrub: .5 };
    gsap.fromTo(frame, { clipPath: 'inset(0% 36% 0% 36%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: Object.assign({ onUpdate: function (st) { sec.classList.toggle('is-open', st.progress > .74); } }, stg) });
    gsap.fromTo($('picture', frame), { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: stg });
    if (fine && img) {
      var qx = gsap.quickTo(img, 'x', { duration: .9, ease: 'power3.out' }), qy = gsap.quickTo(img, 'y', { duration: .9, ease: 'power3.out' }), cx = gsap.quickTo($('.qx__copy', frame), 'x', { duration: 1.1, ease: 'power3.out' });
      frame.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = frame.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        qx(dx * -24); qy(dy * -16); cx(dx * 10);
      });
      frame.addEventListener('pointerleave', function () { qx(0); qy(0); cx(0); });
    }
  })();

  /* ============================================================
     9. 협력브랜드 9곳 (v7): 로고 칸은 상자(앞면 = 로고, 아랫면 = 상품 수). 섹션이 올라오면 스크롤에 맞춰 차례로 굴러 나오고,
     마우스를 올리면 굴러서 상품 수를 보여 준다. 칸을 고르면 아래에 그 브랜드의 상품(목록 앞쪽 4개)이 나온다
     ============================================================ */
  (function () {
    var tiles = $('#brLogos'), cardsEl = $('#brCards'); if (!tiles || !cardsEl || !BR.length) return;
    tiles.innerHTML = BR.map(function (b, i) {
      return '<button type="button" class="bxt" role="tab" aria-selected="false" tabindex="-1" aria-controls="brPanel" data-i="' + i + '" aria-label="' + esc(b.en + ' ' + b.ko) + ', 상품 ' + b.count + '개">' +
        '<span class="bxt__in"><span class="bxt__f bxt__f--a"><img src="img/brands/' + b.key + '.webp" width="' + b.w + '" height="' + b.h + '" alt="" loading="lazy" decoding="async" data-slot="brand-logo-' + b.key + '"></span>' +
        '<span class="bxt__f bxt__f--b" aria-hidden="true"><b class="num">' + b.count + '</b><span>' + esc(b.ko) + '</span></span></span></button>';
    }).join('');
    var btns = $$('.bxt', tiles), cur = -1, hoverT = 0, cols = function () { return window.innerWidth <= 900 ? 3 : 9; };
    function select(i, focus, user) {
      if (i === cur) return; var first = cur < 0; cur = i;
      var b = BR[i];
      btns.forEach(function (x, k) { x.setAttribute('aria-selected', String(k === i)); x.tabIndex = k === i ? 0 : -1; });
      if (focus) btns[i].focus();
      $('#brName').textContent = b.en; $('#brKo').textContent = b.ko; $('#brCnt').textContent = fmt(b.count);
      $('#brMoreTxt').textContent = b.ko + ' 상품 전체 보기';
      $('#brMore').setAttribute('data-href', 'brand.php?cat=' + encodeURIComponent(b.en + ' ' + b.ko));
      var cards = renderGrid(cardsEl, b.items.slice(0, 4).map(function (d) { return P['b' + d.id]; }).filter(Boolean), { fid: 'br-' });
      cardsEl.scrollLeft = 0;
      if (user && !fine && !reduce) { var el = btns[i]; el.classList.remove('is-roll'); void el.offsetWidth; el.classList.add('is-roll'); setTimeout(function () { el.classList.remove('is-roll'); }, 750); }
      if (motion && !first) {
        gsap.fromTo(cards, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .06, ease: 'power4.out', clearProps: 'transform,opacity' });
        gsap.fromTo($('#brName'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'power4.out', clearProps: 'transform,opacity' });
      }
    }
    btns.forEach(function (x, i) {
      x.addEventListener('click', function () { select(i, false, true); });
      x.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(hoverT); hoverT = setTimeout(function () { select(i); }, 160); });
      x.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
      x.addEventListener('keydown', function (e) {
        var c = cols(), d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : (e.key === 'ArrowDown' && c < 9) ? c : (e.key === 'ArrowUp' && c < 9) ? -c : 0;
        if (!d) return; e.preventDefault(); select((i + d + btns.length) % btns.length, true, true);
      });
    });
    var k2 = BR.map(function (b) { return b.key; }).indexOf('k2');
    select(k2 < 0 ? 0 : k2);
    if (!motion) return;
    var ins = btns.map(function (b) { return $('.bxt__in', b); }), done = false;
    function roll(pr) {
      if (pr >= .999) { if (!done) { done = true; tiles.classList.remove('is-scrub'); ins.forEach(function (el) { el.style.removeProperty('--r'); }); } return; }
      if (done || !tiles.classList.contains('is-scrub')) { done = false; tiles.classList.add('is-scrub'); }
      ins.forEach(function (el, i) { var t = Math.max(0, Math.min(1, (pr - i * .075) / .4)); t = 1 - Math.pow(1 - t, 3); el.style.setProperty('--r', (90 * (1 - t)).toFixed(2) + 'deg'); });
    }
    ScrollTrigger.create({ trigger: tiles, start: 'top 94%', end: 'top 52%', scrub: true, onUpdate: function (st) { roll(st.progress); }, onRefresh: function (st) { roll(st.progress); } });
  })();

  /* ============================================================
     10. 품목별 보기 (v7): 세로 조각 10개. 마우스를 올리거나 포커스가 가면 그 조각이 넓어진다(마지막으로 고른 조각이 열린 채 남는다).
     마우스가 없는 넓은 화면(태블릿 가로)에서는 닫힌 조각을 처음 누르면 열리고, 열린 조각을 누르면 이동한다.
     섹션이 올라오면 조각이 스크롤에 맞춰 엇갈려 올라온다
     ============================================================ */
  (function () {
    var row = $('#cgRow'); if (!row) return;
    var items = $$('.cgs', row);
    function on(el) { items.forEach(function (x) { x.classList.toggle('is-on', x === el); }); }
    items.forEach(function (el) {
      var a = $('a', el);
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(el); });
      a.addEventListener('focus', function () { on(el); });
      a.addEventListener('click', function (e) { if (!fine && window.innerWidth > 900 && !el.classList.contains('is-on')) { e.preventDefault(); e.stopPropagation(); on(el); } }, true);
    });
    if (!motion) return;
    gsap.matchMedia().add('(min-width: 901px)', function () {
      gsap.fromTo(items, { yPercent: function (i) { return 12 + (i % 2 ? 9 : 0) + i * 1.6; }, clipPath: 'inset(100% 0% 0% 0%)' },
        { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', stagger: .08, scrollTrigger: { trigger: row, start: 'top 94%', end: 'top 34%', scrub: .5 } });
    });
  })();

  /* ---------- 7. 3D 무대 ---------- */
  (function () {
    var sec = $('#stage3d'); if (!sec) return;
    var ghost = $('.stage__ghost', sec), bar = $('.prog i', sec);
    var rows = { material: $('[data-row="material"]', sec), color: $('[data-row="color"]', sec), logo: $('[data-row="logo"]', sec) };
    var PI = Math.PI, FREE_AT = 0.84;
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
    var box = $('#nameBox'), input = $('#nameInput'), clear = $('#nameClear'), timer = 0;
    function push(n) { clearTimeout(timer); timer = setTimeout(function () { if (ready) window.B2BTVest.api.setText(n); }, 200); }
    document.addEventListener('vest:ready', function () { ready = true; free = false; if (Co.get()) window.B2BTVest.api.setText(Co.get()); render(); });
    if (hasG) ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: function (st) { progress = st.progress; render(); } });
    else progress = 1;
    render();
    Co.on(function (n, from) { if (from !== 'stage') input.value = n; box.classList.toggle('has-text', !!n); if (from !== 'init') push(n); });
    input.addEventListener('input', function () { Co.set(input.value, 'stage'); });
    clear.addEventListener('click', function () { Co.set('', 'clear'); input.focus(); });
  })();

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

    /* 검수 상자의 v6 줄: 히어로 버튼 세 가지, 담당자 팝업 종류 */
    function syncPills() {
      $$('[data-set-cta]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-cta') === (root.getAttribute('data-cta') || 'glass'))); });
      $$('[data-set-pop]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-pop') === mode())); });
    }
    $$('[data-set-cta]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-set-cta'); root.setAttribute('data-cta', v);
        try { localStorage.setItem('b2bt-v6-cta', v); } catch (e) {}
        syncPills();
      });
    });
    $$('[data-set-pop]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-set-pop'); root.setAttribute('data-pop', v);
        try { localStorage.setItem('b2bt-v5-pop', v); } catch (e) {}
        if (v === 'rcpt') hideMg();
        syncPills();
      });
    });
    syncPills();
  })();

  window.addEventListener('load', function () { if (hasG) ScrollTrigger.refresh(); });
})();
