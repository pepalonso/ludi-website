import pandas as pd
import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Read the CSV file
df = pd.read_csv('qr-tokens.csv')

# Create QR directory if it doesn't exist
if not os.path.exists('QR'):
    os.makedirs('QR')

def create_rounded_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask

def create_qr_with_team_id(team_id, token):
    # Create QR code with higher error correction
    qr = qrcode.QRCode(
        version=1,
        error_correction=ERROR_CORRECT_H,
        box_size=12,  # Increased box size
        border=4,
    )
    
    # Add data to QR code
    url = f"https://ludibasquet.com/menjars?token={token}"
    qr.add_data(url)
    qr.make(fit=True)
    
    # Create QR code image with a larger size
    qr_image = qr.make_image(fill_color="black", back_color="white")
    qr_image = qr_image.convert('RGB')
    
    # Create a new image with padding for the rounded corners
    padding = 20
    width, height = qr_image.size
    new_size = (width + padding*2, height + padding*2)
    final_image = Image.new('RGB', new_size, 'white')
    final_image.paste(qr_image, (padding, padding))
    
    # Apply rounded corners
    radius = 30  # Increased radius for more rounded corners
    mask = create_rounded_mask(new_size, radius)
    final_image.putalpha(mask)
    
    # Convert back to RGB for drawing
    final_image = final_image.convert('RGB')
    draw = ImageDraw.Draw(final_image)
    
    # Try to load a modern font, fall back to default if not available
    try:
        # Try different modern fonts in order of preference
        font_paths = [
            "arial.ttf",
            "Roboto-Bold.ttf",
            "OpenSans-Bold.ttf",
            "Montserrat-Bold.ttf"
        ]
        font = None
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, 200)  # Dramatically increased font size
                break
            except:
                continue
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Get image size
    width, height = final_image.size
    
    # Calculate text position to center it
    text = str(team_id)
    text_width = draw.textlength(text, font=font)
    text_height = 200  # Increased height to match new font size
    
    position = ((width - text_width) // 2, (height - text_height) // 2)
    
    # Draw a larger white background for text with rounded corners
    padding = 40  # Increased padding for larger text
    draw.rounded_rectangle(
        [position[0] - padding, position[1] - padding, 
         position[0] + text_width + padding, position[1] + text_height + padding],
        radius=25,  # Increased radius for larger background
        fill="white"
    )
    
    # Draw text with a more pronounced shadow for depth
    shadow_offset = 5  # Increased shadow offset for larger text
    draw.text((position[0] + shadow_offset, position[1] + shadow_offset), 
              text, fill="gray", font=font)
    draw.text(position, text, fill="black", font=font)
    
    # Save the QR code with high quality
    final_image.save(f'QR/team_{team_id}_qr.png', quality=95, optimize=True)

# Generate QR codes for each team
for _, row in df.iterrows():
    create_qr_with_team_id(row['team_id'], row['token'])

print("QR codes have been generated successfully!") 