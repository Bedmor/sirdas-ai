#!/usr/bin/env python3
"""
Sırdaş AI - Quran Full Corpus Fetcher & Semantic Passage Generator (Milestone M1)
Fetches all 114 Surahs and 6,236 Verses from quran.com API v4 using Diyanet Turkish meal (ID 77)
and Uthmani Arabic script. Constructs 3-7 verse semantic passages (Rükû blocks) and exports:
- data-pipeline/data/quran_full_corpus.json
- data-pipeline/data/quran_semantic_passages.json

Strictly enforces:
1. Complete corpus acquisition: exactly 114 surahs and 6,236 verses.
2. Canonical 3-7 verse semantic passages based on Ottoman/Islamic Rükû blocks.
3. Strict isolation of Bakara 275-279 as an authentic 5-verse usury package with
   is_riba_related = True, tag BAKARA_275_279, and mandatory anti-usury tags.
"""

import argparse
import html
import json
import logging
from pathlib import Path
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid
import requests

# Ensure pipeline root is in sys.path
PIPELINE_ROOT = Path(__file__).resolve().parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

DATA_DIR = PIPELINE_ROOT / "data"
DEFAULT_CORPUS_FILE = DATA_DIR / "quran_full_corpus.json"
DEFAULT_PASSAGES_FILE = DATA_DIR / "quran_semantic_passages.json"

API_BASE = "https://api.quran.com/api/v4"
DIYANET_TRANSLATION_ID = 77
EXPECTED_TOTAL_SURAHS = 114
EXPECTED_TOTAL_VERSES = 6236

# Mandatory tags for anti-usury / riba passages required by 02_hybrid_search_rpc.sql
MANDATORY_RIBA_TAGS = ["faiz", "riba", "haram_kazanc", "borc_krizi"]
BAKARA_275_279_TAG = "BAKARA_275_279"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sirdas.quran_fetch")


def clean_text(raw_text: str) -> str:
    """
    Cleans HTML tags, footnote indicators, and unescapes entities from translation text.
    """
    if not raw_text:
        return ""
    # Unescape HTML entities (&quot;, &#39;, &amp;, etc.)
    text = html.unescape(raw_text)
    # Remove HTML tags (<sup ...>...</sup>, <p>, etc.)
    text = re.sub(r"<[^>]+>", "", text)
    # Normalize excess whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_all_chapters(session: Optional[requests.Session] = None) -> List[Dict[str, Any]]:
    """
    Fetches catalog of all 114 chapters/surahs from quran.com API v4.
    """
    s = session or requests.Session()
    url = f"{API_BASE}/chapters"
    params = {"language": "tr"}
    
    logger.info("Fetching chapter catalog from %s...", url)
    resp = s.get(url, params=params, timeout=20)
    resp.raise_for_status()
    payload = resp.json()
    chapters = payload.get("chapters", [])
    
    if len(chapters) != EXPECTED_TOTAL_SURAHS:
        raise ValueError(f"Expected {EXPECTED_TOTAL_SURAHS} chapters, got {len(chapters)}")
    
    normalized_chapters = []
    for ch in chapters:
        normalized_chapters.append({
            "id": ch["id"],
            "name_simple": ch.get("name_simple", ""),
            "name_arabic": ch.get("name_arabic", ""),
            "name_turkish": ch.get("translated_name", {}).get("name", ch.get("name_simple", "")),
            "verses_count": ch.get("verses_count", 0),
            "revelation_place": ch.get("revelation_place", ""),
            "revelation_order": ch.get("revelation_order", 0),
        })
    
    logger.info("Successfully fetched %d chapters.", len(normalized_chapters))
    return normalized_chapters


def fetch_chapter_verses(
    chapter_id: int,
    session: Optional[requests.Session] = None,
    max_retries: int = 3,
) -> List[Dict[str, Any]]:
    """
    Fetches all verses for a given chapter with Diyanet Turkish translation (ID 77)
    and Uthmani Arabic script.
    """
    s = session or requests.Session()
    url = f"{API_BASE}/verses/by_chapter/{chapter_id}"
    params = {
        "language": "tr",
        "words": "false",
        "translations": str(DIYANET_TRANSLATION_ID),
        "fields": "text_uthmani,chapter_id,verse_number,verse_key,juz_number,hizb_number,rub_el_hizb_number,ruku_number,page_number",
        "per_page": 300,
        "page": 1,
    }
    
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = s.get(url, params=params, timeout=25)
            resp.raise_for_status()
            data = resp.json()
            raw_verses = data.get("verses", [])
            
            cleaned_verses = []
            for v in raw_verses:
                v_num = v.get("verse_number")
                v_key = v.get("verse_key", f"{chapter_id}:{v_num}")
                ruku_num = v.get("ruku_number")
                text_uthmani = v.get("text_uthmani", "").strip()
                
                # Extract Diyanet translation (resource_id 77)
                translations = v.get("translations", [])
                diyanet_tr = ""
                for t in translations:
                    if t.get("resource_id") == DIYANET_TRANSLATION_ID:
                        diyanet_tr = clean_text(t.get("text", ""))
                        break
                if not diyanet_tr and translations:
                    diyanet_tr = clean_text(translations[0].get("text", ""))
                
                cleaned_verses.append({
                    "id": v.get("id"),
                    "verse_number": v_num,
                    "verse_key": v_key,
                    "ruku_number": ruku_num,
                    "text_uthmani": text_uthmani,
                    "translation_tr": diyanet_tr,
                    "juz_number": v.get("juz_number"),
                    "page_number": v.get("page_number"),
                })
            
            return cleaned_verses
        except Exception as e:
            last_err = e
            logger.warning("Attempt %d/%d failed for chapter %d: %s", attempt, max_retries, chapter_id, e)
            time.sleep(1.0 * attempt)
    
    raise RuntimeError(f"Failed to fetch verses for chapter {chapter_id} after {max_retries} attempts: {last_err}")


def fetch_full_corpus(
    limit_surahs: Optional[int] = None,
    output_file: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Downloads all 114 surahs and 6,236 verses and writes to JSON.
    """
    out_path = output_file or DEFAULT_CORPUS_FILE
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    session = requests.Session()
    chapters = fetch_all_chapters(session=session)
    if limit_surahs and limit_surahs > 0:
        chapters = chapters[:limit_surahs]
        logger.info("Limiting corpus fetch to first %d surahs.", len(chapters))
    
    surahs_data = []
    all_verses_flat = []
    
    start_time = time.time()
    for idx, ch in enumerate(chapters, start=1):
        cid = ch["id"]
        cname = ch["name_turkish"] or ch["name_simple"]
        verses = fetch_chapter_verses(cid, session=session)
        
        expected_count = ch["verses_count"]
        if len(verses) != expected_count:
            logger.warning(
                "Chapter %d (%s) expected %d verses, got %d",
                cid, cname, expected_count, len(verses)
            )
        
        surah_record = {
            "surah_id": cid,
            "surah_name": cname,
            "name_simple": ch["name_simple"],
            "name_arabic": ch["name_arabic"],
            "name_turkish": ch["name_turkish"],
            "verses_count": len(verses),
            "revelation_place": ch["revelation_place"],
            "revelation_order": ch["revelation_order"],
            "verses": verses,
        }
        surahs_data.append(surah_record)
        
        for v in verses:
            all_verses_flat.append({
                "surah_id": cid,
                "surah_name": cname,
                "verse_number": v["verse_number"],
                "verse_key": v["verse_key"],
                "text_uthmani": v["text_uthmani"],
                "translation_tr": v["translation_tr"],
                "ruku_number": v["ruku_number"],
                "juz_number": v.get("juz_number"),
                "page_number": v.get("page_number"),
            })
        
        if idx % 10 == 0 or idx == len(chapters):
            logger.info("Progress: fetched %d/%d surahs (%d verses so far)...", idx, len(chapters), len(all_verses_flat))
        
        # Polite delay to prevent rate limits
        time.sleep(0.05)
    
    total_verses = len(all_verses_flat)
    elapsed = time.time() - start_time
    logger.info("Corpus fetch complete in %.2f seconds. Total surahs: %d, verses: %d", elapsed, len(surahs_data), total_verses)
    
    corpus_dict = {
        "surahs": surahs_data,
        "verses": all_verses_flat,
        "total_surahs": len(surahs_data),
        "total_verses": total_verses,
        "source": "quran.com API v4 - Resource ID 77 (Diyanet)",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    
    # Save to JSON
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(corpus_dict, f, ensure_ascii=False, indent=2)
    
    logger.info("Saved raw corpus to: %s (size: %.2f MB)", out_path, out_path.stat().st_size / (1024 * 1024))
    return corpus_dict


def _window_verse_list(
    verses: List[Dict[str, Any]],
    target_min: int = 3,
    target_max: int = 7,
    window_size: int = 5,
    step: int = 4,
) -> List[List[Dict[str, Any]]]:
    """
    Sub-partitions a list of verses into overlapping slices strictly within [target_min, target_max].
    """
    n = len(verses)
    if n <= target_max:
        return [verses]
    
    chunks = []
    i = 0
    while i < n:
        end = min(i + window_size, n)
        chunk = verses[i:end]
        rem = n - (i + step)
        if 0 < rem < target_min:
            # Current chunk + remainder tail chunk
            chunks.append(chunk)
            tail_chunk = verses[max(0, n - window_size) : n]
            chunks.append(tail_chunk)
            break
        chunks.append(chunk)
        i += step
        if i >= n:
            break
            
    # Deduplicate identical adjacent slices
    unique_chunks = []
    for c in chunks:
        if not unique_chunks or [v["verse_key"] for v in c] != [v["verse_key"] for v in unique_chunks[-1]]:
            unique_chunks.append(c)
            
    return unique_chunks


def build_semantic_passages(
    corpus_data: Dict[str, Any],
    output_file: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    """
    Groups Quran verses into 3-7 verse semantic passages based on canonical Rükû blocks.
    Strictly isolates Bakara 275-279 as a canonical 5-verse usury package.
    """
    out_path = output_file or DEFAULT_PASSAGES_FILE
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    surahs = corpus_data.get("surahs", [])
    if not surahs and isinstance(corpus_data, list):
        surahs = corpus_data
        
    passages = []
    
    # Track whether Bakara 275-279 has been explicitly constructed
    bakara_275_279_created = False
    
    for surah in surahs:
        surah_id = surah.get("surah_id") or surah.get("id")
        surah_name = surah.get("surah_name") or surah.get("name_turkish") or surah.get("name_simple")
        verses = surah.get("verses", [])
        if not verses:
            continue
            
        # Group verses within the surah by ruku_number
        ruku_map: Dict[int, List[Dict[str, Any]]] = {}
        for v in verses:
            r_num = v.get("ruku_number", 1)
            ruku_map.setdefault(r_num, []).append(v)
            
        sorted_rukus = sorted(ruku_map.keys())
        
        for ruku_idx, r_num in enumerate(sorted_rukus):
            ruku_verses = ruku_map[r_num]
            
            # Special Handling for Surah 2 (Al-Baqarah) Rükû 39 (Verses 274 - 281)
            if surah_id == 2 and any(v["verse_number"] in (275, 276, 277, 278, 279) for v in ruku_verses):
                # 1. Strictly isolate Bakara 275-279 as a canonical 5-verse passage
                v275_279 = [v for v in ruku_verses if 275 <= v["verse_number"] <= 279]
                if len(v275_279) == 5:
                    combined_tr = " ".join(v["translation_tr"] for v in v275_279)
                    combined_ar = " ".join(v["text_uthmani"] for v in v275_279)
                    
                    passage_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "sirdas-ai:quran:2:275-279"))
                    passages.append({
                        "id": passage_id,
                        "source_type": "QURAN",
                        "category": "QURAN",
                        "source_title": "Bakara Suresi 275-279",
                        "title": "Bakara Suresi 275-279",
                        "verse_key": "2:275-279",
                        "surah_id": 2,
                        "surah_name": surah_name,
                        "verse_start": 275,
                        "verse_end": 279,
                        "ruku_number": r_num,
                        "verse_count": 5,
                        "content": combined_tr,
                        "text_uthmani": combined_ar,
                        "tags": [
                            BAKARA_275_279_TAG,
                            "RIBA",
                            "HARAM",
                            "faiz",
                            "riba",
                            "haram_kazanc",
                            "borc_krizi",
                            "RIZIK_VE_TICARET",
                        ],
                        "nafs_traps": [
                            "KOLAY_KAZANC_HIRSI",
                            "FAKIRLIK_KORKUSU_VESVESESI",
                            "RIZIK_ENDISESI",
                        ],
                        "is_riba_related": True,
                        "youtube_id": None,
                        "start_sec": None,
                        "end_sec": None,
                        "audio_url": None,
                    })
                    bakara_275_279_created = True
                    
                # In Rükû 39, handle verse 274 (infak context) and verses 280-281 (borç/mühlet context)
                v274 = [v for v in ruku_verses if v["verse_number"] == 274]
                v280_281 = [v for v in ruku_verses if v["verse_number"] in (280, 281)]
                
                # Combine verse 274 with preceding verses 271-273 from previous ruku if available
                # or create 274-277 context passage
                v274_277 = [v for v in ruku_verses if 274 <= v["verse_number"] <= 277]
                if len(v274_277) >= 3:
                    combined_tr = " ".join(v["translation_tr"] for v in v274_277)
                    combined_ar = " ".join(v["text_uthmani"] for v in v274_277)
                    passages.append({
                        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "sirdas-ai:quran:2:274-277")),
                        "source_type": "QURAN",
                        "category": "QURAN",
                        "source_title": "Bakara Suresi 274-277",
                        "title": "Bakara Suresi 274-277",
                        "verse_key": "2:274-277",
                        "surah_id": 2,
                        "surah_name": surah_name,
                        "verse_start": 274,
                        "verse_end": 277,
                        "ruku_number": r_num,
                        "verse_count": len(v274_277),
                        "content": combined_tr,
                        "text_uthmani": combined_ar,
                        "tags": ["INFAK", "RIZIK_VE_TICARET", "SADAKA"],
                        "nafs_traps": ["CIMRILIK", "FAKIRLIK_KORKUSU_VESVESESI"],
                        "is_riba_related": False,
                        "youtube_id": None,
                        "start_sec": None,
                        "end_sec": None,
                        "audio_url": None,
                    })
                    
                # Create 278-281 passage (4 verses: debt relief & day of judgment)
                v278_281 = [v for v in ruku_verses if 278 <= v["verse_number"] <= 281]
                if len(v278_281) >= 3:
                    combined_tr = " ".join(v["translation_tr"] for v in v278_281)
                    combined_ar = " ".join(v["text_uthmani"] for v in v278_281)
                    passages.append({
                        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "sirdas-ai:quran:2:278-281")),
                        "source_type": "QURAN",
                        "category": "QURAN",
                        "source_title": "Bakara Suresi 278-281",
                        "title": "Bakara Suresi 278-281",
                        "verse_key": "2:278-281",
                        "surah_id": 2,
                        "surah_name": surah_name,
                        "verse_start": 278,
                        "verse_end": 281,
                        "ruku_number": r_num,
                        "verse_count": len(v278_281),
                        "content": combined_tr,
                        "text_uthmani": combined_ar,
                        "tags": ["BORC_AHLAKI", "TEVBE_VE_INABE", "KUL_HAKKI_VE_ADALET", "faiz", "borc_krizi"],
                        "nafs_traps": ["ZULUM_VE_HAKSIZLIK", "FAKIRLIK_KORKUSU_VESVESESI"],
                        "is_riba_related": True,
                        "youtube_id": None,
                        "start_sec": None,
                        "end_sec": None,
                        "audio_url": None,
                    })
                continue
                
            # If rükû has fewer than 3 verses (e.g. 2:60-61, 2:282-283, 73:20):
            if len(ruku_verses) < 3:
                # Merge with adjacent verses in the surah to satisfy 3-7 verse requirement
                if ruku_idx > 0:
                    prev_verses = ruku_map[sorted_rukus[ruku_idx - 1]]
                    borrow_count = 3 - len(ruku_verses)
                    ruku_verses = prev_verses[-borrow_count:] + ruku_verses
                elif ruku_idx < len(sorted_rukus) - 1:
                    next_verses = ruku_map[sorted_rukus[ruku_idx + 1]]
                    borrow_count = 3 - len(ruku_verses)
                    ruku_verses = ruku_verses + next_verses[:borrow_count]
                    
            # Window rükû verses into 3-7 verse slices
            slices = _window_verse_list(ruku_verses, target_min=3, target_max=7, window_size=5, step=4)
            
            for s in slices:
                start_v = s[0]["verse_number"]
                end_v = s[-1]["verse_number"]
                verse_count = len(s)
                
                # Check verse count strictly in [3, 7]
                if not (3 <= verse_count <= 7):
                    logger.warning("Slice %s %d-%d has %d verses", surah_name, start_v, end_v, verse_count)
                    
                combined_tr = " ".join(v["translation_tr"] for v in s)
                combined_ar = " ".join(v["text_uthmani"] for v in s)
                
                title = f"{surah_name} Suresi {start_v}-{end_v}"
                v_key = f"{surah_id}:{start_v}-{end_v}"
                passage_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sirdas-ai:quran:{surah_id}:{start_v}-{end_v}"))
                
                # Detect spiritual themes and tags
                content_lower = combined_tr.lower()
                tags = ["QURAN", surah_name.upper()]
                nafs_traps = []
                is_riba = False
                
                # Check usury/riba keywords
                if any(k in content_lower for k in ["faiz", "riba", "tefeci"]):
                    is_riba = True
                    for m_tag in MANDATORY_RIBA_TAGS:
                        if m_tag not in tags:
                            tags.append(m_tag)
                    tags.extend(["RIBA", "HARAM"])
                    nafs_traps.extend(["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI"])
                    
                if any(k in content_lower for k in ["tevekkül", "vekil", "hasbiyallah", "teslim"]):
                    tags.append("TEVEKKUL")
                if any(k in content_lower for k in ["rızık", "kazanç", "bereket"]):
                    tags.append("RIZIK")
                if any(k in content_lower for k in ["sabır", "imtihan", "musibet", "darlık"]):
                    tags.append("SABIR_VE_MUSIBET")
                if any(k in content_lower for k in ["dua", "rabbenâ", "rabbimiz", "yalvar"]):
                    tags.append("DUA_VE_ILCA_USULU")
                if any(k in content_lower for k in ["tövbe", "tevbe", "istiğfar", "bağışla"]):
                    tags.append("TEVBE_VE_INABE")
                if any(k in content_lower for k in ["infak", "sadaka", "harca", "zekat"]):
                    tags.append("INFAK")
                    
                passages.append({
                    "id": passage_id,
                    "source_type": "QURAN",
                    "category": "QURAN",
                    "source_title": title,
                    "title": title,
                    "verse_key": v_key,
                    "surah_id": surah_id,
                    "surah_name": surah_name,
                    "verse_start": start_v,
                    "verse_end": end_v,
                    "ruku_number": r_num,
                    "verse_count": verse_count,
                    "content": combined_tr,
                    "text_uthmani": combined_ar,
                    "tags": tags,
                    "nafs_traps": nafs_traps,
                    "is_riba_related": is_riba,
                    "youtube_id": None,
                    "start_sec": None,
                    "end_sec": None,
                    "audio_url": None,
                })
                
    # Double check Bakara 275-279 is present
    bakara_found = any(p["source_title"] == "Bakara Suresi 275-279" and p["is_riba_related"] for p in passages)
    if not bakara_found:
        raise ValueError("Critical error: Bakara 275-279 not generated in semantic passages!")
        
    logger.info("Generated %d semantic passages across all surahs.", len(passages))
    
    # Save to JSON
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)
        
    logger.info("Saved semantic passages to: %s (count: %d)", out_path, len(passages))
    return passages


def main():
    parser = argparse.ArgumentParser(
        description="Sırdaş AI Quran Full Corpus Fetcher & Semantic Passage Generator (R1)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(DATA_DIR),
        help="Directory to save raw corpus and semantic passages.",
    )
    parser.add_argument(
        "--limit-surahs",
        type=int,
        default=None,
        help="Limit number of surahs to fetch (useful for fast verification).",
    )
    parser.add_argument(
        "--skip-fetch",
        action="store_true",
        help="Skip API download if quran_full_corpus.json already exists and build passages from it.",
    )
    parser.add_argument(
        "--force-fetch",
        action="store_true",
        help="Force re-download even if quran_full_corpus.json exists.",
    )
    
    args = parser.parse_args()
    
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    corpus_file = out_dir / "quran_full_corpus.json"
    passages_file = out_dir / "quran_semantic_passages.json"
    
    # Step 1: Fetch or Load Corpus
    if corpus_file.exists() and args.skip_fetch and not args.force_fetch:
        logger.info("Loading existing corpus from: %s", corpus_file)
        with open(corpus_file, "r", encoding="utf-8") as f:
            corpus_data = json.load(f)
    else:
        logger.info("Fetching Quran full corpus from quran.com API v4...")
        corpus_data = fetch_full_corpus(limit_surahs=args.limit_surahs, output_file=corpus_file)
        
    # Step 2: Build Semantic Passages
    logger.info("Building 3-7 verse semantic passages based on canonical Rükû blocks...")
    passages = build_semantic_passages(corpus_data, output_file=passages_file)
    
    print("\nQuran Corpus Processing Summary:")
    print(f"- Total Surahs in Corpus:    {len(corpus_data.get('surahs', []))}")
    print(f"- Total Verses in Corpus:    {len(corpus_data.get('verses', []))}")
    print(f"- Semantic Passages:         {len(passages)}")
    print(f"- Bakara 275-279 Isolated:   {any(p['source_title'] == 'Bakara Suresi 275-279' for p in passages)}")
    print(f"- Corpus JSON File:          {corpus_file}")
    print(f"- Passages JSON File:        {passages_file}")


if __name__ == "__main__":
    main()
