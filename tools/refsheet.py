#!/usr/bin/env python3
"""레퍼런스 캡처 여러 장을 한 장으로 붙인다(직접 눈으로 보기 위한 용도).
사용: python3 tools/refsheet.py 출력.png 칸폭 최대높이 그림...   (각 그림을 칸폭에 맞춰 줄이고, 위에서부터 최대높이까지만 붙인다)"""
import sys
from PIL import Image, ImageDraw
out, cw, mh, files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
tiles = []
for f in files:
    im = Image.open(f).convert('RGB')
    s = cw / im.size[0]
    im = im.resize((cw, int(im.size[1] * s)))
    if im.size[1] > mh:
        im = im.crop((0, 0, cw, mh))
    tiles.append((f.split('/')[-1], im))
W = (cw + 12) * len(tiles) - 12
H = max(t[1].size[1] for t in tiles) + 18
sheet = Image.new('RGB', (W, H), '#C8C8CC')
d = ImageDraw.Draw(sheet)
for i, (n, t) in enumerate(tiles):
    sheet.paste(t, (i * (cw + 12), 18)); d.text((i * (cw + 12) + 2, 3), n, fill='black')
sheet.save(out); print(out, sheet.size)
