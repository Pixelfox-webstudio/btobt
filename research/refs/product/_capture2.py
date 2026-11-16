#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""이어받은 담당자가 모자란 화면만 다시 찍는 스크립트(_capture.py 의 도우미를 그대로 쓴다).

  /usr/bin/python3 _capture2.py ascolour_m marpple_pc merchology

로그인·제출은 하지 않는다. 입력 칸에 숫자만 넣어 화면 상태를 본다.
"""
import os
import sys
import json
import importlib.util
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('cap1', os.path.join(HERE, '_capture.py'))
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
OUT = HERE


def P(name):
    return os.path.join(OUT, name)


def ascolour_m(pc, mo):
    pg = mo.new_page()
    pg.goto('https://www.ascolour.com/classic-tee-5026', wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(3500)
    c.ascolour_kill_popup(pg)
    n = pg.evaluate("""() => { const l=[...document.querySelectorAll('label.form-option-swatch, label.form-option')].filter(e=>e.getBoundingClientRect().width>0 && e.querySelector('.form-option-variant--color')); if(!l.length) return 0; const el=l[l.length-1]; el.scrollIntoView({block:'center'}); el.click(); return l.length; }""")
    print('SWATCHES', n)
    pg.wait_for_timeout(2500)
    try:
        loc = pg.locator('.mobile-grid-toggle').first
        loc.scroll_into_view_if_needed(timeout=3000)
        loc.tap(timeout=3000)
    except Exception as e:
        print('TOGGLE_FAIL', str(e)[:120])
        pg.evaluate("() => { const el=document.querySelector('.mobile-grid-toggle'); el.scrollIntoView({block:'start'}); el.click(); }")
    pg.wait_for_timeout(5000)
    c.ascolour_kill_popup(pg)
    info = pg.evaluate("""() => { const t=document.querySelector('.mobile-grid-toggle'); const ty=t? t.getBoundingClientRect().top+window.scrollY : 0;
      document.querySelectorAll('[data-cap2]').forEach(e=>e.removeAttribute('data-cap2')); let i=0; const out=[];
      document.querySelectorAll('input').forEach(el => { const r=el.getBoundingClientRect(); const y=r.top+window.scrollY;
        if(r.width<8||r.height<8||y<ty) return; if(el.type==='hidden'||el.type==='checkbox'||el.type==='email'||el.type==='search') return;
        out.push({i:i, cls:el.className.slice(0,40), type:el.type, dis:el.disabled, ro:el.readOnly, y:Math.round(y), w:Math.round(r.width), ph:el.placeholder});
        if(!el.disabled && !el.readOnly) el.setAttribute('data-cap2', String(i)); i++; });
      return {ty:Math.round(ty), n:i, first:out.slice(0,14)}; }""")
    print('INPUTS', json.dumps(info)[:1600])
    targets = [x['i'] for x in info['first'] if not x['dis'] and not x['ro'] and 'qty' in x['cls'].lower()] or \
              [x['i'] for x in info['first'] if not x['dis'] and not x['ro']]
    vals = [12, 20, 8, 5, 10]
    done = 0
    for idx, v in zip(targets, vals):
        try:
            loc = pg.locator('[data-cap2="%d"]' % idx)
            loc.scroll_into_view_if_needed(timeout=2500)
            loc.tap(timeout=2500)
            pg.keyboard.type(str(v), delay=60)
            pg.wait_for_timeout(250)
            done += 1
        except Exception as e:
            print('FILL_FAIL', idx, str(e)[:100])
    pg.keyboard.press('Tab')
    pg.wait_for_timeout(2500)
    print('FILLED', done, 'VALUES', pg.evaluate("() => [...document.querySelectorAll('[data-cap2]')].slice(0,10).map(e=>e.value)"))
    c.ascolour_kill_popup(pg)
    pg.evaluate("() => { const el=document.querySelector('.mobile-grid-toggle'); if(el){ window.scrollTo(0, el.getBoundingClientRect().top+window.scrollY-70); } }")
    pg.wait_for_timeout(800)
    y = int(pg.evaluate('window.scrollY'))
    c.shot(pg, P('ascolour-bulk-grid-filled2-m.jpg'), 1900, y)
    c.shot_view(pg, P('ascolour-bulk-grid-view2-m.jpg'))
    print('BOTTOM_TEXT', pg.evaluate("""() => { const els=[...document.querySelectorAll('button, input[type=submit], a.button')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>100 && r.top>500 && r.top<844;}); return els.map(e=>(e.innerText||e.value||'').trim()).slice(0,5).join(' | '); }"""))
    print('TOTALS', pg.evaluate("""() => { const m=document.body.innerText.match(/Total[^\\n]{0,60}/gi); return m? m.slice(0,6).join(' | ') : 'none'; }"""))
    pg.close()


def marpple_pc(pc, mo):
    pg = pc.new_page()
    pg.goto('https://www.marpple.com/kr/product/detail?bp_id=7402', wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(4500)
    for i in range(8):
        hit = False
        for label in ('다음', '완료', '확인', '시작하기'):
            try:
                loc = pg.get_by_text(label, exact=True).first
                if loc.count() and loc.is_visible():
                    loc.click(timeout=1500)
                    pg.wait_for_timeout(450)
                    hit = True
                    print('TOUR_CLICK', label)
                    break
            except Exception:
                pass
        if not hit:
            break
    pg.wait_for_timeout(600)
    c.shot_view(pg, P('marpple-detail2-pc.jpg'))
    try:
        pg.get_by_text('할인 가격표', exact=True).first.click(timeout=3000)
        pg.wait_for_timeout(1800)
        c.shot_view(pg, P('marpple-price-table2-pc.jpg'))
        print('PRICE_TABLE_TEXT', pg.evaluate("""() => { const el=[...document.querySelectorAll('div,section')].filter(e=>/주문 수량/.test(e.innerText||'') && /개당 가격/.test(e.innerText||'')).pop(); return el? el.innerText.replace(/\\s+/g,' ').slice(0,500) : 'none'; }"""))
    except Exception as e:
        print('PRICE_TABLE_FAIL', str(e)[:160])
    pg.keyboard.press('Escape')
    pg.wait_for_timeout(500)
    for sel in ('[class*="modal" i] [class*="close" i]', 'button[aria-label*="close" i]', 'button[aria-label="닫기"]'):
        try:
            loc = pg.locator(sel).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=1200)
                pg.wait_for_timeout(400)
                print('CLOSED', sel)
                break
        except Exception:
            pass
    pg.mouse.move(500, 520)
    pg.mouse.wheel(0, 1500)
    pg.wait_for_timeout(1800)
    print('SCROLL', pg.evaluate("window.scrollY + ' / ' + document.documentElement.scrollHeight"))
    c.shot_view(pg, P('marpple-scrolled2-pc.jpg'))
    pg.close()


def merchology(pc, mo):
    pg = pc.new_page()
    url = None
    for coll in ('https://www.merchology.com/collections/mens-polos', 'https://www.merchology.com/collections/polos',
                 'https://www.merchology.com/collections/all'):
        try:
            r = pg.goto(coll, wait_until='domcontentloaded', timeout=45000)
            pg.wait_for_timeout(3000)
            print('COLL', coll, r.status if r else None, pg.title()[:80])
            links = pg.evaluate("() => [...new Set([...document.querySelectorAll('a[href*=\"/products/\"]')].map(a=>a.href.split('?')[0]))].slice(0,5)")
            if links:
                url = links[0]
                break
        except Exception as e:
            print('COLL_FAIL', coll, str(e)[:120])
    pg.close()
    print('PRODUCT_URL', url)
    if not url:
        return
    for ctx, sfx in ((pc, 'pc'), (mo, 'm')):
        pg = ctx.new_page()
        try:
            r = pg.goto(url, wait_until='domcontentloaded', timeout=45000)
            pg.wait_for_timeout(3000)
            print('PDP', sfx, r.status if r else None, pg.title()[:80])
            print('CLOSED', c.close_popups(pg), c.close_any(pg))
            c.slow_scroll(pg)
            c.close_popups(pg)
            c.close_any(pg)
            c.shot(pg, P('merchology-detail-%s.jpg' % sfx), 5200)
            c.shot_view(pg, P('merchology-top-%s.jpg' % sfx))
            if sfx == 'pc':
                print('TEXT', pg.evaluate("() => (document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ').slice(0,2200)"))
        except Exception as e:
            print('PDP_FAIL', sfx, str(e)[:160])
        pg.close()


JS_KILL_TEXT = """(text) => {
  let n = 0;
  const hit = [...document.querySelectorAll('div,section,aside,form,dialog')].filter(el => (el.innerText || '').includes(text));
  hit.forEach(el => {
    if (!el.isConnected) return;
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || s.position === 'absolute') {
      const r = el.getBoundingClientRect();
      if (r.width > 200 && r.height > 200 && (el.innerText || '').length < 1500) { el.remove(); n++; }
    }
  });
  document.querySelectorAll('div').forEach(el => {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (s.position === 'fixed' && r.width >= innerWidth - 2 && r.height >= innerHeight - 2 && (el.innerText || '').trim().length < 5) { el.remove(); n++; }
  });
  document.documentElement.style.overflow = ''; document.body.style.overflow = '';
  return n;
}"""


def merch_kill_popup(pg):
    """Merchology 할인 쿠폰 팝업(이름·이메일 양식)을 닫는다. 양식에는 아무것도 넣지 않는다."""
    out = []
    for fr in pg.frames:
        try:
            if fr == pg.main_frame:
                out.append(('main', fr.evaluate(JS_KILL_TEXT, 'Valid on your first order')))
            elif fr.evaluate("() => (document.body && document.body.innerText || '').includes('first order')"):
                h = fr.frame_element()
                h.evaluate("el => { let b = el; for (let i = 0; i < 4 && b.parentElement && b.parentElement !== document.body; i++) b = b.parentElement; b.remove(); }")
                out.append(('iframe', fr.url[:50]))
        except Exception as e:
            out.append(('err', str(e)[:60]))
    pg.wait_for_timeout(400)
    print('MERCH_POPUP', json.dumps(out)[:400])


def merchology2(pc, mo):
    url = 'https://www.merchology.com/collections/mens-polos/products/1383255-under-armour-black-polo-48hour'
    for ctx, sfx in ((pc, 'pc'), (mo, 'm')):
        pg = ctx.new_page()
        try:
            pg.goto(url, wait_until='domcontentloaded', timeout=45000)
            pg.wait_for_timeout(3500)
            c.close_popups(pg)
            c.slow_scroll(pg)
            pg.wait_for_timeout(2500)
            merch_kill_popup(pg)
            pg.keyboard.press('Escape')
            pg.wait_for_timeout(500)
            merch_kill_popup(pg)
            c.shot(pg, P('merchology-detail-%s.jpg' % sfx), 5200)
            n = pg.evaluate("""() => { let i=0; document.querySelectorAll('input[type=number]').forEach(el => { const r=el.getBoundingClientRect(); if(r.width<8||el.disabled) return; el.setAttribute('data-cap3', String(i++)); }); return i; }""")
            print('QTY_INPUTS', sfx, n)
            for i, v in enumerate([10, 20, 12]):
                if i >= n:
                    break
                try:
                    loc = pg.locator('[data-cap3="%d"]' % i)
                    loc.scroll_into_view_if_needed(timeout=2500)
                    loc.fill(str(v), timeout=2500)
                    pg.keyboard.press('Tab')
                    pg.wait_for_timeout(500)
                except Exception as e:
                    print('FILL_FAIL', i, str(e)[:100])
            pg.wait_for_timeout(2500)
            merch_kill_popup(pg)
            print('AFTER', sfx, pg.evaluate("""() => { const t=document.body.innerText; const a=t.indexOf('Total Qty'); const b=t.indexOf('Pricing'); return (a>=0? t.slice(a, a+160):'no total') + ' || ' + (b>=0? t.slice(b, b+260):'no pricing'); }""").replace('\n', ' '))
            pg.evaluate("""() => { const el=[...document.querySelectorAll('*')].find(e => e.children.length===0 && (e.textContent||'').trim()==='Qty'); if(el){ window.scrollTo(0, el.getBoundingClientRect().top+window.scrollY-(innerWidth>1000?420:120)); } }""")
            pg.wait_for_timeout(900)
            c.shot_view(pg, P('merchology-qty-filled-%s.jpg' % sfx))
            y = int(pg.evaluate('window.scrollY'))
            if sfx == 'm':
                c.shot(pg, P('merchology-customize-m.jpg'), 1900, y)
            else:
                pg.evaluate("() => window.scrollTo(0, 420)")
                pg.wait_for_timeout(700)
                c.shot_view(pg, P('merchology-customize-pc.jpg'))
        except Exception as e:
            print('PDP_FAIL', sfx, str(e)[:200])
        pg.close()


def marpple_pc2(pc, mo):
    pg = pc.new_page()
    pg.goto('https://www.marpple.com/kr/product/detail?bp_id=7402', wait_until='domcontentloaded', timeout=45000)
    pg.wait_for_timeout(4500)
    for i in range(7):
        hit = False
        for label in ('완료', '다음'):
            try:
                loc = pg.get_by_text(label, exact=True).first
                if loc.count() and loc.is_visible():
                    loc.click(timeout=1500, force=True)
                    pg.wait_for_timeout(450)
                    hit = True
                    print('TOUR_CLICK', label)
                    break
            except Exception as e:
                print('TOUR_FAIL', label, str(e)[:80])
        if not hit:
            break
    pg.mouse.click(836, 327)
    pg.wait_for_timeout(500)
    pg.keyboard.press('Escape')
    pg.wait_for_timeout(500)
    ok = False
    try:
        pg.get_by_text('할인 가격표', exact=True).first.click(timeout=2500)
        ok = True
    except Exception as e:
        print('CLICK1_FAIL', str(e)[:200].replace('\n', ' '))
        try:
            pg.evaluate("() => { const b=[...document.querySelectorAll('button')].find(e => (e.textContent||'').trim()==='할인 가격표'); if(b) b.click(); return !!b; }")
            ok = True
        except Exception as e2:
            print('CLICK2_FAIL', str(e2)[:120])
    pg.wait_for_timeout(1800)
    txt = pg.evaluate("""() => { const el=[...document.querySelectorAll('div,section')].filter(e=>/주문 수량/.test(e.innerText||'') && /개당 가격/.test(e.innerText||'')).pop(); return el? el.innerText.replace(/\\s+/g,' ').slice(0,400) : 'none'; }""")
    print('PRICE_TABLE', ok, txt)
    if txt != 'none':
        c.shot_view(pg, P('marpple-price-table-pc.jpg'))
        print('SAVED marpple-price-table-pc.jpg')
    pg.close()


TASKS = {'ascolour_m': ascolour_m, 'marpple_pc': marpple_pc, 'merchology': merchology,
         'merchology2': merchology2, 'marpple_pc2': marpple_pc2}


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pc = b.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR', user_agent=c.UA_PC)
        mo = b.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', is_mobile=True,
                           has_touch=True, device_scale_factor=2, user_agent=c.UA_M)
        for name in sys.argv[1:]:
            print('=== ', name)
            try:
                TASKS[name](pc, mo)
            except Exception as e:
                print('TASK_FAIL', name, str(e)[:300])
        b.close()


if __name__ == '__main__':
    main()
