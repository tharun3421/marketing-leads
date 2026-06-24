import re

with open('frontend/src/components/Portals/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for some occurrences of modal display or stat card clicks
# Find references to "statCardClick" or similar, or lists of clients in modal
matches = []
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'Non-Allocated' in line or 'stat' in line.lower() or 'card' in line.lower():
        if 'modal' in line or 'click' in line or 'filter' in line:
            matches.append((i+1, line))

print("Found matches:")
for m in matches[:30]:
    print(f"Line {m[0]}: {m[1]}")
