/* 비투비티 홈 시안 v11 · v11-m.js (2026-11-18 v11 6차)
   폰(768 이하) 스크롤 등장. 담당자: "히어로 → 랭킹 말고는 모바일이 너무 밋밋하다, 겨울 시즌 사진 배너의 스크롤 움직임이 빠졌다"
   PC는 건드리지 않는다(gsap.matchMedia). 이미 등장 움직임이 있는 것(data-rv · 상품 줄 reveal · 큰 제목 줄 · 캠페인 배너 · 룩북)은 다시 걸지 않는다.
   1 겨울 시즌 사진 배너(.ss__hero): 위아래가 접힌 틀이 화면 폭 그대로 열리고(clip-path, 양옆은 자르지 않음) 사진이 1.18배 → 제자리. 글은 차례로 올라온다
   2 파트너 배너(#pbSlides): 같은 방식(위아래 열림 + 사진 당김). 틀(#pbFrame)의 clip-path는 js/v10.js 4번이 쓰므로 안쪽 상자에 건다
   3 섹션 제목 줄(.vh): 영문 라벨 → 앞 문구 → 굵은 문구 → 오른쪽 링크 순서로 올라온다
   4 품목별 보기 카드(#cgRow): 오른쪽에서 차례로 들어온다
   5 '전체 보기' 단추(.psec__more): 올라온다
   움직임 줄이기 · GSAP이 없으면 아무것도 하지 않는다(처음부터 보이는 모습) */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger || !gsap.matchMedia) return;
  gsap.registerPlugin(ScrollTrigger);
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  var once = function (trigger, start) { return { trigger: trigger, start: start || 'top 88%', once: true }; };

  gsap.matchMedia().add('(max-width: 768px)', function () {
    // 1 겨울 시즌 사진 배너
    var ss = $('.ss__hero');
    if (ss) {
      var sst = { trigger: ss, start: 'top 96%', end: 'top 30%', scrub: .6 };
      gsap.fromTo(ss, { clipPath: 'inset(14% 0% 14% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: sst });
      var im = $('img', ss); if (im) gsap.fromTo(im, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ss, start: 'top 96%', end: 'bottom 40%', scrub: .6 } });
      var cp = $$('.ss__copy > *', ss);
      if (cp.length) gsap.from(cp, { y: 34, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: once(ss, 'top 62%') });
    }
    // 2 파트너 배너
    var pb = $('#pbSlides');
    if (pb) {
      gsap.fromTo(pb, { clipPath: 'inset(12% 0% 12% 0%)', scale: 1.12 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'none',
        scrollTrigger: { trigger: '#partner', start: 'top 96%', end: 'top 25%', scrub: .6 } });
    }
    // 3 섹션 제목 줄
    $$('header.vh').forEach(function (h) {
      var els = $$('.v11-eyebrow, .vh__t .tt__pre, .vh__t .tt__key, .vh__r, .vtog', h).filter(function (e) { return !e.closest('[data-rv]'); });
      if (!els.length) return;
      gsap.from(els, { y: 26, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', scrollTrigger: once(h) });
    });
    // 4 품목별 보기 카드
    var cg = $$('#cgRow > li');
    if (cg.length) gsap.from(cg, { x: 70, opacity: 0, duration: .9, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: once('#cgRow', 'top 90%') });
    // 5 전체 보기 단추
    $$('.psec__more').forEach(function (m) {
      if (m.closest('#rank')) return; // 랭킹은 첫 화면 쌓기 안이라 그대로
      gsap.from(m, { y: 22, opacity: 0, duration: .7, ease: 'power3.out', scrollTrigger: once(m, 'top 94%') });
    });
    // 사진 · 글꼴이 늦게 들어와 위치가 바뀌면 다시 잰다
    var rT = 0, re = function () { clearTimeout(rT); rT = setTimeout(function () { ScrollTrigger.refresh(); }, 200); };
    window.addEventListener('load', re);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
  });
})();
