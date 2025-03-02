import os
import pymysql
import json
from datetime import datetime

def lambda_handler(event, context):
    """
    A 'Simple' Lambda Authorizer that checks a Bearer token against the DB.
    Returns a JSON with 'isAuthorized': True/False.
    """

    headers = event.get("headers", {})
    auth_header = headers.get("Authorization") or headers.get("authorization")

    if not auth_header:
        return {"isAuthorized": False}

    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
    else:

        return {"isAuthorized": False}

    connection = pymysql.connect(
        host=os.getenv("DB_ENDPOINT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )

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
            print(result["valid_token"] > 0)

            is_authorized = (result["valid_token"] > 0)

    except Exception as e:
        print(f"DB error: {e}")
        is_authorized = False
    finally:
        connection.close()

    return {"isAuthorized": is_authorized}
