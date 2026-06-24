with open('frontend/src/components/Portals/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- Lines 1210 to 1250 ---")
for idx in range(1209, min(1250, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")

print("\n--- Lines 1380 to 1470 ---")
for idx in range(1379, min(1470, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
