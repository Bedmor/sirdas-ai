#!/usr/bin/env python3
"""
Sırdaş AI - Phase 2 YouTube WhisperX & Audio Pipeline (Milestone M5)
Performs:
1. YouTube audio download using yt-dlp.
2. WhisperX transcription on NVIDIA RTX 4060 GPU (with CPU fallback)
   using model large-v3-turbo, batch_size=16, and Islamic initial prompt.
3. Overlapping sliding window chunking targeting 90-120s duration with 15-20% overlap.
4. Audio slicing using FFmpeg libopus 32k VBR voice notes (.ogg).
5. Cloudflare R2 upload with ContentType: audio/ogg.
6. 768-dimensional vector embedding generation and Supabase knowledge_chunks upsert.
"""

import argparse
import json
import logging
import math
import os
from pathlib import Path
import re
import sys
import time
from typing import Any, Dict, List, Optional, Union
import uuid

# Ensure pipeline root is in sys.path
PIPELINE_ROOT = Path(__file__).resolve().parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

import config
from utils.audio_cutter import cut_audio_clip, get_audio_duration, validate_audio_file
from utils.r2_uploader import upload_audio_to_r2
from utils.embedder import get_embedding_768d, EMBEDDING_DIMENSION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sirdas.youtube_pipeline")

# Canonical Islamic Initial Prompt for Turkish theological speech
ISLAMIC_INITIAL_PROMPT = (
    "Bismillahirrahmanirrahim. Selamun Aleykum. Allah, Resulullah, Kuran, Hadis, "
    "Sahabe, Siyer, Tevekkül, Murakabe, Tefekkür."
)

# Extended default prompt incorporating Halis Aydemir vocabulary
DEFAULT_INITIAL_PROMPT = (
    "Bismillahirrahmanirrahim. Selamun Aleykum. Allah, Resulullah, Kuran, Hadis, "
    "Sahabe, Siyer, Tevekkül, Murakabe, Tefekkür. Halis Aydemir, Kur'an-ı Kerim, "
    "ubudiyet, tevhid, sünnet, fıkıh, siyer, nefis, vesvese, riba, Talâk, Bakara."
)

DEFAULT_TARGET_DURATION_SEC: float = 100.0
DEFAULT_MIN_DURATION_SEC: float = 90.0
DEFAULT_MAX_DURATION_SEC: float = 120.0
DEFAULT_OVERLAP_PCT: float = 0.20
SOURCE_TYPE_HALIS_AYDEMIR: str = "HALIS_AYDEMIR"

# Authentic Islamic reflections used for mock transcription testing
MOCK_SERMON_SENTENCES: List[str] = [
    (
        "Bismillahirrahmanirrahim. Elhamdülillahi Rabbil alemin, vessalatu vesselamu "
        "ala Resulina Muhammedin ve ala alihi ve sahbihi ecmain."
    ),
    (
        "Aziz kardeşlerim, bu dersimizde tevekkül hakikatini ve kulun Rabbine olan "
        "teslimiyetini tefekkür ediyoruz."
    ),
    (
        "Sebeplere sarılmak kulluğun ve sünnetin bir gereğidir, lakin neticeyi mutlak surette "
        "Kadir-i Zülcelal'e havale etmek imanın ve ubudiyetin esasıdır."
    ),
    (
        "Mümin kul bilir ki rızık Allah'ın mutlak kefaletindedir; hiçbir nefis takdir edilen "
        "rızkını tüketmeden bu fani alemden göçmeyecektir."
    ),
    (
        "Kur'an-ı Kerim Bakara suresinde bize faizin ve haram kazancın manevi yıkımını bildirir; "
        "faiz yiyenler ancak şeytan çarpmış kimseler gibi kalkarlar."
    ),
    (
        "Murakabe şuuru, kişinin kalbini her an Hakk'ın nazargâhı bilmesi ve O'nun her şeyi "
        "hakkıyla gördüğünü ve işittiğini daima idrak etmesidir."
    ),
    (
        "Talâk suresi ikinci ve üçüncü ayet-i kerimelerde buyrulduğu üzere: Kim Allah'tan korkup "
        "sakınırsa, Allah ona bir çıkış yolu ihsan eder ve beklemediği yerden rızıklandırır."
    ),
    (
        "Kul tefekkür ettikçe idrak eder ki, dünyadaki meşakkat ve imtihanlar birer ceza değil, "
        "kalbi masivadan temizleyip Allah'a yaklaştıran birer manevi vesiledir."
    ),
    (
        "Sünnet-i Seniyye ve Sahabe-i Kiram'ın hayatı bizlere rehberdir; en çetin borç ve darlık "
        "zamanlarında dahi harama meyletmeyip sabır ve tevekkülle sebat etmişlerdir."
    ),
    (
        "Rabbimiz bizleri nefsin ve şeytanın vesveselerinden muhafaza buyursun; kalplerimizi "
        "tevhid, murakabe ve rıza mizanı ile nurlandırsın."
    ),
]


def normalize_segments(
    segments: List[Dict[str, Any]],
    max_single_len: float = 60.0,
) -> List[Dict[str, Any]]:
    """
    Normalizes transcription segments to ensure no single segment exceeds max_single_len.
    Segments longer than max_single_len are split into smaller pieces, ensuring the
    sliding window chunker can always construct chunks strictly within 90-120 seconds.
    """
    if not segments:
        return []

    normalized: List[Dict[str, Any]] = []
    for seg in segments:
        start = float(seg.get("start", 0.0))
        end = float(seg.get("end", 0.0))
        text = str(seg.get("text", "")).strip()

        if end <= start or not text:
            continue

        seg_duration = end - start
        if seg_duration <= max_single_len:
            normalized.append({"start": start, "end": end, "text": text})
            continue

        # Split long segment into sub-segments
        num_splits = math.ceil(seg_duration / max_single_len)
        step = seg_duration / num_splits
        words = text.split()
        words_per_split = max(1, math.ceil(len(words) / num_splits))

        for i in range(num_splits):
            sub_start = start + (i * step)
            sub_end = min(end, start + ((i + 1) * step))
            sub_words = words[i * words_per_split : (i + 1) * words_per_split]
            sub_text = " ".join(sub_words) if sub_words else text
            normalized.append({
                "start": round(sub_start, 2),
                "end": round(sub_end, 2),
                "text": sub_text,
            })

    normalized.sort(key=lambda s: s["start"])
    return normalized


def chunk_segments_sliding_window(
    segments: List[Dict[str, Any]],
    target_duration_sec: float = DEFAULT_TARGET_DURATION_SEC,
    min_duration_sec: float = DEFAULT_MIN_DURATION_SEC,
    max_duration_sec: float = DEFAULT_MAX_DURATION_SEC,
    overlap_pct: float = DEFAULT_OVERLAP_PCT,
) -> List[Dict[str, Any]]:
    """
    Temporal sliding window chunking algorithm targeting 90-120s duration with 15-20% overlap.
    Preserves exact floating point timestamps (start_sec, end_sec) and handles boundary cases:
    - Empty input -> returns empty list.
    - Audio <= max_duration_sec -> forms single chunk.
    - Normal audio -> builds 90-120s chunks with ~20% backtracking.
    - Trailing tail segment -> captured in final chunk with true audio end timestamp.

    Args:
        segments: List of segment dicts with 'start', 'end', and 'text'.
        target_duration_sec: Target duration in seconds (~100s).
        min_duration_sec: Minimum duration in seconds (90s).
        max_duration_sec: Maximum duration in seconds (120s).
        overlap_pct: Overlap percentage ratio between adjacent chunks (0.20 = 20%).

    Returns:
        List of chunk dicts: { "start_sec": float, "end_sec": float, "duration": float, "text": str }
    """
    if not segments:
        return []

    clean_segments = normalize_segments(segments, max_single_len=60.0)
    if not clean_segments:
        return []

    total_duration = clean_segments[-1]["end"]
    initial_start = clean_segments[0]["start"]

    # If entire audio is within max duration, return single chunk
    if total_duration <= max_duration_sec:
        return [{
            "start_sec": round(initial_start, 2),
            "end_sec": round(total_duration, 2),
            "duration": round(total_duration - initial_start, 2),
            "text": " ".join(s["text"] for s in clean_segments),
        }]

    chunks: List[Dict[str, Any]] = []
    current_segment_idx = 0
    num_segments = len(clean_segments)

    while current_segment_idx < num_segments:
        chunk_start_sec = clean_segments[current_segment_idx]["start"]
        chunk_end_sec = chunk_start_sec
        chunk_texts: List[str] = []
        end_idx = current_segment_idx

        while end_idx < num_segments:
            seg = clean_segments[end_idx]
            proposed_duration = seg["end"] - chunk_start_sec

            if proposed_duration > max_duration_sec and len(chunk_texts) > 0:
                break

            chunk_texts.append(seg["text"])
            chunk_end_sec = seg["end"]
            end_idx += 1

            if min_duration_sec <= proposed_duration <= max_duration_sec:
                break

        duration = chunk_end_sec - chunk_start_sec
        chunks.append({
            "start_sec": round(chunk_start_sec, 2),
            "end_sec": round(chunk_end_sec, 2),
            "duration": round(duration, 2),
            "text": " ".join(chunk_texts),
        })

        if end_idx >= num_segments:
            break

        # Overlap: backtrack ~20% of duration (target ~20s)
        target_overlap_sec = duration * overlap_pct
        next_start_target = chunk_end_sec - target_overlap_sec

        backtrack_idx = end_idx - 1
        while backtrack_idx > current_segment_idx and clean_segments[backtrack_idx]["start"] > next_start_target:
            backtrack_idx -= 1

        current_segment_idx = max(current_segment_idx + 1, backtrack_idx)

    return chunks


def generate_mock_segments(duration_sec: float) -> List[Dict[str, Any]]:
    """
    Generates synthetic transcription segments spanning duration_sec.
    Used for unit testing and offline development without live WhisperX model downloads.
    """
    segments: List[Dict[str, Any]] = []
    current_time = 0.0
    idx = 0
    seg_step = 20.0

    while current_time < duration_sec:
        next_time = min(duration_sec, current_time + seg_step)
        text = MOCK_SERMON_SENTENCES[idx % len(MOCK_SERMON_SENTENCES)]
        segments.append({
            "start": round(current_time, 2),
            "end": round(next_time, 2),
            "text": text,
        })
        current_time = next_time
        idx += 1

    return segments


def download_youtube_audio(url: str, output_dir: Path) -> Dict[str, Any]:
    """
    Downloads audio stream from YouTube URL using yt-dlp to output_dir.

    Args:
        url: YouTube video URL.
        output_dir: Directory where downloaded audio will be stored.

    Returns:
        dict: {
            "audio_path": str,
            "video_id": str,
            "title": str,
            "duration": float
        }
    """
    import yt_dlp  # type: ignore

    output_dir.mkdir(parents=True, exist_ok=True)
    out_template = str(output_dir / "%(id)s.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "m4a",
            "preferredquality": "192",
        }],
        "quiet": True,
        "no_warnings": True,
    }

    logger.info("Downloading YouTube audio from %s ...", url)
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = str(info.get("id") or "youtube_audio")
        title = str(info.get("title") or "Halis Aydemir Sohbeti")
        duration = float(info.get("duration") or 0.0)

    # Locate downloaded audio file
    candidate_m4a = output_dir / f"{video_id}.m4a"
    if candidate_m4a.exists():
        audio_path = candidate_m4a
    else:
        # Check any matching extension
        matches = list(output_dir.glob(f"{video_id}.*"))
        if not matches:
            raise FileNotFoundError(f"Could not locate downloaded audio file for video ID {video_id}")
        audio_path = matches[0]

    logger.info("Successfully downloaded audio: %s (duration: %.1fs)", audio_path.name, duration)
    return {
        "audio_path": str(audio_path),
        "video_id": video_id,
        "title": title,
        "duration": duration,
    }


def transcribe_audio_whisperx(
    audio_path: str,
    device: Optional[str] = None,
    compute_type: Optional[str] = None,
    batch_size: int = 16,
    model_name: str = "large-v3-turbo",
    initial_prompt: str = ISLAMIC_INITIAL_PROMPT,
    mock_whisper: bool = False,
) -> Dict[str, Any]:
    """
    Transcribes audio using WhisperX on RTX 4060 GPU with CUDA acceleration.
    Automatically falls back to CPU if CUDA is unavailable.

    Args:
        audio_path: Path to local audio file.
        device: 'cuda' or 'cpu'. Defaults to auto-detection from config.
        compute_type: 'float16' for cuda, 'int8' for cpu.
        batch_size: Batch size for WhisperX inference (default: 16).
        model_name: Model identifier (default: 'large-v3-turbo').
        initial_prompt: Islamic vocabulary prompt guiding theological recognition.
        mock_whisper: If True, uses synthetic transcription segments without downloading weights.

    Returns:
        dict: { "segments": List[Dict], "language": "tr", "model": str, "device": str }
    """
    if mock_whisper:
        logger.info("Executing mock WhisperX transcription (mock_whisper=True)...")
        try:
            total_dur = get_audio_duration(audio_path)
        except Exception:
            total_dur = 300.0

        if total_dur <= 0.0:
            total_dur = 300.0

        mock_segs = generate_mock_segments(total_dur)
        return {
            "segments": mock_segs,
            "language": "tr",
            "model": f"{model_name}-mock",
            "device": "mock",
        }

    import torch
    import whisperx  # type: ignore

    target_device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    target_compute = compute_type or ("float16" if target_device == "cuda" else "int8")

    logger.info(
        "Loading WhisperX model '%s' (device=%s, compute=%s, batch_size=%d)...",
        model_name,
        target_device,
        target_compute,
        batch_size,
    )

    try:
        model = whisperx.load_model(
            model_name,
            device=target_device,
            compute_type=target_compute,
            language="tr",
            asr_options={"initial_prompt": initial_prompt},
        )
    except Exception as e:
        logger.warning("Failed to load model on %s (%s). Falling back to CPU...", target_device, e)
        target_device = "cpu"
        target_compute = "int8"
        model = whisperx.load_model(
            model_name,
            device=target_device,
            compute_type=target_compute,
            language="tr",
            asr_options={"initial_prompt": initial_prompt},
        )

    logger.info("Loading audio with whisperx: %s", audio_path)
    audio = whisperx.load_audio(audio_path)

    try:
        result = model.transcribe(audio, batch_size=batch_size)
    except Exception as oom_err:
        if "out of memory" in str(oom_err).lower() and target_device == "cuda":
            logger.warning("CUDA OOM detected. Emptying cache and retrying with batch_size=8...")
            torch.cuda.empty_cache()
            result = model.transcribe(audio, batch_size=max(4, batch_size // 2))
        else:
            raise

    raw_segments = result.get("segments", [])
    clean_segments: List[Dict[str, Any]] = []
    for s in raw_segments:
        text = str(s.get("text", "")).strip()
        if text:
            clean_segments.append({
                "start": round(float(s.get("start", 0.0)), 2),
                "end": round(float(s.get("end", 0.0)), 2),
                "text": text,
            })

    logger.info("Transcription completed: %d segments detected.", len(clean_segments))
    return {
        "segments": clean_segments,
        "language": result.get("language", "tr"),
        "model": model_name,
        "device": target_device,
    }


def enrich_chunk_metadata(
    chunk_text: str,
    youtube_id: str,
    start_sec: float,
    end_sec: float,
    video_title: str,
) -> Dict[str, Any]:
    """
    Enriches Halis Aydemir audio chunk with spiritual tags, nafs traps, and Riba detection.
    """
    content_lower = chunk_text.lower()
    title_lower = video_title.lower()

    tags = ["HALIS_AYDEMIR", "SES_KAYDI", "TEFEKKUR"]
    nafs_traps: List[str] = []

    # Detect Riba / Usury
    has_riba = any(k in content_lower or k in title_lower for k in ["faiz", "riba", "tefeci", "haram kazanç"])
    if has_riba:
        tags.extend(["RIBA", "HARAM", "borc_krizi", "faiz"])
        nafs_traps.extend(["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI"])

    # Detect Tevekkül & Rızık
    if any(k in content_lower for k in ["tevekkül", "teslimiyet", "kadir-i"]):
        tags.extend(["TEVEKKUL", "TEVEKKUL_VE_MURAKABE"])
    if any(k in content_lower for k in ["rızık", "kefalet", "sebepler"]):
        tags.extend(["RIZIK", "RIZIK_VE_TICARET"])
    if "sebepler" in content_lower:
        nafs_traps.extend(["SEBEPLERI_PUTLASTIRMA", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"])

    # Detect Murakabe & Kalp Amelleri
    if any(k in content_lower for k in ["murakabe", "nazargâh", "görüyor", "farkındalık", "ihlas", "huşu"]):
        tags.extend(["MURAKABE", "KALP_AMELLELI_VE_IHLAS"])

    # Detect Talâk 2-3 & Ümit
    if any(k in content_lower for k in ["talâk", "talak", "çıkış yolu", "ümit"]):
        tags.extend(["TALAK_2_3", "UMIT"])

    # Detect İmtihan, Kader & Sabır
    if any(k in content_lower for k in ["imtihan", "sabır", "meşakkat", "kader"]):
        tags.extend(["IMTIHAN", "SABIR", "KADER_VE_KAZA_HIKMETI"])

    # Detect Dua & İltica
    if any(k in content_lower for k in ["dua", "seher", "iltica", "secde"]):
        tags.append("DUA_VE_ILCA_USULU")

    # Detect Tevbe & İnabe
    if any(k in content_lower for k in ["tövbe", "tevbe", "mağfiret"]):
        tags.append("TEVBE_VE_INABE")
        nafs_traps.append("GECMISIN_PISMANLIK_GIRDABI")

    # Detect Fanilik & Ölüm Tefekkürü
    if any(k in content_lower for k in ["ölüm", "fani", "ahiret", "kabir"]):
        tags.append("FANILIK_VE_TAZIYE")
        nafs_traps.append("TUL_I_EMEL_VE_GAYETSIZLIK")

    # Detect Siyer & Sahabe
    if any(k in content_lower for k in ["siyer", "sahabe", "ashab", "sünnet", "taif", "uhud", "hendek"]):
        tags.extend(["SIYER", "ASHAB", "SIYERDE_DARLIK_DONEMLERI"])

    # Remove duplicates preserving order
    dedup_tags: List[str] = []
    for t in tags:
        if t not in dedup_tags:
            dedup_tags.append(t)

    dedup_traps: List[str] = []
    for trap in nafs_traps:
        if trap not in dedup_traps:
            dedup_traps.append(trap)

    return {
        "tags": dedup_tags,
        "nafs_traps": dedup_traps,
        "is_riba_related": has_riba,
    }


def process_audio_chunk(
    source_audio_path: str,
    chunk: Dict[str, Any],
    youtube_id: str,
    video_title: str,
    output_dir: Path,
    dry_run: bool = False,
    supabase_client: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Slices audio segment using FFmpeg libopus 32k, uploads to R2, embeds vector,
    and upserts into Supabase knowledge_chunks table.
    """
    start_sec = float(chunk["start_sec"])
    end_sec = float(chunk["end_sec"])
    chunk_text = str(chunk["text"])

    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{youtube_id}_{int(start_sec)}_{int(end_sec)}.ogg"
    local_ogg_path = output_dir / filename

    # 1. Cut audio clip via FFmpeg Opus 32k
    logger.info("Cutting clip [%.2fs - %.2fs] -> %s", start_sec, end_sec, filename)
    cut_audio_clip(source_audio_path, start_sec, end_sec, str(local_ogg_path))

    # 2. Generate 768d vector embedding
    embedding_768d = get_embedding_768d(chunk_text)
    if len(embedding_768d) != EMBEDDING_DIMENSION:
        raise ValueError(
            f"Embedding dimension mismatch: got {len(embedding_768d)}, expected {EMBEDDING_DIMENSION}"
        )

    # 3. Enrich metadata and generate deterministic UUID
    enriched = enrich_chunk_metadata(chunk_text, youtube_id, start_sec, end_sec, video_title)
    chunk_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sirdas-ai:HALIS_AYDEMIR:{youtube_id}:{start_sec:.2f}:{end_sec:.2f}"))

    r2_key = f"halis_aydemir/{filename}"

    # 4. Upload to Cloudflare R2 or simulate
    if dry_run:
        public_audio_url = f"{config.R2_PUBLIC_URL}/{r2_key}"
        upload_meta = {
            "url": public_audio_url,
            "r2_key": r2_key,
            "size_bytes": local_ogg_path.stat().st_size if local_ogg_path.exists() else 0,
        }
        logger.info("[DRY-RUN] Simulated R2 upload: %s", public_audio_url)
    else:
        logger.info("Uploading %s to R2 bucket...", r2_key)
        upload_meta = upload_audio_to_r2(str(local_ogg_path), r2_key)
        public_audio_url = str(upload_meta["url"])

    # 5. Build Supabase KnowledgeChunk record
    payload: Dict[str, Any] = {
        "id": chunk_id,
        "source_type": SOURCE_TYPE_HALIS_AYDEMIR,
        "source_title": f"Halis Aydemir - {video_title} [{int(start_sec)}s - {int(end_sec)}s]",
        "content": chunk_text,
        "tags": enriched["tags"],
        "nafs_traps": enriched["nafs_traps"],
        "is_riba_related": enriched["is_riba_related"],
        "youtube_id": youtube_id,
        "start_sec": start_sec,
        "end_sec": end_sec,
        "audio_url": public_audio_url,
        "embedding": embedding_768d,
    }

    # 6. Upsert into Supabase knowledge_chunks table
    if not dry_run and supabase_client is not None:
        try:
            supabase_client.table("knowledge_chunks").upsert(
                payload,
                on_conflict="id",
            ).execute()
            logger.info("Successfully upserted chunk %s to Supabase.", chunk_id)
        except Exception as e:
            logger.error("Failed to upsert chunk %s into Supabase: %s", chunk_id, e)
            raise
    else:
        logger.info("[DRY-RUN] Validated chunk %s (skipped Supabase DB write).", chunk_id)

    return {
        "chunk_id": chunk_id,
        "payload": payload,
        "upload_meta": upload_meta,
        "local_ogg": str(local_ogg_path),
    }


def run_youtube_pipeline(
    url: Optional[str] = None,
    audio_file: Optional[str] = None,
    dry_run: bool = False,
    mock_whisper: bool = False,
    limit: Optional[int] = None,
    output_dir: Optional[Union[str, Path]] = None,
    batch_size: int = 16,
    model_name: str = "large-v3-turbo",
    device: Optional[str] = None,
    compute_type: Optional[str] = None,
    initial_prompt: str = ISLAMIC_INITIAL_PROMPT,
) -> Dict[str, Any]:
    """
    Main orchestration function for the YouTube WhisperX audio ingestion pipeline.

    Args:
        url: YouTube URL to download and ingest.
        audio_file: Path to existing audio file (bypasses YouTube download).
        dry_run: If True, executes slicing and embedding without live R2 uploads or DB writes.
        mock_whisper: If True, uses synthetic transcription segments without loading WhisperX.
        limit: Max number of chunks to process.
        output_dir: Custom directory for temporary and output audio files.
        batch_size: Inference batch size for WhisperX.
        model_name: WhisperX model name ('large-v3-turbo').
        device: 'cuda' or 'cpu'.
        compute_type: 'float16' or 'int8'.
        initial_prompt: Theological vocabulary prompt for WhisperX.

    Returns:
        Summary dict containing execution results and processed chunks.
    """
    if not url and not audio_file:
        raise ValueError("Either --url or --audio-file must be provided.")

    target_out_dir = Path(output_dir or (PIPELINE_ROOT / "data" / "temp_audio")).resolve()
    target_out_dir.mkdir(parents=True, exist_ok=True)

    start_time = time.time()
    logger.info("=" * 60)
    logger.info("Starting YouTube WhisperX & Audio Pipeline (Milestone M5)")
    logger.info("Output Directory: %s", target_out_dir)
    logger.info("Dry Run: %s | Mock Whisper: %s", dry_run, mock_whisper)
    logger.info("=" * 60)

    # 1. Acquire source audio file
    if audio_file:
        audio_path_obj = Path(audio_file).resolve()
        if not audio_path_obj.exists():
            raise FileNotFoundError(f"Audio file does not exist: {audio_file}")
        source_audio_path = str(audio_path_obj)
        video_id = audio_path_obj.stem
        video_title = audio_path_obj.stem.replace("_", " ").title()
        logger.info("Using local audio file: %s (id: %s)", source_audio_path, video_id)
    else:
        assert url is not None
        download_info = download_youtube_audio(url, target_out_dir)
        source_audio_path = download_info["audio_path"]
        video_id = download_info["video_id"]
        video_title = download_info["title"]

    # 2. Transcribe via WhisperX
    transcription = transcribe_audio_whisperx(
        audio_path=source_audio_path,
        device=device,
        compute_type=compute_type,
        batch_size=batch_size,
        model_name=model_name,
        initial_prompt=initial_prompt,
        mock_whisper=mock_whisper,
    )
    raw_segments = transcription["segments"]
    logger.info("Obtained %d raw transcription segments.", len(raw_segments))

    # 3. Overlapping Sliding Window Chunking (90-120s with 15-20% overlap)
    chunks = chunk_segments_sliding_window(
        raw_segments,
        target_duration_sec=DEFAULT_TARGET_DURATION_SEC,
        min_duration_sec=DEFAULT_MIN_DURATION_SEC,
        max_duration_sec=DEFAULT_MAX_DURATION_SEC,
        overlap_pct=DEFAULT_OVERLAP_PCT,
    )
    logger.info("Formed %d overlapping sliding window chunks.", len(chunks))

    if limit and limit > 0:
        chunks = chunks[:limit]
        logger.info("Limited processing to first %d chunks.", limit)

    # 4. Initialize Supabase client if live mode
    supabase_client = None
    if not dry_run:
        supabase_client = config.get_supabase_client()
        logger.info("Connected to Supabase at: %s", config.SUPABASE_URL)

    # 5. Slicing, Embedding, R2 Storage, and Database Ingestion
    processed_records: List[Dict[str, Any]] = []
    for idx, chunk in enumerate(chunks, start=1):
        logger.info("Processing chunk %d of %d [%.2fs - %.2fs]...", idx, len(chunks), chunk["start_sec"], chunk["end_sec"])
        res = process_audio_chunk(
            source_audio_path=source_audio_path,
            chunk=chunk,
            youtube_id=video_id,
            video_title=video_title,
            output_dir=target_out_dir,
            dry_run=dry_run,
            supabase_client=supabase_client,
        )
        processed_records.append(res)

    elapsed_time = time.time() - start_time
    logger.info("=" * 60)
    logger.info("YouTube Pipeline Finished in %.2f seconds", elapsed_time)
    logger.info("Video ID:           %s", video_id)
    logger.info("Video Title:        %s", video_title)
    logger.info("Chunks Processed:   %d", len(processed_records))
    logger.info("Dry-Run Simulated:  %s", dry_run)
    logger.info("=" * 60)

    return {
        "video_id": video_id,
        "title": video_title,
        "source_audio": source_audio_path,
        "total_chunks": len(chunks),
        "processed_chunks": len(processed_records),
        "dry_run": dry_run,
        "mock_whisper": mock_whisper,
        "elapsed_seconds": round(elapsed_time, 2),
        "chunks": [r["payload"] for r in processed_records],
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sırdaş AI YouTube WhisperX & Audio Chunking Pipeline (Milestone M5)"
    )
    parser.add_argument("--url", type=str, default=None, help="YouTube video URL to download and process.")
    parser.add_argument("--audio-file", type=str, default=None, help="Local audio file path (bypasses YouTube download).")
    parser.add_argument("--dry-run", action="store_true", help="Execute slicing and embeddings without live R2/DB writes.")
    parser.add_argument("--mock-whisper", action="store_true", help="Use synthetic mock transcription for offline testing.")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of chunks to process.")
    parser.add_argument("--output-dir", type=str, default=None, help="Custom output directory for audio files.")
    parser.add_argument("--batch-size", type=int, default=16, help="WhisperX batch size (default: 16).")
    parser.add_argument("--model", type=str, default="large-v3-turbo", help="WhisperX model name (default: large-v3-turbo).")
    parser.add_argument("--device", type=str, default=None, help="Inference device ('cuda' or 'cpu').")
    parser.add_argument("--compute-type", type=str, default=None, help="Compute type ('float16' or 'int8').")
    parser.add_argument(
        "--initial-prompt",
        type=str,
        default=ISLAMIC_INITIAL_PROMPT,
        help="Islamic initial prompt for WhisperX transcription.",
    )

    args = parser.parse_args()

    if not args.url and not args.audio_file:
        parser.error("You must specify either --url or --audio-file.")

    try:
        summary = run_youtube_pipeline(
            url=args.url,
            audio_file=args.audio_file,
            dry_run=args.dry_run,
            mock_whisper=args.mock_whisper,
            limit=args.limit,
            output_dir=args.output_dir,
            batch_size=args.batch_size,
            model_name=args.model,
            device=args.device,
            compute_type=args.compute_type,
            initial_prompt=args.initial_prompt,
        )
        print("\nPipeline Summary:")
        # Print summary without large embedding vectors for readability
        clean_summary = dict(summary)
        clean_summary["chunks"] = [
            {k: v for k, v in c.items() if k != "embedding"}
            for c in clean_summary.get("chunks", [])
        ]
        print(json.dumps(clean_summary, indent=2, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        logger.exception("Pipeline terminated with fatal error: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
