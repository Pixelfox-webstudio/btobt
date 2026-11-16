#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""상품 상세·구매형 레퍼런스 캡처 스크립트.

사용법:
  /usr/bin/python3 _capture.py <job> [<job> ...]     # JOBS 에 정의한 작업 이름
  /usr/bin/python3 _capture.py --list

작업 하나는 한 주소를 PC(1440)와 모바일(390)으로 각각 한 번 열어
  1) 팝업 닫기 → 2) 천천히 끝까지 스크롤 → 3) 기본 상태 캡처
  4) (있으면) steps 에 적힌 조작을 한 뒤 상태별로 한 장씩 더 캡처
한다. 로그인·제출은 하지 않는다.
"""
import os
import re
import sys
import json
from playwright.sync_api import sync_playwright
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
UA_M = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
UA_PC = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
         '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

# 흔한 쿠키·팝업 닫기 버튼(보이면 누른다)
COMMON_CLOSE = [
    '#onetrust-accept-btn-handler',
    'button#onetrust-reject-all-handler',
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("ACCEPT ALL")',
    'button:has-text("Accept Cookies")',
    'button:has-text("Accept")',
    'button:has-text("모두 수락")',
    'button:has-text("동의")',
    'button:has-text("오늘 하루 보지 않기")',
    'button:has-text("오늘 하루 안 보기")',
    'a:has-text("오늘 하루 보지 않기")',
    'button:has-text("모바일 웹으로 볼게요")',
    'button:has-text("웹으로 볼게요")',
    'button:has-text("괜찮아요")',
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    'button[aria-label="닫기"]',
    '[aria-label="Close dialog"]',
    'button:has-text("No thanks")',
    'button:has-text("No, thanks")',
]


JS_CLICK_IN_GROUP = """([anchors, target]) => {
  const norm = (t) => (t || '').replace(/\\s+/g, ' ').trim();
  const leaves = [...document.querySelectorAll('a,button,li,span,div,p')].filter(e => norm(e.textContent) === anchors[0]);
  for (const leaf of leaves) {
    let box = leaf.parentElement;
    for (let i = 0; i < 6 && box; i++, box = box.parentElement) {
      const txt = norm(box.textContent);
      if (anchors.every(a => txt.includes(a)) && txt.length < 400) {
        const cands = [...box.querySelectorAll('a,button,li,span,div,p')].filter(e => norm(e.textContent).replace(/[0-9,]+$/, '').trim() === target);
        if (cands.length) { const el = cands[cands.length - 1]; el.scrollIntoView({block: 'center'}); el.click(); return true; }
      }
    }
  }
  return false;
}"""

JS_KILL_FIXED = """(text) => {
  let n = 0;
  document.querySelectorAll('div,section,aside,form,dialog').forEach(el => {
    if (!el.isConnected) return;
    const s = getComputedStyle(el);
    if (s.position === 'fixed' && (el.innerText || '').includes(text)) { el.remove(); n++; }
  });
  document.documentElement.style.overflow = ''; document.body.style.overflow = '';
  return n;
}"""

JS_TAG_SMALL_INPUTS = """(maxw) => {
  document.querySelectorAll('[data-cap-idx]').forEach(e => e.removeAttribute('data-cap-idx'));
  let i = 0;
  document.querySelectorAll('input').forEach(el => {
    const t = (el.type || 'text').toLowerCase();
    if (!['text', 'number', 'tel'].includes(t)) return;
    if (el.disabled || el.readOnly) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.width > maxw) return;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return;
    el.setAttribute('data-cap-idx', String(i++));
  });
  return i;
}"""


def shot(pg, path, max_h=5200, top=0):
    """문서 위에서부터 max_h 까지(또는 top 부터 max_h 만큼) 잘라 찍는다."""
    total = pg.evaluate('document.documentElement.scrollHeight')
    h = min(total - top, max_h)
    w = pg.viewport_size['width']
    pg.screenshot(path=path, type='jpeg', quality=72,
                  clip={'x': 0, 'y': top, 'width': w, 'height': h}, full_page=True)
    fit(path)
    return total


def shot_view(pg, path):
    """지금 보이는 화면(뷰포트)만 찍는다. 고정 바·모달 확인용."""
    pg.screenshot(path=path, type='jpeg', quality=74)
    fit(path)


def fit(path):
    """모바일(배율 2) 그림은 폭 780 이하, 세로 9000 이하로 맞춘다."""
    im = Image.open(path)
    w, h = im.size
    changed = False
    if w > 1440:
        r = 1440 / w
        im = im.resize((1440, int(h * r)), Image.LANCZOS)
        changed = True
    if im.size[0] not in (1440,) and im.size[0] > 780:
        r = 780 / im.size[0]
        im = im.resize((780, int(im.size[1] * r)), Image.LANCZOS)
        changed = True
    if im.size[1] > 9000:
        im = im.crop((0, 0, im.size[0], 9000))
        changed = True
    if changed:
        im.convert('RGB').save(path, 'JPEG', quality=72)


def slow_scroll(pg, step=700, pause=220, limit=40):
    """지연 로딩 그림이 뜨도록 천천히 내려갔다가 맨 위로 돌아온다."""
    for i in range(limit):
        pg.mouse.wheel(0, step)
        pg.wait_for_timeout(pause)
        y = pg.evaluate('window.scrollY + window.innerHeight')
        total = pg.evaluate('document.documentElement.scrollHeight')
        if y >= total - 4:
            break
    pg.evaluate('window.scrollTo(0, 0)')
    pg.wait_for_timeout(700)


def close_popups(pg, extra=()):
    closed = []
    for sel in list(extra) + COMMON_CLOSE:
        try:
            loc = pg.locator(sel).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=1500)
                pg.wait_for_timeout(400)
                closed.append(sel)
        except Exception:
            pass
    return closed


CLOSE_ANY_SELECTORS = [
    'button[aria-label*="close" i]',
    'button[title*="close" i]',
    '[role="dialog"] button:has-text("×")',
    'button:has-text("×")',
    'button:has-text("✕")',
    'a:has-text("×")',
    '[class*="popup" i] [class*="close" i]',
    '[class*="modal" i] [class*="close" i]',
]


def close_any(pg):
    got = []
    for fr in pg.frames:
        for sel in CLOSE_ANY_SELECTORS:
            try:
                loc = fr.locator(sel)
                for i in range(min(loc.count(), 5)):
                    el = loc.nth(i)
                    if el.is_visible():
                        el.click(timeout=1500)
                        pg.wait_for_timeout(300)
                        got.append((fr.url[:40], sel))
            except Exception:
                continue
    return got


def run_step(pg, st):
    """steps 항목 하나를 실행한다. 실패해도 멈추지 않고 기록만 남긴다."""
    kind = st[0]
    try:
        if kind == 'click':
            loc = pg.locator(st[1]).first
            loc.scroll_into_view_if_needed(timeout=4000)
            loc.click(timeout=4000)
        elif kind == 'click_nth':
            loc = pg.locator(st[1]).nth(st[2])
            loc.scroll_into_view_if_needed(timeout=4000)
            loc.click(timeout=4000)
        elif kind == 'fill':
            loc = pg.locator(st[1]).first
            loc.scroll_into_view_if_needed(timeout=4000)
            loc.fill(st[2], timeout=4000)
        elif kind == 'fill_nth':
            loc = pg.locator(st[1]).nth(st[2])
            loc.scroll_into_view_if_needed(timeout=4000)
            loc.fill(st[3], timeout=4000)
        elif kind == 'press':
            pg.keyboard.press(st[1])
        elif kind == 'wait':
            pg.wait_for_timeout(st[1])
        elif kind == 'close_any':     # 모든 프레임에서 닫기 버튼처럼 보이는 것을 눌러 본다
            got = close_any(pg)
            print('CLOSE_ANY:', got)
        elif kind == 'click_xy':
            pg.mouse.click(st[1], st[2])
        elif kind == 'tap_xy':
            pg.touchscreen.tap(st[1], st[2])
        elif kind == 'py':            # ('py', 함수) 사이트 전용 조작
            st[1](pg)
        elif kind == 'wheel':
            pg.mouse.wheel(0, st[1])
        elif kind == 'scroll':
            pg.evaluate('window.scrollTo(0, %d)' % st[1])
        elif kind == 'scroll_to':
            pg.locator(st[1]).first.scroll_into_view_if_needed(timeout=4000)
        elif kind == 'eval':
            pg.evaluate(st[1])
        elif kind == 'close':
            close_popups(pg, st[1:] if len(st) > 1 else ())
        elif kind == 'try_click':     # ('try_click', [선택자, ...]) 앞에서부터 되는 것 하나만 누른다
            done = False
            for sel in st[1]:
                try:
                    if sel.startswith('exact:'):
                        loc = pg.get_by_text(sel[6:], exact=True).first
                    else:
                        loc = pg.locator(sel).first
                    if loc.count() and loc.is_visible():
                        loc.scroll_into_view_if_needed(timeout=3000)
                        loc.click(timeout=3000)
                        done = True
                        break
                except Exception:
                    continue
            if not done:
                return ('fail', st, 'no selector matched')
        elif kind == 'click_in_group':  # ('click_in_group', [묶음에 함께 있는 글자...], 누를 글자)
            ok = pg.evaluate(JS_CLICK_IN_GROUP, [st[1], st[2]])
            if not ok:
                return ('fail', st, 'group/target not found')
        elif kind == 'kill_fixed':    # ('kill_fixed', 글자) 그 글자가 든 고정(fixed) 팝업을 없앤다
            pg.evaluate(JS_KILL_FIXED, st[1])
        elif kind == 'fill_small':    # ('fill_small', [값...], 최대폭=140) 보이는 작은 입력 칸에 차례로 넣는다
            n = pg.evaluate(JS_TAG_SMALL_INPUTS, st[2] if len(st) > 2 else 140)
            for i, v in enumerate(st[1]):
                if i >= n:
                    break
                loc = pg.locator('[data-cap-idx="%d"]' % i)
                loc.scroll_into_view_if_needed(timeout=3000)
                loc.fill(str(v), timeout=3000)
                pg.wait_for_timeout(150)
            pg.keyboard.press('Tab')
        elif kind == 'dump':          # ('dump', 선택자, 글자수) 화면 글자를 출력(구조 파악용)
            try:
                t = pg.locator(st[1]).first.inner_text(timeout=3000)
            except Exception as e:
                t = 'ERR ' + str(e)[:100]
            print('DUMP[%s]: %s' % (st[1], re.sub(r'\s+', ' ', t)[:st[2] if len(st) > 2 else 800]))
        elif kind == 'dump_js':       # ('dump_js', 식) 식의 결과를 출력
            print('DUMPJS:', str(pg.evaluate(st[1]))[:st[2] if len(st) > 2 else 1500])
        elif kind == 'shot_here':     # ('shot_here', '화면이름', 높이) 지금 스크롤 위치부터 높이만큼
            y = int(pg.evaluate('window.scrollY'))
            return ('shot', st[1], st[2] if len(st) > 2 else 2400, y)
        elif kind == 'shot':          # ('shot', '화면이름', max_h=5200, top=0)
            return ('shot', st[1], st[2] if len(st) > 2 else 5200, st[3] if len(st) > 3 else 0)
        elif kind == 'view':          # ('view', '화면이름') 지금 보이는 화면만
            return ('view', st[1])
        pg.wait_for_timeout(500)
        return ('ok', st)
    except Exception as e:
        return ('fail', st, str(e)[:160])


def capture(ctx, job, suffix):
    site = job['site']
    pg = ctx.new_page()
    log = {'site': site, 'device': suffix, 'url': job['url']}
    try:
        resp = pg.goto(job['url'], wait_until='domcontentloaded', timeout=45000)
        log['status'] = resp.status if resp else None
    except Exception as e:
        log['error'] = str(e)[:200]
        pg.close()
        return log
    pg.wait_for_timeout(job.get('wait', 2500))
    log['closed'] = close_popups(pg, job.get('close', ()))
    slow_scroll(pg)
    log['closed'] += close_popups(pg, job.get('close', ()))
    log['title'] = pg.title()
    log['final_url'] = pg.url
    files = []
    log['pre'] = []
    for st in job.get('pre_' + suffix, job.get('pre', [])):
        r = run_step(pg, st)
        if r[0] == 'fail':
            log['pre'].append(r)
    if job.get('base', True):
        name = '%s-%s-%s.jpg' % (site, job['screen'], suffix)
        log['height'] = shot(pg, os.path.join(OUT, name), job.get('max_h', 5200))
        files.append(name)
    steps = job.get('steps_' + suffix, job.get('steps', []))
    log['steps'] = []
    for st in steps:
        r = run_step(pg, st)
        if r[0] == 'shot':
            name = '%s-%s-%s.jpg' % (site, r[1], suffix)
            shot(pg, os.path.join(OUT, name), r[2], r[3])
            files.append(name)
        elif r[0] == 'view':
            name = '%s-%s-%s.jpg' % (site, r[1], suffix)
            shot_view(pg, os.path.join(OUT, name))
            files.append(name)
        elif r[0] == 'fail':
            log['steps'].append(r)
    log['files'] = files
    pg.close()
    return log


def ascolour_open_grid(pg):
    """AS Colour: 'Bulk Order Grid' 를 여는 요소를 찾아 눌러 본다(구조를 출력해 둔다)."""
    info = pg.evaluate("""() => {
      const out = [];
      document.querySelectorAll('a,button,span,div,p,label').forEach((el, i) => {
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\\s+/g, ' ').trim();
        if (/Bulk Order Grid/i.test(own)) {
          const r = el.getBoundingClientRect();
          el.setAttribute('data-cap-grid', String(out.length));
          out.push({tag: el.tagName, cls: el.className, id: el.id, href: el.getAttribute('href'),
                    attrs: [...el.attributes].map(a => a.name + '=' + a.value).join(' ').slice(0, 200),
                    w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + window.scrollY),
                    parent: el.parentElement ? el.parentElement.tagName + '.' + el.parentElement.className : ''});
        }
      });
      return out;
    }""")
    print('GRID_TRIGGERS:', json.dumps(info, ensure_ascii=False)[:1500])
    chain = pg.evaluate("""() => {
      const t = document.querySelector('table.productMatrix'); const out = [];
      for (let e = t; e && e !== document.body; e = e.parentElement) {
        const s = getComputedStyle(e);
        out.push(e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 60) + ' [' + s.display + '/' + s.visibility + '/' + s.position + ']');
      }
      return out;
    }""")
    print('GRID_CHAIN:', json.dumps(chain)[:1500])

    def shown():
        return pg.evaluate("(() => { const t=document.querySelector('table.productMatrix'); if(!t) return 0; return Math.round(t.getBoundingClientRect().width); })()")

    for i, it in enumerate(info):
        if it['w'] < 4:
            continue
        loc = pg.locator('[data-cap-grid="%d"]' % i)
        try:
            loc.scroll_into_view_if_needed(timeout=3000)
            loc.click(timeout=3000)
        except Exception as e:
            print('GRID_CLICK_FAIL', i, str(e)[:120])
            try:
                pg.evaluate("(i) => document.querySelector('[data-cap-grid=\"' + i + '\"]').click()", i)
            except Exception as e2:
                print('GRID_JSCLICK_FAIL', i, str(e2)[:120])
        pg.wait_for_timeout(3000)
        w = shown()
        print('GRID_AFTER_CLICK', i, 'matrix width', w)
        if w > 0:
            break
    print('GRID_STATE:', pg.evaluate("""() => { const t=document.querySelector('table.productMatrix'); const r=t.getBoundingClientRect();
      const sc=[]; for (let e=t.parentElement; e && e!==document.documentElement; e=e.parentElement){ const s=getComputedStyle(e); if(/(auto|scroll)/.test(s.overflow+s.overflowX+s.overflowY)) sc.push(e.tagName+'.'+String(e.className).slice(0,50)+' '+e.clientWidth+'x'+e.clientHeight+' sw'+e.scrollWidth+' sh'+e.scrollHeight+' pos:'+s.position); }
      return JSON.stringify({w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.top), left:Math.round(r.left), scrollY:window.scrollY, docH:document.documentElement.scrollHeight, scrollers:sc}); }"""))


JS_FIND_TEXT_DEEP = """(text) => {
  const hits = [];
  const walk = (root) => {
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) walk(el.shadowRoot);
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ');
      if (own.includes(text)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const chain = [];
          for (let e = el; e && chain.length < 7; e = e.parentElement || (e.getRootNode() && e.getRootNode().host)) chain.push(e.tagName + '.' + String(e.className || '').slice(0, 40));
          hits.push(chain.join(' < '));
        }
      }
    });
  };
  walk(document);
  return hits;
}"""


def ascolour_kill_popup(pg):
    """AS Colour 뉴스레터 팝업('Join the Community')이 떠 있으면 닫는다."""
    for attempt in range(3):
        where = []
        for fr in pg.frames:
            try:
                hits = fr.evaluate(JS_FIND_TEXT_DEEP, 'Join the Community')
                if hits:
                    where.append((fr.url[:50], hits[:2]))
            except Exception:
                pass
        if not where:
            return
        print('POPUP_FOUND:', json.dumps(where)[:600])
        got = close_any(pg)
        print('POPUP_CLOSE_ANY:', got)
        pg.wait_for_timeout(500)
        still = False
        for fr in pg.frames:
            try:
                if fr.evaluate(JS_FIND_TEXT_DEEP, 'Join the Community'):
                    still = True
            except Exception:
                pass
        if not still:
            return
        if pg.viewport_size['width'] > 1000:
            pg.mouse.click(1040, 230)
        else:
            pg.touchscreen.tap(335, 281)
        pg.wait_for_timeout(700)
        pg.keyboard.press('Escape')
        pg.wait_for_timeout(400)


def ascolour_flow(pg):
    """AS Colour: 색상 선택 → Bulk Order Grid 열기 → 수량 입력. 상태마다 캡처한다."""
    wide = pg.viewport_size['width'] > 1000
    sfx = 'pc' if wide else 'm'

    def snap(name, long_h=0):
        ascolour_kill_popup(pg)
        path = os.path.join(OUT, 'ascolour-%s-%s.jpg' % (name, sfx))
        if long_h:
            y = int(pg.evaluate('window.scrollY'))
            shot(pg, path, long_h, y)
        else:
            shot_view(pg, path)
        print('SAVED', os.path.basename(path))

    ascolour_kill_popup(pg)
    # 1) 색상 하나 고르기(검정 = 마지막 견본)
    try:
        n = pg.evaluate("""() => { const l=[...document.querySelectorAll('label.form-option-swatch, label.form-option')].filter(e=>e.getBoundingClientRect().width>0 && e.querySelector('.form-option-variant--color')); if(!l.length) return 0; const el=l[l.length-1]; el.scrollIntoView({block:'center'}); el.click(); return l.length; }""")
        print('SWATCHES', n)
    except Exception as e:
        print('SWATCH_FAIL', str(e)[:120])
    pg.wait_for_timeout(2500)
    snap('color-selected')
    # 2) 그리드 열기
    if wide:
        pg.evaluate("""() => { const el=document.querySelector('.usp-pdp_bulk-container.bulk-popup-open') || [...document.querySelectorAll('.bulk-popup-open')].find(e=>e.getBoundingClientRect().width>0); el.scrollIntoView({block:'center'}); el.click(); }""")
    else:
        try:
            loc = pg.locator('.mobile-grid-toggle').first
            loc.scroll_into_view_if_needed(timeout=3000)
            loc.tap(timeout=3000)
        except Exception as e:
            print('TOGGLE_TAP_FAIL', str(e)[:120])
            pg.evaluate("() => { const el=document.querySelector('.mobile-grid-toggle'); el.scrollIntoView({block:'start'}); el.click(); }")
    pg.wait_for_timeout(5000)
    if wide:
        snap('bulk-grid')
    else:
        pg.evaluate("() => { const el=document.querySelector('.mobile-grid-toggle'); if(el){ const y=el.getBoundingClientRect().top+window.scrollY-70; window.scrollTo(0, y); } }")
        pg.wait_for_timeout(600)
        snap('bulk-grid', 1900)
    # 3) 수량 넣기
    sel = '.bulk-popup input.qty' if wide else 'input.qty'
    n = pg.evaluate("""(sel) => { document.querySelectorAll('[data-cap-idx]').forEach(e=>e.removeAttribute('data-cap-idx')); let i=0;
        document.querySelectorAll(sel).forEach(el => { const r=el.getBoundingClientRect(); if(r.width<8||r.height<8||el.disabled||el.readOnly) return; el.setAttribute('data-cap-idx', String(i++)); }); return i; }""", sel)
    print('QTY_INPUTS', n)
    vals = [12, 20, 8, 5, 10, 6, 4, 3, 2, 7, 9, 11] if wide else [12, 20, 8]
    for i, v in enumerate(vals):
        if i >= n:
            break
        try:
            loc = pg.locator('[data-cap-idx="%d"]' % i)
            loc.scroll_into_view_if_needed(timeout=2500)
            loc.fill(str(v), timeout=2500)
            pg.wait_for_timeout(200)
        except Exception as e:
            print('FILL_FAIL', i, str(e)[:100])
    pg.keyboard.press('Tab')
    pg.wait_for_timeout(2500)
    if wide:
        pg.evaluate("() => { const sc=document.querySelector('.bulk-popup'); if(sc) sc.scrollTop=0; }")
        snap('bulk-grid-filled')
    else:
        pg.evaluate("() => { const el=document.querySelector('.mobile-grid-toggle'); if(el){ const y=el.getBoundingClientRect().top+window.scrollY-70; window.scrollTo(0, y); } }")
        pg.wait_for_timeout(600)
        snap('bulk-grid-filled', 1900)
        snap('bulk-grid-view')
    print('GRID_TEXT_TAIL:', pg.evaluate("(() => { const t=document.querySelector('.bulk-popup') ; const m=document.querySelector('.mobile-grid-toggle'); const box = (t && t.getBoundingClientRect().width>0) ? t : (m ? m.closest('form') || m.parentElement.parentElement : null); return box ? box.innerText.replace(/\\s+/g,' ').slice(-500) : 'none'; })()"))


JOBS = {}


def job(name, **kw):
    JOBS[name] = kw


# ---------------------------------------------------------------------------
# 작업 목록 (훑어본 후보 포함. 남긴 곳·버린 곳은 notes.md 참고)
# ---------------------------------------------------------------------------
job('ascolour', site='ascolour', screen='detail',
    url='https://www.ascolour.com/staple-tee-5001')
job('marpple', site='marpple', screen='detail',
    url='https://www.marpple.com/kr/product/detail?bp_id=7402')
job('customink', site='customink', screen='detail',
    url='https://www.customink.com/products/styles/gildan-ultra-cotton-t-shirt/4600')
job('musinsa', site='musinsa', screen='detail',
    url='https://www.musinsa.com/products/6488755')
job('stickermule', site='stickermule', screen='detail',
    url='https://www.stickermule.com/products/die-cut-stickers')
job('applekr', site='applekr', screen='buy',
    url='https://www.apple.com/kr/shop/buy-iphone/iphone-17')
job('ohprint', site='ohprint', screen='detail',
    url='https://www.ohprint.me/apparel/products/701001001102')
job('29cm', site='29cm', screen='detail',
    url='https://www.29cm.co.kr/products/3935443')
job('rushordertees', site='rushordertees', screen='detail',
    url='https://www.rushordertees.com/catalog/rt/classic-tee/')

# --- 2차 방문: 눌러야 보이는 상태 -------------------------------------------
job('ascolour2', site='ascolour', screen='detail', base=False,
    url='https://www.ascolour.com/staple-tee-5001',
    steps=[
        ('wait', 5000),
        ('try_click', ['.klaviyo-close-form', 'button[aria-label="Close dialog"]', 'button[aria-label="Close form"]']),
        ('kill_fixed', 'Join the Community'),
        ('scroll', 0),
        ('try_click', ['text=View Bulk Order Grid', 'text=Bulk Order Grid']),
        ('wait', 3000),
        ('dump_js', "(() => { const t=[...document.querySelectorAll('table')].filter(x=>x.querySelector('input')); return t.length ? t[0].outerHTML.replace(/\\s+/g,' ').slice(0,1800) : 'no table with input; inputs=' + document.querySelectorAll('input').length })()", 1900),
        ('view', 'bulk-grid'),
        ('fill_small', [12, 20, 8, 5, 10, 6, 4, 3], 90),
        ('wait', 2500),
        ('view', 'bulk-grid-filled'),
    ])
job('ascolour3', site='ascolour', screen='detail',
    url='https://www.ascolour.com/block-tee-5050',
    pre=[('wait', 5000), ('close_any',), ('press', 'Escape'), ('wait', 800), ('scroll', 0), ('wait', 500)],
    steps=[
        ('close_any',),
        ('try_click', ['text=View Bulk Order Grid', 'text=Bulk Order Grid']),
        ('wait', 3000),
        ('view', 'bulk-grid'),
        ('dump_js', "(() => { const t=document.querySelector('table.productMatrix'); if(!t) return 'no matrix'; const r=t.getBoundingClientRect(); const m=t.closest('[class*=modal],[role=dialog]'); return JSON.stringify({rows:t.querySelectorAll('tbody tr').length, w:r.width, h:r.height, top:r.top, modal:m?m.className:'none', scrollY:window.scrollY, docH:document.documentElement.scrollHeight}) })()"),
        ('fill_small', [12, 20, 8, 5, 10, 6, 4, 3, 2, 7, 9, 11], 90),
        ('wait', 2500),
        ('view', 'bulk-grid-filled'),
        ('dump_js', "(() => { const t=document.querySelector('table.productMatrix'); const box=t && (t.closest('[class*=modal]')||t.parentElement.parentElement); return box ? box.innerText.replace(/\\s+/g,' ').slice(-700) : 'none' })()"),
    ])
job('ascolour4', site='ascolour', screen='detail', base=False,
    url='https://www.ascolour.com/block-tee-5050',
    pre=[('wait', 3000), ('close_any',), ('scroll', 0), ('wait', 500)],
    steps=[
        ('py', ascolour_open_grid),
        ('view', 'bulk-grid'),
        ('fill_small', [12, 20, 8, 5, 10, 6, 4, 3, 2, 7, 9, 11], 90),
        ('wait', 2500),
        ('view', 'bulk-grid-filled'),
        ('shot_here', 'bulk-grid-long', 2600),
    ])
job('ascolour5', site='ascolour', screen='detail',
    url='https://www.ascolour.com/classic-tee-5026',
    pre=[('wait', 3000), ('py', ascolour_kill_popup), ('scroll', 0), ('wait', 500)],
    steps=[('py', ascolour_flow)])
job('ohprint2', site='ohprint', screen='detail', base=False,
    url='https://www.ohprint.me/apparel/products/701001001102',
    steps=[
        ('try_click', ['text=전체 컬러/사이즈 보기']),
        ('wait', 1500),
        ('view', 'colorsize'),
        ('press', 'Escape'),
        ('try_click', ['button[aria-label="닫기"]', 'button:has-text("닫기")', 'button:has-text("확인")']),
        ('click_in_group', ['작업가이드', '유의사항'], '옵션'),
        ('wait', 1800),
        ('view', 'tab-options'),
        ('shot_here', 'options', 2600),
        ('click_in_group', ['작업가이드', '유의사항'], '가격'),
        ('wait', 1800),
        ('shot_here', 'price', 2400),
        ('click_in_group', ['작업가이드', '유의사항'], '유의사항'),
        ('wait', 1800),
        ('shot_here', 'notice', 2200),
    ])
job('customink2', site='customink', screen='detail', base=False,
    url='https://www.customink.com/products/styles/gildan-ultra-cotton-t-shirt/4600',
    steps=[
        ('try_click', ['text=Get a Quote']),
        ('wait', 3500),
        ('view', 'quote'),
        ('dump', '[role="dialog"]', 1200),
        ('fill_small', [5, 10, 15, 10], 120),
        ('wait', 3500),
        ('view', 'quote-filled'),
        ('dump', '[role="dialog"]', 1500),
    ])
job('marpple2', site='marpple', screen='detail', base=False,
    url='https://www.marpple.com/kr/product/detail?bp_id=7402',
    steps_pc=[
        ('try_click', ['text=할인 가격표']),
        ('wait', 1500),
        ('view', 'price-table'),
        ('press', 'Escape'),
        ('wait', 500),
        ('wheel', 1200),
        ('wait', 1500),
        ('view', 'scrolled'),
        ('dump_js', "document.documentElement.scrollHeight + ' / scrollY ' + window.scrollY"),
    ],
    steps_m=[
        ('try_click', ['text=할인 가격표']),
        ('wait', 1500),
        ('view', 'price-table'),
        ('press', 'Escape'),
        ('wait', 500),
        ('scroll', 2400),
        ('wait', 1200),
        ('view', 'sticky'),
    ])
job('applekr2', site='applekr', screen='buy', base=False,
    url='https://www.apple.com/kr/shop/buy-iphone/iphone-17',
    steps=[
        ('eval', "(() => { const e=document.querySelector('input[name=dimensionColor]'); e.scrollIntoView({block:'center'}); e.click(); })()"),
        ('wait', 1800),
        ('view', 'step-color'),
        ('eval', "(() => { const e=document.querySelector('input[name=dimensionCapacity]'); e.scrollIntoView({block:'center'}); e.click(); })()"),
        ('wait', 2200),
        ('view', 'step-storage'),
        ('dump_js', "[...new Set([...document.querySelectorAll('input[type=radio]')].map(i=>i.name+':'+(i.disabled?'off':'on')))].join(', ')"),
        ('try_click', ['text=보상 판매 안 함']),
        ('wait', 2000),
        ('try_click', ['text=AppleCare+ 보증 추가 안 함']),
        ('wait', 2500),
        ('view', 'step-done'),
        ('scroll', 0),
        ('wait', 800),
        ('shot', 'buy-selected', 5200),
    ])
job('musinsa2', site='musinsa', screen='detail',
    url='https://www.musinsa.com/products/7230884')


def main():
    args = sys.argv[1:]
    if not args or args[0] == '--list':
        print('\n'.join(JOBS))
        return
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR', user_agent=UA_PC)
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=UA_M)
        for name in args:
            j = JOBS[name]
            for ctx, suffix in ((pc, 'pc'), (mo, 'm')):
                if j.get('only') and j['only'] != suffix:
                    continue
                print(json.dumps(capture(ctx, j, suffix), ensure_ascii=False))
        b.close()


if __name__ == '__main__':
    main()
