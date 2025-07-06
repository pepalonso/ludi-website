import os
import json
import secrets
from datetime import datetime, timedelta

from utils.response import create_error_response, create_success_response
from utils.database import get_db_connection


def generate_token():
    """Return a secure random URL-safe token."""
    return secrets.token_urlsafe(32)


def lambda_handler(event, context):
    # 1) Parse JSON body to extract the team_token
    try:
        body = event.get("body") or ""
        data = json.loads(body)
        team_token = data.get("team_token", "").strip()
        if not team_token:
            return create_error_response(400, "No team_token provided in body")
    except json.JSONDecodeError:
        return create_error_response(400, "Invalid JSON body")

    # 2) Validate the token and get team_id
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT team_id
                  FROM registration_tokens
                 WHERE token = %s
                   AND is_revoked = FALSE
                   AND expires_at > NOW()
                """,
                (team_token,),
            )
            row = cursor.fetchone()
            if not row:
                return create_error_response(401, "Invalid or expired token")
            team_id = row["team_id"]

            # 3) Generate a new session token and set expiration (20 minutes)
            session_token = generate_token()
            expires_at = datetime.utcnow() + timedelta(minutes=20)

            # 4) Insert into edit_sessions
            cursor.execute(
                """
                INSERT INTO edit_sessions
                    (team_id, pin_hash, session_token,
                     contact_method, contact_address,
                     expires_at)
                VALUES
                    (%s, %s, %s, %s, %s, %s)
                """,
                (
                    team_id,
                    "",  # pin_hash (unused for admin sessions)
                    session_token,
                    "admin",  # contact_method
                    "admin",  # contact_address
                    expires_at.strftime("%Y-%m-%d %H:%M:%S"),
                ),
            )
            conn.commit()

    except Exception as e:
        return create_error_response(500, f"Server error: {str(e)}")
    finally:
        conn.close()

    # 5) Return the new session token
    return create_success_response({"session_token": session_token})
