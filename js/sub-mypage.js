/* 비투비티 마이페이지 · sub-mypage.js (2026-11-17)
   하는 일: 부분 이름(경로) · 새 소식 수 · 주문 내역(단계·기간·상태 거르기, 조건별 버튼, 주문 상세·입금 안내·후기) · 문의 답변 펼침
           · 관심상품 빼기·전체 삭제 · 포인트 기간 조회 · 배송지 추가·수정·삭제 · 회원정보·비밀번호·탈퇴 처리
   상태 보기(?state=)는 js/sub.js 가 맡고, 이 파일은 그 상태에 맞춰 견본 값을 채운다. 주문·포인트·배송지 값은 모두 견본(운영 자료로 바뀔 자리)이다. */
(function () {
  'use strict';
  var S = window.SUB, D = window.SUBDATA;
  if (!S) return;
  var $ = S.$, $$ = S.$$, esc = S.esc;
  var TODAY = '2026-11-17';
  var TEL = '0507-1378-6094';
  var empty = S.has('empty');
  function won(n) { return Number(n).toLocaleString('ko-KR'); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function back(days) { var t = new Date(TODAY + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - days); return iso(t); }
  var viewBox = $('#myViews');
  var now = viewBox ? viewBox.getAttribute('data-view-now') : 'orders';

  /* ---------- 경로 · 부분 이름 ---------- */
  var NAMES = { orders: '주문 내역', inquiries: '견적문의 내역', safety: '안전용품 제작 문의', wishlist: '관심상품', points: '포인트 내역', addresses: '배송지 관리', profile: '회원정보 수정', password: S.has('social') ? '로그인 비밀번호 설정' : '비밀번호 변경', withdraw: '회원 탈퇴' };
  function crumb(v) {
    var c = $('#myCrumb'); if (!c) return;
    if (S.auth === 'guest') { c.textContent = '마이페이지'; $('#myCrumbUp').hidden = true; $('.my__crumbsep').hidden = true; return; }
    c.textContent = NAMES[v] || NAMES.orders;
    // 폰 메뉴: 지금 부분이 보이게 가로로 밀어 둔다
    var nav = $('.my-mnav'), cur = nav && $('[aria-current]', nav);
    if (nav && cur) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
  }
  crumb(now);
  document.addEventListener('view', function (e) { now = e.detail; crumb(now); });

  /* ---------- 새 소식 수(99 초과는 99+, 0이면 지움) ---------- */
  var NB = { orders: 3, inquiries: 2, safety: 1 };
  function nbDraw(key) {
    var n = NB[key];
    $$('[data-nb="' + key + '"]').forEach(function (b) {
      if (n <= 0) { b.hidden = true; return; }
      var t = n > 99 ? '99+' : String(n);
      b.hidden = false; b.textContent = t; b.setAttribute('aria-label', '새 소식 ' + t + '건');
    });
  }
  function nbDown(key) { if (NB[key] > 0) { NB[key]--; nbDraw(key); } }
  if (empty && NB[now] != null) { NB[now] = 0; nbDraw(now); }

  /* ---------- 주문 견본 ---------- */
  // stage: before 결제전 · paid 결제완료 · ready 상품준비중 · ship 배송중 · done 배송완료 · fixed 구매확정 · cancel · exchange · return
  var STAGE = { before: '결제전', paid: '결제완료', ready: '상품준비중', ship: '배송중', done: '배송완료', fixed: '구매확정', cancel: '취소', exchange: '교환', 'return': '반품' };
  var ORDERS = [
    { no: 'O-20261115-0007', date: '2026-11-15', st: '입금 대기', stage: 'before', tone: 'ink', news: 1, img: 288, name: '멀티연사 기능성 카라 티셔츠', more: 0, opt: '그린 · S 10 / M 20 / L 15 / XL 5', qty: 50, amtL: '견적금액', amt: 722500, pay: '무통장입금',
      say: '무통장입금을 기다리고 있습니다. 입금이 확인되면 제작을 시작합니다.', acts: ['bank'], msg: '',
      items: [{ k: 'c288', color: '그린', sz: 'S 10 · M 20 · L 15 · XL 5', qty: 50, pack: '기본 포장', opt: '-', pr: ['실크 인쇄', '왼쪽 가슴', '회사 로고 1도, 가로 9cm'] }] },
    { no: 'R-20261112-0031', date: '2026-11-12', st: '시안·견적 완료', stage: 'before', tone: 'ink', news: 1, img: 460, name: '방한 후드 패딩', more: 2, opt: '블랙 · 90 5 / 95 20 / 100 30 / 105 15', qty: 112, amtL: '견적금액', amt: 5281100,
      say: '시안과 견적서가 도착했습니다. 확인한 뒤 시안을 승인하거나 수정을 요청해 주세요.', acts: ['draftq'], msg: '자수 위치는 첨부하신 그림대로 잡았습니다. 등판 문구 크기는 시안에서 확인해 주세요.',
      items: [{ k: 'c460', color: '블랙', sz: '90 5 · 95 20 · 100 30 · 105 15', qty: 70, pack: '개별 폴리백', opt: '-', pr: ['자수 인쇄', '왼쪽 가슴, 등', '왼쪽 가슴 회사 로고, 등판 회사명 한 줄 (첨부: 로고_시안.ai, 가슴_인쇄_위치.png)'] },
        { k: 'c195', color: '네이비', sz: 'M 10 · L 12 · XL 8', qty: 30, pack: '기본 포장', opt: '-', pr: null },
        { k: 'b3026', color: '-', sz: '', qty: 12, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'R-20261110-0027', date: '2026-11-10', st: '견적 완료', stage: 'before', tone: 'ink', news: 0, img: 463, name: '세이프티 방한 패딩', more: 0, opt: '블랙 · 95 10 / 100 15 / 105 10', qty: 35, amtL: '견적금액', amt: 1858500,
      say: '견적서가 도착했습니다. 견적서 유효기간은 2026-11-25까지입니다.', acts: ['quotepay'], msg: '30벌 이상 수량 할인을 반영했습니다.',
      items: [{ k: 'c463', color: '블랙', sz: '95 10 · 100 15 · 105 10', qty: 35, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'R-20261108-0024', date: '2026-11-08', st: '시안 완료', stage: 'before', tone: 'ink', news: 0, img: 431, name: '기모 T/C 후드집업', more: 0, opt: '그레이 · M 8 / L 12 / XL 6', qty: 26, amtL: '견적금액', amt: 0,
      say: '시안이 도착했습니다. 시안 확인 화면에서 승인하거나 수정을 요청해 주세요.', acts: ['draft'], msg: '',
      items: [{ k: 'c431', color: '그레이', sz: 'M 8 · L 12 · XL 6', qty: 26, pack: '기본 포장', opt: '-', pr: ['디지털 전사', '등', '팀 이름과 연도, 가로 28cm'] }] },
    { no: 'R-20261106-0021', date: '2026-11-06', st: '접수 대기', sub: '시안 수정 요청', stage: 'before', tone: '', news: 0, img: 227, name: '특양면 베이직 맨투맨', more: 0, opt: '핑크 · 100 10 / 105 10', qty: 20, amtL: '견적금액', amt: 0,
      say: '요청하신 수정 내용을 반영해 시안을 다시 만들고 있습니다.', warn: '견적금액이 정해지기 전에는 결제할 수 없습니다.', warnEl: 'L1268', acts: [], msg: '',
      items: [{ k: 'c227', color: '핑크', sz: '100 10 · 105 10', qty: 20, pack: '기본 포장', opt: '-', pr: ['실크 인쇄', '앞판 가운데', '로고 2도, 가로 22cm'] }] },
    { no: 'O-20261105-0006', date: '2026-11-05', st: '상품준비중', stage: 'ready', tone: '', news: 0, img: 206, name: '뽀글이 양털 겨울조끼', more: 0, opt: '그레이 · M 5 / L 10 / XL 5', qty: 20, amtL: '결제금액', amt: 532000, pay: '신용·체크카드',
      say: '상품을 준비하고 있습니다.', warn: '운송장이 아직 등록되지 않았습니다. 등록되면 배송조회를 할 수 있습니다.', warnEl: 'L1267', acts: [], msg: '',
      items: [{ k: 'c206', color: '그레이', sz: 'M 5 · L 10 · XL 5', qty: 20, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'O-20261103-0005', date: '2026-11-03', st: '배송중', stage: 'ship', tone: '', news: 1, img: 475, name: '데일리 투톤 플리스자켓', more: 0, opt: '아이보리 · L 15 / XL 15', qty: 30, amtL: '결제금액', amt: 670000, pay: '신용·체크카드',
      say: 'CJ대한통운 6012-3456-7890 · 11월 18일 도착 예정입니다.', acts: ['track'], msg: '두 상자로 나누어 보냈습니다.',
      items: [{ k: 'c475', color: '아이보리', sz: 'L 15 · XL 15', qty: 30, pack: '개별 폴리백', opt: '-', pr: null }] },
    { no: 'O-20261028-0004', date: '2026-10-28', st: '배송 완료', sub: '후불 결제', stage: 'done', tone: 'ink', news: 0, img: 465, name: '모자 일체형 하프패딩', more: 0, opt: '그레이 · 100 20 / 105 20 / 110 10', qty: 50, amtL: '견적금액', amt: 2550000, pay: '후불결제',
      say: '배송이 끝났습니다. 후불 결제 금액을 결제해 주세요.', acts: ['postpay'], msg: '',
      items: [{ k: 'c465', color: '그레이', sz: '100 20 · 105 20 · 110 10', qty: 50, pack: '기본 포장', opt: '-', pr: ['자수 인쇄', '왼쪽 가슴', '기관 로고'] }] },
    { no: 'O-20261024-0003', date: '2026-10-24', st: '배송 완료', stage: 'done', tone: 'ink', news: 0, img: 194, name: '리버시블 양면 겨울조끼', more: 0, opt: '화이트 · M 10 / L 10 / XL 5', qty: 25, amtL: '결제금액', amt: 1045000, pay: '무통장입금',
      say: '배송이 끝났습니다. 받은 상품을 확인한 뒤 구매확정해 주세요.', acts: ['confirm'], msg: '',
      items: [{ k: 'c194', color: '화이트', sz: 'M 10 · L 10 · XL 5', qty: 25, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'O-20261022-0002', date: '2026-10-22', st: '반품', stage: 'return', tone: 'red', news: 0, img: 0, name: '쿨론 라운드 티셔츠(판매 종료 상품)', more: 0, opt: '', qty: 10, amtL: '결제금액', amt: 128000, pay: '신용·체크카드',
      say: '반품을 마쳤습니다. 결제 금액은 결제한 수단으로 돌려드렸습니다.', acts: [], msg: '',
      items: [{ k: '', name: '쿨론 라운드 티셔츠(판매 종료 상품)', color: '화이트', sz: '', qty: 10, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'O-20261020-0001', date: '2026-10-20', st: '구매확정', stage: 'fixed', tone: 'line', news: 0, img: 195, name: '웰론 보온 겨울조끼', more: 0, opt: '베이지 · M 4 / L 4 / XL 3', qty: 11, amtL: '결제금액', amt: 292600, pay: '신용·체크카드',
      say: '2026-11-12 구매확정 · 포인트 2,950P를 적립했습니다.', acts: ['review'], msg: '',
      items: [{ k: 'c195', color: '베이지', sz: 'M 4 · L 4 · XL 3', qty: 11, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'O-20261018-0002', date: '2026-10-18', st: '구매확정', sub: '후불 결제 완료', stage: 'fixed', tone: 'line', news: 0, img: 460, name: '방한 후드 패딩', more: 0, opt: '블랙 · 95 4 / 100 4', qty: 8, amtL: '결제금액', amt: 472000, pay: '후불결제',
      say: '2026-10-28 구매확정 · 포인트 4,200P를 적립했습니다. 후기를 남기셨습니다.', acts: ['myreview'], msg: '',
      rv: { star: 5, date: '2026-10-30', open: false, img: ['img/catalog/460-f.webp', 'img/catalog/460-b.webp'], text: '현장 직원 여덟 명이 입을 패딩을 맞췄습니다.\n생각보다 두툼하고 지퍼가 부드럽습니다. 왼쪽 가슴 자수도 깔끔하게 나왔습니다.' },
      items: [{ k: 'c460', color: '블랙', sz: '95 4 · 100 4', qty: 8, pack: '기본 포장', opt: '-', pr: ['자수 인쇄', '왼쪽 가슴', '회사 로고'] }] },
    { no: 'O-20260924-0003', date: '2026-09-24', st: '구매확정', stage: 'fixed', tone: 'line', news: 0, img: 288, name: '멀티연사 기능성 카라 티셔츠', more: 0, opt: '그린 · M 4 / L 6 / XL 2', qty: 12, amtL: '결제금액', amt: 193800, pay: '신용·체크카드',
      say: '2026-10-05 구매확정 · 포인트 1,800P를 적립했습니다. 후기를 남기셨습니다.', acts: ['myreview'], msg: '',
      rv: { star: 4, date: '2026-10-07', open: true, img: ['img/catalog/288-f.webp'], text: '여름 행사용으로 맞췄습니다. 땀이 나도 금방 마르고 색이 선명합니다.' },
      items: [{ k: 'c288', color: '그린', sz: 'M 4 · L 6 · XL 2', qty: 12, pack: '기본 포장', opt: '-', pr: null }] },
    { no: 'O-20260910-0001', date: '2026-09-10', st: '취소', stage: 'cancel', tone: 'red', news: 0, img: 137, name: '기능성 쿨론 티셔츠', more: 0, opt: '블랙 · L 10 / XL 10', qty: 20, amtL: '결제금액', amt: 180000, pay: '신용·체크카드',
      say: '주문을 취소했습니다. 사용한 포인트 3,000P는 돌려드렸습니다.', acts: [], msg: '',
      items: [{ k: 'c137', color: '블랙', sz: 'L 10 · XL 10', qty: 20, pack: '기본 포장', opt: '-', pr: null }] }
  ];
  function byNo(no) { for (var i = 0; i < ORDERS.length; i++) if (ORDERS[i].no === no) return ORDERS[i]; return null; }
  var LIST = empty ? [] : ORDERS;

  function btn(kind, o) {
    var no = encodeURIComponent(o.no);
    switch (kind) {
      case 'bank': return '<button type="button" class="sb sb--ink sb--m" data-act="bank" data-el="L1259">입금 안내 보기</button>';
      case 'draftq': return '<a class="sb sb--ink sb--m" href="#" data-href="draft-preview.php?no=' + no + '" target="_blank" data-el="L1255 L1256">시안 확인<span class="sr-only"> (새 창)</span></a>' +
        '<a class="sb sb--line sb--m" href="#" data-href="quote-request-document.php?no=' + no + '" target="_blank" data-el="L1255">견적서 확인<span class="sr-only"> (새 창)</span></a>';
      case 'quotepay': return '<a class="sb sb--ink sb--m" href="#" data-href="order.php?no=' + no + '" data-pay data-el="L1258">결제진행</a>' +
        '<a class="sb sb--line sb--m" href="#" data-href="quote-request-document.php?no=' + no + '" target="_blank" data-el="L1258">견적서 보기<span class="sr-only"> (새 창)</span></a>';
      case 'draft': return '<a class="sb sb--ink sb--m" href="#" data-href="draft-preview.php?no=' + no + '" target="_blank" data-el="L1256">시안 확인<span class="sr-only"> (새 창)</span></a>';
      case 'track': return '<a class="sb sb--ink sb--m" href="https://www.cjlogistics.com/ko/tool/parcel/tracking" target="_blank" rel="noopener" data-sample data-el="L1257">배송조회<span class="sr-only"> (택배사 화면, 새 창)</span></a>';
      case 'postpay': return '<a class="sb sb--ink sb--m" href="#" data-href="order.php?no=' + no + '&amp;pay=later" data-pay data-el="L1260">결제진행</a>';
      case 'confirm': return '<button type="button" class="sb sb--ink sb--m" data-act="confirm" data-el="L1261">구매확정</button>';
      case 'review': return '<button type="button" class="sb sb--ink sb--m" data-act="review" data-el="L1262">리뷰 쓰기</button>';
      case 'myreview': return '<button type="button" class="sb sb--line sb--m" data-act="myreview" data-el="L1263">내가 쓴 리뷰 보기</button>';
    }
    return '';
  }
  function tag(o) {
    return '<span class="stag' + (o.tone ? ' stag--' + o.tone : '') + '">' + esc(o.st) + '</span>' + (o.sub ? '<span class="stag stag--line">' + esc(o.sub) + '</span>' : '');
  }
  function thumb(src, alt, cls, w) {
    return src ? '<img class="' + cls + '" src="' + src + '" alt="' + esc(alt || '') + '" width="' + w + '" height="' + w + '" loading="lazy" decoding="async">'
      : '<span class="' + cls + ' ' + cls + '--none" role="img" aria-label="상품 사진 없음"><i class="i i-shirt" aria-hidden="true"></i></span>';
  }
  var pick = S.qs.get('order');
  function nActs(o) { return o.acts.reduce(function (n, k) { return n + (k === 'draftq' || k === 'quotepay' ? 2 : 1); }, 0); }
  function card(o) {
    var acts = o.acts.map(function (k) { return btn(k, o); }).join('');
    var amt = o.amt ? '<b class="num">' + won(o.amt) + '</b>원' : '<b>-</b><small>정하는 중</small>';
    // 폰: 머리 줄(번호·상태) → 사진 + 상품명·옵션 → 접수일·금액 | 버튼. 버튼이 둘이면 버튼 줄을 따로 둔다(--a2)
    return '<article class="my-ord my-ord--a' + nActs(o) + (o.news ? ' is-new' : '') + (pick === o.no ? ' is-pick' : '') + '" data-no="' + o.no + '"' + (pick === o.no ? ' data-el="L1240 L1217" tabindex="-1"' : '') + '>' +
      '<header class="my-ord__hd"><span class="my-ord__date num">' + o.date + '</span>' +
      '<button type="button" class="my-ord__no num" data-act="detail" aria-label="주문번호 ' + o.no + ' 주문 상세 보기">' + o.no + '</button>' +
      (o.news ? '<span class="nd"><span class="sr-only">새 소식</span></span>' : '') +
      '<span class="my-ord__tags">' + tag(o) + '</span>' +
      '<button type="button" class="my-ord__more" data-act="detail"><span class="my-ord__mt">주문 상세</span><i class="i i-chev-r i--16" aria-hidden="true"></i></button></header>' +
      '<div class="my-ord__bd">' + thumb(o.img ? 'img/catalog/' + o.img + '-f.webp' : '', '', 'my-ord__img', 72) +
      '<div class="my-ord__info"><p class="my-ord__name">' + esc(o.name) + (o.more ? '<span> 외 ' + o.more + '건</span>' : '') + '</p>' +
      '<p class="my-ord__opt">' + (o.opt ? esc(o.opt) + ' · ' : '') + '총 <span class="num">' + o.qty + '</span>벌</p>' +
      '<p class="my-ord__say">' + esc(o.say) + '</p>' + (o.warn ? '<p class="my-ord__warn" data-el="' + o.warnEl + '"><i class="i i-info i--16" aria-hidden="true"></i>' + esc(o.warn) + '</p>' : '') + '</div>' +
      '<div class="my-ord__amt"><span class="my-ord__d2 num">' + o.date + ' 접수</span><span class="my-ord__al">' + o.amtL + '</span><span class="my-ord__av">' + amt + '</span></div>' +
      (acts ? '<div class="my-ord__acts">' + acts + '</div>' : '') + '</div></article>';
  }

  /* ---------- 주문 내역: 단계·기간·상태 거르기 ---------- */
  var unfold = false, FOLD = 0, ordBox = $('#myOrders'), F = { stage: S.has('shipping') ? 'ship' : '', from: back(31), to: TODAY };
  if (pick && byNo(pick)) { var po = byNo(pick); if (po.date < F.from) F.from = back(90); }
  var tool = $('#myOrdTool'), sel = $('#myOrdSel');
  function setDates(box, from, to) { var d = $$('input[type=date]', box); if (d[0]) d[0].value = from; if (d[1]) d[1].value = to; }
  function pressRange(box, n) { $$('[data-range]', box).forEach(function (x) { x.setAttribute('aria-pressed', String(Number(x.getAttribute('data-range')) === n)); }); }
  function ordDraw() {
    if (!ordBox) return;
    var inR = LIST.filter(function (o) { return o.date >= F.from && o.date <= F.to; });
    var cnt = {}; inR.forEach(function (o) { cnt[o.stage] = (cnt[o.stage] || 0) + 1; });
    $$('[data-stage]').forEach(function (b) {
      var k = b.getAttribute('data-stage'), n = cnt[k] || 0;
      $('b', b).textContent = n; b.classList.toggle('is-on', n > 0); b.setAttribute('aria-pressed', String(F.stage === k));
      b.setAttribute('aria-label', STAGE[k] + ' ' + n + '건' + (F.stage === k ? ', 고름' : ''));
    });
    if (sel) sel.value = F.stage;
    var show = inR.filter(function (o) { return !F.stage || o.stage === F.stage; });
    // 폰: 12건이 넘으면 열 건만 펼쳐 두고 나머지는 "더 보기"로 접는다(같은 목록, 쪽 나눔 없음. 기본 1개월 12건은 모두 보인다)
    var cut = !unfold && show.length > 12 ? 10 : show.length;
    FOLD = cut;
    if (pick) show.forEach(function (o, i) { if (o.no === pick && i >= cut) cut = show.length; });
    ordBox.innerHTML = show.map(function (o, i) { var h = card(o); return i >= cut ? h.replace('class="my-ord', 'class="my-ord is-fold') : h; }).join('') +
      (cut < show.length ? '<button type="button" class="sb sb--line sb--block my-ords__more" id="myOrdMore"><span>나머지 주문 <span class="num">' + (show.length - cut) + '</span>건 더 보기</span><i class="i i-chev-d i--16" aria-hidden="true"></i></button>' : '');
    var cond = $('#myOrdCond');
    if (cond) cond.innerHTML = '<b>' + (F.stage ? STAGE[F.stage] : '전체') + '</b> · <span class="num">' + F.from + ' ~ ' + F.to + '</span> · <b class="num">' + show.length + '</b>건' + (F.stage ? ' <button type="button" class="my-cond__x" data-stage-clear>단계 풀기<i class="i i-x i--14" aria-hidden="true"></i></button>' : '');
    var none = $('#myOrdNone'); if (none) none.hidden = show.length > 0;
  }
  if (tool) {
    setDates(tool, F.from, F.to);
    tool.addEventListener('period', function () {
      var p = $('[data-range][aria-pressed="true"]', tool), n = p ? Number(p.getAttribute('data-range')) : 30;
      F.from = back(n === 30 ? 31 : n === 90 ? 92 : 7); F.to = TODAY; setDates(tool, F.from, F.to); ordDraw();
    });
    $('.my-tool__go', tool).addEventListener('click', function () {
      var d = $$('input[type=date]', tool), a = d[0].value, b = d[1].value;
      if (!a || !b) { S.toast('조회 시작일과 종료일을 골라 주세요.', { error: true }); return; }
      if (a > b) { S.toast('시작일이 종료일보다 늦습니다. 날짜를 확인해 주세요.', { error: true }); return; }
      F.from = a; F.to = b; pressRange(tool, -1); ordDraw();
    });
    sel && sel.addEventListener('change', function () { F.stage = sel.value; ordDraw(); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-stage]');
    if (b && b.closest('.my-step')) { var k = b.getAttribute('data-stage'); F.stage = F.stage === k ? '' : k; ordDraw(); return; }
    if (e.target.closest('[data-stage-clear]')) { F.stage = ''; ordDraw(); return; }
    if (e.target.closest('#myOrdMore')) { var at = FOLD; unfold = true; ordDraw(); var fN = $$('.my-ord', ordBox)[at]; if (fN) { fN.setAttribute('tabindex', '-1'); fN.focus({ preventScroll: true }); } return; }
    if (e.target.closest('#myOrdReset')) { F.stage = ''; F.from = back(92); F.to = TODAY; setDates(tool, F.from, F.to); pressRange(tool, 90); ordDraw(); }
  });
  ordDraw();
  if (pick) { var pc = $('.my-ord.is-pick'); if (pc) setTimeout(function () { pc.scrollIntoView({ block: 'center' }); pc.focus({ preventScroll: true }); }, 60); }

  /* 주문 카드 안의 동작 */
  var cur = null;
  if (ordBox) ordBox.addEventListener('click', function (e) {
    var c = e.target.closest('.my-ord'); if (!c) return;
    var o = byNo(c.getAttribute('data-no')); cur = o;
    // 새 소식 확인 처리: 주문을 누르면 확인됨
    if (o.news) { o.news = 0; c.classList.remove('is-new'); var nd = $('.nd', c); if (nd) nd.remove(); nbDown('orders'); }
    var a = e.target.closest('[data-act]');
    if (e.target.closest('[data-pay]') && S.has('payfail')) { e.preventDefault(); e.stopPropagation(); payFail(); return; }
    if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'detail') openDetail(o, a);
    else if (act === 'bank') openBank(o, a);
    else if (act === 'review') openReview(o, a);
    else if (act === 'myreview') openMyReview(o, a);
    else if (act === 'confirm') confirmOrder(o);
  }, true);

  function payFail() { S.toast('결제를 진행할 수 없는 주문입니다. 고객센터(' + TEL + ')로 문의해 주세요.', { error: true, ms: S.has('payfail') ? 60000 : 4000 }); }
  function confirmOrder(o) {
    if (S.has('confirmfail')) { S.toast('구매확정할 수 없는 주문입니다. 배송이 끝난 주문만 구매확정할 수 있습니다.', { error: true }); return; }
    S.confirm({ title: '구매확정할까요?', desc: '구매확정하면 되돌릴 수 없습니다. 포인트가 적립되고 구매확정 안내 메일을 보냅니다.', ok: '구매확정', cancel: '닫기', icon: 'check',
      onOk: function () {
        o.st = '구매확정'; o.stage = 'fixed'; o.tone = 'line'; o.acts = ['review']; o.say = TODAY + ' 구매확정 · 포인트 적립 내역은 포인트 내역에서 볼 수 있습니다.';
        ordDraw(); S.toast('구매확정했습니다. 포인트가 적립되었습니다.');
      } });
  }

  /* 주문 상세 */
  function item(it) {
    var p = it.k && D ? D.P[it.k] : null, name = p ? p.name : it.name;
    var img = p ? p.imgs[0] : '';
    var href = p ? 'product.php?id=' + p.id + (p.brand ? '&amp;brand=' + p.brand : '') : '';
    var pr = it.pr ? esc(it.pr[0]) + ' · ' + esc(it.pr[1]) + '<small>' + esc(it.pr[2]) + '</small>' : '<span class="my-dt__no">인쇄 없음</span>';
    return '<li class="my-dt__it">' + thumb(img, name, 'my-dt__img', 88) + '<div class="my-dt__iv">' +
      (href ? '<a class="my-dt__name" href="#" data-href="' + href + '">' + esc(name) + '<i class="i i-chev-r i--16" aria-hidden="true"></i></a>' : '<p class="my-dt__name">' + esc(name) + '</p>') +
      '<dl class="my-dt__dl"><div><dt>색상</dt><dd>' + esc(it.color) + '</dd></div><div><dt>사이즈별 수량</dt><dd class="num">' + (it.sz ? esc(it.sz) : '-') + '</dd></div>' +
      '<div><dt>총수량</dt><dd><b class="num">' + it.qty + '</b>벌</dd></div><div><dt>포장</dt><dd>' + esc(it.pack) + '</dd></div>' +
      '<div><dt>상품 옵션</dt><dd>' + esc(it.opt) + '</dd></div><div class="my-dt__pr"><dt>인쇄</dt><dd>' + pr + '</dd></div></dl></div></li>';
  }
  function openDetail(o, from) {
    var body = $('#myDetailBody'); if (!body) return;
    body.innerHTML = '<div class="my-dt__top"><dl class="dl my-dt__sum">' +
      '<div><dt>주문번호</dt><dd class="num">' + o.no + '</dd></div><div><dt>접수일</dt><dd class="num">' + o.date + '</dd></div>' +
      '<div><dt>현재 상태</dt><dd class="my-dt__st">' + tag(o) + '<span class="my-dt__say">' + esc(o.say) + '</span></dd></div><div><dt>상품 수</dt><dd><span class="num">' + o.items.length + '</span>개 · 총 <span class="num">' + o.qty + '</span>벌</dd></div>' +
      '<div><dt>배송방법</dt><dd>기본배송/택배</dd></div></dl>' +
      '<div class="my-dt__msg"><p class="my-dt__lb"><i class="i i-chat i--16" aria-hidden="true"></i>담당자 메시지</p>' + (o.msg ? '<p>' + esc(o.msg) + '</p>' : '<p class="my-dt__none">담당자가 남긴 메시지가 없습니다.</p>') + '</div></div>' +
      '<h3 class="st st--s my-dt__h">주문 상품 <small>' + o.items.length + '개</small></h3><ul class="my-dt__items">' + o.items.map(item).join('') + '</ul>';
    $('#myDetailT').textContent = '주문 상세 · ' + o.no;
    S.pop('myDetail', from);
  }
  /* 입금 안내 */
  function openBank(o, from) {
    $('#myBankNo').textContent = o.no; $('#myBankAmt').textContent = won(o.amt); $('#myBankKind').textContent = o.amtL;
    S.pop('myBank', from);
  }
  /* 후기 쓰기 */
  var rvBox = $('#myRvUpl'), rvHas = $('#myRvHas');
  function rvCount() {
    var n = rvBox && rvBox._files ? rvBox._files.length : 0;
    var c = $('#myRvCnt'); if (c) c.textContent = n + ' / 5개';
    if (rvHas) rvHas.value = n ? String(n) : '';
    if (n) { var f = rvBox.closest('.fld'); if (f) f.classList.remove('is-err'); }
  }
  rvBox && rvBox.addEventListener('upl:change', rvCount);
  function openReview(o, from) {
    $('#myRvNo').textContent = o.no; $('#myRvName').textContent = o.name + (o.more ? ' 외 ' + o.more + '건' : '');
    var im = $('#myRvImg'); if (im && o.img) im.src = 'img/catalog/' + o.img + '-f.webp';
    S.pop('myRv', from);
  }
  $$('.my-star input').forEach(function (r) {
    r.addEventListener('change', function () {
      var v = Number(r.value), box = r.closest('.my-star');
      $$('label', box).forEach(function (l, i) { l.classList.toggle('is-on', i < v); });
      $('.my-star__v', box).textContent = v + '점';
      var f = box.closest('.fld'); if (f) f.classList.remove('is-err');
    });
  });
  var rvForm = $('#myRvForm');
  rvForm && rvForm.addEventListener('checked', function (e) { if (S.has('review-big')) { e.preventDefault(); S.toast('사진 용량이 커서 등록하지 못했습니다. 사진을 줄여 다시 올려 주세요.', { error: true }); } else { S.closePop('myRv'); } });
  /* 내가 쓴 후기 */
  var STAR = '<i class="i i-star" aria-hidden="true"></i>';
  function openMyReview(o, from) {
    var r = o.rv; if (!r) return;
    $('#myRvViewBody').innerHTML = '<div class="my-rvh">' + thumb('img/catalog/' + o.img + '-f.webp', '', 'my-rvh__img', 64) + '<div><p class="my-rvh__no num">' + o.no + '</p><p class="my-rvh__name">' + esc(o.name) + '</p></div></div>' +
      '<div class="my-rvv__meta"><span class="my-rvv__stars" role="img" aria-label="별점 5점 만점에 ' + r.star + '점">' + [1, 2, 3, 4, 5].map(function (i) { return '<span class="' + (i <= r.star ? 'is-on' : '') + '">' + STAR + '</span>'; }).join('') + '</span>' +
      '<span class="num">작성 ' + r.date + '</span>' + (r.open ? '<span class="stag stag--acc">공개됨</span>' : '<span class="stag">관리자 확인 후 공개</span>') + '</div>' +
      '<ul class="my-rvv__ph">' + r.img.map(function (s, i) { return '<li><img src="' + s + '" alt="후기 사진 ' + (i + 1) + '" width="200" height="200" loading="lazy" decoding="async" data-slot="review-photo"></li>'; }).join('') + '</ul>' +
      '<p class="my-rvv__txt">' + esc(r.text) + '</p><p class="my-rvv__help">등록한 후기는 이 화면에서 고칠 수 없습니다.</p>';
    S.pop('myRvView', from);
  }

  /* 상태 보기: 팝업을 그 상태로 연다 */
  if (!empty && now === 'orders') {
    if (S.has('detail')) openDetail(byNo('R-20261112-0031'));
    if (S.has('deposit')) openBank(byNo('O-20261115-0007'));
    if (S.has('review')) openReview(byNo('O-20261020-0001'));
    if (S.has('review-done')) S.pop('myRvDone');
    if (S.has('myreview')) openMyReview(byNo('O-20261018-0002'));
    if (S.has('payfail')) payFail();
    if (S.has('confirmfail')) S.toast('구매확정할 수 없는 주문입니다. 배송이 끝난 주문만 구매확정할 수 있습니다.', { error: true, ms: 60000 });
  }
  // 후기 입력 오류 상태: 견본 사진을 비우고 오류 표시
  if (S.has('review-err') && rvBox) {
    var tl = $('#myRvThumbs'); var guard = 6;
    while (tl && $('button[data-i]', tl) && guard--) $('button[data-i]', tl).click();
    rvCount(); var ef = rvBox.closest('.fld'); S.setErr(ef, ef.getAttribute('data-err'));
  } else rvCount();

  /* ---------- 문의 답변 펼침 ---------- */
  document.addEventListener('click', function (e) {
    var li = e.target.closest('.my-inq__i');
    if (li && li.classList.contains('is-new')) { li.classList.remove('is-new'); var nd = $('.nd', li); if (nd) nd.remove(); nbDown(li.getAttribute('data-nb-of')); }
    var t = e.target.closest('.my-inq__tog'); if (!t) return;
    var p = document.getElementById(t.getAttribute('aria-controls')), on = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', String(on)); p.hidden = !on;
    t.firstChild.textContent = on ? '담당자 답변 닫기' : '담당자 답변 보기';
  });
  if (S.has('open')) { var t1 = $('[data-view="' + now + '"] .my-inq__tog'); if (t1) t1.click(); }

  /* ---------- 관심상품 ---------- */
  var WISH = empty ? [] : ['c460', 'c288', 'c475', 'c206', 'c431', 'b3026'];
  var wBox = $('#myWish'), wClear = $('#myWishClear');
  function wishCount() {
    var n = wBox ? $$('.pc', wBox).length : 0;
    $('#myWishN').textContent = n; wClear.hidden = n === 0; $('#myWishNone').hidden = n > 0; wBox.hidden = n === 0;
  }
  if (wBox && D) {
    wBox.innerHTML = WISH.map(function (k) { return D.P[k] ? D.card(D.P[k], { liked: true }) : ''; }).join('');
    wishCount();
    wBox.addEventListener('like', function (e) {
      if (e.detail.on) return;
      var c = e.target.closest('.pc'); if (!c) return;
      c.classList.add('is-out'); setTimeout(function () { c.remove(); wishCount(); }, 220);
    });
    wClear.addEventListener('click', function () {
      var n = $$('.pc', wBox).length;
      S.confirm({ title: '관심상품을 모두 삭제할까요?', desc: '관심상품 ' + n + '개를 목록에서 뺍니다. 되돌릴 수 없습니다.', ok: '전체 삭제', cancel: '닫기', icon: 'trash',
        onOk: function () {
          if (S.has('clear-fail')) { S.toast('관심상품을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true }); return; }
          wBox.innerHTML = ''; wishCount(); S.toast('관심상품을 모두 삭제했습니다.');
        } });
    });
  }
  if (now === 'wishlist' && S.has('clear-fail')) S.toast('관심상품을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true, ms: 60000 });
  if (now === 'wishlist' && S.has('like-fail')) S.toast('관심상품을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true, ms: 60000 });

  /* ---------- 포인트 ---------- */
  var PTS = empty ? [] : [
    ['2026-11-12', '구매확정 적립', 'O-20261020-0001', 2950, 12450],
    ['2026-11-03', '주문 결제에 사용', 'O-20261103-0005', -5000, 9500],
    ['2026-10-28', '구매확정 적립', 'O-20261018-0002', 4200, 14500],
    ['2026-10-05', '구매확정 적립', 'O-20260924-0003', 1800, 10300],
    ['2026-09-12', '주문 취소로 사용 포인트 반환', 'O-20260910-0001', 3000, 8500],
    ['2026-09-10', '주문 결제에 사용', 'O-20260910-0001', -3000, 5500]
  ];
  var ptTool = $('#myPtTool'), PF = { from: back(31), to: TODAY };
  function ptDraw() {
    var rows = PTS.filter(function (r) { return r[0] >= PF.from && r[0] <= PF.to; });
    var inn = 0, out = 0; rows.forEach(function (r) { if (r[3] > 0) inn += r[3]; else out -= r[3]; });
    $('#myPtIn').textContent = '+' + won(inn); $('#myPtOut').textContent = (out ? '−' : '') + won(out);
    if (empty) $('#myPtHave').textContent = '0';
    $('#myPtTbl tbody').innerHTML = rows.map(function (r) {
      return '<tr><td class="num my-ptt__d">' + r[0] + '</td><td class="my-ptt__c">' + esc(r[1]) + ' <span class="num">' + r[2] + '</span></td>' +
        '<td class="num r my-ptt__v ' + (r[3] > 0 ? 'is-plus' : 'is-minus') + '">' + (r[3] > 0 ? '+' : '−') + won(Math.abs(r[3])) + '</td><td class="num r my-ptt__b">' + won(r[4]) + '</td></tr>';
    }).join('');
    $('#myPtTbl').hidden = !rows.length; $('#myPtNone').hidden = !!rows.length;
    $('#myPtCond').innerHTML = '<span class="num">' + PF.from + ' ~ ' + PF.to + '</span> · <b class="num">' + rows.length + '</b>건';
  }
  if (ptTool) {
    setDates(ptTool, PF.from, PF.to);
    ptTool.addEventListener('period', function () {
      var p = $('[data-range][aria-pressed="true"]', ptTool), n = p ? Number(p.getAttribute('data-range')) : 30;
      PF.from = back(n === 30 ? 31 : n === 90 ? 92 : 7); PF.to = TODAY; setDates(ptTool, PF.from, PF.to); ptDraw();
    });
    $('.my-tool__go', ptTool).addEventListener('click', function () {
      var d = $$('input[type=date]', ptTool);
      if (!d[0].value || !d[1].value || d[0].value > d[1].value) { S.toast('조회 기간을 확인해 주세요.', { error: true }); return; }
      PF.from = d[0].value; PF.to = d[1].value; pressRange(ptTool, -1); ptDraw();
    });
    $('#myPtWide').addEventListener('click', function () { PF.from = back(92); PF.to = TODAY; setDates(ptTool, PF.from, PF.to); pressRange(ptTool, 90); ptDraw(); });
    ptDraw();
  }

  /* ---------- 배송지 ---------- */
  var ADS = empty ? [] : [
    { id: 1, def: true, name: '본사', to: '김민준', zip: '48058', a1: '부산광역시 해운대구 센텀중앙로 97', a2: '5층', tel: '010-1234-5678', auto: true },
    { id: 2, name: '강서 현장', to: '박서준', zip: '46729', a1: '부산광역시 강서구 녹산산업중로 333', a2: '자재창고 2동', tel: '010-3456-7890' },
    { id: 3, name: '울산 공장', to: '이도윤', zip: '44780', a1: '울산광역시 남구 산업로 200', a2: '정문 경비실', tel: '010-4567-8901' }
  ];
  var adList = $('#myAds'), adEdit = null;
  function adDraw() {
    if (!adList) return;
    ADS.sort(function (a, b) { return (b.def ? 1 : 0) - (a.def ? 1 : 0) || a.id - b.id; });
    adList.innerHTML = ADS.map(function (a) {
      return '<li class="my-ad' + (a.def ? ' is-def' : '') + '"><div class="my-ad__hd"><b class="my-ad__name">' + esc(a.name) + '</b>' + (a.def ? '<span class="stag stag--ink">기본 배송지</span>' : '') + '</div>' +
        '<p class="my-ad__to">' + esc(a.to) + '<span class="num">' + esc(a.tel) + '</span></p>' +
        '<p class="my-ad__addr"><span class="num">(' + a.zip + ')</span> ' + esc(a.a1) + ', ' + esc(a.a2) + '</p>' +
        (a.auto ? '<p class="my-ad__auto">회원정보 주소로 자동으로 만든 배송지</p>' : '') +
        '<div class="my-ad__acts"><button type="button" class="sb sb--line sb--m" data-ad-edit="' + a.id + '">수정</button>' +
        (a.def ? '' : '<button type="button" class="sb sb--gray sb--m" data-ad-def="' + a.id + '">기본 배송지로</button>') +
        '<button type="button" class="sb sb--gray sb--m" data-ad-del="' + a.id + '">삭제</button></div></li>';
    }).join('');
    $('#myAdN').textContent = ADS.length;
    adList.hidden = !ADS.length; $('#myAdNone').hidden = !!ADS.length;
  }
  function adById(id) { for (var i = 0; i < ADS.length; i++) if (ADS[i].id === id) return ADS[i]; return null; }
  function adOpen(a, from, keepErr) {
    adEdit = a;
    var f = $('#myAdForm');
    if (!keepErr) $$('.fld', f).forEach(function (x) { x.classList.remove('is-err'); });
    $('#myAdFT').textContent = a ? '배송지 수정' : '배송지 추가';
    $('#adName').value = a ? a.name : ''; $('#adTo').value = a ? a.to : S.member.name; $('#adTel').value = a ? a.tel : S.member.phone;
    $('#adZip').value = a ? a.zip : ''; $('#adAddr').value = a ? a.a1 : ''; $('#adAddr2').value = a ? a.a2 : '';
    var def = $('#adDef'), help = $('#adDefHelp');
    var first = !ADS.length && !a;
    def.checked = !!(a && a.def) || first; def.disabled = !!(a && a.def) || first;
    help.textContent = first ? '처음 추가하는 배송지는 기본 배송지가 됩니다.' : (a && a.def) ? '이미 기본인 배송지는 해제할 수 없습니다.' : '고르면 지금 기본 배송지 대신 이 배송지가 기본이 됩니다.';
    $('#adNameN').textContent = $('#adName').value.length;
    S.pop('myAd', from);
  }
  function adAdd(from) {
    if (ADS.length >= 20 || S.has('addr-full')) { S.toast('배송지는 최대 20개까지 저장할 수 있습니다. 쓰지 않는 배송지를 지운 뒤 추가해 주세요.', { error: true }); return; }
    adOpen(null, from);
  }
  function adFail() { S.toast('배송지를 처리하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.', { error: true }); }
  if (adList) {
    adDraw();
    $('#myAdAdd').addEventListener('click', function (e) { adAdd(e.currentTarget); });
    $('[data-ad-add]').addEventListener('click', function (e) { adAdd(e.currentTarget); });
    adList.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-ad-edit')) adOpen(adById(Number(b.getAttribute('data-ad-edit'))), b);
      else if (b.hasAttribute('data-ad-def')) {
        if (S.has('addr-fail')) return adFail();
        var t = adById(Number(b.getAttribute('data-ad-def'))); ADS.forEach(function (x) { x.def = x === t; }); adDraw(); S.toast('기본 배송지로 지정했습니다.');
      } else if (b.hasAttribute('data-ad-del')) {
        var d = adById(Number(b.getAttribute('data-ad-del')));
        S.confirm({ title: '‘' + d.name + '’ 배송지를 삭제할까요?', desc: d.def ? '기본 배송지를 지우면 가장 최근에 추가한 배송지가 기본 배송지가 됩니다.' : '삭제한 배송지는 되돌릴 수 없습니다.', ok: '삭제', cancel: '닫기', icon: 'trash',
          onOk: function () {
            if (S.has('addr-fail')) return adFail();
            ADS = ADS.filter(function (x) { return x !== d; });
            if (d.def && ADS.length) { var last = ADS.reduce(function (m, x) { return x.id > m.id ? x : m; }, ADS[0]); last.def = true; }
            adDraw(); S.toast('배송지를 삭제했습니다.');
          } });
      }
    });
    $('#myAdForm').addEventListener('checked', function (e) {
      e.preventDefault();
      if (S.has('addr-fail')) return adFail();
      var v = { name: $('#adName').value.trim(), to: $('#adTo').value.trim(), tel: $('#adTel').value.trim(), zip: $('#adZip').value, a1: $('#adAddr').value, a2: $('#adAddr2').value.trim() };
      var mk = $('#adDef').checked || !ADS.length;
      if (adEdit) { Object.keys(v).forEach(function (k) { adEdit[k] = v[k]; }); if (mk) ADS.forEach(function (x) { x.def = x === adEdit; }); }
      else { var n = { id: ADS.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1 }; Object.keys(v).forEach(function (k) { n[k] = v[k]; }); if (mk) ADS.forEach(function (x) { x.def = false; }); n.def = mk; ADS.push(n); }
      S.closePop('myAd'); adDraw(); S.toast('배송지를 저장했습니다.');
    });
    if (now === 'addresses') {
      if (S.has('add') && !empty) {
        adOpen(null, null, S.has('addr-err'));
        if (S.has('addr-err')) { $('#adTo').value = ''; $('#adTel').value = '010-12'; }
      }
      if (S.has('addr-full')) S.toast('배송지는 최대 20개까지 저장할 수 있습니다. 쓰지 않는 배송지를 지운 뒤 추가해 주세요.', { error: true, ms: 60000 });
      if (S.has('addr-fail')) S.toast('배송지를 처리하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.', { error: true, ms: 60000 });
    }
  }
  // 주소 검색(우편번호 서비스 자리): 견본 주소를 채운다
  document.addEventListener('click', function (e) {
    var z = e.target.closest('[data-zip]'); if (!z) return;
    var box = z.closest('.addr'), ins = $$('.inp', box);
    if (now === 'profile' && S.has('err')) { S.toast('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', { error: true }); return; }
    ins[0].value = '48058'; ins[1].value = '부산광역시 해운대구 센텀중앙로 97'; ins[2].focus();
    var f = box.closest('.fld'); if (f) f.classList.remove('is-err');
  });

  /* ---------- 회원정보 · 비밀번호 · 탈퇴 ---------- */
  var pf = $('#myPfForm');
  if (pf) {
    if (S.has('err')) { var tel = $('#pfTel'); tel.value = '010-123-456'; $('#pgTel').value = '010-234-567'; }
    pf.addEventListener('checked', function (e) {
      if (S.has('save-fail')) { e.preventDefault(); S.toast('저장하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.', { error: true }); return; }
      e.preventDefault();
      if (!S.has('general')) { var nm = $('#pfMgr').value.trim(); var b = $('#mySumName'); if (b && nm) b.textContent = nm; var av = $('.my-sum__av'); if (av && nm) av.textContent = nm.charAt(0); }
      S.toast('회원정보를 수정했습니다.');
    });
    if (now === 'profile' && S.has('saved')) S.toast('회원정보를 수정했습니다.', { ms: 60000 });
    if (now === 'profile' && S.has('save-fail')) S.toast('저장하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.', { error: true, ms: 60000 });
  }
  var pw = $('#myPwForm');
  if (pw) {
    pw.addEventListener('checked', function (e) {
      e.preventDefault(); pw.reset();
      S.toast(S.has('social') ? '비밀번호를 설정했습니다. 이제 아이디와 비밀번호로도 로그인할 수 있습니다.' : '비밀번호를 변경했습니다.');
    });
    if (now === 'password' && S.has('pw-done')) S.toast(S.has('social') ? '비밀번호를 설정했습니다. 이제 아이디와 비밀번호로도 로그인할 수 있습니다.' : '비밀번호를 변경했습니다.', { ms: 60000 });
  }
  var wd = $('#myWdForm');
  function wdFail() { S.toast('탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도하거나 고객센터(' + TEL + ')로 문의해 주세요.', { error: true, ms: S.has('wd-fail') ? 60000 : 4000 }); }
  if (wd) {
    wd.addEventListener('checked', function (e) {
      e.preventDefault();
      if (S.has('social') && $('#wdWord').value.trim() !== '탈퇴합니다') { S.setErr($('#wdWord').closest('.fld'), '확인 문구 ‘탈퇴합니다’를 그대로 입력해 주세요.'); return; }
      S.confirm({ title: '회원 탈퇴를 진행할까요?', desc: '개인정보와 등록한 사업자등록증을 삭제하며 되돌릴 수 없습니다.', ok: '탈퇴하기', cancel: '계속 이용하기', tone: 'red', icon: 'alert',
        onOk: function () { if (S.has('wd-fail')) return wdFail(); location.href = 'mypage.html?section=withdraw&state=wd-done+guest'; } });
    });
    if (now === 'withdraw' && S.has('wd-fail')) wdFail();
  }
})();
