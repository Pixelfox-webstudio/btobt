/* 비투비티 하위 페이지 · sub-list.js (2026-11-17)
   상품 목록 세 페이지(category · brand · search)의 분류 고르기, 필터, 정렬, 쪽 번호. 상품 자료는 js/sub-data.js. */
(function () {
  'use strict';
  var D = window.SUBDATA, S = window.SUB; if (!D || !S) return;
  var $ = S.$, $$ = S.$$, esc = S.esc, qs = S.qs, page = document.body.getAttribute('data-page');
  var grid = $('#lgrid'); if (!grid) return;
  var PER = { category: 48, brand: 45, search: 30 }[page] || 48;
  var cat = qs.get('cat') || '', sub = qs.get('sub') || '', q = (qs.get('q') || '').trim().slice(0, 100);
  var mq = window.matchMedia('(max-width: 768px)');

  /* ---------- 분류별 소개(대표 사진 · 머리글 · 설명). 소개가 없는 분류는 공통 소개 ---------- */
  var COMMON = { pre: '단체로 맞추기 좋은', desc: '사이즈와 색상을 넉넉하게 갖춘 상품입니다. 수량과 인쇄 여부를 알려 주시면 견적을 안내합니다.', photos: [['img/v5/bn-h02.webp', '', '70% 30%']] };
  var INTRO = {
    '': { title: '단체복', pre: '기업·단체를 위한', desc: '티셔츠부터 패딩까지, 단체로 맞추기 좋은 상품을 모았습니다.', photos: [['img/v5/duo-uniform.webp', '작업 조끼를 입고 마주 앉은 두 사람', '50% 28%']] },
    '라운드 티셔츠': { pre: '가볍게 맞춰 입는', desc: '반팔·긴팔·아동용까지 라운드 티셔츠를 모았습니다.', photos: [['img/v5/duo-uniform.webp', '작업 조끼를 입고 마주 앉은 두 사람', '50% 28%'], ['img/v5/bn-h02.webp', '회색 벽 앞에 선 사람', '70% 30%']] },
    '작업복': { pre: '계절에 맞춰 고르는', desc: '봄·여름·가을·겨울 현장에 맞는 작업복을 모았습니다.', photos: [['img/v7/fd-build-w.webp', '건설 현장에서 쉬는 작업자', '50% 30%'], ['img/v7/fd-plant-w.webp', '공장에서 부품을 살피는 작업자', '60% 30%'], ['img/v7/fd-wood-w.webp', '목재를 자르는 작업자', '40% 35%'], ['img/v7/cta-f02.webp', '건설 현장에서 안내하는 작업자', '60% 30%']] }
  };

  /* ---------- 어떤 상품을 보여 줄지 ---------- */
  var base = [], tabs = [], title = '', best = null, inplace = false;
  var brand = null;
  function norm(s) { return String(s).toLowerCase().replace(/[\s\-_/·,.()]/g, ''); }
  if (page === 'category') {
    if (!cat) { base = D.list.slice(); title = '단체복'; tabs = [['', '전체보기']].concat(D.cats.map(function (c) { return [c, c]; })); }
    else if (cat === '작업복') {
      // 작업복 분류의 상품 자료가 없어 조끼·자켓·바지 상품을 견본으로 넣었다(운영 자료로 바뀔 자리)
      var seasonTab = { '봄·가을': ['봄 작업복', '가을 작업복'], '여름': ['여름 작업복'], '겨울': ['겨울 작업복'], '사계절': ['봄 작업복', '여름 작업복', '가을 작업복', '겨울 작업복'] };
      base = D.list.filter(function (p) { return /조끼|자켓|바지/.test(p.cat); }).map(function (p) { var o = Object.create(p); o.subs = seasonTab[p.season] || []; return o; });
      title = '작업복'; inplace = true;
      tabs = [['', '전체보기'], ['봄 작업복', '봄 작업복'], ['여름 작업복', '여름 작업복'], ['가을 작업복', '가을 작업복'], ['겨울 작업복', '겨울 작업복']];
      best = S.has('nobest') ? [] : base.filter(function (p, i) { return i % 4 === 1; }).slice(0, 8);
    } else {
      base = D.list.filter(function (p) { return p.cat === cat; }); title = cat; inplace = true;
      var names = { '라운드 티셔츠': [['반팔티', '반팔티'], ['긴팔티', '긴팔티'], ['반팔, 긴팔티', '반팔·긴팔'], ['아동용티', '아동용 티셔츠']] }[cat];
      if (!names) { var seen = []; base.forEach(function (p) { if (p.sub && seen.indexOf(p.sub) < 0) seen.push(p.sub); }); names = seen.map(function (s) { return [s, s]; }); }
      tabs = names.length ? [['', '전체보기']].concat(names) : [];
    }
  } else if (page === 'brand') {
    brand = D.brands.filter(function (b) { return cat && (b.key === cat || (b.en + ' ' + b.ko) === cat); })[0] || null;
    base = brand ? brand.items.slice() : D.brands.reduce(function (a, b) { return a.concat(b.items); }, []);
    title = '협력 브랜드';
    best = S.has('nobest') ? [] : (brand ? brand.items : base.filter(function (p, i) { return i % 9 === 2; })).slice(0, 6);
  } else {
    var all = D.list.concat(D.brands.reduce(function (a, b) { return a.concat(b.items); }, []));
    var words = q.split(/\s+/).filter(Boolean).slice(0, 10).map(norm);   // 낱말(최대 10개)을 모두 포함하는 상품
    base = !words.length ? all : all.filter(function (p) { var hay = norm([p.name, p.code, p.cat, p.brand ? '협력브랜드 ' + p.brandKo : '단체복', p.sub].join(' ')); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    title = q ? '‘' + q + '’ 검색 결과' : '전체 상품';
  }
  // 결과 없음 견본: 단체복은 목록을 그대로 두고 필터로 0건을 만든다(아래). 협력브랜드는 상품이 없는 브랜드라 베스트 줄도 없다
  if (S.has('empty') && page === 'brand') { base = []; best = null; }

  /* ---------- 머리(분류 소개 · 제목) ---------- */
  var hero = $('#lhero');
  if (hero) {
    var info = INTRO[cat] || COMMON, slides = info.photos, cur = 0;
    $('.lhero__t', hero).innerHTML = '<span class="tt__pre">' + esc(info.pre) + '</span> <span class="tt__key">' + esc(title) + '</span>';
    $('.lhero__d', hero).textContent = info.desc;
    var box = $('.lhero__slides', hero);
    box.innerHTML = slides.map(function (s, i) { return '<div class="lhero__slide' + (i ? '' : ' is-on') + '"' + (slides.length > 1 ? ' role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + slides.length + '"' : '') + '><img src="' + s[0] + '" alt="' + esc(s[1]) + '" width="1680" height="1120" style="--pos:' + s[2] + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async" draggable="false" data-slot="category-hero-' + (i + 1) + '" data-temp="ai"></div>'; }).join('');
    var ui = $('.lhero__ui', hero);
    if (slides.length > 1) {
      ui.hidden = false;
      var go = function (i) {
        cur = (i + slides.length) % slides.length;   // 끝없이 돈다
        $$('.lhero__slide', box).forEach(function (el, k) { el.classList.toggle('is-on', k === cur); });
        $('.lhero__cnt', ui).innerHTML = '<b>' + (cur + 1) + '</b><span> / ' + slides.length + '</span>';
        $('.lhero__prog i', ui).style.transform = 'scaleX(' + (cur + 1) / slides.length + ')';
      };
      $('[data-dir="-1"]', ui).addEventListener('click', function () { go(cur - 1); });
      $('[data-dir="1"]', ui).addEventListener('click', function () { go(cur + 1); });
      var x0 = null, frame = $('.lhero__frame', hero);   // 끌어서 넘기기
      frame.addEventListener('pointerdown', function (e) { if (!e.target.closest('a, button')) x0 = e.clientX; });
      frame.addEventListener('pointerup', function (e) { if (x0 == null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); });
      frame.addEventListener('pointercancel', function () { x0 = null; });
      go(0);
    }
    document.title = title + ' | 비투비티';
    var cr = $('#lcrumbNow'); if (cr) cr.textContent = title;
    var crUp = $('#lcrumbUp'); if (crUp) crUp.hidden = !cat;
  }
  var h1 = $('#ltitle'); if (h1) { h1.textContent = title; if (page === 'search') document.title = title + ' | 비투비티'; }

  /* ---------- 세부 분류(알약 줄) ---------- */
  var bh = $('#lbh');
  if (bh) {
    if (page === 'brand') {
      $('.bh__list', bh).innerHTML = '<button type="button" role="tab" class="bh__tab bh__tab--text" data-go=""' + (brand ? ' aria-selected="false"' : ' aria-selected="true"') + '>전체보기</button>' + D.brands.map(function (b) {
        return '<button type="button" role="tab" class="bh__tab" data-go="' + esc(b.en + ' ' + b.ko) + '" aria-selected="' + (brand === b) + '" aria-label="' + esc(b.en + ' ' + b.ko) + '"><img class="bh__logo bh__logo--' + b.key + '" src="' + b.logo + '" alt="" loading="lazy" decoding="async"></button>';
      }).join('');
    } else if (tabs.length) {
      $('.bh__list', bh).innerHTML = tabs.map(function (t) { return '<button type="button" role="tab" class="bh__tab" data-go="' + esc(t[0]) + '" aria-selected="' + (inplace ? t[0] === sub : t[0] === cat) + '">' + esc(t[1]) + '</button>'; }).join('');
    } else bh.hidden = true;
    bh.addEventListener('click', function (e) {
      var t = e.target.closest('.bh__tab'); if (!t) return;
      var v = t.getAttribute('data-go');
      if (inplace) { sub = v; pageNo = 1; $$('.bh__tab', bh).forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); }); resetFilters(); draw(true); return; }
      location.href = page + '.html' + (v ? '?cat=' + encodeURIComponent(v) : '');
    });
    var on = $('.bh__tab[aria-selected="true"]', bh); if (on && on.scrollIntoView) { var sc = $('.bh__scroll', bh); sc.scrollLeft = Math.max(0, on.offsetLeft - 40); }
  }

  /* ---------- 형태(협력브랜드) ---------- */
  var form = '', fgs = $('#lforms');
  function drawForms() {
    if (!fgs) return;
    var withForm = base.filter(function (p) { return p.form; });
    if (!brand || !withForm.length) { fgs.hidden = true; return; }
    fgs.hidden = false;
    var order = ['의류·작업복', '안전·보호구', '기타'], by = {};
    base.forEach(function (p) { (by[p.kind] = by[p.kind] || {})[p.form] = ((by[p.kind] || {})[p.form] || 0) + 1; });
    var html = '<div class="fg"><span class="fg__l">상품 구분</span><div class="fchips"><button type="button" class="fchip" data-form="" aria-pressed="' + (!form) + '">전체 <span class="num">' + base.length + '</span></button></div></div>';
    order.forEach(function (k) {   // 빈 묶음은 생략
      if (!by[k]) return;
      html += '<div class="fg"><span class="fg__l">' + k + '</span><div class="fchips">' + Object.keys(by[k]).map(function (f) { return '<button type="button" class="fchip" data-form="' + esc(f) + '" aria-pressed="' + (form === f) + '">' + esc(f) + ' <span class="num">' + by[k][f] + '</span></button>'; }).join('') + '</div></div>';
    });
    fgs.innerHTML = html;
  }
  fgs && fgs.addEventListener('click', function (e) { var b = e.target.closest('[data-form]'); if (!b) return; form = b.getAttribute('data-form'); pageNo = 1; drawForms(); drawBest(); draw(true); });

  /* ---------- 필터 ---------- */
  var GROUPS = page === 'brand' ? [] : [
    { key: 'material', label: '소재', get: function (p) { return [p.material]; } },
    { key: 'form', label: '형태', get: function (p) { return [p.form]; } },
    { key: 'color', label: '색상', get: function (p) { return p.colors.map(function (c) { return c.name; }); }, sw: true },
    { key: 'size', label: '사이즈', get: function (p) { return p.sizes.map(function (s) { return s.l; }); }, order: ['13호', '15호', '17호', '110', '120', '130', '140', '150', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', 'FREE'] },
    { key: 'band', label: '가격대', get: function (p) { return [p.band]; }, order: ['1만원 미만', '1만원대', '2만원대', '3만원대', '4만원대', '5만원 이상', '견적문의'] },
    { key: 'season', label: '시즌', get: function (p) { return [p.season]; }, order: ['봄·가을', '여름', '겨울', '사계절'] }
  ];
  var HEX = {}; Object.keys(D.color).forEach(function (h) { if (!HEX[D.color[h]]) HEX[D.color[h]] = h; });
  var sel = {}, draft = null;
  function resetFilters() { GROUPS.forEach(function (g) { sel[g.key] = []; }); }
  resetFilters();
  function scope() {   // 분류·세부 분류·형태까지 좁힌 목록(필터 선택지는 여기서 나온 값만)
    return base.filter(function (p) { return (!inplace || !sub || (p.subs ? p.subs.indexOf(sub) >= 0 : p.sub === sub || (cat === '라운드 티셔츠' && sub === '반팔티'))) && (!form || p.form === form); });
  }
  function options(g, list) {
    var seen = {}; list.forEach(function (p) { g.get(p).forEach(function (v) { if (v && v !== '기타') seen[v] = 1; }); });
    (sel[g.key] || []).forEach(function (v) { seen[v] = 1; });   // 이미 고른 값은 항상 포함
    var vals = Object.keys(seen);
    if (g.order) vals.sort(function (a, b) { var i = g.order.indexOf(a), j = g.order.indexOf(b); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j) || (parseFloat(a) - parseFloat(b)) || a.localeCompare(b); });
    else vals.sort(function (a, b) { return a.localeCompare(b, 'ko'); });
    return vals;
  }
  function pass(p, s) { return GROUPS.every(function (g) { var v = s[g.key]; if (!v || !v.length) return true; var mine = g.get(p); return v.some(function (x) { return mine.indexOf(x) >= 0; }); }); }
  function count(s) { return scope().filter(function (p) { return pass(p, s); }).length; }
  function nSel(s) { return GROUPS.reduce(function (a, g) { return a + (s[g.key] || []).length; }, 0); }
  function optsHTML(g, s) {
    return '<div class="fopts" role="group" aria-label="' + g.label + '">' + options(g, scope()).map(function (v) {
      return '<label class="fopt"><input type="checkbox" data-g="' + g.key + '" value="' + esc(v) + '"' + ((s[g.key] || []).indexOf(v) >= 0 ? ' checked' : '') + '><span>' + (g.sw ? '<em style="--c:' + (HEX[v] || '#ccc') + '"></em>' : '') + esc(v) + '</span></label>';
    }).join('') + '</div>';
  }
  var bar = $('#lbar'), fwrap = $('#lfilters'), pop = $('#fpop'), panel = $('#fpanel'), app = $('#lapp');
  function drawButtons() {
    if (!fwrap) return;
    var n = nSel(sel);
    fwrap.innerHTML = '<button type="button" class="fbtn fbtn--all' + (n ? ' is-set' : '') + '" data-fall aria-haspopup="dialog"><i class="i i-filter" aria-hidden="true"></i>필터' + (n ? ' <b>' + n + '</b>' : '') + '</button>' +
      GROUPS.map(function (g) { var c = sel[g.key].length; return '<button type="button" class="fbtn' + (c ? ' is-set' : '') + '" data-fg="' + g.key + '" aria-expanded="false" aria-haspopup="dialog">' + g.label + (c ? ' <b>' + c + '</b>' : '') + '<i class="i i-chev-d" aria-hidden="true"></i></button>'; }).join('');
    if (!app) return;
    var chips = [];
    GROUPS.forEach(function (g) { sel[g.key].forEach(function (v) { chips.push('<button type="button" class="fchip" data-rm="' + g.key + '" data-v="' + esc(v) + '" aria-label="' + esc(g.label + ' ' + v) + ' 필터 빼기">' + (g.sw ? '<span class="fchip__sw" style="--c:' + (HEX[v] || '#ccc') + '"></span>' : '') + esc(v) + '<i class="i i-x i--14 fchip__x" aria-hidden="true"></i></button>'); }); });
    app.hidden = !chips.length;
    app.innerHTML = chips.join('') + '<button type="button" class="lapp__clear" data-rm-all>필터 전부 빼기</button>';
  }
  function clone(s) { var o = {}; GROUPS.forEach(function (g) { o[g.key] = (s[g.key] || []).slice(); }); return o; }
  // (가) PC: 버튼 아래 작은 상자 — 한 번에 한 종류, 묶음별 초기화·적용
  var openKey = null;
  function closePop() { if (!pop || pop.hidden) return; pop.hidden = true; openKey = null; $$('.fbtn[data-fg]', fwrap).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  function openPopFor(key, btn) {
    var g = GROUPS.filter(function (x) { return x.key === key; })[0]; if (!g) return;
    draft = clone(sel); openKey = key;
    pop.innerHTML = '<p class="fpop__t">' + g.label + '</p>' + optsHTML(g, draft) + '<div class="fpop__foot"><button type="button" class="fpop__reset" data-freset>초기화</button><button type="button" class="sb sb--ink sb--s" data-fapply>적용</button></div>';
    pop.hidden = false;
    var r = btn.getBoundingClientRect(), br = bar.getBoundingClientRect();
    pop.style.left = Math.max(0, Math.min(r.left - br.left, br.width - 400)) + 'px';
    pop.style.top = (r.bottom - br.top + 8) + 'px';
    $$('.fbtn[data-fg]', fwrap).forEach(function (b) { b.setAttribute('aria-expanded', String(b === btn)); });
    var f = $('input', pop); f && f.focus({ preventScroll: true });
  }
  // (나) 폰 · "필터" 버튼: 필터 모음(옆 패널) — 종류 탭으로 바로 이동, 한 번에 한 종류, 전체 초기화·완료
  var tabKey = null;
  function drawPanel() {
    var g = GROUPS.filter(function (x) { return x.key === tabKey; })[0] || GROUPS[0]; tabKey = g.key;
    $('#ftabs', panel).innerHTML = GROUPS.map(function (x) { var c = draft[x.key].length; return '<button type="button" role="tab" data-ft="' + x.key + '" aria-selected="' + (x === g) + '">' + x.label + (c ? '<b>' + c + '</b>' : '') + '</button>'; }).join('');
    $('#fbody', panel).innerHTML = optsHTML(g, draft) + '<button type="button" class="fpanel__reset" data-freset-one><i class="i i-refresh i--16" aria-hidden="true"></i>' + g.label + ' 초기화</button>';
    $('#fdone', panel).textContent = count(draft).toLocaleString('ko-KR') + '개 상품 보기';
  }
  function openPanel(key, from) { closePop(); draft = clone(sel); tabKey = key || (GROUPS[0] && GROUPS[0].key); drawPanel(); S.pop(panel, from); }
  if (fwrap) {
    fwrap.addEventListener('click', function (e) {
      var all = e.target.closest('[data-fall]'); if (all) { openPanel(null, all); return; }
      var b = e.target.closest('[data-fg]'); if (!b) return;
      var key = b.getAttribute('data-fg');
      if (mq.matches) { openPanel(key, b); return; }
      if (openKey === key) closePop(); else openPopFor(key, b);
    });
    pop.addEventListener('change', function (e) { var i = e.target; if (!i.matches('input[data-g]')) return; var a = draft[i.getAttribute('data-g')], k = a.indexOf(i.value); if (i.checked && k < 0) a.push(i.value); if (!i.checked && k >= 0) a.splice(k, 1); });
    pop.addEventListener('click', function (e) {
      if (e.target.closest('[data-freset]')) { sel[openKey] = []; closePop(); pageNo = 1; drawButtons(); draw(true); }
      if (e.target.closest('[data-fapply]')) { sel = draft; closePop(); pageNo = 1; drawButtons(); draw(true); }
    });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.fbtn')) closePop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { var b = $('.fbtn[aria-expanded="true"]', fwrap); closePop(); b && b.focus(); } });
    panel.addEventListener('change', function (e) { var i = e.target; if (!i.matches('input[data-g]')) return; var a = draft[i.getAttribute('data-g')], k = a.indexOf(i.value); if (i.checked && k < 0) a.push(i.value); if (!i.checked && k >= 0) a.splice(k, 1); drawPanel(); var again = $('input[value="' + (window.CSS && CSS.escape ? CSS.escape(i.value) : i.value) + '"]', panel); again && again.focus({ preventScroll: true }); });
    panel.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ft]'); if (t) { tabKey = t.getAttribute('data-ft'); drawPanel(); return; }
      if (e.target.closest('[data-freset-one]')) { draft[tabKey] = []; drawPanel(); return; }
      if (e.target.closest('#freset')) { GROUPS.forEach(function (g) { draft[g.key] = []; }); drawPanel(); return; }
      if (e.target.closest('#fdone')) { sel = draft; pageNo = 1; S.closePop(panel); drawButtons(); draw(true); }
    });
    app && app.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]');
      if (b) { var a = sel[b.getAttribute('data-rm')], k = a.indexOf(b.getAttribute('data-v')); if (k >= 0) a.splice(k, 1); }
      else if (e.target.closest('[data-rm-all]')) resetFilters(); else return;
      pageNo = 1; drawButtons(); draw(true);
    });
  }
  var er = $('#lemptyReset'); er && er.addEventListener('click', function () { resetFilters(); pageNo = 1; drawButtons(); draw(true); });

  /* ---------- 정렬 · 목록 · 쪽 번호 ---------- */
  var sort = 'rec', pageNo = Math.max(1, parseInt(qs.get('page'), 10) || 1);
  var sorters = { rec: function (a, b) { return a.order - b.order; }, 'new': function (a, b) { return b.id - a.id; }, sell: function (a, b) { return (a.id * 37 % 101) - (b.id * 37 % 101); } };
  $$('.sort button').forEach(function (b) { b.addEventListener('click', function () { sort = b.getAttribute('data-sort'); pageNo = 1; $$('.sort button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); draw(true); }); });
  var pager = $('#lpager'), cnt = $('#lcount'), empty = $('#lempty');
  function draw(jump) {
    var list = scope().filter(function (p) { return pass(p, sel); }).sort(sorters[sort]);
    var total = Math.max(1, Math.ceil(list.length / PER)); pageNo = Math.min(pageNo, total);
    var view = list.slice((pageNo - 1) * PER, pageNo * PER);
    grid.innerHTML = view.map(function (p, i) { return D.card(p, { sub: inplace && page === 'category', lazy: i < 8 ? false : true }); }).join('');
    grid.hidden = !list.length; if (empty) empty.hidden = !!list.length;
    if (empty && !list.length) { var hasF = nSel(sel) > 0; $$('[data-if-filter]', empty).forEach(function (n) { n.hidden = !hasF; }); $$('[data-if-nofilter]', empty).forEach(function (n) { n.hidden = hasF; }); }
    if (cnt) cnt.textContent = list.length.toLocaleString('ko-KR');
    if (pager) { pager.innerHTML = D.pager(pageNo, total); pager.hidden = total <= 1; }
    if (jump) { var y = (bar || grid).getBoundingClientRect().top + window.pageYOffset - 190; if (window.pageYOffset > y) window.scrollTo({ top: y }); }
  }
  pager && pager.addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (!b || b.getAttribute('aria-disabled') === 'true') return; pageNo = Number(b.getAttribute('data-page')); draw(true); });

  /* ---------- 베스트 줄 ---------- */
  var bestBox = $('#lbest');
  function drawBest() {
    if (!bestBox) return;
    if (best === null) { bestBox.hidden = true; return; }
    var list = best;
    if (page === 'brand' && brand && form && best.length) {   // 고른 형태의 상품을 앞에 두고, 모자라면 같은 브랜드의 다른 상품으로 채운다
      list = brand.items.filter(function (p) { return p.form === form; }).concat(brand.items.filter(function (p) { return p.form !== form; })).slice(0, 6);
    }
    bestBox.hidden = false;
    var rail = $('.lrail', bestBox), none = $('.lbest__empty', bestBox), nav = $('.lbest__nav', bestBox);
    rail.innerHTML = list.map(function (p) { return D.card(p, { slim: true }); }).join('');
    rail.hidden = !list.length; none.hidden = !!list.length; if (nav) nav.hidden = list.length <= 6;
    rail.scrollLeft = 0;
  }
  if (bestBox) {
    var bestPre = $('.tt__pre', bestBox); if (bestPre && page === 'brand' && brand) bestPre.textContent = brand.ko;   // "케이투 베스트 상품"
    $$('.arw', bestBox).forEach(function (b) { b.addEventListener('click', function () { var rail = $('.lrail', bestBox); rail.scrollBy({ left: Number(b.getAttribute('data-dir')) * rail.clientWidth * .8, behavior: 'smooth' }); }); });
    drawBest();
  }

  /* ---------- 상태 보기 ---------- */
  if (GROUPS.length) {
    if (S.has('filtered') || S.has('filter-open')) { sel.color = options(GROUPS[2], scope()).filter(function (v) { return v === '블랙' || v === '네이비'; }); sel.season = options(GROUPS[5], scope()).filter(function (v) { return v === '겨울'; }); }
    if (S.has('empty')) { sel.band = ['1만원 미만']; sel.season = ['겨울']; sel.color = ['옐로']; }
  }
  drawForms(); drawButtons(); draw();
  if (S.has('form') && fgs) { var f1 = $('[data-form]:not([data-form=""])', fgs); f1 && f1.click(); }
  if (S.has('filter-open') && GROUPS.length) setTimeout(function () { if (mq.matches) openPanel('color'); else { var b = $('.fbtn[data-fg="color"]', fwrap); b && openPopFor('color', b); } }, 60);
  if (S.has('filter-all') && GROUPS.length) setTimeout(function () { openPanel('color'); }, 60);
})();
