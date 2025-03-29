import json
import os
import traceback
import requests
from utils.messaging import send_whatsapp_message


def lambda_handler(event, context):

    n8n_endpoint = os.getenv("N8N_ENDPOINT")
    bearer_token = os.getenv("BEARER_TOKEN")

    try:

        body_str = event.get("body", "{}")
        body = json.loads(body_str)

        team_data = {
            "club": body.get("club_name", ""),
            "nomEquip": body.get("team_name", ""),
            "telefon": body.get("wa_number", ""),
            "jugadors": body.get("num_players", "0"),
            "entrenadors": body.get("num_coaches", "0"),
            "registration_path": body.get("path", ""),
        }
        print("DEBUG: Team data prepared:", team_data)

        headers = {
            "Authorization": f"Bearer {bearer_token}",
            "Content-Type": "application/json",
        }

        response = requests.post(n8n_endpoint, headers=headers, json=team_data)

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
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": "Error processing event", "details": error_details}
            ),
        }
