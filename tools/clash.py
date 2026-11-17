#!/usr/bin/env python3
"""sub.css 에서 새로 정의한 클래스 이름이 홈 CSS(ds-blue~v10)에 이미 있는지 찾는다. 겹치면 홈 규칙이 섞여 들어온다.
홈 클래스를 일부러 다시 쓰는 경우(.bt, .pc, .qty, .wrap 등)는 ALLOW 에 적어 둔다.
사용: python3 tools/clash.py"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
ALLOW = set('side-cs__btn--kakao side-cs__btn--menu bt bt--ink bt--acc bt--line bt--wh pbtn lnk arw hq pc pc__media pc__acts pc__sw pc__cat pc__name pc__meta pc__ms pc__price pc__rank pc__swmore pc__quote act act--like act--cart act--view dot qty wrap num sr-only '
            'toast badge tabs tab bh bh__in bh__scroll bh__list bh__tab bh__logo bh--logo vh vh__t vh--row vh__r tt__pre tt__key sh sh__t sh__d sh--c psec psec__body psec__more psec--tint pgrid md__rail rv__card rv__gal rv__ph rv__body rv__stars rv__meta rv__co rv__item rv__text rv__tag rv__list rv__rest rv__play '
            'hd__icon hd__right hd__icons mh__btn mbar side-cs side-cs__btn bz__link am dr-pane dr-login hd-sx hd-sx__title hd-sx__empty fd__note ss__hero ss__copy ss__t ss__d is-on is-open is-err is-ok is-busy is-done is-over js v9h ic vm vm__dim vm__box vm__x bi bi__logo bi__name bi__cnt'.split())
def classes(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'url\("[^"]*"\)', '', css)
    names = set()
    for sel in re.findall(r'([^{}]+)\{', css):
        if sel.strip().startswith('@'):
            continue
        names |= set(re.findall(r'\.(-?[a-zA-Z_][\w-]*)', sel))
    return names
home = set()
where = {}
for f in ['ds-blue', 'site', 'v4', 'v8-base', 'v8', 'ui-v8', 'v9', 'v10']:
    for c in classes((ROOT / 'css' / (f + '.css')).read_text(encoding='utf-8')):
        home.add(c); where.setdefault(c, []).append(f)
sub = set()
for p in sorted((ROOT / 'tools' / 'css').glob('*.css')):
    sub |= classes(p.read_text(encoding='utf-8'))
bad = sorted(c for c in sub & home if c not in ALLOW)
print('sub.css 클래스 %d개 · 홈과 겹침 %d개' % (len(sub), len(bad)))
for c in bad:
    print('  .%s  ← %s' % (c, ', '.join(where[c])))
raise SystemExit(1 if bad else 0)
