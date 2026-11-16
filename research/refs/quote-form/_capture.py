# -*- coding: utf-8 -*-
"""견적·긴 입력 양식형 레퍼런스 캡처 스크립트.

사용: /usr/bin/python3 _capture.py <키> [<키> ...]
- 로그인·제출은 하지 않는다. 입력이 필요한 상태(오류 표시 등)는 빈 값으로 '다음'만 눌러 본다.
- PC 1440, 모바일 390(배율 2) 두 가지로 찍는다.
"""
import os, sys, json, time, re
from playwright.sync_api import sync_playwright

OUT = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

CLOSE_SELECTORS = [
    '#onetrust-reject-all-handler', '#onetrust-accept-btn-handler',
    'button:has-text("모두 거부")', 'button:has-text("거부")',
    'button:has-text("Reject all")', 'button:has-text("Reject additional cookies")',
    'button:has-text("Decline")', 'button:has-text("동의하고 계속")',
    'button:has-text("모두 수락")', 'button:has-text("Accept all")', 'button:has-text("Accept")',
    'button[aria-label="닫기"]', 'button[aria-label="Close"]', 'button[aria-label="close"]',
    'button:has-text("오늘 하루 보지 않기")', 'button:has-text("오늘 하루 안 보기")', 'a:has-text("오늘 하루 보지 않기")',
    'button:has-text("모바일 웹으로 볼게요")', 'button:has-text("웹으로 계속")', 'button:has-text("닫기")',
]


def shot(pg, path, max_h=5200, full=True):
    w = pg.viewport_size['width']
    if full:
        h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
        pg.screenshot(path=path, type='jpeg', quality=72,
                      clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)
    else:
        pg.screenshot(path=path, type='jpeg', quality=72)


def slow_scroll(pg, step=700, pause=250, limit=12000):
    y = 0
    while True:
        h = pg.evaluate('document.documentElement.scrollHeight')
        if y >= min(h, limit):
            break
        y += step
        pg.evaluate('window.scrollTo(0, %d)' % y)
        pg.wait_for_timeout(pause)
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(500)


def close_popups(pg):
    closed = []
    for sel in CLOSE_SELECTORS:
        try:
            el = pg.locator(sel).first
            if el.count() and el.is_visible():
                el.click(timeout=1500)
                pg.wait_for_timeout(400)
                closed.append(sel)
        except Exception:
            pass
    return closed


def info(pg):
    try:
        return pg.evaluate('''() => ({
            title: document.title, url: location.href,
            h: document.documentElement.scrollHeight,
            inputs: document.querySelectorAll('input:not([type=hidden]),select,textarea').length,
            iframes: Array.from(document.querySelectorAll('iframe')).map(f => f.src).filter(Boolean).slice(0, 8),
            text: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 700)
        })''')
    except Exception as e:
        return {'error': str(e)}


def open_page(ctx, url, wait=2500, scroll=True):
    pg = ctx.new_page()
    resp = None
    try:
        resp = pg.goto(url, wait_until='domcontentloaded', timeout=45000)
    except Exception as e:
        print('  goto error:', str(e)[:200])
    pg.wait_for_timeout(wait)
    closed = close_popups(pg)
    if scroll:
        slow_scroll(pg)
    closed += close_popups(pg)
    print('  status:', resp.status if resp else None, '| closed:', closed)
    return pg


def simple(key, url, name, max_h=5200, wait=2500, pc_only=False, m_only=False, scroll=True, after=None):
    """한 주소를 PC·모바일로 열어 전체 화면을 찍는다. after(pg, kind)로 눌러서 여는 상태를 추가로 찍는다."""
    def run(pc, mo):
        for kind, ctx in (('pc', pc), ('m', mo)):
            if (pc_only and kind == 'm') or (m_only and kind == 'pc'):
                continue
            print('[%s] %s %s' % (key, kind, url))
            pg = open_page(ctx, url, wait=wait, scroll=scroll)
            print('  info:', json.dumps(info(pg), ensure_ascii=False)[:1500])
            path = os.path.join(OUT, '%s-%s.jpg' % (name, kind))
            try:
                shot(pg, path, max_h=max_h)
                print('  saved', os.path.basename(path))
            except Exception as e:
                print('  shot error:', str(e)[:200])
            if after:
                try:
                    after(pg, kind)
                except Exception as e:
                    print('  after error:', str(e)[:300])
            pg.close()
    return run


TARGETS = {}


def reg(key, *a, **kw):
    TARGETS[key] = simple(key, *a, **kw)


# ---- 1차 훑기 대상 -------------------------------------------------------
reg('uniqlo', 'https://www.uniqlo.com/kr/ko/special-feature/bulk-order', 'uniqlo-bulk-order')
reg('typeform-tpl', 'https://www.typeform.com/templates/product-quote-form-template', 'typeform-template')
reg('tally-tpl', 'https://tally.so/templates', 'tally-templates')
reg('stripe', 'https://stripe.com/kr/contact/sales', 'stripe-contact-sales')
reg('govuk-question', 'https://design-system.service.gov.uk/patterns/question-pages/', 'govuk-question-pages', max_h=7000)
reg('samsung', 'https://www.samsung.com/sec/business/contact-us/', 'samsung-business-contact')
reg('kmong', 'https://kmong.com/enterprise', 'kmong-enterprise')
reg('customink', 'https://www.customink.com/quotes', 'customink-quote')
reg('soomgo', 'https://soomgo.com/', 'soomgo-home')


# ---- 숨고 요청서(대화형 입력) ---------------------------------------------
# 질문 카드를 찾아 상태를 읽는다. 카드 = '다음' 버튼을 품은 가장 가까운 묶음.
SOOMGO_DUMP = """() => {
  const vis = e => e.offsetParent !== null;
  const q = sel => Array.from(document.querySelectorAll(sel)).filter(vis);
  const next = q('button').filter(b => /^(다음)$/.test((b.innerText||'').trim())).pop();
  let card = next ? next.parentElement : null;
  for (let i = 0; i < 6 && card; i++) {
    if (card.querySelectorAll('label, input, textarea').length || card.querySelectorAll('button').length > 1) break;
    card = card.parentElement;
  }
  const all = (document.body.innerText || '').replace(/\\s+/g, ' ');
  return {
    progress: (all.match(/진행률 (\\d+%)/)||['',''])[1],
    cardText: card ? card.innerText.replace(/\\s+/g,' ').slice(0,300) : '',
    labels: card ? Array.from(card.querySelectorAll('label')).filter(vis).map(e => e.innerText.replace(/\\s+/g,' ').slice(0,24)).slice(0,14) : [],
    cardInputs: card ? Array.from(card.querySelectorAll('input:not([type=hidden]),textarea,select')).filter(vis).map(e => e.tagName+':'+e.type+':'+(e.placeholder||'').slice(0,30)).slice(0,12) : [],
    cardButtons: card ? Array.from(card.querySelectorAll('button')).filter(vis).map(e => ((e.innerText||e.getAttribute('aria-label')||'?').replace(/\\s+/g,' ').slice(0,14))+(e.disabled?'(x)':'')).slice(0,24) : [],
    edits: q('button, a').filter(e => (e.innerText||'').trim() === '수정').length,
    tail: all.slice(Math.max(0, all.indexOf('요청서 폼')), all.indexOf('요청서 폼') + 500)
  }
}"""

# 카드 안에서 답을 하나 고른다: 선택지(라벨) → 수량 조절(+) → 그 밖의 버튼 순서.
SOOMGO_ANSWER = """() => {
  const vis = e => e.offsetParent !== null;
  const next = Array.from(document.querySelectorAll('button')).filter(vis).filter(b => /^(다음)$/.test((b.innerText||'').trim())).pop();
  if (!next) return 'no-next';
  let card = next.parentElement;
  for (let i = 0; i < 6 && card; i++) {
    if (card.querySelectorAll('label, input, textarea').length || card.querySelectorAll('button').length > 1) break;
    card = card.parentElement;
  }
  if (!card) return 'no-card';
  const txt = card.innerText;
  if (/연락처|전화번호|휴대폰|이름을|이메일/.test(txt)) return 'personal-stop';
  const lab = Array.from(card.querySelectorAll('label')).filter(vis)[0];
  if (lab) { lab.click(); return 'label:' + lab.innerText.trim().slice(0, 20); }
  const btns = Array.from(card.querySelectorAll('button')).filter(vis).filter(b => b !== next && !b.disabled);
  if (card.querySelector('textarea') && !btns.length) return 'textarea';
  // 수량 조절 줄(− 0 +)이면 첫 줄의 + 를 누른다
  const stepper = card.querySelectorAll('input[type=text], input[type=number]').length > 1 && btns.length > 1 && !(btns[0].innerText || '').trim();
  if (stepper) { btns[1].click(); return 'button:stepper-plus'; }
  if (btns.length) { btns[0].click(); return 'button:' + (btns[0].innerText || btns[0].getAttribute('aria-label') || '?').trim().slice(0, 20); }
  return 'nothing';
}"""


def soomgo(pc, mo):
    url = 'https://soomgo.com/hire/단체티셔츠-제작'
    for kind, ctx in (('pc', pc), ('m', mo)):
        if os.environ.get('ONLY') and os.environ['ONLY'] != kind:
            continue
        print('[soomgo] %s %s' % (kind, url))
        pg = open_page(ctx, url, wait=4000, scroll=False)
        vp = pg.viewport_size
        for step in range(1, 15):
            d = pg.evaluate(SOOMGO_DUMP)
            print('  step %d: %s' % (step, json.dumps(d, ensure_ascii=False)[:1100]))
            pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(OUT, 'soomgo-request-s%02d-%s.jpg' % (step, kind)), type='jpeg', quality=72)
            r = pg.evaluate(SOOMGO_ANSWER)
            print('   ->', r)
            if r.split(':')[0] not in ('label', 'button'):
                break
            pg.wait_for_timeout(700)
            nxt = pg.locator('button:visible', has_text=re.compile(r'^\s*다음\s*$')).last
            if nxt.count() == 0 or nxt.is_disabled():
                print('   next unavailable; stop')
                pg.screenshot(path=os.path.join(OUT, 'soomgo-request-s%02d-%s.jpg' % (step + 1, kind)), type='jpeg', quality=72)
                break
            nxt.click()
            pg.wait_for_timeout(2000)
        # 대화 전체(이전 답 묶음 + 수정 링크)를 한 장으로: 창을 세로로 늘려 찍는다
        try:
            pg.set_viewport_size({'width': vp['width'], 'height': 2600 if kind == 'pc' else 3200})
            pg.wait_for_timeout(800)
            pg.evaluate("() => { document.querySelectorAll('*').forEach(e => { if (e.scrollTop > 0) e.scrollTop = 0; }); window.scrollTo(0, 0); }")
            pg.wait_for_timeout(1000)
            pg.screenshot(path=os.path.join(OUT, 'soomgo-request-thread-%s.jpg' % kind), type='jpeg', quality=72)
            pg.set_viewport_size(vp)
            pg.wait_for_timeout(800)
        except Exception as e:
            print('  thread shot error', str(e)[:200])
        # 이전 답 '수정'을 눌렀을 때
        try:
            ed = pg.locator('button:visible, a:visible', has_text=re.compile(r'^\s*수정\s*$')).first
            if ed.count():
                ed.scroll_into_view_if_needed()
                ed.click()
                pg.wait_for_timeout(1500)
                print('  after edit:', json.dumps(pg.evaluate(SOOMGO_DUMP), ensure_ascii=False)[:900])
                pg.screenshot(path=os.path.join(OUT, 'soomgo-request-edit-%s.jpg' % kind), type='jpeg', quality=72)
        except Exception as e:
            print('  edit error', str(e)[:200])
        pg.close()


TARGETS['soomgo-request'] = soomgo


# ---- LG전자 B2B 온라인 견적(긴 양식) -----------------------------------------
def lg(pc, mo):
    url = 'https://www.lge.co.kr/kr/business/contents/estimate/online-estimate-newstep1.do'
    for kind, ctx in (('pc', pc), ('m', mo)):
        if os.environ.get('ONLY') and os.environ['ONLY'] != kind:
            continue
        print('[lg] %s %s' % (kind, url))
        pg = open_page(ctx, url, wait=3500)
        print('  info:', json.dumps(info(pg), ensure_ascii=False)[:600])
        # 제품 카테고리 첫 항목을 골라 '상세 카테고리 / 타입' 열이 채워지는 상태로 만든다(제출 아님)
        try:
            pg.locator('input[name=cate1]').first.check(force=True, timeout=3000)
            pg.wait_for_timeout(1500)
            sub = pg.locator('input[name=cate2]')
            print('  cate2 count:', sub.count())
            if sub.count():
                sub.first.check(force=True, timeout=3000)
                pg.wait_for_timeout(1500)
        except Exception as e:
            print('  cate error', str(e)[:200])
        shot(pg, os.path.join(OUT, 'lg-estimate-form-%s.jpg' % kind), max_h=7200 if kind == 'pc' else 4500)
        print('  h:', pg.evaluate('document.documentElement.scrollHeight'))
        if kind == 'm':
            # 모바일은 길어서 아래쪽(연락처·동의 묶음)을 한 장 더
            h = pg.evaluate('document.documentElement.scrollHeight')
            top = 4500
            if h > top:
                pg.screenshot(path=os.path.join(OUT, 'lg-estimate-form2-m.jpg'), type='jpeg', quality=72,
                              clip={'x': 0, 'y': top, 'width': 390, 'height': min(h - top, 4500)}, full_page=True)
        # '안내 보기' 팝업
        try:
            a = pg.locator('a:has-text("안내 보기")').first
            if a.count():
                a.scroll_into_view_if_needed()
                a.click(timeout=3000)
                pg.wait_for_timeout(1500)
                pg.screenshot(path=os.path.join(OUT, 'lg-estimate-guide-%s.jpg' % kind), type='jpeg', quality=72)
                print('  guide popup text:', pg.evaluate("() => (document.querySelector('#infoEstimate')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,600)"))
        except Exception as e:
            print('  guide error', str(e)[:200])
        pg.close()


TARGETS['lg'] = lg


# ---- 다나와 PC견적(여러 상품을 한 화면에서 고르고 오른쪽에 요약) -------------
DANAWA_FIND = """(word) => Array.from(document.querySelectorAll('a, button, span, strong, dt, li, td, div, p'))
  .filter(e => e.offsetParent !== null && (e.innerText||'').trim() === word && e.children.length <= 1)
  .map(e => { const r = e.getBoundingClientRect(); return {tag: e.tagName, cls: (e.className||'').toString().slice(0,40), x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width)}; }).slice(0, 12)"""


def danawa(pc, mo):
    url = 'https://shop.danawa.com/virtualestimate/?controller=estimateMain&methods=index&marketPlaceSeq=16'
    for kind, ctx in (('pc', pc), ('m', mo)):
        if os.environ.get('ONLY') and os.environ['ONLY'] != kind:
            continue
        print('[danawa] %s %s' % (kind, url))
        pg = open_page(ctx, url, wait=4000)
        i = info(pg)
        print('  info:', json.dumps({k: i.get(k) for k in ('title', 'url', 'h', 'inputs')}, ensure_ascii=False), (i.get('text') or '')[:300])
        shot(pg, os.path.join(OUT, 'danawa-estimate-%s.jpg' % kind), max_h=3300 if kind == 'pc' else 4500)
        try:
            # 1) 목록 첫 상품 '담기'
            cands = pg.evaluate(DANAWA_FIND, '담기')
            print('  담기 후보:', json.dumps(cands, ensure_ascii=False)[:500])
            add_btn = pg.locator('a:visible, button:visible', has_text=re.compile(r'^\s*담기\s*$'))
            print('  담기 버튼 수:', add_btn.count())
            if add_btn.count():
                add_btn.nth(0).scroll_into_view_if_needed()
                add_btn.nth(0).click(timeout=4000)
                pg.wait_for_timeout(1500)
            # 2) 오른쪽 요약에서 '메모리' 칸을 눌러 왼쪽 목록을 바꾸고 한 개 더 담기
            mem = pg.evaluate(DANAWA_FIND, '메모리')
            print('  메모리 후보:', json.dumps(mem, ensure_ascii=False)[:500])
            right = [m for m in mem if m['x'] > (900 if kind == 'pc' else -1)]
            if right:
                t = right[0]
                pg.mouse.click(t['x'] + 10, t['y'] - pg.evaluate('window.scrollY') + 8) if kind == 'pc' else None
                pg.wait_for_timeout(2500)
                add_btn = pg.locator('a:visible, button:visible', has_text=re.compile(r'^\s*담기\s*$'))
                if add_btn.count():
                    add_btn.nth(0).scroll_into_view_if_needed()
                    add_btn.nth(0).click(timeout=4000)
                    pg.wait_for_timeout(1500)
            pg.evaluate('window.scrollTo(0, 0)')
            pg.wait_for_timeout(600)
            shot(pg, os.path.join(OUT, 'danawa-added-%s.jpg' % kind), max_h=3300 if kind == 'pc' else 4500)
            # 3) 양식 안 상품 검색: 낱말을 넣고 자동완성/결과 확인(상품 낱말만, 개인정보 아님)
            box = pg.locator('input[name=searchProduct]:visible').first
            if box.count():
                box.scroll_into_view_if_needed()
                box.click()
                box.type('DDR5 16GB', delay=120)
                pg.wait_for_timeout(2000)
                pg.screenshot(path=os.path.join(OUT, 'danawa-search-typing-%s.jpg' % kind), type='jpeg', quality=72)
                box.press('Enter')
                pg.wait_for_timeout(3000)
                pg.screenshot(path=os.path.join(OUT, 'danawa-search-result-%s.jpg' % kind), type='jpeg', quality=72)
        except Exception as e:
            print('  danawa action error', str(e)[:300])
        pg.close()


TARGETS['danawa'] = danawa


def danawa_cart_m(pc, mo):
    """모바일: 목록에서 한 개 담고 'PC견적 카트'를 열어 요약이 어떻게 바뀌는지 본다."""
    url = 'https://shop.danawa.com/virtualestimate/?controller=estimateMain&methods=index&marketPlaceSeq=16'
    print('[danawa-cart-m] m', url)
    pg = open_page(mo, url, wait=4000, scroll=False)
    probe = "(p) => { const e = document.elementFromPoint(p[0], p[1]); if (!e) return null; const a = e.closest('a,button') || e; return {tag: a.tagName, cls: (a.className||'').toString().slice(0,60), text: (a.innerText||'').trim().slice(0,30)}; }"
    print('  at cart icon:', pg.evaluate(probe, [290, 262]))
    pg.touchscreen.tap(290, 262)
    pg.wait_for_timeout(2000)
    pg.screenshot(path=os.path.join(OUT, 'danawa-added-m.jpg'), type='jpeg', quality=72)
    btn = pg.locator('a:visible, button:visible', has_text=re.compile(r'PC견적\s*카트')).first
    print('  cart button count:', btn.count())
    if btn.count():
        btn.click(timeout=4000)
    else:
        pg.touchscreen.tap(325, 115)
    pg.wait_for_timeout(2500)
    print('  url:', pg.url)
    print('  text:', pg.evaluate("() => document.body.innerText.replace(/\\s+/g,' ').slice(0, 700)"))
    shot(pg, os.path.join(OUT, 'danawa-cart-m.jpg'), max_h=3000)
    pg.close()


TARGETS['danawa-cart-m'] = danawa_cart_m


# ---- GOV.UK Design System / MOJ Design Patterns 예시 화면 -------------------
reg('govuk-error', 'https://design-system.service.gov.uk/components/error-summary/full-page-example/index.html', 'govuk-error-summary', scroll=False)
reg('govuk-check', 'https://design-system.service.gov.uk/patterns/check-answers/default/index.html', 'govuk-check-answers', scroll=False)
reg('govuk-task', 'https://design-system.service.gov.uk/patterns/complete-multiple-tasks/default/index.html', 'govuk-task-list', scroll=False)
reg('govuk-start', 'https://design-system.service.gov.uk/patterns/start-using-a-service/default/index.html', 'govuk-start-page', scroll=False)
reg('moj-add', 'https://design-patterns.service.justice.gov.uk/components/add-another/examples/stacked-errors', 'moj-add-another', scroll=False)

if __name__ == '__main__':
    keys = sys.argv[1:] or list(TARGETS)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=UA_M)
        for k in keys:
            try:
                TARGETS[k](pc, mo)
            except Exception as e:
                print('[%s] failed: %s' % (k, str(e)[:300]))
        b.close()
