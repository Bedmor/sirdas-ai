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
from utils.embedder import get_embedding_768d, get_embeddings_batch, EMBEDDING_DIMENSION

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
        if "ISRAF_VE_IKTISAT_FIKHI" not in enriched_tags:
            enriched_tags.append("ISRAF_VE_IKTISAT_FIKHI")

    # Detect Kader & Kaza Hikmeti
    if any(k in content_lower for k in ["kader", "hızır", "musibet", "kefaret", "hayır"]):
        if "KADER_VE_KAZA_HIKMETI" not in enriched_tags:
            enriched_tags.append("KADER_VE_KAZA_HIKMETI")
        if "KADERE_ITIRAZ_VE_ISYAN" not in enriched_traps and ("isyan" in content_lower or "sitem" in content_lower):
            enriched_traps.append("KADERE_ITIRAZ_VE_ISYAN")

    # Detect Dua & İltica Usulü
    if any(k in content_lower for k in ["dua", "seher", "iltica", "icabet", "secde"]):
        if "DUA_VE_ILCA_USULU" not in enriched_tags:
            enriched_tags.append("DUA_VE_ILCA_USULU")

    # Detect Tevbe & İnabe
    if any(k in content_lower for k in ["tövbe", "tevbe", "zümer 53", "mağfiret", "ümit kesmeyin"]):
        if "TEVBE_VE_INABE" not in enriched_tags:
            enriched_tags.append("TEVBE_VE_INABE")
        if "GECMISIN_PISMANLIK_GIRDABI" not in enriched_traps:
            enriched_traps.append("GECMISIN_PISMANLIK_GIRDABI")

    # Detect Kalp Amelleri & İhlas
    if any(k in content_lower for k in ["ihlas", "huşu", "murakabe", "niyet", "hased", "kin"]):
        if "KALP_AMELLELI_VE_IHLAS" not in enriched_tags:
            enriched_tags.append("KALP_AMELLELI_VE_IHLAS")

    # Detect Siyerde Darlık Dönemleri
    if any(k in content_lower for k in ["taif", "uhud", "hendek", "boykot"]):
        if "SIYERDE_DARLIK_DONEMLERI" not in enriched_tags:
            enriched_tags.append("SIYERDE_DARLIK_DONEMLERI")

    return {
        "tags": enriched_tags,
        "nafs_traps": enriched_traps,
        "is_riba_related": riba_flag,
    }


def load_thematic_corpus(file_path: Path) -> List[Dict[str, Any]]:
    """
    Loads and validates thematic text corpus or Quran passages from JSON file.
    Supports:
    - JSON array of records (e.g. thematic_texts.json, quran_semantic_passages.json)
    - Full Quran corpus dict with 'surahs' key (quran_full_corpus.json)
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Corpus file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict) and "surahs" in data:
        # Full Quran corpus dict: build semantic passages on the fly
        from fetch_quran_corpus import build_semantic_passages
        data = build_semantic_passages(data)

    if not isinstance(data, list):
        raise ValueError(f"Corpus must be a JSON array of records or contain 'surahs', got {type(data)}")

    validated_records = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            logger.warning("Skipping non-dict item at index %d", idx)
            continue

        # 1. Normalize source_type
        source_type = (item.get("source_type") or item.get("category") or "").upper().strip()
        if not source_type:
            if "siyer_id" in item or "olay_adi" in item:
                source_type = "SIYER"
            elif "tefsir_id" in item or "sure" in item:
                source_type = "QURAN"
            elif "hadis_id" in item or "kaynak" in item:
                source_type = "HADITH"
            elif "akaid_id" in item or "eser" in item:
                source_type = "HADITH"
            elif "ihya_id" in item or "kitap_adi" in item:
                source_type = "HADITH"
            elif "ezkar_id" in item or "dua_turkce" in item:
                source_type = "DUA"
            else:
                source_type = "QURAN"

        # 2. Normalize source_title
        source_title = (item.get("source_title") or item.get("title") or "").strip()
        if not source_title:
            if "akaid_id" in item or "eser" in item:
                source_title = f"{item.get('eser', 'Akaid')}: {item.get('baslik', 'İtikad')}"
            elif "ihya_id" in item or "kitap_adi" in item:
                source_title = f"İmam Gazalî - İhyâ: {item.get('kitap_adi', item.get('bolum_adi', 'Ahlak'))}"
            elif "ezkar_id" in item or "eser_adi" in item:
                source_title = f"İmam Nevevî - {item.get('eser_adi', 'el-Ezkâr')}: {item.get('baslik', 'Dua ve Zikir')}"
            elif "siyer_id" in item or "olay_adi" in item:
                donem_str = f" ({item['donem']})" if item.get("donem") else ""
                source_title = f"Siyer-i Nebî: {item.get('olay_adi', 'Olay')}{donem_str}"
            elif "tefsir_id" in item or "sure" in item:
                ayet_str = f" {item['ayet_no']}" if item.get("ayet_no") else ""
                source_title = f"{item.get('sure', 'Sure')}{ayet_str} - Tefsir ve Hikmet"
            elif "hadis_id" in item or "kaynak" in item:
                bab_str = f" - Bab {item['bab_no']}" if item.get("bab_no") else ""
                bolum_str = f" ({item['kitap_bolumu']})" if item.get("kitap_bolumu") else ""
                source_title = f"{item.get('kaynak', 'Hadis')}{bolum_str}{bab_str}"
            else:
                source_title = f"Kaynak-{idx}"

        # 3. Normalize content
        content = (item.get("content") or "").strip()
        if not content:
            if "akaid_id" in item or "eser" in item:
                serh_part = f"\n\nŞerh ve Delil: {item['serh_ve_hikmet']}" if item.get("serh_ve_hikmet") else ""
                hikmet_part = f"\n\nManevi Hikmet: {item['manevi_hikmet']}" if item.get("manevi_hikmet") else ""
                content = f"İtikad Esası: \"{item.get('turkce_metin', '')}\"{serh_part}{hikmet_part}"
            elif "ihya_id" in item or "kitap_adi" in item:
                ozet_part = f"\n\nİhyâ Hikmeti: {item['ozet_hikmet']}" if item.get("ozet_hikmet") else ""
                ders_part = f"\n\nNefis Terbiyesi Dersi: {item['nefis_terbiyesi']}" if item.get("nefis_terbiyesi") else ""
                content = f"Ahlak ve Kalp Ameli: \"{item.get('turkce_metin', '')}\"{ozet_part}{ders_part}"
            elif "ezkar_id" in item or "dua_turkce" in item:
                kaynak_part = f" [Kaynak: {item['kaynak']}]" if item.get("kaynak") else ""
                serh_part = f"\n\nŞerh: {item['serh']}" if item.get("serh") else ""
                hikmet_part = f"\n\nManevi Hikmet: {item['manevi_hikmet']}" if item.get("manevi_hikmet") else ""
                content = f"Dua ve Zikir: \"{item.get('dua_turkce', '')}\"{kaynak_part}{serh_part}{hikmet_part}"
            elif "turkce_meal" in item:
                kaynak_info = f" [Kaynak: {item.get('kaynak', '')}, Derece: {item.get('sahihlik_derecesi', 'Sahih')}]" if item.get("kaynak") else ""
                content = f"Resûlullah (s.a.v.) buyurdu: \"{item.get('turkce_meal', '')}\"{kaynak_info}"
            elif "ozet_metin" in item:
                hikmet_part = f"\n\nManevi Hikmet ve Çözüm: {item['manevi_hikmet']}" if item.get("manevi_hikmet") else ""
                content = f"{item.get('ozet_metin', '')}{hikmet_part}"
            elif "ayet_meali" in item:
                tefsir_part = f"\n\nNüzul Sebebi ve Tefsir Hikmeti: {item['nuzul_sebebi_ve_tefsir']}" if item.get("nuzul_sebebi_ve_tefsir") else ""
                hikmet_part = f"\n\nManevi Hikmet: {item['manevi_hikmet']}" if item.get("manevi_hikmet") else ""
                content = f"Ayet-i Kerime: \"{item.get('ayet_meali', '')}\"{tefsir_part}{hikmet_part}"

        if not source_title or not content:
            logger.warning("Skipping entry with empty title or content at index %d", idx)
            continue

        if source_type not in VALID_SOURCE_TYPES:
            logger.warning("Unknown source_type '%s' for '%s', skipping", source_type, source_title)
            continue

        # 4. Normalize record_id as valid UUID
        raw_id = (
            item.get("id") or
            item.get("hadis_id") or
            item.get("siyer_id") or
            item.get("tefsir_id") or
            item.get("akaid_id") or
            item.get("ihya_id") or
            item.get("ezkar_id")
        )
        record_id = None
        if raw_id:
            try:
                uuid_obj = uuid.UUID(str(raw_id))
                record_id = str(uuid_obj)
            except ValueError:
                record_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sirdas-ai:{source_type}:{raw_id}"))
        else:
            record_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sirdas-ai:{source_type}:{source_title}"))

        tags = list(item.get("tags") or [])
        if item.get("kategori_etiketleri"):
            for k in item["kategori_etiketleri"]:
                if k not in tags:
                    tags.append(k)
        if item.get("duygu_ve_kriz_etiketleri"):
            for d in item["duygu_ve_kriz_etiketleri"]:
                if d not in tags:
                    tags.append(d)

        nafs_traps = list(item.get("nafs_traps") or [])
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
    source: str = "thematic",
    dry_run: bool = False,
    batch_size: int = 5,
    category: Optional[str] = None,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Main execution routine for text knowledge ingestion pipeline.

    Args:
        data_file: Optional explicit path to JSON corpus file.
        source: Corpus source selection ('thematic', 'quran', 'all'). Defaults to 'thematic'.
        dry_run: If True, computes embeddings and validates schema without DB writes.
        batch_size: Number of records per embedding/upsert batch.
        category: Filter by source_type (e.g. 'QURAN', 'HADITH', 'DUA', 'SIYER', 'ALL').
        limit: Max records to process (for testing).

    Returns:
        Summary dict containing counts and status.
    """
    thematic_path = PIPELINE_ROOT / "data" / "thematic_texts.json"
    hadith_path = PIPELINE_ROOT / "data" / "hadith_kutub_sitte.json"
    siyer_path = PIPELINE_ROOT / "data" / "siyer_kriz_matrisi.json"
    tefsir_path = PIPELINE_ROOT / "data" / "tefsir_hikmet_corpus.json"
    akaid_path = PIPELINE_ROOT / "data" / "akaid_fikhul_ekber_tahavi.json"
    ihya_path = PIPELINE_ROOT / "data" / "ihyau_ulumiddin_gazali.json"
    ezkar_path = PIPELINE_ROOT / "data" / "ezkar_nevevi.json"
    passages_path = PIPELINE_ROOT / "data" / "quran_semantic_passages.json"
    corpus_path = PIPELINE_ROOT / "data" / "quran_full_corpus.json"

    logger.info("Starting Text Ingestion Pipeline")
    logger.info(
        "Config: dry_run=%s, batch_size=%d, category=%s, source=%s, data_file=%s",
        dry_run, batch_size, category, source, data_file,
    )

    if data_file is not None:
        records = load_thematic_corpus(data_file)
    elif source == "hadith":
        records = load_thematic_corpus(hadith_path)
    elif source == "siyer":
        records = load_thematic_corpus(siyer_path)
    elif source == "tefsir":
        records = load_thematic_corpus(tefsir_path)
    elif source == "akaid":
        records = load_thematic_corpus(akaid_path)
    elif source == "ihya":
        records = load_thematic_corpus(ihya_path)
    elif source == "ezkar":
        records = load_thematic_corpus(ezkar_path)
    elif source == "quran":
        target = passages_path if passages_path.exists() else corpus_path
        records = load_thematic_corpus(target)
    elif source == "all":
        sources_to_load = [thematic_path, hadith_path, siyer_path, tefsir_path, akaid_path, ihya_path, ezkar_path]
        all_raw_records = []
        for p in sources_to_load:
            if p.exists():
                all_raw_records.extend(load_thematic_corpus(p))
        target = passages_path if passages_path.exists() else corpus_path
        if target.exists():
            all_raw_records.extend(load_thematic_corpus(target))
        seen_ids = set()
        seen_titles = set()
        records = []
        for r in all_raw_records:
            if r["id"] in seen_ids or r["source_title"] in seen_titles:
                continue
            seen_ids.add(r["id"])
            seen_titles.add(r["source_title"])
            records.append(r)
    else:  # source == "thematic"
        records = load_thematic_corpus(thematic_path)

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
        batch_texts = [item["content"] for item in batch]
        batch_vectors = get_embeddings_batch(batch_texts)

        for item, embedding_vector in zip(batch, batch_vectors):
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
        "--source",
        type=str,
        default="thematic",
        choices=["thematic", "quran", "hadith", "siyer", "tefsir", "akaid", "ihya", "ezkar", "all"],
        help="Corpus source to ingest: thematic, quran, hadith, siyer, tefsir, akaid, ihya, ezkar, or all.",
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
            source=args.source,
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
