import os
import pymysql

from server.src.utils.database import get_db_connection


def lambda_handler(event, context):
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")

    if not auth_header:
        return {"isAuthorized": False}

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return {"isAuthorized": False}

    token = parts[1]

    # (For debugging, you might temporarily bypass the DB lookup.)
    # For instance, uncomment the following to always authorize:
    return {"isAuthorized": True, "context": {"token": token, "auth_check": "wa_token"}}

    connection = get_db_connection()

    is_authorized = False
    try:
        with connection.cursor() as cursor:
            query = """
                SELECT COUNT(*) AS valid_token
                FROM wa_tokens
                WHERE token = %s
                  AND is_used = 0
                  AND expires_at > NOW()
            """
            cursor.execute(query, (token,))
            result = cursor.fetchone()
            is_authorized = result["valid_token"] > 0
    except Exception as e:
        print(f"DB error: {e}")
        # (If the DB lookup fails, consider whether you want to return False
        #  or throw an exception; returning False should be valid.)
        is_authorized = False
    finally:
        connection.close()

    # When unauthorized, try returning only the required key:
    if not is_authorized:
        return {"isAuthorized": False}

    return {
        "isAuthorized": True,
        "context": {
            "token": token,  # Ensure this is a string
            "auth_check": "wa_token",
        },
    }
