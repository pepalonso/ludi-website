import os
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
import math

def create_qr_pdf(qr_folder, output_folder):
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Get all QR code files
    qr_files = [f for f in os.listdir(qr_folder) if f.endswith('.png')]
    qr_files.sort()  # Sort files to maintain consistent order
    
    # Calculate how many PDFs we need
    qr_per_page = 20  # 4 columns * 5 rows
    num_pdfs = math.ceil(len(qr_files) / qr_per_page)
    
    for pdf_num in range(num_pdfs):
        # Create a new PDF
        pdf_path = os.path.join(output_folder, f'qr_codes_{pdf_num + 1}.pdf')
        c = canvas.Canvas(pdf_path, pagesize=A4)
        
        # Calculate QR code size and positions
        # Use more of the page width and height
        qr_width = (A4[0] - 0.5 * inch) / 4  # Divide page width by 4, leaving small margins
        qr_height = (A4[1] - 0.5 * inch) / 5  # Divide page height by 5, leaving small margins
        margin_x = 0.25 * inch  # Reduced margin from left edge
        margin_y = 0.25 * inch  # Reduced margin from bottom edge
        spacing_x = 0.1 * inch  # Reduced horizontal spacing
        spacing_y = 0.1 * inch  # Reduced vertical spacing
        
        # Process QR codes for this page
        start_idx = pdf_num * qr_per_page
        end_idx = min(start_idx + qr_per_page, len(qr_files))
        
        for idx, qr_file in enumerate(qr_files[start_idx:end_idx]):
            # Calculate position in grid
            row = idx // 4
            col = idx % 4
            
            # Calculate x and y coordinates
            x = margin_x + col * (qr_width + spacing_x)
            y = A4[1] - margin_y - (row + 1) * (qr_height + spacing_y)
            
            # Open QR code
            qr_path = os.path.join(qr_folder, qr_file)
            img = Image.open(qr_path)
            
            # Save image to temporary file without resizing
            temp_path = f'temp_{idx}.png'
            img.save(temp_path, quality=100)  # Save with maximum quality
            
            # Add QR code to PDF at calculated size
            c.drawImage(temp_path, x, y, width=qr_width, height=qr_height, preserveAspectRatio=True)
            
            # Clean up temporary file
            os.remove(temp_path)
        
        c.save()

if __name__ == "__main__":
    # Define paths
    qr_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "QR", "QR")
    output_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "QR", "PDF")
    
    # Create PDFs
    create_qr_pdf(qr_folder, output_folder)
    print("QR code PDFs have been created successfully!") 