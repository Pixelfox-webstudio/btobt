/* 비투비티 홈 시안 v11 · v11-font.js (2026-11-17, 2026-11-18 Manrope 확정)
   영문 글꼴은 Manrope로 확정되어 비교 단추는 지웠다. 이 파일은 두 가지만 한다.
   1 Manrope 외곽선 WEAR용 SVG 필터(#b2btOl · #b2btOlS = 글자를 불려 굵게 + 바깥 1px 선)를 넣는다(css/v11-font.css 2번)
   2 글꼴 파일을 다 받은 뒤 페이지 높이가 달라졌으면 스크롤 장치 위치를 다시 잰다 */
(function () {
  'use strict';
  try { localStorage.removeItem('b2bt-v11-font'); } catch (e) {}   // 비교하던 때 저장된 값 정리

  /* ---------- 1. 외곽선 WEAR용 SVG 필터(#b2btOl PC · #b2btOlS 폰). 화면에는 보이지 않는 0×0 상자 ----------
     2026-11-18 7차 담당자: "border는 그대로 1px, 안의 글자(투명한 부분)를 굵게" → 테두리는 1px 그대로 두고, 글자 모양 자체를 바깥으로 불린다.
       글자 모양을 FAT px만큼 바깥으로 불려(가짜 볼드: Manrope는 800이 가장 굵은 파일이라 그보다 굵게 만들 방법이 이것뿐)
       그 불린 모양의 바깥 1px만 흰 선으로 남긴다(선 = 불린 모양 - 불린 모양을 1px 깎은 것). 글자 안은 비어 영상이 보인다.
       직전 차수(같은 날)에 "WEAR가 얇다"를 안쪽 테두리를 두껍게(1.5 → 3.5px, feMorphology erode)로 고쳤던 것은 요청을 잘못 읽은 것이라 되돌렸다.
     만드는 법: 글자 알파(SourceAlpha)를 가우스로 살짝 흐린 뒤 두 높이에서 자른다
       → 바깥 모양(글자 가장자리에서 FAT px 밖) · 안쪽 모양(FAT-1 px 밖) → 바깥에서 안쪽을 빼면(out) 1px 띠 → 흰색으로 칠함.
       가우스 흐림은 모든 방향이 같아 사선(W · A) · 곡선(R)에서도 선 두께가 고르고 모서리가 둥글게 불어난다.
       (feMorphology dilate는 사각형으로 불려 사선이 √2배 두꺼워지고 곡선 · 꼭짓점이 각져 보여서 쓰지 않음)
       채운 글자의 알파에서 시작하므로 Manrope 겹친 윤곽선(A 가로획 · R 다리) 선은 생기지 않는다.
     값: PC FAT 2px · 흐림 1.5(1440에서 글자 약 83px) / 폰 FAT 1px · 흐림 .9(390에서 약 35px). 자르는 폭(가장자리 부드러움) AA .5px = 2배 화면에서 1화소.
       필터 영역은 글자 상자의 위아래 · 좌우 25%씩 넓힘(불린 2px + 흐림 번짐 약 4.5px보다 넉넉함) */
  if (document.body && !document.getElementById('b2btOl')) {
    var NS = 'http://www.w3.org/2000/svg', AA = .5;
    var pdf = function (z) { return .3989423 * Math.exp(-z * z / 2); };
    var cdf = function (z) {   // 표준 정규분포 누적값(근사) = 흐린 가장자리에서 거리 z·흐림 만큼 떨어진 곳의 알파
      var t = 1 / (1 + .2316419 * Math.abs(z)), p = pdf(z) * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return z > 0 ? 1 - p : p;
    };
    // 흐린 알파를 글자 가장자리에서 d px(바깥 = 음수) 되는 선에서 자른다: 그 선에서 알파 .5, 앞뒤 AA px 안에서 0 → 1
    var cut = function (d, s, out) {
      var z = d / s, k = s / (pdf(z) * AA);
      return '<feComponentTransfer in="b" result="' + out + '"><feFuncA type="linear" slope="' + k.toFixed(3) + '" intercept="' + (.5 - k * cdf(z)).toFixed(3) + '"/></feComponentTransfer>';
    };
    var ring = function (id, fat, s) {
      return '<filter id="' + id + '" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="' + s + '" result="b"/>' + cut(-fat, s, 'fat') + cut(1 - fat, s, 'core') +
        '<feComposite in="fat" in2="core" operator="out" result="ring"/><feFlood flood-color="#fff"/><feComposite in2="ring" operator="in"/></filter>';
    };
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = ring('b2btOl', 2, 1.5) + ring('b2btOlS', 1, .9);
    document.body.appendChild(svg);
  }

  /* ---------- 2. 글꼴을 다 받은 뒤 높이가 바뀌었으면 ScrollTrigger 위치를 다시 잰다 ---------- */
  var h0 = document.documentElement.scrollHeight;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    requestAnimationFrame(function () { if (window.ScrollTrigger && document.documentElement.scrollHeight !== h0) window.ScrollTrigger.refresh(); });
  });
})();
