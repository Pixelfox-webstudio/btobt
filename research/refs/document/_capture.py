# -*- coding: utf-8 -*-
"""문서형(document) 레퍼런스 캡처 스크립트.

사용법
  /usr/bin/python3 _capture.py probe <이름> <주소> [<이름> <주소> ...]   # 후보 훑기(임시 폴더에 PC·모바일 한 장씩)
  /usr/bin/python3 _capture.py final                                      # 남긴 곳 캡처(이 폴더에 저장)

로그인·양식 제출은 하지 않는다. 쿠키 띠·팝업은 닫기 버튼만 누른다.
"""
import os
import sys
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

CLOSE_TEXTS = ['모두 수락', '모두 허용', '동의', '확인', '닫기', 'Accept all', 'Accept All', 'Accept additional cookies',
               'Accept', 'Reject all', 'Got it', 'OK', 'Close']


def shot(pg, path, max_h=5200):
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)
    fit(path)


def fit(path):
    """모바일(2배) 그림은 폭 780 이하·세로 9000 이하로 맞춘다."""
    im = Image.open(path)
    w, h = im.size
    changed = False
    if w > 1440:
        r = 1440 / w
        im = im.resize((1440, int(h * r)))
        changed = True
    if 780 < w <= 1440 and False:
        pass
    if h > 9000:
        im = im.crop((0, 0, im.size[0], 9000))
        changed = True
    if changed:
        im.convert('RGB').save(path, 'JPEG', quality=72)


def slow_scroll(pg, max_h=9000):
    total = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    y = 0
    while y < total:
        pg.evaluate('y => window.scrollTo(0, y)', y)
        pg.wait_for_timeout(180)
        y += 700
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(500)


def dismiss(pg):
    for t in CLOSE_TEXTS:
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


def probe(pairs, out):
    os.makedirs(out, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc, mo = contexts(b)
        for name, url in pairs:
            for tag, ctx in (('pc', pc), ('m', mo)):
                try:
                    pg = open_page(ctx, url)
                    p = os.path.join(out, '_tmp-%s-%s.jpg' % (name, tag))
                    shot(pg, p, max_h=3200)
                    print('OK', name, tag, pg.url, pg.title()[:60],
                          pg.evaluate('document.documentElement.scrollHeight'))
                    pg.close()
                except Exception as e:
                    print('FAIL', name, tag, str(e)[:160])
        b.close()


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'final'
    if mode == 'probe':
        args = sys.argv[2:]
        out = os.environ.get('PROBE_OUT', HERE)
        probe(list(zip(args[0::2], args[1::2])), out)
    else:
        import _final  # noqa
