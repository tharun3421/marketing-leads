with open(r"C:\Users\user\.gemini\antigravity\scratch\marketing-lead-collector\frontend\src\components\Portals\AdminPortal.jsx", "r", encoding="utf-8") as f:
    for idx, line in enumerate(f, 1):
        if "client.clientId || 'N/A'" in line and idx > 1500:
            print(f"{idx} - {line.strip()}")
