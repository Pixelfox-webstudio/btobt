# -*- coding: utf-8 -*-
"""상품 목록형(list) 레퍼런스 캡처 도구.

실행: /usr/bin/python3 _capture.py [사이트키 ...]   (키를 안 주면 FLOWS 전체)
저장: 이 파일과 같은 폴더에 <사이트>-<화면>-pc.jpg / -m.jpg

- PC 1440x900, 모바일 390x844(배율 2, 저장 폭 780px).
- 목록 화면은 끝까지 천천히 스크롤해 지연 로딩을 깨운 뒤 맨 위로 돌아와 위에서부터 잘라 찍는다(shot).
- 필터 패널처럼 화면에 고정되는 층은 보이는 화면만 찍는다(view).
- 로그인·제출은 하지 않는다. 검색어에는 뜻 없는 영문 문자열만 쓴다.
"""
import os
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

OUT = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')


def contexts(browser):
    pc = browser.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
    mo = browser.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                             has_touch=True, device_scale_factor=2, user_agent=UA_M)
    return pc, mo


def open_page(ctx, url, wait=3000):
    pg = ctx.new_page()
    pg.goto(url, wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(wait)
    return pg


def slow_scroll(pg, limit=7000, step=700, pause=280):
    """지연 로딩 그림을 깨우려고 천천히 내려갔다가 맨 위로 돌아온다."""
    y = 0
    while y < limit:
        y += step
        pg.evaluate('y=>window.scrollTo(0,y)', y)
        pg.wait_for_timeout(pause)
        if y > pg.evaluate('document.documentElement.scrollHeight'):
            break
    pg.evaluate('window.scrollTo(0,0)')
    pg.wait_for_timeout(900)


def _fix(path):
    """모바일 그림은 폭 780px 이하, 모든 그림은 세로 9000px 이하로 맞춘다."""
    im = Image.open(path)
    w, h = im.size
    changed = False
    if path.endswith('-m.jpg') and w > 780:
        im = im.resize((780, round(h * 780 / w)))
        w, h = im.size
        changed = True
    if h > 9000:
        im = im.crop((0, 0, w, 9000))
        changed = True
    if changed:
        im.convert('RGB').save(path, quality=72)
    return Image.open(path).size


def shot(pg, name, max_h=5200):
    """문서 맨 위부터 max_h(CSS px)까지 잘라 찍는다."""
    path = os.path.join(OUT, name)
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)
    return name, _fix(path)


def band(pg, name, y, h):
    """문서의 y 위치부터 h 만큼만 찍는다(쪽 번호처럼 아래쪽 한 구간)."""
    path = os.path.join(OUT, name)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': y, 'width': w, 'height': h}, full_page=True)
    return name, _fix(path)


def view(pg, name):
    """지금 보이는 화면만 찍는다(화면에 고정된 필터 패널·시트용)."""
    path = os.path.join(OUT, name)
    pg.screenshot(path=path, type='jpeg', quality=72)
    return name, _fix(path)


def tap(pg, text, exact=True, nth=0, timeout=4000, force=False):
    """보이는 글자로 눌러 본다. 성공하면 True."""
    try:
        loc = pg.get_by_text(text, exact=exact)
        n = loc.count()
        vis = [i for i in range(n) if loc.nth(i).is_visible()]
        if not vis:
            return False
        loc.nth(vis[min(nth, len(vis) - 1)]).click(timeout=timeout, force=force)
        return True
    except Exception as e:  # 눌리지 않으면 그대로 두고 기록에 적는다
        print('tap 실패:', text, str(e)[:120])
        return False


def texts(pg, y0=0, y1=900, maxlen=18, limit=140):
    """지금 화면(y0~y1, 뷰포트 기준)에 보이는 짧은 글자를 모아 준다(선택자 찾기용)."""
    js = '''([y0,y1,maxlen,limit])=>{const out=[];const seen=new Set();
    for(const e of document.querySelectorAll('button,a,[role=button],label,summary,select,[role=tab],li,span,strong,h1,h2,h3,dt,p,div')){
      if(e.children.length>2)continue;const r=e.getBoundingClientRect();if(r.width<6||r.height<6)continue;
      if(r.top<y0||r.top>y1)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)continue;
      let t=(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim().replace(/\\s+/g,' ');
      if(!t||t.length>maxlen)continue;if(seen.has(t))continue;seen.add(t);out.push(t+'@'+Math.round(r.left)+','+Math.round(r.top));}
    return out.slice(0,limit).join(' ; ');}'''
    return pg.evaluate(js, [y0, y1, maxlen, limit])


# ---------------------------------------------------------------------------
# 사이트별 순서. 2026-11-17에 아래 순서를 한 단계씩 실행해 캡처를 남겼다.
# 각 함수는 (pg, tag) 를 받고 tag 는 'pc' 또는 'm' 이다.
# ---------------------------------------------------------------------------
FLOWS = {}


def run(keys=None):
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc, mo = contexts(b)
        for key, (url, flow) in FLOWS.items():
            if keys and key not in keys:
                continue
            for tag, ctx in (('pc', pc), ('m', mo)):
                pg = None
                try:
                    pg = open_page(ctx, url)
                    flow(pg, tag)
                    print('완료', key, tag)
                except Exception as e:
                    print('실패', key, tag, str(e)[:200])
                finally:
                    if pg:
                        pg.close()
        b.close()


if __name__ == '__main__':
    run(sys.argv[1:] or None)
