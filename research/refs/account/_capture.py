# -*- coding: utf-8 -*-
"""마이페이지·계정형 레퍼런스 캡처.

사용법:
  /usr/bin/python3 _capture.py <job> [<job> ...]     # JOBS 에 적힌 작업 이름
  /usr/bin/python3 _capture.py --list

작업마다 PC(1440)와 모바일(390, 2배율)로 한 번씩 열어
research/refs/account/<site>-<screen>-pc.jpg, -m.jpg 로 저장한다.
로그인·제출은 하지 않는다. 닫기 버튼만 누른다.
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
MOBILE_UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
             '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

# 화면을 가리는 띠·팝업을 닫을 때 눌러 보는 버튼(있을 때만)
CLOSERS = [
    'button:has-text("Accept all")', 'button:has-text("Accept All")', 'button:has-text("Accept")',
    'button:has-text("Got it")', 'button:has-text("I agree")', 'button:has-text("Allow all")',
    'button:has-text("동의")', 'button:has-text("오늘 하루 보지 않기")', 'button:has-text("닫기")',
    '[aria-label="Close"]', '[aria-label="close"]', '[aria-label="닫기"]',
]

JOBS = {
    # name: dict(url, site, screen, max_h, steps_pc, steps_m, only)
    #  steps: [('click', selector), ('wait', ms), ('eval', js), ('scroll_to', selector)]
    'shopify-ux': dict(url='https://shopify.dev/docs/apps/build/customer-accounts/ux',
                       site='shopify', screen='account-ux-guide', max_h=9000),
    'shopify-ux-img': dict(url='https://shopify.dev/docs/apps/build/customer-accounts/ux', site='shopify', screen='ux-img',
                           max_h=9500, elements_only=True, hide_fixed=True, dpr=2, elements_auto=('main img', 300)),
    'shadcn-orders-doc': dict(url='https://www.shadcn.io/blocks/account-orders', site='shadcn', screen='account-orders-doc', max_h=3000,
                              dump_iframes=True, dump_links='/blocks/account'),
    'musinsa-my': dict(url='https://www.musinsa.com/mypage', site='musinsa', screen='my', max_h=4200, dump_links='musinsa.com'),
    'flowbite-account': dict(url='https://flowbite.com/blocks/e-commerce/account-overview/',
                             site='flowbite', screen='account-overview', max_h=7000),
    'flowbite-orders': dict(url='https://flowbite.com/blocks/e-commerce/orders-overview/',
                            site='flowbite', screen='orders-overview', max_h=7000),
    'flowbite-tracking': dict(url='https://flowbite.com/blocks/e-commerce/order-tracking/',
                              site='flowbite', screen='order-tracking', max_h=7000),
    # Flowbite 블록 문서 안의 미리보기(iframe srcdoc)를 요소 단위로 찍는다
    'flowbite-orders-el': dict(url='https://flowbite.com/blocks/e-commerce/orders-overview/', site='flowbite', screen='orders',
                               elements_only=True, hide_fixed=True, max_h=9000,
                               elements=[('iframe[srcdoc]', 1, 'orders-table'), ('iframe[srcdoc]', 2, 'orders-sidebar')]),
    'flowbite-account-el': dict(url='https://flowbite.com/blocks/e-commerce/account-overview/', site='flowbite', screen='account',
                                elements_only=True, hide_fixed=True, max_h=11000,
                                elements=[('iframe[srcdoc]', 1, 'account-sidebar')]),
    'stickermule-proof': dict(url='https://stickermule.com/support/how-do-i-request-individual-sticker-changes-on-my-sticker-pack-proof',
                              site='stickermule', screen='proof-help', max_h=7000),
    'yoprint-portal': dict(url='https://www.yoprint.com/customer-self-service-portal-for-print-shops',
                           site='yoprint', screen='customer-portal', max_h=22000, elements_only=True,
                           sections=[("Everything they'd email", 'portal-home', 2400),
                                     ('Full visibility into specs', 'order-file', 2600),
                                     ('Close quotes', 'quote-approval', 2400),
                                     ('Proofs they can review', 'artwork-proof', 3000)]),
    'yoprint-approval': dict(url='https://support.yoprint.com/article/129-artwork-approval-workflow',
                             site='yoprint', screen='approval-help', max_h=16000),
    'redprinting-faq': dict(url='https://www.redprinting.co.kr/ko/board/faq/lists', site='redprinting', screen='faq', max_h=4200,
                            steps=[('click', 'text=회원 탈퇴는 어디서 하나요?'), ('wait', 600), ('eval', 'window.scrollTo(0, 0)')]),
    'wwit-mypage': dict(url='https://wwit.design/pattern/mypage', site='wwit', screen='mypage-pattern', max_h=6000, dump_links='wwit.design'),
    'wwit-order': dict(url='https://wwit.design/pattern/order', site='wwit', screen='order-pattern', max_h=6000),
    'krds-list': dict(url='https://www.krds.go.kr/html/site/component/component_04_01.html', site='krds', screen='structured-list', max_h=9000),
    'flowbite-index': dict(url='https://flowbite.com/blocks/', site='flowbite', screen='index', max_h=3000, dump_links='/blocks/e-commerce/', only='pc'),
    'baymard-orders': dict(url='https://baymard.com/ecommerce-design-examples/62-orders-overview',
                           site='baymard', screen='orders-overview', max_h=5200),
}


def close_overlays(pg):
    for sel in CLOSERS:
        try:
            loc = pg.locator(sel).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=1500)
                pg.wait_for_timeout(400)
        except Exception:
            pass


def slow_scroll(pg, max_h):
    try:
        total = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
        y = 0
        while y < total:
            pg.evaluate('y => window.scrollTo(0, y)', y)
            pg.wait_for_timeout(250)
            y += 700
            total = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
        pg.evaluate('window.scrollTo(0, 0)')
        pg.wait_for_timeout(600)
    except Exception as e:
        print('  scroll error', e)


def run_steps(pg, steps):
    for kind, arg in steps or []:
        try:
            if kind == 'click':
                pg.locator(arg).first.click(timeout=4000)
                pg.wait_for_timeout(700)
            elif kind == 'wait':
                pg.wait_for_timeout(arg)
            elif kind == 'eval':
                pg.evaluate(arg)
                pg.wait_for_timeout(400)
            elif kind == 'scroll_to':
                pg.locator(arg).first.scroll_into_view_if_needed(timeout=4000)
                pg.wait_for_timeout(500)
        except Exception as e:
            print('  step failed', kind, str(arg)[:60], '->', str(e)[:120])


def shot(pg, path, max_h=5200, clip_y=0):
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h + clip_y) - clip_y
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': clip_y, 'width': w, 'height': max(h, 200)}, full_page=True)


def fit_mobile(path):
    """모바일은 2배율이라 폭 780px 이하인지 확인하고, 세로 9000px 을 넘으면 잘라 낸다."""
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
        im.convert('RGB').save(path, 'JPEG', quality=72)
    return im.size


def capture(ctx, job, suffix, steps_key):
    pg = ctx.new_page()
    path = os.path.join(OUT, '%s-%s-%s.jpg' % (job['site'], job['screen'], suffix))
    info = {}
    try:
        resp = pg.goto(job['url'], wait_until='domcontentloaded', timeout=45000)
        info['status'] = resp.status if resp else None
        pg.wait_for_timeout(job.get('wait', 2500))
        close_overlays(pg)
        slow_scroll(pg, job.get('max_h', 5200) + job.get('clip_y', 0))
        run_steps(pg, job.get(steps_key) or job.get('steps'))
        info['final_url'] = pg.url
        info['title'] = pg.title()
        info['height'] = pg.evaluate('document.documentElement.scrollHeight')
        if job.get('dump_iframes'):
            info['iframes'] = pg.evaluate('Array.from(document.querySelectorAll("iframe")).map(f => f.src).filter(s => s && !/google|doubleclick|carbon/.test(s)).slice(0, 20)')
        if job.get('dump_links'):
            info['links'] = pg.evaluate('(p) => Array.from(document.querySelectorAll("a")).map(a => a.href).filter(h => h.includes(p)).slice(0, 80)', job['dump_links'])
        if job.get('hide_fixed'):
            # 문서 사이트의 고정 머리띠가 요소 캡처 위에 겹치지 않게 숨긴다
            pg.evaluate('''() => document.querySelectorAll('body *').forEach(el => {
                const p = getComputedStyle(el).position;
                if ((p === 'fixed' || p === 'sticky') && el.tagName !== 'IFRAME') el.style.setProperty('display', 'none', 'important');
            })''')
            pg.wait_for_timeout(300)
        if not job.get('elements_only'):
            shot(pg, path, job.get('max_h', 5200), job.get('clip_y', 0))
            if suffix == 'm':
                info['size'] = fit_mobile(path)
            else:
                info['size'] = Image.open(path).size
            info['file'] = os.path.basename(path)
        # sections: [(제목 일부, screen 이름, 최대 높이)] — 그 제목이 든 <section>(없으면 제목부터 최대 높이)만 잘라 찍는다
        for snippet, name, max_sec_h in job.get('sections', []):
            spath = os.path.join(OUT, '%s-%s-%s.jpg' % (job['site'], name, suffix))
            try:
                box = pg.evaluate('''(t) => {
                    const els = [...document.querySelectorAll('h1,h2,h3,h4')];
                    const el = els.find(e => (e.innerText || '').replace(/\\s+/g, ' ').includes(t));
                    if (!el) return null;
                    const sec = el.closest('section');
                    const r = (sec || el).getBoundingClientRect();
                    return {y: r.top + scrollY, h: r.height, sec: !!sec};
                }''', snippet)
                if not box:
                    raise RuntimeError('heading not found: ' + snippet)
                y = max(0, box['y'] - (0 if box['sec'] else 120))
                h = min(box['h'] if box['sec'] else max_sec_h, max_sec_h)
                w = pg.viewport_size['width']
                pg.screenshot(path=spath, type='jpeg', quality=72, full_page=True,
                              clip={'x': 0, 'y': y, 'width': w, 'height': h})
                size = fit_mobile(spath) if suffix == 'm' else Image.open(spath).size
                info.setdefault('sections', []).append([os.path.basename(spath), size, box['sec']])
            except Exception as e:
                info.setdefault('sections', []).append([name, 'ERR ' + str(e)[:120]])
        # elements_auto: (selector, 최소 폭) — 맞는 요소를 순서대로 모두 찍는다(<site>-<screen>-<번호>)
        if job.get('elements_auto'):
            sel, min_w = job['elements_auto']
            locs = pg.locator(sel)
            k = 0
            for i in range(locs.count()):
                loc = locs.nth(i)
                try:
                    bb = loc.bounding_box()
                    if not bb or bb['width'] < min_w or bb['height'] < 80:
                        continue
                    k += 1
                    epath = os.path.join(OUT, '%s-%s-%02d-%s.jpg' % (job['site'], job['screen'], k, suffix))
                    loc.scroll_into_view_if_needed(timeout=5000)
                    pg.wait_for_timeout(500)
                    loc.screenshot(path=epath, type='jpeg', quality=78, timeout=20000)
                    size = fit_mobile(epath) if suffix == 'm' else Image.open(epath).size
                    alt = (loc.get_attribute('alt') or '')[:60]
                    info.setdefault('elements', []).append([os.path.basename(epath), size, alt])
                except Exception as e:
                    info.setdefault('elements', []).append([i, 'ERR ' + str(e)[:100]])
        # elements: [(selector, nth, screen 이름)] — 그 요소만 따로 찍는다(문서 속 미리보기·삽화)
        for sel, nth, name in job.get('elements', []):
            epath = os.path.join(OUT, '%s-%s-%s.jpg' % (job['site'], name, suffix))
            try:
                loc = pg.locator(sel).nth(nth)
                loc.scroll_into_view_if_needed(timeout=5000)
                pg.wait_for_timeout(900)
                loc.screenshot(path=epath, type='jpeg', quality=72, timeout=20000)
                size = fit_mobile(epath) if suffix == 'm' else Image.open(epath).size
                info.setdefault('elements', []).append([os.path.basename(epath), size])
            except Exception as e:
                info.setdefault('elements', []).append([name, 'ERR ' + str(e)[:120]])
    except Exception as e:
        info['error'] = str(e)[:300]
    finally:
        pg.close()
    return info


def main():
    names = sys.argv[1:]
    if not names or names[0] == '--list':
        print('\n'.join(JOBS))
        return
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        pc2 = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR', device_scale_factor=2)
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=MOBILE_UA)
        for n in names:
            job = JOBS[n]
            only = job.get('only')
            print('==', n, job['url'])
            if only in (None, 'pc'):
                # dpr=2: 문서 속 작은 삽화(실제 화면 그림)의 글자를 읽으려고 PC 를 2배율로 찍는다
                ctx = pc2 if job.get('dpr') == 2 else pc
                print(' pc', json.dumps(capture(ctx, job, 'pc', 'steps_pc'), ensure_ascii=False))
            if only in (None, 'm'):
                print(' m ', json.dumps(capture(mo, job, 'm', 'steps_m'), ensure_ascii=False))
        b.close()


if __name__ == '__main__':
    main()
