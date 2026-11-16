# -*- coding: utf-8 -*-
"""support-board 레퍼런스 캡처 스크립트 (2026-11-17).

사용:
  /usr/bin/python3 _capture.py --out <폴더> --set keep            # 남긴 곳: PC(1440) + 모바일(390)
  /usr/bin/python3 _capture.py --out <폴더> --set keep --m-only   # 모바일만
  /usr/bin/python3 _capture.py --out <임시 폴더> --set probe --pc-only   # 후보 훑기(probe, probe2 … probe5)
  /usr/bin/python3 _capture.py --links 이름=주소 … --kw 낱말,낱말   # 첫 화면 링크에서 주소 찾기(캡처 없음)

규칙:
- 로그인·제출은 하지 않는다. 누르는 것은 목록 행 펼치기, 필터 열기, 카드 한 장 열기뿐이다.
- PC 는 문서 전체를 clip 으로 찍는다(shot). 모바일은 뷰포트 높이를 문서 높이만큼 늘려 찍는다(shot_tall).
  이렇게 하면 고정된 하단 탭·떠 있는 버튼이 본문 중간을 가리지 않고 그림 맨 아래에 놓인다.
- 모바일 그림은 device_scale_factor 2 라서 폭 780px 이다. fix_mobile 이 폭 780 이하·세로 9000 이하로 맞춘다.
- 캡처와 함께 _tmp-<이름>.txt(본문 글자), _tmp-<이름>-links.txt(링크)를 같은 폴더에 남긴다. 확인 뒤 지운다.

이 폴더에 남긴 그림과의 관계:
- 캡처는 임시 폴더로 찍어 눈으로 확인한 뒤 이 폴더로 옮겼다.
- socar-guide-pc.jpg 는 probe4 실행(질문을 펼치지 않은 상태)에서 찍은 것이다. 같은 주소를 세 번 열지 않으려고 다시 찍지 않았다.
- 오프린트미 모바일은 앱 설치 띠의 X 를 눌러 닫고 찍었다. 채널톡 모바일은 상담 말풍선(#ch-plugin)을 캡처 동안만 숨겼다.
- 컬리·오프린트미·채널톡 PC 맨 위 홍보 띠는 닫지 않고 그대로 찍었다.
"""
import argparse, json, os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image

MOBILE_UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
             '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')


def shot(pg, path, max_h=5200):
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)


def shot_tall(pg, path, max_h=4500):
    """모바일용. 뷰포트 높이를 문서 높이(최대 max_h)로 늘린 뒤 보이는 화면을 찍는다.
    고정된 하단 탭·떠 있는 버튼이 그림 맨 아래에 놓이고 본문을 가리지 않는다."""
    vs = dict(pg.viewport_size)
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    pg.set_viewport_size({'width': vs['width'], 'height': h})
    pg.wait_for_timeout(900)
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(300)
    pg.screenshot(path=path, type='jpeg', quality=72)
    pg.set_viewport_size(vs)
    pg.wait_for_timeout(500)


def view_shot(pg, path):
    """지금 보이는 화면만(고정 패널·모달 상태용)."""
    pg.screenshot(path=path, type='jpeg', quality=72)


def slow_scroll(pg, max_h=12000):
    total = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    y = 0
    while y < total:
        pg.evaluate('y => window.scrollTo(0, y)', y)
        pg.wait_for_timeout(220)
        y += 700
        total = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(600)


CLOSE_TEXTS = ['오늘 하루 보지 않기', '오늘 하루 안 보기', '오늘은 그만 보기', '닫기', '모바일 웹으로 볼게요',
               '모바일웹으로 보기', '괜찮아요', '다음에 할게요']


def close_popups(pg, texts=None):
    """쿠키·앱 설치 띠·팝업을 닫는다(보이는 것만, 한 번씩)."""
    for t in (texts or CLOSE_TEXTS):
        try:
            loc = pg.get_by_text(t, exact=True)
            n = loc.count()
            for i in range(min(n, 3)):
                el = loc.nth(i)
                if el.is_visible():
                    el.click(timeout=1500)
                    pg.wait_for_timeout(400)
                    break
        except Exception:
            pass


def fix_mobile(path, max_h=9000):
    im = Image.open(path)
    w, h = im.size
    changed = False
    if w > 780:
        nh = int(h * 780 / w)
        im = im.resize((780, nh), Image.LANCZOS)
        w, h = im.size
        changed = True
    if h > max_h:
        im = im.crop((0, 0, w, max_h))
        changed = True
    if changed:
        im.convert('RGB').save(path, 'JPEG', quality=72)
    return Image.open(path).size


# ---- 눌러서 보는 상태(같은 방문 안에서) -------------------------------------------------

def act_click_text(text, nth=0, wait=900, exact=False):
    def f(pg):
        loc = pg.get_by_text(text, exact=exact)
        loc.nth(nth).scroll_into_view_if_needed(timeout=4000)
        loc.nth(nth).click(timeout=4000)
        pg.wait_for_timeout(wait)
    return f


def act_click_sel(sel, nth=0, wait=900):
    def f(pg):
        loc = pg.locator(sel)
        loc.nth(nth).scroll_into_view_if_needed(timeout=4000)
        loc.nth(nth).click(timeout=4000)
        pg.wait_for_timeout(wait)
    return f


def act_tap_right_of(text, dx=22):
    """'앱 열기' 같은 글자 오른쪽에 붙은 닫기(X)를 누른다(앱 설치 띠 닫기)."""
    def f(pg):
        el = pg.get_by_text(text, exact=True).first
        if el.count() and el.is_visible():
            b = el.bounding_box()
            pg.touchscreen.tap(b['x'] + b['width'] + dx, b['y'] + b['height'] / 2)
            pg.wait_for_timeout(600)
    return f


def act_hide(sel):
    """닫기 버튼이 다른 프레임 안에 있어 누를 수 없는 떠 있는 상담 말풍선을 캡처 동안만 숨긴다(기록에 적는다)."""
    def f(pg):
        pg.add_style_tag(content=sel + '{display:none !important}')
        pg.wait_for_timeout(200)
    return f


def act_fill(sel, value, wait=1500, press_enter=True):
    """검색창에 일반 낱말만 넣는다(개인 정보 없음, 제출 양식 아님)."""
    def f(pg):
        loc = pg.locator(sel).first
        loc.click(timeout=4000)
        loc.fill(value)
        if press_enter:
            loc.press('Enter')
        pg.wait_for_timeout(wait)
    return f


# 대상: name -> dict(url, states=[(suffix, [actions], 'full'|'view')], pc=True, m=True, popups=[...])
TARGETS = {}


def T(name, url, states=None, **kw):
    TARGETS[name] = dict(url=url, states=states or [], **kw)


# ---- 후보 훑기(probe) ------------------------------------------------------------------
PROBE = [
    ('kurly-faq', 'https://www.kurly.com/board/faq'),
    ('kurly-notice', 'https://www.kurly.com/board/notice'),
    ('toss-faq', 'https://support.toss.im/faq'),
    ('ohou-cs', 'https://ohou.se/customer_center'),
    ('musinsa-faq', 'https://www.musinsa.com/cs/faq'),
    ('oliveyoung-faq', 'https://www.oliveyoung.co.kr/store/counsel/getFaqList.do'),
    ('tosspayments-notice', 'https://www.tosspayments.com/notice'),
    ('marpple-review', 'https://www.marpple.com/kr/review'),
    ('flex-customers', 'https://flex.team/customers'),
    ('notion-customers', 'https://www.notion.com/ko/customers'),
    ('channel-customers', 'https://channel.io/ko/customers'),
    ('oliveyoung-event', 'https://www.oliveyoung.co.kr/store/main/getEventList.do'),
    ('starbucks-event', 'https://www.starbucks.co.kr/whats_new/campaign_list.do'),
    ('29cm-cs', 'https://www.29cm.co.kr/cs'),
]
for n, u in PROBE:
    T(n, u, set='probe')

PROBE2 = [
    ('marpple-review', 'https://www.marpple.com/kr/review/list?is_all=false'),
    ('marpple-review-detail', 'https://www.marpple.com/kr/review/detail?r_id=226272'),
    ('marpple-event', 'https://www.marpple.com/kr/event/list'),
    ('marpple-faq', 'https://www.marpple.com/kr/faq'),
    ('marpple-biz', 'https://www.marpple.com/kr/biz'),
    ('ohprint-faq', 'https://www.ohprint.me/cs/faq'),
    ('ohprint-notice', 'https://www.ohprint.me/notice'),
    ('ohprint-group', 'https://www.ohprint.me/group-order'),
    ('ohprint-events', 'https://www.ohprint.me/events'),
    ('29cm-event', 'https://www.29cm.co.kr/store/event'),
    ('29cm-notice', 'https://www.29cm.co.kr/order/my-order/cscenter/notice/notice-list'),
    ('channel-cases', 'https://channel.io/kr/blog/topics/3d6f95d1'),
    ('bizhows-bulk', 'https://www.bizhows.com/cms/bulk_order/'),
]
for n, u in PROBE2:
    T(n, u, set='probe2')

PROBE3 = [
    ('marpple-custom', 'https://www.marpple.com/kr/custom'),
    ('musinsa-snap', 'https://www.musinsa.com/snap'),
    ('musinsa-notice', 'https://www.musinsa.com/cs/notice'),
]
for n, u in PROBE3:
    T(n, u, set='probe3')

PROBE4 = [
    ('socar-guide', 'https://www.socar.kr/guide'),
    ('carhartt-gear', 'https://companygear.carhartt.com/'),
    ('landsend-biz', 'https://business.landsend.com/how-to-order/'),
    ('customink-how', 'https://www.customink.com/help_center'),
    ('bizhows-help', 'https://help.bizhows.com/hc/ko'),
    ('laundrygo', 'https://www.laundrygo.com/'),
    ('channel-case-detail', 'https://channel.io/kr/blog/articles/'),
]
for n, u in PROBE4:
    T(n, u, set='probe4')


def run(names, out, do_pc=True, do_m=True):
    os.makedirs(out, exist_ok=True)
    log = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=MOBILE_UA)
        for name in names:
            t = TARGETS[name]
            for kind, ctx in (('pc', pc), ('m', mo)):
                if kind == 'pc' and not (do_pc and t.get('pc', True)):
                    continue
                if kind == 'm' and not (do_m and t.get('m', True)):
                    continue
                key = f'{name}-{kind}'
                pg = ctx.new_page()
                info = {}
                try:
                    resp = pg.goto(t['url'], wait_until='domcontentloaded', timeout=45000)
                    info['status'] = resp.status if resp else None
                    pg.wait_for_timeout(t.get('wait', 2500))
                    close_popups(pg, t.get('popups'))
                    slow_scroll(pg)
                    close_popups(pg, t.get('popups'))
                    for a in (t.get('pre_m', []) if kind == 'm' else []) + t.get('pre', []):
                        try:
                            a(pg)
                        except Exception as e:
                            info.setdefault('pre_err', []).append(str(e)[:160])
                    pg.evaluate('window.scrollTo(0, 0)')
                    pg.wait_for_timeout(500)
                    max_h = t.get('max_h_pc', 5200) if kind == 'pc' else t.get('max_h_m', 4500)
                    if not t.get('skip_base'):
                        path = os.path.join(out, f'{key}.jpg')
                        if kind == 'm':
                            shot_tall(pg, path, max_h)
                        else:
                            shot(pg, path, max_h)
                        if kind == 'm':
                            info['size'] = fix_mobile(path)
                        else:
                            info['size'] = Image.open(path).size
                    info['final_url'] = pg.url
                    info['title'] = pg.title()
                    info['scrollHeight'] = pg.evaluate('document.documentElement.scrollHeight')
                    txt = pg.evaluate('document.body ? document.body.innerText : ""')
                    info['text_len'] = len(txt)
                    with open(os.path.join(out, f'_tmp-{key}.txt'), 'w') as f:
                        f.write(txt)
                    hrefs = pg.evaluate("""() => Array.from(document.querySelectorAll('a[href]')).map(a => a.innerText.trim().replace(/\\s+/g,' ').slice(0,50) + ' | ' + a.href)""")
                    with open(os.path.join(out, f'_tmp-{key}-links.txt'), 'w') as f:
                        f.write('\n'.join(dict.fromkeys(hrefs)))
                    for st in t['states']:
                        suffix, actions, mode = st[0], st[1], st[2]
                        only = st[3] if len(st) > 3 else None
                        if only and only != kind:
                            continue
                        try:
                            for a in actions:
                                a(pg)
                            sp = os.path.join(out, f'{name}-{suffix}-{kind}.jpg')
                            if mode == 'view':
                                view_shot(pg, sp)
                            else:
                                pg.evaluate('window.scrollTo(0, 0)')
                                pg.wait_for_timeout(400)
                                if kind == 'm':
                                    shot_tall(pg, sp, max_h)
                                else:
                                    shot(pg, sp, max_h)
                            if kind == 'm':
                                info[f'state:{suffix}'] = fix_mobile(sp)
                            else:
                                info[f'state:{suffix}'] = Image.open(sp).size
                            info[f'url:{suffix}'] = pg.url
                        except Exception as e:
                            info[f'state_err:{suffix}'] = str(e)[:200]
                except Exception as e:
                    info['error'] = str(e)[:300]
                finally:
                    pg.close()
                log[key] = info
                print(key, json.dumps(info, ensure_ascii=False), flush=True)
        b.close()
    return log


# ---- 남긴 곳(keep) ---------------------------------------------------------------------
# 이름이 곧 파일 이름이다. pre 는 기본 캡처 전에 누르는 동작(펼친 상태를 기본 캡처로 남길 때).
APP_BAND = [act_tap_right_of('앱 열기')]   # 모바일 앱 설치 띠의 X
T('ohprint-cs-faq', 'https://www.ohprint.me/cs/faq', set='keep', pre_m=APP_BAND,
  pre=[act_click_text('주문 수량에 제한이 있나요?')])
T('ohprint-cs-qna', 'https://www.ohprint.me/cs/qna', set='keep', pre_m=APP_BAND)
T('ohprint-notice', 'https://www.ohprint.me/notice', set='keep', pre_m=APP_BAND,
  pre=[act_click_text('오프린트미 리뉴얼 예정 안내')])
T('kurly-faq', 'https://www.kurly.com/board/faq', set='keep',
  pre=[act_click_text('상품불량인 경우, 반품 기준이 궁금합니다.')])
T('kurly-notice', 'https://www.kurly.com/board/notice', set='keep', max_h_m=2600,
  states=[('detail', [act_click_text('셀프 교환 서비스 도입 안내', wait=2500)], 'full')])
T('marpple-review', 'https://www.marpple.com/kr/review/list?is_all=false', set='keep', max_h_pc=3600, max_h_m=4200)
T('marpple-review-detail', 'https://www.marpple.com/kr/review/detail?r_id=226272', set='keep', max_h_pc=2400, max_h_m=3200)
T('marpple-event', 'https://www.marpple.com/kr/event/list', set='keep')
T('channel-cases', 'https://channel.io/kr/blog/topics/3d6f95d1', set='keep', max_h_pc=3400, max_h_m=4200,
  pre_m=[act_hide('#ch-plugin, #ch-plugin-core, [id^="ch-plugin"]')],
  states=[('filter', [act_click_text('업종', exact=True)], 'view'),
          ('detail', [lambda pg: pg.keyboard.press('Escape'),
                      act_click_text('아이디어스가', wait=3000),
                      lambda pg: slow_scroll(pg)], 'full')])
T('socar-guide', 'https://www.socar.kr/guide', set='keep',
  pre=[act_click_text('예약을 취소하면 수수료가 있나요?')])
T('marpple-kit', 'https://www.marpple.com/kr/kit', set='probe5')


def links(pairs, kw):
    """주소를 모를 때: 첫 화면의 링크 가운데 낱말이 들어간 것만 뽑는다(캡처 없음)."""
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        for name, url in pairs:
            pg = pc.new_page()
            try:
                r = pg.goto(url, wait_until='domcontentloaded', timeout=45000)
                pg.wait_for_timeout(3000)
                slow_scroll(pg, 6000)
                rows = pg.evaluate("""() => Array.from(document.querySelectorAll('a[href]')).map(a => [a.innerText.trim().replace(/\\s+/g,' ').slice(0,40), a.href])""")
                seen = set()
                print('==', name, r.status if r else None, pg.url, pg.title(), flush=True)
                for txt, href in rows:
                    if href in seen:
                        continue
                    if any(k.lower() in (txt + ' ' + href).lower() for k in kw):
                        seen.add(href)
                        print('  ', txt, '|', href)
            except Exception as e:
                print('==', name, 'ERR', str(e)[:200])
            finally:
                pg.close()
        b.close()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--links', nargs='*', default=None, help='name=url ...')
    ap.add_argument('--kw', default='')
    ap.add_argument('--out', default='.')
    ap.add_argument('--only', default='')
    ap.add_argument('--set', default='')
    ap.add_argument('--pc-only', action='store_true')
    ap.add_argument('--m-only', action='store_true')
    a = ap.parse_args()
    if a.links:
        links([x.split('=', 1) for x in a.links], [k for k in a.kw.split(',') if k])
        sys.exit(0)
    if a.only:
        names = [n for n in a.only.split(',') if n]
    elif a.set:
        names = [n for n, t in TARGETS.items() if t.get('set') == a.set]
    else:
        names = list(TARGETS)
    run(names, a.out, do_pc=not a.m_only, do_m=not a.pc_only)
