#!/usr/bin/env python3
"""하위 페이지 조립기.

tools/pages/<이름>.html (본문 조각) + index.html 의 헤더·서랍·푸터·하단 상담 바 → <이름>.html (완성된 정적 페이지)

조각 파일 형식
  첫 줄부터 `<!--{ ... }-->` : 페이지 정보(JSON)
      title   브라우저 제목(뒤에 ' | 비투비티'가 붙는다)
      desc    한 문장 설명
      name    요소 목록의 페이지 이름(검수 목록에 표시)
      group   작업 지시 4절의 묶음 번호(1~8)
      type    페이지 유형(list / product / cart / form / auth / account / board / doc / result)
      shell   'full'(기본: 헤더·푸터 있음) | 'bare'(견적서·시안 확인처럼 따로 열리는 창: 헤더·푸터 없음)
      nocs    true 면 빠른 상담(하단 상담 바·우측 플로팅)을 감춘다
      win     true 면 따로 열리는 창(회색 바탕 + .win__bar 머리줄). shell 은 'bare' 로 함께 적는다
      sections 이 파일이 맡는 요소 목록의 절 이름들(## 제목 그대로). tools/check.py els 가 이 절의 항목이 다 있는지 본다
      auth    'member'(기본) | 'guest' : 기본 상태에서 로그인 여부
      scripts 추가로 불러올 js 목록
      states  [[키, 이름], ...] : ?state=키 로 볼 수 있는 상태. 첫 항목이 기본 상태
  그 아래 : <main> 안에 들어갈 내용
  `<!--@after-->` 아래 : 푸터 뒤에 둘 팝업·패널

헤더·푸터는 index.html 에서 잘라 그대로 넣는다. 조각에서 다시 쓰지 않는다.
사용: python3 tools/build.py            (전부)
      python3 tools/build.py cart login  (일부만)
"""
import json, os, re, sys, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / 'tools' / 'pages'
V_HOME = '20261116'
V_SUB = '20261117'

HOME_CSS = ['ds-blue', 'site', 'v4', 'v8-base', 'v8', 'ui-v8', 'v9', 'v10']


def shell_parts():
    src = (ROOT / 'index.html').read_text(encoding='utf-8')
    head_script = src[src.index('<script>'):src.index('</script>') + len('</script>')]
    h0 = src.index('<header class="site-head v9h" id="siteHead">')
    h1 = src.index('<main id="main"')
    f0 = src.index('<footer class="ft">')
    f1 = src.index('<!-- 빠른 보기 -->')
    return head_script, src[h0:h1].rstrip() + '\n', src[f0:f1].rstrip() + '\n'


def parse_fragment(path):
    raw = path.read_text(encoding='utf-8')
    m = re.match(r'\s*<!--(\{.*?\})-->\s*', raw, re.S)
    if not m:
        raise SystemExit('%s: 첫머리에 페이지 정보 <!--{...}--> 가 없다' % path.name)
    meta = json.loads(m.group(1))
    body = raw[m.end():]
    after = ''
    if '<!--@after-->' in body:
        body, after = body.split('<!--@after-->', 1)
    meta.setdefault('shell', 'full')
    meta.setdefault('auth', 'member')
    meta.setdefault('scripts', [])
    meta.setdefault('states', [['default', '기본']])
    meta['file'] = path.stem + '.html'
    return meta, body.strip('\n'), after.strip('\n')


def render(meta, body, after, parts):
    head_script, header, footer = parts
    e = html.escape
    css = '\n'.join('<link rel="stylesheet" href="css/%s.css?v=%s">' % (c, V_HOME) for c in HOME_CSS[:2])
    css2 = '\n'.join('<link rel="stylesheet" href="css/%s.css?v=%s">' % (c, V_HOME) for c in HOME_CSS[2:])
    scripts = []
    if meta['shell'] == 'full':
        scripts.append('<script src="js/site-v10.js?v=%s" defer></script>' % V_HOME)
    scripts.append('<script src="js/sub.js?v=%s" defer></script>' % V_SUB)
    for s in meta['scripts']:
        v = V_HOME if s in ('js/catalog.js', 'js/brands.js', 'js/rank.js', 'js/extra.js', 'js/reviews.js') else V_SUB
        scripts.append('<script src="%s?v=%s" defer></script>' % (s, v))
    battr = ' data-page="%s" data-shell="%s" data-auth="%s"' % (meta['file'][:-5], meta['shell'], meta['auth'])
    if meta.get('nocs'):
        battr += ' data-nocs'
    if meta.get('win'):
        battr += ' data-win'
    out = ['<!DOCTYPE html>', '<html lang="ko" data-accent="blue" data-claim="on">', '<head>', head_script,
           '<meta charset="utf-8">', '<meta name="robots" content="noindex,nofollow">',
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
           '<title>%s | 비투비티</title>' % e(meta['title']),
           '<meta name="description" content="%s">' % e(meta.get('desc', '')),
           '<link rel="icon" type="image/png" href="img/b2bt-v2-h56.png">',
           '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>',
           '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">',
           css,
           '<link rel="preconnect" href="https://fonts.googleapis.com">',
           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">',
           css2,
           '<link rel="stylesheet" href="css/sub.css?v=%s">' % V_SUB,
           '\n'.join(scripts), '</head>', '<body%s>' % battr]
    if meta['shell'] == 'full':
        out.append(header.rstrip())
    out.append('<main id="main" class="v4 v5 v6 v7 v8 v9 v10 subp">')
    out.append(body)
    if after:
        out.append(after)   # 팝업·옆 패널도 <main> 안에 둔다(.subp 범위 안이어야 공용 부품 스타일이 먹는다)
    out.append('</main>')
    if meta['shell'] == 'full':
        out.append(footer.rstrip())
    out += ['</body>', '</html>', '']
    return '\n'.join(out)


GROUPS = {
    0: '공용 부품 견본', 1: '1. 상품 목록', 2: '2. 상품 상세', 3: '3. 장바구니·주문·결제', 4: '4. 견적문의', 5: '5. 로그인·회원가입',
    6: '6. 마이페이지·시안', 7: '7. 고객센터·후기·이벤트·납품사례·제휴', 8: '8. 견적서·약관·정책·기타',
}


def put(path, text):
    """다른 작업자가 같은 때에 읽어도 반쯤 쓰인 파일을 보지 않게, 임시 파일에 쓴 뒤 바꿔치기한다."""
    tmp = path.with_name('.%s.%d.tmp' % (path.name, os.getpid()))
    tmp.write_text(text, encoding='utf-8')
    os.replace(tmp, path)


# 하위 페이지 CSS 는 모든 선택자 앞에 '.subp ' 를 붙여 <main class="... subp"> 안에서만 먹게 한다.
# (홈 CSS 의 '.v4 h1' 같은 규칙보다 항상 우선하고, 홈과 클래스 이름이 겹쳐도 홈 화면에 영향을 주지 않는다.)
# 아래로 시작하는 선택자는 그대로 둔다: html·body·:root·:where·#main·.subp, 헤더에 덧붙이는 부품(.hd- .hd__ .mh__ .v9h .am .dr-pane .side-cs), [data-st], 아이콘(.i)
KEEP = re.compile(r'^(html|body|:root|:where|#main|\.subp(?![\w-])|\.hd[_-]|\.mh__|\.v9h|\.am |\.dr-pane|\.side-cs|\[data-st|\.i(?![\w])|\*)')


def split_top(s):
    parts, depth, cur = [], 0, ''
    for ch in s:
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return parts


def scope_css(css):
    out, i, n = [], 0, len(css)
    while i < n:
        m = re.match(r'\s+', css[i:])
        if m:
            out.append(m.group(0)); i += m.end(); continue
        if css.startswith('/*', i):
            j = css.index('*/', i) + 2
            out.append(css[i:j]); i = j; continue
        j = css.find('{', i)
        if j < 0:
            out.append(css[i:]); break
        head = css[i:j]
        depth, k = 1, j + 1
        while k < n and depth:
            if css.startswith('/*', k):
                k = css.index('*/', k) + 2; continue
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        hs = head.strip()
        if hs.startswith('@media') or hs.startswith('@supports'):
            out.append(head + '{' + scope_css(body) + '}')
        elif hs.startswith('@'):
            out.append(head + '{' + body + '}')
        else:
            sels = [x.strip() for x in split_top(hs)]
            out.append(','.join(x if KEEP.match(x) else '.subp ' + x for x in sels) + '{' + body + '}')
        i = k
    return ''.join(out)


def build_css():
    """tools/css/*.css 를 이름 순서로 이어 붙여 css/sub.css 를 만든다. 아이콘(95-)을 뺀 조각은 선택자 앞에 .subp 를 붙인다."""
    chunks = []
    for p in sorted((ROOT / 'tools' / 'css').glob('*.css')):
        text = p.read_text(encoding='utf-8').rstrip()
        try:
            chunks.append(text if p.name.startswith('95') else scope_css(text))
        except Exception as e:  # noqa  다른 작업자가 쓰는 중이라 문법이 깨진 조각은 그대로 넣는다
            print('  ! %s 를 읽지 못해 그대로 넣음: %s' % (p.name, e)); chunks.append(text)
    put(ROOT / 'css' / 'sub.css', '\n\n'.join(chunks) + '\n')
    return len(chunks)


def state_href(m, key):
    if key == 'default':
        return m['file']
    return m['file'] + '?' + (key if '=' in key else 'state=' + key)


def build_index(reg):
    """검수용 목록 pages.html: 모든 페이지와 상태로 가는 링크."""
    e = html.escape
    rows = []
    for g in sorted(GROUPS):
        ms = [m for m in reg if m.get('group') == g]
        if not ms:
            continue
        rows.append('<section class="pl__g"><h2 class="st">%s <small>페이지 %d · 상태 %d</small></h2><div class="pl__list">' % (e(GROUPS[g]), len(ms), sum(len(m['states']) for m in ms)))
        for m in ms:
            links = ''.join('<a class="fchip fchip--s" href="%s">%s</a>' % (e(state_href(m, k)), e(label)) for k, label in m['states'][1:])
            rows.append('<article class="pl__p"><div class="pl__h"><a class="pl__n" href="%s">%s</a><span class="pl__f">%s</span></div>%s</article>'
                        % (e(m['file']), e(m.get('name', m['title'])), e(m['file']), ('<div class="fchips">%s</div>' % links) if links else ''))
        rows.append('</div></section>')
    n_states = sum(len(m['states']) for m in reg)
    body = ('<section class="sub-head"><div class="wrap"><h1 class="sub-head__t">하위 페이지 검수 목록</h1>'
            '<p class="sub-head__d">페이지 이름을 누르면 기본 화면이, 아래 칩을 누르면 그 상태의 화면이 열립니다. 상태는 주소 뒤 <b>?state=키</b> 로 바뀝니다. 페이지 %d개, 상태 %d개입니다.</p>'
            '<p class="sub-head__d"><a class="lnk" href="index.html">홈 시안 보기 <i aria-hidden="true">→</i></a>　<a class="lnk" href="review/golden.html">대표 페이지 캡처 모음 <i aria-hidden="true">→</i></a></p>'
            '</div></section><div class="wrap sub-body pl">%s</div>' % (len(reg), n_states, '\n'.join(rows)))
    meta = {'title': '하위 페이지 검수 목록', 'desc': '비투비티 하위 페이지 시안의 모든 페이지와 상태 목록', 'shell': 'bare', 'auth': 'guest', 'scripts': [], 'file': 'pages.html'}
    put(ROOT / 'pages.html', render(meta, body, '', shell_parts()))


def main():
    parts = shell_parts()
    only = set(a for a in sys.argv[1:] if not a.startswith('--'))
    n_css = build_css()
    reg = []
    for path in sorted(PAGES.glob('*.html')):
        try:
            meta, body, after = parse_fragment(path)
        except (SystemExit, Exception) as e:  # noqa  다른 작업자가 쓰는 중인 조각은 건너뛴다
            print('  ! %s 건너뜀: %s' % (path.name, str(e)[:120])); continue
        reg.append(meta)
        if only and path.stem not in only:
            continue
        put(ROOT / meta['file'], render(meta, body, after, parts))
    reg.sort(key=lambda m: (m.get('group', 9), m.get('order', 50), m['file']))
    put(ROOT / 'spec' / 'pages.json', json.dumps({
        'about': 'tools/build.py 가 tools/pages/*.html 의 페이지 정보에서 만든 목록. 점검 스크립트와 pages.html 이 이 파일을 쓴다.',
        'pages': [{k: m[k] for k in ('file', 'title', 'name', 'group', 'type', 'shell', 'auth', 'sections', 'states') if k in m} for m in reg],
    }, ensure_ascii=False, indent=1))
    build_index(reg)
    n_states = sum(len(m['states']) for m in reg)
    print('페이지 %d개, 상태 %d개 → spec/pages.json, pages.html · css/sub.css (조각 %d개)' % (len(reg), n_states, n_css))


if __name__ == '__main__':
    main()
