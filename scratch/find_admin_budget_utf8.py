import sys
import codecs
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

with open('frontend/src/components/Portals/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer(r'adBudget', content)]
for m in matches[:15]:
    start = max(0, content.rfind('\n', 0, m))
    end = content.find('\n', m)
    print(content[start:end])
