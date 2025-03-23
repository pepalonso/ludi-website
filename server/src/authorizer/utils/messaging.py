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
    phone = ''.join(filter(str.isdigit, phone))
    
    if phone.startswith('+'):
        phone = phone[1:]
        
    if phone.startswith('34'):
        if len(phone) == 11:
            return phone
        phone = phone[2:]

    if len(phone) == 9:
        return f"34{phone}"

    raise ValueError(f"Invalid phone number format: {phone}")

def send_whatsapp_message(team_data):
    """
    Send WhatsApp message using Twilio.
    Returns tuple (success: bool, result: str).
    """
    try:
        account_sid = os.getenv('ACCOUNT_SID')
        auth_token = os.getenv('AUTH_TOKEN')
        sender = os.getenv('SENDER_PHONE')
        content_sid = os.getenv('CONTENT_SID')
        
        if not all([account_sid, auth_token, sender, content_sid]):
            return False, "Missing Twilio configuration"
        
        client = Client(account_sid, auth_token)
        
        club = team_data.get('club', '')
        team_name = team_data.get('nomEquip', '')
        receiver_number = team_data.get('telefon', '')

        # Now stored as strings directly
        num_players = team_data.get('jugadors', '0')
        num_coaches = team_data.get('entrenadors', '0')

        if not receiver_number:
            return False, "Missing receiver phone number"
            
        formatted_number = clean_phone_number(receiver_number)
    
        message = client.messages.create(
            content_sid=content_sid,
            from_=f'whatsapp:+{sender}',
            to=f'whatsapp:+{formatted_number}',
            content_variables=json.dumps({
                'club': club,
                'name': team_name,
                'players_num': num_players,
                'coaches_num': num_coaches,
                'path_read': team_data.get('registration_path', ''),
                'path_write': team_data.get('registration_path', '')
            })
        )
        return message.status, message.sid
        
    except Exception as e:
        return False, str(e)
