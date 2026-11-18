/* 비투비티 고객센터 · sub-center.js (2026-11-17)
   하는 일: 1 탭 안 화면 나눔(주소 값 view · id · type · q · page) · 2 자주 묻는 질문 검색·분류 · 3 주문방법 종류·단계·화면 예시
           · 4 1:1 문의(기간 조회 · 비회원 조회 · 문의 작성) · 5 공지사항 목록·검색·쪽·상세
   탭 전환 자체는 sub.js 의 data-views="tab" 이 맡는다. 이 파일은 탭 안의 화면만 바꾼다. */
(function () {
  'use strict';
  var SUB = window.SUB; if (!SUB) return;
  var $ = SUB.$, $$ = SUB.$$, esc = SUB.esc;
  var box = $('[data-views="tab"]'); if (!box) return;
  var NAMES = { faq: '자주 묻는 질문', 'order-guide': '주문방법', qna: '1:1 문의', notice: '공지사항' };
  var EXTRA = ['view', 'id', 'type', 'q', 'page'];
  var hasState = SUB.tokens.join(' ') !== 'default';
  var desk = window.matchMedia('(min-width:1024px)');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function params() { return new URLSearchParams(location.search); }
  function tab() { return box.getAttribute('data-view-now') || 'faq'; }
  // 같은 탭 안에서 화면을 바꾼다. 상태 보기(?state=) 중이면 새로 불러와 상태 표시를 지운다
  function go(p, opt) {
    var u = new URL(location.href);
    EXTRA.concat(['state']).forEach(function (k) { u.searchParams.delete(k); });
    u.searchParams.set('tab', p.tab || tab());
    Object.keys(p).forEach(function (k) { if (k !== 'tab' && p[k] != null && p[k] !== '') u.searchParams.set(k, p[k]); });
    if (hasState) { location.href = u.pathname.split('/').pop() + u.search; return; }
    history[(opt && opt.replace) ? 'replaceState' : 'pushState']({}, '', u);
    if (p.tab && p.tab !== tab()) showTab(p.tab);
    route();
    if (!(opt && opt.stay)) {
      var top = $('.cc-tabs').getBoundingClientRect().top + window.pageYOffset - 120;
      if (window.pageYOffset > top) window.scrollTo(0, Math.max(0, top));
    }
  }

  // 다른 탭의 화면으로 바로 갈 때(예: 자주 묻는 질문 → 문의 작성) 탭 표시를 sub.js 와 같은 방식으로 바꾼다
  function showTab(t) {
    $$('[data-view]', box).forEach(function (x) { x.hidden = x.getAttribute('data-view') !== t; });
    $$('[data-view-link]').forEach(function (a) { if (a.getAttribute('data-view-link') === t) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    box.setAttribute('data-view-now', t);
  }

  /* ---------- 1. 화면 나눔 ---------- */
  var fromLink = false, keepY = null;
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-view-link]'); if (!a) return;
    if (hasState) { e.preventDefault(); e.stopPropagation(); location.href = location.pathname.split('/').pop() + '?tab=' + a.getAttribute('data-view-link'); return; }
    fromLink = true; keepY = window.pageYOffset;
  }, true);
  box.addEventListener('view', function () {
    if (fromLink) {   // 탭을 바꾸면 다른 탭의 값은 주소에서 지운다
      fromLink = false;
      var u = new URL(location.href); EXTRA.forEach(function (k) { u.searchParams.delete(k); }); history.replaceState({}, '', u);
    }
    route();
    if (keepY != null) {   // sub.js 는 맨 위로 올린다. 탭 줄이 화면에 남도록 탭 줄 바로 위까지만 올린다
      var top = $('.cc-tabs').getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo(0, Math.max(0, Math.min(keepY, top))); keepY = null;
    }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cc-write], [data-cc-list], [data-cc-nlist], [data-cc-nid], [data-cc-page]'); if (!a) return;
    e.preventDefault();
    if (a.hasAttribute('data-cc-write')) { wroteFrom = location.href; go({ tab: 'qna', view: 'write' }); }
    else if (a.hasAttribute('data-cc-list')) go({ tab: 'qna' });
    else if (a.hasAttribute('data-cc-nlist')) go({ tab: 'notice' });
    else if (a.hasAttribute('data-cc-nid')) go({ tab: 'notice', id: a.getAttribute('data-cc-nid') });
    else go({ tab: 'notice', page: a.getAttribute('data-cc-page'), q: params().get('q') || '' });
  });

  function route() {
    var t = tab(), p = params();
    var now = $('#ccNow'); if (now) now.textContent = NAMES[t] || NAMES.faq;
    document.title = (NAMES[t] || '고객센터') + ' - 고객센터 | 비투비티';
    if (t === 'order-guide') guideRoute(p);
    if (t === 'qna') qnaRoute(p);
    if (t === 'notice') noticeRoute(p);
  }

  /* ---------- 2. 자주 묻는 질문 ---------- */
  var faqQ = $('#ccFaqQ'), faqCat = '', faqItems = $$('#ccFaq details');
  function faqFilter() {
    var q = (faqQ.value || '').trim().toLowerCase(), n = 0;
    faqItems.forEach(function (d) {
      var ok = (!faqCat || d.getAttribute('data-cat') === faqCat) && (!q || d.textContent.toLowerCase().indexOf(q) >= 0);
      d.hidden = !ok; if (ok) n++;
    });
    $('#ccFaqCnt').textContent = (q ? '검색 결과 ' : '질문 ') + n + '개';
    $('#ccFaqX').hidden = !q;
    $('#ccFaq').classList.toggle('cc-gone', n === 0);
    $('#ccFaqNone').hidden = n > 0;
    $('#ccFaqNoneQ').textContent = q ? '‘' + faqQ.value.trim() + '’' : '고른 분류';
  }
  if (faqQ) {
    faqQ.addEventListener('input', faqFilter);
    faqQ.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
    $('#ccFaqX').addEventListener('click', function () { faqQ.value = ''; faqFilter(); faqQ.focus(); });
    $('#ccFaqReset').addEventListener('click', function () { faqQ.value = ''; faqFilter(); faqQ.focus(); });
    $$('.cc-cats .fchip').forEach(function (b) {
      b.addEventListener('click', function () {
        faqCat = b.getAttribute('data-cat');
        $$('.cc-cats .fchip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        faqFilter();
      });
    });
    if (SUB.has('noresult') && params().get('tab') === 'faq') { faqQ.value = '반품 택배비'; faqFilter(); }
  }

  /* ---------- 3. 주문방법 ---------- */
  function guideRoute(p) {
    var kind = p.get('type') === 'noprint' ? 'noprint' : 'print';
    $$('input[name="ccKind"]').forEach(function (r) { r.checked = r.value === kind; });
    $$('.cc-guide').forEach(function (g) { g.hidden = g.getAttribute('data-kind') !== kind; });
    var g = $('.cc-guide[data-kind="' + kind + '"]');
    if (g) $$('.cc-step__b:not([hidden]) .cc-shots', g).forEach(function (s) { shotSync(s); });
  }
  $$('input[name="ccKind"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) go({ tab: 'order-guide', type: r.value === 'noprint' ? 'noprint' : '' }, { replace: true, stay: true }); });
  });
  function openStep(h, on) {
    var b = document.getElementById(h.getAttribute('aria-controls'));
    h.setAttribute('aria-expanded', String(on)); b.hidden = !on;
    if (on) { var s = $('.cc-shots', b); if (s) shotGo(s, 0, true); }
  }
  $$('.cc-step__h').forEach(function (h) {
    h.addEventListener('click', function () {
      var list = h.closest('.cc-steps'), was = h.getAttribute('aria-expanded') === 'true';
      if (was && desk.matches) return;   // PC 는 한 단계가 늘 열려 있다
      $$('.cc-step__h', list).forEach(function (x) { if (x !== h) openStep(x, false); });
      openStep(h, !was);
      if (!desk.matches && !was) {   // 폰: 연 단계 머리가 화면 위로 오게
        var y = h.getBoundingClientRect().top + window.pageYOffset - 110;
        if (y < window.pageYOffset) window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  });
  // PC 로 넓어졌는데 열린 단계가 없으면 첫 단계를 연다
  function ensureOpen() {
    if (!desk.matches) return;
    $$('.cc-steps').forEach(function (list) { if (!$('.cc-step__h[aria-expanded="true"]', list)) openStep($('.cc-step__h', list), true); });
  }
  desk.addEventListener ? desk.addEventListener('change', ensureOpen) : desk.addListener(ensureOpen);

  // 화면 예시 넘기기: 이전·다음 · 세부 순서 · 손가락으로 밀기
  function shotIdx(s) { return s.clientWidth ? Math.round(s.scrollLeft / s.clientWidth) : (s._i || 0); }
  function shotSync(s, to) {
    var b = s.closest('.cc-step__b'), n = s.children.length, i = Math.max(0, Math.min(n - 1, typeof to === 'number' ? to : shotIdx(s)));
    s._i = i;
    var cnt = $('.cc-shots__cnt b', b); if (cnt) cnt.textContent = i + 1;
    var nav = $$('.cc-shots__nav .arw', b); if (nav.length) { nav[0].disabled = i === 0; nav[1].disabled = i === n - 1; }
    $$('.cc-sub', b).forEach(function (x, k) { if (k === i) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
  }
  function shotGo(s, i, instant) {
    i = Math.max(0, Math.min(s.children.length - 1, i)); s._i = i; s._to = i;
    s.scrollTo({ left: i * s.clientWidth, behavior: (instant || reduce) ? 'auto' : 'smooth' });
    shotSync(s, i);
    clearTimeout(s._tt); s._tt = setTimeout(function () { s._to = null; shotSync(s); }, 1200);   // 부드러운 이동이 끝나지 않았을 때를 대비
  }
  $$('.cc-shots').forEach(function (s) {
    if (s.children.length < 2) return;
    var b = s.closest('.cc-step__b'), t;
    s.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (s._to != null && shotIdx(s) !== s._to) return; s._to = null; shotSync(s); }, 80);   // 버튼으로 옮기는 중에는 목표 칸에 닿을 때까지 표시를 바꾸지 않는다
    }, { passive: true });
    $$('.cc-shots__nav .arw', b).forEach(function (a) { a.addEventListener('click', function () { shotGo(s, (s._i || 0) + Number(a.getAttribute('data-dir'))); }); });
    $$('.cc-sub', b).forEach(function (x, k) { x.addEventListener('click', function () { shotGo(s, k); }); });
    s.setAttribute('tabindex', '0');
    s.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); shotGo(s, (s._i || 0) + (e.key === 'ArrowRight' ? 1 : -1)); } });
  });
  window.addEventListener('resize', function () { $$('.cc-step__b:not([hidden]) .cc-shots').forEach(function (s) { if (s.children.length > 1) s.scrollLeft = (s._i || 0) * s.clientWidth; }); });

  /* ---------- 4. 1:1 문의 ---------- */
  var wroteFrom = '';
  function qnaRoute(p) {
    var write = p.get('view') === 'write';
    $('#ccQnaList').hidden = write; $('#ccWrite').hidden = !write;
    if (write) writeSetup();
  }
  // 회원 목록: 건수 · 답변 전 펼침 · 기간 조회
  function qlCount() {
    var items = $$('#ccQl .cc-qi').filter(function (d) { return getComputedStyle(d).display !== 'none'; });
    $('#ccQlCnt').textContent = items.length;
    return items.length;
  }
  if ($('#ccQl')) {
    qlCount();
    if (SUB.has('pending') && SUB.auth === 'member') { var w = $('#ccQiWait'); if (w) w.open = true; }
    if (SUB.has('done')) { var d0 = $('#ccQl .cc-qi.st-on'); if (d0) d0.open = true; }
    if (!hasState) { var a0 = $('#ccQl .cc-qi[data-el~="L1655"]'); if (a0) a0.open = true; }   // 처음에는 답변이 달린 최근 문의 하나를 펼쳐 둔다(답변·첨부가 어떻게 보이는지)
    $('#ccPeriodGo').addEventListener('click', function () {
      var f = $('#ccFrom').value, t = $('#ccTo').value, n = 0;
      if (f && t && f > t) { SUB.toast('시작일이 종료일보다 늦습니다. 기간을 확인해 주세요.', { error: true }); return; }
      $$('#ccQl .cc-qi').forEach(function (d) {
        var dt = d.getAttribute('data-date'), ok = (!f || dt >= f) && (!t || dt <= t);
        d.classList.toggle('cc-out', !ok);
        if (ok && getComputedStyle(d).display !== 'none') n++;
      });
      $('#ccQlCnt').textContent = n;
      $('#ccQl').classList.toggle('cc-gone', n === 0);
      $('#ccQlNone').hidden = n > 0;
    });
  }
  // 비회원 조회
  var gForm = $('#ccGForm');
  function gSelect(i) {
    $$('.cc-gi').forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
    $$('.cc-gd__item').forEach(function (a, k) { a.hidden = k !== i; });
  }
  if (gForm) {
    $$('.cc-gi').forEach(function (b, k) { b.addEventListener('click', function () { gSelect(k); if (!desk.matches) $('.cc-gd').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }); });
    if (SUB.has('found') || SUB.has('none')) { $('#ccGName').value = '정하늘'; $('#ccGName').setAttribute('data-sample', ''); $('#ccGPwHelp').hidden = false; }
    if (SUB.has('none')) $('#ccGCnt').textContent = '0';
    if (SUB.has('found') && SUB.has('pending')) gSelect(1);
    if (SUB.has('nomatch')) $('#ccGName').value = '정하늘';
    if (SUB.has('locked')) { $('#ccGName').value = '정하늘'; $('#ccGGo').disabled = true; }
    gForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (SUB.has('locked')) return;
      if (!SUB.checkForm(gForm)) { SUB.toast('이름과 비밀번호를 입력해 주세요.', { error: true }); return; }
      $$('.cc-gform__msg').forEach(function (m) { m.classList.remove('st-on'); });
      // 조회 성공: 결과를 보이고 비밀번호 칸은 비운다
      var res = $('#ccGRes'), grid = $('#ccGGrid');
      res.classList.add('st-on'); grid.classList.add('st-on'); $('#ccGCnt').textContent = '2'; gSelect(0);
      $('#ccGPw').value = ''; $('#ccGPwHelp').hidden = false;
      res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }
  // 문의 작성
  var wForm = $('#ccWForm'), setupDone = false;
  function capNew() { var c = $('#ccCap'); if (c) c.textContent = String(Math.floor(100000 + Math.random() * 900000)); var i = $('#ccWCap'); if (i) i.value = ''; }
  function writeSetup() {
    if (setupDone || !wForm) return; setupDone = true;
    var guest = SUB.auth === 'guest', m = SUB.member;
    wForm.setAttribute('data-go', 'customer-center.html?tab=qna&state=' + (guest ? 'guest+done' : 'done'));
    if (!guest) {   // 회원: 회원 정보로 채우고 고칠 수 없게
      [['ccWName', m.name], ['ccWTel', m.phone], ['ccWMail', m.email]].forEach(function (x) {
        var i = $('#' + x[0]); i.value = x[1]; i.readOnly = true; i.setAttribute('data-sample', ''); i.removeAttribute('placeholder');
        var l = $('label[for="' + x[0] + '"]'); if (!l || $('small.cc-mem', l)) return;
        $$('small', l).forEach(function (sm) { sm.remove(); });
        var s = document.createElement('small'); s.className = 'cc-mem'; s.textContent = '회원 정보';
        var em = $('em', l); if (em) em.insertAdjacentElement('afterend', s); else l.appendChild(s);
      });
    }
    var sample = { title: '방한 후드 패딩 추가 주문 문의', body: '지난주 주문한 방한 후드 패딩(블랙)을 20벌 더 주문하려고 합니다. 같은 자수 시안으로 진행할 수 있는지 알려 주세요.' };
    function fill(id, v) { var i = $('#' + id); if (!i) return; i.value = v; i.setAttribute('data-sample', ''); i.dispatchEvent(new Event('input', { bubbles: true })); }
    function err(id, msg) { SUB.setErr($('#' + id), msg); }
    function guestFill(withPw) { fill('ccWName', '정하늘'); fill('ccWTel', '010-3456-7890'); if (withPw) fill('ccWPw', 'haneul2026'); }
    // 상태 보기용 오류·진행 표시
    if (SUB.has('err')) { err('ccWTitleF', '제목을 입력해 주세요.'); err('ccWBodyF', '내용을 입력해 주세요.'); }
    if (SUB.has('blank')) {
      err('ccWNameF', '이름을 입력해 주세요.'); err('ccWTelF', '전화번호를 입력해 주세요.'); err('ccWPwF', '문의 비밀번호를 입력해 주세요.');
      fill('ccWTitle', sample.title); fill('ccWBody', sample.body);
      err('ccWCapF', '자동등록방지 숫자를 입력해 주세요.'); err('ccWAgreeF', '비회원 개인정보 수집·이용에 동의해 주세요.');
    }
    if (SUB.has('invalid')) {
      guestFill(false); fill('ccWMail', 'haneul@example'); fill('ccWPw', 'abc12'); fill('ccWTitle', sample.title); fill('ccWBody', sample.body); fill('ccWCap', '4829');
      $('#ccWAgree').checked = true;
      err('ccWMailF', '이메일 주소 형식을 확인해 주세요. (예: name@company.com)'); err('ccWPwF', '비밀번호는 6자 이상 입력해 주세요.'); err('ccWCapF', '자동등록방지 숫자 6자리를 모두 입력해 주세요.');
    }
    if (SUB.has('capfail') || (SUB.has('fail') && guest)) {
      guestFill(true); fill('ccWTitle', sample.title); fill('ccWBody', sample.body); $('#ccWAgree').checked = true; capNew();
      if (SUB.has('capfail')) err('ccWCapF', '숫자가 맞지 않습니다. 새 숫자를 보고 다시 입력해 주세요.');
    }
    if (SUB.has('busy') || SUB.has('noinfo') || SUB.has('badreq') || (SUB.has('fail') && !guest)) { fill('ccWTitle', sample.title); fill('ccWBody', sample.body); }
    if (SUB.has('busy')) $$('input, textarea, button', wForm).forEach(function (x) { if (x.type !== 'submit') x.disabled = true; });
  }
  if (wForm) {
    // sub.js 검사 앞에서: 비밀번호 6자 이상 · 처리 중 다시 등록 막기
    window.addEventListener('submit', function (e) {
      if (e.target !== wForm) return;
      if (SUB.has('busy') || $('[type=submit]', wForm).classList.contains('is-busy')) { e.preventDefault(); e.stopPropagation(); return; }
      var ok = SUB.checkForm(wForm), pw = $('#ccWPw');
      if (SUB.auth === 'guest' && pw && pw.value && pw.value.length < 6) { SUB.setErr($('#ccWPwF'), '비밀번호는 6자 이상 입력해 주세요.'); ok = false; }
      if (!ok) { e.preventDefault(); e.stopPropagation(); SUB.toast('입력한 내용을 확인해 주세요.', { error: true }); var f = $('.fld.is-err', wForm); if (f) { window.scrollTo({ top: f.getBoundingClientRect().top + window.pageYOffset - 150, behavior: reduce ? 'auto' : 'smooth' }); var i = $('input, textarea', f); if (i) setTimeout(function () { i.focus({ preventScroll: true }); }, 250); } }
    }, true);
    $('#ccCapRe').addEventListener('click', function () { capNew(); $('#ccWCap').focus(); });
    $('#ccWCancel').addEventListener('click', function () {
      if (wroteFrom && history.length > 1) { history.back(); return; }
      go({ tab: 'qna' });
    });
    var rl = $('#ccReload'); if (rl) rl.addEventListener('click', function () { location.reload(); });
  }

  /* ---------- 5. 공지사항 ---------- */
  // 운영자가 등록하는 공지(견본). 중요 공지를 먼저, 그다음 최신 등록순
  var N = [
    { id: 1, imp: 1, d: '2026-11-03', t: '고객센터 운영 시간 안내', b: ['고객센터는 주중 10시부터 18시까지 운영합니다. 점심시간(12시~13시)과 주말·공휴일에는 전화 상담을 받지 않습니다.', '운영 시간 밖에는 1:1 문의나 카카오톡 채널로 남겨 주시면 다음 영업일에 답변드립니다.', '대표전화 0507-1378-6094 · 이메일 noeul@noeul.co'] },
    { id: 2, imp: 1, d: '2026-10-20', t: '후불결제 요청 대상 안내', b: ['후불결제 요청은 관공서·공공기관·학교에서만 이용할 수 있습니다.', '인쇄 없는 할인 견적으로 요청한 주문은 후불결제 요청 대상에서 제외됩니다.', '주문서에서 결제수단을 후불결제 요청으로 고르고 결제 희망일을 적어 주세요.'] },
    { id: 3, d: '2026-11-12', t: '세금계산서 발행 안내', b: ['세금계산서는 무통장입금으로 결제한 주문에만 발행합니다.', '결제를 확인한 뒤 1~3영업일 안에 담당자 이메일로 보내 드립니다. 담당자 이메일을 적지 않으셨다면 주문자 이메일로 보냅니다.', '선발행이나 발행일 지정이 필요하시면 결제 전에 고객센터(0507-1378-6094)로 전화해 주세요.', '발행 신청을 빠뜨리셨다면 입금일 기준 다음 달 10일까지 추가로 신청할 수 있습니다.'] },
    { id: 4, d: '2026-11-10', t: '주문방법 안내를 새로 정리했습니다', b: ['인쇄 있는 주문과 인쇄 없는 주문의 진행 순서를 화면 예시와 함께 정리했습니다.', '고객센터의 주문방법에서 주문 종류를 골라 단계별로 확인해 주세요.'] },
    { id: 5, d: '2026-11-05', t: '시안확인 이용 방법 안내', b: ['인쇄가 있는 주문은 마이페이지 주문 내역의 시안확인에서 시안을 보고 승인하거나 수정을 요청할 수 있습니다.', '수정 요청은 고칠 내용을 1,000자 안에서 적어 보내 주세요. 시안을 승인한 뒤 결제를 진행합니다.'] },
    { id: 6, d: '2026-10-29', t: '견적서 유효기간 안내', b: ['견적서는 견적일로부터 15일 동안 유효합니다.', '기간이 지난 견적은 다시 요청해 주세요.'] },
    { id: 7, d: '2026-10-22', t: '수량 할인 기준 안내', b: ['상품 상세의 수량 할인은 10벌 이상 5%, 30벌 이상 10%, 50벌 이상 15%입니다.'] },
    { id: 8, d: '2026-10-15', t: '제작 기간 안내', b: ['인쇄가 없는 상품은 3~4일, 인쇄 상품은 4~7일이 걸립니다. 주말은 빼고 셉니다.'] },
    { id: 9, d: '2026-10-08', t: '사이즈 오차와 색상 차이 안내', b: ['사이즈는 재는 방법에 따라 약 1cm 차이가 날 수 있습니다.', '사진과 실제 색상은 차이가 있을 수 있습니다.'] },
    { id: 10, d: '2026-09-30', t: '주문제작 상품의 교환·환불 안내', b: ['주문을 받아 만드는 상품이라 단순 변심으로는 교환·환불이 어렵습니다.', '자세한 기준은 취소/환불 정책에서 확인해 주세요.'] },
    { id: 11, d: '2026-09-24', t: '시즌별 원단·부자재 변경 안내', b: ['시즌에 따라 원단과 부자재가 바뀔 수 있습니다. 주문 전에 상품 상세를 확인해 주세요.'] },
    { id: 12, d: '2026-09-17', t: '카카오톡 채널 상담 안내', b: ['카카오톡 채널로 구매 목록을 보내 주시면 담당자가 확인해 안내합니다.'] },
    { id: 13, d: '2026-09-10', t: '기업 회원 가입 안내', b: ['회원가입에서 기업 회원을 고르고 사업자 정보를 입력해 주세요.', '사업자등록증을 확인한 뒤 기업 회원으로 승인합니다.'] },
    { id: 14, d: '2026-09-03', t: '1:1 문의 이용 안내', b: ['로그인한 회원은 고객센터 1:1 문의에서 남긴 문의와 답변을 모두 볼 수 있습니다.', '비회원은 문의할 때 적은 이름과 비밀번호로 확인합니다.'] },
    { id: 15, d: '2026-08-27', t: '개인정보처리방침 개정 안내', b: ['개인정보처리방침을 개정했습니다. 바뀐 내용은 개인정보처리방침 페이지에서 확인해 주세요.'] },
    { id: 16, d: '2026-08-20', t: '이용약관 개정 안내', b: ['이용약관을 개정했습니다. 바뀐 내용은 이용약관 페이지에서 확인해 주세요.'] },
    { id: 17, d: '2026-08-13', t: '무통장입금 확인 안내', b: ['무통장입금 주문은 입금이 확인되면 결제완료로 바뀝니다. 마이페이지 주문 내역에서 상태를 확인해 주세요.'] },
    { id: 18, d: '2026-08-06', t: '견적문의 이용 안내', b: ['상품·인쇄 방법·수량을 알려 주시면 담당자가 맞춤 견적을 안내합니다.', '헤더의 견적문의에서 접수해 주세요.'] },
    { id: 19, d: '2026-07-30', t: '맞춤작업복 견적문의 안내', b: ['기업 로고를 넣은 맞춤 제작은 맞춤작업복 견적문의로 접수해 주세요.'] },
    { id: 20, d: '2026-07-23', t: '배송지 관리 기능 안내', b: ['마이페이지 배송지 관리에서 자주 쓰는 배송지를 저장하고 기본 배송지를 정할 수 있습니다.'] },
    { id: 21, d: '2026-07-16', t: '관심상품 기능 안내', b: ['상품 카드의 하트를 누르면 관심상품에 담깁니다. 담은 상품은 마이페이지 관심상품에서 볼 수 있습니다.'] }
  ].sort(function (a, b) { return (b.imp || 0) - (a.imp || 0) || (a.d < b.d ? 1 : a.d > b.d ? -1 : 0); });
  var PER = 15;
  function noticeRoute(p) {
    var id = p.get('id'), n = id && N.filter(function (x) { return String(x.id) === id; })[0];
    $('#ccNGone').hidden = !(id && !n);
    $('#ccNList').hidden = !!n; $('#ccNDetail').hidden = !n;
    if (n) {
      $('#ccNdImp').hidden = !n.imp; $('#ccNdT').textContent = n.t; $('#ccNdDate').textContent = n.d; $('#ccNdDate').setAttribute('datetime', n.d);
      $('#ccNdBody').innerHTML = n.b.map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('');
      return;
    }
    var q = p.get('q') || '';
    if (SUB.has('noresult') && p.get('tab') === 'notice' && !q) q = '배송비 환불';
    noticeList(q, parseInt(p.get('page'), 10) || 1);
  }
  function noticeList(q, page) {
    if (SUB.has('empty')) { $('#ccNPager').innerHTML = ''; return; }
    var qq = q.trim().toLowerCase();
    var rows = N.filter(function (x) { return !qq || (x.t + ' ' + x.b.join(' ')).toLowerCase().indexOf(qq) >= 0; });
    var pages = Math.max(1, Math.ceil(rows.length / PER)); page = Math.min(Math.max(1, page), pages);
    $('#ccNQ').value = q;
    $('#ccNCnt').textContent = (qq ? '검색 결과 ' : '') + rows.length + '건';
    $('#ccNBody').innerHTML = rows.slice((page - 1) * PER, page * PER).map(function (x) {
      return '<tr' + (x.imp ? ' class="cc-imp"' : '') + '><td class="c cc-ntbl__k">' + (x.imp ? '<span class="stag stag--ink">중요</span>' : '<span class="cc-ntbl__g">일반</span>') + '</td>' +
        '<td class="cc-ntbl__t"><a href="?tab=notice&amp;id=' + x.id + '" data-cc-nid="' + x.id + '">' + esc(x.t) + '</a></td><td class="c num cc-ntbl__d">' + x.d + '</td></tr>';
    }).join('');
    $('#ccNTbl').hidden = !rows.length;
    $('#ccNNone').hidden = !!rows.length; $('#ccNNoneQ').textContent = '‘' + q + '’';
    // 쪽 번호: 2쪽 이상일 때만, 모든 쪽 번호, 검색어 유지
    var pg = $('#ccNPager'), qs = qq ? '&amp;q=' + encodeURIComponent(q) : '';
    if (pages < 2) { pg.innerHTML = ''; pg.hidden = true; return; }
    pg.hidden = false;
    var h = '<a href="?tab=notice&amp;page=' + (page - 1) + qs + '" data-cc-page="' + (page - 1) + '" aria-label="이전 쪽"' + (page === 1 ? ' aria-disabled="true" tabindex="-1"' : '') + '><i class="i i-chev-l" aria-hidden="true"></i></a>';
    for (var i = 1; i <= pages; i++) h += '<a href="?tab=notice&amp;page=' + i + qs + '" data-cc-page="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + i + '</a>';
    h += '<a href="?tab=notice&amp;page=' + (page + 1) + qs + '" data-cc-page="' + (page + 1) + '" aria-label="다음 쪽"' + (page === pages ? ' aria-disabled="true" tabindex="-1"' : '') + '><i class="i i-chev-r" aria-hidden="true"></i></a>';
    pg.innerHTML = h;
  }
  var ns = $('#ccNSearch');
  if (ns) ns.addEventListener('submit', function (e) { e.preventDefault(); go({ tab: 'notice', q: $('#ccNQ').value.trim().slice(0, 50) }, { stay: true }); });

  route();
  ensureOpen();
})();
