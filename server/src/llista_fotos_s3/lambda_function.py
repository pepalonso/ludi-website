import boto3
import os

s3 = boto3.client('s3')

def lambda_handler(event, context):
    BUCKET = os.environ.get('galeria-web')

    year = event.get('queryStringParameters', {}).get('year', 'none')
    PREFIX = f"{year}/"

    try:
        response = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)

        contents = response.get('Contents', [])
        urls = [
            f"https://{BUCKET}.s3.amazonaws.com/{obj['Key']}"
            for obj in contents if not obj['Key'].endswith('/')
        ]

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': str(urls)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': str(e)
        }