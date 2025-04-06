import os
import firebase_admin
from firebase_admin import auth, credentials

# Initialize Firebase Admin SDK once per container using the local service account JSON.
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)


def lambda_handler(event, context):
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")

    if not auth_header:
        return {"isAuthorized": False}

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return {"isAuthorized": False}

    token = parts[1]

    try:
        # Verify the Firebase token.
        decoded_token = auth.verify_id_token(token)
        return {
            "isAuthorized": True,
            "context": {
                "uid": decoded_token.get("uid"),
                "auth_check": "firebase_admin",
            },
        }
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        return {"isAuthorized": False}
