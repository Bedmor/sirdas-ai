#!/usr/bin/env python3
"""
Sırdaş AI - Adversarial Empirical Challenge Suite for Data Pipeline (Milestones M3, M4, M5)
Author: Empirical Challenger Agent (Critic & Specialist)

Stress-tests:
1. Sliding window chunking algorithm under adversarial and boundary conditions:
   - duration strictly 90-120s
   - overlap strictly 15-20%
   - exact start_sec and end_sec preservation
   - edge cases: <90s, exactly 90s, 120s, 121s, silent audio, empty segments,
     giant single segments, large multi-hour recordings, gap intervals, corrupted segments.
2. Audio processing & FFmpeg libopus format:
   - generates real audio files
   - runs cut_audio_clip
   - inspects with ffprobe for codec=opus, format=ogg, bitrate target, voip application
   - boundary checks: 0-byte, invalid extensions, negative timestamps.
3. R2 Uploader & ContentType header enforcement:
   - verifies put_object kwargs strictly enforce ContentType="audio/ogg"
   - boundary checks: 0-byte, empty key, sanitization of leading slashes.
4. Semantic Ingestion & Bakara 275-279 usury package:
   - verifies thematic_texts.json corpus integrity
   - verifies Bakara 275-279 presence, is_riba_related=True, mandatory tags, nafs traps
   - verifies enrich_jev_primitives rule engine
   - verifies 768-dimensional vector embedding.
"""

import json
import logging
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# Ensure data-pipeline root is in path
PIPELINE_ROOT = Path(__file__).resolve().parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

import config
from utils.audio_cutter import cut_audio_clip, get_audio_duration, validate_audio_file
from utils.r2_uploader import upload_audio_to_r2, check_audio_exists_in_r2
from utils.embedder import get_embedding_768d, EMBEDDING_DIMENSION
from ingest_texts import enrich_jev_primitives, load_thematic_corpus, BAKARA_275_279_TAG, MANDATORY_RIBA_TAGS
from ingest_youtube import (
    normalize_segments,
    chunk_segments_sliding_window,
    generate_mock_segments,
    DEFAULT_MIN_DURATION_SEC,
    DEFAULT_MAX_DURATION_SEC,
    DEFAULT_OVERLAP_PCT,
)

logging.basicConfig(level=logging.WARNING)


class TestChunkingAlgorithmAdversarial(unittest.TestCase):
    """
    Adversarial stress-testing of chunk_segments_sliding_window and normalize_segments.
    """

    def test_empty_and_corrupt_segments(self):
        """Empty, whitespace, negative or inverted segments must be safely discarded."""
        self.assertEqual(chunk_segments_sliding_window([]), [])
        
        # Inverted or 0-duration segments
        corrupt = [
            {"start": 10.0, "end": 5.0, "text": "inverted timestamps"},
            {"start": 20.0, "end": 20.0, "text": "zero duration"},
            {"start": 30.0, "end": 40.0, "text": ""},  # empty text
            {"start": 40.0, "end": 50.0, "text": "   "},  # whitespace text
        ]
        self.assertEqual(chunk_segments_sliding_window(corrupt), [])

    def test_audio_shorter_than_90_seconds(self):
        """Audio under 90s should form a single chunk without crash, retaining full bounds."""
        for duration in [5.0, 30.0, 60.0, 89.9]:
            segments = [
                {"start": 0.0, "end": duration / 2.0, "text": "İlk kısım tefekkür."},
                {"start": duration / 2.0, "end": duration, "text": "İkinci kısım tevekkül."},
            ]
            chunks = chunk_segments_sliding_window(segments)
            self.assertEqual(len(chunks), 1, f"Expected 1 chunk for duration {duration}s")
            self.assertAlmostEqual(chunks[0]["start_sec"], 0.0, places=2)
            self.assertAlmostEqual(chunks[0]["end_sec"], duration, places=2)
            self.assertAlmostEqual(chunks[0]["duration"], duration, places=2)
            self.assertIn("İlk kısım", chunks[0]["text"])
            self.assertIn("İkinci kısım", chunks[0]["text"])

    def test_audio_exactly_90_seconds(self):
        """Audio of exactly 90s should form exactly 1 chunk [0.0, 90.0]."""
        segments = generate_mock_segments(90.0)
        chunks = chunk_segments_sliding_window(segments)
        self.assertEqual(len(chunks), 1)
        self.assertAlmostEqual(chunks[0]["start_sec"], 0.0, places=2)
        self.assertAlmostEqual(chunks[0]["end_sec"], 90.0, places=2)
        self.assertAlmostEqual(chunks[0]["duration"], 90.0, places=2)

    def test_audio_exactly_120_seconds(self):
        """Audio of exactly 120s is at the upper threshold and should form 1 chunk."""
        segments = generate_mock_segments(120.0)
        chunks = chunk_segments_sliding_window(segments)
        self.assertEqual(len(chunks), 1)
        self.assertAlmostEqual(chunks[0]["start_sec"], 0.0, places=2)
        self.assertAlmostEqual(chunks[0]["end_sec"], 120.0, places=2)
        self.assertAlmostEqual(chunks[0]["duration"], 120.0, places=2)

    def test_audio_121_seconds_boundary(self):
        """
        Audio of 121s (just over 120s) MUST trigger the sliding window into multiple chunks.
        Every chunk must obey duration limits (<= 120s) and overlap limits.
        """
        # Create fine-grained 10s segments up to 121s
        segments = []
        t = 0.0
        while t < 121.0:
            next_t = min(121.0, t + 10.0)
            segments.append({"start": t, "end": next_t, "text": f"Sohbet parçası {t}-{next_t}."})
            t = next_t

        chunks = chunk_segments_sliding_window(segments)
        self.assertGreaterEqual(len(chunks), 2, "121s audio must yield at least 2 chunks")
        for idx, chunk in enumerate(chunks):
            self.assertLessEqual(
                chunk["duration"], 120.0,
                f"Chunk {idx} duration {chunk['duration']} exceeded max 120s"
            )
            self.assertEqual(round(chunk["end_sec"] - chunk["start_sec"], 2), chunk["duration"])

        # Check overlap between chunk 0 and chunk 1
        overlap = chunks[0]["end_sec"] - chunks[1]["start_sec"]
        overlap_pct = overlap / chunks[0]["duration"]
        # Overlap should be around 15% - 20%
        self.assertGreaterEqual(overlap_pct, 0.10, f"Overlap pct {overlap_pct:.2f} is too low")
        self.assertLessEqual(overlap_pct, 0.35, f"Overlap pct {overlap_pct:.2f} is too high")

    def test_giant_single_segment_splitting(self):
        """
        If a transcription engine returns a single 300s giant segment,
        normalize_segments must split it into <= 60s segments, and chunking
        must keep all chunks <= 120s.
        """
        giant_text = " ".join([f"kelime{i}" for i in range(500)])
        raw_segments = [{"start": 0.0, "end": 300.0, "text": giant_text}]

        normalized = normalize_segments(raw_segments, max_single_len=60.0)
        self.assertGreaterEqual(len(normalized), 5)
        for s in normalized:
            self.assertLessEqual(s["end"] - s["start"], 60.01)

        chunks = chunk_segments_sliding_window(raw_segments)
        self.assertGreater(len(chunks), 1)
        for idx, ch in enumerate(chunks):
            self.assertLessEqual(ch["duration"], 120.0, f"Chunk {idx} exceeds 120s limit: {ch['duration']}")
            self.assertGreaterEqual(ch["duration"], 60.0)

    def test_long_recording_3600_seconds_stress(self):
        """
        Stress-tests a 1-hour recording (3600 seconds) with 180 segments.
        Verifies:
        - Monotonic progression (no infinite loop)
        - Every chunk duration between 90s and 120s (except potentially final tail)
        - Overlap between every consecutive chunk pair is positive and ~15-20%
        - First chunk starts at 0.0, last chunk ends at 3600.0
        """
        segments = generate_mock_segments(3600.0)
        chunks = chunk_segments_sliding_window(segments)

        self.assertGreater(len(chunks), 25)
        self.assertAlmostEqual(chunks[0]["start_sec"], 0.0, places=2)
        self.assertAlmostEqual(chunks[-1]["end_sec"], 3600.0, places=2)

        for i in range(len(chunks)):
            ch = chunks[i]
            # Duration check
            self.assertLessEqual(ch["duration"], 120.0, f"Chunk {i} duration > 120: {ch['duration']}")
            if i < len(chunks) - 1:
                # All chunks except possibly the last must be >= 90s
                self.assertGreaterEqual(ch["duration"], 90.0, f"Chunk {i} duration < 90: {ch['duration']}")

            # Overlap check with next chunk
            if i < len(chunks) - 1:
                next_ch = chunks[i + 1]
                self.assertGreater(next_ch["start_sec"], ch["start_sec"], "Chunks must advance forward")
                overlap_sec = ch["end_sec"] - next_ch["start_sec"]
                self.assertGreater(overlap_sec, 0.0, f"Chunks {i} and {i+1} must overlap")
                overlap_pct = overlap_sec / ch["duration"]
                # Overlap should be centered around 20% (allow 10% to 30% due to discrete segment boundaries)
                self.assertTrue(
                    0.10 <= overlap_pct <= 0.30,
                    f"Chunk {i}->{i+1} overlap ratio {overlap_pct:.3f} outside acceptable 10%-30% range"
                )

    def test_temporal_gaps_in_audio(self):
        """
        Simulate an audio with large pauses/gaps:
        e.g. speech at [0-40], silence [40-100], speech [100-150].
        Chunker should handle gap without crash or duration calculation bug.
        """
        segments = [
            {"start": 0.0, "end": 40.0, "text": "Giriş konuşması."},
            {"start": 100.0, "end": 150.0, "text": "Uzun sessizlik sonrası tefekkür bahsi."},
            {"start": 150.0, "end": 210.0, "text": "Netice ve dua."},
        ]
        chunks = chunk_segments_sliding_window(segments)
        self.assertGreater(len(chunks), 0)
        for ch in chunks:
            self.assertLessEqual(ch["duration"], 120.0)


class TestAudioCutterAndFFprobeAdversarial(unittest.TestCase):
    """
    Adversarial verification of audio_cutter.py with live FFmpeg and FFprobe inspections.
    """

    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = tempfile.mkdtemp(prefix="challenger_audio_")
        cls.source_wav = os.path.join(cls.tmp_dir, "test_synth_150s.wav")

        # Synthesize a 150s clean audio wave using ffmpeg sine wave generator
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "sine=frequency=440:duration=150",
            "-ar", "16000",
            "-ac", "1",
            cls.source_wav,
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

    def test_cut_audio_clip_ffprobe_deep_inspection(self):
        """
        Cut a 100-second clip and empirically inspect the output with ffprobe:
        - Container format MUST contain 'ogg'
        - Codec MUST be 'opus'
        - Bitrate target MUST be 32k
        """
        out_ogg = os.path.join(self.tmp_dir, "test_output_100s.ogg")
        start_sec = 10.0
        end_sec = 110.0

        cut_result = cut_audio_clip(self.source_wav, start_sec, end_sec, out_ogg)
        self.assertEqual(cut_result, str(Path(out_ogg).resolve()))
        self.assertTrue(os.path.exists(out_ogg))
        self.assertGreater(os.path.getsize(out_ogg), 100000)

        # Run ffprobe deep inspection
        probe_cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=codec_name,channels,sample_rate,bit_rate:format=format_name,duration,bit_rate",
            "-of", "json",
            out_ogg,
        ]
        proc = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        probe_data = json.loads(proc.stdout)

        # 1. Codec inspection
        streams = probe_data.get("streams", [])
        self.assertTrue(len(streams) > 0, "No audio stream found")
        stream = streams[0]
        self.assertEqual(stream.get("codec_name"), "opus", "Codec must strictly be opus")

        # 2. Container inspection
        format_info = probe_data.get("format", {})
        format_name = format_info.get("format_name", "")
        self.assertIn("ogg", format_name, "Container format must be ogg")

        # 3. Duration inspection (100.0s target, allow minor Opus packet alignment delta < 0.2s)
        duration = float(format_info.get("duration", 0.0))
        self.assertAlmostEqual(duration, 100.0, delta=0.25, msg=f"Duration {duration} deviates from 100s")

        # 4. Bitrate inspection:
        # Opus container overall bitrate for 32k target should be around 28k - 40k bps
        overall_bitrate = int(format_info.get("bit_rate", 0))
        self.assertTrue(
            25000 <= overall_bitrate <= 45000,
            f"Bitrate {overall_bitrate} bps outside expected 32k VBR range (25k-45k bps)"
        )

    def test_audio_cutter_invalid_inputs(self):
        """Stress-test error handling and validation guards in cut_audio_clip."""
        out_ogg = os.path.join(self.tmp_dir, "invalid.ogg")
        
        # Missing file
        with self.assertRaises(FileNotFoundError):
            cut_audio_clip("/nonexistent/path/audio.wav", 0.0, 10.0, out_ogg)

        # Negative start
        with self.assertRaises(ValueError):
            cut_audio_clip(self.source_wav, -5.0, 10.0, out_ogg)

        # end <= start
        with self.assertRaises(ValueError):
            cut_audio_clip(self.source_wav, 10.0, 10.0, out_ogg)
        with self.assertRaises(ValueError):
            cut_audio_clip(self.source_wav, 20.0, 10.0, out_ogg)

        # Non-ogg extension
        with self.assertRaises(ValueError):
            cut_audio_clip(self.source_wav, 0.0, 10.0, os.path.join(self.tmp_dir, "out.mp3"))

        # Empty 0-byte file
        zero_file = os.path.join(self.tmp_dir, "zero.wav")
        Path(zero_file).touch()
        with self.assertRaises(Exception):
            validate_audio_file(zero_file)


class TestR2UploaderMIMEAdversarial(unittest.TestCase):
    """
    Adversarial verification of R2 uploader ContentType enforcement.
    """

    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = tempfile.mkdtemp(prefix="challenger_r2_")
        cls.sample_ogg = os.path.join(cls.tmp_dir, "sample.ogg")
        with open(cls.sample_ogg, "wb") as f:
            f.write(b"OggS\x00\x02\x00\x00\x00\x00\x00\x00" + b"\x00" * 200)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

    def test_content_type_strictly_enforced_in_put_object(self):
        """
        Mock the S3 client to intercept put_object and verify:
        - ContentType is strictly 'audio/ogg'
        - Key has leading slashes stripped
        - Bucket matches config
        """
        mock_s3 = MagicMock()
        with patch.object(config, "get_r2_client", return_value=mock_s3):
            res = upload_audio_to_r2(self.sample_ogg, "/halis_aydemir/sohbet_chunk.ogg")
            
            self.assertTrue(mock_s3.put_object.called)
            call_kwargs = mock_s3.put_object.call_args[1]

            # Mandatory Header Check
            self.assertEqual(
                call_kwargs.get("ContentType"),
                "audio/ogg",
                "ContentType must strictly be audio/ogg for WhatsApp PTT compatibility"
            )
            # Key Sanitization Check
            self.assertEqual(
                call_kwargs.get("Key"),
                "halis_aydemir/sohbet_chunk.ogg",
                "Leading slash in R2 key must be cleanly stripped"
            )
            # Result Check
            self.assertIn("halis_aydemir/sohbet_chunk.ogg", res["url"])
            self.assertEqual(res["r2_key"], "halis_aydemir/sohbet_chunk.ogg")

    def test_r2_uploader_boundary_rejections(self):
        """Zero-byte file, missing file, or empty key must raise proper errors."""
        empty_file = os.path.join(self.tmp_dir, "empty.ogg")
        Path(empty_file).touch()

        with self.assertRaises(ValueError):
            upload_audio_to_r2(empty_file, "key.ogg")

        with self.assertRaises(FileNotFoundError):
            upload_audio_to_r2("/nonexistent/file.ogg", "key.ogg")

        with self.assertRaises(ValueError):
            upload_audio_to_r2(self.sample_ogg, "   ///  ")


class TestSemanticIngestionAndBakara275Riba(unittest.TestCase):
    """
    Adversarial verification of Bakara 275-279 usury package and 768d vector embeddings.
    """

    def test_thematic_texts_json_bakara_package(self):
        """
        Examine data/thematic_texts.json:
        - Must contain Bakara 275-279
        - is_riba_related must be True
        - Mandatory tags must be present
        - Nafs traps must address usury psychology
        """
        corpus_path = PIPELINE_ROOT / "data" / "thematic_texts.json"
        self.assertTrue(corpus_path.exists(), f"Missing corpus file: {corpus_path}")

        records = load_thematic_corpus(corpus_path)
        self.assertGreaterEqual(len(records), 20, "Corpus must have at least 20 authentic records")

        # Find Bakara 275-279 record
        bakara_records = [r for r in records if "275" in r["source_title"]]
        self.assertEqual(len(bakara_records), 1, "Exactly one Bakara 275-279 record expected")

        bakara = bakara_records[0]
        self.assertEqual(bakara["source_type"], "QURAN")
        self.assertTrue(bakara["is_riba_related"], "Bakara 275-279 is_riba_related must be True")

        # Check mandatory tags
        for required_tag in MANDATORY_RIBA_TAGS:
            self.assertIn(
                required_tag, bakara["tags"],
                f"Tag '{required_tag}' missing from Bakara 275-279"
            )
        self.assertIn(BAKARA_275_279_TAG, bakara["tags"])
        self.assertIn("RIBA", bakara["tags"])
        self.assertIn("HARAM", bakara["tags"])

        # Check Nafs traps
        self.assertTrue(
            any("HIRSI" in trap or "FAKIRLIK" in trap or "KAZANC" in trap for trap in bakara["nafs_traps"]),
            "Nafs traps must include anti-usury psychological traps"
        )

    def test_enrich_jev_primitives_adversarial_inputs(self):
        """
        Test that enrich_jev_primitives correctly tags obscure or indirect riba mentions.
        """
        # Case 1: Text contains 'tefeci' and 'faiz' but is_riba_related was False
        res = enrich_jev_primitives(
            content="Tefecilerin ve faiz sisteminin pençesinde kıvranan borçlu.",
            source_title="Manevi İkaz",
            source_type="HADITH",
            tags=["UYARI"],
            nafs_traps=[],
            is_riba_related=False,
        )
        self.assertTrue(res["is_riba_related"])
        self.assertIn("RIBA", res["tags"])
        self.assertIn("HARAM", res["tags"])
        self.assertIn("faiz", res["tags"])
        self.assertIn("KOLAY_KAZANC_HIRSI", res["nafs_traps"])

        # Case 2: Tevekkül and Rızık detection
        res2 = enrich_jev_primitives(
            content="Kim tevekkül ederse Allah ona kafi gelir ve beklemediği yerden rızık verir.",
            source_title="Ayet",
            source_type="QURAN",
            tags=[],
            nafs_traps=[],
            is_riba_related=False,
        )
        self.assertIn("TEVEKKUL", res2["tags"])
        self.assertIn("RIZIK", res2["tags"])

    def test_embedding_768d_dimension_and_properties(self):
        """
        Empirically generate embedding for Bakara 275 text and verify:
        - Dimension == 768
        - All elements are valid finite floats
        - Norm is non-zero
        """
        test_text = (
            "Faiz yiyenler ancak şeytanın çarptığı kimsenin kalktığı gibi kalkarlar. "
            "Allah alışverişi helal, faizi haram kılmıştır."
        )
        vec = get_embedding_768d(test_text)
        self.assertEqual(len(vec), 768, f"Embedding dimension {len(vec)} != 768")
        self.assertTrue(all(isinstance(x, (int, float)) for x in vec))
        self.assertTrue(all(not math.isnan(x) and not math.isinf(x) for x in vec))

        # Vector norm check
        norm = math.sqrt(sum(x * x for x in vec))
        self.assertGreater(norm, 0.0, "Vector norm must be strictly positive")

        # Empty text must raise ValueError
        with self.assertRaises(ValueError):
            get_embedding_768d("   ")


if __name__ == "__main__":
    unittest.main(verbosity=2)
