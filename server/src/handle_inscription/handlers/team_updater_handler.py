import json
from .team_handlers.alergies import handle_update_intolerancies
from .team_handlers.coaches import handle_update_entrenador
from .team_handlers.players import handle_update_jugadors
from .team_handlers.team import handle_update_equip
from utils.database import get_db_connection
from utils.response import create_error_response


def handle_team_updater(event, method):
    connection = None
    try:
        # Validate token
        headers = event.get("headers", {}) or {}
        auth_header = headers.get("authorization") or headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return create_error_response(401, "No token provided")
        token = auth_header.split("Bearer ")[1]

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT team_id 
                FROM registration_tokens
                WHERE token = %s AND is_revoked = FALSE AND expires_at > NOW()
                """,
                (token,),
            )
            token_record = cursor.fetchone()
            if not token_record:
                return create_error_response(401, "Invalid or expired token")
            team_id = token_record["team_id"]

            # Update the last_used_at for the token
            cursor.execute(
                """
                UPDATE registration_tokens 
                SET last_used_at = NOW() 
                WHERE token = %s
                """,
                (token,),
            )

        # Determine the endpoint path
        if "httpMethod" in event:
            path = event["path"]
        elif "requestContext" in event and "http" in event["requestContext"]:
            path = event["requestContext"]["http"]["path"]
        else:
            return create_error_response(400, "Unsupported API Gateway format")

        # Dispatch to the proper update function based on path
        if path == "/jugador":
            response = handle_update_jugadors(event, team_id, method)
        elif path == "/equip":
            response = handle_update_equip(event, team_id, method)
        elif path == "/entrenador":
            response = handle_update_entrenador(event, team_id, method)
        elif path == "/intolerancies":
            response = handle_update_intolerancies(event, team_id, method)
        else:
            return create_error_response(400, "Invalid update endpoint")

        # If everything is successful, commit and return the response.
        connection.commit()
        return response

    except Exception as e:
        if connection:
            connection.rollback()
        return create_error_response(500, f"Unexpected error: {str(e)}")
    finally:
        if connection:
            connection.close()
