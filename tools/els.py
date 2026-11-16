#!/usr/bin/env python3
"""요소 목록에서 페이지 절의 항목을 줄 번호(L…)와 함께 보여 준다. 페이지를 만들 때 data-el 에 적을 번호를 찾는 용도.
사용: python3 tools/els.py "광고 수신거부" ["상품 상세" ...]     (이름 일부만 적어도 된다)
      python3 tools/els.py --todo [이름]                          (coverage.json 에서 아직 남은 항목만)"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import coverage_init
ROOT = pathlib.Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
todo = '--todo' in sys.argv
status = {}
if todo:
    status = {i['id']: i['status'] for i in json.loads((ROOT / 'spec' / 'coverage.json').read_text(encoding='utf-8'))['items']}
last = None
for it in coverage_init.parse():
    if args and not any(a in it['page'] for a in args):
        continue
    if todo and status.get(it['id']) in ('done', 'na'):
        continue
    if it['page'] != last:
        print('\n## ' + it['page']); last = it['page']; g = None
    print('%-6s %s%s%s' % (it['id'], '  ' * it['depth'], '[%s] ' % it['group'][:2] if it['depth'] == 0 else '', it['text']))
