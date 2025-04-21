from handlers.registration_handler import handle_registration
from handlers.team_reader_handler import handle_team_get
from handlers.team_updater_handler import handle_team_updater
from utils.response import create_error_response


def lambda_handler(event, context):

    print(event)
    try:
        # Determine if event is from REST API or HTTP API
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

        if http_method == "POST" and path in ["/registrar-incripcio"]:
            return handle_registration(event)
        elif http_method == "GET" and path in ["/inscripcio"]:
            return handle_team_get(event)
        elif path in ["/jugador", "/equip", "/entrenador", "/intolerancies"]:
            return handle_team_updater(event, http_method)
        else:
            return create_error_response(400, "Invalid endpoint or method")

    except Exception as e:
        return create_error_response(500, f"Unexpected error: {str(e)}")
