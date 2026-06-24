with open('frontend/src/components/Portals/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(2329, min(2420, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
