#!/usr/bin/env python3
"""캡처 여러 장을 한 장으로 나란히 붙여 눈으로 보기 좋게 만든다.
사용: python3 tools/sheet.py 출력.png 높이 그림1 그림2 ...   (각 그림을 같은 높이로 줄여 옆으로 붙인다. 높이를 넘는 긴 그림은 위에서부터 자른다)"""
import sys
from PIL import Image
out, H, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = []
for f in files:
    im = Image.open(f).convert('RGB')
    w = im.size[0]
    scale = float(sys.argv[0] and 1)
    ims.append(im)
# 폭 기준 축소: PC(>=1000) 는 0.5, 태블릿 0.6, 폰 0.8 → 그 뒤 높이 H 로 자름
tiles = []
for im in ims:
    w, h = im.size
    s = 0.5 if w >= 1400 else 0.6 if w >= 1000 else 0.7 if w >= 700 else 0.85
    im = im.resize((int(w * s), int(h * s)))
    if im.size[1] > H:
        im = im.crop((0, 0, im.size[0], H))
    tiles.append(im)
W = sum(t.size[0] for t in tiles) + 16 * (len(tiles) - 1)
sheet = Image.new('RGB', (W, max(t.size[1] for t in tiles)), '#D0D0D4')
x = 0
for t in tiles:
    sheet.paste(t, (x, 0)); x += t.size[0] + 16
sheet.save(out)
print(out, sheet.size)
