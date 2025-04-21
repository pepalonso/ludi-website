import json
import traceback
from utils.database import get_db_connection


def lambda_handler(event, context):
    sql = event.get("sql")
    if not sql:
        return {"statusCode": 400, "body": "No SQL query provided."}

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(sql)
            if cur.description:
                result = cur.fetchall()
            else:
                conn.commit()
                result = f"Query executed successfully. {cur.rowcount} row(s) affected."

        return {"statusCode": 200, "body": json.dumps(result, default=str)}

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e), "trace": traceback.format_exc()}),
        }

    finally:
        try:
            conn.close()
        except:
            pass
