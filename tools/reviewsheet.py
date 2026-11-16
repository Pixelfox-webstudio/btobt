#!/usr/bin/env python3
"""검수용 모음 그림: 한 페이지의 모든 상태 캡처(review/shots/<페이지>/)를 몇 장으로 붙여 review/sheets/ 에 저장한다.
먼저 `python3 tools/check.py pages <페이지>` 로 캡처를 만든 뒤에 쓴다.
사용: python3 tools/reviewsheet.py 페이지이름 [...]      → 만든 파일 이름을 출력한다
  <페이지>-pc-N.png  : Chromium 1440 (상태 3개씩, 위에서 2000px 까지)
  <페이지>-m-N.png   : Chromium 390 (상태 6개씩, 위에서 2400px 까지)
  <페이지>-etc.png   : 기본 상태의 1024 · 768 · WebKit 1710 · WebKit 390"""
import sys, json, re, hashlib, pathlib
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'review' / 'sheets'
OUT.mkdir(parents=True, exist_ok=True)
def slug(key):
    base = re.sub(r'[^a-z0-9]+', '-', key.lower()).strip('-') or 'default'
    if re.search(r'[^\x00-\x7f]', key):
        base += '-' + hashlib.md5(key.encode('utf-8')).hexdigest()[:4]
    return base
def sheet(tiles, path):
    W = sum(t.size[0] for _, t in tiles) + 14 * (len(tiles) - 1)
    H = max(t.size[1] for _, t in tiles) + 22
    im = Image.new('RGB', (W, H), '#B8B8BE'); d = ImageDraw.Draw(im); x = 0
    for label, t in tiles:
        im.paste(t, (x, 22)); d.text((x + 3, 5), label, fill='black'); x += t.size[0] + 14
    im.save(path); print(path.relative_to(ROOT), im.size)
def tile(f, scale, max_h):
    im = Image.open(f).convert('RGB')
    if im.size[1] > max_h: im = im.crop((0, 0, im.size[0], max_h))
    return im.resize((int(im.size[0] * scale), int(im.size[1] * scale)))
reg = {p['file'][:-5]: p for p in json.loads((ROOT / 'spec' / 'pages.json').read_text(encoding='utf-8'))['pages']}
for name in sys.argv[1:]:
    p = reg.get(name)
    if not p: print('모르는 페이지:', name); continue
    d = ROOT / 'review' / 'shots' / name
    sts = [(st[0], st[1], slug(st[0])) for st in p['states']]
    for kind, suffix, per, scale, max_h in (('pc', 'c1440', 3, 0.5, 2000), ('m', 'c390', 6, 0.8, 2400)):
        tiles = [('%s | %s' % (k[:28], l[:22]), tile(d / ('%s-%s.jpg' % (s, suffix)), scale, max_h)) for k, l, s in sts if (d / ('%s-%s.jpg' % (s, suffix))).exists()]
        for i in range(0, len(tiles), per):
            sheet(tiles[i:i + per], OUT / ('%s-%s-%d.png' % (name, kind, i // per + 1)))
    s0 = sts[0][2]
    etc = [(v, tile(d / ('%s-%s.jpg' % (s0, v)), sc, 2000)) for v, sc in (('c1024', 0.5), ('c768', 0.55), ('w1710', 0.45), ('w390', 0.8)) if (d / ('%s-%s.jpg' % (s0, v))).exists()]
    if etc: sheet(etc, OUT / ('%s-etc.png' % name))
