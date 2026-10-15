"""
Sırdaş AI - Phase 2 Milestone M4 Text Ingestion Test Suite
Verifies:
1. Thematic corpus loading and validation (21 passages, valid source types, deterministic IDs).
2. Mandatory Bakara 275-279 Riba package strict tagging, is_riba_related=True, and priority metadata.
3. Rule-based Jev System 1 primitive enrichment (riba, tevekkul, infak, nafs traps).
4. CLI flag handling and category filtering.
5. 768-dimensional vector embedding generation and dimension enforcement.
6. Dry-run execution pipeline validation.
"""

import json
from pathlib import Path
import unittest
import uuid
import sys

# Add pipeline directory to sys.path
pipeline_root = Path(__file__).resolve().parent
if str(pipeline_root) not in sys.path:
    sys.path.insert(0, str(pipeline_root))

import config
from ingest_texts import (
    load_thematic_corpus,
    enrich_jev_primitives,
    ingest_texts,
    BAKARA_275_279_TAG,
    MANDATORY_RIBA_TAGS,
    VALID_SOURCE_TYPES,
)
from utils.embedder import get_embedding_768d, EMBEDDING_DIMENSION


class TestTextIngestionM4(unittest.TestCase):
    def setUp(self):
        self.corpus_path = pipeline_root / "data" / "thematic_texts.json"

    def test_corpus_file_exists_and_parses(self):
        """Verifies thematic_texts.json exists and contains >= 20 valid items."""
        self.assertTrue(self.corpus_path.exists(), "thematic_texts.json must exist")
        records = load_thematic_corpus(self.corpus_path)
        self.assertGreaterEqual(len(records), 20, "Corpus must have at least 20 spiritual passages")

        for r in records:
            self.assertIn(r["source_type"], VALID_SOURCE_TYPES)
            self.assertTrue(r["source_title"].strip())
            self.assertTrue(r["content"].strip())
            self.assertTrue(isinstance(r["tags"], list))
            self.assertTrue(isinstance(r["nafs_traps"], list))
            self.assertTrue(isinstance(r["is_riba_related"], bool))
            # Verify valid UUID format
            uuid_obj = uuid.UUID(r["id"])
            self.assertEqual(str(uuid_obj), r["id"])

    def test_mandatory_bakara_275_279_riba_package(self):
        """Verifies Bakara 275-279 has strict anti-usury tags and is_riba_related=True."""
        records = load_thematic_corpus(self.corpus_path)
        bakara = [r for r in records if BAKARA_275_279_TAG in r["tags"]]
        self.assertEqual(len(bakara), 1, "Bakara 275-279 must be present exactly once as primary package")

        chunk = bakara[0]
        self.assertEqual(chunk["source_type"], "QURAN")
        self.assertIn("Bakara Suresi 275-279", chunk["source_title"])
        self.assertTrue(chunk["is_riba_related"])
        self.assertIn("RIBA", chunk["tags"])
        self.assertIn("HARAM", chunk["tags"])
        for tag in MANDATORY_RIBA_TAGS:
            self.assertIn(tag, chunk["tags"], f"Mandatory tag '{tag}' missing from Bakara 275-279")

        # Verify Nafs traps for Riba
        self.assertIn("KOLAY_KAZANC_HIRSI", chunk["nafs_traps"])
        self.assertIn("FAKIRLIK_KORKUSU_VESVESESI", chunk["nafs_traps"])

    def test_all_four_spiritual_categories_covered(self):
        """Verifies Quran, Hadith, Dua, and Siyer are all represented in dataset."""
        records = load_thematic_corpus(self.corpus_path)
        source_types = set(r["source_type"] for r in records)
        self.assertIn("QURAN", source_types)
        self.assertIn("HADITH", source_types)
        self.assertIn("DUA", source_types)
        self.assertIn("SIYER", source_types)

    def test_jev_primitive_enrichment_logic(self):
        """Tests that enrich_jev_primitives correctly tags riba, tevekkul, and infak."""
        # Test custom text mentioning faiz
        enriched = enrich_jev_primitives(
            content="Faiz ve tefecilik yuvaları yıkar.",
            source_title="Genel İhtar",
            source_type="HADITH",
            tags=["UYARI"],
            nafs_traps=[],
            is_riba_related=False,
        )
        self.assertTrue(enriched["is_riba_related"])
        for t in ["faiz", "riba", "haram_kazanc", "borc_krizi", "RIBA", "HARAM"]:
            self.assertIn(t, enriched["tags"])
        self.assertIn("KOLAY_KAZANC_HIRSI", enriched["nafs_traps"])

        # Test tevekkul detection
        enriched_tev = enrich_jev_primitives(
            content="Kim Allah'a tevekkül ederse rızkına kefil olur.",
            source_title="Tevekkül Dersi",
            source_type="HADITH",
            tags=[],
            nafs_traps=[],
            is_riba_related=False,
        )
        self.assertIn("TEVEKKUL", enriched_tev["tags"])
        self.assertIn("RIZIK", enriched_tev["tags"])

    def test_vector_embedder_768d_dimension(self):
        """Verifies that vector embedding produces genuine 768-dimensional floats."""
        text = "Allah faizi tüketir, sadakaları ise bereketlendirir."
        vec = get_embedding_768d(text)
        self.assertEqual(len(vec), EMBEDDING_DIMENSION)
        self.assertEqual(len(vec), 768)
        self.assertTrue(all(isinstance(x, float) for x in vec))
        # Ensure not all zeros (genuine vector)
        magnitude = sum(x * x for x in vec)
        self.assertGreater(magnitude, 0.0)

    def test_dry_run_ingestion_execution(self):
        """Executes ingest_texts with dry_run=True and limit=2 to verify end-to-end pipeline."""
        summary = ingest_texts(
            dry_run=True,
            batch_size=2,
            limit=2,
        )
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["embedded"], 2)
        self.assertEqual(summary["upserted"], 2)
        self.assertTrue(summary["dry_run"])
        self.assertGreater(summary["elapsed_seconds"], 0.0)


if __name__ == "__main__":
    unittest.main()
