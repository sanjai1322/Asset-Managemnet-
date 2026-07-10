import requests
import sys

BASE_URL = "http://localhost:8000/api"

print("1. Testing /api/hello...")
try:
    r = requests.get(f"{BASE_URL}/hello")
    r.raise_for_status()
    print("   Success:", r.json())
except Exception as e:
    print(f"   Failed: {e}")
    sys.exit(1)

print("\n2. Testing /api/auth/mock...")
try:
    r = requests.post(f"{BASE_URL}/auth/mock", json={
        "email": "admin@acme.com",
        "name": "Admin",
        "role": "admin"
    })
    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        print("   Failed: No access token in response")
        sys.exit(1)
    print("   Success: Logged in as mock user, got token.")
except Exception as e:
    print(f"   Failed: {e}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

print("\n3. Testing /api/assets (GET)...")
try:
    r = requests.get(f"{BASE_URL}/assets", headers=headers)
    r.raise_for_status()
    assets = r.json()
    print(f"   Success: Retrieved {len(assets)} assets.")
    if len(assets) == 0:
        print("   Warning: Expected seed data but got 0 assets.")
except Exception as e:
    print(f"   Failed: {e}")
    sys.exit(1)

print("\n4. Testing /api/stats (GET)...")
try:
    r = requests.get(f"{BASE_URL}/stats", headers=headers)
    r.raise_for_status()
    stats = r.json()
    print(f"   Success: Got stats -> Total Assets: {stats.get('total_assets')}, Utilization: {stats.get('utilization_percent'):.1f}%")
except Exception as e:
    print(f"   Failed: {e}")
    sys.exit(1)

print("\nAll backend integration tests passed against PostgreSQL!")
