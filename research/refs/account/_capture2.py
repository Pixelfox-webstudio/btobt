# -*- coding: utf-8 -*-
"""마이페이지·계정형 레퍼런스 추가 캡처(이어받은 담당이 덧붙임).

사용법:
  /usr/bin/python3 _capture2.py [yoprint] [shadcn] [flowbite] [krds]

_capture.py 의 도우미(닫기 버튼, 천천히 스크롤, 모바일 크기 확인)를 그대로 쓴다.
로그인·제출은 하지 않는다. 누르는 것은 미리보기 안의 드롭다운·모달 열기 버튼뿐이다.
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright
from PIL import Image
import _capture as C

OUT = C.OUT
STATE = {}


def P(name):
    return os.path.join(OUT, name)


def size_of(path, suffix):
    return C.fit_mobile(path) if suffix == 'm' else Image.open(path).size


def open_page(ctx, url, max_h=5200, wait=2500):
    pg = ctx.new_page()
    resp = pg.goto(url, wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(wait)
    C.close_overlays(pg)
    C.slow_scroll(pg, max_h)
    return pg, (resp.status if resp else None)


def unstick(pg, hide=False):
    """고정·붙박이 머리띠가 긴 캡처 가운데에 겹치지 않게 한다."""
    pg.evaluate('''(hide) => document.querySelectorAll('body *').forEach(el => {
        const p = getComputedStyle(el).position;
        if ((p === 'fixed' || p === 'sticky') && el.tagName !== 'IFRAME') {
            if (hide) el.style.setProperty('display', 'none', 'important');
            else el.style.setProperty('position', 'static', 'important');
        }
    })''', hide)
    pg.wait_for_timeout(300)


HEADS_JS = '''() => [...document.querySelectorAll('h1,h2,h3,h4')].map(e => ({
    t: (e.innerText || '').replace(/\\s+/g, ' ').trim(), y: e.getBoundingClientRect().top + scrollY, tag: e.tagName}))'''


def yoprint(b, ctx, suffix):
    """도움말 글에서 '고객이 보는 화면' 두 절만 잘라 찍는다(앞쪽 가게 관리자 화면은 우리 유형이 아니다)."""
    pg, st = open_page(ctx, 'https://support.yoprint.com/article/129-artwork-approval-workflow', max_h=90000)
    out = {'status': st, 'height': pg.evaluate('document.documentElement.scrollHeight')}
    cap = 5200 if suffix == 'pc' else 4500
    for snippet, name in [('What your customer sees', 'approval-customer'),
                          ('How your customer reviews artwork on a phone', 'approval-phone')]:
        try:
            heads = pg.evaluate(HEADS_JS)
            idx = next((i for i, h in enumerate(heads) if snippet.lower() in h['t'].lower() and h['tag'] != 'H1'), None)
            if idx is None:
                out[name] = 'heading not found'
                continue
            pg.evaluate('y => window.scrollTo(0, y)', heads[idx]['y'])
            pg.wait_for_timeout(1500)
            heads = pg.evaluate(HEADS_JS)
            y0 = max(0, heads[idx]['y'] - 30)
            y1 = heads[idx + 1]['y'] - 20 if idx + 1 < len(heads) else y0 + cap
            h = min(max(y1 - y0, 300), cap)
            path = P('yoprint-%s-%s.jpg' % (name, suffix))
            pg.screenshot(path=path, type='jpeg', quality=72, full_page=True,
                          clip={'x': 0, 'y': y0, 'width': pg.viewport_size['width'], 'height': h})
            out[name] = [os.path.basename(path), size_of(path, suffix), int(y0), int(y1)]
        except Exception as e:
            out[name] = 'ERR ' + str(e)[:160]
    out['heads'] = [h['t'][:40] for h in pg.evaluate(HEADS_JS)][:30]
    pg.close()
    return out


def shadcn(b, ctx, suffix):
    """문서 화면이 안쪽 스크롤이라 PC 는 세로 2000 창으로 한 번 찍고, 미리보기 iframe 주소가 있으면 그 주소를 따로 연다."""
    out = {}
    url = 'https://www.shadcn.io/blocks/account-orders'
    if suffix == 'pc':
        tall = b.new_context(viewport={'width': 1440, 'height': 2000}, locale='ko-KR')
        pg = tall.new_page()
        resp = pg.goto(url, wait_until='domcontentloaded', timeout=45000)
        out['status'] = resp.status if resp else None
        pg.wait_for_timeout(4500)
        frames = pg.evaluate('''() => [...document.querySelectorAll('iframe')].map(f => {
            const r = f.getBoundingClientRect(); return {src: f.src, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top)}; })''')
        out['iframes'] = frames
        path = P('shadcn-account-orders-doc-pc.jpg')
        pg.screenshot(path=path, type='jpeg', quality=72)
        out['doc'] = [os.path.basename(path), Image.open(path).size]
        cands = [f['src'] for f in frames if f['w'] > 500 and f['src'].startswith('http')
                 and not any(k in f['src'] for k in ('google', 'doubleclick', 'carbon', 'youtube'))]
        STATE['shadcn_src'] = cands[0] if cands else None
        pg.close()
        tall.close()
    src = STATE.get('shadcn_src')
    if src:
        pg, st = open_page(ctx, src, max_h=5200, wait=3500)
        path = P('shadcn-orders-preview-%s.jpg' % suffix)
        C.shot(pg, path, 5200 if suffix == 'pc' else 4500)
        out['preview'] = [os.path.basename(path), size_of(path, suffix), st, src]
        pg.close()
    return out


def crop_top(path, px):
    im = Image.open(path)
    if im.size[1] > px:
        im.crop((0, 0, im.size[0], px)).convert('RGB').save(path, 'JPEG', quality=78)
    return Image.open(path).size


def dialog_shot(fl, el, path):
    """열린 모달 상자만 찍는다. 못 찾으면 미리보기 전체를 찍는다."""
    for sel in ('[aria-modal="true"]', 'div.fixed.z-50:not(.hidden)'):
        try:
            dlg = fl.locator(sel).first
            if dlg.count():
                box = dlg.locator(':scope > div').first
                box.screenshot(path=path, type='jpeg', quality=78, timeout=15000)
                return 'dialog ' + sel
        except Exception as e:
            last = str(e)[:100]
    el.screenshot(path=path, type='jpeg', quality=72, timeout=20000)
    return 'whole iframe'


def flowbite(b, ctx, suffix):
    out = {}
    k = 1 if suffix == 'pc' else 2
    # 1) 주문 목록(옆 메뉴형): 기간 드롭다운을 연 모습, 주문 취소 확인 모달
    pg, st = open_page(ctx, 'https://flowbite.com/blocks/e-commerce/orders-overview/', max_h=9000)
    out['orders_status'] = st
    unstick(pg, hide=True)
    el = pg.locator('iframe[srcdoc]').nth(2)
    fl = pg.frame_locator('iframe[srcdoc]').nth(2)
    try:
        el.scroll_into_view_if_needed(timeout=5000)
        pg.wait_for_timeout(900)
        btn = fl.locator('button:has-text("Last 7 days")').first
        btn.click(timeout=5000)
        pg.wait_for_timeout(800)
        path = P('flowbite-orders-period-%s.jpg' % suffix)
        el.screenshot(path=path, type='jpeg', quality=78, timeout=20000)
        out['period'] = [os.path.basename(path), crop_top(path, 760 * k if suffix == 'pc' else 1500)]
        btn.click(timeout=3000)
        pg.wait_for_timeout(400)
    except Exception as e:
        out['period'] = 'ERR ' + str(e)[:160]
    try:
        fl.locator('button:has-text("Cancel order")').first.click(timeout=5000)
        pg.wait_for_timeout(1000)
        path = P('flowbite-orders-cancel-confirm-%s.jpg' % suffix)
        how = dialog_shot(fl, el, path)
        out['cancel'] = [os.path.basename(path), size_of(path, suffix), how]
    except Exception as e:
        out['cancel'] = 'ERR ' + str(e)[:160]
    pg.close()
    # 2) 계정 개요: '내 정보 수정' 모달 양식
    pg, st = open_page(ctx, 'https://flowbite.com/blocks/e-commerce/account-overview/', max_h=11000)
    out['account_status'] = st
    unstick(pg, hide=True)
    el = pg.locator('iframe[srcdoc]').nth(1)
    fl = pg.frame_locator('iframe[srcdoc]').nth(1)
    try:
        el.scroll_into_view_if_needed(timeout=5000)
        pg.wait_for_timeout(900)
        fl.locator('button:has-text("Edit your data")').first.click(timeout=5000)
        pg.wait_for_timeout(1000)
        path = P('flowbite-account-edit-modal-%s.jpg' % suffix)
        how = dialog_shot(fl, el, path)
        out['edit'] = [os.path.basename(path), size_of(path, suffix), how]
    except Exception as e:
        out['edit'] = 'ERR ' + str(e)[:160]
    pg.close()
    return out


def krds(b, ctx, suffix):
    """KRDS 기본 패턴 가운데 필터링·정렬, 입력폼 안내 화면. 주소는 구조화 목록 화면의 메뉴에서 찾는다."""
    out = {}
    if suffix == 'pc':
        pg = ctx.new_page()
        pg.goto('https://www.krds.go.kr/html/site/component/component_04_01.html', wait_until='domcontentloaded', timeout=45000)
        pg.wait_for_timeout(2500)
        links = pg.evaluate('''() => [...document.querySelectorAll('a')].map(a => ({
            t: (a.textContent || '').replace(/\\s+/g, ' ').trim(), h: a.href}))
            .filter(o => /필터링|입력폼|날짜 입력|목록 탐색|상세 정보 확인|단계 표시/.test(o.t) && o.h.startsWith('http'))''')
        seen = {}
        for o in links:
            seen.setdefault(o['t'][:30], o['h'])
        out['links'] = seen
        STATE['krds'] = seen
        pg.close()
    seen = STATE.get('krds', {})
    for key, screen in (('필터링', 'filter-sort'), ('입력폼', 'input-form')):
        url = next((h for t, h in seen.items() if key in t), None)
        if not url:
            out[screen] = 'link not found'
            continue
        try:
            pg, st = open_page(ctx, url, max_h=5200 if suffix == 'pc' else 4500)
            unstick(pg)
            path = P('krds-%s-%s.jpg' % (screen, suffix))
            C.shot(pg, path, 5200 if suffix == 'pc' else 4500)
            out[screen] = [os.path.basename(path), size_of(path, suffix), st, url]
            pg.close()
        except Exception as e:
            out[screen] = 'ERR ' + str(e)[:160]
    return out


FUNCS = {'yoprint': yoprint, 'shadcn': shadcn, 'flowbite': flowbite, 'krds': krds}


def main():
    which = sys.argv[1:] or list(FUNCS)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=C.MOBILE_UA)
        for name in which:
            for suffix, ctx in (('pc', pc), ('m', mo)):
                try:
                    info = FUNCS[name](b, ctx, suffix)
                except Exception as e:
                    info = {'error': str(e)[:300]}
                print(name, suffix, json.dumps(info, ensure_ascii=False), flush=True)
        b.close()


if __name__ == '__main__':
    main()
