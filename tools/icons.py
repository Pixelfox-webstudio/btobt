#!/usr/bin/env python3
"""하위 페이지 아이콘(CSS 마스크) 생성기 → tools/css/95-icons.css

쓰는 법(HTML): <i class="i i-search" aria-hidden="true"></i>
- 색은 글자색(currentColor), 크기는 font-size(기본 20px). 예: style 없이 .i--16 / .i--24 / .i--28 클래스.
- 선 굵기는 DESIGN.md 아이콘 규칙(24 격자, 1.6 / 화살표·닫기·체크 2)을 따른다.
사용: python3 tools/icons.py
"""
import pathlib
from urllib.parse import quote

OUT = pathlib.Path(__file__).resolve().parent / 'css' / '95-icons.css'

# 이름: (선 굵기, 안쪽 svg 요소)  — fill 아이콘은 굵기 0
ICONS = {
    'search': (1.6, '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.4 15.4 5 5"/>'),
    'user': (1.6, '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.5 20.2c.9-3.7 3.9-5.7 7.5-5.7s6.6 2 7.5 5.7"/>'),
    'bag': (1.6, '<path d="M5.5 8h13l-1 12.5h-11L5.5 8z"/><path d="M9 8V6.6a3 3 0 0 1 6 0V8"/>'),
    'heart': (1.6, '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    'heart-on': (0, '<path d="M12 20.6s-7.6-4.7-7.6-10.6a4.6 4.6 0 0 1 7.6-3.4 4.6 4.6 0 0 1 7.6 3.4c0 5.9-7.6 10.6-7.6 10.6z"/>'),
    'x': (2, '<path d="M6 6l12 12M18 6 6 18"/>'),
    'check': (2, '<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    'arrow-r': (2, '<path d="M5 12h14M13 6l6 6-6 6"/>'),
    'arrow-l': (2, '<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    'chev-r': (2, '<path d="M9.5 6l6 6-6 6"/>'),
    'chev-l': (2, '<path d="M14.5 6l-6 6 6 6"/>'),
    'chev-d': (2, '<path d="M6 9.5l6 6 6-6"/>'),
    'chev-u': (2, '<path d="M6 14.5l6-6 6 6"/>'),
    'first': (2, '<path d="M12.5 6l-6 6 6 6M18 6l-6 6 6 6"/>'),
    'last': (2, '<path d="M11.5 6l6 6-6 6M6 6l6 6-6 6"/>'),
    'plus': (2, '<path d="M12 5.5v13M5.5 12h13"/>'),
    'minus': (2, '<path d="M5.5 12h13"/>'),
    'filter': (1.6, '<path d="M4 7.5h8M18 7.5h2M4 16.5h2M12 16.5h8"/><circle cx="15" cy="7.5" r="2.4"/><circle cx="9" cy="16.5" r="2.4"/>'),
    'phone': (1.6, '<path d="M8.6 4.25H6.1a1.6 1.6 0 0 0-1.6 1.75c.75 7.25 6.25 12.75 13.5 13.5a1.6 1.6 0 0 0 1.75-1.6v-2.5a1 1 0 0 0-.75-.97l-3-.8a1 1 0 0 0-.98.27l-1.5 1.5a11 11 0 0 1-4.9-4.9l1.5-1.5a1 1 0 0 0 .27-.98l-.8-3a1 1 0 0 0-.97-.75Z"/>'),
    'chat': (1.6, '<path d="M12 4.5c-4.7 0-8.25 3.05-8.25 6.9 0 2.3 1.3 4.33 3.3 5.6l-.8 3.25 3.7-2.05c.66.13 1.34.2 2.05.2 4.7 0 8.25-3.05 8.25-6.9S16.7 4.5 12 4.5Z"/>'),
    'pen': (1.6, '<path d="M4.75 19.25h14.5"/><path d="M14.5 5.25l3.25 3.25L9.25 17H6v-3.25z"/>'),
    'file': (1.6, '<path d="M7 3.75h7l4 4v12.5H7z"/><path d="M14 3.75v4h4"/>'),
    'doc': (1.6, '<path d="M6.5 3.75h11v16.5h-11z"/><path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3"/>'),
    'clip': (1.6, '<path d="M19 11.5l-7.2 7.2a4.2 4.2 0 0 1-6-6l7.6-7.6a2.8 2.8 0 0 1 4 4l-7.5 7.5a1.4 1.4 0 0 1-2-2l6.8-6.8"/>'),
    'upload': (1.6, '<path d="M12 15.5V5M7.5 9.5 12 5l4.5 4.5M5 19h14"/>'),
    'download': (1.6, '<path d="M12 5v10.5M7.5 11l4.5 4.5 4.5-4.5M5 19h14"/>'),
    'trash': (1.6, '<path d="M5 7.5h14M10 7.5V5.5h4v2M7 7.5l.8 12h8.4l.8-12"/>'),
    'info': (1.6, '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8h.01"/>'),
    'alert': (1.6, '<path d="M12 4.5 3.5 19h17L12 4.5z"/><path d="M12 10v4.5M12 16.8h.01"/>'),
    'help': (1.6, '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.7a2.4 2.4 0 1 1 3.5 2.1c-.8.4-1.2 1-1.2 1.8M12 16.6h.01"/>'),
    'cal': (1.6, '<path d="M4.5 6h15v13.5h-15zM4.5 10.5h15M8.5 4v3.5M15.5 4v3.5"/>'),
    'truck': (1.6, '<path d="M3.5 6.5H14v10H3.5zM14 10h3.5l3 3v3.5H14"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    'box': (1.6, '<path d="M12 3.5l8 4.2v8.6l-8 4.2-8-4.2V7.7l8-4.2z"/><path d="M4 7.7l8 4.3 8-4.3M12 12v8.5"/>'),
    'card': (1.6, '<path d="M3.5 6h17v12h-17zM3.5 10h17M7 14.5h3"/>'),
    'copy': (1.6, '<path d="M8.5 8.5h11v11h-11z"/><path d="M5 15.5V4.5h11"/>'),
    'eye': (1.6, '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.8"/>'),
    'eye-off': (1.6, '<path d="M5.2 8.6C3.8 10 3 12 3 12s3.5 6 9 6c1.4 0 2.7-.4 3.8-1M9.2 6.5A8.6 8.6 0 0 1 12 6c5.500 0 9 6 9 6s-.9 1.600-2.500 3.100M4 4l16 16"/>'),
    'pin': (1.6, '<path d="M12 20.5s6.5-5.6 6.500-10.500a6.500 6.500 0 0 0-13 0c0 4.900 6.500 10.500 6.500 10.500z"/><circle cx="12" cy="10" r="2.3"/>'),
    'star': (0, '<path d="M12 2.6l2.9 6.100 6.700.800-4.900 4.600 1.300 6.600L12 17.400l-6 3.300 1.300-6.600-4.900-4.600 6.700-.800z"/>'),
    'image': (1.6, '<path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="1.600"/><path d="M4.500 17l4.500-4.500 3.500 3.500 2.500-2.500 4.500 4.500"/>'),
    'building': (1.6, '<path d="M5 20V5.500h9V20M14 9.500h5V20M3.500 20h17M8 9h3M8 12.500h3M8 16h3"/>'),
    'lock': (1.6, '<path d="M6 10.500h12v9H6z"/><path d="M8.500 10.500V8a3.500 3.500 0 0 1 7 0v2.500"/>'),
    'clock': (1.6, '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>'),
    'refresh': (1.6, '<path d="M19 12a7 7 0 1 1-2.050-4.950M19 5v3.500h-3.500"/>'),
    'mail': (1.6, '<path d="M3.500 6h17v12h-17z"/><path d="M4 7l8 6.500L20 7"/>'),
    'external': (1.75, '<path d="M7.500 16.500 16.500 7.500"/><path d="M9 7.500h7.500V15"/>'),
    'home': (1.6, '<path d="M4.500 11 12 4.500 19.500 11M6.500 9.500v10h11v-10"/>'),
    'receipt': (1.6, '<path d="M6.500 3.750h11v16.500l-2.750-1.500-2.750 1.500-2.750-1.500-2.750 1.500z"/><path d="M9.500 8.500h5M9.500 12h5"/>'),
    'shirt': (1.6, '<path d="M8.500 4.500 4 7.500l2 3.500 2-1V20h8V10l2 1 2-3.500-4.500-3a3.500 3.500 0 0 1-7 0z"/>'),
    'coin': (1.6, '<circle cx="12" cy="12" r="8.500"/><path d="M9.500 9.500h5M9.500 12h5M12 12v4.500M10 8l2 4 2-4"/>'),
    'bell': (1.6, '<path d="M6.500 16.500V11a5.500 5.500 0 0 1 11 0v5.500l1.500 1.500H5z"/><path d="M10 20h4"/>'),
    'zoom': (1.6, '<circle cx="10.800" cy="10.800" r="6.300"/><path d="m15.400 15.400 5 5M10.800 8.300v5M8.300 10.800h5"/>'),
    'play': (0, '<path d="M8.500 6.600v10.800a.600.600 0 0 0 .920.500l8.400-5.400a.600.600 0 0 0 0-1L9.420 6.100a.600.600 0 0 0-.920.500z"/>'),
    'kakao': (0, '<path transform="scale(.09375)" d="M128 36C70.562 36 24 72.713 24 118c0 29.279 19.466 54.970 48.748 69.477-1.593 5.494-10.237 35.344-10.581 37.689 0 0-.207 1.762.934 2.434s2.483.150 2.483.150c3.272-.457 37.943-24.811 43.944-29.040 5.995.849 12.168 1.290 18.472 1.290 57.438 0 104-36.712 104-82 0-45.287-46.562-82-104-82z"/>'),
    'grid1': (1.6, '<path d="M5 5h14v14H5z"/>'),
    'grid2': (1.6, '<path d="M5 5h5.500v5.500H5zM13.500 5H19v5.500h-5.500zM5 13.500h5.500V19H5zM13.500 13.500H19V19h-5.500z"/>'),
    'send': (1.6, '<path d="M20 4 3.500 10.500l6.500 3 3 6.500L20 4zM10 13.500 20 4"/>'),
    'logout': (1.6, '<path d="M10 4.500H5v15h5M9.500 12H20M16 8l4 4-4 4"/>'),
    'insta': (1.6, '<rect x="4.5" y="4.5" width="15" height="15" rx="4.5"/><circle cx="12" cy="12" r="3.4"/><path d="M16.4 7.6h.01"/>'),
    'youtube': (1.6, '<rect x="3.5" y="6.5" width="17" height="11" rx="3.5"/><path d="M10.5 9.6v4.8l4.2-2.4z"/>'),
    'nblog': (1.6, '<path d="M5 5.5h14v10h-4.8L12 18.2l-2.2-2.7H5z"/><path d="M9.6 12.6v-4l4.8 4v-4"/>'),
    'undo': (1.6, '<path d="M5 9.500h9a5 5 0 0 1 0 10H8M5 9.500l4-4M5 9.500l4 4"/>'),
}


def css():
    out = ['/* ===== 아이콘(마스크). tools/icons.py 가 만든다. 직접 고치지 않는다 ===== */',
           '.i{display:inline-block;flex:none;width:1em;height:1em;font-size:20px;background:currentColor;vertical-align:-.2em;'
           '-webkit-mask:var(--i) center/contain no-repeat;mask:var(--i) center/contain no-repeat}',
           '.i--14{font-size:14px}.i--16{font-size:16px}.i--18{font-size:18px}.i--22{font-size:22px}.i--24{font-size:24px}.i--28{font-size:28px}.i--32{font-size:32px}']
    for name, (sw, inner) in ICONS.items():
        inner = inner.replace('.500', '.5').replace('.600', '.6').replace('.800', '.8').replace('.900', '.9').replace('.300', '.3').replace('.100', '.1').replace('.400', '.4').replace('.200', '.2').replace('.700', '.7')
        if sw:
            svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % (sw, inner)
        else:
            svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000">%s</svg>' % inner
        out.append('.i-%s{--i:url("data:image/svg+xml,%s")}' % (name, quote(svg, safe="/:=' ")))
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(css(), encoding='utf-8')
    print('아이콘 %d개 → %s' % (len(ICONS), OUT.name))
