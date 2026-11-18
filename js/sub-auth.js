/* 비투비티 로그인·회원가입 · sub-auth.js (2026-11-17)
   login · signup · signup-general · signup-business · signup-general-info · signup-business-info 가 함께 쓴다.
   하는 일: 1 보던 페이지(?return=) 이어 가기 · 2 간편 로그인·가입 버튼 · 3 로그인 · 4 회원 유형 선택
           · 5 정보 입력(중복확인 · 사업자등록번호 확인 · 사업자등록증 첨부·미리보기 · 주소 검색 · 자동등록방지 · 가입 전 확인 · 가입)
   서버 연결은 없다. 결과는 화면 안에서만 바뀐다(견본 값은 spec/agent-brief.md 7.4). */
(function () {
  'use strict';
  function boot() {
    var S = window.SUB; if (!S) return;
    var $ = S.$, $$ = S.$$, esc = S.esc, qs = S.qs;
    var body = document.body, page = body.getAttribute('data-page') || '';

    /* ---------- 1. 보던 페이지 이어 가기: ?return=cart.html ---------- */
    var ret = qs.get('return') || '';
    if (!/^[a-z0-9-]+\.html(\?[^#<>"']*)?$/i.test(ret)) ret = '';
    var RET_NAME = { cart: '장바구니', product: '상품 상세', order: '주문서', 'order-now': '주문 정보 입력', quote: '견적문의', 'quote-intro': '견적문의', 'custom-intro': '맞춤작업복 견적문의',
      mypage: '마이페이지', category: '상품 목록', brand: '협력브랜드', search: '검색 결과', 'customer-center': '고객센터', 'draft-preview': '시안확인', index: '첫 화면' };
    var retName = ret ? (RET_NAME[ret.split(/[.?]/)[0]] || '보던 페이지') : '';
    function ro(w) { var c = w.charCodeAt(w.length - 1) - 0xAC00, j = c >= 0 && c <= 11171 ? c % 28 : 0; return w + (j && j !== 8 ? '으로' : '로'); }   // 받침에 맞춘 조사
    function withRet(u) { return ret ? u + (u.indexOf('?') < 0 ? '?' : '&') + 'return=' + encodeURIComponent(ret) : u; }
    $$('[data-ret-name]').forEach(function (n) { n.textContent = retName; });
    $$('[data-ret]').forEach(function (n) { n.hidden = !ret; });
    $$('[data-no-ret]').forEach(function (n) { if (ret) n.hidden = true; });
    $$('[data-keep]').forEach(function (a) { var k = a.hasAttribute('data-href') ? 'data-href' : 'href'; a.setAttribute(k, withRet(a.getAttribute(k))); });

    /* ---------- 2. 간편 로그인·가입 ---------- */
    var SNS = { google: 'Google', kakao: '카카오', naver: '네이버' };
    var sns = SNS[qs.get('social')] ? qs.get('social') : 'kakao';
    $$('[data-sns-name]').forEach(function (n) { n.textContent = SNS[sns]; });
    var social = !!qs.get('social') && page === 'signup';   // 로그인에서 처음 간편 로그인한 사람: 유형을 고르면 정보 입력으로
    function memberType() { var r = $('input[name="mtype"]:checked'); return r ? r.value : 'business'; }
    function snsTarget(k) {
      if (page === 'login') return 'signup.html?social=' + k;
      var t = page === 'signup' ? memberType() : page === 'signup-general' ? 'general' : 'business';
      return 'signup-' + t + '-info.html?state=social&social=' + k;
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-sns]'); if (!b) return;
      e.preventDefault();
      var k = b.getAttribute('data-sns');
      b.classList.add('is-busy'); b.setAttribute('aria-busy', 'true');
      S.toast(SNS[k] + ' 계정 확인 화면으로 이동합니다.');
      setTimeout(function () { location.href = withRet(snsTarget(k)); }, 500);
    });

    /* ---------- 3. 로그인 ---------- */
    if (page === 'login') {
      var lf = $('#auLogin');
      if (lf) {
        if (S.hit('mismatch locked blocked neterr busy')) { lf.elements.uid.value = 'mjkim'; lf.elements.pw.value = 'sample-pass'; }
        if (S.has('mismatch')) lf.elements.pw.value = '';
        var DEMO = ['mjkim', 'mj.kim@example.com', 'seoyeon', 'seoyeon@example.com'];
        lf.addEventListener('checked', function (e) {
          e.preventDefault();
          var id = lf.elements.uid.value.trim().toLowerCase();
          if (DEMO.indexOf(id) < 0) {
            $$('[data-au-msg]').forEach(function (m) { m.classList.toggle('st-on', m.getAttribute('data-au-msg') === 'mismatch'); });
            lf.elements.pw.value = ''; lf.elements.pw.focus();
            return;
          }
          S.toast('로그인했습니다.');
          setTimeout(function () { location.href = ret || 'index.html'; }, 700);
        });
      }
      $$('[data-go-ret]').forEach(function (a) { if (ret) { a.setAttribute('href', ret); a.textContent = ro(retName) + ' 이동'; } });
    }

    /* ---------- 4. 회원 유형 선택 ---------- */
    if (page === 'signup') {
      var radios = $$('input[name="mtype"]');
      if (S.has('general') || qs.get('type') === 'general') radios.forEach(function (r) { r.checked = r.value === 'general'; });
      $$('[data-social]').forEach(function (n) { n.hidden = !social; });
      $$('[data-no-social]').forEach(function (n) { if (social) n.hidden = true; });
      var sync = function () {
        var t = memberType();
        var go = $('#auGo'), mail = $('#auMail');
        if (go) go.setAttribute('data-href', withRet(social ? 'signup-' + t + '-info.php?state=social&social=' + sns : 'signup-' + t + '.php'));
        if (mail) mail.setAttribute('data-href', withRet('signup-' + t + '-info.php'));
        $$('[data-type-name]').forEach(function (n) { n.textContent = t === 'general' ? '일반 회원' : '기업 회원'; });
      };
      radios.forEach(function (r) { r.addEventListener('change', sync); });
      sync();
    }

    /* ---------- 5. 정보 입력 ---------- */
    var kind = page === 'signup-business-info' ? 'biz' : page === 'signup-general-info' ? 'gen' : '';
    if (!kind) return;
    var form = $('#auJoin'); if (!form) return;
    var E = form.elements;
    function inp(name) { var i = E[name]; return i && typeof RadioNodeList !== 'undefined' && i instanceof RadioNodeList ? i[0] : i; }
    function fld(name) { var i = inp(name); return i ? i.closest('.fld') : null; }
    function setOk(f, msg) { if (!f) return; f.classList.remove('is-err'); f.classList.add('is-ok'); var m = $('.fld__msg--ok', f); if (m && msg) m.textContent = msg; }
    function clear(f) { if (f) f.classList.remove('is-ok', 'is-err'); }
    function fill(o) {
      Object.keys(o).forEach(function (k) {
        var i = E[k]; if (!i) return;
        if (typeof RadioNodeList !== 'undefined' && i instanceof RadioNodeList) { Array.prototype.forEach.call(i, function (r) { r.checked = r.value === o[k]; }); return; }
        if (i.type === 'checkbox') i.checked = !!o[k]; else i.value = o[k];
      });
    }

    // 자동등록방지: 숫자 6자리 그림(시안에서는 글자로 그린다).
    // 틀리거나 유효 시간이 지나면 그림을 자동으로 바꾸고(.au-cap--new: "새 그림" 표시), 여러 번 틀리면 잠시 잠근다.
    var capImg = $('[data-au-cap]', form), capFld = fld('cap'), capRe = $('[data-au="cap"]', form);
    var CAP_TTL = 10 * 60 * 1000, CAP_MAX = 5, CAP_WAIT = 30 * 1000;   // 시안용 값(화면에 숫자로 적지 않는다)
    var capAt = Date.now(), capMiss = 0, capLocked = false;
    function code() { return capImg ? capImg.textContent.trim() : ''; }
    function newCode(fixed, mark) {
      var c = fixed || ''; if (!c) for (var k = 0; k < 6; k++) c += Math.floor(Math.random() * 10);
      if (capImg) capImg.textContent = c;
      capAt = Date.now(); if (inp('cap')) inp('cap').value = '';
      if (capFld) capFld.classList.toggle('au-cap--new', !!mark);
    }
    function capLock(on) {
      capLocked = on; if (capFld) capFld.classList.toggle('au-cap--lock', on);
      if (inp('cap')) inp('cap').disabled = on; if (capRe) capRe.disabled = on;
    }
    var CAP_LIMIT = ' 여러 번 틀리면 잠시 입력할 수 없습니다.';
    var CAP_BAD = '숫자가 맞지 않아 새 그림으로 바꿨습니다. 새 숫자를 입력해 주세요.' + CAP_LIMIT;
    var CAP_EXP = '숫자 그림의 유효 시간이 지나 새 그림으로 바꿨습니다. 새 숫자를 입력해 주세요.' + CAP_LIMIT;
    var CAP_LOCK = '숫자를 여러 번 틀려 잠시 입력할 수 없습니다. 잠시 뒤에 새 그림이 나오면 다시 입력해 주세요.';

    // 사업자등록번호 규칙 검사(국세청 조회 아님). 견본 번호 123-45-67890 은 시안에서 통과시킨다.
    function bizOk(d) {
      if (d === '1234567890') return true;
      var w = [1, 3, 7, 1, 3, 7, 1, 3, 5], s = 0;
      for (var k = 0; k < 9; k++) s += Number(d[k]) * w[k];
      s += Math.floor(Number(d[8]) * 5 / 10);
      return (10 - s % 10) % 10 === Number(d[9]);
    }
    var TAKEN = ['admin', 'b2bt', 'noeul', 'test', 'manager'];   // 시안용: 이미 쓰는 아이디
    var PW = [['en', /[A-Za-z]/], ['num', /\d/], ['sp', /[^A-Za-z0-9]/], ['len', /^.{8,72}$/]];
    function pwRules() {
      var v = (inp('pw') || {}).value || '';
      $$('.au-rules li', form).forEach(function (li) { var r = PW.filter(function (x) { return x[0] === li.getAttribute('data-r'); })[0]; li.classList.toggle('is-ok', !!(r && v && r[1].test(v))); });
      return PW.every(function (x) { return x[1].test(v); });
    }
    function birthCheck(strict) {
      var i = inp('birth'); if (!i) return;
      var f = i.closest('.fld'), v = i.value;
      if (v.length < 8) { if (strict && v) S.setErr(f, '생년월일 숫자 8자리를 입력해 주세요. (예: 19900101)'); else f.classList.remove('is-ok'); return; }
      var y = +v.slice(0, 4), m = +v.slice(4, 6), d = +v.slice(6, 8), dt = new Date(y, m - 1, d), today = new Date(2026, 10, 17);
      if (y < 1900 || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d || dt > today) { S.setErr(f, '없는 날짜입니다. 생년월일을 다시 확인해 주세요. (예: 19900101)'); return; }
      setOk(f, y + '년 ' + m + '월 ' + d + '일로 확인했습니다.');
    }

    // 사업자등록증: 1개만, 새 파일은 기존 파일을 바꾼다. 미리보기는 이 파일이 그린다(sub.js 의 파일 목록은 쓰지 않음).
    var fileFld = $('#auFileFld'), box = fileFld ? $('.upl', fileFld) : null, doc = $('#auDoc');
    var ACC = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
    function preCheck(file) {
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ACC.indexOf(ext) < 0) return '이미지(JPG·PNG·GIF·WEBP)나 PDF 파일만 첨부할 수 있습니다. (' + file.name + ')';
      if (file.size > 10 * 1048576) return '10MB가 넘는 파일은 첨부할 수 없습니다. (' + file.name + ' ' + S.fmtSize(file.size) + ')';
      return '';
    }
    function files() { return (box && box._files) || []; }
    function reject(msg) {
      var had = files().length;
      S.setErr(fileFld, msg + (had ? ' 먼저 첨부한 파일은 그대로 둡니다.' : ''));
      if (had) fileFld.classList.add('is-ok');
      update();
    }
    function renderDoc() {
      if (!box || !doc) return;
      var f = files()[0], btn = $('[data-au-upl-b]', box);
      if (btn) btn.textContent = f ? '파일 바꾸기' : '파일 선택';
      doc.hidden = !f;
      if (!f) { doc.innerHTML = ''; fileFld.classList.remove('is-ok'); update(); return; }
      var ext = (f.name.split('.').pop() || '').toLowerCase(), img = /^(jpe?g|png|gif|webp)$/.test(ext) && (f.url || f.src);
      doc.innerHTML = (img ? '<button type="button" class="au-doc__th" data-pop="auDocPop" aria-label="' + esc(f.name) + ' 크게 보기"><img src="' + esc(img) + '" alt="" width="64" height="64"></button>'
        : '<span class="au-doc__pdf num" aria-hidden="true">' + esc(ext.toUpperCase()) + '</span>') +
        '<span class="au-doc__tx"><span class="au-doc__n">' + esc(f.name) + '</span><span class="au-doc__s">' + (img ? '이미지' : 'PDF') + ' · <span class="num">' + S.fmtSize(f.size) + '</span>' + (img ? '' : ' · PDF는 파일 이름만 보여 줍니다') + '</span></span>' +
        '<span class="au-doc__acts">' + (img ? '<button type="button" class="sb sb--line sb--s" data-pop="auDocPop">크게 보기</button>' : '') + '<button type="button" class="sb sb--gray sb--s" data-au="del">삭제</button></span>';
      if (img) { var pi = $('#auDocImg'), pn = $('#auDocName'); if (pi) pi.src = img; if (pn) pn.textContent = f.name; }
      if (!fileFld.classList.contains('is-err')) setOk(fileFld, '사업자등록증을 첨부했습니다. 다른 파일을 고르면 바뀝니다.');
      update();
    }
    if (box) {
      var fileIn = $('input[type=file]', box);
      document.addEventListener('change', function (e) {
        if (e.target !== fileIn || !fileIn.files || !fileIn.files.length) return;
        var m = preCheck(fileIn.files[0]);
        if (m) { e.stopImmediatePropagation(); fileIn.value = ''; reject(m); return; }
        files().length = 0; fileFld.classList.remove('is-err');
      }, true);
      document.addEventListener('drop', function (e) {
        if (!box.contains(e.target)) return;
        var fl = e.dataTransfer && e.dataTransfer.files; if (!fl || !fl.length) return;
        var m = fl.length > 1 ? '사업자등록증은 파일 1개만 첨부합니다.' : preCheck(fl[0]);
        if (m) { e.preventDefault(); e.stopImmediatePropagation(); box.classList.remove('is-over'); reject(m); return; }
        files().length = 0; fileFld.classList.remove('is-err');
      }, true);
      box.addEventListener('upl:change', renderDoc);
    }

    // 버튼: 중복확인 · 사업자등록번호 확인 · 주소 검색 · 자동등록방지 새로 받기 · 첨부 삭제
    function busyBtn(b, fn) { b.classList.add('is-busy'); b.setAttribute('aria-busy', 'true'); setTimeout(function () { b.classList.remove('is-busy'); b.removeAttribute('aria-busy'); fn(); update(); }, 450); }
    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-au]'); if (!b) return;
      var a = b.getAttribute('data-au');
      if (a === 'id') {
        var v = inp('uid').value.trim(), f = fld('uid');
        if (!v) { S.setErr(f, '아이디를 입력해 주세요.'); inp('uid').focus(); return; }
        if (!/^[a-z0-9]{4,20}$/.test(v)) { S.setErr(f, '영문 소문자·숫자 4~20자로 입력해 주세요.'); return; }
        busyBtn(b, function () { if (TAKEN.indexOf(v) >= 0) S.setErr(f, '이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.'); else setOk(f, '사용할 수 있는 아이디입니다.'); });
      } else if (a === 'biz') {
        var d = inp('bizno').value.replace(/\D/g, ''), bf = fld('bizno');
        if (d.length < 10) { S.setErr(bf, '사업자등록번호 10자리를 모두 입력해 주세요. (지금 ' + d.length + '자리)'); inp('bizno').focus(); return; }
        busyBtn(b, function () { if (bizOk(d)) setOk(bf, '올바른 사업자등록번호입니다.'); else S.setErr(bf, '유효하지 않은 사업자등록번호입니다. 번호를 다시 확인해 주세요.'); });
      } else if (a === 'addr') {
        // 외부 우편번호 서비스 자리: 시안에서는 견본 주소를 넣는다
        inp('zip').value = '48058'; inp('addr').value = '부산광역시 해운대구 센텀중앙로 97';
        clear(fld('zip')); setOk(fld('zip'));
        S.toast('주소를 넣었습니다. 상세주소를 입력해 주세요.');
        inp('addr2').focus(); update();
      } else if (a === 'cap') {
        if (capLocked) return;
        newCode(); clear(capFld); inp('cap').focus(); update();
      } else if (a === 'del') {
        files().length = 0; clear(fileFld); renderDoc();
      }
    });
    // 입력이 바뀌면: 아이디·사업자번호 결과 초기화, 비밀번호 규칙, 일치 표시, 생년월일
    form.addEventListener('input', function (e) {
      var t = e.target, n = t.name;
      if (n === 'uid' || n === 'bizno') clear(t.closest('.fld'));
      if (n === 'pw' || n === 'pw2') {
        var ok = pwRules(), pf = fld('pw'), cf = fld('pw2'), v1 = inp('pw').value, v2 = inp('pw2').value;
        if (ok) pf.classList.remove('is-err');
        if (v2 && v1 === v2) setOk(cf, '비밀번호가 일치합니다.'); else { cf.classList.remove('is-ok'); if (n === 'pw2') cf.classList.remove('is-err'); }
      }
      if (n === 'birth') birthCheck(false);
      if (n === 'cap') capFld.classList.remove('au-cap--new');
    });
    form.addEventListener('focusout', function (e) {
      var n = e.target.name;
      if (n === 'pw' && e.target.value && !pwRules()) S.setErr(fld('pw'), '영문·숫자·특수문자를 모두 넣어 8~72자로 입력해 주세요.');
      if ((n === 'pw2' || n === 'pw') && inp('pw2').value && inp('pw2').value !== inp('pw').value) S.setErr(fld('pw2'), '비밀번호가 서로 다릅니다.');
      if (n === 'birth') birthCheck(true);
    });

    // 가입 전 확인(오른쪽 칸): 항목별 체크
    function visible(i) { return i.offsetParent !== null || (i.closest('.fld') && i.closest('.fld').offsetParent !== null); }
    function update() {
      var req = $$('input[required], select[required], textarea[required]', form).filter(function (i) { return i.type !== 'file' && visible(i); });
      var groups = {}, total = 0, done = 0;
      req.forEach(function (i) {
        if (i.type === 'radio') { if (groups[i.name]) return; groups[i.name] = 1; total++; if ($('input[name="' + i.name + '"]:checked', form)) done++; return; }
        if (i.type === 'checkbox') { total++; if (i.checked) done++; return; }
        total++; if (i.value.trim()) done++;
      });
      set('req', total && done === total, done + ' / ' + total);
      set('id', fld('uid') && fld('uid').classList.contains('is-ok') && !fld('uid').classList.contains('is-err'));
      set('biz', fld('bizno') && fld('bizno').classList.contains('is-ok') && !fld('bizno').classList.contains('is-err'));
      set('file', files().length > 0);
      set('addr', !!(inp('zip') && inp('zip').value));
      set('cap', /^\d{6}$/.test((inp('cap') || {}).value || ''));
    }
    function set(k, on, txt) {
      var li = $('[data-au-ck="' + k + '"]', form); if (!li) return;
      li.classList.toggle('is-done', !!on);
      if (txt != null) { var b = $('b', li); if (b) b.textContent = txt; }
      var sr = $('.sr-only', li); if (sr) sr.textContent = on ? ' 완료' : ' 남음';
    }
    form.addEventListener('input', update); form.addEventListener('change', update);

    // 가입: sub.js 가 필수값·형식·확인 버튼을 검사한 뒤 'checked' 를 보낸다
    form.addEventListener('checked', function (e) {
      e.preventDefault();
      var capMsg = '';
      if (capLocked) capMsg = CAP_LOCK;
      else if (Date.now() - capAt > CAP_TTL) { newCode('', true); capMsg = CAP_EXP; }
      else if (inp('cap').value !== code()) {
        capMiss++;
        if (capMiss >= CAP_MAX) {
          newCode('', false); capLock(true); capMsg = CAP_LOCK;
          setTimeout(function () { capMiss = 0; capLock(false); newCode('', true); clear(capFld); update(); }, CAP_WAIT);
        } else { newCode('', true); capMsg = CAP_BAD; }
      }
      if (capMsg) {
        S.setErr(capFld, capMsg);
        S.toast('자동등록방지 숫자를 다시 입력해 주세요.', { error: true });
        window.scrollTo({ top: capFld.getBoundingClientRect().top + window.pageYOffset - 160, behavior: 'smooth' });
        update(); return;
      }
      var soc = S.has('social');
      location.href = page + '.html?state=done' + (soc ? '+social+member&social=' + sns : '') + (ret ? '&return=' + encodeURIComponent(ret) : '');
    });

    // 상태 보기용 견본 값
    var FULL = kind === 'biz'
      ? { bizno: '123-45-67890', company: '한결산업 주식회사', ceo: '한정우', biztype: '제조업', bizitem: '금속 가공', zip: '48058', addr: '부산광역시 해운대구 센텀중앙로 97', addr2: '5층',
          uid: 'hangyeol', pw: 'Hangyeol!2026', pw2: 'Hangyeol!2026', uname: '김민준', email: 'mj.kim@example.com', mobile: '010-1234-5678', adEmail: true }
      : { uid: 'seoyeon', pw: 'Seoyeon!2026', pw2: 'Seoyeon!2026', uname: '이서연', birth: '19930512', gender: 'f', email: 'seoyeon@example.com', mobile: '010-2345-6789',
          zip: '48058', addr: '부산광역시 해운대구 센텀중앙로 97', addr2: '1203호', adSms: true };
    var SAMPLE_FILE = { name: '사업자등록증_한결산업.pdf', size: 1240000, sample: true };
    function addSampleFile() { if (box && !files().length) files().push(SAMPLE_FILE); }

    if (S.hit('ok busy fail dup bad capexp caplock')) { fill(FULL); inp('cap').value = code(); addSampleFile(); }
    if (S.has('social')) fill(kind === 'biz' ? { uname: '김민준', email: 'mj.kim@example.com' } : { uname: '이서연', email: 'seoyeon@example.com' });
    if (S.has('err')) {
      fill(kind === 'biz'
        ? { bizno: '123-45-67890', ceo: '한정우', bizitem: '금속 가공', mail2: 'purchase@hangyeol', uid: 'hangyeol', pw: 'hangyeol', pw2: 'hangyeol1', uname: '김민준', email: 'mj.kim@example.com', mobile: '010-1234-5678' }
        : { uid: 'seoyeon', pw: 'seoyeon', pw2: 'seoyeon1', uname: '이서연', birth: '199305', email: 'seoyeon@example', mobile: '010-2345-6789' });
      // 상태 보기에서는 첫 오류 칸으로 스크롤·포커스하지 않고 화면 맨 위에서 보여 준다
      var keep = window.scrollTo; window.scrollTo = function () {};
      try { S.checkForm(form); } finally { window.scrollTo = keep; }
      setTimeout(function () { if (document.activeElement && form.contains(document.activeElement)) document.activeElement.blur(); }, 300);
    }
    if (S.has('bad')) {
      S.setErr(fld('uid'), '중복확인을 하지 못했습니다. 연결 상태를 확인한 뒤 다시 눌러 주세요.');
      newCode('730564', true); S.setErr(capFld, CAP_BAD);
      if (kind === 'biz') {
        inp('bizno').value = '123-45-67892'; S.setErr(fld('bizno'), '유효하지 않은 사업자등록번호입니다. 번호를 다시 확인해 주세요.');
        files().length = 0; S.setErr(fileFld, '10MB가 넘는 파일은 첨부할 수 없습니다. (사업자등록증_스캔.pdf 12.4MB)');
      } else {
        inp('birth').value = '19931341'; S.setErr(fld('birth'), '없는 날짜입니다. 생년월일을 다시 확인해 주세요. (예: 19900101)');
      }
    }
    if (S.has('dup')) {
      S.setErr(fld('uid'), '이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.');
      S.setErr(fld('email'), '이미 가입된 이메일입니다. 가입한 적이 있다면 로그인해 주세요.');
      if (kind === 'biz') S.setErr(fld('bizno'), '이미 가입된 사업자등록번호입니다. 가입한 아이디가 기억나지 않으면 고객센터로 문의해 주세요.');
    }
    // 자동등록방지 그림 만료 · 시도 초과(상태 보기)
    if (S.has('capexp')) { newCode('516083', true); S.setErr(capFld, CAP_EXP); }
    if (S.has('caplock')) { newCode('208746', false); capLock(true); S.setErr(capFld, CAP_LOCK); }
    pwRules(); renderDoc(); update();
    if (S.hit('ok busy fail capexp caplock') && kind === 'gen') birthCheck(false);
    if (S.hit('ok busy fail dup capexp caplock') && kind === 'biz') setOk(fld('zip'));

    // 가입 완료 화면: 보던 페이지 · 간편 가입에 따라 버튼. 주 동작은 .bt--ink(화살표 칸), 메인화면은 같은 높이의 .bt--line
    var acts = $('#auDoneActs');
    if (acts && S.has('done')) {
      var soc2 = S.has('social');
      var ARW = '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i>';
      var pri = function (href, t) { return '<a class="bt bt--ink bt--full" href="' + esc(href) + '"><span>' + esc(t) + '</span>' + ARW + '</a>'; };
      var next = ret
        ? (soc2 ? pri(ret, ro(retName) + ' 이동') : pri('login.html?return=' + encodeURIComponent(ret), '로그인하고 이어 보기'))
        : (soc2 ? '' : pri('login.html', '로그인'));
      var main = next ? '<a class="bt bt--line bt--noi bt--full" href="index.html"><span>메인화면으로</span></a>' : pri('index.html', '메인화면으로');
      acts.innerHTML = next + main;
      if (soc2 && kind === 'gen') { var who = $('.hd__who b'); if (who) who.textContent = '이서연'; $$('.dr-login a[data-href="mypage.php"]').forEach(function (a) { if (/님$/.test(a.textContent)) a.textContent = '이서연님'; }); }
    }
  }
  if (window.SUB) boot(); else document.addEventListener('sub:ready', boot);
})();
