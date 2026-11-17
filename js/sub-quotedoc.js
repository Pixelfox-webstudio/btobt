/* 비투비티 견적서 7종 · sub-quotedoc.js (2026-11-17)
   하는 일: 1 견적서 다운로드(준비 중 → 완료 알림, 오류 상태면 오류 안내) · 2 메일 링크로 열면 자동 다운로드
           · 3 미리보기의 견적 요청(접수 중 → 완료 창 → 원래 화면을 마이페이지로 보내고 닫기, 실패 상태면 실패 안내)
   상태 보기는 js/sub.js(?state=)가 맡는다. 이 파일은 버튼을 눌렀을 때의 흐름만 붙인다. */
(function () {
  'use strict';
  function run() {
    var SUB = window.SUB; if (!SUB) return;
    var $ = SUB.$, $$ = SUB.$$;

    function busy(list, on) {
      list.forEach(function (b) {
        b.classList.toggle('is-busy', on);
        if (on) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy');
      });
    }
    function showMsg(id, on) { var n = document.getElementById(id); if (n) n.classList.toggle('st-on', on); }

    /* 1. 다운로드: 머리줄과 폰 아래 띠의 버튼이 함께 바뀐다 */
    var dls = $$('[data-qd-dl]');
    function download() {
      if (!dls.length || dls[0].classList.contains('is-busy')) return;
      var file = dls[0].getAttribute('data-qd-dl');
      busy(dls, true); showMsg('qdPrep', true);
      setTimeout(function () {
        busy(dls, false); if (!SUB.has('preparing')) showMsg('qdPrep', false);
        if (SUB.has('dlfail')) {
          showMsg('qdDlFail', true);
          SUB.toast('견적서를 내려받지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true });
          return;
        }
        SUB.toast(file + ' 파일을 내려받았습니다.');
      }, 1400);
    }
    dls.forEach(function (b) { b.addEventListener('click', download); });
    /* 2. 메일 링크로 열면 바로 내려받는다 */
    if (SUB.has('mail')) setTimeout(download, 400);

    /* 3. 미리보기: 견적 요청 */
    var reqs = $$('[data-qd-req]');
    if (SUB.has('closed') || SUB.has('loading')) reqs.forEach(function (b) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); });
    reqs.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled || reqs[0].classList.contains('is-busy')) return;
        busy(reqs, true); showMsg('qdBusy', true); showMsg('qdFail', false);
        setTimeout(function () {
          busy(reqs, false); showMsg('qdBusy', false);
          if (SUB.has('fail')) {
            showMsg('qdFail', true);
            SUB.toast('견적문의를 접수하지 못했습니다. 잠시 후 다시 눌러 주세요.', { error: true });
            return;
          }
          var done = $('.pop[data-qd-done]'); if (done) SUB.pop(done);
        }, 1200);
      });
    });
    /* 접수 완료 창의 확인: 원래 화면(견적문의)을 마이페이지로 보내고 이 창을 닫는다. 창으로 열린 것이 아니면 이 창에서 이동 */
    document.addEventListener('click', function (e) {
      var f = e.target.closest && e.target.closest('[data-qd-finish]'); if (!f) return;
      e.preventDefault();
      var to = f.getAttribute('data-qd-finish');
      try {
        if (window.opener && !window.opener.closed) { window.opener.location.href = to; window.close(); return; }
      } catch (err) { /* 다른 출처의 창이면 이 창에서 이동 */ }
      location.href = to;
    });
  }
  if (window.SUB) run(); else document.addEventListener('sub:ready', run);
})();
