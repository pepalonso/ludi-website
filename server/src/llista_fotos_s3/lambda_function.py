import boto3
import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure S3 client (no endpoint_url if using AWS S3!)
s3 = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID_M'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY_M')
)

def generate_presigned_url_for_object(obj, bucket):
    """Generate presigned URL for a single S3 object"""
    try:
        return s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': obj['Key']},
            ExpiresIn=3600  # valid for 1 hour
        )
    except Exception as e:
        return None

def lambda_handler(event, context):
    BUCKET = os.getenv('BUCKET')

    # Get query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    year = query_params.get('year', 'none')
    page = int(query_params.get('page', 1))
    page_size = int(query_params.get('pageSize', 50))
    
    PREFIX = f"{year}/"

    try:
        # Optimized S3 listing - only get what we need
        if page == 1:
            # Get only the first page_size items for first page
            response = s3.list_objects_v2(
                Bucket=BUCKET, 
                Prefix=PREFIX,
                MaxKeys=page_size
            )
            files = [obj for obj in response.get('Contents', []) if not obj['Key'].endswith('/')]
            total_files = len(files)  # This will be approximate for first page
            has_more = response.get('IsTruncated', False)
        else:
            # For subsequent pages, we need to count total files first
            # But we can optimize by using pagination markers
            response = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
            all_files = [obj for obj in response.get('Contents', []) if not obj['Key'].endswith('/')]
            total_files = len(all_files)
            
            # Calculate which files we need for this page
            start_index = (page - 1) * page_size
            end_index = start_index + page_size
            files = all_files[start_index:end_index]
            has_more = end_index < total_files
        
        # Generate presigned URLs in parallel for the current page
        urls = []
        max_workers = min(20, len(files))  # Optimized for smaller batches
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all URL generation tasks for this page
            future_to_obj = {
                executor.submit(generate_presigned_url_for_object, obj, BUCKET): obj 
                for obj in files
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_obj):
                url = future.result()
                if url:
                    urls.append(url)

        # Calculate pagination metadata
        total_pages = (total_files + page_size - 1) // page_size

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps({
                'urls': urls,
                'total': total_files,
                'page': page,
                'pageSize': page_size,
                'totalPages': total_pages,
                'hasMore': has_more
            })
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