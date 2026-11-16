#!/bin/zsh
# 작업자들이 공용·홈 파일을 건드렸는지, 새 페이지 조각이 몇 개 생겼는지 1분마다 본다.
# 공용 파일이 바뀌면 바로, 새 조각이 N개 이상이면, 아니면 최대 M분 뒤에 끝난다.
cd "$(dirname "$0")/.."
N=${1:-4}; M=${2:-30}
PROTECTED="index.html css/ds-blue.css css/site.css css/v4.css css/v8-base.css css/v8.css css/ui-v8.css css/v9.css css/v10.css js/site-v10.js js/v10.js js/bgfx.js js/catalog.js js/brands.js js/rank.js js/extra.js js/reviews.js tools/build.py tools/check.py tools/coverage_init.py tools/els.py tools/clash.py tools/icons.py tools/reviewsheet.py tools/refsheet.py tools/sheet.py tools/css/00-base.css tools/css/10-form.css tools/css/20-list.css tools/css/90-index.css tools/css/95-icons.css js/sub.js js/sub-data.js js/sub-list.js spec/coverage-map.json spec/agent-brief.md DESIGN.md tools/pages/category.html tools/pages/brand.html tools/pages/search.html tools/pages/kit.html tools/pages/unsubscribe.html"
BASE=$(ls tools/pages | wc -l | tr -d ' ')
for i in $(seq 1 $M); do
  CH=$(git diff --name-only HEAD -- ${=PROTECTED} 2>/dev/null)
  if [ -n "$CH" ]; then echo "공용 파일 변경: $CH"; exit 3; fi
  NOW=$(ls tools/pages | wc -l | tr -d ' ')
  if [ $((NOW - BASE)) -ge $N ]; then echo "새 조각 $((NOW - BASE))개: $(ls -t tools/pages | head -$((NOW - BASE)) | tr '\n' ' ')"; exit 0; fi
  sleep 60
done
echo "시간 끝: 새 조각 $(( $(ls tools/pages | wc -l) - BASE ))개"; exit 0
