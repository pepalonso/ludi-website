import json
import os
import traceback
from utils.messaging import send_whatsapp_message


def lambda_handler(event, context):
    try:
        # Log the full event for debugging purposes
        print("DEBUG: Received event:", json.dumps(event))

        # 1. Parse the JSON body from the HTTP request
        body_str = event.get("body", "{}")
        print("DEBUG: Raw body string:", body_str)
        body = json.loads(body_str)
        print("DEBUG: Parsed body:", body)

        team_data = {
            "club": body.get("club_name", ""),
            "nomEquip": body.get("team_name", ""),
            "telefon": body.get("wa_number", ""),
            "jugadors": body.get("num_players", "0"),
            "entrenadors": body.get("num_coaches", "0"),
            "registration_path": body.get("path", ""),
        }
        print("DEBUG: Team data prepared:", team_data)

        status, result = send_whatsapp_message(team_data)
        print("DEBUG: WhatsApp message status:", status, "result:", result)

        response = {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "WhatsApp message processed successfully.",
                    "status": status,
                    "result": result,
                }
            ),
        }
        print("DEBUG: Response:", response)
        return response

    except Exception as e:
        error_details = traceback.format_exc()
        print("ERROR: Exception processing event:", error_details)
        # Return error details in the response for troubleshooting purposes.
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": "Error processing event", "details": error_details}
            ),
        }
