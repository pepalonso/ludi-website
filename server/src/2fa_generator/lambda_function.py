import pymysql
import os
import json
import random
import hashlib
import secrets
from datetime import datetime, timedelta
from utils import get_db_connection, create_success_response, create_error_response


def hash_pin(pin):
    """Return the SHA256 hash of a pin."""
    return hashlib.sha256(pin.encode()).hexdigest()


def generate_pin():
    """Generate a random 4-digit pin as a string."""
    return str(random.randint(1000, 9999))


def generate_token():
    """Return a secure random URL-safe token."""
    return secrets.token_urlsafe(32)


def lambda_handler(event, context):
    """
    Lambda function handler.

    Expected input (via JSON body):
    {
        "team_token": "<team token>",
        "method": "email"  // or "whatsapp"
    }

    The function:
      1. Validates required parameters.
      2. Retrieves the team id (and contact details) from the equips table
         using the team token from the registration_tokens table.
      3. Generates a new PIN and session token.
      4. Inserts a new record into edit_sessions.
      5. Returns the generated PIN.
    """
    try:
        # Parse the incoming JSON payload.
        body = json.loads(event.get("body", "{}"))
        team_token = body.get("team_token")
        method = body.get("method")  # expect either "whatsapp" or "email"

        if not team_token or method not in ["whatsapp", "email"]:
            return create_error_response(400, "Missing or invalid parameters.")

        conn = get_db_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # Fetch team details using the provided team token.
            # This query first uses the token to find the associated team_id
            # from the registration_tokens table and then gets team info from equips.
            query = """
                SELECT e.id, e.email, e.telefon
                FROM equips e
                WHERE e.id = (
                    SELECT team_id 
                    FROM registration_tokens 
                    WHERE token = %s 
                      AND is_revoked = FALSE 
                      AND expires_at > NOW()
                    LIMIT 1
                )
            """
            cursor.execute(query, (team_token,))
            team = cursor.fetchone()

            if not team:
                return create_error_response(404, "Team not found or token expired.")

            # Generate a new 4-digit PIN, its hash and a session token.
            pin = generate_pin()
            hashed_pin = hash_pin(pin)
            session_token = generate_token()
            expires_at = (datetime.utcnow() + timedelta(minutes=30)).strftime(
                "%Y-%m-%d %H:%M:%S"
            )

            # Pick the contact detail based on the chosen method.
            contact_address = team["telefon"] if method == "whatsapp" else team["email"]

            # Insert the new session into edit_sessions.
            insert_query = """
                INSERT INTO edit_sessions 
                    (team_id, pin_hash, session_token, contact_method, contact_address, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                insert_query,
                (
                    team["id"],
                    hashed_pin,
                    session_token,
                    method,
                    contact_address,
                    expires_at,
                ),
            )
            conn.commit()

        # For demonstration purposes, print the PIN.
        # Replace this with logic to send the PIN (email/WhatsApp) to the user.
        print(f"Generated PIN for {method}: {pin}")

        # Return the generated PIN in the response.
        return create_success_response({"pin": pin, "method": method})

    except Exception as e:
        # Log the exception details as needed.
        return create_error_response(500, f"Internal server error: {str(e)}")
