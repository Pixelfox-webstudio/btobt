/* ============================================================
   비투비티 홈 시안 v11 · v11-fx.js (2026-11-18 7차 담당자: "스크롤 다운되면서 보여지는 애니메이션들도 적용해서 좀더 퀄리티를 높혀봐.")
   PC(769 이상) 스크롤 등장. 폰(768 이하)은 js/v11-m.js가 맡으므로 여기서는 gsap.matchMedia('(min-width: 769px)') 안에서만 건다(같은 요소를 두 번 움직이지 않게).
   이미 움직임이 있는 것은 다시 걸지 않는다: [data-rv](js/v10.js 등장 묶음) · 랭킹 큰 제목 줄(.sh__t) · 상품 카드(js/v10.js reveal) ·
     후기 카드(.rv__card, js/v10.js 후기 목록) · 룩북 카드(.lk__rv, js/v11-look.js) · 파트너 틀(#pbFrame) · 캠페인 배너(.cb__*, js/v11.js)
   CSS로 transform이 바뀌는 사진(.ss__hero img 마우스 올림 확대 · .cgs img · .lk__ph img · .pc__media img · .ind__media img)은 건드리지 않고 감싼 상자를 움직인다.
   바텀 헤더(.bh, 붙는 줄)는 움직이지 않는다. 쓰는 값은 transform · opacity · clip-path뿐이라 자리(레이아웃)가 밀리지 않는다.
   1 섹션 제목 줄(header.vh): 영문 라벨 → 앞 문구 → 굵은 문구(줄 아래 선에서 밀려 올라오며 드러남) → 오른쪽 링크 · 화살표
     랭킹 머리(#rkHead)는 header.sh라 여기 들지 않는다(영문 라벨 · 큰 제목 줄 · 설명은 이미 움직임) → 그 아래 품목 탭(.rk__bar)만 올린다
   2 겨울 시즌 사진 배너(.ss__hero): 틀이 안쪽에서 화면 쪽으로 열리고(clip-path) 사진 상자(picture)가 1.12배 → 제자리(스크롤에 맞춰 scrub). 글은 차례로 올라온다
   3 품목별 보기 카드(#cgRow > li): 아래에서 차례로 올라오며 아래쪽부터 드러난다
   4 '전체 보기' 단추(.psec__more): 올라온다
   한 번만 움직이고(once) 끝나면 넣었던 값을 지운다(clearProps). 시작 지점은 clamp()로 페이지 끝 안에 둔다 →
   페이지 중간에서 새로 열거나 맨 아래로 바로 내려가도 지나온 것은 모두 끝 모습(보이는 상태)으로 간다. 맨 아래에 닿으면 남은 것을 한 번 더 확인한다.
   움직임 줄이기 · GSAP이 없으면 아무것도 하지 않는다(처음부터 보이는 모습)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger || !gsap.matchMedia) return;
  gsap.registerPlugin(ScrollTrigger);
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function free(els) { return els.filter(function (e) { return !e.closest('[data-rv]'); }); } // 등장 묶음([data-rv]) 안의 것은 빼고
  function once(trigger, start) { return { trigger: trigger, start: 'clamp(' + (start || 'top 88%') + ')', once: true }; }
  var CLEAR = 'transform,opacity,clipPath';
  // 줄 아래 선 가리개: 자기 높이만큼 아래에 있다가 올라오고, 그만큼 아래쪽이 잘려 있어 선 아래에서 밀려 나오는 것처럼 보인다(감싸는 상자 없이 clip-path로)
  // 끝 값의 위 · 양옆 음수는 글자 윗부분 · 기울기가 잘리지 않게 넉넉히. 끝나면 clip-path를 지운다
  var MASK0 = { yPercent: 100, clipPath: 'inset(0% 0% 100% 0%)' };
  function mask1(d) { return { yPercent: 0, clipPath: 'inset(-30% -6% 0% -6%)', duration: d || 1, ease: 'power4.out' }; }

  gsap.matchMedia().add('(min-width: 769px)', function () {
    var tws = []; // 한 번 움직임 목록(맨 아래 확인용)

    // 1 섹션 제목 줄
    $$('header.vh').forEach(function (h) {
      var eb = free($$('.v11-eyebrow', h)), side = free($$('.vh__r', h));
      var words = free($$('.vh__t .tt__pre, .vh__t .tt__key', h));
      if (!words.length) words = free($$('.vh__t', h)); // 앞 문구 · 굵은 문구로 나뉘지 않은 제목은 통째로
      var all = eb.concat(words, side); if (!all.length) return;
      var tl = gsap.timeline({ scrollTrigger: once(h), onComplete: function () { gsap.set(all, { clearProps: CLEAR }); } });
      if (eb.length) tl.from(eb, { y: 16, opacity: 0, duration: .7, ease: 'power3.out' }, 0);
      if (words.length) tl.fromTo(words, MASK0, Object.assign(mask1(1.05), { stagger: .1 }), .08);
      if (side.length) tl.from(side, { y: 18, opacity: 0, duration: .8, ease: 'power3.out' }, .32);
      tws.push(tl);
    });
    // 랭킹 머리: 영문 라벨(.rkh.is-in + CSS, js/v10.js · css/v11.css 2번) · 큰 제목 줄(.sh__t) · 설명([data-rv])은 이미 움직이므로 그 아래 품목 탭(.rk__bar)만
    var rk = $('#rkHead'), rkBar = free($$('#rank .rk__bar'));
    if (rk && rkBar.length) tws.push(gsap.from(rkBar, { y: 20, opacity: 0, duration: .8, delay: .25, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: once(rk) }));

    // 2 겨울 시즌 사진 배너. 사진(img)은 마우스를 올리면 CSS로 커지므로(css/v8-base.css) 감싼 picture를 당긴다. 글 상자(.ss__copy)는 CSS translateY(-50%)라 안쪽 줄만
    var ss = $('.ss__hero');
    if (ss) {
      var sst = function (end) { return { trigger: ss, start: 'top 95%', end: end, scrub: .6 }; };
      gsap.fromTo(ss, { clipPath: 'inset(9% 6% 9% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none', scrollTrigger: sst('top 35%') });
      var pic = $('picture', ss);
      if (pic) gsap.fromTo(pic, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: sst('bottom 40%') });
      var cp = $$('.ss__t .tt__pre, .ss__t .tt__key, .ss__d, .ss__copy > .bt', ss);
      if (cp.length) tws.push(gsap.from(cp, { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: once(ss, 'top 62%') }));
    }

    // 3 품목별 보기 카드: 카드(li)를 움직인다(사진 img는 CSS로 넓어지며 움직이므로 건드리지 않음). 끝나면 CSS의 translateZ(0)(Safari 모서리)로 돌아간다
    var cg = $$('#cgRow > li');
    if (cg.length) tws.push(gsap.fromTo(cg,
      { y: 90, opacity: 0, clipPath: 'inset(100% 0% 0% 0% round 16px)' },
      { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.1, stagger: .08, ease: 'power4.out', clearProps: CLEAR, scrollTrigger: once('#cgRow', 'top 86%') }));

    // 4 '전체 보기' 단추(안의 .pbtn이 아니라 감싼 줄을 움직인다)
    free($$('.psec__more')).forEach(function (m) {
      tws.push(gsap.from(m, { y: 26, opacity: 0, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: once(m, 'top 94%') }));
    });

    // 맨 아래에 닿았는데 아직 시작하지 않은 등장이 있으면(위쪽 높이가 바뀐 뒤 다시 재지 못한 경우 등) 바로 끝까지 재생한다
    function atEnd() {
      var d = document.documentElement;
      if (window.scrollY + window.innerHeight < d.scrollHeight - 4) return;
      tws.forEach(function (t) { if (t.progress() < 1 && !t.isActive()) t.play(); });
    }
    ScrollTrigger.addEventListener('scrollEnd', atEnd);
    // 사진 · 글꼴이 늦게 들어와 위치가 바뀌면 다시 잰다
    var rT = 0, re = function () { clearTimeout(rT); rT = setTimeout(function () { ScrollTrigger.refresh(); }, 200); };
    window.addEventListener('load', re);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
    return function () { ScrollTrigger.removeEventListener('scrollEnd', atEnd); window.removeEventListener('load', re); clearTimeout(rT); };
  });
})();
