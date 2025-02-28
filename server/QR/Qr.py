import qrcode
import os

def generar_qr(tags, base_url="https://ludibasquet.com/menjar/"):
    carpeta = "C:\\Users\\geryv\\Desktop\\QRCodes"
    os.makedirs(carpeta, exist_ok=True)
    
    for tag in tags:
        url = f"{base_url}{tag}"
        qr = qrcode.make(url)
        qr_path = os.path.join(carpeta, f"qr_{tag}.png")
        qr.save(qr_path)
        print(f"QR generado y guardado en: {qr_path}")

# Lista de tags que quieres usar
tags = ["555", "444"]

generar_qr(tags)

