import json
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


def handle_update_entrenador(event, team_id, http_method):

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
                # Insert a new coach.
                entrenador = payload.get("entrenador")
                if not entrenador:
                    return create_error_response(
                        400, "Missing 'entrenador' data for insertion"
                    )
                nom = entrenador.get("nom")
                cognoms = entrenador.get("cognoms")
                talla = entrenador.get("tallaSamarreta")
                es_principal = entrenador.get("esPrincipal", False)
                if not (nom and cognoms and talla):
                    return create_error_response(
                        400, "Missing required fields for coach insertion"
                    )

                cursor.execute(
                    """
                    INSERT INTO entrenadors (nom, cognoms, talla_samarreta, es_principal, id_equip)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (nom, cognoms, talla, es_principal, team_id),
                )
                connection.commit()
                return create_success_response({"message": "Coach added successfully"})

            elif http_method.upper() == "PUT":
                # Update an existing coach.
                entrenador_old = payload.get("entrenador_old")
                entrenador_new = payload.get("entrenador_new")
                if not (entrenador_old and entrenador_new):
                    return create_error_response(
                        400,
                        "Missing 'entrenador_old' or 'entrenador_new' data for update",
                    )
                entrenador_id = entrenador_old.get("id")
                if not entrenador_id:
                    return create_error_response(
                        400, "Missing 'id' in 'entrenador_old'"
                    )

                # Validate that the coach belongs to the team.
                cursor.execute(
                    "SELECT id FROM entrenadors WHERE id = %s AND id_equip = %s",
                    (entrenador_id, team_id),
                )
                record = cursor.fetchone()
                if not record:
                    return create_error_response(404, "Coach not found for update")

                # Build dynamic update query based on provided fields.
                update_fields = []
                update_values = []
                if "nom" in entrenador_new:
                    update_fields.append("nom = %s")
                    update_values.append(entrenador_new["nom"])
                if "cognoms" in entrenador_new:
                    update_fields.append("cognoms = %s")
                    update_values.append(entrenador_new["cognoms"])
                if "tallaSamarreta" in entrenador_new:
                    update_fields.append("talla_samarreta = %s")
                    update_values.append(entrenador_new["tallaSamarreta"])
                if "esPrincipal" in entrenador_new:
                    update_fields.append("es_principal = %s")
                    update_values.append(entrenador_new["esPrincipal"])

                if not update_fields:
                    return create_error_response(400, "No fields provided to update")

                update_values.extend([entrenador_id, team_id])
                query = f"UPDATE entrenadors SET {', '.join(update_fields)} WHERE id = %s AND id_equip = %s"
                cursor.execute(query, tuple(update_values))
                connection.commit()
                return create_success_response(
                    {"message": "Coach updated successfully"}
                )

            elif http_method.upper() == "DELETE":
                # Delete a coach.
                entrenador = payload.get("entrenador")
                if not entrenador:
                    return create_error_response(
                        400, "Missing 'entrenador' data for deletion"
                    )
                entrenador_id = entrenador.get("id")
                if not entrenador_id:
                    return create_error_response(400, "Missing 'id' in 'entrenador'")

                cursor.execute(
                    "DELETE FROM entrenadors WHERE id = %s AND id_equip = %s",
                    (entrenador_id, team_id),
                )
                if cursor.rowcount == 0:
                    return create_error_response(
                        404, "Coach not found or not associated with your team"
                    )
                connection.commit()
                return create_success_response(
                    {"message": "Coach deleted successfully"}
                )

            else:
                return create_error_response(405, "Method not allowed")
    except Exception as e:
        connection.rollback()
        return create_error_response(500, f"Unexpected error: {str(e)}")
    finally:
        connection.close()
