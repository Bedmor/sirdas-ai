#!/usr/bin/env python3
"""
Sırdaş AI - Phase 2 Text Knowledge Ingestion Pipeline
Parses Quranic passages, Sahih Hadith, Prophetic Duas, and Siyer narratives.
Generates 768-dimensional vector embeddings and upserts into Supabase knowledge_chunks table.
Strictly enforces the Mandatory Bakara 275-279 Riba Package for anti-usury retrieval.
"""

import argparse
import json
import logging
import os
from pathlib import Path
import sys
import time
from typing import Any, Dict, List, Optional
import uuid

# Ensure pipeline root is in sys.path
PIPELINE_ROOT = Path(__file__).resolve().parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

import config
from utils.embedder import get_embedding_768d, EMBEDDING_DIMENSION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sirdas.text_ingest")

VALID_SOURCE_TYPES = {"QURAN", "HADITH", "DUA", "SIYER", "HALIS_AYDEMIR"}

# Mandatory tags for anti-usury / riba passages required by 02_hybrid_search_rpc.sql
MANDATORY_RIBA_TAGS = ["faiz", "riba", "haram_kazanc", "borc_krizi"]
BAKARA_275_279_TAG = "BAKARA_275_279"


def enrich_jev_primitives(
    content: str,
    source_title: str,
    source_type: str,
    tags: List[str],
    nafs_traps: List[str],
    is_riba_related: bool,
) -> Dict[str, Any]:
    """
    Applies rule-based Jev System 1 primitive tagging and validates spiritual guardrails.
    Ensures Bakara 275-279 and any usury-related content have high-priority anti-usury tags
    matching Supabase hybrid search RPC specifications.
    """
    enriched_tags = list(tags) if tags else []
    enriched_traps = list(nafs_traps) if nafs_traps else []
    riba_flag = is_riba_related

    content_lower = content.lower()
    title_lower = source_title.lower()

    # Detect Riba / Usury contexts
    is_bakara_riba = "275" in title_lower or "bakara 275" in content_lower or "faiz yiyenler" in content_lower
    has_riba_keywords = any(k in content_lower or k in title_lower for k in ["faiz", "riba", "ribâ", "tefeci"])

    if is_bakara_riba or has_riba_keywords or riba_flag:
        riba_flag = True
        for m_tag in MANDATORY_RIBA_TAGS:
            if m_tag not in enriched_tags:
                enriched_tags.append(m_tag)
        if "RIBA" not in enriched_tags:
            enriched_tags.append("RIBA")
        if "HARAM" not in enriched_tags:
            enriched_tags.append("HARAM")
        if is_bakara_riba and BAKARA_275_279_TAG not in enriched_tags:
            enriched_tags.insert(0, BAKARA_275_279_TAG)

        # Ensure Riba-related Nafs traps
        if "KOLAY_KAZANC_HIRSI" not in enriched_traps:
            enriched_traps.append("KOLAY_KAZANC_HIRSI")
        if "FAKIRLIK_KORKUSU_VESVESESI" not in enriched_traps:
            enriched_traps.append("FAKIRLIK_KORKUSU_VESVESESI")

    # Detect Tevekkül & Rızık contexts
    if any(k in content_lower for k in ["tevekkül", "çıkış yolu", "beklemediği yerden", "rızık"]):
        if "TEVEKKUL" not in enriched_tags:
            enriched_tags.append("TEVEKKUL")
        if "RIZIK" not in enriched_tags:
            enriched_tags.append("RIZIK")

    # Detect Infak & Sadaka contexts
    if any(k in content_lower for k in ["sadaka", "infak", "eksiltmez"]):
        if "INFAK" not in enriched_tags:
            enriched_tags.append("INFAK")

    return {
        "tags": enriched_tags,
        "nafs_traps": enriched_traps,
        "is_riba_related": riba_flag,
    }


def load_thematic_corpus(file_path: Path) -> List[Dict[str, Any]]:
    """
    Loads and validates thematic text corpus from JSON file.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Corpus file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError(f"Corpus must be a JSON array of records, got {type(data)}")

    validated_records = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            logger.warning("Skipping non-dict item at index %d", idx)
            continue

        source_type = (item.get("source_type") or "").upper().strip()
        source_title = (item.get("source_title") or "").strip()
        content = (item.get("content") or "").strip()

        if not source_title or not content:
            logger.warning("Skipping entry with empty title or content at index %d", idx)
            continue

        if source_type not in VALID_SOURCE_TYPES:
            logger.warning("Unknown source_type '%s' for '%s', skipping", source_type, source_title)
            continue

        record_id = item.get("id")
        if not record_id:
            # Deterministic UUID generation
            record_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sirdas-ai:{source_type}:{source_title}"))

        tags = item.get("tags") or []
        nafs_traps = item.get("nafs_traps") or []
        is_riba = bool(item.get("is_riba_related", False))

        # Enrich with Jev primitives and validate mandatory tags
        enriched = enrich_jev_primitives(content, source_title, source_type, tags, nafs_traps, is_riba)

        validated_records.append({
            "id": record_id,
            "source_type": source_type,
            "source_title": source_title,
            "content": content,
            "tags": enriched["tags"],
            "nafs_traps": enriched["nafs_traps"],
            "is_riba_related": enriched["is_riba_related"],
            "youtube_id": item.get("youtube_id"),
            "start_sec": item.get("start_sec"),
            "end_sec": item.get("end_sec"),
            "audio_url": item.get("audio_url"),
        })

    logger.info("Successfully loaded and validated %d records from %s", len(validated_records), file_path.name)
    return validated_records


def ingest_texts(
    data_file: Optional[Path] = None,
    dry_run: bool = False,
    batch_size: int = 5,
    category: Optional[str] = None,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Main execution routine for text knowledge ingestion pipeline.

    Args:
        data_file: Path to JSON corpus file.
        dry_run: If True, computes embeddings and validates schema without DB writes.
        batch_size: Number of records per embedding/upsert batch.
        category: Filter by source_type (e.g. 'QURAN', 'HADITH', 'DUA', 'SIYER', 'ALL').
        limit: Max records to process (for testing).

    Returns:
        Summary dict containing counts and status.
    """
    if data_file is None:
        data_file = PIPELINE_ROOT / "data" / "thematic_texts.json"

    logger.info("Starting Text Ingestion Pipeline")
    logger.info("Config: dry_run=%s, batch_size=%d, category=%s, data_file=%s", dry_run, batch_size, category, data_file)

    records = load_thematic_corpus(data_file)

    # Filter by category if specified
    if category and category.upper() != "ALL":
        target_cat = category.upper()
        records = [r for r in records if r["source_type"] == target_cat]
        logger.info("Filtered to %d records for category '%s'", len(records), target_cat)

    if limit and limit > 0:
        records = records[:limit]
        logger.info("Limited to %d records", len(records))

    if not records:
        logger.warning("No records to process.")
        return {"total": 0, "embedded": 0, "upserted": 0, "dry_run": dry_run}

    # Verify Bakara 275-279 is present and valid
    bakara_chunks = [r for r in records if BAKARA_275_279_TAG in r["tags"]]
    if not dry_run or (not category or category.upper() in ("ALL", "QURAN")):
        if bakara_chunks:
            logger.info("Mandatory Bakara 275-279 chunk verified: %s", bakara_chunks[0]["source_title"])
            assert bakara_chunks[0]["is_riba_related"] is True, "Bakara 275-279 must have is_riba_related = True"
            for required_tag in MANDATORY_RIBA_TAGS:
                assert required_tag in bakara_chunks[0]["tags"], f"Bakara 275-279 missing mandatory tag: {required_tag}"
        else:
            logger.warning("Bakara 275-279 not present in current filtered subset.")

    # Initialize Supabase client if not dry-run
    supabase_client = None
    if not dry_run:
        supabase_client = config.get_supabase_client()
        logger.info("Connected to Supabase at: %s", config.SUPABASE_URL)

    total_count = len(records)
    embedded_count = 0
    upserted_count = 0
    riba_count = 0

    start_time = time.time()

    for i in range(0, total_count, batch_size):
        batch = records[i : i + batch_size]
        logger.info("Processing batch %d-%d of %d...", i + 1, min(i + batch_size, total_count), total_count)

        payload_batch = []
        for item in batch:
            # Generate 768d vector embedding
            embedding_vector = get_embedding_768d(item["content"])
            if len(embedding_vector) != EMBEDDING_DIMENSION:
                raise ValueError(
                    f"Invalid embedding dimension {len(embedding_vector)} for '{item['source_title']}', expected {EMBEDDING_DIMENSION}"
                )

            embedded_count += 1
            if item["is_riba_related"]:
                riba_count += 1

            payload = {
                "id": item["id"],
                "source_type": item["source_type"],
                "source_title": item["source_title"],
                "content": item["content"],
                "tags": item["tags"],
                "nafs_traps": item["nafs_traps"],
                "is_riba_related": item["is_riba_related"],
                "youtube_id": item["youtube_id"],
                "start_sec": item["start_sec"],
                "end_sec": item["end_sec"],
                "audio_url": item["audio_url"],
                "embedding": embedding_vector,
            }
            payload_batch.append(payload)

        if not dry_run and supabase_client is not None:
            # Upsert into Supabase table knowledge_chunks
            try:
                res = supabase_client.table("knowledge_chunks").upsert(
                    payload_batch,
                    on_conflict="id",
                ).execute()
                upserted_count += len(payload_batch)
                logger.info("Successfully upserted %d chunks to Supabase.", len(payload_batch))
            except Exception as e:
                logger.error("Failed to upsert batch into Supabase: %s", e)
                raise
        else:
            logger.info("[DRY-RUN] Validated batch of %d chunks with 768d embeddings (skipped DB write).", len(payload_batch))
            upserted_count += len(payload_batch)

    elapsed_time = time.time() - start_time
    logger.info("=" * 60)
    logger.info("Text Ingestion Pipeline Completed in %.2f seconds", elapsed_time)
    logger.info("Total Chunks Processed: %d", total_count)
    logger.info("768d Vectors Generated: %d", embedded_count)
    logger.info("Riba-Related Packages:  %d", riba_count)
    logger.info("Chunks Upserted to DB:  %d %s", upserted_count, "(DRY-RUN simulated)" if dry_run else "")
    logger.info("=" * 60)

    return {
        "total": total_count,
        "embedded": embedded_count,
        "riba_related": riba_count,
        "upserted": upserted_count,
        "dry_run": dry_run,
        "elapsed_seconds": round(elapsed_time, 2),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Sırdaş AI Semantic Text Ingestion Pipeline (Quran, Hadith, Duas, Siyer)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate parsing and generate embeddings without writing to Supabase.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=5,
        help="Batch size for embedding generation and database upserts (default: 5).",
    )
    parser.add_argument(
        "--category",
        type=str,
        default="ALL",
        help="Filter corpus by source_type (ALL, QURAN, HADITH, DUA, SIYER).",
    )
    parser.add_argument(
        "--data-file",
        type=str,
        default=None,
        help="Custom path to JSON text corpus file.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of records to ingest.",
    )

    args = parser.parse_args()

    custom_file = Path(args.data_file) if args.data_file else None

    try:
        summary = ingest_texts(
            data_file=custom_file,
            dry_run=args.dry_run,
            batch_size=args.batch_size,
            category=args.category,
            limit=args.limit,
        )
        print("\nIngestion Summary:", json.dumps(summary, indent=2))
        sys.exit(0)
    except Exception as e:
        logger.exception("Text ingestion pipeline encountered fatal error: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
