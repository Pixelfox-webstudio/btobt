#!/usr/bin/env python3
"""고객센터 주문방법의 화면 예시 그림(img/guide/g-*.webp)을 실제 하위 페이지 시안 화면으로 다시 찍는다.

처음에는 임시 그림을 넣어 두었다. 페이지가 다 만들어진 뒤 이 스크립트를 돌리면 같은 파일 이름으로 바뀐다(1200×750, webp).
화면마다 (페이지 주소, 찍을 부분의 CSS 선택자 후보, 없을 때 쓸 스크롤 위치)를 적어 둔다. 선택자 후보 중 처음 찾은 요소를 중심으로 자른다.
사용: python3 tools/guide_shots.py            (전부)
      python3 tools/guide_shots.py g-cart       (일부)
"""
import sys, pathlib, io
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'img' / 'guide'

# 이름: (주소, [선택자 후보...], 대체 세로 위치)
SHOTS = {
    'g-option-print':   ('product.html?id=463&state=print', ['[data-el~="L218"]', '[data-el~="L219"]', '.pd__buy', 'form'], 300),
    'g-print-detail':   ('product.html?id=463&state=print', ['[data-el~="L221"]', '[data-el~="L223"]', '[data-el~="L225"]'], 900),
    'g-cart-add':       ('product.html?id=463&state=added', ['.pop.is-on .pop__box', '[data-el~="L230"]'], 300),
    'g-cart':           ('cart.html', ['[data-el~="L274"]', 'main .wrap'], 200),
    'g-after-order':    ('order-complete.html', ['.gate', 'main .wrap'], 120),
    'g-mypage-draft':   ('mypage.html?section=orders', ['[data-el~="L1256"]', '[data-el~="L1231"]'], 300),
    'g-draft':          ('draft-preview.html', ['[data-el~="L900"]', '.win__body'], 60),
    'g-quote-doc':      ('quote-request-document.html', ['.win__body', 'main'], 60),
    'g-mypage-pay':     ('mypage.html?section=orders', ['[data-el~="L1258"]', '[data-el~="L1231"]'], 300),
    'g-order-info':     ('order.html', ['[data-el~="L404"]', '[data-el~="L410"]'], 300),
    'g-order-pay':      ('order.html', ['[data-el~="L423"]'], 1200),
    'g-order-agree':    ('order.html', ['[data-el~="L428"]', '[data-el~="L439"]'], 1800),
    'g-complete':       ('order-complete.html?state=card', ['.gate', 'main .wrap'], 120),
    'g-option-noprint': ('product.html?id=463', ['[data-el~="L219"]', '[data-el~="L213"]', '.pd__buy'], 300),
}

JS_FIND = '''(sels) => {
  for (const s of sels) {
    const e = document.querySelector(s);
    if (e && e.getClientRects().length) { const r = e.getBoundingClientRect(); return { s, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }
  }
  return null;
}'''


def main():
    from playwright.sync_api import sync_playwright
    only = set(sys.argv[1:])
    done, miss = [], []
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        ctx = br.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1, reduced_motion='reduce', locale='ko-KR')
        ctx.add_init_script("try{localStorage.setItem('b2bt-consent','{\"t\":1}')}catch(e){}")
        pg = ctx.new_page()
        for name, (url, sels, fy) in SHOTS.items():
            if only and name not in only:
                continue
            page = url.split('?')[0]
            if not (ROOT / page).exists():
                miss.append('%s (%s 없음)' % (name, page)); continue
            pg.goto('file://' + str(ROOT / url), wait_until='load', timeout=30000)
            pg.wait_for_timeout(500)
            r = pg.evaluate(JS_FIND, sels)
            # 1200×750 비율(16:10)로, 찾은 요소를 가운데 두고 자른다. 요소가 크면 위쪽부터.
            W, H = 1200, 750
            if r:
                cx = r['x'] + r['w'] / 2
                top = r['y'] - 40 if r['h'] > H - 80 else r['y'] + r['h'] / 2 - H / 2
            else:
                cx, top = 720, fy
            left = max(0, min(1440 - W, cx - W / 2))
            top = max(0, top)
            pg.evaluate('(y) => window.scrollTo(0, y)', max(0, top - 200))
            pg.wait_for_timeout(250)
            sy = pg.evaluate('window.scrollY')
            png = pg.screenshot(clip={'x': left, 'y': top - sy, 'width': W, 'height': H})
            Image.open(io.BytesIO(png)).convert('RGB').save(OUT / (name + '.webp'), quality=78)
            done.append('%s ← %s %s' % (name, url, r['s'] if r else '(대체 위치)'))
        br.close()
    print('화면 예시 %d장을 다시 찍음' % len(done))
    for d in done:
        print('  ', d)
    for m in miss:
        print('  ✗', m)
    return 1 if miss else 0


if __name__ == '__main__':
    sys.exit(main())
