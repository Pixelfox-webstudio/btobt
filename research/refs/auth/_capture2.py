# -*- coding: utf-8 -*-
"""로그인·회원가입형(auth) 레퍼런스 — 이어받은 담당자의 추가 훑어보기·캡처 (2026-11-17)

사용:
  /usr/bin/python3 _capture2.py scan-old        # _capture.py 의 SCANNED 를 PC 로만 다시 열어 본다(버린 이유 확인용)
  /usr/bin/python3 _capture2.py scan-new        # NEW 후보를 PC·모바일로 찍는다
  /usr/bin/python3 _capture2.py <이름> [...]    # 이름을 골라 PC·모바일로 찍는다
  --pc / --m 로 한쪽만.  CAPTURE_OUT=<폴더> 로 저장 폴더를 바꾼다.

지킨 것:
- 로그인·가입·양식 제출을 하지 않는다. 글자를 넣지 않는다.
- 첫 화면에서 '회원가입' 같은 이동 링크, 가입 화면에서 회원 유형 선택(탭·라디오)만 한 번 누른다.
- PC 1440x900, 모바일 390x844(@2x → 저장 뒤 폭 780 이하, 세로 9000 이하).
"""
import sys, os, json
from playwright.sync_api import sync_playwright
from PIL import Image
import _capture as c

OUT = os.environ.get('CAPTURE_OUT') or os.path.dirname(os.path.abspath(__file__))

# 이름: (주소, {옵션})
#   follow  첫 화면에서 글자가 정확히 일치하는 링크를 차례로 누른다(이동만). 모바일은 PC 에서 도착한 주소를 바로 연다.
#   pick    도착한 화면에서 글자가 일치하는 선택지(탭·라디오·라벨)를 한 번 누른다.
#   m_url   모바일에서 따로 열 주소
NEW = {
    'navimro-join':      ('https://www.navimro.com/', {'follow': ['회원가입']}),
    'imarket-join':      ('https://www.imarket.co.kr/', {'follow': ['회원가입']}),
    'domeggook-join':    ('https://domeggook.com/', {'follow': ['회원가입']}),
    'ownerclan-join':    ('https://www.ownerclan.com/', {'follow': ['회원가입']}),
    'sinsang-join':      ('https://sinsangmarket.kr/', {'follow': ['회원가입']}),
    'officedepot-join':  ('https://www.officedepot.co.kr/', {'follow': ['회원가입']}),
    'officenex-join':    ('https://www.officenex.com/', {'follow': ['회원가입']}),
    'eidersafety-join':  ('https://www.eidersafety.com/', {'follow': ['회원가입']}),
    'k2safety-join':     ('https://www.k2safety.co.kr/', {'follow': ['회원가입']}),
    'ikea-biz-signup':   ('https://www.ikea.com/kr/ko/profile/signup/business/', {'wait': 2500}),
    'kurly-complete':    ('https://www.kurly.com/member/signup/complete', {'wait': 1000}),
    '29cm-join':         ('https://www.29cm.co.kr/member/join', {'wait': 1500}),
    # 2차: 짝 채우기·상태 캡처·파일 첨부 화면 찾기
    'kyobo-login':       ('https://mmbr.kyobobook.co.kr/login', {'wait': 2000, 'only': 'pc'}),
    'kyobo-login-b':     ('https://www.kyobobook.co.kr/', {'follow': ['로그인'], 'only': 'pc'}),
    'imarket-join-biz':  ('https://www.imarket.co.kr/member/joinStep1', {'pick': ['사업자'], 'm_url': 'https://www.imarket.co.kr/mobile/member/joinStep1'}),
    'jobkorea-biz-join': ('https://www.jobkorea.co.kr/Join/GI_Regist', {'m_url': 'https://m.jobkorea.co.kr/Join/GI_Regist'}),
    'krds-fileupload':   ('https://www.krds.go.kr/html/site/component/component_summary.html', {'follow': ['파일 업로드']}),
    'linkshops-signup':  ('https://www.linkshops.com/', {'follow': ['회원가입']}),
    'sikbom-join':       ('https://www.sikbom.com/', {'follow': ['회원가입']}),
}
TARGETS = dict(c.SCANNED, **c.KEPT)
TARGETS.update(NEW)

PROBE = """() => {
  const t = document.body ? document.body.innerText : '';
  const kw = ['사업자등록증','사업자등록번호','사업자번호','업태','종목','업종','첨부','미리보기','중복확인','자동등록방지',
              '기업회원','사업자회원','사업자 회원','법인회원','개인회원','일반회원','수신거부','수신 동의','수신동의','광고성',
              '카카오','네이버','Google','구글','Apple','STEP','단계','로봇','captcha','CAPTCHA','Access Denied','차단'];
  return {len: t.length,
          inputs: document.querySelectorAll('input:not([type=hidden])').length,
          files: document.querySelectorAll('input[type=file]').length,
          pw: document.querySelectorAll('input[type=password]').length,
          frames: document.querySelectorAll('iframe').length,
          kw: kw.filter(k => t.includes(k)),
          head: t.replace(/\\s+/g, ' ').slice(0, 140)};
}"""


def click_first_visible(pg, txt):
    for loc in (pg.get_by_role('link', name=txt, exact=True), pg.get_by_text(txt, exact=True),
                pg.get_by_role('button', name=txt, exact=True)):
        try:
            for i in range(min(loc.count(), 6)):
                el = loc.nth(i)
                if el.is_visible():
                    el.click(timeout=4000)
                    return True
        except Exception:
            pass
    return False


def run(ctx, name, url, opt, suffix):
    pg = ctx.new_page()
    info = {'name': name, 'sfx': suffix}
    try:
        resp = pg.goto(url, wait_until='domcontentloaded', timeout=45000)
        info['status'] = resp.status if resp else None
        pg.wait_for_timeout(2500 + opt.get('wait', 0))
        c.close_overlays(pg)
        if suffix == 'pc' or not opt.get('_arrived'):
            for txt in opt.get('follow', []):
                ok = click_first_visible(pg, txt)
                if not ok:
                    href = pg.evaluate("""t => { const a = [...document.querySelectorAll('a[href]')].find(a => a.innerText.trim() === t && !a.getAttribute('href').startsWith('javascript') && a.getAttribute('href') !== '#'); return a ? a.href : null; }""", txt)
                    if href:
                        pg.goto(href, wait_until='domcontentloaded', timeout=45000)
                        ok = 'href'
                info.setdefault('follow', []).append([txt, ok])
                try:
                    pg.wait_for_load_state('domcontentloaded', timeout=15000)
                except Exception:
                    pass
                pg.wait_for_timeout(2500)
                c.close_overlays(pg)
        for txt in opt.get('pick', []):
            ok = click_first_visible(pg, txt)
            info.setdefault('pick', []).append([txt, ok])
            pg.wait_for_timeout(1500)
        c.slow_scroll(pg)
        info['final'] = pg.url[:150]
        info['title'] = pg.title()[:60]
        info.update(pg.evaluate(PROBE))
        path = os.path.join(OUT, '%s-%s.jpg' % (name, suffix))
        c.shot(pg, path, opt.get('max_h', 5200))
        info['size'] = c.fix_mobile(path) if suffix == 'm' else Image.open(path).size
    except Exception as e:
        info['error'] = str(e)[:160]
    finally:
        pg.close()
    print(json.dumps(info, ensure_ascii=False), flush=True)
    return info


def main():
    args = sys.argv[1:]
    pc_only, m_only = '--pc' in args, '--m' in args
    names = [a for a in args if a not in ('--pc', '--m')]
    if names == ['scan-old']:
        names, pc_only = list(c.SCANNED), True
    elif names == ['scan-new']:
        names = list(NEW)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=c.UA_M)
        for name in names:
            url, opt = TARGETS[name]
            opt = dict(opt)
            if not m_only and opt.get('only') != 'm':
                info = run(pc, name, url, opt, 'pc')
                if opt.get('follow') and info.get('final'):
                    url, opt['_arrived'] = info['final'], True
            if not pc_only and opt.get('only') != 'pc':
                run(mo, name, opt.get('m_url', url), opt, 'm')
        b.close()


if __name__ == '__main__':
    main()
