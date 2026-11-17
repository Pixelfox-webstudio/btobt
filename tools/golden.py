#!/usr/bin/env python3
"""대표 페이지 캡처 모음(review/golden.html)을 만든다.

유형마다 대표 페이지 하나의 기본 화면을 네 폭(1440·1024·768·390)으로 찍어 review/golden/ 에 줄여 저장하고, 홈 캡처와 나란히 보는 페이지를 만든다.
(review/shots/ 는 점검용이라 저장소에 넣지 않는다. 이 모음은 사장님이 중간에 방향을 보는 용도라 넣는다.)
사용: python3 tools/golden.py          → 있는 대표 페이지만 찍고 review/golden.html 을 다시 만든다
"""
import json, pathlib, html, io
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / 'review' / 'golden'
TYPES = [
    ('home', '홈(기준)', 'index.html', None),
    ('list', 'A. 상품 목록형', 'category.html', 'research/decisions/list.md'),
    ('product', 'B. 상품 상세·구매형', 'product.html?id=463', 'research/decisions/product.md'),
    ('cart', 'C. 장바구니·결제형', 'cart.html', 'research/decisions/cart-checkout.md'),
    ('result', 'D. 결과·안내형', 'order-complete.html', 'research/decisions/result.md'),
    ('form', 'E. 견적·입력 양식형', 'quote.html', 'research/decisions/quote-form.md'),
    ('auth', 'F. 로그인·가입형', 'signup-business-info.html', 'research/decisions/auth.md'),
    ('account', 'G. 계정형', 'mypage.html', 'research/decisions/account.md'),
    ('board', 'H. 게시판·콘텐츠형', 'customer-center.html', 'research/decisions/support-board.md'),
    ('doc', 'I. 문서형', 'quote-document.html', 'research/decisions/document.md'),
]
VIEWS = [(1440, 900), (1024, 768), (768, 1024), (390, 844)]
MAX_H = 3600


def shoot():
    from playwright.sync_api import sync_playwright
    DIR.mkdir(parents=True, exist_ok=True)
    got = {}
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for w, h in VIEWS:
            ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, reduced_motion='reduce', locale='ko-KR')
            ctx.add_init_script("try{localStorage.setItem('b2bt-consent','{\"t\":1}')}catch(e){}")
            pg = ctx.new_page()
            for key, _, url, _ in TYPES:
                if not (ROOT / url.split('?')[0]).exists():
                    continue
                pg.goto('file://' + str(ROOT / url), wait_until='load', timeout=30000)
                pg.evaluate('''async () => { document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
                  const imgs = [...document.images]; await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))); }''')
                pg.wait_for_timeout(600)
                full = pg.evaluate('document.documentElement.scrollHeight')
                png = pg.screenshot(full_page=True, clip={'x': 0, 'y': 0, 'width': w, 'height': min(full, MAX_H)})
                im = Image.open(io.BytesIO(png)).convert('RGB')
                s = 720 / w if w > 720 else 1
                if s != 1:
                    im = im.resize((int(im.size[0] * s), int(im.size[1] * s)))
                name = '%s-%d.jpg' % (key, w)
                im.save(DIR / name, quality=70)
                got.setdefault(key, []).append((w, name, full))
            ctx.close()
        br.close()
    return got


def page(got):
    e = html.escape
    rows = []
    for key, label, url, dec in TYPES:
        if key not in got:
            rows.append('<section class="g"><h2>%s <small>아직 만들지 않음</small></h2></section>' % e(label))
            continue
        cells = ''.join('<figure><a href="golden/%s" target="_blank"><img src="golden/%s" alt="%s %dpx" loading="lazy"></a><figcaption>%dpx%s</figcaption></figure>'
                        % (n, n, e(label), w, w, ' · 전체 %dpx 중 위쪽' % full if full > MAX_H else '') for w, n, full in got[key])
        links = '<a href="../%s">페이지 열기</a>' % e(url) + (' · <a href="../%s">구조 결정 문서</a>' % e(dec) if dec and (ROOT / dec).exists() else '')
        rows.append('<section class="g"><h2>%s <small>%s</small></h2><p class="l">%s</p><div class="row">%s</div></section>' % (e(label), e(url), links, cells))
    return '''<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>대표 페이지 캡처 모음 | 비투비티</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
:root{--ink:#0E0E10;--ln:#DEDEE2;--tint:#F5F5F6;--fg3:#6B6B70}
*{box-sizing:border-box;margin:0}
body{font-family:Pretendard,"Pretendard Variable",-apple-system,sans-serif;background:#fff;color:var(--ink);word-break:keep-all;-webkit-font-smoothing:antialiased}
header{padding:48px max(20px,calc((100vw - 1400px)/2)) 24px;border-bottom:1px solid #000}
h1{font-size:32px;font-weight:700;letter-spacing:-.025em;line-height:1.3}
header p{margin-top:8px;font-size:15px;line-height:1.75;color:#474747}
header a,.l a{color:#000;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.g{padding:40px max(20px,calc((100vw - 1400px)/2));border-bottom:1px solid var(--ln)}
.g:nth-child(even){background:var(--tint)}
h2{font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:28px}
h2 small{margin-left:8px;font-size:14px;font-weight:400;color:var(--fg3)}
.l{margin-top:4px;font-size:14px;color:var(--fg3)}
.row{display:flex;align-items:flex-start;gap:16px;margin-top:20px;overflow-x:auto;padding-bottom:8px}
figure{flex:none}
figure img{display:block;width:auto;max-height:900px;border-radius:12px;box-shadow:0 0 0 1px var(--ln)}
figcaption{margin-top:6px;font-size:12.5px;color:var(--fg3)}
</style></head><body>
<header><h1>대표 페이지 캡처 모음</h1>
<p>유형마다 대표 페이지 하나의 기본 화면을 네 폭으로 찍었습니다(위에서부터 최대 %dpx). 그림을 누르면 크게 열립니다. 화면 아래에 붙는 띠(폰 상담 바, 상품의 따라오는 바, 주문 요약 띠)는 전체 길이로 찍은 그림이라 첫 화면 아래쪽 자리에 찍혀 있습니다. 상태별 화면은 <a href="../pages.html">검수 목록</a>에서 하나씩 볼 수 있습니다.</p></header>
%s
</body></html>
''' % (MAX_H, '\n'.join(rows))


if __name__ == '__main__':
    got = shoot()
    (ROOT / 'review' / 'golden.html').write_text(page(got), encoding='utf-8')
    print('대표 페이지 %d개(홈 포함) → review/golden.html' % len(got))
