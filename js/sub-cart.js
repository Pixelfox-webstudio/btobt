/* 비투비티 하위 페이지 · sub-cart.js (2026-11-17)
   장바구니(cart) · 주문서 작성(order) · 주문 정보 입력 후 접수(order-now) 화면 안 조작.
   서버 연결은 없다. 상태 보기(?state=)는 js/sub.js 가 맡고, 이 파일은 고르기·수량·금액 계산·선택지에 따른 입력칸 전환·이동만 붙인다. */
(function () {
  'use strict';
  var SUB = window.SUB; if (!SUB) return;
  var $ = SUB.$, $$ = SUB.$$, body = document.body, page = body.getAttribute('data-page');
  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function num(v) { return parseInt(String(v == null ? '' : v).replace(/[^\d]/g, ''), 10) || 0; }
  function show(n, on) { if (n) n.hidden = !on; }
  function stOn(n, on) { if (n) n.classList.toggle('st-on', !!on); }   // data-st 로 감춘 안내를 실행 중에 켜고 끈다
  function busy(btns, on, label) {
    btns.forEach(function (b) {
      if (!b) return;
      b.classList.toggle('is-busy', on); if (on) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy');
      if (label) { var s = b.querySelector('span') || b; if (!b._label) b._label = s.textContent; s.textContent = on ? label : b._label; }
    });
  }
  // 확인 창: 취소하면 onCancel
  function ask(o) {
    var done = false;
    SUB.confirm({ title: o.title, desc: o.desc, ok: o.ok, tone: o.tone, icon: o.icon, onOk: function () { done = true; o.onOk && o.onOk(); } });
    var pops = $$('.pop--c'), p = pops[pops.length - 1];
    if (p) p.addEventListener('pop:close', function () { setTimeout(function () { if (!done && o.onCancel) o.onCancel(); }, 0); });
  }
  // 헤더의 장바구니 담긴 수(sub.js 가 넣은 표시)를 이 페이지 내용으로 바꾼다
  function setBadge(n, line) {
    $$('[data-cart-count]').forEach(function (b) {
      if (line) b.setAttribute('data-el', line);
      var a = b.parentNode;
      if (n > 0) { b.textContent = n; b.hidden = false; if (a) a.setAttribute('aria-label', '장바구니 ' + n + '건'); }
      else { b.hidden = true; if (a) a.setAttribute('aria-label', '장바구니'); }
    });
  }
  // 새로고침 단추
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-co-reload]')) location.reload(); });

  /* ================= 장바구니 ================= */
  function cart() {
    var wrap = $('#coCart'); if (!wrap) return;
    if (SUB.auth === 'guest') return;
    if (SUB.has('empty')) { setBadge(0, 'L295'); return; }
    body.setAttribute('data-nocs', ''); body.setAttribute('data-codock', '');   // 상품이 있을 때는 빠른 상담을 감추고 아래 요청 띠를 쓴다
    var items = $$('.co-item', wrap), all = $('#coAll'), delSel = $('#coDelSel'), touched = false;
    var go = $('#coGo'), dockGo = $('#coDockGo'), dock = $('#coDock');
    var noSel = $$('[data-co-msg="none"]');   // 요약 상자 안(769 이상) · 본문 맨 위(폰) 두 자리 중 화면에 맞는 한 곳만 보인다
    function box(it) { return $('.co-item__chk input', it); }
    function qtyOf(it) { return $$('.co-sz input', it).reduce(function (a, i) { return a + num(i.value); }, 0); }
    function chosen() { return items.filter(function (it) { return box(it).checked; }); }
    $$('.co-sz input', wrap).forEach(function (i) { i.setAttribute('data-v', i.value); });

    if (SUB.has('partial')) items.forEach(function (it) { box(it).checked = it.getAttribute('data-print') !== '1'; });
    if (SUB.has('none') || SUB.has('nodel')) items.forEach(function (it) { box(it).checked = false; });
    if (SUB.has('partial') || SUB.has('none') || SUB.has('nodel')) touched = true;

    function update() {
      var sel = chosen(), n = sel.length, q = 0, allQ = 0, print = false;
      items.forEach(function (it) {
        var tq = qtyOf(it), price = Number(it.getAttribute('data-price')), on = box(it).checked;
        allQ += tq;
        $$('[data-co="q"]', it).forEach(function (x) { x.textContent = tq.toLocaleString('ko-KR'); });
        if (price) $('[data-co="amt"]', it).textContent = won(price * tq);
        it.classList.toggle('co-item--off', !on);
        var li = $('#coSumList li[data-k="' + it.getAttribute('data-key') + '"]');
        if (li) { li.hidden = !on; $('[data-co="q"]', li).textContent = tq.toLocaleString('ko-KR') + '벌'; if (price) $('[data-co="amt"]', li).textContent = won(price * tq); }
        if (on) { q += tq; if (it.getAttribute('data-print') === '1') print = true; }
      });
      $$('#coSumList li').forEach(function (li) { if (!items.some(function (it) { return it.getAttribute('data-key') === li.getAttribute('data-k'); })) li.remove(); });
      show($('#coSumNone'), !n); show($('#coSumList'), !!n);
      $('#coSelN').textContent = n; $('#coSelQ').textContent = q.toLocaleString('ko-KR');
      $('#coDockN').textContent = n; $('#coDockQ').textContent = q.toLocaleString('ko-KR');
      all.checked = n > 0 && n === items.length; all.indeterminate = n > 0 && n < items.length;
      $('#coAllN').textContent = '(' + n + '/' + items.length + ')';
      delSel.classList.toggle('co-bar__del--off', !touched);
      var kind = print || !n ? '견적·시안 요청' : '견적 요청';
      if (!go.classList.contains('is-busy')) { $('span', go).textContent = (n ? n + '개 상품 ' : '') + kind; dockGo.textContent = kind; }
      var href = print ? 'order-complete.html' : 'order-complete.html?state=quote';
      go.setAttribute('href', href); dockGo.setAttribute('href', href);
      $('#coKind').textContent = print ? '인쇄 상품이 있어 시안 확인을 겸한 주문 요청으로 접수합니다.' : '인쇄 상품이 없어 견적 요청으로 접수합니다.';
      show($('#coKind'), n > 0);
      $$('[data-co="n"]').forEach(function (x) { x.textContent = items.length; });
      $$('.co-head [data-co="q"]').forEach(function (x) { x.textContent = allQ.toLocaleString('ko-KR'); });
      if (n) noSel.forEach(function (m) { stOn(m, false); });
      setBadge(items.length, 'L295');
    }
    function toEmpty() {
      wrap.hidden = true; dock.hidden = true; show($('#coHeadCnt'), false);
      stOn($('#coEmpty'), true);
      body.removeAttribute('data-nocs'); body.removeAttribute('data-codock');   // 빈 장바구니에서는 빠른 상담을 다시 보여 준다
      setBadge(0, 'L295');
    }
    function remove(list, msg) {
      list.forEach(function (it) { it.remove(); });
      items = items.filter(function (it) { return list.indexOf(it) < 0; });
      SUB.toast(msg);
      if (!items.length) toEmpty(); else update();
    }

    wrap.addEventListener('change', function (e) {
      var t = e.target;
      if (t === all) { items.forEach(function (it) { box(it).checked = all.checked; }); touched = true; update(); return; }
      if (t.closest('.co-item__chk')) { touched = true; update(); return; }
      if (t.closest('.co-sz')) {
        var it = t.closest('.co-item');
        if (qtyOf(it) > 0) { $$('.co-sz input', it).forEach(function (i) { i.setAttribute('data-v', i.value); }); update(); return; }
        if (it._asking) return; it._asking = true;
        var name = $('.co-item__n button', it).textContent;
        ask({ title: '수량이 모두 0입니다. 이 상품을 삭제할까요?', desc: name + '을(를) 장바구니에서 삭제합니다.' + (it.getAttribute('data-print') === '1' ? ' 첨부한 인쇄 파일도 함께 삭제됩니다.' : ''), ok: '삭제',
          onOk: function () { it._asking = false; remove([it], '상품을 삭제했습니다.'); },
          onCancel: function () { it._asking = false; $$('.co-sz input', it).forEach(function (i) { i.value = i.getAttribute('data-v'); }); update(); } });
      }
    });
    wrap.addEventListener('input', function (e) { if (e.target.closest('.co-sz')) update(); });
    wrap.addEventListener('click', function (e) {
      var d = e.target.closest('[data-co-del]');
      if (d) {
        var it = d.closest('.co-item'), name = $('.co-item__n button', it).textContent;
        ask({ title: '이 상품을 삭제할까요?', desc: name + '을(를) 장바구니에서 삭제합니다.' + (it.getAttribute('data-print') === '1' ? ' 첨부한 인쇄 파일도 함께 삭제됩니다.' : ''), ok: '삭제', onOk: function () { remove([it], '상품을 삭제했습니다.'); } });
        return;
      }
      if (e.target.closest('#coDelSel')) {
        if (!touched) { SUB.toast('상품 선택을 한 번 바꾼 뒤에 선택 삭제를 쓸 수 있습니다.'); return; }
        var sel = chosen();
        if (!sel.length) { SUB.toast('삭제할 상품을 선택해 주세요.', { error: true }); return; }
        ask({ title: '선택한 ' + sel.length + '개 상품을 삭제할까요?', desc: '첨부한 인쇄 파일도 함께 삭제됩니다.', ok: '삭제', onOk: function () { remove(sel, sel.length + '개 상품을 삭제했습니다.'); } });
      }
    });
    function submit(e) {
      e.preventDefault();
      if (go.classList.contains('is-busy')) return;
      if (!chosen().length) { noSel.forEach(function (m) { stOn(m, true); }); SUB.toast('주문할 상품을 선택해 주세요.', { error: true }); return; }
      if (SUB.has('savefail')) { SUB.toast('주문 요청을 저장하지 못했습니다.', { error: true }); return; }
      var href = go.getAttribute('href');
      busy([go], true, '접수하는 중'); busy([dockGo], true, '접수하는 중');
      setTimeout(function () { location.href = href; }, 700);
    }
    go.addEventListener('click', submit); dockGo.addEventListener('click', submit);
    if (SUB.has('busy')) { busy([go], true, '접수하는 중'); busy([dockGo], true, '접수하는 중'); }
    update();
  }

  /* ================= 주문서 · 주문 정보 입력 공통 ================= */
  var BUYER = { name: '김민준', tel: '010-1234-5678', zip: '48058', addr: '부산광역시 해운대구 센텀중앙로 97', addr2: '5층' };
  var BASE = { name: '김민준', tel: '010-1234-5678', zip: '46744', addr: '부산광역시 강서구 녹산산업중로 333', addr2: '2동 자재창고' };
  var ZIP = { zip: '48058', addr: '부산광역시 해운대구 센텀중앙로 97' };   // 우편번호 검색은 외부 서비스라 견본 주소를 채운다
  function val(id, v) { var n = document.getElementById(id); if (n) { if (v === undefined) return n.value; n.value = v; } }
  function fillShip(o) {
    o = o || {};
    val('coSName', o.name || ''); val('coSTel', o.tel || ''); val('coSZip', o.zip || ''); val('coSAddr', o.addr || ''); val('coSAddr2', o.addr2 || '');
    $$('#coShipFlds .fld.is-err').forEach(function (f) { f.classList.remove('is-err'); });
  }
  // 오류 요약: 결제하기·접수를 누르면 틀린 칸의 문장을 위에 모으고, 고치면 바로 지운다
  function errSummary(form) {
    var box = $('#coErrs'); if (!box) return function () {};
    function draw(focus) {
      var bad = $$('.fld.is-err', form).filter(function (f) { return f.offsetParent !== null; });
      box.hidden = !bad.length; if (!bad.length) return;
      $('#coErrN').textContent = '(' + bad.length + '개)';
      $('#coErrList').innerHTML = bad.map(function (f, i) {
        var inp = $('input:not([type=hidden]), select, textarea', f), m = $('.fld__msg--err', f);
        if (inp && !inp.id) inp.id = 'coF' + i;
        return '<li><a href="#' + (inp ? inp.id : '') + '">' + SUB.esc(m ? m.textContent : '') + '</a></li>';
      }).join('');
      if (focus) box.focus({ preventScroll: true });
    }
    box.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return; e.preventDefault();
      var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 160, behavior: 'smooth' }); setTimeout(function () { t.focus({ preventScroll: true }); }, 250);
    });
    form.addEventListener('submit', function () { setTimeout(function () { draw(false); }, 0); });
    ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, function () { if (!box.hidden) setTimeout(function () { draw(false); }, 0); }); });
    return draw;
  }
  // 서버가 거절한 안내는 왼쪽 맨 위와 버튼 위에 같은 문장으로
  function cloneSrv() {
    var slot = $('#coSumMsg'); if (!slot) return;
    $$('#coSrv .msg.st-on').forEach(function (m) { var c = m.cloneNode(true); c.removeAttribute('data-st'); c.removeAttribute('data-el'); c.classList.remove('st-on'); slot.appendChild(c); });
  }
  // 주문서의 '주문 상품'은 폰에서만 접는다
  function fold() {
    var d = $('#coFold'); if (!d) return;
    var mq = window.matchMedia('(max-width:768px)');
    d.open = !mq.matches;
    $('summary', d).addEventListener('click', function (e) { if (!mq.matches) e.preventDefault(); });
  }
  function shipBy(form, o) {
    var noBase = $('#coNoBase'), help = $('#coShipHelp');
    var HELP = { same: '주문정보의 이름·주소·휴대전화를 그대로 씁니다.', base: '배송지 관리에 등록한 기본배송지를 씁니다.', new: o.newHelp };
    function set(v, open) {
      show(noBase, false); show($('#coAddrBtn'), v === 'new');
      if (v === 'same') fillShip({ name: val('coBName'), tel: val('coBTel'), zip: val('coBZip'), addr: val('coBAddr'), addr2: val('coBAddr2') });
      else if (v === 'base') { if (SUB.has('nobase')) { fillShip(); show(noBase, true); } else fillShip(BASE); }
      else { fillShip(); if (open && o.onNew) o.onNew(); }
      if (help) { help.textContent = HELP[v] || ''; show(help, v !== 'base' || !SUB.has('nobase')); }
    }
    form.addEventListener('change', function (e) { if (e.target.name === 'coShipBy') set(e.target.value, true); });
    // 주문자와 같음이면 주문정보를 고칠 때 배송정보도 따라간다
    form.addEventListener('input', function (e) {
      var r = $('input[name=coShipBy]:checked', form); if (!r || r.value !== 'same') return;
      var map = { coBName: 'coSName', coBTel: 'coSTel', coBAddr2: 'coSAddr2' }; if (map[e.target.id]) val(map[e.target.id], e.target.value);
    });
    var init = SUB.has('addr') ? 'new' : SUB.has('nobase') ? 'base' : 'same';
    var r = $('input[name=coShipBy][value="' + init + '"]', form); if (r) r.checked = true;
    set(init, false);
  }
  function zip(form) {
    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-zip]'); if (!b) return;
      var k = b.getAttribute('data-zip');
      if (SUB.has('zipfail')) { stOn($('#coZipFail'), true); SUB.toast('우편번호 검색을 불러오지 못했습니다.', { error: true }); return; }
      val(k + 'Zip', ZIP.zip); val(k + 'Addr', ZIP.addr);
      var f = document.getElementById(k + 'Zip').closest('.fld'); if (f) f.classList.remove('is-err');
      var d = document.getElementById(k + 'Addr2'); if (d) { d.value = ''; d.focus(); }
      SUB.toast('주소를 넣었습니다. 상세주소를 입력해 주세요.');
    });
  }
  // 날짜 칸: 값이 있으면 .is-v (비어 있을 때만 '날짜를 고르세요'를 보인다). 칸 어디를 눌러도 달력을 연다
  function dates(form) {
    $$('.co-date input[type=date]', form).forEach(function (inp) {
      function mark() { inp.classList.toggle('is-v', !!inp.value); }
      inp.addEventListener('input', mark); inp.addEventListener('change', mark);
      inp.addEventListener('click', function () { try { if (inp.showPicker) inp.showPicker(); } catch (e) {} });
      mark();
    });
  }
  // 상태 보기용 오류 표시(data-err-st)를 값 채우기 뒤에 다시 켠다
  function reErr() { $$('[data-err-st]').forEach(function (f) { if (SUB.hit(f.getAttribute('data-err-st'))) SUB.setErr(f, f.getAttribute('data-err')); }); }
  function dockSubmit(form) {
    var dockBtn = $('#coDockGo');
    form.addEventListener('submit', function () {
      setTimeout(function () { if (!$$('.fld.is-err', form).some(function (f) { return f.offsetParent !== null; })) { busy([dockBtn], true); setTimeout(function () { busy([dockBtn], false); }, 700); } }, 0);
    });
    return dockBtn;
  }

  /* ================= 주문서 작성(결제) ================= */
  function order() {
    var form = $('#coForm'); if (!form || SUB.auth === 'guest' || SUB.has('invalid')) return;
    body.setAttribute('data-codock', '');
    var TOTAL = 6146000, HAVE = 12450, balance = SUB.has('balance');
    var payBtn = $('#coPayBtn'), dockBtn = dockSubmit(form), pt = $('#coPt');
    var draw = errSummary(form);
    fold();
    cloneSrv();
    shipBy(form, { newHelp: '새 배송지를 입력하거나 저장된 배송지에서 고르세요.', onNew: function () { SUB.pop('coAddr'); } });
    zip(form); dates(form);

    // 처음 고른 값(상태 보기)
    var pay = SUB.has('later') || SUB.has('err') ? 'later' : (SUB.has('bank') || balance) ? 'bank' : 'card';
    var proof = SUB.has('tax') || SUB.has('err') ? 'tax' : SUB.has('cash') ? 'cash' : 'none';
    if (balance) { var lt = $('#coPayLater'); lt.remove(); $('.co-pay', form).classList.replace('opts--3', 'opts--2'); }
    $('input[name=coPay][value="' + pay + '"]', form).checked = true;
    $('input[name=coProof][value="' + proof + '"]', form).checked = true;
    if (SUB.has('err')) {
      val('coBName', ''); val('coBMail', 'mj.kim@example'); val('coSZip', '4805'); val('coTaxNo', '123-45-678');
      val('coSMsg', '경비실에 맡겨 주시고 도착 30분 전에 연락 주세요. 공장 출입구가 두 곳이라 동문으로 들어오셔야 하며 주차는 방문객 주차장을 이용해 주세요. 하역은 지게차로 합니다.');
    }
    if (SUB.has('pt')) { pt.value = HAVE.toLocaleString('ko-KR'); show($('#coPtOver'), true); }

    function cur(name) { var r = $('input[name=' + name + ']:checked', form); return r ? r.value : ''; }
    function apply() {
      var p = cur('coPay'), pr = cur('coProof'), use = cur('coCashUse');
      $$('[data-pay]', form).forEach(function (n) { show(n, n.getAttribute('data-pay') === p); });
      show($('#coLaterBox'), p === 'later');
      show($('#coProof'), p === 'bank' || p === 'later');
      $$('[data-proof]', form).forEach(function (n) { show(n, !balance && n.getAttribute('data-proof') === pr); });
      $$('[data-cash]', form).forEach(function (n) { show(n, n.getAttribute('data-cash') === use); });
      // 포인트: 후불결제 요청이면 쓸 수 없다(0으로)
      var later = p === 'later';
      pt.disabled = later; $('#coPtAll').disabled = later; show($('#coPtLater'), later);
      if (later) { pt.value = '0'; show($('#coPtOver'), false); }
      var use$ = Math.min(num(pt.value), HAVE, TOTAL), total = TOTAL - use$;
      $('#coSumPt').textContent = use$ ? '−' + use$.toLocaleString('ko-KR') + 'P' : '0P';
      $('#coSumTot').textContent = total.toLocaleString('ko-KR');
      $('#coDockTot').textContent = won(total);
      $('#coSumPay').textContent = { card: '신용·체크카드', bank: '무통장입금', later: '후불결제 요청' }[p];
      if (!payBtn.classList.contains('is-busy')) {
        $('span', payBtn).textContent = won(total) + (later ? ' 후불결제 요청' : ' 결제하기');
        dockBtn.textContent = later ? '후불결제 요청' : '결제하기';
      }
    }
    form.addEventListener('change', function (e) { if (/^co(Pay|Proof|CashUse)$/.test(e.target.name)) apply(); });
    pt.addEventListener('input', function () {
      var v = num(pt.value), max = Math.min(HAVE, TOTAL);
      if (v > HAVE) show($('#coPtOver'), true); else if (v < HAVE) show($('#coPtOver'), false);
      if (v > max) v = max;
      pt.value = v ? v.toLocaleString('ko-KR') : '';
      apply();
    });
    pt.addEventListener('blur', function () { if (!pt.value) pt.value = '0'; });
    $('#coPtAll').addEventListener('click', function () { pt.value = Math.min(HAVE, TOTAL).toLocaleString('ko-KR'); show($('#coPtOver'), false); apply(); });
    // 저장된 배송지 고르기
    $$('#coAddr [data-addr]').forEach(function (b) {
      b.addEventListener('click', function () {
        var o = {}; try { o = JSON.parse(b.getAttribute('data-addr')); } catch (e) {}
        fillShip(o); SUB.closePop('coAddr'); SUB.toast('배송지를 넣었습니다.');
      });
    });
    // 결제할 수 없는 견적 · 이미 접수된 주문: 결제 버튼을 없애고(조각의 data-st-not) 눌러지지도 않게 한다(입력칸에서 Enter 로 보내기도 막힌다)
    var noPay = SUB.hit('noquote saved');
    if (noPay) { payBtn.disabled = true; dockBtn.disabled = true; }
    // 결제: 검사(sub.js)를 통과하면 결제수단에 따라 이동
    form.addEventListener('checked', function (e) {
      e.preventDefault();
      if (noPay) return;
      var p = cur('coPay');
      if (p === 'card') { busy([payBtn], true, '결제창을 여는 중'); busy([dockBtn], true); setTimeout(function () { location.href = 'nicepay-return.html'; }, 600); return; }
      openDone(p);
    });
    function openDone(p) {
      var go = p === 'later' ? 'order-complete.html?state=later' : 'order-complete.html?state=bank';
      $('#coDoneT').textContent = p === 'later' ? '후불결제 요청을 접수했습니다' : '주문을 접수했습니다';
      $$('[data-co-done]').forEach(function (n) { show(n, n.getAttribute('data-co-done') === p); });
      $('#coDoneGo').setAttribute('href', go);
      SUB.pop('coDone');
    }
    if (SUB.has('paying')) { busy([payBtn], true, '결제창을 여는 중'); busy([dockBtn], true); }
    apply();
    if (SUB.has('done')) openDone(pay);
    if (SUB.has('err')) { reErr(); draw(false); }
  }

  /* ================= 주문 정보 입력 후 접수 ================= */
  function orderNow() {
    var form = $('#coForm'); if (!form || SUB.auth === 'guest' || SUB.has('noitem')) return;
    body.setAttribute('data-codock', '');
    setBadge(3, 'L337');
    var btn = $('#coPayBtn'), dockBtn = dockSubmit(form);
    var draw = errSummary(form);
    cloneSrv();
    shipBy(form, { newHelp: '배송지 칸을 비웠습니다. 새 배송지를 입력해 주세요.' });
    zip(form); dates(form);
    if (SUB.has('err')) { val('coBName', ''); val('coSName', ''); val('coSTel', ''); }
    form.addEventListener('click', function (e) {
      var d = e.target.closest('[data-co-del]'); if (!d) return;
      ask({ title: '이 상품을 삭제할까요?', desc: '삭제하면 접수할 상품이 없어 홈으로 이동합니다. 첨부한 인쇄 파일도 함께 삭제됩니다.', ok: '삭제', onOk: function () { SUB.toast('상품을 삭제했습니다.'); setTimeout(function () { location.href = 'index.html'; }, 700); } });
    });
    form.addEventListener('checked', function (e) {
      e.preventDefault();
      if (SUB.has('fail')) { SUB.toast('주문 요청을 접수하지 못했습니다.', { error: true }); return; }
      SUB.pop('coDone');
    });
    if (SUB.has('busy')) { busy([btn], true, '접수하는 중'); busy([dockBtn], true, '접수하는 중'); }
    if (SUB.has('err')) { reErr(); draw(false); }
  }

  if (page === 'cart') cart();
  else if (page === 'order') order();
  else if (page === 'order-now') orderNow();
})();
