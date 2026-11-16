# -*- coding: utf-8 -*-
"""상품 목록형(list) 레퍼런스 캡처 도구.

실행: /usr/bin/python3 _capture.py [사이트키 ...]   (키를 안 주면 FLOWS 전체)
저장: 이 파일과 같은 폴더에 <사이트>-<화면>-pc.jpg / -m.jpg

- PC 1440x900, 모바일 390x844(배율 2, 저장 폭 780px).
- 목록 화면은 끝까지 천천히 스크롤해 지연 로딩을 깨운 뒤 맨 위로 돌아와 위에서부터 잘라 찍는다(shot).
- 필터 패널처럼 화면에 고정되는 층은 보이는 화면만 찍는다(view).
- 로그인·제출은 하지 않는다. 검색어에는 뜻 없는 영문 문자열만 쓴다.

2026-11-17 기록
- 아래 FLOWS 의 순서는 이 파일의 함수(open_page·slow_scroll·shot·view·tap)를 한 단계씩 불러
  실제로 실행한 순서를 그대로 옮겨 적은 것이다(같은 페이지를 다시 열지 않으려고 한 번 연 화면에서
  이어서 눌렀다). 이 파일을 통째로 다시 돌린 적은 없다.
- 좌표로 누른 곳(mouse.click / touchscreen.tap)은 그날 화면 배치 기준이다. 사이트가 바뀌면 다시 찾아야 한다.
- 전체 화면 캡처에서는 화면 아래에 고정된 띠(모바일 하단 메뉴 등)가 첫 화면 높이 자리에 한 번 찍힌다.
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


def trim_tail(name, margin=80):
    """목록을 가상 스크롤로 그리는 곳은 아래쪽이 빈 흰 화면으로 찍힌다. 그 꼬리를 잘라 낸다."""
    path = os.path.join(OUT, name)
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.convert('L').load()
    y = h - 1
    while y > 0 and min(px[x, y] for x in range(0, w, 6)) >= 235:
        y -= 4
    if y < h - 400:
        im.crop((0, 0, w, min(h, y + margin))).save(path, quality=72)
    return Image.open(path).size


def shot(pg, name, max_h=5200):
    """문서 맨 위부터 max_h(CSS px)까지 잘라 찍는다."""
    path = os.path.join(OUT, name)
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)
    return name, _fix(path)


def view(pg, name):
    """지금 보이는 화면만 찍는다(화면에 고정된 필터 패널·시트용)."""
    path = os.path.join(OUT, name)
    pg.screenshot(path=path, type='jpeg', quality=72)
    return name, _fix(path)


def tap(pg, text, exact=True, nth=0, timeout=4000):
    """보이는 글자로 눌러 본다. 성공하면 True."""
    try:
        loc = pg.get_by_text(text, exact=exact)
        vis = [i for i in range(loc.count()) if loc.nth(i).is_visible()]
        if not vis:
            return False
        loc.nth(vis[min(nth, len(vis) - 1)]).click(timeout=timeout)
        return True
    except Exception as e:  # 눌리지 않으면 그대로 두고 기록에 적는다
        print('tap 실패:', text, str(e)[:120])
        return False


def tap_label(pg, label, timeout=3000):
    """aria-label 로 눌러 본다(아이콘만 있는 버튼, 앱 설치 띠 닫기)."""
    try:
        pg.get_by_label(label).first.click(timeout=timeout)
        return True
    except Exception:
        return False


def texts(pg, y0=0, y1=900, maxlen=18, limit=140):
    """지금 화면(y0~y1, 뷰포트 기준)에 보이는 짧은 글자와 위치를 모아 준다(누를 곳 찾기용)."""
    js = '''([y0,y1,maxlen,limit])=>{const out=[];const seen=new Set();
    for(const e of document.querySelectorAll('button,a,[role=button],label,summary,select,[role=tab],li,span,strong,h1,h2,h3,dt,p,div')){
      if(e.children.length>2)continue;const r=e.getBoundingClientRect();if(r.width<6||r.height<6)continue;
      if(r.top<y0||r.top>y1)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)continue;
      let t=(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim().replace(/\\s+/g,' ');
      if(!t||t.length>maxlen)continue;if(seen.has(t))continue;seen.add(t);out.push(t+'@'+Math.round(r.left)+','+Math.round(r.top));}
    return out.slice(0,limit).join(' ; ');}'''
    return pg.evaluate(js, [y0, y1, maxlen, limit])


# ---------------------------------------------------------------------------
# 사이트별 순서. 각 함수는 (pg, tag) 를 받고 tag 는 'pc' 또는 'm' 이다.
# ---------------------------------------------------------------------------

def kolon_category(pg, tag):
    """코오롱몰 워크웨어 분류: 목록 → 컬러 필터에서 두 값 고름 → 적용 → (PC) 모든필터 서랍."""
    slow_scroll(pg, limit=9000 if tag == 'pc' else 6000)
    shot(pg, f'kolonmall-list-{tag}.jpg', max_h=7600 if tag == 'pc' else 4500)
    if tag == 'm':
        trim_tail('kolonmall-list-m.jpg')
    tap(pg, '컬러')
    pg.wait_for_timeout(1500)
    tap(pg, 'BLACK')
    pg.wait_for_timeout(900)
    tap(pg, 'NAVY')
    pg.wait_for_timeout(1200)
    view(pg, f'kolonmall-filter-{tag}.jpg')          # 값 2개 고른 상태 + "163개 상품보기"
    tap(pg, '상품보기', exact=False)
    pg.wait_for_timeout(2500)
    pg.evaluate('window.scrollTo(0,0)')
    pg.wait_for_timeout(600)
    view(pg, f'kolonmall-applied-{tag}.jpg')         # 적용한 값 표시
    if tag == 'pc':
        tap(pg, '모든필터')
        pg.wait_for_timeout(1500)
        view(pg, 'kolonmall-filter-all-pc.jpg')      # 왼쪽 서랍


def kolon_brand(pg, tag):
    """코오롱몰 볼디스트 브랜드관 첫 화면(대표 사진 넘겨 보기, 형태 줄, NEW·BEST 줄)."""
    slow_scroll(pg, limit=5000)
    shot(pg, f'kolonmall-brand-{tag}.jpg', max_h=4200 if tag == 'pc' else 4500)


def kolon_brandlist(pg, tag):
    """코오롱몰 볼디스트 브랜드관 '전체' 목록 윗부분."""
    slow_scroll(pg, limit=3000)
    shot(pg, 'kolonmall-brandlist-pc.jpg', max_h=1500)


def ssf(pg, tag):
    """SSF샵 남성 아우터: 목록 → 색상 패널에서 검정 → (PC) 사이즈 패널에서 L."""
    if tag == 'pc':
        slow_scroll(pg, limit=8000)
        shot(pg, 'ssfshop-list-pc.jpg', max_h=6400)  # 맨 아래 쪽 번호까지
        tap(pg, '색상')
        pg.wait_for_timeout(1500)
        pg.mouse.click(65, 475)                      # 첫 색 견본(검정색). 누르면 바로 적용된다
        pg.wait_for_timeout(2500)
        tap(pg, '사이즈')
        pg.wait_for_timeout(1500)
        pg.mouse.click(1079, 527)                    # L 체크
        pg.wait_for_timeout(2800)
        view(pg, 'ssfshop-filter-pc.jpg')
    else:
        tap_label(pg, 'Close banner')                # 앱 설치 띠 닫기
        slow_scroll(pg, limit=6000)
        shot(pg, 'ssfshop-list-m.jpg', max_h=4500)
        tap(pg, '색상')
        pg.wait_for_timeout(1500)
        pg.touchscreen.tap(31, 420)                  # 첫 색 견본(검정색)
        pg.wait_for_timeout(3000)
        view(pg, 'ssfshop-filter-m.jpg')


def musinsa(pg, tag):
    """무신사 아우터: 목록 → 줄에 나와 있는 값 누름 → 적용 표시 → 상세 필터(컬러 탭)."""
    if tag == 'm':
        tap_label(pg, '앱 열기 배너 닫기')
    slow_scroll(pg, limit=5600 if tag == 'pc' else 5000)
    shot(pg, f'musinsa-list-{tag}.jpg', max_h=5200 if tag == 'pc' else 4500)
    trim_tail(f'musinsa-list-{tag}.jpg')             # 가상 스크롤이라 아래쪽은 빈 화면으로 찍힌다
    tap(pg, '블랙')
    pg.wait_for_timeout(2500)
    if tag == 'pc':
        tap(pg, '폴리에스테르')
        pg.wait_for_timeout(2500)
        view(pg, 'musinsa-applied-pc.jpg')
    tap_label(pg, '상세필터열기', timeout=4000)
    pg.wait_for_timeout(1800)
    if tag == 'pc':
        pg.mouse.click(588, 238)                     # 필터 창의 '컬러 1' 탭
    else:
        pg.touchscreen.tap(113, 164)                 # 필터 시트의 '컬러 1' 탭
    pg.wait_for_timeout(1500)
    view(pg, f'musinsa-filter-{tag}.jpg')


def musinsa_empty(pg, tag):
    """무신사 검색 결과 없음(뜻 없는 검색어)."""
    if tag == 'm':
        tap_label(pg, '앱 열기 배너 닫기')
    slow_scroll(pg, limit=2500)
    shot(pg, f'musinsa-empty-{tag}.jpg', max_h=2400)


def nplus(pg, tag):
    """네파 공식몰 남성 아우터: 목록 → 필터 서랍(색상·시즌 고름) → 적용 뒤 목록."""
    if tag == 'pc':
        slow_scroll(pg, limit=10500)
        shot(pg, 'nplus-list-pc.jpg', max_h=5200)
        tap(pg, '필터')
        pg.wait_for_timeout(1500)
        pg.mouse.click(1404, 111)                    # 카테고리 접기(−)
        pg.wait_for_timeout(700)
        pg.mouse.click(1404, 259)                    # 색상 펼치기(+)
        pg.wait_for_timeout(800)
        pg.mouse.click(1137, 316)                    # 검정 견본
        pg.wait_for_timeout(600)
        pg.mouse.click(1404, 461)                    # 시즌 펼치기(+)
        pg.wait_for_timeout(800)
        tap(pg, '겨울')
        pg.wait_for_timeout(600)
        view(pg, 'nplus-filter-pc.jpg')
        tap(pg, '적용', exact=False)
        pg.wait_for_timeout(3000)
        pg.evaluate('window.scrollTo(0,0)')
        pg.wait_for_timeout(500)
        view(pg, 'nplus-applied-pc.jpg')
    else:
        slow_scroll(pg, limit=5000)
        shot(pg, 'nplus-list-m.jpg', max_h=4500)
        tap(pg, '필터')
        pg.wait_for_timeout(1500)
        view(pg, 'nplus-filter-m.jpg')


def strauss(pg, tag):
    """Strauss 작업 재킷: 쿠키 거절 → 목록 → (PC) 분류 소개 글 → 색상 필터 → (모바일) 정렬."""
    tap(pg, 'Reject all')
    pg.wait_for_timeout(1500)
    if tag == 'm':                                   # 거절하면 화면을 다시 읽는다
        pg.wait_for_load_state('domcontentloaded')
        pg.wait_for_timeout(3000)
    slow_scroll(pg, limit=6000 if tag == 'pc' else 5000)
    shot(pg, f'strauss-list-{tag}.jpg', max_h=5200 if tag == 'pc' else 4500)
    if tag == 'pc':
        tap(pg, 'more information')                  # 목록 아래 소개 글로 내려간다
        pg.wait_for_timeout(1500)
        view(pg, 'strauss-intro-pc.jpg')
        pg.evaluate('window.scrollTo(0,0)')
        pg.wait_for_timeout(1200)
        tap(pg, 'Colour')
        pg.wait_for_timeout(1500)
        pg.mouse.click(206, 593)                     # Shades of blue
        pg.wait_for_timeout(3000)
        view(pg, 'strauss-filter-pc.jpg')
    else:
        pg.touchscreen.tap(245, 457)                 # 필터 알약(숫자 135)
        pg.wait_for_timeout(1800)
        pg.touchscreen.tap(120, 138)                 # COLOUR 줄 펼치기
        pg.wait_for_timeout(1500)
        view(pg, 'strauss-filter-m.jpg')
        pg.touchscreen.tap(348, 37)                  # 닫기
        pg.wait_for_timeout(1200)
        pg.touchscreen.tap(338, 457)                 # 정렬 알약
        pg.wait_for_timeout(1500)
        view(pg, 'strauss-sort-m.jpg')


# 키: (주소, 순서 함수, 찍는 화면 폭)
FLOWS = {
    'kolonmall': ('https://www.kolonmall.com/Category/List/133010210000', kolon_category, ('pc', 'm')),
    'kolonmall-brand': ('https://www.kolonmall.com/Brands/boldest', kolon_brand, ('pc', 'm')),
    'kolonmall-brandlist': ('https://www.kolonmall.com/Brands/boldest/List/133020161372', kolon_brandlist, ('pc',)),
    'ssfshop': ('https://www.ssfshop.com/Outerwear/list?dspCtgryNo=SFMA42A05', ssf, ('pc', 'm')),
    'musinsa': ('https://www.musinsa.com/category/002', musinsa, ('pc', 'm')),
    'musinsa-empty': ('https://www.musinsa.com/search/goods?keyword=qzxvkwjp', musinsa_empty, ('pc', 'm')),
    'nplus': ('https://www.nplus.co.kr/product/list.asp?cno=101', nplus, ('pc', 'm')),
    'strauss': ('https://www.strauss.com/de/en/work-jackets/', strauss, ('pc', 'm')),
}


def run(keys=None):
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc, mo = contexts(b)
        for key, (url, flow, tags) in FLOWS.items():
            if keys and key not in keys:
                continue
            for tag, ctx in (('pc', pc), ('m', mo)):
                if tag not in tags:
                    continue
                pg = None
                try:
                    pg = open_page(ctx, url, wait=3500)
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
