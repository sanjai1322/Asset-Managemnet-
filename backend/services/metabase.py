import jwt
import time
import os
from dotenv import load_dotenv

load_dotenv()

METABASE_SECRET_KEY = os.getenv("METABASE_SECRET_KEY")
METABASE_URL = os.getenv("METABASE_URL")

def generate_metabase_token(dashboard_id: int):
    payload = {
        "resource": {"dashboard": dashboard_id},
        "params": {},
        "exp": round(time.time()) + (60 * 10)  # 10 minute expiry
    }
    token = jwt.encode(payload, METABASE_SECRET_KEY, algorithm="HS256")
    iframe_url = f"{METABASE_URL}/embed/dashboard/{token}#bordered=false&titled=true"
    return iframe_url
