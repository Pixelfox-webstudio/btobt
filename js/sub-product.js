/* 비투비티 하위 페이지 · sub-product.js (2026-11-17)
   상품 상세: 사진 넘기기 · 단계(옵션 → 색상 → 사이즈별 수량 → 포장 → 인쇄) · 수량 할인 계산 · 필수 확인 · 장바구니/주문 · 따라오는 바 · 상세 정보 이동.
   상품 자료는 js/sub-data.js(SUBDATA). 옵션 값·인쇄방법·인쇄 부분은 자료에 없어 견본 값이다(운영 자료로 바뀔 자리, data-sample). */
(function () {
  'use strict';
  var S = window.SUB, D = window.SUBDATA; if (!S || !D) return;
  var $ = S.$, $$ = S.$$, esc = S.esc, qs = S.qs, has = S.has;
  var root = document.documentElement, body = document.body;
  var mq = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function num(n) { return Number(n).toLocaleString('ko-KR'); }
  function behavior() { return reduce.matches ? 'auto' : 'smooth'; }

  /* ---------- 0. 어떤 상품인가 ---------- */
  var id = qs.get('id') || '463', brandKey = qs.get('brand') || '';
  var p = has('none') ? null : D.P[(brandKey ? 'b' : 'c') + id];
  if (p && brandKey && p.brand !== brandKey) p = null;
  var bar = $('#pdBar');
  if (!p) {
    $('#pd').hidden = true; $('#pdCrumb').hidden = true; if (bar) bar.remove();
    $('#pdNone').hidden = false;
    // 대신 볼 상품: 홈 '상품 랭킹'과 같은 상품 목록 추천순(2026-11-11 진열 순서) 앞의 4개
    var tab = ((window.B2BT_RANK || {}).tabs || [])[0], keys = tab ? tab.keys : [];
    var picks = keys.map(function (k) { return D.P[k]; }).filter(Boolean).slice(0, 4);
    if (picks.length < 4) picks = D.list.slice(0, 4);
    $('#pdMore').innerHTML = picks.map(function (x) { return D.card(x, {}); }).join('');
    return;
  }

  var isBrand = !!p.brand;
  var price = /[\d,]+원/.test(p.price) ? p.priceNum : 0;             // 정확한 판매가가 있을 때만 금액을 계산한다(“1만원대”·견적문의는 계산하지 않음)
  var sampleSizes = false;
  var sizes = p.sizes.slice();
  if (isBrand && has('sized')) { sizes = ['95', '100', '105', '110'].map(function (l) { return { l: l, n: null }; }); sampleSizes = true; }
  var textMode = isBrand && !sizes.length;                             // 협력브랜드에 등록 사이즈·색상이 없으면 글로 적기
  if (!isBrand && !sizes.length) sizes = [{ l: 'FREE', n: null }];     // 사이즈가 없으면 기본 하나
  var colors = isBrand ? [] : p.colors.slice();
  var options = p.key === 'c463' ? [{ name: '핏', values: ['남녀공용', '여성용'] }] : [];
  options = options.filter(function (o) { return o.values.length >= 2; });
  var packs = (isBrand || has('noprint')) ? [] : ['기본 포장', '개별 폴리백'];
  var printable = !has('noprint');
  var methods = has('nomethod') ? [] : ['자수 인쇄', '실크 인쇄', '전사 인쇄'];
  var isCap = p.cat === '모자', isVest = p.cat === '조끼';
  var PARTS = isCap
    ? [['앞면', 0, 47, 37], ['옆면', 0, 78, 40], ['뒷면', 1, 50, 42]]
    : [['왼쪽 가슴', 0, 66, 34], ['오른쪽 가슴', 0, 41, 34], ['등', 1, 53, 38]].concat(isVest ? [] : [['왼쪽 팔', 0, 78, 58], ['오른쪽 팔', 0, 29, 58]]);
  var parts = has('nomethod') ? [] : PARTS;

  /* ---------- 1. 처음 값(상태별 견본) ---------- */
  var V = { opt: {}, rows: [], text: '', pack: packs.length ? 0 : -1, print: 0, method: -1, parts: [], desc: '' };
  function row(c, q) { return { hex: c ? c.hex : '', name: c ? c.name : '', q: q || {}, fold: false }; }
  function colorBy(name) { return colors.filter(function (c) { return c.name === name; })[0]; }
  var filled = !has('fresh') && !has('need') && !has('nocolor');
  if (colors.length) {
    if (filled && p.key === 'c463') {
      V.rows = [row(colorBy('블랙'), { 95: 5, 100: 12, 105: 10, 110: 4 }), row(colorBy('네이비'), { 100: 6, 105: 5 })];
      V.rows[1].fold = true;
    } else if (filled) {
      V.rows = [row(colors[0], {})]; V.rows[0].q[sizes[Math.min(2, sizes.length - 1)].l] = 20;
    } else if (!has('nocolor')) V.rows = [row(colors[0], {})];
  } else if (!textMode) {
    V.rows = [row(null, {})];
    if (filled) {
      if (sizes.length === 1) V.rows[0].q[sizes[0].l] = 30;
      else { V.rows[0].q[sizes[0].l] = 3; V.rows[0].q[sizes[1].l] = 5; V.rows[0].q[sizes[2].l] = 4; }
    }
  }
  if (textMode && filled) V.text = 'JK-F6101\n95 4벌, 100 6벌, 105 2벌';
  if (textMode && has('need')) V.text = 'JK-F6101\n95 4, 100 6, 105 2';   // 벌 수를 “벌” 없이 적은 경우(미입력 안내 견본)
  if (filled && options.length) V.opt[0] = 0;
  if (has('need')) { V.pack = -1; V.print = 1; }
  var printOn = has('print') || has('upl-err') || has('restored') || has('nomethod') || (isBrand && has('sized'));
  if (printOn && printable) {
    V.print = 1;
    if (!has('nomethod') && !isBrand) { V.method = 0; V.parts = isCap ? ['앞면'] : ['왼쪽 가슴', '등']; V.desc = isCap ? '앞면에 회사 로고를 넣어 주세요.' : '왼쪽 가슴에 회사 로고(흰색 실), 등에 “한결산업” 글자를 넣어 주세요.'; }
  }
  if (!printable) V.print = 0;
  var SAMPLE_FILES = [['로고_시안.ai', 2516582], ['가슴_인쇄_위치.png', 491520, p.imgs[0]]];   // 2.4MB · 480KB

  /* 비로그인 때 보관한 값 되살리기(30분) */
  // 주문·장바구니(로그인 안내 → login.html?return=…&restore=1)나 관심상품(로그인 뒤 원래 화면)으로 돌아오면, 같은 상품이고 30분 안이면 되살린다
  var KEEP = 'b2bt-pd-keep', restoredMissing = [], fromKeep = false;
  if (!has('restored') && S.auth === 'member') {
    try {
      var k = JSON.parse(localStorage.getItem(KEEP) || 'null');
      if (k && k.key === p.key && Date.now() - k.t < 30 * 60000) {
        V = k.v; fromKeep = true; restoredMissing = (k.files || []).filter(function (f) { return !f.sample; }).map(function (f) { return f.name; });
        SAMPLE_FILES = (k.files || []).filter(function (f) { return f.sample; }).map(function (f) { return [f.name, f.size, f.src]; });
        $('#pdRestore').hidden = false;
        localStorage.removeItem(KEEP);
      } else if (k && Date.now() - k.t >= 30 * 60000) localStorage.removeItem(KEEP);   // 30분이 지나면 버린다
    } catch (e) {}
  }
  if (has('restored')) { $('#pdRestore').hidden = false; restoredMissing = ['로고_시안.ai']; SAMPLE_FILES = [SAMPLE_FILES[1]]; }

  /* ---------- 2. 머리: 경로 · 이름 · 가격 · 정보 ---------- */
  var href = function (h) { return 'href="#" data-href="' + esc(h) + '"'; };
  var crumb = '<a ' + href('index.php') + '>홈</a><span aria-hidden="true">/</span>';
  if (isBrand) {
    crumb += '<a ' + href('brand.php') + '>협력브랜드</a><span aria-hidden="true">/</span><a ' + href('brand.php?cat=' + p.brand) + '>' + esc(p.brandKo) + '</a><span aria-hidden="true">/</span><a ' + href('brand.php?cat=' + p.brand + '&form=' + encodeURIComponent(p.form)) + '>' + esc(p.form) + '</a>';
  } else {
    crumb += '<a ' + href('category.php') + '>단체복</a><span aria-hidden="true">/</span><a ' + href('category.php?cat=' + encodeURIComponent(p.cat)) + '>' + esc(p.cat) + '</a>' +
      (p.sub ? '<span aria-hidden="true">/</span><a ' + href('category.php?cat=' + encodeURIComponent(p.cat) + '&sub=' + encodeURIComponent(p.sub)) + '>' + esc(p.sub) + '</a>' : '');
  }
  $('#pdCrumb').innerHTML = crumb;
  $('#pdCat').textContent = isBrand ? '협력브랜드 · ' + p.brandKo : '단체복 · ' + p.cat;
  $('#pdName').textContent = p.name;
  document.title = p.name + ' | 비투비티';
  $('#pdLike').setAttribute('data-like', p.key);
  if (isBrand) {
    $('#pdPrice').textContent = '견적문의'; $('#pdPriceSub').textContent = '수량을 보고 담당자가 견적을 드립니다';
    $('#pdDisc').hidden = true; $('#pdLead').hidden = true;
  } else {
    $('#pdPrice').textContent = p.price; $('#pdPriceSub').textContent = price ? '1벌 기준' : '수량에 따라 견적으로 안내합니다';
    if (!price) $('#pdDisc').hidden = true;
  }
  var spec = [];
  if (isBrand) spec.push(['브랜드', p.brandKo], ['형태', p.form]);
  else {
    if (p.material) spec.push(['소재', p.material, 1]);
    if (p.season) spec.push(['시즌', p.season, 1]);
  }
  spec.push(['사이즈', textMode ? '등록된 사이즈 없음' : (sizes.length > 1 ? sizes[0].l + ' ~ ' + sizes[sizes.length - 1].l : sizes[0].l), sampleSizes ? 1 : 0]);
  spec.push(['색상', colors.length ? '색상 ' + p.nColors + '종' : (isBrand ? '등록된 색상 없음' : '색상 선택 없음')]);
  $('#pdSpec').innerHTML = spec.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd' + (s[2] ? ' data-sample' : '') + '>' + esc(s[1]) + '</dd></div>'; }).join('');

  /* ---------- 3. 사진 ---------- */
  var track = $('#pdTrack'), thumbs = $('#pdThumbs'), cnt = $('#pdCnt');
  var imgs = []; (p.imgs.concat(p.gallery || [])).forEach(function (s) { if (imgs.indexOf(s) < 0) imgs.push(s); });
  if (has('noinfo')) imgs = [];
  var cur = 0;
  function altOf(i) { return i === 0 ? p.name : (p.name + ' 사진 ' + (i + 1)); }
  if (!imgs.length) {
    $('#pdGalEmpty').hidden = false; track.hidden = true; thumbs.hidden = true; cnt.hidden = true;
    $$('.pd-gal__nav').forEach(function (b) { b.hidden = true; });
  } else {
    track.innerHTML = imgs.map(function (s, i) {
      var w = /brandp/.test(s) ? 900 : 800, h = /brandp/.test(s) ? 600 : 800;
      return '<div class="pd-gal__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + imgs.length + '"><img src="' + s + '" alt="' + esc(altOf(i)) + '" width="' + w + '" height="' + h + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async" draggable="false"></div>';
    }).join('');
    thumbs.innerHTML = imgs.length > 1 ? imgs.map(function (s, i) { return '<button type="button" class="pd-gal__th" data-i="' + i + '" aria-label="' + (i + 1) + '번째 사진 보기"' + (i ? '' : ' aria-current="true"') + '><img src="' + s + '" alt="" width="120" height="120" loading="lazy" decoding="async"></button>'; }).join('') : '';
    if (imgs.length < 2) { thumbs.hidden = true; cnt.hidden = true; $$('.pd-gal__nav').forEach(function (b) { b.hidden = true; }); }
    else thumbs.setAttribute('data-el', 'L194');
  }
  function paintGal(i) {
    cur = i;
    cnt.innerHTML = '<b>' + (i + 1) + '</b><span>/</span>' + imgs.length;
    $$('.pd-gal__th', thumbs).forEach(function (t, k) { if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
  }
  function go(i) {
    var n = imgs.length; if (!n) return;
    i = (i + n) % n;                                   // 끝없이 돈다
    track.scrollTo({ left: i * track.clientWidth, behavior: behavior() });
    paintGal(i);
  }
  if (imgs.length) paintGal(0);
  $$('[data-gal]').forEach(function (b) { b.addEventListener('click', function () { go(cur + Number(b.getAttribute('data-gal'))); }); });
  thumbs.addEventListener('click', function (e) { var t = e.target.closest('.pd-gal__th'); if (t) go(Number(t.getAttribute('data-i'))); });
  var st, resized = 0;
  track.addEventListener('scroll', function () { if (Date.now() - resized < 450) return; clearTimeout(st); st = setTimeout(function () { var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== cur && i >= 0 && i < imgs.length) paintGal(i); }, 60); }, { passive: true });
  track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
  // 칸 크기가 바뀌면(첫 배치·회전·창 크기) 보던 장을 그대로 둔다. Safari 는 첫 배치나 크기가 바뀔 때 다른 장으로 맞추는 일이 있어 잠시 뒤 한 번 더 맞춘다
  function keepSlide() { if (!imgs.length) return; resized = Date.now(); if (Math.abs(track.scrollLeft - cur * track.clientWidth) > 1) track.scrollLeft = cur * track.clientWidth; }
  function keepSoon() { keepSlide(); requestAnimationFrame(keepSlide); setTimeout(keepSlide, 200); }
  if ('ResizeObserver' in window) new ResizeObserver(keepSoon).observe(track); else window.addEventListener('resize', keepSoon);
  window.addEventListener('load', keepSoon);

  /* ---------- 4. 단계 ---------- */
  var stepEl = { opt: $('#pdStOpt'), color: $('#pdStColor'), qty: $('#pdStQty'), pack: $('#pdStPack'), print: $('#pdStPrint') };
  var stepOn = { opt: options.length > 0, color: colors.length > 0, qty: true, pack: !isBrand, print: true };
  Object.keys(stepEl).forEach(function (k) { stepEl[k].hidden = !stepOn[k]; });
  var order = ['opt', 'color', 'qty', 'pack', 'print'].filter(function (k) { return stepOn[k]; });
  order.forEach(function (k, i) { $('.pd-step__no', stepEl[k]).textContent = i + 1; });

  // 옵션
  if (options.length) {
    $('#pdOpts').innerHTML = options.map(function (o, oi) {
      return '<div class="pd-opt"><p class="pd-sub__l" id="pdOptL' + oi + '">' + esc(o.name) + ' <em>*</em></p><div class="seg" role="radiogroup" aria-labelledby="pdOptL' + oi + '" data-sample>' +
        o.values.map(function (v, vi) { return '<label><input type="radio" name="pdOpt' + oi + '" value="' + vi + '"' + (V.opt[oi] === vi ? ' checked' : '') + '><span>' + esc(v) + '</span></label>'; }).join('') + '</div></div>';
    }).join('');
    $('#pdOpts').addEventListener('change', function (e) { var m = /^pdOpt(\d+)$/.exec(e.target.name || ''); if (m) { V.opt[m[1]] = Number(e.target.value); update(); } });
  }

  // 색상
  function drawColors() {
    $('#pdColors').innerHTML = colors.map(function (c) {
      var on = V.rows.some(function (r) { return r.name === c.name; });
      return '<button type="button" class="fchip pd-color" data-color="' + esc(c.name) + '" aria-pressed="' + on + '"><span class="chip__sw" style="--c:' + c.hex + '"></span>' + esc(c.name) + '</button>';
    }).join('');
  }
  if (colors.length) {
    drawColors();
    $('#pdColors').addEventListener('click', function (e) {
      var b = e.target.closest('.pd-color'); if (!b) return;
      var name = b.getAttribute('data-color'), idx = -1;
      V.rows.forEach(function (r, i) { if (r.name === name) idx = i; });
      if (idx < 0) { V.rows.push(row(colorBy(name), {})); V.rows.forEach(function (r, i) { if (mq.matches) r.fold = i !== V.rows.length - 1 && sum(r.q) > 0; }); drawColors(); drawTable(); update(); focusRow(V.rows.length - 1, false); return; }
      if (sum(V.rows[idx].q) === 0) { V.rows.splice(idx, 1); drawColors(); drawTable(); update(); return; }
      // 수량이 있는 색: 빼지 않고 그 색의 수량 입력을 강조
      V.rows[idx].fold = false; drawTable(); focusRow(idx, true);
      S.toast(name + '은 수량이 있어 빼지 않았습니다.');
    });
  }
  function focusRow(i, flash) {
    var r = $$('.pd-qr', $('#pdQt'))[i]; if (!r) return;
    var y = r.getBoundingClientRect().top + window.pageYOffset - (mq.matches ? 120 : 200);
    window.scrollTo({ top: Math.max(0, y), behavior: behavior() });
    if (flash) { r.classList.remove('is-flash'); void r.offsetWidth; r.classList.add('is-flash'); }
    var inp = $('input', r); if (inp) setTimeout(function () { inp.focus({ preventScroll: true }); }, 300);
  }

  // 사이즈별 수량
  function sum(q) { var t = 0; for (var k in q) t += Number(q[k]) || 0; return t; }
  function brief(q) { return sizes.filter(function (s) { return q[s.l] > 0; }).map(function (s) { return s.l + ' ' + q[s.l]; }).join(' · '); }
  function sizeHead(s) { return esc(s.l) + (s.n ? '<small>' + s.n + '</small>' : ''); }
  function drawTable() {
    var box = $('#pdQt');
    $('#pdNoColor').hidden = !(colors.length && !V.rows.length);
    if (textMode) { box.hidden = true; $('#pdTxt').hidden = false; stepEl.qty.classList.add('pd-step--txt'); $('#pdQtySub').textContent = '사이즈와 벌 수를 글로 적습니다'; return; }
    box.hidden = !V.rows.length;
    var n = sizes.length, one = !colors.length;
    box.classList.toggle('pd-qt--one', one);
    if (sampleSizes) box.setAttribute('data-sample', ''); else box.removeAttribute('data-sample');
    var rows = V.rows.map(function (r, i) {
      var label = one ? '수량' : r.name, sub = sum(r.q);
      var cells = sizes.map(function (s) {
        var v = r.q[s.l] || '', lab = (one ? '' : r.name + ' ') + s.l;
        return '<div class="pd-qc"><span class="pd-qc__l" aria-hidden="true">' + sizeHead(s) + '</span><span class="qty pd-q' + (v ? ' is-fill' : '') + '">' +
          '<button type="button" data-q="-1" aria-label="' + esc(lab) + ' 한 벌 빼기"><i class="i i-minus i--16" aria-hidden="true"></i></button>' +
          '<input type="number" min="0" max="9999" inputmode="numeric" placeholder="0" value="' + v + '" data-r="' + i + '" data-s="' + esc(s.l) + '" aria-label="' + esc(lab) + ' 수량(벌)">' +
          '<button type="button" data-q="1" aria-label="' + esc(lab) + ' 한 벌 더하기"><i class="i i-plus i--16" aria-hidden="true"></i></button></span></div>';
      }).join('');
      return '<div class="pd-qr' + (r.fold ? ' is-fold' : '') + '" role="group" aria-label="' + esc(label) + ' 사이즈별 수량"' + (one ? ' data-el="L215"' : '') + '>' +
        (one ? '<p class="pd-qr__c"><b>' + (n === 1 ? '수량' : '사이즈별 수량') + '</b></p>'
          : '<button type="button" class="pd-qr__c" data-fold="' + i + '" aria-expanded="' + !r.fold + '"><span class="chip__sw" style="--c:' + r.hex + '"></span><b>' + esc(r.name) + '</b><span class="pd-qr__brief num">' + esc(brief(r.q) || '수량을 넣어 주세요') + '</span><i class="i i-chev-d i--16" aria-hidden="true"></i></button>') +
        '<div class="pd-qr__cells">' + cells + '</div>' +
        '<p class="pd-qr__sum"><b class="num" data-sub="' + i + '">' + sub + '</b>벌</p>' +
        (one ? '<span></span>' : '<button type="button" class="pd-qr__x" data-del="' + i + '" aria-label="' + esc(r.name) + ' 빼기"><i class="i i-x i--18" aria-hidden="true"></i></button>') + '</div>';
    }).join('');
    // 색상이 둘 이상이면 묶음 아래에 사이즈별 합계 한 줄(수량이 있는 사이즈만)
    var foot = V.rows.length > 1 ? '<div class="pd-qt__foot"><span class="pd-qt__fl">사이즈별 합계</span><span class="pd-qt__fs">' +
      sizes.map(function (s) { return '<span data-tot-i="' + esc(s.l) + '">' + esc(s.l) + '<b class="num" data-tot="' + esc(s.l) + '"></b></span>'; }).join('') + '</span><b class="num pd-qt__fa" data-tot="all"></b></div>' : '';
    box.innerHTML = rows + foot;
    paintTotals();
  }
  function paintTotals() {
    var box = $('#pdQt');
    V.rows.forEach(function (r, i) { var e = $('[data-sub="' + i + '"]', box); if (e) e.textContent = sum(r.q); var b = $$('.pd-qr__brief', box)[i]; if (b) b.textContent = brief(r.q) || '수량을 넣어 주세요'; });
    sizes.forEach(function (s) {
      var e = $('[data-tot="' + s.l + '"]', box); if (!e) return;
      var t = V.rows.reduce(function (a, r) { return a + (Number(r.q[s.l]) || 0); }, 0);
      e.textContent = t; $('[data-tot-i="' + s.l + '"]', box).hidden = !t;
    });
    var a = $('[data-tot="all"]', box); if (a) a.textContent = '합계 ' + num(total()) + '벌';
  }
  var box = $('#pdQt');
  box.addEventListener('input', function (e) {
    var t = e.target; if (!t.matches('input[data-r]')) return;
    var v = String(t.value).replace(/\D/g, '').slice(0, 4);
    if (t.value !== v && v !== '') t.value = v;
    var r = V.rows[Number(t.getAttribute('data-r'))]; if (!r) return;
    r.q[t.getAttribute('data-s')] = Number(v) || 0;
    t.parentNode.classList.toggle('is-fill', Number(v) > 0);
    paintTotals(); update();
  });
  box.addEventListener('change', function (e) { var t = e.target; if (t.matches('input[data-r]') && (t.value === '' || t.value === '0')) { t.value = ''; t.parentNode.classList.remove('is-fill'); } });   // 비우면 0
  box.addEventListener('click', function (e) {
    var d = e.target.closest('[data-del]');
    if (d) { V.rows.splice(Number(d.getAttribute('data-del')), 1); drawColors(); drawTable(); update(); S.toast('색상을 뺐습니다.'); return; }
    var f = e.target.closest('[data-fold]');
    if (f) {
      var i = Number(f.getAttribute('data-fold'));
      if (mq.matches) { V.rows[i].fold = !V.rows[i].fold; var rr = f.closest('.pd-qr'); rr.classList.toggle('is-fold', V.rows[i].fold); f.setAttribute('aria-expanded', String(!V.rows[i].fold)); }
      else { var inp = $('input', f.closest('.pd-qr')); if (inp) inp.focus(); }
    }
  });
  // 글로 적기: “벌” 앞의 숫자를 더한다
  function parseText(t) { var s = 0, re = /(\d{1,4})\s*벌/g, m; while ((m = re.exec(t))) s += Number(m[1]); return s; }
  var txt = $('#pdTxtIn');
  txt.value = V.text; $('#pdTxtN').textContent = num(V.text.length);
  txt.addEventListener('input', function () { V.text = txt.value; update(); });
  function total() { return textMode ? parseText(V.text) : V.rows.reduce(function (a, r) { return a + sum(r.q); }, 0); }

  // 포장
  if (!isBrand) {
    if (!packs.length) { $('#pdPacks').hidden = true; $('#pdPackNone').hidden = false; }
    $$('input[name=pdPack]').forEach(function (i) { i.checked = Number(i.value) === V.pack; });
    $('#pdPacks').addEventListener('change', function (e) { V.pack = Number(e.target.value); update(); });
  }

  // 인쇄
  if (isBrand) { $('#pdPr0').textContent = '상품 그대로'; $('#pdPr1').textContent = '담당자와 상담 후 결정'; }
  if (!printable) { $('#pdPrints').hidden = true; $('#pdPrintNo').hidden = false; }
  $$('input[name=pdPrint]').forEach(function (i) { i.checked = Number(i.value) === V.print; });
  $('#pdPrints').addEventListener('change', function (e) { V.print = Number(e.target.value); paintPrint(); update(); });
  if (methods.length) {
    $('#pdMethods').innerHTML = methods.map(function (m, i) { return '<label><input type="radio" name="pdMethod" value="' + i + '"' + (V.method === i ? ' checked' : '') + '><span>' + esc(m) + '</span></label>'; }).join('');
    $('#pdMethods').setAttribute('data-sample', '');
    $('#pdMethods').addEventListener('change', function (e) { V.method = Number(e.target.value); update(); });
  } else { $('#pdMethods').hidden = true; $('#pdMethodNone').hidden = false; }
  if (parts.length) {
    var guideImgs = [p.imgs[0], p.imgs[1] || p.imgs[0]];
    $('#pdGuide').innerHTML = [0, 1].map(function (side) {
      return '<figure class="pd-guide__f"><img src="' + guideImgs[side] + '" alt="' + esc(p.name) + (side ? ' 뒤' : ' 앞') + ' 인쇄 부분 안내" width="600" height="600" loading="lazy" decoding="async">' +
        parts.map(function (pt, i) { return pt[1] === side ? '<span class="pd-mk num" data-mk="' + esc(pt[0]) + '" style="left:' + pt[2] + '%;top:' + pt[3] + '%" aria-hidden="true">' + (i + 1) + '</span>' : ''; }).join('') +
        '<figcaption>' + (side ? '뒤' : '앞') + '</figcaption></figure>';
    }).join('');
    $('#pdParts').innerHTML = parts.map(function (pt, i) { return '<button type="button" class="fchip pd-part" data-part="' + esc(pt[0]) + '" aria-pressed="false"><b class="num">' + (i + 1) + '</b>' + esc(pt[0]) + '</button>'; }).join('');
    $('#pdParts').setAttribute('data-sample', '');
    $('#pdParts').addEventListener('click', function (e) {
      var b = e.target.closest('.pd-part'); if (!b) return;
      var n = b.getAttribute('data-part'), i = V.parts.indexOf(n);
      if (i < 0) V.parts.push(n); else V.parts.splice(i, 1);
      paintParts(); update();
    });
  } else { $('#pdGuideBox').hidden = true; $('#pdPartNone').hidden = false; }
  function paintParts() {
    $$('.pd-part').forEach(function (b) { b.setAttribute('aria-pressed', String(V.parts.indexOf(b.getAttribute('data-part')) >= 0)); });
    $$('.pd-mk').forEach(function (m) { m.classList.toggle('is-on', V.parts.indexOf(m.getAttribute('data-mk')) >= 0); });
  }
  paintParts();
  var desc = $('#pdDesc'); desc.value = V.desc; $('#pdDescN').textContent = num(V.desc.length);
  desc.addEventListener('input', function () { V.desc = desc.value; });
  function paintPrint() {
    var on = printable && V.print === 1;
    $('#pdPrint').hidden = !(on && !isBrand);
    $('#pdPrintTalk').hidden = !(on && isBrand);
  }
  // 인쇄 파일(공용 첨부 부품): 상태에 따라 견본 파일을 넣고 붙인다
  var upl = null;
  (function () {
    var tpl = $('#pdUplTpl'); if (!tpl) return;
    var holder = $('#pdUpl'); holder.appendChild(tpl.content.cloneNode(true));
    upl = $('.upl', holder);
    var withFiles = has('print') || has('upl-err') || has('restored') || fromKeep;
    if (withFiles && SAMPLE_FILES.length) upl.setAttribute('data-files', JSON.stringify(SAMPLE_FILES));
    S.initUpl(upl);
    if (has('upl-err')) {
      var errs = [['도면_원본.psd', '파일 하나는 10MB까지 첨부할 수 있습니다. (14.2MB)', 'L248'], ['로고_시안.ai', '같은 파일이 이미 첨부되어 있습니다.', 'L249']];
      holder.insertAdjacentHTML('beforeend', '<ul class="pd-uerr" role="alert">' + errs.map(function (x) { return '<li data-el="' + x[2] + '"><i class="i i-alert i--16" aria-hidden="true"></i><span><b>' + esc(x[0]) + '</b> 첨부하지 못했습니다. ' + esc(x[1]) + '</span></li>'; }).join('') + '<li><span class="pd-uerr__h">파일 하나는 10MB, 모두 합쳐 100MB까지 첨부할 수 있습니다. 큰 파일은 크기를 줄이거나 ZIP으로 압축해 다시 첨부해 주세요.</span></li></ul>');
      setTimeout(function () { S.toast('첨부하지 못한 파일이 2개 있습니다.', { error: true, ms: 60000 }); }, 300);
    }
    if (restoredMissing.length) {
      var fld = $('#pdFileFld'); fld.classList.add('is-err', 'pd-hl'); fld.setAttribute('data-el', 'L225 L252');
      var m = $('.fld__msg--err', fld); m.textContent = '첨부 파일 ' + (restoredMissing.length + SAMPLE_FILES.length) + '개 중 ' + restoredMissing.length + '개(' + restoredMissing.join(', ') + ')를 되살리지 못했습니다. 다시 첨부해 주세요.';
    }
  })();

  /* ---------- 5. 계산 · 진행 정도 · 요약 ---------- */
  var TIERS = [[1, 0], [10, 5], [30, 10], [50, 15]];
  function rateOf(n) { var r = 0; TIERS.forEach(function (t) { if (n >= t[0] && n > 0) r = t[1]; }); return r; }
  function stepDone(k) {
    if (k === 'opt') return options.every(function (o, i) { return V.opt[i] != null; });
    if (k === 'color') return V.rows.length > 0;
    if (k === 'qty') return textMode ? parseText(V.text) > 0 : V.rows.length > 0 && V.rows.every(function (r) { return sum(r.q) > 0; });
    if (k === 'pack') return !packs.length || V.pack >= 0;
    if (k === 'print') return !printable || V.print === 0 || isBrand || ((!methods.length || V.method >= 0) && (!parts.length || V.parts.length > 0));
    return true;
  }
  var NAMES = { opt: '옵션', color: '색상', qty: '사이즈별 수량', pack: '포장 방식', print: '인쇄' };
  function stepValue(k) {
    if (k === 'opt') return options.map(function (o, i) { return V.opt[i] != null ? o.values[V.opt[i]] : null; }).filter(Boolean).join(' · ') || '고르세요';
    if (k === 'color') return V.rows.length ? V.rows[0].name + (V.rows.length > 1 ? ' 외 ' + (V.rows.length - 1) + '색' : '') : '고르세요';
    if (k === 'qty') { var t = total(); return t ? num(t) + '벌' : '입력하세요'; }
    if (k === 'pack') return !packs.length ? '없음' : V.pack >= 0 ? packs[V.pack] : '고르세요';
    if (k === 'print') return !printable ? '인쇄할 수 없음' : V.print === 1 ? (isBrand ? '인쇄 있음 · 상담' : '인쇄 있음' + (V.method >= 0 ? ' · ' + methods[V.method] : '')) : '인쇄 없음';
  }
  var tried = has('need') || has('nocolor');
  function update() {
    var done = 0;
    order.forEach(function (k) { var ok = stepDone(k); if (ok) done++; stepEl[k].classList.toggle('is-done', ok); $('.pd-step__v', stepEl[k]).textContent = stepValue(k); stepEl[k].classList.toggle('is-set', ok); });
    var all = order.length, pct = Math.round(done / all * 100) + '%';
    $('#pdDone').textContent = done; $('#pdAll').textContent = all; $('#pdProgBar').style.width = pct;
    var t = total(), rate = price ? rateOf(t) : 0, orig = t * price, amt = orig * (100 - rate) / 100;
    $('#pdTotal').textContent = num(t);
    if (textMode) $('#pdTxtSum').textContent = num(t);
    if (price) {
      $('#pdRate').textContent = rate ? rate + '%' : '없음'; $('#pdRate').classList.toggle('is-none', !rate);
      $('#pdOrig').hidden = !rate; $('#pdOrig').textContent = won(orig);
      $('#pdAmt').textContent = won(amt);
    } else {
      $('#pdRateBox').hidden = true; $('#pdOrig').hidden = true; $('#pdAmt').textContent = '견적문의';
    }
    // 할인 구간
    var tier = $('#pdTier'), next = $('#pdNext');
    if (price) {
      tier.innerHTML = TIERS.map(function (x, i) {
        var hi = TIERS[i + 1] ? (TIERS[i + 1][0] - 1) + '벌' : '', on = t > 0 && t >= x[0] && (!TIERS[i + 1] || t < TIERS[i + 1][0]);
        return '<li' + (on ? ' class="is-on" aria-current="true"' : '') + '><b class="num">' + x[0] + '벌' + (hi ? '~' + hi : ' 이상') + '</b><em>' + (x[1] ? x[1] + '% 할인' : '기본가') + '</em><span class="num">' + won(price * (100 - x[1]) / 100) + '</span></li>';
      }).join('');
      var nx = TIERS.filter(function (x) { return x[0] > t && x[1] > 0; })[0];
      next.innerHTML = !t ? '수량을 넣으면 할인과 총액이 바로 계산됩니다. 1벌 단가 기준입니다.' : nx ? '<b class="num">' + (nx[0] - t) + '벌</b> 더 담으면 <b class="num">' + nx[1] + '%</b> 할인됩니다.' : '가장 높은 할인(<b class="num">15%</b>)이 적용되었습니다.';
    } else {
      tier.hidden = true;
      next.textContent = isBrand ? '판매가가 없는 상품입니다. 견적문의를 보내면 담당자가 수량을 보고 견적을 드립니다.' : '판매가가 정해지지 않은 상품입니다. 주문하면 담당자가 수량을 보고 금액을 안내합니다.';
    }
    var left = order.filter(function (k) { return !stepDone(k); }).map(function (k) { return NAMES[k]; });
    $('#pdLeft').innerHTML = left.length ? '남은 단계: <b>' + left.join(', ') + '</b>' : '<i class="i i-check i--16" aria-hidden="true"></i>필요한 내용을 모두 골랐습니다.';
    $('#pdLeft').classList.toggle('is-ok', !left.length);
    // 따라오는 바
    if (bar) {
      $('#pdBarDone').textContent = done; $('#pdBarAll').textContent = all; $('#pdBarProgBar').style.width = pct;
      $('#pdBarTotal').textContent = num(t);
      $('#pdBarRate').textContent = price && rate ? rate + '% 할인' : '';
      $('#pdBarAmt').textContent = price ? won(amt) : '견적문의';
    }
    if (tried) check(false);
  }

  /* ---------- 6. 필수 확인 ---------- */
  function setErr(el, msg) { if (!el) return; el.classList.toggle('is-err', !!msg); var m = $(':scope > .pd-err span', el); if (m) m.textContent = msg || ''; }
  function check(scroll) {
    var errs = [];
    function add(el, msg) { errs.push([el, msg]); }
    options.forEach(function (o, i) { if (V.opt[i] == null) add(stepEl.opt, o.name + ' 옵션을 골라 주세요.'); });
    if (colors.length && !V.rows.length) add(stepEl.color, '색상을 먼저 골라 주세요.');
    if (textMode) {
      if (!V.text.trim()) add(stepEl.qty, '필요한 사이즈와 벌 수를 적어 주세요. 예) 95 4벌, 100 6벌');
      else if (!parseText(V.text)) add(stepEl.qty, '벌 수를 찾지 못했습니다. 사이즈마다 숫자 뒤에 “벌”을 붙여 적어 주세요. 예) 95 4벌, 100 6벌');
    }
    else if (V.rows.length) {
      var zero = V.rows.filter(function (r) { return !sum(r.q); });
      if (zero.length) add(stepEl.qty, colors.length && V.rows.length > 1 ? zero.map(function (r) { return r.name; }).join(', ') + '의 사이즈별 수량을 입력하거나 색상을 빼 주세요.' : '사이즈별 수량을 1벌 이상 입력해 주세요.');
    }
    if (!isBrand && packs.length && V.pack < 0) add(stepEl.pack, '포장 방식을 골라 주세요.');
    var mEl = $('[data-sub="method"]'), pEl = $('[data-sub="parts"]');
    var needPrint = printable && V.print === 1 && !isBrand;
    if (needPrint && methods.length && V.method < 0) add(mEl, '인쇄방법을 골라 주세요.');
    if (needPrint && parts.length && !V.parts.length) add(pEl, '인쇄 부분을 하나 이상 골라 주세요.');
    [stepEl.opt, stepEl.color, stepEl.qty, stepEl.pack, mEl, pEl].forEach(function (el) { var e = errs.filter(function (x) { return x[0] === el; })[0]; setErr(el, e ? e[1] : ''); });
    if (textMode) {   // 글로 적기: 안내를 단계 끝이 아니라 입력칸 바로 아래에 붙이고 입력칸 테두리도 오류로
      var qe = errs.filter(function (x) { return x[0] === stepEl.qty; })[0];
      $('#pdTxt').classList.toggle('is-err', !!qe); $('#pdTxtErr').textContent = qe ? qe[1] : '';
    }
    var sumEl = $('#pdErrSum');
    sumEl.hidden = !errs.length; $('span', sumEl).textContent = errs.length ? '필수 항목 ' + errs.length + '개를 확인해 주세요.' : '';
    if (errs.length && scroll) {
      var y = errs[0][0].getBoundingClientRect().top + window.pageYOffset - (mq.matches ? 120 : 180);
      window.scrollTo({ top: Math.max(0, y), behavior: behavior() });
      var f = $('input, button, textarea', errs[0][0]); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 320);
    }
    return !errs.length;
  }

  /* ---------- 7. 장바구니 · 주문 ---------- */
  var ACT_LABEL = isBrand ? '견적문의' : '주문하기';
  $('span', $('#pdOrder')).textContent = ACT_LABEL;
  if (bar) $('.pd-bar__order span', bar).textContent = ACT_LABEL;
  function keep() {
    var files = (upl && upl._files || []).map(function (f) { return { name: f.name, size: f.size, sample: !!f.sample, src: f.src || '' }; });
    try { localStorage.setItem(KEEP, JSON.stringify({ t: Date.now(), key: p.key, v: V, files: files })); } catch (e) {}
  }
  function busy(on) {
    $$('[data-act="order"]').forEach(function (b) { b.classList.toggle('is-busy', on); if (on) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy'); $('span', b).textContent = on ? '요청하는 중' : ACT_LABEL; });
    $$('[data-act="cart"]').forEach(function (b) { b.disabled = on; });
    $('#pdBusyMsg').hidden = !on; $('#pdForm').classList.toggle('is-busy', on);
    $('#pdBusyT').textContent = (isBrand ? '견적문의를 보내는 중입니다.' : (colors.length && V.rows.length > 1 ? '고른 색상마다 장바구니에 담고 주문을 요청하는 중입니다.' : '장바구니에 담고 주문을 요청하는 중입니다.')) + ' 화면을 닫지 말고 기다려 주세요.';
  }
  function lines() {
    if (textMode) return [{ name: '사이즈별 수량(글)', n: parseText(V.text), b: V.text.replace(/\s+/g, ' ').slice(0, 60) }];
    return V.rows.map(function (r) { return { hex: r.hex, name: r.name || '수량', n: sum(r.q), b: brief(r.q) }; });
  }
  function fillAdded() {
    var ls = lines(), t = total();
    var extra = [isBrand ? '' : (packs.length ? packs[V.pack] || '' : ''), stepValue('print')].filter(Boolean).join(' · ');
    $('#pdAddedBody').innerHTML = '<div class="pd-added__p"><img src="' + (imgs[0] || p.imgs[0]) + '" alt="" width="120" height="120"><div><p class="pd-added__n">' + esc(p.name) + '</p><p class="pd-added__m">' + esc(extra) + '</p></div></div>' +
      '<ul class="pd-added__l">' + ls.map(function (l) { return '<li>' + (l.hex ? '<span class="chip__sw" style="--c:' + l.hex + '"></span>' : '') + '<b>' + esc(l.name) + '</b><span class="num">' + esc(l.b) + '</span><em class="num">' + num(l.n) + '벌</em></li>'; }).join('') + '</ul>' +
      '<p class="pd-added__s">' + (ls.length > 1 ? '색상마다 한 건씩 <b class="num">' + ls.length + '건</b>, ' : '') + '모두 <b class="num">' + num(t) + '벌</b>을 담았습니다. 장바구니로 이동해 견적·시안을 요청할 수 있습니다.</p>';
    var c = $$('[data-cart-count]'), n = (S.member.cart || 0) + ls.length;
    c.forEach(function (e) { e.textContent = n; var a = e.closest('a'); if (a) a.setAttribute('aria-label', '장바구니 ' + n + '건'); });
  }
  function failText(kind) { return kind === 'cart' ? '장바구니에 담지 못했습니다.' : isBrand ? '견적문의를 보내지 못했습니다.' : '주문을 요청하지 못했습니다.'; }
  function showFail(kind) { $('#pdFailT').textContent = failText(kind); $('#pdFail').hidden = false; }
  function act(kind) {
    tried = true;
    if (!check(true)) { S.toast('필수 항목을 확인해 주세요.', { error: true }); return; }
    if (S.auth !== 'member') { keep(); S.pop('pdLogin'); return; }
    $('#pdFail').hidden = true;
    if (kind === 'order') busy(true); else $$('[data-act="cart"]').forEach(function (b) { b.classList.add('is-busy'); });
    setTimeout(function () {
      if (has('fail')) { busy(false); $$('[data-act="cart"]').forEach(function (b) { b.classList.remove('is-busy'); }); showFail(kind); S.toast(failText(kind) + ' 잠시 후 다시 시도해 주세요.', { error: true }); return; }
      if (kind === 'cart') { $$('[data-act="cart"]').forEach(function (b) { b.classList.remove('is-busy'); }); fillAdded(); S.pop('pdAdded'); return; }
      location.href = 'mypage.html?section=orders';
    }, 900);
  }
  $$('[data-act]').forEach(function (b) { b.addEventListener('click', function () { act(b.getAttribute('data-act')); }); });
  $('#pdLoginGo').href = 'login.html?return=' + encodeURIComponent('product.html?' + (isBrand ? 'id=' + id + '&brand=' + p.brand : 'id=' + id) + '&restore=1');
  // 관심상품: 비로그인이면 고른 값을 보관하고(sub.js 가 로그인 안내를 띄운다)
  $('#pdLike').addEventListener('click', function () { if (S.auth !== 'member') keep(); }, true);

  /* ---------- 8. 상세 정보 ---------- */
  var info = $('#pdInfo');
  if (has('noinfo')) {
    info.innerHTML = '<div class="pd-nil" data-el="L253"><i class="i i-info i--18" aria-hidden="true"></i><p><b>상품정보가 아직 등록되지 않았습니다.</b> 소재·사이즈가 궁금하면 <a class="tl" href="tel:050713786094">0507-1378-6094</a>나 카카오톡으로 물어 주세요.</p></div>';
    $('#pdShip').hidden = true; $('#pdShipNone').hidden = false;
    $('#pdReturn').hidden = true; $('#pdReturnNone').hidden = false;
  } else {
    var photos = (p.gallery || p.imgs).slice(0, 4);
    var rows = [['상품명', p.name]];
    if (isBrand) rows.push(['브랜드', p.brandKo + ' (' + p.cat + ')'], ['형태', p.kind + ' · ' + p.form], ['사이즈', sampleSizes ? sizes.map(function (s) { return s.l; }).join(' · ') : '등록된 사이즈가 없습니다. 필요한 사이즈를 적어 주세요.'], ['색상', '사진의 색상 기준. 다른 색상은 견적문의로 확인합니다.'], ['가격', '견적문의'], ['인쇄', '담당자와 상담 후 결정']);
    else {
      rows.push(['분류', '단체복 · ' + p.cat + (p.sub ? ' · ' + p.sub : '')]);
      if (p.material) rows.push(['소재', p.material, 1]);
      if (p.season) rows.push(['시즌', p.season, 1]);
      rows.push(['사이즈', sizes.map(function (s) { return s.l + (s.n ? '(' + s.n + ')' : ''); }).join(' · ')]);
      rows.push(['색상', colors.length ? colors.map(function (c) { return c.name; }).join(' · ') : '고를 수 있는 색상 없음(사진의 색상)']);
      rows.push(['포장', packs.length ? packs.join(' · ') : '고를 수 있는 포장 방식 없음']);
      rows.push(['인쇄', !printable ? '인쇄할 수 없는 상품' : methods.length ? methods.join(' · ') : '상담 후 결정', methods.length ? 1 : 0]);
    }
    info.innerHTML = '<div class="pd-info">' +
      '<div class="pd-info__ph' + (photos.length > 2 ? ' pd-info__ph--more' : '') + '" data-slot="product-info-' + p.id + '">' + photos.map(function (s, i) { var bp = /brandp/.test(s); return '<img src="' + s + '" alt="' + esc(p.name) + ' 상세 사진 ' + (i + 1) + '" width="' + (bp ? 900 : 800) + '" height="' + (bp ? 600 : 800) + '" loading="lazy" decoding="async"' + (bp ? ' class="is-wide"' : '') + '>'; }).join('') +
      (photos.length > 2 ? '<button type="button" class="sb sb--gray sb--m sb--block pd-info__more" aria-expanded="false">사진 더 보기</button>' : '') + '</div>' +
      '<dl class="dl pd-dl">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' data-sample' : '') + '>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>';
    var more = $('.pd-info__more', info);
    more && more.addEventListener('click', function () { var ph = more.parentNode, on = ph.classList.toggle('is-open'); more.setAttribute('aria-expanded', String(on)); more.textContent = on ? '사진 접기' : '사진 더 보기'; });
  }
  // 부분으로 이동 · 지금 보고 있는 부분 표시
  // PC: 네 부분을 모두 펼치고 이동 줄은 스크롤 위치를 따라간다. 폰: 길이를 줄이려고 고른 부분 하나만 보인다(이동 줄 = 탭)
  var secs = ['pd-info', 'pd-ship', 'pd-return', 'pd-note'].map(function (x) { return document.getElementById(x); });
  var tabsBar = $('#pdTabs'), tabs = $$('#pdTabs a'), detail = $('#pdDetail');
  var curSec = Math.max(0, secs.map(function (s) { return '#' + s.id; }).indexOf(location.hash));
  function markTab(i) { tabs.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  function showSec(i) {
    curSec = i; secs.forEach(function (s, k) { s.classList.toggle('is-cur', k === i); }); markTab(i);
    var a = tabs[i]; if (a && tabsBar.scrollWidth > tabsBar.clientWidth) tabsBar.scrollTo({ left: a.offsetLeft - 24, behavior: behavior() });
  }
  function tabMode() { detail.classList.toggle('pd-detail--tabs', mq.matches); if (mq.matches) showSec(curSec); else spy(); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-go-sec]'); if (!a) return;
    var id = a.getAttribute('href').slice(1), i = secs.map(function (s) { return s.id; }).indexOf(id); if (i < 0) return;
    e.preventDefault();
    if (mq.matches) { showSec(i); var y = detail.getBoundingClientRect().top + window.pageYOffset - 70; if (a.closest('#pdTabs') && detail.getBoundingClientRect().top > 0) y = window.pageYOffset; window.scrollTo({ top: Math.max(0, y), behavior: behavior() }); }
    else secs[i].scrollIntoView({ behavior: behavior(), block: 'start' });
    history.replaceState(null, '', location.pathname + location.search + '#' + id);
  });
  function spy() {
    var top = tabsBar.getBoundingClientRect().top, stickTop = parseFloat(getComputedStyle(tabsBar).top) || 0;
    tabsBar.classList.toggle('pd-tabs--stuck', top <= stickTop + 1 && detail.getBoundingClientRect().bottom > top + 80);
    if (mq.matches) return;
    var line = 180, now = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top - line <= 0) now = i; });
    markTab(now);
  }
  window.addEventListener('scroll', spy, { passive: true });
  mq.addEventListener ? mq.addEventListener('change', tabMode) : mq.addListener(tabMode);
  tabMode(); spy();

  /* ---------- 9. 따라오는 바 · 공통 상담 바 ---------- */
  if (bar) {
    $('#pdBarImg').src = imgs[0] || p.imgs[0]; $('#pdBarName').textContent = p.name;
    var sumBox = $('#pdSum');
    var setBar = function (on) {
      bar.classList.toggle('is-on', on); root.classList.toggle('pd-bar-on', on); bar.setAttribute('aria-hidden', String(!on)); $$('a, button', bar).forEach(function (x) { x.tabIndex = on ? 0 : -1; });
      // 바가 뜨면 우측 플로팅의 상담·카카오 원이 감춰지므로(CSS) 열려 있던 상담 메뉴도 닫는다
      var qp = $('#qp'), qb = $('#qpBtn');
      if (on && qp && !qp.hidden) { qp.hidden = true; if (qb) { qb.setAttribute('aria-expanded', 'false'); qb.setAttribute('aria-label', '상담 메뉴 열기'); } }
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { setBar(!es[0].isIntersecting); }, { rootMargin: '0px 0px -40px 0px' }).observe(sumBox);
    setBar(false);
  }
  // 폰에서는 이 페이지의 바가 전화·카카오톡을 맡으므로 공통 상담 바(.mbar)를 감춘다
  function nocs() { if (mq.matches) body.setAttribute('data-nocs', ''); else body.removeAttribute('data-nocs'); }
  nocs(); mq.addEventListener ? mq.addEventListener('change', nocs) : mq.addListener(nocs);

  /* ---------- 10. 처음 그리기 · 상태 ---------- */
  drawTable(); paintPrint(); update();
  if (has('need') || has('nocolor')) check(false);
  if (has('busy')) busy(true);
  if (has('fail')) { showFail('order'); setTimeout(function () { S.toast(failText('order') + ' 잠시 후 다시 시도해 주세요.', { error: true, ms: 60000 }); }, 300); }
  if (has('cart-done')) fillAdded();
  if (has('restored') || restoredMissing.length) setTimeout(function () { var f = $('#pdFileFld'); var y = f.getBoundingClientRect().top + window.pageYOffset - (mq.matches ? 120 : 180); window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }); }, 200);
})();
