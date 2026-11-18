/* 비투비티 견적문의 · sub-quote.js (2026-11-17)
   quote.html 한 파일의 네 화면을 맡는다.
     대화형 입력(기본) · 한 화면 입력 양식(?mode=form) · 비회원 안내(state=guest) · 상품 검색 팝업(두 방식 공용)
   상품 검색은 js/sub-data.js 의 실제 상품(단체복 85종 + 협력브랜드 72종)으로 찾는다.
   서버 연결은 없다. 검색·접수의 기다림은 흉내만 내고, ?state= 로 각 상태를 그대로 보여 준다. */
(function () {
  'use strict';
  var SUB = window.SUB, D = window.SUBDATA;
  if (!SUB || !D || document.body.getAttribute('data-page') !== 'quote') return;
  var $ = SUB.$, $$ = SUB.$$, esc = SUB.esc, has = SUB.has;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var NARROW = window.matchMedia('(max-width:1023px)');
  var PHONE = window.matchMedia('(max-width:768px)');
  var mode = SUB.auth === 'guest' ? 'guest' : (SUB.qs.get('mode') === 'form' ? 'form' : 'chat');
  document.documentElement.setAttribute('data-qt', mode);
  $$('[data-qt-m]').forEach(function (n) { n.hidden = n.getAttribute('data-qt-m').split(' ').indexOf(mode) < 0; });
  if (mode === 'guest') return;

  var MB = 1048576, ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var METHODS = ['열전사 인쇄', '나염 인쇄', '자수 인쇄', '기타'];
  var PACKS = ['기본포장', '고급포장', '상담 후 결정'];
  var ACCEPT_IMG = 'jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,hwp,hwpx,zip';
  var ACCEPT_LOGO = 'ai,eps,pdf,psd,png,jpg,jpeg,gif,zip';

  /* ============================================================
     1. 상품 자료 · 찾기 · 줄 모양
     ============================================================ */
  var ALL = D.list.concat(D.brands.reduce(function (a, b) { return a.concat(b.items); }, []));
  if (has('pick-empty')) ALL = [];
  function catOf(p) { return p.brand ? p.brandKo : p.cat; }
  function priceOf(p) { return p.priceNum ? p.price : '견적문의'; }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function find(q) {
    var n = norm(q); if (!n) return [];
    var out = [];
    ALL.forEach(function (p) {
      var nm = norm(p.name), hay = nm + '|' + norm(p.code) + '|' + norm(p.cat) + '|' + norm(p.brandKo) + '|' + norm(p.sub);
      if (hay.indexOf(n) < 0) return;
      out.push({ p: p, s: nm.indexOf(n) === 0 ? 0 : nm.indexOf(n) > 0 ? 1 : 2 });
    });
    out.sort(function (a, b) { return a.s - b.s || a.p.order - b.p.order; });
    return out.map(function (x) { return x.p; });
  }
  function hlRe(q) {
    var ch = String(q).replace(/\s+/g, '').split('').map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    return ch.length ? new RegExp('(' + ch.join('\\s*') + ')', 'i') : null;
  }
  function hl(text, re) { if (!re) return esc(text); var m = re.exec(text); if (!m) return esc(text); return esc(text.slice(0, m.index)) + '<b>' + esc(m[0]) + '</b>' + esc(text.slice(m.index + m[0].length)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function swatch(p) {
    if (!p.colors.length) return '';
    var rest = p.nColors - Math.min(5, p.colors.length);
    return '<span class="qt-sw" aria-label="색상 ' + p.nColors + '종">' + p.colors.slice(0, 5).map(function (c) { return '<i style="--c:' + c.hex + '" title="' + esc(c.name) + '"></i>'; }).join('') + (rest > 0 ? '<em class="num">+' + rest + '</em>' : '') + '</span>';
  }
  function href(p) { return 'product.php?id=' + p.id + (p.brand ? '&brand=' + p.brand : ''); }
  function rowHTML(p, chosen) {
    return '<li class="qt-pr' + (chosen ? ' is-on' : '') + '" data-key="' + p.key + '">' +
      '<span class="qt-pr__img"><img src="' + p.imgs[0] + '" alt="" width="600" height="600" loading="lazy" decoding="async"></span>' +
      '<span class="qt-pr__b"><span class="qt-pr__cat">' + esc(catOf(p)) + '</span>' +
      '<a class="qt-pr__n" href="#" data-href="' + href(p) + '" target="_blank">' + esc(p.name) + '<span class="sr-only"> 상품 상세 (새 창)</span></a>' +
      '<span class="qt-pr__m">' + (p.size ? '<span class="num">' + esc(p.size) + '</span>' : '') + swatch(p) + '</span>' +
      '<span class="qt-pr__p num' + (p.priceNum ? '' : ' is-q') + '">' + esc(priceOf(p)) + '</span></span>' +
      '<button type="button" class="sb sb--s ' + (chosen ? 'sb--ink' : 'sb--line') + ' qt-pr__pick" data-pick="' + p.key + '" aria-pressed="' + (chosen ? 'true' : 'false') + '" aria-label="' + esc(p.name) + (chosen ? ' 고름' : ' 고르기') + '">' + (chosen ? '<i class="i i-check i--14" aria-hidden="true"></i>고름' : '선택') + '</button></li>';
  }
  function chosenHTML(p, extra) {
    return '<div class="qt-chosen"><span class="qt-pr__img"><img src="' + p.imgs[0] + '" alt="" width="600" height="600" decoding="async"></span>' +
      '<span class="qt-pr__b"><span class="qt-pr__cat">' + esc(catOf(p)) + (p.code ? ' · <span class="num">' + esc(p.code) + '</span>' : '') + '</span><span class="qt-pr__n">' + esc(p.name) + '</span>' +
      '<span class="qt-pr__m">' + (p.size ? '<span class="num">' + esc(p.size) + '</span>' : '') + swatch(p) + '</span><span class="qt-pr__p num' + (p.priceNum ? '' : ' is-q') + '">' + esc(priceOf(p)) + '</span></span>' + (extra || '') + '</div>';
  }
  function fileExt(n) { return (n.split('.').pop() || '').toUpperCase().slice(0, 4); }
  function filesHTML(files, tag) {
    return files.map(function (f, i) {
      return '<li><span class="files__ext">' + esc(fileExt(f.name)) + '</span><span class="files__n">' + esc(f.name) + '</span><span class="files__s">' + SUB.fmtSize(f.size) + '</span>' +
        '<button type="button" class="files__x" data-fx="' + i + '"' + (tag != null ? ' data-ft="' + tag + '"' : '') + ' aria-label="' + esc(f.name) + ' 삭제"><i class="i i-x i--16" aria-hidden="true"></i></button></li>';
    }).join('');
  }
  function sumBytes(l) { return l.reduce(function (a, f) { return a + f.size; }, 0); }
  /* 첨부 검사: 상품마다 이미지 5개(대화형은 로고와 합쳐 5개) · 파일당 20MB · 전체 20개 · 합계 100MB */
  function addFiles(list, incoming, o) {
    var errs = [];
    Array.prototype.forEach.call(incoming, function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (o.accept.split(',').indexOf(ext) < 0) return errs.push('올릴 수 없는 파일 형식입니다. (' + f.name + ')');
      if (list.some(function (x) { return x.name === f.name && x.size === f.size; })) return errs.push('같은 파일이 이미 첨부되어 있습니다. (' + f.name + ')');
      if (list.length >= o.max) return errs.push(o.overMsg);
      if (f.size > 20 * MB) return errs.push('파일 하나는 20MB까지 올릴 수 있습니다. (' + f.name + ' · ' + SUB.fmtSize(f.size) + ')');
      if (list.length + (o.other || 0) >= 5) return errs.push('상품마다 상품·디자인 이미지와 로고 파일을 합쳐 5개까지 올릴 수 있습니다.');
      if (list.length + (o.otherAll || 0) >= 20) return errs.push('첨부 파일은 모든 상품을 합쳐 20개까지 올릴 수 있습니다.');
      if (sumBytes(list) + (o.bytesAll || 0) + f.size > 100 * MB) return errs.push('첨부 파일은 모두 합쳐 100MB까지 올릴 수 있습니다. (' + f.name + ' · ' + SUB.fmtSize(f.size) + ')');
      list.push({ name: f.name, size: f.size });
    });
    return errs.filter(function (m, i) { return errs.indexOf(m) === i; });
  }
  function fmtDate(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? m[1] + '년 ' + Number(m[2]) + '월 ' + Number(m[3]) + '일' : v; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function smooth() { return RM ? 'auto' : 'smooth'; }

  /* ============================================================
     2. 자동완성(검색 칸 아래 같은 폭, 최대 6줄, 방향키·Enter·Esc)
     ============================================================ */
  function autocomplete(inp, list, onPick) {
    var items = [], act = -1;
    function close() { list.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); act = -1; }
    function draw(q) {
      var n = norm(q);
      if (!n || q.length >= 100) return close();
      items = find(q).slice(0, 6);
      if (!items.length) return close();
      var re = hlRe(q);
      list.innerHTML = items.map(function (p, i) {
        return '<li role="option" id="' + list.id + '-' + i + '" aria-selected="false" data-i="' + i + '"><img src="' + p.imgs[0] + '" alt="" width="40" height="40" decoding="async"><span class="qt-ac__n">' + hl(p.name, re) + '</span><span class="qt-ac__c">' + esc(catOf(p)) + '</span></li>';
      }).join('');
      list.hidden = false; inp.setAttribute('aria-expanded', 'true'); act = -1; inp.removeAttribute('aria-activedescendant');
    }
    function move(d) {
      if (list.hidden || !items.length) return;
      act = (act + d + items.length) % items.length;
      $$('[role=option]', list).forEach(function (o, i) { o.setAttribute('aria-selected', String(i === act)); });
      inp.setAttribute('aria-activedescendant', list.id + '-' + act);
    }
    function pick(i) { var p = items[i]; if (!p) return; inp.value = p.name; close(); onPick(p.name); }
    inp.addEventListener('input', function () { draw(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) draw(inp.value); else move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter' && !list.hidden && act >= 0) { e.preventDefault(); e.stopPropagation(); pick(act); }
      else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
    });
    list.addEventListener('mousedown', function (e) { var o = e.target.closest('[role=option]'); if (!o) return; e.preventDefault(); pick(Number(o.getAttribute('data-i'))); });
    inp.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== inp) close(); }, 150); });
    return { draw: draw, close: close, move: move };
  }

  /* ============================================================
     3. 상품 검색 팝업(두 방식 공용)
     ============================================================ */
  var pk = { el: $('#qtPick'), form: $('#qtPickF'), inp: $('#qtPickQ'), x: $('#qtPickX'), ac: $('#qtPickAc'), res: $('#qtRes'), t: $('#qtResT'), c: $('#qtResC'),
    busy: $('#qtResBusy'), none: $('#qtResNone'), empty: $('#qtResEmpty'), err: $('#qtResErr'), long: $('#qtPickLong'), cb: null, chosen: null, fail: has('pick-fail'), freeze: has('pick-busy'), rec: null, q: '' };
  function pkShow(which) { ['res', 'busy', 'none', 'empty', 'err'].forEach(function (k) { pk[k].hidden = k !== which; }); }
  function pkRun(q) {
    q = (q == null ? pk.inp.value : q).trim(); pk.q = q;
    pk.x.hidden = !pk.inp.value;
    pk.long.hidden = pk.inp.value.length < 100;
    if (!pk.long.hidden) q = '';                         // 너무 긴 검색어는 찾지 않는다
    if (!ALL.length) { pk.t.textContent = '상품 검색'; pk.c.textContent = ''; pkShow('empty'); return; }
    if (!q) {
      pk.rec = pk.rec || shuffle(ALL).slice(0, 20);
      pk.t.textContent = '추천 상품'; pk.c.innerHTML = '검색어를 넣지 않으면 상품 <b class="num">20</b>개를 골고루 보여 드립니다.';
      pk.res.innerHTML = pk.rec.map(function (p) { return rowHTML(p, p.key === pk.chosen); }).join(''); pkShow('res'); return;
    }
    pk.t.textContent = '검색 결과'; pk.c.textContent = '';
    pkShow('busy');
    function done() {
      if (pk.freeze) return;
      if (pk.fail) { pkShow('err'); return; }
      var r = find(q);
      if (!r.length) { $('#qtResNoneQ').textContent = '‘' + q + '’'; pkShow('none'); return; }
      pk.t.innerHTML = '‘' + esc(q) + '’ 검색 결과'; pk.c.innerHTML = '총 <b class="num">' + r.length + '</b>개';
      pk.res.innerHTML = r.map(function (p) { return rowHTML(p, p.key === pk.chosen); }).join(''); pkShow('res');
      pk.el.querySelector('.pop__body').scrollTop = 0;
    }
    if (RM || pk.instant) done(); else setTimeout(done, 380);
  }
  var pkAc = autocomplete(pk.inp, pk.ac, function (name) { pkRun(name); });
  pk.form.addEventListener('submit', function (e) { e.preventDefault(); pkAc.close(); pkRun(); });
  pk.inp.addEventListener('input', function () { pk.x.hidden = !pk.inp.value; pk.long.hidden = pk.inp.value.length < 100; });
  function pkClear() { pk.inp.value = ''; pkAc.close(); pkRun(''); pk.inp.focus(); }
  pk.x.addEventListener('click', pkClear);
  pk.el.addEventListener('click', function (e) {
    if (e.target.closest('[data-qt-clear]')) { pkClear(); return; }
    if (e.target.closest('[data-qt-retry]')) { pk.fail = false; pkRun(); return; }
    var b = e.target.closest('[data-pick]'); if (!b) return;
    var key = b.getAttribute('data-pick'), cb = pk.cb;
    pk.chosen = key; SUB.closePop(pk.el);
    if (cb) cb(key);
    SUB.toast('고른 상품: ' + D.P[key].name);
  });
  function openPick(q, cb, chosen, from) {
    pk.cb = cb; pk.chosen = chosen || null; pk.inp.value = q || ''; pkAc.close();
    pk.instant = true; pkRun(q || ''); pk.instant = false;
    SUB.pop(pk.el, from);
    setTimeout(function () { pk.inp.focus({ preventScroll: true }); }, 90);
  }

  /* ============================================================
     4. 대화형 입력
     ============================================================ */
  var STEPS = {
    type: { q: '어떤 상품을 문의하시나요?', d: '쇼핑몰에서 파는 상품이면 검색으로 고르고, 없는 상품이면 상품명과 참고 이미지로 문의합니다.', req: 1, el: 'L602', s: '상품 유형' },
    search: { q: '문의할 상품을 검색해 골라 주세요.', d: '상품명이나 품번으로 찾습니다. 결과에서 ‘선택’을 누른 뒤 다음으로 넘어가세요.', req: 1, el: 'L603', s: '상품 검색' },
    name: { q: '문의할 상품의 이름을 알려 주세요.', d: '모델명·품번을 알면 함께 적어 주세요.', req: 1, el: 'L604', s: '상품명' },
    images: { q: '참고할 상품·디자인 이미지가 있으면 올려 주세요.', d: '없으면 건너뛰어도 됩니다.', req: 0, el: 'L605', s: '상품·디자인 이미지' },
    qty: { q: '몇 개가 필요하신가요?', d: '사이즈별 수량은 다음 질문(옵션)에 적어 주세요.', req: 1, el: 'L606', s: '수량' },
    opt: { q: '색상·사이즈 같은 옵션이 있으면 적어 주세요.', d: '예: 블랙 / 95 20개, 100 30개, 105 20개', req: 0, el: 'L607', s: '상품 옵션' },
    pack: { q: '포장은 어떻게 할까요?', req: 0, el: 'L608', s: '포장 방법' },
    print: { q: '로고나 문구를 인쇄할까요?', d: '로고·문구 인쇄와 자수는 모두 ‘인쇄 있음’입니다. ‘인쇄 없음’이면 상품만 받습니다.', req: 1, el: 'L609', s: '로고 인쇄 여부' },
    method: { q: '어떤 방법으로 인쇄할까요?', d: '정하지 못했으면 건너뛰세요. 상담 때 원단에 맞는 방법을 안내합니다.', req: 0, el: 'L610', s: '인쇄방법' },
    logo: { q: '인쇄할 로고 파일이 있으면 올려 주세요.', d: '지금 파일이 없으면 건너뛰고 상담 때 보내셔도 됩니다.', req: 0, el: 'L611', s: '로고 파일' },
    pdesc: { q: '인쇄할 부위와 내용을 알려 주세요.', d: '예: 왼쪽 가슴 로고 자수(가로 8cm), 등 상단 회사명 한 줄', req: 0, el: 'L612', s: '인쇄 부위 및 설명' },
    date: { q: '납품받고 싶은 날짜가 있나요?', d: '인쇄 없는 상품은 3~4일, 인쇄 상품은 4~7일이 걸립니다(주말 제외).', req: 0, el: 'L613', s: '납품희망일' },
    etc: { q: '그 밖에 알려 주실 내용이 있으면 적어 주세요.', req: 0, el: 'L614', s: '기타사항' },
    more: { q: '다른 상품도 함께 문의하시겠어요?', req: 1, el: 'L615', s: '다른 상품 문의' },
    contact: { q: '연락받을 정보를 확인해 주세요.', d: '회원 정보로 채웠습니다. 다르면 고쳐 주세요.', req: 1, el: 'L617', s: '연락받을 정보' },
    request: { q: '담당자에게 남길 요청사항이 있으면 적어 주세요.', d: '입력 내용을 검토한 뒤 상담원이 연락처로 전화드립니다.', req: 0, el: 'L618', s: '요청사항' }
  };
  var ITEM_FIELDS = ['search', 'name', 'images', 'qty', 'opt', 'pack', 'print', 'method', 'logo', 'pdesc', 'date', 'etc'];
  var A = {}, draft = {}, editing = null, send = null, FROM_M = null;
  function sid(k) { return k.split('.').pop(); }
  function iid(k) { var m = /^i(\d+)\./.exec(k); return m ? Number(m[1]) : -1; }
  function val(k) { return A[k] && !A[k].skip ? A[k].v : undefined; }
  function itemCount() { var n = 1; while (val('i' + (n - 1) + '.more') === 'yes') n++; return n; }
  function path() {
    var out = [], n = itemCount();
    for (var i = 0; i < n; i++) {
      var p = 'i' + i + '.', t = val(p + 'type');
      out.push(p + 'type', p + (t === 'shop' ? 'search' : 'name'));       // 고르기 전에는 질문이 많은 쪽으로 센다
      if (t !== 'shop' || A[p + 'images']) out.push(p + 'images');
      out.push(p + 'qty', p + 'opt', p + 'pack', p + 'print');
      if (val(p + 'print') !== 'no') out.push(p + 'method', p + 'logo', p + 'pdesc');
      out.push(p + 'date', p + 'etc', p + 'more');
    }
    out.push('contact', 'request');
    return out;
  }
  function current() { var P = path(); for (var j = 0; j < P.length; j++) if (!A[P[j]]) return P[j]; return 'final'; }
  function filesOf(i, kind) { var a = A['i' + i + '.' + kind]; return a && !a.skip ? a.v : []; }
  function allFiles(exceptKey) {
    var n = 0, b = 0;
    Object.keys(A).forEach(function (k) { var id = sid(k); if ((id === 'images' || id === 'logo') && k !== exceptKey && A[k] && !A[k].skip) { n += A[k].v.length; b += sumBytes(A[k].v); } });
    return { n: n, b: b };
  }

  /* 상태별 견본 답(운영에서는 입력한 값) */
  function F(list) { return list.map(function (f) { return { name: f[0], size: f[1] }; }); }
  function Fm(list) { return list.map(function (f) { return { name: f[0], size: Math.round(f[1] * MB) }; }); }   // 크기를 MB로 적은 견본 파일
  /* 첨부 전체 한도 견본: 앞 상품 네 개에 17개 · 96.0MB가 올라가 있다 */
  function itemC(name, imgs, qty, method, logo) {
    var o = { type: 'custom', name: name, images: Fm(imgs), qty: qty, opt: null, pack: '기본포장', print: method ? 'yes' : 'no' };
    if (method) { o.method = method; o.logo = Fm(logo); o.pdesc = null; }
    o.date = null; o.etc = null; o.more = 'yes';
    return o;
  }
  var CONTACT = { company: SUB.member.company, person: SUB.member.name, phone: SUB.member.phone };
  function item0(from) {
    var o = { type: 'shop', search: 'c460', qty: 70, opt: '블랙 / 90 5개, 95 20개, 100 30개, 105 15개', pack: '기본포장', print: 'yes', method: '자수 인쇄', logo: F([['로고_시안.ai', 2400000]]),
      pdesc: '왼쪽 가슴에 회사 로고 자수(가로 8cm), 등 상단에 회사명 한 줄을 넣어 주세요.', date: '2026-12-04', etc: null, more: 'yes' };
    return o;
  }
  function item1() { return { type: 'shop', search: 'c195', qty: 30, opt: '네이비 / M 10개, L 12개, XL 8개', pack: null, print: 'no', date: null, etc: null, more: 'no' }; }
  function load(i, o, upto, from) {
    var order = ['type', 'search', 'name', 'images', 'qty', 'opt', 'pack', 'print', 'method', 'logo', 'pdesc', 'date', 'etc', 'more'];
    for (var j = 0; j < order.length; j++) {
      var f = order[j]; if (f === upto) break;
      if (!(f in o)) continue;
      A['i' + i + '.' + f] = o[f] === null ? { skip: true } : { v: o[f], from: from && from.indexOf(f) >= 0 };
    }
  }
  (function preset() {
    if (has('start')) return;
    if (has('search') || has('search-busy') || has('search-none') || has('search-fail')) {
      load(0, item0(), 'search');
      draft = { sq: has('search-none') ? '방염 작업복' : has('search') ? '후드 패딩' : '후드', st: has('search-busy') ? 'busy' : has('search-fail') ? 'fail' : null, freeze: has('search-busy'), fail: has('search-fail') };
      return;
    }
    if (has('attach') || has('attach-err')) {
      load(0, { type: 'custom', name: '형광 안전 조끼(반사띠 부착)' });
      draft = { files: F([['조끼_참고_사진.jpg', 1840000], ['반사띠_위치.pdf', 620000]]) };
      if (has('attach-err')) {                  // 2개가 있는 상태에서 5개를 더 고른 결과: 3개만 붙고 나머지는 안내
        draft.files = draft.files.concat(F([['조끼_앞면.png', 2310000], ['조끼_뒷면.png', 2280000], ['로고_배치_예시.pdf', 910000]]));
        draft.errs = ['상품·디자인 이미지는 상품마다 5개까지 올릴 수 있습니다.', '파일 하나는 20MB까지 올릴 수 있습니다. (현장_사진_원본.zip · 24.6MB)'];
      }
      return;
    }
    if (has('attach-total')) {                   // 다섯 번째 상품에서 5개를 골랐다: 3개만 붙고 전체 20개 · 100MB 한도 안내
      load(0, itemC('형광 안전 조끼(반사띠 부착)', [['조끼_정면.jpg', 6.2], ['조끼_후면.jpg', 5.9], ['반사띠_위치.pdf', 0.6], ['원단_견본.jpg', 7.4]], 40, '열전사 인쇄', [['로고_시안.ai', 2.4]]));
      load(1, itemC('방염 작업복 상하의', [['작업복_착용_사진.jpg', 8.8], ['작업복_도면.pdf', 3.1], ['원단_시험성적서.pdf', 4.6]], 25, '자수 인쇄', [['회사_로고.ai', 2.4]]));
      load(2, itemC('형광 안전모 커버', [['커버_정면.jpg', 9.6], ['커버_측면.jpg', 9.1], ['커버_치수.pdf', 1.2], ['부착_예시.jpg', 7.8]], 60));
      load(3, itemC('보냉 조끼(아이스팩 포켓)', [['보냉조끼_정면.jpg', 8.4], ['보냉조끼_포켓.jpg', 7.9], ['아이스팩_규격.pdf', 0.9], ['착용_현장.jpg', 9.7]], 30));
      load(4, { type: 'custom', name: '반사띠 부착 토시' });
      draft = { files: Fm([['토시_정면.jpg', 1.2], ['토시_치수.pdf', 0.8], ['반사띠_색상.png', 0.9]]),
        errs: ['첨부 파일은 모두 합쳐 100MB까지 올릴 수 있습니다. (토시_원본_스캔.pdf · 3.6MB)', '첨부 파일은 모든 상품을 합쳐 20개까지 올릴 수 있습니다.'] };
      return;
    }
    if (has('qty-err')) { load(0, item0(), 'qty'); draft = { v: '0', err: '수량을 1개 이상 입력해 주세요.' }; return; }
    if (has('from')) {
      var o = item0(); o.images = F([['로고_시안.ai', 2400000], ['가슴_인쇄_위치.png', 480000]]); o.method = FROM_M = '실크 인쇄';   // 상품 상세의 인쇄방법(목록에 없는 값은 선택지에 더한다)
      var from = ['type', 'search', 'images', 'qty', 'opt', 'print', 'method'];
      load(0, o, null, from); ['pack', 'logo', 'pdesc', 'date', 'etc', 'more'].forEach(function (f) { delete A['i0.' + f]; });
      return;
    }
    if (has('second')) { load(0, item0()); load(1, item1(), 'qty'); return; }
    if (has('contact')) { load(0, item0()); load(1, item1()); return; }
    if (has('last') || has('sending') || has('fail') || has('done')) {
      load(0, item0()); load(1, item1());
      A.contact = { v: CONTACT }; A.request = { v: '12월 첫 주 안에 받을 수 있는지 함께 알려 주세요. 견적서는 이메일로도 받고 싶습니다.' };
      if (has('sending')) send = 'busy'; if (has('fail')) send = 'fail';
      return;
    }
    load(0, item0(), 'method');                 // 기본: 첫 상품의 인쇄방법을 묻는 중
  })();

  var log = $('#qtLog'), typing = $('#qtTyping'), live = $('#qtLive');

  function tagHTML(i) { return i > 0 ? '<span class="qt-q__tag" data-el="L598">' + (i + 1) + '번째 상품</span>' : ''; }
  function qHTML(k) { var S = STEPS[sid(k)]; return '<div class="qt-q">' + tagHTML(iid(k)) + '<p>' + esc(S.q) + '</p></div>'; }
  function ansHTML(k) {
    var a = A[k], id = sid(k), v = a.v, h;
    if (a.skip) return '<div class="qt-a__b qt-a__b--skip">건너뛰었습니다.</div>';
    if (id === 'type') h = v === 'shop' ? '쇼핑몰 내 상품' : '쇼핑몰에 없는 상품';
    else if (id === 'search') { var p = D.P[v]; h = p ? '<span class="qt-a__p"><img src="' + p.imgs[0] + '" alt="" width="40" height="40" decoding="async"><span><b>' + esc(p.name) + '</b><small class="num">' + esc(priceOf(p)) + '</small></span></span>' : esc(v); return box(h); }
    else if (id === 'images' || id === 'logo') h = '<span class="qt-a__f">' + v.map(function (f) { return '<span><i class="i i-clip i--14" aria-hidden="true"></i>' + esc(f.name) + ' <small class="num">' + SUB.fmtSize(f.size) + '</small></span>'; }).join('') + '</span>';
    else if (id === 'qty') h = '<b class="num">' + Number(v).toLocaleString('ko-KR') + '</b>개';
    else if (id === 'print') h = v === 'yes' ? '인쇄 있음' : '인쇄 없음';
    else if (id === 'more') h = v === 'yes' ? '예, 다른 상품도 문의합니다' : '아니요, 다음으로 넘어갑니다';
    else if (id === 'date') h = esc(fmtDate(v));
    else if (id === 'contact') h = '<span class="qt-a__c"><span>' + esc(v.company) + '</span><span>' + esc(v.person) + '</span><span class="num">' + esc(v.phone) + '</span></span>';
    else h = esc(v);
    return box(h);
    function box(x) { return '<div class="qt-a__b">' + x + (a.from ? '<small class="qt-a__from">상품 상세에서 채움</small>' : '') + '</div>'; }
  }
  function sepHTML(i) { return '<li class="qt-sep" aria-hidden="true"><span>' + (i + 1) + '번째 상품</span></li>'; }

  /* 카드(지금 답할 질문) */
  /* 선택지는 한 화면 양식과 같은 알약(.seg). 설명이 필요한 질문은 카드 도움말(STEPS.d)에 적는다 */
  function optsHTML(name, list, cur) {
    return '<div class="seg qt-seg" role="radiogroup" aria-labelledby="qtCardT">' + list.map(function (o) {
      var v = typeof o === 'string' ? o : o[0], lb = typeof o === 'string' ? o : o[1];
      return '<label><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (cur === v ? ' checked' : '') + '><span>' + esc(lb) + '</span></label>';
    }).join('') + '</div>';
  }
  /* 모든 상품의 첨부 합계(지금 고르는 카드의 파일 포함). 앞 상품에 파일이 있을 때만 보인다 */
  function totHTML(k, files) {
    var o = allFiles(k);
    if (!o.n) return '';
    return '지금 모든 상품 합계 <b class="num">' + (o.n + files.length) + '</b> / 20개 · <b class="num">' + SUB.fmtSize(o.b + sumBytes(files)) + '</b> / 100MB';
  }
  function uplHTML(kind, files, k) {
    var logo = kind === 'logo', max = logo ? 3 : 5, tot = totHTML(k, files);
    return '<label class="upl qt-upl"><span class="upl__ic"><i class="i i-upload" aria-hidden="true"></i></span><span class="upl__tx">파일을 끌어다 놓거나 눌러서 고르세요 <span class="upl__cnt num" data-cnt>' + files.length + ' / ' + max + '개</span>' +
      '<small>' + (logo ? 'AI·EPS·PDF·PSD·PNG·JPG·GIF·ZIP · 최대 3개 · 파일당 20MB' : '이미지·PDF·문서·한글·압축 파일 · 최대 5개 · 파일당 20MB') + '</small></span>' +
      '<input type="file" multiple data-up="' + kind + '" accept="' + (logo ? ACCEPT_LOGO : ACCEPT_IMG).split(',').map(function (x) { return '.' + x; }).join(',') + '"></label>' +
      '<ul class="files" data-files>' + filesHTML(files) + '</ul>' +
      '<p class="qt-card__lim" data-el="L635">상품·디자인 이미지와 로고 파일은 상품마다 합쳐 5개, 모든 상품을 합쳐 20개 · 100MB까지 올릴 수 있습니다.<span class="qt-card__tot" data-tot' + (tot ? '' : ' hidden') + '>' + tot + '</span></p>';
  }
  function cardIn(k, cur) {
    var id = sid(k), i = iid(k), nm = 'c-' + k.replace('.', '-');
    switch (id) {
      case 'type': return optsHTML(nm, [['shop', '쇼핑몰 내 상품'], ['custom', '쇼핑몰에 없는 상품']], cur) +
        (editing === k ? '<p class="qt-card__warn"><i class="i i-info i--16" aria-hidden="true"></i>상품 유형을 바꾸면 이 상품의 뒤 답이 지워집니다.</p>' : '');
      case 'search': return searchHTML(k);
      case 'name': return '<div class="fld"><label class="fld__l" for="qtIn">상품명 <span class="r"><span id="qtInN">' + (cur || '').length + '</span> / 200</span></label><input class="inp" id="qtIn" maxlength="200" data-count="qtInN" value="' + esc(cur || '') + '" placeholder="예: 형광 안전 조끼(반사띠 부착)"><p class="fld__msg fld__msg--err" role="alert"></p></div>';
      case 'images': case 'logo': return uplHTML(id, draft.files || [], k);
      case 'qty': return '<div class="fld qt-qty"><label class="fld__l" for="qtIn">수량</label><div class="qt-qty__row"><span class="qty"><button type="button" data-q="-1" aria-label="수량 줄이기">−</button><input type="number" id="qtIn" min="0" max="99999" inputmode="numeric" value="' + esc(cur == null ? '' : cur) + '" placeholder="0"><button type="button" data-q="1" aria-label="수량 늘리기">+</button></span><span class="qt-qty__u">개</span></div><p class="fld__msg fld__msg--err" role="alert" data-el="L633"></p></div>';
      case 'opt': return '<div class="fld"><label class="fld__l" for="qtIn">상품 옵션 <span class="r"><span id="qtInN">' + (cur || '').length + '</span> / 500</span></label><textarea class="txa txa--s" id="qtIn" maxlength="500" data-count="qtInN" placeholder="색상, 사이즈별 수량처럼 알려 주실 옵션">' + esc(cur || '') + '</textarea></div>';
      case 'pack': return optsHTML(nm, PACKS, cur);
      case 'print': return optsHTML(nm, [['yes', '인쇄 있음'], ['no', '인쇄 없음']], cur);
      case 'method': var ms = METHODS.slice(), xm = i === 0 && FROM_M; if (xm && ms.indexOf(xm) < 0) ms.splice(3, 0, xm); return optsHTML(nm, ms, cur);
      case 'pdesc': case 'etc': case 'request':
        var lab = { pdesc: '인쇄 부위 및 설명', etc: '기타사항', request: '요청사항' }[id];
        return '<div class="fld"><label class="fld__l" for="qtIn">' + lab + ' <span class="r"><span id="qtInN">' + (cur || '').length.toLocaleString('ko-KR') + '</span> / 2,000</span></label><textarea class="txa" id="qtIn" maxlength="2000" data-count="qtInN" placeholder="' + (id === 'pdesc' ? '인쇄 부위, 로고 크기, 색상 등' : id === 'etc' ? '원단, 납품 장소, 샘플 필요 여부 등' : '통화하기 좋은 시간, 견적서 받을 이메일 등') + '">' + esc(cur || '') + '</textarea></div>';
      case 'date': return '<div class="fld qt-date"><label class="fld__l" for="qtIn">납품희망일</label><input class="inp" id="qtIn" type="date" min="' + today() + '" value="' + esc(cur || '') + '"></div>';
      case 'more': return optsHTML(nm, [['yes', '예, 다른 상품도 문의합니다'], ['no', '아니요, 다음으로 넘어갑니다']], cur);
      case 'contact': var c = cur || CONTACT;
        return '<div class="fstack qt-ct"><div class="fld"><label class="fld__l" for="qtC1">회사명 <em>*</em></label><input class="inp" id="qtC1" maxlength="100" value="' + esc(c.company) + '" autocomplete="organization" data-sample><p class="fld__msg fld__msg--err" role="alert"></p></div>' +
          '<div class="fld"><label class="fld__l" for="qtC2">담당자 <em>*</em></label><input class="inp" id="qtC2" maxlength="50" value="' + esc(c.person) + '" autocomplete="name" data-sample><p class="fld__msg fld__msg--err" role="alert"></p></div>' +
          '<div class="fld"><label class="fld__l" for="qtC3">연락처 <em>*</em></label><input class="inp num" id="qtC3" type="tel" maxlength="30" data-fmt="phone" inputmode="tel" value="' + esc(c.phone) + '" autocomplete="tel" data-sample><p class="fld__msg fld__msg--err" role="alert"></p></div></div>';
    }
    return '';
  }
  function searchHTML(k) {
    return '<div class="qt-sx qt-sx--card"><div class="qt-sx__row"><div class="qt-sx__in"><i class="i i-search i--18" aria-hidden="true"></i>' +
      '<input class="inp" id="qtSq" type="text" maxlength="100" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="qtSqAc" aria-label="상품명 검색어" placeholder="상품명이나 품번" autocomplete="off" enterkeyhint="search" value="' + esc(draft.sq || '') + '">' +
      '<button type="button" class="qt-sx__x" data-sq-x aria-label="검색어 지우기"' + (draft.sq ? '' : ' hidden') + '><i class="i i-x i--16" aria-hidden="true"></i></button>' +
      '<ul class="qt-ac" id="qtSqAc" role="listbox" aria-label="검색어 추천" hidden></ul></div>' +
      '<button type="button" class="sb sb--ink qt-sx__go" data-sq-go>검색</button></div></div><div class="qt-sxr" data-sxr aria-live="polite"></div>';
  }
  function drawSearch(card) {
    var box = $('[data-sxr]', card); if (!box) return;
    var q = (draft.sq || '').trim(), h = '';
    if (draft.st === 'busy') h = '<p class="qt-busy" role="status" data-el="L630">상품을 찾고 있습니다.</p>';
    else if (draft.st === 'fail') h = '<div class="qt-sxr__msg"><p class="msg msg--err" role="alert" data-el="L632"><i class="i i-alert" aria-hidden="true"></i><span>상품을 불러오지 못했습니다. 잠시 후 다시 검색해 주세요.</span></p><div class="acts"><button type="button" class="sb sb--line sb--s" data-sq-go><i class="i i-refresh i--14" aria-hidden="true"></i>다시 검색</button></div></div>';
    else if (!q) h = '<div class="qt-sxr__hint"><p>상품명이나 품번을 넣고 검색하세요. 전체 상품은 상품 검색 창에서 둘러볼 수 있습니다.</p><button type="button" class="sb sb--gray sb--s" data-sq-pop><i class="i i-grid2 i--14" aria-hidden="true"></i>상품 검색 창 열기</button></div>';
    else {
      var r = find(q);
      if (!r.length) h = '<div class="qt-sxr__none" data-el="L631"><p class="qt-sxr__nt"><b>‘' + esc(q) + '’</b>에 맞는 상품이 없습니다.</p><p>검색어를 바꿔 보세요. 찾는 상품이 쇼핑몰에 없으면 앞 질문에서 ‘쇼핑몰에 없는 상품’을 골라 상품명을 직접 적어 문의할 수 있습니다.</p><div class="acts"><button type="button" class="sb sb--line sb--s" data-edit="i' + iid(card.getAttribute('data-card')) + '.type">앞 질문 고치기</button><button type="button" class="sb sb--gray sb--s" data-sq-pop>상품 검색 창 열기</button></div></div>';
      else {
        var top = r.slice(0, 5);
        if (draft.pick && !top.some(function (p) { return p.key === draft.pick; }) && D.P[draft.pick]) top = [D.P[draft.pick]].concat(top.slice(0, 4));
        h = '<p class="qt-sxr__c">‘' + esc(q) + '’ 검색 결과 <b class="num">' + r.length + '</b>개</p><ul class="qt-res qt-res--card">' + top.map(function (p) { return rowHTML(p, p.key === draft.pick); }).join('') + '</ul>' +
          (r.length > 5 ? '<button type="button" class="tl qt-sxr__all" data-sq-pop>결과 ' + r.length + '개 모두 보기</button>' : '');
      }
    }
    box.innerHTML = h;
    var nx = $('[data-next]', card); if (nx) nx.disabled = !draft.pick;
  }
  function runSearch(card, q) {
    draft.sq = q; draft.pick = draft.pick || null;
    if (!q.trim()) { draft.st = null; drawSearch(card); return; }
    draft.st = 'busy'; drawSearch(card);
    function done() { if (draft.freeze) return; draft.st = draft.fail ? 'fail' : null; draft.fail = false; drawSearch(card); }
    if (RM) done(); else setTimeout(done, 420);
  }
  function cardHTML(k, isEdit) {
    var id = sid(k), S = STEPS[id], i = iid(k), stored = A[k] && !A[k].skip ? A[k].v : undefined;
    var cur = draft.v !== undefined ? draft.v : isEdit ? stored : undefined;     // 다시 그려도 입력 중인 값은 남긴다
    if ((id === 'images' || id === 'logo') && !draft.files) draft.files = isEdit && stored ? stored.slice() : [];
    if (id === 'search' && isEdit && draft.pick === undefined) { draft.pick = stored; if (!draft.sq && stored && D.P[stored]) draft.sq = D.P[stored].name; }
    var h = '<form class="qt-card" data-card="' + k + '" novalidate aria-labelledby="qtCardT">' + tagHTML(i) +
      '<p class="qt-card__t" id="qtCardT" tabindex="-1">' + esc(S.q) + (S.req ? '' : ' <span class="qt-card__opt">선택</span>') + '</p>' + (S.d ? '<p class="qt-card__d">' + esc(S.d) + '</p>' : '') +
      '<div class="qt-card__in">' + cardIn(k, cur) + '</div>';
    if (draft.errs && (id === 'images' || id === 'logo')) h += '<div class="qt-card__errs" role="alert" data-el="L634">' + draft.errs.map(function (m) { return '<p class="msg msg--err"><i class="i i-alert" aria-hidden="true"></i><span>' + esc(m) + '</span></p>'; }).join('') + '</div>';
    else if (id === 'images' || id === 'logo') h += '<div class="qt-card__errs" role="alert" data-el="L634" hidden></div>';
    h += '<div class="qt-card__acts">' + (S.req ? '' : '<button type="button" class="sb sb--gray sb--l qt-card__skip" data-skip data-el="L622">건너뛰기</button>') +
      '<button type="submit" class="sb sb--ink sb--l qt-card__next" data-next data-el="L623">' + (isEdit ? '수정 완료' : '다음') + '</button></div></form>';
    return h;
  }
  function finalHTML() {
    var n = itemCount(), q = 0;
    for (var i = 0; i < n; i++) q += Number(val('i' + i + '.qty') || 0);
    var c = val('contact') || CONTACT;
    return '<li class="qt-turn is-cur"><div class="qt-card qt-final" data-el="L629">' +
      '<p class="qt-card__t" id="qtCardT" tabindex="-1">마지막 단계입니다. 입력한 내용을 확인한 뒤 보내 주세요.</p>' +
      '<p class="qt-card__d">견적서 미리보기에서 정리된 견적서를 볼 수 있습니다. 미리보기는 보기 전용이라 보내기는 이 화면에서 합니다.</p>' +
      '<dl class="qt-final__dl"><div><dt>문의 상품</dt><dd><b class="num">' + n + '</b>개 · 총 <b class="num">' + q.toLocaleString('ko-KR') + '</b>개</dd></div><div><dt>연락받을 곳</dt><dd>' + esc(c.person) + ' · <span class="num">' + esc(c.phone) + '</span></dd></div></dl>' +
      '<p class="qt-busy qt-final__busy" role="status" data-el="L636"' + (send === 'busy' ? '' : ' hidden') + '>견적문의를 접수하고 있습니다. 창을 닫지 말고 잠시 기다려 주세요.</p>' +
      '<p class="msg msg--err qt-final__err" role="alert" data-el="L637"' + (send === 'fail' ? '' : ' hidden') + '><i class="i i-alert" aria-hidden="true"></i><span>견적문의를 보내지 못했습니다. 입력한 내용은 그대로 있으니 다시 보내 주세요. 계속 안 되면 0507-1378-6094로 연락해 주세요.</span></p>' +
      '<div class="qt-card__acts qt-final__acts"><a class="sb sb--line sb--l" href="#" data-href="quote-preview.php?state=readonly" target="_blank" data-el="L624"><i class="i i-doc i--18" aria-hidden="true"></i>견적서 미리보기<span class="sr-only"> (새 창, 보기 전용)</span></a>' +
      '<button type="button" class="bt bt--ink qt-final__send' + (send === 'busy' ? ' is-busy' : '') + '" data-send data-el="L625"' + (send === 'busy' ? ' aria-busy="true"' : '') + '><span>' + (send === 'fail' ? '다시 보내기' : send === 'busy' ? '접수하는 중' : '견적문의 보내기') + '</span><i>' + ARROW + '</i></button></div></div></li>';
  }

  function turnHTML(k) {
    var id = sid(k), ed = editing === k;
    return '<li class="qt-turn' + (ed ? ' is-edit' : '') + '" data-k="' + k + '" data-el="' + STEPS[id].el + '">' + (ed ? cardHTML(k, true) : qHTML(k)) +
      '<div class="qt-a">' + ansHTML(k) + '<button type="button" class="qt-a__edit" data-edit="' + k + '" data-el="L621" aria-label="' + esc(STEPS[id].s) + ' ' + (ed ? '수정 취소' : '답 수정') + '">' + (ed ? '수정 취소' : '수정') + '</button></div></li>';
  }
  /* 다 답한 앞 상품은 한 줄로 접는다(펼치면 답과 '수정'이 그대로 있다) */
  function grpHTML(i, inner, n) {
    var p = 'i' + i + '.', t = val(p + 'type'), nm = t === 'shop' ? (D.P[val(p + 'search')] || {}).name : val(p + 'name'), q = val(p + 'qty'), on = !!openGrp[i];
    var pr = val(p + 'print') === 'yes' ? '인쇄 있음' + (val(p + 'method') ? '(' + val(p + 'method') + ')' : '') : val(p + 'print') === 'no' ? '인쇄 없음' : '';
    return '<li class="qt-grp' + (on ? ' is-open' : '') + '"><button type="button" class="qt-grp__h" data-grp="' + i + '" aria-expanded="' + on + '" aria-controls="qtGrp' + i + '">' +
      '<span class="qt-grp__no">' + (i + 1) + '번째 상품</span><span class="qt-grp__s"><b>' + esc(nm || '상품 ' + (i + 1)) + '</b>' + (q ? ' · <span class="num">' + Number(q).toLocaleString('ko-KR') + '</span>개' : '') + (pr ? ' · ' + esc(pr) : '') + '</span>' +
      '<span class="qt-grp__n"><span>답 <span class="num">' + n + '</span>개 · ' + (on ? '접기' : '펼치기') + '</span><i class="i i-chev-d i--16" aria-hidden="true"></i></span></button>' +
      '<ol class="qt-grp__l" id="qtGrp' + i + '"' + (on ? '' : ' hidden') + '>' + inner + '</ol></li>';
  }
  var openGrp = {};
  function renderChat(o) {
    o = o || {};
    var P = path(), cur = current(), h = '', curItem = cur === 'final' || iid(cur) < 0 ? itemCount() : iid(cur), buf = '', bufI = -1, bufN = 0;
    function flush() { if (bufI >= 0) h += grpHTML(bufI, buf, bufN); buf = ''; bufI = -1; bufN = 0; }
    for (var j = 0; j < P.length; j++) {
      var k = P[j];
      if (k === cur) break;
      var id = sid(k), i = iid(k);
      if (i >= 0 && i < curItem && !(editing && iid(editing) === i)) {
        if (bufI !== i) { flush(); bufI = i; }
        buf += turnHTML(k); bufN++; continue;
      }
      flush();
      if (id === 'type' && i > 0) h += sepHTML(i);
      h += turnHTML(k);
    }
    flush();
    var stop = o.typing || has('typing');
    if (!stop) {
      if (editing) h += '<li class="qt-turn qt-wait"><p>위에서 고친 답을 저장하면 이어서 진행합니다.</p></li>';
      else if (cur === 'final') h += finalHTML();
      else {
        if (sid(cur) === 'type' && iid(cur) > 0) h += sepHTML(iid(cur));
        h += '<li class="qt-turn is-cur" data-k="' + cur + '" data-el="' + STEPS[sid(cur)].el + '">' + cardHTML(cur, false) + '</li>';
      }
    }
    log.innerHTML = h;
    typing.hidden = !stop;
    if (draft.err) { var qc = $('.qt-card[data-card$=".qty"]', log); if (qc) SUB.setErr($('.fld', qc), draft.err); }
    $$('.qt-card[data-card]', log).forEach(function (c) { if (sid(c.getAttribute('data-card')) === 'search') { drawSearch(c); bindSearch(c); } syncNext(c); });
    progress();
    return cur;
  }
  function progress() {
    var P = path(), done = P.filter(function (k) { return !!A[k]; }).length, pct = Math.round(done / P.length * 100);
    $$('[data-qt-pct]').forEach(function (n) { n.textContent = pct + '%'; });
    $$('[data-qt-bar]').forEach(function (n) { n.style.width = pct + '%'; });
    $$('[data-qt-done]').forEach(function (n) { n.textContent = done; });
    $$('[data-qt-total]').forEach(function (n) { n.textContent = P.length; });
  }
  function cardValue(card) {
    var k = card.getAttribute('data-card'), id = sid(k), r = $('input[type=radio]:checked', card), inp = $('#qtIn', card);
    if (r) return r.value;
    if (id === 'search') return draft.pick || '';
    if (id === 'images' || id === 'logo') return draft.files || [];
    if (id === 'contact') return { company: $('#qtC1', card).value.trim(), person: $('#qtC2', card).value.trim(), phone: $('#qtC3', card).value.trim() };
    return inp ? inp.value.trim() : '';
  }
  function syncNext(card) {
    var k = card.getAttribute('data-card'), id = sid(k), S = STEPS[id], nx = $('[data-next]', card); if (!nx) return;
    var v = cardValue(card), ok;
    if (id === 'search') ok = !!v;
    else if (id === 'images' || id === 'logo') ok = v.length > 0;
    else if (id === 'qty' || id === 'name' || id === 'contact') ok = true;          // 누르면 검사해 안내한다
    else ok = !!v;
    nx.disabled = !ok;
  }
  function focusCard(scroll) {
    var t = $('#qtCardT', log) || $('.qt-card__t', log);
    if (!t) return;
    if (scroll) t.closest('.qt-turn').scrollIntoView({ behavior: smooth(), block: 'center' });
    setTimeout(function () { t.focus({ preventScroll: true }); }, scroll ? 120 : 0);
    live.textContent = t.textContent;
  }
  function after(fromEdit, k) {
    if (fromEdit) { renderChat(); var t = log.querySelector('[data-k="' + k + '"]'); if (t) t.scrollIntoView({ behavior: smooth(), block: 'center' }); return; }
    if (RM) { renderChat(); focusCard(true); return; }
    renderChat({ typing: true });
    typing.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { renderChat(); focusCard(true); }, 450);
  }
  function resetItem(i) { ITEM_FIELDS.forEach(function (f) { delete A['i' + i + '.' + f]; }); }
  function dropAfter(i) { Object.keys(A).forEach(function (k) { if (iid(k) > i) delete A[k]; }); }
  function commit(k, v, skip) {
    var id = sid(k), i = iid(k), wasEdit = editing === k, old = A[k];
    if (wasEdit && id === 'more' && val(k) === 'yes' && v === 'no' && itemCount() > i + 1) {
      var n = itemCount() - i - 1;
      SUB.confirm({ title: (i + 2) + '번째 상품부터 지울까요?', desc: '이 상품까지만 문의하면 뒤에 입력한 상품 ' + n + '개의 답이 지워집니다.', ok: '지우고 진행', tone: 'red', icon: 'alert',
        onOk: function () { dropAfter(i); A[k] = { v: v }; editing = null; draft = {}; after(true, k); } });
      return;
    }
    if (wasEdit && id === 'type' && old && old.v !== v) resetItem(i);
    A[k] = skip ? { skip: true } : { v: v };
    editing = null; draft = {};
    if (wasEdit && id === 'type' && old && old.v !== v) { after(false, k); return; }
    after(wasEdit, k);
  }
  function validate(card) {
    var k = card.getAttribute('data-card'), id = sid(k), v = cardValue(card), bad = false;
    $$('.fld.is-err', card).forEach(function (f) { f.classList.remove('is-err'); });
    if (id === 'qty') { var n = parseInt(v, 10); if (!v || isNaN(n) || n < 1) { SUB.setErr($('.fld', card), '수량을 1개 이상 입력해 주세요.'); bad = true; } else v = n; }
    if (id === 'name' && !v) { SUB.setErr($('.fld', card), '상품명을 입력해 주세요.'); bad = true; }
    if (id === 'contact') {
      [['qtC1', '회사명을 입력해 주세요.'], ['qtC2', '담당자를 입력해 주세요.'], ['qtC3', '연락처를 입력해 주세요.']].forEach(function (x) { var el = $('#' + x[0], card); if (!el.value.trim()) { SUB.setErr(el.closest('.fld'), x[1]); bad = true; } });
    }
    if (bad) { var f = $('.fld.is-err input, .fld.is-err textarea', card); if (f) f.focus(); return null; }
    return { v: v };
  }
  function bindSearch(card) {
    var inp = $('#qtSq', card), ac = $('#qtSqAc', card);
    if (!inp || inp._b) return; inp._b = 1;
    var a = autocomplete(inp, ac, function (name) { runSearch(card, name); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.defaultPrevented) { e.preventDefault(); a.close(); runSearch(card, inp.value); } });
    inp.addEventListener('input', function () { draft.sq = inp.value; var x = $('[data-sq-x]', card); if (x) x.hidden = !inp.value; });
  }

  if (mode === 'chat') {
    var guide = $('#qtGuide'); if (guide && NARROW.matches) guide.open = false;
    renderChat();
    if (has('done')) setTimeout(function () { SUB.pop('qtDone'); }, 200);

    log.addEventListener('submit', function (e) {
      var card = e.target.closest('.qt-card[data-card]'); if (!card) return;
      e.preventDefault();
      var nx = $('[data-next]', card); if (nx && nx.disabled) return;
      var r = validate(card); if (!r) return;
      commit(card.getAttribute('data-card'), r.v, false);
    });
    log.addEventListener('click', function (e) {
      var t = e.target;
      var gb = t.closest('[data-grp]');
      if (gb) { var gi = Number(gb.getAttribute('data-grp')); openGrp[gi] = !openGrp[gi]; renderChat(); var g2 = log.querySelector('[data-grp="' + gi + '"]'); if (g2) g2.focus(); return; }
      var ed = t.closest('[data-edit]');
      if (ed) {
        var k = ed.getAttribute('data-edit');
        if (editing === k || !A[k]) { if (editing === k) { editing = null; draft = {}; renderChat(); var tt = log.querySelector('[data-k="' + k + '"]'); if (tt) $('.qt-a__edit', tt).focus(); } else if (!A[k]) return; return; }
        editing = k; draft = {}; renderChat();
        var turn = log.querySelector('[data-k="' + k + '"]');
        if (turn) { turn.scrollIntoView({ behavior: smooth(), block: 'center' }); var ct = $('.qt-card__t', turn); if (ct) setTimeout(function () { ct.focus({ preventScroll: true }); }, 100); }
        return;
      }
      var card = t.closest('.qt-card[data-card]');
      if (card && t.closest('[data-skip]')) { commit(card.getAttribute('data-card'), null, true); return; }
      if (card && t.closest('[data-sq-go]')) { runSearch(card, $('#qtSq', card).value); return; }
      if (card && t.closest('[data-sq-x]')) { var si = $('#qtSq', card); si.value = ''; draft.sq = ''; t.closest('[data-sq-x]').hidden = true; draft.st = null; drawSearch(card); si.focus(); return; }
      if (card && t.closest('[data-sq-pop]')) {
        openPick(draft.sq || '', function (key) { draft.pick = key; if (!draft.sq) draft.sq = D.P[key].name; var c2 = log.querySelector('.qt-card[data-card="' + card.getAttribute('data-card') + '"]'); if (c2) { $('#qtSq', c2).value = draft.sq; drawSearch(c2); $('[data-next]', c2).focus(); } }, draft.pick, t.closest('button'));
        return;
      }
      var pkb = t.closest('[data-pick]');
      if (card && pkb) { draft.pick = draft.pick === pkb.getAttribute('data-pick') ? null : pkb.getAttribute('data-pick'); drawSearch(card); var again = $('[data-pick="' + pkb.getAttribute('data-pick') + '"]', card); if (again) again.focus(); return; }
      var fx = t.closest('[data-fx]');
      if (card && fx) { draft.files.splice(Number(fx.getAttribute('data-fx')), 1); refreshFiles(card); return; }
      if (t.closest('[data-send]')) { doSend(); }
    });
    log.addEventListener('change', function (e) {
      var card = e.target.closest('.qt-card[data-card]'); if (!card) return;
      if (e.target.type === 'file') { addTo(card, e.target.files); e.target.value = ''; return; }
      keep(card, e.target); syncNext(card);
    });
    log.addEventListener('input', function (e) { var card = e.target.closest('.qt-card[data-card]'); if (card) { keep(card, e.target); syncNext(card); } });
    log.addEventListener('dragover', function (e) { var u = e.target.closest('.qt-upl'); if (u) { e.preventDefault(); u.classList.add('is-over'); } });
    log.addEventListener('dragleave', function (e) { var u = e.target.closest('.qt-upl'); if (u) u.classList.remove('is-over'); });
    log.addEventListener('drop', function (e) { var u = e.target.closest('.qt-upl'); if (!u) return; e.preventDefault(); u.classList.remove('is-over'); addTo(u.closest('.qt-card'), e.dataTransfer.files); });
  }
  function keep(card, el) {
    var id = sid(card.getAttribute('data-card'));
    if (id === 'search' || id === 'images' || id === 'logo' || el.type === 'file') return;
    draft.v = cardValue(card); draft.err = null;
  }
  function addTo(card, fl) {
    var k = card.getAttribute('data-card'), id = sid(k), i = iid(k), other = id === 'images' ? filesOf(i, 'logo') : filesOf(i, 'images'), all = allFiles(k);
    var errs = addFiles(draft.files, fl, { accept: id === 'logo' ? ACCEPT_LOGO : ACCEPT_IMG, max: id === 'logo' ? 3 : 5, other: other.length, otherAll: all.n, bytesAll: all.b,
      overMsg: id === 'logo' ? '로고 파일은 3개까지 올릴 수 있습니다.' : '상품·디자인 이미지는 상품마다 5개까지 올릴 수 있습니다.' });
    refreshFiles(card, errs);
  }
  function refreshFiles(card, errs) {
    var k = card.getAttribute('data-card'), id = sid(k), tot = $('[data-tot]', card), th = totHTML(k, draft.files);
    $('[data-files]', card).innerHTML = filesHTML(draft.files);
    $('[data-cnt]', card).textContent = draft.files.length + ' / ' + (id === 'logo' ? 3 : 5) + '개';
    if (tot) { tot.innerHTML = th; tot.hidden = !th; }
    var box = $('.qt-card__errs', card);
    if (box) { box.hidden = !(errs && errs.length); box.innerHTML = (errs || []).map(function (m) { return '<p class="msg msg--err"><i class="i i-alert" aria-hidden="true"></i><span>' + esc(m) + '</span></p>'; }).join(''); }
    if (errs && errs.length) SUB.toast(errs[0], { error: true });
    syncNext(card);
  }
  function doSend() {
    if (send === 'busy') return;
    send = 'busy'; renderChat();
    var b = $('[data-send]', log); if (b) b.focus();
    setTimeout(function () {
      send = null; renderChat();
      SUB.pop('qtDone');
      $('#qtDoneGo').hidden = false;
      setTimeout(function () { location.href = 'mypage.html?section=inquiries'; }, 3200);
    }, RM ? 400 : 1300);
  }

  /* ============================================================
     5. 한 화면 입력 양식(?mode=form)
     ============================================================ */
  var FI = [];
  function newItem() { return { type: 'shop', key: null, name: '', files: [], qty: 1, opt: '', pack: '', method: '', pdesc: '', date: '', etc: '', open: true }; }
  function fItem(o) { var it = newItem(); for (var x in o) it[x] = o[x]; return it; }
  (function presetForm() {
    if (mode !== 'form' || has('noitems')) return;
    var first = fItem({ key: 'c460', qty: 70, opt: '블랙 / 90 5개, 95 20개, 100 30개, 105 15개', pack: '기본포장', method: '자수 인쇄', pdesc: '왼쪽 가슴에 회사 로고 자수(가로 8cm), 등 상단에 회사명 한 줄', date: '2026-12-04' });
    if (has('from')) { first.files = F([['로고_시안.ai', 2400000], ['가슴_인쇄_위치.png', 480000]]); first.method = first.xm = '실크 인쇄'; first.from = true; FI = [first]; return; }
    if (has('err')) {
      first.qty = 0;
      FI = [first, fItem({ type: 'custom', name: '', files: F([['조끼_참고_사진.jpg', 1840000], ['반사띠_위치.pdf', 620000]]), qty: 40, opt: '형광 연두 / L 20개, XL 20개', pack: '상담 후 결정', method: '열전사 인쇄', ferr: '파일 하나는 20MB까지 올릴 수 있습니다. (현장_사진_원본.zip · 24.6MB)' })];
      return;
    }
    if (has('err-attach')) {                    // 상품 상세에서 넘어온 파일 7개(최대 10개) + 다른 상품 파일: 상품당 5개 · 전체 20개 · 합계 100MB를 넘은 채 다음
      first.files = Fm([['로고_시안.ai', 2.4], ['가슴_인쇄_위치.png', 0.5], ['등_인쇄_위치.png', 0.5], ['착용_예시_1.jpg', 18.2], ['착용_예시_2.jpg', 17.6], ['색상_견본.pdf', 6.3], ['매장_진열_사진.jpg', 16.9]]);
      FI = [first,
        fItem({ type: 'custom', name: '형광 안전 조끼(반사띠 부착)', qty: 40, opt: '형광 연두 / L 20개, XL 20개', method: '열전사 인쇄', open: false,
          files: Fm([['조끼_참고_사진.jpg', 1.8], ['반사띠_위치.pdf', 0.6], ['조끼_앞면.png', 2.3], ['조끼_뒷면.png', 2.3], ['로고_배치_예시.pdf', 0.9]]) }),
        fItem({ type: 'custom', name: '방염 작업복 상하의', qty: 25, method: '자수 인쇄', open: false,
          files: Fm([['작업복_착용_사진.jpg', 9.2], ['작업복_도면.pdf', 3.1], ['원단_시험성적서.pdf', 4.6], ['현장_사진_1.jpg', 8.8], ['현장_사진_2.jpg', 9.4]]) }),
        fItem({ key: 'c195', qty: 30, opt: '네이비 / M 10개, L 12개, XL 8개', pack: '기본포장', open: false,
          files: Fm([['자수_위치.png', 0.7], ['회사_로고.ai', 2.4], ['기존_조끼_사진.jpg', 4.9], ['색상_요청.pdf', 0.3]]) })];
      return;
    }
    if (has('err-empty')) {                     // 상품을 모두 지우고 연락처 칸도 비운 채 다음
      ['qtCo', 'qtPs', 'qtPh'].forEach(function (id) { $('#' + id).value = ''; });
      var cn = $('#qtCoN'); if (cn) cn.textContent = '0';
      return;
    }
    FI = [first, newItem()];
  })();
  function fRadios(i, f, list, cur, label) {
    return '<div class="seg seg--s" role="radiogroup" aria-label="' + label + '">' + list.map(function (o) {
      var v = typeof o === 'string' ? o : o[0], lb = typeof o === 'string' ? o : o[1];
      return '<label><input type="radio" name="f' + i + '-' + f + '" value="' + esc(v) + '" data-f="' + f + '"' + (cur === v ? ' checked' : '') + '><span>' + esc(lb) + '</span></label>';
    }).join('') + '</div>';
  }
  function itemTitle(it, i) { return it.type === 'shop' ? (it.key && D.P[it.key] ? D.P[it.key].name : '') : it.name.trim(); }
  function itemHTML(it, i) {
    var n = FI.length, p = it.key && D.P[it.key], showFiles = it.type === 'custom' || it.files.length > 0, ms = METHODS.slice(), nm = itemTitle(it, i);
    if (it.xm && ms.indexOf(it.xm) < 0) ms.splice(3, 0, it.xm);   // 상품 상세에서 넘어온 다른 인쇄방법
    var id = 'qtIt' + i;
    var name = it.type === 'shop'
      ? (p ? chosenHTML(p, '<button type="button" class="sb sb--gray sb--s qt-chosen__re" data-f-pick="' + i + '" data-el="L676">다시 고르기</button>')
           : '<button type="button" class="qt-pickbtn" id="' + id + '-name" data-f-pick="' + i + '" data-el="L676"><i class="i i-search i--18" aria-hidden="true"></i><span>상품명을 검색해 고르세요</span><i class="i i-chev-r i--18" aria-hidden="true"></i></button>')
      : '<input class="inp" id="' + id + '-name" maxlength="200" data-f="name" value="' + esc(it.name) + '" placeholder="예: 형광 안전 조끼(반사띠 부착)">';
    return '<section class="qt-item' + (it.open ? ' is-open' : '') + '" id="qtItem' + i + '" data-i="' + i + '" aria-labelledby="' + id + '-t">' +
      '<div class="qt-item__h"><h3 class="qt-item__t" id="' + id + '-t" data-el="L647"><button type="button" class="qt-item__tg" aria-expanded="' + (it.open ? 'true' : 'false') + '" aria-controls="' + id + '-b" data-f-tg="' + i + '">' +
      '<span class="qt-item__no">상품 <span class="num">' + (i + 1) + '</span> <small class="num">/ ' + n + '</small></span><span class="qt-item__s">' + (nm ? esc(nm) : '상품을 고르지 않았습니다') + ' · <span class="num">' + (it.qty >= 1 ? Number(it.qty).toLocaleString('ko-KR') + '개' : '수량 비어 있음') + '</span></span><i class="i i-chev-d i--18 qt-item__ar" aria-hidden="true"></i></button></h3>' +
      (n > 1 ? '<button type="button" class="qt-item__x" data-f-del="' + i + '" data-el="L675" aria-label="' + (i + 1) + '번째 상품 삭제"><i class="i i-trash i--16" aria-hidden="true"></i>삭제</button>' : '') + '</div>' +
      '<div class="qt-item__b" id="' + id + '-b"' + (it.open ? '' : ' hidden') + '><div class="fgrid">' +
      '<div class="fld full" data-el="L657"><span class="fld__l" id="' + id + '-tl">상품 유형 <em>*</em></span>' + fRadios(i, 'type', [['shop', '쇼핑몰 내 상품'], ['custom', '쇼핑몰에 없는 상품']], it.type, '상품 유형') + '</div>' +
      '<div class="fld full" data-el="L658" data-name="상품명"><label class="fld__l" for="' + id + '-name">상품명 <em>*</em>' + (it.type === 'custom' ? '<span class="r"><span class="num">' + it.name.length + '</span> / 200</span>' : '') + '</label>' + name +
      '<p class="fld__help">' + (it.type === 'shop' ? '쇼핑몰 상품은 검색으로 고릅니다. 없는 상품은 상품 유형을 ‘쇼핑몰에 없는 상품’으로 바꿔 주세요.' : '모델명·품번을 알면 함께 적어 주세요.') + '</p><p class="fld__msg fld__msg--err" role="alert"></p></div>' +
      (showFiles ? '<div class="fld full qt-ffiles' + (it.ferr ? ' is-err' : '') + '" data-el="L659 L684"><span class="fld__l">상품·디자인 이미지 <small>선택</small></span>' +
        '<label class="upl"><span class="upl__ic"><i class="i i-upload" aria-hidden="true"></i></span><span class="upl__tx">파일을 끌어다 놓거나 눌러서 고르세요 <span class="upl__cnt num">' + it.files.length + ' / 5개</span><small>이미지·PDF·문서·한글·압축 파일 · 상품당 5개 · 파일당 20MB</small></span><input type="file" multiple data-f-up="' + i + '" accept="' + ACCEPT_IMG.split(',').map(function (x) { return '.' + x; }).join(',') + '"></label>' +
        '<ul class="files">' + filesHTML(it.files, i) + '</ul><p class="fld__msg fld__msg--err" role="alert">' + esc(it.ferr || '') + '</p></div>' : '') +
      '<div class="fld" data-el="L660" data-name="수량"><label class="fld__l" for="' + id + '-qty">수량 <em>*</em></label><div class="qt-qty__row"><span class="qty"><button type="button" data-q="-1" aria-label="수량 줄이기">−</button><input type="number" id="' + id + '-qty" min="0" max="99999" inputmode="numeric" data-f="qty" value="' + esc(it.qty) + '"><button type="button" data-q="1" aria-label="수량 늘리기">+</button></span><span class="qt-qty__u">개</span></div><p class="fld__msg fld__msg--err" role="alert"></p></div>' +
      '<div class="fld" data-el="L661"><label class="fld__l" for="' + id + '-opt">상품 옵션 <small>선택</small></label><input class="inp" id="' + id + '-opt" maxlength="500" data-f="opt" value="' + esc(it.opt) + '" placeholder="색상·사이즈 등"></div>' +
      '<div class="fld" data-el="L662"><span class="fld__l">포장 <small>선택</small></span>' + fRadios(i, 'pack', PACKS, it.pack, '포장') + '</div>' +
      '<div class="fld" data-el="L663"><span class="fld__l">인쇄방법 <small>선택</small></span>' + fRadios(i, 'method', ms, it.method, '인쇄방법') + '</div>' +
      '<div class="fld full" data-el="L664"><label class="fld__l" for="' + id + '-pd">인쇄 부위 및 설명 <small>선택</small></label><textarea class="txa txa--s" id="' + id + '-pd" maxlength="2000" data-f="pdesc" placeholder="인쇄 부위, 로고 크기, 색상 등">' + esc(it.pdesc) + '</textarea></div>' +
      '<div class="fld" data-el="L665"><label class="fld__l" for="' + id + '-dt">납품희망일 <small>선택</small></label><input class="inp" id="' + id + '-dt" type="date" min="' + today() + '" data-f="date" value="' + esc(it.date) + '"></div>' +
      '<div class="fld" data-el="L666"><label class="fld__l" for="' + id + '-etc">기타사항 <small>선택</small></label><input class="inp" id="' + id + '-etc" maxlength="2000" data-f="etc" value="' + esc(it.etc) + '" placeholder="원단, 샘플 필요 여부 등"></div>' +
      '</div></div></section>';
  }
  var fm = { items: $('#qtItems'), empty: $('#qtItemsEmpty'), n: $('#qtItemsN'), errs: $('#qtErrs'), form: $('#qtForm') };
  function renderItems() {
    fm.items.innerHTML = FI.map(itemHTML).join('');
    fm.empty.hidden = FI.length > 0;
    fm.n.textContent = FI.length + '개';
    summary();
  }
  function reqCount() {
    var n = 0, f = 0, rows = [];
    FI.forEach(function (it, i) {
      var nm = itemTitle(it, i), q = Number(it.qty) >= 1; n += 2; if (nm) f++; if (q) f++;
      rows.push({ i: i, nm: nm, qty: it.qty, ok: !!nm && q });
    });
    if (!FI.length) n += 2;                    // 상품이 없으면 상품명·수량 두 칸이 비어 있는 것으로 센다
    ['qtCo', 'qtPs', 'qtPh'].forEach(function (id) { n++; if ($('#' + id).value.trim()) f++; });
    return { n: n, f: f, rows: rows };
  }
  function summary() {
    var r = reqCount(), pct = r.n ? Math.round(r.f / r.n * 100) : 0;
    $('[data-qs-pct]').textContent = pct + '%'; $('[data-qs-bar]').style.width = pct + '%'; $('[data-qs-done]').textContent = r.f; $('[data-qs-total]').textContent = r.n;
    $('#qtSumL').innerHTML = r.rows.length ? r.rows.map(function (x) {
      return '<li class="qt-sum__it' + (x.ok ? '' : ' is-need') + '"><a href="#qtItem' + x.i + '" data-f-go="' + x.i + '"><span class="qt-sum__no num">' + (x.i + 1) + '</span><span class="qt-sum__n">' + (x.nm ? esc(x.nm) : '상품 ' + (x.i + 1)) + '</span>' +
        '<span class="qt-sum__q num">' + (Number(x.qty) >= 1 ? Number(x.qty).toLocaleString('ko-KR') + '개' : '비어 있음') + '</span>' + (x.ok ? '' : '<span class="stag stag--line">입력 필요</span>') + '</a></li>';
    }).join('') : '<li class="qt-sum__none">추가한 상품이 없습니다.</li>';
    var fn = 0, fb = 0; FI.forEach(function (it) { fn += it.files.length; fb += sumBytes(it.files); });
    $('#qtSumF').textContent = fn; $('#qtSumB').textContent = fn ? ' · ' + SUB.fmtSize(fb) : '';
    $('#qtSumF').closest('div').classList.toggle('is-over', fn > 20 || fb > 100 * MB);
    [['qtCo', 'qtSumCo'], ['qtPs', 'qtSumPs'], ['qtPh', 'qtSumPh']].forEach(function (x) { var v = $('#' + x[0]).value.trim(); var d = $('#' + x[1]); d.textContent = v || '비어 있음'; d.classList.toggle('qt-none', !v); });
    // 단계 표시: 필수값을 다 채운 단계에 완료 표시
    var li = $$('#qtStp li'), itemsOk = FI.length > 0 && r.rows.every(function (x) { return x.ok; }) && !FI.some(function (it) { return it.ferr || it.files.length > 5; }) && fn <= 20 && fb <= 100 * MB, ctOk = ['qtCo', 'qtPs', 'qtPh'].every(function (id) { return $('#' + id).value.trim(); });
    li[0].classList.toggle('is-done', itemsOk); li[1].classList.toggle('is-done', ctOk);
  }
  function stepOn() {
    var li = $$('#qtStp li'), ct = $('#qtContact').getBoundingClientRect().top, on = ct < window.innerHeight * 0.55 ? 1 : 0;
    li.forEach(function (x, j) { x.classList.toggle('is-on', j === on); if (j === on) x.setAttribute('aria-current', 'step'); else x.removeAttribute('aria-current'); });
  }
  function fCheck() {
    var list = [];
    $$('.fld.is-err', fm.form).forEach(function (f) { if (!f.classList.contains('qt-ffiles')) f.classList.remove('is-err'); });
    function err(fld, msg, target) { if (fld) SUB.setErr(fld, msg); list.push([msg, target]); }
    if (!FI.length) list.push(['상품을 1개 이상 추가해 주세요.', 'qtAdd']);
    var nAll = 0, bAll = 0;
    FI.forEach(function (it, i) {
      var no = (i + 1) + '번째 상품';
      if (it.files.length > 5 && !it.ferr) it.ferr = '상품·디자인 이미지는 상품마다 5개까지 올릴 수 있습니다. 지금 ' + it.files.length + '개이니 ' + (it.files.length - 5) + '개를 지워 주세요.';
      if (it.ferr) { it.open = true; reItem(i); }
      var sec = $('#qtItem' + i);
      if (!itemTitle(it, i)) { openItem(i, true); sec = $('#qtItem' + i); err($('[data-el~="L658"]', sec), it.type === 'shop' ? no + '을 검색해 골라 주세요.' : no + '의 상품명을 입력해 주세요.', 'qtIt' + i + '-name'); }
      if (!(Number(it.qty) >= 1)) { openItem(i, true); sec = $('#qtItem' + i); err($('[data-el~="L660"]', sec), no + '의 수량을 확인해 주세요. 1개 이상이어야 합니다.', 'qtIt' + i + '-qty'); }
      if (it.ferr) list.push([no + ': ' + it.ferr, 'qtItem' + i]);
      nAll += it.files.length; bAll += sumBytes(it.files);
    });
    if (nAll > 20) list.push(['첨부 파일은 모든 상품을 합쳐 20개까지 올릴 수 있습니다. 지금 ' + nAll + '개입니다.', 'qtItemsSec']);
    if (bAll > 100 * MB) list.push(['첨부 파일은 모두 합쳐 100MB까지 올릴 수 있습니다. 지금 ' + SUB.fmtSize(bAll) + '입니다.', 'qtItemsSec']);
    [['qtCo', '회사명을 입력해 주세요.'], ['qtPs', '담당자를 입력해 주세요.'], ['qtPh', '연락처를 입력해 주세요.']].forEach(function (x) { var el = $('#' + x[0]); if (!el.value.trim()) err(el.closest('.fld'), x[1], x[0]); });
    $('.qt-errs__l', fm.errs).innerHTML = list.map(function (x) { return '<li><a href="#' + x[1] + '" data-f-jump="' + x[1] + '">' + esc(x[0]) + '</a></li>'; }).join('');
    fm.errs.hidden = !list.length;
    return list.length === 0;
  }
  function openItem(i, v) { if (!FI[i] || FI[i].open === v) return; FI[i].open = v; var sec = $('#qtItem' + i); if (sec) sec.outerHTML = itemHTML(FI[i], i); }

  if (mode === 'form') {
    if (PHONE.matches && !has('err-attach')) FI.forEach(function (it, i) { it.open = i === FI.length - 1 || has('err'); });
    renderItems();
    if (has('err') || has('err-attach') || has('err-empty')) { fCheck(); }
    window.addEventListener('scroll', stepOn, { passive: true }); stepOn();
    fm.form.addEventListener('submit', function (e) {
      e.preventDefault();
      summary();
      if (!fCheck()) { fm.errs.scrollIntoView({ behavior: smooth(), block: 'center' }); setTimeout(function () { fm.errs.focus({ preventScroll: true }); }, 200); SUB.toast('입력한 내용을 확인해 주세요.', { error: true }); return; }
      var w = window.open('quote-preview.html', '_blank');
      if (!w) location.href = 'quote-preview.html';
      SUB.toast('견적서 미리보기를 새 창으로 열었습니다. 견적 요청은 미리보기에서 보냅니다.');
    });
    fm.errs.addEventListener('click', function (e) {
      var a = e.target.closest('[data-f-jump]'); if (!a) return; e.preventDefault();
      var t = document.getElementById(a.getAttribute('data-f-jump')); if (!t) return;
      t.scrollIntoView({ behavior: smooth(), block: 'center' }); setTimeout(function () { (t.matches('input, textarea, button') ? t : ($('input, button', t) || t)).focus({ preventScroll: true }); }, 250);
    });
    $('#qtAdd').addEventListener('click', function () {
      if (PHONE.matches) FI.forEach(function (it) { it.open = false; });
      FI.push(newItem()); renderItems();
      var sec = $('#qtItem' + (FI.length - 1)); sec.scrollIntoView({ behavior: smooth(), block: 'start' });
      setTimeout(function () { var b = $('.qt-item__tg', sec); if (b) b.focus({ preventScroll: true }); }, 200);
      SUB.toast((FI.length) + '번째 상품을 추가했습니다.');
    });
    $('.qt-sum').addEventListener('click', function (e) {
      var a = e.target.closest('[data-f-go]'); if (!a) return; e.preventDefault();
      var i = Number(a.getAttribute('data-f-go')); openItem(i, true);
      var sec = $('#qtItem' + i); sec.scrollIntoView({ behavior: smooth(), block: 'start' }); setTimeout(function () { $('.qt-item__tg', sec).focus({ preventScroll: true }); }, 200);
    });
    fm.items.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('[data-f-tg]'))) { var i = Number(b.getAttribute('data-f-tg')); openItem(i, !FI[i].open); $('#qtItem' + i + ' .qt-item__tg').focus(); return; }
      if ((b = t.closest('[data-f-del]'))) {
        var di = Number(b.getAttribute('data-f-del')), nm = itemTitle(FI[di], di);
        SUB.confirm({ title: (di + 1) + '번째 상품을 삭제할까요?', desc: (nm ? '‘' + nm + '’의 ' : '') + '입력한 내용과 첨부 파일이 함께 지워집니다.', ok: '삭제', tone: 'red', icon: 'trash',
          onOk: function () { FI.splice(di, 1); renderItems(); fm.errs.hidden = true; SUB.toast((di + 1) + '번째 상품을 삭제했습니다.'); } });
        return;
      }
      if ((b = t.closest('[data-f-pick]'))) {
        var pi = Number(b.getAttribute('data-f-pick'));
        openPick('', function (key) { FI[pi].key = key; FI[pi].open = true; var sec = $('#qtItem' + pi); sec.outerHTML = itemHTML(FI[pi], pi); summary(); var re = $('#qtItem' + pi + ' .qt-chosen__re'); if (re) re.focus(); }, FI[pi].key, b);
        return;
      }
      if ((b = t.closest('[data-fx]')) && b.hasAttribute('data-ft')) { var fi = Number(b.getAttribute('data-ft')); FI[fi].files.splice(Number(b.getAttribute('data-fx')), 1); FI[fi].ferr = ''; reItem(fi); summary(); }
    });
    fm.items.addEventListener('change', function (e) {
      var t = e.target, sec = t.closest('.qt-item'); if (!sec) return;
      var i = Number(sec.getAttribute('data-i')), it = FI[i], f = t.getAttribute('data-f');
      if (t.hasAttribute('data-f-up')) { fAdd(i, t.files); t.value = ''; return; }
      if (f === 'type') { it.type = t.value; it.key = null; it.name = ''; reItem(i); summary(); var fo = $('#qtIt' + i + '-name'); if (fo) fo.focus(); return; }
      if (f === 'pack' || f === 'method') { it[f] = t.value; return; }
      if (f) { it[f] = f === 'qty' ? (t.value === '' ? '' : Number(t.value)) : t.value; headSync(i); summary(); }
    });
    fm.items.addEventListener('input', function (e) {
      var t = e.target, sec = t.closest('.qt-item'); if (!sec) return;
      var i = Number(sec.getAttribute('data-i')), f = t.getAttribute('data-f'); if (!f || t.type === 'radio') return;
      FI[i][f] = f === 'qty' ? (t.value === '' ? '' : Number(t.value)) : t.value;
      if (f === 'name') { var c = $('.fld__l .r .num', t.closest('.fld')); if (c) c.textContent = t.value.length; }
      headSync(i); summary();
    });
    ['qtCo', 'qtPs', 'qtPh'].forEach(function (id) { $('#' + id).addEventListener('input', summary); });
    fm.items.addEventListener('dragover', function (e) { var u = e.target.closest('.upl'); if (u) { e.preventDefault(); u.classList.add('is-over'); } });
    fm.items.addEventListener('dragleave', function (e) { var u = e.target.closest('.upl'); if (u) u.classList.remove('is-over'); });
    fm.items.addEventListener('drop', function (e) { var u = e.target.closest('.upl'); if (!u) return; e.preventDefault(); fAdd(Number(u.closest('.qt-item').getAttribute('data-i')), e.dataTransfer.files); });
  }
  function fAdd(i, list) {
    var it = FI[i], all = 0, bytes = 0;
    FI.forEach(function (x, j) { if (j !== i) { all += x.files.length; bytes += sumBytes(x.files); } });
    var errs = addFiles(it.files, list, { accept: ACCEPT_IMG, max: 5, otherAll: all, bytesAll: bytes, overMsg: '상품·디자인 이미지는 상품마다 5개까지 올릴 수 있습니다.' });
    it.ferr = errs[0] || ''; if (errs.length) SUB.toast(errs[0], { error: true });
    reItem(i); summary();
  }
  function reItem(i) { var sec = $('#qtItem' + i); if (sec) sec.outerHTML = itemHTML(FI[i], i); }
  function headSync(i) {
    var s = $('#qtItem' + i + ' .qt-item__s'); if (!s) return;
    var it = FI[i], nm = itemTitle(it, i);
    s.innerHTML = (nm ? esc(nm) : '상품을 고르지 않았습니다') + ' · <span class="num">' + (Number(it.qty) >= 1 ? Number(it.qty).toLocaleString('ko-KR') + '개' : '수량 비어 있음') + '</span>';
  }

  /* ============================================================
     6. 상태 보기: 상품 검색 팝업을 연 채로
     ============================================================ */
  var pickState = ['pick', 'pick-ac', 'pick-result', 'pick-none', 'pick-busy', 'pick-long', 'pick-fail', 'pick-empty'].filter(has)[0];
  if (pickState && mode === 'chat') {             // 대화형의 상품 검색 질문에서 '상품 검색 창 열기'를 누른 상태
    setTimeout(function () {
      var c0 = $('.qt-card[data-card$=".search"]', log); if (!c0) return;
      var from = $('[data-sq-pop]', c0) || $('[data-sq-go]', c0);
      openPick(draft.sq || '', function (key) { draft.pick = key; var c2 = $('.qt-card[data-card$=".search"]', log); if (c2) drawSearch(c2); }, draft.pick, from);
    }, 60);
  }
  if (pickState && mode === 'form') {
    var target = FI.length > 1 ? 1 : 0;
    var q = { 'pick-result': '패딩', 'pick-none': '방염복', 'pick-busy': '패딩', 'pick-fail': '패딩', 'pick-long': '방한 후드 패딩 블랙 90 95 100 105 사이즈 왼쪽 가슴 로고 자수 등 상단 회사명 인쇄 개별 포장 납품 12월 첫 주 희망 견적 부탁드립니다' }[pickState] || '';
    if (pickState === 'pick-long') q = (q + ' ' + q).slice(0, 100);
    setTimeout(function () {
      openPick(q, function (key) { if (!FI[target]) FI[target] = newItem(); FI[target].key = key; reItem(target); summary(); });
      if (pickState === 'pick-ac') setTimeout(function () { pk.inp.value = '후드'; pk.x.hidden = false; pk.inp.focus({ preventScroll: true }); pkAc.draw('후드'); pkAc.move(1); }, 160);
    }, 60);
  }
})();
