#!/usr/bin/env python3
"""독립 검수 점수(review/scores/*.json)를 한 표(review/scores.md)로 모은다.

검수자가 과제마다 review/scores/<과제>.json 을 남긴다. 다시 채점하면 "rounds" 배열에 덧붙인다.
파일 모양이 조금씩 달라도 읽을 수 있게, 맨 마지막 채점 결과를 찾아 쓴다(다시 채점에서 빠진 항목은 앞선 점수를 이어 쓴다).
사용: python3 tools/scores.py
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / 'review' / 'scores'
ITEMS = [('elements', '요소'), ('states', '상태'), ('design', '규칙'), ('consistency', '홈과 일관성'), ('layout', '배치')]
ORDER = ['list', 'product', 'cart', 'result', 'quote', 'custom', 'auth', 'mypage', 'draft', 'center', 'content', 'quotedoc', 'policy']
NAMES = {
    'list': '상품 목록 · 수신거부', 'product': '상품 상세', 'cart': '장바구니 · 주문서', 'result': '주문 완료 · 카드 결제 처리',
    'quote': '견적문의', 'custom': '맞춤작업복 견적 · 파트너 제휴', 'auth': '로그인 · 회원가입', 'mypage': '마이페이지',
    'draft': '시안확인 · 견적문의 시안', 'center': '고객센터', 'content': '납품사례 · 구매후기 · 이벤트', 'quotedoc': '견적서 창',
    'policy': '약관 · 개인정보 문서',
}


def rounds_of(d):
    """파일 하나에서 채점 결과 목록(오래된 것부터)을 꺼낸다."""
    if isinstance(d, list):
        return [x for x in d if isinstance(x, dict)]
    out = []
    if isinstance(d.get('rounds'), list):
        out += [x for x in d['rounds'] if isinstance(x, dict)]
    if isinstance(d.get('scores'), dict) and not any(x.get('scores') == d['scores'] for x in out):
        out.append(d)
    return out


def merged(rs):
    sc, first = {}, None
    for r in rs:
        s = r.get('scores') or {}
        if first is None and s:
            first = dict(s)
        for k, _ in ITEMS:
            if isinstance(s.get(k), (int, float)):
                sc[k] = s[k]
    return first or {}, sc, rs[-1] if rs else {}


def main():
    rows, lows, all_scores = [], [], []
    files = {p.stem: p for p in DIR.glob('*.json')} if DIR.exists() else {}
    keys = [k for k in ORDER if k in files] + sorted(k for k in files if k not in ORDER)
    for k in keys:
        try:
            d = json.loads(files[k].read_text(encoding='utf-8'))
        except Exception as e:
            rows.append('| %s | 읽을 수 없음(%s) |||||||' % (NAMES.get(k, k), e))
            continue
        rs = rounds_of(d)
        first, sc, last = merged(rs)
        if not sc:
            continue
        vals = [sc.get(i) for i, _ in ITEMS]
        nums = [v for v in vals if isinstance(v, (int, float))]
        all_scores += nums
        cell = lambda i, v: ('**%d**' % v if v < 800 else '%d' % v) + ('' if first.get(i) in (None, v) else ' <small>(처음 %d)</small>' % first[i])
        rows.append('| %s | %s | %d | %s | %s |' % (
            NAMES.get(k, k), ' | '.join(cell(i, v) if isinstance(v, (int, float)) else '-' for (i, _), v in zip(ITEMS, vals)),
            min(nums) if nums else 0, len(rs), '%s / %s' % (last.get('checkPagesFailed', '-'), last.get('elsMissing', '-'))))
        for f in last.get('findings') or []:
            if isinstance(sc.get(f.get('item')), (int, float)) and sc[f['item']] < 800:
                lows.append('- %s · %s: %s' % (NAMES.get(k, k), f.get('page', ''), f.get('problem', '')))
    head = '| 묶음 | %s | 가장 낮은 점수 | 채점 횟수 | 화면 점검 실패 / 요소 빠짐 |\n|---|%s---:|---:|---|' % (
        ' | '.join(n for _, n in ITEMS), '---:|' * len(ITEMS))
    avg = sum(all_scores) / len(all_scores) if all_scores else 0
    md = ['# 독립 검수 점수', '',
          '만든 과정을 모르는 검수자가 묶음마다 다섯 항목을 0~1000점으로 매겼습니다. 800점 미만은 고친 뒤 그 항목만 다시 채점했습니다. 괄호 안은 처음 점수입니다.', '',
          '- 요소: 요소 목록의 요소가 빠짐없이 있는가', '- 상태: 빈 상태·오류·비로그인·처리 중·완료 화면을 볼 수 있는가',
          '- 규칙: DESIGN.md 의 색·글자·모서리·문구 규칙을 지켰는가', '- 홈과 일관성: 홈과 한 사이트로 보이는가', '- 배치: PC·모바일에서 깨지거나 어색한 곳이 없는가', '',
          head] + rows + ['', '전체 평균 %.0f점 · 묶음 %d개.' % (avg, len(rows))]
    md += ['', '## 아직 800점 미만인 지적', ''] + (lows or ['없음'])
    (ROOT / 'review' / 'scores.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print('점수 묶음 %d개 · 평균 %.0f · 800 미만 지적 %d건 → review/scores.md' % (len(rows), avg, len(lows)))


if __name__ == '__main__':
    main()
