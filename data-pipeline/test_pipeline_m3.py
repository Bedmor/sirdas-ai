"""
Comprehensive Verification Suite for Milestone M3 (Data Pipeline Infra & Utilities)
Tests:
  - Configuration & GPU Detection (config.py)
  - R2 Endpoint Sanitization (config.py)
  - Client Factories (Supabase, R2, Gemini)
  - Audio Cutter with FFmpeg libopus voip (utils/audio_cutter.py)
  - Cloudflare R2 Audio Uploader with ContentType: audio/ogg (utils/r2_uploader.py)
  - 768-dimensional Vector Embedder (utils/embedder.py)
"""

import math
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

# Add data-pipeline root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import config
from utils.audio_cutter import (
    cut_audio_clip,
    cut_audio_to_ogg,
    get_audio_duration,
    validate_audio_file,
)
from utils.r2_uploader import (
    check_audio_exists_in_r2,
    delete_audio_from_r2,
    upload_audio_to_r2,
)
from utils.embedder import (
    get_embedding,
    get_embedding_768d,
    get_embeddings_batch,
    EMBEDDING_DIMENSION,
)


class TestPipelineConfig(unittest.TestCase):
    """Verifies configuration loading, hardware detection, and endpoint sanitization."""

    def test_gpu_detection(self):
        """Verifies GPU / CUDA detection and optimal batch/precision configuration."""
        self.assertTrue(config.CUDA_AVAILABLE, "Expected CUDA to be available on host system.")
        self.assertEqual(config.DEVICE, "cuda")
        self.assertEqual(config.COMPUTE_TYPE, "float16")
        self.assertEqual(config.BATCH_SIZE, 16)
        self.assertIn("RTX 4060", config.GPU_DEVICE_NAME)
        self.assertEqual(config.WHISPER_MODEL, "large-v3-turbo")

    def test_r2_endpoint_sanitization(self):
        """Verifies that redundant bucket paths and slashes are cleanly stripped."""
        # Case 1: Endpoint with bucket name appended
        ep1 = "https://3a871cea782fce9726b00a19eb7304b4.r2.cloudflarestorage.com/sirdas-ai"
        cleaned1 = config.sanitize_r2_endpoint(ep1)
        self.assertEqual(cleaned1, "https://3a871cea782fce9726b00a19eb7304b4.r2.cloudflarestorage.com")

        # Case 2: Endpoint with trailing slash and subpath
        ep2 = "https://3a871cea782fce9726b00a19eb7304b4.r2.cloudflarestorage.com/sirdas-ai/"
        cleaned2 = config.sanitize_r2_endpoint(ep2)
        self.assertEqual(cleaned2, "https://3a871cea782fce9726b00a19eb7304b4.r2.cloudflarestorage.com")

        # Case 3: Clean endpoint
        ep3 = "https://3a871cea782fce9726b00a19eb7304b4.r2.cloudflarestorage.com"
        cleaned3 = config.sanitize_r2_endpoint(ep3)
        self.assertEqual(cleaned3, "https://3a871cea782fce9726b00a19eb7304b4.r2.cloudflarestorage.com")

        # Case 4: Missing endpoint with account_id provided
        cleaned4 = config.sanitize_r2_endpoint("", account_id="my_account")
        self.assertEqual(cleaned4, "https://my_account.r2.cloudflarestorage.com")

        # Active configuration should be clean
        self.assertNotIn("/sirdas-ai", config.R2_ENDPOINT)
        self.assertTrue(config.R2_ENDPOINT.startswith("https://"))

    def test_client_factories(self):
        """Verifies that all client factories successfully instantiate functional SDK objects."""
        # Supabase
        sb = config.get_supabase_client()
        self.assertIsNotNone(sb)

        # R2 S3
        r2 = config.get_r2_client()
        self.assertIsNotNone(r2)

        # Gemini GenAI
        gem = config.get_gemini_client()
        self.assertIsNotNone(gem)


class TestAudioCutter(unittest.TestCase):
    """Verifies FFmpeg libopus audio cutting, validation, and error handling."""

    @classmethod
    def setUpClass(cls):
        """Generate a 4-second WAV source file for testing."""
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.src_wav = Path(cls.temp_dir.name) / "test_source_4s.wav"
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", "sine=frequency=440:duration=4",
                "-c:a", "pcm_s16le",
                str(cls.src_wav),
            ],
            check=True,
            capture_output=True,
        )

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_cut_audio_clip_success(self):
        """Verifies cutting clip generates valid .ogg libopus 32k audio."""
        out_ogg = Path(self.temp_dir.name) / "output_segment_1_to_3.ogg"
        result_path = cut_audio_clip(str(self.src_wav), 1.0, 3.0, str(out_ogg))

        self.assertEqual(result_path, str(out_ogg))
        self.assertTrue(out_ogg.exists())
        self.assertGreater(out_ogg.stat().st_size, 0)

        # Validate with ffprobe inspection
        meta = validate_audio_file(str(out_ogg))
        self.assertTrue(meta["valid"])
        self.assertEqual(meta["codec"], "opus")
        self.assertIn("ogg", meta["format"])
        self.assertAlmostEqual(meta["duration"], 2.0, delta=0.1)

    def test_cut_audio_validation_errors(self):
        """Verifies that invalid timestamps or bad file extensions raise proper errors."""
        out_ogg = Path(self.temp_dir.name) / "bad.ogg"
        out_mp3 = Path(self.temp_dir.name) / "bad.mp3"

        # Negative start
        with self.assertRaises(ValueError):
            cut_audio_clip(str(self.src_wav), -1.0, 2.0, str(out_ogg))

        # End <= Start
        with self.assertRaises(ValueError):
            cut_audio_clip(str(self.src_wav), 2.5, 2.0, str(out_ogg))

        # Missing source
        with self.assertRaises(FileNotFoundError):
            cut_audio_clip("/non/existent/file.wav", 1.0, 2.0, str(out_ogg))

        # Invalid output extension (must be .ogg)
        with self.assertRaises(ValueError):
            cut_audio_clip(str(self.src_wav), 1.0, 2.0, str(out_mp3))


class TestR2Uploader(unittest.TestCase):
    """Verifies Cloudflare R2 upload with ContentType: audio/ogg, public URL, and cleanup."""

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.test_ogg = Path(cls.temp_dir.name) / "uploader_probe.ogg"
        # Cut small ogg clip
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", "sine=frequency=880:duration=1",
                "-c:a", "libopus",
                "-b:a", "32k",
                "-vbr", "on",
                "-application", "voip",
                str(cls.test_ogg),
            ],
            check=True,
            capture_output=True,
        )

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_upload_audio_to_r2(self):
        """Uploads .ogg to R2, checks ContentType header via head_object, and cleans up."""
        r2_key = "test_pipeline_m3/probe_audio.ogg"
        result = upload_audio_to_r2(str(self.test_ogg), r2_key)

        self.assertIsInstance(result, dict)
        self.assertIn("url", result)
        self.assertIn("r2_key", result)
        self.assertIn("size_bytes", result)

        self.assertEqual(result["r2_key"], r2_key)
        self.assertEqual(result["size_bytes"], self.test_ogg.stat().st_size)
        self.assertTrue(result["url"].startswith(config.R2_PUBLIC_URL))
        self.assertTrue(result["url"].endswith(r2_key))

        # Verify ContentType via head_object
        s3 = config.get_r2_client()
        head = s3.head_object(Bucket=config.R2_BUCKET_NAME, Key=r2_key)
        self.assertEqual(head["ContentType"], "audio/ogg", "Expected ContentType to be 'audio/ogg'.")
        self.assertEqual(head["ContentLength"], self.test_ogg.stat().st_size)

        # Check existence check helper
        self.assertTrue(check_audio_exists_in_r2(r2_key))

        # Cleanup
        deleted = delete_audio_from_r2(r2_key)
        self.assertTrue(deleted)
        self.assertFalse(check_audio_exists_in_r2(r2_key))


class TestVectorEmbedder(unittest.TestCase):
    """Verifies 768-dimensional embedding generation with dual provider fallback."""

    def test_get_embedding_768d_dimension_and_values(self):
        """Generates embedding for Islamic text and asserts dimension == 768 and genuine floats."""
        text = "Şüphesiz Allah tevekkül edenleri sever (Âl-i İmrân 159)"
        embedding = get_embedding_768d(text)

        self.assertIsInstance(embedding, list)
        self.assertEqual(len(embedding), EMBEDDING_DIMENSION, f"Expected {EMBEDDING_DIMENSION} dimensions.")

        # Ensure elements are valid floats and not empty or all zeros
        non_zero = False
        for val in embedding:
            self.assertIsInstance(val, float)
            self.assertFalse(math.isnan(val), "Vector element is NaN.")
            self.assertFalse(math.isinf(val), "Vector element is Inf.")
            if abs(val) > 1e-6:
                non_zero = True

        self.assertTrue(non_zero, "Embedding vector cannot be all zeros.")

    def test_embedder_empty_text_rejection(self):
        """Verifies that empty string or whitespace raises ValueError."""
        with self.assertRaises(ValueError):
            get_embedding_768d("")
        with self.assertRaises(ValueError):
            get_embedding_768d("   \n\t  ")

    def test_get_embeddings_batch(self):
        """Verifies batch embedding helper."""
        texts = ["Tefekkür ve murakabe", "Rıza lokması ve infak vakarı"]
        batch = get_embeddings_batch(texts)
        self.assertEqual(len(batch), 2)
        self.assertEqual(len(batch[0]), EMBEDDING_DIMENSION)
        self.assertEqual(len(batch[1]), EMBEDDING_DIMENSION)


if __name__ == "__main__":
    unittest.main(verbosity=2)
