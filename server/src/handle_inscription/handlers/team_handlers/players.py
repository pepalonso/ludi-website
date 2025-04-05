import json
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


def handle_update_jugadors(event, team_id, http_method):

    if http_method.upper() not in ["POST", "PUT", "DELETE"]:
        return create_error_response(405, "Method not allowed")

    try:
        payload = json.loads(event["body"])
    except Exception:
        return create_error_response(400, "Invalid JSON payload")

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            if http_method.upper() == "POST":
                # Insert a new player
                jugador = payload.get("jugador")
                if not jugador:
                    return create_error_response(
                        400, "Missing 'jugador' data for insertion"
                    )
                nom = jugador.get("nom")
                cognoms = jugador.get("cognoms")
                talla = jugador.get("tallaSamarreta")
                if not (nom and cognoms and talla):
                    return create_error_response(
                        400, "Missing required fields for player insertion"
                    )

                cursor.execute(
                    """
                    INSERT INTO jugadors (nom, cognoms, talla_samarreta, id_equip)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (nom, cognoms, talla, team_id),
                )
                connection.commit()
                return create_success_response({"message": "Player added successfully"})

            elif http_method.upper() == "PUT":
                # Update an existing player
                jugador_old = payload.get("jugador_old")
                jugador_new = payload.get("jugador_new")
                if not (jugador_old and jugador_new):
                    return create_error_response(
                        400, "Missing 'jugador_old' or 'jugador_new' data for update"
                    )
                jugador_id = jugador_old.get("id")
                if not jugador_id:
                    return create_error_response(400, "Missing 'id' in 'jugador_old'")

                # Validate that the player belongs to the team
                cursor.execute(
                    "SELECT id FROM jugadors WHERE id = %s AND id_equip = %s",
                    (jugador_id, team_id),
                )
                record = cursor.fetchone()
                if not record:
                    return create_error_response(404, "Player not found for update")

                # Build dynamic update query based on provided fields
                update_fields = []
                update_values = []
                if "nom" in jugador_new:
                    update_fields.append("nom = %s")
                    update_values.append(jugador_new["nom"])
                if "cognoms" in jugador_new:
                    update_fields.append("cognoms = %s")
                    update_values.append(jugador_new["cognoms"])
                if "tallaSamarreta" in jugador_new:
                    update_fields.append("talla_samarreta = %s")
                    update_values.append(jugador_new["tallaSamarreta"])

                if not update_fields:
                    return create_error_response(400, "No fields provided to update")

                update_values.extend([jugador_id, team_id])
                query = f"UPDATE jugadors SET {', '.join(update_fields)} WHERE id = %s AND id_equip = %s"
                cursor.execute(query, tuple(update_values))
                connection.commit()
                return create_success_response(
                    {"message": "Player updated successfully"}
                )

            elif http_method.upper() == "DELETE":
                # Delete a player
                jugador = payload.get("jugador")
                if not jugador:
                    return create_error_response(
                        400, "Missing 'jugador' data for deletion"
                    )
                jugador_id = jugador.get("id")
                if not jugador_id:
                    return create_error_response(400, "Missing 'id' in 'jugador'")

                cursor.execute(
                    "DELETE FROM jugadors WHERE id = %s AND id_equip = %s",
                    (jugador_id, team_id),
                )
                if cursor.rowcount == 0:
                    return create_error_response(
                        404, "Player not found or not associated with your team"
                    )
                connection.commit()
                return create_success_response(
                    {"message": "Player deleted successfully"}
                )

            else:
                return create_error_response(405, "Method not allowed")
    except Exception as e:
        connection.rollback()
        return create_error_response(500, f"Unexpected error: {str(e)}")
    finally:
        connection.close()
