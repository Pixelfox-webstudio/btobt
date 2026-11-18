/* 비투비티 홈 시안 v11 · v11-font.js (2026-11-17, 2026-11-18 Manrope 확정)
   영문 글꼴은 Manrope로 확정되어 비교 단추는 지웠다. 이 파일은 두 가지만 한다.
   1 Manrope 외곽선 WEAR용 SVG 필터(#b2btOl)를 넣는다(css/v11-font.css 2번)
   2 글꼴 파일을 다 받은 뒤 페이지 높이가 달라졌으면 스크롤 장치 위치를 다시 잰다 */
(function () {
  'use strict';
  try { localStorage.removeItem('b2bt-v11-font'); } catch (e) {}   // 비교하던 때 저장된 값 정리

  /* ---------- 1. 외곽선용 SVG 필터: 채운 글자에서 1.5px 깎아 낸 모양을 빼서 안쪽 테두리만 남긴다. 화면에는 보이지 않는 0×0 상자 ---------- */
  if (document.body && !document.getElementById('b2btOl')) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = '<filter id="b2btOl" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
      '<feMorphology in="SourceAlpha" operator="erode" radius="1.5" result="core"/><feComposite in="SourceGraphic" in2="core" operator="out"/></filter>';
    document.body.appendChild(svg);
  }

  /* ---------- 2. 글꼴을 다 받은 뒤 높이가 바뀌었으면 ScrollTrigger 위치를 다시 잰다 ---------- */
  var h0 = document.documentElement.scrollHeight;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    requestAnimationFrame(function () { if (window.ScrollTrigger && document.documentElement.scrollHeight !== h0) window.ScrollTrigger.refresh(); });
  });
})();
