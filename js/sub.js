/* 비투비티 하위 페이지 공용 · sub.js (2026-11-17)
   하는 일: 1 상태 보기(?state=) · 2 시안끼리 이동 · 3 헤더 보강(회원 이름·장바구니 수·검색 층) · 4 방문 기록 동의 · 5 상담 메뉴
           · 6 팝업·옆 패널·알림 · 7 양식 도우미(수량·파일 첨부·자동 맞춤·검사) · 8 부분 전환(탭·?tab=)
   헤더 동작은 홈의 site-v10.js 가 그대로 맡는다. 이 파일은 헤더 마크업을 고치지 않고 실행 중에만 덧붙인다. */
(function () {
  'use strict';
  var root = document.documentElement, body = document.body, host = document.getElementById('main') || document.body;   // 덧붙이는 부품은 <main class="subp"> 안에 넣는다(공용 스타일 범위)
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  // 홈 전용 등장 효과가 남지 않게
  window.B2BT_READY = true; root.classList.remove('v4-motion');
  // 홈 헤더의 투명 상태(is-top)는 하위 페이지에서 쓰지 않는다
  function noTop() { if (root.classList.contains('is-top')) root.classList.remove('is-top'); }
  noTop(); new MutationObserver(noTop).observe(root, { attributes: true, attributeFilter: ['class'] });

  /* ---------- 1. 상태 보기 ---------- */
  var qs = new URLSearchParams(location.search);
  var tokens = (qs.get('state') || 'default').split(/[\s,+]+/).filter(Boolean);
  var S = {}; tokens.forEach(function (t) { S[t] = 1; });
  var auth = body.getAttribute('data-auth') || 'member';
  if (S.guest || S['like-guest']) auth = 'guest'; if (S.member) auth = 'member';
  root.setAttribute('data-state', tokens.join(' ')); root.setAttribute('data-auth', auth);
  function hit(list) {
    return String(list).split(/\s+/).some(function (t) { return S[t] || (t === '@member' && auth === 'member') || (t === '@guest' && auth === 'guest'); });
  }
  function applyState(scope) {
    $$('[data-st]', scope).forEach(function (n) { n.classList.toggle('st-on', hit(n.getAttribute('data-st'))); });
    $$('[data-st-not]', scope).forEach(function (n) { if (hit(n.getAttribute('data-st-not'))) n.hidden = true; });
  }
  applyState(document);
  root.classList.add('sub-ready');

  /* 견본 값(운영하면서 채워질 자리) */
  var MEMBER = { name: '김민준', company: '한결산업 주식회사', cart: 3, phone: '010-1234-5678', email: 'mj.kim@example.com' };
  var TEL = '0507-1378-6094', KAKAO = 'https://pf.kakao.com/_uxjxmxjn';

  /* ---------- 2. 시안끼리 이동: data-href="파일.php?..." → 파일.html?... (만든 페이지만) ---------- */
  var PAGES = ['index', 'category', 'brand', 'search', 'product', 'cart', 'order', 'nicepay-return', 'order-complete', 'order-now', 'quote-intro', 'quote', 'custom-intro',
    'login', 'signup', 'signup-general', 'signup-business', 'signup-general-info', 'signup-business-info', 'mypage', 'draft-preview', 'inquiry-draft', 'customer-center',
    'reviews', 'review-view', 'event', 'event-view', 'delivery-cases', 'partnership', 'quote-preview', 'quote-document', 'quote-request-document', 'custom-quote-preview',
    'custom-quote-document', 'safety-quote-preview', 'safety-quote-document', 'terms', 'refund-policy', 'privacy', 'guest-privacy', 'unsubscribe', 'pages'];
  function toHtml(href) {
    var m = /^([a-z0-9-]+)\.php(\?[^#]*)?(#.*)?$/i.exec(href || '');
    if (!m || PAGES.indexOf(m[1]) < 0) return null;
    return m[1] + '.html' + (m[2] || '') + (m[3] || '');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-href]');
    if (!a || a.hasAttribute('data-no-nav')) return;
    var raw = a.getAttribute('data-href'), to = toHtml(raw);
    if (to) { e.preventDefault(); if (a.target === '_blank') window.open(to, '_blank', 'noopener'); else location.href = to; }
  });

  /* ---------- 3. 헤더 보강 ---------- */
  var page = body.getAttribute('data-page') || '';
  (function header() {
    var hd = $('#hd'); if (!hd) return;
    // 지금 페이지 표시
    var cur = { category: 'category.php', brand: 'brand.php', 'custom-intro': 'custom-intro.php' }[page];
    var cat = qs.get('cat') || '';
    if (page === 'category' && cat === '작업복') cur = 'category.php?cat=%EC%9E%91%EC%97%85%EB%B3%B5';
    if (cur) $$('.bz__link').forEach(function (a) { if (a.getAttribute('data-href') === cur) a.setAttribute('aria-current', 'page'); });
    var here = page + '.php';
    $$('.am a[data-href], .dr-pane a[data-href]').forEach(function (a) {
      var h = a.getAttribute('data-href');
      if (h === here + location.search || (h === here && !location.search && page !== 'category')) a.setAttribute('aria-current', 'page');
    });
    // 로그인 회원: 이름(마이페이지로 이동) · 로그아웃 · 장바구니 담긴 수
    if (auth === 'member') {
      var right = $('.hd__right', hd), icons = $('.hd__icons', hd);
      if (right && icons) {
        right.insertBefore(el('<span class="hd__mem"><a class="hd__who" href="#" data-href="mypage.php" data-sample><b>' + esc(MEMBER.name) + '</b>님</a><a class="hd__out" href="index.html">로그아웃</a></span>'), icons);
      }
      $$('a[data-href="login.php"]').forEach(function (a) {
        if (a.closest('.dr-login')) { a.textContent = MEMBER.name + '님'; a.setAttribute('data-href', 'mypage.php'); }
        else { a.setAttribute('data-href', 'mypage.php'); a.setAttribute('aria-label', '마이페이지'); }
      });
      $$('.dr-login a[data-href="signup.php"]').forEach(function (a) { a.textContent = '로그아웃'; a.setAttribute('data-href', 'index.php'); });
      if (!S['cart-empty']) $$('a[data-href="cart.php"]').forEach(function (a) {
        if (!a.classList.contains('hd__icon') && !a.classList.contains('mh__btn')) return;
        a.appendChild(el('<span class="badge num is-on" data-cart-count data-sample>' + MEMBER.cart + '</span>'));
        a.setAttribute('aria-label', '장바구니 ' + MEMBER.cart + '건');
      });
    }
    // 검색: 결과 페이지로 이동, 최근 검색어(이 기기에만, 10개), 인기 검색어, 진행 중 이벤트
    var KEY = 'b2bt-recent';
    function recent() { try { return JSON.parse(lsGet(KEY) || '[]'); } catch (e) { return []; } }
    function saveRecent(q) { if (!q) return; var r = recent().filter(function (x) { return x !== q; }); r.unshift(q); lsSet(KEY, JSON.stringify(r.slice(0, 10))); }
    if (page === 'search' && qs.get('q')) saveRecent(qs.get('q').trim().slice(0, 100));
    $$('form[role="search"]').forEach(function (f) {
      var inp = $('input[name="q"]', f);
      if (page === 'search' && inp && qs.get('q')) inp.value = qs.get('q');
      f.addEventListener('submit', function (e) { e.preventDefault(); var q = (inp.value || '').trim().slice(0, 100); saveRecent(q); location.href = 'search.html' + (q ? '?q=' + encodeURIComponent(q) : ''); });
    });
    var sx = $('.hd-sx');
    if (sx) {
      var title = $('.hd-sx__title', sx), empty = $('.hd-sx__empty', sx);
      var list = el('<ul class="hd-sx__list"></ul>'); sx.appendChild(list);
      var clear = el('<button type="button" class="hd-sx__clear">전체 삭제</button>'); title.appendChild(clear);
      var drawRecent = function () {
        var r = S['recent'] ? ['방한 패딩', '카라 티셔츠', '케이투 자켓'] : recent();
        list.innerHTML = r.map(function (q) { return '<li><a href="#" data-href="search.php?q=' + encodeURIComponent(q) + '">' + esc(q) + '</a><button type="button" data-q="' + esc(q) + '" aria-label="' + esc(q) + ' 삭제"><i class="i i-x i--14" aria-hidden="true"></i></button></li>'; }).join('');
        empty.hidden = r.length > 0; clear.hidden = !r.length;
      };
      list.addEventListener('click', function (e) { var b = e.target.closest('button[data-q]'); if (!b) return; lsSet(KEY, JSON.stringify(recent().filter(function (x) { return x !== b.getAttribute('data-q'); }))); b.parentNode.remove(); if (!list.children.length) { empty.hidden = false; clear.hidden = true; } });
      clear.addEventListener('click', function () { lsDel(KEY); list.innerHTML = ''; empty.hidden = false; clear.hidden = true; });
      drawRecent();
      var POP = ['라운드 티셔츠', '카라 티셔츠', '후드 티셔츠', '조끼', '자켓', '패딩'];
      var EV = [['img/v5/bn-h05.webp', '겨울 방한 단체복 모음'], ['img/v5/duo-uniform.webp', '신규 기업회원 가입 안내']];
      var CATS3 = [['img/v9/mega-uniform.webp', '단체복', 'category.php'], ['img/v9/mega-work.webp', '작업복', 'category.php?cat=%EC%9E%91%EC%97%85%EB%B3%B5'], ['img/v9/mega-brand.webp', '협력브랜드', 'brand.php']];
      var right2 = S['noev']
        ? '<div><p class="hd-sx2__t">대표 분류</p><ul class="hd-ev hd-ev--3">' + CATS3.map(function (c) { return '<li><a href="#" data-href="' + c[2] + '"><img src="' + c[0] + '" alt="" loading="lazy" width="480" height="270"><span>' + c[1] + '</span></a></li>'; }).join('') + '</ul></div>'
        : '<div><p class="hd-sx2__t">진행 중 이벤트</p><ul class="hd-ev">' + EV.map(function (c, i) { return '<li><a href="#" data-href="event-view.php?id=' + (i + 1) + '" data-sample><img src="' + c[0] + '" alt="" loading="lazy" width="480" height="270"><span><em>이벤트</em>' + c[1] + '</span></a></li>'; }).join('') + '</ul></div>';
      sx.parentNode.appendChild(el('<div class="hd-sx2">' + (S['nopop'] ? '' : '<div><p class="hd-sx2__t">인기 검색어</p><ol class="hd-pop" data-sample>' + POP.map(function (q) { return '<li><a href="#" data-href="search.php?q=' + encodeURIComponent(q) + '">' + q + '</a></li>'; }).join('') + '</ol></div>') + right2 + '</div>'));
    }
  })();

  /* 글 입력 중에는 빠른 상담(하단 상담 바)을 감춘다 */
  document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea')) root.classList.add('is-typing'); });
  document.addEventListener('focusout', function () { root.classList.remove('is-typing'); });

  /* ---------- 4. 방문 기록(쿠키) 동의 ---------- */
  var CK = 'b2bt-consent';
  function consentUI(expanded) {
    var old = $('#ck'); if (old) old.remove();
    var saved = {}; try { saved = JSON.parse(lsGet(CK) || '{}'); } catch (e) {}
    var n = el('<section class="ck" id="ck" role="dialog" aria-labelledby="ckT" data-el="L39 L40 L62 L63 L73 L1943 L1944 L1945 L1946 L1949 L1950 L1951 L1952 L1955 L1956 L1957 L1958 L1959 L1960 L1961 L1964 L1965 L1966 L1967">' +
      '<h2 class="ck__t" id="ckT">방문 기록(쿠키) 안내</h2>' +
      '<p class="ck__d">어떤 페이지와 상품을 보셨는지 기록해 사이트를 고치는 데 씁니다. 이름과 연락처는 담지 않습니다. 거부해도 이용에는 제한이 없습니다. <a href="#" data-href="privacy.php#pp-cookies">개인정보처리방침</a></p>' +
      '<button type="button" class="ck__more" aria-expanded="false" aria-controls="ckOpts">항목별 설정<i class="i i-chev-d" aria-hidden="true"></i></button>' +
      '<div class="ck__opts" id="ckOpts" hidden>' +
      '<label class="ck__opt"><input type="checkbox" name="stat"><i></i><b>방문 통계</b><span>어느 페이지를 몇 번 보았는지 셉니다.</span></label>' +
      '<label class="ck__opt"><input type="checkbox" name="ux"><i></i><b>화면 이용 기록</b><span>어디를 누르고 어디까지 내려 보았는지 기록합니다.</span></label>' +
      '<label class="ck__opt"><input type="checkbox" name="ad"><i></i><b>광고 효과 측정</b><span>광고를 보고 들어온 방문인지 확인합니다.</span></label>' +
      '</div>' +
      '<div class="ck__acts"><button type="button" class="sb sb--gray" data-ck="deny">거부</button><button type="button" class="sb sb--line" data-ck="save" hidden>선택 저장</button><button type="button" class="sb sb--ink" data-ck="allow">동의</button></div>' +
      '</section>');
    host.appendChild(n);
    var more = $('.ck__more', n), opts = $('#ckOpts', n), save = $('[data-ck="save"]', n);
    function open(v) { more.setAttribute('aria-expanded', String(v)); opts.hidden = !v; save.hidden = !v; }
    ['stat', 'ux', 'ad'].forEach(function (k) { $('input[name=' + k + ']', n).checked = !!saved[k]; });
    more.addEventListener('click', function () { open(opts.hidden); });
    n.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return;
      var kind = b.getAttribute('data-ck'), v = { t: 1 };
      ['stat', 'ux', 'ad'].forEach(function (k) { v[k] = kind === 'allow' ? 1 : kind === 'deny' ? 0 : ($('input[name=' + k + ']', n).checked ? 1 : 0); });
      lsSet(CK, JSON.stringify(v)); n.remove();   // 저장 요청이 실패해도 선택은 이 브라우저에 남는다
    });
    if (expanded) open(true);
  }
  if (S['ck'] || S['ck-set'] || (!lsGet(CK) && !S['nock'] && body.getAttribute('data-shell') !== 'bare')) consentUI(!!S['ck-set']);
  // 푸터 "방문 기록 설정" · 개인정보처리방침의 "방문 기록 설정 바꾸기" → 항목별 설정 상태로 다시 띄운다
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-ck-open], a[data-href="privacy.php#pp-cookies"]');
    if (!a || a.closest('.ck')) return;
    if (a.hasAttribute('data-ck-open') || page === 'privacy') { e.preventDefault(); e.stopPropagation(); consentUI(true); }
  }, true);

  /* ---------- 5. 상담 메뉴(고객센터 메뉴 묶음): PC 우측 플로팅에 버튼을 더한다 ---------- */
  (function quick() {
    var cs = $('.side-cs'); if (!cs || body.hasAttribute('data-nocs')) return;
    var btn = el('<button type="button" class="side-cs__btn side-cs__btn--menu" id="qpBtn" aria-label="상담 메뉴 열기" aria-expanded="false" aria-controls="qp"><i class="i i-chat i--24" aria-hidden="true"></i></button>');
    cs.insertBefore(btn, cs.firstChild);
    var hours = S['offhours']
      ? '<p data-el="L70"><b>지금은 상담 시간이 아닙니다.</b> 채팅상담에 남겨 주시면 다음 영업일에 답변드립니다.</p><p>전화상담 주중 10시~18시 (점심 12시~13시)</p>'
      : '<p>주중 10시~18시 (점심 12시~13시 / 주말·공휴일 제외)</p>';
    var qp = el('<aside class="qp" id="qp" aria-label="상담 메뉴" hidden data-el="L22 L23 L24 L25 L26 L27 L28 L29 L21 L33 L61">' +
      '<div class="qp__head"><span class="qp__masc" data-slot="mascot" aria-hidden="true"><i class="i i-user i--24"></i></span><p class="qp__ht">무엇을 도와드릴까요<small>견적부터 납품까지 담당자가 안내합니다.</small></p><button type="button" class="qp__x" aria-label="상담 메뉴 닫기"><i class="i i-x i--18" aria-hidden="true"></i></button></div>' +
      '<div class="qp__quick"><a href="#" data-href="quote-intro.php"><i class="i i-pen" aria-hidden="true"></i>견적문의</a><a href="#" data-href="mypage.php?section=orders"><i class="i i-image" aria-hidden="true"></i>시안확인</a><a href="#" data-href="customer-center.php?tab=order-guide"><i class="i i-doc" aria-hidden="true"></i>주문방법</a><a href="' + KAKAO + '" target="_blank" rel="noopener"><i class="i i-kakao" aria-hidden="true"></i>카카오톡</a></div>' +
      '<div class="qp__list"><a href="#" data-href="mypage.php?section=orders">주문내역</a><a href="#" data-href="mypage.php?section=inquiries">견적문의 내역</a><a href="#" data-href="mypage.php?section=orders">시안확인</a><a href="#" data-href="mypage.php?section=orders&amp;state=shipping">배송조회</a><a href="#" data-href="mypage.php?section=wishlist">관심상품</a><a href="#" data-href="customer-center.php">고객센터</a></div>' +
      '<div class="qp__cs"><a class="qp__tel num" href="tel:' + TEL.replace(/-/g, '') + '">' + TEL + '</a>' + hours + '<p>noeul@noeul.co</p></div>' +
      (S['nobank'] ? '' : '<div class="qp__row"><span>입금계좌</span><button type="button" id="qpBank" aria-expanded="false" aria-controls="qpBankBox">계좌 확인<i class="i i-chev-d i--16" aria-hidden="true"></i></button></div><div class="qp__bank" id="qpBankBox" hidden data-sample><b class="num">부산은행 101-2000-0000-00</b>예금주 주식회사 노을상사<a class="tl" href="#" data-slot="bank-book" style="display:inline-block;margin-top:6px">통장 사본 보기</a></div>') +
      '<div class="qp__row"><span>기업 로고를 넣은 맞춤 제작</span><a href="#" data-href="custom-intro.php">맞춤작업복<i class="i i-chev-r i--16" aria-hidden="true"></i></a></div>' +
      '<div class="qp__sns"><a href="#" data-sample aria-label="인스타그램 (새 창)"><i class="i i-insta i--18" aria-hidden="true"></i></a><a href="' + KAKAO + '" target="_blank" rel="noopener" aria-label="카카오톡 채널 (새 창)"><i class="i i-kakao i--18" aria-hidden="true"></i></a><a href="#" data-sample aria-label="네이버 블로그 (새 창)"><i class="i i-nblog i--18" aria-hidden="true"></i></a><a href="#" data-sample aria-label="유튜브 (새 창)"><i class="i i-youtube i--18" aria-hidden="true"></i></a></div>' +
      '</aside>');
    host.appendChild(qp);
    function set(v) { qp.hidden = !v; btn.setAttribute('aria-expanded', String(v)); btn.setAttribute('aria-label', v ? '상담 메뉴 닫기' : '상담 메뉴 열기'); }
    btn.addEventListener('click', function () { set(qp.hidden); });
    $('.qp__x', qp).addEventListener('click', function () { set(false); btn.focus(); });
    var bank = $('#qpBank', qp);
    bank && bank.addEventListener('click', function () { var b = $('#qpBankBox', qp); b.hidden = !b.hidden; bank.setAttribute('aria-expanded', String(!b.hidden)); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !qp.hidden) { set(false); btn.focus(); } });
    if (S['qp']) set(true);
  })();

  /* ---------- 6. 팝업 · 옆 패널 · 알림 ---------- */
  var stack = [];
  function focusables(box) { return $$('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; }); }
  function openPop(id, from) {
    var p = typeof id === 'string' ? document.getElementById(id) : id; if (!p) return;
    p.hidden = false; p._from = from || document.activeElement;
    requestAnimationFrame(function () { p.classList.add('is-on'); });
    stack.push(p); root.classList.add('is-pop');
    var f = focusables(p); setTimeout(function () { (f[0] || p).focus({ preventScroll: true }); }, 60);
    p.dispatchEvent(new CustomEvent('pop:open'));
  }
  function closePop(p) {
    p = typeof p === 'string' ? document.getElementById(p) : (p || stack[stack.length - 1]); if (!p || p.hidden) return;
    p.classList.remove('is-on'); stack = stack.filter(function (x) { return x !== p; });
    if (!stack.length) root.classList.remove('is-pop');
    setTimeout(function () { p.hidden = true; }, 280);
    if (p._from && p._from.focus) p._from.focus({ preventScroll: true });
    p.dispatchEvent(new CustomEvent('pop:close'));
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('[data-pop]:not(html)');
    if (o) { e.preventDefault(); openPop(o.getAttribute('data-pop'), o); return; }
    var c = e.target.closest && e.target.closest('[data-pop-close]');
    if (c) { e.preventDefault(); closePop(c.closest('.pop, .side')); }
  });
  document.addEventListener('keydown', function (e) {
    var p = stack[stack.length - 1]; if (!p) return;
    if (e.key === 'Escape') { closePop(p); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(p); if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey ? i <= 0 : i === f.length - 1 || i < 0) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
  });
  $$('.pop[data-open-st], .side[data-open-st]').forEach(function (p) { if (hit(p.getAttribute('data-open-st'))) openPop(p); });

  var toastEl, toastT;
  function toast(msg, o) {
    o = o || {};
    if (!toastEl) { toastEl = el('<div class="sub-toast" role="status" aria-live="polite"><span></span><button type="button" hidden></button></div>'); host.appendChild(toastEl); }
    var b = $('button', toastEl);
    $('span', toastEl).textContent = msg;
    toastEl.classList.toggle('sub-toast--err', !!o.error);
    b.hidden = !o.action; b.textContent = o.action || ''; b.onclick = o.onAction || null;
    toastEl.classList.add('is-on'); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, o.ms || 3200);
  }
  $$('[data-toast-st]').forEach(function (n) { if (hit(n.getAttribute('data-toast-st'))) setTimeout(function () { toast(n.getAttribute('data-toast'), { error: n.hasAttribute('data-toast-err'), ms: 60000 }); }, 300); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-toast]:not([data-toast-st])');
    if (t) toast(t.getAttribute('data-toast'), { error: t.hasAttribute('data-toast-err') });
  });

  /* 따로 열리는 창 닫기 */
  document.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('[data-win-close]'))) return;
    e.preventDefault(); window.close();
    setTimeout(function () { if (history.length > 1) history.back(); else location.href = 'mypage.html'; }, 120);   // 창으로 열린 것이 아니면 이전 화면으로
  });
  /* 확인 창(네/아니요) */
  function confirmBox(o) {
    var p = el('<div class="pop pop--c" role="alertdialog" aria-modal="true" aria-labelledby="cfT" hidden><div class="pop__dim" data-pop-close></div><div class="pop__box"><div class="pop__body">' +
      '<span class="smark smark--' + (o.tone || 'gray') + '"><i class="i i-' + (o.icon || 'info') + '" aria-hidden="true"></i></span>' +
      '<h2 class="pop__t" id="cfT">' + esc(o.title) + '</h2>' + (o.desc ? '<p class="pop__d">' + esc(o.desc) + '</p>' : '') + '</div>' +
      '<div class="pop__foot">' + (o.cancel === false ? '' : '<button type="button" class="sb sb--gray" data-pop-close>' + esc(o.cancel || '취소') + '</button>') + '<button type="button" class="sb sb--ink" data-ok>' + esc(o.ok || '확인') + '</button></div></div></div>');
    host.appendChild(p);
    $('[data-ok]', p).addEventListener('click', function () { closePop(p); o.onOk && o.onOk(); });
    p.addEventListener('pop:close', function () { setTimeout(function () { p.remove(); }, 320); });
    openPop(p);
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-confirm]'); if (!c) return;
    e.preventDefault();
    confirmBox({ title: c.getAttribute('data-confirm'), desc: c.getAttribute('data-confirm-desc'), ok: c.getAttribute('data-confirm-ok'), tone: c.getAttribute('data-confirm-tone'), icon: c.getAttribute('data-confirm-icon'),
      onOk: function () { var d = c.getAttribute('data-done'); if (d) toast(d); var go = c.getAttribute('data-go'); if (go) location.href = go; c.dispatchEvent(new CustomEvent('confirmed', { bubbles: true })); } });
  });

  /* ---------- 7. 양식 도우미 ---------- */
  // 자동 맞춤
  var FMT = {
    phone: function (v) { v = v.replace(/\D/g, '').slice(0, 11); if (v.length < 4) return v; if (v.indexOf('02') === 0) { return v.length < 6 ? v.replace(/(\d{2})(\d+)/, '$1-$2') : v.length < 10 ? v.replace(/(\d{2})(\d{3})(\d+)/, '$1-$2-$3') : v.replace(/(\d{2})(\d{4})(\d+)/, '$1-$2-$3'); } return v.length < 8 ? v.replace(/(\d{3})(\d+)/, '$1-$2') : v.length < 11 ? v.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3') : v.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3'); },
    biz: function (v) { v = v.replace(/\D/g, '').slice(0, 10); return v.length < 4 ? v : v.length < 6 ? v.replace(/(\d{3})(\d+)/, '$1-$2') : v.replace(/(\d{3})(\d{2})(\d+)/, '$1-$2-$3'); },
    digits: function (v) { return v.replace(/\D/g, ''); },
    id: function (v) { return v.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20); },
    money: function (v) { v = v.replace(/\D/g, ''); return v ? Number(v).toLocaleString('ko-KR') : ''; }
  };
  document.addEventListener('input', function (e) {
    var t = e.target, f = t.getAttribute && t.getAttribute('data-fmt');
    if (f && FMT[f]) { var v = FMT[f](t.value); if (v !== t.value) t.value = v; }
    var fld = t.closest && t.closest('.fld'); if (fld && fld.classList.contains('is-err') && !t.hasAttribute('data-keep-err')) fld.classList.remove('is-err');   // 고치면 오류 표시가 바로 사라진다
    var cnt = t.getAttribute && t.getAttribute('data-count'); if (cnt) { var c = document.getElementById(cnt); if (c) c.textContent = t.value.length.toLocaleString('ko-KR'); }
  });
  // 비밀번호 보기/숨기기
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pw__eye'); if (!b) return;
    var i = $('input', b.parentNode), on = i.type === 'password';
    i.type = on ? 'text' : 'password'; b.setAttribute('aria-label', on ? '비밀번호 숨기기' : '비밀번호 보기'); b.setAttribute('aria-pressed', String(on));
    var ic = $('.i', b); if (ic) ic.className = 'i ' + (on ? 'i-eye-off' : 'i-eye');
  });
  // 수량: 빼기·더하기(길게 누르면 연속), 직접 입력(비우면 0)
  function qtyStep(inp, d) {
    var min = Number(inp.min || 0), max = Number(inp.max || 99999), v = Math.max(min, Math.min(max, (parseInt(inp.value, 10) || 0) + d));
    inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
  }
  var hold = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.qty button[data-q]'); if (!b) return;
    var inp = $('input', b.parentNode), d = Number(b.getAttribute('data-q'));
    qtyStep(inp, d); clearTimeout(hold); clearInterval(hold);
    hold = setTimeout(function () { hold = setInterval(function () { qtyStep(inp, d); }, 70); }, 420);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(hold); clearInterval(hold); }, true); });
  document.addEventListener('keydown', function (e) { var b = e.target.closest && e.target.closest('.qty button[data-q]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); qtyStep($('input', b.parentNode), Number(b.getAttribute('data-q'))); } });
  document.addEventListener('change', function (e) { var t = e.target; if (t.matches && t.matches('.qty input')) { var v = parseInt(t.value, 10); if (isNaN(v) || v < Number(t.min || 0)) t.value = t.min || 0; } });
  document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('.qty input')) e.target.select(); });

  // 파일 첨부: data-upl='{"max":10,"mb":10,"total":100,"accept":"jpg,png,pdf","thumb":true}'
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB'; }
  function initUpl(box) {
    if (box._upl) return; box._upl = 1;
    var o = {}; try { o = JSON.parse(box.getAttribute('data-upl') || '{}'); } catch (e) {}
    var inp = $('input[type=file]', box), list = document.getElementById(box.getAttribute('data-list')) || box.parentNode.querySelector('.files, .thumbs');
    var cnt = $('.upl__cnt', box), files = [], fld = box.closest('.fld');
    // 견본으로 미리 넣어 둔 파일(data-files='[["로고.ai",2400000]]')
    try { JSON.parse(box.getAttribute('data-files') || '[]').forEach(function (f) { files.push({ name: f[0], size: f[1], sample: true, src: f[2] }); }); } catch (e) {}
    function err(m) { toast(m, { error: true }); if (fld) { var mm = $('.fld__msg--err', fld); if (mm) { mm.textContent = m; fld.classList.add('is-err'); } } }
    function draw() {
      if (cnt) cnt.textContent = files.length + (o.max ? ' / ' + o.max : '') + '개';
      box.dispatchEvent(new CustomEvent('upl:change', { bubbles: true, detail: files }));
      if (!list) return;
      var thumbs = list.classList.contains('thumbs');
      list.innerHTML = files.map(function (f, i) {
        var ext = (f.name.split('.').pop() || '').toUpperCase().slice(0, 4), img = /^(JPE?G|PNG|GIF|WEBP|AVIF)$/.test(ext) && (f.url || f.src);
        if (thumbs) return '<li>' + (img ? '<img src="' + img + '" alt="' + esc(f.name) + '">' : '<span class="files__ext" style="width:100%;height:100%;border-radius:0">' + esc(ext) + '</span>') + (i === 0 && o.first ? '<em>' + esc(o.first) + '</em>' : '') + '<button type="button" data-i="' + i + '" aria-label="' + esc(f.name) + ' 삭제"><i class="i i-x i--14" aria-hidden="true"></i></button></li>';
        return '<li>' + (img ? '<img class="files__th" src="' + img + '" alt="">' : '<span class="files__ext">' + esc(ext) + '</span>') + '<span class="files__n">' + esc(f.name) + '</span><span class="files__s">' + fmtSize(f.size) + '</span><button type="button" class="files__x" data-i="' + i + '" aria-label="' + esc(f.name) + ' 삭제"><i class="i i-x i--16" aria-hidden="true"></i></button></li>';
      }).join('');
    }
    function add(fl) {
      Array.prototype.forEach.call(fl, function (f) {
        var ext = (f.name.split('.').pop() || '').toLowerCase();
        if (o.accept && o.accept.split(',').indexOf(ext) < 0) return err('첨부할 수 없는 파일 형식입니다. (' + f.name + ')');
        if (files.some(function (x) { return x.name === f.name && x.size === f.size; })) return err('같은 파일이 이미 첨부되어 있습니다. (' + f.name + ')');
        if (o.max && files.length >= o.max) return err('파일은 최대 ' + o.max + '개까지 첨부할 수 있습니다.');
        if (o.mb && f.size > o.mb * 1048576) return err('파일 하나는 ' + o.mb + 'MB까지 첨부할 수 있습니다. (' + f.name + ')');
        if (o.total && files.reduce(function (a, x) { return a + x.size; }, 0) + f.size > o.total * 1048576) return err('첨부 파일은 모두 합쳐 ' + o.total + 'MB까지 올릴 수 있습니다.');
        files.push({ name: f.name, size: f.size, url: /^image\//.test(f.type) ? URL.createObjectURL(f) : '' });
      });
      draw();
    }
    inp && inp.addEventListener('change', function () { add(inp.files); inp.value = ''; });
    box.addEventListener('dragover', function (e) { e.preventDefault(); box.classList.add('is-over'); });
    box.addEventListener('dragleave', function () { box.classList.remove('is-over'); });
    box.addEventListener('drop', function (e) { e.preventDefault(); box.classList.remove('is-over'); add(e.dataTransfer.files); });
    list && list.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (!b) return; files.splice(Number(b.getAttribute('data-i')), 1); draw(); });
    box._files = files; draw();
  }
  $$('[data-upl]').forEach(initUpl);

  // 글자 수
  $$('[data-count]').forEach(function (t) { var c = document.getElementById(t.getAttribute('data-count')); if (c) c.textContent = t.value.length.toLocaleString('ko-KR'); });

  // 양식 검사: form[data-check] 안의 [required] 와 data-rule. 틀린 항목마다 .fld.is-err + 안내, 첫 항목으로 이동
  var RULE = {
    email: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, '이메일 주소 형식을 확인해 주세요.'],
    phone: [/^0\d{1,2}-\d{3,4}-\d{4}$/, '전화번호 형식을 확인해 주세요.'],
    mobile: [/^01[016789]-\d{3,4}-\d{4}$/, '휴대전화 번호 형식을 확인해 주세요. (010-0000-0000)'],
    biz: [/^\d{3}-\d{2}-\d{5}$/, '사업자등록번호 10자리를 확인해 주세요.'],
    zip: [/^\d{5}$/, '우편번호 5자리를 확인해 주세요.'],
    pw: [/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/, '영문·숫자·특수문자를 모두 넣어 8~72자로 입력해 주세요.'],
    birth: [/^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/, '생년월일 8자리를 확인해 주세요. (예: 19900101)'],
    cap: [/^\d{6}$/, '자동등록방지 숫자 6자리를 입력해 주세요.']
  };
  function setErr(fld, msg) { if (!fld) return; var m = $('.fld__msg--err', fld); if (!m) { m = el('<p class="fld__msg fld__msg--err" role="alert"></p>'); fld.appendChild(m); } if (msg) m.textContent = msg; fld.classList.remove('is-ok'); fld.classList.add('is-err'); }
  function checkForm(form) {
    var first = null;
    $$('.fld', form).forEach(function (fld) {
      if (fld.offsetParent === null) return;
      var bad = null, label = (fld.getAttribute('data-name') || ($('.fld__l', fld) || {}).firstChild && $('.fld__l', fld).firstChild.textContent || '이 항목').trim();
      $$('input, select, textarea', fld).forEach(function (i) {
        if (bad || i.disabled || i.type === 'file') return;
        var v = (i.value || '').trim(), rule = i.getAttribute('data-rule');
        if (i.type === 'checkbox' || i.type === 'radio') { if (i.required && !$$('input[name="' + i.name + '"]:checked', form).length) bad = i.getAttribute('data-msg') || label + ' 항목을 선택해 주세요.'; return; }
        if (i.required && !v) bad = i.getAttribute('data-msg') || label + ' 항목을 입력해 주세요.';
        else if (v && rule && RULE[rule] && !RULE[rule][0].test(v)) bad = RULE[rule][1];
        else if (v && i.maxLength > 0 && v.length > i.maxLength) bad = '입력할 수 있는 길이(' + i.maxLength + '자)를 넘었습니다.';
        else if (i.getAttribute('data-same') && v !== (document.getElementById(i.getAttribute('data-same')) || {}).value) bad = '비밀번호가 서로 다릅니다.';
        else if (i.getAttribute('data-min') && Number(v) < Number(i.getAttribute('data-min'))) bad = i.getAttribute('data-msg-min') || label + ' 값을 확인해 주세요.';
      });
      var need = fld.getAttribute('data-need'); // 'checked' 확인 버튼을 눌러야 하는 항목
      if (!bad && need && !fld.classList.contains('is-ok')) bad = fld.getAttribute('data-need-msg') || label + ' 확인이 필요합니다.';
      if (bad) { setErr(fld, bad); if (!first) first = fld; } else fld.classList.remove('is-err');
    });
    if (first) {
      var y = first.getBoundingClientRect().top + window.pageYOffset - 150; window.scrollTo({ top: y, behavior: 'smooth' });
      var f = $('input:not([type=hidden]), select, textarea', first); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 250);
    }
    return !first;
  }
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches || !f.matches('form[data-check]')) return;
    e.preventDefault();
    if (!checkForm(f)) { var sum = f.getAttribute('data-check'); if (sum) toast(sum, { error: true }); return; }
    var btn = $('[type=submit]', f); if (btn) { btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true'); }
    setTimeout(function () {
      if (btn) { btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); }
      var ok = f.dispatchEvent(new CustomEvent('checked', { bubbles: true, cancelable: true }));
      if (!ok) return;
      var go = f.getAttribute('data-go'), done = f.getAttribute('data-done'), pop = f.getAttribute('data-done-pop');
      if (pop) openPop(pop); else if (done) toast(done);
      if (go) setTimeout(function () { location.href = go; }, done ? 900 : 0);
    }, 700);
  }, true);
  // 상태 보기용: data-err-st="키" 가 붙은 항목은 그 상태에서 오류 표시를 켠 채로 보여 준다
  $$('[data-err-st]').forEach(function (fld) { if (hit(fld.getAttribute('data-err-st'))) setErr(fld, fld.getAttribute('data-err')); });
  $$('[data-ok-st]').forEach(function (fld) { if (hit(fld.getAttribute('data-ok-st'))) fld.classList.add('is-ok'); });
  $$('[data-busy-st]').forEach(function (b) { if (hit(b.getAttribute('data-busy-st'))) { b.classList.add('is-busy'); b.setAttribute('aria-busy', 'true'); } });

  // 복사
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var t = b.getAttribute('data-copy');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(b.getAttribute('data-copy-ok') || '복사했습니다.'); }, function () { toast(b.getAttribute('data-copy-fail') || '복사하지 못했습니다. 직접 선택해 복사해 주세요.', { error: true }); });
  });
  // 기간 빠른 선택: [data-range="7|30|90"] → 가까운 form 의 날짜 두 칸(오늘까지)
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-range]'); if (!b) return;
    var box = b.closest('[data-period]') || document, d = $$('input[type=date]', box), n = Number(b.getAttribute('data-range'));
    var to = new Date(Date.UTC(2026, 10, 17)), from = new Date(to.getTime() - n * 86400000), iso = function (x) { return x.toISOString().slice(0, 10); }; // 견본 기준일 2026-11-17
    if (d[0]) d[0].value = iso(from); if (d[1]) d[1].value = iso(to);
    $$('[data-range]', box).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    box.dispatchEvent(new CustomEvent('period', { bubbles: true }));
  });
  // 관심상품 담기·빼기: 같은 상품 표시가 모두 함께 바뀐다. 비로그인은 안내 후 로그인으로
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-like], .act--like'); if (!b) return;
    e.preventDefault();
    if (auth !== 'member') { toast('관심상품은 로그인 후 이용할 수 있습니다.', { action: '로그인', onAction: function () { location.href = 'login.html?return=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); } }); return; }
    if (S['like-fail']) { toast('관심상품을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true }); return; }
    var card = b.closest('[data-key]'), key = b.getAttribute('data-like') || (card && card.getAttribute('data-key')), on = b.getAttribute('aria-pressed') !== 'true';
    var same = key ? $$('[data-like="' + key + '"], [data-key="' + key + '"] .act--like') : [b];
    same.forEach(function (x) { x.setAttribute('aria-pressed', String(on)); x.setAttribute('aria-label', on ? '관심상품에서 빼기' : '관심상품 담기'); });
    b.dispatchEvent(new CustomEvent('like', { bubbles: true, detail: { key: key, on: on } }));
    toast(on ? '관심상품에 담았습니다.' : '관심상품에서 뺐습니다.', on ? { action: '보기', onAction: function () { location.href = 'mypage.html?section=wishlist'; } } : null);
  });
  // 상태 보기용: 관심상품 안내를 바로 띄운다
  if (S['like-guest']) setTimeout(function () { toast('관심상품은 로그인 후 이용할 수 있습니다.', { action: '로그인', ms: 60000, onAction: function () { location.href = 'login.html'; } }); }, 300);
  if (S['like-fail']) setTimeout(function () { toast('관심상품을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true, ms: 60000 }); }, 300);
  if (S['like-none']) setTimeout(function () { toast('판매가 끝났거나 없는 상품이라 관심상품에 담을 수 없습니다.', { error: true, ms: 60000 }); }, 300);
  if (S['like-done']) setTimeout(function () { toast('관심상품에 담았습니다.', { action: '보기', ms: 60000, onAction: function () { location.href = 'mypage.html?section=wishlist'; } }); }, 300);
  // 상품 사진 끌어 옮기기 막음(저장은 허용)
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG' && e.target.closest('.pc, .pd__gal, .ci')) e.preventDefault(); });

  /* ---------- 8. 부분 전환 ---------- */
  // (가) 탭: [role=tablist] 안의 [role=tab][aria-controls] ↔ [role=tabpanel]
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[role=tab][aria-controls]'); if (!t || t.closest('#siteHead, .drawer')) return;
    var listEl = t.closest('[role=tablist]'); if (!listEl) return;
    $$('[role=tab]', listEl).forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
    t.dispatchEvent(new CustomEvent('tab', { bubbles: true }));
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('[role=tab]'); if (!t || t.closest('#siteHead, .drawer') || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var all = $$('[role=tab]', t.closest('[role=tablist]')), i = all.indexOf(t), n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
    n.focus(); n.click();
  });
  // (나) 주소로 나뉘는 부분: <div data-views="tab" data-views-default="faq"> 안의 [data-view="faq"], 링크는 [data-view-link="faq"]
  $$('[data-views]').forEach(function (box) {
    var param = box.getAttribute('data-views'), def = box.getAttribute('data-views-default');
    function show(v, push) {
      var views = $$('[data-view]', box).filter(function (x) { return x.closest('[data-views]') === box; });
      if (!views.some(function (x) { return x.getAttribute('data-view') === v; })) v = def;
      views.forEach(function (x) { x.hidden = x.getAttribute('data-view') !== v; });
      $$('[data-view-link]').forEach(function (a) { if (a.getAttribute('data-view-param') && a.getAttribute('data-view-param') !== param) return; var on = a.getAttribute('data-view-link') === v || (a.getAttribute('data-view-group') || '').split(' ').indexOf(v) >= 0; if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      box.setAttribute('data-view-now', v);
      if (push) { var u = new URL(location.href); u.searchParams.set(param, v); u.searchParams.delete('state'); history.pushState({}, '', u); var top = box.getBoundingClientRect().top; if (top < 0) window.scrollTo(0, Math.max(0, top + window.scrollY - 160)); }
      box.dispatchEvent(new CustomEvent('view', { bubbles: true, detail: v }));
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-view-link]'); if (!a) return;
      if (a.getAttribute('data-view-param') && a.getAttribute('data-view-param') !== param) return;
      e.preventDefault(); e.stopPropagation(); show(a.getAttribute('data-view-link'), true);
    }, true);
    window.addEventListener('popstate', function () { show(new URLSearchParams(location.search).get(param) || def); });
    show(qs.get(param) || def);
  });

  window.SUB = { $: $, $$: $$, esc: esc, el: el, has: function (t) { return !!S[t]; }, hit: hit, tokens: tokens, auth: auth, qs: qs, member: MEMBER, tel: TEL, kakao: KAKAO,
    toast: toast, pop: openPop, closePop: closePop, confirm: confirmBox, applyState: applyState, initUpl: initUpl, checkForm: checkForm, setErr: setErr, fmtSize: fmtSize, toHtml: toHtml };
  document.dispatchEvent(new CustomEvent('sub:ready'));
})();
