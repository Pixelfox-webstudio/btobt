#!/usr/bin/env python3
"""견적 요청으로 이어지는 B2B 장바구니를 공개 데모 상점에서 찍는다(2026-11-17).
- demo.commerce.oroinc.com 은 주소가 풀리지 않아 버렸다.
- 대신 공개 데모 상점 두 곳(로그인 없이 열리는 곳)을 한 번씩만 시도한다.
상품을 장바구니에 담는 것까지만 한다. 로그인·양식 제출·개인정보 입력 없음.
막히면 진단만 출력하고 넘어간다(다시 시도하지 않는다).
"""
import os, re, sys
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
BTN_JS = "Array.from(document.querySelectorAll('button,a.btn,a[role=button]')).map(e=>e.innerText.trim().replace(/\\s+/g,' ')).filter(Boolean).slice(0,50)"


def settle(page):
    page.wait_for_timeout(2500)
    h = page.evaluate('document.documentElement.scrollHeight')
    y = 0
    while y < h:
        page.evaluate('y => window.scrollTo(0, y)', y); page.wait_for_timeout(180); y += 600
    page.evaluate('window.scrollTo(0, 0)'); page.wait_for_timeout(500)


def save(page, out, cap):
    page.screenshot(path=out, full_page=True, type='jpeg', quality=72)
    im = Image.open(out)
    if im.size[1] > cap:
        im.crop((0, 0, im.size[0], cap)).save(out, quality=72); im = Image.open(out)
    print('  저장', os.path.basename(out), im.size)


def mobile_ctx(b, state):
    return b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
                         device_scale_factor=2, user_agent=UA_M, locale='ko-KR', storage_state=state)


def medusa(b):
    """Medusa B2B 데모: 상품 화면의 옵션 표에 수량을 넣고 담은 뒤 장바구니를 찍는다."""
    home = 'https://meridian.shelfside.app/'
    pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
    pg = pc.new_page()
    r = pg.goto(home, wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(3000)
    print('  상태', r.status if r else None, '| 제목', pg.title(), '| 주소', pg.url)
    # 2차(마지막) 시도: 첫 화면에 상품 링크가 없어 "Browse Catalog" 로 목록에 들어간 뒤 상품을 찾는다.
    allhrefs = pg.evaluate("Array.from(document.querySelectorAll('a[href]')).map(a=>[a.innerText.trim().slice(0,30), a.href])")
    print('  첫 화면 링크', allhrefs[:25])
    cat = next((h for t, h in allhrefs if re.search(r'browse catalog|products', t, re.I)), None)
    if cat:
        pg.goto(cat, wait_until='domcontentloaded', timeout=45000); pg.wait_for_timeout(3500)
        print('  목록 화면', pg.title(), pg.url)
    PAT = r'/(products?|p)/[^/?#]+'
    links = [h for h in pg.evaluate("Array.from(new Set(Array.from(document.querySelectorAll('a[href]')).map(a=>a.href)))") if re.search(PAT, h)]
    print('  상품 링크 수', len(links), links[:3])
    if not links:
        print('  목록 링크', pg.evaluate("Array.from(new Set(Array.from(document.querySelectorAll('a[href]')).map(a=>a.href))).slice(0,40)")); return
    prod = links[0]
    pg.goto(prod, wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(3500)
    print('  상품 화면', pg.title(), pg.url)
    print('  버튼들', pg.evaluate(BTN_JS))
    inputs = pg.locator('table input')
    n = inputs.count(); print('  표 입력칸 수', n)
    for i, q in zip(range(min(n, 3)), ['12', '8', '5']):
        try:
            inputs.nth(i).fill(q, timeout=5000); inputs.nth(i).blur()
        except Exception as e:
            print('  입력 실패', i, str(e)[:100])
    pg.wait_for_timeout(800)
    add = pg.get_by_role('button', name=re.compile(r'add to cart', re.I))
    print('  담기 버튼 수', add.count())
    if add.count() == 0:
        return
    save(pg, f'{D}/meridian-variant-table-pc.jpg', 5200)
    try:
        add.first.click(timeout=8000)
    except Exception as e:
        print('  담기 실패', str(e)[:150]); return
    pg.wait_for_timeout(4000)
    u = urlparse(pg.url); cc = u.path.strip('/').split('/')[0]
    cart = f'{u.scheme}://{u.netloc}/{cc}/cart'
    pg.goto(cart, wait_until='domcontentloaded', timeout=45000)
    settle(pg)
    print('  장바구니', pg.title(), pg.url)
    print('  버튼들', pg.evaluate(BTN_JS))
    print('  본문', pg.evaluate("document.body.innerText.replace(/\\s+/g,' ').slice(0,700)"))
    save(pg, f'{D}/meridian-cart-pc.jpg', 5200)
    mo = mobile_ctx(b, pc.storage_state())
    mp = mo.new_page()
    mp.goto(cart, wait_until='domcontentloaded', timeout=45000); settle(mp)
    save(mp, f'{D}/meridian-cart-m.jpg', 9000)
    mp.goto(prod, wait_until='domcontentloaded', timeout=45000); settle(mp)
    save(mp, f'{D}/meridian-variant-table-m.jpg', 9000)


def oro(b):
    """OroCommerce 데모: 비회원으로 쇼핑 리스트에 담을 수 있으면 리스트 화면을 찍는다."""
    home = 'https://oro-meridian.shelfside.app/'
    pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
    pg = pc.new_page()
    r = pg.goto(home, wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(3500)
    print('  상태', r.status if r else None, '| 제목', pg.title(), '| 주소', pg.url)
    btn = pg.get_by_role('button', name=re.compile(r'add to shopping list', re.I))
    n = btn.count(); print('  담기 버튼 수', n)
    if n == 0:
        print('  버튼들', pg.evaluate(BTN_JS)); return
    for i in range(min(n, 6)):
        try:
            if btn.nth(i).is_visible():
                btn.nth(i).scroll_into_view_if_needed(timeout=5000)
                btn.nth(i).click(timeout=8000); print('  눌렀다', i); break
        except Exception as e:
            print('  클릭 실패', i, str(e)[:120])
    pg.wait_for_timeout(4000)
    hrefs = pg.evaluate("Array.from(new Set(Array.from(document.querySelectorAll('a[href*=\"shoppinglist\"]')).map(a=>a.href)))")
    print('  리스트 링크', hrefs[:8])
    target = next((h for h in hrefs if re.search(r'shoppinglist/(view/)?\d+', h)), hrefs[0] if hrefs else None)
    if not target:
        print('  본문', pg.evaluate("document.body.innerText.replace(/\\s+/g,' ').slice(0,300)")); return
    pg.goto(target, wait_until='domcontentloaded', timeout=45000); settle(pg)
    print('  리스트 화면', pg.title(), pg.url)
    print('  버튼들', pg.evaluate(BTN_JS))
    save(pg, f'{D}/oro-shoppinglist-pc.jpg', 5200)
    mo = mobile_ctx(b, pc.storage_state())
    mp = mo.new_page()
    mp.goto(target, wait_until='domcontentloaded', timeout=45000); settle(mp)
    save(mp, f'{D}/oro-shoppinglist-m.jpg', 9000)


with sync_playwright() as p:
    b = p.chromium.launch()
    for name, fn in (('medusa', medusa),):  # oro 는 비회원 담기 버튼이 없어 버렸다
        print(name)
        try:
            fn(b)
        except Exception as e:
            print('  실패', str(e)[:300])
    b.close()
