import json
import traceback
from utils.messaging import send_whatsapp_message


def lambda_handler(event, context):

    try:

        if isinstance(event, str):
            body = json.loads(event)
        elif "body" in event:
            body = json.loads(event["body"])
        else:
            body = event

        pin = body.get("pin")
        reciver_phone = body.get("reciver_phone")

        status, result = send_whatsapp_message(pin, reciver_phone)
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
