with open('frontend/src/components/Portals/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find occurrences of activeMetricsModal in the JSX
matches = []
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'activeMetricsModal' in line:
        matches.append((i+1, line))

print("Found occurrences of activeMetricsModal:")
for m in matches:
    print(f"Line {m[0]}: {m[1]}")
