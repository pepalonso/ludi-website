import qrcode
import os
import mysql.connector
import io

def conectar_db():
    return mysql.connector.connect(
        host="tu_host",
        user="tu_usuario",
        password="tu_contraseña",
        database="tu_base_de_datos"
    )

def obtener_tags():
    conexion = conectar_db()
    cursor = conexion.cursor()
    cursor.execute("SELECT id FROM equips")
    tags = [str(row[0]) for row in cursor.fetchall()]
    cursor.close()
    conexion.close()
    return tags

def guardar_qr_en_db(tag, qr_img):
    conexion = conectar_db()
    cursor = conexion.cursor()
    qr_bytes = io.BytesIO()
    qr_img.save(qr_bytes, format="PNG")
    qr_data = qr_bytes.getvalue()
    cursor.execute("UPDATE equips SET qr = %s WHERE id = %s", (qr_data, tag))
    conexion.commit()
    cursor.close()
    conexion.close()

def generar_qr_y_guardar():
    tags = obtener_tags()
    base_url = "https://ludibasquet.com/menjar/"
    for tag in tags:
        url = f"{base_url}{tag}"
        qr = qrcode.make(url)
        guardar_qr_en_db(tag, qr)
        print(f"QR generado y guardado en la BDD para: {url}")

generar_qr_y_guardar()