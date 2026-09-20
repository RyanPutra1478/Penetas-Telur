import json
import urllib.request
import urllib.error
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://tetasco.my.id"

def test_endpoint(method, path, data=None):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "Tetasco-Tester/1.0"}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
            content = resp.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(content)
                return code, parsed
            except Exception:
                return code, content[:200]
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body[:200]
    except Exception as e:
        return 0, str(e)

endpoints = [
    ("GET", "/"),
    ("GET", "/api/health"),
    ("GET", "/api/database/health"),
    ("GET", "/api/tetasco"),
    ("GET", "/openapi.json"),
]

print(f"=== TESTING BASE URL: {BASE_URL} ===\n")

tetasco_id = 1

for method, path in endpoints:
    code, res = test_endpoint(method, path)
    status_icon = "✅" if code == 200 else "❌"
    print(f"{status_icon} [{code}] {method} {path}")
    print(f"    Response: {json.dumps(res, indent=2) if isinstance(res, (dict, list)) else res}\n")

# Check if we got tetasco devices
code, tetasco_list = test_endpoint("GET", "/api/tetasco")
if code == 200 and isinstance(tetasco_list, list) and len(tetasco_list) > 0:
    first_item = tetasco_list[0]
    tetasco_id = first_item.get("id", 1)
    print(f"ℹ️ Menggunakan tetasco_id: {tetasco_id} ({first_item.get('name', 'N/A')})")

print(f"\n=== TESTING ENDPOINTS UNTUK TETASCO ID {tetasco_id} ===\n")
device_endpoints = [
    ("GET", f"/api/tetasco/{tetasco_id}"),
    ("GET", f"/api/tetasco/{tetasco_id}/sensors"),
    ("GET", f"/api/tetasco/{tetasco_id}/sensors/history"),
    ("GET", f"/api/tetasco/{tetasco_id}/devices"),
]

for method, path in device_endpoints:
    code, res = test_endpoint(method, path)
    status_icon = "✅" if code == 200 else "❌"
    print(f"{status_icon} [{code}] {method} {path}")
    print(f"    Response: {json.dumps(res, indent=2) if isinstance(res, (dict, list)) else res}\n")
