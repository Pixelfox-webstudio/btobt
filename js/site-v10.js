/* 비투비티 홈 시안 v10 · site-v10.js (v9의 site-v9.js를 그대로 가져와 v10부터 직접 고친다): 위 띠 · 헤더 · 메가메뉴 · 전체 메뉴 · 검색 · 모바일 서랍 + 검수용 위 띠 전환 */
(function(){
  'use strict';
  var root = document.documentElement;
  var mqMobile = window.matchMedia('(max-width: 768px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function $(s, c){ return (c || document).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function onMq(mq, fn){ if(mq.addEventListener) mq.addEventListener('change', fn); else if(mq.addListener) mq.addListener(fn); }
  function isMobile(){ return mqMobile.matches; }
  function store(type, key, val){ try { window[type].setItem(key, val); } catch(e){} }
  function read(type, key){ try { return window[type].getItem(key); } catch(e){ return null; } }

  /* ---------- 링크: 정적 시안이라 다른 페이지로 가지 않음 ---------- */
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a') : null;
    if(!a) return;
    if(a.hasAttribute('data-href') || a.getAttribute('href') === '#') e.preventDefault();
  });
  $$('form').forEach(function(f){ f.addEventListener('submit', function(e){ e.preventDefault(); }); });

  var band = null; // v8: review controls retired, palette locked before paint.

  /* ---------- 위 띠: 6초마다 페이드, 마우스·포커스·터치 시 멈춤 ---------- */
  band = (function(){
    var el = $('#band');
    if(!el) return null;
    var slides = $$('.band__slide', el);
    var frames = [], idx = 0, timer = null, paused = false, touchPaused = false;
    function claimOff(){ return root.getAttribute('data-claim') === 'off'; }
    function usable(s){ return !(claimOff() && s.getAttribute('data-claim') === 'pending'); }
    function fits(s){
      // 조각을 모두 보인 상태로 한 줄 폭을 잼
      s.classList.remove('is-seg-mode');
      var cs = getComputedStyle(s);
      var avail = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var w = 0;
      Array.prototype.forEach.call(s.children, function(ch){
        var st = getComputedStyle(ch);
        w += ch.getBoundingClientRect().width + parseFloat(st.marginLeft) + parseFloat(st.marginRight);
      });
      return w <= avail + 1;
    }
    function build(){
      var cur = frames[idx];
      frames = [];
      slides.forEach(function(s){
        if(!usable(s)) return;
        if(isMobile() && !fits(s)){
          $$('.band__seg', s).forEach(function(seg, i){ frames.push({ s: s, seg: i }); });
        } else {
          frames.push({ s: s, seg: -1 });
        }
      });
      idx = 0;
      if(cur){ for(var i = 0; i < frames.length; i++){ if(frames[i].s === cur.s && (frames[i].seg === cur.seg || cur.seg === -1 || frames[i].seg <= 0)){ idx = i; break; } } }
      show(idx);
    }
    function show(i){
      if(!frames.length) return;
      idx = (i + frames.length) % frames.length;
      var f = frames[idx];
      slides.forEach(function(s){
        var on = s === f.s;
        s.classList.toggle('is-active', on);
        if(on){
          s.classList.toggle('is-seg-mode', f.seg >= 0);
          $$('.band__seg', s).forEach(function(seg, k){ seg.classList.toggle('is-seg-on', k === f.seg); });
        }
      });
    }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    function sync(restart){
      if(paused || touchPaused || mqReduce.matches || frames.length < 2){ stop(); return; }
      if(timer && !restart) return; // 이미 도는 중이면 6초 간격 유지
      stop();
      timer = setInterval(function(){ show(idx + 1); }, 6000);
    }
    function step(d){ show(idx + d); sync(true); }
    $('#bandPrev') && $('#bandPrev').addEventListener('click', function(){ step(-1); });
    $('#bandNext') && $('#bandNext').addEventListener('click', function(){ step(1); });
    el.addEventListener('mouseenter', function(){ paused = true; sync(); });
    el.addEventListener('mouseleave', function(){ paused = el.contains(document.activeElement); sync(); });
    el.addEventListener('focusin', function(e){
      paused = true;
      // 보이지 않는 슬라이드 안 링크에 포커스가 오면 그 슬라이드를 보여 줌
      var s = e.target.closest('.band__slide');
      if(s && !s.classList.contains('is-active')){
        for(var i = 0; i < frames.length; i++){ if(frames[i].s === s && (frames[i].seg === -1 || frames[i].s.querySelectorAll('.band__seg')[frames[i].seg].contains(e.target))){ show(i); break; } }
      }
      sync();
    });
    el.addEventListener('focusout', function(e){ if(!el.contains(e.relatedTarget)){ paused = el.matches(':hover'); sync(); } });
    el.addEventListener('touchstart', function(){ touchPaused = true; sync(); }, { passive: true });
    document.addEventListener('touchstart', function(e){ if(touchPaused && !el.contains(e.target)){ touchPaused = false; sync(); } }, { passive: true });
    var rT; window.addEventListener('resize', function(){ clearTimeout(rT); rT = setTimeout(function(){ build(); sync(); }, 150); });
    onMq(mqReduce, sync);
    function rebuild(){ build(); sync(); }
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(rebuild); }
    rebuild();
    return { rebuild: rebuild };
  })();

  /* ---------- 헤더: 투명/흰 상태, 스크롤 숨김, 드롭다운, 전체 메뉴, 검색 층 ---------- */
  var head = $('#siteHead'), hd = $('#hd'), mh = $('#mh');
  var allBtn = $('#allBtn'), allMenu = $('#allMenu'), allDim = $('#allDim');
  var searchBtn = $('#searchBtn'), searchLayer = $('#searchLayer');
  var drawerBtn = $('#drawerBtn'), drawer = $('#drawer'), drawerDim = $('#drawerDim'), drawerClose = $('#drawerClose');
  var mSearchBtn = $('#mSearchBtn'), mSearch = $('#mSearch');
  var hdHover = false, kbFocus = false;

  function isOpen(el){ return !!el && el.classList.contains('is-open'); }
  function anyLayerOpen(){ return isOpen(allMenu) || isOpen(searchLayer) || isOpen(drawer) || isOpen(mSearch); }
  function dropHovered(){ return !!$('.bz.is-open'); }

  function updateSolid(){
    var y = window.pageYOffset || 0;
    var transparent = y < 1 && !hdHover && !kbFocus && !anyLayerOpen() && !dropHovered();
    root.classList.toggle('is-top', transparent);
  }

  // 스크롤 숨김: 한 방향 10px 이상일 때만 바꿈. 맨 위·레이어 열림·헤더 안 키보드 포커스·드롭다운 hover 때는 늘 보임
  var headOff = false, anchorY = window.pageYOffset || 0, STEP = 10, raf = 0;
  function setHeadOff(off){
    if(headOff === off) return;
    headOff = off;
    root.classList.toggle('is-head-off', off);
  }
  function mustShow(){ return anyLayerOpen() || dropHovered() || kbFocus; }
  function onScroll(){
    raf = 0;
    var y = Math.min(Math.max(0, window.pageYOffset || 0), Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    updateSolid();
    if(y <= 0 || mustShow()){ setHeadOff(false); anchorY = y; return; }
    if(headOff){
      if(y > anchorY) anchorY = y;
      else if(anchorY - y >= STEP){ setHeadOff(false); anchorY = y; }
    } else {
      if(y < anchorY) anchorY = y;
      else if(y - anchorY >= STEP){ setHeadOff(true); anchorY = y; }
    }
  }
  window.addEventListener('scroll', function(){ if(!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
  if(hd){
    hd.addEventListener('mouseenter', function(){ hdHover = true; updateSolid(); });
    hd.addEventListener('mouseleave', function(){ hdHover = false; updateSolid(); });
  }
  if(head){
    head.addEventListener('focusin', function(e){
      var fv = true; try { fv = e.target.matches(':focus-visible'); } catch(err){}
      kbFocus = fv; if(kbFocus) setHeadOff(false); updateSolid();
    });
    head.addEventListener('focusout', function(e){ if(!head.contains(e.relatedTarget)){ kbFocus = false; updateSolid(); } });
  }

  // 사업 메뉴 드롭다운: hover·포커스로 열고, 밖으로 나가면 0.15초 뒤 닫힘, Esc로 닫힘
  var bzItems = $$('.bz');
  function setDrop(item, open){
    if(!item) return;
    item.classList.toggle('is-open', open);
    var link = $('.bz__link', item); if(link) link.setAttribute('aria-expanded', String(open));
  }
  function closeDrops(except){ bzItems.forEach(function(it){ if(it !== except){ clearTimeout(it._t); setDrop(it, false); } }); }
  bzItems.forEach(function(it){
    it.addEventListener('mouseenter', function(){
      if(isOpen(allMenu)) return;
      clearTimeout(it._t); closeDrops(it); setDrop(it, true); setHeadOff(false); updateSolid();
    });
    it.addEventListener('mouseleave', function(){
      clearTimeout(it._t);
      it._t = setTimeout(function(){ if(!it.contains(document.activeElement)) { setDrop(it, false); updateSolid(); } }, 150);
    });
    it.addEventListener('focusin', function(){
      if(it._esc) return;
      if(isOpen(allMenu)) return;
      clearTimeout(it._t); closeDrops(it); setDrop(it, true); updateSolid();
    });
    it.addEventListener('focusout', function(e){ if(!it.contains(e.relatedTarget)){ it._esc = false; setDrop(it, false); updateSolid(); } });
  });

  // 전체 메뉴(PC)
  function setAll(open, returnFocus){
    if(!allMenu || isOpen(allMenu) === open) return;
    if(open){ setSearch(false); closeDrops(); }
    allMenu.classList.toggle('is-open', open);
    if(allDim) allDim.hidden = !open;
    allBtn.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-acp-open', open);
    if(open) setHeadOff(false);
    if(!open && returnFocus) allBtn.focus({ preventScroll: true });
    updateSolid();
  }
  allBtn && allBtn.addEventListener('click', function(){ setAll(!isOpen(allMenu)); });
  allDim && allDim.addEventListener('click', function(){ setAll(false, true); });

  // 검색 층(PC)
  function setSearch(open, returnFocus){
    if(!searchLayer || isOpen(searchLayer) === open) return;
    if(open){ setAll(false); closeDrops(); }
    searchLayer.classList.toggle('is-open', open);
    searchBtn.setAttribute('aria-expanded', String(open));
    if(open){ setHeadOff(false); var inp = $('input', searchLayer); requestAnimationFrame(function(){ inp && inp.focus({ preventScroll: true }); }); }
    if(!open && returnFocus) searchBtn.focus({ preventScroll: true });
    updateSolid();
  }
  searchBtn && searchBtn.addEventListener('click', function(){ setSearch(!isOpen(searchLayer)); });
  document.addEventListener('click', function(e){
    if(isOpen(searchLayer) && !searchLayer.contains(e.target) && !searchBtn.contains(e.target)) setSearch(false);
    if(isOpen(mSearch) && !mSearch.contains(e.target) && !mSearchBtn.contains(e.target)) setMSearch(false);
  });
  searchLayer && searchLayer.addEventListener('focusout', function(e){ if(e.relatedTarget && !searchLayer.contains(e.relatedTarget) && e.relatedTarget !== searchBtn) setSearch(false); });

  // 모바일 검색 바
  function setMSearch(open){
    if(!mSearch || isOpen(mSearch) === open) return;
    mSearch.classList.toggle('is-open', open);
    mSearchBtn.setAttribute('aria-expanded', String(open));
    if(open){ setHeadOff(false); var inp = $('input', mSearch); requestAnimationFrame(function(){ inp && inp.focus({ preventScroll: true }); }); }
    updateSolid();
  }
  mSearchBtn && mSearchBtn.addEventListener('click', function(){ setMSearch(!isOpen(mSearch)); });

  // 모바일 서랍: 왼쪽에서 밀려 나옴, 바깥 어둡게, 본문 스크롤 잠금, 포커스 가둠
  function setDrawer(open){
    if(!drawer || isOpen(drawer) === open) return;
    if(open){
      setMSearch(false);
      drawerDim.hidden = false;
      requestAnimationFrame(function(){ drawerDim.classList.add('is-open'); });
      drawer.classList.add('is-open');
      root.classList.add('is-locked');
      setHeadOff(false);
      setTimeout(function(){ drawerClose.focus({ preventScroll: true }); }, 50);
    } else {
      drawer.classList.remove('is-open');
      drawerDim.classList.remove('is-open');
      root.classList.remove('is-locked');
      setTimeout(function(){ if(!isOpen(drawer)) drawerDim.hidden = true; }, mqReduce.matches ? 0 : 300);
      drawerBtn.focus({ preventScroll: true });
    }
    drawerBtn.setAttribute('aria-expanded', String(open));
    updateSolid();
  }
  drawerBtn && drawerBtn.addEventListener('click', function(){ setDrawer(true); });
  drawerClose && drawerClose.addEventListener('click', function(){ setDrawer(false); });
  drawerDim && drawerDim.addEventListener('click', function(){ setDrawer(false); });
  drawer && drawer.addEventListener('keydown', function(e){
    if(e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled])', drawer).filter(function(x){ return x.offsetParent !== null; });
    if(!f.length) return;
    if(e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
    else if(!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
  });
  onMq(mqMobile, function(){
    if(!isMobile()){ setDrawer(false); setMSearch(false); }
    else { setAll(false); setSearch(false); closeDrops(); }
    updateSolid();
  });

  // 탭 목록 공통(서랍 분류, MD 추천): 좌우/위아래 화살표, Home/End
  function tablist(list, onSelect, vertical){
    var tabs = $$('[role="tab"]', list);
    function select(t, focus){
      tabs.forEach(function(x){
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        x.classList.toggle('is-on', on);
      });
      if(focus) t.focus();
      onSelect(t);
    }
    list.addEventListener('click', function(e){ var t = e.target.closest('[role="tab"]'); if(t) select(t, false); });
    list.addEventListener('keydown', function(e){
      var i = tabs.indexOf(document.activeElement); if(i < 0) return;
      var next = null;
      if(e.key === 'ArrowRight' || (vertical && e.key === 'ArrowDown')) next = tabs[(i + 1) % tabs.length];
      else if(e.key === 'ArrowLeft' || (vertical && e.key === 'ArrowUp')) next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if(e.key === 'Home') next = tabs[0];
      else if(e.key === 'End') next = tabs[tabs.length - 1];
      if(next){ e.preventDefault(); select(next, true); }
    });
  }
  var drTabs = $('.dr-tabs');
  drTabs && tablist(drTabs, function(t){
    $$('.dr-pane').forEach(function(p){ p.hidden = p.id !== t.getAttribute('aria-controls'); });
  }, true);

  // Esc: 열린 것 닫기
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(isOpen(drawer)){ setDrawer(false); return; }
    if(isOpen(searchLayer)){ setSearch(false, true); return; }
    if(isOpen(allMenu)){ setAll(false, true); return; }
    if(isOpen(mSearch)){ setMSearch(false); mSearchBtn.focus(); return; }
    var open = $('.bz.is-open');
    if(open){ open._esc = true; setDrop(open, false); var l = $('.bz__link', open); l && l.focus({ preventScroll: true }); updateSolid(); }
  });

  updateSolid();
  onScroll();

  /* ---------- 1. Hero: 첫 사진 → 무음 배경 영상 ---------- */
  (function(){
    var hero = $('#hero'), video = $('#heroFilm'), btn = $('#heroPause');
    if(!hero || !video) return;
    var KEY = 'b2bt-hero-paused';
    var started = false, timerDone = false, heroInView = true, shown = false, failed = false;
    var userPaused = read('sessionStorage', KEY) === '1';

    function allowed(){
      if(mqReduce.matches || failed) return false;
      var c = navigator.connection;
      if(c){
        if(c.saveData === true) return false;
        if(/^(slow-2g|2g|3g)$/.test(c.effectiveType || '')) return false;
      }
      return true;
    }
    function pickSrc(){
      var w = window.innerWidth;
      var base = w >= 1281 ? 'hero-film-1080' : (w >= 769 ? 'hero-film-720' : 'hero-film-9x16');
      var ext = video.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
      return 'media/' + base + '.' + ext;
    }
    function setBtn(){
      if(!btn) return;
      btn.setAttribute('aria-pressed', String(userPaused));
      btn.setAttribute('aria-label', userPaused ? '배경 영상 재생' : '배경 영상 멈춤');
    }
    function reveal(){
      if(shown) return;
      shown = true;
      hero.classList.add('is-film-on');
      if(btn){ btn.hidden = false; setBtn(); }
    }
    function giveUp(){
      failed = true;
      try { video.pause(); } catch(e){}
      video.removeAttribute('src'); video.load();
      hero.classList.remove('is-film-on');
      if(btn) btn.hidden = true;
    }
    function tryPlay(){
      if(!started || userPaused || !heroInView || document.hidden || !allowed()) return;
      var p = video.play();
      if(p && p.catch) p.catch(function(){ if(!shown) giveUp(); });
    }
    function start(){
      if(started || !timerDone || !allowed()) return;
      if(document.hidden) return; // 다시 보일 때 visibilitychange에서 시작
      started = true;
      video.src = pickSrc();
      video.setAttribute('data-src-picked', video.src.split('/').pop());
      if(userPaused){
        video.preload = 'auto';
        video.addEventListener('loadeddata', function once(){ video.removeEventListener('loadeddata', once); reveal(); });
        video.load();
      } else {
        tryPlay();
      }
    }
    video.addEventListener('playing', reveal);
    video.addEventListener('error', function(){ if(!shown) giveUp(); });

    function arm(){ setTimeout(function(){ timerDone = true; start(); }, 2500); }
    if(document.readyState === 'complete') arm(); else window.addEventListener('load', arm);

    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ if(started) video.pause(); }
      else { if(!started) start(); else tryPlay(); }
    });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        heroInView = entries[0].isIntersecting;
        if(!started) return;
        if(heroInView) tryPlay(); else video.pause();
      }).observe(hero);
    }
    onMq(mqReduce, function(){
      if(mqReduce.matches){
        if(started){ video.pause(); }
        hero.classList.remove('is-film-on'); shown = false;
        if(btn) btn.hidden = true;
      } else if(started){
        if(userPaused){ reveal(); } else { tryPlay(); }
      } else start();
    });
    btn && btn.addEventListener('click', function(){
      userPaused = !userPaused;
      store('sessionStorage', KEY, userPaused ? '1' : '0');
      setBtn();
      if(userPaused) video.pause(); else tryPlay();
    });
  })();

  /* ---------- 3. MD 추천 탭: 해당 상품만 앞에서부터 다시 채움 ---------- */
  (function(){
    var list = $('.md__tabs'), grid = $('#mdGrid');
    if(!list || !grid) return;
    var cards = $$('.pcard', grid);
    tablist(list, function(t){
      var f = t.getAttribute('data-filter');
      var shown = [], rest = [];
      cards.forEach(function(c){ (f === 'all' || c.getAttribute('data-group') === f ? shown : rest).push(c); });
      shown.concat(rest).forEach(function(c){ grid.appendChild(c); });
      shown.forEach(function(c){ c.hidden = false; });
      rest.forEach(function(c){ c.hidden = true; });
      grid.setAttribute('aria-labelledby', t.id);
    }, false);
  })();

  /* ---------- 5. 카드 레일: 무한 순환(복제 카드), 화살표·스와이프·키보드, 자동 흐름 없음 ----------
     현재 번호 = 밝은 카드 중 맨 왼쪽(현재 사이트 캡처: 처음에 1번이 왼쪽 밝은 카드, 그 왼쪽 어두운 카드는 10번) */
  (function(){
    var stage = $('#railStage'), track = $('#railTrack');
    if(!stage || !track) return;
    var reals = $$('.rcard', track), N = reals.length, K = 5;
    var now = $('#railNow'), fill = $('#railFill');
    function makeClone(c){
      var x = c.cloneNode(true);
      x.classList.add('is-clone');
      x.setAttribute('aria-hidden', 'true');
      x.setAttribute('inert', '');
      $$('a', x).forEach(function(a){ a.tabIndex = -1; });
      $$('img', x).forEach(function(i){ i.removeAttribute('data-slot'); i.removeAttribute('data-temp'); });
      return x;
    }
    for(var i = N - K; i < N; i++) track.insertBefore(makeClone(reals[i]), reals[0]);
    for(i = 0; i < K; i++) track.appendChild(makeClone(reals[i]));
    var all = $$('.rcard', track);
    var idx = 0, W = 380, G = 20, V = 3, L0 = 0, dragDx = 0;

    function curReal(){ return ((idx % N) + N) % N; }
    function marks(){
      all.forEach(function(c, p){
        var rel = p - K - idx;
        c.classList.toggle('is-dim', V > 1 && !(rel >= 0 && rel < V));
      });
      var cur = curReal();
      if(now) now.textContent = String(cur + 1);
      if(fill) fill.style.width = ((cur + 1) / N * 100) + '%';
    }
    function place(anim){
      track.classList.toggle('is-instant', !anim || mqReduce.matches);
      track.style.transform = 'translate3d(' + (L0 - (idx + K) * (W + G) + dragDx) + 'px,0,0)';
      marks();
    }
    function normalize(){
      if(idx >= 0 && idx < N) return;
      idx = curReal(); place(false);
      void track.offsetWidth; // 순간 이동을 먼저 그린 뒤 다음 이동에 전환을 적용
    }
    function layout(){
      var vw = document.documentElement.clientWidth;
      V = vw >= 1025 ? 3 : (vw >= 769 ? 2 : 1);
      if(V === 1){ W = vw - 60; L0 = 20; }
      else { W = Math.min(380, Math.floor((vw - 120 - G * (V - 1)) / V)); L0 = Math.round((vw - (V * W + (V - 1) * G)) / 2); }
      stage.style.setProperty('--rail-w', W + 'px');
      if(V === 1){
        stage.style.setProperty('--rail-arrow-l', (L0 + 4) + 'px');
        stage.style.setProperty('--rail-arrow-r', (vw - L0 - W + 4) + 'px');
      } else {
        stage.style.setProperty('--rail-arrow-l', Math.max(4, L0 - 64) + 'px');
        stage.style.setProperty('--rail-arrow-r', Math.max(4, L0 - 64) + 'px');
      }
      place(false);
    }
    function go(d){
      normalize();
      idx += d;
      place(true);
      if(mqReduce.matches) normalize();
    }
    track.addEventListener('transitionend', function(e){ if(e.target === track && e.propertyName === 'transform') normalize(); });
    $('#railPrev').addEventListener('click', function(){ go(-1); });
    $('#railNext').addEventListener('click', function(){ go(1); });
    stage.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); go(-1); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); go(1); }
    });
    // Tab으로 화면 밖 카드에 포커스가 오면 그 카드를 밝은 자리로
    stage.addEventListener('focusin', function(e){
      var c = e.target.closest('.rcard');
      if(!c || c.classList.contains('is-clone')) return;
      var i = +c.getAttribute('data-i'), rel = i - curReal();
      if(rel >= 0 && rel < V) return;
      normalize(); idx = i; place(true);
    });
    // overflow 안에서 포커스 때문에 생기는 스크롤을 되돌림(overflow:clip 미지원 브라우저용)
    stage.addEventListener('scroll', function(){ stage.scrollLeft = 0; });

    // 스와이프(터치·마우스 드래그): 50px 이상이면 한 칸
    var x0 = null, y0 = 0, dragging = false, justDragged = false;
    stage.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      if(e.target.closest('.rail__arrow')) return;
      x0 = e.clientX; y0 = e.clientY; dragging = false; dragDx = 0;
    });
    window.addEventListener('pointermove', function(e){
      if(x0 === null) return;
      var dx = e.clientX - x0;
      if(!dragging){
        if(Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - y0)) return;
        dragging = true; normalize();
      }
      dragDx = dx; place(false);
    });
    function endDrag(){
      if(x0 === null) return;
      x0 = null;
      if(!dragging) return;
      dragging = false; justDragged = true;
      var d = dragDx < -50 ? 1 : (dragDx > 50 ? -1 : 0);
      dragDx = 0;
      if(d) go(d); else place(true);
      setTimeout(function(){ justDragged = false; }, 0);
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    stage.addEventListener('click', function(e){ if(justDragged){ e.preventDefault(); e.stopPropagation(); } }, true);
    stage.addEventListener('dragstart', function(e){ e.preventDefault(); });

    var rT; window.addEventListener('resize', function(){ clearTimeout(rT); rT = setTimeout(layout, 100); });
    layout();
  })();

  /* ---------- 7. 납품처 탭: 해당 칸만 남기고 앞에서부터 다시 채움 ---------- */
  (function(){
    var list = $('.cl-tabs'), grid = $('#clGrid');
    if(!list || !grid) return;
    var cells = $$('.cl-cell[data-group]', grid), allCell = $('.cl-cell--all', grid);
    tablist(list, function(t){
      var f = t.getAttribute('data-filter'), shown = [], rest = [];
      cells.forEach(function(c){ (f === 'all' || c.getAttribute('data-group') === f ? shown : rest).push(c); });
      shown.concat(allCell ? [allCell] : [], rest).forEach(function(c){ grid.appendChild(c); });
      shown.forEach(function(c){ c.hidden = false; });
      rest.forEach(function(c){ c.hidden = true; });
      grid.setAttribute('aria-labelledby', t.id);
    }, false);
  })();

  /* ---------- 글 구간 등장 효과 (한 번만) ---------- */
  (function(){
    var els = $$('.site-rv');
    if(!els.length) return;
    if(mqReduce.matches || !('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function(e){ io.observe(e); });
  })();

  /* 위 띠는 검정(F안)으로 정해졌다(2026-11-15). 고르는 단추는 없앴고, 왼쪽 손잡이는 흰 바탕 배경 고르기로 바뀌었다(js/bgfx.js) */

  /* ---------- 맨 위로 ---------- */
  var toTop = $('#toTop');
  toTop && toTop.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: mqReduce.matches ? 'auto' : 'smooth' });
    var logo = $('.hd__logo'); logo && logo.focus({ preventScroll: true });
  });
})();
