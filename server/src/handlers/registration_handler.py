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
        if 'body' not in event:
            return create_error_response(400, "Missing request body")
            
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return create_error_response(400, "Invalid JSON in request body")
            
        mapped_body = {
            'nomEquip': body.get('nomEquip'),
            'email': body.get('email'),
            'telefon': body.get('telefon'),
            'sexe': body.get('sexe'),
            'club': body.get('club'),
            'intolerancies': body.get('intolerancies'),
            'jugadors': [{
                'nom': jugador.get('nom'),
                'cognoms': jugador.get('cognoms'),
                'tallaSamarreta': jugador.get('tallaSamarreta')
            } for jugador in body.get('jugadors', [])],
            'entrenadors': [{
                'nom': entrenador.get('nom'),
                'cognoms': entrenador.get('cognoms'),
                'tallaSamarreta': entrenador.get('tallaSamarreta'),
                'esPrincipal': entrenador.get('esPrincipal')
            } for entrenador in body.get('entrenadors', [])]
        }
            
        required_fields = ['nomEquip', 'email', 'telefon', 'jugadors', 'entrenadors', 'sexe', 'club']
        missing_fields = [field for field in required_fields if not mapped_body.get(field)]
        if missing_fields:
            return create_error_response(400, f"Missing required fields: {', '.join(missing_fields)}")

        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            try:
                insert_team = """
                    INSERT INTO equips (nom, email, telefon, sexe, club) 
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(insert_team, (
                    mapped_body['nomEquip'],
                    mapped_body['email'],
                    mapped_body['telefon'],
                    mapped_body['sexe'],
                    mapped_body['club']
                ))
                team_id = cursor.lastrowid

                for jugador in mapped_body['jugadors']:
                    insert_player = """
                        INSERT INTO jugadors (nom, cognoms, talla_samarreta, id_equip)
                        VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(insert_player, (
                        jugador['nom'],
                        jugador['cognoms'],
                        jugador['tallaSamarreta'],
                        team_id
                    ))

                for entrenador in mapped_body['entrenadors']:
                    insert_coach = """
                        INSERT INTO entrenadors (nom, cognoms, talla_samarreta, es_principal, id_equip)
                        VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(insert_coach, (
                        entrenador['nom'],
                        entrenador['cognoms'],
                        entrenador['tallaSamarreta'],
                        entrenador['esPrincipal'],
                        team_id
                    ))
                

                for intolerancia in mapped_body.get('intolerancies', []):
                    insert_intolerance = """
                        INSERT INTO intolerancies (nom, id_equip)
                        VALUES (%s, %s)
                    """
                    cursor.execute(insert_intolerance, (
                        intolerancia,
                        team_id
                    ))
                
                token = secrets.token_urlsafe(32)
                token_expiry = datetime.utcnow() + timedelta(days=120)
                
                insert_token = """
                    INSERT INTO registration_tokens 
                    (team_id, token, expires_at, created_at)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(insert_token, (
                    team_id,
                    token,
                    token_expiry,
                    datetime.utcnow()
                ))

                
                connection.commit()
                
                registration_path = f"registration?token={token}"
                registration_url = f"{os.getenv('FRONTEND_URL')}/{registration_path}"
                message_sent, message_result = send_whatsapp_message({
                    'club': mapped_body['club'],
                    'nomEquip': mapped_body['nomEquip'],
                    'telefon': mapped_body['telefon'],
                    'jugadors': mapped_body['jugadors'],
                    'entrenadors': mapped_body['entrenadors'],
                    'registration_path': registration_path
                })
                print(f"Message sent: {message_result}")
                
                return create_success_response({
                    'message': 'Team registered successfully',
                    'team_id': team_id,
                    'whatsapp_sent': message_sent,
                    'registration_path': registration_url
                })
                
            except pymysql.Error as e:
                connection.rollback()
                return create_error_response(500, f"Database error: {str(e)}")
                
    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")
        
    finally:
        if connection:
            connection.close() 