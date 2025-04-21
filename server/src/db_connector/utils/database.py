import pymysql
import os


def get_db_connection(database=None):
    try:
        return pymysql.connect(
            host=os.getenv("DB_ENDPOINT", "localhost"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=database if database else os.getenv("DB_NAME"),
            connect_timeout=5,
            port=int(os.getenv("DB_PORT", 3306)),
            cursorclass=pymysql.cursors.DictCursor,
        )
    except Exception as e:
        raise Exception(f"Database connection failed: {str(e)}")
