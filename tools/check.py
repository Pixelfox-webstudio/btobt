#!/usr/bin/env python3
"""하위 페이지 점검 스크립트.

  python3 tools/check.py pages [페이지이름 ...] [--no-shots] [--fast]
      화면 점검. spec/pages.json 의 모든 페이지 × 모든 상태를
      Chromium 1440·1024·768·390 과 WebKit 1710·390 으로 렌더링해 review/shots/<페이지>/<상태>-<엔진><폭>.jpg 로 캡처한다.
      아래 중 하나라도 걸리면 실패(종료 코드 1):
        가로 스크롤 / 콘솔 오류 / 깨진 이미지 / 보이는 h1 이 하나가 아님 / 헤더·푸터 블록이 index.html 과 다름 / CSS 순서가 Page Shell 과 다름
        / <main> 클래스 사슬이 다름 / 홈 전용 스크립트(v10.js·bgfx.js)나 data-rv 사용
      --fast 는 Chromium 1440·390 만 돈다(작업 중 빠른 확인용). 결과: review/check-pages.json

  python3 tools/check.py coverage
      요소 점검. 모든 페이지 × 상태를 한 번씩 열어 data-el="L줄번호 ..." 속성을 모으고, spec/coverage-map.json(직접 적은 선택자)과 합쳐
      spec/coverage.json 을 채운 뒤 검사한다. 아래면 실패:
        요소 목록에 있는데 coverage.json 에 없는 줄 / 완료(done)·해당 없음(na)이 아닌 항목 / 적어 둔 선택자가 그 페이지의 그 상태에 없음
      결과: review/check-coverage.json
"""
import json, re, sys, pathlib, time
from concurrent.futures import ProcessPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'review' / 'shots'
CSS_ORDER = ['ds-blue', 'site', 'v4', 'v8-base', 'v8', 'ui-v8', 'v9', 'v10', 'sub']
MAIN_CLASS = 'v4 v5 v6 v7 v8 v9 v10 subp'
VIEWS = [('chromium', 1440, 900), ('chromium', 1024, 768), ('chromium', 768, 1024), ('chromium', 390, 844), ('webkit', 1710, 1000), ('webkit', 390, 844)]
FAST = [('chromium', 1440, 900), ('chromium', 390, 844)]
MAX_H = 7000


def pages(only=None):
    reg = json.loads((ROOT / 'spec' / 'pages.json').read_text(encoding='utf-8'))['pages']
    return [p for p in reg if not only or p['file'][:-5] in only]


def url(p, state):
    u = 'file://' + str(ROOT / p['file'])
    if state == 'default':
        return u
    return u + ('&' if '?' in u else '?') + 'state=' + state


def state_url(p, st):
    """상태 키에 'tab=faq' 처럼 다른 주소 값이 섞여 있으면 그대로 붙인다. 예: 'tab=faq&state=empty'"""
    key = st[0]
    base = 'file://' + str(ROOT / p['file'])
    if key == 'default':
        return base
    if '=' in key:
        return base + '?' + key
    return base + '?state=' + key


def slug(key):
    return re.sub(r'[^a-z0-9]+', '-', key.lower()).strip('-') or 'default'


# ---------- 정적 검사(소스) ----------
def static_checks(p):
    errs = []
    src = (ROOT / p['file']).read_text(encoding='utf-8')
    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = re.findall(r'<link rel="stylesheet" href="css/([a-z0-9-]+)\.css', src)
    if css != CSS_ORDER:
        errs.append('CSS 순서가 Page Shell 과 다름: %s' % css)
    m = re.search(r'<main id="main" class="([^"]*)"', src)
    if not m or m.group(1) != MAIN_CLASS:
        errs.append('<main> 클래스 사슬이 다름: %s' % (m.group(1) if m else '없음'))
    if p.get('shell', 'full') == 'full':
        h0 = home.index('<header class="site-head v9h" id="siteHead">'); h1 = home.index('<main id="main"')
        f0 = home.index('<footer class="ft">'); f1 = home.index('<!-- 빠른 보기 -->')
        if home[h0:h1].rstrip() not in src:
            errs.append('헤더·서랍 블록이 index.html 과 다름')
        if home[f0:f1].rstrip() not in src:
            errs.append('푸터·하단 상담 바·우측 플로팅 블록이 index.html 과 다름')
    for bad in ('js/v10.js', 'js/bgfx.js'):
        if bad in src:
            errs.append('홈 전용 스크립트 사용: %s' % bad)
    body = src[src.index('<main id="main"'):]
    if re.search(r'\sdata-rv[\s=>]', body.split('<footer class="ft">')[0]):
        errs.append('data-rv 사용(홈 전용 등장 효과)')
    return errs


JS_PREP = '''async () => {
  document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; });
  const imgs = [...document.images].filter(i => i.getAttribute('src'));
  await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); setTimeout(r, 4000); })));
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
}'''
JS_CHECK = '''() => {
  const de = document.documentElement;
  const vis = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const wide = [];
  if (de.scrollWidth > de.clientWidth + 1) {
    document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > de.clientWidth + 1 && r.width > 0 && wide.length < 4 && getComputedStyle(e).position !== 'fixed') wide.push((e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0] + ' →' + Math.round(r.right)); });
  }
  return {
    scrollW: de.scrollWidth, clientW: de.clientWidth, wide,
    h1: [...document.querySelectorAll('h1')].filter(vis).length,
    broken: [...document.images].filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    ready: de.classList.contains('sub-ready'),
    height: de.scrollHeight,
  };
}'''


def run_view(args):
    engine, w, h, plist, shots = args
    from playwright.sync_api import sync_playwright
    out = []
    with sync_playwright() as pw:
        br = getattr(pw, engine).launch()
        ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, reduced_motion='reduce', locale='ko-KR')
        ctx.add_init_script("try{localStorage.setItem('b2bt-consent','{\"t\":1}')}catch(e){}")
        pg = ctx.new_page()
        logs = []
        pg.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)[:300]))
        pg.on('console', lambda m: logs.append('console: ' + m.text[:300]) if m.type == 'error' else None)
        for p in plist:
            for st in p['states']:
                del logs[:]
                rec = {'file': p['file'], 'state': st[0], 'view': '%s%d' % (engine[0], w), 'errors': []}
                try:
                    pg.goto(state_url(p, st), wait_until='load', timeout=30000)
                    pg.evaluate(JS_PREP)
                    pg.wait_for_timeout(350)
                    r = pg.evaluate(JS_CHECK)
                    if not r['ready']:
                        rec['errors'].append('sub.js 가 실행되지 않음')
                    if r['scrollW'] > r['clientW'] + 1:
                        rec['errors'].append('가로 스크롤 %d > %d %s' % (r['scrollW'], r['clientW'], r['wide']))
                    if r['h1'] != 1:
                        rec['errors'].append('보이는 h1 이 %d개' % r['h1'])
                    if r['broken']:
                        rec['errors'].append('깨진 이미지 %s' % r['broken'][:5])
                    errs = [l for l in logs if 'favicon' not in l]
                    if errs:
                        rec['errors'].append('콘솔 오류 %s' % errs[:3])
                    if shots:
                        d = SHOTS / p['file'][:-5]
                        d.mkdir(parents=True, exist_ok=True)
                        hh = min(r['height'], MAX_H)
                        pg.screenshot(path=str(d / ('%s-%s%d.jpg' % (slug(st[0]), engine[0], w))), type='jpeg', quality=58, full_page=True,
                                      clip={'x': 0, 'y': 0, 'width': w, 'height': hh})
                except Exception as e:  # noqa
                    rec['errors'].append('열기 실패: %s' % str(e)[:200])
                out.append(rec)
        br.close()
    return out


def cmd_pages(argv):
    shots = '--no-shots' not in argv
    views = FAST if '--fast' in argv else VIEWS
    only = set(a for a in argv if not a.startswith('--'))
    plist = pages(only)
    t0 = time.time()
    fails = []
    for p in plist:
        for e in static_checks(p):
            fails.append({'file': p['file'], 'state': '-', 'view': 'source', 'errors': [e]})
    with ProcessPoolExecutor(max_workers=len(views)) as ex:
        results = list(ex.map(run_view, [(e, w, h, plist, shots) for e, w, h in views]))
    recs = [r for rs in results for r in rs]
    fails += [r for r in recs if r['errors']]
    n_states = sum(len(p['states']) for p in plist)
    summary = {'pages': len(plist), 'states': n_states, 'views': ['%s%d' % (e[0], w) for e, w, _ in views], 'renders': len(recs), 'failed': len(fails), 'seconds': round(time.time() - t0, 1), 'fails': fails}
    if not only:
        (ROOT / 'review').mkdir(exist_ok=True)
        (ROOT / 'review' / 'check-pages.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding='utf-8')
    print('화면 점검: 페이지 %d · 상태 %d · 렌더링 %d회 · 실패 %d (%.0f초)' % (len(plist), n_states, len(recs), len(fails), time.time() - t0))
    for f in fails[:60]:
        print('  ✗ %s [%s] %s: %s' % (f['file'], f['state'], f['view'], ' / '.join(f['errors'])))
    return 1 if fails else 0


JS_EL = '''(sels) => {
  const ids = new Set();
  document.querySelectorAll('[data-el]').forEach(e => e.getAttribute('data-el').split(/\\s+/).forEach(t => t && ids.add(t)));
  const found = {};
  for (const s of sels) { try { found[s] = !!document.querySelector(s); } catch (e) { found[s] = false; } }
  return { ids: [...ids], found };
}'''


def cmd_coverage(argv):
    from playwright.sync_api import sync_playwright
    cov_path = ROOT / 'spec' / 'coverage.json'
    cov = json.loads(cov_path.read_text(encoding='utf-8'))
    items = {it['id']: it for it in cov['items']}
    # 요소 목록과 줄이 맞는지
    sys.path.insert(0, str(ROOT / 'tools'))
    import coverage_init
    spec_ids = [it['id'] for it in coverage_init.parse()]
    missing_items = [i for i in spec_ids if i not in items]
    cmap_path = ROOT / 'spec' / 'coverage-map.json'
    cmap = json.loads(cmap_path.read_text(encoding='utf-8')) if cmap_path.exists() else {}
    manual = {k: v for k, v in cmap.items() if not k.startswith('_')}
    plist = pages()
    by_file = {p['file']: p for p in plist}
    seen = {}     # id → (file, state)
    sel_ok = {}   # (file,state,selector) → bool
    want = {}
    for i, m in manual.items():
        if m.get('status') == 'na':
            continue
        want.setdefault((m['file'], m.get('state', 'default')), set()).add(m['selector'])
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        ctx = br.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce', locale='ko-KR')
        pg = ctx.new_page()
        for p in plist:
            for st in p['states']:
                try:
                    pg.goto(state_url(p, st), wait_until='load', timeout=30000)
                    pg.wait_for_timeout(250)
                    r = pg.evaluate(JS_EL, sorted(want.get((p['file'], st[0]), [])))
                except Exception as e:  # noqa
                    print('열기 실패', p['file'], st[0], str(e)[:120]); continue
                for i in r['ids']:
                    seen.setdefault(i, (p['file'], st[0]))
                for s, ok in r['found'].items():
                    sel_ok[(p['file'], st[0], s)] = ok
        br.close()
    problems = []
    for i in missing_items:
        problems.append('%s: 요소 목록에 있는데 coverage.json 에 없음' % i)
    unknown = sorted(set(seen) - set(items), key=lambda x: int(x[1:]) if x[1:].isdigit() else 0)
    for i in unknown:
        problems.append('%s: HTML 의 data-el 에 있지만 요소 목록에 없는 줄 번호 (%s)' % (i, seen[i][0]))
    for i, it in items.items():
        m = manual.get(i)
        if m and m.get('status') == 'na':
            it.update(status='na', note=m.get('note', ''), file='', state='', selector='')
            if not it['note']:
                problems.append('%s: 해당 없음(na)인데 이유가 없음' % i)
            continue
        if m:
            key = (m['file'], m.get('state', 'default'), m['selector'])
            it.update(file=m['file'], state=m.get('state', 'default'), selector=m['selector'], note=m.get('note', ''))
            if m['file'] not in by_file:
                it['status'] = 'todo'; problems.append('%s: %s 파일이 아직 없음' % (i, m['file']))
            elif sel_ok.get(key):
                it['status'] = 'done'
            else:
                it['status'] = 'todo'; problems.append('%s: 선택자 %s 가 %s [%s] 에 없음' % (i, m['selector'], m['file'], m.get('state', 'default')))
            continue
        if i in seen:
            it.update(file=seen[i][0], state=seen[i][1], selector='[data-el~="%s"]' % i, status='done')
        else:
            it.update(status='todo', file='', state='', selector='')
            problems.append('%s: 아직 없음 — [%s] %s' % (i, it['page'], it['text'][:60]))
    cov_path.write_text(json.dumps(cov, ensure_ascii=False, indent=1), encoding='utf-8')
    done = sum(1 for it in items.values() if it['status'] == 'done')
    na = sum(1 for it in items.values() if it['status'] == 'na')
    todo = len(items) - done - na
    per = {}
    for it in items.values():
        d = per.setdefault(it['page'], [0, 0])
        d[0] += it['status'] in ('done', 'na'); d[1] += 1
    (ROOT / 'review').mkdir(exist_ok=True)
    (ROOT / 'review' / 'check-coverage.json').write_text(json.dumps({'items': len(items), 'done': done, 'na': na, 'todo': todo, 'problems': problems,
                                                                    'perPage': {k: '%d/%d' % (v[0], v[1]) for k, v in per.items()}}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('요소 점검: 항목 %d · 완료 %d · 해당 없음 %d · 남음 %d · 문제 %d' % (len(items), done, na, todo, len(problems)))
    if '--list' in argv or len(problems) <= 40:
        for pr in problems:
            print('  ✗', pr)
    else:
        left = [k for k, v in per.items() if v[0] < v[1]]
        print('  남은 페이지 절 %d개: %s' % (len(left), ', '.join('%s(%d/%d)' % (k, per[k][0], per[k][1]) for k in left[:80])))
    return 1 if problems else 0


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'pages':
        sys.exit(cmd_pages(sys.argv[2:]))
    if cmd == 'coverage':
        sys.exit(cmd_coverage(sys.argv[2:]))
    print(__doc__)
    sys.exit(2)
