"""
Sırdaş AI - Phase 2 Cloudflare R2 Audio Uploader Module
Uploads processed .ogg Opus voice clips to Cloudflare R2 bucket
with mandatory ContentType: audio/ogg and exponential retry resilience.
"""

import logging
import os
from pathlib import Path
import sys
import time
from typing import Any, Dict, Optional
from botocore.exceptions import BotoCoreError, ClientError

# Ensure pipeline root is in sys.path for config import
_pipeline_root = str(Path(__file__).resolve().parent.parent)
if _pipeline_root not in sys.path:
    sys.path.insert(0, _pipeline_root)

import config


logger = logging.getLogger("sirdas.r2_uploader")


def upload_audio_to_r2(
    local_file_path: str,
    r2_key: str,
    max_retries: int = 3,
    initial_delay: float = 1.0,
) -> Dict[str, Any]:
    """
    Uploads a local audio file to Cloudflare R2 with mandatory ContentType="audio/ogg".
    Handles transient network errors with exponential backoff retries.

    Args:
        local_file_path: Path to the local .ogg file.
        r2_key: Storage key / path in R2 bucket (e.g., 'halis_aydemir/chunk_001.ogg').
        max_retries: Number of retry attempts on transient network failures.
        initial_delay: Initial sleep duration in seconds between retries.

    Returns:
        dict: { "url": public_url, "r2_key": r2_key, "size_bytes": size }
    """
    p = Path(local_file_path).resolve()
    if not p.exists():
        raise FileNotFoundError(f"Local audio file does not exist: {local_file_path}")
    if not p.is_file():
        raise ValueError(f"Local path is not a file: {local_file_path}")

    size_bytes = p.stat().st_size
    if size_bytes == 0:
        raise ValueError(f"Cannot upload empty audio file (0 bytes): {local_file_path}")

    # Strip any leading slashes from R2 key
    clean_key = r2_key.strip().lstrip("/")
    if not clean_key:
        raise ValueError("r2_key cannot be empty.")

    s3_client = config.get_r2_client()
    bucket = config.R2_BUCKET_NAME

    with open(p, "rb") as f:
        file_bytes = f.read()

    last_error: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                "Uploading %s (%d bytes) to R2 bucket '%s' key '%s' (attempt %d/%d)...",
                p.name,
                size_bytes,
                bucket,
                clean_key,
                attempt,
                max_retries,
            )

            # Mandatory Header: ContentType="audio/ogg" for WhatsApp Cloud API PTT compatibility
            s3_client.put_object(
                Bucket=bucket,
                Key=clean_key,
                Body=file_bytes,
                ContentType="audio/ogg",
                CacheControl="public, max-age=31536000, immutable",
            )

            public_url = f"{config.R2_PUBLIC_URL}/{clean_key}"
            logger.info("Successfully uploaded %s -> %s", clean_key, public_url)

            return {
                "url": public_url,
                "r2_key": clean_key,
                "size_bytes": size_bytes,
            }

        except (ClientError, BotoCoreError, OSError) as e:
            last_error = e
            logger.warning(
                "Upload failed on attempt %d/%d for '%s': %s",
                attempt,
                max_retries,
                clean_key,
                e,
            )
            if attempt < max_retries:
                sleep_time = initial_delay * (2 ** (attempt - 1))
                time.sleep(sleep_time)

    raise RuntimeError(
        f"Failed to upload '{local_file_path}' to R2 '{clean_key}' after {max_retries} attempts: {last_error}"
    ) from last_error


def check_audio_exists_in_r2(r2_key: str) -> bool:
    """
    Checks if a key exists in Cloudflare R2 bucket using head_object.
    """
    s3_client = config.get_r2_client()
    clean_key = r2_key.strip().lstrip("/")
    try:
        s3_client.head_object(Bucket=config.R2_BUCKET_NAME, Key=clean_key)
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


def delete_audio_from_r2(r2_key: str) -> bool:
    """
    Deletes an object from Cloudflare R2 bucket.
    """
    s3_client = config.get_r2_client()
    clean_key = r2_key.strip().lstrip("/")
    try:
        s3_client.delete_object(Bucket=config.R2_BUCKET_NAME, Key=clean_key)
        return True
    except ClientError as e:
        logger.error("Failed to delete %s from R2: %s", clean_key, e)
        return False
