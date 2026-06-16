with open(r"C:\Users\user\.gemini\antigravity\scratch\marketing-lead-collector\frontend\src\components\Portals\TechnicalPortal.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Posters" in line or "Videos" in line or "Websites" in line or "Campaigns" in line or "Total" in line:
        if "className" in line or "div" in line or "p" in line or "span" in line or "card" in line:
            print(f"L{i+1}: {line.strip()[:100]}")
