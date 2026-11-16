# -*- coding: utf-8 -*-
"""견적·긴 입력 양식형(quote-form) 레퍼런스 캡처 스크립트. 본 날짜 2026-11-17.

사용:
  /usr/bin/python3 _capture.py                 # 남긴 곳 전부
  /usr/bin/python3 _capture.py lg danawa       # 일부만
  ONLY=pc /usr/bin/python3 _capture.py soomgo  # 숨고·LG·다나와는 ONLY=pc|m 으로 한쪽만
  /usr/bin/python3 _capture.py probe <주소>    # 1차 훑기: _tmp-probe-pc.jpg 로 첫 화면만 저장

지킨 것:
- 로그인·회원가입·양식 제출을 하지 않는다. 마지막 '문의하기/견적 신청하기' 버튼은 누르지 않는다.
- 이름·회사·이메일·연락처를 어디에도 넣지 않는다. 넣은 값은 선택지 고르기, 수량 +1, 나라 이름 앞 글자 'un' 뿐이다.
- PC 1440×900, 모바일 390×844(배율 2 → 저장 폭 780px). 모바일 그림은 세로 9000px 을 넘으면 자른다.
- 임시 그림은 _tmp- 로 시작하고 끝날 때 지운다.
"""
import glob
import json
import os
import re
import sys

from playwright.sync_api import sync_playwright

OUT = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

# 1차로 훑어본 곳(결과는 notes.md 맨 위 표와 같다). 남긴 곳만 아래 TARGETS 에 있다.
SCANNED = [
    ('https://soomgo.com/hire/단체티셔츠-제작', '남김'),
    ('https://www.lge.co.kr/kr/business/contents/estimate/online-estimate-newstep1.do', '남김'),
    ('https://shop.danawa.com/virtualestimate/?controller=estimateMain&methods=index&marketPlaceSeq=16', '남김'),
    ('https://design-system.service.gov.uk/patterns/question-pages/', '남김(예시 화면)'),
    ('https://design-patterns.service.justice.gov.uk/components/add-another/', '남김(예시 화면)'),
    ('https://form.typeform.com/to/nhU4JS9r', '버림: 시작 화면만 확인, 어두운 갈색 테마'),
    ('https://www.customink.com/quotes', '버림: 입력 3개짜리 즉시 계산기 + reCAPTCHA'),
    ('https://kmong.com/enterprise', '버림: 소개 화면만 열림, 양식은 버튼 뒤'),
    ('https://stripe.com/contact/sales', '버림: 1단계가 이메일 입력이라 더 못 봄'),
    ('https://tally.so/r/ZjBQP5', '버림: 개인 사업자 양식, 베이지 바탕'),
    ('https://rfq.alibaba.com/rfq/profession.htm', '버림: 첫 칸 뒤 상세 양식 미확인, 인상 불일치'),
    ('https://www.uline.com/Ordering/QuickOrder', '버림: 줄 10개 표뿐, 다나와가 더 많이 풂'),
    ('https://www.uniqlo.com/kr/ko/special-feature/bulk-order', '버림: 403'),
    ('https://ohou.se/partner/applications/new', '버림: 403'),
    ('https://www.samsung.com/sec/business/contact-us/', '버림: 404'),
    ('https://www.invoicesimple.com/invoice-generator', '버림: 보안 확인 화면'),
    ('https://www.swagup.com/', '버림: 쇼핑 소개 화면, 양식 아님'),
]

CLOSE_SELECTORS = [
    '#onetrust-reject-all-handler', '#onetrust-accept-btn-handler',
    'button:has-text("모두 거부")', 'button:has-text("Reject all")',
    'button:has-text("Reject additional cookies")', 'button:has-text("Decline")',
    'button:has-text("Accept all")', 'button:has-text("Accept")',
    'button[aria-label="닫기"]', 'button[aria-label="Close"]',
    'button:has-text("오늘 하루 보지 않기")', 'a:has-text("오늘 하루 보지 않기")',
    'button:has-text("모바일 웹으로 볼게요")', 'button:has-text("닫기")',
]


# ---- 공통 도구 ---------------------------------------------------------------
def fit_mobile(path):
    """모바일 그림: 폭 780px 이하, 세로 9000px 이하로 맞춘다."""
    from PIL import Image
    im = Image.open(path)
    w, h = im.size
    changed = False
    if w > 780:
        im = im.resize((780, int(h * 780 / w)))
        w, h = im.size
        changed = True
    if h > 9000:
        im = im.crop((0, 0, w, 9000))
        changed = True
    if changed:
        im.convert('RGB').save(path, quality=78)


def shot(pg, path, max_h=5200):
    """맨 위부터 max_h(CSS px)까지 한 장으로."""
    w = pg.viewport_size['width']
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)
    if w < 500:
        fit_mobile(path)


def view(pg, path):
    """지금 보이는 화면만."""
    pg.screenshot(path=path, type='jpeg', quality=72)
    if pg.viewport_size['width'] < 500:
        fit_mobile(path)


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
            text: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 500)
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


def kinds(pc, mo):
    only = os.environ.get('ONLY')
    return [(k, c) for k, c in (('pc', pc), ('m', mo)) if not only or only == k]


TARGETS = {}


def simple(key, url, name, max_h=5200, scroll=False):
    """예시 화면처럼 눌러 볼 것이 없는 주소: PC·모바일 전체 화면 한 장씩."""
    def run(pc, mo):
        for kind, ctx in kinds(pc, mo):
            print('[%s] %s %s' % (key, kind, url))
            pg = open_page(ctx, url, scroll=scroll)
            print('  info:', json.dumps(info(pg), ensure_ascii=False)[:600])
            shot(pg, os.path.join(OUT, '%s-%s.jpg' % (name, kind)), max_h=max_h)
            pg.close()
    TARGETS[key] = run


# ---- 숨고 요청서(대화형 입력) ---------------------------------------------
# 질문 카드 = '다음' 버튼을 품은 가장 가까운 묶음.
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
    edits: q('button, a').filter(e => (e.innerText||'').trim() === '수정').length,
    thread: all.slice(Math.max(0, all.indexOf('요청서 폼')), all.indexOf('요청서 폼') + 400)
  }
}"""

# 카드 안에서 답을 하나 고른다: 선택지(라벨) → 수량 조절(+) → 그 밖의 버튼(건너뛰기 등).
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
  if (/연락처|전화번호|휴대폰|이름을|이메일/.test(card.innerText)) return 'personal-stop';
  const lab = Array.from(card.querySelectorAll('label')).filter(vis)[0];
  if (lab) { lab.click(); return 'label:' + lab.innerText.trim().slice(0, 20); }
  const btns = Array.from(card.querySelectorAll('button')).filter(vis).filter(b => b !== next && !b.disabled);
  if (card.querySelector('textarea') && !btns.length) return 'textarea';
  const stepper = card.querySelectorAll('input[type=text], input[type=number]').length > 1 && btns.length > 1 && !(btns[0].innerText || '').trim();
  if (stepper) { btns[1].click(); return 'button:stepper-plus'; }
  if (btns.length) { btns[0].click(); return 'button:' + (btns[0].innerText || btns[0].getAttribute('aria-label') || '?').trim().slice(0, 20); }
  return 'nothing';
}"""

# 남길 장면: (종류, 단계) → 파일 이름. 나머지 단계는 _tmp- 로만 찍는다.
SOOMGO_KEEP = {
    ('pc', 3): 'soomgo-quantity-pc.jpg',   # 사이즈별 수량 카드 + 위쪽 이전 답·수정 링크 + 진행률
    ('m', 3): 'soomgo-quantity-m.jpg',
    ('m', 4): 'soomgo-skip-m.jpg',         # 선택 질문의 '건너뛰기 | 다음'
}


def soomgo(pc, mo):
    url = 'https://soomgo.com/hire/단체티셔츠-제작'
    for kind, ctx in kinds(pc, mo):
        print('[soomgo] %s %s' % (kind, url))
        pg = open_page(ctx, url, wait=4000, scroll=False)
        vp = pg.viewport_size
        last = 4 if kind == 'm' else 3   # PC는 수량 카드에서 멈추고, 모바일은 건너뛰기까지 본다
        for step in range(1, last + 1):
            d = pg.evaluate(SOOMGO_DUMP)
            print('  step %d: %s' % (step, json.dumps(d, ensure_ascii=False)[:700]))
            pg.wait_for_timeout(400)
            name = SOOMGO_KEEP.get((kind, step), '_tmp-soomgo-s%02d-%s.jpg' % (step, kind))
            view(pg, os.path.join(OUT, name))
            if step == last and kind == 'pc':
                break
            r = pg.evaluate(SOOMGO_ANSWER)
            print('   ->', r)
            if r.split(':')[0] not in ('label', 'button'):
                break
            pg.wait_for_timeout(700)
            nxt = pg.locator('button:visible', has_text=re.compile(r'^\s*다음\s*$')).last
            if nxt.count() == 0 or nxt.is_disabled():
                break   # '건너뛰기'는 누르는 즉시 다음 질문으로 넘어간다
            nxt.click()
            pg.wait_for_timeout(2000)
        if kind == 'm':
            # 대화 전체(이전 답 묶음 + '건너뛰기를 선택했어요.' + 다음 질문)를 한 장으로: 창을 세로로 늘려 찍는다
            pg.set_viewport_size({'width': vp['width'], 'height': 1475})
            pg.wait_for_timeout(800)
            pg.evaluate("() => { document.querySelectorAll('*').forEach(e => { if (e.scrollTop > 0) e.scrollTop = 0; }); window.scrollTo(0, 0); }")
            pg.wait_for_timeout(1000)
            view(pg, os.path.join(OUT, 'soomgo-thread-m.jpg'))
            pg.set_viewport_size(vp)
            pg.wait_for_timeout(800)
        # 이전 답 아래 '수정'을 눌렀을 때
        ed = pg.locator('button:visible, a:visible', has_text=re.compile(r'^\s*수정\s*$')).first
        if ed.count():
            ed.scroll_into_view_if_needed()
            ed.click()
            pg.wait_for_timeout(1500)
            print('  after edit:', json.dumps(pg.evaluate(SOOMGO_DUMP), ensure_ascii=False)[:500])
            view(pg, os.path.join(OUT, 'soomgo-edit-%s.jpg' % kind))
        pg.close()


TARGETS['soomgo'] = soomgo


# ---- LG전자 B2B 온라인 견적(긴 양식) -----------------------------------------
def lg(pc, mo):
    url = 'https://www.lge.co.kr/kr/business/contents/estimate/online-estimate-newstep1.do'
    for kind, ctx in kinds(pc, mo):
        print('[lg] %s %s' % (kind, url))
        pg = open_page(ctx, url, wait=3500)
        print('  info:', json.dumps(info(pg), ensure_ascii=False)[:600])
        # 제품 카테고리 첫 항목 → 상세 카테고리 첫 항목을 골라 세 칸이 채워진 상태로 만든다(제출 아님)
        try:
            pg.locator('input[name=cate1]').first.check(force=True, timeout=3000)
            pg.wait_for_timeout(1500)
            sub = pg.locator('input[name=cate2]')
            if sub.count():
                sub.first.check(force=True, timeout=3000)
                pg.wait_for_timeout(1500)
        except Exception as e:
            print('  cate error', str(e)[:200])
        shot(pg, os.path.join(OUT, 'lg-estimate-form-%s.jpg' % kind), max_h=7200 if kind == 'pc' else 4500)
        if kind == 'm':
            # 모바일은 길어서 4500px 아래(약관 끝·버튼·안내 띠)를 한 장 더
            h = pg.evaluate('document.documentElement.scrollHeight')
            if h > 4500:
                path = os.path.join(OUT, 'lg-estimate-form2-m.jpg')
                pg.screenshot(path=path, type='jpeg', quality=72, full_page=True,
                              clip={'x': 0, 'y': 4500, 'width': 390, 'height': min(h - 4500, 4500)})
                fit_mobile(path)
        # 맨 아래 '안내 보기' 팝업
        try:
            a = pg.locator('a:has-text("안내 보기")').first
            if a.count():
                a.scroll_into_view_if_needed()
                a.click(timeout=3000)
                pg.wait_for_timeout(1500)
                view(pg, os.path.join(OUT, 'lg-estimate-guide-%s.jpg' % kind))
        except Exception as e:
            print('  guide error', str(e)[:200])
        pg.close()


TARGETS['lg'] = lg


# ---- 다나와 PC견적(여러 상품을 한 화면에서 고르고 오른쪽에 요약) -------------
DANAWA_URL = 'https://shop.danawa.com/virtualestimate/?controller=estimateMain&methods=index&marketPlaceSeq=16'
DANAWA_FIND = """(word) => Array.from(document.querySelectorAll('a, button, span, strong, dt, li, td, div, p'))
  .filter(e => e.offsetParent !== null && (e.innerText||'').trim() === word && e.children.length <= 1)
  .map(e => { const r = e.getBoundingClientRect(); return {x: Math.round(r.x), y: Math.round(r.y)}; }).slice(0, 12)"""


def danawa(pc, mo):
    for kind, ctx in kinds(pc, mo):
        print('[danawa] %s %s' % (kind, DANAWA_URL))
        if kind == 'pc':
            pg = open_page(ctx, DANAWA_URL, wait=4000)
            shot(pg, os.path.join(OUT, 'danawa-estimate-pc.jpg'), max_h=3300)
            add = pg.locator('a:visible, button:visible', has_text=re.compile(r'^\s*담기\s*$'))
            # 1) 목록 첫 상품 '담기' → 오른쪽 CPU 칸이 채워진다
            if add.count():
                add.nth(0).scroll_into_view_if_needed()
                add.nth(0).click(timeout=4000)
                pg.wait_for_timeout(1500)
            # 2) 오른쪽 요약의 '메모리' 칸을 눌러 왼쪽 목록을 바꾸고 한 개 더 담는다
            right = [m for m in pg.evaluate(DANAWA_FIND, '메모리') if m['x'] > 900]
            if right:
                pg.mouse.click(right[0]['x'] + 10, right[0]['y'] + 8)
                pg.wait_for_timeout(2500)
                add = pg.locator('a:visible, button:visible', has_text=re.compile(r'^\s*담기\s*$'))
                if add.count():
                    add.nth(0).scroll_into_view_if_needed()
                    add.nth(0).click(timeout=4000)
                    pg.wait_for_timeout(1500)
            pg.evaluate('window.scrollTo(0, 0)')
            pg.wait_for_timeout(600)
            shot(pg, os.path.join(OUT, 'danawa-added-pc.jpg'), max_h=3300)
            pg.close()
        else:
            # 모바일은 mshop.danawa.com 으로 넘어간다. 앱 설치 안내는 '모바일 웹으로 볼게요'로 닫는다.
            pg = open_page(ctx, DANAWA_URL, wait=4000, scroll=False)
            shot(pg, os.path.join(OUT, 'danawa-estimate-m.jpg'), max_h=1700)
            pg.touchscreen.tap(290, 262)          # 첫 줄의 장바구니 담기 단추(button.btn_esti_cart)
            pg.wait_for_timeout(2000)
            view(pg, os.path.join(OUT, 'danawa-added-m.jpg'))
            btn = pg.locator('a:visible, button:visible', has_text=re.compile(r'PC견적\s*카트')).first
            if btn.count():
                btn.click(timeout=4000)
                pg.wait_for_timeout(2500)
                view(pg, os.path.join(OUT, 'danawa-cart-m.jpg'))
            pg.close()


TARGETS['danawa'] = danawa


# ---- GOV.UK Design System / MOJ Design Patterns 예시 화면 -------------------
simple('govuk-error', 'https://design-system.service.gov.uk/components/error-summary/full-page-example/index.html', 'govuk-error-summary')
simple('govuk-check', 'https://design-system.service.gov.uk/patterns/check-answers/default/index.html', 'govuk-check-answers')
simple('govuk-task', 'https://design-system.service.gov.uk/patterns/complete-multiple-tasks/default/index.html', 'govuk-task-list')
simple('moj-add', 'https://design-patterns.service.justice.gov.uk/components/add-another/examples/stacked-errors', 'moj-add-another')


def govuk_autocomplete(pc, mo):
    """양식 안 자동완성 입력(GOV.UK accessible-autocomplete 예시). 나라 이름 앞 글자 'un'만 넣어 본다."""
    url = 'https://alphagov.github.io/accessible-autocomplete/examples/'
    for kind, ctx in kinds(pc, mo):
        print('[govuk-autocomplete] %s %s' % (kind, url))
        pg = open_page(ctx, url, scroll=False)
        box = pg.locator('input.autocomplete__input:visible, input[role=combobox]:visible').first
        if box.count():
            box.scroll_into_view_if_needed()
            box.click()
            box.type('un', delay=150)
            pg.wait_for_timeout(1200)
            if kind == 'pc':
                pg.keyboard.press('ArrowDown')   # 방향키로 고른 줄의 강조를 본다
                pg.wait_for_timeout(400)
        view(pg, os.path.join(OUT, 'govuk-autocomplete-%s.jpg' % kind))
        pg.close()


TARGETS['govuk-autocomplete'] = govuk_autocomplete


# ---- 1차 훑기용 ---------------------------------------------------------------
def probe(pc, url):
    print('[probe]', url)
    pg = open_page(pc, url, wait=4000, scroll=False)
    print('  info:', json.dumps(info(pg), ensure_ascii=False)[:900])
    view(pg, os.path.join(OUT, '_tmp-probe-pc.jpg'))
    pg.close()


if __name__ == '__main__':
    args = sys.argv[1:]
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=UA_M)
        if args and args[0] == 'probe':
            for u in args[1:]:
                probe(pc, u)      # _tmp-probe-pc.jpg 는 눈으로 본 뒤 직접 지운다
        else:
            for k in (args or list(TARGETS)):
                try:
                    TARGETS[k](pc, mo)
                except Exception as e:
                    print('[%s] failed: %s' % (k, str(e)[:300]))
            for f in glob.glob(os.path.join(OUT, '_tmp-*')):
                os.remove(f)
        b.close()
