"""
Sırdaş AI - Phase 2 Data Pipeline Configuration Module
Handles environment variables, Cloudflare R2 endpoint sanitization,
RTX 4060 GPU / CUDA detection, and SDK client factory functions.
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional
import urllib.parse
from dotenv import load_dotenv

# ------------------------------------------------------------------------------
# 1. Environment Loading (.env & .env.local)
# ------------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT_DIR / ".env"
ENV_LOCAL_FILE = ROOT_DIR / ".env.local"

if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE, override=False)
if ENV_LOCAL_FILE.exists():
    load_dotenv(dotenv_path=ENV_LOCAL_FILE, override=True)

# ------------------------------------------------------------------------------
# 2. Hardware Acceleration & CUDA / GPU Detection
# ------------------------------------------------------------------------------
try:
    import torch
    CUDA_AVAILABLE = torch.cuda.is_available()
    if CUDA_AVAILABLE:
        GPU_DEVICE_NAME = torch.cuda.get_device_name(0)
        DEVICE = "cuda"
        COMPUTE_TYPE = "float16"
        BATCH_SIZE = 16  # Optimal for RTX 4060 (8GB VRAM)
    else:
        GPU_DEVICE_NAME = "CPU (CUDA unavailable)"
        DEVICE = "cpu"
        COMPUTE_TYPE = "int8"
        BATCH_SIZE = 4
except ImportError:
    CUDA_AVAILABLE = False
    GPU_DEVICE_NAME = "CPU (PyTorch not imported)"
    DEVICE = "cpu"
    COMPUTE_TYPE = "int8"
    BATCH_SIZE = 4

WHISPER_MODEL = "large-v3-turbo"
ISLAMIC_INITIAL_PROMPT = (
    "Halis Aydemir, Kur'an-ı Kerim, tevekkül, murakabe, ubudiyet, tevhid, sünnet, "
    "fıkıh, siyer, nefis, vesvese, riba, Talâk, Bakara, ayet, hadis, sahabe"
)

# ------------------------------------------------------------------------------
# 3. Supabase Credentials
# ------------------------------------------------------------------------------
SUPABASE_URL: str = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or ""
).strip()

SUPABASE_SERVICE_ROLE_KEY: str = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or ""
).strip()

# ------------------------------------------------------------------------------
# 4. Cloudflare R2 Storage & Endpoint Sanitization
# ------------------------------------------------------------------------------
CLOUDFLARE_R2_ACCOUNT_ID: str = (
    os.getenv("CLOUDFLARE_R2_ACCOUNT_ID")
    or os.getenv("R2_ACCOUNT_ID")
    or ""
).strip()

R2_ACCESS_KEY_ID: str = (
    os.getenv("R2_ACCESS_KEY_ID")
    or os.getenv("R2_ACCESS_KEY")
    or ""
).strip()

R2_SECRET_ACCESS_KEY: str = (
    os.getenv("R2_SECRET_ACCESS_KEY")
    or os.getenv("R2_SECRET_KEY")
    or ""
).strip()

R2_BUCKET_NAME: str = (
    os.getenv("R2_BUCKET_NAME")
    or "sirdas-ai"
).strip()

R2_PUBLIC_URL: str = (
    os.getenv("R2_PUBLIC_URL")
    or os.getenv("R2_PUBLIC_BASE_URL")
    or "https://pub-23aebf3095484a8cb085366e8160d215.r2.dev"
).strip().rstrip("/")


def sanitize_r2_endpoint(endpoint: str, account_id: str = "") -> str:
    """
    Sanitizes Cloudflare R2 S3 endpoint URL.
    Ensures any redundant bucket name path (e.g. '/sirdas-ai') or trailing slashes
    are strictly stripped to prevent S3 client 404 / NoSuchKey errors.
    """
    cleaned = (endpoint or "").strip().rstrip("/")
    if not cleaned and account_id:
        return f"https://{account_id}.r2.cloudflarestorage.com"
    if not cleaned:
        return "https://r2.cloudflarestorage.com"

    # If the endpoint contains .cloudflarestorage.com, extract scheme://host
    if ".cloudflarestorage.com" in cleaned:
        parsed = urllib.parse.urlparse(cleaned)
        scheme = parsed.scheme or "https"
        netloc = parsed.netloc or parsed.path.split("/")[0]
        # netloc should be <account_id>.r2.cloudflarestorage.com
        return f"{scheme}://{netloc}"

    parsed = urllib.parse.urlparse(cleaned)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return cleaned


_RAW_R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")
R2_ENDPOINT: str = sanitize_r2_endpoint(_RAW_R2_ENDPOINT, CLOUDFLARE_R2_ACCOUNT_ID)

# ------------------------------------------------------------------------------
# 5. AI & Embedding Providers
# ------------------------------------------------------------------------------
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

# ------------------------------------------------------------------------------
# 6. Client Factory Functions
# ------------------------------------------------------------------------------
def get_supabase_client():
    """
    Factory for Supabase Python client using Service Role key for pipeline operations.
    """
    from supabase import create_client, Client
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL is not set in environment or configuration.")
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not set in environment or configuration.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_r2_client():
    """
    Factory for boto3 S3 client configured for Cloudflare R2 with sanitized endpoint.
    """
    import boto3
    from botocore.config import Config

    if not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
        raise ValueError("R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is not set.")

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
            connect_timeout=10,
            read_timeout=30,
        ),
    )


def get_gemini_client():
    """
    Factory for Google GenAI client using GEMINI_API_KEY.
    """
    from google import genai
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment or configuration.")
    return genai.Client(api_key=GEMINI_API_KEY)


def validate_pipeline_config() -> Dict[str, Any]:
    """
    Performs comprehensive configuration health check.
    Returns status dictionary summarizing hardware and service configurations.
    """
    return {
        "hardware": {
            "cuda_available": CUDA_AVAILABLE,
            "gpu_name": GPU_DEVICE_NAME,
            "device": DEVICE,
            "compute_type": COMPUTE_TYPE,
            "batch_size": BATCH_SIZE,
            "whisper_model": WHISPER_MODEL,
        },
        "supabase": {
            "url_configured": bool(SUPABASE_URL),
            "service_role_configured": bool(SUPABASE_SERVICE_ROLE_KEY),
        },
        "r2_storage": {
            "account_id_configured": bool(CLOUDFLARE_R2_ACCOUNT_ID),
            "keys_configured": bool(R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY),
            "bucket_name": R2_BUCKET_NAME,
            "endpoint": R2_ENDPOINT,
            "public_url": R2_PUBLIC_URL,
        },
        "ai_providers": {
            "openrouter_configured": bool(OPENROUTER_API_KEY),
            "gemini_configured": bool(GEMINI_API_KEY),
        },
    }
