#!/usr/bin/env python3
"""장바구니·결제형 레퍼런스 추가 캡처(2026-11-17).
앞 담당자의 _capture.py 는 폴더에 남아 있지 않았다. 이 파일은 이어받은 뒤 추가로 찍은 화면만 다룬다.
공개 예시 화면만 연다. 로그인·양식 제출 없음.
사용: /usr/bin/python3 _capture2.py
"""
import os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

# (파일 이름 앞부분, [주소 후보 — 앞에서부터 200 이 나오는 첫 주소를 쓴다])
TARGETS = [
    ('govuk-confirmation', [
        'https://design-system.service.gov.uk/patterns/confirmation-pages/default/index.html',
        'https://design-system.service.gov.uk/patterns/confirmation-pages/',
    ]),
    ('govuk-check-answers', [
        'https://design-system.service.gov.uk/patterns/check-answers/default/index.html',
        'https://design-system.service.gov.uk/patterns/check-answers/',
    ]),
    ('govuk-error-summary', [
        'https://design-system.service.gov.uk/components/error-summary/full-page-example/index.html',
        'https://design-system.service.gov.uk/components/error-summary/linked-to-input/index.html',
        'https://design-system.service.gov.uk/components/error-summary/',
    ]),
]


def shoot(page, urls, out, cap_css_h, scale):
    used = None
    for u in urls:
        try:
            r = page.goto(u, wait_until='domcontentloaded', timeout=45000)
        except Exception as e:
            print('  goto 실패', u, str(e)[:80]); continue
        if r and r.status == 200:
            used = u; break
        print('  상태', r.status if r else None, u)
    if not used:
        return None
    page.wait_for_timeout(2500)
    h = page.evaluate('document.documentElement.scrollHeight')
    y = 0
    while y < h:
        page.evaluate('y => window.scrollTo(0, y)', y)
        page.wait_for_timeout(180)
        y += 600
    page.evaluate('window.scrollTo(0, 0)')
    page.wait_for_timeout(500)
    page.screenshot(path=out, full_page=True, type='jpeg', quality=72)
    im = Image.open(out)
    cap = cap_css_h * scale
    if im.size[1] > cap:
        im.crop((0, 0, im.size[0], cap)).save(out, quality=72)
        im = Image.open(out)
    print('  저장', os.path.basename(out), im.size, '<-', used)
    return used


with sync_playwright() as p:
    b = p.chromium.launch()
    pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
    mo = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
                       device_scale_factor=2, user_agent=UA_M, locale='ko-KR')
    for name, urls in TARGETS:
        print(name)
        pg = pc.new_page(); shoot(pg, urls, f'{D}/{name}-pc.jpg', 5200, 1); pg.close()
        pg = mo.new_page(); shoot(pg, urls, f'{D}/{name}-m.jpg', 4500, 2); pg.close()
        f = f'{D}/{name}-m.jpg'
        if os.path.exists(f):
            im = Image.open(f)
            assert im.size[0] <= 780 and im.size[1] <= 9000, im.size
    b.close()
