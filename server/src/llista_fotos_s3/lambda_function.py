import boto3
import os
import json

# Configure S3 client (no endpoint_url if using AWS S3!)
s3 = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID_M'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY_M')
)

def lambda_handler(event, context):
    BUCKET = os.getenv('BUCKET')

    year = event.get('queryStringParameters', {}).get('year', 'none')
    PREFIX = f"{year}/"

    try:
        response = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
        contents = response.get('Contents', [])

        # Construct URLs using S3 regional endpoint
        region = os.getenv('AWS_REGION')
        urls = [
    s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET, 'Key': obj['Key']},
        ExpiresIn=3600  # valid for 1 hour
    )
    for obj in contents if not obj['Key'].endswith('/')
]


        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps({'urls': urls})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps({'error': str(e)})
        }
