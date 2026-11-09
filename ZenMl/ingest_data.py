import boto3
from pathlib import Path
from zenml import step
from zenml.client import Client


@step
def ingest_idrid_data() -> str:
    secret = Client().get_secret("minio_secret")
    credentials = secret.secret_values

    s3 = boto3.client(
        "s3",
        endpoint_url="http://10.10.0.13:9000",
        aws_access_key_id=credentials["aws_access_key_id"],
        aws_secret_access_key=credentials["aws_secret_access_key"],
    )

    bucket = "raw"
    prefix = "A. Segmentation/"
    destination = Path("data/raw")
    destination.mkdir(parents=True, exist_ok=True)

    paginator = s3.get_paginator("list_objects_v2")

    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            relative_path = key.removeprefix(prefix)
            local_path = destination / relative_path

            local_path.parent.mkdir(parents=True, exist_ok=True)
            s3.download_file(bucket, key, str(local_path))

    return str(destination)