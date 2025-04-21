import json
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


def handle_update_equip(event, team_id, http_method):
    if http_method.upper() not in ["PUT"]:
        return create_error_response(405, "Method not allowed")
    try:
        payload = json.loads(event["body"])
    except Exception:
        return create_error_response(400, "Invalid JSON payload")

    equip = payload.get("equip")
    if not equip:
        return create_error_response(400, "Missing 'equip' data for update")

    # Define which fields are allowed to be updated.
    fields = {}
    if "nom" in equip:
        fields["nom"] = equip["nom"]
    if "email" in equip:
        fields["email"] = equip["email"]
    if "categoria" in equip:
        fields["categoria"] = equip["categoria"]
    if "telefon" in equip:
        fields["telefon"] = equip["telefon"]
    if "sexe" in equip:
        fields["sexe"] = equip["sexe"]
    if "observacions" in equip:
        fields["observacions"] = equip["observacions"]

    if not fields:
        return create_error_response(400, "No fields provided to update")

    set_clause = ", ".join(f"{key} = %s" for key in fields)
    values = list(fields.values())
    values.append(team_id)

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            query = f"UPDATE equips SET {set_clause} WHERE id = %s"
            cursor.execute(query, tuple(values))
        connection.commit()
        return create_success_response({"message": "Team updated successfully"})
    except Exception as e:
        connection.rollback()
        return create_error_response(500, f"Unexpected error: {str(e)}")
    finally:
        connection.close()
