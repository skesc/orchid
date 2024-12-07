from typing import BinaryIO, Union

import boto3
from botocore.client import Config
from config import Config as AppConfig
from werkzeug.datastructures import FileStorage


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=AppConfig.S3_ENDPOINT,
        aws_access_key_id=AppConfig.S3_ACCESS_KEY,
        aws_secret_access_key=AppConfig.S3_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


def upload_file(file: Union[FileStorage, BinaryIO], folder: str, filename: str) -> str:
    s3 = get_s3_client()
    key = f"{folder}/{filename}"

    if isinstance(file, FileStorage):
        file_data = file.read()
        content_type = file.content_type
    else:
        file_data = file.read()
        content_type = "image/png"  # default to PNG for binary data

    try:
        s3.put_object(
            Bucket=AppConfig.S3_BUCKET,
            Key=key,
            Body=file_data,
            ContentType=content_type,
        )

        if isinstance(file, FileStorage):
            file.seek(0)

        return f"/uploads/{key}"  # keep the same URL format as before

    except Exception as e:
        raise Exception(f"Failed to upload file to S3: {str(e)}")


def delete_file(file_path: str) -> bool:
    try:
        key = file_path.replace("/uploads/", "", 1)
        s3 = get_s3_client()
        s3.delete_object(Bucket=AppConfig.S3_BUCKET, Key=key)
        return True
    except Exception:
        return False
