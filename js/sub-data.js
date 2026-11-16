/* 비투비티 하위 페이지 · sub-data.js (2026-11-17)
   홈 시안의 실제 상품 자료(js/catalog.js · rank.js · extra.js · brands.js)를 하위 페이지에서 쓰기 좋게 한데 모은다.
   - 상품 사진·이름·사이즈·가격·색 견본은 자료 그대로다.
   - 세부 분류·소재·형태·시즌·색 이름은 자료에 없어 상품명과 색 값에서 읽어 낸 견본 값이다(운영 자료로 바뀔 자리). */
(function () {
  'use strict';
  var COLOR = { '#111111': '블랙', '#1F3864': '네이비', '#FFFFFF': '화이트', '#888888': '그레이', '#9E9E9E': '라이트 그레이', '#6B7C3F': '카키', '#C0392B': '레드', '#4A90D9': '블루',
    '#2A5FBF': '로얄 블루', '#C8A96E': '베이지', '#444444': '차콜', '#F5F0E8': '아이보리', '#E67E22': '오렌지', '#EDE6D6': '크림', '#4A7C59': '그린', '#F1C40F': '옐로',
    '#D9D9D9': '실버', '#A9C6D9': '스카이', '#D8A7A7': '핑크', '#A9A9A9': '미디엄 그레이', '#C6E23A': '라임', '#6E1B2E': '버건디', '#8A8C78': '세이지', '#C8BFAE': '샌드',
    '#3FA34D': '라이트 그린', '#8B8580': '웜 그레이', '#F2EBDD': '오프화이트' };
  var LADDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL'];
  function norm(t) { t = t.toUpperCase().replace(/\s/g, ''); return { SS: 'XS', XXL: '2XL', '2L': '2XL', '3L': '3XL', '4L': '4XL', FERR: 'FREE' }[t] || t; }
  // "S (85) ~ 4XL (115)" → [{l:'S',n:85}, ...]
  function sizes(str) {
    if (!str) return [];
    var parts = str.split('~').map(function (s) { return s.trim(); });
    function one(s) { var m = /^([^\s(]+)\s*(?:\((\d+)\))?$/.exec(s) || [0, s]; return { l: norm(m[1]), n: m[2] ? Number(m[2]) : null }; }
    var a = one(parts[0]); if (parts.length < 2) return [{ l: a.l, n: a.n }];
    var b = one(parts[1]);
    if (/^\d+$/.test(a.l) && /^\d+$/.test(b.l)) { var out = [], x = Number(a.l), y = Number(b.l), step = y - x > 20 ? 5 : (y <= 60 ? 2 : 5); for (var v = x; v <= y; v += step) out.push({ l: String(v), n: null }); return out; }
    var pre = [];
    if (/호$/.test(a.l)) { var k = parseInt(a.l, 10); for (; k <= 17; k += 2) pre.push({ l: k + '호', n: null }); a = { l: 'S', n: null }; }
    else if (/^\d+$/.test(a.l)) { for (var c = Number(a.l); c <= 150; c += 10) pre.push({ l: String(c), n: null }); a = { l: 'S', n: null }; }
    var i = LADDER.indexOf(a.l), j = LADDER.indexOf(b.l); if (i < 0 || j < 0 || j < i) return pre.concat([{ l: a.l, n: a.n }, { l: b.l, n: b.n }]);
    var step2 = a.n != null && b.n != null && j > i ? (b.n - a.n) / (j - i) : 0, res = [];
    for (var q = i; q <= j; q++) res.push({ l: LADDER[q], n: step2 ? Math.round(a.n + step2 * (q - i)) : null });
    return pre.concat(res);
  }
  function has(n, re) { return re.test(n); }
  function subOf(cat, n) {
    if (cat === '라운드 티셔츠') return '반팔티';
    if (cat === '카라 티셔츠') return '반팔 카라티';
    if (cat === '맨투맨 티셔츠') return '맨투맨';
    if (cat === '후드 티셔츠') return has(n, /집업/) ? '후드집업' : '후드티';
    if (cat === '조끼') return '겨울조끼';
    if (cat === '자켓') return has(n, /항공점퍼/) ? '항공점퍼' : has(n, /플리스/) ? '플리스 자켓' : '바람막이 자켓';
    if (cat === '패딩') return '패딩점퍼';
    if (cat === '바지') return has(n, /반바지/) ? '반바지' : '긴바지';
    if (cat === '모자') return '캡 모자';
    return '';
  }
  function seasonOf(cat, n) {
    if (cat === '패딩' || has(n, /겨울|기모|플리스|후리스|보아|양털|뽀글이|방한|패딩|본딩/)) return '겨울';
    if (has(n, /쿨론|쿨에버|에어로쿨|드라이|매쉬|반바지|UV|인터록|바이오워싱/)) return '여름';
    if (has(n, /바람막이|항공점퍼|맨투맨|후드|쮸리|쭈리|테리/)) return '봄·가을';
    return '사계절';
  }
  function matOf(n) {
    if (has(n, /쿨론|쿨에버|에어로쿨|드라이|인터록|기능성|매쉬/)) return '기능성 폴리에스터';
    if (has(n, /플리스|후리스|보아|양털|뽀글이|폴라폴리스/)) return '플리스';
    if (has(n, /웰론|패딩|누빔|퀄팅/)) return '패딩 충전재';
    if (has(n, /기모/)) return '기모';
    if (has(n, /쮸리|쭈리|테리|특양면|17수|20수|바이오워싱|레브싱글/)) return '면 혼방';
    if (has(n, /바람막이|윈드|항공점퍼|스판|카고/)) return '나일론·폴리';
    return '폴리에스터';
  }
  function formOf(cat, n) {
    if (cat === '라운드 티셔츠') return '라운드넥';
    if (cat === '카라 티셔츠') return has(n, /지퍼/) ? '지퍼 카라' : '카라';
    if (cat === '후드 티셔츠') return has(n, /집업/) ? '집업' : '후드';
    if (cat === '맨투맨 티셔츠') return '라운드넥';
    if (cat === '조끼') return '조끼';
    if (cat === '자켓') return has(n, /후드|후디/) ? '후드' : '집업';
    if (cat === '패딩') return has(n, /후드|모자/) ? '후드' : '집업';
    if (cat === '바지') return has(n, /반바지/) ? '반바지' : '긴바지';
    return '볼캡';
  }
  function priceNum(p) { var m = /([\d,]+)원/.exec(p); if (m) return Number(m[1].replace(/,/g, '')); m = /(\d+)만원대/.exec(p); return m ? Number(m[1]) * 10000 : 0; }
  function band(n) { return !n ? '견적문의' : n < 10000 ? '1만원 미만' : n < 20000 ? '1만원대' : n < 30000 ? '2만원대' : n < 40000 ? '3만원대' : n < 50000 ? '4만원대' : '5만원 이상'; }

  var P = {}, LIST = [], order = 0;
  function add(cat, d) {
    if (P['c' + d.id]) return;
    var sw = d.sw || [], more = parseInt(d.more, 10) || 0, pn = priceNum(d.price);
    var hi = (window.B2BT_HI || []).indexOf(d.id) >= 0;
    var p = { key: 'c' + d.id, id: d.id, cat: cat, name: d.name, code: d.code || '', size: d.size, sizes: sizes(d.size), price: d.price, priceNum: pn, band: band(pn),
      colors: sw.map(function (h) { return { hex: h, name: COLOR[h.toUpperCase()] || '기타' }; }), more: more, nColors: sw.length + more,
      imgs: d.b && d.b !== d.f ? ['img/catalog/' + d.f, 'img/catalog/' + d.b] : ['img/catalog/' + d.f],
      hi: hi ? ['img/shop/' + d.id + '-front.webp', 'img/shop/' + d.id + '-back.webp'] : null,
      sub: subOf(cat, d.name), season: seasonOf(cat, d.name), material: matOf(d.name), form: formOf(cat, d.name), order: order++, brand: '' };
    P[p.key] = p; LIST.push(p);
  }
  (window.B2BT_CATALOG || []).forEach(function (c) { c.items.forEach(function (d) { add(c.cat, d); }); });
  ((window.B2BT_RANK || {}).extra || []).forEach(function (c) { c.items.forEach(function (d) { add(c.cat, d); }); });
  (window.B2BT_EXTRA || []).forEach(function (c) { c.items.forEach(function (d) { add(c.cat, d); }); });
  // 상세 사진이 여러 장 있는 상품(img/products/<번호>-1~4.webp)
  [194, 206, 227, 288, 431, 463, 465, 475].forEach(function (id) { var p = P['c' + id]; if (p) p.gallery = [1, 2, 3, 4].map(function (n) { return 'img/products/' + id + '-' + n + '.webp'; }); });

  // 협력브랜드 상품: 가격·사이즈·색상 자료가 없어 "견적문의"로 나온다
  var BRANDS = (window.B2BT_BRANDS || []).map(function (b) {
    var items = b.items.map(function (d) {
      var kind = /안전모|죔줄|안전그네|카라비너|BUMP|MP|가방|넥게이터|스웨어|LT-|딜리버리|안전화|장갑|마스크/.test(d.name) ? '안전·보호구' : '의류·작업복';
      var form = /안전모|BUMP|MP/.test(d.name) ? '안전모' : /죔줄|안전그네|카라비너/.test(d.name) ? '추락 방지' : /가방|스웨어/.test(d.name) ? '가방·소품' : /LT-|딜리버리|안전화/.test(d.name) ? '안전화' : /넥게이터|비니|모자/.test(d.name) ? '방한 소품' : /PT-|바지|팬츠/.test(d.name) ? '바지' : /JK-|자켓|J\/P|점퍼|패딩/.test(d.name) ? '자켓·점퍼' : /티셔츠|TS-|T-/.test(d.name) ? '티셔츠' : '작업복';
      var p = { key: 'b' + d.id, id: d.id, cat: b.en, brand: b.key, brandKo: b.ko, name: d.name, code: '', size: '', sizes: [], price: '견적문의', priceNum: 0, band: '견적문의', colors: [], more: 0, nColors: 0,
        imgs: ['img/brandp/' + d.id + '.webp'], kind: kind, form: form, order: order++ };
      P[p.key] = p; return p;
    });
    return { key: b.key, en: b.en, ko: b.ko, count: b.count, logo: 'img/brandlogo/' + b.key + '.webp', items: items };
  });

  var IC = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  /* 상품 카드: 홈의 .pc 마크업 그대로(빠른 보기 없음 · 장바구니는 상품 상세로 이동).
     opt: {rank, liked, kind, lazy:false, plain:true(관심·장바구니 단추 없음), pick:true(고르기 단추)} */
  function card(p, opt) {
    opt = opt || {};
    var href = 'product.php?id=' + p.id + (p.brand ? '&brand=' + p.brand : '');
    var imgs = p.imgs.slice(0, 2).map(function (src, i) {
      return '<img class="' + (i ? 'alt' : 'is-on') + '" src="' + src + '" alt="' + (i ? '' : esc(p.name)) + '" width="600" height="600"' + (opt.lazy === false ? '' : ' loading="lazy"') + ' decoding="async" draggable="false">';
    }).join('');
    var dots = p.colors.slice(0, 5).map(function (c) { return '<span class="dot" style="--c:' + c.hex + '" title="' + esc(c.name) + '"></span>'; }).join('');
    var rest = p.nColors - Math.min(p.colors.length, 5);
    if (dots && rest > 0) dots += '<span class="pc__swmore">+' + rest + '</span>';
    var metas = '';
    if (p.size) metas += '<p class="pc__meta">' + esc(p.sizes.length > 1 ? p.size : p.sizes.length ? p.sizes[0].l : p.size) + '</p>';
    if (p.nColors > 1 && !opt.slim) metas += '<p class="pc__meta">색상 ' + p.nColors + '종</p>';
    var cat = [opt.kind, p.brand ? p.cat : (opt.sub ? p.sub : p.cat)].filter(Boolean).map(esc).join(' · ');
    var price = p.priceNum ? '<p class="pc__price num">' + esc(p.price) + '</p>' : '<p class="pc__price pc__price--q">견적문의</p>';
    var acts = opt.plain ? '' : '<div class="pc__acts"><button type="button" class="act act--like" aria-pressed="' + (opt.liked ? 'true' : 'false') + '" aria-label="' + (opt.liked ? '관심상품에서 빼기' : '관심상품 담기') + '">' + IC.heart + '</button>' +
      '<a class="act act--cart" href="#" data-href="' + href + '" aria-label="' + esc(p.name) + ' 장바구니 담으러 가기">' + IC.bag + '</a></div>';
    return '<article class="pc pc--swap' + (p.imgs.length > 1 ? ' pc--two' : '') + '" data-key="' + p.key + '">' +
      '<div class="pc__media">' + imgs + (opt.rank ? '<span class="pc__rank num"><span class="sr-only">순위 </span>' + opt.rank + '</span>' : '') + acts +
      (dots ? '<div class="pc__sw">' + dots + '</div>' : '') + '</div>' +
      '<p class="pc__cat">' + cat + '</p><a class="pc__name" href="#" data-href="' + href + '"><span>' + esc(p.name) + '</span></a>' +
      (metas ? '<div class="pc__ms">' + metas + '</div>' : '') + price + '</article>';
  }
  /* 쪽 번호: 5개 묶음, 처음·이전 묶음·다음 묶음·마지막. all=true 면 모든 쪽 번호 */
  function pager(cur, total, all) {
    if (total <= 1) return '';
    var s = all ? 1 : Math.floor((cur - 1) / 5) * 5 + 1, e = all ? total : Math.min(total, s + 4), h = '';
    function b(n, label, icon, dis) { return '<button type="button" data-page="' + n + '" aria-label="' + label + '"' + (dis ? ' aria-disabled="true"' : '') + '><i class="i i-' + icon + '" aria-hidden="true"></i></button>'; }
    if (!all) h += b(1, '처음 쪽', 'first', cur === 1) + b(Math.max(1, s - 5), '이전 묶음', 'chev-l', s === 1);
    for (var i = s; i <= e; i++) h += '<button type="button" data-page="' + i + '"' + (i === cur ? ' aria-current="page"' : '') + ' aria-label="' + i + '쪽">' + i + '</button>';
    if (!all) h += b(Math.min(total, s + 5), '다음 묶음', 'chev-r', e === total) + b(total, '마지막 쪽', 'last', cur === total);
    return h;
  }
  window.SUBDATA = { P: P, list: LIST, brands: BRANDS, color: COLOR, card: card, pager: pager, sizes: sizes, esc: esc, band: band,
    cats: ['라운드 티셔츠', '카라 티셔츠', '맨투맨 티셔츠', '후드 티셔츠', '조끼', '자켓', '패딩', '바지', '모자'] };
})();
