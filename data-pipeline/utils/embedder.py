"""
Sırdaş AI - Phase 2 Vector Embedder Utility
Generates 768-dimensional embeddings for Supabase pgvector knowledge storage.
Primary: Google GenAI (text-embedding-004 / gemini-embedding-001)
Fallback: OpenRouter (text-embedding-3-small with dimensions=768)
"""

import logging
import os
from pathlib import Path
import sys
import time
from typing import Any, Dict, List, Optional
import requests

# Ensure pipeline root is in sys.path for config import
_pipeline_root = str(Path(__file__).resolve().parent.parent)
if _pipeline_root not in sys.path:
    sys.path.insert(0, _pipeline_root)

import config


logger = logging.getLogger("sirdas.embedder")

EMBEDDING_DIMENSION = 768


def _get_google_embedding(text: str) -> Optional[List[float]]:
    """
    Attempts to generate 768-dimensional embedding via Google GenAI or REST.
    Returns None if provider fails or quota/prepayment is depleted.
    """
    if not config.GEMINI_API_KEY:
        return None

    # 1. Try google.genai client SDK
    try:
        from google import genai
        client = config.get_gemini_client()
        # Attempt gemini-embedding-001 with 768 dimensions
        try:
            res = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config={"output_dimensionality": EMBEDDING_DIMENSION},
            )
            if hasattr(res, "embeddings") and res.embeddings and hasattr(res.embeddings[0], "values"):
                vec = list(res.embeddings[0].values)
                if len(vec) == EMBEDDING_DIMENSION:
                    return vec
            if hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                vec = list(res.embedding.values)
                if len(vec) == EMBEDDING_DIMENSION:
                    return vec
        except Exception as sdk_err:
            logger.debug("Google GenAI SDK embed failed: %s", sdk_err)
    except Exception as e:
        logger.debug("Google GenAI client initialization failed: %s", e)

    # 2. Try Google REST endpoint as fallback
    try:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-embedding-001:embedContent?key={config.GEMINI_API_KEY}"
        )
        payload: Dict[str, Any] = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text}]},
            "outputDimensionality": EMBEDDING_DIMENSION,
        }
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            values = data.get("embedding", {}).get("values")
            if values and len(values) == EMBEDDING_DIMENSION:
                return values
    except Exception as rest_err:
        logger.debug("Google REST embed failed: %s", rest_err)

    return None


def _get_openrouter_embedding(text: str, max_retries: int = 3, initial_delay: float = 1.0) -> List[float]:
    """
    Generates 768-dimensional embedding via OpenRouter text-embedding-3-small.
    Implements retry with exponential backoff.
    """
    if not config.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not set in environment or configuration.")

    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sirdas.ai",
        "X-Title": "Sirdas AI Data Pipeline",
    }
    payload: Dict[str, Any] = {
        "model": "text-embedding-3-small",
        "input": text,
        "dimensions": EMBEDDING_DIMENSION,
    }

    last_error: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                embeddings = data.get("data", [])
                if not embeddings:
                    raise ValueError(f"OpenRouter returned empty embedding list: {data}")
                vec = embeddings[0].get("embedding", [])
                if len(vec) != EMBEDDING_DIMENSION:
                    raise ValueError(
                        f"Expected {EMBEDDING_DIMENSION} dimensions, got {len(vec)} from OpenRouter"
                    )
                return [float(x) for x in vec]
            elif resp.status_code in (429, 500, 502, 503, 504):
                last_error = RuntimeError(f"OpenRouter HTTP {resp.status_code}: {resp.text}")
                logger.warning(
                    "OpenRouter embedding attempt %d/%d received status %d: %s",
                    attempt,
                    max_retries,
                    resp.status_code,
                    resp.text[:200],
                )
            else:
                resp.raise_for_status()

        except Exception as e:
            last_error = e
            logger.warning("OpenRouter embedding attempt %d/%d failed: %s", attempt, max_retries, e)

        if attempt < max_retries:
            time.sleep(initial_delay * (2 ** (attempt - 1)))

    raise RuntimeError(
        f"Failed to generate OpenRouter embedding after {max_retries} attempts: {last_error}"
    ) from last_error


def get_embedding_768d(text: str) -> List[float]:
    """
    Generates 768-dimensional vector embedding for text.
    Primary: Google text-embedding-004 / gemini-embedding-001.
    Fallback: OpenRouter text-embedding-3-small with dimensions=768.

    Args:
        text: Input text string to embed.

    Returns:
        List of 768 float values.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        raise ValueError("Cannot generate embedding for empty or whitespace-only text.")

    # 1. Primary: Google text-embedding-004 / Gemini
    try:
        google_vec = _get_google_embedding(clean_text)
        if google_vec is not None and len(google_vec) == EMBEDDING_DIMENSION:
            logger.debug("Successfully generated 768d embedding via Google Gemini.")
            return google_vec
    except Exception as e:
        logger.debug("Google embedding attempt encountered exception: %s", e)

    # 2. Resilient Fallback: OpenRouter text-embedding-3-small (dimensions=768)
    logger.debug("Falling back to OpenRouter 768d embedding...")
    return _get_openrouter_embedding(clean_text)


def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generates 768-dimensional embeddings for a batch of texts in a single call.
    """
    if not texts:
        return []

    # Try high-throughput batch embed via Google GenAI client
    if config.GEMINI_API_KEY:
        try:
            client = config.get_gemini_client()
            res = client.models.embed_content(
                model="gemini-embedding-001",
                contents=texts,
                config={"output_dimensionality": EMBEDDING_DIMENSION},
            )
            if hasattr(res, "embeddings") and len(res.embeddings) == len(texts):
                vectors = []
                for e in res.embeddings:
                    vec = list(e.values)
                    if len(vec) == EMBEDDING_DIMENSION:
                        vectors.append(vec)
                if len(vectors) == len(texts):
                    return vectors
        except Exception as e:
            logger.debug("Native Google batch embedding failed, falling back to sequential: %s", e)

    results: List[List[float]] = []
    for t in texts:
        results.append(get_embedding_768d(t))
    return results


# Alias for compatibility
get_embedding = get_embedding_768d
