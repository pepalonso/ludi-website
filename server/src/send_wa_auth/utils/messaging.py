from twilio.rest import Client
import os
from dotenv import load_dotenv
import json

load_dotenv()


def clean_phone_number(phone):
    """
    Clean and validate phone number format.
    Returns formatted phone number starting with 34 (without +).
    """
    phone = "".join(filter(str.isdigit, phone))

    if phone.startswith("+"):
        phone = phone[1:]

    if phone.startswith("34"):
        if len(phone) == 11:
            return phone
        phone = phone[2:]

    if len(phone) == 9:
        return f"34{phone}"

    raise ValueError(f"Invalid phone number format: {phone}")


def send_whatsapp_message(pin, reciver_number):
    """
    Send WhatsApp message using Twilio.
    Returns tuple (success: bool, result: str).
    """
    try:
        account_sid = os.getenv("ACCOUNT_SID")
        auth_token = os.getenv("AUTH_TOKEN")
        sender = os.getenv("SENDER_PHONE")
        content_sid = os.getenv("CONTENT_SID")

        if not all([account_sid, auth_token, sender, content_sid]):
            return False, "Missing Twilio configuration"

        client = Client(account_sid, auth_token)

        if not reciver_number:
            return False, "Missing receiver phone number"

        formatted_number = clean_phone_number(reciver_number)

        message = client.messages.create(
            content_sid=content_sid,
            from_=f"whatsapp:+{sender}",
            to=f"whatsapp:+{formatted_number}",
            content_variables=json.dumps(
                {
                    "1": pin,
                }
            ),
        )
        return message.status, message.sid

    except Exception as e:
        return False, str(e)
