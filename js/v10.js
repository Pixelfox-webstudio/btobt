/* 비투비티 홈 시안 v10 · v10.js (2026-11-15). v9.js(_build_v9.py 생성물)를 그대로 가져와 v10부터는 이 파일을 직접 고친다.
   v8 그대로: 히어로(화면 쌓기) · 랭킹 · 겨울 시즌 · 장바구니 · 빠른 보기 · 검색 · 1:1 담당자 알림.
   v9: 케이투 배너 → 파트너 브랜드 배너, MD 추천 이하 → 상품 섹션 + 바텀 헤더.
   v10: 히어로 글자 · 멈춤 버튼 삭제 + 전체 영상 팝업 / 겨울 시즌 조작 줄은 진행 막대만 / 파트너 배너 선 = 가로 + 사선, 조작 줄 = 점 + 멈춤 /
        바텀 헤더 PC도 알약 줄, 1개/2개 보기는 섹션 제목 줄로, 협력브랜드 탭은 흑백 로고 / 프로세스 → 구매 후기(실제 후기, js/reviews.js).
   GSAP + ScrollTrigger + Flip + Lenis (스크립트 태그, 빌드 없음). 헤더는 site-v10.js가 맡는다. */
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
    else { document.body.style.overflow = locks > 0 ? 'hidden' : ''; root.style.overflowY = locks > 0 ? 'hidden' : ''; }
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
  // v11(2026-11-18) 담당자: 상품 랭킹에 새로 만든 모델 사진(img/v11/npXX, 상품 디테일을 넣어 만든 착용 사진)을 넣는다. 카드 첫 사진 = 모델 사진, 두 번째(마우스 올림) = 원래 누끼.
  // 사진과 상품을 옷 모양(후드 · 깃 · 주머니 · 퀼팅 · 색)으로 대조해 분명히 같은 것만 묶었다. 아이더 로고가 보이는 사진(np01 · np05 · np18 · np19)은 자체 상품에 쓰지 않는다.
  // 상품 사진이 바뀌는 것이라 이 상품이 나오는 다른 줄(겨울 아우터 등) · 빠른 보기에도 같은 사진이 보인다. 카드 사진 맞춤은 css/v11.css 6번
  // 2026-11-18 대조 결과: 랭킹 목록 60개 중 분명히 같은 옷은 둘뿐(np07 = 모자 일체형 하프패딩, np09 = 미니멀 카라 바람막이).
  // np10(마름모 퀼팅) · np14(주황 배색 카라) · np15(플리스 깃 조끼)는 비슷한 품목은 있어도 디테일이 달라 넣지 않았다. np20은 K2 로고라 협력브랜드 상품.
  // 2026-11-18 담당자 재요청: "랭킹에는 new_photo 사진, 특히 전체 10개는 전부, 새 사진을 최대한 다 쓰기" → 옷 종류 · 모양이 가장 가까운 상품에 붙인다(로고 없는 사진만).
  //   정확히 같은 옷: np07 · np09. 나머지는 같은 품목의 가까운 모양(후드 패딩 · 조끼 · 필드 자켓 · 후드집업 · 카라 티 · 라운드 티 · 퀼팅 패딩 · 투톤 플리스).
  //   np04(다른 브랜드 신발) · np11(작업복, 품목별 보기에서 사용)은 랭킹에 맞는 상품이 없어 뺐다. 로고 사진은 아래 BRAND_PHOTO(협력브랜드 줄)에서 쓴다
  // 2026-11-18 v11 6차: np01 ~ np05는 new_photo의 [con](컨셉) 파일이다(np01 현장 · np02 회색 후드 현장 · np03 형광 조끼 · np04 신발 · np05 검정 자켓 현장). 랭킹 상품 카드에는 쓰지 않는다 → c487(np02) 뺌
  // 2026-11-18 8차 담당자: 랭킹 1위 사진 = np17(옅은 녹색 경량 패딩) · 5위 = np04(검정 조거 바지 + 신발, [con]) 지정 → 가장 가까운 상품 c458 경량 웰론 패딩 · c121 죠거 스판 긴바지에 붙임.
  //   np17은 가슴에 작은 아이더 로고가 있는 사진이지만 담당자가 직접 고른 것이라 쓴다(4위 np03은 BRAND_PHOTO의 케이투 사본 b3227-np). 순서는 js/rank.js
  var WEAR_PHOTO = { c460: 'np16', c195: 'np15', c483: 'np06', c434: 'np21', c465: 'np07', c320: 'np14', c143: 'np13', c462: 'np10', c470: 'np09',
    c475: 'np12', c431: 'np22', c461: 'np08', c458: 'np17', c121: 'np04' };
  Object.keys(WEAR_PHOTO).forEach(function (k) {
    var p = P[k]; if (!p) return;
    p.imgs = ['img/v11/' + WEAR_PHOTO[k] + '-s.webp', p.imgs[0]]; p.photo = WEAR_PHOTO[k];
  });
  // 2026-11-18 7차 담당자: "상품 섹션에서 가장 크게 들어가는 사진(큰 카드)을 new photo에서 골라 넣어줘"
  //   → 두 상품 섹션(#outer 겨울 아우터 · #outer2 바람막이·패딩)의 탭마다 큰 카드(첫 칸, .pc--feat) 첫 사진 = 모델 착용 사진(img/v11/npXX.webp 1000w · npXX-l.webp 1600w),
  //     둘째 칸(마우스 올림) = 그 상품 누끼(1200px 앞 사진 hi가 있으면 그것, 없으면 원래 카탈로그 누끼). 이 카드에만 쓰고 p.imgs(랭킹 · 빠른 보기 사진)는 그대로 둔다.
  //   사진 속 옷이 카드 상품이어야 하므로 사진과 맞는 상품을 그 탭의 첫 칸으로 옮겼다(아래 SHOP.outer · SHOP.outer2 keys 순서).
  //   로고 사진(np01 · np03 · np05 · np17 ~ np20)과 컨셉 사진(np01 ~ np05)은 쓰지 않는다. "연출 이미지" 표시 없음.
  //   패딩: c449 아스펜 패딩 = np16(크림색 후드 파카 · 소매 끝 검정 줄 · 덮개 주머니, 상품에 크림 #F2EBDD 색상 있음)
  //   겨울조끼: c195 웰론 보온 겨울조끼 = np15(WEAR_PHOTO와 같은 짝) / 패딩·조끼: c461 라이트 패딩 = np08(WEAR_PHOTO와 같은 짝)
  //   플리스 자켓: c418 헤비 후드 플리스자켓 = np22(아이보리 양털 후드집업 · 올리브색 끈 · 주머니 테두리)
  //   바람막이: np09(검정 · 셔츠처럼 접힌 카라). 탭 안 상품(c482 · c473 · c479 · c481 · c477)은 스탠드 카라이거나 후드라 맞지 않음 → 카라가 접힌 c470 미니멀 카라 바람막이를 첫 칸에 넣었다
  //   카드 모양은 cardHTML(.pc--photo · .pc__ph), 사진 맞춤은 css/v11.css 8번
  var FEAT_PHOTO = { c449: 'np16', c195: 'np15', c418: 'np22', c461: 'np08', c470: 'np09' };

  // 협력브랜드 상품: 2026-11-11 noeul.shop 브랜드 목록 앞쪽 상품(js/brands.js). 쇼핑몰 표시가 "견적문의"라 가격·사이즈 칸은 비운다
  var BR = window.B2BT_BRANDS || [];
  BR.forEach(function (b) {
    b.items.forEach(function (d) {
      P['b' + d.id] = { key: 'b' + d.id, id: d.id, tag: b.en, brand: b.key, name: d.name, code: '', size: '', colorText: '', price: '견적문의',
        imgs: ['img/brandp/' + d.id + '.webp'], dots: [], more: '', slot: 'brand-' + d.id };
    });
  });
  // 2026-11-18 담당자: 협력브랜드 줄의 쇼핑몰 연출 사진(두 모델이 나란히 선 사진, 예: 케이투 LB2-F150)이 품질이 떨어져 보임 → 같은 브랜드 로고가 들어간 새 모델 사진으로 첫 장을 바꾸고, 마우스를 올리면 원래 사진.
  //   케이투 로고: np03(형광 후드) · np20(후드 패딩). 아이더 로고: np01 · np05 · np17 · np18 · np19. 케이투 PT-2302(반팔 · 반바지)는 맞는 로고 사진이 없어 그대로
  var BRAND_PHOTO = { b3227: 'np03', b3026: 'np20', b2746: 'np01', b3141: 'np05', b3001: 'np17', b3032: 'np19', b3022: 'np18' };
  //   같은 상품이 '사진 속 착용 상품' 칸(배너 · 현장 사진과 짝)에도 나오므로, 협력브랜드 줄에서만 쓰는 사본(키 끝 -np)을 만든다
  Object.keys(BRAND_PHOTO).forEach(function (k) {
    var p = P[k]; if (!p) return;
    var q = {}; for (var f in p) q[f] = p[f];
    q.key = k + '-np'; q.imgs = ['img/v11/' + BRAND_PHOTO[k] + '-s.webp', p.imgs[0]]; q.photo = BRAND_PHOTO[k];
    P[q.key] = q;
  });
  // 사진 속 착용 상품: 배너·현장 사진을 만들 때 넣은 실제 상품(담당자 확인 목록). 2026-11-11 noeul.shop 상품 페이지 제목과 대표 사진으로 대조함
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
    // 2026-11-18 7차 담당자: 큰 카드 + FEAT_PHOTO(위 WEAR_PHOTO 아래) = 첫 장 모델 사진(srcset 1000w · 1600w, 3:4), 둘째 장 상품 누끼 → 진행 막대 2칸.
    //   누끼 = 1200px 앞 사진(hi[0]), 없으면 원래 카탈로그 누끼(WEAR_PHOTO가 붙은 상품은 p.imgs[0]이 모델 사진이라 p.imgs[1])
    var fp = feat && FEAT_PHOTO[p.key];
    if (fp) srcs = ['img/v11/' + fp + '.webp', p.hi ? p.hi[0] : p.photo ? p.imgs[1] : p.imgs[0]];
    var imgs = srcs.map(function (src, i) {
      var ph = fp && !i, wh = ph ? ' width="1000" height="1336"' : ' width="' + px + '" height="' + px + '"';
      return '<img' + (i ? ' data-src="' + src + '"' : ' class="is-on' + (ph ? ' pc__ph' : '') + '" src="' + src + '"' + (ph ? ' srcset="img/v11/' + fp + '.webp 1000w, img/v11/' + fp + '-l.webp 1600w" sizes="(max-width:768px) 100vw, 50vw"' : '') + ' loading="lazy" data-slot="' + p.slot + '"') + ' alt="' + (i ? '' : esc(p.name)) + '"' + wh + ' decoding="async" draggable="false">';
    }).join('');
    var bars = srcs.length > 1 ? srcs.map(function (_, i) { return '<i' + (i ? '' : ' class="is-on"') + '></i>'; }).join('') : '';
    var dots = p.dots.map(function (d) { // 사진 번호로 바꾸는 색 점(d.i)은 사진 목록이 다른 큰 카드(hi · 모델 사진)에서는 그냥 점으로
      return d.i && !(feat && (p.hi || fp)) ? '<button type="button" class="dot" style="--c:' + d.hex + '" data-i="' + d.i + '" aria-label="' + esc(d.label) + ' 사진 보기"></button>' : '<span class="dot" style="--c:' + d.hex + '"></span>';
    }).join('') + (p.more ? '<span class="pc__swmore">' + esc(p.more) + '</span>' : '');
    var cat = [kind, p.tag].filter(Boolean).map(esc).join(' · ');
    var metas = [p.size, opt.slim ? '' : p.colorText].filter(Boolean).map(function (m) { return '<p class="pc__meta">' + esc(m) + '</p>'; }).join('');
    if (metas) metas = '<div class="pc__ms">' + metas + '</div>';
    return '<article class="pc' + (kind === '착용 상품' ? ' pc--worn' : '') + (feat ? ' pc--feat' : '') + (fp ? ' pc--photo' : '') + (opt.slim ? ' pc--slim' : '') + '" data-key="' + p.key + '"' + (p.brand ? ' data-brand="' + p.brand + '"' : '') + ' data-flip-id="' + (opt.fid || '') + p.key + '">' +
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
    grid.innerHTML = list.map(function (p, i) { return cardHTML(p, i + 1, { kind: typeof opt.kind === 'function' ? opt.kind(p, i) : opt.kind, fid: opt.fid, rank: opt.rank, feat: opt.feat, slim: opt.slim }); }).join('');
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
     1. 메인 배너: 영상 한 장 고정(글자 없음). 영상은 반복 재생하고, 화면 밖·다음 면에 덮였을 때·탭이 가려졌을 때·전체 영상 팝업이 열렸을 때 멈춘다.
     화면 쌓기: 배너는 화면 위에 붙어 있고(sticky) 다음 면(#stkOver)이 그 위로 올라온다. 덮이는 만큼 배너가 어두워진다.
     v10: 제목 · 견적문의 · 멈춤 버튼을 빼고, 멈춤 버튼 자리에 "전체 영상 보기"(누르면 팝업에서 조작 막대와 함께 처음부터 재생).
     FILM = 영상 파일 이름(media/<이름>-1080|720|9x16.mp4|webm, v10의 b2bt-film은 폰용이 -m). 새 영상을 받으면 같은 규칙으로 넣고 이름만 바꾼다
     2026-11-16: B2BT_edit_4k.mp4로 교체(_qa/_make_film_v10.sh). 폰용(-m)은 864x1080(4:5) 가운데 자름 — 영상 가운데 문구가 잘리지 않게 9:16 대신 4:5
     2026-11-17 v11: 사장님 요청으로 모션그래픽(b2bt-film) → 원래 실사 영상(hero-film, v8·v9와 같은 파일)으로 되돌림.
       크기: PC 1281 이상 1080 / 769~1280 720 / 폰 768 이하 9x16(608x1080). 첫 사진은 영상 첫 장면(img/v11/hero-poster*.webp)이라 영상이 시작될 때 튀지 않는다.
       문구 · WORKWEAR · 첫 접속 인트로는 js/v11-hero.js가 맡는다(이 블록은 영상과 팝업만)
     ============================================================ */
  var FILM = 'hero-film';
  // v11: 인트로(js/v11-hero.js)가 도는 동안 스크롤을 잠그고 푼다. 팝업과 같은 잠금 수(locks)를 쓰므로 Lenis가 있든 없든 같은 길로 잠긴다
  window.B2BT_SCROLL_HOLD = function (on) { locks = Math.max(0, locks + (on ? 1 : -1)); syncLock(); };
  (function () {
    var bn = $('#hero'); if (!bn) return;
    var video = $('#bnFilm'), slide = $('.bn__slide', bn), over = $('#stkOver'), shade = $('#hvShade');
    var covered = false, modalOn = false, syncFilm = function () {};
    function cover() {
      if (!over) return;
      var h = bn.offsetHeight || 1, p = Math.max(0, Math.min(1, (bn.getBoundingClientRect().bottom - over.getBoundingClientRect().top) / h));
      var was = covered; covered = p >= .97;
      if (shade) shade.style.opacity = (p * .66).toFixed(3);
      if (was !== covered) syncFilm();
    }
    window.addEventListener('scroll', cover, { passive: true }); window.addEventListener('resize', cover);
    if (lenis) lenis.on('scroll', cover);
    cover();

    function ext(v) { return v.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm'; }

    // 전체 영상 팝업: 열면 배경 스크롤과 배너 영상을 멈추고, 닫기 · 바깥 · Esc로 닫는다. 포커스는 팝업 안에서만 돈다
    (function () {
      var openB = $('#filmOpen'), modal = $('#filmModal'), full = $('#filmFull'); if (!openB || !modal || !full) return;
      var closeB = $('.vm__x', modal), last = null;
      function open() {
        if (modalOn) return;
        modalOn = true; last = document.activeElement; syncFilm();
        if (!full.getAttribute('src')) full.src = 'media/' + FILM + '-' + (window.innerWidth >= 1281 ? '1080' : '720') + '.' + ext(full);
        modal.hidden = false; locks++; syncLock(); root.classList.add('is-vm');
        requestAnimationFrame(function () { modal.classList.add('is-on'); });
        try { full.currentTime = 0; } catch (e) {}
        var p = full.play(); if (p && p.catch) p.catch(function () {});
        closeB.focus({ preventScroll: true });
      }
      function close() {
        if (!modalOn) return;
        modalOn = false; full.pause();
        modal.classList.remove('is-on'); modal.hidden = true; locks = Math.max(0, locks - 1); syncLock(); root.classList.remove('is-vm');
        if (last && last.focus) last.focus({ preventScroll: true });
        syncFilm();
      }
      openB.addEventListener('click', open);
      $$('[data-vm-close]', modal).forEach(function (x) { x.addEventListener('click', close); });
      modal.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key !== 'Tab') return;
        var f = [full, closeB], i = f.indexOf(document.activeElement);
        if (e.shiftKey ? i <= 0 : i === f.length - 1 || i < 0) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
      });
    })();

    var conn = navigator.connection;
    var canFilm = !!video && !reduce && !(conn && (conn.saveData === true || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '')));
    if (!canFilm) return;
    var inView = true;
    function filmSrc() {
      var w = window.innerWidth, size = w >= 1281 ? '1080' : (w >= 769 ? '720' : '9x16');
      return 'media/' + FILM + '-' + size + '.' + ext(video);
    }
    function sync() {
      if (modalOn || !inView || covered || document.hidden) { if (!video.paused) video.pause(); return; }
      if (!video.getAttribute('src')) { video.src = filmSrc(); video.setAttribute('data-src-picked', video.src.split('/').pop()); }
      if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    }
    syncFilm = sync;
    video.addEventListener('playing', function () { slide.classList.add('is-film-on'); });
    video.addEventListener('error', function () { slide.classList.remove('is-film-on'); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: .25 }).observe(bn);
    // 첫 사진(포스터)을 먼저 그린 뒤 영상을 받는다
    if (document.readyState === 'complete') sync(); else window.addEventListener('load', sync);
  })();

  /* ============================================================
     2. 랭킹: 품목 탭 + 순위 번호가 붙은 상품 줄(한 번에 한 묶음씩 넘김). 순서는 js/rank.js, 없으면 카탈로그(추천순)에서 품목별로 돌아가며 고른다
     ============================================================ */
  (function () {
    var rail = $('#rkRail'), tabsEl = $('#rkTabs'), moreEl = $('#rkMore'), stage = rail && rail.parentNode; if (!rail || !tabsEl) return;
    // v10 보정: 아래 버튼은 고른 품목의 전체 보기로 바뀐다(묶음 표시 줄과 글자 링크는 없앰). 품목 → 쇼핑몰 분류 주소
    var MORE = { '전체': ['전체 상품 보기', 'category.php'], '티셔츠': ['티셔츠 전체 보기', 'category.php?cat=' + encodeURIComponent('라운드 티셔츠')], '맨투맨·후드': ['맨투맨·후드 전체 보기', 'category.php?cat=' + encodeURIComponent('맨투맨 티셔츠')],
      '조끼': ['조끼 전체 보기', 'category.php?cat=' + encodeURIComponent('조끼')], '자켓': ['자켓 전체 보기', 'category.php?cat=' + encodeURIComponent('자켓')], '패딩': ['패딩 전체 보기', 'category.php?cat=' + encodeURIComponent('패딩')], '바지': ['바지 전체 보기', 'category.php?cat=' + encodeURIComponent('바지')] };
    var by = {}; CATS.forEach(function (c) { by[c.cat] = c.items.map(function (d) { return P['c' + d.id]; }); });
    function mix(names, n) { var out = [], r = 0, ls = names.map(function (k) { return by[k] || []; }); while (out.length < n && ls.some(function (l) { return l.length > r; })) { ls.forEach(function (l) { if (l[r] && out.length < n) out.push(l[r]); }); r++; } return out; }
    var tabs = (RK && RK.tabs && RK.tabs.length) ? RK.tabs.map(function (t) { return { label: t.label, list: pick(t.keys) }; }) : [
      { label: '전체', list: mix(['패딩', '자켓', '조끼', '맨투맨 티셔츠', '후드 티셔츠', '카라 티셔츠', '바지', '라운드 티셔츠'], 10) },
      { label: '티셔츠', list: mix(['라운드 티셔츠', '카라 티셔츠'], 10) }, { label: '맨투맨 · 후드', list: mix(['맨투맨 티셔츠', '후드 티셔츠'], 10) },
      { label: '조끼', list: mix(['조끼'], 10) }, { label: '자켓', list: mix(['자켓'], 10) }, { label: '패딩', list: mix(['패딩'], 10) }, { label: '바지', list: mix(['바지'], 10) }
    ];
    tabs = tabs.filter(function (t) { return t.list.length; }); if (!tabs.length) return;
    tabsEl.insertAdjacentHTML('beforeend', tabs.map(function (t, i) { return '<button type="button" class="tab" role="tab" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + ' aria-controls="rkRail" data-tab="' + i + '">' + esc(t.label) + '</button>'; }).join(''));
    var ctl = dragRail(rail, { prev: $('#rkPrev'), next: $('#rkNext'), page: true, onSync: function (st) { if (st.w) stage.style.setProperty('--ah', st.w + 'px'); } });
    function show(i, first) {
      railStop(rail, false);
      var cards = renderGrid(rail, tabs[i].list, { rank: true, fid: 'rk-' }); ctl.warm();
      rail.scrollLeft = 0; ctl.sync();
      if (moreEl) { var m = MORE[tabs[i].label.replace(/\s+/g, '')] || MORE['전체']; moreEl.textContent = m[0]; moreEl.setAttribute('data-href', m[1]); }
      if (first) reveal(cards, rail, true);
      else if (motion) gsap.fromTo(cards, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .04, ease: 'power4.out', clearProps: 'transform,opacity' });
    }
    show(0, true);
    lineTabs(tabsEl, function (k) { show(+k); });
    // 제목 위 막대 표식: 제목이 보이면 한 번 자란다
    var head = $('#rkHead');
    if (head) { if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { head.classList.add('is-in'); o.disconnect(); } }, { threshold: .6 }).observe(head); else head.classList.add('is-in'); }
  })();

  /* ============================================================
     3. 스테디셀러 상품 줄(2026-11-18 8차: 원래 겨울 시즌 줄. 섹션이 후드·바지 아래로 옮겨지며 사계절 기본 상품으로 바꿈): 시간이 지나면 한 칸씩 오른쪽 상품으로 넘어가고 끝없이 돈다(같은 목록을 두 번 놓고 절반을 넘으면 처음으로 되돌린다).
     마우스를 올리거나, 손을 대거나, 포커스가 있으면 멈춘다. 움직임 줄이기 설정이면 자동으로 넘기지 않는다.
     v10: 상품 아래 조작 줄은 진행 막대만 둔다(숫자 · 멈춤 · 좌우 화살표 삭제). 넘김은 자동 + 손으로 밀기
     ============================================================ */
  // 2026-11-18 8차 담당자: "계절 상관없이 많이 나가는 스테디셀러" → 라운드 티 · 카라 티 · 맨투맨 · 바람막이 · 바지 · 모자(카탈로그 추천순 앞쪽).
  //   아래 후드·맨투맨(#hood) · 바람막이·패딩(#outer2) · 후드·바지(#hood2) 줄과 겹치지 않는 상품만 골랐다. 시안용이라 담당자 확인 뒤 바꿀 수 있다.
  //   (전 목록 = 겨울 시즌: m465 · c464 · c472 · m206 · m194 · c197 · m475 · c203)
  var SEASON = ['c139', 'c328', 'c227', 'c481', 'c119', 'c170', 'c321', 'c506'];
  (function () {
    var rail = $('#ssRail'); if (!rail) return;
    var list = pick(SEASON), n = list.length; if (!n) return;
    // 2026-11-18 v11 6차 담당자: 폰에서 손으로 넘길 때 버벅인다 → 폰(768 이하)은 자동 넘김 · 끝없이 돌기(복제 · 되돌리기)를 끄고
    // 브라우저 기본 가로 스크롤 + 카드에 맞춰 멈춤(css/v11-m.css)만 둔다. 자동 넘김이 손가락과 싸우던 것과 되돌리기(scrollLeft 점프)가 원인
    if (window.matchMedia('(max-width: 768px)').matches) {
      var mc = renderGrid(rail, list, { kind: '스테디셀러', fid: 'ss-' }), mp = $('#ssProg');
      rail.classList.add('is-native');
      var mpaint = function () { var max = rail.scrollWidth - rail.clientWidth; if (mp) mp.style.transform = 'scaleX(' + (max > 0 ? Math.max(1 / n, Math.min(1, (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth)) : 1).toFixed(4) + ')'; };
      rail.addEventListener('scroll', mpaint, { passive: true }); window.addEventListener('resize', mpaint);
      railWarm(rail)(); mpaint(); reveal(mc.slice(0, 3), rail, true);
      return;
    }
    var cards = renderGrid(rail, list.concat(list), { kind: '스테디셀러', fid: 'ss-' });
    cards.slice(n).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); $$('a,button', c).forEach(function (x) { x.tabIndex = -1; }); });
    var prog = $('#ssProg'), U = 0;
    function unit() { return U || (U = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(rail).columnGap) || 16)); } // 한 칸 폭은 재 두고 쓴다(화면 폭이 바뀌면 다시 잰다)
    function norm() { var h = unit() * n; if (rail.scrollLeft >= h - 1) rail.scrollLeft -= h; }
    function paint() { var i = Math.round(rail.scrollLeft / unit()) % n; if (prog) prog.style.transform = 'scaleX(' + ((i + 1) / n).toFixed(4) + ')'; }
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
    var hold = false, inView = false, touchT = 0, timer = 0, GAP = 3200;
    function tick() { clearTimeout(timer); if (reduce) return; timer = setTimeout(function () { if (!hold && inView && !document.hidden && !rail._sl && !rail.classList.contains('is-reveal') && locks === 0) go(1); tick(); }, GAP); }
    rail.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold = true; });
    rail.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hold = false; });
    rail.addEventListener('focusin', function () { hold = true; }); rail.addEventListener('focusout', function () { hold = false; });
    rail.addEventListener('touchstart', function () { hold = true; clearTimeout(touchT); }, { passive: true });
    rail.addEventListener('touchend', function () { clearTimeout(touchT); touchT = setTimeout(function () { hold = false; }, 4500); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: .4 }).observe(rail); else inView = true;
    tick(); paint(); reveal(cards.slice(0, 6), rail, true);
  })();

  /* ============================================================
     4. 파트너 브랜드 (v9): 움직이는 배너. 이전 On Site(현장별 착용 상품)의 사진·착용 상품을 브랜드별 장면으로 옮겼다.
     장면 = 사진 + 글(브랜드 라벨 · 제목 · 브랜드 상품 보기) + 사진 위 흰 사각형(상품 자리) + 착용 상품 칸.
     흰 사각형에서 착용 상품 칸까지 한 번 꺾이는 흰 선으로 잇는다(v10: 사각형에서 사선으로 나가 칸 쪽에서 가로(폰은 세로)로 들어간다. 담당자 예시 캡처의 빨간 선).
     시간이 지나면 다음 장면으로 넘어간다. 마우스를 올리거나 포커스가 있거나 멈춤을 누르면 멈춘다. 움직임 줄이기 설정이면 자동으로 넘기지 않는다.
     v10 조작 줄 = 점 + 멈춤(noeul.shop 메인 배너 모양). 번호 · 진행 막대 · 좌우 버튼은 없앰. PC는 본문 폭 안의 둥근 틀(높이를 줄임), 폰은 화면 가득 그대로.
     items = [상품 키, PC 사진(2048×1152) 안 x, y, 폰 사진(1000×1250) 안 x, y] (0~1). 사진 속 인물이 실제로 입거나 쓴 상품만(근거는 v6·v7 On Site와 같다)
     ============================================================ */
  (function () {
    var sec = $('#partner'), frame = $('#pbFrame'), box = $('#pbSlides'); if (!sec || !frame || !box) return;
    var mq = window.matchMedia('(max-width: 768px)');
    var SL = (window.B2BT_PARTNER_DATA || [
      // K01: 담당자 착용 상품표로 확정(v6)
      { brand: 'k2', en: 'K2', ko: '케이투', title: '협력 브랜드 케이투의<br>방한 자켓', img: 'img/v6/k01.webp', imgM: 'img/v6/k01-m.webp', alt: '설산 능선을 오르는 짙은 회색 방한 자켓 차림의 남성', side: 'l', tags: 'top', items: [['b3026', .455, .6, .44, .58]] },
      // 제조(9차_I02): 상세 사진과 눈으로 대조(작업복 = 에이스 ACE-S315, 안전모 = 쎄다 VISUAL). 담당자 확인 대상
      { brand: 'ace', en: 'ACE · SSEDA', ko: '에이스', title: '제조 · 설비 현장의<br>에이스 작업복', img: 'img/v9/pb-plant.webp', imgM: 'img/v9/pb-plant-m.webp', alt: '공장에서 부품을 살피는 남색 상하일체형 작업복과 회색 안전모 차림의 작업자', side: 'l', tags: 'mid', act: 1, items: [['b2305', .522, .115, .35, .115], ['b1420', .622, .66, .57, .62]] },
      // 야외(W01): 담당자 착용 상품표로 확정(상의만)
      { brand: 'tbuc', en: 'T-BUC', ko: '티뷰크', title: '야외 · 방한 현장의<br>티뷰크 방한 자켓', img: 'img/v9/pb-outdoor.webp', imgM: 'img/v9/pb-outdoor-m.webp', alt: '설산에서 주황색 반사띠 방한 자켓을 입은 작업자', side: 'l', tags: 'top', items: [['b2041', .645, .52, .62, .52]] },
      // 2026-11-18 8차 담당자: 티뷰크 장면 다음에 H04 · H01 사진 배너 2장 추가(원본 contents/H04.png · H01.png → img/v11/pb-h04* · pb-h01*, PC 2048×1152 · 폰 1000×1250으로 자름).
      //   브랜드는 사진 속 로고로 정함(H04 가슴 EIDER = 아이더, H01 가슴 K2 Safety = 케이투). 사진 속 옷이 어떤 상품인지 확인된 목록이 없어 착용 상품 칸(items)은 비워 둔다
      { brand: 'eider', en: 'EIDER', ko: '아이더', title: '한겨울 출퇴근길의<br>아이더 다운 파카', img: 'img/v11/pb-h04.webp', imgM: 'img/v11/pb-h04-m.webp', alt: '푸른 빛 배경 앞에서 카키색 후드 다운 파카의 지퍼를 올리는 남성', side: 'l', tags: 'top', items: [] },
      { brand: 'k2', en: 'K2', ko: '케이투', title: '실내 · 설비 현장의<br>케이투 방한 자켓', img: 'img/v11/pb-h01.webp', imgM: 'img/v11/pb-h01-m.webp', alt: '햇빛 드는 콘크리트 실내에 앉은 검정 방한 자켓 차림의 남성', side: 'l', tags: 'top', items: [] },
      // 건설(F04) 장면은 2026-11-15 담당자 지시로 뺌(사진 img/v9/pb-build*.webp는 남겨 둠)
      // 목공(8차_R050): 팔 포켓·패치·가슴 로고가 JK-F6101 상세 사진과 같음. 담당자 확인 대상
      { brand: 'k2', en: 'K2', ko: '케이투', title: '목공 · 인테리어 현장의<br>케이투 방한 자켓', img: 'img/v9/pb-wood.webp', imgM: 'img/v9/pb-wood-m.webp', alt: '목재를 자르는 짙은 회색 방한 자켓 차림의 작업자', side: 'r', tags: 'top', items: [['b3026', .34, .47, .43, .47]] }
    ]).map(function (s) { s.items = s.items.filter(function (it) { return P[it[0]]; }); return s; });
    var N = SL.length; if (!N) return;
    var ARW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
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
        '<div class="pbs__copy"><h3 class="pbs__t">' + s.title + '</h3>' +
        '<a class="bt bt--wh" href="#" data-href="' + burl(s.brand) + '"><span>' + esc(s.ko) + ' 상품 보기</span><i>' + ARW + '</i></a></div></article>';
    }).join('');

    var slides = $$('.pbs', box), dotsEl = $('#pbDots'), cur = -1;
    dotsEl.innerHTML = SL.map(function (s, i) { return '<button type="button" class="pb__dot" data-i="' + i + '" aria-label="' + (i + 1) + '번째 배너 보기 · ' + esc(s.ko) + '"></button>'; }).join('');
    var dots = $$('.pb__dot', dotsEl);

    // 꺾이는 점: (x0, y0) = 사각형, (x1, y1) = 칸 쪽 끝. bendX는 끝에서 가로로, bendY는 세로로 들어간다
    function bendX(x0, y0, x1, y1) { var dx = x1 - x0, run = Math.min(Math.abs(y1 - y0), Math.abs(dx) * .62); return [[x0, y0], [x0 + (dx < 0 ? -run : run), y1], [x1, y1]]; }
    function bendY(x0, y0, x1, y1) { var dy = y1 - y0, run = Math.min(Math.abs(x1 - x0), Math.abs(dy) * .62); return [[x0, y0], [x1, y0 + (dy < 0 ? -run : run)], [x1, y1]]; }

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
        // v10: 한 번 꺾이는 선 = 사각형에서 사선으로 나가서, 칸 쪽에서는 곧게(PC 가로 / 폰 세로) 들어간다. 사선은 45°가 기본이고 자리가 모자라면 더 가파르게
        var my = (T.t + T.b) / 2, pts, ax;
        if (m || (px >= T.l && px <= T.r)) { // 칸 위·아래에서 세로로 들어감
          ax = px < (T.l + T.r) / 2 ? T.l + 20 : T.r - 20;
          if (Math.abs(ax - px) < 40) ax = Math.max(T.l + 20, Math.min(T.r - 20, px + (px < (T.l + T.r) / 2 ? 40 : -40)));
          pts = bendY(px, py, ax, py < T.t ? T.t : T.b);
        } else pts = bendX(px, py, px < T.l ? T.l : T.r, my); // 칸 옆에서 가로로 들어감
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
    function show(i) {
      i = (i + N) % N; if (i === cur) return;
      cur = i; elapsed = 0;
      slides.forEach(function (el, k) { var on = k === i; el.classList.toggle('is-on', on); el.setAttribute('aria-hidden', String(!on)); if ('inert' in el) el.inert = !on; });
      layout(i);
      dots.forEach(function (b, k) { var on = k === i; b.classList.toggle('is-active', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    show(0);
    dots.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    var auto = $('#pbAuto');
    if (reduce) { auto.hidden = true; frame.classList.add('is-static'); }
    auto.addEventListener('click', function () {
      userOff = !userOff; auto.setAttribute('aria-pressed', String(userOff)); auto.classList.toggle('is-stopped', userOff);
      auto.setAttribute('aria-label', userOff ? '배너 자동 넘김 다시 시작' : '배너 자동 넘김 멈춤');
    });
    frame.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    frame.addEventListener('pointerleave', function () { hover = false; });
    frame.addEventListener('focusin', function () { focus = true; }); frame.addEventListener('focusout', function (e) { if (!frame.contains(e.relatedTarget)) focus = false; });
    // 손으로 넘기기(폰). 2026-11-18 v11 6차 담당자: "슬라이드해서 넘길 수 있게, 지금은 버벅거림"
    // 전에는 손을 뗀 뒤에야 다음 장면이 겹쳐 나타났다(손가락을 따라오지 않음) → 지금은 장면이 손가락을 따라 옆으로 밀리고 옆 장면이 같이 들어온다.
    // 1/5 이상 밀거나 빠르게 튕기면 넘어가고, 아니면 제자리로 돌아온다. 세로 스크롤은 브라우저에 맡긴다(css/v11-m.css: touch-action pan-y)
    var tx = null, ty = 0, dx0 = 0, axis = '', nb = -1, t0 = 0, W0 = 0, anim = false;
    var SWIPE_EASE = 'transform .42s cubic-bezier(.22,.61,.36,1)';
    function peekSet(el, x, tr) { el.style.transition = tr || 'none'; el.style.transform = 'translate3d(' + x + 'px,0,0)'; }
    function peekClear(el) { ['transition', 'transform', 'visibility', 'opacity', 'zIndex'].forEach(function (k) { el.style[k] = ''; }); }
    frame.addEventListener('touchstart', function (e) {
      touchHold = true; clearTimeout(touchT);
      if (anim || e.touches.length > 1) { tx = null; return; }
      var t = e.touches[0]; tx = t.clientX; ty = t.clientY; dx0 = 0; axis = ''; nb = -1; t0 = performance.now(); W0 = frame.clientWidth;
    }, { passive: true });
    frame.addEventListener('touchmove', function (e) {
      if (tx === null || anim) return;
      var t = e.touches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      if (!axis) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
      if (axis !== 'x') return;
      var want = (cur + (dx < 0 ? 1 : -1) + N) % N;
      if (want !== nb) { // 미는 방향이 바뀌면 옆 장면을 바꿔 놓는다
        if (nb >= 0 && nb !== cur) peekClear(slides[nb]);
        nb = want; var el = slides[nb];
        el.style.visibility = 'visible'; el.style.opacity = '1'; el.style.zIndex = '3';
        layout(nb);
      }
      dx0 = dx;
      peekSet(slides[cur], dx); peekSet(slides[nb], dx + (dx < 0 ? W0 : -W0));
    }, { passive: true });
    frame.addEventListener('touchend', function () {
      clearTimeout(touchT); touchT = setTimeout(function () { touchHold = false; }, 4500);
      if (tx === null) return; tx = null;
      if (axis !== 'x' || nb < 0) return;
      var dx = dx0, fast = Math.abs(dx) / Math.max(1, performance.now() - t0) > .45 && Math.abs(dx) > 24, go = Math.abs(dx) > W0 * .2 || fast;
      var a = slides[cur], b = slides[nb], target = nb, dir = dx < 0 ? -1 : 1;
      anim = true;
      if (go) { peekSet(a, dir * W0, SWIPE_EASE); peekSet(b, 0, SWIPE_EASE); }
      else { peekSet(a, 0, SWIPE_EASE); peekSet(b, -dir * W0, SWIPE_EASE); }
      setTimeout(function () {
        if (go) {
          a.style.transition = 'none'; a.style.opacity = '0';
          show(target);
          requestAnimationFrame(function () { peekClear(a); peekClear(b); anim = false; });
        } else { peekClear(b); peekClear(a); anim = false; }
        nb = -1;
      }, 440);
    }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: .45 }).observe(frame); else inView = true;
    if (!reduce) {
      var last = performance.now();
      (function tick(t) {
        var dt = Math.min(100, t - last); last = t;
        if (!held()) { elapsed += dt; if (elapsed >= DUR) show(cur + 1); }
        requestAnimationFrame(tick);
      })(last);
    }
    var rT = 0;
    function relayout() { clearTimeout(rT); rT = setTimeout(function () { if (cur >= 0) layout(cur); }, 60); }
    window.addEventListener('resize', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    window.addEventListener('load', relayout);

    // 스크롤하면 틀이 끝까지 열린다(v6 케이투 배너의 장치). v10: PC는 둥근 틀(16px) 안에서 열린다
    // 폰(768px 이하)은 열리는 장치 없이 처음부터 화면 폭 가득(2026-11-15 밤: 양옆이 5%씩 잘린 채 올라와 꽉 차 보이지 않았다). 착용 상품 칸이 나타나는 때(is-open)는 그대로
    if (motion) {
      var rr = function () { return mq.matches ? '0px' : '16px'; };
      gsap.fromTo(frame, { clipPath: function () { return 'inset(' + (mq.matches ? '0% 0% 0% 0%' : '8% 5% 8% 5%') + ' round ' + rr() + ')'; } }, { clipPath: function () { return 'inset(0% 0% 0% 0% round ' + rr() + ')'; }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 90%', end: 'top 16%', scrub: .5, invalidateOnRefresh: true, onUpdate: function (st) { sec.classList.toggle('is-open', st.progress > .7); } } });
      var mqFlip = function () { ScrollTrigger.refresh(); };
      if (mq.addEventListener) mq.addEventListener('change', mqFlip); else if (mq.addListener) mq.addListener(mqFlip);
    } else sec.classList.add('is-open');
  })();

  /* ============================================================
     5 ~ 7. 상품 섹션(겨울 아우터 · 협력브랜드 · 후드·맨투맨) + 바텀 헤더 (v9)
     바텀 헤더(.bh) = 섹션마다 하나씩 있는 선택 줄. 섹션 안에서는 헤더 바로 아래에 붙어 따라오고(position:sticky),
     섹션을 벗어나면 다음 섹션의 것이 그 자리에 온다. 그래서 상품을 한참 내려 보다가도 다른 분류·브랜드로 바로 바꿀 수 있다.
     탭을 바꾸면 상품 줄의 처음이 바텀 헤더 바로 아래로 오게 올려 준다.
     v10: PC도 폰처럼 떠 있는 알약 줄(가운데). 폰에서는 화면 폭에 맞춘 같은 길이.
     1개 / 2개 보기는 바텀 헤더에서 빼서 섹션 제목 줄 오른쪽 위의 작은 버튼으로 옮겼다(폰에서만 보임, 페이지 전체에 같이 적용, 저장).
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
  // v10 아이콘: 1개 = 큰 네모 하나, 2개 = 작은 네모 넷(2 × 2)
  var VIEW = {
    1: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="13" height="13" rx="2.5"/></svg>',
    2: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="5.6" height="5.6" rx="1.4"/><rect x="11.4" y="3" width="5.6" height="5.6" rx="1.4"/><rect x="3" y="11.4" width="5.6" height="5.6" rx="1.4"/><rect x="11.4" y="11.4" width="5.6" height="5.6" rx="1.4"/></svg>'
  };
  // 1개 / 2개 보기(섹션 제목 줄 오른쪽 위). 바꿔도 보고 있던 상품이 같은 자리에 있게 스크롤을 맞춘다
  function viewToggle(sec) {
    var box = $('[data-vtog]', sec); if (!box) return;
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', '상품 보기 방식');
    box.innerHTML = '<button type="button" class="vtog__b" data-cols="1" aria-label="한 줄에 1개씩 보기">' + VIEW[1] + '</button><button type="button" class="vtog__b" data-cols="2" aria-label="한 줄에 2개씩 보기">' + VIEW[2] + '</button>';
    $$('.vtog__b', box).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.cols === Cols.get()) return;
        var head = $('#siteHead'), line = Math.max(box.getBoundingClientRect().bottom, head ? head.getBoundingClientRect().bottom : 0) + 8, anchor = null, off = 0;
        $$('.pc', sec).some(function (c) { var r = c.getBoundingClientRect(); if (r.bottom > line) { anchor = c; off = r.top; return true; } return false; });
        Cols.set(b.dataset.cols);
        if (anchor) { var d = anchor.getBoundingClientRect().top - off; if (Math.abs(d) > 1) jumpBy(d); }
        if (hasG) ScrollTrigger.refresh();
      });
    });
    Cols.on(function (v) { $$('.vtog__b', box).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cols === v)); }); });
  }
  var bhEls = [];
  function goY(y) { y = Math.max(0, y); if (lenis) lenis.scrollTo(y, { duration: .7 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }
  function jumpBy(d) { var y = window.pageYOffset + d; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }
  function bottomHeader(el, labels, onSelect) {
    el.innerHTML = '<div class="bh__in"><div class="bh__scroll"><div class="bh__list" role="tablist" aria-label="' + esc(el.getAttribute('aria-label') || '분류') + '">' +
      labels.map(function (l, i) { return '<button type="button" class="bh__tab" role="tab" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + ' data-i="' + i + '">' + l + '</button>'; }).join('') + '</div></div></div>';
    el.removeAttribute('aria-label');
    var tabs = $$('.bh__tab', el), sc = $('.bh__scroll', el), sec = el.closest('section'), cur = 0;
    viewToggle(sec);
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
  // 2026-11-18 7차 담당자: 큰 카드에 모델 사진(FEAT_PHOTO)을 넣으며 사진 속 상품을 탭 첫 칸으로 옮김
  //   (전: 패딩 c455 · c449 …, 겨울조끼 c202 · c195 …, 플리스 자켓 c403 … c418 → 지금: c449 · c195 · c418이 첫 칸, 나머지 순서는 그대로)
  var SHOP = {
    outer: { kind: '시즌', feat: true, tabs: [
      { label: '패딩', keys: ['c449', 'c455', 'c472', 'c453', 'c458'], more: ['패딩 전체 보기', 'category.php?cat=' + enc('패딩')] },
      { label: '겨울조끼', keys: ['c195', 'c202', 'c200', 'c201', 'c204'], more: ['겨울조끼 전체 보기', 'category.php?cat=' + enc('조끼') + '&sub=' + enc('겨울조끼')] },
      { label: '플리스 자켓', keys: ['c418', 'c403', 'c408', 'c412', 'c416'], more: ['플리스 자켓 전체 보기', 'category.php?cat=' + enc('자켓') + '&sub=' + enc('플리스 자켓')] }
    ] },
    hood: { tabs: [
      { label: '후드', keys: ['c426', 'c440', 'c444', 'c433'], more: ['후드 티셔츠 전체 보기', 'category.php?cat=' + enc('후드 티셔츠')] },
      { label: '맨투맨', keys: ['c226', 'c224', 'c228', 'c225'], more: ['맨투맨 티셔츠 전체 보기', 'category.php?cat=' + enc('맨투맨 티셔츠')] }
    ] }
  };
  // 아래쪽 상품 섹션 두 개(index.html #outer2 · #hood2). 상품을 바꾸려면 여기에 tabs를 따로 적는다
  // v11(2026-11-17): 전에는 SHOP.outer · SHOP.hood를 그대로 다시 써서 제목 · 상품 사진이 위 섹션과 똑같이 두 번 나왔다(담당자: "중복되는 이미지가 있는 것 같다").
  // 그래서 위 섹션 · 랭킹 첫 탭(전체) · 겨울 시즌 줄에 나오지 않는 상품으로만 따로 채웠다. 고른 상품은 시안용이라 담당자 확인 뒤 바꿀 수 있다
  //   outer2 = 바람막이 · 패딩·조끼(제목 "현장에서 겹쳐 입는 바람막이·패딩"), hood2 = 후드 · 바지(제목 "위아래로 맞추는 후드·바지")
  //   큰 카드(첫 칸)는 1200px 사진(hi)이 없어 600px 상품 사진을 그대로 쓴다
  //   2026-11-18 7차 담당자: 큰 카드 첫 사진 = 모델 사진(FEAT_PHOTO). 사진 속 상품을 첫 칸으로 —
  //     바람막이: np09(접힌 카라)와 맞는 상품이 탭 안에 없어 c470 미니멀 카라 바람막이를 첫 칸에 넣었다(랭킹 전체 탭에도 나오는 상품 = 위 "겹치지 않게" 원칙의 예외).
  //       대신 c481(검정 스탠드 카라 블루종)을 뺐다: c470과 색 · 모양이 거의 같고, 5칸(큰 카드 + 4)을 넘기면 마지막 한 장이 혼자 아랫줄로 내려간다
  //     패딩·조끼: c461(np08)을 첫 칸으로(전: c466 · c461 …)
  SHOP.outer2 = { kind: '시즌', feat: true, tabs: [
    { label: '바람막이', keys: ['c470', 'c482', 'c473', 'c479', 'c477'], more: ['바람막이 자켓 전체 보기', 'category.php?cat=' + enc('자켓') + '&sub=' + enc('바람막이 자켓')] },
    { label: '패딩·조끼', keys: ['c461', 'c466', 'c463', 'c198', 'c196'], more: ['패딩 전체 보기', 'category.php?cat=' + enc('패딩')] }
  ] };
  SHOP.hood2 = { tabs: [
    { label: '후드', keys: ['c447', 'c431', 'c435', 'c446'], more: ['후드 티셔츠 전체 보기', 'category.php?cat=' + enc('후드 티셔츠')] },
    { label: '바지', keys: ['c118', 'c117', 'c116', 'c114'], more: ['바지 전체 보기', 'category.php?cat=' + enc('바지')] }
  ] };
  Object.keys(SHOP).forEach(function (id) {
    var cfg = SHOP[id], sec = $('#' + id); if (!sec) return;
    var bhEl = $('[data-bh]', sec), grid = $('[data-grid]', sec), more = $('[data-more]', sec);
    var tabs = cfg.tabs.map(function (t) { return { label: t.label, list: pick(t.keys), more: t.more }; }).filter(function (t) { return t.list.length; });
    if (!tabs.length || !bhEl || !grid) return;
    var first = true;
    bottomHeader(bhEl, tabs.map(function (t) { return esc(t.label); }), function (i, user) {
      var t = tabs[i], cards = renderGrid(grid, t.list, { kind: cfg.kind, fid: id + '-', feat: cfg.feat, slim: true });
      if (more) { more.textContent = t.more[0]; more.setAttribute('data-href', t.more[1]); }
      swap(cards, first, grid); first = false;
      if (user) snapTop(sec, bhEl);
      refresh();
    }).select(0);
  });

  // 협력브랜드 9곳: 브랜드를 바텀 헤더에서 고른다. 상품은 2026-11-11·14 noeul.shop 브랜드 목록 앞쪽 8개(js/brands.js)
  // v10: 탭은 글자 대신 흑백 로고(img/brands/). 아래 브랜드 정보 줄(로고 · 상품 수 · 전체 보기)은 없앰 — 맨 아래 "○○ 상품 전체 보기" 버튼은 그대로
  (function () {
    var sec = $('#brands'); if (!sec || !BR.length) return;
    var bhEl = $('[data-bh]', sec), grid = $('[data-grid]', sec), more = $('[data-more]', sec); if (!bhEl || !grid) return;
    var order = ['k2', 'eider'], list = order.map(function (k) { return BR.filter(function (b) { return b.key === k; })[0]; }).filter(Boolean)
      .concat(BR.filter(function (b) { return order.indexOf(b.key) < 0; }));
    var first = true;
    // v10 보정: 흰 배경을 지우고 여백을 자른 로고(img/brandlogo, _qa/_make_logos_v10.py). 숫자 = 그 파일의 가로 · 세로. 보이는 크기는 css/v10.css 8번에서 면적이 비슷하게 맞춘다
    var LOGO = { ace: [355, 118], artwin: [434, 55], eider: [416, 212], ipavv: [441, 105], k2: [381, 148], mentis: [382, 85], sseda: [439, 221], tbuc: [430, 138], ziben: [358, 338] };
    bhEl.classList.add('bh--logo');
    bottomHeader(bhEl, list.map(function (b) { return '<img class="bh__logo bh__logo--' + b.key + '" src="img/brandlogo/' + b.key + '.webp" width="' + (LOGO[b.key] || [b.w, b.h])[0] + '" height="' + (LOGO[b.key] || [b.w, b.h])[1] + '" alt="' + esc(b.en + ' ' + b.ko) + '" decoding="async" draggable="false">'; }), function (i, user) {
      var b = list[i], url = 'brand.php?cat=' + enc(b.en + ' ' + b.ko);
      if (more) { more.textContent = b.ko + ' 상품 전체 보기'; more.setAttribute('data-href', url); }
      var cards = renderGrid(grid, b.items.slice(0, 8).map(function (d) { return P['b' + d.id + '-np'] || P['b' + d.id]; }).filter(Boolean), { fid: 'br-' });
      swap(cards, first, grid);
      first = false;
      if (user) snapTop(sec, bhEl);
      refresh();
    }).select(0);
  })();
  bhSync();

  /* ============================================================
     8. 구매 후기 (v10, 프로세스 자리). 2026-11-15 실제 후기로 교체: 목록 = js/reviews.js(window.B2BT_REVIEWS), 사진 = img/reviews/.
     카드 = 사진(위, 3칸까지 · 더 있으면 +N) → 업체 · 품목 → 고객 글. 글을 받지 못한 곳은 "납품 사진"으로만 보인다(글을 지어 넣지 않는다).
     메인에는 앞의 6개(PC 3칸 × 2줄, 폰은 옆으로 밀기), 전부는 "후기 전체 보기" 팝업(#rvAll)에서. 사진을 누르면 크게 보기(#rvModal)
     ============================================================ */
  var REVIEWS = (window.B2BT_REVIEWS || []).map(function (r) {
    var md = r.media || [];
    if (!r.media) for (var k = 1; k <= Math.min(r.n || 0, 10); k++) { var b = 'img/reviews/' + r.id + '-' + ('0' + k).slice(-2); md.push({ t: 'img', src: b + '.webp', th: b + 't.webp' }); }
    return { id: r.id, name: r.name, item: r.item || '', text: r.text || '', star: r.star || 0, media: md };
  });
  (function () {
    var box = $('#rvList'); if (!box) return;
    var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.47 5.2 5.68.68-4.2 3.9 1.1 5.62L10 14.4l-5.05 2.8 1.1-5.62-4.2-3.9 5.68-.68z" fill="currentColor"/></svg>';
    var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.6v10.8a.6.6 0 0 0 .92.5l8.3-5.4a.6.6 0 0 0 0-1L9.42 6.1a.6.6 0 0 0-.92.5z" fill="currentColor"/></svg>';
    var MAIN = 6, MAXT = 3; // 메인에 보이는 후기 수 / 카드에 보이는 사진 칸 수(더 있으면 마지막 칸에 +N)
    function card(r, i) {
      var md = r.media, n = Math.min(md.length, MAXT);
      var cells = md.slice(0, n).map(function (m, k) {
        var rest = k === n - 1 ? md.length - n : 0, v = m.t === 'video';
        return '<button type="button" class="rv__ph' + (v ? ' rv__ph--v' : '') + '" data-r="' + i + '" data-k="' + k + '" aria-label="' + esc(r.name) + ' ' + (v ? '영상' : '사진') + ' ' + (k + 1) + ' 크게 보기' + (rest > 0 ? ' (외 ' + rest + '장)' : '') + '">' +
          '<img src="' + (v ? m.poster : m.th || m.src) + '" alt="" loading="lazy" decoding="async" draggable="false">' +
          (v ? '<span class="rv__play">' + PLAY + '</span>' : '') +
          (rest > 0 ? '<span class="rv__rest num">+' + rest + '</span>' : '') + '</button>';
      }).join('');
      var stars = ''; for (var s = 0; s < r.star; s++) stars += STAR;
      return '<article class="rv__card' + (r.text ? '' : ' rv__card--ph') + '">' +
        (cells ? '<div class="rv__gal rv__gal--' + n + '">' + cells + '</div>' : '') +
        '<div class="rv__body">' +
        (stars ? '<span class="rv__stars" role="img" aria-label="별점 5점 만점에 ' + r.star + '점">' + stars + '</span>' : '') +
        '<div class="rv__meta"><strong class="rv__co">' + esc(r.name) + '</strong>' + (r.item ? '<span class="rv__item">' + esc(r.item) + '</span>' : '') + (r.text ? '' : '<span class="rv__tag">납품 사진</span>') + '</div>' +
        (r.text ? '<p class="rv__text">' + esc(r.text) + '</p>' : '') +
        '</div></article>';
    }
    box.innerHTML = REVIEWS.slice(0, MAIN).map(card).join('');
    if (motion) gsap.from($$('.rv__card', box), { y: 36, opacity: 0, duration: .8, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: box, start: 'top 88%', once: true } });

    var vmN = 0; // 열려 있는 후기 팝업 수(전체 보기 위에 크게 보기가 겹쳐 열린다)
    function vm(d) { vmN = Math.max(0, vmN + d); root.classList.toggle('is-vm', vmN > 0); }
    function trap(e, f) { // Tab이 팝업 밖으로 나가지 않게
      f = f.filter(function (x) { return x && !x.hidden && x.offsetParent !== null; }); if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey ? i <= 0 : i === f.length - 1 || i < 0) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
    }

    // 사진 크게 보기: 여러 장이면 좌우로 넘긴다(← → 키, 옆으로 밀기). 닫기 · 바깥 · Esc
    var modal = $('#rvModal'), stage = $('#rvmStage'); if (!modal || !stage) return;
    var prevB = $('#rvmPrev'), nextB = $('#rvmNext'), cnt = $('#rvmCnt'), closeB = $('.vm__x', modal), on = false, last = null, cur = [], who = '', at = 0;
    var all = $('#rvAll'), allOn = false, openedAt = 0, allClose = function () {}; // 전체 보기 팝업(아래에서 채운다)
    function draw() {
      var m = cur[at], old = $('video', stage); if (old) old.pause();
      if (m.t === 'video') {
        stage.innerHTML = '<video class="rvm__m" controls playsinline preload="metadata" poster="' + m.poster + '"></video>';
        var v = $('video', stage); v.src = m.src + '.' + (v.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm');
        var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      } else stage.innerHTML = '<img class="rvm__m" src="' + m.src + '" alt="' + esc(who) + ' 후기 사진 ' + (at + 1) + '" decoding="async" draggable="false">';
      var many = cur.length > 1; prevB.hidden = nextB.hidden = !many;
      cnt.textContent = who + (many ? '  ·  ' + (at + 1) + ' / ' + cur.length : '');
      if (many && cur[(at + 1) % cur.length].t !== 'video') { var pre = new Image(); pre.src = cur[(at + 1) % cur.length].src; } // 다음 장 미리 받기
    }
    function go(d) { if (cur.length < 2) return; at = (at + d + cur.length) % cur.length; draw(); }
    function open(r, k, from) {
      var rv = REVIEWS[r]; cur = (rv && rv.media) || []; if (!cur.length) return;
      who = rv.name; at = Math.min(k, cur.length - 1); last = from;
      if (!on) { on = true; modal.hidden = false; locks++; syncLock(); vm(1); requestAnimationFrame(function () { if (on) modal.classList.add('is-on'); }); }
      draw(); closeB.focus({ preventScroll: true });
    }
    function close() {
      if (!on) return; on = false;
      var v = $('video', stage); if (v) v.pause(); stage.innerHTML = '';
      modal.classList.remove('is-on'); modal.hidden = true; locks = Math.max(0, locks - 1); syncLock(); vm(-1);
      if (last && last.focus) last.focus({ preventScroll: true });
    }
    function onPhoto(e) { var b = e.target.closest('.rv__ph'); if (b) open(+b.dataset.r, +b.dataset.k, b); }
    box.addEventListener('click', onPhoto);
    $$('[data-rvm-close]', modal).forEach(function (x) { x.addEventListener('click', close); });
    prevB.addEventListener('click', function () { go(-1); }); nextB.addEventListener('click', function () { go(1); });
    // 사진 옆 어두운 빈 곳(사진 칸 · 틀 자체)을 눌러도 닫힌다
    [stage, $('.rvm__box', modal)].forEach(function (x) { if (x) x.addEventListener('click', function (e) { if (e.target === x) close(); }); });
    // 키는 문서에서 받는다: 사진이나 빈 곳을 눌러 포커스가 팝업 밖(body)으로 빠져도 ← → Esc · Tab 가두기가 듣는다. 위에 열린 것(크게 보기)부터 처리
    function onKey(e) {
      if (on) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { if (document.activeElement && document.activeElement.tagName === 'VIDEO') return; e.preventDefault(); go(e.key === 'ArrowLeft' ? -1 : 1); return; }
        if (e.key === 'Tab') trap(e, [$('video', stage), prevB, nextB, closeB]);
        return;
      }
      if (allOn) {
        if (e.key === 'Escape') { e.preventDefault(); allClose(); return; }
        if (e.key === 'Tab') trap(e, $$('button', all));
      }
    }
    document.addEventListener('keydown', onKey);
    var tx = null;
    stage.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1); }, { passive: true });

    // 후기 전체 보기 팝업: 모든 후기를 한 화면에 모아 본다. 위 단추로 전체 / 글 후기 / 납품 사진을 고른다
    var openB = $('#rvAllOpen'); if (!all || !openB) return;
    var grid = $('#rvaGrid'), scroller = $('#rvaScroll'), tabs = $$('.rva__tab', all), allX = $('.rva__x', all), filt = 'all';
    var nText = REVIEWS.filter(function (r) { return r.text; }).length, COUNT = { all: REVIEWS.length, text: nText, photo: REVIEWS.length - nText };
    $$('[data-rv-count]').forEach(function (x) { x.textContent = REVIEWS.length; });
    tabs.forEach(function (t) { var c = $('.num', t); if (c) c.textContent = COUNT[t.dataset.f]; if (!COUNT[t.dataset.f]) t.hidden = true; });
    // 글 후기 · 납품 사진 중 한쪽만 있으면 고를 게 없으므로 단추 줄을 통째로 숨긴다(전체 23 · 글 후기 23처럼 겹쳐 보이지 않게)
    var tabBox = $('.rva__tabs', all); if (tabBox && (!COUNT.text || !COUNT.photo)) tabBox.hidden = true;
    function fill() {
      grid.innerHTML = REVIEWS.map(function (r, i) { return filt === 'all' || (filt === 'text') === !!r.text ? card(r, i) : ''; }).join('');
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.dataset.f === filt)); });
      scroller.scrollTop = 0;
    }
    function allOpen() {
      if (allOn) return; allOn = true; openedAt = performance.now(); filt = 'all'; fill();
      all.hidden = false; scroller.scrollTop = 0; locks++; syncLock(); vm(1); requestAnimationFrame(function () { if (allOn) all.classList.add('is-on'); });
      allX.focus({ preventScroll: true });
    }
    allClose = function () {
      if (!allOn) return; allOn = false;
      all.classList.remove('is-on'); all.hidden = true; grid.innerHTML = ''; locks = Math.max(0, locks - 1); syncLock(); vm(-1);
      openB.focus({ preventScroll: true });
    };
    openB.addEventListener('click', function (e) { e.preventDefault(); allOpen(); });
    $$('[data-rva-close]', all).forEach(function (x) { x.addEventListener('click', allClose); });
    tabs.forEach(function (t) { t.addEventListener('click', function () { if (filt !== t.dataset.f) { filt = t.dataset.f; fill(); } }); });
    grid.addEventListener('click', function (e) { if (performance.now() - openedAt > 350) onPhoto(e); }); // 여는 버튼을 연달아 두 번 눌렀을 때 두 번째가 사진으로 떨어지지 않게
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

  })();

  /* ---------- 품목별 보기(v8에서 가져옴): 마우스를 올리거나 초점이 가면 그 조각이 넓어진다.
     터치 화면(PC 폭)에서는 첫 번째 누름으로 넓히고 두 번째 누름에 이동한다. 폰 폭(≤900)은 옆으로 넘기는 카드라 바로 이동 ---------- */
  (function () {
    var row = $('#cgRow'); if (!row) return;
    var items = $$('.cgs', row);
    function on(el) { items.forEach(function (x) { x.classList.toggle('is-on', x === el); }); }
    items.forEach(function (el) {
      var a = $('a', el);
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(el); });
      a.addEventListener('focus', function () { on(el); });
      a.addEventListener('click', function (e) { if (!fine && wideQ.matches && !el.classList.contains('is-on')) { e.preventDefault(); e.stopPropagation(); on(el); } }, true);
    });
  })();

  window.addEventListener('load', function () { if (hasG) ScrollTrigger.refresh(); });
})();
