# -*- coding: utf-8 -*-
"""로그인·회원가입형(auth) 레퍼런스 캡처.

사용: /usr/bin/python3 _capture.py <이름> [<이름> ...]   (이름은 아래 TARGETS 의 키)
      /usr/bin/python3 _capture.py --list

- 로그인·제출은 하지 않는다. 화면을 열고, 가리는 띠·팝업만 닫고, 필요한 경우 탭·버튼 한 번만 눌러 상태를 연다.
- PC 1440x900, 모바일 390x844(@2x → 저장 뒤 폭 780 이하·세로 9000 이하로 자른다).
"""
import sys, os, json
from playwright.sync_api import sync_playwright
from PIL import Image

# 훑어보기 단계에서는 CAPTURE_OUT 으로 임시 폴더를 지정한다(남길 곳만 이 폴더에 저장).
OUT = os.environ.get('CAPTURE_OUT') or os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

# 이름: (주소, {옵션})
#   click: 캡처 전에 누를 선택자 목록(없으면 건너뜀)  /  click_text: 글자로 찾아 누를 목록
#   only: 'pc' | 'm'  /  max_h: 세로 한도  /  wait: 추가 대기(ms)
TARGETS = {
    # ── 1차 훑기 ──
    '29cm-login':        ('https://www.29cm.co.kr/member/login', {}),
    'musinsa-login':     ('https://www.musinsa.com/auth/login', {}),
    'kurly-login':       ('https://www.kurly.com/member/login', {}),
    'kurly-signup':      ('https://www.kurly.com/member/signup', {}),
    'ohouse-login':      ('https://ohou.se/users/sign_in', {}),
    'kream-login':       ('https://kream.co.kr/login', {}),
    'kream-join':        ('https://kream.co.kr/join', {}),
    'wconcept-login':    ('https://member.wconcept.co.kr/login', {}),
    'saramin-biz-join':  ('https://www.saramin.co.kr/zf_user/member/registration/join?ut=c', {}),
    'jobkorea-biz-join': ('https://www.jobkorea.co.kr/Join/GI_Regist', {}),
    'gmarket-join':      ('https://signup.gmarket.co.kr/', {}),
    'stripe-register':   ('https://dashboard.stripe.com/register', {}),
    'shopify-signup':    ('https://accounts.shopify.com/signup', {}),
    'printful-register': ('https://www.printful.com/auth/register', {}),
    'marpple-login':     ('https://www.marpple.com/kr/login', {}),
    'wing-join':         ('https://wing.coupang.com/tenants/vendor-signup/signup', {}),
    'ssg-join':          ('https://member.ssg.com/member/join/joinIntro.ssg', {}),
    'oliveyoung-login':  ('https://www.oliveyoung.co.kr/store/login/loginForm.do', {}),
    # ── 2차 훑기 ──
    'ikea-login':        ('https://www.ikea.com/kr/ko/profile/login/', {'wait': 2500}),
    'ikea-signup':       ('https://www.ikea.com/kr/ko/profile/signup/', {'wait': 2500}),
    'ikea-biz-signup':   ('https://www.ikea.com/kr/ko/profile/signup/business/', {'wait': 2500}),
    'smartstore-join':   ('https://sell.smartstore.naver.com/#/sellers/join', {'wait': 2500}),
    'baemin-biz-join':   ('https://biz-member.baemin.com/join', {'wait': 2000}),
    'apple-create':      ('https://account.apple.com/account', {'wait': 4000}),
    'unsplash-join':     ('https://unsplash.com/join', {}),
    'tosspayments-join': ('https://onboarding.tosspayments.com/', {'wait': 2000}),
    # ── 3차 훑기 ──
    'saramin-biz-join2': ('https://www.saramin.co.kr/zf_user/member/registration/join?ut=c', {'until': 'commit', 'wait': 6000}),
    'kyobo-join':        ('https://mmbr.kyobobook.co.kr/join', {'wait': 1500}),
    'ably-sellers-join': ('https://my.a-bly.com/signup', {'wait': 2000}),
    'kakaostyle-join':   ('https://partners.kakaostyle.com/signup', {'wait': 2000}),
    'compuzone-join':    ('https://www.compuzone.co.kr/member/join_select.htm', {}),
    'cafe24-login':      ('https://eclogin.cafe24.com/Shop/', {}),
    'channel-login':     ('https://desk.channel.io/#/signin', {'wait': 2500}),
    'kmong-login':       ('https://kmong.com/login', {'wait': 1500}),
    'dribbble-login':    ('https://dribbble.com/session/new', {}),
    'printful-login':    ('https://www.printful.com/auth/login', {'wait': 1500}),
    'klaviyo-login':     ('https://www.klaviyo.com/login', {'wait': 1500}),
    'airtable-signup':   ('https://airtable.com/signup', {'wait': 1500}),
    'squarespace-login': ('https://login.squarespace.com/', {'wait': 1500}),
    'ohprint-login':     ('https://www.ohprint.me/login', {'wait': 1500}),
    'bizhows-login':     ('https://www.bizhows.com/login', {'wait': 1500}),
    # ── 4차 훑기(사업자 가입) ──
    'kyobo-corp':        ('https://mmbr.kyobobook.co.kr/join', {'wait': 1500, 'click_text': ['법인회원 가입']}),
    'coupang-biz':       ('https://login.coupang.com/corporation/member/landing-page', {'wait': 1500}),
    'albamon-join':      ('https://www.albamon.com/member/join', {'wait': 1500}),
    'sinsang-join':      ('https://sinsangmarket.kr/join', {'wait': 2000}),
    'linkshops-join':    ('https://www.linkshops.com/signup', {'wait': 2000}),
    'popbill-join':      ('https://www.popbill.com/Member/Join', {'wait': 1500}),
    'jobkorea-m-join':   ('https://m.jobkorea.co.kr/Join/GI_Regist', {'wait': 1500, 'only': 'm'}),
    'samsung-b2b-join':  ('https://org-sec-b2b.samsung.com/sec/business/partner/applyPartner', {'wait': 1500}),
    'domeggook-join':    ('https://domeggook.com/main/member/mem_joinSelect.php', {'wait': 1500}),
    'yes24-join':        ('https://www.yes24.com/Member/Join/Accept', {'wait': 1500}),
    'kyobo-company':     ('https://mmbr.kyobobook.co.kr/join/company', {'wait': 2500}),
    # ── 5차 훑기(유형 선택·단계 표시) ──
    'gabia-join':        ('https://member.gabia.com/join', {'wait': 2000}),
    'ncloud-join':       ('https://www.ncloud.com/join/type', {'wait': 2500}),
    'cafe24-join':       ('https://eclogin.cafe24.com/Shop/', {'wait': 1000, 'click_text': ['회원가입']}),
    'nicepay-join':      ('https://start.nicepay.co.kr/', {'wait': 2000}),
    'hiworks-join':      ('https://www.hiworks.com/join', {'wait': 2000}),
    'works-join':        ('https://join.worksmobile.com/kr/joinup/step1', {'wait': 2000}),
    'kyobo-login':       ('https://mmbr.kyobobook.co.kr/login', {'wait': 2000}),
    'printful-register2': ('https://www.printful.com/auth/register', {'wait': 2000}),
}

CLOSE_SELECTORS = [
    '#onetrust-accept-btn-handler', 'button#truste-consent-button',
    'button[aria-label="닫기"]', 'button[aria-label="Close"]', 'button[aria-label="close"]',
    '.popup-close', '.btn_close', '.layer_close', '.modal-close', '.close-btn',
]


def close_overlays(pg):
    closed = []
    for sel in CLOSE_SELECTORS:
        try:
            loc = pg.locator(sel)
            n = min(loc.count(), 3)
            for i in range(n):
                el = loc.nth(i)
                if el.is_visible():
                    el.click(timeout=1500)
                    closed.append(sel)
                    pg.wait_for_timeout(300)
        except Exception:
            pass
    return closed


def slow_scroll(pg):
    try:
        total = pg.evaluate('document.documentElement.scrollHeight')
        y = 0
        while y < min(total, 12000):
            pg.evaluate('y => window.scrollTo(0, y)', y)
            pg.wait_for_timeout(180)
            y += 600
        pg.evaluate('window.scrollTo(0, 0)')
        pg.wait_for_timeout(400)
    except Exception:
        pass


def shot(pg, path, max_h=5200):
    h = min(pg.evaluate('document.documentElement.scrollHeight'), max_h)
    h = max(h, pg.viewport_size['height'])
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': 0, 'width': w, 'height': h}, full_page=True)


def fix_mobile(path):
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


def run_one(ctx, name, url, opt, suffix):
    pg = ctx.new_page()
    info = {'name': name, 'suffix': suffix, 'url': url}
    try:
        resp = pg.goto(url, wait_until=opt.get('until', 'domcontentloaded'), timeout=45000)
        info['status'] = resp.status if resp else None
        pg.wait_for_timeout(2500 + opt.get('wait', 0))
        info['closed'] = close_overlays(pg)
        slow_scroll(pg)
        for sel in opt.get('click', []):
            try:
                pg.locator(sel).first.click(timeout=4000)
                pg.wait_for_timeout(900)
                info.setdefault('clicked', []).append(sel)
            except Exception as e:
                info.setdefault('click_fail', []).append(sel)
        for txt in opt.get('click_text', []):
            try:
                pg.get_by_text(txt, exact=False).first.click(timeout=4000)
                pg.wait_for_timeout(900)
                info.setdefault('clicked', []).append(txt)
            except Exception as e:
                info.setdefault('click_fail', []).append(txt)
        for js in opt.get('eval', []):
            try:
                pg.evaluate(js)
                pg.wait_for_timeout(600)
            except Exception as e:
                info.setdefault('eval_fail', []).append(str(e)[:80])
        info['final_url'] = pg.url
        info['title'] = pg.title()
        info['text_len'] = len(pg.evaluate('document.body ? document.body.innerText : ""'))
        path = os.path.join(OUT, '%s-%s.jpg' % (opt.get('file', name), suffix))
        shot(pg, path, opt.get('max_h', 5200))
        if suffix == 'm':
            info['size'] = fix_mobile(path)
        else:
            info['size'] = Image.open(path).size
        info['file'] = os.path.basename(path)
    except Exception as e:
        info['error'] = str(e)[:200]
    finally:
        pg.close()
    print(json.dumps(info, ensure_ascii=False))


def main():
    names = sys.argv[1:]
    pc_only = '--pc' in names          # 훑어보기용: PC 화면만
    names = [n for n in names if n != '--pc']
    if not names or names[0] == '--list':
        print('\n'.join(TARGETS))
        return
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=UA_M)
        for name in names:
            url, opt = TARGETS[name]
            if opt.get('only') != 'm':
                run_one(pc, name, url, opt, 'pc')
            if opt.get('only') != 'pc' and not pc_only:
                run_one(mo, name, url, opt, 'm')
        b.close()


if __name__ == '__main__':
    main()
