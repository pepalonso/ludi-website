import json
import secrets
from datetime import datetime, timedelta
import os
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response


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
            'categoria': body.get('categoria'),
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
        print(mapped_body)

        required_fields = ['nomEquip', 'email', 'categoria', 'telefon', 'jugadors', 'entrenadors', 'sexe', 'club']
        missing_fields = [field for field in required_fields if not mapped_body.get(field)]
        if missing_fields:
            return create_error_response(400, f"Missing required fields: {', '.join(missing_fields)}")

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 1. Find or insert club
            cursor.execute("SELECT id FROM clubs WHERE nom = %s", (mapped_body['club'],))
            club = cursor.fetchone()

            if club:
                club_id = club['id']
            else:
                cursor.execute("INSERT INTO clubs (nom) VALUES (%s)", (mapped_body['club'],))
                club_id = cursor.lastrowid

            # 2. Insert team
            insert_team = """
            INSERT INTO equips (nom, email, categoria, telefon, sexe, club_id) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_team, (
                mapped_body['nomEquip'], 
                mapped_body['email'], 
                mapped_body['categoria'], 
                mapped_body['telefon'], 
                mapped_body['sexe'], 
                club_id
            ))
            team_id = cursor.lastrowid

            # 3. Insert players
            for jugador in mapped_body['jugadors']:
                cursor.execute("INSERT INTO jugadors (nom, cognoms, talla_samarreta, id_equip) VALUES (%s, %s, %s, %s)",
                               (jugador['nom'], jugador['cognoms'], jugador['tallaSamarreta'], team_id))

            # 4. Insert coaches
            for entrenador in mapped_body['entrenadors']:
                cursor.execute("INSERT INTO entrenadors (nom, cognoms, talla_samarreta, es_principal, id_equip) VALUES (%s, %s, %s, %s, %s)",
                               (entrenador['nom'], entrenador['cognoms'], entrenador['tallaSamarreta'], entrenador['esPrincipal'], team_id))

            # 5. Insert intolerances if present
            for intolerancia in mapped_body.get('intolerancies', []):
                cursor.execute("INSERT INTO intolerancies (nom, id_equip) VALUES (%s, %s)", (intolerancia, team_id))

            # 6. Registration token (for confirmation URL)
            token = secrets.token_urlsafe(32)
            token_expiry = datetime.utcnow() + timedelta(days=120)
            cursor.execute("INSERT INTO registration_tokens (team_id, token, expires_at, created_at) VALUES (%s, %s, %s, %s)",
                           (team_id, token, token_expiry, datetime.utcnow()))

            # 7. WhatsApp token (for quick login/verification)
            wa_token = secrets.token_urlsafe(32)
            wa_token_expiry = datetime.utcnow() + timedelta(minutes=5)
            cursor.execute("INSERT INTO wa_tokens (team_id, token, expires_at, created_at) VALUES (%s, %s, %s, %s)",
                           (team_id, wa_token, wa_token_expiry, datetime.utcnow()))

            connection.commit()

            registration_path = f"equip?token={token}"
            registration_url = f"https://{os.getenv('FRONTEND_URL')}/{registration_path}"

            return create_success_response({
                'message': 'Team registered successfully',
                'team_id': team_id,
                'registration_url': registration_url,
                'registration_path': registration_path,
                'wa_token': wa_token
            })

    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")

    finally:
        if connection:
            connection.close()
