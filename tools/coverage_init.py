#!/usr/bin/env python3
"""spec/page-elements.md 를 읽어 spec/coverage.json 의 항목 뼈대를 만든다.

- 요소 목록의 모든 요소 줄(목록 기호 '- ')이 항목 하나가 된다. 항목 id = 'L' + 줄 번호.
- '## 화면 없는 것' 절은 디자인 대상이 아니므로 넣지 않는다.
- 이미 coverage.json 이 있으면 file/state/selector/status/note 값은 그대로 두고 text 만 새로 맞춘다.
사용: python3 tools/coverage_init.py
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'spec' / 'page-elements.md'
OUT = ROOT / 'spec' / 'coverage.json'


def parse():
    items, page, group, skip = [], None, None, False
    for no, raw in enumerate(SRC.read_text(encoding='utf-8').split('\n'), 1):
        line = raw.rstrip()
        if line.startswith('## '):
            page = line[3:].strip()
            group = None
            skip = page == '화면 없는 것'
            continue
        if line.startswith('# '):
            continue
        if line.startswith('### '):
            group = line[4:].strip()
            continue
        m = re.match(r'^(\s*)- (.+)$', line)
        if not m or skip or page is None:
            continue
        items.append({
            'id': 'L%d' % no, 'line': no, 'page': page, 'group': group or '',
            'depth': len(m.group(1)) // 2, 'text': m.group(2).strip(),
        })
    return items


def main():
    old = {}
    if OUT.exists():
        for it in json.loads(OUT.read_text(encoding='utf-8')).get('items', []):
            old[it['id']] = it
    items = parse()
    for it in items:
        o = old.get(it['id'], {})
        it['file'] = o.get('file', '')
        it['state'] = o.get('state', '')
        it['selector'] = o.get('selector', '')
        it['status'] = o.get('status', 'todo')
        it['note'] = o.get('note', '')
    pages = {}
    for it in items:
        pages[it['page']] = pages.get(it['page'], 0) + 1
    OUT.write_text(json.dumps({
        'source': 'spec/page-elements.md',
        'about': '요소 목록의 요소 줄마다 항목 하나. status: todo(아직) / done(화면에 있음) / na(화면 요소가 아닌 서버 동작 — note 에 이유). '
                 'file·state·selector 는 tools/coverage_sync.py 가 채운다(HTML 의 data-el 속성과 spec/coverage-map.json).',
        'items': items,
    }, ensure_ascii=False, indent=1), encoding='utf-8')
    print('항목 %d개, 페이지 절 %d개' % (len(items), len(pages)))
    for p, n in pages.items():
        print('  %4d  %s' % (n, p))


if __name__ == '__main__':
    main()
