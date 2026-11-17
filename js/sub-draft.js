/* 비투비티 · 시안 확인(draft-preview) · 견적문의 시안 보기(inquiry-draft) (2026-11-17)
   하는 일: 1 견본 시안·품목 그리기(품목이 둘 이상이면 품목별로 묶고, 품목에 연결되지 않은 시안은 '공통 시안') · 2 크게 보기(←→, 원본 열기)
           · 3 승인 · 수정 요청(확인 창을 거쳐 결과 상태로 이동) */
(function () {
  'use strict';
  function run() {
    var S = window.SUB; if (!S) return;
    var $ = S.$, esc = S.esc;
    var page = document.body.getAttribute('data-page');
    function won(n) { return n.toLocaleString('ko-KR') + '원'; }

    /* ---------- 1. 견본 값(운영하면서 채워질 자리) ---------- */
    var IT = {
      pad: { name: '방한 후드 패딩', opt: '블랙 · 자수 인쇄(왼쪽 가슴, 등) · 개별 폴리백', qty: 70 },
      vest: { name: '웰론 보온 겨울조끼', opt: '네이비 · 인쇄 없음 · 기본 포장', qty: 30 },
      k2: { name: '케이투 JK-F6101', opt: '인쇄 없음', qty: 12 }
    };
    // [품목 키('' = 품목에 연결되지 않은 시안), 이미지, 폭, 높이, 파일 이름]
    var SETS = {
      order: [['pad', 'img/catalog/460-f.webp', 600, 600, '패딩_앞면_왼쪽가슴자수.jpg'], ['pad', 'img/catalog/460-b.webp', 600, 600, '패딩_등판_자수.jpg'],
        ['vest', 'img/catalog/195-f.webp', 600, 600, '조끼_앞면.jpg'], ['vest', 'img/catalog/195-b.webp', 600, 600, '조끼_뒷면.jpg'],
        ['', 'img/products/465-2.webp', 800, 800, '공통_색상_비교.jpg']],
      single: [['pad', 'img/catalog/460-f.webp', 600, 600, '패딩_앞면_왼쪽가슴자수.jpg'], ['pad', 'img/catalog/460-b.webp', 600, 600, '패딩_등판_자수.jpg']],
      quote: [['', 'img/catalog/460-f.webp', 600, 600, '방한후드패딩_앞면_시안.jpg'], ['', 'img/catalog/460-b.webp', 600, 600, '방한후드패딩_뒷면_시안.jpg']],
      custom: [['', 'img/products/463-3.webp', 800, 800, '동계점퍼_블랙_앞면.jpg'], ['', 'img/products/463-4.webp', 800, 800, '동계점퍼_네이비_앞면.jpg']]
    };
    var list, grouped = false, items = [], viewName = '';
    if (page === 'draft-preview') {
      var single = S.has('single');
      list = single ? SETS.single : SETS.order;
      items = single ? ['pad'] : ['pad', 'vest', 'k2'];
      grouped = items.length > 1;
    } else {
      list = S.has('empty') ? [] : S.has('custom') ? SETS.custom : SETS.quote;
      viewName = S.has('custom') ? '동계 작업 점퍼(기업 로고 자수)' : '방한 후드 패딩';
    }

    function fig(d, i) {
      return '<li class="dv-fig"><button type="button" class="dv-fig__btn" data-dv-i="' + i + '" aria-label="시안 ' + (i + 1) + ' 크게 보기">' +
        '<img src="' + d[1] + '" alt="시안 ' + (i + 1) + ' ' + esc(d[4]) + '" width="' + d[2] + '" height="' + d[3] + '" decoding="async"' + (i > 1 ? ' loading="lazy"' : '') + ' data-slot="draft-image" data-sample>' +
        '<span class="dv-fig__no" aria-hidden="true">' + (i + 1) + '</span><span class="dv-fig__zoom" aria-hidden="true"><i class="i i-zoom i--18"></i></span></button>' +
        '<p class="dv-fig__cap" data-sample><b>시안 ' + (i + 1) + '</b><span>' + esc(d[4]) + '</span></p></li>';
    }
    function groups() {
      var idx = list.map(function (d, i) { return [d, i]; });
      if (!grouped) return '<ul class="dv-grid dv-grp--one">' + idx.map(function (x) { return fig(x[0], x[1]); }).join('') + '</ul>';
      var keys = items.filter(function (k) { return list.some(function (d) { return d[0] === k; }); });
      if (list.some(function (d) { return !d[0]; })) keys.push('');
      return keys.map(function (k, gi) {
        var g = idx.filter(function (x) { return x[0][0] === k; }), it = IT[k];
        var head = it
          ? '<h3 class="dv-grp__t" id="dvG' + gi + '">' + esc(it.name) + '</h3><p class="dv-grp__m">' + esc(it.opt) + ' · <span class="num">' + it.qty + '</span>벌</p>'
          : '<h3 class="dv-grp__t" id="dvG' + gi + '">공통 시안</h3><p class="dv-grp__m">특정 품목에 연결되지 않은 시안입니다.</p>';
        return '<section class="dv-grp" aria-labelledby="dvG' + gi + '"' + (it ? '' : ' data-common') + '><header class="dv-grp__h"><div>' + head + '</div><span class="dv-grp__c">시안 <b class="num">' + g.length + '</b>장</span></header>' +
          '<ul class="dv-grid">' + g.map(function (x) { return fig(x[0], x[1]); }).join('') + '</ul></section>';
      }).join('');
    }
    var box = $('#dvGroups');
    if (box && list.length) box.innerHTML = groups();
    var cnt = $('#dvCnt'); if (cnt) cnt.textContent = list.length;

    // 시안확인(주문): 머리 줄 · 견적 요약
    if (page === 'draft-preview') {
      var total = items.reduce(function (a, k) { return a + IT[k].qty; }, 0);
      var hi = $('#dvHeadItems'); if (hi) hi.textContent = items.length + '개 · ' + total + '벌';
      var hk = $('#dvHeadKind'); if (hk) hk.textContent = S.has('draft-only') ? '시안 ' + list.length + '장' : '시안 ' + list.length + '장 · 견적';
      var ul = $('#dvItems');
      if (ul) ul.innerHTML = items.map(function (k) {
        var it = IT[k];
        return '<li><span class="dv-items__n">' + esc(it.name) + '</span><span class="dv-items__o">' + esc(it.opt) + '</span><span class="dv-items__q num">' + it.qty + '벌</span></li>';
      }).join('');
      if (single) { $('#dvAmt').textContent = won(4543000); $('#dvSupply').textContent = won(4130000); }
      if (S.has('draft-only')) { var dv = $('#dv'); if (dv) dv.classList.add('dv--nosum'); }
    }
    // 견적문의 시안 보기: 상품명 · 시안 수
    if (page === 'inquiry-draft') {
      var pn = $('#dvProd'); if (pn) pn.textContent = viewName;
      var pc = $('#dvInfoCnt'); if (pc) pc.textContent = list.length ? list.length + '장' : '없음';
    }

    /* ---------- 2. 크게 보기 ---------- */
    var view = $('#dvView'), cur = 0;
    function show(i) {
      if (!list.length) return;
      cur = (i + list.length) % list.length;
      var d = list[cur], img = $('#dvViewImg');
      img.src = d[1]; img.width = d[2]; img.height = d[3]; img.alt = '시안 ' + (cur + 1) + ' ' + d[4];
      var where = d[0] && IT[d[0]] ? IT[d[0]].name : (page === 'draft-preview' && grouped ? '공통 시안' : viewName);
      $('#dvViewName').textContent = '시안 ' + (cur + 1) + (where ? ' · ' + where : '');
      $('#dvViewN').textContent = (cur + 1) + ' / ' + list.length;
      $('#dvViewFile').textContent = d[4];
      $('#dvViewOrig').href = d[1];
      $('#dvViewOrig').setAttribute('aria-label', d[4] + ' 원본 보기 (새 창)');
      Array.prototype.forEach.call(view.querySelectorAll('[data-dv-dir]'), function (b) { b.hidden = list.length < 2; });
    }
    if (view) {
      show(0);
      document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-dv-i]');
        if (b) { show(Number(b.getAttribute('data-dv-i'))); S.pop(view, b); return; }
        var n = e.target.closest && e.target.closest('[data-dv-dir]');
        if (n) show(cur + Number(n.getAttribute('data-dv-dir')));
      });
      document.addEventListener('keydown', function (e) {
        if (view.hidden) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      });
    }

    /* ---------- 3. 승인 · 수정 요청 ---------- */
    if (page !== 'draft-preview') return;
    var only = S.has('draft-only'), ap = $('#dvApprove'), rv = $('#dvRevise'), memo = $('#dvMemo');
    if (S.has('changed')) { if (ap) ap.disabled = true; if (rv) rv.disabled = true; }
    ap && ap.addEventListener('click', function () {
      S.confirm({
        title: only ? '시안을 승인할까요?' : '시안과 견적을 승인할까요?',
        desc: only ? '승인하면 담당자가 이 시안으로 견적을 준비합니다.' : '승인하면 주문이 견적 완료 상태로 바뀌고 결제를 진행할 수 있습니다.',
        ok: '승인하기', cancel: '다시 보기', icon: 'check',
        onOk: function () { location.href = 'draft-preview.html?state=' + (only ? 'approved-draft' : 'approved'); }
      });
    });
    rv && rv.addEventListener('click', function () {
      var fld = memo.closest('.fld'), v = memo.value.trim();
      if (!v) { S.setErr(fld, '수정할 내용을 적어 주세요.'); memo.focus(); return; }
      S.confirm({
        title: '수정 요청을 보낼까요?',
        desc: '보내면 주문이 접수 대기 상태로 돌아가고, 담당자가 요청 내용을 보고 시안을 다시 올립니다.',
        ok: '수정 요청 보내기', cancel: '닫기', icon: 'pen',
        onOk: function () { try { sessionStorage.setItem('b2bt-draft-memo', v); } catch (e) {} location.href = 'draft-preview.html?state=revised'; }
      });
    });
    // 수정 요청 보냄: 방금 적은 내용이 있으면 그것을 보여 준다(없으면 견본)
    if (S.has('revised')) {
      var sent = null; try { sent = sessionStorage.getItem('b2bt-draft-memo'); sessionStorage.removeItem('b2bt-draft-memo'); } catch (e) {}
      if (sent) $('#dvSent').textContent = sent;
    }
  }
  if (window.SUB) run(); else document.addEventListener('sub:ready', run);
})();
