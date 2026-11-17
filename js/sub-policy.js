/* 비투비티 약관·정책 문서 · sub-policy.js (2026-11-17)
   하는 일: 1 긴 표 접기(.po-fold): 폰(768px 이하)에서는 접어 두고 요약 줄만 보인다. PC·태블릿과 인쇄할 때는 늘 펼친다
           2 개인정보처리방침 목차: PC(1024px 이상)에서 지금 읽는 항목을 표시한다
           3 1023px 이하: 목차 상자를 지나 내려가면 화면 아래 '목차' 알약을 보인다 */
(function () {
  'use strict';
  function onMq(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

  function run() {
    /* 1. 긴 표 접기: 화면 폭이 폰 ↔ PC로 바뀔 때만 한꺼번에 접고 편다(폰에서 펼쳐 둔 표는 그대로 둔다) */
    var folds = Array.prototype.slice.call(document.querySelectorAll('.po-fold'));
    var phone = window.matchMedia('(max-width:768px)');
    function setFolds() { folds.forEach(function (d) { d.open = !phone.matches; }); }
    if (folds.length) {
      setFolds();
      onMq(phone, setFolds);
      window.addEventListener('beforeprint', function () { folds.forEach(function (d) { d.open = true; }); });
      window.addEventListener('afterprint', setFolds);
    }

    /* 2. 목차: 지금 읽는 항목 */
    var toc = document.querySelector('.po-toc');
    if (!toc || toc.closest('[hidden]')) return;
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var wide = window.matchMedia('(min-width:1024px)');
    var back = document.querySelector('.po-totoc');
    function backState() { if (back) back.classList.toggle('po-totoc--off', wide.matches || toc.getBoundingClientRect().bottom > 0); }
    function mark() {
      backState();
      var on = null;
      if (wide.matches) {
        var line = Math.min(window.innerHeight * 0.35, 320), de = document.documentElement;
        secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) on = i; });
        var last = secs[secs.length - 1];
        if (last && window.innerHeight + window.pageYOffset >= de.scrollHeight - 4 && last.getBoundingClientRect().top < window.innerHeight) on = secs.length - 1;
        if (on === null) on = 0;
      }
      links.forEach(function (a, i) { if (i === on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; mark(); });
    }, { passive: true });
    window.addEventListener('resize', mark);
    window.addEventListener('hashchange', mark);
    mark();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
