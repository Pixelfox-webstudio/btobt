/* 비투비티 · 맞춤작업복 견적문의(custom-intro) · 파트너 제휴(partnership) 화면 동작 (2026-11-17)
   하는 일: 취소(이전 화면 또는 첫 화면) · 이메일 도메인 선택 · 희망 납기일 하한 · 비회원 입력 막기
           · 입력 검사(공용 SUB.checkForm + 연락처·이메일·납기 형식) · 오류 요약 · 접수 중 → 접수 완료 팝업 · 상태 보기용 견본 값 */
(function () {
  'use strict';
  var S = window.SUB; if (!S) return;
  var $ = S.$, $$ = S.$$;
  var page = document.body.getAttribute('data-page');

  /* 취소: 이 사이트 안에서 왔으면 이전 화면으로, 바깥에서 왔으면 첫 화면으로 */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cf-back]'); if (!b) return;
    e.preventDefault();
    var inside = false;
    try { inside = !!document.referrer && new URL(document.referrer).origin === location.origin && document.referrer !== location.href; } catch (x) {}
    if (inside && history.length > 1) history.back(); else location.href = 'index.html';
  });

  // 결과 안내 상자로 스크롤하고 포커스를 옮긴다(토스트는 함께 띄우지 않는다)
  function toBox(box) {
    if (!box) return;
    window.scrollTo({ top: box.getBoundingClientRect().top + window.pageYOffset - 150, behavior: 'smooth' });
    setTimeout(function () { box.focus({ preventScroll: true }); }, 320);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fire(i) { i.dispatchEvent(new Event('input', { bubbles: true })); }
  function count(i) { var c = i && document.getElementById(i.getAttribute('data-count')); if (c) c.textContent = i.value.length.toLocaleString('ko-KR'); }
  // 첨부 상자에 견본 파일 넣기(상태 보기용): 상자를 새로 만들어 공용 첨부 동작을 다시 붙인다
  function setFiles(box, list) {
    if (!box) return;
    var nb = box.cloneNode(true), ul = box.parentNode.querySelector('.files'), nu = ul && ul.cloneNode(false);
    nb.setAttribute('data-files', JSON.stringify(list));
    box.parentNode.replaceChild(nb, box); if (ul) ul.parentNode.replaceChild(nu, ul);
    S.initUpl(nb);
  }

  if (page === 'custom-intro') custom();
  if (page === 'partnership') partner();

  /* ---------- 맞춤작업복 견적문의 ---------- */
  function custom() {
    var form = $('#cfForm'); if (!form) return;
    var F = form.elements, fs = $('.cf-fs', form), sum = $('#cfSum'), sumList = $('.cf-sum__list', sum);
    var t = new Date(); t.setDate(t.getDate() + 1);
    var minDue = iso(t); F.due.min = minDue;   // 오늘 이후만

    // 이메일 도메인: 고르면 칸을 채우고 잠근다. "직접 입력"이면 비우고 연다
    F.mail3.addEventListener('change', function () {
      if (F.mail3.value) { F.mail2.value = F.mail3.value; F.mail2.readOnly = true; }
      else { F.mail2.readOnly = false; F.mail2.value = ''; F.mail2.focus(); }
      fire(F.mail2);
    });

    // 비회원: 칸은 보이되 모두 입력 불가, 회원 정보 칸은 비운다
    if (S.auth !== 'member') {
      ['company', 'name', 'tel2', 'tel3', 'mail1', 'mail2'].forEach(function (n) { F[n].value = ''; F[n].removeAttribute('data-sample'); });
      fs.disabled = true;
    }

    // 상태 보기용 견본 입력
    var SAMPLE = { goods: '동계 작업복 상하의, 작업 조끼', qty: '300', due: '2026-12-18',
      memo: '상의는 네이비 바탕에 왼쪽 가슴 로고 자수, 등판에 회사명 인쇄를 원합니다.\n팔과 허리에 반사띠를 넣어 주세요. 사이즈별 수량은 견적을 받은 뒤 정하겠습니다.' };
    var upl = $('.upl', form);
    if (S.hit('busy done fail expired')) {
      F.goods.value = SAMPLE.goods; F.qty.value = SAMPLE.qty; F.due.value = SAMPLE.due; F.memo.value = SAMPLE.memo;
      F.sample[0].checked = true; F.agree.checked = true;
      [F.goods, F.memo].forEach(count);
      setFiles(upl, [['한결산업_로고.png', 1260000], ['작업복_디자인_요청.pdf', 3420000]]);
      $$('input, select, textarea', form).forEach(function (i) { if (i.type !== 'file') i.setAttribute('data-sample', ''); });
    }
    if (S.has('busy')) { var cb = $('[data-cf-back]', form); cb.disabled = true; }
    var rej = $('.cf-rej', form);
    if (S.has('err')) {
      F.company.value = ''; F.name.value = ''; F.tel2.value = '12'; F.mail2.value = 'example'; F.qty.value = '50'; F.due.value = '2026-11-10';
      $('.cf-tel', form).classList.add('has-bad'); F.tel2.classList.add('cf-bad');
      $('.cf-mail', form).classList.add('has-bad'); F.mail2.classList.add('cf-bad');
      // 이미 5개(합계 88.2MB)를 붙인 뒤 4개를 더 끌어다 놓은 경우: 첨부하지 못한 파일 3개는 .cf-rej 에 이유와 함께 보인다
      setFiles(upl, [['로고_원본.zip', 18664653], ['앞면_디자인.pdf', 20342374], ['뒷면_디자인.pdf', 19818086], ['작업복_시안.pptx', 20552090], ['원단_색상표.pdf', 13107200]]);
    }
    // 파일을 다시 고르거나 빼면 첨부하지 못한 파일 안내는 지운다
    form.addEventListener('upl:change', function () { if (rej) rej.classList.remove('st-on'); });

    // 오류 요약: 지금 오류가 난 칸마다 한 줄(첨부하지 못한 파일은 파일마다 한 줄), 누르면 그 칸으로
    function draw(go) {
      var bad = $$('.fld.is-err', form).filter(function (f) { return f.offsetParent !== null; });
      sum.hidden = !bad.length;
      sumList.innerHTML = bad.map(function (f, n) {
        var m = $('.fld__msg--err', f), inp = $('input.cf-bad', f) || $('input:not([type=hidden]):not([type=file]), select, textarea', f) || $('input[type=file]', f);
        if (inp && !inp.id) inp.id = 'cfErr' + n;
        var href = '#' + (inp ? inp.id : ''), rows = $$('.cf-rej.st-on li', f);
        if (rows.length) return rows.map(function (r) {
          return '<li><a href="' + href + '">' + S.esc($('.cf-rej__m', r).textContent + ' (' + $('.cf-rej__n', r).textContent + ')') + '</a></li>';
        }).join('');
        return '<li><a href="' + href + '">' + S.esc(m ? m.textContent : '') + '</a></li>';
      }).join('');
      if (go && bad.length) toBox(sum);
    }
    sumList.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return; e.preventDefault();
      var el = document.getElementById(a.getAttribute('href').slice(1)); if (!el) return;
      var f = el.closest('.fld');
      window.scrollTo({ top: f.getBoundingClientRect().top + window.pageYOffset - 150, behavior: 'smooth' });
      setTimeout(function () { el.focus({ preventScroll: true }); }, 300);
    });
    // 고치면 그 칸 오류가 사라지므로(공용 동작) 요약도 다시 그린다
    ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, function (e) {
      if (e.target.closest('.cf-tel, .cf-mail') && !e.target.closest('.fld').classList.contains('is-err')) e.target.classList.remove('cf-bad');
      if (!sum.hidden) setTimeout(function () { draw(false); }, 0);
    }); });

    // 공용 검사 뒤에 묶음 칸 형식을 더 본다
    function extra() {
      var good = true;
      $$('.cf-bad', form).forEach(function (x) { x.classList.remove('cf-bad'); });
      $$('.has-bad', form).forEach(function (x) { x.classList.remove('has-bad'); });
      var telF = F.tel2.closest('.fld');
      if (!telF.classList.contains('is-err')) {
        var b2 = !/^\d{3,4}$/.test(F.tel2.value), b3 = !/^\d{4}$/.test(F.tel3.value);
        if (b2 || b3) {
          S.setErr(telF, '연락처 형식을 확인해 주세요. 가운데 3~4자리, 끝 4자리 숫자입니다.'); good = false;
          $('.cf-tel', form).classList.add('has-bad'); if (b2) F.tel2.classList.add('cf-bad'); if (b3) F.tel3.classList.add('cf-bad');
        }
      }
      var id = F.mail1.value.trim(), dom = F.mail2.value.trim();
      if ((id || dom) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(id + '@' + dom)) {
        S.setErr(F.mail1.closest('.fld'), '이메일 주소 형식을 확인해 주세요.'); good = false;
        $('.cf-mail', form).classList.add('has-bad');
        if (!/^[^\s@]+$/.test(id)) F.mail1.classList.add('cf-bad');
        if (!/^[^\s@]+\.[^\s@]{2,}$/.test(dom)) F.mail2.classList.add('cf-bad');
      }
      if (F.due.value && F.due.value < minDue) { S.setErr(F.due.closest('.fld'), '희망 납기일은 내일 이후 날짜로 골라 주세요.'); good = false; }
      return good;
    }

    var btn = $('button[type=submit]', form), wait = $('[data-cf-busy]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (S.auth !== 'member' || fs.disabled || btn.classList.contains('is-busy')) return;
      var ok = S.checkForm(form);
      ok = extra() && ok;
      draw(!ok);
      if (!ok) return;
      btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true'); wait.classList.add('st-on');
      setTimeout(function () {
        btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); wait.classList.remove('st-on');
        $$('[data-cf-echo]').forEach(function (n) { var v = F[n.getAttribute('data-cf-echo')]; if (v && v.value) n.textContent = n.getAttribute('data-cf-echo') === 'qty' ? Number(v.value).toLocaleString('ko-KR') : v.value; });
        S.pop('cfDone');
      }, 900);
    });

    if (S.has('err')) draw(false);
  }

  /* ---------- 파트너 제휴 ---------- */
  function partner() {
    var form = $('#ptForm'); if (!form) return;
    var F = form.elements, btn = $('button[type=submit]', form);
    function box(k) { return $('[data-pt-msg="' + k + '"]', form); }
    if (S.has('err')) F.email.value = 'partner@example';
    // 제출: 틀린 칸이 있으면 칸마다 안내 + 양식 위 안내 상자로 이동. 통과하면 접수 완료 안내와 함께 이 페이지로 돌아온다
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.classList.contains('is-busy')) return;
      $$('[data-pt-msg]', form).forEach(function (m) { m.classList.remove('st-on'); });
      if (!S.checkForm(form)) { var b = box('err'); b.classList.add('st-on'); toBox(b); return; }
      btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
      setTimeout(function () { location.href = 'partnership.html?state=done&sent=1'; }, 700);
    });
    // 제출 직후 돌아왔을 때만 완료 안내로 이동(상태 보기 주소로 열면 움직이지 않는다)
    if (S.has('done') && S.qs.get('sent')) setTimeout(function () { toBox(box('done')); }, 300);
    if (S.hit('rate fail')) {
      F.tel.value = '01098765432'; F.email.value = 'sales@example.com';
      F.memo.value = '안녕하세요. 부산에서 작업복 원단을 만드는 업체입니다.\n방풍·발수 원단 공급을 제안드리고 싶습니다. 회사 소개서와 원단 견본 목록은 이메일로 보내 드리겠습니다.';
      count(F.memo);
      $$('input, textarea', form).forEach(function (i) { i.setAttribute('data-sample', ''); });
    }
  }
})();
