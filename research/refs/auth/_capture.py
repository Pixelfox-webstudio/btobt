# -*- coding: utf-8 -*-
"""로그인·회원가입형(auth) 레퍼런스 캡처 — 2026-11-17

사용:
  /usr/bin/python3 _capture.py                 # KEPT 전부를 PC·모바일로 다시 찍는다
  /usr/bin/python3 _capture.py kurly-signup    # 이름을 골라 찍는다
  /usr/bin/python3 _capture.py --pc <이름>     # PC 화면만(훑어보기용)
  /usr/bin/python3 _capture.py --m <이름>      # 모바일 화면만
  /usr/bin/python3 _capture.py --list
  CAPTURE_OUT=<폴더> 를 주면 그 폴더에 저장한다(훑어보기 때 임시 폴더로 썼다).

지킨 것:
- 로그인·가입·양식 제출을 하지 않는다. 화면을 열고, 가리는 띠·팝업만 닫는다.
- 눌러야 보이는 상태는 '선택·탭·링크' 한 번만 누른다(약관 동의·확인·중복확인·인증 버튼은 누르지 않는다).
- 입력 즉시 안내를 보려고 넣은 글자는 뜻 없는 두세 글자('a1', 'b2', 'a')뿐이고 어떤 버튼도 누르지 않았다.
- PC 1440x900, 모바일 390x844(@2x → 저장 뒤 폭 780 이하, 세로 9000 이하로 맞춘다).
"""
import sys, os, json
from playwright.sync_api import sync_playwright
from PIL import Image

OUT = os.environ.get('CAPTURE_OUT') or os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')

# 이름: (주소, {옵션})   이름이 곧 파일 이름(<이름>-pc.jpg / <이름>-m.jpg)
#   wait        추가 대기(ms)
#   click_text  글자로 찾아 한 번 누른다(선택·탭·링크만)
#   click_exact 글자가 정확히 일치하는 것을 누른다
#   fill        [(placeholder, 글자)] — 뜻 없는 글자를 넣고 Tab 으로 빠져나온다(버튼은 누르지 않는다)
#   pw_probe    True 면 첫 비밀번호 칸에 'a' 한 글자를 넣어 규칙 안내를 띄운다(iframe 포함)
#   only        'pc' | 'm'
KEPT = {
    # 1) 교보문고 — 로그인 / 가입 방법 선택 / 법인회원 사업자번호 인증
    'kyobo-login':          ('https://mmbr.kyobobook.co.kr/join', {'wait': 1500, 'click_exact': ['로그인'], 'after_wait': 2500}),
    'kyobo-join':           ('https://mmbr.kyobobook.co.kr/join', {'wait': 1500}),
    'kyobo-company':        ('https://mmbr.kyobobook.co.kr/join/company', {'wait': 2500}),
    # 2) 컬리 — 일반 회원 정보 입력(한 화면 양식) / 입력 즉시 안내가 뜬 상태
    'kurly-signup':         ('https://www.kurly.com/member/signup', {'wait': 1000}),
    'kurly-signup-typed':   ('https://www.kurly.com/member/signup', {'wait': 1000, 'fill': [
        ('아이디를 입력해주세요', 'a1'), ('비밀번호를 입력해주세요', 'a1'), ('비밀번호를 한번 더 입력해주세요', 'b2')]}),
    # 3) 삼성전자 비즈니스 — 기업 정보 입력 양식(파트너 신청)
    'samsung-b2b-apply':    ('https://org-sec-b2b.samsung.com/sec/business/partner/applyPartner', {'wait': 1500, 'max_h': 5200}),
    # 4) 네이버 클라우드 플랫폼 — 회원 유형 선택 + 단계 표시(1/6)
    'ncloud-join-type':     ('https://www.ncloud.com/join/type', {'wait': 2500}),
    # 5) Printful — 사진·소개 문구와 로그인 양식을 나란히 둔 화면 / 가입 첫 화면
    'printful-login':       ('https://www.printful.com/auth/login', {'wait': 1500}),
    'printful-register':    ('https://www.printful.com/auth/register', {'wait': 2000}),
    # 6) Apple 계정 생성 — 자동입력 방지 그림, 수신 동의, 비밀번호 규칙
    'apple-create':         ('https://account.apple.com/account', {'wait': 4000}),
    'apple-create-pw':      ('https://account.apple.com/account', {'wait': 4000, 'pw_probe': True}),
}

# 훑어보기에서 열어 본 주소(남기지 않은 곳 포함). 기록용이며 기본 실행에서는 찍지 않는다.
SCANNED = {
    '29cm-login':        ('https://www.29cm.co.kr/member/login', {}),
    'musinsa-login':     ('https://www.musinsa.com/auth/login', {}),
    'kurly-login':       ('https://www.kurly.com/member/login', {}),
    'ohouse-login':      ('https://ohou.se/users/sign_in', {}),
    'kream-login':       ('https://kream.co.kr/login', {}),
    'kream-join':        ('https://kream.co.kr/join', {}),
    'wconcept-login':    ('https://member.wconcept.co.kr/login', {}),
    'saramin-biz-join':  ('https://www.saramin.co.kr/zf_user/member/registration/join?ut=c', {}),
    'jobkorea-biz-join': ('https://www.jobkorea.co.kr/Join/GI_Regist', {}),
    'jobkorea-m-join':   ('https://m.jobkorea.co.kr/Join/GI_Regist', {'only': 'm'}),
    'gmarket-join':      ('https://signup.gmarket.co.kr/', {}),
    'ssg-join':          ('https://member.ssg.com/member/join/joinIntro.ssg', {}),
    'smartstore-join':   ('https://sell.smartstore.naver.com/#/sellers/join', {'wait': 2500}),
    'baemin-biz-join':   ('https://biz-member.baemin.com/join', {'wait': 2000}),
    'coupang-biz':       ('https://login.coupang.com/corporation/member/landing-page', {}),
    'wing-join':         ('https://wing.coupang.com/tenants/vendor-signup/signup', {}),
    'tosspayments-join': ('https://onboarding.tosspayments.com/', {'wait': 2000}),
    'ikea-login':        ('https://www.ikea.com/kr/ko/profile/login/', {'wait': 2500}),
    'ikea-signup':       ('https://www.ikea.com/kr/ko/profile/signup/', {'wait': 2500}),
    'cafe24-login':      ('https://eclogin.cafe24.com/Shop/', {}),
    'channel-login':     ('https://desk.channel.io/#/signin', {'wait': 2500}),
    'ohprint-login':     ('https://www.ohprint.me/login', {'wait': 1500}),
    'marpple-login':     ('https://www.marpple.com/kr/login', {}),
    'kakaostyle-join':   ('https://partners.kakaostyle.com/signup', {'wait': 2000}),
    'stripe-register':   ('https://dashboard.stripe.com/register', {}),
    'shopify-signup':    ('https://accounts.shopify.com/signup', {}),
    'unsplash-join':     ('https://unsplash.com/join', {}),
    'dribbble-login':    ('https://dribbble.com/session/new', {}),
    'klaviyo-login':     ('https://www.klaviyo.com/login', {'wait': 1500}),
    'squarespace-login': ('https://login.squarespace.com/', {'wait': 1500}),
    'airtable-signup':   ('https://airtable.com/signup', {'wait': 1500}),
}
TARGETS = dict(SCANNED, **KEPT)

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
            for i in range(min(loc.count(), 3)):
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
        for txt in opt.get('click_text', []):
            try:
                pg.get_by_text(txt, exact=False).first.click(timeout=4000)
                info.setdefault('clicked', []).append(txt)
            except Exception:
                info.setdefault('click_fail', []).append(txt)
        for txt in opt.get('click_exact', []):
            try:
                pg.get_by_text(txt, exact=True).first.click(timeout=4000)
                info.setdefault('clicked', []).append(txt)
            except Exception:
                info.setdefault('click_fail', []).append(txt)
        if opt.get('click_text') or opt.get('click_exact'):
            try:
                pg.wait_for_load_state('domcontentloaded', timeout=15000)
            except Exception:
                pass
            pg.wait_for_timeout(opt.get('after_wait', 1200))
        for ph, txt in opt.get('fill', []):
            try:
                el = pg.get_by_placeholder(ph, exact=True).first
                el.click(timeout=4000)
                el.type(txt, delay=60)
                pg.keyboard.press('Tab')
                pg.wait_for_timeout(500)
                info.setdefault('filled', []).append(ph)
            except Exception:
                info.setdefault('fill_fail', []).append(ph)
        if opt.get('pw_probe'):
            done = False
            for fr in pg.frames:
                try:
                    loc = fr.locator('input[type=password]')
                    if loc.count():
                        loc.first.click(timeout=4000)
                        loc.first.type('a', delay=60)
                        pg.wait_for_timeout(900)
                        done = True
                        break
                except Exception:
                    pass
            info['pw_probe'] = done
        if opt.get('fill') or opt.get('pw_probe'):
            pg.evaluate('window.scrollTo(0, 0)')
            pg.wait_for_timeout(300)
        info['final_url'] = pg.url[:160]
        info['title'] = pg.title()
        info['text_len'] = len(pg.evaluate('document.body ? document.body.innerText : ""'))
        path = os.path.join(OUT, '%s-%s.jpg' % (name, suffix))
        shot(pg, path, opt.get('max_h', 5200))
        info['size'] = fix_mobile(path) if suffix == 'm' else Image.open(path).size
        info['file'] = os.path.basename(path)
    except Exception as e:
        info['error'] = str(e)[:200]
    finally:
        pg.close()
    print(json.dumps(info, ensure_ascii=False))


def main():
    names = sys.argv[1:]
    pc_only = '--pc' in names
    m_only = '--m' in names
    names = [n for n in names if n not in ('--pc', '--m')]
    if names and names[0] == '--list':
        print('KEPT:\n  ' + '\n  '.join(KEPT) + '\nSCANNED:\n  ' + '\n  '.join(SCANNED))
        return
    if not names:
        names = list(KEPT)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=UA_M)
        for name in names:
            url, opt = TARGETS[name]
            if opt.get('only') != 'm' and not m_only:
                run_one(pc, name, url, opt, 'pc')
            if opt.get('only') != 'pc' and not pc_only:
                run_one(mo, name, url, opt, 'm')
        b.close()


if __name__ == '__main__':
    main()
