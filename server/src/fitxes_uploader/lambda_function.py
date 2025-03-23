import json
import os
import boto3
import base64
import cgi
from io import BytesIO
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def lambda_handler(event, context):
    try:
        
        content_type = event['headers'].get('content-type') or event['headers'].get('Content-Type')
        if not content_type:
            raise Exception("Missing Content-Type header")
        
        body = event['body']
        
        if event.get('isBase64Encoded', False):
            logger.info("Body is base64 encoded; decoding...")
            body = base64.b64decode(body)
        else:
            logger.info("Body is not base64 encoded; converting to bytes...")
            body = body.encode('utf-8')
        
        
        fp = BytesIO(body)
        
        environ = {
            'REQUEST_METHOD': 'POST',
            'CONTENT_TYPE': content_type,
            'CONTENT_LENGTH': str(len(body))
        }
        
        # Parse the multipart form data
        form = cgi.FieldStorage(fp=fp, environ=environ, keep_blank_values=True)
        
        # Log all keys received in form
        form_keys = list(form.keys())
        
        key_param = form.getvalue('key')
        if not key_param:
            raise Exception("Missing 'key' parameter in the form data")
        
        responses = []
        
        # Check for file in form without converting to bool
        if 'file' not in form:
            raise Exception("No file found in the form data under the key 'file'")
        file_field = form['file']
        
        # If there are multiple file uploads, ensure we work with a list
        files = file_field if isinstance(file_field, list) else [file_field]
        
        for item in files:
            if not item.filename:
                logger.info("Skipping field without filename")
                continue 
            
            original_file_name = item.filename
            file_content = item.file.read()
            
            s3_object_key = f"{key_param}/{original_file_name}"
            
            # Upload the file to S3
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_object_key,
                Body=file_content
            )
            
            file_arn = f"arn:aws:s3:::{BUCKET_NAME}/{s3_object_key}"
            responses.append({
                "file": original_file_name,
                "status": "uploaded",
                "arn": file_arn
            })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'files': responses,
                'message': 'Files uploaded successfully.'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    
    except Exception as e:
        logger.exception("Error occurred:")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
