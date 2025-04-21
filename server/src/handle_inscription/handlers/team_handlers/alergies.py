import json
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


def handle_update_intolerancies(event, team_id, http_method):
    if http_method.upper() != "PUT":
        return create_error_response(
            405, "Method not allowed. Only PUT is supported for updating intolerances."
        )

    try:
        payload = json.loads(event["body"])
    except Exception:
        return create_error_response(400, "Invalid JSON payload")

    new_intolerancies = payload.get("intolerancies")
    if new_intolerancies is None or not isinstance(new_intolerancies, list):
        return create_error_response(
            400, "Expected 'intolerancies' as a list in the payload"
        )

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Delete all existing intolerances for the team.
            cursor.execute("DELETE FROM intolerancies WHERE id_equip = %s", (team_id,))

            # Insert new intolerances, if any.
            for intoler in new_intolerancies:
                # Validate that the intolerance is provided as a non-empty string.
                if not isinstance(intoler, str) or not intoler.strip():
                    continue
                cursor.execute(
                    "INSERT INTO intolerancies (nom, id_equip) VALUES (%s, %s)",
                    (intoler.strip(), team_id),
                )

            connection.commit()
            return create_success_response(
                {"message": "Intolerances updated successfully"}
            )
    except Exception as e:
        connection.rollback()
        return create_error_response(500, f"Unexpected error: {str(e)}")
    finally:
        connection.close()
