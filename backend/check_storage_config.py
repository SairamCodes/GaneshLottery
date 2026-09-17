import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(".env")

print("Checking environment variables:")
print(f"STORAGE_BUCKET is set: {'STORAGE_BUCKET' in os.environ}")
print(f"STORAGE_ENDPOINT is set: {'STORAGE_ENDPOINT' in os.environ}")
print(f"STORAGE_ACCESS_KEY is set: {'STORAGE_ACCESS_KEY' in os.environ}")
print(f"STORAGE_SECRET_KEY is set: {'STORAGE_SECRET_KEY' in os.environ}")
print(f"FILE_STORAGE_PATH: {os.getenv('FILE_STORAGE_PATH')}")

from app.storage.provider import storage_provider
print("\nChecking StorageProvider:")
print(f"Is S3 Active? {storage_provider.use_s3}")
if not storage_provider.use_s3:
    print(f"Fallback local base path: {storage_provider.local_base_path}")
    print(f"Fallback path exists? {os.path.exists(storage_provider.local_base_path)}")
