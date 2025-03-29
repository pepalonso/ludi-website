import os
import pymysql

from utils.database import get_db_connection


def lambda_handler(event, context):
    master_token = os.getenv("MASTER_TOKEN")
    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")

    if not auth_header:
        return {"isAuthorized": False}

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return {"isAuthorized": False}

    token = parts[1]

    connection = get_db_connection()
    is_authorized = False

    if token == master_token:
        return {
            "isAuthorized": True,
            "context": {
                "token": token,  # Ensure this is a string
                "auth_check": "wa_token",
            },
        }

    try:
        with connection.cursor() as cursor:
            # Check if the token is valid (unused and not expired)
            query = """
                SELECT COUNT(*) AS valid_token
                FROM wa_tokens
                WHERE token = %s
                  AND is_used = 0
                  AND expires_at > NOW()
            """
            cursor.execute(query, (token,))
            result = cursor.fetchone()

            if result["valid_token"] > 0:
                # Mark the token as used so it cannot be used again.
                update_query = """
                    UPDATE wa_tokens
                    SET is_used = 1,
                        used_at = NOW()
                    WHERE token = %s
                      AND is_used = 0
                      AND expires_at > NOW()
                """
                cursor.execute(update_query, (token,))
                connection.commit()
                is_authorized = True
            else:
                is_authorized = False

    except Exception as e:
        print(f"DB error: {e}")
        is_authorized = False
    finally:
        connection.close()

    if not is_authorized:
        return {"isAuthorized": False}

    return {
        "isAuthorized": True,
        "context": {
            "token": token,  # Ensure this is a string
            "auth_check": "wa_token",
        },
    }
