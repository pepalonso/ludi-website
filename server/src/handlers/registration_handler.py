import json
import secrets
from datetime import datetime, timedelta
import os
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response
from messaging import send_whatsapp_message
import pymysql

def handle_registration(event):
    connection = None
    try:
        body = event.get('body', '{}') or '{}'
        
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            return create_error_response(400, "Invalid JSON in request body")

        mapped_body = {
            'nomEquip': body.get('nomEquip'),
            'email': body.get('email'),
            'telefon': body.get('telefon'),
            'sexe': body.get('sexe'),
            'club': body.get('club'),
            'intolerancies': body.get('intolerancies'),
            'jugadors': [
                {'nom': j.get('nom'), 'cognoms': j.get('cognoms'), 'tallaSamarreta': j.get('tallaSamarreta')}
                for j in body.get('jugadors', [])
            ],
            'entrenadors': [
                {'nom': e.get('nom'), 'cognoms': e.get('cognoms'), 'tallaSamarreta': e.get('tallaSamarreta'), 'esPrincipal': e.get('esPrincipal')}
                for e in body.get('entrenadors', [])
            ]
        }

        required_fields = ['nomEquip', 'email', 'telefon', 'jugadors', 'entrenadors', 'sexe', 'club']
        missing_fields = [field for field in required_fields if not mapped_body.get(field)]
        if missing_fields:
            return create_error_response(400, f"Missing required fields: {', '.join(missing_fields)}")

        connection = get_db_connection()
        with connection.cursor() as cursor:
            insert_team = "INSERT INTO equips (nom, email, telefon, sexe, club) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(insert_team, (mapped_body['nomEquip'], mapped_body['email'], mapped_body['telefon'], mapped_body['sexe'], mapped_body['club']))
            team_id = cursor.lastrowid

            for jugador in mapped_body['jugadors']:
                cursor.execute("INSERT INTO jugadors (nom, cognoms, talla_samarreta, id_equip) VALUES (%s, %s, %s, %s)",
                               (jugador['nom'], jugador['cognoms'], jugador['tallaSamarreta'], team_id))

            for entrenador in mapped_body['entrenadors']:
                cursor.execute("INSERT INTO entrenadors (nom, cognoms, talla_samarreta, es_principal, id_equip) VALUES (%s, %s, %s, %s, %s)",
                               (entrenador['nom'], entrenador['cognoms'], entrenador['tallaSamarreta'], entrenador['esPrincipal'], team_id))

            for intolerancia in mapped_body.get('intolerancies', []):
                cursor.execute("INSERT INTO intolerancies (nom, id_equip) VALUES (%s, %s)", (intolerancia, team_id))

            token = secrets.token_urlsafe(32)
            token_expiry = datetime.utcnow() + timedelta(days=120)

            cursor.execute("INSERT INTO registration_tokens (team_id, token, expires_at, created_at) VALUES (%s, %s, %s, %s)",
                           (team_id, token, token_expiry, datetime.utcnow()))

            connection.commit()

            registration_path = f"registration?token={token}"
            registration_url = f"https://{os.getenv('FRONTEND_URL')}/{registration_path}"
            message_sent, message_result = send_whatsapp_message({'club': mapped_body['club'], 'nomEquip': mapped_body['nomEquip'], 'telefon': mapped_body['telefon'], 'registration_path': registration_path})
            print(message_result)
            return create_success_response({'message': 'Team registered successfully', 'team_id': team_id, 'whatsapp': message_sent, 'registration_path': registration_url})

    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")

    finally:
        if connection:
            connection.close()
