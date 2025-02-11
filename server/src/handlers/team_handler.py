import os
from utils.database import get_db_connection
from utils.response import create_success_response, create_error_response

def handle_team_get(event):
    connection = None
    try:
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return create_error_response(401, "No token provided")
        
        token = auth_header.split('Bearer ')[1]
        
        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT team_id FROM registration_tokens 
                WHERE token = %s AND is_revoked = FALSE 
                AND expires_at > NOW()
            """, (token,))
            
            token_record = cursor.fetchone()
            if not token_record:
                return create_error_response(401, "Invalid or expired token")
            
            team_id = token_record['team_id']
            
            cursor.execute("""
                UPDATE registration_tokens 
                SET last_used_at = NOW() 
                WHERE token = %s
            """, (token,))
            

            cursor.execute("""
                SELECT nom as nomEquip, email, telefon, sexe, club 
                FROM equips WHERE id = %s
            """, (team_id,))
            team = cursor.fetchone()
            
            if not team:
                return create_error_response(404, "Team not found")
            
            cursor.execute("SELECT nom FROM intolerancies WHERE id_equip = %s", (team_id,))
            intolerancies = [row['nom'] for row in cursor.fetchall()]

            cursor.execute("""
                SELECT nom, cognoms, talla_samarreta as tallaSamarreta 
                FROM jugadors WHERE id_equip = %s
            """, (team_id,))
            jugadors = cursor.fetchall()
            

            cursor.execute("""
                SELECT nom, cognoms, talla_samarreta as tallaSamarreta, 
                       es_principal as esPrincipal 
                FROM entrenadors WHERE id_equip = %s
            """, (team_id,))
            entrenadors = cursor.fetchall()
            

            response_data = {
                **team,
                'intolerancies': intolerancies,
                'jugadors': jugadors,
                'entrenadors': entrenadors
            }
            
            connection.commit()
            return create_success_response(response_data)
            
    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")
    finally:
        if connection:
            connection.close()
        
        