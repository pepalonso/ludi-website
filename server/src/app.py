from handlers.registration_handler import handle_registration
from handlers.team_handler import handle_team_get
from utils.response import create_error_response

def lambda_handler(event, context):
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        if http_method == 'POST' and path == '/registrar-incripcio':
            return handle_registration(event)
        elif http_method == 'GET' and path == '/registration':
            return handle_team_get(event)
        else:
            return create_error_response(400, "Invalid endpoint or method")
            
    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")
