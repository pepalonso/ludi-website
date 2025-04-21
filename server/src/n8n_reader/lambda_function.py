import json
import datetime
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()
        return super().default(o)


def lambda_handler(event, context):
    connection = None
    try:
        connection = get_db_connection()
        data = {}
        with connection.cursor() as cursor:
            # 1. Get all clubs
            cursor.execute("SELECT * FROM clubs")
            clubs = cursor.fetchall()
            data["clubs"] = clubs

            # 2. Get all teams (equips)
            cursor.execute("SELECT * FROM equips")
            teams = cursor.fetchall()
            data["equips"] = teams

            # 3. Get all players (jugadors)
            cursor.execute("SELECT * FROM jugadors")
            players = cursor.fetchall()
            data["jugadors"] = players

            # 4. Get all coaches (entrenadors)
            cursor.execute("SELECT * FROM entrenadors")
            coaches = cursor.fetchall()
            data["entrenadors"] = coaches

            # 5. Get all intolerances (intolerancies)
            cursor.execute("SELECT * FROM intolerancies")
            intolerances = cursor.fetchall()
            data["intolerancies"] = intolerances

            # 6. Get all documents (fitxes_documents)
            cursor.execute("SELECT * FROM fitxes_documents")
            documents = cursor.fetchall()
            data["fitxes_documents"] = documents

        # Serialize the data with the custom encoder
        json_data = json.dumps(data, cls=DateTimeEncoder)
        return create_success_response(json_data)

    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")

    finally:
        if connection:
            connection.close()
