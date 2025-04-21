import pymysql
import json
import hashlib
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


def hash_pin(pin):
    """Return the SHA256 hash of a pin."""
    return hashlib.sha256(pin.encode()).hexdigest()


def lambda_handler(event, context):
    """
    Lambda function to validate a PIN against the edit_sessions table.

    Expected request:
      - Authorization header with a Bearer token (team's registration token).
      - JSON body with a "pin" parameter.

    The function:
      1. Extracts the team token from the headers.
      2. Validates the team's registration token and retrieves the team id.
      3. Extracts the PIN from the request body and hashes it.
      4. Checks if there is an edit_session for that team where the hashed PIN matches
         and the session is not expired.
      5. Returns the session token if the PIN is valid.
    """
    try:
        headers = event.get("headers", {}) or {}
        auth_header = headers.get("authorization") or headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return create_error_response(
                401, "No team token provided in Authorization header"
            )
        team_token = auth_header.split("Bearer ")[1]

        if isinstance(event, str):
            body = json.loads(event)
        elif "body" in event:
            body = json.loads(event["body"])
        else:
            body = event

        pin = body.get("pin")
        if not pin:
            return create_error_response(400, "Missing 'pin' parameter in request body")

        hashed_pin = hash_pin(pin)

        conn = get_db_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            team_query = """
                SELECT team_id
                FROM registration_tokens
                WHERE token = %s 
                  AND is_revoked = FALSE 
                  AND expires_at > NOW()
                LIMIT 1
            """
            cursor.execute(team_query, (team_token,))
            team_record = cursor.fetchone()

            if not team_record:
                return create_error_response(404, "Team not found or token expired.")

            team_id = team_record["team_id"]

            session_query = """
                SELECT session_token
                FROM edit_sessions
                WHERE team_id = %s 
                  AND pin_hash = %s 
                  AND expires_at > NOW()
                  AND is_used = FALSE
                LIMIT 1
            """
            cursor.execute(session_query, (team_id, hashed_pin))
            session_record = cursor.fetchone()

            if not session_record:
                return create_error_response(401, "Invalid or expired PIN")

        return create_success_response(
            {"session_token": session_record["session_token"]}
        )

    except Exception as e:
        return create_error_response(500, f"Internal server error: {str(e)}")
