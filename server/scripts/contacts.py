import json

# Load JSON file
with open("teams.json", "r", encoding="utf-8") as file:
    teams = json.load(file)

# Create a .vcf file
with open("contacts.vcf", "w", encoding="utf-8") as vcf_file:
    for team in teams:
        name = (team.get("name") or "Unknown").strip()  # Handle None
        phone = (team.get("telephone") or "").strip()   # Handle None

        # Skip contacts without a phone number
        if not phone:
            continue

        vcard = f"""BEGIN:VCARD
VERSION:3.0
FN:{name}
TEL;TYPE=CELL:{phone}
END:VCARD
"""
        vcf_file.write(vcard + "\n")

print("Contacts exported to contacts.vcf")
