import os
import datetime  # <-- Import datetime module for conversion
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


def handle_team_get(event):
    connection = None
    try:
        headers = event.get("headers", {}) or {}  # Support for missing headers
        auth_header = headers.get("authorization") or headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return create_error_response(401, "No token provided")

        token = auth_header.split("Bearer ")[1]

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Validate token
            cursor.execute(
                """
                SELECT team_id 
                FROM registration_tokens
                WHERE token = %s
                  AND is_revoked = FALSE
                  AND expires_at > NOW()
            """,
                (token,),
            )
            token_record = cursor.fetchone()
            if not token_record:
                return create_error_response(401, "Invalid or expired token")

            team_id = token_record["team_id"]

            # Update last_used_at for the token
            cursor.execute(
                """
                UPDATE registration_tokens
                SET last_used_at = NOW()
                WHERE token = %s
            """,
                (token,),
            )

            # Retrieve team info (joining with clubs to get the club name)
            cursor.execute(
                """
                SELECT e.nom AS nomEquip,
                       e.email,
                       e.telefon,
                       e.sexe,
                       e.categoria,
                       e.data_incripcio AS dataIncripcio,
                       c.nom AS club
                FROM equips e
                JOIN clubs c ON e.club_id = c.id
                WHERE e.id = %s
            """,
                (team_id,),
            )
            team = cursor.fetchone()

            if not team:
                return create_error_response(404, "Team not found")

            # Convert datetime object(s) to string for JSON serialization
            if team.get("dataIncripcio") and isinstance(
                team["dataIncripcio"], datetime.datetime
            ):
                team["dataIncripcio"] = team["dataIncripcio"].isoformat()

            # Get intolerancies
            cursor.execute(
                """
                SELECT nom
                FROM intolerancies
                WHERE id_equip = %s
            """,
                (team_id,),
            )
            intolerancies = [row["nom"] for row in cursor.fetchall()]

            # Get jugadors
            cursor.execute(
                """
                SELECT nom,
                       cognoms,
                       talla_samarreta AS tallaSamarreta
                FROM jugadors
                WHERE id_equip = %s
            """,
                (team_id,),
            )
            jugadors = cursor.fetchall()

            # Get entrenadors
            cursor.execute(
                """
                SELECT nom,
                       cognoms,
                       talla_samarreta AS tallaSamarreta,
                       es_principal AS esPrincipal
                FROM entrenadors
                WHERE id_equip = %s
            """,
                (team_id,),
            )
            entrenadors = cursor.fetchall()

            response_data = {
                **team,  # includes nomEquip, email, telefon, sexe, categoria, dataIncripcio, club
                "intolerancies": intolerancies,
                "jugadors": jugadors,
                "entrenadors": entrenadors,
            }

            connection.commit()
            return create_success_response(response_data)

    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")

    finally:
        if connection:
            connection.close()
