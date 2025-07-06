import pymysql
import os

def get_db_connection():
    try:
        return pymysql.connect(
            host=os.getenv("DB_ENDPOINT", 'localhost'),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            connect_timeout=5,
            port=3306,
            cursorclass=pymysql.cursors.DictCursor,
            charset='utf8mb4',
            use_unicode=True
        )
    except Exception as e:
        raise Exception(f"Database connection failed: {str(e)}")