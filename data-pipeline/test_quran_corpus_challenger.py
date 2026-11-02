#!/usr/bin/env python3
"""
Sırdaş AI - Adversarial Empirical Challenge Suite for Quran Full Corpus & Ingestion (R1, R4)
Author: Empirical Challenger 1 (Quran Corpus Stress Tester)

Tasks verified:
1. quran_full_corpus.json contains exactly 114 surahs and 6,236 verses with non-empty translation and arabic text.
   All 114 surahs strictly match canonical Hafs verse counts.
   All verses have strictly monotonic verse numbers, valid juz (1-30), valid page (1-604), and no HTML tags.
2. quran_semantic_passages.json contains exactly 1,546 passages, every single one strictly between 3 and 7 verses.
   All passages have valid UUID, proper bounding, and non-empty content and arabic text.
3. Bakara 275-279 exists, is_riba_related: True, contains 'BAKARA_275_279' in tags, plus mandatory anti-usury tags and nafs traps.
4. ingest_texts.py dry-run with --source all runs without error, verifies 768d embedding generation, and handles boundary stress.
"""

import json
import logging
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
import uuid

# Ensure pipeline root is in sys.path
PIPELINE_ROOT = Path(__file__).resolve().parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

import config
from ingest_texts import (
    load_thematic_corpus,
    ingest_texts,
    enrich_jev_primitives,
    MANDATORY_RIBA_TAGS,
    BAKARA_275_279_TAG,
)
from utils.embedder import get_embedding_768d, EMBEDDING_DIMENSION

logging.basicConfig(level=logging.WARNING)

CANONICAL_HAFS_VERSE_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
    5, 4, 5, 6
]


class TestQuranFullCorpus(unittest.TestCase):
    """
    Empirical assertions on data-pipeline/data/quran_full_corpus.json.
    """

    @classmethod
    def setUpClass(cls):
        cls.corpus_path = PIPELINE_ROOT / "data" / "quran_full_corpus.json"
        if not cls.corpus_path.exists():
            raise FileNotFoundError(f"Corpus file missing: {cls.corpus_path}")
        with open(cls.corpus_path, "r", encoding="utf-8") as f:
            cls.corpus = json.load(f)

    def test_corpus_file_metadata(self):
        """Corpus must have valid top-level metadata declaring 114 surahs and 6,236 verses."""
        self.assertIn("surahs", self.corpus)
        self.assertEqual(self.corpus.get("total_surahs"), 114)
        self.assertEqual(self.corpus.get("total_verses"), 6236)
        self.assertIsInstance(self.corpus.get("surahs"), list)
        self.assertEqual(len(self.corpus["surahs"]), 114)

    def test_all_114_surahs_match_canonical_hafs_counts(self):
        """Every single surah 1..114 must match the canonical Hafs verse count."""
        surahs = self.corpus["surahs"]
        self.assertEqual(len(surahs), 114)
        
        for idx, expected_count in enumerate(CANONICAL_HAFS_VERSE_COUNTS):
            surah = surahs[idx]
            sid = surah.get("surah_id")
            sname = surah.get("surah_name")
            self.assertEqual(sid, idx + 1, f"Surah at index {idx} has ID {sid}, expected {idx + 1}")
            self.assertEqual(
                surah.get("verses_count"),
                expected_count,
                f"Surah {sid} ({sname}) metadata declared {surah.get('verses_count')}, expected {expected_count}"
            )
            verses = surah.get("verses", [])
            self.assertEqual(
                len(verses),
                expected_count,
                f"Surah {sid} ({sname}) contains {len(verses)} verses, expected {expected_count}"
            )

    def test_exact_total_verses_and_non_empty_content(self):
        """Total verses across all surahs must equal 6,236, with zero empty translations or Arabic texts."""
        surahs = self.corpus["surahs"]
        total_verses = 0
        seen_keys = set()
        arabic_regex = re.compile(r"[\u0600-\u06FF]")

        for surah in surahs:
            sid = surah["surah_id"]
            verses = surah.get("verses", [])
            total_verses += len(verses)

            for expected_vnum, v in enumerate(verses, start=1):
                vnum = v.get("verse_number")
                self.assertEqual(vnum, expected_vnum, f"Surah {sid} verse out of order: {vnum} != {expected_vnum}")

                vkey = v.get("verse_key")
                expected_key = f"{sid}:{vnum}"
                self.assertEqual(vkey, expected_key, f"Verse key mismatch: {vkey} != {expected_key}")
                self.assertNotIn(vkey, seen_keys, f"Duplicate verse key detected: {vkey}")
                seen_keys.add(vkey)

                # Check non-empty Turkish translation
                tr = v.get("translation_tr")
                self.assertIsNotNone(tr, f"Verse {vkey} translation_tr is None")
                self.assertIsInstance(tr, str, f"Verse {vkey} translation_tr is not str")
                clean_tr = tr.strip()
                self.assertGreater(len(clean_tr), 0, f"Verse {vkey} has empty translation_tr")
                self.assertNotIn("<sup", clean_tr, f"Verse {vkey} contains uncleaned HTML <sup>: {clean_tr[:50]}")
                self.assertNotIn("</sup>", clean_tr, f"Verse {vkey} contains uncleaned HTML </sup>: {clean_tr[:50]}")

                # Check non-empty Arabic text
                ar = v.get("text_uthmani")
                self.assertIsNotNone(ar, f"Verse {vkey} text_uthmani is None")
                self.assertIsInstance(ar, str, f"Verse {vkey} text_uthmani is not str")
                clean_ar = ar.strip()
                self.assertGreaterEqual(len(clean_ar), 1, f"Verse {vkey} has empty text_uthmani")
                self.assertTrue(arabic_regex.search(clean_ar), f"Verse {vkey} lacks Arabic characters: '{clean_ar}'")

                # Check ruku_number
                ruku = v.get("ruku_number")
                self.assertIsInstance(ruku, int, f"Verse {vkey} invalid ruku_number {ruku}")
                self.assertGreaterEqual(ruku, 1, f"Verse {vkey} ruku_number must be >= 1")

                # Check juz and page numbers if present
                if "juz_number" in v and v["juz_number"] is not None:
                    self.assertTrue(1 <= v["juz_number"] <= 30, f"Invalid juz {v['juz_number']} in {vkey}")
                if "page_number" in v and v["page_number"] is not None:
                    self.assertTrue(1 <= v["page_number"] <= 604, f"Invalid page {v['page_number']} in {vkey}")

        self.assertEqual(total_verses, 6236, f"Counted {total_verses} verses, expected exactly 6,236")
        self.assertEqual(len(seen_keys), 6236)


class TestQuranSemanticPassages(unittest.TestCase):
    """
    Empirical assertions on data-pipeline/data/quran_semantic_passages.json.
    """

    @classmethod
    def setUpClass(cls):
        cls.passages_path = PIPELINE_ROOT / "data" / "quran_semantic_passages.json"
        if not cls.passages_path.exists():
            raise FileNotFoundError(f"Passages file missing: {cls.passages_path}")
        with open(cls.passages_path, "r", encoding="utf-8") as f:
            cls.passages = json.load(f)

    def test_passages_total_count(self):
        """Passages file must contain exactly 1,546 semantic passages."""
        self.assertIsInstance(self.passages, list)
        self.assertEqual(
            len(self.passages),
            1546,
            f"Expected exactly 1,546 passages, got {len(self.passages)}"
        )

    def test_all_passages_strictly_between_3_and_7_verses(self):
        """Every single passage must have verse count strictly in [3, 7] (inclusive)."""
        distribution = {3: 0, 4: 0, 5: 0, 6: 0, 7: 0}
        out_of_bounds = []

        for p in self.passages:
            vc = p.get("verse_count")
            v_start = p.get("verse_start")
            v_end = p.get("verse_end")
            title = p.get("source_title", "Unknown")

            self.assertIsNotNone(vc, f"Passage {title} missing verse_count")
            self.assertIsNotNone(v_start, f"Passage {title} missing verse_start")
            self.assertIsNotNone(v_end, f"Passage {title} missing verse_end")

            calc_vc = v_end - v_start + 1
            self.assertEqual(
                vc, calc_vc,
                f"Passage {title} verse_count ({vc}) does not match v_end - v_start + 1 ({calc_vc})"
            )

            if vc < 3 or vc > 7:
                out_of_bounds.append((title, vc))
            else:
                distribution[vc] += 1

        self.assertEqual(
            len(out_of_bounds), 0,
            f"Found {len(out_of_bounds)} passages outside [3, 7] verse bounds: {out_of_bounds[:10]}"
        )
        self.assertEqual(sum(distribution.values()), 1546)
        # Check distribution matches empirical facts:
        self.assertEqual(distribution[3], 95)
        self.assertEqual(distribution[4], 125)
        self.assertEqual(distribution[5], 1225)
        self.assertEqual(distribution[6], 47)
        self.assertEqual(distribution[7], 54)

    def test_passage_schema_and_integrity(self):
        """Every passage must have valid UUID id, non-empty content, and non-empty text_uthmani."""
        seen_ids = set()
        for idx, p in enumerate(self.passages):
            pid = p.get("id")
            self.assertTrue(pid, f"Passage {idx} missing id")
            try:
                uuid.UUID(pid)
            except ValueError:
                self.fail(f"Passage {idx} id '{pid}' is not a valid UUID")
            self.assertNotIn(pid, seen_ids, f"Duplicate passage id {pid}")
            seen_ids.add(pid)

            self.assertEqual(p.get("source_type"), "QURAN")
            self.assertEqual(p.get("category"), "QURAN")

            content = p.get("content", "").strip()
            self.assertGreater(len(content), 20, f"Passage {pid} has suspiciously short content: '{content}'")

            arabic = p.get("text_uthmani", "").strip()
            self.assertGreater(len(arabic), 20, f"Passage {pid} has suspiciously short text_uthmani: '{arabic}'")


class TestBakaraRibaPackage(unittest.TestCase):
    """
    Empirical assertions for Bakara 275-279 anti-usury package.
    """

    @classmethod
    def setUpClass(cls):
        passages_path = PIPELINE_ROOT / "data" / "quran_semantic_passages.json"
        with open(passages_path, "r", encoding="utf-8") as f:
            cls.passages = json.load(f)

    def test_bakara_275_279_presence_and_attributes(self):
        """Bakara 275-279 must exist, have 5 verses, is_riba_related=True, and BAKARA_275_279 tag."""
        matches = [
            p for p in self.passages
            if p.get("surah_id") == 2 and p.get("verse_start") == 275 and p.get("verse_end") == 279
        ]
        self.assertEqual(len(matches), 1, f"Expected exactly 1 Bakara 275-279 passage, found {len(matches)}")
        
        target = matches[0]
        self.assertEqual(target.get("source_title"), "Bakara Suresi 275-279")
        self.assertEqual(target.get("verse_key"), "2:275-279")
        self.assertEqual(target.get("verse_count"), 5)
        self.assertTrue(target.get("is_riba_related"), "is_riba_related must be True for Bakara 275-279")

        tags = target.get("tags", [])
        self.assertIn(BAKARA_275_279_TAG, tags, f"Tags must contain {BAKARA_275_279_TAG}")
        for m_tag in MANDATORY_RIBA_TAGS:
            self.assertIn(m_tag, tags, f"Tags must contain mandatory tag {m_tag}")

        nafs = target.get("nafs_traps", [])
        self.assertIn("KOLAY_KAZANC_HIRSI", nafs)
        self.assertIn("FAKIRLIK_KORKUSU_VESVESESI", nafs)

        content = target.get("content", "")
        self.assertIn("faiz", content.lower())
        self.assertIn("Faiz yiyenler", content)

        arabic = target.get("text_uthmani", "")
        self.assertIn("ٱلرِّبَوٰا۟", arabic)

    def test_unique_direct_tagging_in_raw_passages(self):
        """In quran_semantic_passages.json, exactly one passage is explicitly pre-tagged with BAKARA_275_279."""
        tagged = [p for p in self.passages if BAKARA_275_279_TAG in p.get("tags", [])]
        self.assertEqual(len(tagged), 1)
        self.assertEqual(tagged[0]["source_title"], "Bakara Suresi 275-279")


class TestIngestTextsStressAndDryRun(unittest.TestCase):
    """
    Stress-testing text knowledge ingestion with --source all and boundary conditions.
    """

    def test_load_all_records_via_ingest_loader(self):
        """load_thematic_corpus must successfully validate all 1,546 passages without error."""
        passages_path = PIPELINE_ROOT / "data" / "quran_semantic_passages.json"
        records = load_thematic_corpus(passages_path)
        self.assertEqual(len(records), 1546)

        # Check Bakara 275-279 chunk in loaded records
        bakara = [r for r in records if r["source_title"] == "Bakara Suresi 275-279"]
        self.assertEqual(len(bakara), 1)
        self.assertTrue(bakara[0]["is_riba_related"])
        self.assertIn(BAKARA_275_279_TAG, bakara[0]["tags"])
        self.assertIn("RIBA", bakara[0]["tags"])
        self.assertIn("HARAM", bakara[0]["tags"])

    def test_ingest_dry_run_source_all_with_limit(self):
        """ingest_texts dry-run with source='all' must process chunks and generate 768d vectors."""
        result = ingest_texts(
            source="all",
            dry_run=True,
            batch_size=3,
            limit=3,
        )
        self.assertEqual(result["total"], 3)
        self.assertEqual(result["embedded"], 3)
        self.assertEqual(result["upserted"], 3)
        self.assertTrue(result["dry_run"])
        self.assertGreater(result["elapsed_seconds"], 0.0)

    def test_cli_dry_run_source_all(self):
        """Subprocess execution of ingest_texts.py --dry-run --source all --limit 4 must exit 0."""
        python_bin = sys.executable
        cmd = [
            python_bin,
            str(PIPELINE_ROOT / "ingest_texts.py"),
            "--dry-run",
            "--source", "all",
            "--limit", "4",
            "--batch-size", "2",
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, f"CLI exited with error: {proc.stderr}")
        self.assertIn("Text Ingestion Pipeline Completed", proc.stderr)
        self.assertIn('"dry_run": true', proc.stdout)

    def test_cli_dry_run_source_quran(self):
        """Subprocess execution of ingest_texts.py --dry-run --source quran --limit 3 must exit 0."""
        python_bin = sys.executable
        cmd = [
            python_bin,
            str(PIPELINE_ROOT / "ingest_texts.py"),
            "--dry-run",
            "--source", "quran",
            "--limit", "3",
            "--batch-size", "3",
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, f"CLI exited with error: {proc.stderr}")
        self.assertIn("Text Ingestion Pipeline Completed", proc.stderr)
        self.assertIn('"dry_run": true', proc.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
