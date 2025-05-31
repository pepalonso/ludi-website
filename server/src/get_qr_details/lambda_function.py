import json
import os
from datetime import datetime
from utils.response import create_error_response, create_success_response
from utils.database import get_db_connection

def get_team_details(team_id, cursor):
    # Get team basic info
    cursor.execute("""
        SELECT e.*, c.nom as club_nom 
        FROM equips e 
        JOIN clubs c ON e.club_id = c.id 
        WHERE e.id = %s
    """, (team_id,))
    team = cursor.fetchone()
    
    if not team:
        return None
    
    # Get total players and coaches count
    cursor.execute("""
        SELECT 
            (SELECT COUNT(*) FROM jugadors WHERE id_equip = %s) as players_count,
            (SELECT COUNT(*) FROM entrenadors WHERE id_equip = %s) as coaches_count
    """, (team_id, team_id))
    counts = cursor.fetchone()
    
    # Get shirt sizes distribution
    cursor.execute("""
        SELECT talla_samarreta, COUNT(*) as count
        FROM (
            SELECT talla_samarreta FROM jugadors WHERE id_equip = %s
            UNION ALL
            SELECT talla_samarreta FROM entrenadors WHERE id_equip = %s
        ) as all_sizes
        GROUP BY talla_samarreta
    """, (team_id, team_id))
    shirt_sizes = cursor.fetchall()
    
    # Get allergies count
    cursor.execute("""
        SELECT nom, COUNT(*) as count
        FROM intolerancies
        WHERE id_equip = %s
        GROUP BY nom
    """, (team_id,))
    allergies = cursor.fetchall()
    
    return {
        "team_id": team['id'],
        "team_name": team['nom'],
        "club_name": team['club_nom'],
        "total_members": counts['players_count'] + counts['coaches_count'],
        "players_count": counts['players_count'],
        "coaches_count": counts['coaches_count'],
        "shirt_sizes": {size['talla_samarreta']: size['count'] for size in shirt_sizes},
        "allergies": {allergy['nom']: allergy['count'] for allergy in allergies},
        "observations": team['observacions']
    }

def lambda_handler(event, context):
    try:
        # Get token from query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        token = query_params.get('token')
        
        if not token:
            return create_error_response(400, "Token is required")
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Validate token and get team_id
            cursor.execute("""
                SELECT team_id 
                FROM qr_tokens 
                WHERE token = %s AND expires_at > %s
            """, (token, datetime.now()))
            
            token_data = cursor.fetchone()
            
            if not token_data:
                return create_error_response(401, "Invalid or expired token")
            
            team_id = token_data['team_id']
            
            # Get team details
            team_details = get_team_details(team_id, cursor)
            
            if not team_details:
                return create_error_response(404, "Team not found")
            
            return create_success_response(team_details)
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return create_error_response(500, f"Internal server error: {str(e)}") 