import boto3
import json

LAMBDA_FUNCTION_NAME = "db_cli"


def format_table(data):
    if not data:
        print("(no rows)")
        return

    headers = list(data[0].keys())
    table = [headers] + [[str(row.get(h, "")) for h in headers] for row in data]
    col_widths = [max(len(item) for item in col) for col in zip(*table)]

    separator = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    header_row = (
        "| " + " | ".join(item.ljust(w) for item, w in zip(headers, col_widths)) + " |"
    )

    print(separator)
    print(header_row)
    print(separator)
    for row in table[1:]:
        row_str = (
            "| " + " | ".join(item.ljust(w) for item, w in zip(row, col_widths)) + " |"
        )
        print(row_str)
    print(separator)


def run_sql(query):
    client = boto3.client("lambda")
    response = client.invoke(
        FunctionName=LAMBDA_FUNCTION_NAME,
        Payload=json.dumps({"sql": query}),
    )
    payload = response["Payload"].read()
    try:
        result = json.loads(payload)
        body = result.get("body", result)
        data = json.loads(body) if isinstance(body, str) else body

        if isinstance(data, list) and data and isinstance(data[0], dict):
            format_table(data)
        else:
            print(data)
    except Exception as e:
        print(f"(error parsing response): {e}")
        print(payload)


def interactive_shell():
    print("Connected to Lambda DB proxy.")
    print("Type SQL statements ending with ';'. Type 'exit' to quit.")

    buffer = []
    while True:
        try:
            line = input("> ").strip()
            if line.lower() in ["exit", "quit", "\\q"]:
                break
            buffer.append(line)
            if line.endswith(";"):
                full_query = "\n".join(buffer)
                run_sql(full_query)
                buffer.clear()
        except KeyboardInterrupt:
            print("\nExiting.")
            break
        except Exception as e:
            print(f"Error: {e}")
            buffer.clear()


if __name__ == "__main__":
    interactive_shell()
