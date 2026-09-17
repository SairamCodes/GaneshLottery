import os
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException
import mimetypes

class StorageProvider:
    def __init__(self):
        self.bucket = os.getenv("STORAGE_BUCKET")
        self.endpoint = os.getenv("STORAGE_ENDPOINT")
        self.access_key = os.getenv("STORAGE_ACCESS_KEY")
        self.secret_key = os.getenv("STORAGE_SECRET_KEY")
        
        # Determine if we should use S3 or Local File System
        self.use_s3 = all([self.bucket, self.access_key, self.secret_key])
        
        if self.use_s3:
            self.s3 = boto3.client(
                's3',
                endpoint_url=self.endpoint,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key
            )
        else:
            # Fallback to local storage using FILE_STORAGE_PATH if S3 is not configured
            # but note that the prompt strongly encourages using S3 or persistent volume.
            # If use_s3 is False, it assumes the user mounted a persistent volume at FILE_STORAGE_PATH
            self.local_base_path = os.getenv("FILE_STORAGE_PATH", "/app/storage")
            os.makedirs(self.local_base_path, exist_ok=True)

    def upload_file(self, file_obj, storage_key: str, content_type: str = None) -> str:
        if not content_type:
            content_type, _ = mimetypes.guess_type(storage_key)
            if not content_type:
                content_type = "application/octet-stream"

        if self.use_s3:
            try:
                self.s3.upload_fileobj(
                    file_obj,
                    self.bucket,
                    storage_key,
                    ExtraArgs={'ContentType': content_type}
                )
                return storage_key
            except ClientError as e:
                raise Exception(f"Failed to upload to S3: {e}")
        else:
            full_path = os.path.join(self.local_base_path, storage_key)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "wb") as f:
                f.write(file_obj.read())
            return storage_key

    def get_file(self, storage_key: str):
        if self.use_s3:
            try:
                response = self.s3.get_object(Bucket=self.bucket, Key=storage_key)
                content = response['Body'].read()
                content_type = response.get('ContentType', 'application/octet-stream')
                return content, content_type
            except ClientError as e:
                if e.response['Error']['Code'] in ['NoSuchKey', '404', 'NotFound']:
                    return None, None
                raise Exception(f"Failed to fetch from S3: {e}")
        else:
            full_path = os.path.join(self.local_base_path, storage_key)
            if not os.path.exists(full_path):
                return None, None
            with open(full_path, "rb") as f:
                content = f.read()
            content_type, _ = mimetypes.guess_type(full_path)
            return content, content_type or 'application/octet-stream'

storage_provider = StorageProvider()
