# -*- coding: utf-8 -*-
"""문서형(document) 레퍼런스 캡처 스크립트. 본 날짜 2026-11-17.

사용법
  /usr/bin/python3 _capture.py probe <이름> <주소> [<이름> <주소> ...]
      후보 훑기. PC·모바일 한 장씩 _tmp-<이름>-pc.jpg / -m.jpg 로 저장한다.
      저장 위치는 환경 변수 PROBE_OUT(없으면 이 폴더). 확인이 끝나면 _tmp-* 는 지운다.
  /usr/bin/python3 _capture.py final [musinsa|kakao|govuk|qwilr|invoicegen ...]
      남긴 곳 캡처. 이름을 주지 않으면 다섯 곳 모두 찍는다. 이 폴더에 저장한다.

지킨 것
  - 로그인·회원가입·양식 제출은 하지 않는다. 쿠키 띠는 거부·닫기 버튼만 누른다.
  - 탭·펼침 메뉴처럼 눌러야 보이는 상태만 눌러서 찍는다.
  - PC 1440x900, 모바일 390x844(배율 2 → 저장 폭 780px). 세로는 9000px 에서 자른다.

알아 둘 것
  - 전체 페이지 캡처라 화면에 고정된 띠(무신사의 검색 띠·헤더)는 그림 중간에 한 번 끼어 찍힌다.
  - kakao-privacy-menu-m.jpg 는 펼침 전환 도중에 찍혀 뒤쪽 글자가 비친다.
  - 2026-11-17 에 실제로 저장한 qwilr-top-*, invoicegen-invoice-* 는 probe 모드(세로 3200px 까지)로 찍은 그림이다.
"""
import os
import sys
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

CLOSE_TEXTS = ['모두 수락', '모두 허용', '동의', '확인', '닫기', 'Accept all', 'Accept All',
               'Accept additional cookies', 'Accept', 'Reject all', 'Got it', 'OK', 'Close']


# ---------------------------------------------------------------- 공통
def fit(path):
    """세로가 9000px 을 넘으면 위쪽 9000px 만 남긴다(모바일 2배 그림 대비)."""
    im = Image.open(path)
    if im.size[1] > 9000:
        im.crop((0, 0, im.size[0], 9000)).convert('RGB').save(path, 'JPEG', quality=72)


def shot(pg, path, max_h=5200):
    """맨 위부터 max_h(CSS px)까지 찍는다."""
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)
    fit(path)


def region(pg, path, y0, h):
    """문서의 y0 부터 h(CSS px)만큼만 찍는다."""
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': y0, 'width': w, 'height': h}, full_page=True)
    fit(path)


def slow_scroll(pg, max_h=9000):
    """지연 로딩을 깨우려고 천천히 끝까지 내렸다가 맨 위로 돌아온다."""
    total = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    y = 0
    while y < total:
        pg.evaluate('y => window.scrollTo(0, y)', y)
        pg.wait_for_timeout(180)
        y += 700
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(500)


def dismiss(pg, texts=CLOSE_TEXTS):
    """쿠키 띠·팝업의 닫기 버튼을 하나 누른다."""
    for t in texts:
        try:
            loc = pg.get_by_role('button', name=t, exact=True)
            if loc.count() and loc.first.is_visible():
                loc.first.click(timeout=1500)
                pg.wait_for_timeout(400)
                return t
        except Exception:
            pass
    return None


def open_page(ctx, url, wait=2500, scroll=True, close=True):
    pg = ctx.new_page()
    pg.goto(url, wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(wait)
    if close:
        dismiss(pg)
    if scroll:
        slow_scroll(pg)
    return pg


def contexts(b):
    pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
    mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                       has_touch=True, device_scale_factor=2, user_agent=UA_M)
    return pc, mo


def click_named(pg, name):
    """탭·버튼·링크·글자 순서로 찾아 이름이 같은 것을 누른다."""
    for loc in (pg.get_by_role('tab', name=name, exact=True),
                pg.get_by_role('button', name=name, exact=True),
                pg.get_by_role('link', name=name, exact=True),
                pg.get_by_text(name, exact=True)):
        try:
            if loc.count() and loc.first.is_visible():
                loc.first.click(timeout=3000)
                pg.wait_for_timeout(1800)
                return True
        except Exception:
            pass
    return False


def out(name):
    return os.path.join(HERE, name)


# ---------------------------------------------------------------- 후보 훑기
def probe(pairs, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc, mo = contexts(b)
        for name, url in pairs:
            for tag, ctx in (('pc', pc), ('m', mo)):
                try:
                    pg = open_page(ctx, url)
                    shot(pg, os.path.join(out_dir, '_tmp-%s-%s.jpg' % (name, tag)), max_h=3200)
                    print('OK', name, tag, pg.url, pg.title()[:60],
                          pg.evaluate('document.documentElement.scrollHeight'))
                    pg.close()
                except Exception as e:
                    print('FAIL', name, tag, str(e)[:160])
        b.close()


# ---------------------------------------------------------------- 남긴 곳
def capture_musinsa(pc, mo):
    """무신사 개인정보 처리방침: 전문 / 개정 이력 / 전후 비교 탭."""
    url = 'https://member.one.musinsa.com/agreement/privacy-policy'
    for tag, ctx, mh in (('pc', pc, 5200), ('m', mo, 4500)):
        pg = open_page(ctx, url, wait=3500)
        for key, name in (('full', '전문'), ('history', '개정 이력'), ('compare', '전후 비교')):
            ok = click_named(pg, name)
            slow_scroll(pg)
            shot(pg, out('musinsa-privacy-%s-%s.jpg' % (key, tag)), mh)
            print('musinsa', tag, key, ok, pg.evaluate('document.documentElement.scrollHeight'))
        # 전후 비교 탭까지 누른 뒤라 select 가 3개(버전 선택 1 + 비교용 2)다. 버전 수 = 전체 option 수 / 3.
        vers = pg.evaluate("() => [...document.querySelectorAll('select option')].map(o => o.innerText.trim())")
        print('musinsa', tag, 'options', len(vers), 'versions', len(vers) // 3, vers[:3])
        pg.close()


def capture_kakao(pc, mo):
    """카카오 개인정보 처리방침: 위쪽, 맨 아래(시행일·이전 방침 버튼), 모바일 묶음 메뉴 펼침."""
    url = 'https://www.kakao.com/policy/privacy'
    for tag, ctx, mh, bh in (('pc', pc, 5200, 2600), ('m', mo, 4500, 3000)):
        pg = open_page(ctx, url, wait=3000)
        total = pg.evaluate('document.documentElement.scrollHeight')
        shot(pg, out('kakao-privacy-%s.jpg' % tag), mh)
        region(pg, out('kakao-privacy-bottom-%s.jpg' % tag), total - bh, bh)
        if tag == 'm':
            try:
                pg.locator('a.link_nav').first.click(timeout=3000)   # "관련메뉴 펼치기"
                pg.wait_for_timeout(1000)
                pg.screenshot(path=out('kakao-privacy-menu-m.jpg'), type='jpeg', quality=72)
            except Exception as e:
                print('kakao menu fail', str(e)[:120])
        print('kakao', tag, total)
        pg.close()


def capture_govuk(pc, mo):
    """GOV.UK 쿠키 상세: 3열 표(Name / Purpose / Expires)."""
    url = 'https://www.gov.uk/help/cookie-details'
    for tag, ctx, mh in (('pc', pc, 5200), ('m', mo, 4500)):
        pg = open_page(ctx, url, wait=2500, close=False)
        dismiss(pg, ['Reject additional cookies'])
        dismiss(pg, ['Hide cookie message', 'Hide this message'])
        pg.evaluate('window.scrollTo(0,0)')
        pg.wait_for_timeout(400)
        shot(pg, out('govuk-cookies-%s.jpg' % tag), mh)
        widths = pg.evaluate("() => [...document.querySelectorAll('table')].map(t => [t.scrollWidth, t.parentElement.clientWidth])")
        print('govuk', tag, 'table width / column width', widths[:6])
        pg.close()


def capture_qwilr(pc, mo):
    """Qwilr 견적 템플릿 실제 화면: 맨 위(고정 띠·표지)와 견적 구역."""
    url = 'https://templates.qwilr.com/5k3rPwvjSqqz'
    for tag, ctx in (('pc', pc), ('m', mo)):
        pg = open_page(ctx, url, wait=4000)
        shot(pg, out('qwilr-top-%s.jpg' % tag), 3200)
        y = pg.evaluate("""() => { const els=[...document.querySelectorAll('h1,h2,h3,p,div')]
            .filter(e => e.innerText && e.innerText.trim()==='Quote');
            return els.length ? els[0].getBoundingClientRect().top + window.scrollY : 0 }""")
        total = pg.evaluate('document.documentElement.scrollHeight')
        y0 = max(0, int(y) - 100)
        region(pg, out('qwilr-quote-%s.jpg' % tag), y0, min(total - y0, 4200))
        print('qwilr', tag, 'quote y', y, 'H', total)
        pg.close()


def capture_invoicegen(pc, mo):
    """Invoice-Generator.com: 종이 한 장 모양 화면과 종이 밖 행동 버튼."""
    url = 'https://invoice-generator.com'
    for tag, ctx in (('pc', pc), ('m', mo)):
        pg = open_page(ctx, url)
        shot(pg, out('invoicegen-invoice-%s.jpg' % tag), 3200)
        print('invoicegen', tag, pg.evaluate('document.documentElement.scrollHeight'))
        pg.close()


JOBS = {
    'musinsa': capture_musinsa,
    'kakao': capture_kakao,
    'govuk': capture_govuk,
    'qwilr': capture_qwilr,
    'invoicegen': capture_invoicegen,
}


def final(names):
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc, mo = contexts(b)
        for n in names:
            try:
                JOBS[n](pc, mo)
            except Exception as e:
                print('FAIL', n, str(e)[:200])
        b.close()


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'final'
    if mode == 'probe':
        args = sys.argv[2:]
        probe(list(zip(args[0::2], args[1::2])), os.environ.get('PROBE_OUT', HERE))
    else:
        final(sys.argv[2:] or list(JOBS))
