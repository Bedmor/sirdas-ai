"""
Sırdaş AI - Phase 2 Audio Cutter Module
Provides high-fidelity temporal audio segmenting using FFmpeg with WhatsApp PTT compliant
libopus 32k VBR encoding in Ogg container format.
"""

import json
import logging
import os
from pathlib import Path
import subprocess
from typing import Any, Dict, Optional

logger = logging.getLogger("sirdas.audio_cutter")


def validate_audio_file(file_path: str) -> Dict[str, Any]:
    """
    Validates that the file exists, has non-zero size, and is a valid Ogg Opus audio file.
    Uses ffprobe to inspect container format and audio stream codec.
    """
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"Audio file does not exist: {file_path}")
    if not p.is_file():
        raise ValueError(f"Path is not a regular file: {file_path}")

    file_size = p.stat().st_size
    if file_size == 0:
        raise ValueError(f"Audio file is empty (0 bytes): {file_path}")

    cmd = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,channels,sample_rate:format=format_name,duration",
        "-of", "json",
        str(p),
    ]

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        probe_data = json.loads(proc.stdout)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"ffprobe failed on {file_path}: {e.stderr}") from e
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse ffprobe output for {file_path}: {e}") from e

    streams = probe_data.get("streams", [])
    if not streams:
        raise ValueError(f"No audio streams found in {file_path}")

    codec_name = streams[0].get("codec_name", "").lower()
    format_name = probe_data.get("format", {}).get("format_name", "").lower()
    duration_str = probe_data.get("format", {}).get("duration")
    duration = float(duration_str) if duration_str is not None else 0.0

    if codec_name != "opus":
        raise ValueError(f"Expected audio codec 'opus', but found '{codec_name}' in {file_path}")

    if "ogg" not in format_name:
        raise ValueError(f"Expected container format 'ogg', but found '{format_name}' in {file_path}")

    return {
        "valid": True,
        "codec": codec_name,
        "format": format_name,
        "duration": duration,
        "size_bytes": file_size,
        "sample_rate": streams[0].get("sample_rate"),
        "channels": streams[0].get("channels"),
    }


def get_audio_duration(file_path: str) -> float:
    """
    Returns the total duration in seconds of an audio file using ffprobe.
    """
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path),
    ]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(proc.stdout.strip())
    except Exception as e:
        raise RuntimeError(f"Failed to determine audio duration for {file_path}: {e}") from e


def cut_audio_clip(
    source_audio_path: str,
    start_sec: float,
    end_sec: float,
    output_path: str,
) -> str:
    """
    Cuts an audio clip from source_audio_path between start_sec and end_sec,
    encoding it into WhatsApp-compatible .ogg libopus format.

    Exact FFmpeg Parameters Enforced:
      -c:a libopus -b:a 32k -vbr on -application voip

    Args:
        source_audio_path: Absolute or relative path to input audio file.
        start_sec: Timestamp in seconds to begin segment.
        end_sec: Timestamp in seconds to end segment.
        output_path: Destination path ending with .ogg.

    Returns:
        The validated output_path string.
    """
    src = Path(source_audio_path).resolve()
    if not src.exists():
        raise FileNotFoundError(f"Source audio file not found: {source_audio_path}")

    if start_sec < 0:
        raise ValueError(f"start_sec must be non-negative: {start_sec}")

    if end_sec <= start_sec:
        raise ValueError(
            f"end_sec ({end_sec}) must be greater than start_sec ({start_sec}). Duration: {end_sec - start_sec}"
        )

    out = Path(output_path).resolve()
    if out.suffix.lower() != ".ogg":
        raise ValueError(f"output_path must have '.ogg' extension: {output_path}")

    out.parent.mkdir(parents=True, exist_ok=True)
    duration = end_sec - start_sec

    # Invokes FFmpeg with exact required parameters
    cmd = [
        "ffmpeg",
        "-y",  # Overwrite existing output
        "-ss", f"{start_sec:.3f}",
        "-i", str(src),
        "-t", f"{duration:.3f}",
        "-c:a", "libopus",
        "-b:a", "32k",
        "-vbr", "on",
        "-application", "voip",
        str(out),
    ]

    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(
            f"FFmpeg failed while cutting clip [{start_sec:.2f}s - {end_sec:.2f}s] from {src}: {e.stderr}"
        ) from e

    # Validation check verifying output exists, has size > 0, and is valid ogg libopus audio
    validate_audio_file(str(out))
    logger.info(
        "Successfully cut audio clip: %s [%.2fs - %.2fs] -> %s (size: %d bytes)",
        src.name,
        start_sec,
        end_sec,
        out.name,
        out.stat().st_size,
    )
    return str(out)


# Alias for compatibility with survey recommendations
cut_audio_to_ogg = cut_audio_clip
