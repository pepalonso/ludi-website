import datetime
from decimal import Decimal
from utils.response import create_error_response, create_success_response
from utils.database import get_db_connection


def lambda_handler(event, context):
    # Allow only GET method

    if "httpMethod" in event:  # REST API Gateway
        http_method = event["httpMethod"]
        path = event["path"]
    elif (
        "requestContext" in event and "http" in event["requestContext"]
    ):  # HTTP API Gateway
        http_method = event["requestContext"]["http"]["method"]
        path = event["requestContext"]["http"]["path"]
    else:
        return create_error_response(400, "Unsupported API Gateway format")

    if http_method != "GET":
        return create_error_response(405, "Method not allowed")

    try:
        connection = get_db_connection()
    except Exception as e:
        return create_error_response(500, str(e))

    try:
        with connection.cursor() as cursor:
            # GET /clubs
            if path == "/clubs":
                query = "SELECT id, nom FROM clubs;"
                cursor.execute(query)
                clubs = cursor.fetchall()
                return create_success_response(clubs)

            # GET /equips with optional query parameters for filtering
            elif path == "/equips":
                # Retrieve query parameters
                query_params = event.get("queryStringParameters") or {}

                # Base query with registration token subquery added
                query = """
                    SELECT 
                        e.id,
                        e.nom,
                        e.email,
                        e.categoria,
                        e.telefon,
                        e.sexe,
                        e.club_id,
                        e.data_incripcio,
                        c.nom as club_nom,
                        (SELECT token 
                        FROM registration_tokens 
                        WHERE team_id = e.id 
                        AND is_revoked = FALSE 
                        AND expires_at > NOW()
                        ORDER BY created_at DESC LIMIT 1) as token,
                        (SELECT COUNT(*) FROM jugadors WHERE id_equip = e.id) as jugadors,
                        (SELECT COUNT(*) FROM entrenadors WHERE id_equip = e.id) as entrenadors
                    FROM equips e
                    JOIN clubs c ON e.club_id = c.id
                """

                filters = []
                values = []

                # Check for each supported query parameter and build filter conditions
                if query_params.get("club_id"):
                    filters.append("e.club_id = %s")
                    values.append(query_params.get("club_id"))
                if query_params.get("categoria"):
                    filters.append("e.categoria = %s")
                    values.append(query_params.get("categoria"))
                if query_params.get("sexe"):
                    filters.append("e.sexe = %s")
                    values.append(query_params.get("sexe"))

                if filters:
                    query += " WHERE " + " AND ".join(filters)

                query += " ORDER BY e.id ASC;" 

                # Execute query with parameters
                cursor.execute(query, values)
                equips = cursor.fetchall()

                # Manually convert the datetime field to ISO 8601 string format with "Z" suffix
                for equip in equips:
                    if equip.get("data_incripcio") is not None:
                        equip["data_incripcio"] = (
                            equip["data_incripcio"].isoformat() + "Z"
                        )

                return create_success_response(equips)

            # GET /jugadors
            elif path == "/jugadors":
                query = """
                    SELECT 
                        j.id,
                        j.nom,
                        j.cognoms,
                        j.talla_samarreta,
                        j.id_equip,
                        e.nom as equip_nom
                    FROM jugadors j
                    JOIN equips e ON j.id_equip = e.id;
                """
                cursor.execute(query)
                jugadors = cursor.fetchall()
                return create_success_response(jugadors)

            # GET /entrenadors
            elif path == "/entrenadors":
                query = """
                    SELECT 
                        en.id,
                        en.nom,
                        en.cognoms,
                        en.talla_samarreta,
                        en.es_principal,
                        en.id_equip,
                        e.nom as equip_nom
                    FROM entrenadors en
                    JOIN equips e ON en.id_equip = e.id;
                """
                cursor.execute(query)
                entrenadors = cursor.fetchall()
                return create_success_response(entrenadors)

            # GET /estadistiques
            elif path == "/estadistiques":
                stats = {}

                # Total counts
                cursor.execute("SELECT COUNT(*) as total FROM clubs;")
                stats["totalClubs"] = cursor.fetchone()["total"]

                cursor.execute("SELECT COUNT(*) as total FROM equips;")
                stats["totalEquips"] = cursor.fetchone()["total"]

                cursor.execute("SELECT COUNT(*) as total FROM jugadors;")
                stats["totalJugadors"] = cursor.fetchone()["total"]

                cursor.execute("SELECT COUNT(*) as total FROM entrenadors;")
                stats["totalEntrenadors"] = cursor.fetchone()["total"]

                # Equips by Categoria
                cursor.execute(
                    "SELECT categoria, COUNT(*) as count FROM equips GROUP BY categoria;"
                )
                equips_categoria = cursor.fetchall()
                stats["equipsByCategoria"] = {
                    row["categoria"]: row["count"] for row in equips_categoria
                }

                # Equips by Sexe
                cursor.execute(
                    "SELECT sexe, COUNT(*) as count FROM equips GROUP BY sexe;"
                )
                equips_sexe = cursor.fetchall()
                stats["equipsBySexe"] = {
                    row["sexe"]: row["count"] for row in equips_sexe
                }

                # Accumulated inscriptions per day
                cursor.execute("""
                    SELECT dia, SUM(count) OVER (ORDER BY dia) as accumulated_count
                    FROM (
                        SELECT DATE(data_incripcio) as dia, COUNT(*) as count 
                        FROM equips 
                        GROUP BY dia
                    ) as daily_counts;
                """)
                inscripcions = cursor.fetchall()

                stats["inscripcionsPorDia"] = {
                    (
                        row["dia"].strftime("%Y-%m-%d")
                        if isinstance(row["dia"], (datetime.date, datetime.datetime))
                        else row["dia"]
                    ): int(row["accumulated_count"]) if isinstance(row["accumulated_count"], Decimal) else row["accumulated_count"]
                    for row in inscripcions
                }

                # Clubs with most teams
                cursor.execute(
                    """
                    SELECT c.id, c.nom, COUNT(*) as equipCount 
                    FROM clubs c 
                    JOIN equips e ON c.id = e.club_id 
                    GROUP BY c.id, c.nom 
                    ORDER BY equipCount DESC;
                    """
                )
                stats["clubsWithMostTeams"] = cursor.fetchall()

                return create_success_response(stats)

            else:
                return create_error_response(404, "Not found")
    except Exception as e:
        return create_error_response(500, f"Error processing request: {str(e)}")
    finally:
        connection.close()
