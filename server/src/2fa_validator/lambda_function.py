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
      - Authorization header with a Bearer token.
      - JSON body with a "pin" parameter.
      
    The function:
      1. Extracts the token from the headers.
      2. Extracts the pin from the request body.
      3. Checks if there is a record in edit_sessions where the session_token,
         the hashed pin, and a valid (non-expired) record exist.
      4. Returns the session_token if the PIN is valid.
    """
    try:
        headers = event.get("headers", {}) or {}
        auth_header = headers.get("authorization") or headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return create_error_response(401, "No token provided")
        token = auth_header.split("Bearer ")[1]
        
        if isinstance(event, str):
            body = json.loads(event)
        elif "body" in event:
            body = json.loads(event["body"])
        else:
            body = event
        
        pin = body.get("pin")
        if not pin:
            return create_error_response(400, "Missing 'pin' parameter in request body")
        
        # Hash the pin provided by the user.
        hashed_pin = hash_pin(pin)
        
        conn = get_db_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # Query to validate the edit session.
            query = """
                SELECT session_token
                FROM edit_sessions
                WHERE session_token = %s 
                  AND pin_hash = %s 
                  AND expires_at > NOW()
                LIMIT 1
            """
            cursor.execute(query, (token, hashed_pin))
            session = cursor.fetchone()
        
        if not session:
            return create_error_response(401, "Invalid or expired PIN")
        
        return create_success_response({"session_token": token})
        
    except Exception as e:
        return create_error_response(500, f"Internal server error: {str(e)}")
