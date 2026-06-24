import sys
import codecs
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

with open('frontend/src/components/Portals/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for viewedClientId and find the JSX render block starting around line 2380 or similar
lines = content.split('\n')
start_line = 0
for i, line in enumerate(lines):
    if 'viewedClientId &&' in line:
        start_line = i
        break

if start_line > 0:
    print(f"Found viewedClientId modal start at line {start_line+1}")
    # print about 200 lines from start_line
    for idx in range(start_line, min(start_line + 250, len(lines))):
        print(f"{idx+1}: {lines[idx]}")
else:
    print("Could not find viewedClientId modal start line.")
