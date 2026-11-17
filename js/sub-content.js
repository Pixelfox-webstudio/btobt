/* 비투비티 하위 페이지 · sub-content.js (2026-11-17)
   구매후기 목록·상세 · 이벤트 목록·상세 · 납품사례. body[data-page] 로 페이지를 가른다.
   - 후기 · 납품 업체 · 사진은 js/reviews.js(window.B2BT_REVIEWS) 자료 그대로다.
   - 자료에 없는 값(후기 평가 수치 · 업종 · 등록일, 이벤트, 납품사례 설명)은 아래 표의 견본 값이고 화면에서 data-sample 이 붙는다.
   - reviews.js 의 temp:1 글은 고객 글이 아닌 화면 확인용 임시 글이라 글 칸에 data-sample 을 붙인다. 글이 없는 후기에 글을 지어 넣지 않는다. */
(function () {
  'use strict';
  var SUB = window.SUB; if (!SUB) return;
  var $ = SUB.$, $$ = SUB.$$, esc = SUB.esc, qs = SUB.qs;
  var page = document.body.getAttribute('data-page') || '';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setUrl(key, val) { try { var u = new URL(location.href); u.searchParams.set(key, val); history.replaceState(null, '', u); } catch (e) {} }

  /* ---------- 자료 ---------- */
  // 사진 크기: P = 1125×1500(작은 것 570×760), L = 1500×1125(760×570), 그 밖은 '원본/작은 것'
  var SZ = { allfirst: 'P P', chonggak: '466x621/466x621 966x725/760x570 725x966/570x760 350x466/350x466', cleansoom: 'P P', didimdol: 'L L', gcc: '466x621/466x621 466x621/466x621 466x621/466x621 466x621/466x621 466x621/466x621', its: 'P P P 862x1150/570x760 P P P L', jnpolice: 'P P L P P P', koen: 'P P', kzx: '1320x1500/669x760', maeil: 'P', meister: 'P P P P L P P L', nextro: 'P P P', pnu: 'P P P P L L L P', redcrab: '966x725/760x570 966x725/760x570 966x725/760x570 466x350/466x350 966x725/760x570 966x725/760x570', rocky: 'P', saenggak: 'P P', settup: 'P P P P P P P P P', siemens: 'L', sikbom: 'P P P', sk: 'L P P P P P P P P', solomon: 'P P P', spacepro: 'P P', taeseo: '966x1288/570x760 966x725/760x570 466x621/466x621 466x621/466x621 966x725/760x570 966x1288/570x760 466x621/466x621 966x1288/570x760' };
  function photos(r) {
    var codes = (SZ[r.id] || '').split(' ').filter(Boolean), out = [];
    for (var k = 0; k < (r.n || 0); k++) {
      var c = codes[k] || 'P', f, t;
      if (c === 'P') { f = [1125, 1500]; t = [570, 760]; }
      else if (c === 'L') { f = [1500, 1125]; t = [760, 570]; }
      else { var m = c.split('/'); f = m[0].split('x').map(Number); t = m[1].split('x').map(Number); }
      var base = 'img/reviews/' + r.id + '-' + ('0' + (k + 1)).slice(-2);
      out.push({ src: base + '.webp', th: base + 't.webp', w: f[0], h: f[1], tw: t[0], th2: t[1] });
    }
    return out;
  }
  // 견본 값: [업종, 평가 수치, 등록일]. 운영 자료로 바뀔 자리다(화면에서 data-sample).
  // 업종은 요소 목록이 모든 후기에 요구해 23건 모두 채웠다. 이름에서 분명한 13곳 외 10곳(sk settup its meister redcrab gcc spacepro allfirst nextro rocky)은
  // 이름·글에서 짐작한 견본이라 실제 업종으로 반드시 바꾼다(spec/questions/content.md). 비우면 카드·상세에서 업종 칩·줄을 그리지 않는다
  var META = {
    pnu: ['대학교', 5, '2026-11-12'], taeseo: ['식품 제조', 5, '2026-11-06'], maeil: ['식품 제조', 5, '2026-10-30'], sk: ['제조', 4.5, '2026-10-23'],
    settup: ['무역', 5, '2026-10-16'], its: ['정보통신', 4.5, '2026-10-08'], meister: ['서비스', 5, '2026-09-30'], redcrab: ['외식', 4.8, '2026-09-22'],
    jnpolice: ['공공기관', 5, '2026-09-15'], gcc: ['스튜디오', 4.5, '2026-09-05'], chonggak: ['이사 서비스', 5, '2026-08-27'], solomon: ['공공기관', 5, '2026-08-19'],
    sikbom: ['식자재 유통', 4.5, '2026-08-11'], spacepro: ['인테리어', 5, '2026-08-01'], allfirst: ['서비스', 4.5, '2026-07-24'], cleansoom: ['청소 서비스', 5, '2026-07-15'],
    saenggak: ['배달 대행', 4.5, '2026-07-07'], koen: ['공기업', 5, '2026-06-26'], didimdol: ['대학교', 5, '2026-06-18'], siemens: ['에너지', 4.5, '2026-06-09'],
    kzx: ['산업 장비', 5, '2026-05-29'], nextro: ['협동조합', 4.5, '2026-05-20'], rocky: ['제조', 5, '2026-05-12']
  };
  var REVIEWS = (window.B2BT_REVIEWS || []).map(function (r) {
    var m = META[r.id] || ['', 0, ''];
    return { id: r.id, name: r.name, item: r.item || '', text: r.text || '', temp: !!r.temp, star: r.star || m[1], starSample: !r.star, ind: m[0], date: m[2], ph: photos(r) };
  });
  function findReview(id) { for (var i = 0; i < REVIEWS.length; i++) if (REVIEWS[i].id === id) return REVIEWS[i]; return null; }

  // 이벤트 견본(자료 없음). 사진은 현장 연출(AI) 사진
  var EVENTS = [
    { id: 1, t: '겨울 방한 단체복 모음', d: '2026-11-10', img: ['img/v5/bn-h05.webp', 2400, 1021], body: ['img/v5/bn-h05-m.webp', 1000, 1250] },
    { id: 2, t: '신규 기업회원 가입 안내', d: '2026-11-03', img: ['img/v5/duo-uniform.webp', 1400, 875], body: ['img/v5/duo-uniform.webp', 1400, 875] },
    { id: 3, t: '협력브랜드 케이투 방한 자켓 모음', d: '2026-10-27', img: ['img/v5/bn-k04.webp', 2400, 1021], body: ['img/v5/bn-k04-m.webp', 1000, 1250] },
    { id: 4, t: '현장 작업복 모음', d: '2026-10-13', img: ['img/v7/cta-f02.webp', 2000, 1131], body: ['img/v7/cta-f02-m.webp', 1000, 1250] }
  ];

  // 납품사례: 업체 = reviews.js 의 업체 이름, 사진 = 그 업체 후기 사진. 설명은 견본(있는 곳만). NOCASE = 사례가 아직 없는 업체(누를 수 없음)
  var CASE_DESC = {
    pnu: '방한 점퍼에 자수를 넣어 납품했습니다.', taeseo: '집업 카라 티셔츠에 회사 로고를 인쇄해 납품했습니다.', sk: '방한 점퍼와 조끼를 함께 납품했습니다.',
    settup: '호주 업체에 방한 점퍼와 반팔 티셔츠를 납품했습니다.', its: '방한 점퍼와 카라 티셔츠를 같은 색으로 맞춰 납품했습니다.',
    jnpolice: '안전 조끼에 문구를 인쇄해 납품했습니다.', koen: '반팔 티셔츠를 사이즈별로 나누어 포장해 납품했습니다.', chonggak: '카라 티셔츠를 납품했습니다.'
  };
  var NOCASE = { siemens: 1, kzx: 1, rocky: 1 };

  /* ---------- 공통 조각 ---------- */
  var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1.8l2.47 5.2 5.68.68-4.2 3.9 1.1 5.62L10 14.4l-5.05 2.8 1.1-5.62-4.2-3.9 5.68-.68z" fill="currentColor"/></svg>';
  var ROW = STAR + STAR + STAR + STAR + STAR;
  function rate(r, max) {
    if (!r.star) return '';
    var v = r.star.toFixed(1), pct = Math.max(0, Math.min(100, r.star / 5 * 100));
    return '<span class="ct-rate"' + (r.starSample ? ' data-sample' : '') + '><span class="ct-star" role="img" aria-label="평가 5점 만점에 ' + v + '점"><span class="ct-star__bg">' + ROW + '</span><span class="ct-star__on" style="width:' + pct + '%">' + ROW + '</span></span>' +
      '<b class="ct-rate__n num" aria-hidden="true">' + v + (max ? '<small> / 5</small>' : '') + '</b></span>';
  }
  var CHEV_L = '<i class="i i-chev-l i--18" aria-hidden="true"></i>', CHEV_R = '<i class="i i-chev-r i--18" aria-hidden="true"></i>';

  /* 사진 넘기기: .ct-car > .ct-car__track > .ct-car__slide × n, [data-dir] 이전·다음, [data-go] 바로 가기, .ct-car__cnt b 지금 번호 */
  function carousel(root) {
    var track = $('.ct-car__track', root); if (!track) return;
    var n = $$('.ct-car__slide', track).length, cur = -1, timer;
    var goes = $$('[data-go]', root), cnt = $('.ct-car__cnt b', root), prev = $('[data-dir="-1"]', root), next = $('[data-dir="1"]', root);
    function set(i) {
      if (i === cur) return; cur = i;
      goes.forEach(function (g, k) { if (k === i) g.setAttribute('aria-current', 'true'); else g.removeAttribute('aria-current'); });
      if (cnt) cnt.textContent = i + 1;
      if (prev) prev.disabled = i <= 0;
      if (next) next.disabled = i >= n - 1;
      var on = goes[i]; if (on && on.closest('.ct-rd__thumbs')) { var strip = on.parentNode; var l = on.offsetLeft - strip.clientWidth / 2 + on.clientWidth / 2; strip.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' }); }
      root.dispatchEvent(new CustomEvent('car:change', { detail: i }));
    }
    function go(i) { i = Math.max(0, Math.min(n - 1, i)); track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); set(i); }
    track.addEventListener('scroll', function () { clearTimeout(timer); timer = setTimeout(function () { set(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))); }, 70); }, { passive: true });
    root.addEventListener('click', function (e) {
      var d = e.target.closest('[data-dir]'); if (d && root.contains(d)) { e.preventDefault(); go(cur + Number(d.getAttribute('data-dir'))); return; }
      var g = e.target.closest('[data-go]'); if (g && root.contains(g)) { e.preventDefault(); go(Number(g.getAttribute('data-go'))); }
    });
    root.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    });
    root.classList.toggle('is-one', n < 2);
    set(0);
    root._go = go;
  }

  /* ---------- 구매후기 목록 ---------- */
  function rvCard(r, i) {
    var href = 'review-view.php?id=' + r.id, ph = r.ph.slice(0, 5), n = ph.length, lazy = i > 2;
    var slides = ph.map(function (p, k) {
      return '<a class="ct-car__slide" href="#" data-href="' + href + '" tabindex="-1" aria-hidden="true"><img src="' + p.th + '" alt="" width="' + p.tw + '" height="' + p.th2 + '"' + (lazy || k ? ' loading="lazy"' : '') + ' decoding="async" draggable="false"></a>';
    }).join('');
    var dots = n > 1 ? '<div class="ct-car__dots" role="group" aria-label="' + esc(r.name) + ' 후기 사진 고르기">' + ph.map(function (p, k) { return '<button type="button" data-go="' + k + '" aria-label="사진 ' + (k + 1) + '"><i></i></button>'; }).join('') + '</div>' : '';
    var ui = n > 1 ? '<span class="ct-car__cnt num" aria-hidden="true"><b>1</b>/' + n + '</span>' +
      '<button type="button" class="ct-car__nav ct-car__nav--p" data-dir="-1" aria-label="' + esc(r.name) + ' 후기 이전 사진">' + CHEV_L + '</button>' +
      '<button type="button" class="ct-car__nav ct-car__nav--n" data-dir="1" aria-label="' + esc(r.name) + ' 후기 다음 사진">' + CHEV_R + '</button>' + dots : '';
    return '<article class="rv__card ct-rv">' +
      (n ? '<div class="ct-car ct-rv__media">' + '<div class="ct-car__track">' + slides + '</div>' + ui + '</div>' : '') +
      '<a class="rv__body ct-rv__body" href="#" data-href="' + href + '">' +
      '<div class="ct-rv__top">' + rate(r) + (r.ind ? '<span class="stag ct-rv__ind" data-sample>' + esc(r.ind) + '</span>' : '') + '</div>' +
      '<div class="rv__meta"><strong class="rv__co">' + esc(r.name) + '</strong>' + (r.item ? '<span class="rv__item">' + esc(r.item) + '</span>' : '') + (r.text ? '' : '<span class="rv__tag">납품 사진</span>') + '</div>' +
      (r.text ? '<p class="rv__text ct-rv__text"' + (r.temp ? ' data-sample' : '') + '>' + esc(r.text) + '</p>' : '') +
      '</a></article>';
  }
  function initReviews() {
    var list = $('#ctRvList'); if (!list) return;
    var pager = $('#ctRvPager'), all = SUB.has('empty') ? [] : REVIEWS, per = 12, total = Math.ceil(all.length / per);
    var cur = Math.max(1, Math.min(Math.max(1, total), parseInt(qs.get('page'), 10) || 1));
    var cnt = $('#ctRvCount'); if (cnt) cnt.textContent = all.length;
    if (!all.length) { $$('[data-ct-list]').forEach(function (x) { x.hidden = true; }); var em = $('#ctRvEmpty'); if (em) em.classList.add('st-on'); return; }
    function draw(p, scroll) {
      cur = p;
      list.innerHTML = all.slice((p - 1) * per, p * per).map(rvCard).join('');
      $$('.ct-car', list).forEach(carousel);
      pager.innerHTML = window.SUBDATA ? SUBDATA.pager(p, total, true) : '';
      pager.hidden = total < 2;
      if (scroll) {
        setUrl('page', p);
        var top = list.closest('.ct-band') || list, y = top.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    pager.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-page]'); if (!b || b.getAttribute('aria-disabled') === 'true') return;
      var p = Number(b.getAttribute('data-page')); if (p !== cur) draw(p, true);
    });
    draw(cur, false);
  }

  /* ---------- 구매후기 상세 ---------- */
  function initReview() {
    var box = $('#ctRd'); if (!box) return;
    var r = SUB.has('notfound') ? null : findReview(qs.get('id') || 'pnu');
    if (!r) { box.hidden = true; var g = $('#ctRdNone'); if (g) g.classList.add('st-on'); return; }
    var ph = r.ph, n = ph.length;
    var slides = ph.map(function (p, k) { return '<figure class="ct-car__slide"><img src="' + p.src + '" alt="' + esc(r.name) + ' 후기 사진 ' + (k + 1) + '" width="' + p.w + '" height="' + p.h + '"' + (k ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async" draggable="false"></figure>'; }).join('');
    var thumbs = n > 1 ? '<div class="ct-rd__thumbs" role="group" aria-label="사진 고르기" data-lenis-prevent-touch>' + ph.map(function (p, k) { return '<button type="button" data-go="' + k + '" aria-label="사진 ' + (k + 1) + ' 보기"><img src="' + p.th + '" alt="" width="' + p.tw + '" height="' + p.th2 + '" loading="lazy" decoding="async" draggable="false"></button>'; }).join('') + '</div>' : '';
    // 사진 칸(넘기기) + 그 아래 작은 그림 줄을 한 .ct-car 로 묶는다(작은 그림 = [data-go])
    var gal = $('#ctRdGal');
    gal.innerHTML = '<div class="ct-car ct-rd__car"><div class="ct-rd__stage" tabindex="0" role="group" aria-roledescription="사진 넘기기" aria-label="' + esc(r.name) + ' 후기 사진 ' + n + '장' + (n > 1 ? '. 좌우 화살표 키로 넘깁니다' : '') + '">' +
      '<div class="ct-car__track">' + slides + '</div>' +
      (n > 1 ? '<button type="button" class="ct-car__nav ct-car__nav--p" data-dir="-1" aria-label="이전 사진">' + CHEV_L + '</button><button type="button" class="ct-car__nav ct-car__nav--n" data-dir="1" aria-label="다음 사진">' + CHEV_R + '</button><span class="ct-car__cnt num" aria-live="polite"><b>1</b> / ' + n + '</span>' : '') +
      '</div>' + thumbs + '</div>';
    carousel($('.ct-rd__car', gal));
    $('#ctRdRate').innerHTML = rate(r, true);
    $('#ctRdCo').textContent = r.name;
    var dl = '';
    if (r.ind) dl += '<div><dt>업종</dt><dd data-sample>' + esc(r.ind) + '</dd></div>';
    if (r.item) dl += '<div><dt>품목</dt><dd>' + esc(r.item) + '</dd></div>';
    if (r.date) dl += '<div><dt>등록일</dt><dd class="num" data-sample>' + r.date + '</dd></div>';
    dl += '<div><dt>사진</dt><dd><span class="num">' + n + '</span>장</dd></div>';
    $('#ctRdDl').innerHTML = dl;
    var tx = $('#ctRdText');
    if (r.text) { tx.textContent = r.text; if (r.temp) tx.setAttribute('data-sample', ''); }
    else { tx.innerHTML = '<span class="rv__tag">납품 사진</span> 고객이 남긴 글 없이 납품 사진만 등록된 후기입니다.'; tx.classList.add('ct-rd__text--none'); }
    document.title = r.name + ' 구매후기 | 비투비티';
  }

  /* ---------- 이벤트 목록 · 상세 ---------- */
  function evImg(e, src, lazy, cls) {
    return '<div class="' + cls + '" data-slot="event-이미지" data-temp="ai"><img src="' + src[0] + '" alt="' + esc(e.t) + '" width="' + src[1] + '" height="' + src[2] + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async" draggable="false"><p class="ct-note">연출 이미지입니다.</p></div>';
  }
  function initEvents() {
    var list = $('#ctEvList'); if (!list) return;
    var all = SUB.has('empty') ? [] : EVENTS;
    var cnt = $('#ctEvCount'); if (cnt) cnt.textContent = all.length;
    if (!all.length) { $$('[data-ct-list]').forEach(function (x) { x.hidden = true; }); var em = $('#ctEvEmpty'); if (em) em.classList.add('st-on'); return; }
    list.innerHTML = all.map(function (e, i) {
      return '<li><a class="ct-ev" href="#" data-href="event-view.php?id=' + e.id + '" data-sample>' + evImg(e, e.img, i > 1, 'ct-ev__img') + '<p class="ct-ev__t">' + esc(e.t) + '</p></a></li>';
    }).join('');
  }
  function initEvent() {
    var box = $('#ctEd'); if (!box) return;
    var id = Number(qs.get('id') || 1), e = null;
    if (!SUB.has('notfound')) EVENTS.forEach(function (x) { if (x.id === id) e = x; });
    if (!e) { box.hidden = true; var g = $('#ctEdNone'); if (g) g.classList.add('st-on'); return; }
    $('#ctEdT').textContent = e.t;
    $('#ctEdDate').textContent = e.d;
    $('#ctEdBody').innerHTML = evImg(e, e.body, false, 'ct-ed__img' + (e.body[2] > e.body[1] ? ' ct-ed__img--tall' : ''));
    document.title = e.t + ' | 비투비티';
  }

  /* ---------- 납품사례 ---------- */
  function initCases() {
    var logos = $('#ctLogos'); if (!logos) return;
    var all = SUB.has('empty') ? [] : REVIEWS;
    if (!all.length) { $$('[data-ct-list]').forEach(function (x) { x.hidden = true; }); var em = $('#ctCaseEmpty'); if (em) em.classList.add('st-on'); return; }
    var hasCase = function (r) { return !NOCASE[r.id] && (r.ph.length || CASE_DESC[r.id]); };
    var cnt = $('#ctCoCount'); if (cnt) cnt.textContent = all.length;
    logos.innerHTML = all.map(function (r) {
      var mark = '<span class="ct-logo__mark" data-slot="client-logo">' + esc(r.name) + '</span>';
      if (!hasCase(r)) return '<li><div class="ct-logo ct-logo--off">' + mark + '<span class="sr-only">(등록된 사례 없음)</span></div></li>';
      return '<li><button type="button" class="ct-logo" data-co="' + r.id + '" aria-pressed="false" aria-controls="ctCase">' + mark + '<span class="ct-logo__n">사진 <span class="num">' + r.ph.length + '</span>장</span></button></li>';
    }).join('');
    var caseBox = $('#ctCase'), cur = null;
    // 폰(600 이하)의 가로 밀기 줄: 고른 업체 칸이 다 보이지 않으면 그 칸의 왼쪽을 줄의 왼쪽 여백에 맞춘다.
    // 칸이 scroll-snap-align:start(proximity) 라서 가운데로 옮기지 않는다(가까운 시작점으로 다시 붙어 칸이 잘렸다).
    // 첫 화면에서는 WebKit 이 불러오기가 끝날 때 줄을 처음 위치로 되돌리므로 load 뒤에 한 번 더 맞추고, 폭이 바뀔 때도 맞춘다
    function reveal(smooth) {
      var sel = $('.ct-logo[aria-pressed="true"]', logos);
      if (!sel || logos.scrollWidth <= logos.clientWidth + 1) return;
      var lr = logos.getBoundingClientRect(), sr = sel.getBoundingClientRect(), cs = getComputedStyle(logos);
      var padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
      if (sr.left < lr.left + padL - 1 || sr.right > lr.right - padR + 1) logos.scrollTo({ left: Math.max(0, logos.scrollLeft + sr.left - lr.left - padL), behavior: smooth && !reduce ? 'smooth' : 'auto' });
    }
    var rsz; window.addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(function () { reveal(false); }, 120); });
    if (document.readyState === 'complete') setTimeout(function () { reveal(false); }, 0);
    else window.addEventListener('load', function () { setTimeout(function () { reveal(false); }, 0); });
    function show(id, scroll) {
      var r = findReview(id); if (!r || !hasCase(r)) r = all.filter(hasCase)[0]; if (!r) return;
      cur = r;
      $$('.ct-logo[data-co]', logos).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-co') === r.id)); });
      reveal(scroll);
      var desc = CASE_DESC[r.id];
      $('#ctCaseHead').innerHTML =
        '<span class="ct-case__logo" data-slot="client-logo"><span>' + esc(r.name) + '</span></span>' +
        '<div class="ct-case__info"><h2 class="ct-case__t" id="ctCaseT">' + esc(r.name) + '</h2>' +
        '<dl class="ct-case__dl"><div><dt>납품 품목</dt><dd>' + esc(r.item || '-') + '</dd></div><div><dt>사진</dt><dd><span class="num">' + r.ph.length + '</span>장</dd></div></dl>' +
        (desc ? '<p class="ct-case__d" data-sample>' + esc(desc) + '</p>' : '') + '</div>';
      $('#ctPhotos').innerHTML = r.ph.map(function (p, k) {
        return '<li><button type="button" class="ct-ph" data-k="' + k + '" aria-label="' + esc(r.name) + ' 납품 사진 ' + (k + 1) + ' 크게 보기"><img src="' + p.th + '" alt="" width="' + p.tw + '" height="' + p.th2 + '" loading="lazy" decoding="async" draggable="false"><span class="ct-ph__zoom" aria-hidden="true"><i class="i i-zoom i--18"></i></span></button></li>';
      }).join('');
      if (scroll) {
        setUrl('co', r.id);
        var top = caseBox.getBoundingClientRect().top;
        if (top > window.innerHeight * 0.55 || top < 0) window.scrollTo({ top: Math.max(0, top + window.pageYOffset - 130), behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    logos.addEventListener('click', function (e) { var b = e.target.closest('.ct-logo[data-co]'); if (b) show(b.getAttribute('data-co'), true); });

    // 사진 크게 보기
    var lb = $('#ctLb'), k0 = 0;
    function lbDraw() {
      var p = cur.ph[k0], img = $('#ctLbImg');
      img.src = p.src; img.width = p.w; img.height = p.h; img.alt = cur.name + ' 납품 사진 ' + (k0 + 1);
      $('#ctLbCap').textContent = cur.name + (cur.item ? ' · ' + cur.item : '');
      $('#ctLbCnt').innerHTML = '<b>' + (k0 + 1) + '</b> / ' + cur.ph.length;
      var one = cur.ph.length < 2;
      $('#ctLbPrev').hidden = one; $('#ctLbNext').hidden = one;
      $('#ctLbPrev').disabled = k0 === 0; $('#ctLbNext').disabled = k0 === cur.ph.length - 1;
    }
    function lbOpen(k, from) { k0 = k; lbDraw(); SUB.pop(lb, from); }
    $('#ctPhotos').addEventListener('click', function (e) { var b = e.target.closest('.ct-ph'); if (b) lbOpen(Number(b.getAttribute('data-k')), b); });
    lb.addEventListener('click', function (e) {
      var d = e.target.closest('[data-lb]'); if (!d) return;
      var to = k0 + Number(d.getAttribute('data-lb')); if (to < 0 || to >= cur.ph.length) return; k0 = to; lbDraw();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'ArrowLeft' && k0 > 0) { k0--; lbDraw(); } else if (e.key === 'ArrowRight' && k0 < cur.ph.length - 1) { k0++; lbDraw(); }
    });
    show(qs.get('co') || '', false);
    if (SUB.has('zoom')) lbOpen(Math.min(2, cur.ph.length - 1));
  }

  if (page === 'reviews') initReviews();
  if (page === 'review-view') initReview();
  if (page === 'event') initEvents();
  if (page === 'event-view') initEvent();
  if (page === 'delivery-cases') initCases();
})();
